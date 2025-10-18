import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getStripe } from "./index";

interface LawyerOnboardingData {
  // Personal info
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string; // YYYY-MM-DD format
  phone: string;
  whatsapp: string;
  
  // Address
  address: string;
  currentCountry: string;
  currentPresenceCountry: string;
  
  // Identity
  panNumber: string;
  panDocument?: string; // URL to uploaded document
  
  // Bank details
  bankAccountNumber: string;
  ifscCode: string;
  
  // Professional info (optional)
  profilePhoto?: string;
  bio?: string;
  specialties?: string[];
  practiceCountries?: string[];
  yearsOfExperience?: number;
}

// ✅ THIS IS THE COMBINED ALL-IN-ONE FUNCTION
export const completeLawyerOnboarding = onCall<LawyerOnboardingData>(
  async (request) => {
    // 1. Check authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const userId = request.auth.uid;
    const data = request.data;
    const stripe = getStripe();

    if (!stripe) {
      throw new HttpsError("internal", "Stripe is not configured");
    }

    try {
      console.log("🚀 Starting lawyer onboarding for user:", userId);

      // ==========================================
      // STEP 1: Create Stripe Custom Account
      // ==========================================
      console.log("📝 Creating Stripe Custom Account...");
      
      const account = await stripe.accounts.create({
        type: "custom",
        country: data.currentCountry || "FR",
        email: data.email,
        business_type: "individual",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        tos_acceptance: {
          date: Math.floor(Date.now() / 1000),
          ip: request.rawRequest.ip || "unknown",
        },
      });

      console.log("✅ Stripe account created:", account.id);

      // ==========================================
      // STEP 2: Submit KYC Data
      // ==========================================
      console.log("📋 Submitting KYC data...");

      // Parse date of birth
      const [year, month, day] = data.dateOfBirth.split("-").map(Number);

      await stripe.accounts.update(account.id, {
        business_profile: {
          mcc: "7399", // Professional services
          url: "https://sosexpat.com",
        },
        individual: {
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone,
          dob: {
            day: day,
            month: month,
            year: year,
          },
          address: {
            line1: data.address,
            city: data.currentPresenceCountry,
            state: data.currentPresenceCountry,
            postal_code: "00000",
            country: data.currentCountry,
          },
          id_number: data.panNumber,
        },
      });

      console.log("✅ KYC data submitted");

      // ==========================================
      // STEP 3: Upload Identity Document (if provided)
      // ==========================================
      if (data.panDocument) {
        console.log("📸 Uploading identity document...");

        try {
          const response = await fetch(data.panDocument);
          const blob = await response.blob();
          const buffer = Buffer.from(await blob.arrayBuffer());

          const file = await stripe.files.create({
            purpose: "identity_document",
            file: {
              data: buffer,
              name: "identity_document.jpg",
              type: "application/octet-stream",
            },
          });

          await stripe.accounts.update(account.id, {
            individual: {
              verification: {
                document: {
                  front: file.id,
                },
              },
            },
          });

          console.log("✅ Identity document uploaded:", file.id);
        } catch (docError) {
          console.warn("⚠️ Document upload failed:", docError);
        }
      }

      // ==========================================
      // STEP 4: Add Bank Account
      // ==========================================
      console.log("🏦 Adding bank account...");

      await stripe.accounts.createExternalAccount(account.id, {
        external_account: {
          object: "bank_account",
          country: data.currentCountry,
          currency: data.currentCountry === "FR" ? "eur" : "inr",
          account_number: data.bankAccountNumber,
          routing_number: data.ifscCode,
        },
      });

      console.log("✅ Bank account added");

      // ==========================================
      // STEP 5: Update Firestore
      // ==========================================
      console.log("💾 Updating Firestore...");

      const lawyerRef = admin.firestore().collection("lawyers").doc(userId);

      await lawyerRef.set(
        {
          stripeAccountId: account.id,
          kycStatus: "pending",
          kycSubmitted: true,
          
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: `${data.firstName} ${data.lastName}`,
          email: data.email,
          dateOfBirth: data.dateOfBirth,
          phone: data.phone,
          whatsapp: data.whatsapp,
          
          address: data.address,
          currentCountry: data.currentCountry,
          currentPresenceCountry: data.currentPresenceCountry,
          
          panNumber: data.panNumber,
          panDocument: data.panDocument,
          
          bankAccountNumber: data.bankAccountNumber,
          ifscCode: data.ifscCode,
          bankAccountAdded: true,
          
          profilePhoto: data.profilePhoto || null,
          bio: data.bio || null,
          specialties: data.specialties || [],
          practiceCountries: data.practiceCountries || [],
          yearsOfExperience: data.yearsOfExperience || 0,
          
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log("✅ Firestore updated");

      // ==========================================
      // STEP 6: Get account status
      // ==========================================
      const updatedAccount = await stripe.accounts.retrieve(account.id);

      const status = {
        detailsSubmitted: updatedAccount.details_submitted,
        chargesEnabled: updatedAccount.charges_enabled,
        payoutsEnabled: updatedAccount.payouts_enabled,
        requirements: updatedAccount.requirements,
      };

      console.log("📊 Account status:", status);

      return {
        success: true,
        accountId: account.id,
        status: status,
        message: {
          en: "Registration successful! Your profile will be validated within 24h.",
          fr: "Inscription réussie ! Votre profil sera validé sous 24h.",
        },
      };
    } catch (error: any) {
      console.error("❌ Lawyer onboarding failed:", error);
      throw new HttpsError(
        "internal",
        error.message || "Onboarding failed. Please try again."
      );
    }
  }
);
