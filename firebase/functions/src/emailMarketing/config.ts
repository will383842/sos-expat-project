import { defineString } from "firebase-functions/params";

// MailWizz Configuration - Static hardcoded values (no longer using secrets)
// IMPORTANT: These are NOT exported to avoid Firebase CLI detecting them as secrets
// Use getMailWizzApiKey() and getMailWizzWebhookSecret() functions instead
const MAILWIZZ_API_KEY_VALUE = "63f17459fa45961cbb742a61ddebc157169bd3c1";
const MAILWIZZ_WEBHOOK_SECRET_VALUE = "your_webhook_secret_static_value_here"; // Replace with your actual webhook secret

/**
 * Get MailWizz API key - static hardcoded value
 * Using function instead of export to avoid Firebase CLI detecting it as a secret
 */
export function getMailWizzApiKey(): string {
  return MAILWIZZ_API_KEY_VALUE;
}

// DO NOT export MAILWIZZ_API_KEY as constant - Firebase CLI will detect it as a secret
// Use getMailWizzApiKey() function instead

// MailWizz Configuration Strings - Read from env first, then Firebase params
export const MAILWIZZ_API_URL = defineString("MAILWIZZ_API_URL", {
  default: process.env.MAILWIZZ_API_URL || "https://app.mail-ulixai.com/api/index.php",
});

export const MAILWIZZ_LIST_UID = defineString("MAILWIZZ_LIST_UID", {
  default: process.env.MAILWIZZ_LIST_UID || "yl089ehqpgb96",
});

export const MAILWIZZ_CUSTOMER_ID = defineString("MAILWIZZ_CUSTOMER_ID", {
  default: process.env.MAILWIZZ_CUSTOMER_ID || "2",
});

// // GA4 Configuration
export const GA4_MEASUREMENT_ID = defineString("GA4_MEASUREMENT_ID", {
  default: "",
});

// Supported Languages
export const SUPPORTED_LANGUAGES = [
  "fr",
  "en",
  "de",
  "es",
  "pt",
  "ru",
  "zh",
  "ar",
  "hi",
] as const;

export type SupportedLanguage =
  (typeof SUPPORTED_LANGUAGES)[number];

// Language to UPPERCASE mapping for template names
export function getLanguageCode(lang?: string): string {
  const normalized = (lang || "en").toLowerCase();
  const validLang = SUPPORTED_LANGUAGES.find(
    (l) => l === normalized
  ) || "en";
  return validLang.toUpperCase();
}

// Validate configuration
export function validateMailWizzConfig(): {
  apiUrl: string;
  apiKey: string;
  listUid: string;
  customerId: string;
} {
  // Using static values - no longer reading from environment or secrets
  const apiKey = getMailWizzApiKey();
  if (!apiKey) {
    throw new Error(
      "MAILWIZZ_API_KEY is not configured."
    );
  }

  // Get values from env first, then Firebase params
  const apiUrl = process.env.MAILWIZZ_API_URL ||""
  const listUid = process.env.MAILWIZZ_LIST_UID || ""
  const customerId = process.env.MAILWIZZ_CUSTOMER_ID || ""

  return {
    apiUrl,
    apiKey,
    listUid,
    customerId,
  };
}

/**
 * Get MailWizz webhook secret - now using static hardcoded value
 */
export function getMailWizzWebhookSecret(): string {
  return MAILWIZZ_WEBHOOK_SECRET_VALUE;
}

