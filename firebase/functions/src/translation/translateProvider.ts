// firebase/functions/src/translation/translateProvider.ts
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import {
  translateProfile,
  saveTranslation,
  getTranslation,
  extractOriginalProfile,
  type SupportedLanguage,
  SUPPORTED_LANGUAGES,
} from '../services/providerTranslationService';
import { db } from '../utils/firebase';

export const translateProvider = onCall(
  {
    region: 'europe-west1',
    maxInstances: 10,
    memory: '512MiB',
    timeoutSeconds: 120,
  },
  async (request) => {
    const { providerId, targetLanguage, userId } = request.data;

    if (!providerId || !targetLanguage) {
      throw new admin.functions.https.HttpsError(
        'invalid-argument',
        'providerId and targetLanguage are required'
      );
    }

    if (!SUPPORTED_LANGUAGES.includes(targetLanguage)) {
      throw new admin.functions.https.HttpsError(
        'invalid-argument',
        `Unsupported target language: ${targetLanguage}. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`
      );
    }

    // Check if translation already exists
    const existing = await getTranslation(providerId, targetLanguage);
    if (existing) {
      return {
        success: true,
        translation: existing,
        cached: true,
        cost: 0,
      };
    }

    // Get provider data for slug generation
    const providerDoc = await db.collection('sos_profiles').doc(providerId).get();
    if (!providerDoc.exists) {
      throw new admin.functions.https.HttpsError(
        'not-found',
        'Provider not found'
      );
    }
    const providerData = providerDoc.data()!;

    // Get or extract original profile
    let original = await extractOriginalProfile(providerId);
    if (!original) {
      throw new admin.functions.https.HttpsError(
        'not-found',
        'Could not extract original profile'
      );
    }

    // Check if robot (don't translate for bots)
    const userAgent = request.rawRequest.headers['user-agent'] || '';
    const isRobot = /bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|ia_archiver/i.test(userAgent);
    
    if (isRobot) {
      // Return original content for robots
      return {
        success: true,
        translation: null,
        cached: false,
        cost: 0,
        isRobot: true,
        message: 'Translation skipped for robot',
      };
    }

    // Translate
    const translation = await translateProfile(original, targetLanguage, providerData);

    // Save translation
    await saveTranslation(providerId, targetLanguage, translation, userId);

    return {
      success: true,
      translation,
      cached: false,
      cost: 0.15,
    };
  }
);

