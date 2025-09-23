// src/i18n/constants/locales.ts
export const SUPPORTED_LOCALES = ['fr', 'en', 'es'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];
export const DEFAULT_LOCALE: SupportedLocale = 'fr';
