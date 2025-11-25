// firebase/functions/src/services/providerTranslationService.ts
import * as admin from 'firebase-admin';
import { db, FieldValue } from '../utils/firebase';

export type SupportedLanguage = 'fr' | 'en' | 'es' | 'pt' | 'de' | 'ru' | 'zh' | 'hi' | 'ar';

export interface OriginalProfile {
  originalLanguage: SupportedLanguage | string; // Can be any language (e.g., 'nl', 'it')
  title: string;
  summary: string;
  description: string;
  specialties: string[];
  cta: string;
  lastModified: admin.firestore.Timestamp | Date;
  // For change detection
  titleHash?: string;
  summaryHash?: string;
  descriptionHash?: string;
  specialtiesHash?: string;
  ctaHash?: string;
}

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

export interface TranslationMetadata {
  status: 'missing' | 'created' | 'outdated' | 'frozen';
  createdAt?: admin.firestore.Timestamp | Date;
  updatedAt?: admin.firestore.Timestamp | Date;
  cost: number;
  userId?: string;
  version: number;
}

export interface ProviderTranslationDoc {
  original: OriginalProfile;
  translations: {
    [key in SupportedLanguage]?: TranslatedContent;
  };
  metadata: {
    availableLanguages: SupportedLanguage[];
    translationCosts: {
      [key in SupportedLanguage]?: {
        cost: number;
        date: admin.firestore.Timestamp | Date;
        userId?: string;
      };
    };
    totalCost: number;
    lastUpdated: admin.firestore.Timestamp | Date;
    createdAt: admin.firestore.Timestamp | Date;
    frozenLanguages: SupportedLanguage[];
  };
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['fr', 'en', 'es', 'pt', 'de', 'ru', 'zh', 'hi', 'ar'];
const TRANSLATION_COST = 0.15; // €0.15 per translation

/**
 * Normalize language code to ISO 639-1 format
 **/

function normalizeLanguageCode(lang: string): string {
  const normalized = lang.toLowerCase().split('-')[0].trim();
  const langMap: Record<string, string> = {
    'de': 'de', 'german': 'de', 'deutsch': 'de',
    'fr': 'fr', 'french': 'fr', 'francais': 'fr', 'français': 'fr',
    'en': 'en', 'english': 'en', 'anglais': 'en',
    'es': 'es', 'spanish': 'es', 'espagnol': 'es', 'español': 'es',
    'pt': 'pt', 'portuguese': 'pt', 'portugais': 'pt', 'português': 'pt',
    'ru': 'ru', 'russian': 'ru', 'russe': 'ru', 'русский': 'ru',
    'zh': 'zh', 'chinese': 'zh', 'ch': 'zh', 'chinois': 'zh', '中文': 'zh',
    'hi': 'hi', 'hindi': 'hi', 'hindi': 'hi', 'हिन्दी': 'hi',
    'ar': 'ar', 'arabic': 'ar', 'arabe': 'ar', 'العربية': 'ar',
  };
  return langMap[normalized] || normalized;
}

/**
 * Check if language is in supported list
 */
function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}

/**
 * Get language from country (fallback)
 */
function getLanguageFromCountry(country: string): string | null {
  const countryMap: Record<string, string> = {
    'germany': 'de', 'deutschland': 'de', 'allemagne': 'de',
    'france': 'fr', 'frankreich': 'fr',
    'spain': 'es', 'espagne': 'es', 'spanien': 'es',
    'portugal': 'pt',
    'russia': 'ru', 'russie': 'ru', 'russland': 'ru',
    'china': 'zh', 'chine': 'zh', 'chinesisch': 'zh',
    'india': 'hi', 'inde': 'hi',
    'saudi arabia': 'ar', 'arabie saoudite': 'ar',
  };
  const normalized = country.toLowerCase().trim();
  return countryMap[normalized] || null;
}

/**
 * Simple hash function for change detection
 */
function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Detect original language from provider data
 */
export function detectOriginalLanguage(profileData: any): string {
  // Priority 1: Explicit originalLanguage field
  if (profileData.originalLanguage) {
    return normalizeLanguageCode(profileData.originalLanguage);
  }
  
  // Priority 2: Preferred language
  if (profileData.preferredLanguage) {
    const lang = normalizeLanguageCode(profileData.preferredLanguage);
    if (lang) {
      return lang;
    }
  }
  
  // Priority 3: Main language (first in array)
  if (profileData.languages && Array.isArray(profileData.languages) && profileData.languages.length > 0) {
    const lang = normalizeLanguageCode(profileData.languages[0]);
    if (lang) {
      return lang;
    }
  }
  
  // Priority 4: Country-based inference
  if (profileData.country) {
    const countryLang = getLanguageFromCountry(profileData.country);
    if (countryLang) {
      return countryLang;
    }
  }
  
  // Fallback to English
  return 'en';
}

/**
 * Extract original profile from sos_profiles document
 */
export async function extractOriginalProfile(providerId: string): Promise<OriginalProfile | null> {
  try {
    const profileDoc = await db.collection('sos_profiles').doc(providerId).get();
    if (!profileDoc.exists) {
      return null;
    }

    const data = profileDoc.data()!;
    const originalLanguage = detectOriginalLanguage(data);
    
    const title = data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Expert';
    const summary = truncate(data.description || data.bio || '', 150);
    const description = truncate(data.description || data.bio || '', 2000);
    const specialties = data.specialties || data.helpTypes || [];
    const cta = data.type === 'lawyer' ? 'Book Consultation' : 'Get Help';
    
    return {
      originalLanguage,
      title,
      summary,
      description,
      specialties,
      cta,
      lastModified: data.updatedAt || data.createdAt || admin.firestore.Timestamp.now(),
      titleHash: simpleHash(title),
      summaryHash: simpleHash(summary),
      descriptionHash: simpleHash(description),
      specialtiesHash: simpleHash(specialties.join(',')),
      ctaHash: simpleHash(cta),
    };
  } catch (error) {
    console.error('Error extracting original profile:', error);
    return null;
  }
}

/**
 * Generate translated slug
 * Format: {translated-specialty}-{firstname}-{city-optional}
 * Max 70 chars, no accents, lowercase, hyphens
 */
export function generateTranslatedSlug(
  specialty: string,
  firstName: string,
  city?: string,
  existingSlugs: string[] = []
): string {
  const normalize = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const specialtySlug = normalize(specialty);
  const firstNameSlug = normalize(firstName);
  const citySlug = city ? normalize(city) : '';
  
  let baseSlug = `${specialtySlug}-${firstNameSlug}`;
  if (citySlug) {
    const withCity = `${baseSlug}-${citySlug}`;
    if (withCity.length <= 70) {
      baseSlug = withCity;
    }
  }
  
  // Truncate to 70 chars
  if (baseSlug.length > 70) {
    baseSlug = baseSlug.substring(0, 70).replace(/-+$/, '');
  }
  
  // Handle duplicates
  let finalSlug = baseSlug;
  let counter = 2;
  while (existingSlugs.includes(finalSlug)) {
    const suffix = `-${counter}`;
    finalSlug = baseSlug.substring(0, 70 - suffix.length) + suffix;
    counter++;
  }
  
  return finalSlug;
}

/**
 * Generate SEO metadata for translated content
 */
export function generateSEO(
  translated: TranslatedContent,
  providerData: any,
  language: SupportedLanguage
): TranslatedContent['seo'] {
  const isLawyer = providerData.type === 'lawyer';
  const typeLabel = isLawyer 
    ? (language === 'fr' ? 'Avocat' : language === 'de' ? 'Anwalt' : 'Lawyer')
    : (language === 'fr' ? 'Expatrié' : language === 'de' ? 'Expatriate' : 'Expat');
  
  const metaTitle = truncate(`${translated.title} - ${typeLabel} ${providerData.country || ''}`, 60);
  const metaDescription = truncate(translated.description, 160);
  
  return {
    metaTitle,
    metaDescription,
    ogTitle: metaTitle,
    ogDescription: metaDescription,
    h1: translated.title,
    h2: translated.specialties[0] || typeLabel,
    h3: providerData.city || providerData.country || '',
    imageAltTexts: [
      `${translated.title} profile photo`,
      `${translated.title} - ${typeLabel}`,
    ],
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': isLawyer ? 'Attorney' : 'Person',
      name: translated.title,
      description: metaDescription,
      jobTitle: typeLabel,
      address: {
        '@type': 'PostalAddress',
        addressCountry: providerData.country,
        addressLocality: providerData.city,
      },
    },
  };
}

/**
 * Translate text using translation API
 * TODO: Integrate with actual translation API (Google Translate, DeepL, etc.)
 */
async function translateText(
  text: string,
  from: string,
  to: SupportedLanguage
): Promise<string> {
  // TODO: Replace with actual API call
  // For now, return placeholder
  // Example with DeepL:
  /*
  const response = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: [text],
      source_lang: from.toUpperCase(),
      target_lang: to.toUpperCase(),
    }),
  });
  const result = await response.json();
  return result.translations[0].text;
  */
  
  // Placeholder - in production, use actual API
  console.warn(`[Translation] Placeholder translation: ${from} → ${to}`);
  return `[TRANSLATED: ${to}] ${text}`;
}

/**
 * Translate profile to target language
 */
export async function translateProfile(
  original: OriginalProfile,
  targetLanguage: SupportedLanguage,
  providerData: any
): Promise<TranslatedContent> {
  if (!SUPPORTED_LANGUAGES.includes(targetLanguage)) {
    throw new Error(`Unsupported target language: ${targetLanguage}`);
  }

  const sourceLang = normalizeLanguageCode(original.originalLanguage);
  
  // Translate all text fields
  const [title, summary, description, specialties, cta] = await Promise.all([
    translateText(original.title, sourceLang, targetLanguage),
    translateText(original.summary, sourceLang, targetLanguage),
    translateText(original.description, sourceLang, targetLanguage),
    Promise.all(original.specialties.map(s => translateText(s, sourceLang, targetLanguage))),
    translateText(original.cta, sourceLang, targetLanguage),
  ]);

  // Generate slug
  const existingSlugs: string[] = []; // TODO: Fetch existing slugs for this provider
  const slug = generateTranslatedSlug(
    specialties[0] || 'expert',
    providerData.firstName || 'expert',
    providerData.city,
    existingSlugs
  );

  // Generate SEO
  const translated: TranslatedContent = {
    title,
    summary,
    description,
    specialties,
    cta,
    slug,
    seo: {} as any, // Will be filled below
  };

  translated.seo = generateSEO(translated, providerData, targetLanguage);

  // TODO: Generate FAQ translations if FAQ exists
  // translated.faq = await generateFAQTranslation(original, sourceLang, targetLanguage);

  return translated;
}

/**
 * Save translation to Firestore
 */
export async function saveTranslation(
  providerId: string,
  language: SupportedLanguage,
  translation: TranslatedContent,
  userId?: string
): Promise<void> {
  const translationRef = db.collection('providers_translations').doc(providerId);
  const doc = await translationRef.get();

  const updateData: any = {
    [`translations.${language}`]: translation,
    [`metadata.availableLanguages`]: FieldValue.arrayUnion(language),
    [`metadata.translationCosts.${language}`]: {
      cost: TRANSLATION_COST,
      date: FieldValue.serverTimestamp(),
      userId: userId || null,
    },
    [`metadata.totalCost`]: FieldValue.increment(TRANSLATION_COST),
    [`metadata.lastUpdated`]: FieldValue.serverTimestamp(),
    [`metadata.translations.${language}.status`]: 'created',
    [`metadata.translations.${language}.createdAt`]: FieldValue.serverTimestamp(),
    [`metadata.translations.${language}.updatedAt`]: FieldValue.serverTimestamp(),
    [`metadata.translations.${language}.version`]: 1,
  };

  if (!doc.exists) {
    // First time: save original profile
    const original = await extractOriginalProfile(providerId);
    if (!original) {
      throw new Error('Provider not found');
    }
    
    updateData.original = original;
    updateData.metadata = {
      availableLanguages: [language],
      translationCosts: {
        [language]: {
          cost: TRANSLATION_COST,
          date: FieldValue.serverTimestamp(),
          userId: userId || null,
        },
      },
      totalCost: TRANSLATION_COST,
      createdAt: FieldValue.serverTimestamp(),
      lastUpdated: FieldValue.serverTimestamp(),
      frozenLanguages: [],
      translations: {
        [language]: {
          status: 'created',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          cost: TRANSLATION_COST,
          userId: userId || null,
          version: 1,
        },
      },
    };
  } else {
    // Update existing
    const existing = doc.data() as ProviderTranslationDoc;
    const existingVersion = existing.metadata.translations?.[language]?.version || 0;
    updateData[`metadata.translations.${language}.version`] = existingVersion + 1;
  }

  await translationRef.set(updateData, { merge: true });
}

/**
 * Get translation or return null if doesn't exist
 */
export async function getTranslation(
  providerId: string,
  language: SupportedLanguage
): Promise<TranslatedContent | null> {
  try {
    const doc = await db.collection('providers_translations').doc(providerId).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as ProviderTranslationDoc;
    return data.translations[language] || null;
  } catch (error) {
    console.error('Error getting translation:', error);
    return null;
  }
}

/**
 * Get original profile
 */
export async function getOriginalProfile(providerId: string): Promise<OriginalProfile | null> {
  try {
    const doc = await db.collection('providers_translations').doc(providerId).get();
    if (!doc.exists) {
      // Try to extract from sos_profiles
      return await extractOriginalProfile(providerId);
    }
    return doc.data()?.original || null;
  } catch (error) {
    console.error('Error getting original profile:', error);
    return null;
  }
}

/**
 * Get translation status for all languages
 */
export async function getTranslationStatus(providerId: string): Promise<{
  [key in SupportedLanguage]?: TranslationMetadata;
}> {
  try {
    const doc = await db.collection('providers_translations').doc(providerId).get();
    if (!doc.exists) {
      return {};
    }

    const data = doc.data() as ProviderTranslationDoc;
    return data.metadata.translations || {};
  } catch (error) {
    console.error('Error getting translation status:', error);
    return {};
  }
}

/**
 * Check if translation is outdated
 */
export async function checkTranslationOutdated(
  providerId: string,
  language: SupportedLanguage
): Promise<boolean> {
  const original = await getOriginalProfile(providerId);
  if (!original) {
    return false;
  }

  const doc = await db.collection('providers_translations').doc(providerId).get();
  if (!doc.exists) {
    return false;
  }

  const data = doc.data() as ProviderTranslationDoc;
  const translation = data.translations[language];
  if (!translation) {
    return false;
  }

  // Compare hashes to detect changes
  const currentTitleHash = simpleHash(original.title);
  const currentSummaryHash = simpleHash(original.summary);
  const currentDescriptionHash = simpleHash(original.description);
  const currentSpecialtiesHash = simpleHash(original.specialties.join(','));

  // If any hash changed, translation is outdated
  return (
    original.titleHash !== currentTitleHash ||
    original.summaryHash !== currentSummaryHash ||
    original.descriptionHash !== currentDescriptionHash ||
    original.specialtiesHash !== currentSpecialtiesHash
  );
}

/**
 * Truncate text to max length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

export { SUPPORTED_LANGUAGES, TRANSLATION_COST };

