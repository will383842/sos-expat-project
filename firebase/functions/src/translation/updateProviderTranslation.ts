import { onCall } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { db } from '../utils/firebase';
import { translateAllFields, extractOriginalProfile } from '../services/providerTranslationService';

/**
 * Serialize object to make it JSON-safe for Firebase Functions response
 */
function serializeForResponse(obj: any, seen: WeakSet<object> = new WeakSet(), depth: number = 0): any {
  const maxDepth = 10;
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (obj instanceof admin.firestore.Timestamp) {
    return obj.toDate().toISOString();
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (typeof obj === 'function') {
    return undefined;
  }
  
  if (typeof obj !== 'object') {
    return obj;
  }
  
  if (depth >= maxDepth) {
    return '[Max Depth Reached]';
  }
  
  if (seen.has(obj)) {
    return '[Circular Reference]';
  }
  
  if (Array.isArray(obj)) {
    seen.add(obj);
    return obj.map((item) => 
      serializeForResponse(item, seen, depth + 1)
    );
  }
  
  if (obj instanceof Map) {
    const result: any = {};
    seen.add(obj);
    obj.forEach((value, key) => {
      result[String(key)] = serializeForResponse(value, seen, depth + 1);
    });
    return result;
  }
  
  if (obj instanceof Set) {
    seen.add(obj);
    return Array.from(obj).map((item) => 
      serializeForResponse(item, seen, depth + 1)
    );
  }
  
  seen.add(obj);
  const serialized: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      try {
        const value = serializeForResponse(obj[key], seen, depth + 1);
        if (value !== undefined) {
          serialized[key] = value;
        }
      } catch (error) {
        console.warn(`[updateProviderTranslation] Failed to serialize property ${key}:`, error);
      }
    }
  }
  return serialized;
}

/**
 * Final cleanup function that ensures response is 100% JSON-serializable
 */
function ensureJsonSerializable(obj: any): any {
  try {
    const serialized = serializeForResponse(obj);
    const jsonString = JSON.stringify(serialized);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('[updateProviderTranslation] Error during final cleanup:', error);
    
    // Fallback response
    return {
      success: false,
      error: 'Serialization failed',
      updatedLanguages: [],
    };
  }
}

/**
 * Updates translations for a provider's changed fields
 * Only updates if the providers_translations document already exists
 * 
 * @param providerId - The provider's ID
 * @param fieldsUpdated - Array of field names that were updated
 * @returns Updated language list or empty array if document doesn't exist
 */
export const updateProviderTranslation = onCall(
  {
    region: 'europe-west1',
    maxInstances: 5,
    memory: '512MiB',
    timeoutSeconds: 60,
  },
  async (request) => {
    try {
      console.log('[updateProviderTranslation] ===== FUNCTION CALLED =====');
      console.log('[updateProviderTranslation] Request data:', {
        providerId: request.data?.providerId,
        fieldsUpdated: request.data?.fieldsUpdated,
      });

      const { providerId, fieldsUpdated } = request.data;

      // Step 1: Validate input
      console.log('[updateProviderTranslation] Step 1: Validating input parameters...');
      if (!providerId) {
        console.error('[updateProviderTranslation] Validation failed: Missing providerId');
        throw new HttpsError('invalid-argument', 'providerId is required');
      }

      if (!Array.isArray(fieldsUpdated) || fieldsUpdated.length === 0) {
        console.warn('[updateProviderTranslation] No fields to update, returning empty response');
        const response = {
          success: true,
          updatedLanguages: [],
          message: 'No fields to update',
        };
        return ensureJsonSerializable(response);
      }
      console.log('[updateProviderTranslation] ✓ Step 1: Input validation passed');

      // Step 2: Check if translation document exists
      console.log('[updateProviderTranslation] Step 2: Checking if translation document exists...');
      const translationRef = db.collection('providers_translations').doc(providerId);
      const translationDoc = await translationRef.get();

      if (!translationDoc.exists) {
        console.log('[updateProviderTranslation] ✗ Translation document does NOT exist for provider:', providerId);
        console.log('[updateProviderTranslation] Skipping translation update - document must be created by translateProvider first');
        
        const response = {
          success: true,
          updatedLanguages: [],
          message: 'No translation document found. Call translateProvider first to create translations.',
          translationDocExists: false,
        };
        return ensureJsonSerializable(response);
      }

      const translationData = translationDoc.data()!;
      console.log('[updateProviderTranslation] ✓ Step 2: Translation document exists');
      console.log('[updateProviderTranslation] Available languages:', translationData.metadata?.availableLanguages || []);

      // Step 3: Get available languages from metadata
      console.log('[updateProviderTranslation] Step 3: Extracting available languages...');
      const availableLanguages = translationData.metadata?.availableLanguages || [];

      if (availableLanguages.length === 0) {
        console.warn('[updateProviderTranslation] No languages found in translation metadata');
        const response = {
          success: true,
          updatedLanguages: [],
          message: 'No languages found in translation document',
        };
        return ensureJsonSerializable(response);
      }
      console.log('[updateProviderTranslation] ✓ Step 3: Found languages:', availableLanguages);

      // Step 4: Get the current provider data from sos_profiles
      console.log('[updateProviderTranslation] Step 4: Fetching provider data from sos_profiles...');
      const providerRef = db.collection('sos_profiles').doc(providerId);
      const providerDoc = await providerRef.get();

      if (!providerDoc.exists) {
        console.error('[updateProviderTranslation] Provider not found in sos_profiles');
        throw new HttpsError('not-found', 'Provider not found in sos_profiles');
      }

      const providerData = providerDoc.data()!;
      console.log('[updateProviderTranslation] ✓ Step 4: Provider data retrieved');

      // Step 5: Extract original profile
      console.log('[updateProviderTranslation] Step 5: Extracting original profile...');
      let original;
      try {
        original = await extractOriginalProfile(providerId);
        if (!original) {
          throw new Error('Could not extract original profile');
        }
        console.log('[updateProviderTranslation] ✓ Step 5: Original profile extracted');
      } catch (error) {
        console.error('[updateProviderTranslation] Error extracting original profile:', error);
        throw new HttpsError('internal', 'Failed to extract original profile');
      }

      // Step 6: Update translations for each language
      console.log('[updateProviderTranslation] Step 6: Updating translations for all languages...');
      const updatePromises: Promise<void>[] = [];
      const updatedLanguages: string[] = [];
      const failedLanguages: string[] = [];

      for (const language of availableLanguages) {
        if (language === 'original') {
          console.log('[updateProviderTranslation] Skipping "original" language');
          continue;
        }

        try {
          console.log(`[updateProviderTranslation] Translating to ${language}...`);

          // Translate the updated fields
          const translated = await translateAllFields(providerData, language);

          // Build update object for this language
          const updateObj: any = {
            [`translations.${language}`]: translated,
            [`metadata.translations.${language}.updatedAt`]: admin.firestore.FieldValue.serverTimestamp(),
            [`metadata.translations.${language}.lastFieldsUpdated`]: fieldsUpdated,
            [`metadata.lastUpdated`]: admin.firestore.FieldValue.serverTimestamp(),
          };

          updatePromises.push(
            translationRef.update(updateObj).then(() => {
              console.log(`[updateProviderTranslation] ✓ Successfully updated translation for ${language}`);
              updatedLanguages.push(language);
            })
          );
        } catch (error) {
          console.error(`[updateProviderTranslation] ✗ Error translating to ${language}:`, error);
          failedLanguages.push(language);
          // Continue with other languages even if one fails
        }
      }

      // Wait for all update promises to complete
      await Promise.all(updatePromises);

      console.log('[updateProviderTranslation] ✓ Step 6: Translation updates completed');
      console.log('[updateProviderTranslation] Update summary:', {
        updatedLanguages,
        failedLanguages,
        fieldsUpdated,
      });

      // Step 7: Return success response
      console.log('[updateProviderTranslation] Step 7: Returning success response...');
      const response = {
        success: true,
        updatedLanguages,
        failedLanguages: failedLanguages.length > 0 ? failedLanguages : undefined,
        fieldsUpdated,
        totalLanguagesUpdated: updatedLanguages.length,
        message: `Translations updated for ${updatedLanguages.length} language(s)`,
      };

      const cleanResponse = ensureJsonSerializable(response);
      console.log('[updateProviderTranslation] ===== RETURNING SUCCESS RESPONSE =====');
      return cleanResponse;

    } catch (topLevelError) {
      console.error('[updateProviderTranslation] ===== TOP-LEVEL ERROR CAUGHT =====');
      console.error('[updateProviderTranslation] Error:', topLevelError);

      if (topLevelError instanceof HttpsError) {
        throw topLevelError;
      }

      throw new HttpsError(
        'internal',
        `Internal server error: ${topLevelError instanceof Error ? topLevelError.message : String(topLevelError)}`
      );
    }
  }
);