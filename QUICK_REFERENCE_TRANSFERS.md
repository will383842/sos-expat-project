# Quick Reference: Automatic Provider Transfers

## ✅ What Was Implemented

**Automatic 85/15 Split Payment System**

After every successful call:
- 💰 **15%** stays in SOS Expat account (platform commission)
- 💸 **85%** automatically transferred to provider's Stripe account

---

## 🔍 How to Verify It's Working

### 1. Check Call Session
```javascript
// In Firebase Console → Firestore → call_sessions
{
  payment: {
    status: "captured",
    amount: 49,
    transferId: "tr_xxxxx",              // ✅ Should exist
    transferredAt: Timestamp,            // ✅ Should exist
    transferStatus: "succeeded"          // ✅ Should be "succeeded"
  }
}
```

### 2. Check Transfers Collection
```javascript
// New collection: transfers
{
  transferId: "tr_xxxxx",
  providerId: "provider_uid",
  amount: 41.65,                         // 85% of 49 EUR
  status: "succeeded",
  sessionId: "call_session_xxx",
  createdAt: Timestamp
}
```

### 3. Check Stripe Dashboard
- Go to: https://dashboard.stripe.com/transfers
- Filter by: Transfer Group = `call_session_xxx`
- Verify: Transfer to provider's Connect account

---

## ⚠️ What If Transfer Fails?

### The call still succeeds! 
- ✅ Client is charged
- ✅ Payment captured
- ✅ Invoices created
- ❌ Transfer failed (logged)

Money stays in your account for manual processing.

### Check Failed Transfers
```javascript
// Query in Firestore
db.collection('call_sessions')
  .where('payment.transferStatus', '==', 'failed')
  .get()

// Check the reason
payment: {
  transferStatus: "failed",
  transferFailureReason: "Provider has not completed Stripe onboarding"
}
```

---

## 🎯 Common Issues & Solutions

| Issue | Reason | Solution |
|-------|--------|----------|
| No `transferId` | Provider not KYC verified | Tell provider to complete verification |
| `transferStatus: "failed"` | Provider missing bank account | Provider needs to add payout method |
| `charges_enabled: false` | KYC incomplete | Check AdminKYCProviders panel |
| No `stripeAccountId` | Provider never registered | Provider must complete onboarding |

---

## 📊 Money Reconciliation

### For 49 EUR lawyer call:

**In Your Stripe Account:**
- Received from client: +49.00 EUR
- Transferred to provider: -41.65 EUR
- Stripe transfer fee: ~-0.25 EUR
- **Net in your account: ~7.10 EUR** (14.5% after fees)

**In Provider's Stripe Account:**
- Received from platform: +41.65 EUR
- **Provider gets: 41.65 EUR** (85% - no fees deducted)

---

## 🔧 Testing in Development

### Test Mode Transfers
1. Use test Stripe accounts
2. Transfers appear in Stripe test dashboard
3. No real money moves
4. Can reverse/cancel anytime

### To Test:
1. Create a test provider with KYC completed
2. Make a test call
3. Check Firestore for `transferId`
4. Verify in Stripe Dashboard → Transfers

---

## 📞 When to Contact Support

Contact Stripe if:
- Transfers show as "pending" for > 24 hours
- Multiple transfers failing with same provider
- Provider reports not receiving funds after 2-3 business days

---

**Last Updated**: November 11, 2025
**Implemented By**: AI Assistant
**Status**: ✅ Production Ready

