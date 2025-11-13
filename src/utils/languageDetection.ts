/**
 * Language Detection Utility
 * Detects user's language based on geolocation, browser settings, and saved preferences
 */

type Language = "fr" | "en" | "es" | "ru" | "de" | "hi" | "pt" | "ch" | "ar";

interface GeoLocationData {
  country_code?: string;
  country?: string;
}

/**
 * Map country codes to languages
 */
const COUNTRY_TO_LANGUAGE: Record<string, Language> = {
  // French-speaking countries
  'FR': 'fr',
  'BE': 'fr',
  'CH': 'fr',
  'CA': 'fr',
  'LU': 'fr',
  'MC': 'fr',
  'SN': 'fr',
  'CI': 'fr',
  'ML': 'fr',
  'BF': 'fr',
  'NE': 'fr',
  'TG': 'fr',
  'BJ': 'fr',
  'RW': 'fr',
  'BI': 'fr',
  'CD': 'fr',
  'CG': 'fr',
  'GA': 'fr',
  'CM': 'fr',
  'MG': 'fr',
  'DZ': 'fr',
  'MA': 'fr',
  'TN': 'fr',
  
  // Spanish-speaking countries
  'ES': 'es',
  'MX': 'es',
  'AR': 'es',
  'CO': 'es',
  'CL': 'es',
  'PE': 'es',
  'VE': 'es',
  'EC': 'es',
  'GT': 'es',
  'CU': 'es',
  'BO': 'es',
  'DO': 'es',
  'HN': 'es',
  'PY': 'es',
  'SV': 'es',
  'NI': 'es',
  'CR': 'es',
  'PA': 'es',
  'UY': 'es',
  'GQ': 'es',
  
  // English-speaking countries
  'US': 'en',
  'GB': 'en',
  'AU': 'en',
  'NZ': 'en',
  'IE': 'en',
  'ZA': 'en',
  'KE': 'en',
  'NG': 'en',
  'GH': 'en',
  'PH': 'en',
  'SG': 'en',
  'MY': 'en',
  'PK': 'en',
  'JM': 'en',
  'TT': 'en',
  'BB': 'en',
  'BZ': 'en',
  
  // German-speaking countries
  'DE': 'de',
  'AT': 'de',
  'LI': 'de',
  
  // Russian-speaking countries
  'RU': 'ru',
  'BY': 'ru',
  'KZ': 'ru',
  'KG': 'ru',
  'TJ': 'ru',
  'UZ': 'ru',
  'TM': 'ru',
  'AM': 'ru',
  'AZ': 'ru',
  'GE': 'ru',
  'MD': 'ru',
  'UA': 'ru',
  
  // Portuguese-speaking countries
  'BR': 'pt',
  'PT': 'pt',
  'AO': 'pt',
  'MZ': 'pt',
  'GW': 'pt',
  'TL': 'pt',
  'CV': 'pt',
  'ST': 'pt',
  
  // Hindi/Indian subcontinent
  'IN': 'hi',
  'NP': 'hi',
  'BD': 'hi',
  
  // Chinese-speaking regions
  'CN': 'ch',
  'TW': 'ch',
  'HK': 'ch',
  'MO': 'ch',
  
  // Arabic-speaking countries
  'SA': 'ar',
  'AE': 'ar',
  'EG': 'ar',
  'IQ': 'ar',
  'JO': 'ar',
  'KW': 'ar',
  'LB': 'ar',
  'LY': 'ar',
  'OM': 'ar',
  'PS': 'ar',
  'QA': 'ar',
  'SD': 'ar',
  'SY': 'ar',
  'YE': 'ar',
  'BH': 'ar',
  'DJ': 'ar',
  'MR': 'ar',
  'SO': 'ar',
};

/**
 * Map browser language codes to our supported languages
 */
const BROWSER_LANG_MAP: Record<string, Language> = {
  'fr': 'fr',
  'en': 'en',
  'es': 'es',
  'de': 'de',
  'ru': 'ru',
  'hi': 'hi',
  'pt': 'pt',
  'zh': 'ch',
  'ar': 'ar',
};

/**
 * Detect language from user's IP geolocation
 */
export async function detectLanguageFromLocation(): Promise<Language | null> {
  try {
    // Use ipapi.co - free tier allows 1000 requests/day, no API key needed
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error('Geolocation API failed');
    }
    
    const data: GeoLocationData = await response.json();
    const countryCode = data.country_code?.toUpperCase();
    
    if (countryCode && COUNTRY_TO_LANGUAGE[countryCode]) {
      console.log(`[Language] Detected from location: ${countryCode} → ${COUNTRY_TO_LANGUAGE[countryCode]}`);
      return COUNTRY_TO_LANGUAGE[countryCode];
    }
    
    return null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('[Language] Geolocation detection timed out');
    } else {
      console.warn('[Language] Geolocation detection failed:', error);
    }
    return null;
  }
}

/**
 * Detect language from browser settings
 */
export function detectLanguageFromBrowser(): Language | null {
  try {
    if (typeof navigator === 'undefined') return null;
    
    const languages = navigator.languages || [navigator.language];
    
    for (const lang of languages) {
      const code = lang.substring(0, 2).toLowerCase();
      if (BROWSER_LANG_MAP[code]) {
        console.log(`[Language] Detected from browser: ${lang} → ${BROWSER_LANG_MAP[code]}`);
        return BROWSER_LANG_MAP[code];
      }
    }
    
    return null;
  } catch (error) {
    console.warn('[Language] Browser detection failed:', error);
    return null;
  }
}

/**
 * Get saved language preference from localStorage
 */
export function getSavedLanguage(): Language | null {
  try {
    const saved = localStorage.getItem('sos_language');
    const validLanguages: Language[] = ['fr', 'en', 'es', 'ru', 'de', 'hi', 'pt', 'ch', 'ar'];
    
    if (saved && validLanguages.includes(saved as Language)) {
      console.log(`[Language] Using saved preference: ${saved}`);
      return saved as Language;
    }
    
    return null;
  } catch (error) {
    console.warn('[Language] Could not read saved language:', error);
    return null;
  }
}

/**
 * Detect user's preferred language with priority:
 * 1. Saved preference (if user manually set it)
 * 2. Geolocation (country-based)
 * 3. Browser language
 * 4. Default fallback
 */
export async function detectUserLanguage(defaultLang: Language = 'fr'): Promise<Language> {
  // Priority 1: Saved preference (user manually changed it)
  const savedLang = getSavedLanguage();
  if (savedLang) {
    return savedLang;
  }
  
  // Priority 2: Geolocation (country-based)
  const locationLang = await detectLanguageFromLocation();
  if (locationLang) {
    return locationLang;
  }
  
  // Priority 3: Browser language
  const browserLang = detectLanguageFromBrowser();
  if (browserLang) {
    return browserLang;
  }
  
  // Priority 4: Default fallback
  console.log(`[Language] Using default: ${defaultLang}`);
  return defaultLang;
}

/**
 * Save user's language preference
 */
export function saveLanguagePreference(lang: Language): void {
  try {
    localStorage.setItem('sos_language', lang);
    console.log(`[Language] Saved user preference: ${lang}`);
  } catch (error) {
    console.warn('[Language] Could not save language preference:', error);
  }
}

