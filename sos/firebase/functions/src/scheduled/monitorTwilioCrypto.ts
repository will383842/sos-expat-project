/**
 * monitorTwilioCrypto.ts
 *
 * P1-3 monitoring 2026-04-25: daily health check of the Twilio webhook
 * cryptographic-signature blocking flag (`admin_config/twilio_security`).
 *
 * Why this exists
 * ---------------
 * Webhooks coming from Twilio carry an HMAC-SHA1 signature in
 * `X-Twilio-Signature`. Our Cloud Run handler reconstructs the URL Twilio used
 * to sign and compares. When mismatched (URL normalisation quirks), the flag
 * `cryptoValidationBlocking` decides:
 *   - true  (strict)   → 403 + Twilio drops the call within 3–4s.
 *   - false (monitor)  → log warning + accept anyway (degraded security).
 *
 * The flag was flipped to `true` on 2026-04-25 after 7 days showed 46/46 valid.
 * This monitor runs daily and:
 *   1. Re-reads Firestore to confirm the flag is still `true`.
 *   2. Queries Cloud Logging for the last 24h of TWILIO_VALIDATION lines.
 *   3. If any FAILED appear (strict mode actually rejecting traffic) → critical
 *      alert via Telegram-Engine with the immediate rollback command.
 *   4. If all healthy → info-level log only (no noise).
 *
 * Auth: uses the function's Application Default Credentials. The Cloud
 * Functions runtime service account already has `roles/logging.viewer`
 * implicitly through the standard "Editor" role on the project; if that role
 * has been tightened, grant `roles/logging.viewer` explicitly to the runtime
 * service account.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleAuth } from "google-auth-library";
import {
  TELEGRAM_ENGINE_URL_SECRET,
  TELEGRAM_ENGINE_API_KEY_SECRET,
} from "../lib/secrets";
import { forwardEventToEngine } from "../telegram/forwardToEngine";

interface LogEntry {
  textPayload?: string;
}

interface SignatureCounts {
  valid: number;
  failed: number;
  monitoring: number;
  total: number;
}

const TWILIO_LOG_LOOKBACK_HOURS = 24;
const MAX_LOG_PAGES = 5; // safety cap (5 × 1000 = up to 5k entries)

/**
 * Query Cloud Logging via the REST API (Application Default Credentials).
 * Returns the count of VALID, FAILED (blocking-mode rejection), and
 * MONITORING (would-have-been-blocked) entries observed in the lookback
 * window.
 */
async function fetchTwilioValidationCounts(projectId: string): Promise<SignatureCounts> {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/logging.read"],
  });
  const client = await auth.getClient();
  const tokenResp = await client.getAccessToken();
  const accessToken = tokenResp.token;
  if (!accessToken) {
    throw new Error("Failed to obtain ADC access token for logging.read");
  }

  const since = new Date(
    Date.now() - TWILIO_LOG_LOOKBACK_HOURS * 60 * 60 * 1000
  ).toISOString();

  // We restrict to cloud_run_revision because Twilio webhooks run as
  // Cloud Run-backed Firebase Functions v2 (europe-west3).
  const filter = [
    'resource.type="cloud_run_revision"',
    'textPayload:"TWILIO_VALIDATION"',
    `timestamp>="${since}"`,
  ].join(" AND ");

  let valid = 0;
  let failed = 0;
  let monitoring = 0;
  let pageToken: string | undefined;
  let pageCount = 0;

  do {
    const body: Record<string, unknown> = {
      resourceNames: [`projects/${projectId}`],
      filter,
      orderBy: "timestamp desc",
      pageSize: 1000,
    };
    if (pageToken) body.pageToken = pageToken;

    const response = await fetch(
      "https://logging.googleapis.com/v2/entries:list",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Cloud Logging API ${response.status}: ${errText.slice(0, 500)}`);
    }

    const data = (await response.json()) as {
      entries?: LogEntry[];
      nextPageToken?: string;
    };

    for (const entry of data.entries ?? []) {
      const text = entry.textPayload ?? "";
      if (!text.includes("TWILIO_VALIDATION")) continue;
      if (text.includes("Cryptographic signature VALID")) {
        valid++;
      } else if (text.includes("BLOCKING") && text.includes("FAILED")) {
        failed++;
      } else if (text.includes("MONITORING") && text.includes("FAILED")) {
        monitoring++;
      }
    }

    pageToken = data.nextPageToken;
    pageCount++;
  } while (pageToken && pageCount < MAX_LOG_PAGES);

  return { valid, failed, monitoring, total: valid + failed + monitoring };
}

export const monitorTwilioCrypto = onSchedule(
  {
    schedule: "0 18 * * *", // every day at 18:00 UTC
    timeZone: "Etc/UTC",
    region: "europe-west3",
    memory: "256MiB",
    cpu: 0.25,
    maxInstances: 1,
    timeoutSeconds: 120,
    secrets: [TELEGRAM_ENGINE_URL_SECRET, TELEGRAM_ENGINE_API_KEY_SECRET],
  },
  async () => {
    const db = admin.firestore();
    const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "sos-urgently-ac307";

    // Step 1 — read the flag.
    const securityDoc = await db.doc("admin_config/twilio_security").get();
    const flagData = securityDoc.data() ?? {};
    const blockingEnabled = flagData.cryptoValidationBlocking === true;

    logger.info("[monitorTwilioCrypto] Daily check started", {
      blockingEnabled,
      flagDocExists: securityDoc.exists,
      lookbackHours: TWILIO_LOG_LOOKBACK_HOURS,
      projectId,
    });

    if (!blockingEnabled) {
      logger.warn(
        "[monitorTwilioCrypto] cryptoValidationBlocking is FALSE — webhooks accepted even with invalid signature (degraded security)"
      );
      await forwardEventToEngine("twilio_crypto_monitoring_mode", undefined, {
        severity: "info",
        message:
          "Twilio crypto validation is in MONITORING mode (webhooks accepted even if signature invalid). Set admin_config/twilio_security.cryptoValidationBlocking=true to restore strict mode.",
      });
      return;
    }

    // Step 2 — query logs.
    let counts: SignatureCounts;
    try {
      counts = await fetchTwilioValidationCounts(projectId);
    } catch (err) {
      logger.error("[monitorTwilioCrypto] Failed to query Cloud Logging", err);
      await forwardEventToEngine("twilio_crypto_monitor_error", undefined, {
        severity: "warning",
        message: "Twilio crypto monitor could not query Cloud Logging.",
        error: err instanceof Error ? err.message : String(err),
        hint: "Check that the Functions runtime SA has roles/logging.viewer on project " + projectId,
      });
      return;
    }

    logger.info("[monitorTwilioCrypto] 24h Twilio webhook signature counts", counts);

    // Step 3 — classify outcome.
    if (counts.total === 0) {
      logger.info(
        "[monitorTwilioCrypto] No Twilio webhook activity in last 24h — verification deferred"
      );
      return;
    }

    if (counts.failed > 0) {
      // 🚨 Strict mode is rejecting traffic — calls likely dropping at 3-4s.
      logger.error("[monitorTwilioCrypto] CRYPTO_BLOCKING_REJECTING_WEBHOOKS", counts);
      await forwardEventToEngine("twilio_crypto_failure_detected", undefined, {
        severity: "critical",
        message: `🚨 Twilio crypto blocking REJECTED ${counts.failed} legitimate webhook(s) in the last 24h. Calls likely dropping at ~3-4s. ROLLBACK to monitoring mode immediately.`,
        details: {
          failed: counts.failed,
          monitoringFailed: counts.monitoring,
          valid: counts.valid,
          total: counts.total,
          rollbackCommand:
            'firebase firestore:set admin_config/twilio_security \'{"cryptoValidationBlocking": false}\' --merge',
          flagDocPath: "admin_config/twilio_security",
        },
      });
      return;
    }

    if (counts.monitoring > 0) {
      // Defensive — shouldn't happen when flag is true, but log it for diagnosis.
      logger.warn(
        "[monitorTwilioCrypto] Unexpected MONITORING entries while flag is true — possible stale function instance",
        counts
      );
    }

    logger.info(
      `[monitorTwilioCrypto] ✅ healthy — ${counts.valid} VALID signatures, 0 FAILED in last 24h`,
      counts
    );
  }
);
