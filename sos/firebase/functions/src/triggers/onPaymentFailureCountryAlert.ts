/**
 * onPaymentFailureCountryAlert.ts
 *
 * Real-time per-country payment failure alerting.
 *
 * Goal: notify admins on Telegram on the FIRST failure for a given
 * (country, gateway) pair, but rate-limit to one alert per 10 minutes per
 * pair so a regional outage does not spam dozens of identical messages.
 *
 * Lifecycle of the dedup window for one (country, gateway):
 *   t0  : first failure  -> Telegram alert sent, lastAlertedAt = t0
 *   t0+: every silent failure increments `failuresSinceLastAlert`
 *   t0+10min: next failure -> new Telegram alert with the cumulative count
 *             since t0, then the counter is reset.
 *
 * Sources watched:
 *  - `call_sessions/{id}.payment.status`         (catches PayPal authorize/capture failures
 *                                                  and any future writer that fills the field)
 *  - `payments/{docId}.status`                   (Stripe — the Stripe webhook writes
 *                                                  status="failed" / "failed_permanent" here)
 *
 * Both triggers route through the same `fireAlert()` helper so the dedup
 * window is shared across gateways for the same country.
 */

import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions/v2";

import { enqueueTelegramMessage } from "../telegram/queue/enqueue";

const FAILED_STATUSES = new Set([
  "failed",
  "failed_permanent",
  "error",
  "declined",
  "authorization_failed",
  "capture_failed",
]);

const ALERT_DEDUP_WINDOW_MS = 10 * 60 * 1000;
const HEALTH_COLLECTION = "country_payment_health";
const ADMIN_FALLBACK_CHAT_ID = "7560535072"; // primary admin Telegram chat (memory: SOS Expat)

interface CallSessionPayment {
  status?: string;
  gateway?: string;
  amount?: number;
  currency?: string;
  failureReason?: string;
  errorCode?: string;
  error?: { code?: string; message?: string };
}

interface CallSessionDoc {
  payment?: CallSessionPayment;
  clientCurrentCountry?: string;
  clientId?: string;
}

function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function resolveAdminChatIds(
  db: admin.firestore.Firestore
): Promise<Array<string | number>> {
  try {
    const snap = await db
      .collection("users")
      .where("role", "==", "admin")
      .where("telegramNotifications", "==", true)
      .get();
    const ids = snap.docs
      .map((d) => d.data().telegram_id || d.data().telegramId)
      .filter(Boolean);
    if (ids.length > 0) return ids;
  } catch (err) {
    logger.warn("[PayFailCountry] admin lookup failed, falling back", {
      err: err instanceof Error ? err.message : String(err),
    });
  }
  return [ADMIN_FALLBACK_CHAT_ID];
}

interface AlertContext {
  country: string;
  gateway: string;
  amount?: number;
  currency?: string;
  failureReason: string;
  errorCode: string;
  // Firestore document path that triggered the alert, used for the deep-link.
  documentPath: string;
  // Short identifier shown in the alert (call session id, payment doc id, ...).
  primaryId: string;
}

async function fireAlert(ctx: AlertContext): Promise<void> {
  const db = admin.firestore();
  const healthRef = db
    .collection(HEALTH_COLLECTION)
    .doc(`${ctx.country}_${ctx.gateway}`);

  const now = Date.now();
  const decision = await db.runTransaction(async (tx) => {
    const snap = await tx.get(healthRef);
    const data = snap.exists ? snap.data() : undefined;
    const lastAlertedMs =
      (data?.lastAlertedAt as admin.firestore.Timestamp | undefined)?.toMillis?.() || 0;
    const prevSilent = (data?.failuresSinceLastAlert as number | undefined) || 0;
    const inDedup = lastAlertedMs > 0 && now - lastAlertedMs < ALERT_DEDUP_WINDOW_MS;
    const newSilent = inDedup ? prevSilent + 1 : 1;

    const update: Record<string, unknown> = {
      country: ctx.country,
      gateway: ctx.gateway,
      failureCount: admin.firestore.FieldValue.increment(1),
      lastFailureAt: admin.firestore.FieldValue.serverTimestamp(),
      lastFailureReason: ctx.failureReason,
      lastFailureCode: ctx.errorCode,
      lastFailurePath: ctx.documentPath,
      failuresSinceLastAlert: inDedup ? newSilent : 0,
    };
    if (!inDedup) {
      update.lastAlertedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    tx.set(healthRef, update, { merge: true });

    return { fire: !inDedup, cumulative: newSilent };
  });

  if (!decision.fire) {
    logger.info("[PayFailCountry] Suppressed (dedup window)", {
      country: ctx.country,
      gateway: ctx.gateway,
      cumulative: decision.cumulative,
      documentPath: ctx.documentPath,
    });
    return;
  }

  const projectId = process.env.GCLOUD_PROJECT || "sos-urgently-ac307";
  const link = `https://console.firebase.google.com/project/${projectId}/firestore/data/${ctx.documentPath}`;
  const message = [
    `🚨 <b>Échec paiement détecté</b>`,
    ``,
    `🌍 <b>Pays:</b> ${escapeHtml(ctx.country)}`,
    `🏦 <b>Passerelle:</b> ${escapeHtml(ctx.gateway.toUpperCase())}`,
    ctx.amount != null
      ? `💳 <b>Montant:</b> ${escapeHtml(ctx.amount)} ${escapeHtml(ctx.currency || "")}`
      : null,
    `⚠️ <b>Raison:</b> ${escapeHtml(ctx.failureReason)}`,
    ctx.errorCode ? `📛 <b>Code:</b> <code>${escapeHtml(ctx.errorCode)}</code>` : null,
    decision.cumulative > 1
      ? `📊 <i>${decision.cumulative} échecs cumulés sur ce pays/passerelle depuis la dernière alerte</i>`
      : null,
    ``,
    `🆔 <code>${escapeHtml(ctx.primaryId)}</code>`,
    `🔗 <a href="${link}">Voir le document</a>`,
  ]
    .filter(Boolean)
    .join("\n");

  const chatIds = await resolveAdminChatIds(db);
  await Promise.all(
    chatIds.map((chatId) =>
      enqueueTelegramMessage(chatId, message, {
        parseMode: "HTML",
        priority: "realtime",
        sourceEventType: "payment_failure_country_alert",
      }).catch((err) => {
        logger.error("[PayFailCountry] enqueue failed", {
          chatId,
          err: err instanceof Error ? err.message : String(err),
        });
      })
    )
  );

  logger.info("[PayFailCountry] Alert fired", {
    country: ctx.country,
    gateway: ctx.gateway,
    cumulative: decision.cumulative,
    documentPath: ctx.documentPath,
  });
}

/**
 * Trigger 1 — call_sessions: catches any session whose payment.status
 * transitions into a failed state (PayPal authorize_failed, capture_failed,
 * generic failures).
 */
export const onPaymentFailureCountryAlert = onDocumentUpdated(
  {
    document: "call_sessions/{sessionId}",
    region: "europe-west3",
    memory: "256MiB",
    cpu: 0.083,
    timeoutSeconds: 60,
  },
  async (event) => {
    const before = event.data?.before.data() as CallSessionDoc | undefined;
    const after = event.data?.after.data() as CallSessionDoc | undefined;
    const sessionId = event.params.sessionId;
    if (!before || !after) return;

    const beforeStatus = String(before.payment?.status ?? "").toLowerCase();
    const afterStatus = String(after.payment?.status ?? "").toLowerCase();
    if (FAILED_STATUSES.has(beforeStatus) || !FAILED_STATUSES.has(afterStatus)) return;

    await fireAlert({
      country: (after.clientCurrentCountry || "UNKNOWN").toUpperCase(),
      gateway: (after.payment?.gateway || "unknown").toLowerCase(),
      amount: after.payment?.amount,
      currency: (after.payment?.currency || "EUR").toUpperCase(),
      failureReason:
        after.payment?.failureReason ||
        after.payment?.error?.message ||
        `payment.status=${afterStatus}`,
      errorCode: after.payment?.errorCode || after.payment?.error?.code || "",
      documentPath: `call_sessions/${sessionId}`,
      primaryId: sessionId,
    });
  }
);

/**
 * Trigger 2 — payments (Stripe): catches the
 * `payment_intent.payment_failed` webhook path which writes
 * status="failed" (or "failed_permanent" for non-transient retries) into
 * the `payments/{docId}` document. Country is resolved from either
 * payments.metadata.* or by reading the linked call_session.
 */
interface PaymentsDoc {
  status?: string;
  stripePaymentIntentId?: string;
  callSessionId?: string;
  amount?: number;
  amountInEuros?: number;
  currency?: string;
  failureReason?: string;
  metadata?: {
    callSessionId?: string;
    clientCountry?: string;
    clientCurrentCountry?: string;
    country?: string;
    paymentMethod?: string;
  };
  paymentMethod?: string;
}

async function resolveCountryFromPaymentsDoc(
  doc: PaymentsDoc,
  db: admin.firestore.Firestore
): Promise<string> {
  const direct =
    doc.metadata?.clientCurrentCountry ||
    doc.metadata?.clientCountry ||
    doc.metadata?.country;
  if (direct) return direct.toUpperCase();

  const callSessionId = doc.callSessionId || doc.metadata?.callSessionId;
  if (callSessionId) {
    try {
      const cs = await db.collection("call_sessions").doc(callSessionId).get();
      const country = (cs.data()?.clientCurrentCountry as string | undefined) || "";
      if (country) return country.toUpperCase();
    } catch {
      /* ignore */
    }
  }
  return "UNKNOWN";
}

function detectStripeGateway(doc: PaymentsDoc): string {
  // Distinguish Apple Pay / Google Pay from regular Stripe Card flows so we
  // can spot wallet-only regressions (e.g. Apple Pay broken on iOS Safari).
  const method = (doc.metadata?.paymentMethod || doc.paymentMethod || "").toLowerCase();
  if (method.includes("apple_pay")) return "stripe_apple_pay";
  if (method.includes("google_pay")) return "stripe_google_pay";
  if (method === "apple_pay_google_pay") return "stripe_wallet";
  return "stripe";
}

export const onStripePaymentFailureCountryAlert = onDocumentUpdated(
  {
    document: "payments/{paymentDocId}",
    region: "europe-west3",
    memory: "256MiB",
    cpu: 0.083,
    timeoutSeconds: 60,
  },
  async (event) => {
    const before = event.data?.before.data() as PaymentsDoc | undefined;
    const after = event.data?.after.data() as PaymentsDoc | undefined;
    const paymentDocId = event.params.paymentDocId;
    if (!before || !after) return;

    const beforeStatus = String(before.status ?? "").toLowerCase();
    const afterStatus = String(after.status ?? "").toLowerCase();
    if (FAILED_STATUSES.has(beforeStatus) || !FAILED_STATUSES.has(afterStatus)) return;

    const db = admin.firestore();
    const country = await resolveCountryFromPaymentsDoc(after, db);
    const gateway = detectStripeGateway(after);
    const amount = after.amountInEuros ?? after.amount;
    const currency = (after.currency || "EUR").toUpperCase();

    await fireAlert({
      country,
      gateway,
      amount,
      currency,
      failureReason: after.failureReason || `status=${afterStatus}`,
      errorCode: "",
      documentPath: `payments/${paymentDocId}`,
      primaryId: after.stripePaymentIntentId || paymentDocId,
    });
  }
);
