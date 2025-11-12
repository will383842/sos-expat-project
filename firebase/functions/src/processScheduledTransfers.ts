import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { StripeManager } from "./StripeManager";
import { logError } from "./utils/logs/logError";
import { logCallRecord } from "./utils/logs/logCallRecord";

/**
 * Runs daily at 2 AM UTC to process pending transfers that are due
 * Transfers provider payments that have passed their scheduled date
 */
export const processScheduledTransfers = onSchedule(
  {
    schedule: "0 2 * * *", // Every day at 2 AM UTC
    region: "europe-west1",
    timeoutSeconds: 540,
    memory: "512MiB",
  },
  async () => {
    console.log("🔄 Starting scheduled transfer processing...");
    console.log(`📅 Processing transfers due before: ${new Date().toISOString()}`);
    
    const now = admin.firestore.Timestamp.now();
    const db = admin.firestore();
    const stripeManager = new StripeManager();
    
    try {
      // Get all pending transfers that are due
      const pendingSnapshot = await db
        .collection("pending_transfers")
        .where("status", "==", "pending")
        .where("scheduledFor", "<=", now)
        .limit(100) // Process in batches
        .get();

      console.log(`📊 Found ${pendingSnapshot.size} transfers to process`);

      const results = {
        total: pendingSnapshot.size,
        succeeded: 0,
        failed: 0,
        totalAmount: 0,
      };

      // Process each pending transfer
      for (const doc of pendingSnapshot.docs) {
        const transfer = doc.data();
        
        try {
          console.log(`💸 Processing transfer ${doc.id} for provider ${transfer.providerId}`);
          console.log(`💸 Amount: ${transfer.amount} EUR, Session: ${transfer.sessionId}`);
          
          // Execute the Stripe transfer
          const transferResult = await stripeManager.transferToProvider(
            transfer.providerId,
            transfer.amount,
            transfer.sessionId,
            transfer.metadata || {}
          );

          if (transferResult.success && transferResult.transferId) {
            // Transfer succeeded - update pending_transfer record
            await doc.ref.update({
              status: "completed",
              transferId: transferResult.transferId,
              completedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Update call_session with transfer info
            await db.collection("call_sessions").doc(transfer.sessionId).update({
              "payment.transferId": transferResult.transferId,
              "payment.transferredAt": admin.firestore.FieldValue.serverTimestamp(),
              "payment.transferStatus": "succeeded",
              "metadata.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
            });

            // Log success
            await logCallRecord({
              callId: transfer.sessionId,
              status: "provider_payment_transferred",
              retryCount: 0,
              additionalData: {
                transferId: transferResult.transferId,
                amount: transfer.amount,
                providerId: transfer.providerId,
                pendingTransferId: doc.id,
                processedBy: "scheduled_function",
              },
            });

            results.succeeded++;
            results.totalAmount += transfer.amount;
            console.log(`✅ Transfer ${doc.id} completed successfully`);
          } else {
            // Transfer failed - mark as failed
            await doc.ref.update({
              status: "failed",
              failureReason: transferResult.error || "Unknown error",
              attemptedAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              retryCount: admin.firestore.FieldValue.increment(1),
            });

            // Update call_session
            await db.collection("call_sessions").doc(transfer.sessionId).update({
              "payment.transferStatus": "failed",
              "payment.transferFailureReason": transferResult.error || "Unknown error",
              "metadata.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
            });

            // Log failure
            await logCallRecord({
              callId: transfer.sessionId,
              status: "provider_payment_transfer_failed",
              retryCount: 0,
              additionalData: {
                error: transferResult.error,
                amount: transfer.amount,
                providerId: transfer.providerId,
                pendingTransferId: doc.id,
                processedBy: "scheduled_function",
              },
            });

            results.failed++;
            console.error(`❌ Transfer ${doc.id} failed: ${transferResult.error}`);
          }
        } catch (error) {
          results.failed++;
          console.error(`❌ Error processing transfer ${doc.id}:`, error);
          await logError("processScheduledTransfers:transfer", error);
          
          // Mark as failed with error details
          await doc.ref.update({
            status: "failed",
            failureReason: error instanceof Error ? error.message : "Unknown error",
            attemptedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            retryCount: admin.firestore.FieldValue.increment(1),
          });

          // Try to update call_session
          try {
            await db.collection("call_sessions").doc(transfer.sessionId).update({
              "payment.transferStatus": "failed",
              "payment.transferFailureReason": error instanceof Error ? error.message : "Unknown error",
              "metadata.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
            });
          } catch (updateError) {
            console.error(`Failed to update call_session: ${updateError}`);
          }
        }
      }

      console.log(`✅ Transfer processing complete:`, results);
      console.log(`💰 Total amount transferred: ${results.totalAmount} EUR`);
    } catch (error) {
      console.error("❌ Scheduled transfer processing failed:", error);
      await logError("processScheduledTransfers", error);
      throw error;
    }
  }
);

