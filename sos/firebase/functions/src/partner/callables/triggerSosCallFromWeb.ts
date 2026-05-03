import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import {
  PARTNER_ENGINE_URL_SECRET,
  PARTNER_ENGINE_API_KEY_SECRET,
  ENCRYPTION_KEY,
  OUTIL_SYNC_API_KEY,
  getPartnerEngineUrl,
  getPartnerEngineApiKey,
} from '../../lib/secrets';
import { scheduleCallTaskWithIdempotence } from '../../lib/tasks';
import { partnerConfig } from '../../lib/functionConfigs';
import { decryptPhoneNumber } from '../../utils/encryption';
import { getCountryName } from '../../utils/countryUtils';
import { getB2BProviderAmount } from '../../services/pricingService';
import { syncCallSessionToOutil } from '../../notifications/paymentNotifications';

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
   * Currency the client picked (or that was detected for them) on the SPA.
   * When provided, this is the source of truth — the backend uses it as-is.
   * When absent, falls back to deriving from clientCountry (USD-zone or EUR).
   * Mirrors the existing detectUserCurrency() flow in the direct booking,
   * so a client who picked USD on /sos-appel keeps USD on B2B too.
   */
  clientCurrency?: 'eur' | 'usd';
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
  /**
   * Optional: partner display name (e.g. "BNP Paribas", "AXA Assistance").
   * When the Partner Engine /check-session endpoint returns it, we surface
   * it in the provider SMS so the provider knows which partner sent the
   * client. Falls back to a generic "Partenaire" label when missing.
   */
  partner_name?: string;
  error?: string;
}

/**
 * USD-zone country list. Any country NOT in this set falls back to EUR.
 * Kept short and conservative — the goal is just to credit the provider
 * in the right currency when a US/CAD/etc client uses a B2B partner code.
 */
const USD_ZONE_COUNTRIES = new Set([
  'US', 'CA', 'AU', 'NZ', 'SG', 'HK', 'PH',
  'AE', 'IL', 'BR', 'MX', 'AR', 'CL', 'CO', 'PE',
]);

function deriveCurrencyFromCountry(country?: string): 'eur' | 'usd' {
  if (!country) return 'eur';
  return USD_ZONE_COUNTRIES.has(country.toUpperCase()) ? 'usd' : 'eur';
}

/**
 * Map of ISO 639-1 codes to native language names — same set as the standard
 * createAndScheduleCallFunction so the provider SMS reads the same regardless
 * of whether the call came from the B2C SPA or the B2B Blade page.
 */
const LANGUAGE_NAMES: Record<string, string> = {
  fr: 'Français', en: 'English', es: 'Español', de: 'Deutsch', pt: 'Português',
  ru: 'Русский', ar: 'العربية', hi: 'हिन्दी', ch: '中文', zh: '中文',
  it: 'Italiano', nl: 'Nederlands', pl: 'Polski', tr: 'Türkçe', ja: '日本語', ko: '한국어',
};

function formatLanguages(languages: string[]): string {
  if (!languages || languages.length === 0) return 'Non spécifié';
  return languages
    .map((code) => LANGUAGE_NAMES[code.toLowerCase()] || code.toUpperCase())
    .join(', ');
}

/**
 * Locales supported by the message_templates JSON files. Used to resolve a
 * provider's preferred SMS locale and fall back to English if their language
 * is not (yet) translated.
 */
export const SUPPORTED_LOCALES = new Set(['fr', 'en', 'es', 'de', 'pt', 'ru', 'ar', 'hi', 'ch']);

/**
 * Resolve the locale to use for the provider notification (SMS/email/inapp).
 * Tries preferredLanguage / language / languages[0] in order. Normalises
 * 'zh' → 'ch' (legacy alias). Falls back to 'en' if none is supported.
 *
 * Exported for unit testing.
 */
export function resolveProviderLocale(providerData: FirebaseFirestore.DocumentData | undefined): string {
  if (!providerData) return 'en';
  const candidates: unknown[] = [
    providerData.preferredLanguage,
    providerData.language,
    Array.isArray(providerData.languages) ? providerData.languages[0] : null,
  ];
  for (const c of candidates) {
    if (typeof c !== 'string' || !c) continue;
    const lc = c.toLowerCase();
    const normalised = lc === 'zh' ? 'ch' : lc;
    if (SUPPORTED_LOCALES.has(normalised)) return normalised;
  }
  return 'en';
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
  clientCountry?: string;
  clientCurrency?: 'eur' | 'usd';
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
    clientCountry,
    clientCurrency,
    sessionData,
    sosCallSessionToken,
  } = args;

  const now = admin.firestore.Timestamp.now();
  const scheduledAt = admin.firestore.Timestamp.fromMillis(Date.now() + 240 * 1000);

  // Currency precedence:
  //   1. Frontend-passed clientCurrency (matches what the user picked or
  //      what detectUserCurrency() resolved on the SPA — single source of truth)
  //   2. Fallback: derive from clientCountry (USD-zone whitelist) for legacy
  //      callers and the standalone Blade page that doesn't run the SPA hook
  //   3. Final fallback inside deriveCurrencyFromCountry: 'eur'
  //
  // P1-5 FIX 2026-04-25: log a structured warning whenever clientCurrency is
  // missing so we can quantify the incidence in production. Once the SPA is
  // reliably passing it from every entry point, this can be promoted to a
  // throw HttpsError('invalid-argument') for stricter contract enforcement.
  if (!clientCurrency) {
    logger.warn("[triggerSosCallFromWeb] clientCurrency missing — derived from country", {
      clientCountry: clientCountry || null,
      derivedCurrency: deriveCurrencyFromCountry(clientCountry),
      sosCallSessionToken: sosCallSessionToken ? "present" : "missing",
    });
  }
  const callCurrency: 'eur' | 'usd' = clientCurrency || deriveCurrencyFromCountry(clientCountry);

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
    currency: callCurrency,
    payment: {
      currency: callCurrency,
    },
    metadata: {
      isSosCallFree: true,
      sosCallSessionToken,
      triggeredFromWeb: true,
      clientCountry: clientCountry || null,
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

  // Provider notification (booking_paid_provider) — same SMS template as the
  // standard B2C flow so the provider can prepare for the call. The B2B path
  // previously skipped this, leaving providers in the dark on SOS-Call calls.
  // Non-blocking: a failure here MUST NOT break the call scheduling.
  try {
    const serviceType = providerType === 'lawyer' ? 'lawyer_call' : 'expat_call';
    const providerEmail = providerData.email || null;
    let decryptedProviderPhone = providerPhone;
    if (typeof providerPhone === 'string' && providerPhone.startsWith('enc:')) {
      try {
        decryptedProviderPhone = decryptPhoneNumber(providerPhone);
      } catch (e) {
        logger.warn('[triggerSosCallFromWeb] provider phone decrypt failed', {
          err: e instanceof Error ? e.message : String(e),
        });
      }
    }

    const language = clientLanguage || 'fr';
    // Provider receives the SMS in their OWN language (with English fallback when
    // their preferred language is not in the supported set). The client language
    // stays available below as `clientLanguagesFormatted` so the provider still
    // sees which language the client speaks in the message body.
    const providerLocale = resolveProviderLocale(providerData);
    const clientFirstName = sessionData.client_first_name || 'Client';
    const rawInterventionCountry = clientCountry || providerData.country || 'N/A';
    const interventionCountry = getCountryName(rawInterventionCountry) || rawInterventionCountry;
    const partnerLabel = sessionData.partner_name || 'Partenaire';
    const baseTitle = providerType === 'lawyer' ? 'Consultation avocat' : 'Consultation expat';
    const title = `[B2B] ${baseTitle}`;
    const description = `Appel pris en charge par ${partnerLabel} (forfait B2B mensuel — le client ne paie rien).`;
    const clientLanguagesFormatted = formatLanguages([language]);
    const providerAmount = await getB2BProviderAmount(
      serviceType as 'lawyer' | 'expat',
      callCurrency
    );
    const currencySymbol = callCurrency === 'usd' ? '$' : '€';

    if (providerId) {
      await db.collection('message_events').add({
        eventId: 'booking_paid_provider',
        locale: providerLocale,
        to: {
          uid: providerId,
          email: providerEmail,
          phone: decryptedProviderPhone || null,
        },
        context: {
          callSessionId: callSessionRef.id,
          client: {
            firstName: clientFirstName,
            name: clientFirstName,
            nationality: 'N/A',
          },
          request: {
            country: interventionCountry,
            title,
            description,
          },
          booking: {
            amount: providerAmount,
            currency: callCurrency.toUpperCase(),
          },
          earnings: {
            amount: providerAmount,
            symbol: currencySymbol,
            formatted: `${providerAmount}${currencySymbol}`,
          },
          clientName: clientFirstName,
          clientCountry: interventionCountry,
          clientLanguage: language,
          clientLanguages: [language],
          clientLanguagesFormatted,
          providerEarnings: providerAmount,
          currencySymbol,
          title,
          description,
          scheduledTime: scheduledAt.toDate().toISOString(),
          isSosCallFree: true,
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      logger.info('[triggerSosCallFromWeb] Provider notification created', {
        callSessionId: callSessionRef.id,
        providerId,
      });
    }
  } catch (notifErr) {
    logger.error('[triggerSosCallFromWeb] Provider notification failed (non-blocking)', {
      callSessionId: callSessionRef.id,
      err: notifErr instanceof Error ? notifErr.message : String(notifErr),
    });
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

  // Non-blocking sync to Outil IA so the provider gets the same AI pre-analysis
  // as a B2C booking. The B2B flow bypasses Stripe (no webhook → no automatic
  // syncCallSessionToOutil call), so we wire it directly here. Failures must
  // NOT break the call scheduling.
  try {
    const debugId = `b2b_${callSessionRef.id.slice(0, 8)}_${Date.now().toString(36)}`;
    const baseTitle = providerType === 'lawyer' ? 'Consultation avocat' : 'Consultation expat';
    const partnerLabel = sessionData.partner_name || 'Partenaire';
    const csForOutilSync: FirebaseFirestore.DocumentData = {
      // Client info — B2B clients only have first name + phone (no last name / email)
      clientFirstName: sessionData.client_first_name || 'Client',
      clientName: sessionData.client_first_name || 'Client',
      clientPhone,
      clientCurrentCountry: clientCountry || null,
      clientLanguages: clientLanguage ? [clientLanguage] : ['fr'],
      // Request details
      title: `[B2B] ${baseTitle}`,
      description: `Appel pris en charge par ${partnerLabel} (forfait B2B mensuel — le client ne paie rien).`,
      serviceType: providerType === 'lawyer' ? 'lawyer_call' : 'expat_call',
      // Provider info
      providerId,
      providerType,
      providerName:
        `${providerData.firstName || ''} ${providerData.lastName || ''}`.trim() ||
        providerData.name ||
        null,
      providerCountry: providerData.country || null,
      // Timing
      scheduledAt: admin.firestore.Timestamp.fromMillis(Date.now() + 240 * 1000),
      // No payment — B2B is partner-funded
      payment: { amount: 0 },
    };
    // Fire-and-forget so a slow Outil response never blocks the SMS / Cloud Task.
    syncCallSessionToOutil(callSessionRef.id, csForOutilSync, debugId, {
      source: 'sos-call-b2b-partner',
      metadata: {
        isSosCallFree: true,
        partnerId: sessionData.partner_firebase_id || null,
        partnerName: sessionData.partner_name || null,
        agreementId: sessionData.agreement_id || null,
        subscriberId: sessionData.subscriber_id || null,
        sosCallSessionToken,
        triggeredFromWeb: true,
      },
    }).catch((err) =>
      logger.warn('[triggerSosCallFromWeb] Outil sync failed (non-blocking)', {
        callSessionId: callSessionRef.id,
        err: err instanceof Error ? err.message : String(err),
      })
    );
  } catch (syncErr) {
    logger.warn('[triggerSosCallFromWeb] Outil sync setup failed (non-blocking)', {
      callSessionId: callSessionRef.id,
      err: syncErr instanceof Error ? syncErr.message : String(syncErr),
    });
  }

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
    secrets: [PARTNER_ENGINE_URL_SECRET, PARTNER_ENGINE_API_KEY_SECRET, ENCRYPTION_KEY, OUTIL_SYNC_API_KEY],
    timeoutSeconds: 30,
  },
  async (request: CallableRequest<TriggerSosCallRequest>) => {
    const { sosCallSessionToken, providerType, clientPhone, clientLanguage, clientCountry, clientCurrency, providerId: requestedProviderId } = request.data || ({} as TriggerSosCallRequest);

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
        clientCountry,
        clientCurrency,
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
      clientCountry,
      clientCurrency,
      sessionData,
      sosCallSessionToken,
    });
  }
);
