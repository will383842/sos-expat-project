// src/components/provider/TranslationBanner.tsx
import React, { useState } from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  SUPPORTED_LANGUAGES,
  LANGUAGE_NAMES,
  type SupportedLanguage,
} from '../../services/providerTranslationService';
import { useAuth } from '../../contexts/AuthContext';

interface TranslationBannerProps {
  providerId: string;
  currentLanguage: SupportedLanguage;
  availableLanguages: SupportedLanguage[];
  onTranslationComplete: (language: SupportedLanguage, translation: any) => void;
  onTranslate: (language: SupportedLanguage) => Promise<any>;
}

export const TranslationBanner: React.FC<TranslationBannerProps> = ({
  providerId,
  currentLanguage,
  availableLanguages,
  onTranslationComplete,
  onTranslate,
}) => {
  const { user } = useAuth();
  const intl = useIntl();
  const [isTranslating, setIsTranslating] = useState<SupportedLanguage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const missingLanguages = SUPPORTED_LANGUAGES.filter(
    lang => lang !== currentLanguage && !availableLanguages.includes(lang)
  );

  if (missingLanguages.length === 0) {
    return null; // All languages available
  }

  const handleTranslate = async (targetLanguage: SupportedLanguage) => {
    setIsTranslating(targetLanguage);
    setError(null);

    try {
      const translation = await onTranslate(targetLanguage);
      if (translation) {
        onTranslationComplete(targetLanguage, translation);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setIsTranslating(null);
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <span className="font-semibold text-blue-900 dark:text-blue-100">
          <FormattedMessage
            id="providerTranslation.viewIn"
            defaultMessage="View in:"
          />
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {missingLanguages.map(lang => (
          <button
            key={lang}
            onClick={() => handleTranslate(lang)}
            disabled={isTranslating === lang}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-md text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isTranslating === lang ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <FormattedMessage
                  id="providerTranslation.translating"
                  defaultMessage="Translating..."
                />
              </>
            ) : (
              LANGUAGE_NAMES[lang]
            )}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <p className="mt-3 text-xs text-blue-700 dark:text-blue-300">
        <FormattedMessage
          id="providerTranslation.oneTimeCost"
          defaultMessage="Translation is a one-time cost (~€0.15). Future visits are free."
        />
      </p>
    </div>
  );
};

