import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getStripe } from "./index";

interface CreateAccountData {
  email: string;
  currentCountry: string;
  firstName?: string;
  lastName?: string;
  userType: "lawyer" | "expat"; // ✅ NEW: Key to differentiate
}

export const createStripeAccount = onCall<CreateAccountData>(
  { region: "europe-west1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const userId = request.auth.uid;
    const { email, currentCountry, userType } = request.data;
    const stripe = getStripe();

    if (!stripe) {
      throw new HttpsError("internal", "Stripe is not configured");
    }

    // ✅ Validate userType
    if (!userType || !["lawyer", "expat"].includes(userType)) {
      throw new HttpsError("invalid-argument", "userType must be 'lawyer' or 'expat'");
    }

    try {
      console.log(`🚀 Creating Stripe account for ${userType}:`, userId);

      // Create Stripe Express Account
      const account = await stripe.accounts.create({
        type: "express",
        country: currentCountry || "FR",
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      console.log("✅ Stripe account created:", account.id);

      const stripeData = {
        stripeAccountId: account.id,
        kycStatus: "not_started",
        stripeOnboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // ✅ Save to correct collection based on userType
      const collectionName = userType === "lawyer" ? "lawyers" : "expats";

      await Promise.all([
        // Save to type-specific collection
        admin
          .firestore()
          .collection(collectionName)
          .doc(userId)
          .set(
            {
              ...stripeData,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          ),

        // Also save to users collection
        admin
          .firestore()
          .collection("users")
          .doc(userId)
          .set(stripeData, { merge: true }),
      ]);

      console.log(`✅ Saved to ${collectionName} and users collections`);

      return {
        success: true,
        accountId: account.id,
        message: "Stripe account created successfully",
      };
    } catch (error: any) {
      console.error("❌ Failed to create Stripe account:", error);
      throw new HttpsError(
        "internal",
        error.message || "Failed to create account"
      );
    }
  }
);
