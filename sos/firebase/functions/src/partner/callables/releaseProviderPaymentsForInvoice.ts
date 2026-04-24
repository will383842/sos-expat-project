import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { PARTNER_ENGINE_API_KEY_SECRET, getPartnerEngineApiKey } from "../../lib/secrets";

/**
 * HTTP endpoint called by Partner Engine Laravel when a partner pays their
 * monthly invoice. It flips all related call_sessions from "pending_partner_invoice"
 * to "captured_sos_call_free" (operational unlock).
 *
 * The provider still has to wait until `payment.availableFromDate` (60 days after
 * the call) before they can actually withdraw. This endpoint only signals that
 * the PARTNER has paid — it does NOT accelerate the commercial delay.
 *
 * Auth: X-Engine-Secret header must match PARTNER_ENGINE_API_KEY.
 *
 * Body:
 * {
 *   partner_firebase_id: string,
 *   agreement_id: number,
 *   period: "YYYY-MM",
 *   invoice_id: number,
 *   invoice_number: string,
 *   paid_at: string (ISO8601)
 * }
 */
export const releaseProviderPayments = onRequest(
  {
    region: "us-central1",
    secrets: [PARTNER_ENGINE_API_KEY_SECRET],
    cors: false,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "method_not_allowed" });
      return;
    }

    const secret = req.header("x-engine-secret") || req.header("X-Engine-Secret");
    if (!secret || secret !== getPartnerEngineApiKey()) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const partnerFirebaseId = String(body.partner_firebase_id || "");
    const period = String(body.period || "");
    const invoiceId = body.invoice_id;
    const paidAt = body.paid_at ? new Date(String(body.paid_at)) : new Date();

    if (!partnerFirebaseId || !period || !invoiceId) {
      res.status(400).json({ error: "missing_required_fields" });
      return;
    }

    try {
      const db = admin.firestore();

      // Compute period boundaries in UTC (YYYY-MM)
      const [yearStr, monthStr] = period.split("-");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      if (!year || !month || month < 1 || month > 12) {
        res.status(400).json({ error: "invalid_period_format" });
        return;
      }
      const periodStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const periodEnd = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)); // next month start

      // Query call_sessions held for this partner, during this period
      const snap = await db
        .collection("call_sessions")
        .where("metadata.partnerFirebaseId", "==", partnerFirebaseId)
        .where("payment.status", "==", "pending_partner_invoice")
        .where("metadata.createdAt", ">=", admin.firestore.Timestamp.fromDate(periodStart))
        .where("metadata.createdAt", "<", admin.firestore.Timestamp.fromDate(periodEnd))
        .get();

      let releasedCount = 0;
      let totalProviderAmount = 0;

      const batch = db.batch();
      const now = admin.firestore.Timestamp.now();

      snap.docs.forEach((doc) => {
        const data = doc.data();
        const providerAmount = Number(data?.payment?.providerAmount || 0);
        totalProviderAmount += providerAmount;
        releasedCount += 1;

        batch.update(doc.ref, {
          "payment.status": "captured_sos_call_free",
          "payment.holdReason": admin.firestore.FieldValue.delete(),
          "payment.holdReleasedAt": now,
          "payment.partnerInvoiceId": invoiceId,
          "payment.partnerInvoicePaidAt": admin.firestore.Timestamp.fromDate(paidAt),
          "isPaid": true,
          "metadata.updatedAt": now,
        });
      });

      if (releasedCount > 0) {
        await batch.commit();
      }

      logger.info("[releaseProviderPayments] Released holds", {
        partnerFirebaseId,
        period,
        invoiceId,
        releasedCount,
        totalProviderAmount,
      });

      res.status(200).json({
        ok: true,
        released_count: releasedCount,
        total_provider_amount: totalProviderAmount,
      });
    } catch (err: unknown) {
      logger.error("[releaseProviderPayments] Error", err);
      const message = err instanceof Error ? err.message : "unknown";
      res.status(500).json({ error: "internal_error", detail: message });
    }
  }
);
