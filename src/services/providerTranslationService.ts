// src/services/providerTranslationService.ts
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export type SupportedLanguage = 'fr' | 'en' | 'es' | 'pt' | 'de' | 'ru' | 'zh' | 'hi' | 'ar';

export interface TranslatedContent {
  title: string;
  summary: string;
  description: string;
  specialties: string[];
  cta: string;
  slug: string;
  seo: {
    metaTitle: string;
    metaDescription: string;
    ogTitle: string;
    ogDescription: string;
    h1: string;
    h2?: string;
    h3?: string;
    imageAltTexts: string[];
    jsonLd: Record<string, unknown>;
  };
  faq?: {
    questions: string[];
    answers: string[];
    jsonLd: Record<string, unknown>;
  };
}

export interface OriginalProfile {
  originalLanguage: string;
  title: string;
  summary: string;
  description: string;
  specialties: string[];
  cta: string;
  lastModified: Date | string;
}

export interface ProviderTranslation {
  translation: TranslatedContent | null;
  original: OriginalProfile | null;
  availableLanguages: SupportedLanguage[];
  isLoading: boolean;
  error: string | null;
}

export interface TranslationStatus {
  status: 'missing' | 'created' | 'outdated' | 'frozen';
  createdAt?: Date;
  updatedAt?: Date;
  cost: number;
  version: number;
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['fr', 'en', 'es', 'pt', 'de', 'ru', 'zh', 'hi', 'ar'];

const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  ru: 'Русский',
  zh: '中文',
  hi: 'हिन्दी',
  ar: 'العربية',
};

/**
 * Get provider translation from Firestore
 */
export async function getProviderTranslation(
  providerId: string,
  language: SupportedLanguage
): Promise<ProviderTranslation> {
  try {
    const translationDoc = await getDoc(
      doc(db, 'providers_translations', providerId)
    );

    if (!translationDoc.exists()) {
      return {
        translation: null,
        original: null,
        availableLanguages: [],
        isLoading: false,
        error: null,
      };
    }

    const data = translationDoc.data();
    const translation = data.translations?.[language] || null;
    const original = data.original || null;
    const availableLanguages = data.metadata?.availableLanguages || [];

    return {
      translation,
      original,
      availableLanguages,
      isLoading: false,
      error: null,
    };
  } catch (error) {
    return {
      translation: null,
      original: null,
      availableLanguages: [],
      isLoading: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Request translation for a provider
 */
export async function requestTranslation(
  providerId: string,
  targetLanguage: SupportedLanguage,
  userId?: string
): Promise<TranslatedContent> {
  const translateProvider = httpsCallable(functions, 'translateProvider');
  const result = await translateProvider({
    providerId,
    targetLanguage,
    userId,
  });

  const data = result.data as any;
  if (!data.success) {
    throw new Error(data.error || 'Translation failed');
  }

  if (data.isRobot) {
    throw new Error('Translation not available for robots');
  }

  return data.translation;
}

/**
 * Check if user is a robot
 */
export function isRobot(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent || '';
  return /bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|ia_archiver/i.test(userAgent);
}

export { SUPPORTED_LANGUAGES, LANGUAGE_NAMES };

