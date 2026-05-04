// Stripe Connect supported countries (46 countries)
// Source: https://stripe.com/global
// Synced with sos/firebase/functions/src/lib/paymentCountries.ts
// 2026-05-04: Added IL (Israel, since 2024) and IS (Iceland, since 2022).

import { countriesData } from '@/data/countries';

export const STRIPE_SUPPORTED_COUNTRIES = new Set([
  // North America
  'US', 'CA',
  // Europe (34) - 2026-05-04 added IS
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GI', 'GR', 'HU', 'IE', 'IS', 'IT',
  'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH', 'GB',
  // Asia-Pacific (7)
  'AU', 'HK', 'JP', 'MY', 'NZ', 'SG', 'TH',
  // Middle East (2) - 2026-05-04 added IL
  'AE', 'IL',
  // Latin America (2)
  'BR', 'MX',
]);

// 2026-05-04: French overseas territories (DOM/COM in EUR zone) — these ISO
// codes are technically separate from "FR" but use the euro and the underlying
// Stripe Connect account is created with country="FR". Treat them as Stripe-
// supported so the registration form doesn't reject providers from these
// territories.
const FRENCH_OVERSEAS_EUR = new Set([
  'BL', 'GF', 'GP', 'MF', 'MQ', 'PM', 'RE', 'YT',
]);

// Get ISO country code from localized country name
export const getCountryCode = (countryName: string): string => {
  if (!countryName) return 'US';

  const normalizedName = countryName.trim().toLowerCase();

  const country = countriesData.find(c => {
    return (
      c.nameFr?.toLowerCase() === normalizedName ||
      c.nameEn?.toLowerCase() === normalizedName ||
      c.nameEs?.toLowerCase() === normalizedName ||
      c.nameDe?.toLowerCase() === normalizedName ||
      c.namePt?.toLowerCase() === normalizedName ||
      c.nameRu?.toLowerCase() === normalizedName ||
      c.nameAr?.toLowerCase() === normalizedName ||
      c.nameIt?.toLowerCase() === normalizedName ||
      c.nameNl?.toLowerCase() === normalizedName ||
      c.nameZh?.toLowerCase() === normalizedName ||
      c.nameFr === countryName ||
      c.nameEn === countryName ||
      c.nameEs === countryName ||
      c.nameDe === countryName ||
      c.namePt === countryName ||
      c.nameRu === countryName ||
      c.nameAr === countryName ||
      c.nameIt === countryName ||
      c.nameNl === countryName ||
      c.nameZh === countryName
    );
  });

  return country?.code || 'US';
};

export const isCountrySupportedByStripe = (countryCode: string): boolean => {
  const upper = countryCode.toUpperCase();
  // Treat French overseas territories as Stripe-supported (they map to FR).
  if (FRENCH_OVERSEAS_EUR.has(upper)) return true;
  return STRIPE_SUPPORTED_COUNTRIES.has(upper);
};

export const getCountryNameFromCode = (code: string, lang: string): string => {
  const country = countriesData.find(c => c.code === code);
  if (!country) return code;

  const langMap: Record<string, keyof typeof country> = {
    fr: 'nameFr',
    en: 'nameEn',
    es: 'nameEs',
    de: 'nameDe',
    pt: 'namePt',
    ru: 'nameRu',
    ar: 'nameAr',
    hi: 'nameEn',
    ch: 'nameZh',
  };

  const prop = langMap[lang] || 'nameEn';
  return (country[prop] as string) || country.nameEn || code;
};
