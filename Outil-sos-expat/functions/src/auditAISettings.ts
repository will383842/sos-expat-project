/**
 * =============================================================================
 * AUDIT AI SETTINGS — Soft monitoring trigger
 * =============================================================================
 *
 * OUT-SEC-010 (audit 2026-05-03): the admin can edit AI system prompts (lawyer,
 * expert, templates, model parameters) directly via the admin UI which writes
 * to `settings/ai`. There is no backend validation Cloud Function — a malicious
 * or compromised admin account could inject "Ignore previous instructions…"
 * style payloads that the AI chain would replay verbatim.
 *
 * This trigger is SOFT — it does NOT block writes (zero regression risk for
 * legitimate admins). It just hashes the before/after state and writes an
 * audit_log entry so any prompt tampering is forensically discoverable.
 *
 * To upgrade to hard validation later, add reject logic + a Cloud Function
 * callable for prompt updates that goes through validation BEFORE writing
 * to Firestore.
 */

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";
import { createHash } from "crypto";

/**
 * Hash a value to a short fingerprint (12 hex chars). Used for diff
 * comparison without storing prompt plaintext in audit_logs (which would
 * defeat the GDPR-friendly intent of audit logs).
 */
function hashValue(value: unknown): string {
  if (value === undefined || value === null) return "null";
  const str = typeof value === "string" ? value : JSON.stringify(value);
  return createHash("sha256").update(str).digest("hex").slice(0, 12);
}

/**
 * Compute a per-field hash diff between before and after document data.
 * Returns only the keys whose hashes changed.
 */
function diffHashes(
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown> | undefined
): Record<string, { from: string; to: string }> {
  const diff: Record<string, { from: string; to: string }> = {};
  const allKeys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);
  for (const key of allKeys) {
    const beforeHash = hashValue(before?.[key]);
    const afterHash = hashValue(after?.[key]);
    if (beforeHash !== afterHash) {
      diff[key] = { from: beforeHash, to: afterHash };
    }
  }
  return diff;
}

/**
 * Trigger: settings/ai write — log hash diff to audit_logs.
 * Region: europe-west1 (same as the rest of the Outil functions).
 *
 * Fire-and-forget: any failure here MUST NOT propagate (we're observing,
 * not gating). The admin write has already happened by the time we run.
 */
export const onAISettingsWritten = onDocumentWritten(
  {
    document: "settings/ai",
    region: "europe-west1",
    memory: "256MiB",
    // Single instance is enough — this fires only on admin actions
    maxInstances: 1,
  },
  async (event) => {
    try {
      const before = event.data?.before?.data();
      const after = event.data?.after?.data();

      // Compute hash diff (no plaintext stored in audit log)
      const fieldDiff = diffHashes(before, after);
      const changedKeys = Object.keys(fieldDiff);

      if (changedKeys.length === 0) {
        // No field actually changed (likely a serverTimestamp-only update)
        return;
      }

      // Best-effort lookup of the admin who triggered the write. The trigger
      // doesn't carry auth context directly; we read the most recent admin
      // action on settings/ai if the doc itself stores `lastUpdatedBy`.
      const lastUpdatedBy =
        (typeof after?.lastUpdatedBy === "string" ? after.lastUpdatedBy : null) ||
        (typeof after?.updatedBy === "string" ? after.updatedBy : null) ||
        null;

      const action =
        !before && after
          ? "ai_settings_created"
          : before && !after
          ? "ai_settings_deleted"
          : "ai_settings_updated";

      await admin
        .firestore()
        .collection("audit_logs")
        .add({
          action,
          resourceType: "settings",
          resourceId: "ai",
          fieldDiff,
          changedKeys,
          changedKeyCount: changedKeys.length,
          lastUpdatedBy,
          source: "audit_ai_settings_trigger",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

      logger.info("[onAISettingsWritten] AI settings change logged", {
        action,
        changedKeys,
        lastUpdatedBy,
      });
    } catch (err) {
      // Soft mode: never throw. The admin write already succeeded.
      logger.error("[onAISettingsWritten] Audit log failed (non-blocking)", {
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
);
