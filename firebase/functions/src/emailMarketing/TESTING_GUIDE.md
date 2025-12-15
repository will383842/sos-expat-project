# Testing Guide - Email Marketing Automation

## ⚠️ Important: Configuration Fix

**Before testing**, ensure the API key is properly configured as a secret (not hardcoded).

### Fix Configuration Issue

The `defineSecret` function expects a **secret name**, not the actual secret value. The config has been fixed, but you need to set the secret value:

```bash
# Set the MailWizz API key as a Firebase secret
firebase functions:secrets:set MAILWIZZ_API_KEY
# When prompted, enter: 63f17459fa45961cbb742a61ddebc157169bd3c1

# Set webhook secret (generate a random secret)
firebase functions:secrets:set MAILWIZZ_WEBHOOK_SECRET
# Enter a secure random string
```

## 📋 Pre-Testing Checklist

- [ ] Install dependencies: `cd firebase/functions && npm install`
- [ ] Build functions: `npm run build`
- [ ] Set Firebase Functions secrets (see above)
- [ ] Ensure Firebase project is selected: `firebase use sos-expat-prod` (or your project)
- [ ] Have test user accounts ready in Firebase

## 🧪 Testing Methods

### Method 1: Local Emulator Testing

#### Setup Local Emulator

```bash
# Start Firebase emulators
firebase emulators:start --only functions,firestore

# In another terminal, build and watch
cd firebase/functions
npm run build:watch
```

#### Test Functions

1. **Test User Registration** (`handleUserRegistration`):
   ```javascript
   // Create a test user document in Firestore
   // Via Firebase Console or emulator UI: http://localhost:4000
   // Collection: users
   // Document ID: test-user-123
   // Data:
   {
     "email": "test@example.com",
     "firstName": "Test",
     "lastName": "User",
     "role": "client",
     "language": "en",
     "country": "US",
     "createdAt": Timestamp.now(),
     "isActive": true
   }
   ```
   
   **Expected Result:**
   - Function logs should show: `✅ User registered and synced to MailWizz`
   - MailWizz subscriber should be created
   - Welcome email should be sent (check MailWizz logs)
   - GA4 event should be logged in `analytics_events` collection

2. **Test Review Submission** (`handleReviewSubmitted`):
   ```javascript
   // Create a test review
   // Collection: reviews
   // Data:
   {
     "rating": 5,
     "clientId": "test-user-123",
     "providerId": "test-provider-456",
     "comment": "Great service!",
     "callId": "test-call-789",
     "createdAt": Timestamp.now()
   }
   ```
   
   **Expected Result (rating >= 4):**
   - Trustpilot invite email sent
   - Provider notification sent
   - GA4 events logged
   - MailWizz RATING_STARS updated

3. **Test Call Completion** (`handleCallCompleted`):
   ```javascript
   // Update a call document
   // Collection: calls
   // Document ID: test-call-789
   // Update status from "in_progress" to "completed"
   // Add fields:
   {
     "status": "completed",
     "callDuration": 300, // seconds
     "price": 50.00,
     "clientId": "test-user-123",
     "providerId": "test-provider-456"
   }
   ```
   
   **Expected Result:**
   - Client receives completion email
   - Provider receives completion email
   - Provider TOTAL_CALLS incremented in MailWizz

4. **Test Payment Received** (`handlePaymentReceived`):
   ```javascript
   // Create a payment document
   // Collection: payments
   // Data:
   {
     "status": "succeeded",
     "userId": "test-user-123",
     "amount": 50.00,
     "currency": "EUR",
     "createdAt": Timestamp.now()
   }
   ```
   
   **Expected Result:**
   - Payment receipt email sent
   - GA4 event logged

### Method 2: Production Testing (Staging)

**⚠️ Use with caution - will send real emails**

```bash
# Deploy functions
cd firebase/functions
npm run build
firebase deploy --only functions:handleUserRegistration,functions:handleReviewSubmitted,functions:handleCallCompleted

# Monitor logs
firebase functions:log
```

Create test data in production Firestore and monitor:
- Function logs
- MailWizz subscriber list
- Email delivery in MailWizz
- Firestore `analytics_events` collection

### Method 3: Unit Testing (Manual Function Calls)

Create a test script to directly test the MailWizz API:

```typescript
// test-mailwizz.ts (temporary test file)
import { MailwizzAPI } from './src/emailMarketing/utils/mailwizz';

async function test() {
  const api = new MailwizzAPI();
  
  try {
    // Test subscriber creation
    const result = await api.createSubscriber({
      EMAIL: 'test@example.com',
      FNAME: 'Test',
      LNAME: 'User',
      LANGUAGE: 'en',
      ROLE: 'client'
    });
    console.log('✅ Subscriber created:', result);
    
    // Test transactional email
    await api.sendTransactional({
      to: 'test@example.com',
      template: 'TR_CLI_welcome_EN',
      customFields: {
        FNAME: 'Test'
      }
    });
    console.log('✅ Email sent');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

test();
```

## 🔍 Verification Steps

### 1. Check Function Logs

```bash
# View real-time logs
firebase functions:log --only handleUserRegistration

# Or in Firebase Console
# Functions → Logs → Filter by function name
```

Look for:
- ✅ Success messages
- ❌ Error messages
- 📊 GA4 event logs

### 2. Verify MailWizz Integration

1. Login to MailWizz: https://app.mail-ulixai.com
2. Go to: **Lists → SOS-Expat → Subscribers**
3. Verify:
   - Subscriber created with correct email
   - All 61 custom fields populated correctly
   - Language field matches user preference

### 3. Verify Email Delivery

1. In MailWizz: **Campaigns → Transactional Emails**
2. Check sent emails
3. Verify:
   - Correct template used (e.g., `TR_CLI_welcome_EN`)
   - Correct recipient
   - Custom fields populated

### 4. Verify GA4 Events

```bash
# Check Firestore analytics_events collection
# Collection: analytics_events
# Look for recent events with eventName:
# - user_registered
# - email_sent
# - trustpilot_invite_sent
# etc.
```

### 5. Verify Stop Conditions (when testing Function 10 later)

After implementing `stopAutoresponders`, test each condition:
- Profile completion → Should stop profile nurture
- First login → Should stop never-logged nurture
- First call → Should stop no-calls nurture
- etc.

## 🐛 Common Issues & Solutions

### Issue: "MAILWIZZ_API_KEY secret is not configured"

**Solution:**
```bash
firebase functions:secrets:set MAILWIZZ_API_KEY
# Enter: 63f17459fa45961cbb742a61ddebc157169bd3c1
```

### Issue: "Error creating subscriber"

**Possible causes:**
- Invalid API key
- MailWizz API endpoint unreachable
- Subscriber already exists

**Solution:**
- Verify API key is correct
- Check MailWizz server status
- Try updating existing subscriber instead

### Issue: "Template not found"

**Possible causes:**
- Template name doesn't match MailWizz exactly
- Template doesn't exist in MailWizz
- Wrong language code

**Solution:**
- Verify template names in MailWizz admin
- Check language code is uppercase (EN, FR, etc.)
- Ensure template exists for all 9 languages

### Issue: Functions not triggering

**Possible causes:**
- Functions not deployed
- Firestore rules blocking writes
- Event not matching document path

**Solution:**
- Deploy functions: `firebase deploy --only functions`
- Check Firestore security rules
- Verify document path matches trigger pattern

## 📊 Test Data Examples

### Complete Test User (Client)
```json
{
  "email": "test.client@example.com",
  "firstName": "Test",
  "lastName": "Client",
  "role": "client",
  "language": "en",
  "preferredLanguage": "en",
  "country": "US",
  "currentCountry": "US",
  "isActive": true,
  "isVerified": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLoginAt": null,
  "totalCalls": 0,
  "totalEarnings": 0,
  "profileCompleted": false
}
```

### Complete Test User (Provider)
```json
{
  "email": "test.provider@example.com",
  "firstName": "Test",
  "lastName": "Provider",
  "role": "lawyer",
  "language": "fr",
  "country": "FR",
  "isActive": true,
  "isOnline": false,
  "kycStatus": "pending",
  "profileCompleted": false,
  "totalCalls": 0,
  "totalEarnings": 0
}
```

## ✅ Testing Checklist

- [ ] User registration creates MailWizz subscriber
- [ ] Welcome email sent (correct template based on role/language)
- [ ] Review with rating >= 4 triggers Trustpilot invite
- [ ] Review with rating < 4 sends thank you email
- [ ] Call completion sends emails to both parties
- [ ] Payment success sends receipt email
- [ ] Payment failure sends failure notification
- [ ] Payout request sends confirmation
- [ ] Payout sent sends notification
- [ ] All GA4 events logged correctly
- [ ] MailWizz custom fields populated correctly
- [ ] Language detection working (test all 9 languages)

## 📝 Notes

- **Development Mode**: Use emulators to avoid sending real emails
- **Production Testing**: Use test accounts with real email addresses you control
- **Template Testing**: Ensure all 954 templates exist in MailWizz before production
- **Rate Limiting**: Be aware of MailWizz rate limits during testing






