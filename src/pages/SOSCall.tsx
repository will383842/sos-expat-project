import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
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
import SEOHead from "../components/layout/SEOHead";
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

/* =========================
   Utils identiques à ModernProfileCard
========================= */
const CARD_DIMENSIONS = {
  width: 320,
  height: 520,
  imageHeight: 288,
  contentHeight: 232,
} as const;

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

/**
 * Convertit la locale de l'app (fr/en/es/de/pt/ru/hi/ch/ar) 
 * vers la clé de langue du fichier countries.ts
 * 
 * @param locale - Langue de l'interface (ex: "fr", "en", "es")
 * @returns Clé pour accéder au nom du pays (ex: "nameFr", "nameEn")
 * 
 * @example
 * getCountryLanguageKey("fr") // Returns "nameFr"
 * getCountryLanguageKey("es") // Returns "nameEs"
 */
const getCountryLanguageKey = (locale: string): LanguageKey => {
  const mapping: Record<string, LanguageKey> = {
    'fr': 'nameFr',   // Français
    'en': 'nameEn',   // English
    'es': 'nameEs',   // Español
    'de': 'nameDe',   // Deutsch
    'pt': 'namePt',   // Português
    'ru': 'nameRu',   // Русский
    'hi': 'nameFr',   // हिन्दी (fallback sur français si pas dispo)
    'ch': 'nameZh',   // 中文
    'zh': 'nameZh',   // 中文 (alias)
    'ar': 'nameAr',   // العربية
    'it': 'nameIt',   // Italiano
    'nl': 'nameNl',   // Nederlands
  };
  
  // Si la langue n'est pas dans la liste, retourne anglais par défaut
  return mapping[locale.toLowerCase()] || 'nameEn';
};

/**
 * Convertit la locale de l'app vers le format SupportedLocale
 * utilisé par le fichier languages.ts
 * 
 * @param locale - Langue de l'interface
 * @returns Locale supportée par languages.ts
 * 
 * @example
 * getLanguagesLocale("fr") // Returns "fr"
 * getLanguagesLocale("zh") // Returns "ch"
 */
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
    'zh': 'ch',  // Chinois zh → ch
    'ar': 'ar',
  };
  
  return mapping[locale.toLowerCase()] || 'fr';
};

/**
 * Génère la liste complète des 195 pays traduits
 * dans la langue de l'interface utilisateur
 * 
 * @param locale - Langue de l'interface (ex: "fr", "en", "es")
 * @returns Array des noms de pays traduits, triés par priorité puis alphabétiquement
 * 
 * @example
 * getCountryOptions("fr") 
 * // Returns ["Royaume-Uni", "France", "Allemagne", ..., "Zimbabwe"]
 * 
 * getCountryOptions("en")
 * // Returns ["United Kingdom", "France", "Germany", ..., "Zimbabwe"]
 */
const getCountryOptions = (locale: string): string[] => {
  // Obtient la clé correcte pour la langue (nameFr, nameEn, etc.)
  const langKey = getCountryLanguageKey(locale);
  
  // Récupère tous les pays triés
  // getSortedCountries gère déjà :
  // - Le tri par priorité (top 6 pays en premier)
  // - Le tri alphabétique
  return getSortedCountries(langKey)
    .filter(country => country.code !== 'SEPARATOR')  // Enlève le séparateur visuel
    .map(country => country[langKey]);  // Extrait juste le nom traduit
};

/**
 * Génère la liste complète des langues parlées traduites
 * dans la langue de l'interface utilisateur
 * 
 * @param locale - Langue de l'interface
 * @returns Array des noms de langues traduits, triés alphabétiquement
 * 
 * @example
 * getLanguageOptions("fr")
 * // Returns ["Allemand", "Anglais", "Arabe", ..., "Vietnamien"]
 * 
 * getLanguageOptions("en")
 * // Returns ["Arabic", "Chinese", "English", ..., "Vietnamese"]
 */
const getLanguageOptions = (locale: string): string[] => {
  // Convertit vers le format SupportedLocale
  const supportedLocale = getLanguagesLocale(locale);
  
  // Pour chaque langue, récupère son label traduit
  return languagesData
    .map(lang => getLanguageLabel(lang, supportedLocale))
    .sort((a, b) => {
      // Tri alphabétique dans la locale appropriée
      // Pour le chinois, utilise 'zh' au lieu de 'ch'
      const sortLocale = supportedLocale === 'ch' ? 'zh' : supportedLocale;
      return a.localeCompare(b, sortLocale);
    });
};

/* =========================
   ModernProfileCard Component (exact copy)
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

  const handleImageError = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const target = e.currentTarget;
      if (target.src !== "/default-avatar.png" && !imageError) {
        setImageError(true);
        target.src = "/default-avatar.png";
      }
    },
    [imageError]
  );

  const handleClick = React.useCallback(() => {
    onProfileClick(provider);
  }, [provider, onProfileClick]);

  const handleMouseEnter = React.useCallback(() => {
    if (window.matchMedia("(hover: hover)").matches) {
      setIsHovered(true);
    }
  }, []);

  const handleMouseLeave = React.useCallback(() => {
    setIsHovered(false);
  }, []);

  // ✅ CORRECTION 2: Remplacer formattedLanguages
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

  // ✅ CORRECTION 3: Ajouter formattedCountries
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
        { id: "card.aria.profileCard" },
        { name: provider.name }
      ),
      status: intl.formatMessage(
        { id: "card.aria.onlineStatus" },
        {
          status: provider.isOnline
            ? intl.formatMessage({ id: "card.online" })
            : intl.formatMessage({ id: "card.offline" }),
        }
      ),
      rating: intl.formatMessage(
        { id: "card.aria.rating" },
        { rating: provider.rating.toFixed(1) }
      ),
      viewProfile: intl.formatMessage(
        { id: "card.aria.viewProfileAction" },
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
          w-80 h-[520px] sm:w-80 md:w-80
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
        role="button"
        aria-label={ariaLabels.card}
        style={{
          animationDelay: `${index * 100}ms`,
        }}
      >
        {/* Header avec photo et statut - Dimensions explicites pour éviter layout shift */}
        <div
          className="relative overflow-hidden bg-slate-100"
          style={{ height: `${CARD_DIMENSIONS.imageHeight}px` }}
        >
          <img
            src={provider.avatar || "/default-avatar.png"}
            alt={`Photo de profil de ${provider.name}`}
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
          />

          {/* Overlay gradient amélioré */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Statut en ligne - Taille tactile optimisée */}
          <div className="absolute top-3 left-3">
            <div
              className={`
                inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium
                backdrop-blur-sm border shadow-sm transition-colors
                ${statusColors.badge}
                min-h-[36px]
              `}
              aria-label={ariaLabels.status}
            >
              {provider.isOnline ? (
                <Wifi className="w-4 h-4" aria-hidden="true" />
              ) : (
                <WifiOff className="w-4 h-4" aria-hidden="true" />
              )}
              <span>
                {provider.isOnline
                  ? intl.formatMessage({ id: "card.online" })
                  : intl.formatMessage({ id: "card.offline" })}
              </span>
            </div>
          </div>

          {/* Badge métier avec contraste amélioré */}
          <div className="absolute top-3 right-3">
            <div
              className={`
              inline-flex items-center gap-2 px-3 py-2 rounded-full 
              backdrop-blur-sm border shadow-sm border-white/30
              ${professionInfo.bgColor} ${professionInfo.textColor}
              min-h-[36px]
            `}
            >
              <span className="text-sm font-medium">
                <span aria-hidden="true">{professionInfo.icon}</span>{" "}
                {intl.formatMessage({
                  id:
                    provider.type === "lawyer"
                      ? "profession.lawyer"
                      : "profession.expat",
                })}
              </span>
            </div>
          </div>

          {/* Note avec accessibilité améliorée */}
          <div className="absolute bottom-3 right-3">
            <div
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/95 backdrop-blur-sm border border-slate-200 shadow-sm"
              aria-label={ariaLabels.rating}
            >
              <Star
                className="w-4 h-4 text-amber-500 fill-current"
                aria-hidden="true"
              />
              <span className="text-slate-800 text-sm font-medium">
                {provider.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Contenu principal - Hauteur fixe pour éviter layout shift */}
        <div
          className="p-3 flex flex-col"
          style={{ height: `${CARD_DIMENSIONS.contentHeight}px` }}
        >
          {/* Nom et expérience */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-slate-800 truncate flex-1">
                {provider.name}
              </h3>
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-teal-50 border border-teal-200 flex-shrink-0">
                <Zap className="w-3 h-3 text-teal-600" aria-hidden="true" />
                <span className="text-teal-600 text-xs font-medium">
                  {provider.yearsOfExperience}{" "}
                  {intl.formatMessage({ id: "card.years" })}
                </span>
              </div>
            </div>
          </div>

          {/* ✅ CORRECTION 5: Remplacer "Informations organisées" */}
          <div className="space-y-2 h-28 overflow-hidden">
            {/* Pays d'intervention */}
            {formattedCountries && (
              <div className="flex items-start gap-2">
                <MapPin className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-blue-600 text-xs leading-tight">
                  {formattedCountries}
                </span>
              </div>
            )}

            {/* Langues parlées */}
            {formattedLanguages && (
              <div className="flex items-start gap-2">
                <Globe className="w-3 h-3 text-indigo-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span className="text-indigo-600 text-xs leading-tight">
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
                {intl.formatMessage({ id: "card.reviews" })}
              </span>
            </div>
            <div className="text-slate-500 text-xs">
              {intl.formatMessage({
                id:
                  provider.type === "lawyer"
                    ? "profession.lawyer"
                    : "profession.expat",
              })}
            </div>
          </div>

          {/* Bouton CTA - Taille tactile optimisée */}
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
                {intl.formatMessage({ id: "card.viewProfile" })}
              </span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </article>

      {/* Styles optimisés avec prefers-reduced-motion */}
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
        
        /* Optimisation focus pour navigation clavier */
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
  const PAGE_SIZE = 9;
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

  const lang = (language as "fr" | "en") || "fr";

  // ========================================
  // 🌍 GÉNÉRATION DYNAMIQUE DES LISTES TRADUITES
  // ========================================
  
  /**
   * Liste des 195 pays traduits dans la langue courante
   * Se met à jour automatiquement quand l'utilisateur change de langue
   */
  const countryOptions = useMemo(() => {
    console.log('🌍 Génération liste pays pour langue:', language || 'fr');
    return getCountryOptions(language || 'fr');
  }, [language]);
  
  /**
   * Liste des langues parlées traduites dans la langue courante
   * Se met à jour automatiquement quand l'utilisateur change de langue
   */
  const languageOptions = useMemo(() => {
    console.log('🗣️ Génération liste langues pour langue:', language || 'fr');
    return getLanguageOptions(language || 'fr');
  }, [language]);
  
  // Log pour debug : affiche combien d'options sont générées
  useEffect(() => {
    console.log('📊 Options générées:', {
      pays: countryOptions.length,
      langues: languageOptions.length,
      langue_interface: language || 'fr'
    });
  }, [countryOptions, languageOptions, language]);


  const cardTranslations = useMemo(
    () => ({
      fr: {
        lawyer: "Avocat",
        expat: "Expatrié",
        languages: "Langues",
        about: "À propos",
        readMore: "Lire plus",
        online: "En ligne",
        offline: "Hors ligne",
        contactNow: "Contacter maintenant",
        viewProfile: "Voir le profil",
        years: "ans",
        rating: "Note",
        country: "Pays",
        experience: "Années",
      },
      en: {
        lawyer: "Lawyer",
        expat: "Expat",
        languages: "Languages",
        about: "About",
        readMore: "Read more",
        online: "Online",
        offline: "Offline",
        contactNow: "Contact now",
        viewProfile: "View profile",
        years: "years",
        rating: "Rating",
        country: "Country",
        experience: "Years",
      },
      es: {
        lawyer: "Abogado",
        expat: "Expatriado",
        languages: "Idiomas",
        about: "Acerca de",
        readMore: "Leer más",
        online: "En línea",
        offline: "Fuera de línea",
        contactNow: "Contactar ahora",
        viewProfile: "Ver perfil",
        years: "años",
        rating: "Calificación",
        country: "País",
        experience: "Años",
      },
    }),
    []
  );

  const tt = cardTranslations[lang];

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

          // 🆕 Génération du nom public avec initiale pour protéger la vie privée
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
    
    // Convertir les codes/noms en codes ISO
    const langCodes = convertLanguageNamesToCodes(langs);
    
    // Traduire chaque code selon la langue active
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
  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setShowCustomCountry(value === "Autre");
    if (value !== "Autre") setCustomCountry("");
  };

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    setShowCustomLanguage(value === "Autre");
    if (value !== "Autre") setCustomLanguage("");
  };

  // Navigation
  const handleProviderClick = (provider: Provider) => {
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
  };

  // Favoris
  const toggleFavorite = (id: string) => {
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
  };

  return (
    <Layout>
      <SEOHead
        title={`${
          selectedType === "lawyer"
            ? "Avocats"
            : selectedType === "expat"
              ? "Expatriés"
              : "Experts"
        } disponibles | SOS Expat & Travelers`}
        description={`Trouvez un ${
          selectedType === "lawyer"
            ? "avocat"
            : selectedType === "expat"
              ? "expatrié"
              : "expert"
        } vérifié disponible immédiatement. Consultation en ligne 24h/24, 7j/7 dans plus de 150 pays.`}
        canonicalUrl="/sos-appel"
      />

      <div className="min-h-screen bg-gray-950">
        {/* HERO */}
        <section className="relative pt-20 pb-24 overflow-hidden" role="banner">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-blue-500/10" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
            <div className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full pl-6 pr-3 py-2.5 border border-white/20 mb-7">
              <Phone className="w-5 h-5 text-red-300" />
              <span className="text-white font-semibold">
                <FormattedMessage id="sosCall" />
              </span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-4">
              <FormattedMessage id="sosTagline" />
              <span className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                {" "}<FormattedMessage id="expert" />{" "}
              </span>
              <FormattedMessage id="now" />
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
              <FormattedMessage
                id="verifiedLawyersExpats"
                defaultMessage="Verified Lawyers & Expats • Available 24/7 • <strong>150+ countries</strong>"
                values={{
                  strong: (chunks) => <strong>{chunks}</strong>,
                }}
              />
            </p>
          </div>
        </section>

        {/* CONTENU */}
        <main className="py-8 sm:py-12 lg:py-16">
          <div className="max-w-7xl mx-auto px-6">
            {/* Titre + Filtres */}
            <div className="text-center mb-8 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4">
                {selectedType === "lawyer" && (
                  <FormattedMessage
                    id="availableLawyers"
                    defaultMessage="Available Lawyers"
                  />
                )}
                {selectedType === "expat" && (
                  <FormattedMessage
                    id="availableExpats"
                    defaultMessage="Available Expats"
                  />
                )}
                {selectedType !== "lawyer" && selectedType !== "expat" && (
                  <FormattedMessage
                    id="availableExperts"
                    defaultMessage="Experts available"
                  />
                )}
              </h2>

              {/* FILTRES */}
              <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-md p-4 sm:p-6 max-w-6xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                  {/* Type */}
                  <div className="space-y-1">
                    <label
                      htmlFor="expert-type"
                      className="block text-xs font-semibold text-gray-300 uppercase tracking-wide"
                    >
                      <FormattedMessage id="type" />
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
                        className="
                          w-full px-3 py-2
                          bg-white text-gray-900
                          border border-gray-300 rounded-xl
                          dark:bg-white/10 dark:text-white dark:border-white/20
                          focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent
                          transition-all appearance-none text-sm
                        "
                      >
                        <option value="all">
                          <FormattedMessage id="filter.all" />
                        </option>
                        <option value="lawyer">
                          <FormattedMessage id="filter.lawyer" />
                        </option>
                        <option value="expat">
                          <FormattedMessage id="filter.expat" />
                        </option>
                      </select>
                      <ChevronDown
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-300 pointer-events-none"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  {/* Pays */}
                  <div className="space-y-1">
                    <label
                      htmlFor="country-filter"
                      className="block text-xs font-semibold text-gray-300 uppercase tracking-wide"
                    >
                      <FormattedMessage id="country.label" />
                    </label>
                    <div className="relative">
                      <select
                        id="country-filter"
                        value={selectedCountry}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="
                          w-full px-3 py-2
                          bg-white text-gray-900
                          border border-gray-300 rounded-xl
                          dark:bg-white/10 dark:text-white dark:border-white/20
                          focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent
                          transition-all appearance-none text-sm
                        "
                      >
                        <option value="all">
                          <FormattedMessage id="country.allCountries" />
                        </option>
                        {countryOptions.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                        <option value="Autre">
                          <FormattedMessage id="country.other" />
                        </option>
                      </select>
                      <ChevronDown
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-300 pointer-events-none"
                        aria-hidden="true"
                      />
                    </div>
                    {showCustomCountry && (
                      <input
                        type="text"
                        placeholder="Nom du pays"
                        value={customCountry}
                        onChange={(e) => setCustomCountry(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/60 focus:border-transparent transition-all text-sm text-white placeholder:text-gray-400 mt-2"
                      />
                    )}
                  </div>

                  {/* Langue */}
                  <div className="space-y-1">
                    <label
                      htmlFor="language-filter"
                      className="block text-xs font-semibold text-gray-300 uppercase tracking-wide"
                    >
                      <FormattedMessage id="language.label" />
                    </label>
                    <div className="relative">
                      <select
                        id="language-filter"
                        value={selectedLanguage}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        className="
                          w-full px-3 py-2
                          bg-white text-gray-900
                          border border-gray-300 rounded-xl
                          dark:bg-white/10 dark:text-white dark:border-white/20
                          focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent
                          transition-all appearance-none text-sm
                        "
                      >
                        <option value="all">
                          <FormattedMessage id="language.all" />
                        </option>
                        {languageOptions.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                        <option value="Autre">
                          <FormattedMessage id="language.other" />
                        </option>
                      </select>
                      <ChevronDown
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-300 pointer-events-none"
                        aria-hidden="true"
                      />
                    </div>
                    {showCustomLanguage && (
                      <input
                        type="text"
                        placeholder="Langue"
                        value={customLanguage}
                        onChange={(e) => setCustomLanguage(e.target.value)}
                        className="w-full px-3 py-2 bg-white/10 border border-white/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/60 focus:border-transparent transition-all text-sm text-white placeholder:text-gray-400 mt-2"
                      />
                    )}
                  </div>

                  {/* Statut */}
                  <div className="space-y-1 lg:col-span-2">
                    <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wide">
                      <FormattedMessage id="status.label" />
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStatusFilter("all")}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition ${
                          statusFilter === "all"
                            ? "bg-white/20 text-white border-white/30"
                            : "bg-white/10 text-gray-200 border-white/20 hover:bg-white/15"
                        }`}
                        aria-pressed={statusFilter === "all"}
                      >
                        <span className="w-2 h-2 rounded-full bg-gray-300" />
                        <FormattedMessage id="status.all" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter("online")}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition ${
                          statusFilter === "online"
                            ? "bg-white/20 text-white border-white/30"
                            : "bg-white/10 text-gray-200 border-white/20 hover:bg-white/15"
                        }`}
                        aria-pressed={statusFilter === "online"}
                        title="En ligne"
                      >
                        <Wifi className="w-4 h-4" />
                        <FormattedMessage id="status.online" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter("offline")}
                        className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition ${
                          statusFilter === "offline"
                            ? "bg-white/20 text-white border-white/30"
                            : "bg-white/10 text-gray-200 border-white/20 hover:bg-white/15"
                        }`}
                        aria-pressed={statusFilter === "offline"}
                        title="Hors ligne"
                      >
                        <WifiOff className="w-4 h-4" />
                        <FormattedMessage id="status.offline" />
                      </button>
                    </div>
                  </div>

                  {/* Reset */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-transparent">
                      <FormattedMessage id="action.label" />
                    </label>
                    <button
                      onClick={() => {
                        setSelectedType("all");
                        setSelectedCountry("all");
                        setSelectedLanguage("all");
                        setCustomCountry("");
                        setCustomLanguage("");
                        setShowCustomCountry(false);
                        setShowCustomLanguage(false);
                        setStatusFilter("all");
                        setOnlineOnly(false);
                      }}
                      className="w-full px-3 py-2 border border-white/15 rounded-xl text-gray-100 hover:bg-white/10 active:bg-white/15 transition-colors text-sm font-semibold h-10"
                    >
                      <FormattedMessage id="action.reset" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 text-center text-xs text-gray-300">
                  <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 bg-white/10 border border-white/15">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    {filteredProviders.filter((p) => p.isOnline).length}
                    <span>
                      <FormattedMessage id="status.online" />
                    </span>
                  </span>
                  <span className="mx-2  text-white/30">•</span>
                  {filteredProviders.length}
                  <span className="ml-[2px]">
                    <FormattedMessage id="stats.total" />
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
                />
              </div>
            )}

            {/* Skeletons */}
            {isLoadingProviders ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: PAGE_SIZE }).map((_, index) => (
                  <div
                    key={`sk-${index}`}
                    className="bg-white/5 rounded-[28px] border border-white/10 overflow-hidden animate-pulse"
                  >
                    <div className="w-full h-80 bg-white/10" />
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
                {/* DESIGN EXACT DE ModernProfileCard - MOBILE FIRST */}

                {/* Version Mobile - Scroll horizontal */}
                <div className="md:hidden">
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                    {paginatedProviders.map((provider, index) => (
                      <div key={provider.id} className="snap-start">
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
                <div className="hidden md:grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {paginatedProviders.map((provider, index) => (
                    <ModernProfileCard
                      key={provider.id}
                      provider={provider}
                      onProfileClick={handleProviderClick}
                      index={index}
                      language={language}
                      intl={intl}
                    />
                  ))}
                </div>

                <style>{`
                  .scrollbar-hide {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                  }
                  .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>

                {/* Pagination (bas) */}
                <div className="flex items-center justify-between mt-8">
                  <div className="text-sm text-gray-300">
                    {lang === "en"
                      ? "Page"
                      : lang === "es"
                        ? "Página"
                        : lang === "fr"
                          ? "Page"
                          : lang === "de"
                            ? "Seite"
                            : lang === "ru"
                              ? "Страница"
                              : lang === "hi"
                                ? "पृष्ठ"
                                : lang === "ch"
                                  ? "页面"
                                  : lang === "pt"
                                    ? "Página"
                                    : lang === "ar"
                                      ? "صفحة"
                                      : "Page"}{" "}
                    <strong>{page}</strong> / {totalPages} —{" "}
                    {filteredProviders.length}
                    <span className="ml-[2px]">
                      <FormattedMessage id="pagination.results" />
                    </span>
                  </div>
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    onChange={setPage}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-md p-8 sm:p-12 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-200" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    <FormattedMessage id="noResults.title" />
                  </h3>
                  <p className="text-gray-300 mb-6">
                    <FormattedMessage id="noResults.description" />
                  </p>
                  <button
                    onClick={() => {
                      setSelectedType("all");
                      setSelectedCountry("all");
                      setSelectedLanguage("all");
                      setCustomCountry("");
                      setCustomLanguage("");
                      setShowCustomCountry(false);
                      setShowCustomLanguage(false);
                      setStatusFilter("all");
                      setOnlineOnly(false);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    <FormattedMessage id="noResults.resetFilters" />
                  </button>
                </div>
              </div>
            )}

            {/* CTA */}
            <section className="text-center mt-12 sm:mt-16">
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md p-8 sm:p-12">
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
                  <FormattedMessage id="needImmediateHelp" />
                </h3>
                <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                  <FormattedMessage
                    id="verifiedExpertsAvailable"
                    defaultMessage="Over 200 verified experts available in <strong>150+ countries</strong> to assist you."
                    values={{
                      strong: (chunks) => <strong>{chunks}</strong>,
                    }}
                  />
                </p>
                <button
                  onClick={() => navigate("/sos-appel")}
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                >
                  <Phone className="w-5 h-5" />
                  <FormattedMessage id="findExpert" />
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </Layout>
  );
};

/* =========================
   Pagination component
========================= */
const Pagination: React.FC<{
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}> = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  const go = (p: number) => {
    const np = Math.min(totalPages, Math.max(1, p));
    if (np !== page) onChange(np);
  };

  const makePages = (): Array<number | "ellipsis"> => {
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
  };

  const items = makePages();

  return (
    <nav className="inline-flex items-center gap-1" aria-label="Pagination">
      <button
        onClick={() => go(page - 1)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={page <= 1}
        aria-label="Page précédente"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">
          <FormattedMessage id="pagination.previous" />
        </span>
      </button>

      {items.map((it, idx) =>
        it === "ellipsis" ? (
          <span key={`el-${idx}`} className="px-2 text-gray-300">
            …
          </span>
        ) : (
          <button
            key={`p-${it}`}
            onClick={() => go(it)}
            aria-current={it === page ? "page" : undefined}
            className={`w-9 h-9 rounded-xl border text-sm font-semibold transition ${
              it === page
                ? "bg-white/20 text-white border-white/30"
                : "bg-white/10 text-gray-200 border-white/20 hover:bg-white/15"
            }`}
            title={`Aller à la page ${it}`}
          >
            {it}
          </button>
        )
      )}

      <button
        onClick={() => go(page + 1)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={page >= totalPages}
        aria-label="Page suivante"
      >
        <span className="hidden sm:inline">
          <FormattedMessage id="pagination.next" />
        </span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
};

export default SOSCall;