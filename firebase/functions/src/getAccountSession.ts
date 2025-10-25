import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getStripe } from "./index";

export const getStripeAccountSession = onCall(
  {
    region: "europe-west1",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const userId = request.auth.uid;
    const stripe = getStripe();

    if (!stripe) {
      throw new HttpsError("internal", "Stripe is not configured");
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
      const accountId = lawyerData?.stripeAccountId;

      if (!accountId) {
        throw new HttpsError("failed-precondition", "No Stripe account found");
      }

      console.log("🔗 Creating Account Session for:", accountId);

      // Create Account Session with FULL collection options
      const accountSession = await stripe.accountSessions.create({
        account: accountId,
        components: {
          account_onboarding: {
            enabled: true,
            features: {
              // ✅ ADD THESE FEATURES to collect everything in embedded form
              external_account_collection: true,  // Collects bank account
            },
          },
          payments: { enabled: true },
          payouts: { enabled: true },
        },
      });

      console.log("✅ Account Session created with full collection");

      return {
        success: true,
        accountId: accountId,
        clientSecret: accountSession.client_secret,
      };
    } catch (error: any) {
      console.error("❌ Failed to create account session:", error);
      throw new HttpsError(
        "internal",
        error.message || "Failed to get session"
      );
    }
  }
);
