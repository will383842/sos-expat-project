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

  // ===== ASIE (37 pays - non couverts par Stripe) =====
  // P1-1 FIX: Ajout CN (Chine), TR (Turquie), KZ (Kazakhstan) qui manquaient
  // 2026-05-04: KP (Corée du Nord) déplacé vers EMBARGOED_COUNTRIES
  "AF", "BD", "BT", "CN", "IN", "KH", "KZ", "LA", "MM", "NP", "PK", "LK", "TJ", "TM", "TR", "UZ", "VN",
  "MN", "KG", "PS", "YE", "OM", "QA", "KW", "BH", "JO", "LB", "AM", "AZ", "GE",
  "MV", "BN", "TL", "PH", "ID", "TW", "KR",

  // ===== AMERIQUE LATINE & CARAIBES (29 pays) =====
  // P1-1 FIX: Ajout AR (Argentine) et CO (Colombie) qui manquaient
  // 2026-05-04 FIX: Ajout CL, PE, UY qui manquaient
  // 2026-05-04: CU (Cuba) déplacé vers EMBARGOED_COUNTRIES (US OFAC)
  "AR", "BO", "CL", "CO", "EC", "PE", "PY", "SV", "GT", "HN", "NI", "SR", "UY", "VE",
  "HT", "DO", "JM", "TT", "BB", "BS", "BZ", "GY", "PA", "CR",
  "AG", "DM", "GD", "KN", "LC", "VC",

  // ===== EUROPE DE L'EST & BALKANS (12 pays non Stripe) =====
  // Note: GI (Gibraltar) est supporté par Stripe, donc pas ici
  // 2026-05-04: BY et RU déplacés vers EMBARGOED_COUNTRIES (sanctions US/EU)
  "MD", "UA", "RS", "BA", "MK", "ME", "AL", "XK",
  "AD", "MC", "SM", "VA",

  // ===== OCEANIE & PACIFIQUE (16 pays) =====
  // 2026-05-04 FIX: Ajout WF (Wallis-et-Futuna) — French collectivity using XPF
  // (not EUR), so it cannot share the FR-Stripe path; routed via PayPal.
  "FJ", "PG", "SB", "VU", "WS", "TO", "KI", "FM", "MH", "PW",
  "NR", "TV", "NC", "PF", "GU", "WF",

  // ===== MOYEN-ORIENT (5 pays restants) =====
  // 2026-05-04: IR (Iran) et SY (Syrie) déplacés vers EMBARGOED_COUNTRIES
  "IQ", "SA",
]);

// =============================================================================
// EMBARGOED / SANCTIONED COUNTRIES (rejected at registration + payment)
// =============================================================================
// These countries are blocked under comprehensive US OFAC sanctions and/or
// equivalent EU restrictions. PayPal and Stripe both refuse to process
// transactions to or from these jurisdictions, so accepting them in our
// routing lists creates a silent-failure UX (user signs up, payments
// systematically fail at the gateway). We reject them up-front instead.
//
// Note on Crimea: not an ISO 3166-1 alpha-2 code (it's a region of UA).
// PayPal and Stripe enforce Crimea sanctions via address/IP at their layer;
// we cannot enforce it from a 2-letter code list.
//
// Note on RU/BY: sanctions are partial and case-by-case (some payments
// allowed for non-listed entities). We treat them as fully blocked here for
// simplicity — if business requires it, move them back to PAYPAL_ONLY and
// rely on PayPal/Stripe's own per-transaction enforcement.

export const EMBARGOED_COUNTRIES = new Set([
  "CU", // Cuba — US OFAC + EU
  "IR", // Iran — US OFAC + EU + UN
  "KP", // North Korea — UN + US OFAC + EU
  "SY", // Syria — US OFAC + EU
  "RU", // Russia — US/EU sanctions since 2022 (treated as full block here)
  "BY", // Belarus — US/EU sanctions since 2022 (treated as full block here)
]);

/**
 * Check whether a country is under comprehensive sanctions.
 * Use this BEFORE the gateway routing to fail fast with a clear UX.
 */
export function isEmbargoedCountry(countryCode: string): boolean {
  if (!countryCode) return false;
  return EMBARGOED_COUNTRIES.has(countryCode.toUpperCase().trim());
}

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

  // Embargoed countries should never reach this function (validateCountryCode
  // rejects them earlier). If they somehow do, we throw rather than silently
  // route to PayPal — silent routing would create a dead-end UX where the user
  // hits payment and gets a generic refusal from the gateway.
  if (EMBARGOED_COUNTRIES.has(normalized)) {
    throw new Error(
      `EMBARGO: Country "${normalized}" is under comprehensive sanctions; ` +
      'no gateway accepts it. Validate the country before routing.'
    );
  }

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
 * Vérifie si un pays est PayPal-only.
 * Embargoed countries return false (they're neither Stripe nor PayPal — they're
 * blocked entirely; callers should check isEmbargoedCountry separately).
 */
export function isPayPalOnly(countryCode: string): boolean {
  const normalized = normalizeCountryCode(countryCode);
  if (EMBARGOED_COUNTRIES.has(normalized)) return false;
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

  // 2026-05-04: Embargoed countries are rejected up-front. Their payments
  // would silently fail at PayPal/Stripe, so accepting them at the API
  // boundary just creates dead users.
  if (EMBARGOED_COUNTRIES.has(trimmed)) {
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
    const upper = (countryCode || '').toUpperCase().trim();
    if (EMBARGOED_COUNTRIES.has(upper)) {
      throw new Error(
        `EMBARGO: Country "${upper}"${contextMsg} is under comprehensive ` +
        'international sanctions and cannot be used as a service country. ' +
        'Both Stripe and PayPal refuse transactions for this jurisdiction.'
      );
    }
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
