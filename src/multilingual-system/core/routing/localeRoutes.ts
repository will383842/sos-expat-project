/**
 * Locale Routes Utility
 * Handles language-country locale prefixes in routes (e.g., /en-us/, /fr-fr/)
 ***/

import { getCachedGeoData, detectCountryFromTimezone } from "../country-manager/languageDetection";

type Language = "fr" | "en" | "es" | "ru" | "de" | "hi" | "pt" | "ch" | "ar";

// Map language to default country code (fallback only)
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
 * Get country code from geolocation (synchronous - uses cache and timezcone)
 * Returns lowercase country code or null if not available
 */
function getCountryFromGeolocation(): string | null {
  // Try cached geolocation data first (fastest, no API calls)
  const cachedCountry = getCachedGeoData();
  if (cachedCountry) {
    return cachedCountry.toLowerCase();
  }
  
  // Try timezone detection (no API, no rate limits)
  const timezoneCountry = detectCountryFromTimezone();
  if (timezoneCountry) {
    return timezoneCountry.toLowerCase();
  }
  
  return null;
}

/**
 * Generate locale string (e.g., "en-us", "fr-fr")
 * Uses geolocation country when available, falls back to language default
 */
export function getLocaleString(lang: Language, country?: string): string {
  // If country is explicitly provided, use it
  if (country) {
    return `${lang}-${country.toLowerCase()}`;
  }
  
  // Try to get country from geolocation
  const geoCountry = getCountryFromGeolocation();
  if (geoCountry) {
    return `${lang}-${geoCountry}`;
  }
  
  // Fallback to language-to-country mapping
  const countryCode = LANGUAGE_TO_COUNTRY[lang];
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

/**
 * Route slug translations
 * Maps route keys to their translated slugs for each language
 */
export type RouteKey = 
  | "lawyer"           // /avocat → /lawyers, /anwaelte, etc.
  | "expat"            // /expatrie → /expats, /expatriates, etc.
  | "register-lawyer"  // /register/lawyer → /register/avocat, /register/anwalt, etc.
  | "register-expat"   // /register/expat → /register/expatrie, etc.
  | "register-client"  // /register/client → /register/client, /inscription/client, etc.
  | "terms-lawyers"    // /terms-lawyers → /cgu-avocats, etc.
  | "terms-expats"     // /terms-expats → /cgu-expatries, etc.
  | "terms-clients"    // /terms-clients → /cgu-clients, etc.
  | "sos-call"         // /sos-appel → /emergency-call, /notruf, etc.
  | "expat-call"       // /appel-expatrie → /expat-call, etc.
  | "pricing"          // /tarifs → /pricing, /preise, etc.
  | "contact"           // /contact → /contacto, /kontakt, etc.
  | "how-it-works"      // /how-it-works → /comment-ca-marche, /como-funciona, etc.
  | "faq"               // /faq → /faq, /preguntas-frecuentes, etc.
  | "help-center"       // /centre-aide → /help-center, /centro-ayuda, etc.
  | "testimonials"      // /testimonials → /temoignages, /testimonios, etc.
  | "privacy-policy"    // /privacy-policy → /politique-confidentialite, etc.
  | "cookies"            // /cookies → /cookies, /cookies-politique, etc.
  | "consumers"          // /consumers → /consommateurs, /consumidores, etc.
  | "service-status"    // /statut-service → /service-status, /estado-servicio, etc.
  | "seo"               // /seo → /referencement, /seo, etc.
  | "providers"          // /providers → /prestataires, /proveedores, etc.
  | "dashboard"         // /dashboard → /tableau-de-bord, /panel, etc.
  | "profile-edit"       // /profile/edit → /profil/modifier, /perfil/editar, etc.
  | "call-checkout"      // /call-checkout → /paiement-appel, /pago-llamada, etc.
  | "booking-request"    // /booking-request → /demande-reservation, /solicitud-reserva, etc.
  | "payment-success"    // /payment-success → /paiement-reussi, /pago-exitoso, etc.
  | "dashboard-messages" // /dashboard/messages → /tableau-de-bord/messages, etc.
  | "login"              // /login → /connexion, /iniciar-sesion, etc.
  | "register"           // /register → /inscription, /registro, etc.
  | "password-reset";     // /password-reset → /reinitialisation-mot-de-passe, etc.

const ROUTE_TRANSLATIONS: Record<RouteKey, Record<Language, string>> = {
  "lawyer": {
    fr: "avocat",
    en: "lawyers",
    es: "abogados",
    ru: "юристы",
    de: "anwaelte",
    hi: "वकील",
    pt: "advogados",
    ch: "律师",
    ar: "محامون",
  },
  "expat": {
    fr: "expatrie",
    en: "expats",
    es: "expatriados",
    ru: "эмигранты",
    de: "expatriates",
    hi: "प्रवासी",
    pt: "expatriados",
    ch: "外籍人士",
    ar: "مغتربون",
  },
  "register-lawyer": {
    fr: "avocat",
    en: "lawyer",
    es: "abogado",
    ru: "юрист",
    de: "anwalt",
    hi: "वकील",
    pt: "advogado",
    ch: "律师",
    ar: "محام",
  },
  "register-expat": {
    fr: "expatrie",
    en: "expat",
    es: "expatriado",
    ru: "эмигрант",
    de: "expatriate",
    hi: "प्रवासी",
    pt: "expatriado",
    ch: "外籍人士",
    ar: "مغترب",
  },
  "terms-lawyers": {
    fr: "cgu-avocats",
    en: "terms-lawyers",
    es: "terminos-abogados",
    ru: "условия-для-юристов",
    de: "agb-anwaelte",
    hi: "वकील-शर्तें",
    pt: "termos-advogados",
    ch: "律师条款",
    ar: "شروط-المحامون",
  },
  "terms-expats": {
    fr: "cgu-expatries",
    en: "terms-expats",
    es: "terminos-expatriados",
    ru: "условия-для-эмигрантов",
    de: "agb-expatriates",
    hi: "प्रवासी-शर्तें",
    pt: "termos-expatriados",
    ch: "外籍人士条款",
    ar: "شروط-المغتربين",
  },
  "sos-call": {
    fr: "sos-appel",
    en: "emergency-call",
    es: "llamada-emergencia",
    ru: "экстренный-звонок",
    de: "notruf",
    hi: "आपात-कॉल",
    pt: "chamada-emergencia",
    ch: "紧急呼叫",
    ar: "مكالمة-طوارئ",
  },
  "expat-call": {
    fr: "appel-expatrie",
    en: "expat-call",
    es: "llamada-expatriado",
    ru: "звонок-эмигранту",
    de: "expatriate-anruf",
    hi: "प्रवासी-कॉल",
    pt: "chamada-expatriado",
    ch: "外籍人士呼叫",
    ar: "مكالمة-المغترب",
  },
  "register-client": {
    fr: "inscription-client",
    en: "register-client",
    es: "registro-cliente",
    ru: "регистрация-клиент",
    de: "registrierung-kunde",
    hi: "पंजीकरण-ग्राहक",
    pt: "registro-cliente",
    ch: "注册-客户",
    ar: "تسجيل-عميل",
  },
  "terms-clients": {
    fr: "cgu-clients",
    en: "terms-clients",
    es: "terminos-clientes",
    ru: "условия-для-клиентов",
    de: "agb-kunden",
    hi: "ग्राहक-शर्तें",
    pt: "termos-clientes",
    ch: "客户条款",
    ar: "شروط-العملاء",
  },
  "pricing": {
    fr: "tarifs",
    en: "pricing",
    es: "precios",
    ru: "цены",
    de: "preise",
    hi: "मूल्य-निर्धारण",
    pt: "precos",
    ch: "价格",
    ar: "الأسعار",
  },
  "contact": {
    fr: "contact",
    en: "contact",
    es: "contacto",
    ru: "контакты",
    de: "kontakt",
    hi: "संपर्क",
    pt: "contato",
    ch: "联系",
    ar: "اتصل-بنا",
  },
  "how-it-works": {
    fr: "comment-ca-marche",
    en: "how-it-works",
    es: "como-funciona",
    ru: "как-это-работает",
    de: "wie-es-funktioniert",
    hi: "यह-कैसे-काम-करता-है",
    pt: "como-funciona",
    ch: "工作原理",
    ar: "كيف-يعمل",
  },
  "faq": {
    fr: "faq",
    en: "faq",
    es: "preguntas-frecuentes",
    ru: "часто-задаваемые-вопросы",
    de: "faq",
    hi: "सामान्य-प्रश्न",
    pt: "perguntas-frequentes",
    ch: "常见问题",
    ar: "الأسئلة-الشائعة",
  },
  "help-center": {
    fr: "centre-aide",
    en: "help-center",
    es: "centro-ayuda",
    ru: "центр-помощи",
    de: "hilfezentrum",
    hi: "सहायता-केंद्र",
    pt: "centro-ajuda",
    ch: "帮助中心",
    ar: "مركز-المساعدة",
  },
  "testimonials": {
    fr: "temoignages",
    en: "testimonials",
    es: "testimonios",
    ru: "отзывы",
    de: "testimonials",
    hi: "प्रशंसापत्र",
    pt: "depoimentos",
    ch: "客户评价",
    ar: "الشهادات",
  },
  "privacy-policy": {
    fr: "politique-confidentialite",
    en: "privacy-policy",
    es: "politica-privacidad",
    ru: "политика-конфиденциальности",
    de: "datenschutzrichtlinie",
    hi: "गोपनीयता-नीति",
    pt: "politica-privacidade",
    ch: "隐私政策",
    ar: "سياسة-الخصوصية",
  },
  "cookies": {
    fr: "cookies",
    en: "cookies",
    es: "cookies",
    ru: "куки",
    de: "cookies",
    hi: "कुकीज़",
    pt: "cookies",
    ch: "Cookie政策",
    ar: "ملفات-التعريف",
  },
  "consumers": {
    fr: "consommateurs",
    en: "consumers",
    es: "consumidores",
    ru: "потребители",
    de: "verbraucher",
    hi: "उपभोक्ता",
    pt: "consumidores",
    ch: "消费者",
    ar: "المستهلكين",
  },
  "service-status": {
    fr: "statut-service",
    en: "service-status",
    es: "estado-servicio",
    ru: "статус-сервиса",
    de: "dienststatus",
    hi: "सेवा-स्थिति",
    pt: "status-servico",
    ch: "服务状态",
    ar: "حالة-الخدمة",
  },
  "seo": {
    fr: "referencement",
    en: "seo",
    es: "seo",
    ru: "seo",
    de: "seo",
    hi: "एसईओ",
    pt: "seo",
    ch: "SEO",
    ar: "تحسين-محركات-البحث",
  },
  "providers": {
    fr: "prestataires",
    en: "providers",
    es: "proveedores",
    ru: "поставщики",
    de: "anbieter",
    hi: "प्रदाता",
    pt: "prestadores",
    ch: "服务提供商",
    ar: "مقدمي-الخدمات",
  },
  "dashboard": {
    fr: "tableau-de-bord",
    en: "dashboard",
    es: "panel",
    ru: "панель",
    de: "dashboard",
    hi: "डैशबोर्ड",
    pt: "painel",
    ch: "仪表板",
    ar: "لوحة-التحكم",
  },
  "profile-edit": {
    fr: "profil",
    en: "profile",
    es: "perfil",
    ru: "профиль",
    de: "profil",
    hi: "प्रोफ़ाइल",
    pt: "perfil",
    ch: "个人资料",
    ar: "الملف-الشخصي",
  },
  "call-checkout": {
    fr: "paiement-appel",
    en: "call-checkout",
    es: "pago-llamada",
    ru: "оплата-звонка",
    de: "anruf-kasse",
    hi: "कॉल-चेकआउट",
    pt: "pagamento-chamada",
    ch: "通话结账",
    ar: "الدفع-المكالمة",
  },
  "booking-request": {
    fr: "demande-reservation",
    en: "booking-request",
    es: "solicitud-reserva",
    ru: "запрос-бронирования",
    de: "buchungsanfrage",
    hi: "बुकिंग-अनुरोध",
    pt: "solicitacao-reserva",
    ch: "预约请求",
    ar: "طلب-الحجز",
  },
  "payment-success": {
    fr: "paiement-reussi",
    en: "payment-success",
    es: "pago-exitoso",
    ru: "платеж-успешен",
    de: "zahlung-erfolgreich",
    hi: "भुगतान-सफल",
    pt: "pagamento-sucesso",
    ch: "支付成功",
    ar: "الدفع-نجح",
  },
  "dashboard-messages": {
    fr: "tableau-de-bord/messages",
    en: "dashboard/messages",
    es: "panel/mensajes",
    ru: "панель/сообщения",
    de: "dashboard/nachrichten",
    hi: "डैशबोर्ड/संदेश",
    pt: "painel/mensagens",
    ch: "仪表板/消息",
    ar: "لوحة-التحكم/الرسائل",
  },
  "login": {
    fr: "connexion",
    en: "login",
    es: "iniciar-sesion",
    ru: "вход",
    de: "anmeldung",
    hi: "लॉगिन",
    pt: "entrar",
    ch: "登录",
    ar: "تسجيل-الدخول",
  },
  "register": {
    fr: "inscription",
    en: "register",
    es: "registro",
    ru: "регистрация",
    de: "registrierung",
    hi: "पंजीकरण",
    pt: "cadastro",
    ch: "注册",
    ar: "التسجيل",
  },
  "password-reset": {
    fr: "reinitialisation-mot-de-passe",
    en: "password-reset",
    es: "restablecer-contrasena",
    ru: "сброс-пароля",
    de: "passwort-zurucksetzen",
    hi: "पासवर्ड-रीसेट",
    pt: "redefinir-senha",
    ch: "重置密码",
    ar: "إعادة-تعيين-كلمة-المرور",
  },
};

/**
 * Get translated route slug for a given route key and language
 * @param routeKey - The route key (e.g., "lawyer", "expat")
 * @param lang - The language code
 * @returns The translated slug
 */
export function getTranslatedRouteSlug(routeKey: RouteKey, lang: Language): string {
  return ROUTE_TRANSLATIONS[routeKey]?.[lang] || ROUTE_TRANSLATIONS[routeKey]?.["en"] || routeKey;
}

/**
 * Get all translated slugs for a route key (for route registration)
 * @param routeKey - The route key
 * @returns Array of all translated slugs
 */
export function getAllTranslatedSlugs(routeKey: RouteKey): string[] {
  return Object.values(ROUTE_TRANSLATIONS[routeKey] || {});
}

/**
 * Find route key from a slug (reverse lookup)
 * @param slug - The slug to look up
 * @returns The route key if found, null otherwise
 */
export function getRouteKeyFromSlug(slug: string): RouteKey | null {
  for (const [key, translations] of Object.entries(ROUTE_TRANSLATIONS)) {
    if (Object.values(translations).includes(slug)) {
      return key as RouteKey;
    }
  }
  return null;
}

/**
 * Check if a slug is a translated route slug
 * @param slug - The slug to check
 * @returns True if it's a known translated slug
 */
export function isTranslatedRouteSlug(slug: string): boolean {
  return getRouteKeyFromSlug(slug) !== null;
}

/**
 * Get translated route path for navigation
 * @param routeKey - The route key (e.g., "lawyer", "expat")
 * @param lang - The language code
 * @param params - Additional path parameters (e.g., { country: "france", language: "en", nameId: "..." })
 * @returns The full translated route path
 */
export function getTranslatedRoutePath(
  routeKey: RouteKey,
  lang: Language,
  params?: Record<string, string>
): string {
  const slug = getTranslatedRouteSlug(routeKey, lang);
  
  if (params) {
    // For dynamic routes like /lawyers/:country/:language/:nameId
    if (routeKey === "lawyer" || routeKey === "expat") {
      const { country, language, nameId } = params;
      if (country && language && nameId) {
        return `/${slug}/${country}/${language}/${nameId}`;
      }
    }
    // For register routes like /register/lawyer
    if (routeKey === "register-lawyer" || routeKey === "register-expat") {
      return `/register/${slug}`;
    }
  }
  
  // For simple routes
  return `/${slug}`;
}

