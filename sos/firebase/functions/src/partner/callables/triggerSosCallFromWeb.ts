import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import {
  PARTNER_ENGINE_URL_SECRET,
  PARTNER_ENGINE_API_KEY_SECRET,
  getPartnerEngineUrl,
  getPartnerEngineApiKey,
} from '../../lib/secrets';
import { scheduleCallTaskWithIdempotence } from '../../lib/tasks';
import { partnerConfig } from '../../lib/functionConfigs';

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
  clientCountry?: string; // ISO-2 of the country where client is located
  /**
   * Optional explicit provider id chosen by the client in the SPA wizard.
   * When provided, the backend verifies it (approved, visible, not busy,
   * right type) and uses it directly. When absent, the auto-select scoring
   * runs (used by the legacy direct-Blade flow).
   */
  providerId?: string;
}

interface CheckSessionResponse {
  valid: boolean;
  subscriber_id?: number;
  partner_firebase_id?: string;
  agreement_id?: number;
  client_first_name?: string;
  error?: string;
}

/**
 * Common tail of the flow, shared between the explicit-providerId path
 * (unified SPA wizard) and the auto-select path (legacy direct-Blade).
 *
 * Creates the call_sessions doc, enqueues the Cloud Task (critical — without
 * it, nothing ever rings), logs back to Partner Engine, and returns the
 * payload the Blade/SPA will use to show the countdown.
 */
async function finalizeCall(args: {
  db: FirebaseFirestore.Firestore;
  callSessionRef: FirebaseFirestore.DocumentReference;
  providerId: string;
  providerData: FirebaseFirestore.DocumentData;
  providerPhone: string;
  providerType: 'lawyer' | 'expat';
  clientPhone: string;
  clientLanguage?: string;
  sessionData: CheckSessionResponse;
  sosCallSessionToken: string;
}) {
  const {
    db,
    callSessionRef,
    providerId,
    providerData,
    providerPhone,
    providerType,
    clientPhone,
    clientLanguage,
    sessionData,
    sosCallSessionToken,
  } = args;

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

  logger.info('[triggerSosCallFromWeb] Call session created', {
    callSessionId: callSessionRef.id,
    providerId,
    subscriberId: sessionData.subscriber_id,
  });

  try {
    const schedulingResult = await scheduleCallTaskWithIdempotence(
      callSessionRef.id,
      240,
      db
    );
    if (schedulingResult.skipped) {
      logger.warn('[triggerSosCallFromWeb] Scheduling skipped (idempotence)', {
        callSessionId: callSessionRef.id,
        reason: schedulingResult.reason,
      });
    } else {
      logger.info('[triggerSosCallFromWeb] Cloud Task enqueued', {
        callSessionId: callSessionRef.id,
        taskId: schedulingResult.taskId,
      });
    }
  } catch (scheduleErr) {
    logger.error('[triggerSosCallFromWeb] Failed to enqueue Cloud Task', {
      callSessionId: callSessionRef.id,
      error: scheduleErr instanceof Error ? scheduleErr.message : String(scheduleErr),
    });
    await callSessionRef.update({
      status: 'failed',
      failureReason: 'scheduling_failed',
    });
    throw new HttpsError(
      'internal',
      "Impossible de planifier l'appel. Veuillez réessayer dans quelques instants."
    );
  }

  // Non-blocking log-back to Partner Engine
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
  }).catch((err) =>
    logger.warn('[triggerSosCallFromWeb] /sos-call/log failed (non-blocking)', {
      err: err?.message,
    })
  );

  return {
    success: true,
    callSessionId: callSessionRef.id,
    providerType,
    delaySeconds: 240,
    scheduledFor: scheduledAt.toMillis(),
    estimatedCallAt: scheduledAt.toMillis(),
    providerDisplayName:
      `${providerData.firstName || ''} ${providerData.lastName || ''}`.trim() || undefined,
    message: 'Un prestataire va vous appeler dans moins de 5 minutes.',
  };
}

export const triggerSosCallFromWeb = onCall(
  {
    ...partnerConfig,
    secrets: [PARTNER_ENGINE_URL_SECRET, PARTNER_ENGINE_API_KEY_SECRET],
    timeoutSeconds: 30,
  },
  async (request: CallableRequest<TriggerSosCallRequest>) => {
    const { sosCallSessionToken, providerType, clientPhone, clientLanguage, clientCountry, providerId: requestedProviderId } = request.data || ({} as TriggerSosCallRequest);

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

    // 2a. Fast path: if the client already chose a specific provider in the
    // SPA wizard (unified flow), verify and use that one.
    if (requestedProviderId && typeof requestedProviderId === 'string') {
      const doc = await db.collection('sos_profiles').doc(requestedProviderId).get();
      if (!doc.exists) {
        throw new HttpsError('not-found', 'Prestataire introuvable. Veuillez en choisir un autre.');
      }
      const d = doc.data() || {};
      if (d.type !== providerType) {
        throw new HttpsError(
          'invalid-argument',
          `Le prestataire sélectionné n'est pas un ${providerType === 'lawyer' ? 'avocat' : 'expert'}.`
        );
      }
      if (d.isApproved !== true || d.isVisible !== true) {
        throw new HttpsError('failed-precondition', 'Ce prestataire n\'est plus disponible.');
      }
      if (d.isBusy === true || d.busyReason) {
        throw new HttpsError(
          'failed-precondition',
          'Ce prestataire est occupé. Veuillez en choisir un autre.'
        );
      }
      const phone = d.phone || d.phoneNumber;
      if (!phone) {
        throw new HttpsError('failed-precondition', 'Ce prestataire est injoignable. Veuillez en choisir un autre.');
      }

      // Short-circuit: skip the scoring pool, use this provider directly.
      const providerData = d;
      const providerId = doc.id;
      const providerPhone = phone;

      logger.info('[triggerSosCallFromWeb] Using client-chosen provider', { providerId });

      return await finalizeCall({
        db,
        callSessionRef: db.collection('call_sessions').doc(),
        providerId,
        providerData,
        providerPhone,
        providerType,
        clientPhone,
        clientLanguage,
        sessionData,
        sosCallSessionToken,
      });
    }

    // 2b. Auto-select pool: over-fetch and score client-side to allow language
    // + country match without a composite index for every combination.
    const profilesSnap = await db
      .collection('sos_profiles')
      .where('type', '==', providerType)
      .where('isApproved', '==', true)
      .where('isVisible', '==', true)
      .limit(100)
      .get();

    if (profilesSnap.empty) {
      throw new HttpsError(
        'failed-precondition',
        `Aucun ${providerType === 'lawyer' ? 'avocat' : 'expert'} disponible actuellement`
      );
    }

    const requestedLang = (clientLanguage || 'fr').toLowerCase();
    const requestedCountry = (clientCountry || '').toUpperCase();

    // Score each available provider, higher = better match.
    type Candidate = {
      doc: FirebaseFirestore.QueryDocumentSnapshot;
      score: number;
    };
    const pool: Candidate[] = [];

    for (const doc of profilesSnap.docs) {
      const d = doc.data();

      // Reject busy / offline / no phone
      if (d.isBusy === true || d.busyReason) continue;
      const phone = d.phone || d.phoneNumber;
      if (!phone) continue;

      let score = 0;
      // Country match (strongest signal — local knowledge)
      const providerCountry = (d.currentCountryCode || d.country || '').toUpperCase();
      if (requestedCountry && providerCountry === requestedCountry) score += 100;

      // Language match
      const langs: string[] = Array.isArray(d.languages)
        ? d.languages.map((l: string) => String(l).toLowerCase())
        : [];
      if (langs.includes(requestedLang)) score += 50;
      else if (langs.includes('en')) score += 10; // fallback English

      // Rating bonus (0 to 20)
      const rating = typeof d.rating === 'number' ? d.rating : 0;
      score += Math.min(20, rating * 4);

      // Activity bonus: fewer active calls recently = more available
      const calls = typeof d.totalCallsLast30d === 'number' ? d.totalCallsLast30d : 0;
      score += Math.max(0, 10 - Math.min(10, calls / 5));

      // Tiny random jitter so equal scores rotate instead of always picking the same doc
      score += Math.random();

      pool.push({ doc, score });
    }

    if (pool.length === 0) {
      throw new HttpsError(
        'failed-precondition',
        'Aucun prestataire disponible immédiatement. Réessayez dans quelques minutes.'
      );
    }

    pool.sort((a, b) => b.score - a.score);
    const chosen = pool[0].doc;
    const providerData = chosen.data();
    const providerId = chosen.id;
    const providerPhone = providerData.phone || providerData.phoneNumber;

    logger.info('[triggerSosCallFromWeb] Provider selected (auto)', {
      providerId,
      poolSize: pool.length,
      topScore: pool[0].score.toFixed(2),
      providerCountry: providerData.currentCountryCode || providerData.country,
      requestedCountry,
      requestedLang,
    });

    return await finalizeCall({
      db,
      callSessionRef: db.collection('call_sessions').doc(),
      providerId,
      providerData,
      providerPhone,
      providerType,
      clientPhone,
      clientLanguage,
      sessionData,
      sosCallSessionToken,
    });
  }
);
