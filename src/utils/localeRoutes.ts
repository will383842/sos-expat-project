/**
 * Locale Routes Utility
 * Handles language-country locale prefixes in routes (e.g., /en-us/, /fr-fr/)
 */

type Language = "fr" | "en" | "es" | "ru" | "de" | "hi" | "pt" | "ch" | "ar";

// Map language to default country code
const LANGUAGE_TO_COUNTRY: Record<Language, string> = {
  fr: "fr",  // French → France
  en: "us",  // English → United States
  es: "es",  // Spanish → Spain
  ru: "ru",  // Russian → Russia
  de: "de",  // German → Germany
  hi: "in",  // Hindi → India
  pt: "pt",  // Portuguese → Portugal
  ch: "cn",  // Chinese → China
  ar: "sa",  // Arabic → Saudi Arabia
};

/**
 * Generate locale string (e.g., "en-us", "fr-fr")
 */
export function getLocaleString(lang: Language, country?: string): string {
  const countryCode = country || LANGUAGE_TO_COUNTRY[lang];
  return `${lang}-${countryCode}`;
}

/**
 * Parse locale from URL path
 * Example: "/en-us/dashboard" → { locale: "en-us", lang: "en", country: "us", pathWithoutLocale: "/dashboard" }
 */
export function parseLocaleFromPath(pathname: string): {
  locale: string | null;
  lang: Language | null;
  country: string | null;
  pathWithoutLocale: string;
} {
  const localePattern = /^\/([a-z]{2})-([a-z]{2})(\/.*)?$/;
  const match = pathname.match(localePattern);
  
  if (match) {
    return {
      locale: `${match[1]}-${match[2]}`,
      lang: match[1] as Language,
      country: match[2],
      pathWithoutLocale: match[3] || "/",
    };
  }
  
  return {
    locale: null,
    lang: null,
    country: null,
    pathWithoutLocale: pathname,
  };
}

/**
 * Get all supported locale strings
 */
export function getSupportedLocales(): string[] {
  return Object.keys(LANGUAGE_TO_COUNTRY).map((lang) =>
    getLocaleString(lang as Language)
  );
}

/**
 * Check if a path starts with a locale prefix
 */
export function hasLocalePrefix(pathname: string): boolean {
  return /^\/[a-z]{2}-[a-z]{2}(\/|$)/.test(pathname);
}

/**
 * Extract locale from pathname or return default
 */
export function getLocaleFromPath(pathname: string, defaultLang: Language): string {
  const parsed = parseLocaleFromPath(pathname);
  return parsed.locale || getLocaleString(defaultLang);
}

