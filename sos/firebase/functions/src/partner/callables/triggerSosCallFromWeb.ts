import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import {
  PARTNER_ENGINE_URL_SECRET,
  PARTNER_ENGINE_API_KEY_SECRET,
  getPartnerEngineUrl,
  getPartnerEngineApiKey,
} from '../../lib/secrets';

/**
 * SOS-Call web trigger callable (called from sos-call.sos-expat.com Blade page).
 *
 * Flow:
 *   1. Validate sosCallSessionToken via Partner Engine /api/sos-call/check-session
 *   2. Auto-select first available provider of the requested type + matching language
 *   3. Create a call_sessions document with isSosCallFree=true (bypass Stripe)
 *   4. Enqueue the Cloud Task for 240s delayed call
 *   5. Return { callSessionId, estimatedCallAt } to the client
 *
 * No Stripe, no payment, no provider selection UX needed.
 * The Blade page just waits 240s and the call rings.
 */
interface TriggerSosCallRequest {
  sosCallSessionToken: string;
  providerType: 'lawyer' | 'expat';
  clientPhone: string;
  clientLanguage?: string;
}

interface CheckSessionResponse {
  valid: boolean;
  subscriber_id?: number;
  partner_firebase_id?: string;
  agreement_id?: number;
  client_first_name?: string;
  error?: string;
}

export const triggerSosCallFromWeb = onCall(
  {
    region: 'us-central1',
    secrets: [PARTNER_ENGINE_URL_SECRET, PARTNER_ENGINE_API_KEY_SECRET],
    cors: true,
  },
  async (request: CallableRequest<TriggerSosCallRequest>) => {
    const { sosCallSessionToken, providerType, clientPhone, clientLanguage } = request.data || ({} as TriggerSosCallRequest);

    if (!sosCallSessionToken || !providerType || !clientPhone) {
      throw new HttpsError(
        'invalid-argument',
        'sosCallSessionToken, providerType and clientPhone are required'
      );
    }

    if (!['lawyer', 'expat'].includes(providerType)) {
      throw new HttpsError('invalid-argument', 'providerType must be "lawyer" or "expat"');
    }

    // 1. Validate session with Partner Engine
    let sessionData: CheckSessionResponse;
    try {
      const response = await fetch(`${getPartnerEngineUrl()}/api/sos-call/check-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Engine-Secret': getPartnerEngineApiKey(),
        },
        body: JSON.stringify({
          session_token: sosCallSessionToken,
          call_type: providerType,
        }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new HttpsError('unauthenticated', `Session invalide (status ${response.status})`);
      }

      sessionData = (await response.json()) as CheckSessionResponse;

      if (!sessionData.valid) {
        throw new HttpsError('unauthenticated', sessionData.error || 'Session invalide');
      }
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      logger.error('[triggerSosCallFromWeb] Partner Engine check-session failed', { error: err });
      throw new HttpsError('internal', 'Impossible de valider la session SOS-Call');
    }

    const db = admin.firestore();

    // 2. Auto-select first available provider of the requested type
    // Filter: type matches, isApproved=true, isVisible=true, not busy, supports language if provided
    const profilesQuery = db
      .collection('sos_profiles')
      .where('type', '==', providerType)
      .where('isApproved', '==', true)
      .where('isVisible', '==', true)
      .limit(50);

    const profilesSnap = await profilesQuery.get();

    if (profilesSnap.empty) {
      throw new HttpsError('failed-precondition', `Aucun ${providerType === 'lawyer' ? 'avocat' : 'expert'} disponible actuellement`);
    }

    // Filter for available (not busy) + language match
    const requestedLang = (clientLanguage || 'fr').toLowerCase();
    let candidate: FirebaseFirestore.QueryDocumentSnapshot | null = null;

    for (const doc of profilesSnap.docs) {
      const data = doc.data();
      const isBusy = data.isBusy === true || data.busyReason;
      if (isBusy) continue;

      const langs = Array.isArray(data.languages) ? data.languages.map((l: string) => l.toLowerCase()) : [];
      const langMatch = langs.length === 0 || langs.includes(requestedLang) || langs.includes('fr') || langs.includes('en');

      if (langMatch) {
        candidate = doc;
        break;
      }
    }

    // Fallback: if no language match, pick the first available (ignore language)
    if (!candidate) {
      for (const doc of profilesSnap.docs) {
        const data = doc.data();
        if (!(data.isBusy === true || data.busyReason)) {
          candidate = doc;
          break;
        }
      }
    }

    if (!candidate) {
      throw new HttpsError('failed-precondition', 'Aucun prestataire disponible immédiatement. Réessayez dans quelques minutes.');
    }

    const providerData = candidate.data();
    const providerId = candidate.id;
    const providerPhone = providerData.phone || providerData.phoneNumber;

    if (!providerPhone) {
      logger.error('[triggerSosCallFromWeb] Selected provider has no phone', { providerId });
      throw new HttpsError('failed-precondition', 'Prestataire sélectionné indisponible');
    }

    // 3. Create call_sessions document
    const callSessionRef = db.collection('call_sessions').doc();
    const now = admin.firestore.Timestamp.now();
    const scheduledAt = admin.firestore.Timestamp.fromMillis(Date.now() + 240 * 1000);

    await callSessionRef.set({
      id: callSessionRef.id,
      providerId,
      clientId: `subscriber:${sessionData.subscriber_id}`,
      providerPhone,
      clientPhone,
      providerType,
      serviceType: providerType === 'lawyer' ? 'lawyer_call' : 'expat_call',
      status: 'scheduled',
      isSosCallFree: true,
      partnerSubscriberId: sessionData.subscriber_id,
      partnerFirebaseId: sessionData.partner_firebase_id,
      agreementId: sessionData.agreement_id,
      createdAt: now,
      scheduledFor: scheduledAt,
      delaySeconds: 240,
      clientLanguages: clientLanguage ? [clientLanguage] : ['fr'],
      providerLanguages: providerData.languages || [],
      amount: 0,
      currency: 'EUR',
      metadata: {
        isSosCallFree: true,
        sosCallSessionToken,
        triggeredFromWeb: true,
      },
    });

    logger.info('[triggerSosCallFromWeb] Call scheduled', {
      callSessionId: callSessionRef.id,
      providerId,
      subscriberId: sessionData.subscriber_id,
    });

    // 4. Log the call back to Partner Engine (non-blocking)
    fetch(`${getPartnerEngineUrl()}/api/sos-call/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Engine-Secret': getPartnerEngineApiKey(),
      },
      body: JSON.stringify({
        session_token: sosCallSessionToken,
        call_session_id: callSessionRef.id,
        call_type: providerType,
        duration_seconds: 0,
      }),
    }).catch((err) => logger.warn('[triggerSosCallFromWeb] /sos-call/log failed (non-blocking)', { err: err?.message }));

    // 5. Return callSessionId + countdown info to the Blade page
    return {
      success: true,
      callSessionId: callSessionRef.id,
      providerType,
      delaySeconds: 240,
      scheduledFor: scheduledAt.toMillis(),
      estimatedCallAt: scheduledAt.toMillis(),
      message: 'Un prestataire va vous appeler dans moins de 5 minutes.',
    };
  }
);
