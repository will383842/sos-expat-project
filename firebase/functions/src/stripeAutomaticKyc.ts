// firebase/functions/src/StripeKYCManager.ts
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { HttpsError } from 'firebase-functions/v2/https';
import { logError } from './utils/logs/logError';
import { db } from './utils/firebase'; 

/* ===================================================================
 * Types
 * =================================================================== */


export interface CreateConnectedAccountData {
  email: string;
  country: string;
  firstName: string;
  lastName: string;
  businessType?: 'individual' | 'company';
}

export interface ConnectedAccountResult {
  success: boolean;
  accountId?: string;
  onboardingUrl?: string;
  error?: string;
}

export interface KYCStatusResult {
  accountId: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirementsCurrentlyDue: string[];
  requirementsPastDue: string[];
  disabledReason?: string;
}

/* ===================================================================
 * Utils
 * =================================================================== */

const isProd = process.env.NODE_ENV === 'production';

function inferModeFromKey(secret: string | undefined): 'live' | 'test' | undefined {
  if (!secret) return undefined;
  if (secret.startsWith('sk_live_')) return 'live';
  if (secret.startsWith('sk_test_')) return 'test';
  return undefined;
}

function assertIsSecretStripeKey(secret: string): void {
  if (!/^sk_(live|test)_[A-Za-z0-9]+$/.test(secret)) {
    if (secret.startsWith('rk_')) {
      throw new HttpsError(
        'failed-precondition',
        'La clé Stripe fournie est une "restricted key" (rk_*). Utilise une clé secrète (sk_*).'
      );
    }
    throw new HttpsError(
      'failed-precondition',
      'Clé Stripe invalide. Fournis une clé secrète (sk_live_* ou sk_test_*).'
    );
  }
}

function makeStripeClient(secret: string): Stripe {
  assertIsSecretStripeKey(secret);
  return new Stripe(secret, { apiVersion: '2023-10-16' });
}

/* ===================================================================
 * StripeKYCManager
 * =================================================================== */

export class StripeKYCManager {
  private db: admin.firestore.Firestore = db;
  private stripe: Stripe | null = null;
  private mode: 'live' | 'test' = isProd ? 'live' : 'test';

  private initializeStripe(secretKey: string): void {
    if (this.stripe) return;
    const detected = inferModeFromKey(secretKey);
    if (detected) this.mode = detected;
    this.stripe = makeStripeClient(secretKey);
  }

  private validateConfiguration(secretKey?: string): void {
    if (secretKey) {
      this.initializeStripe(secretKey);
      return;
    }

    const envMode: 'live' | 'test' =
      process.env.STRIPE_MODE === 'live' || process.env.STRIPE_MODE === 'test'
        ? (process.env.STRIPE_MODE as 'live' | 'test')
        : isProd
        ? 'live'
        : 'test';

    const keyFromEnv =
      envMode === 'live'
        ? process.env.STRIPE_SECRET_KEY_LIVE
        : process.env.STRIPE_SECRET_KEY_TEST;

    if (keyFromEnv) {
      this.initializeStripe(keyFromEnv);
      return;
    }

    if (process.env.STRIPE_SECRET_KEY) {
      this.initializeStripe(process.env.STRIPE_SECRET_KEY);
      return;
    }

    throw new HttpsError(
      'failed-precondition',
      'Aucune clé Stripe disponible pour KYC.'
    );
  }

  /* -------------------------------------------------------------------
   * Public API
   * ------------------------------------------------------------------- */

  /**
   * Create a Stripe Connected Account for a provider
   */
  async createConnectedAccount(
    data: CreateConnectedAccountData,
    providerId: string,
    secretKey?: string
  ): Promise<ConnectedAccountResult> {
    try {
      this.validateConfiguration(secretKey);
      if (!this.stripe) throw new HttpsError('internal', 'Stripe non initialisé');

      const { email, country, firstName, lastName, businessType = 'individual' } = data;

      // Validate provider exists
      const providerDoc = await this.db.collection('providers').doc(providerId).get();
      if (!providerDoc.exists) {
        throw new HttpsError('failed-precondition', 'Provider not found');
      }

      const providerData = providerDoc.data();
      if (providerData?.stripeAccountId) {
        throw new HttpsError(
          'failed-precondition',
          'Provider already has a Stripe account'
        );
      }

      console.log('Creating Stripe Connected Account:', {
        providerId: providerId.substring(0, 8) + '...',
        email,
        country,
        businessType,
        mode: this.mode,
      });

      // Create Stripe Connected Account
      const account = await this.stripe.accounts.create({
        type: 'express',
        country: country,
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: businessType,
        individual: businessType === 'individual' ? {
          first_name: firstName,
          last_name: lastName,
          email: email,
        } : undefined,
        settings: {
          payouts: {
            schedule: {
              interval: 'manual',
            },
          },
        },
        tos_acceptance: {
          service_agreement: 'recipient',
        },
        metadata: {
          providerId: providerId,
          environment: process.env.NODE_ENV || 'development',
          mode: this.mode,
        },
      });

      console.log('Stripe Connected Account created:', {
        accountId: account.id,
        providerId: providerId.substring(0, 8) + '...',
      });

      // Generate onboarding link
      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.APP_URL}/provider/onboarding/refresh`,
        return_url: `${process.env.APP_URL}/provider/dashboard`,
        type: 'account_onboarding',
      });

      // Update provider document
      await this.db.collection('providers').doc(providerId).update({
        stripeAccountId: account.id,
        kycStatus: 'pending',
        kycStartedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        accountId: account.id,
        onboardingUrl: accountLink.url,
      };
    } catch (error) {
      await logError('StripeKYCManager:createConnectedAccount', error);
      const msg =
        error instanceof HttpsError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Failed to create connected account';
      return { success: false, error: msg };
    }
  }

  /**
   * Check KYC status of a connected account
   */
  async checkKYCStatus(
    accountId: string,
    secretKey?: string
  ): Promise<KYCStatusResult | null> {
    try {
      this.validateConfiguration(secretKey);
      if (!this.stripe) throw new HttpsError('internal', 'Stripe non initialisé');

      const account = await this.stripe.accounts.retrieve(accountId);

      const kycStatus = 
        account.charges_enabled && account.payouts_enabled
          ? 'verified'
          : account.requirements?.disabled_reason
          ? 'rejected'
          : 'pending';

      return {
        accountId: account.id,
        kycStatus,
        chargesEnabled: account.charges_enabled || false,
        payoutsEnabled: account.payouts_enabled || false,
        requirementsCurrentlyDue: account.requirements?.currently_due || [],
        requirementsPastDue: account.requirements?.past_due || [],
        disabledReason: account.requirements?.disabled_reason || undefined,
      };
    } catch (error) {
      await logError('StripeKYCManager:checkKYCStatus', error);
      return null;
    }
  }

  /**
   * Handle Stripe webhook for account updates
   */
  async handleAccountUpdate(account: any): Promise<void> {
    try {
      const accountId = account.id;
      
      let kycStatus: 'pending' | 'verified' | 'rejected' = 'pending';
      const kycDetails: Record<string, any> = {};

      if (account.charges_enabled && account.payouts_enabled) {
        kycStatus = 'verified';
      } else if (account.requirements?.disabled_reason) {
        kycStatus = 'rejected';
        kycDetails.reason = account.requirements.disabled_reason;
        kycDetails.errors = account.requirements.errors || [];
      } else if (account.requirements?.currently_due?.length > 0) {
        kycStatus = 'pending';
        kycDetails.fieldsRequired = account.requirements.currently_due;
      }

      console.log('Processing account update:', {
        accountId: accountId.substring(0, 12) + '...',
        kycStatus,
      });

      // Find provider with this Stripe account
      const providersSnapshot = await this.db
        .collection('providers')
        .where('stripeAccountId', '==', accountId)
        .limit(1)
        .get();

      if (providersSnapshot.empty) {
        console.log('No provider found for account:', accountId);
        return;
      }

      const providerDoc = providersSnapshot.docs[0];
      const providerId = providerDoc.id;
      const providerData = providerDoc.data();

      // Update provider document
      await providerDoc.ref.update({
        kycStatus: kycStatus,
        kycDetails: kycDetails,
        kycLastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        chargesEnabled: account.charges_enabled || false,
        payoutsEnabled: account.payouts_enabled || false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create admin notification
      await this.db.collection('adminNotifications').add({
        type: 'kyc_update',
        providerId: providerId,
        providerName: `${providerData.firstName || ''} ${providerData.lastName || ''}`.trim(),
        providerEmail: providerData.email,
        status: kycStatus,
        details: kycDetails,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      });

      // Create provider notification
      await this.db.collection('notifications').add({
        userId: providerId,
        type: kycStatus === 'verified' ? 'kyc_verified' : 'kyc_update',
        title: this.getNotificationTitle(kycStatus),
        message: this.getNotificationMessage(kycStatus, kycDetails),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      });

      console.log(`KYC status updated for provider ${providerId}: ${kycStatus}`);
    } catch (error) {
      await logError('StripeKYCManager:handleAccountUpdate', error);
    }
  }

  /**
   * Transfer funds to provider's connected account
   */
  async transferToProvider(
    providerId: string,
    amount: number,
    paymentIntentId: string,
    secretKey?: string
  ): Promise<{ success: boolean; transferId?: string; error?: string }> {
    try {
      this.validateConfiguration(secretKey);
      if (!this.stripe) throw new HttpsError('internal', 'Stripe non initialisé');

      const providerDoc = await this.db.collection('providers').doc(providerId).get();
      if (!providerDoc.exists) {
        throw new HttpsError('failed-precondition', 'Provider not found');
      }

      const providerData = providerDoc.data();
      const stripeAccountId = providerData?.stripeAccountId;

      if (!stripeAccountId) {
        throw new HttpsError(
          'failed-precondition',
          'Provider does not have a Stripe account'
        );
      }

      if (providerData?.kycStatus !== 'verified') {
        throw new HttpsError(
          'failed-precondition',
          'Provider account not verified'
        );
      }

      const transfer = await this.stripe.transfers.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'eur',
        destination: stripeAccountId,
        metadata: {
          providerId: providerId,
          paymentIntentId: paymentIntentId,
          mode:this.mode,
        },
      });

      await this.db.collection('payments').doc(paymentIntentId).update({
        transferId: transfer.id,
        transferredAt: admin.firestore.FieldValue.serverTimestamp(),
        transferStatus: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, transferId: transfer.id };
    } catch (error) {
      await logError('StripeKYCManager:transferToProvider', error);
      const msg =
        error instanceof HttpsError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Failed to transfer';
      return { success: false, error: msg };
    }
  }

  /* -------------------------------------------------------------------
   * Private helpers
   * ------------------------------------------------------------------- */

  private getNotificationTitle(status: string): string {
    switch (status) {
      case 'verified':
        return 'Identity Verification Complete';
      case 'rejected':
        return 'Identity Verification Issue';
      default:
        return 'Identity Verification Update';
    }
  }

  private getNotificationMessage(status: string, details: Record<string, any>): string {
    switch (status) {
      case 'verified':
        return 'Your identity has been verified. You can now receive payments.';
      case 'rejected':
        return `Additional information needed: ${details.reason || 'Please check your account'}`;
      default:
        return 'Please complete your identity verification.';
    }
  }
}

/** Singleton instance */
export const stripeKYCManager = new StripeKYCManager();
