/**
 * =============================================================================
 * PAYMENT COUNTRIES CONFIGURATION
 * =============================================================================
 *
 * Ce fichier centralise les listes de pays pour Stripe et PayPal.
 * Utilisé par :
 * - createStripeAccount.ts
 * - onProviderCreated.ts
 * - PayPalManager.ts
 * - Frontend: usePaymentGateway.ts (doit être synchronisé manuellement)
 *
 * IMPORTANT: Si vous modifiez ces listes, mettez également à jour :
 * - sos/src/hooks/usePaymentGateway.ts (frontend)
 */

// =============================================================================
// STRIPE SUPPORTED COUNTRIES (44 pays)
// =============================================================================
// Ces pays peuvent avoir un compte Stripe Express créé automatiquement
// Source: https://stripe.com/global

export const STRIPE_SUPPORTED_COUNTRIES = new Set([
  "AU", // Australia
  "AT", // Austria
  "BE", // Belgium
  "BG", // Bulgaria
  "BR", // Brazil
  "CA", // Canada
  "HR", // Croatia
  "CY", // Cyprus
  "CZ", // Czech Republic
  "DK", // Denmark
  "EE", // Estonia
  "FI", // Finland
  "FR", // France
  "DE", // Germany
  "GI", // Gibraltar
  "GR", // Greece
  "HK", // Hong Kong
  "HU", // Hungary
  "IE", // Ireland
  // 2026-05-04: Israel + Iceland are officially supported by Stripe Connect
  "IL", // Israel (Stripe Connect since 2024)
  "IS", // Iceland (Stripe Connect since 2022)
  "IT", // Italy
  "JP", // Japan
  "LV", // Latvia
  "LI", // Liechtenstein
  "LT", // Lithuania
  "LU", // Luxembourg
  "MY", // Malaysia
  "MT", // Malta
  "MX", // Mexico
  "NL", // Netherlands
  "NZ", // New Zealand
  "NO", // Norway
  "PL", // Poland
  "PT", // Portugal
  "RO", // Romania
  "SG", // Singapore
  "SK", // Slovakia
  "SI", // Slovenia
  "ES", // Spain
  "SE", // Sweden
  "CH", // Switzerland
  "TH", // Thailand
  "AE", // United Arab Emirates
  "GB", // United Kingdom
  "US", // United States
]);

// =============================================================================
// FRENCH OVERSEAS TERRITORIES (DOM/COM in EUR zone)
// =============================================================================
// These ISO codes are technically separate from "FR" but the territories use
// the euro and are administratively French — the Stripe Connect account is
// created with country="FR". We normalize them to FR before routing so
// providers/clients in DOM-TOM are not silently rejected by validateCountryCode.
//
// New Caledonia (NC), French Polynesia (PF), Wallis-Futuna (WF) use the CFP
// franc (XPF), not EUR — those stay routed via PayPal (NC and PF already are,
// WF added below).

const FRENCH_OVERSEAS_EUR = new Set([
  "BL", // Saint-Barthélemy
  "GF", // French Guiana
  "GP", // Guadeloupe
  "MF", // Saint-Martin (French part)
  "MQ", // Martinique
  "PM", // Saint-Pierre-et-Miquelon
  "RE", // Réunion
  "YT", // Mayotte
]);

/**
 * Normalize a country code: French overseas territories that use EUR are
 * mapped to "FR" so they go through the Stripe Connect FR flow. All other
 * codes are returned uppercase, untouched.
 */
export function normalizeCountryCode(countryCode: string): string {
  if (!countryCode) return countryCode;
  const upper = countryCode.toUpperCase().trim();
  if (FRENCH_OVERSEAS_EUR.has(upper)) return "FR";
  return upper;
}

// =============================================================================
// PAYPAL-ONLY COUNTRIES (150+ pays)
// =============================================================================
// Ces pays NE supportent PAS Stripe Connect et doivent utiliser PayPal
// Les providers dans ces pays ne sont PAS visibles jusqu'à connexion PayPal

export const PAYPAL_ONLY_COUNTRIES = new Set([
  // ===== AFRIQUE (54 pays) =====
  "DZ", "AO", "BJ", "BW", "BF", "BI", "CM", "CV", "CF", "TD", "KM", "CG", "CD",
  "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "KE",
  "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG",
  "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG",
  "ZM", "ZW",

  // ===== ASIE (38 pays - non couverts par Stripe) =====
  // P1-1 FIX: Ajout CN (Chine), TR (Turquie), KZ (Kazakhstan) qui manquaient
  "AF", "BD", "BT", "CN", "IN", "KH", "KZ", "LA", "MM", "NP", "PK", "LK", "TJ", "TM", "TR", "UZ", "VN",
  "MN", "KP", "KG", "PS", "YE", "OM", "QA", "KW", "BH", "JO", "LB", "AM", "AZ", "GE",
  "MV", "BN", "TL", "PH", "ID", "TW", "KR",

  // ===== AMERIQUE LATINE & CARAIBES (30 pays) =====
  // P1-1 FIX: Ajout AR (Argentine) et CO (Colombie) qui manquaient
  // 2026-05-04 FIX: Ajout CL, PE, UY qui manquaient
  "AR", "BO", "CL", "CO", "CU", "EC", "PE", "PY", "SV", "GT", "HN", "NI", "SR", "UY", "VE",
  "HT", "DO", "JM", "TT", "BB", "BS", "BZ", "GY", "PA", "CR",
  "AG", "DM", "GD", "KN", "LC", "VC",

  // ===== EUROPE DE L'EST & BALKANS (14 pays non Stripe) =====
  // Note: BY et RU sont inclus mais pourraient être sanctionnés
  // Note: GI (Gibraltar) est supporté par Stripe, donc pas ici
  "BY", "MD", "UA", "RS", "BA", "MK", "ME", "AL", "XK", "RU",
  "AD", "MC", "SM", "VA",

  // ===== OCEANIE & PACIFIQUE (16 pays) =====
  // 2026-05-04 FIX: Ajout WF (Wallis-et-Futuna) — French collectivity using XPF
  // (not EUR), so it cannot share the FR-Stripe path; routed via PayPal.
  "FJ", "PG", "SB", "VU", "WS", "TO", "KI", "FM", "MH", "PW",
  "NR", "TV", "NC", "PF", "GU", "WF",

  // ===== MOYEN-ORIENT (7 pays restants) =====
  "IQ", "IR", "SY", "SA",
]);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Détermine le gateway de paiement recommandé pour un pays
 */
export type PaymentGateway = "stripe" | "paypal";

export function getRecommendedPaymentGateway(countryCode: string): PaymentGateway {
  // 2026-05-04: normalize French overseas territories (BL, GF, GP, MF, MQ, PM,
  // RE, YT) to "FR" so they route through Stripe like mainland France.
  const normalized = normalizeCountryCode(countryCode);

  if (STRIPE_SUPPORTED_COUNTRIES.has(normalized)) {
    return "stripe";
  }

  // Par défaut, utiliser PayPal pour tous les autres pays
  return "paypal";
}

/**
 * Vérifie si un pays supporte Stripe Connect
 */
export function isStripeSupported(countryCode: string): boolean {
  return STRIPE_SUPPORTED_COUNTRIES.has(normalizeCountryCode(countryCode));
}

/**
 * Vérifie si un pays est PayPal-only
 */
export function isPayPalOnly(countryCode: string): boolean {
  const normalized = normalizeCountryCode(countryCode);
  return PAYPAL_ONLY_COUNTRIES.has(normalized) || !STRIPE_SUPPORTED_COUNTRIES.has(normalized);
}

/**
 * Retourne un message d'erreur approprié pour un pays non supporté par Stripe
 */
export function getStripeUnsupportedMessage(countryCode: string, locale: string = "en"): string {
  const messages: Record<string, Record<string, string>> = {
    en: {
      title: "Stripe not available",
      message: `Stripe is not available in your country (${countryCode}). Please use PayPal instead.`,
    },
    fr: {
      title: "Stripe non disponible",
      message: `Stripe n'est pas disponible dans votre pays (${countryCode}). Veuillez utiliser PayPal à la place.`,
    },
    es: {
      title: "Stripe no disponible",
      message: `Stripe no está disponible en tu país (${countryCode}). Por favor usa PayPal en su lugar.`,
    },
  };

  return messages[locale]?.message || messages.en.message;
}

// =============================================================================
// P0 FIX: COUNTRY CODE VALIDATION
// =============================================================================

/**
 * P0 FIX: Validate that a country code is in our supported whitelist
 * Prevents injection of invalid country codes
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "FR", "US")
 * @returns true if the country code is valid and supported
 */
export function isValidCountryCode(countryCode: string): boolean {
  if (!countryCode || typeof countryCode !== 'string') {
    return false;
  }

  const trimmed = countryCode.toUpperCase().trim();

  // Must be exactly 2 characters
  if (trimmed.length !== 2) {
    return false;
  }

  // Must only contain letters A-Z
  if (!/^[A-Z]{2}$/.test(trimmed)) {
    return false;
  }

  // 2026-05-04: French overseas territories (BL, GF, GP, MF, MQ, PM, RE, YT)
  // are accepted at this validation layer and normalized to FR downstream.
  const normalized = normalizeCountryCode(trimmed);

  // Must be in one of our supported country lists
  return STRIPE_SUPPORTED_COUNTRIES.has(normalized) ||
         PAYPAL_ONLY_COUNTRIES.has(normalized);
}

/**
 * P0 FIX: Validate country code and throw error if invalid
 * Use this at API boundaries to reject invalid input early
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @param context - Optional context for error message (e.g., "provider registration")
 * @throws Error if country code is invalid
 */
export function validateCountryCode(countryCode: string, context?: string): void {
  if (!isValidCountryCode(countryCode)) {
    const contextMsg = context ? ` during ${context}` : '';
    throw new Error(
      `P0 VALIDATION ERROR: Invalid country code "${countryCode}"${contextMsg}. ` +
      'Country code must be a valid ISO 3166-1 alpha-2 code (e.g., "FR", "US") ' +
      'for a supported country.'
    );
  }
}

/**
 * P0 FIX: Safely get payment gateway with validation
 * Validates country code before returning gateway recommendation
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Payment gateway recommendation
 * @throws Error if country code is invalid
 */
export function getValidatedPaymentGateway(countryCode: string): PaymentGateway {
  validateCountryCode(countryCode);
  return getRecommendedPaymentGateway(countryCode);
}

/**
 * Get all supported country codes (Stripe + PayPal)
 * Useful for frontend validation dropdowns
 */
export function getAllSupportedCountries(): string[] {
  return [
    ...Array.from(STRIPE_SUPPORTED_COUNTRIES),
    ...Array.from(PAYPAL_ONLY_COUNTRIES),
  ].sort();
}
