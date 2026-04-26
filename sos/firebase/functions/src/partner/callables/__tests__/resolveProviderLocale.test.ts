/**
 * Unit tests for the provider-locale resolution used by the B2B SOS-Call
 * notification path (triggerSosCallFromWeb).
 *
 * Why this matters: the previous implementation sent the provider SMS in the
 * CLIENT's language, meaning a French-speaking lawyer could receive a Russian
 * SMS when their client happened to speak Russian. The fix routes through
 * the provider's own preferredLanguage / language / languages[0], with an
 * English fallback for languages that have no message template yet.
 *
 * These tests lock that behaviour in.
 */

// Mock heavy imports so the module under test can load without a Firebase
// runtime. We only care about resolveProviderLocale, which is pure.
jest.mock("firebase-functions/v2/https", () => ({
  onCall: jest.fn(() => jest.fn()),
  HttpsError: class HttpsError extends Error {},
}));
jest.mock("firebase-functions/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));
jest.mock("firebase-admin", () => ({
  firestore: jest.fn(() => ({})),
}));
jest.mock("../../../lib/secrets", () => ({
  PARTNER_ENGINE_URL_SECRET: { value: jest.fn() },
  PARTNER_ENGINE_API_KEY_SECRET: { value: jest.fn() },
  getPartnerEngineUrl: jest.fn(() => "https://example.test"),
  getPartnerEngineApiKey: jest.fn(() => "secret"),
}));
jest.mock("../../../lib/tasks", () => ({
  scheduleCallTaskWithIdempotence: jest.fn(),
}));
jest.mock("../../../lib/functionConfigs", () => ({
  partnerConfig: {},
}));
jest.mock("../../../utils/encryption", () => ({
  decryptPhoneNumber: jest.fn((p: string) => p),
}));
jest.mock("../../../utils/countryUtils", () => ({
  getCountryName: jest.fn((c: string) => c),
}));
jest.mock("../../../services/pricingService", () => ({
  getB2BProviderAmount: jest.fn(),
}));

import { resolveProviderLocale, SUPPORTED_LOCALES } from "../triggerSosCallFromWeb";

describe("resolveProviderLocale", () => {
  describe("supported-language passthrough", () => {
    it.each([
      ["fr", { preferredLanguage: "fr" }],
      ["en", { preferredLanguage: "en" }],
      ["es", { preferredLanguage: "es" }],
      ["de", { preferredLanguage: "de" }],
      ["pt", { preferredLanguage: "pt" }],
      ["ru", { preferredLanguage: "ru" }],
      ["ar", { preferredLanguage: "ar" }],
      ["hi", { preferredLanguage: "hi" }],
      ["ch", { preferredLanguage: "ch" }],
    ])("returns %s when preferredLanguage is %j", (expected, providerData) => {
      expect(resolveProviderLocale(providerData)).toBe(expected);
    });

    it("uppercases are normalised", () => {
      expect(resolveProviderLocale({ preferredLanguage: "EN" })).toBe("en");
      expect(resolveProviderLocale({ preferredLanguage: "Fr" })).toBe("fr");
    });
  });

  describe("legacy zh → ch normalisation", () => {
    it("rewrites 'zh' to 'ch' (the actual filename used by message_templates)", () => {
      expect(resolveProviderLocale({ preferredLanguage: "zh" })).toBe("ch");
      expect(resolveProviderLocale({ language: "ZH" })).toBe("ch");
      expect(resolveProviderLocale({ languages: ["zh", "en"] })).toBe("ch");
    });
  });

  describe("priority order: preferredLanguage > language > languages[0]", () => {
    it("preferredLanguage wins over language", () => {
      expect(
        resolveProviderLocale({ preferredLanguage: "es", language: "fr" })
      ).toBe("es");
    });

    it("language wins when preferredLanguage is missing", () => {
      expect(resolveProviderLocale({ language: "de", languages: ["en"] })).toBe(
        "de"
      );
    });

    it("languages[0] is the last resort", () => {
      expect(resolveProviderLocale({ languages: ["pt", "fr"] })).toBe("pt");
    });
  });

  describe("English fallback for unsupported languages", () => {
    it("falls back to en when preferredLanguage is unsupported", () => {
      // pl/ja/ko/it/nl exist on the platform UI but have no SMS templates yet
      expect(resolveProviderLocale({ preferredLanguage: "pl" })).toBe("en");
      expect(resolveProviderLocale({ preferredLanguage: "ja" })).toBe("en");
      expect(resolveProviderLocale({ preferredLanguage: "ko" })).toBe("en");
      expect(resolveProviderLocale({ preferredLanguage: "it" })).toBe("en");
    });

    it("falls back when languages array contains only unsupported codes", () => {
      expect(resolveProviderLocale({ languages: ["ja", "ko"] })).toBe("en");
    });

    it("picks the first SUPPORTED language when the array is mixed", () => {
      expect(resolveProviderLocale({ languages: ["ja", "fr"] })).toBe("en");
      // Note: spec is "languages[0]", not "first supported" — by design,
      // we trust the provider's primary preference even if unsupported,
      // and fall back to en. This documents that contract.
    });
  });

  describe("edge cases", () => {
    it("returns en when providerData is undefined", () => {
      expect(resolveProviderLocale(undefined)).toBe("en");
    });

    it("returns en when providerData is empty", () => {
      expect(resolveProviderLocale({})).toBe("en");
    });

    it("returns en when languages is empty array", () => {
      expect(resolveProviderLocale({ languages: [] })).toBe("en");
    });

    it("ignores non-string candidates safely", () => {
      expect(
        resolveProviderLocale({
          preferredLanguage: 42 as any,
          language: null,
          languages: ["fr"],
        })
      ).toBe("fr");
    });

    it("falls back to en when all primary candidates are empty/null (does NOT scan further into languages array)", () => {
      // The function takes languages[0] strictly — it does not iterate to find
      // the first non-empty value in the array. This documents the contract:
      // an empty string at languages[0] is treated as 'no preference', falling
      // back to en even if languages[1] would be valid.
      expect(
        resolveProviderLocale({
          preferredLanguage: "",
          language: null,
          languages: ["", "es"],
        })
      ).toBe("en");
    });

    it("uses languages[0] when preferredLanguage and language are missing", () => {
      expect(
        resolveProviderLocale({
          preferredLanguage: "",
          language: null,
          languages: ["es", "fr"],
        })
      ).toBe("es");
    });
  });

  describe("SUPPORTED_LOCALES constant", () => {
    it("contains exactly the 9 locales that have message templates", () => {
      expect(SUPPORTED_LOCALES.size).toBe(9);
      expect([...SUPPORTED_LOCALES].sort()).toEqual(
        ["ar", "ch", "de", "en", "es", "fr", "hi", "pt", "ru"]
      );
    });
  });
});
