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
    if (!providerId) {
      setState({
        translation: null,
        original: null,
        availableLanguages: [],
        isLoading: false,
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await getProviderTranslation(providerId, targetLanguage);
      setState(result);
    } catch (error) {
      setState({
        translation: null,
        original: null,
        availableLanguages: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load translation',
      });
    }
  }, [providerId, targetLanguage]);

  const translate = useCallback(async (): Promise<TranslatedContent | null> => {
    if (!providerId) {
      return null;
    }

    // Don't translate for robots
    if (isRobot()) {
      return null;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const translation = await requestTranslation(
        providerId,
        targetLanguage,
        user?.uid
      );

      // Reload to get updated state
      await loadTranslation();

      return translation;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Translation failed',
      }));
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

