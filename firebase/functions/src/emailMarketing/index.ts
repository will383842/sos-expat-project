/**
 * Email Marketing Automation Module
 * 
 * Main entry point for email marketing functions
 * This module handles all MailWizz integration and email automation
 */

// Export all functions
export * from './functions/userLifecycle';
export * from './functions/transactions';
export * from './functions/profileLifecycle';
export * from './functions/stopAutoresponders';
export * from './functions/inactiveUsers';

// Export utilities for internal use
export * from './utils/mailwizz';
export * from './utils/analytics';
export * from './utils/fieldMapper';
// Note: config exports getLanguageCode, so don't export * to avoid conflicts
export { 
  MAILWIZZ_API_KEY, 
  MAILWIZZ_WEBHOOK_SECRET,
  MAILWIZZ_API_URL,
  MAILWIZZ_LIST_UID,
  MAILWIZZ_CUSTOMER_ID,
  validateMailWizzConfig,
  getLanguageCode,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage
} from './config';

