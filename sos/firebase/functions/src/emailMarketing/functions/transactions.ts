import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { MailwizzAPI } from "../utils/mailwizz";
import { mapUserToMailWizzFields } from "../utils/fieldMapper";
import { logGA4Event, logTrustpilotEvent } from "../utils/analytics";
import { getLanguageCode } from "../config";
// P2-2 FIX: Unified payment status checks
import { isPaymentCompleted } from "../../utils/paymentStatusUtils";
// P1 FIX 2026-05-03 (round 4): SENTRY_DSN for handleEarningCredited initSentry resolution.
import { SENTRY_DSN } from "../../lib/secrets";


/**
 * FUNCTION 3: Handle Call Completed
 * Trigger: onUpdate on calls/{callId}
 * Sends completion emails to client and provider
 */
export const handleCallCompleted = onDocumentUpdated(
  {
    document: "call_sessions/{sessionId}",
    region: "europe-west3",
    // P0 HOTFIX 2026-05-03: 0.083→0.167. Gen2 ratio cap pour 512MiB (cf. 58c059b3).
    cpu: 0.167,
    // P0 HOTFIX 2026-05-03: bump explicit 512MiB. OOM observé 261 MiB. Default Cloud
    // Functions est 256 MiB et ne suffit pas avec firebase-admin + email templates loaded.
    memory: "512MiB",
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const sessionId = event.params.sessionId;

    if (!before || !after) {
      console.warn(`⚠️ No data for call session ${sessionId}`);
      return;
    }

    // Only process when status changes to completed
    if (before.status !== "completed" && after.status === "completed") {
      try {
        const mailwizz = new MailwizzAPI();

        // Get provider data
        const providerDoc = await admin
          .firestore()
          .collection("users")
          .doc(after.providerId)
          .get();

        if (!providerDoc.exists) {
          console.warn(`⚠️ Provider ${after.providerId} not found`);
          return;
        }

        const provider = providerDoc.data();

        // Update provider stats in MailWizz
        const totalCalls = (provider?.totalCalls || 0) + 1;
        try {
          await mailwizz.updateSubscriber(after.providerId, {
            TOTAL_CALLS: totalCalls.toString(),
          });
        } catch (updateError) {
          console.error(`❌ Error updating provider stats:`, updateError);
        }

        // Get client data
        const clientDoc = await admin
          .firestore()
          .collection("users")
          .doc(after.clientId)
          .get();

        if (!clientDoc.exists) {
          console.warn(`⚠️ Client ${after.clientId} not found`);
          return;
        }

        const client = clientDoc.data();
        const clientLang = getLanguageCode(
          client?.language || client?.preferredLanguage || client?.lang || "en"
        );
        const providerLang = getLanguageCode(
          provider?.language || provider?.preferredLanguage || provider?.lang || "en"
        );

        // Send call completed emails
        const duration = after.callDuration || after.duration || 0;
        const amount = after.price || after.amount || 0;

        // Email to client — spread ALL real fields + per-event overrides
        try {
          const clientFields = mapUserToMailWizzFields(client!, after.clientId);
          await mailwizz.sendTransactional({
            to: client?.email || after.clientId,
            template: `TR_CLI_call-completed_${clientLang}`,
            customFields: {
              ...clientFields,
              EXPERT_NAME: provider?.firstName || provider?.name || "Provider",
              DURATION: duration.toString(),
              AMOUNT: amount.toString(),
            },
          });
        } catch (emailError) {
          console.error(`❌ Error sending client email:`, emailError);
        }

        // Email to provider — spread ALL real fields + per-event overrides
        try {
          const providerFields = mapUserToMailWizzFields(provider!, after.providerId);
          await mailwizz.sendTransactional({
            to: provider?.email || after.providerId,
            template: `TR_PRO_call-completed_${providerLang}`,
            customFields: {
              ...providerFields,
              CLIENT_NAME: client?.firstName || client?.name || "Client",
              DURATION: duration.toString(),
              AMOUNT: amount.toString(),
            },
          });
        } catch (emailError) {
          console.error(`❌ Error sending provider email:`, emailError);
        }

        // Log GA4 event
        await logGA4Event("call_completed", {
          call_id: sessionId,
          client_id: after.clientId,
          provider_id: after.providerId,
          duration: duration,
          amount: amount,
        });

        console.log(`✅ Call completed emails sent: ${sessionId}`);
      } catch (error: any) {
        console.error(`❌ Error in handleCallCompleted for ${sessionId}:`, error);
      }
    }
  }
);

/**
 * FUNCTION 2: Handle Review Submitted
 * Trigger: onCreate on reviews/{reviewId}
 * CRITICAL: Handles Trustpilot invitation for satisfied clients (rating >= 4)
 */
export const handleReviewSubmitted = onDocumentCreated(
  {
    document: "reviews/{reviewId}",
    region: "europe-west3",
    cpu: 0.083,
  },
  async (event) => {
    const review = event.data?.data();
    const reviewId = event.params.reviewId;

    if (!review || !event.data) {
      console.warn(`⚠️ No review data for ${reviewId}`);
      return;
    }
    const { rating, clientId, providerId, comment, callId } = review;

    if (!rating || !clientId || !providerId) {
      console.warn(`⚠️ Invalid review data: ${reviewId}`);
      return;
    }

    try {
      const mailwizz = new MailwizzAPI();

      // Get client data
      const clientDoc = await admin
        .firestore()
        .collection("users")
        .doc(clientId)
        .get();

      if (!clientDoc.exists) {
        console.warn(`⚠️ Client ${clientId} not found`);
        return;
      }

      const client = clientDoc.data();
      const lang = getLanguageCode(
        client?.language || client?.preferredLanguage || client?.lang || "en"
      );

      // Update MailWizz with rating
      try {
        await mailwizz.updateSubscriber(clientId, {
          RATING_STARS: rating.toString(),
        });
      } catch (updateError) {
        console.error(`❌ Error updating rating in MailWizz:`, updateError);
      }

      const clientAllFields = mapUserToMailWizzFields(client!, clientId);

      // CRITICAL: Trustpilot invitation for satisfied clients (rating >= 4)
      if (rating >= 4) {
        // Satisfied client → Trustpilot invitation
        try {
          await mailwizz.sendTransactional({
            to: client?.email || clientId,
            template: `TR_CLI_trustpilot-invite_${lang}`,
            customFields: {
              ...clientAllFields,
              TRUSTPILOT_URL: "https://www.trustpilot.com/review/sos-expat.com",
              RATING_STARS: rating.toString(),
            },
          });

          await logTrustpilotEvent("invite_sent", clientId, rating);
          await logGA4Event("trustpilot_invite_sent", {
            user_id: clientId,
            rating_stars: rating,
            email_language: lang.toLowerCase(),
            review_id: reviewId,
          });
        } catch (emailError) {
          console.error(`❌ Error sending Trustpilot invite:`, emailError);
        }

        // Notify provider of good review
        const providerDoc = await admin
          .firestore()
          .collection("users")
          .doc(providerId)
          .get();

        if (providerDoc.exists) {
          const provider = providerDoc.data();
          const providerLang = getLanguageCode(
            provider?.language || provider?.preferredLanguage || provider?.lang || "en"
          );

          try {
            const providerAllFields = mapUserToMailWizzFields(provider!, providerId);
            await mailwizz.sendTransactional({
              to: provider?.email || providerId,
              template: `TR_PRO_good-review-received_${providerLang}`,
              customFields: {
                ...providerAllFields,
                CLIENT_NAME: client?.firstName || "Client",
                RATING_STARS: rating.toString(),
                REVIEW_TEXT: comment || "",
              },
            });
          } catch (emailError) {
            console.error(`❌ Error sending provider notification:`, emailError);
          }

          // In-app notification for provider
          try {
            await admin.firestore().collection("inapp_notifications").add({
              uid: providerId,
              type: "new_review",
              title: rating >= 4 ? "⭐ Nouvel avis positif" : "📝 Nouvel avis",
              message: `${client?.firstName || "Un client"} vous a donné ${rating}/5 étoiles`,
              link: "/dashboard/reviews",
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              read: false,
            });
          } catch (notifError) {
            console.error(`❌ Error creating in-app notification:`, notifError);
          }
        }
      } else {
        // Unsatisfied client → Simple thank you
        try {
          await mailwizz.sendTransactional({
            to: client?.email || clientId,
            template: `TR_CLI_thank-you-review_${lang}`,
            customFields: {
              ...clientAllFields,
              REVIEW_TEXT: comment || "",
              RATING_STARS: rating.toString(),
            },
          });
        } catch (emailError) {
          console.error(`❌ Error sending thank you email:`, emailError);
        }

        // Store negative review for follow-up (TTL: 90 days)
        // Note: Configure TTL policy in Firebase Console > Firestore > TTL > Add policy for 'expireAt' field
        const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        try {
          await admin.firestore().collection("negative_reviews").add({
            clientId,
            providerId,
            rating,
            text: comment || "",
            callId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            expireAt: admin.firestore.Timestamp.fromDate(ninetyDaysFromNow),
          });
        } catch (storeError) {
          console.error(`❌ Error storing negative review:`, storeError);
        }

        // Create support alert for very low ratings (<= 2) (TTL: 30 days)
        if (rating <= 2) {
          const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          try {
            await admin.firestore().collection("support_alerts").add({
              type: "negative_review",
              severity: "high",
              clientId,
              providerId,
              rating,
              text: comment || "",
              callId,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              expireAt: admin.firestore.Timestamp.fromDate(thirtyDaysFromNow),
              status: "pending",
            });
          } catch (alertError) {
            console.error(`❌ Error creating support alert:`, alertError);
          }

          await logGA4Event("negative_review_detected", {
            user_id: clientId,
            rating_stars: rating,
            provider_id: providerId,
            review_id: reviewId,
          });
        }

        // Notify provider of negative/neutral review
        const providerDoc = await admin
          .firestore()
          .collection("users")
          .doc(providerId)
          .get();

        if (providerDoc.exists) {
          const provider = providerDoc.data();
          const providerLang = getLanguageCode(
            provider?.language || provider?.preferredLanguage || provider?.lang || "en"
          );

          const template =
            rating === 3
              ? `TR_PRO_neutral-review-received_${providerLang}`
              : `TR_PRO_bad-review-received_${providerLang}`;

          try {
            const providerAllFields2 = mapUserToMailWizzFields(provider!, providerId);
            await mailwizz.sendTransactional({
              to: provider?.email || providerId,
              template,
              customFields: {
                ...providerAllFields2,
                CLIENT_NAME: client?.firstName || "Client",
                RATING_STARS: rating.toString(),
                REVIEW_TEXT: comment || "",
              },
            });
          } catch (emailError) {
            console.error(`❌ Error sending provider notification:`, emailError);
          }

          // In-app notification for provider (negative/neutral review)
          try {
            await admin.firestore().collection("inapp_notifications").add({
              uid: providerId,
              type: "new_review",
              title: rating <= 2 ? "⚠️ Avis négatif reçu" : "📝 Nouvel avis",
              message: `${client?.firstName || "Un client"} vous a donné ${rating}/5 étoiles`,
              link: "/dashboard/reviews",
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              read: false,
            });
          } catch (notifError) {
            console.error(`❌ Error creating in-app notification:`, notifError);
          }
        }
      }

      // Update client's review status
      try {
        await admin.firestore().collection("users").doc(clientId).update({
          hasSubmittedReview: true,
          lastReviewAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (updateError) {
        console.error(`❌ Error updating review status:`, updateError);
      }

      console.log(`✅ Review processed: ${reviewId}, rating: ${rating}`);
    } catch (error: any) {
      console.error(`❌ Error in handleReviewSubmitted for ${reviewId}:`, error);
    }
  }
);

/**
 * FUNCTION 3-bis: Handle Review Request Created
 * Trigger: onCreate on reviews_requests/{requestId}
 *
 * Sent when TwilioCallManager.createReviewRequest fires after a successful call
 * (duration >= MIN_CALL_DURATION = 60s and payment captured).
 * Asks the client to leave a review by linking to the dashboard.
 *
 * Skips if the client has already submitted a review for this call (idempotency).
 * Marks the request with emailSent/emailSentAt to support a future J+3 reminder cron.
 */
export const handleReviewRequestCreated = onDocumentCreated(
  {
    document: "reviews_requests/{requestId}",
    region: "europe-west3",
    cpu: 0.083,
  },
  async (event) => {
    const reviewRequest = event.data?.data();
    const requestId = event.params.requestId;

    if (!reviewRequest || !event.data) {
      console.warn(`⚠️ No review request data for ${requestId}`);
      return;
    }

    const { clientId, providerId, callSessionId, callDuration, serviceType, bothConnected } =
      reviewRequest;

    if (!clientId || !providerId || !callSessionId) {
      console.warn(`⚠️ Invalid review request data: ${requestId}`);
      return;
    }

    // Defense in depth: backend already enforces 60s + bothConnected, but re-check.
    if (!bothConnected || (callDuration || 0) < 60) {
      console.log(
        `⏭️ Skipping review request email for ${requestId}: bothConnected=${bothConnected}, duration=${callDuration}s`
      );
      return;
    }

    try {
      // Idempotency: don't send if a review already exists for this call.
      const existingReview = await admin
        .firestore()
        .collection("reviews")
        .where("callId", "==", callSessionId)
        .where("clientId", "==", clientId)
        .limit(1)
        .get();

      if (!existingReview.empty) {
        console.log(`⏭️ Review already submitted for call ${callSessionId}, skipping email.`);
        await event.data.ref.update({
          emailSkipped: true,
          emailSkippedReason: "review_already_submitted",
          emailSkippedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return;
      }

      const mailwizz = new MailwizzAPI();

      // Get client + provider in parallel
      const [clientDoc, providerDoc] = await Promise.all([
        admin.firestore().collection("users").doc(clientId).get(),
        admin.firestore().collection("users").doc(providerId).get(),
      ]);

      if (!clientDoc.exists) {
        console.warn(`⚠️ Client ${clientId} not found for review request ${requestId}`);
        return;
      }

      const client = clientDoc.data();
      const provider = providerDoc.exists ? providerDoc.data() : null;

      const lang = getLanguageCode(
        client?.language || client?.preferredLanguage || client?.lang || "en"
      );

      const isLawyer = serviceType === "lawyer_call";
      const providerName =
        provider?.firstName ||
        provider?.name ||
        (isLawyer ? "votre avocat" : "votre expert expatrié");

      const clientFields = mapUserToMailWizzFields(client!, clientId);

      // Send review request email
      try {
        await mailwizz.sendTransactional({
          to: client?.email || clientId,
          template: `TR_CLI_review-request_${lang}`,
          customFields: {
            ...clientFields,
            EXPERT_NAME: providerName,
            DURATION: (callDuration || 0).toString(),
            SERVICE_TYPE: serviceType || "",
            REVIEW_URL: `https://sos-expat.com/review/${requestId}`,
            CALL_ID: callSessionId,
          },
        });

        await event.data.ref.update({
          emailSent: true,
          emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
          emailLanguage: lang,
        });

        await logGA4Event("review_request_email_sent", {
          user_id: clientId,
          provider_id: providerId,
          call_id: callSessionId,
          email_language: lang.toLowerCase(),
        });
      } catch (emailError: any) {
        console.error(`❌ Error sending review request email:`, emailError);
        await event.data.ref.update({
          emailError: emailError?.message || String(emailError),
          emailErrorAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // In-app notification for client
      try {
        await admin.firestore().collection("inapp_notifications").add({
          uid: clientId,
          type: "review_request",
          title: "⭐ Comment s'est passé votre appel ?",
          message: `Partagez votre expérience avec ${providerName} en quelques secondes`,
          link: "/dashboard",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
        });
      } catch (notifError) {
        console.error(`❌ Error creating in-app notification:`, notifError);
      }

      console.log(`✅ Review request processed: ${requestId} (call ${callSessionId})`);
    } catch (error: any) {
      console.error(`❌ Error in handleReviewRequestCreated for ${requestId}:`, error);
    }
  }
);

/**
 * FUNCTION 3-ter: Send Review Request Reminders (J+3)
 * Schedule: daily at 10:00 UTC.
 *
 * Picks up reviews_requests where:
 *   - emailSent === true
 *   - reminderEmailSent !== true
 *   - emailSentAt is between [now - 4 days, now - 3 days]
 *
 * For each, skips if a review has been submitted, otherwise sends a reminder
 * via TR_CLI_review-reminder_{lang} and marks reminderEmailSent.
 *
 * Capped at 200 docs per run as a safety net.
 */
export const sendReviewRequestReminders = onSchedule(
  {
    schedule: "0 10 * * *",
    region: "europe-west3",
    timeZone: "UTC",
    memory: "256MiB",
    cpu: 0.083,
  },
  async () => {
    const db = admin.firestore();
    const now = Date.now();
    const fourDaysAgo = admin.firestore.Timestamp.fromMillis(now - 4 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = admin.firestore.Timestamp.fromMillis(now - 3 * 24 * 60 * 60 * 1000);

    let processed = 0;
    let sent = 0;
    let skipped = 0;

    try {
      const candidates = await db
        .collection("reviews_requests")
        .where("emailSent", "==", true)
        .where("emailSentAt", ">=", fourDaysAgo)
        .where("emailSentAt", "<=", threeDaysAgo)
        .limit(200)
        .get();

      if (candidates.empty) {
        console.log("[sendReviewRequestReminders] No candidates found.");
        return;
      }

      const mailwizz = new MailwizzAPI();

      for (const docSnap of candidates.docs) {
        processed++;
        const data = docSnap.data();
        const requestId = docSnap.id;

        if (data.reminderEmailSent === true) {
          skipped++;
          continue;
        }

        const { clientId, providerId, callSessionId } = data;
        if (!clientId || !providerId || !callSessionId) {
          skipped++;
          continue;
        }

        try {
          // Idempotency: skip if review already submitted
          const reviewSnap = await db
            .collection("reviews")
            .where("callId", "==", callSessionId)
            .where("clientId", "==", clientId)
            .limit(1)
            .get();

          if (!reviewSnap.empty) {
            await docSnap.ref.update({
              reminderEmailSkipped: true,
              reminderEmailSkippedReason: "review_already_submitted",
              reminderEmailSkippedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            skipped++;
            continue;
          }

          const [clientDoc, providerDoc] = await Promise.all([
            db.collection("users").doc(clientId).get(),
            db.collection("users").doc(providerId).get(),
          ]);

          if (!clientDoc.exists) {
            skipped++;
            continue;
          }

          const client = clientDoc.data();
          const provider = providerDoc.exists ? providerDoc.data() : null;
          const lang =
            data.emailLanguage ||
            getLanguageCode(
              client?.language || client?.preferredLanguage || client?.lang || "en"
            );
          const providerName =
            provider?.firstName || provider?.name || (data.serviceType === "lawyer_call" ? "votre avocat" : "votre expert expatrié");

          const clientFields = mapUserToMailWizzFields(client!, clientId);

          await mailwizz.sendTransactional({
            to: client?.email || clientId,
            template: `TR_CLI_review-reminder_${lang}`,
            customFields: {
              ...clientFields,
              EXPERT_NAME: providerName,
              REVIEW_URL: `https://sos-expat.com/review/${requestId}`,
            },
          });

          await docSnap.ref.update({
            reminderEmailSent: true,
            reminderEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          await logGA4Event("review_reminder_email_sent", {
            user_id: clientId,
            provider_id: providerId,
            call_id: callSessionId,
            email_language: String(lang).toLowerCase(),
          });

          sent++;
        } catch (perDocError: any) {
          console.error(`[sendReviewRequestReminders] error on ${requestId}:`, perDocError);
          await docSnap.ref
            .update({
              reminderEmailError: perDocError?.message || String(perDocError),
              reminderEmailErrorAt: admin.firestore.FieldValue.serverTimestamp(),
            })
            .catch(() => {});
        }
      }

      console.log(
        `[sendReviewRequestReminders] processed=${processed}, sent=${sent}, skipped=${skipped}`
      );
    } catch (error: any) {
      console.error("[sendReviewRequestReminders] fatal error:", error);
    }
  }
);

/**
 * FUNCTION 4: Handle Payment Received
 * Trigger: onCreate on payments/{paymentId}
 */
export const handlePaymentReceived = onDocumentCreated(
  {
    document: "payments/{paymentId}",
    region: "europe-west3",
    cpu: 0.083,
  },
  async (event) => {
    const payment = event.data?.data();
    const paymentId = event.params.paymentId;

    if (!payment || !event.data) {
      console.warn(`⚠️ No payment data for ${paymentId}`);
      return;
    }

    // P2-2 FIX: Check if payment succeeded using unified utility
    if (isPaymentCompleted(payment.status)) {
      try {
        const mailwizz = new MailwizzAPI();

        // Get user data
        const userDoc = await admin
          .firestore()
          .collection("users")
          .doc(payment.userId || payment.clientId)
          .get();

        if (!userDoc.exists) {
          console.warn(`⚠️ User not found for payment ${paymentId}`);
          return;
        }

        const user = userDoc.data();
        const lang = getLanguageCode(
          user?.language || user?.preferredLanguage || user?.lang || "en"
        );

        const userFields = mapUserToMailWizzFields(user!, payment.userId || payment.clientId);
        await mailwizz.sendTransactional({
          to: user?.email || payment.userId || payment.clientId,
          template: `TR_CLI_payment-success_${lang}`,
          customFields: {
            ...userFields,
            AMOUNT: (payment.amount || 0).toString(),
            CURRENCY: payment.currency || "EUR",
            INVOICE_URL: payment.invoiceUrl || "https://sos-expat.com/dashboard",
          },
        });

        await logGA4Event("payment_received", {
          user_id: payment.userId || payment.clientId,
          payment_id: paymentId,
          amount: payment.amount || 0,
          currency: payment.currency || "EUR",
        });

        console.log(`✅ Payment receipt sent: ${paymentId}`);
      } catch (error: any) {
        console.error(`❌ Error in handlePaymentReceived for ${paymentId}:`, error);
      }
    }
  }
);

/**
 * FUNCTION 5: Handle Payment Failed
 * Trigger: onCreate on payments/{paymentId}
 */
export const handlePaymentFailed = onDocumentCreated(
  {
    document: "payments/{paymentId}",
    region: "europe-west3",
    cpu: 0.083,
  },
  async (event) => {
    const payment = event.data?.data();
    const paymentId = event.params.paymentId;

    if (!payment || !event.data) {
      return;
    }

    // Check if payment failed
    if (payment.status === "failed") {
      try {
        const mailwizz = new MailwizzAPI();

        // Get user data
        const userDoc = await admin
          .firestore()
          .collection("users")
          .doc(payment.userId || payment.clientId)
          .get();

        if (!userDoc.exists) {
          console.warn(`⚠️ User not found for payment ${paymentId}`);
          return;
        }

        const user = userDoc.data();
        const lang = getLanguageCode(
          user?.language || user?.preferredLanguage || user?.lang || "en"
        );

        const userFields = mapUserToMailWizzFields(user!, payment.userId || payment.clientId);
        await mailwizz.sendTransactional({
          to: user?.email || payment.userId || payment.clientId,
          template: `TR_CLI_payment-failed_${lang}`,
          customFields: {
            ...userFields,
            AMOUNT: (payment.amount || 0).toString(),
            CURRENCY: payment.currency || "EUR",
            REASON: payment.failureReason || payment.reason || "Unknown error",
            RETRY_URL: "https://sos-expat.com/dashboard",
          },
        });

        await logGA4Event("payment_failed", {
          user_id: payment.userId || payment.clientId,
          payment_id: paymentId,
          amount: payment.amount || 0,
          reason: payment.failureReason || payment.reason || "Unknown",
        });

        console.log(`✅ Payment failed notification sent: ${paymentId}`);
      } catch (error: any) {
        console.error(`❌ Error in handlePaymentFailed for ${paymentId}:`, error);
      }
    }
  }
);

/**
 * FUNCTION 6: Handle Payout Requested
 * Trigger: onCreate on payouts/{payoutId}
 */
export const handlePayoutRequested = onDocumentCreated(
  {
    document: "payouts/{payoutId}",
    region: "europe-west3",
    cpu: 0.083,
  },
  async (event) => {
    const payout = event.data?.data();
    const payoutId = event.params.payoutId;

    if (!payout || !event.data) {
      console.warn(`⚠️ No payout data for ${payoutId}`);
      return;
    }

    try {
      const mailwizz = new MailwizzAPI();

      // Get provider data
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(payout.providerId)
        .get();

      if (!userDoc.exists) {
        console.warn(`⚠️ Provider ${payout.providerId} not found`);
        return;
      }

      const user = userDoc.data();
      const lang = getLanguageCode(
        user?.language || user?.preferredLanguage || user?.lang || "en"
      );

      const userFields = mapUserToMailWizzFields(user!, payout.providerId);
      await mailwizz.sendTransactional({
        to: user?.email || payout.providerId,
        template: `TR_PRO_payout-requested_${lang}`,
        customFields: {
          ...userFields,
          AMOUNT: (payout.amount || 0).toString(),
          CURRENCY: payout.currency || "EUR",
          THRESHOLD: (user?.payoutThreshold || 50).toString(),
        },
      });

      await logGA4Event("payout_requested", {
        user_id: payout.providerId,
        payout_id: payoutId,
        amount: payout.amount || 0,
        currency: payout.currency || "EUR",
      });

      console.log(`✅ Payout requested notification sent: ${payoutId}`);
    } catch (error: any) {
      console.error(`❌ Error in handlePayoutRequested for ${payoutId}:`, error);
    }
  }
);

/**
 * FUNCTION 7: Handle Payout Sent
 * Trigger: onUpdate on payouts/{payoutId}
 */
export const handlePayoutSent = onDocumentUpdated(
  {
    document: "payouts/{payoutId}",
    region: "europe-west3",
    cpu: 0.083,
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const payoutId = event.params.payoutId;

    if (!before || !after) {
      return;
    }

    // Only process when status changes to sent
    if (before.status !== "sent" && after.status === "sent") {
      try {
        const mailwizz = new MailwizzAPI();

        // Get provider data
        const userDoc = await admin
          .firestore()
          .collection("users")
          .doc(after.providerId)
          .get();

        if (!userDoc.exists) {
          console.warn(`⚠️ Provider ${after.providerId} not found`);
          return;
        }

        const user = userDoc.data();
        const lang = getLanguageCode(
          user?.language || user?.preferredLanguage || user?.lang || "en"
        );

        const userFields = mapUserToMailWizzFields(user!, after.providerId);
        await mailwizz.sendTransactional({
          to: user?.email || after.providerId,
          template: `TR_PRO_payout-sent_${lang}`,
          customFields: {
            ...userFields,
            AMOUNT: (after.amount || 0).toString(),
            CURRENCY: after.currency || "EUR",
            THRESHOLD: (user?.payoutThreshold || 50).toString(),
          },
        });

        await logGA4Event("payout_sent", {
          user_id: after.providerId,
          payout_id: payoutId,
          amount: after.amount || 0,
          currency: after.currency || "EUR",
        });

        console.log(`✅ Payout sent notification: ${payoutId}`);
      } catch (error: any) {
        console.error(`❌ Error in handlePayoutSent for ${payoutId}:`, error);
      }
    }
  }
);

/**
 * FUNCTION: Handle Call Missed
 * Trigger: onUpdate on calls/{callId} — status changes to "missed" or "no_answer"
 * Sends a missed call notification to the provider
 * 4 template variants selected based on consecutive missed calls count
 */
export const handleCallMissed = onDocumentUpdated(
  {
    document: "call_sessions/{sessionId}",
    region: "europe-west3",
    cpu: 0.083,
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const sessionId = event.params.sessionId;

    if (!before || !after) return;

    const missedStatuses = ["missed", "no_answer", "unanswered"];
    const wasMissed = missedStatuses.includes(before.status);
    const isMissed = missedStatuses.includes(after.status);

    if (!wasMissed && isMissed) {
      try {
        const mailwizz = new MailwizzAPI();

        const providerDoc = await admin
          .firestore()
          .collection("users")
          .doc(after.providerId)
          .get();

        if (!providerDoc.exists) return;

        const provider = providerDoc.data();
        const lang = getLanguageCode(
          provider?.language || provider?.preferredLanguage || "en"
        );

        // Select variant based on consecutive missed calls (1-4)
        const consecutiveMissed = Math.min(
          provider?.consecutiveMissedCalls || after.attemptNumber || 1,
          4
        );
        const variant = consecutiveMissed.toString().padStart(2, "0");

        const clientName = after.clientName || after.clientFirstName || "";

        const providerFields = mapUserToMailWizzFields(provider!, after.providerId);
        await mailwizz.sendTransactional({
          to: provider?.email || after.providerId,
          template: `TR_PRO_call-missed-${variant}_${lang}`,
          customFields: {
            ...providerFields,
            CLIENT_NAME: clientName,
          },
        });

        await logGA4Event("call_missed_email_sent", {
          call_id: sessionId,
          provider_id: after.providerId,
          variant,
        });

        console.log(`✅ Call missed email sent (variant ${variant}): ${sessionId}`);
      } catch (error: any) {
        console.error(`❌ Error in handleCallMissed for ${sessionId}:`, error);
      }
    }
  }
);

/**
 * FUNCTION: Handle Payout Failed
 * Trigger: onUpdate on payouts/{payoutId} — status changes to "failed"
 */
export const handlePayoutFailed = onDocumentUpdated(
  {
    document: "payouts/{payoutId}",
    region: "europe-west3",
    cpu: 0.083,
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const payoutId = event.params.payoutId;

    if (!before || !after) return;

    if (before.status !== "failed" && after.status === "failed") {
      try {
        const mailwizz = new MailwizzAPI();

        const userDoc = await admin
          .firestore()
          .collection("users")
          .doc(after.providerId)
          .get();

        if (!userDoc.exists) return;

        const user = userDoc.data();
        const lang = getLanguageCode(
          user?.language || user?.preferredLanguage || "en"
        );

        const userFields = mapUserToMailWizzFields(user!, after.providerId);
        await mailwizz.sendTransactional({
          to: user?.email || after.providerId,
          template: `TR_PRO_payout-failed_${lang}`,
          customFields: {
            ...userFields,
            AMOUNT: (after.amount || 0).toString(),
            CURRENCY: after.currency || "EUR",
            REASON: after.failureReason || after.reason || "Unknown error",
          },
        });

        await logGA4Event("payout_failed_email_sent", {
          user_id: after.providerId,
          payout_id: payoutId,
          amount: after.amount || 0,
          reason: after.failureReason || after.reason || "Unknown",
        });

        console.log(`✅ Payout failed notification sent: ${payoutId}`);
      } catch (error: any) {
        console.error(`❌ Error in handlePayoutFailed for ${payoutId}:`, error);
      }
    }
  }
);

/**
 * FUNCTION: Handle Payout Threshold Reached
 * Trigger: onUpdate on users/{userId} — totalEarnings crosses the payout threshold
 */
export const handlePayoutThresholdReached = onDocumentUpdated(
  {
    document: "users/{userId}",
    region: "europe-west3",
    cpu: 0.083,
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const userId = event.params.userId;

    if (!before || !after) return;

    // Only for providers
    if (after.role !== "provider" && after.role !== "lawyer") return;

    const threshold = after.payoutThreshold || 50;
    const oldTotal = before.totalEarnings || 0;
    const newTotal = after.totalEarnings || 0;

    // Only fire when threshold is crossed (not on every update)
    if (oldTotal < threshold && newTotal >= threshold) {
      try {
        const mailwizz = new MailwizzAPI();
        const lang = getLanguageCode(
          after.language || after.preferredLanguage || "en"
        );

        const userFields = mapUserToMailWizzFields(after, userId);
        await mailwizz.sendTransactional({
          to: after.email || userId,
          template: `TR_PRO_payout-threshold-reached_${lang}`,
          customFields: {
            ...userFields,
            THRESHOLD: threshold.toString(),
            AMOUNT: newTotal.toString(),
          },
        });

        await logGA4Event("payout_threshold_reached", {
          user_id: userId,
          threshold,
          total_earnings: newTotal,
        });

        console.log(`✅ Payout threshold reached email sent: ${userId}`);
      } catch (error: any) {
        console.error(`❌ Error in handlePayoutThresholdReached for ${userId}:`, error);
      }
    }
  }
);

/**
 * FUNCTION: Handle First Earning
 * Trigger: onUpdate on users/{userId} — totalEarnings goes from 0 to > 0
 */
export const handleFirstEarning = onDocumentUpdated(
  {
    document: "users/{userId}",
    region: "europe-west3",
    cpu: 0.083,
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const userId = event.params.userId;

    if (!before || !after) return;

    // Only for providers
    if (after.role !== "provider" && after.role !== "lawyer") return;

    const oldTotal = before.totalEarnings || 0;
    const newTotal = after.totalEarnings || 0;

    // Only fire for first ever earning (0 → >0)
    if (oldTotal === 0 && newTotal > 0) {
      try {
        const mailwizz = new MailwizzAPI();
        const lang = getLanguageCode(
          after.language || after.preferredLanguage || "en"
        );

        const userFields = mapUserToMailWizzFields(after, userId);
        await mailwizz.sendTransactional({
          to: after.email || userId,
          template: `TR_PRO_first-earning_${lang}`,
          customFields: {
            ...userFields,
            AMOUNT: newTotal.toString(),
            CURRENCY: "EUR",
          },
        });

        await logGA4Event("first_earning", {
          user_id: userId,
          amount: newTotal,
        });

        console.log(`✅ First earning email sent: ${userId}`);
      } catch (error: any) {
        console.error(`❌ Error in handleFirstEarning for ${userId}:`, error);
      }
    }
  }
);

/**
 * FUNCTION: Handle Earning Credited
 * Trigger: onUpdate on users/{userId} — totalEarnings increases (not first earning)
 * Notifies the provider when a new earning is credited after a call
 */
export const handleEarningCredited = onDocumentUpdated(
  {
    document: "users/{userId}",
    region: "europe-west3",
    // P0 HOTFIX 2026-05-03: 0.083→0.167. Gen2 ratio cap pour 512MiB (cf. 58c059b3).
    cpu: 0.167,
    // P0 HOTFIX 2026-05-03: bump 256→512MiB. OOM observé 258 MiB.
    memory: "512MiB",
    // P1 FIX 2026-05-03 (round 4): wire SENTRY_DSN so initSentry() resolves.
    secrets: [SENTRY_DSN],
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const userId = event.params.userId;

    if (!before || !after) return;

    // Only for providers
    if (after.role !== "provider" && after.role !== "lawyer") return;

    const oldTotal = before.totalEarnings || 0;
    const newTotal = after.totalEarnings || 0;

    // Only fire when earnings increase (but NOT for first earning — handleFirstEarning handles that)
    if (oldTotal > 0 && newTotal > oldTotal) {
      const earnedAmount = newTotal - oldTotal;

      try {
        const mailwizz = new MailwizzAPI();
        const lang = getLanguageCode(
          after.language || after.preferredLanguage || "en"
        );

        // Try to find the most recent completed call to get the client name
        // Uses single-field index only (providerId) to avoid requiring composite index
        let clientName = "";
        try {
          const recentCallsSnap = await admin
            .firestore()
            .collection("calls")
            .where("providerId", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(5)
            .get();

          const lastCompletedCall = recentCallsSnap.docs
            .map((d) => d.data())
            .find((c) => c.status === "completed");

          if (lastCompletedCall) {
            clientName = lastCompletedCall.clientName || lastCompletedCall.clientFirstName || "";
            if (!clientName && lastCompletedCall.clientId) {
              const clientDoc = await admin
                .firestore()
                .collection("users")
                .doc(lastCompletedCall.clientId)
                .get();
              clientName = clientDoc.data()?.firstName || "";
            }
          }
        } catch {
          // Client name is optional — continue without it
        }

        const userFields = mapUserToMailWizzFields(after, userId);
        await mailwizz.sendTransactional({
          to: after.email || userId,
          template: `TR_PRO_earning-credited_${lang}`,
          customFields: {
            ...userFields,
            AMOUNT: earnedAmount.toString(),
            CURRENCY: "EUR",
            CLIENT_NAME: clientName,
            TOTAL_EARNINGS: newTotal.toString(),
          },
        });

        await logGA4Event("earning_credited", {
          user_id: userId,
          amount: earnedAmount,
          total_earnings: newTotal,
        });

        console.log(`✅ Earning credited email sent: ${userId} (+${earnedAmount})`);
      } catch (error: any) {
        console.error(`❌ Error in handleEarningCredited for ${userId}:`, error);
      }
    }
  }
);

/**
 * FUNCTION: Handle Referral Bonus
 * Trigger: onCreate on referral_bonuses/{bonusId}
 * Notifies the referrer when they earn a bonus from a referral
 */
export const handleReferralBonus = onDocumentCreated(
  {
    document: "referral_bonuses/{bonusId}",
    region: "europe-west3",
    cpu: 0.083,
  },
  async (event) => {
    const bonus = event.data?.data();
    const bonusId = event.params.bonusId;

    if (!bonus || !event.data) return;

    const { referrerId, referralName, bonusAmount, currency } = bonus;

    if (!referrerId) {
      console.warn(`⚠️ No referrerId for bonus ${bonusId}`);
      return;
    }

    try {
      const mailwizz = new MailwizzAPI();

      const referrerDoc = await admin
        .firestore()
        .collection("users")
        .doc(referrerId)
        .get();

      if (!referrerDoc.exists) return;

      const referrer = referrerDoc.data();
      const lang = getLanguageCode(
        referrer?.language || referrer?.preferredLanguage || "en"
      );

      const referrerFields = mapUserToMailWizzFields(referrer!, referrerId);
      await mailwizz.sendTransactional({
        to: referrer?.email || referrerId,
        template: `TR_PRO_referral-bonus_${lang}`,
        customFields: {
          ...referrerFields,
          REFERRAL_NAME: referralName || "",
          BONUS_AMOUNT: (bonusAmount || 0).toString(),
          CURRENCY: currency || "EUR",
        },
      });

      await logGA4Event("referral_bonus_email_sent", {
        referrer_id: referrerId,
        bonus_id: bonusId,
        bonus_amount: bonusAmount || 0,
      });

      console.log(`✅ Referral bonus email sent: ${bonusId}`);
    } catch (error: any) {
      console.error(`❌ Error in handleReferralBonus for ${bonusId}:`, error);
    }
  }
);

