// multilingual-system.ts
export type LanguagesType =
  | "en" | "es" | "fr" | "de" | "ru" | "pt" | "hi" | "ch" | "ar";

export const SUPPORTED_LANGUAGES: LanguagesType[] = [
  "en", "es", "fr", "de", "ru", "pt", "hi", "ch", "ar",
];

// Map locales to URL prefixes (same code in this case)
export const localeToPrefix: Record<LanguagesType, string> = {
  en: "en",
  es: "es",
  fr: "fr",
  de: "de",
  ru: "ru",
  pt: "pt",
  hi: "hi",
  ch: "ch",  // Simplified Chinese or Chinese variant prefix
  ar: "ar",
};
