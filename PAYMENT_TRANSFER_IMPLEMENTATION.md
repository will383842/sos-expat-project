# Automatic Provider Payment Transfer Implementation

## 📋 Overview

This document explains the automatic Stripe Transfer system that pays providers their 85% share after successful calls.

---

## 💰 Money Flow

### Step 1: Client Payment
- Client pays **49 EUR** (example for lawyer call)
- Money goes to **SOS Expat main Stripe account**
- Payment captured immediately (`capture_method: 'automatic'`)

### Step 2: Commission Split Calculation
- **Platform commission**: 49 EUR × 15% = **7.35 EUR**
- **Provider share**: 49 EUR × 85% = **41.65 EUR**

### Step 3: Automatic Transfer (NEW)
- After successful call completion
- **41.65 EUR** transferred to provider's Stripe Connect account
- **7.35 EUR** stays in SOS Expat account (platform commission)

---

## 🔧 Implementation Details

### Files Modified

1. **`firebase/functions/src/StripeManager.ts`**
   - Added `transferToProvider()` method (lines 446-544)
   - Creates Stripe Transfer to provider's Connect account
   - Verifies provider has completed KYC
   - Records transfer in `transfers` collection

2. **`firebase/functions/src/TwilioCallManager.ts`**
   - Updated `CallSessionState` type to include transfer tracking (lines 99-102)
   - Integrated automatic transfer in `capturePaymentForSession()` (lines 1319-1386)
   - Added error handling and logging
   - Transfer happens after invoices are created

3. **`firestore.rules`**
   - Added security rules for `transfers` collection (lines 219-223)
   - Providers can read their own transfers
   - Only admins can create/update/delete

4. **`firestore.indexes.json`**
   - Added composite indexes for `transfers` collection
   - Index 1: `providerId` + `createdAt` (desc)
   - Index 2: `status` + `createdAt` (desc)

---

## 🔄 Transfer Process Flow

```
1. Call completes successfully
   ↓
2. Payment is captured (if not already)
   ↓
3. Review request created
   ↓
4. Invoices generated (platform + provider)
   ↓
5. Provider transfer initiated
   ├─ Get provider's stripeAccountId from sos_profiles
   ├─ Verify account.charges_enabled = true
   ├─ Create Stripe Transfer (85% of total)
   ├─ Record in transfers collection
   └─ Update call_session with transfer info
   ↓
6. Transfer status logged
```

---

## 📊 Database Schema

### CallSessionState.payment (Updated)
```typescript
{
  intentId: string;
  status: "pending" | "authorized" | "captured" | "refunded" | "failed";
  amount: number;
  capturedAt?: Timestamp;
  refundedAt?: Timestamp;
  failureReason?: string;
  // NEW FIELDS:
  transferId?: string;              // Stripe Transfer ID
  transferredAt?: Timestamp;        // When transfer completed
  transferStatus?: "pending" | "succeeded" | "failed";
  transferFailureReason?: string;   // Error if transfer failed
}
```

### transfers collection (NEW)
```typescript
{
  transferId: string;           // Stripe Transfer ID (e.g., "tr_...")
  providerId: string;           // Provider UID
  stripeAccountId: string;      // Provider's Stripe Connect account ID
  amount: number;               // Amount in EUR (e.g., 41.65)
  amountCents: number;          // Amount in cents (e.g., 4165)
  currency: string;             // "eur"
  sessionId: string;            // Call session ID
  status: string;               // Stripe transfer status
  createdAt: Timestamp;         // When created
  metadata: object;             // Additional info (serviceType, etc.)
  environment: string;          // "production" | "development"
}
```

---

## ⚙️ Configuration

### Prerequisites for Provider to Receive Payments

1. ✅ **Stripe Account Created**
   - Provider must complete registration
   - Stripe Connect account created via `createStripeAccount`

2. ✅ **KYC Completed**
   - Provider must complete identity verification
   - `account.details_submitted = true`
   - `account.charges_enabled = true`

3. ✅ **Bank Account Added**
   - Provider must add payout method
   - Done through Stripe Connect onboarding flow

If any prerequisite is missing, the transfer will fail gracefully and be logged.

---

## 🛡️ Error Handling

### Transfer Failures are NON-BLOCKING

If a transfer fails:
- ✅ Call still marked as successful
- ✅ Invoices still created
- ✅ Review request still sent
- ✅ Payment still captured
- ⚠️ Transfer marked as failed in session
- ⚠️ Failure logged for manual review
- ⚠️ Money stays in platform account for manual handling

### Common Failure Reasons

1. **Provider not KYC verified**
   - Error: "Provider account cannot receive payments yet"
   - Solution: Provider must complete Stripe onboarding

2. **No Stripe account**
   - Error: "Provider has not completed Stripe onboarding"
   - Solution: Provider must register and verify

3. **Charges not enabled**
   - Error: "Provider account cannot receive payments yet"
   - Solution: Provider must complete KYC verification

---

## 📈 Monitoring & Analytics

### Logs to Watch

```javascript
// Success
"✅ Transfer successful: tr_xxx"

// Failure  
"❌ Transfer failed: Provider has not completed Stripe onboarding"
"❌ Provider ${id} has no Stripe account - cannot transfer"
"❌ Provider ${id} charges not enabled"
```

### Call Records Created

- `provider_payment_transferred` - Transfer succeeded
- `provider_payment_transfer_failed` - Transfer failed

### Query Transfers

```javascript
// Get all transfers for a provider
db.collection('transfers')
  .where('providerId', '==', providerId)
  .orderBy('createdAt', 'desc')
  .get()

// Get failed transfers
db.collection('transfers')
  .where('status', '==', 'failed')
  .orderBy('createdAt', 'desc')
  .get()
```

---

## 🔐 Security

### Firestore Rules

```
match /transfers/{transferId} {
  // Providers can read their own transfers
  allow read: if (isAuthenticated() && request.auth.uid == resource.data.providerId) 
           || isAdmin() || isDev();
  
  // Only backend/admin can create transfers
  allow create, update, delete: if isAdmin() || isDev();
}
```

### Stripe Transfer Safety

- ✅ Only transfers to verified Stripe Connect accounts
- ✅ Validates charges_enabled before transfer
- ✅ Amount is always 85% (hardcoded in calculation)
- ✅ Transfer linked to session via `transfer_group`
- ✅ Metadata includes full audit trail

---

## 🚀 Next Steps

### Optional Enhancements

1. **Retry Logic**
   - Add automatic retry for failed transfers
   - Implement exponential backoff

2. **Admin Dashboard**
   - Build `AdminFinancePayouts.tsx` to view all transfers
   - Add manual retry button for failed transfers
   - Show transfer statistics

3. **Provider Dashboard**
   - Show transfer history in provider dashboard
   - Display pending/completed transfers
   - Link to Stripe Express dashboard

4. **Notifications**
   - Send email/SMS to provider when transfer succeeds
   - Alert admin when transfers fail
   - Weekly payout summary

---

## ⚠️ Important Notes

### Platform Commission is Protected

The 15% platform commission **automatically stays in your account**. The transfer only sends the calculated 85% provider share. Your commission is never at risk.

### Transfer Timing

Transfers happen **immediately after call completion**, not on a schedule. This gives providers instant access to their earnings.

### Stripe Fees

Stripe charges a small fee for transfers (~0.25 EUR). This comes out of the platform's 15% commission, not the provider's share.

### Test Mode

In test mode, transfers use Stripe test accounts. No real money moves. Perfect for testing the full flow.

---

## 📞 Support

If transfers fail consistently:
1. Check provider's KYC status in `AdminKYCProviders`
2. Verify provider's Stripe account in Stripe Dashboard
3. Review `call_records` for `provider_payment_transfer_failed` entries
4. Check `transfers` collection for failed transfers
5. Manually process via Stripe Dashboard if needed

---

**Implementation Date**: November 11, 2025
**Version**: 1.0
**Status**: ✅ Deployed and Active

