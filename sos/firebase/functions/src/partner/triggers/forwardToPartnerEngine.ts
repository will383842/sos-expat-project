/**
 * Partner Engine Integration Triggers
 *
 * 1. handlePartnerSubscriberRegistered — Forwards user registration to Partner Engine
 *    when a new user has a partnerInviteToken (subscriber invited by a partner).
 *
 * 2. forwardCallToPartnerEngine — Forwards call-completed events to Partner Engine
 *    when the calling client is a partner subscriber.
 *
 * These handlers are called from consolidated triggers, not deployed as standalone.
 */

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";

// Secrets
export const PARTNER_ENGINE_URL_SECRET = defineSecret("PARTNER_ENGINE_URL");
export const PARTNER_ENGINE_API_KEY_SECRET = defineSecret("PARTNER_ENGINE_API_KEY");

// ============================================================================
// HELPER: Call Partner Engine API
// ============================================================================

/**
 * Result of a Partner Engine API call.
 * AUDIT FIX 2026-05-03: Renvoie aussi le body parsé pour permettre aux callers
 * de distinguer "HTTP 200 mais Laravel a refusé" de "HTTP 200 et Laravel a traité".
 * Laravel répond souvent en 200 avec {status: 'ignored', reason: '...'} pour
 * signaler un refus métier (token inconnu, agreement paused, etc.).
 */
type PartnerEngineResult = {
  ok: boolean;
  body: Record<string, unknown> | null;
};

async function callPartnerEngine(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<PartnerEngineResult> {
  const baseUrl = process.env.PARTNER_ENGINE_URL || PARTNER_ENGINE_URL_SECRET.value();
  const apiKey = process.env.PARTNER_ENGINE_API_KEY || PARTNER_ENGINE_API_KEY_SECRET.value();

  if (!baseUrl || !apiKey) {
    logger.warn("[PartnerEngine] Missing PARTNER_ENGINE_URL or PARTNER_ENGINE_API_KEY");
    return { ok: false, body: null };
  }

  const url = `${baseUrl.replace(/\/+$/, "")}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Engine-Secret": apiKey,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    const text = await response.text().catch(() => "");
    let body: Record<string, unknown> | null = null;
    try {
      body = text ? (JSON.parse(text) as Record<string, unknown>) : null;
    } catch {
      // Non-JSON response — keep body null
    }

    if (!response.ok) {
      logger.error("[PartnerEngine] API error", {
        endpoint,
        status: response.status,
        body: text.substring(0, 500),
      });
      return { ok: false, body };
    }

    return { ok: true, body };
  } catch (error) {
    logger.error("[PartnerEngine] Network error", {
      endpoint,
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, body: null };
  }
}

// ============================================================================
// 1. HANDLER: User registered with partnerInviteToken
// ============================================================================

/**
 * Called from consolidatedOnUserCreated when a new user has partnerInviteToken.
 * Forwards the registration event to the Partner Engine so it can:
 * - Update subscriber status to "registered"
 * - Set firebase_uid on the subscriber
 * - Sync Firestore partner_subscribers doc
 */
export async function handlePartnerSubscriberRegistered(
  event: { params: { userId: string }; data?: { data: () => Record<string, unknown> | undefined } }
): Promise<void> {
  const userId = event.params.userId;
  const userData = event.data?.data();

  if (!userData) return;

  const inviteToken = userData.partnerInviteToken as string | undefined;
  if (!inviteToken) return; // Not a partner subscriber

  const email = (userData.email as string) || "";

  logger.info("[PartnerEngine] Forwarding subscriber registration", {
    userId,
    inviteToken,
    email,
  });

  const result = await callPartnerEngine("/api/webhooks/subscriber-registered", {
    firebaseUid: userId,
    email,
    inviteToken,
  });

  // AUDIT FIX 2026-05-03: Vérifier le status réel renvoyé par Laravel.
  // Laravel répond 200 avec status='ignored' si le token est inconnu (security fix:
  // sans cette vérif, un user pouvait s'auto-injecter un faux token et être marqué
  // comme partner_subscriber légitime). On ne marque linked QUE si Laravel a vraiment
  // créé/lié le subscriber (status='processed' ou 'already_registered').
  const laravelStatus = result.body?.status as string | undefined;
  const linkedSuccessfully = result.ok && (laravelStatus === "processed" || laravelStatus === "already_registered");
  const tokenRejected = result.ok && laravelStatus === "ignored";

  const db = getFirestore();

  if (linkedSuccessfully) {
    try {
      await db.collection("users").doc(userId).update({
        partnerSubscriberLinked: true,
        partnerSubscriberLinkedAt: new Date().toISOString(),
      });
    } catch (err) {
      logger.warn("[PartnerEngine] Could not update user doc", { userId, err });
    }
  } else if (tokenRejected) {
    // Token invalide rejeté par Laravel → nettoyer le user doc pour éviter qu'un
    // futur lookup le considère comme B2B. Sans ça, le champ partnerInviteToken
    // resterait sur le doc et pourrait créer une fausse impression de B2B status.
    logger.warn("[PartnerEngine] Invalid invite token rejected, cleaning up user doc", {
      userId,
      reason: result.body?.reason,
    });
    try {
      await db.collection("users").doc(userId).update({
        partnerInviteToken: FieldValue.delete(),
        partnerInviteTokenRejected: true,
        partnerInviteTokenRejectedAt: new Date().toISOString(),
        partnerInviteTokenRejectedReason: (result.body?.reason as string) || "unknown",
      });
    } catch (err) {
      logger.warn("[PartnerEngine] Could not clean up rejected token on user doc", { userId, err });
    }
  }
  // Sinon (network error, 5xx, etc.) : on ne touche pas au doc — le retry pourra réessayer.

  logger.info("[PartnerEngine] Subscriber registration forwarded", {
    userId,
    httpOk: result.ok,
    laravelStatus,
    linkedSuccessfully,
    tokenRejected,
  });
}

// ============================================================================
// 2. HANDLER: Call completed for a partner subscriber
// ============================================================================

/**
 * Called from the partner onCallCompleted handler (or consolidated trigger).
 * Forwards the call event to the Partner Engine so it can:
 * - Track subscriber activity
 * - Create commission in partner_commissions (Firestore)
 * - Update partner balance
 */
export async function forwardCallToPartnerEngine(params: {
  callSessionId: string;
  clientUid: string;
  providerType: "lawyer" | "expat";
  duration: number;
  amountPaidCents: number;
  discountAppliedCents: number;
  partnerId: string;
}): Promise<boolean> {
  logger.info("[PartnerEngine] Forwarding call-completed", {
    callSessionId: params.callSessionId,
    clientUid: params.clientUid,
    partnerId: params.partnerId,
  });

  // Check if the client is a partner subscriber (has partner_subscribers doc)
  const db = getFirestore();
  const subscriberQuery = await db
    .collection("partner_subscribers")
    .where("firebaseUid", "==", params.clientUid)
    .where("status", "in", ["registered", "active"])
    .limit(1)
    .get();

  if (subscriberQuery.empty) {
    // Not a partner subscriber — skip Partner Engine, let normal Firebase commission flow handle it
    return false;
  }

  const subscriberDoc = subscriberQuery.docs[0];
  const subscriberData = subscriberDoc.data();

  // Check agreement is not paused
  if (subscriberData.agreementPaused === true) {
    logger.info("[PartnerEngine] Agreement paused, skipping", {
      callSessionId: params.callSessionId,
      subscriberToken: subscriberDoc.id,
    });
    return false;
  }

  const result = await callPartnerEngine("/api/webhooks/call-completed", {
    callSessionId: params.callSessionId,
    clientUid: params.clientUid,
    providerType: params.providerType,
    duration: params.duration,
    amountPaidCents: params.amountPaidCents,
    discountAppliedCents: params.discountAppliedCents,
    partnerReferredBy: params.partnerId,
    subscriberInviteToken: subscriberDoc.id,
  });
  return result.ok;
}
