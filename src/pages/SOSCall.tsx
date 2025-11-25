import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  Phone,
  Star,
  MapPin,
  Search,
  ChevronDown,
  Wifi,
  WifiOff,
  Heart,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowRight,
  Globe,
  Users,
  Zap,
  HelpCircle,
  Shield,
  Clock,
  MessageCircle,
  CheckCircle,
} from "lucide-react";
import {
  collection,
  query,
  limit,
  onSnapshot,
  where,
  DocumentData,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebase";
import Layout from "../components/layout/Layout";
import { useApp } from "../contexts/AppContext";
import { FormattedMessage, useIntl } from "react-intl";

// ========================================
// 🌍 IMPORTS POUR INTERNATIONALISATION
// ========================================
import { 
  countriesData, 
  getSortedCountries, 
  type LanguageKey,
  type CountryData 
} from '../data/countries';

import { 
  getCountryName, 
  formatLanguages,
  convertLanguageNamesToCodes 
} from "../utils/formatters";

import { 
  languagesData, 
  getLanguageLabel, 
  type SupportedLocale,
  type Language 
} from '../data/languages-spoken';


/* =========================
   Types
========================= */
interface Provider {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  type: "lawyer" | "expat";
  country: string;
  languages: string[];
  reviewCount: number;
  yearsOfExperience: number;
  rating: number;
  price: number;
  isOnline: boolean;
  avatar: string;
  specialties: string[];
  interventionCountries?: string[];
  description: string;
  duration?: number;
  isActive?: boolean;
  isVisible?: boolean;
  isApproved?: boolean;
  isBanned?: boolean;
  role?: string;
  isAdmin?: boolean;
}

interface RawProfile extends DocumentData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  type?: "lawyer" | "expat" | string;
  currentPresenceCountry?: string;
  country?: string;
  languages?: string[];
  specialties?: string[];
  rating?: number;
  reviewCount?: number;
  yearsOfExperience?: number;
  yearsAsExpat?: number;
  isOnline?: boolean;
  isActive?: boolean;
  isVisible?: boolean;
  isApproved?: boolean;
  isBanned?: boolean;
  role?: string;
  isAdmin?: boolean;
  bio?: string;
  price?: number;
  duration?: number;
  profilePhoto?: string;
}

interface FAQItem {
  questionKey: string;
  answerKey: string;
}

/* =========================
   Constants
========================= */
const CARD_DIMENSIONS = {
  width: 320,
  height: 520,
  imageHeight: 288,
  contentHeight: 232,
} as const;

const PAGE_SIZE = 9;
const BASE_URL = "https://sos-expat.com";
const PAGE_PATH = "/sos-appel";

// ========================================
// 🔍 SEO CONSTANTS - URLS et LOCALES
// ========================================

// URLs des réseaux sociaux (constantes, jamais traduites)
const SOCIAL_URLS = {
  facebook: "https://www.facebook.com/sosexpat",
  linkedin: "https://www.linkedin.com/company/sosexpat",
  twitter: "https://twitter.com/sosexpat",
  instagram: "https://www.instagram.com/sosexpat",
} as const;

// Mapping correct og:locale pour chaque langue
const OG_LOCALES: Record<string, string> = {
  fr: "fr_FR",
  en: "en_US",
  es: "es_ES",
  de: "de_DE",
  pt: "pt_BR",
  ru: "ru_RU",
  zh: "zh_CN",
  ar: "ar_SA",
  hi: "hi_IN",
  ch: "zh_CN",
};

// Langues supportées pour hreflang
const SUPPORTED_LANGUAGES = ['fr', 'en', 'es', 'de', 'pt', 'ru', 'zh', 'ar', 'hi'] as const;

// 8 FAQ pour Featured Snippet (Position 0)
const FAQ_ITEMS: FAQItem[] = [
  { questionKey: "sosCall.faq.q1", answerKey: "sosCall.faq.a1" },
  { questionKey: "sosCall.faq.q2", answerKey: "sosCall.faq.a2" },
  { questionKey: "sosCall.faq.q3", answerKey: "sosCall.faq.a3" },
  { questionKey: "sosCall.faq.q4", answerKey: "sosCall.faq.a4" },
  { questionKey: "sosCall.faq.q5", answerKey: "sosCall.faq.a5" },
  { questionKey: "sosCall.faq.q6", answerKey: "sosCall.faq.a6" },
  { questionKey: "sosCall.faq.q7", answerKey: "sosCall.faq.a7" },
  { questionKey: "sosCall.faq.q8", answerKey: "sosCall.faq.a8" },
];

const LANGUAGE_MAP: Record<string, string> = {
  Français: "Français",
  French: "Français",
  fr: "Français",
  FR: "Français",
  Anglais: "Anglais",
  English: "Anglais",
  en: "Anglais",
  EN: "Anglais",
  Espagnol: "Espagnol",
  Spanish: "Espagnol",
  Español: "Espagnol",
  es: "Espagnol",
  ES: "Espagnol",
  Português: "Portugais",
  Portuguese: "Portugais",
  pt: "Portugais",
  PT: "Portugais",
  Deutsch: "Allemand",
  German: "Allemand",
  de: "Allemand",
  DE: "Allemand",
  Italiano: "Italien",
  Italian: "Italien",
  it: "Italien",
  IT: "Italien",
};

const FLAG_MAP: Record<string, string> = {
  France: "🇫🇷",
  Espagne: "🇪🇸",
  Spain: "🇪🇸",
  Canada: "🇨🇦",
  Portugal: "🇵🇹",
  Allemagne: "🇩🇪",
  Germany: "🇩🇪",
  Italie: "🇮🇹",
  Italy: "🇮🇹",
  Belgique: "🇧🇪",
  Belgium: "🇧🇪",
  Suisse: "🇨🇭",
  Switzerland: "🇨🇭",
  "Royaume-Uni": "🇬🇧",
  "United Kingdom": "🇬🇧",
  "États-Unis": "🇺🇸",
  "United States": "🇺🇸",
  "Pays-Bas": "🇳🇱",
  Netherlands: "🇳🇱",
};

const PROFESSION_ICONS: Record<string, { icon: string; bgColor: string; textColor: string }> = {
  lawyer: {
    icon: "⚖️",
    bgColor: "bg-slate-100",
    textColor: "text-slate-800",
  },
  expat: {
    icon: "🌍",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
  },
};

/* =========================
   Utils
========================= */
const getBrowserLanguage = (): "fr" | "en" | "es" => {
  if (typeof window === "undefined") return "fr";
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("fr")) return "fr";
  if (browserLang.startsWith("es")) return "es";
  return "en";
};

const getLanguage = (userLanguage?: string): "fr" | "en" | "es" => {
  if (userLanguage) return userLanguage as "fr" | "en" | "es";
  return getBrowserLanguage();
};

const getProfessionInfo = (type: string) => {
  return PROFESSION_ICONS[type] || PROFESSION_ICONS["expat"];
};

const mapLanguageLabelLocal = (language: string): string => {
  return LANGUAGE_MAP[language] || language;
};

const getCountryFlag = (country: string): string => {
  return FLAG_MAP[country] || "🌍";
};

const useStatusColors = (isOnline: boolean) => {
  return useMemo(
    () =>
      isOnline
        ? {
            border: "border-green-300",
            shadow: "shadow-green-100",
            glow: "shadow-green-200/50",
            borderShadow: "drop-shadow-[0_0_8px_rgba(34,197,94,0.3)]",
            badge: "bg-green-100 text-green-800 border-green-300",
            button:
              "bg-green-700 hover:bg-green-800 active:bg-green-900 border-green-700",
            accent: "text-green-700",
          }
        : {
            border: "border-red-300",
            shadow: "shadow-red-100",
            glow: "shadow-red-200/50",
            borderShadow: "drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]",
            badge: "bg-red-100 text-red-800 border-red-300",
            button:
              "bg-red-700 hover:bg-red-800 active:bg-red-900 border-red-700",
            accent: "text-red-700",
          },
    [isOnline]
  );
};

const slugify = (s: string) =>
  (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

/* =========================
   🌍 Fonctions de traduction dynamique
========================= */
const getCountryLanguageKey = (locale: string): LanguageKey => {
  const mapping: Record<string, LanguageKey> = {
    'fr': 'nameFr',
    'en': 'nameEn',
    'es': 'nameEs',
    'de': 'nameDe',
    'pt': 'namePt',
    'ru': 'nameRu',
    'hi': 'nameFr',
    'ch': 'nameZh',
    'zh': 'nameZh',
    'ar': 'nameAr',
    'it': 'nameIt',
    'nl': 'nameNl',
  };
  return mapping[locale.toLowerCase()] || 'nameEn';
};

const getLanguagesLocale = (locale: string): SupportedLocale => {
  const mapping: Record<string, SupportedLocale> = {
    'fr': 'fr',
    'en': 'en',
    'es': 'es',
    'de': 'de',
    'pt': 'pt',
    'ru': 'ru',
    'hi': 'hi',
    'ch': 'ch',
    'zh': 'ch',
    'ar': 'ar',
  };
  return mapping[locale.toLowerCase()] || 'fr';
};

const getCountryOptions = (locale: string): string[] => {
  const langKey = getCountryLanguageKey(locale);
  return getSortedCountries(langKey)
    .filter(country => country.code !== 'SEPARATOR')
    .map(country => country[langKey]);
};

const getLanguageOptions = (locale: string): string[] => {
  const supportedLocale = getLanguagesLocale(locale);
  return languagesData
    .map(lang => getLanguageLabel(lang, supportedLocale))
    .sort((a, b) => {
      const sortLocale = supportedLocale === 'ch' ? 'zh' : supportedLocale;
      return a.localeCompare(b, sortLocale);
    });
};

/* =========================
   🔍 JSON-LD Schema Generator (SEO)
========================= */
const generateAllSchemas = (
  intl: ReturnType<typeof useIntl>,
  providers: Provider[],
  selectedType: string,
  onlineCount: number,
  currentLang: string  // Ajout de la langue courante
) => {
  // URL localisée de la page courante
  const localizedPageUrl = `${BASE_URL}/${currentLang}${PAGE_PATH}`;
  
  // 1. Organization Schema (URLs constantes, non localisées)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    name: "SOS Expat",
    url: BASE_URL,
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/logo.png`,
      width: 512,
      height: 512,
    },
    description: intl.formatMessage({ id: "sosCall.seo.organizationDescription" }),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: intl.formatMessage({ id: "sosCall.seo.contactType" }),
      availableLanguage: ["French", "English", "Spanish", "German", "Portuguese", "Russian", "Chinese", "Arabic", "Hindi"],
    },
    sameAs: Object.values(SOCIAL_URLS),
  };

  // 2. WebSite Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    url: BASE_URL,
    name: "SOS Expat",
    description: intl.formatMessage({ id: "sosCall.seo.websiteDescription" }),
    publisher: { "@id": `${BASE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: intl.locale,
  };

  // 3. Service Schema
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${BASE_URL}${PAGE_PATH}/#service`,
    name: intl.formatMessage({ id: "sosCall.seo.serviceName" }),
    description: intl.formatMessage({ id: "sosCall.seo.serviceDescription" }),
    provider: { "@id": `${BASE_URL}/#organization` },
    serviceType: intl.formatMessage({ id: "sosCall.seo.serviceType" }),
    areaServed: {
      "@type": "Place",
      name: intl.formatMessage({ id: "sosCall.seo.areaServed" }),
    },
    audience: {
      "@type": "Audience",
      audienceType: intl.formatMessage({ id: "sosCall.seo.audienceType" }),
    },
    availableChannel: {
      "@type": "ServiceChannel",
      serviceUrl: `${BASE_URL}${PAGE_PATH}`,
      servicePhone: "+33 1 XX XX XX XX",
      availableLanguage: ["French", "English", "Spanish", "German", "Portuguese", "Russian", "Chinese", "Arabic", "Hindi"],
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: intl.formatMessage({ id: "sosCall.seo.offerCatalogName" }),
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: intl.formatMessage({ id: "sosCall.seo.lawyerServiceName" }),
            description: intl.formatMessage({ id: "sosCall.seo.lawyerServiceDescription" }),
          },
          priceSpecification: {
            "@type": "PriceSpecification",
            price: "49",
            priceCurrency: "EUR",
            unitText: intl.formatMessage({ id: "sosCall.seo.priceUnit" }),
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: intl.formatMessage({ id: "sosCall.seo.expatServiceName" }),
            description: intl.formatMessage({ id: "sosCall.seo.expatServiceDescription" }),
          },
          priceSpecification: {
            "@type": "PriceSpecification",
            price: "19",
            priceCurrency: "EUR",
            unitText: intl.formatMessage({ id: "sosCall.seo.priceUnit" }),
          },
        },
      ],
    },
    aggregateRating: providers.length > 0 ? {
      "@type": "AggregateRating",
      ratingValue: (providers.reduce((sum, p) => sum + p.rating, 0) / providers.length).toFixed(1),
      reviewCount: providers.reduce((sum, p) => sum + p.reviewCount, 0),
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  };

  // 4. WebPage Schema (URL localisée)
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${BASE_URL}${PAGE_PATH}/#webpage`,
    url: localizedPageUrl,
    name: intl.formatMessage({ id: "sosCall.seo.pageTitle" }),
    description: intl.formatMessage({ id: "sosCall.seo.pageDescription" }),
    isPartOf: { "@id": `${BASE_URL}/#website` },
    about: { "@id": `${BASE_URL}${PAGE_PATH}/#service` },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: `${BASE_URL}/og-image-sos-call.jpg`,
      width: 1200,
      height: 630,
    },
    breadcrumb: { "@id": `${BASE_URL}${PAGE_PATH}/#breadcrumb` },
    inLanguage: intl.locale,
    datePublished: "2024-01-01T00:00:00+00:00",
    dateModified: new Date().toISOString(),
  };

  // 5. BreadcrumbList Schema (URLs localisées)
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${BASE_URL}${PAGE_PATH}/#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: intl.formatMessage({ id: "sosCall.seo.breadcrumb.home" }),
        item: `${BASE_URL}/${currentLang}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: intl.formatMessage({ id: "sosCall.seo.breadcrumb.sosCall" }),
        item: localizedPageUrl,
      },
    ],
  };

  // 6. FAQPage Schema (8 questions pour Featured Snippet)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${BASE_URL}${PAGE_PATH}/#faq`,
    mainEntity: FAQ_ITEMS.map((faq) => ({
      "@type": "Question",
      name: intl.formatMessage({ id: faq.questionKey }),
      acceptedAnswer: {
        "@type": "Answer",
        text: intl.formatMessage({ id: faq.answerKey }),
      },
    })),
  };

  // 7. ItemList Schema (liste des prestataires)
  const itemListSchema = providers.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${BASE_URL}${PAGE_PATH}/#providers`,
    name: intl.formatMessage({ id: "sosCall.seo.providerListName" }),
    description: intl.formatMessage({ id: "sosCall.seo.providerListDescription" }),
    numberOfItems: providers.length,
    itemListElement: providers.slice(0, 10).map((provider, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Person",
        "@id": `${BASE_URL}/prestataire/${provider.id}`,
        name: provider.name,
        jobTitle: provider.type === "lawyer" 
          ? intl.formatMessage({ id: "sosCall.profession.lawyer" })
          : intl.formatMessage({ id: "sosCall.profession.expat" }),
        image: provider.avatar || `${BASE_URL}/default-avatar.png`,
        worksFor: { "@id": `${BASE_URL}/#organization` },
        knowsLanguage: provider.languages,
        workLocation: {
          "@type": "Place",
          name: provider.country,
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: provider.rating.toFixed(1),
          reviewCount: provider.reviewCount,
          bestRating: 5,
          worstRating: 1,
        },
      },
    })),
  } : null;

  // 8. ProfessionalService Schema
  const professionalServiceSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${BASE_URL}${PAGE_PATH}/#professional-service`,
    name: intl.formatMessage({ id: "sosCall.seo.professionalServiceName" }),
    description: intl.formatMessage({ id: "sosCall.seo.professionalServiceDescription" }),
    url: `${BASE_URL}${PAGE_PATH}`,
    telephone: "+33 1 XX XX XX XX",
    priceRange: "€€",
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "00:00",
      closes: "23:59",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 48.8566,
      longitude: 2.3522,
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "FR",
    },
  };

  return [
    organizationSchema,
    websiteSchema,
    serviceSchema,
    webPageSchema,
    breadcrumbSchema,
    faqSchema,
    itemListSchema,
    professionalServiceSchema,
  ].filter(Boolean);
};

/* =========================
   ModernProfileCard Component
========================= */
const ModernProfileCard: React.FC<{
  provider: Provider;
  onProfileClick: (provider: Provider) => void;
  index?: number;
  language?: string;
  intl: ReturnType<typeof useIntl>;
}> = React.memo(({ provider, onProfileClick, index = 0, language, intl }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const currentLang = useMemo(() => getLanguage(language), [language]);
  const statusColors = useStatusColors(provider.isOnline);
  const professionInfo = useMemo(
    () => getProfessionInfo(provider.type),
    [provider.type]
  );

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.currentTarget;
      if (target.src !== "/default-avatar.png" && !imageError) {
        setImageError(true);
        target.src = "/default-avatar.png";
      }
    },
    [imageError]
  );

  const handleClick = useCallback(() => {
    onProfileClick(provider);
  }, [provider, onProfileClick]);

  const handleMouseEnter = useCallback(() => {
    if (window.matchMedia("(hover: hover)").matches) {
      setIsHovered(true);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const formattedLanguages = useMemo(() => {
    if (!provider.languages || provider.languages.length === 0) {
      return '';
    }
    
    const translatedLanguages = provider.languages
      .slice(0, 3)
      .map(langCode => {
        const lang = languagesData.find(l => l.code.toLowerCase() === langCode.toLowerCase());
        return lang ? getLanguageLabel(lang, language as SupportedLocale) : langCode;
      })
      .filter(name => name !== '');
    
    let result = translatedLanguages.join(' • ');
    if (provider.languages.length > 3) {
      result += ` +${provider.languages.length - 3}`;
    }
    return result;
  }, [provider.languages, language]);

  const formattedCountries = useMemo(() => {
    const countries = provider.interventionCountries && provider.interventionCountries.length > 0
      ? provider.interventionCountries
      : provider.country ? [provider.country] : [];
    
    if (countries.length === 0) return '';
    
    const translatedCountries = countries
      .slice(0, 2)
      .map(countryCode => getCountryName(countryCode, language))
      .filter(name => name !== '');
    
    let result = translatedCountries.join(' • ');
    if (countries.length > 2) {
      result += ` +${countries.length - 2}`;
    }
    return result;
  }, [provider.interventionCountries, provider.country, language]);

  const ariaLabels = useMemo(
    () => ({
      card: intl.formatMessage(
        { id: "sosCall.card.ariaProfileCard" },
        { name: provider.name }
      ),
      status: intl.formatMessage(
        { id: "sosCall.card.ariaOnlineStatus" },
        {
          status: provider.isOnline
            ? intl.formatMessage({ id: "sosCall.status.online" })
            : intl.formatMessage({ id: "sosCall.status.offline" }),
        }
      ),
      rating: intl.formatMessage(
        { id: "sosCall.card.ariaRating" },
        { rating: provider.rating.toFixed(1) }
      ),
      viewProfile: intl.formatMessage(
        { id: "sosCall.card.ariaViewProfileAction" },
        { name: provider.name }
      ),
    }),
    [intl, provider.name, provider.isOnline, provider.rating]
  );

  return (
    <div className="flex-shrink-0 p-2 sm:p-4">
      <article
        className={`
          relative bg-white rounded-2xl overflow-hidden cursor-pointer
          transition-all duration-300 ease-out border-2 shadow-lg
          w-[calc(100vw-2rem)] max-w-[320px] h-[520px]
          sm:w-80 md:w-80
          ${statusColors.border} ${statusColors.shadow} ${statusColors.borderShadow}
          ${isHovered ? `scale-[1.02] ${statusColors.glow} shadow-xl` : ""}
          focus:outline-none focus:ring-4 focus:ring-blue-500/50
          hover:shadow-xl
        `}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        tabIndex={0}
        role="article"
        aria-label={ariaLabels.card}
        itemScope
        itemType="https://schema.org/Person"
        style={{
          animationDelay: `${index * 100}ms`,
        }}
      >
        {/* Header avec photo et statut */}
        <div
          className="relative overflow-hidden bg-slate-100"
          style={{ height: `${CARD_DIMENSIONS.imageHeight}px` }}
        >
          <img
            src={provider.avatar || "/default-avatar.png"}
            alt={intl.formatMessage(
              { id: "sosCall.card.imageAlt" },
              { name: provider.name }
            )}
            className={`
              w-full h-full object-cover transition-all duration-300
              ${imageLoaded ? "opacity-100" : "opacity-0"}
              ${isHovered ? "scale-105" : ""}
            `}
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
            loading="lazy"
            decoding="async"
            width={CARD_DIMENSIONS.width}
            height={CARD_DIMENSIONS.imageHeight}
            itemProp="image"
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" aria-hidden="true" />

          {/* Statut en ligne */}
          <div className="absolute top-3 left-3">
            <div
              className={`
                inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium
                backdrop-blur-sm border shadow-sm transition-colors
                ${statusColors.badge}
                min-h-[44px]
              `}
              role="status"
              aria-live="polite"
              aria-label={ariaLabels.status}
            >
              {provider.isOnline ? (
                <Wifi className="w-4 h-4" aria-hidden="true" />
              ) : (
                <WifiOff className="w-4 h-4" aria-hidden="true" />
              )}
              <span>
                {provider.isOnline
                  ? intl.formatMessage({ id: "sosCall.status.online" })
                  : intl.formatMessage({ id: "sosCall.status.offline" })}
              </span>
            </div>
          </div>

          {/* Badge métier */}
          <div className="absolute top-3 right-3">
            <div
              className={`
              inline-flex items-center gap-2 px-3 py-2 rounded-full 
              backdrop-blur-sm border shadow-sm border-white/30
              ${professionInfo.bgColor} ${professionInfo.textColor}
              min-h-[44px]
            `}
            >
              <span className="text-sm font-medium" itemProp="jobTitle">
                <span aria-hidden="true">{professionInfo.icon}</span>{" "}
                <FormattedMessage
                  id={
                    provider.type === "lawyer"
                      ? "sosCall.profession.lawyer"
                      : "sosCall.profession.expat"
                  }
                />
              </span>
            </div>
          </div>

          {/* Note */}
          <div className="absolute bottom-3 right-3">
            <div
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/95 backdrop-blur-sm border border-slate-200 shadow-sm"
              aria-label={ariaLabels.rating}
              itemProp="aggregateRating"
              itemScope
              itemType="https://schema.org/AggregateRating"
            >
              <Star
                className="w-4 h-4 text-amber-500 fill-current"
                aria-hidden="true"
              />
              <span className="text-slate-800 text-sm font-medium" itemProp="ratingValue">
                {provider.rating.toFixed(1)}
              </span>
              <meta itemProp="bestRating" content="5" />
              <meta itemProp="worstRating" content="1" />
              <meta itemProp="reviewCount" content={String(provider.reviewCount)} />
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div
          className="p-3 flex flex-col"
          style={{ height: `${CARD_DIMENSIONS.contentHeight}px` }}
        >
          {/* Nom et expérience */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-800 truncate flex-1" itemProp="name">
                {provider.name}
              </h3>
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-teal-50 border border-teal-200 flex-shrink-0">
                <Zap className="w-3 h-3 text-teal-600" aria-hidden="true" />
                <span className="text-teal-600 text-xs font-medium">
                  {provider.yearsOfExperience}{" "}
                  <FormattedMessage id="sosCall.card.years" />
                </span>
              </div>
            </div>
          </div>

          {/* Informations */}
          <div className="space-y-2 h-28 overflow-hidden">
            {/* Pays d'intervention */}
            {formattedCountries && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-blue-600 text-xs leading-tight" itemProp="workLocation">
                  {formattedCountries}
                </span>
              </div>
            )}

            {/* Langues parlées */}
            {formattedLanguages && (
              <div className="flex items-start gap-2">
                <Globe className="w-3 h-3 text-indigo-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-indigo-600 text-xs leading-tight" itemProp="knowsLanguage">
                  {formattedLanguages}
                </span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-auto">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-amber-600" aria-hidden="true" />
              <span className="text-amber-600 text-xs font-medium">
                {provider.reviewCount}{" "}
                <FormattedMessage id="sosCall.card.reviews" />
              </span>
            </div>
            <div className="text-slate-500 text-xs">
              <FormattedMessage
                id={
                  provider.type === "lawyer"
                    ? "sosCall.profession.lawyer"
                    : "sosCall.profession.expat"
                }
              />
            </div>
          </div>

          {/* Bouton CTA */}
          <div className="mt-3">
            <button
              className={`
                w-full rounded-lg font-bold text-sm text-white
                transition-all duration-300 flex items-center justify-center gap-2
                border-2 shadow-lg relative overflow-hidden
                ${statusColors.button}
                hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]
                focus:outline-none focus:ring-4 focus:ring-blue-500/50
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              style={{
                minHeight: "48px",
                padding: "12px 16px",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              type="button"
              aria-label={ariaLabels.viewProfile}
            >
              <Eye className="w-4 h-4" aria-hidden="true" />
              <span className="font-bold">
                <FormattedMessage id="sosCall.card.viewProfile" />
              </span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>

      <style>{`
        article {
          animation: slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
          transform: translateY(20px);
        }
        
        @keyframes slideInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          article {
            animation: none;
            opacity: 1;
            transform: none;
          }
          
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        article:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
});

ModernProfileCard.displayName = "ModernProfileCard";

/* =========================
   FAQ Section Component
========================= */
const FAQSection: React.FC<{ intl: ReturnType<typeof useIntl> }> = React.memo(({ intl }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section 
      className="py-12 sm:py-16 lg:py-20 bg-gray-900"
      aria-labelledby="faq-heading"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <h2 
            id="faq-heading"
            className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4"
          >
            <FormattedMessage id="sosCall.faq.title" />
          </h2>
          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto">
            <FormattedMessage id="sosCall.faq.subtitle" />
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4" role="list" aria-label={intl.formatMessage({ id: "sosCall.faq.listAriaLabel" })}>
          {FAQ_ITEMS.map((faq, index) => (
            <div
              key={index}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
              role="listitem"
            >
              <button
                className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left min-h-[56px]"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                aria-expanded={openIndex === index}
                aria-controls={`faq-answer-${index}`}
                id={`faq-question-${index}`}
              >
                <span className="font-semibold text-white text-sm sm:text-base pr-4" itemProp="name">
                  <FormattedMessage id={faq.questionKey} />
                </span>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-red-400' : ''}`}
                  aria-hidden="true"
                />
              </button>
              <div
                id={`faq-answer-${index}`}
                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96' : 'max-h-0'}`}
                itemScope
                itemProp="acceptedAnswer"
                itemType="https://schema.org/Answer"
                role="region"
                aria-labelledby={`faq-question-${index}`}
                aria-hidden={openIndex !== index}
              >
                <div className="px-4 sm:px-6 pb-4 sm:pb-5">
                  <p className="text-gray-300 text-sm sm:text-base leading-relaxed" itemProp="text">
                    <FormattedMessage id={faq.answerKey} />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

FAQSection.displayName = "FAQSection";

/* =========================
   Trust Badges Component
========================= */
const TrustBadges: React.FC<{ intl: ReturnType<typeof useIntl> }> = React.memo(({ intl }) => (
  <section 
    className="py-8 sm:py-12 bg-gray-900/50"
    aria-labelledby="trust-heading"
  >
    <h2 id="trust-heading" className="sr-only">
      <FormattedMessage id="sosCall.trust.srTitle" />
    </h2>
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
        {[
          { icon: Shield, key: "verified" },
          { icon: Clock, key: "available" },
          { icon: Globe, key: "countries" },
          { icon: MessageCircle, key: "languages" },
        ].map(({ icon: Icon, key }) => (
          <div 
            key={key}
            className="flex flex-col items-center text-center p-3 sm:p-6 rounded-2xl bg-white/5 border border-white/10"
          >
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mb-2 sm:mb-3">
              <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-red-400" aria-hidden="true" />
            </div>
            <span className="text-white font-bold text-xs sm:text-base">
              <FormattedMessage id={`sosCall.trust.${key}.title`} />
            </span>
            <span className="text-gray-400 text-[10px] sm:text-sm mt-1">
              <FormattedMessage id={`sosCall.trust.${key}.description`} />
            </span>
          </div>
        ))}
      </div>
    </div>
  </section>
));

TrustBadges.displayName = "TrustBadges";

/* =========================
   Pagination component
========================= */
const Pagination: React.FC<{
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
  intl: ReturnType<typeof useIntl>;
}> = React.memo(({ page, totalPages, onChange, intl }) => {
  if (totalPages <= 1) return null;

  const go = useCallback((p: number) => {
    const np = Math.min(totalPages, Math.max(1, p));
    if (np !== page) onChange(np);
  }, [page, totalPages, onChange]);

  const makePages = useMemo((): Array<number | "ellipsis"> => {
    const pages: Array<number | "ellipsis"> = [];
    const add = (n: number) => pages.push(n);

    const windowSize = 1;
    add(1);
    for (let i = page - windowSize; i <= page + windowSize; i++) {
      if (i > 1 && i < totalPages) add(i);
    }
    if (totalPages > 1) add(totalPages);

    const sorted = Array.from(new Set(pages)).sort((a, b) =>
      typeof a === "number" && typeof b === "number" ? a - b : 0
    );

    const withEllipses: Array<number | "ellipsis"> = [];
    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i] as number;
      const prev = sorted[i - 1] as number | undefined;
      if (
        i > 0 &&
        prev !== undefined &&
        typeof prev === "number" &&
        cur - prev > 1
      ) {
        withEllipses.push("ellipsis");
      }
      withEllipses.push(cur);
    }
    return withEllipses;
  }, [page, totalPages]);

  return (
    <nav 
      className="inline-flex items-center gap-1" 
      aria-label={intl.formatMessage({ id: "sosCall.pagination.ariaLabel" })}
      role="navigation"
    >
      <button
        onClick={() => go(page - 1)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        disabled={page <= 1}
        aria-label={intl.formatMessage({ id: "sosCall.pagination.previousAriaLabel" })}
      >
        <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">
          <FormattedMessage id="sosCall.pagination.previous" />
        </span>
      </button>

      {makePages.map((it, idx) =>
        it === "ellipsis" ? (
          <span key={`el-${idx}`} className="px-2 text-gray-300" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={`p-${it}`}
            onClick={() => go(it)}
            aria-current={it === page ? "page" : undefined}
            aria-label={intl.formatMessage(
              { id: "sosCall.pagination.pageAriaLabel" },
              { page: it }
            )}
            className={`w-10 h-10 sm:w-9 sm:h-9 rounded-xl border text-sm font-semibold transition min-h-[44px] ${
              it === page
                ? "bg-white/20 text-white border-white/30"
                : "bg-white/10 text-gray-200 border-white/20 hover:bg-white/15"
            }`}
          >
            {it}
          </button>
        )
      )}

      <button
        onClick={() => go(page + 1)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        disabled={page >= totalPages}
        aria-label={intl.formatMessage({ id: "sosCall.pagination.nextAriaLabel" })}
      >
        <span className="hidden sm:inline">
          <FormattedMessage id="sosCall.pagination.next" />
        </span>
        <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </nav>
  );
});

Pagination.displayName = "Pagination";

/* =========================
   Composant principal
========================= */
const SOSCall: React.FC = () => {
  const intl = useIntl();
  const { language } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // États filtres
  const [selectedType, setSelectedType] = useState<"all" | "lawyer" | "expat">(
    searchParams.get("type") === "lawyer"
      ? "lawyer"
      : searchParams.get("type") === "expat"
        ? "expat"
        : "all"
  );
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [customCountry, setCustomCountry] = useState<string>("");
  const [customLanguage, setCustomLanguage] = useState<string>("");
  const [showCustomCountry, setShowCustomCountry] = useState<boolean>(false);
  const [showCustomLanguage, setShowCustomLanguage] = useState<boolean>(false);

  // Statut
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [onlineOnly, setOnlineOnly] = useState<boolean>(false);

  // Données
  const [isLoadingProviders, setIsLoadingProviders] = useState<boolean>(true);
  const [realProviders, setRealProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);

  // Pagination & favoris
  const [page, setPage] = useState<number>(1);
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("sos_favorites");
      if (!raw) return new Set<string>();
      const parsed: unknown = JSON.parse(raw);
      return new Set(
        Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : []
      );
    } catch {
      return new Set<string>();
    }
  });

  const lang = (language as "fr" | "en" | "es" | "de" | "ru" | "hi" | "ch" | "pt" | "ar") || "fr";

  // Listes traduites dynamiquement
  const countryOptions = useMemo(() => {
    return getCountryOptions(language || 'fr');
  }, [language]);
  
  const languageOptions = useMemo(() => {
    return getLanguageOptions(language || 'fr');
  }, [language]);

  // Charger providers
  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam === "lawyer" || typeParam === "expat") {
      setSelectedType(typeParam);
      setSearchParams({ type: typeParam });
    }

    const sosProfilesQuery = query(
      collection(db, "sos_profiles"),
      where("type", "in", ["lawyer", "expat"]),
      where("isApproved", "==", true),
      where("isVisible", "==", true),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      sosProfilesQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setRealProviders([]);
          setFilteredProviders([]);
          setIsLoadingProviders(false);
          return;
        }

        const allProfiles: Provider[] = [];

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as RawProfile;

          const fullName =
            data.fullName ||
            `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
            "Expert";

          const firstName = data.firstName || "";
          const lastName = data.lastName || "";
          const publicDisplayName = firstName && lastName 
            ? `${firstName} ${lastName.charAt(0)}.`
            : fullName;

          const type: "lawyer" | "expat" =
            data.type === "lawyer" ? "lawyer" : "expat";

          const country =
            data.currentPresenceCountry || data.country || "Monde";

          const provider: Provider = {
            id: docSnap.id,
            name: publicDisplayName,
            firstName: data.firstName,
            lastName: data.lastName,
            type,
            country,
            languages:
              Array.isArray(data.languages) && data.languages.length > 0
                ? data.languages
                : ["fr"],
            specialties: Array.isArray(data.specialties)
              ? data.specialties
              : [],
            rating: typeof data.rating === "number" ? data.rating : 4.5,
            reviewCount:
              typeof data.reviewCount === "number" ? data.reviewCount : 0,
            yearsOfExperience:
              (typeof data.yearsOfExperience === "number"
                ? data.yearsOfExperience
                : undefined) ??
              (typeof data.yearsAsExpat === "number" ? data.yearsAsExpat : 0),
            isOnline: data.isOnline === true,
            isActive: data.isActive !== false,
            isVisible: data.isVisible !== false,
            isApproved: data.isApproved !== false,
            isBanned: data.isBanned === true,
            role:
              typeof data.role === "string"
                ? String(data.role).toLowerCase()
                : undefined,
            isAdmin: data.isAdmin === true,
            description: typeof data.bio === "string" ? data.bio : "",
            price:
              typeof data.price === "number"
                ? data.price
                : type === "lawyer"
                  ? 49
                  : 19,
            duration: data.duration,
            avatar:
              typeof data.profilePhoto === "string" &&
              data.profilePhoto.trim() !== ""
                ? data.profilePhoto
                : "/default-avatar.png",
          };

          const notAdmin =
            (provider.role ?? "") !== "admin" && provider.isAdmin !== true;
          const notBanned = provider.isBanned !== true;
          const hasBasicInfo = provider.name.trim() !== "";
          const hasCountry = provider.country.trim() !== "";
          const visible = provider.isVisible !== false;
          const lawyerApproved =
            provider.type !== "lawyer" || provider.isApproved === true;

          const shouldInclude =
            notAdmin &&
            notBanned &&
            hasBasicInfo &&
            hasCountry &&
            visible &&
            lawyerApproved;

          if (shouldInclude) {
            allProfiles.push(provider);
          }
        });

        setRealProviders(allProfiles);
        setFilteredProviders(allProfiles);
        setIsLoadingProviders(false);
      },
      (error) => {
        console.error("[SOSCall] Firebase error:", error);
        setRealProviders([]);
        setFilteredProviders([]);
        setIsLoadingProviders(false);
      }
    );

    return () => unsubscribe();
  }, [searchParams, setSearchParams]);

  // Filtrage + tri
  useEffect(() => {
    if (realProviders.length === 0) {
      setFilteredProviders([]);
      return;
    }

    const next = realProviders.filter((provider) => {
      const matchesType =
        selectedType === "all" || provider.type === selectedType;
      const matchesCountry = countryMatches(
        provider.country,
        selectedCountry,
        customCountry
      );
      const matchesLanguage = langMatches(
        provider.languages,
        selectedLanguage,
        customLanguage
      );

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "online"
            ? provider.isOnline
            : !provider.isOnline;

      return matchesType && matchesCountry && matchesLanguage && matchesStatus;
    });

    next.sort((a, b) => {
      if (a.isOnline !== b.isOnline) {
        return (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0);
      }
      if (selectedCountry !== "all") {
        const aCountryMatch = countryMatches(
          a.country,
          selectedCountry,
          customCountry
        );
        const bCountryMatch = countryMatches(
          b.country,
          selectedCountry,
          customCountry
        );
        if (aCountryMatch !== bCountryMatch) return aCountryMatch ? -1 : 1;
      }
      return b.rating - a.rating;
    });

    setFilteredProviders(next);
    setPage(1);
    setOnlineOnly(statusFilter === "online");
  }, [
    realProviders,
    selectedType,
    selectedCountry,
    selectedLanguage,
    customCountry,
    customLanguage,
    statusFilter,
  ]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProviders.length / PAGE_SIZE)
  );
  const paginatedProviders = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredProviders.slice(start, start + PAGE_SIZE);
  }, [filteredProviders, page]);

  // Normalisation pays
  const countryMatches = (
    providerCountry: string,
    selected: string,
    custom: string
  ): boolean => {
    if (selected === "all") return true;
    const prov = providerCountry || "";
    if (selected === "Autre") {
      if (!custom) return true;
      return prov.toLowerCase().includes(custom.toLowerCase());
    }
    if (prov === selected) return true;
    return prov.toLowerCase().includes(selected.toLowerCase());
  };

  // Normalisation langues
  const langMatches = (
    langs: string[],
    selected: string,
    custom: string
  ): boolean => {
    if (selected === "all") return true;
    
    const langCodes = convertLanguageNamesToCodes(langs);
    
    const normalizedProv = langCodes.map((code) => {
      const lang = languagesData.find(l => l.code === code);
      return lang 
        ? getLanguageLabel(lang, language as SupportedLocale).toLowerCase()
        : code.toLowerCase();
    });
    
    if (selected === "Autre") {
      if (!custom) return true;
      const needle = custom.toLowerCase();
      return normalizedProv.some((v) => v.includes(needle));
    }
    const target = selected.toLowerCase();
    return normalizedProv.some((v) => v === target);
  };

  // Handlers filtres
  const handleCountryChange = useCallback((value: string) => {
    setSelectedCountry(value);
    setShowCustomCountry(value === "Autre");
    if (value !== "Autre") setCustomCountry("");
  }, []);

  const handleLanguageChange = useCallback((value: string) => {
    setSelectedLanguage(value);
    setShowCustomLanguage(value === "Autre");
    if (value !== "Autre") setCustomLanguage("");
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedType("all");
    setSelectedCountry("all");
    setSelectedLanguage("all");
    setCustomCountry("");
    setCustomLanguage("");
    setShowCustomCountry(false);
    setShowCustomLanguage(false);
    setStatusFilter("all");
    setOnlineOnly(false);
  }, []);

  // Navigation
  const handleProviderClick = useCallback((provider: Provider) => {
    const typeSlug = provider.type === "lawyer" ? "avocat" : "expatrie";
    const countrySlug = slugify(provider.country);
    const nameSlug = slugify(provider.name);
    const seoUrl = `/${typeSlug}/${countrySlug}/francais/${nameSlug}-${provider.id}`;

    if (location.pathname !== seoUrl) {
      try {
        sessionStorage.setItem("selectedProvider", JSON.stringify(provider));
      } catch {
        // noop
      }
      navigate(seoUrl, {
        state: { selectedProvider: provider, navigationSource: "sos_call" },
      });
    }
  }, [location.pathname, navigate]);

  // Favoris
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem("sos_favorites", JSON.stringify(Array.from(next)));
      } catch {
        // noop
      }
      return next;
    });
  }, []);

  // ========================================
  // 🔍 SEO - Génération des données structurées
  // ========================================
  
  // Canonical URL avec langue courante
  const canonicalUrl = `${BASE_URL}/${lang}${PAGE_PATH}`;
  const onlineCount = filteredProviders.filter((p) => p.isOnline).length;
  
  const jsonLdSchemas = useMemo(() => 
    generateAllSchemas(intl, filteredProviders, selectedType, onlineCount, lang),
    [intl, filteredProviders, selectedType, onlineCount, lang]
  );

  const seoTitle = intl.formatMessage({ 
    id: selectedType === "lawyer" 
      ? "sosCall.seo.title.lawyer" 
      : selectedType === "expat" 
        ? "sosCall.seo.title.expat" 
        : "sosCall.seo.title.all" 
  });
  
  const seoDescription = intl.formatMessage({ 
    id: selectedType === "lawyer" 
      ? "sosCall.seo.description.lawyer" 
      : selectedType === "expat" 
        ? "sosCall.seo.description.expat" 
        : "sosCall.seo.description.all" 
  });

  const seoKeywords = intl.formatMessage({ id: "sosCall.seo.keywords" });

  // Hreflang pour toutes les langues supportées (cohérent avec canonical)
  const hreflangLinks = SUPPORTED_LANGUAGES.map(langCode => ({
    hreflang: langCode === 'zh' ? 'zh-Hans' : langCode,
    href: `${BASE_URL}/${langCode}${PAGE_PATH}`,
  }));

  return (
    <Layout>
      {/* ========================================
          🔍 SEO HEAD - Tout intégré directement
      ======================================== */}
      <Helmet>
        {/* Balises essentielles */}
        <html lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'} />
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        
        {/* Robots & Indexation */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1" />
        <meta name="bingbot" content="index, follow" />
        
        {/* Mots-clés sémantiques */}
        <meta name="keywords" content={seoKeywords} />
        <meta name="author" content="SOS Expat" />
        <meta name="publisher" content="SOS Expat" />
        
        {/* URL Canonique */}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Hreflang pour internationalisation (9 langues) */}
        {hreflangLinks.map((link) => (
          <link
            key={link.hreflang}
            rel="alternate"
            hrefLang={link.hreflang}
            href={link.href}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}/en${PAGE_PATH}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SOS Expat" />
        <meta property="og:locale" content={OG_LOCALES[lang] || "en_US"} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={`${BASE_URL}/og-image-sos-call.jpg`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={intl.formatMessage({ id: "sosCall.seo.ogImageAlt" })} />
        <meta property="og:image:type" content="image/jpeg" />
        
        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@sosexpat" />
        <meta name="twitter:creator" content="@sosexpat" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={`${BASE_URL}/twitter-image-sos-call.png`} />
        <meta name="twitter:image:alt" content={intl.formatMessage({ id: "sosCall.seo.ogImageAlt" })} />
        
        {/* Sécurité */}
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* Performance: Preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        
        {/* PWA & Mobile */}
        <meta name="theme-color" content="#DC2626" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SOS Expat" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Favicon & Icons */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Référencement IA (LLM-friendly) */}
        <meta name="ai-content-declaration" content="human-written" />
        <meta name="generator" content="SOS Expat Platform" />
        
        {/* JSON-LD Structured Data (8 schemas) */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLdSchemas)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-950">
        {/* ========================================
            HERO SECTION
        ======================================== */}
        <header className="relative pt-16 pb-20 sm:pt-20 sm:pb-24 overflow-hidden" role="banner">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-blue-500/10" aria-hidden="true" />
          <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-1/4 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" aria-hidden="true" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex items-center space-x-2 sm:space-x-3 bg-white/10 backdrop-blur-sm rounded-full pl-4 sm:pl-6 pr-3 py-2 sm:py-2.5 border border-white/20 mb-6 sm:mb-7">
              <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-red-300" aria-hidden="true" />
              <span className="text-white font-semibold text-sm sm:text-base">
                <FormattedMessage id="sosCall.hero.badge" />
              </span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-hidden="true" />
            </div>

            {/* H1 - Une seule balise H1 */}
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white leading-tight mb-4">
              <FormattedMessage id="sosCall.hero.title.prefix" />
              <span className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                {" "}<FormattedMessage id="sosCall.hero.title.highlight" />{" "}
              </span>
              <FormattedMessage id="sosCall.hero.title.suffix" />
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto px-4">
              <FormattedMessage 
                id="sosCall.hero.subtitle"
                values={{
                  strong: (chunks) => <strong className="text-white">{chunks}</strong>,
                }}
              />
            </p>
          </div>
        </header>

        {/* Trust Badges */}
        <TrustBadges intl={intl} />

        {/* ========================================
            MAIN CONTENT
        ======================================== */}
        <main className="py-8 sm:py-12 lg:py-16" id="experts" role="main">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            {/* Titre + Filtres */}
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black text-white mb-4">
                {selectedType === "lawyer" && (
                  <FormattedMessage id="sosCall.experts.title.lawyer" />
                )}
                {selectedType === "expat" && (
                  <FormattedMessage id="sosCall.experts.title.expat" />
                )}
                {selectedType !== "lawyer" && selectedType !== "expat" && (
                  <FormattedMessage id="sosCall.experts.title.all" />
                )}
              </h2>

              {/* FILTRES */}
              <div 
                className="rounded-2xl sm:rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-md p-4 sm:p-6 max-w-6xl mx-auto"
                role="search"
                aria-label={intl.formatMessage({ id: "sosCall.filters.ariaLabel" })}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
                  {/* Type */}
                  <div className="space-y-1">
                    <label
                      htmlFor="expert-type"
                      className="block text-xs font-semibold text-gray-300 uppercase tracking-wide"
                    >
                      <FormattedMessage id="sosCall.filters.type.label" />
                    </label>
                    <div className="relative">
                      <select
                        id="expert-type"
                        value={selectedType}
                        onChange={(e) =>
                          setSelectedType(
                            e.target.value as "all" | "lawyer" | "expat"
                          )
                        }
                        className="w-full px-3 py-3 sm:py-2 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all appearance-none text-sm min-h-[44px]"
                        aria-describedby="type-filter-description"
                      >
                        <option value="all">
                          {intl.formatMessage({ id: "sosCall.filters.type.all" })}
                        </option>
                        <option value="lawyer">
                          {intl.formatMessage({ id: "sosCall.filters.type.lawyer" })}
                        </option>
                        <option value="expat">
                          {intl.formatMessage({ id: "sosCall.filters.type.expat" })}
                        </option>
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none"
                        aria-hidden="true"
                      />
                    </div>
                    <span id="type-filter-description" className="sr-only">
                      <FormattedMessage id="sosCall.filters.type.srDescription" />
                    </span>
                  </div>

                  {/* Pays */}
                  <div className="space-y-1">
                    <label
                      htmlFor="country-filter"
                      className="block text-xs font-semibold text-gray-300 uppercase tracking-wide"
                    >
                      <FormattedMessage id="sosCall.filters.country.label" />
                    </label>
                    <div className="relative">
                      <select
                        id="country-filter"
                        value={selectedCountry}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="w-full px-3 py-3 sm:py-2 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all appearance-none text-sm min-h-[44px]"
                      >
                        <option value="all">
                          {intl.formatMessage({ id: "sosCall.filters.country.all" })}
                        </option>
                        {countryOptions.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                        <option value="Autre">
                          {intl.formatMessage({ id: "sosCall.filters.country.other" })}
                        </option>
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none"
                        aria-hidden="true"
                      />
                    </div>
                    {showCustomCountry && (
                      <input
                        type="text"
                        placeholder={intl.formatMessage({ id: "sosCall.filters.country.placeholder" })}
                        value={customCountry}
                        onChange={(e) => setCustomCountry(e.target.value)}
                        className="w-full px-3 py-3 sm:py-2 bg-white/10 border border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/60 focus:border-transparent transition-all text-sm text-white placeholder:text-gray-400 mt-2 min-h-[44px]"
                        aria-label={intl.formatMessage({ id: "sosCall.filters.country.customAriaLabel" })}
                      />
                    )}
                  </div>

                  {/* Langue */}
                  <div className="space-y-1">
                    <label
                      htmlFor="language-filter"
                      className="block text-xs font-semibold text-gray-300 uppercase tracking-wide"
                    >
                      <FormattedMessage id="sosCall.filters.language.label" />
                    </label>
                    <div className="relative">
                      <select
                        id="language-filter"
                        value={selectedLanguage}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="w-full px-3 py-3 sm:py-2 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all appearance-none text-sm min-h-[44px]"
                      >
                        <option value="all">
                          {intl.formatMessage({ id: "sosCall.filters.language.all" })}
                        </option>
                        {languageOptions.map((langOption) => (
                          <option key={langOption} value={langOption}>
                            {langOption}
                          </option>
                        ))}
                        <option value="Autre">
                          {intl.formatMessage({ id: "sosCall.filters.language.other" })}
                        </option>
                      </select>
                      <ChevronDown
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none"
                        aria-hidden="true"
                      />
                    </div>
                    {showCustomLanguage && (
                      <input
                        type="text"
                        placeholder={intl.formatMessage({ id: "sosCall.filters.language.placeholder" })}
                        value={customLanguage}
                        onChange={(e) => setCustomLanguage(e.target.value)}
                        className="w-full px-3 py-3 sm:py-2 bg-white/10 border border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/60 focus:border-transparent transition-all text-sm text-white placeholder:text-gray-400 mt-2 min-h-[44px]"
                        aria-label={intl.formatMessage({ id: "sosCall.filters.language.customAriaLabel" })}
                      />
                    )}
                  </div>

                  {/* Statut */}
                  <div className="space-y-1 sm:col-span-2 lg:col-span-2">
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wide">
                      <FormattedMessage id="sosCall.filters.status.label" />
                    </label>
                    <div 
                      className="flex items-center gap-2"
                      role="group"
                      aria-label={intl.formatMessage({ id: "sosCall.filters.status.ariaLabel" })}
                    >
                      <button
                        type="button"
                        onClick={() => setStatusFilter("all")}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-3 sm:py-2 rounded-xl border transition min-h-[44px] ${
                          statusFilter === "all"
                            ? "bg-white/20 text-white border-white/30"
                            : "bg-white/10 text-gray-200 border-white/20 hover:bg-white/15"
                        }`}
                        aria-pressed={statusFilter === "all"}
                      >
                        <span className="w-2 h-2 rounded-full bg-gray-300" aria-hidden="true" />
                        <span className="text-sm">
                          <FormattedMessage id="sosCall.filters.status.all" />
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter("online")}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-3 sm:py-2 rounded-xl border transition min-h-[44px] ${
                          statusFilter === "online"
                            ? "bg-white/20 text-white border-white/30"
                            : "bg-white/10 text-gray-200 border-white/20 hover:bg-white/15"
                        }`}
                        aria-pressed={statusFilter === "online"}
                        aria-label={intl.formatMessage({ id: "sosCall.filters.status.onlineAriaLabel" })}
                      >
                        <Wifi className="w-4 h-4" aria-hidden="true" />
                        <span className="text-sm">
                          <FormattedMessage id="sosCall.filters.status.online" />
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter("offline")}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-3 sm:py-2 rounded-xl border transition min-h-[44px] ${
                          statusFilter === "offline"
                            ? "bg-white/20 text-white border-white/30"
                            : "bg-white/10 text-gray-200 border-white/20 hover:bg-white/15"
                        }`}
                        aria-pressed={statusFilter === "offline"}
                        aria-label={intl.formatMessage({ id: "sosCall.filters.status.offlineAriaLabel" })}
                      >
                        <WifiOff className="w-4 h-4" aria-hidden="true" />
                        <span className="text-sm">
                          <FormattedMessage id="sosCall.filters.status.offline" />
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Reset */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-transparent select-none" aria-hidden="true">
                      <FormattedMessage id="sosCall.filters.action.label" />
                    </label>
                    <button
                      onClick={resetFilters}
                      className="w-full px-3 py-3 sm:py-2 border border-white/15 rounded-xl text-gray-100 hover:bg-white/10 active:bg-white/15 transition-colors text-sm font-semibold min-h-[44px]"
                      aria-label={intl.formatMessage({ id: "sosCall.filters.action.resetAriaLabel" })}
                    >
                      <FormattedMessage id="sosCall.filters.action.reset" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 text-center text-xs text-gray-300" role="status" aria-live="polite">
                  <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-white/10 border border-white/15">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-hidden="true" />
                    {onlineCount}
                    <span>
                      <FormattedMessage id="sosCall.stats.online" />
                    </span>
                  </span>
                  <span className="mx-2 text-white/30" aria-hidden="true">•</span>
                  {filteredProviders.length}
                  <span className="ml-1">
                    <FormattedMessage id="sosCall.stats.total" />
                  </span>
                </div>
              </div>
            </div>

            {/* PAGINATION (haut) */}
            {!isLoadingProviders && filteredProviders.length > 0 && (
              <div className="flex items-center justify-end mb-4">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onChange={setPage}
                  intl={intl}
                />
              </div>
            )}

            {/* Skeletons */}
            {isLoadingProviders ? (
              <div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                aria-label={intl.formatMessage({ id: "sosCall.loading.ariaLabel" })}
                aria-busy="true"
              >
                {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                  <div
                    key={`sk-${index}`}
                    className="bg-white/5 rounded-2xl sm:rounded-[28px] border border-white/10 overflow-hidden animate-pulse"
                    role="article"
                    aria-label={intl.formatMessage({ id: "sosCall.loading.cardAriaLabel" })}
                  >
                    <div className="w-full h-72 sm:h-80 bg-white/10" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-white/10 rounded w-1/2" />
                      <div className="h-8 bg-white/10 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProviders.length > 0 ? (
              <>
                {/* Version Mobile - Scroll horizontal */}
                <div className="md:hidden">
                  <div 
                    className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
                    role="list"
                    aria-label={intl.formatMessage({ id: "sosCall.providerList.mobileAriaLabel" })}
                  >
                    {paginatedProviders.map((provider, index) => (
                      <div key={provider.id} className="snap-start flex-shrink-0" role="listitem">
                        <ModernProfileCard
                          provider={provider}
                          onProfileClick={handleProviderClick}
                          index={index}
                          language={language}
                          intl={intl}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Version Desktop - Grille */}
                <div 
                  className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 justify-items-center"
                  role="list"
                  aria-label={intl.formatMessage({ id: "sosCall.providerList.desktopAriaLabel" })}
                >
                  {paginatedProviders.map((provider, index) => (
                    <div key={provider.id} role="listitem">
                      <ModernProfileCard
                        provider={provider}
                        onProfileClick={handleProviderClick}
                        index={index}
                        language={language}
                        intl={intl}
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination (bas) */}
                <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4">
                  <div className="text-sm text-gray-300" role="status">
                    <FormattedMessage id="sosCall.pagination.page" />{" "}
                    <strong>{page}</strong> / {totalPages} —{" "}
                    {filteredProviders.length}
                    <span className="ml-1">
                      <FormattedMessage id="sosCall.pagination.results" />
                    </span>
                  </div>
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onChange={setPage}
                    intl={intl}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-12 sm:py-16" role="status" aria-live="polite">
                <div className="rounded-2xl sm:rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-md p-6 sm:p-12 max-w-md mx-auto">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-7 h-7 sm:w-8 sm:h-8 text-gray-200" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                    <FormattedMessage id="sosCall.noResults.title" />
                  </h3>
                  <p className="text-gray-300 mb-6 text-sm sm:text-base">
                    <FormattedMessage id="sosCall.noResults.description" />
                  </p>
                  <button
                    onClick={resetFilters}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold rounded-xl transition-colors min-h-[48px]"
                  >
                    <FormattedMessage id="sosCall.noResults.resetButton" />
                  </button>
                </div>
              </div>
            )}

            {/* CTA Section */}
            <section className="text-center mt-12 sm:mt-16" aria-labelledby="cta-heading">
              <div className="rounded-2xl sm:rounded-[28px] border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md p-6 sm:p-12">
                <h3 id="cta-heading" className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-3">
                  <FormattedMessage id="sosCall.cta.title" />
                </h3>
                <p className="text-base sm:text-lg text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto">
                  <FormattedMessage 
                    id="sosCall.cta.description"
                    values={{
                      strong: (chunks) => <strong className="text-white">{chunks}</strong>,
                    }}
                  />
                </p>
                <button
                  onClick={() => navigate("/sos-appel")}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 min-h-[52px]"
                  aria-label={intl.formatMessage({ id: "sosCall.cta.buttonAriaLabel" })}
                >
                  <Phone className="w-5 h-5" aria-hidden="true" />
                  <FormattedMessage id="sosCall.cta.button" />
                </button>
              </div>
            </section>
          </div>
        </main>

        {/* FAQ Section (8 questions pour Featured Snippet) */}
        <FAQSection intl={intl} />
      </div>

      {/* Global Styles */}
      <style>{`
        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        select option {
          background-color: #1f2937;
          color: white;
        }
      `}</style>
    </Layout>
  );
};

export default SOSCall;