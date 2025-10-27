import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getStripe } from "./index"; // Adjust import path as needed
import Stripe from "stripe";

export const checkStripeAccountStatus = onCall(
  { region: "europe-west1" },
  async (request) => {
    // Check authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const userId = request.auth.uid;
    const stripe = getStripe();

    if (!stripe) {
      throw new HttpsError("internal", "Stripe not configured");
    }

    try {
      // Get lawyer's Stripe account ID from Firestore
      const lawyerDoc = await admin
        .firestore()
        .collection("lawyers")
        .doc(userId)
        .get();

      if (!lawyerDoc.exists) {
        throw new HttpsError("not-found", "Lawyer profile not found");
      }

      const lawyerData = lawyerDoc.data();
      const accountId = lawyerData?.stripeAccountId as string | undefined;

      if (!accountId) {
        throw new HttpsError("failed-precondition", "No Stripe account found");
      }

      console.log("🔍 Checking Stripe account:", accountId);

      // Query Stripe directly for current status
      const account: Stripe.Account = await stripe.accounts.retrieve(accountId);

      // Safely access requirements with type checking
      const currentlyDue = account.requirements?.currently_due || [];
      const eventuallyDue = account.requirements?.eventually_due || [];
      const pastDue = account.requirements?.past_due || [];

      // Check completion status
      const isComplete =
        account.details_submitted === true &&
        account.charges_enabled === true &&
        currentlyDue.length === 0;

      console.log("📊 Account Status:", {
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        isComplete,
      });

      // Update Firestore with latest status
      await admin
        .firestore()
        .collection("lawyers")
        .doc(userId)
        .update({
          stripeAccountStatus: {
            detailsSubmitted: account.details_submitted || false,
            chargesEnabled: account.charges_enabled || false,
            payoutsEnabled: account.payouts_enabled || false,
            requirementsCurrentlyDue: currentlyDue,
            requirementsEventuallyDue: eventuallyDue,
            requirementsPastDue: pastDue,
            disabledReason: account.requirements?.disabled_reason || null,
            lastChecked: admin.firestore.FieldValue.serverTimestamp(),
          },
          kycCompleted: isComplete,
          kycCompletedAt: isComplete
            ? admin.firestore.FieldValue.serverTimestamp()
            : null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      if (isComplete) {
        const sosProfileRef = admin
          .firestore()
          .collection("sos_profiles")
          .doc(userId);
        const sosProfileDoc = await sosProfileRef.get();

        if (sosProfileDoc.exists) {
          await sosProfileRef.update({
            isApproved: true, // ✅ Matches your field
            isVisible: true, // ✅ Matches your field
            kycCompleted: true,
            kycCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log(
            "✅ Updated sos_profiles - Lawyer now visible in SOS route"
          );
        }
      }

      console.log(isComplete ? "✅ KYC Complete" : "⏳ KYC Incomplete");

      // Return status
      return {
        accountId: account.id,
        detailsSubmitted: account.details_submitted || false,
        chargesEnabled: account.charges_enabled || false,
        payoutsEnabled: account.payouts_enabled || false,
        requirementsCurrentlyDue: currentlyDue,
        requirementsEventuallyDue: eventuallyDue,
        kycCompleted: isComplete,
      };
    } catch (error: unknown) {
      // Proper error handling with type checking
      console.error("❌ Error checking account status:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new HttpsError(
        "internal",
        `Failed to check status: ${errorMessage}`
      );
    }
  }
);
