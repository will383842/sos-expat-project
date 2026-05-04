/**
 * paymentHealthDailyDigest.ts
 *
 * Daily Telegram digest summarizing payment success rate per (country, gateway)
 * over the trailing 7 days, so admins notice silent regressions that don't
 * cross the per-event alert threshold (e.g. a country slowly drifting from
 * 95% to 60% success).
 *
 * Runs every morning at 07:00 UTC (08:00 Paris in winter, 09:00 in summer).
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions/v2";

import { enqueueTelegramMessage } from "../telegram/queue/enqueue";

const ADMIN_FALLBACK_CHAT_ID = "7560535072";

const SUCCESS_STATUSES = new Set([
  "succeeded",
  "captured",
  "authorized",
  "completed",
  "paid",
]);

const FAILED_STATUSES = new Set([
  "failed",
  "error",
  "declined",
  "authorization_failed",
  "capture_failed",
]);

interface BucketStats {
  country: string;
  gateway: string;
  total: number;
  failures: number;
  successes: number;
  successRate: number;
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
  } catch {
    /* ignore */
  }
  return [ADMIN_FALLBACK_CHAT_ID];
}

export const paymentHealthDailyDigest = onSchedule(
  {
    schedule: "0 7 * * *", // every day at 07:00 UTC
    timeZone: "UTC",
    region: "europe-west3",
    memory: "512MiB",
    cpu: 0.5,
    timeoutSeconds: 540,
  },
  async () => {
    const db = admin.firestore();
    const sevenDaysAgo = admin.firestore.Timestamp.fromMillis(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    const buckets = new Map<string, BucketStats>();
    let totalSeen = 0;
    let totalFinal = 0;

    const upsertBucket = (
      country: string,
      gateway: string,
      isSuccess: boolean,
      isFailure: boolean
    ) => {
      const key = `${country}__${gateway}`;
      const bucket = buckets.get(key) || {
        country,
        gateway,
        total: 0,
        failures: 0,
        successes: 0,
        successRate: 0,
      };
      bucket.total += 1;
      if (isSuccess) bucket.successes += 1;
      if (isFailure) bucket.failures += 1;
      bucket.successRate = bucket.successes / bucket.total;
      buckets.set(key, bucket);
    };

    // Source 1 — call_sessions (PayPal flow + any future writers).
    const sessionsSnap = await db
      .collection("call_sessions")
      .where("createdAt", ">=", sevenDaysAgo)
      .get();

    sessionsSnap.forEach((doc) => {
      totalSeen++;
      const data = doc.data() as Record<string, unknown>;
      const payment = (data.payment as Record<string, unknown> | undefined) || {};
      const status = String(payment.status ?? "").toLowerCase();
      if (!status) return; // session without payment data — ignored here
      const gateway = String(payment.gateway ?? "unknown").toLowerCase();
      const country = String(data.clientCurrentCountry ?? "UNKNOWN").toUpperCase() || "UNKNOWN";

      const isSuccess = SUCCESS_STATUSES.has(status);
      const isFailure = FAILED_STATUSES.has(status);
      if (!isSuccess && !isFailure) return;
      totalFinal++;
      upsertBucket(country, gateway, isSuccess, isFailure);
    });

    // Source 2 — payments collection (Stripe webhook updates land here).
    // We resolve country from metadata first, then fall back to the linked
    // call_session. Wallet methods (Apple Pay / Google Pay) get their own
    // gateway label so wallet-specific regressions surface in the digest.
    const paymentsSnap = await db
      .collection("payments")
      .where("createdAt", ">=", sevenDaysAgo)
      .get();

    for (const doc of paymentsSnap.docs) {
      totalSeen++;
      const data = doc.data() as Record<string, any>;
      const status = String(data?.status ?? "").toLowerCase();
      if (!status) continue;
      const isSuccess = SUCCESS_STATUSES.has(status);
      const isFailure = FAILED_STATUSES.has(status);
      if (!isSuccess && !isFailure) continue;

      let country = String(
        data?.metadata?.clientCurrentCountry ||
          data?.metadata?.clientCountry ||
          data?.metadata?.country ||
          ""
      ).toUpperCase();
      if (!country) {
        const csId = data?.callSessionId || data?.metadata?.callSessionId;
        if (csId) {
          try {
            const cs = await db.collection("call_sessions").doc(csId).get();
            country = String(cs.data()?.clientCurrentCountry || "").toUpperCase();
          } catch {
            /* ignore */
          }
        }
      }
      if (!country) country = "UNKNOWN";

      const method = String(data?.metadata?.paymentMethod || data?.paymentMethod || "").toLowerCase();
      let gateway = "stripe";
      if (method.includes("apple_pay")) gateway = "stripe_apple_pay";
      else if (method.includes("google_pay")) gateway = "stripe_google_pay";
      else if (method === "apple_pay_google_pay") gateway = "stripe_wallet";

      totalFinal++;
      upsertBucket(country, gateway, isSuccess, isFailure);
    }

    const allBuckets = Array.from(buckets.values());

    // Surface only buckets with at least 3 transactions in the window so the
    // ranking isn't dominated by 1-of-1 = 0% noise.
    const meaningful = allBuckets.filter((b) => b.total >= 3);
    const worst = [...meaningful]
      .filter((b) => b.successRate < 0.95)
      .sort((a, b) => a.successRate - b.successRate || b.total - a.total)
      .slice(0, 7);

    let totalSuccesses = 0;
    let totalFailures = 0;
    for (const b of allBuckets) {
      totalSuccesses += b.successes;
      totalFailures += b.failures;
    }
    const overallRate =
      totalSuccesses + totalFailures > 0
        ? totalSuccesses / (totalSuccesses + totalFailures)
        : 1;

    const lines: string[] = [];
    lines.push(`📊 <b>Santé des paiements — 7 derniers jours</b>`);
    lines.push(``);
    lines.push(
      `🌐 Taux global: <b>${(overallRate * 100).toFixed(1)}%</b> ` +
        `(${totalSuccesses} succès / ${totalFailures} échecs)`
    );
    lines.push(`📦 Sessions analysées: ${totalFinal} sur ${totalSeen}`);
    lines.push(``);

    if (worst.length === 0) {
      lines.push(`✅ Aucun couple (pays, passerelle) sous 95% de succès. RAS.`);
    } else {
      lines.push(`⚠️ <b>Top ${worst.length} pays/passerelles à surveiller</b>`);
      lines.push(`<i>(taux de succès &lt; 95%, min 3 transactions)</i>`);
      lines.push(``);
      for (const b of worst) {
        const ratePct = (b.successRate * 100).toFixed(0);
        lines.push(
          `• ${escapeHtml(b.country)} · ${escapeHtml(b.gateway.toUpperCase())} — ` +
            `<b>${ratePct}%</b> (${b.successes}/${b.total})`
        );
      }
    }

    const message = lines.join("\n");
    const chatIds = await resolveAdminChatIds(db);
    await Promise.all(
      chatIds.map((chatId) =>
        enqueueTelegramMessage(chatId, message, {
          parseMode: "HTML",
          priority: "realtime",
          sourceEventType: "payment_health_daily_digest",
        }).catch((err) => {
          logger.error("[PayHealthDigest] enqueue failed", {
            chatId,
            err: err instanceof Error ? err.message : String(err),
          });
        })
      )
    );

    logger.info("[PayHealthDigest] Sent", {
      bucketsTotal: allBuckets.length,
      bucketsBelow95: worst.length,
      totalSuccesses,
      totalFailures,
    });
  }
);
