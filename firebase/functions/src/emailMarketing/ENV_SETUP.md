# MailWizz Environment Variables Setup

## Overview

The MailWizz configuration now supports reading from environment variables (`.env` file) with fallback to Firebase Functions secrets.

**Priority Order:**
1. Environment variables (`.env` file) - **Highest Priority**
2. Firebase Functions secrets - **Fallback**

## Setup Instructions

### 1. Locate or Create `.env` file

The project already has a `.env.developement` file in `firebase/functions/` directory.

**For development:** Use `.env.developement` (already exists)
**For production:** Create `.env` file in `firebase/functions/` directory

### 2. Add MailWizz Configuration

The MailWizz credentials have been added to `.env.developement`. If you need to add them to a different file, add the following variables:

```env
# MailWizz API Configuration
MAILWIZZ_API_KEY=63f17459fa45961cbb742a61ddebc157169bd3c1
MAILWIZZ_API_URL=https://app.mail-ulixai.com/api/index.php
MAILWIZZ_LIST_UID=yl089ehqpgb96
MAILWIZZ_CUSTOMER_ID=2

# MailWizz Webhook Secret (for webhook authentication)
MAILWIZZ_WEBHOOK_SECRET=your_webhook_secret_here

# GA4 Configuration (Google Analytics 4)
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=your_ga4_api_secret_here
```

### 3. GA4 Configuration

To enable Google Analytics 4 tracking, you need to:

1. **Get your GA4 Measurement ID:**
   - Go to [Google Analytics](https://analytics.google.com/)
   - Navigate to Admin → Data Streams
   - Select your web stream
   - Copy the Measurement ID (format: `G-XXXXXXXXXX`)

2. **Create a GA4 API Secret:**
   - In the same Data Stream settings, scroll to "Measurement Protocol API secrets"
   - Click "Create" to generate a new secret
   - Copy the secret value

3. **Add to your `.env` file:**
   ```env
   GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   GA4_API_SECRET=your_ga4_api_secret_here
   ```

4. **For Firebase Functions secrets (production):**
   ```bash
   firebase functions:secrets:set GA4_API_SECRET
   firebase functions:config:set email_marketing.ga4_measurement_id="G-XXXXXXXXXX"
   ```

5. **For frontend (Vite):**
   Add to your root `.env.development` or `.env` file:
   ```env
   VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

### 4. Verify Your Values

The following values are already configured in `.env.developement`:

- `MAILWIZZ_API_KEY`: 63f17459fa45961cbb742a61ddebc157169bd3c1 ✅ (configured)
- `MAILWIZZ_API_URL`: https://app.mail-ulixai.com/api/index.php ✅ (configured)
- `MAILWIZZ_LIST_UID`: yl089ehqpgb96 ✅ (configured)
- `MAILWIZZ_CUSTOMER_ID`: 2 ✅ (configured)
- `MAILWIZZ_WEBHOOK_SECRET`: ⚠️ **REQUIRES UPDATE** - Replace `GENERATE_RANDOM_SECRET_HERE` with a secure random string

### 4. Generate Webhook Secret

Generate a secure random string for `MAILWIZZ_WEBHOOK_SECRET`:

```bash
# Using openssl
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Security Notes

- **Never commit `.env` file to git** - It should be in `.gitignore`
- The `.env` file is automatically loaded by `dotenv` package
- For production deployment, you can still use Firebase Functions secrets as fallback
- Environment variables take precedence over Firebase secrets

## Verification

After setting up your `.env` file, you can verify the configuration by:

1. Running the test script:
   ```bash
   npm run build
   node lib/emailMarketing/test-mailwizz-connection.js
   ```

2. Checking the logs when functions run - they will show which source was used

## Fallback Behavior

If environment variables are not set, the system will automatically fallback to:
- Firebase Functions secrets (for `MAILWIZZ_API_KEY` and `MAILWIZZ_WEBHOOK_SECRET`)
- Firebase Functions params (for `MAILWIZZ_API_URL`, `MAILWIZZ_LIST_UID`, `MAILWIZZ_CUSTOMER_ID`)

This ensures backward compatibility with existing Firebase Functions secret configurations.
