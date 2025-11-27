// src/hooks/useProviderTranslation.ts
import { useState, useEffect, useCallback } from 'react';
import {
  getProviderTranslation,
  requestTranslation,
  type SupportedLanguage,
  type ProviderTranslation,
  type TranslatedContent,
  isRobot,
} from '../services/providerTranslationService';
import { useAuth } from '../contexts/AuthContext';

export function useProviderTranslation(
  providerId: string | null,
  targetLanguage: SupportedLanguage
) {
  const { user } = useAuth();
  const [state, setState] = useState<ProviderTranslation>({
    translation: null,
    original: null,
    availableLanguages: [],
    isLoading: true,
    error: null,
  });

  const loadTranslation = useCallback(async () => {
    console.log('[useProviderTranslation] ===== loadTranslation() CALLED =====');
    console.log('[useProviderTranslation] Parameters:', {
      providerId,
      targetLanguage,
    });

    if (!providerId) {
      console.log('[useProviderTranslation] No providerId, setting empty state');
      setState({
        translation: null,
        original: null,
        availableLanguages: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    console.log('[useProviderTranslation] Setting loading state...');
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('[useProviderTranslation] Calling getProviderTranslation...');
      const result = await getProviderTranslation(providerId, targetLanguage);
      console.log('[useProviderTranslation] ✓ getProviderTranslation completed');
      console.log('[useProviderTranslation] Result:', {
        hasTranslation: !!result.translation,
        hasOriginal: !!result.original,
        availableLanguages: result.availableLanguages,
        isLoading: result.isLoading,
        error: result.error,
      });
      
      console.log('[useProviderTranslation] Setting state with result...');
      setState(result);
      console.log('[useProviderTranslation] ✓ State updated');
      console.log('[useProviderTranslation] ===== loadTranslation() SUCCESS =====');
    } catch (error) {
      console.error('[useProviderTranslation] ===== loadTranslation() ERROR =====');
      console.error('[useProviderTranslation] Error in loadTranslation:', error);
      console.error('[useProviderTranslation] Error details:', {
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to load translation';
      console.error('[useProviderTranslation] Setting error state:', errorMessage);
      
      setState({
        translation: null,
        original: null,
        availableLanguages: [],
        isLoading: false,
        error: errorMessage,
      });
      console.error('[useProviderTranslation] ===== loadTranslation() ERROR HANDLED =====');
    }
  }, [providerId, targetLanguage]);

  const translate = useCallback(async (lang?: SupportedLanguage): Promise<TranslatedContent | null> => {
    console.log('[useProviderTranslation] ===== translate() CALLED =====');
    console.log('[useProviderTranslation] Parameters:', {
      providerId,
      lang,
      targetLanguage,
      userId: user?.uid || 'none',
    });

    if (!providerId) {
      console.warn('[useProviderTranslation] No providerId provided');
      return null;
    }

    // Use provided language or fallback to current targetLanguage
    const langToTranslate = lang || targetLanguage;
    console.log('[useProviderTranslation] Language to translate:', langToTranslate);

    // Don't translate for robots
    if (isRobot()) {
      console.warn('[useProviderTranslation] Translation skipped: Robot detected');
      return null;
    }

    console.log('[useProviderTranslation] Setting loading state...');
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('[useProviderTranslation] Step 1: Calling requestTranslation...');
      console.log('[useProviderTranslation] Request parameters:', {
        providerId,
        langToTranslate,
        userId: user?.uid,
      });

      const translation = await requestTranslation(
        providerId,
        langToTranslate,
        user?.uid
      );

      console.log('[useProviderTranslation] ✓ Step 1: requestTranslation completed');
      console.log('[useProviderTranslation] Translation received:', {
        hasTranslation: !!translation,
        translationType: typeof translation,
        translationKeys: translation && typeof translation === 'object' ? Object.keys(translation) : [],
      });

      console.log('[useProviderTranslation] Step 2: Reloading translation state...');
      // Reload to get updated state (reload for the language that was just translated)
      await loadTranslation();
      console.log('[useProviderTranslation] ✓ Step 2: Translation state reloaded');

      console.log('[useProviderTranslation] ===== translate() SUCCESS =====');
      return translation;
    } catch (error) {
      console.error('[useProviderTranslation] ===== translate() ERROR =====');
      console.error('[useProviderTranslation] Error caught in translate():', error);
      console.error('[useProviderTranslation] Error details:', {
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        code: (error as any)?.code,
        details: (error as any)?.details,
        toString: String(error),
        type: typeof error,
        constructor: (error as any)?.constructor?.name,
        keys: error && typeof error === 'object' ? Object.keys(error) : [],
      });

      // Check for JSON decoding errors specifically
      if (error instanceof Error && (
        error.message.includes('cannot be decoded from JSON') ||
        error.message.includes('decode') ||
        error.message.includes('[object Object]')
      )) {
        console.error('[useProviderTranslation] ✗ JSON DECODING ERROR DETECTED');
        console.error('[useProviderTranslation] This error occurs when Firebase Functions cannot decode the response.');
        console.error('[useProviderTranslation] Possible causes:');
        console.error('[useProviderTranslation] 1. Backend returned non-serializable data');
        console.error('[useProviderTranslation] 2. Response contains circular references');
        console.error('[useProviderTranslation] 3. Response contains functions or other non-JSON types');
        console.error('[useProviderTranslation] 4. Response structure is malformed');
      }

      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Translation failed';
      
      console.error('[useProviderTranslation] Setting error state with message:', errorMessage);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      console.error('[useProviderTranslation] ===== translate() ERROR HANDLED =====');
      // Return null instead of throwing to allow UI to handle gracefully
      return null;
    }
  }, [providerId, targetLanguage, user?.uid, loadTranslation]);

  useEffect(() => {
    loadTranslation();
  }, [loadTranslation]);

  return {
    ...state,
    translate,
    reload: loadTranslation,
  };
}

