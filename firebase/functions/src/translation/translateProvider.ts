// firebase/functions/src/translation/translateProvider.ts
import { onCall } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import {
  translateProfile,
  saveTranslation,
  getTranslation,
  extractOriginalProfile,
  SUPPORTED_LANGUAGES,
} from '../services/providerTranslationService';
import { db } from '../utils/firebase';

/**
 * Final cleanup function that ensures response is 100% JSON-serializable
 * Uses JSON.parse(JSON.stringify()) to create a completely clean object
 */
function ensureJsonSerializable(obj: any, depth: number = 0): any {
  const maxDepth = 5; // Prevent infinite recursion
  
  if (depth >= maxDepth) {
    console.warn('[ensureJsonSerializable] Max depth reached, returning safe fallback');
    return null;
  }
  
  try {
    // First, serialize using our custom function to handle Timestamps, etc.
    const serialized = serializeForResponse(obj);
    
    // Then use JSON.parse(JSON.stringify()) to create a completely clean object
    // This removes any remaining non-serializable properties
    const jsonString = JSON.stringify(serialized);
    const cleaned = JSON.parse(jsonString);
    
    return cleaned;
  } catch (error) {
    console.error('[ensureJsonSerializable] Error during final cleanup:', error);
    console.error('[ensureJsonSerializable] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      objType: typeof obj,
      objKeys: obj && typeof obj === 'object' ? Object.keys(obj).slice(0, 10) : [],
    });
    
    // If JSON.parse(JSON.stringify()) fails, try to create a minimal safe response
    try {
      // Fallback: create a minimal response structure without recursion
      if (obj && typeof obj === 'object' && 'success' in obj) {
        // Try to safely extract translation without recursion
        let safeTranslation = null;
        if (obj.translation && typeof obj.translation === 'object') {
          try {
            safeTranslation = JSON.parse(JSON.stringify(serializeForResponse(obj.translation)));
          } catch (e) {
            console.warn('[ensureJsonSerializable] Could not serialize translation, setting to null');
            safeTranslation = null;
          }
        }
        
        return {
          success: obj.success || false,
          translation: safeTranslation,
          cached: obj.cached || false,
          cost: typeof obj.cost === 'number' ? obj.cost : 0,
          error: obj.error || 'Serialization failed',
        };
      }
      // Last resort: return a safe error response
      return {
        success: false,
        error: 'Failed to serialize response',
        translation: null,
      };
    } catch (fallbackError) {
      console.error('[ensureJsonSerializable] Fallback also failed:', fallbackError);
      // Absolute last resort
      return {
        success: false,
        error: 'Critical serialization error',
      };
    }
  }
}

/**
 * Serialize object to make it JSON-safe for Firebase Functions response
 * Converts Firestore Timestamps to ISO strings and handles nested objects
 * Prevents circular references and handles all edge cases
 */
function serializeForResponse(obj: any, seen: WeakSet<object> = new WeakSet(), depth: number = 0, path: string = 'root'): any {
  const maxDepth = 10; // Prevent infinite recursion
  const logDepth = depth <= 3; // Only log first 3 levels to avoid spam
  
  if (logDepth) {
    console.log(`[serializeForResponse] ${path}: Processing, depth=${depth}, type=${typeof obj}`);
  }

  if (obj === null || obj === undefined) {
    if (logDepth) console.log(`[serializeForResponse] ${path}: Returning null/undefined`);
    return obj;
  }
  
  // Handle Firestore Timestamp
  if (obj instanceof admin.firestore.Timestamp) {
    if (logDepth) console.log(`[serializeForResponse] ${path}: Converting Firestore Timestamp to ISO string`);
    return obj.toDate().toISOString();
  }
  
  // Handle Date objects
  if (obj instanceof Date) {
    if (logDepth) console.log(`[serializeForResponse] ${path}: Converting Date to ISO string`);
    return obj.toISOString();
  }
  
  // Handle functions (can't serialize)
  if (typeof obj === 'function') {
    if (logDepth) console.log(`[serializeForResponse] ${path}: Skipping function`);
    return undefined; // Skip functions
  }
  
  // Handle primitives
  if (typeof obj !== 'object') {
    if (logDepth) console.log(`[serializeForResponse] ${path}: Returning primitive value`);
    return obj;
  }
  
  // Prevent infinite recursion
  if (depth >= maxDepth) {
    console.warn(`[serializeForResponse] ${path}: Max depth reached, returning placeholder`);
    return '[Max Depth Reached]';
  }
  
  // Handle circular references
  if (seen.has(obj)) {
    if (logDepth) console.log(`[serializeForResponse] ${path}: Circular reference detected`);
    return '[Circular Reference]';
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    if (logDepth) console.log(`[serializeForResponse] ${path}: Processing array with ${obj.length} items`);
    seen.add(obj);
    try {
      const result = obj.map((item, index) => 
        serializeForResponse(item, seen, depth + 1, `${path}[${index}]`)
      );
      if (logDepth) console.log(`[serializeForResponse] ${path}: Array serialized successfully`);
      return result;
    } catch (error) {
      console.error(`[serializeForResponse] ${path}: Error serializing array:`, error);
      throw error;
    }
  }
  
  // Handle Map
  if (obj instanceof Map) {
    if (logDepth) console.log(`[serializeForResponse] ${path}: Processing Map with ${obj.size} entries`);
    const result: any = {};
    seen.add(obj);
    try {
      obj.forEach((value, key) => {
        const keyStr = String(key);
        result[keyStr] = serializeForResponse(value, seen, depth + 1, `${path}.${keyStr}`);
      });
      if (logDepth) console.log(`[serializeForResponse] ${path}: Map serialized successfully`);
      return result;
    } catch (error) {
      console.error(`[serializeForResponse] ${path}: Error serializing Map:`, error);
      throw error;
    }
  }
  
  // Handle Set
  if (obj instanceof Set) {
    if (logDepth) console.log(`[serializeForResponse] ${path}: Processing Set with ${obj.size} items`);
    seen.add(obj);
    try {
      const result = Array.from(obj).map((item, index) => 
        serializeForResponse(item, seen, depth + 1, `${path}[${index}]`)
      );
      if (logDepth) console.log(`[serializeForResponse] ${path}: Set serialized successfully`);
      return result;
    } catch (error) {
      console.error(`[serializeForResponse] ${path}: Error serializing Set:`, error);
      throw error;
    }
  }
  
  // Handle plain objects
  if (logDepth) {
    const keys = Object.keys(obj);
    console.log(`[serializeForResponse] ${path}: Processing object with ${keys.length} properties:`, keys.slice(0, 10));
  }
  
  seen.add(obj);
  try {
    const serialized: any = {};
    let processedCount = 0;
    let skippedCount = 0;
    
    for (const key in obj) {
      // Only include own properties, not inherited ones
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        try {
          const value = serializeForResponse(obj[key], seen, depth + 1, `${path}.${key}`);
          // Only include if value is not undefined (functions become undefined)
          if (value !== undefined) {
            serialized[key] = value;
            processedCount++;
          } else {
            skippedCount++;
            if (logDepth) console.log(`[serializeForResponse] ${path}.${key}: Skipped (undefined)`);
          }
        } catch (error) {
          // If serialization fails for a property, skip it
          console.warn(`[serializeForResponse] ${path}.${key}: Failed to serialize property:`, error);
          skippedCount++;
        }
      }
    }
    
    if (logDepth || processedCount > 0 || skippedCount > 0) {
      console.log(`[serializeForResponse] ${path}: Object serialized - processed: ${processedCount}, skipped: ${skippedCount}`);
    }
    
    return serialized;
  } catch (error) {
    console.error(`[serializeForResponse] ${path}: Error serializing object:`, error);
    throw error;
  }
}

export const translateProvider = onCall(
  {
    region: 'europe-west1',
    maxInstances: 10,
    memory: '512MiB',
    timeoutSeconds: 120,
  },
  async (request) => {
    console.log('[translateProvider] ===== FUNCTION CALLED =====');
    console.log('[translateProvider] Request data:', {
      providerId: request.data?.providerId,
      targetLanguage: request.data?.targetLanguage,
      userId: request.data?.userId,
      hasRawRequest: !!request.rawRequest,
    });

    const { providerId, targetLanguage, userId } = request.data;

    // Step 1: Validate input parameters
    console.log('[translateProvider] Step 1: Validating input parameters...');
    if (!providerId || !targetLanguage) {
      console.error('[translateProvider] Validation failed: Missing required parameters', {
        hasProviderId: !!providerId,
        hasTargetLanguage: !!targetLanguage,
      });
      throw new HttpsError(
        'invalid-argument',
        'providerId and targetLanguage are required'
      );
    }

    if (!SUPPORTED_LANGUAGES.includes(targetLanguage)) {
      console.error('[translateProvider] Validation failed: Unsupported language', {
        targetLanguage,
        supportedLanguages: SUPPORTED_LANGUAGES,
      });
      throw new HttpsError(
        'invalid-argument',
        `Unsupported target language: ${targetLanguage}. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`
      );
    }
    console.log('[translateProvider] ✓ Step 1: Input validation passed');

    // Step 2: Check if translation already exists
    console.log('[translateProvider] Step 2: Checking for existing translation...');
    let existing;
    try {
      existing = await getTranslation(providerId, targetLanguage);
      console.log('[translateProvider] Existing translation check result:', {
        exists: !!existing,
        hasTranslation: existing ? Object.keys(existing).length : 0,
      });
    } catch (error) {
      console.error('[translateProvider] Error checking existing translation:', error);
      throw error;
    }

    if (existing) {
      console.log('[translateProvider] Step 2a: Translation exists, serializing cached response...');
      try {
        console.log('[translateProvider] Serializing existing translation object...');
        const serializedTranslation = serializeForResponse(existing);
        console.log('[translateProvider] Serialization successful, keys:', Object.keys(serializedTranslation || {}));
        
        const response = {
          success: true,
          translation: serializedTranslation,
          cached: true,
          cost: 0,
        };
        
        console.log('[translateProvider] Testing JSON serialization of response...');
        const jsonString = JSON.stringify(response);
        console.log('[translateProvider] ✓ JSON serialization test passed, response size:', jsonString.length, 'bytes');
        
        // Use ensureJsonSerializable for final cleanup
        const cleanResponse = ensureJsonSerializable(response);
        console.log('[translateProvider] ✓ Response cleaned and verified');
        console.log('[translateProvider] Final response keys:', Object.keys(cleanResponse || {}));
        
        // Final verification: ensure it can be stringified one more time
        try {
          const finalTest = JSON.stringify(cleanResponse);
          console.log('[translateProvider] ✓ Final JSON.stringify test passed, size:', finalTest.length);
        } catch (finalError) {
          console.error('[translateProvider] ✗ Final JSON.stringify test failed:', finalError);
          throw new HttpsError('internal', 'Response serialization verification failed');
        }
        
        console.log('[translateProvider] ===== RETURNING CACHED TRANSLATION =====');
        return cleanResponse;
      } catch (error) {
        console.error('[translateProvider] ✗ Error serializing cached translation:', error);
        console.error('[translateProvider] Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          existingKeys: existing ? Object.keys(existing) : [],
        });
        throw new HttpsError(
          'internal',
          'Failed to serialize translation data: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
    console.log('[translateProvider] ✓ Step 2: No existing translation found, proceeding with new translation');

    // Step 3: Get provider data
    console.log('[translateProvider] Step 3: Fetching provider data from Firestore...');
    let providerDoc;
    try {
      providerDoc = await db.collection('sos_profiles').doc(providerId).get();
      console.log('[translateProvider] Provider document fetch result:', {
        exists: providerDoc.exists,
        hasData: providerDoc.exists ? !!providerDoc.data() : false,
      });
    } catch (error) {
      console.error('[translateProvider] Error fetching provider document:', error);
      throw error;
    }

    if (!providerDoc.exists) {
      console.error('[translateProvider] Provider not found in Firestore');
      throw new HttpsError(
        'not-found',
        'Provider not found'
      );
    }
    const providerData = providerDoc.data()!;
    console.log('[translateProvider] ✓ Step 3: Provider data retrieved, keys:', Object.keys(providerData || {}));

    // Step 4: Extract original profile
    console.log('[translateProvider] Step 4: Extracting original profile...');
    let original;
    try {
      original = await extractOriginalProfile(providerId);
      console.log('[translateProvider] Original profile extraction result:', {
        exists: !!original,
        hasData: original ? Object.keys(original).length : 0,
        originalKeys: original ? Object.keys(original) : [],
      });
    } catch (error) {
      console.error('[translateProvider] Error extracting original profile:', error);
      throw error;
    }

    if (!original) {
      console.error('[translateProvider] Could not extract original profile');
      throw new HttpsError(
        'not-found',
        'Could not extract original profile'
      );
    }
    console.log('[translateProvider] ✓ Step 4: Original profile extracted');

    // Step 5: Check if robot
    console.log('[translateProvider] Step 5: Checking if request is from robot...');
    const userAgent = request.rawRequest?.headers?.['user-agent'] || '';
    const isRobot = /bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|ia_archiver/i.test(userAgent);
    console.log('[translateProvider] Robot check result:', {
      userAgent: userAgent.substring(0, 100), // Log first 100 chars
      isRobot,
    });
    
    if (isRobot) {
      console.log('[translateProvider] Robot detected, skipping translation');
      const robotResponse = {
        success: true,
        translation: null,
        cached: false,
        cost: 0,
        isRobot: true,
        message: 'Translation skipped for robot',
      };
      // Use ensureJsonSerializable for final cleanup
      const cleanRobotResponse = ensureJsonSerializable(robotResponse);
      console.log('[translateProvider] ===== RETURNING ROBOT RESPONSE =====');
      return cleanRobotResponse;
    }
    console.log('[translateProvider] ✓ Step 5: Not a robot, proceeding with translation');

    // Step 6: Translate profile
    console.log('[translateProvider] Step 6: Starting translation process...');
    console.log('[translateProvider] Translation parameters:', {
      targetLanguage,
      originalTitle: original.title,
      originalSummaryLength: original.summary?.length || 0,
      originalDescriptionLength: original.description?.length || 0,
    });
    
    let translation;
    try {
      translation = await translateProfile(original, targetLanguage, providerData);
      console.log('[translateProvider] ✓ Step 6: Translation completed');
      console.log('[translateProvider] Translated content keys:', translation ? Object.keys(translation) : []);
      console.log('[translateProvider] Translation structure:', {
        hasTitle: !!translation?.title,
        hasSummary: !!translation?.summary,
        hasDescription: !!translation?.description,
        hasSlug: !!translation?.slug,
        hasSeo: !!translation?.seo,
        hasFaq: !!translation?.faq,
        seoKeys: translation?.seo ? Object.keys(translation.seo) : [],
      });
    } catch (error) {
      console.error('[translateProvider] ✗ Error during translation:', error);
      console.error('[translateProvider] Translation error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }

    // Step 7: Save translation
    console.log('[translateProvider] Step 7: Saving translation to Firestore...');
    try {
      await saveTranslation(providerId, targetLanguage, translation, userId);
      console.log('[translateProvider] ✓ Step 7: Translation saved successfully');
    } catch (error) {
      console.error('[translateProvider] ✗ Error saving translation:', error);
      console.error('[translateProvider] Save error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }

    // Step 8: Serialize and return response
    console.log('[translateProvider] Step 8: Serializing translation for response...');
    try {
      console.log('[translateProvider] Starting serialization of translation object...');
      console.log('[translateProvider] Translation object type check:', {
        isNull: translation === null,
        isUndefined: translation === undefined,
        type: typeof translation,
        isArray: Array.isArray(translation),
        keys: translation ? Object.keys(translation) : [],
      });

      const serializedTranslation = serializeForResponse(translation);
      console.log('[translateProvider] ✓ Serialization completed');
      console.log('[translateProvider] Serialized translation keys:', Object.keys(serializedTranslation || {}));
      
      const response = {
        success: true,
        translation: serializedTranslation,
        cached: false,
        cost: 0.15,
      };
      
      console.log('[translateProvider] Testing JSON serialization of final response...');
      const jsonString = JSON.stringify(response);
      console.log('[translateProvider] ✓ JSON serialization test passed');
      console.log('[translateProvider] Response size:', jsonString.length, 'bytes');
      console.log('[translateProvider] Response structure:', {
        success: response.success,
        hasTranslation: !!response.translation,
        cached: response.cached,
        cost: response.cost,
        translationKeys: response.translation ? Object.keys(response.translation) : [],
      });
      
      // Use ensureJsonSerializable for final cleanup
      const cleanResponse = ensureJsonSerializable(response);
      console.log('[translateProvider] ✓ Response cleaned and verified');
      console.log('[translateProvider] Final response keys:', Object.keys(cleanResponse || {}));
      
      // Final verification: ensure it can be stringified one more time
      try {
        const finalTest = JSON.stringify(cleanResponse);
        console.log('[translateProvider] ✓ Final JSON.stringify test passed, size:', finalTest.length);
      } catch (finalError) {
        console.error('[translateProvider] ✗ Final JSON.stringify test failed:', finalError);
        throw new HttpsError('internal', 'Response serialization verification failed');
      }
      
      console.log('[translateProvider] ===== RETURNING SUCCESS RESPONSE =====');
      return cleanResponse;
    } catch (error) {
      console.error('[translateProvider] ✗ Error serializing translation:', error);
      console.error('[translateProvider] Serialization error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        translationKeys: translation ? Object.keys(translation) : [],
        translationType: typeof translation,
        translationIsNull: translation === null,
        translationIsUndefined: translation === undefined,
      });
      
      // Try to log more details about problematic properties
      if (translation && typeof translation === 'object') {
        console.error('[translateProvider] Translation object deep inspection:');
        const translationAny = translation as any; // Type assertion for logging purposes
        for (const key in translationAny) {
          try {
            const value = translationAny[key];
            console.error(`[translateProvider]   ${key}:`, {
              type: typeof value,
              isNull: value === null,
              isUndefined: value === undefined,
              isArray: Array.isArray(value),
              isDate: value instanceof Date,
              isTimestamp: value instanceof admin.firestore.Timestamp,
              keys: value && typeof value === 'object' ? Object.keys(value).slice(0, 5) : [],
            });
          } catch (e) {
            console.error(`[translateProvider]   ${key}: [Error inspecting property]`, e);
          }
        }
      }
      
      throw new HttpsError(
        'internal',
        'Failed to serialize translation data: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  }
);

