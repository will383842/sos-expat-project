import { defineSecret, defineString } from "firebase-functions/params";
import dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment variables from .env files
// Try multiple possible locations for .env files
const possiblePaths = [
  // In firebase/functions directory (most common)
  path.join(process.cwd(), "firebase", "functions", ".env.developement"),
  path.join(process.cwd(), "firebase", "functions", ".env"),
  // In root directory
  path.join(process.cwd(), ".env.development"),
  path.join(process.cwd(), ".env"),
  // Relative to this file (when running from functions directory)
  path.join(__dirname, "..", "..", "..", ".env.developement"),
  path.join(__dirname, "..", "..", "..", ".env"),
];

// Load the first .env file that exists
for (const envPath of possiblePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ Loaded environment variables from: ${envPath}`);
    break;
  }
}

// MailWizz Configuration - Read from environment variables first, then fallback to Firebase secrets
// Environment variables take precedence over Firebase secrets
export const MAILWIZZ_API_KEY = defineSecret("MAILWIZZ_API_KEY");
export const MAILWIZZ_WEBHOOK_SECRET = defineSecret("MAILWIZZ_WEBHOOK_SECRET");

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

// GA4 Configuration
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
  // Priority: 1. Environment variable (.env file), 2. Firebase secret
  const apiKey = process.env.MAILWIZZ_API_KEY || MAILWIZZ_API_KEY.value() || "";
  if (!apiKey) {
    throw new Error(
      "MAILWIZZ_API_KEY is not configured. Please set it in .env file (MAILWIZZ_API_KEY) or Firebase Functions secrets."
    );
  }

  // Get values from env first, then Firebase params
  const apiUrl = process.env.MAILWIZZ_API_URL || MAILWIZZ_API_URL.value();
  const listUid = process.env.MAILWIZZ_LIST_UID || MAILWIZZ_LIST_UID.value();
  const customerId = process.env.MAILWIZZ_CUSTOMER_ID || MAILWIZZ_CUSTOMER_ID.value();

  return {
    apiUrl,
    apiKey,
    listUid,
    customerId,
  };
}

/**
 * Get MailWizz webhook secret from environment or Firebase secret
 */
export function getMailWizzWebhookSecret(): string {
  return process.env.MAILWIZZ_WEBHOOK_SECRET || MAILWIZZ_WEBHOOK_SECRET.value() || "";
}

