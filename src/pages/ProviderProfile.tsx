// src/pages/ProviderProfile.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { parseLocaleFromPath, getLocaleString, getTranslatedRouteSlug } from "../multilingual-system";
import {
  Star,
  MapPin,
  Phone,
  Shield,
  Award,
  Globe,
  Users,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  GraduationCap,
  Briefcase,
  Languages as LanguagesIcon,
} from "lucide-react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
  onSnapshot,
  Timestamp as FsTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";
import Layout from "../components/layout/Layout";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import { useApp } from "../contexts/AppContext";
import {
  logAnalyticsEvent,
  getProviderReviews,
  incrementReviewHelpfulCount,
  reportReview,
  normalizeUserData,
} from "../utils/firestore";
import Reviews from "../components/review/Reviews";
import SEOHead from "../components/layout/SEOHead";
import { Review } from "../types";
import { formatLanguages } from "@/i18n";

// 👉 Pricing admin (source de vérité)
import { usePricingConfig } from "../services/pricingService";
// 👉 Translation system
import { useProviderTranslation } from "../hooks/useProviderTranslation";
import { TranslationBanner } from "../components/provider/TranslationBanner";
import { type SupportedLanguage } from "../services/providerTranslationService";
import { FormattedMessage, useIntl } from "react-intl";
// 👉 Specialty translation
import { lawyerSpecialitiesData, flattenLawyerSpecialities } from "../data/lawyer-specialties";
import { expatHelpTypesData } from "../data/expat-help-types";

/* ===================================================================== */

const IMAGE_SIZES = {
  AVATAR_MOBILE: 112,
  AVATAR_DESKTOP: 128,
  MODAL_MAX_WIDTH: 1200,
  MODAL_MAX_HEIGHT: 800,
} as const;

const ANIMATION_DURATIONS = {
  STATUS_TRANSITION: 500,
  LOADING_DELAY: 2500,
} as const;

const STORAGE_KEYS = {
  SELECTED_PROVIDER: "selectedProvider",
} as const;

// i18n constants
const TEXTS = {
  fr: {
    loading: "Chargement du profil...",
    notFound: "Ce profil prestataire est introuvable. Redirection en cours...",
    backToExperts: "Retour aux experts",
    certifiedLawyer: "Avocat certifié",
    expertExpat: "Expatrié expert",
    verified: "Vérifié",
    online: "EN LIGNE",
    offline: "HORS LIGNE",
    yearsExperience: "ans d'expérience",
    yearsAsExpat: "ans d'expatriation",
    reviews: "avis",
    share: "Partager : ",
    copyLink: "Copier le lien",
    successRate: "Taux de succès",
    availability: "Disponibilité",
    completedCalls: "Appels réalisés",
    bookNow: "RÉSERVER MAINTENANT",
    unavailable: "NON DISPONIBLE",
    availableNow: "Expert disponible maintenant !",
    currentlyOffline: "Expert actuellement hors ligne",
    securePayment: "Paiement sécurisé • Satisfaction garantie",
    specialties: "Spécialités",
    languages: "Langues parlées",
    educationCertifications: "Formation et certifications",
    expatExperience: "Expérience d'expatriation",
    customerReviews: "Avis clients",
    loadingReviews: "Chargement des avis...",
    stats: "Statistiques",
    averageRating: "Note moyenne",
    information: "Informations",
    basedIn: "Basé en",
    speaks: "Parle",
    onlineNow: "EN LIGNE MAINTENANT",
    verifiedExpert: "Expert vérifié",
    linkCopied: "Lien copié !",
    reportReason: "Veuillez indiquer la raison du signalement :",
    reportThanks: "Merci pour votre signalement. Notre équipe va l'examiner.",
    close: "Fermer",
    photoOf: "Photo de",
    noSpecialties: "Aucune spécialité renseignée.",
    yearsAbroad: "ans d'expatriation",
    in: "en",
    experience: "Expérience",
    years: "ans",
    minutes: "minutes",
    memberSince: "Inscrit depuis le",
  },
  en: {
    loading: "Loading profile...",
    notFound: "This provider profile was not found. Redirecting...",
    backToExperts: "Back to experts",
    certifiedLawyer: "Certified lawyer",
    expertExpat: "Expert expat",
    verified: "Verified",
    online: "ONLINE",
    offline: "OFFLINE",
    yearsExperience: "years experience",
    yearsAsExpat: "years as expat",
    reviews: "reviews",
    share: "Share:",
    copyLink: "Copy link",
    successRate: "Success rate",
    availability: "Availability",
    completedCalls: "Completed calls",
    bookNow: "BOOK NOW",
    unavailable: "UNAVAILABLE",
    availableNow: "Expert available now!",
    currentlyOffline: "Expert currently offline",
    securePayment: "Secure payment • Satisfaction guaranteed",
    specialties: "Specialties",
    languages: "Languages",
    educationCertifications: "Education & Certifications",
    expatExperience: "Expat experience",
    customerReviews: "Customer reviews",
    loadingReviews: "Loading reviews...",
    stats: "Stats",
    averageRating: "Average rating",
    information: "Information",
    basedIn: "Based in",
    speaks: "Speaks",
    onlineNow: "ONLINE NOW",
    verifiedExpert: "Verified expert",
    linkCopied: "Link copied!",
    reportReason: "Please enter a reason:",
    reportThanks: "Thanks. Our team will review it.",
    close: "Close",
    photoOf: "Photo of",
    noSpecialties: "No specialties provided.",
    yearsAbroad: "years abroad",
    in: "in",
    experience: "Experience",
    years: "yrs",
    minutes: "minutes",
    memberSince: "Member since",
  },
} as const;

type TSLike = FsTimestamp | Date | null | undefined;

// Types
interface LocalizedText {
  fr?: string;
  en?: string;
  [key: string]: string | undefined;
}
interface Education {
  institution?: string | LocalizedText;
  degree?: string | LocalizedText;
  year?: number;
  [key: string]: unknown;
}
interface Certification {
  name?: string | LocalizedText;
  issuer?: string | LocalizedText;
  year?: number;
  [key: string]: unknown;
}

// ✅ AuthUser ad hoc (n’hérite pas)
type AuthUser = {
  uid?: string;
  id?: string;
} & Partial<import("../contexts/types").User>;

interface LocationState {
  selectedProvider?: Partial<SosProfile>;
  providerData?: Partial<SosProfile>;
  navigationSource?: string;
}
interface SosProfile {
  uid: string;
  id?: string;
  type: "lawyer" | "expat";
  fullName: string;
  firstName: string;
  lastName: string;
  slug?: string;
  country: string;
  city?: string;
  languages: string[];
  mainLanguage?: string;
  specialties: string[];
  helpTypes?: string[];
  description?: string | LocalizedText;
  professionalDescription?: string | LocalizedText;
  experienceDescription?: string | LocalizedText;
  motivation?: string | LocalizedText;
  bio?: string | LocalizedText;
  profilePhoto?: string;
  photoURL?: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  yearsOfExperience: number;
  yearsAsExpat?: number;
  isOnline?: boolean;
  isActive: boolean;
  isApproved: boolean;
  isVerified: boolean;
  isVisibleOnMap?: boolean;
  
  // ❌ Supprimé: price?: number; duration?: number;
  education?: Education | Education[] | LocalizedText;
  certifications?: Certification | Certification[] | LocalizedText;
  lawSchool?: string | LocalizedText;
  graduationYear?: number;
  responseTime?: string;
  successRate?: number;
  totalCalls?: number;
  successfulCalls?: number;
  totalResponses?: number;
  totalResponseTime?: number;
  avgResponseTimeMs?: number;
  createdAt?: TSLike;
  updatedAt?: TSLike;
  lastSeen?: TSLike;
}
interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}
interface OnlineStatus {
  isOnline: boolean;
  lastUpdate: Date | null;
  listenerActive: boolean;
  connectionAttempts: number;
}
interface RouteParams extends Record<string, string | undefined> {
  id?: string;
  country?: string;
  language?: string;
  type?: string;
  slug?: string;
  profileId?: string;
  name?: string;
}

// Utils
const detectLanguage = (): "fr" | "en" =>
  typeof navigator !== "undefined" && navigator.language
    ? navigator.language.toLowerCase().startsWith("fr")
      ? "fr"
      : "en"
    : "en";

const safeNormalize = (v?: string): string =>
  (v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getFirstString = (
  val: unknown,
  preferred?: string
): string | undefined => {
  if (!val) return undefined;
  if (typeof val === "string") return val.trim() || undefined;
  if (Array.isArray(val)) {
    const arr = val
      .map((x) => getFirstString(x, preferred))
      .filter((x): x is string => Boolean(x));
    return arr.length ? arr.join(", ") : undefined;
  }
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if (preferred && typeof obj[preferred] === "string") {
      const s = (obj[preferred] as string).trim();
      if (s) return s;
    }
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  return undefined;
};

const toArrayFromAny = (val: unknown, preferred?: string): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map((x) =>
        typeof x === "string" ? x : getFirstString(x, preferred) || ""
      )
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof val === "string")
    return val
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    return Object.values(obj)
      .map((v) =>
        typeof v === "string" ? v : getFirstString(v, preferred) || ""
      )
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const pickDescription = (
  p: Partial<SosProfile>,
  preferredLang?: string
): string => {
  const chain = [
    getFirstString(p.description, preferredLang),
    getFirstString(p.bio, preferredLang),
    getFirstString(p.professionalDescription, preferredLang),
    getFirstString(p.experienceDescription, preferredLang),
  ];
  return (
    chain.find(Boolean) ||
    TEXTS[preferredLang as "fr" | "en"]?.noSpecialties ||
    "No description available."
  );
};

const toStringFromAny = (
  val: unknown,
  preferred?: string
): string | undefined => getFirstString(val, preferred);

const isFsTimestamp = (v: unknown): v is FsTimestamp =>
  typeof (v as FsTimestamp | null)?.toDate === "function";

// Helper to translate specialty codes to localized labels
const translateSpecialtyCode = (
  code: string,
  locale: "fr" | "en",
  isLawyer: boolean
): string => {
  if (!code) return code;
  
  // Try to find in lawyer specialties
  if (isLawyer) {
    const flattened = flattenLawyerSpecialities();
    const specialty = flattened.find((s) => s.code === code);
    if (specialty) {
      const labelKey = locale === "fr" ? "labelFr" : "labelEn";
      return specialty[labelKey] || specialty.labelFr || code;
    }
  } else {
    // Try to find in expat help types
    const helpType = expatHelpTypesData.find((h) => h.code === code);
    if (helpType) {
      const labelKey = locale === "fr" ? "labelFr" : "labelEn";
      return helpType[labelKey] || helpType.labelFr || code;
    }
  }
  
  // If not found as a code, return as-is (might be a plain text string)
  return code;
};

const formatJoinDate = (val: TSLike, lang: "fr" | "en"): string | undefined => {
  if (!val) return undefined;
  const d = isFsTimestamp(val)
    ? val.toDate()
    : val instanceof Date 
      ? val
      : undefined;
  if (!d) return undefined;
  const fmt = new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  return fmt.format(d);
};

/* ======= Helpers prix avec Intl.NumberFormat ======= */
const formatEUR = (value?: number) => {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatUSD = (value?: number) => {
  if (typeof value !== "number") return "$—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

// ✅ Helper type-safe pour extraire l'ID utilisateur sans any
const getAuthUserId = (u: unknown): string | undefined => {
  if (!u || (typeof u !== "object" && typeof u !== "function"))
    return undefined;
  const maybe = u as { uid?: unknown; id?: unknown };
  const uid =
    typeof maybe.uid === "string" && maybe.uid.trim() ? maybe.uid : undefined;
  const id =
    typeof maybe.id === "string" && maybe.id.trim() ? maybe.id : undefined;
  return uid ?? id;
};

// Component
const ProviderProfile: React.FC = () => {
  const intl = useIntl();
  const params = useParams<RouteParams>();
  const {
    id,
    country: countryParam,
    language: langParam,
    type: typeParam,
  } = params;
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useApp();

  // const detectedLang = useMemo(
  //   () =>
  //     language === "fr" || language === "en"
  //       ? (language as "fr" | "en")
  //       : detectLanguage(),
  //   [language]
  // );
  const detectedLang = useMemo(
    () =>
      language === "fr" || language === "en"
        ? (language as "fr" | "en")
        : detectLanguage(),
    [language]
  );
  const t = useCallback(
    (key: keyof typeof TEXTS.fr): string =>
      TEXTS[detectedLang]?.[key] || TEXTS.en[key] || key,
    [detectedLang]
  );
  const preferredLangKey = detectedLang === "fr" ? "fr" : "en";

  const [provider, setProvider] = useState<SosProfile | null>(null);
  const [realProviderId, setRealProviderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  
  // Translation system
  const { locale: currentLocale, lang: currentLang } = parseLocaleFromPath(location.pathname);
  const targetLanguage: SupportedLanguage = (currentLang?.toLowerCase() as SupportedLanguage) || 'en';
  // Always show original first, then switch to translated when user selects a language
  const [showOriginal, setShowOriginal] = useState(true);
  // Track which language translation we're currently viewing
  const [viewingLanguage, setViewingLanguage] = useState<SupportedLanguage | null>(null);
  
  // Use ref to track if we're actively viewing a translation (prevents state resets)
  const viewingLanguageRef = useRef<SupportedLanguage | null>(null);
  
  // Sync ref with state
  useEffect(() => {
    viewingLanguageRef.current = viewingLanguage;
  }, [viewingLanguage]);
  
  // Only load translation if user explicitly selected a language to view
  // On initial load, don't load any translation - always show original
  const translationLanguage = viewingLanguage || null; // Don't use targetLanguage on initial load
  const {
    translation,
    original: originalTranslation,
    availableLanguages,
    isLoading: isTranslationLoading,
    translate,
    reloadForLanguage,
    error: translationError,
  } = useProviderTranslation(realProviderId, viewingLanguage || null); // Never use targetLanguage here to prevent unwanted reloads

  // Preserve translation view state when translation data changes
  useEffect(() => {
    // If we're viewing a translation and translation data exists, ensure state is preserved
    if (viewingLanguageRef.current && translation && !showOriginal) {
      // State is already correct, but ensure it stays that way
      // This prevents reverting to original when translation data reloads
      console.log('[ProviderProfile] Preserving translation view for:', viewingLanguageRef.current);
      // Force state to remain if it somehow got reset
      if (viewingLanguage !== viewingLanguageRef.current) {
        console.log('[ProviderProfile] State mismatch detected, restoring viewingLanguage');
        setViewingLanguage(viewingLanguageRef.current);
        setShowOriginal(false);
      }
    }
  }, [translation, viewingLanguage, showOriginal]);

  // 👉 Pricing admin (page AdminPricing -> doc "admin_config/pricing")
  const { pricing } = usePricingConfig();

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [ratingDistribution, setRatingDistribution] =
    useState<RatingDistribution>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [showImageModal, setShowImageModal] = useState(false);

  // Online status
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>({
    isOnline: false,
    lastUpdate: null,
    listenerActive: false,
    connectionAttempts: 0,
  });

  // Call status - tracks if provider is currently on a call
  const [isOnCall, setIsOnCall] = useState(false);

  const [activePromo, setActivePromo] = useState<{
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    services: string[];
  } | null>(null);

  // Ref to prevent SEO metadata from being updated multiple times
  const seoUpdatedRef = useRef(false);
  const lastUrlRef = useRef<string>('');

  // Reset SEO flag when provider ID changes
  useEffect(() => {
    seoUpdatedRef.current = false;
    lastUrlRef.current = '';
  }, [id, params.slug, params.profileId]);

  // Load active promo from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("activePromoCode");
      if (saved) {
        const promoData = JSON.parse(saved);
        setActivePromo(promoData);
      }
    } catch (error) {
      console.error("Error loading active promo:", error);
    }
  }, []);

  // ======= Prix depuis Admin uniquement (EUR principal + équivalent USD) =======
  const serviceTypeForPricing: "lawyer" | "expat" | undefined = provider?.type;


  // const bookingPrice = useMemo(() => {
  //   if (!pricing || !serviceTypeForPricing) return null;
  //   const cfg = pricing[serviceTypeForPricing];
  //   console.log("cfg ===", cfg);
  //   return {
  //     eur: cfg.eur.totalAmount,
  //     usd: cfg.usd.totalAmount,
  //     duration: cfg.eur.duration, // durée admin
  //   };
  // }, [pricing, serviceTypeForPricing]);

  // Reviews loader 
  const bookingPrice = useMemo(() => {
    if (!pricing || !serviceTypeForPricing) return null;

    const cfg = pricing[serviceTypeForPricing];
    const baseEur = cfg.eur.totalAmount;
    const baseUsd = cfg.usd.totalAmount;

    // Check if promo applies to this service type
    const serviceKey =
      serviceTypeForPricing === "lawyer" ? "lawyer_call" : "expat_call";
    const promoApplies =
      activePromo && activePromo.services.includes(serviceKey);

    let finalEur = baseEur;
    let finalUsd = baseUsd;
    let discountEur = 0;
    let discountUsd = 0;

    if (promoApplies) {
      if (activePromo.discountType === "percentage") {
        discountEur = baseEur * (activePromo.discountValue / 100);
        discountUsd = baseUsd * (activePromo.discountValue / 100);
      } else {
        // Fixed discount - assume it's in EUR, convert proportionally
        discountEur = Math.min(activePromo.discountValue, baseEur);
        discountUsd = Math.min(
          activePromo.discountValue * (baseUsd / baseEur),
          baseUsd
        );
      }

      finalEur = Math.max(0, baseEur - discountEur);
      finalUsd = Math.max(0, baseUsd - discountUsd);
    }

    return {
      eur: Math.round(finalEur),
      usd: Math.round(finalUsd),
      originalEur: baseEur,
      originalUsd: baseUsd,
      discountEur: Math.round(discountEur),
      discountUsd: Math.round(discountUsd),
      hasDiscount: promoApplies,
      duration: cfg.eur.duration,
      promoCode: promoApplies ? activePromo.code : null,
    };
  }, [pricing, serviceTypeForPricing, activePromo]);

  const realLoadReviews = useCallback(
    async (providerId: string): Promise<Review[]> => {
      try {
        const arr = await getProviderReviews(providerId);
        return Array.isArray(arr) ? arr : [];
      } catch {
        return [];
      }
    },
    []
  );

  const loadReviews = useCallback(
    async (docId: string, uid?: string): Promise<void> => {
      try {
        setIsLoadingReviews(true);
        const candidates = [docId, uid].filter((x): x is string => Boolean(x));
        let providerReviews: Review[] = [];
        for (const pid of candidates) {
          providerReviews = await realLoadReviews(pid);
          if (providerReviews.length) break;
        }
        setReviews(providerReviews);
        const distribution: RatingDistribution = {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        };
        providerReviews.forEach((r) => {
          const rr = Math.max(
            1,
            Math.min(5, Math.round(r.rating))
          ) as keyof RatingDistribution;
          distribution[rr] += 1;
        });
        setRatingDistribution(distribution);
      } catch (e) {
        console.error("Error loading reviews:", e);
      } finally {
        setIsLoadingReviews(false);
      }
    },
    [realLoadReviews]
  );

  // Main data loader
  useEffect(() => {
    const loadProviderData = async (): Promise<void> => {
      setIsLoading(true);
      setNotFound(false);

      try {
        let providerData: SosProfile | null = null;
        let foundProviderId: string | null = null;

        const rawIdParam =
          id ||
          params.slug ||
          params.profileId ||
          params.name ||
          location.pathname.split("/").pop() ||
          "";
        const lastToken = rawIdParam.split("-").pop() || rawIdParam;
        const slugNoUid = rawIdParam.replace(/-[a-zA-Z0-9]{8,}$/, "");

        // By ID
        try {
          const ref = doc(db, "sos_profiles", lastToken);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            const normalized = normalizeUserData(data, snap.id);
            const built: SosProfile = {
              ...normalized,
              id: snap.id,
              uid: normalized.uid || snap.id,
              type: (data?.type as "lawyer" | "expat") || "expat",
            } as unknown as SosProfile;

            built.description = pickDescription(built, preferredLangKey);
            built.specialties = toArrayFromAny(
              data?.specialties,
              preferredLangKey
            );
            built.helpTypes = toArrayFromAny(data?.helpTypes, preferredLangKey);

            providerData = built;
            foundProviderId = snap.id;
            setOnlineStatus((s) => ({
              ...s,
              isOnline: !!data?.isOnline,
              lastUpdate: new Date(),
            }));
          }
        } catch (e) {
          console.warn("Provider lookup by ID failed:", e);
        }

        // By uid
        if (!providerData) {
          try {
            const qByUid = query(
              collection(db, "sos_profiles"),
              where("uid", "==", lastToken),
              limit(1)
            );
            const qsUid = await getDocs(qByUid);
            const found = qsUid.docs[0];
            if (found) {
              const data = found.data();
              const normalized = normalizeUserData(data, found.id);
              const built: SosProfile = {
                ...normalized,
                id: found.id,
                uid: normalized.uid || found.id,
                type: (data?.type as "lawyer" | "expat") || "expat",
              } as unknown as SosProfile;

              built.description = pickDescription(built, preferredLangKey);
              built.specialties = toArrayFromAny(
                data?.specialties,
                preferredLangKey
              );
              built.helpTypes = toArrayFromAny(
                data?.helpTypes,
                preferredLangKey
              );

              providerData = built;
              foundProviderId = found.id;
              setOnlineStatus((s) => ({
                ...s,
                isOnline: !!data?.isOnline,
                lastUpdate: new Date(),
              }));
            }
          } catch (e) {
            console.warn("Provider lookup by UID failed:", e);
          }
        }

        // SEO fallback
        if (
          !providerData &&
          typeParam &&
          countryParam &&
          langParam &&
          rawIdParam
        ) {
          const type =
            typeParam === "avocat"
              ? "lawyer"
              : typeParam === "expatrie"
                ? "expat"
                : undefined;
          if (type) {
            try {
              const qRef = query(
                collection(db, "sos_profiles"),
                where("type", "==", type),
                where("isActive", "==", true),
                limit(50)
              );
              const qs = await getDocs(qRef);
              const match = qs.docs.find((d) => {
                const data = d.data() || {};
                const dataSlug = (data.slug as string | undefined) || "";
                const computedNameSlug = safeNormalize(
                  `${data.firstName || ""}-${data.lastName || ""}`
                );
                return (
                  dataSlug === slugNoUid ||
                  (dataSlug && dataSlug.startsWith(slugNoUid)) ||
                  computedNameSlug === slugNoUid
                );
              });

              if (match) {
                const data = match.data();
                const normalized = normalizeUserData(data, match.id);
                const built: SosProfile = {
                  ...normalized,
                  id: match.id,
                  uid: normalized.uid || match.id,
                  type: (data?.type as "lawyer" | "expat") || "expat",
                } as unknown as SosProfile;

                built.description = pickDescription(built, preferredLangKey);
                built.specialties = toArrayFromAny(
                  data?.specialties,
                  preferredLangKey
                );
                built.helpTypes = toArrayFromAny(
                  data?.helpTypes,
                  preferredLangKey
                );

                providerData = built;
                foundProviderId = match.id;
                setOnlineStatus((s) => ({
                  ...s,
                  isOnline: !!data?.isOnline,
                  lastUpdate: new Date(),
                }));
              }
            } catch (e) {
              console.warn("SEO fallback lookup failed:", e);
            }
          }
        }

        // By slug
        if (!providerData && rawIdParam) {
          try {
            const qSlug = query(
              collection(db, "sos_profiles"),
              where("slug", "==", slugNoUid),
              limit(1)
            );
            const qsSlug = await getDocs(qSlug);
            const m = qsSlug.docs[0];
            if (m) {
              const data = m.data();
              const normalized = normalizeUserData(data, m.id);
              const built: SosProfile = {
                ...normalized,
                id: m.id,
                uid: normalized.uid || m.id,
                type: (data?.type as "lawyer" | "expat") || "expat",
              } as unknown as SosProfile;

              built.description = pickDescription(built, preferredLangKey);
              built.specialties = toArrayFromAny(
                data?.specialties,
                preferredLangKey
              );
              built.helpTypes = toArrayFromAny(
                data?.helpTypes,
                preferredLangKey
              );

              providerData = built;
              foundProviderId = m.id;
              setOnlineStatus((s) => ({
                ...s,
                isOnline: !!data?.isOnline,
                lastUpdate: new Date(),
              }));
            }
          } catch (e) {
            console.warn("Slug lookup failed:", e);
          }
        }

        // State fallback
        if (
          !providerData &&
          typeof location.state === "object" &&
          location.state !== null
        ) {
          const state = location.state as LocationState;
          const navData = state.selectedProvider || state.providerData;
          if (navData) {
            const built: SosProfile = {
              uid: navData.id || "",
              id: navData.id || "",
              fullName:
                navData.fullName ||
                `${navData.firstName || ""} ${navData.lastName || ""}`.trim(),
              firstName: navData.firstName || "",
              lastName: navData.lastName || "",
              type: navData.type === "lawyer" ? "lawyer" : "expat",
              country: navData.country || "",
              languages: navData.languages || ["Français"],
              specialties: toArrayFromAny(
                navData.specialties,
                preferredLangKey
              ),
              helpTypes: toArrayFromAny(navData.helpTypes, preferredLangKey),
              description: navData.description || navData.bio || "",
              professionalDescription: navData.professionalDescription || "",
              experienceDescription: navData.experienceDescription || "",
              motivation: navData.motivation || "",
              bio: navData.bio,
              profilePhoto: navData.profilePhoto || navData.avatar,
              photoURL: navData.photoURL,
              avatar: navData.avatar,
              rating: Number(navData.rating) || 0,
              reviewCount: Number(navData.reviewCount) || 0,
              yearsOfExperience: Number(navData.yearsOfExperience) || 0,
              yearsAsExpat: Number(navData.yearsAsExpat) || 0,
              // ❌ Plus de prix/durée override provider — uniquement admin
              isOnline: !!navData.isOnline,
              isActive: true,
              isApproved: !!navData.isApproved,
              isVerified: !!navData.isVerified,
              education: navData.education,
              lawSchool: navData.lawSchool,
              graduationYear: navData.graduationYear,
              certifications: navData.certifications,
              responseTime: navData.responseTime,
              successRate:
                typeof navData.successRate === "number"
                  ? navData.successRate
                  : undefined,
              totalCalls:
                typeof navData.totalCalls === "number"
                  ? navData.totalCalls
                  : undefined,
            };

            built.description = pickDescription(built, preferredLangKey);
            providerData = built;
            foundProviderId = navData.id || "";
            setOnlineStatus((s) => ({
              ...s,
              isOnline: !!navData.isOnline,
              lastUpdate: new Date(),
            }));
          }
        }

        if (providerData && foundProviderId) {
          if (!providerData.fullName?.trim()) {
            providerData.fullName =
              `${providerData.firstName || ""} ${providerData.lastName || ""}`.trim() ||
              "Profil SOS";
          }
          setProvider(providerData);
          setRealProviderId(foundProviderId);
          if (typeof requestIdleCallback !== "undefined") {
            requestIdleCallback(() => {
              loadReviews(foundProviderId, providerData.uid);
            });
          } else {
            await loadReviews(foundProviderId, providerData.uid);
          }
        } else {
          setNotFound(true);
        }
      } catch (e) {
        console.error("Error loading provider data:", e);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadProviderData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    id,
    typeParam,
    countryParam,
    langParam,
    // Removed location.state and location.pathname to prevent infinite loops
    // The component re-mounts when route changes, so these aren't needed
    preferredLangKey,
    // Removed loadReviews as it's stable
    params.slug,
    params.profileId,
    params.name,
  ]);

  // Realtime online status
  useEffect(() => {
    if (!realProviderId) return;
    setOnlineStatus((s) => ({
      ...s,
      listenerActive: true,
      connectionAttempts: s.connectionAttempts + 1,
    }));
    const unsub = onSnapshot(
      doc(db, "sos_profiles", realProviderId),
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() || {};
          const newIsOnline = !!data.isOnline;
          setOnlineStatus((prev) => ({
            ...prev,
            isOnline: newIsOnline,
            lastUpdate: new Date(),
            listenerActive: true,
          }));
          setProvider((prev) =>
            prev
              ? { ...prev, isOnline: newIsOnline, updatedAt: new Date() }
              : prev
          );
        }
      },
      (err) => {
        console.error("Realtime listener error:", err);
        setOnlineStatus((s) => ({
          ...s,
          listenerActive: false,
          lastUpdate: new Date(),
        }));
      }
    );
    return () => {
      setOnlineStatus((s) => ({ ...s, listenerActive: false }));
      unsub();
    };
  }, [realProviderId]);

  // Real-time listener for active call sessions
  useEffect(() => {
    if (!realProviderId) return;

    // Query for active call sessions where this provider is involved
    const activeCallStatuses = [
      "pending",
      "provider_connecting",
      "client_connecting",
      "both_connecting",
      "active",
    ];

    const callSessionsQuery = query(
      collection(db, "call_sessions"),
      where("metadata.providerId", "==", realProviderId),
      where("status", "in", activeCallStatuses),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      callSessionsQuery,
      (snapshot) => {
        // Provider is on a call if there's at least one active session
        setIsOnCall(!snapshot.empty);
      },
      (error) => {
        console.error("Error listening to call sessions:", error);
        setIsOnCall(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [realProviderId]); // Removed 'provider' dependency to prevent listener recreation

  // Track if we're normalizing URL to prevent updateSEOMetadata from running during normalization
  const isNormalizingRef = useRef(false);

  // Normalize legacy URLs to simplified format immediately
  useEffect(() => {
    const pathname = location.pathname;
    // Check if URL matches legacy pattern: /{locale}/{type}/{country}/{language}/{nameId}
    const legacyPattern = /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(avocat|expatrie|lawyers|expats)\/([^\/]+)\/([^\/]+)\/(.+)$/i;
    const match = pathname.match(legacyPattern);
    
    if (match) {
      const [, typeSlug, , , nameId] = match;
      // Extract locale if present
      const localeMatch = pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)\//i);
      const locale = localeMatch ? localeMatch[1] : '';
      // Build simplified URL
      const simplifiedPath = locale 
        ? `/${locale}/${typeSlug}/${nameId}`
        : `/${typeSlug}/${nameId}`;
      
      // Redirect to simplified URL immediately
      if (pathname !== simplifiedPath) {
        isNormalizingRef.current = true;
        navigate(simplifiedPath, { replace: true });
        // Reset flag after navigation
        setTimeout(() => {
          isNormalizingRef.current = false;
        }, 100);
      }
    }
  }, [location.pathname, navigate]);

  // Redirect si not found
  useEffect(() => {
    if (!isLoading && !provider && notFound) {
      const tmo = setTimeout(
        () => navigate("/sos-appel"),
        ANIMATION_DURATIONS.LOADING_DELAY
      );
      return () => clearTimeout(tmo);
    }
  }, [isLoading, provider, notFound, navigate]);

  // SEO
  const updateSEOMetadata = useCallback(() => {
    if (!provider || isLoading || seoUpdatedRef.current || isNormalizingRef.current) return;
    
    // Legacy URL pattern - check this first
    const legacyPattern = /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(avocat|expatrie|lawyers|expats)\/([^\/]+)\/([^\/]+)\/(.+)$/i;
    const currentPathname = location.pathname;
    
    // Don't update URL if current path is a legacy format - let normalization handle it
    if (legacyPattern.test(currentPathname)) {
      return; // Skip URL update, let normalization handle it
    }
    
    try {
      const isLawyer = provider.type === "lawyer";
      
      // Extract locale and language from current pathname
      const { locale: currentLocale, lang: currentLang } = parseLocaleFromPath(currentPathname);
      
      // Use translated route slug based on current language
      const routeKey = isLawyer ? "lawyer" : "expat";
      const displayType = currentLang 
        ? getTranslatedRouteSlug(routeKey, currentLang)
        : (isLawyer ? "avocat" : "expatrie");
      
      // Use translated slug if available, otherwise generate from name
      const nameSlug =
        provider.slug ||
        safeNormalize(
          `${provider.firstName || ""}-${provider.lastName || ""}`
        ) ||
        safeNormalize(provider.fullName || "");
      
      // Append ID only if slug doesn't already contain it
      const finalSlug = nameSlug.includes(provider.id) ? nameSlug : `${nameSlug}-${provider.id}`;
      
      // Build SEO URL - simplified structure without country/language segments
      const seoPath = `/${displayType}/${finalSlug}`;
      const seoUrl = currentLocale ? `/${currentLocale}${seoPath}` : seoPath;
      
      // Only update URL if it's different AND we haven't already updated it
      const currentPath = window.location.pathname.replace(/\/$/, '');
      const targetPath = seoUrl.replace(/\/$/, '');
      
      // Don't update if current path is already correct (simplified format)
      if (currentPath === targetPath) {
        lastUrlRef.current = targetPath;
        return;
      }
      
      // Don't update if current path is a legacy format - let normalization handle it
      if (legacyPattern.test(currentPath)) {
        return;
      }
      
      // Check if current path is already in simplified format (even if different slug)
      // Pattern: /{locale}/{type}/{slug} - should have max 3 segments after locale
      const simplifiedPattern = /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(avocat|expatrie|lawyers|expats)\/[^\/]+$/i;
      const isCurrentSimplified = simplifiedPattern.test(currentPath);
      
      // If current path is already simplified, only update if target is also simplified and different
      if (isCurrentSimplified) {
        const isTargetSimplified = simplifiedPattern.test(targetPath);
        if (isTargetSimplified && currentPath !== targetPath && lastUrlRef.current !== targetPath) {
          // Only update if we're moving to a different simplified URL (e.g., slug changed)
          window.history.replaceState(null, "", seoUrl);
          lastUrlRef.current = targetPath;
        }
        return; // Don't update if current is simplified but target would be legacy
      }
      
      // Only update if target is different and we haven't already set it
      // Double-check that we're not generating a legacy URL
      if (currentPath !== targetPath && lastUrlRef.current !== targetPath) {
        const isLegacyTarget = legacyPattern.test(targetPath);
        const isTargetSimplified = simplifiedPattern.test(targetPath);
        // Only update if target is simplified format
        if (!isLegacyTarget && isTargetSimplified) {
          window.history.replaceState(null, "", seoUrl);
          lastUrlRef.current = targetPath;
        }
      }

      const pageTitle = `${provider.fullName} - ${
        isLawyer
          ? detectedLang === "fr"
            ? "Avocat"
            : "Lawyer"
          : detectedLang === "fr"
            ? "Expatrié"
            : "Expat"
      } ${detectedLang === "fr" ? "en" : "in"} ${provider.country} | SOS Expat & Travelers`;
      document.title = pageTitle;

      const updateOrCreateMeta = (property: string, content: string): void => {
        let meta = document.querySelector(
          `meta[property="${property}"]`
        ) as HTMLMetaElement | null;
        if (!meta) {
          meta = document.createElement("meta");
          meta.setAttribute("property", property);
          document.head.appendChild(meta);
        }
        meta.setAttribute("content", content);
      };

      const ogDesc = pickDescription(provider, preferredLangKey).slice(0, 160);
      const ogImage =
        provider.profilePhoto ||
        provider.photoURL ||
        provider.avatar ||
        "/default-avatar.png";

      updateOrCreateMeta("og:title", pageTitle);
      updateOrCreateMeta("og:description", ogDesc);
      updateOrCreateMeta("og:image", ogImage);
      updateOrCreateMeta("og:url", window.location.href);
      updateOrCreateMeta("og:type", "profile");
      updateOrCreateMeta(
        "og:locale",
        detectedLang === "fr" ? "fr_FR" : "en_US"
      );
      
      // Mark SEO as updated to prevent re-running
      seoUpdatedRef.current = true;
    } catch (e) {
      console.error("Error updating SEO metadata:", e);
    }
  }, [provider, isLoading, preferredLangKey, detectedLang, location.pathname]);

  useEffect(() => {
    if (provider && !isLoading) {
      updateSEOMetadata();
    }
  }, [provider, isLoading, updateSEOMetadata]);

  // Actions
  const handleBookCall = useCallback(() => {
    if (!provider) return;
    const gtag = (window as Window & { gtag?: (...args: unknown[]) => void })
      .gtag;
    if (typeof window !== "undefined" && typeof gtag === "function") {
      gtag("event", "book_call_click", {
        provider_id: provider.id,
        provider_uid: provider.uid,
        provider_type: provider.type,
        provider_country: provider.country,
        is_online: onlineStatus.isOnline,
      });
    }
    const authUserId = getAuthUserId(user);
    if (authUserId) {
      logAnalyticsEvent({
        eventType: "book_call_click",
        userId: authUserId,
        eventData: {
          providerId: provider.id,
          providerUid: provider.uid,
          providerType: provider.type,
          providerName: provider.fullName,
          providerOnlineStatus: onlineStatus.isOnline,
        },
      });
    }
    try {
      sessionStorage.setItem(
        STORAGE_KEYS.SELECTED_PROVIDER,
        JSON.stringify(provider)
      );
    } catch (error) {
      console.warn("Failed to save provider to sessionStorage:", error);
    }
    const target = `/booking-request/${provider.id}`;
    if (user) {
      navigate(target, {
        state: {
          selectedProvider: provider,
          navigationSource: "provider_profile",
        },
      });
    } else {
      navigate(`/login?redirect=${encodeURIComponent(target)}`, {
        state: {
          selectedProvider: provider,
          navigationSource: "provider_profile",
        },
      });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [provider, user, navigate, onlineStatus.isOnline]);

  const shareProfile = useCallback(
    (platform: "facebook" | "twitter" | "linkedin" | "copy") => {
      if (!provider) return;
      const isLawyer = provider.type === "lawyer";
      // Extract locale and language from current pathname to preserve it
      const { locale: currentLocale, lang: currentLang } = parseLocaleFromPath(location.pathname);
      
      // Use translated route slug based on current language
      const routeKey = isLawyer ? "lawyer" : "expat";
      const displayType = currentLang 
        ? getTranslatedRouteSlug(routeKey, currentLang)
        : (isLawyer ? "avocat" : "expatrie");
      
      // Use translated slug if available
      const nameSlug =
        provider.slug ||
        safeNormalize(`${provider.firstName}-${provider.lastName}`);
      const finalSlug = nameSlug.includes(provider.id) ? nameSlug : `${nameSlug}-${provider.id}`;
      
      const seoPath = `/${displayType}/${finalSlug}`;
      const fullSeoPath = currentLocale ? `/${currentLocale}${seoPath}` : seoPath;
      const currentUrl = `${window.location.origin}${fullSeoPath}`;
      const title = `${provider.fullName} - ${
        isLawyer
          ? detectedLang === "fr"
            ? "Avocat"
            : "Lawyer"
          : detectedLang === "fr"
            ? "Expatrié"
            : "Expat"
      } ${detectedLang === "fr" ? "en" : "in"} ${provider.country}`;

      switch (platform) {
        case "facebook":
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
            "_blank",
            "noopener,noreferrer"
          );
          break;
        case "twitter":
          window.open(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`,
            "_blank",
            "noopener,noreferrer"
          );
          break;
        case "linkedin":
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
            "_blank",
            "noopener,noreferrer"
          );
          break;
        case "copy":
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(currentUrl);
            alert(t("linkCopied"));
          } else {
            const textArea = document.createElement("textarea");
            textArea.value = currentUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            alert(t("linkCopied"));
          }
          break;
      }
    },
    [provider, detectedLang, t, location.pathname]
  );

  const handleHelpfulClick = useCallback(
    async (reviewId: string) => {
      if (!user) {
        navigate("/login");
        return;
      }
      try {
        await incrementReviewHelpfulCount(reviewId);
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? { ...r, helpfulVotes: (r.helpfulVotes || 0) + 1 }
              : r
          )
        );
      } catch (e) {
        console.error("Error marking review helpful:", e);
      }
    },
    [user, navigate]
  );

  const handleReportClick = useCallback(
    async (reviewId: string) => {
      if (!user) {
        navigate("/login");
        return;
      }
      const reason = window.prompt(t("reportReason"));
      if (reason) {
        try {
          await reportReview(reviewId, reason);
          alert(t("reportThanks"));
        } catch (e) {
          console.error("Error reporting review:", e);
        }
      }
    },
    [user, navigate, t]
  );

  const renderStars = useCallback((rating?: number) => {
    const safe =
      typeof rating === "number" && !Number.isNaN(rating) ? rating : 0;
    const full = Math.floor(safe);
    const hasHalf = safe - full >= 0.5;
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={20}
        className={
          i < full
            ? "text-yellow-400 fill-yellow-400"
            : i === full && hasHalf
              ? "text-yellow-400"
              : "text-gray-300"
        }
      />
    ));
  }, []);

  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.target as HTMLImageElement;
      img.onerror = null;
      img.src = "/default-avatar.png";
    },
    []
  );

  // Computed
  const isLawyer = provider?.type === "lawyer";
  const isExpat = provider?.type === "expat";
  const languagesList = useMemo<string[]>(
    () => (provider?.languages?.length ? provider.languages : ["Français"]),
    [provider?.languages]
  );
  const mainPhoto: string =
    provider?.profilePhoto ||
    provider?.photoURL ||
    provider?.avatar ||
    "/default-avatar.png";
  const descriptionText = useMemo(() => {
    if (!provider) return "";
    // ALWAYS show original from sos_profiles when showOriginal is true
    if (showOriginal) {
      return pickDescription(provider, preferredLangKey);
    }
    // Only use translation if user explicitly selected a language and showOriginal is false
    if (translation && !showOriginal && viewingLanguage) {
      // Check translation fields in priority order:
      // 1. description (what's saved in Dashboard)
      // 2. bio (fallback for older translations)
      // 3. summary (motivation field, also saved in Dashboard)
      const trans = translation as any;
      if (trans.description) {
        return typeof trans.description === 'string' ? trans.description : String(trans.description);
      }
      if (trans.bio) {
        return typeof trans.bio === 'string' ? trans.bio : String(trans.bio);
      }
      if (trans.summary) {
        return typeof trans.summary === 'string' ? trans.summary : String(trans.summary);
      }
    }
    // Fallback to provider's description (original)
    return pickDescription(provider, preferredLangKey);
  }, [provider, preferredLangKey, translation, showOriginal, viewingLanguage]);
  const educationText = useMemo(() => {
    if (!provider || !isLawyer) return undefined;
    return (
      toStringFromAny(provider.lawSchool, preferredLangKey) ||
      toStringFromAny(provider.education, preferredLangKey)
    );
  }, [provider, isLawyer, preferredLangKey]);
  const certificationsArray = useMemo(() => {
    if (!provider || !isLawyer) return [];
    const s = toStringFromAny(provider.certifications, preferredLangKey);
    if (!s) return [];
    return s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }, [provider, isLawyer, preferredLangKey]);
  const derivedSpecialties = useMemo(() => {
    if (!provider) return [];
    
    // Determine which locale to use for translation
    const localeForTranslation = detectedLang === "fr" ? "fr" : "en";
    
    // ALWAYS show original from sos_profiles when showOriginal is true
    if (showOriginal) {
      const arr = isLawyer
        ? toArrayFromAny(provider.specialties, preferredLangKey)
        : toArrayFromAny(
            provider.helpTypes || provider.specialties,
            preferredLangKey
          );
      // Translate specialty codes to localized labels
      return arr
        .map((s) => translateSpecialtyCode(s, localeForTranslation, isLawyer))
        .map((s) => s.replace(/\s+/g, " ").trim())
        .filter(Boolean);
    }
    // Only use translation if user explicitly selected a language and showOriginal is false
    if (translation && !showOriginal && viewingLanguage && translation.specialties) {
      return translation.specialties;
    }
    // Fallback to provider's specialties (original) - but still translate the codes
    const arr = isLawyer
      ? toArrayFromAny(provider.specialties, preferredLangKey)
      : toArrayFromAny(
          provider.helpTypes || provider.specialties,
          preferredLangKey
        );
    // Translate specialty codes to localized labels
    return arr
      .map((s) => translateSpecialtyCode(s, localeForTranslation, isLawyer))
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }, [provider, isLawyer, preferredLangKey, translation, showOriginal, viewingLanguage, detectedLang]);
  const joinDateText = useMemo(() => {
    if (!provider) return undefined;
    const formatted = formatJoinDate(
      provider.createdAt || provider.updatedAt || null,
      detectedLang
    );
    if (!formatted) return undefined;
    // return detectedLang === "fr"
    //   ? `${t("memberSince")} ${formatted}`
    //   : `${t("memberSince")} ${formatted}`;
    return detectedLang === "fr"
      ? `${intl.formatMessage({ id: "providerProfile.memberSince" })} ${formatted}`
      : `${intl.formatMessage({ id: "providerProfile.memberSince" })} ${formatted}`;
  }, [provider, detectedLang, t]);

  const structuredData = useMemo<Record<string, unknown> | undefined>(() => {
    if (!provider) return undefined;
    const data: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": isLawyer ? "Attorney" : "Person",
      "@id": `${window.location.origin}${window.location.pathname}`,
      name: provider.fullName,
      image: {
        "@type": "ImageObject",
        url: mainPhoto,
        width: IMAGE_SIZES.MODAL_MAX_WIDTH,
        height: IMAGE_SIZES.MODAL_MAX_HEIGHT,
      },
      description: descriptionText,
      address: { "@type": "PostalAddress", addressCountry: provider.country },
      jobTitle: isLawyer
        ? detectedLang === "fr"
          ? "Avocat"
          : "Attorney"
        : detectedLang === "fr"
          ? "Consultant expatrié"
          : "Expat consultant",
      worksFor: {
        "@type": "Organization",
        name: "SOS Expat & Travelers",
        url: window.location.origin,
      },
      knowsLanguage: languagesList.map((lang) => ({
        "@type": "Language",
        name: lang,
      })),
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: provider.rating || 0,
        reviewCount: provider.reviewCount || reviews.length || 0,
        bestRating: 5,
        worstRating: 1,
      },
    };
    return data;
  }, [
    provider,
    isLawyer,
    mainPhoto,
    descriptionText,
    detectedLang,
    languagesList,
    reviews.length,
  ]);

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        {user && provider && getAuthUserId(user) === provider.uid && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <h3 className="text-sm font-semibold mb-2">
                Visibilité sur la carte
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Activez/désactivez votre présence sur la carte. (Visible
                uniquement par vous)
              </p>
            </div>
          </div>
        )}
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <LoadingSpinner size="large" color="red" text={t("loading")} />
        </div>
      </Layout>
    );
  }

  // Not found
  if (notFound || !provider) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="p-8 text-center text-red-600 text-lg">
            {t("notFound")}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title={
          translation && !showOriginal && translation.seo?.metaTitle
            ? translation.seo.metaTitle
            : `${provider.fullName} - ${isLawyer ? (detectedLang === "fr" ? "Avocat" : "Lawyer") : detectedLang === "fr" ? "Expatrié" : "Expat"} ${detectedLang === "fr" ? "en" : "in"} ${provider.country} | SOS Expat & Travelers`
        }
        description={
          translation && !showOriginal && translation.seo?.metaDescription
            ? translation.seo.metaDescription
            : `${detectedLang === "fr" ? "Consultez" : "Consult"} ${provider.fullName}, ${isLawyer ? (detectedLang === "fr" ? "avocat" : "lawyer") : detectedLang === "fr" ? "expatrié" : "expat"} ${detectedLang === "fr" ? "francophone" : "French-speaking"} ${detectedLang === "fr" ? "en" : "in"} ${provider.country}. ${descriptionText.slice(0, 120)}...`
        }
        canonicalUrl={
          (() => {
            // Use translated route slug based on current language
            const routeKey = isLawyer ? "lawyer" : "expat";
            const displayType = currentLang 
              ? getTranslatedRouteSlug(routeKey, currentLang)
              : (isLawyer ? "avocat" : "expatrie");
            
            // Use translated slug if available, otherwise generate from name
            const nameSlug = translation && !showOriginal && translation.slug
              ? translation.slug
              : (provider.slug || safeNormalize(provider.fullName || `${provider.firstName}-${provider.lastName}`));
            
            const finalSlug = nameSlug.includes(provider.id) ? nameSlug : `${nameSlug}-${provider.id}`;
            return `/${currentLocale || ''}/${displayType}/${finalSlug}`;
          })()
        }
        ogImage={mainPhoto}
        ogType="profile"
        structuredData={
          translation && !showOriginal && translation.seo?.jsonLd
            ? translation.seo.jsonLd
            : structuredData
        }
      />

      {/* SVG defs */}
      <svg width="0" height="0" className="hidden" aria-hidden="true">
        <defs>
          <linearGradient id="half-star" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="50%" stopColor="#FACC15" />
            <stop offset="50%" stopColor="#D1D5DB" />
          </linearGradient>
        </defs>
      </svg>

      <div className="min-h-screen bg-gray-950">
        {/* ======= HERO ======= */}
        <header className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900 to-black" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-blue-500/10" />
          <div className="absolute top-1/4 left-1/3 w-[26rem] h-[26rem] bg-gradient-to-r from-red-500/15 to-orange-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/3 w-[26rem] h-[26rem] bg-gradient-to-r from-blue-500/15 to-purple-500/15 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <nav className="mb-6">
              <button
                onClick={() => navigate("/sos-appel")}
                className="inline-flex items-center rounded-full bg-white/10 border border-white/20 text-white/90 hover:text-white hover:bg-white/15 backdrop-blur px-4 py-2 transition-colors min-h-[44px]"
                aria-label={t("backToExperts")}
              >
                <span aria-hidden="true">←</span>
                <span className="ml-2">
                  {/* {t("backToExperts")} */}
                  <FormattedMessage id="providerProfile.backToExperts" />
                </span>
              </button>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="lg:col-span-2">
                <div className="flex items-start space-x-4 sm:space-x-6">
                  {/* Photo */}
                  <div className="relative flex-shrink-0">
                    <div className="p-[3px] rounded-full bg-gradient-to-br from-red-400 via-orange-400 to-yellow-300">
                      <img
                        src={mainPhoto}
                        alt={`${t("photoOf")} ${provider.fullName}`}
                        className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-black/20 cursor-pointer"
                        width={IMAGE_SIZES.AVATAR_MOBILE}
                        height={IMAGE_SIZES.AVATAR_MOBILE}
                        style={{ aspectRatio: "1" }}
                        onClick={() => setShowImageModal(true)}
                        onError={handleImageError}
                        loading="eager"
                        fetchPriority="high"
                      />
                    </div>
                    {/* Online status */}
                    <div
                      className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-black/50 transition-all duration-500 ${onlineStatus.isOnline ? "bg-green-500" : "bg-red-500"}`}
                      aria-hidden="true"
                      title={onlineStatus.isOnline ? t("online") : t("offline")}
                    >
                      {onlineStatus.isOnline && (
                        <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                        {translation && !showOriginal && translation.title
                          ? translation.title
                          : translation && !showOriginal && translation.seo?.h1
                          ? translation.seo.h1
                          : provider.fullName}
                      </h1>

                      <span
                        className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border backdrop-blur ${
                          isLawyer
                            ? "bg-white/10 border-white/20 text-blue-100"
                            : "bg-white/10 border-white/20 text-green-100"
                        }`}
                      >
                        {isLawyer ? (
                          // t("certifiedLawyer")
                          <FormattedMessage id="providerProfile.certifiedLawyer" />
                        ) : (
                          // t("expertExpat")}
                          <FormattedMessage id="providerProfile.expertExpat" />
                        )}
                      </span>

                      {provider.isVerified && (
                        <span className="inline-flex items-center gap-1 bg-white text-gray-900 text-[10px] sm:text-xs px-2 py-1 rounded-full border border-gray-200">
                          <Shield size={12} className="text-green-600" />
                          <span>
                            {/* {t("verified")} */}
                            <FormattedMessage id="providerProfile.verified" />
                          </span>
                        </span>
                      )}

                      <span
                        className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold transition-all duration-500 border ${
                          onlineStatus.isOnline
                            ? "bg-green-500 text-white border-green-300 shadow-lg shadow-green-500/30"
                            : "bg-red-500 text-white border-red-300"
                        }`}
                      >
                        {/* {onlineStatus.isOnline
                          ? "🟢 " + t("online")
                          : "🔴 " + t("offline")} */}

                        {onlineStatus.isOnline
                          ? `🟢 ${intl.formatMessage({ id: "providerProfile.online" })}`
                          : `🔴 ${intl.formatMessage({ id: "providerProfile.offline" })}`}

                        {/* {onlineStatus.isOnline
                          ? "🟢 " +
                            <FormattedMessage id="providerProfile.online" />
                          : "🔴 " +
                          <FormattedMessage id="providerProfile.offline" />
                        } */}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-300 mb-4 text-sm sm:text-base">
                      <div className="inline-flex items-center gap-1">
                        <MapPin size={16} className="flex-shrink-0" />
                        <span>{provider.country}</span>
                      </div>
                      <div className="inline-flex items-center gap-1">
                        {isLawyer ? (
                          <Briefcase size={16} className="flex-shrink-0" />
                        ) : (
                          <Users size={16} className="flex-shrink-0" />
                        )}
                        <span>
                          {isLawyer
                            ? `${provider.yearsOfExperience || 0} ${intl.formatMessage({ id: "providerProfile.yearsExperience" })}`
                            : `${provider.yearsAsExpat || provider.yearsOfExperience || 0} ${intl.formatMessage({ id: "providerProfile.yearsAsExpat" })}`}
                        </span>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="inline-flex items-center gap-2 mb-4 rounded-full bg-white/10 border border-white/20 backdrop-blur px-3 py-1.5">
                      <div
                        className="flex"
                        aria-label={`Rating: ${provider.rating || 0} out of 5 stars`}
                      >
                        {renderStars(provider.rating)}
                      </div>
                      <span className="text-white font-semibold">
                        {typeof provider.rating === "number"
                          ? provider.rating.toFixed(1)
                          : "--"}
                      </span>
                      <span className="text-gray-300">
                        ({provider.reviewCount || reviews.length || 0}{" "}
                        {/* {t("reviews")} */}
                        <FormattedMessage id="providerProfile.reviews" />)
                      </span>
                    </div>

                    {/* Description */}
                    <div className="text-gray-200 leading-relaxed">
                      <p className="mb-2 whitespace-pre-line">
                        {descriptionText}
                      </p>
                      {(isLawyer || isExpat) && (() => {
                        // ALWAYS show original from sos_profiles when showOriginal is true
                        let motivationText: string | null = null;
                        if (showOriginal) {
                          motivationText = getFirstString(provider.motivation, preferredLangKey);
                        } else if (translation && viewingLanguage) {
                          // Only use translation if user explicitly selected a language
                          // Check both 'summary' (what Dashboard saves) and 'motivation' (what backend generates)
                          const trans = translation as any;
                          if (trans.summary) {
                            motivationText = typeof trans.summary === 'string' ? trans.summary : String(trans.summary);
                          } else if (trans.motivation) {
                            motivationText = typeof trans.motivation === 'string' ? trans.motivation : String(trans.motivation);
                          }
                        } else {
                          // Fallback to original
                          motivationText = getFirstString(provider.motivation, preferredLangKey);
                        }
                        return motivationText && (
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-gray-200 whitespace-pre-line">
                              {motivationText}
                            </p>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Social sharing */}
                    <div className="flex items-center space-x-3 mt-6">
                      <span className="text-gray-300">
                        {/* {t("share")} */}
                        <FormattedMessage id="providerProfile.share" />
                      </span>
                      <button
                        onClick={() => shareProfile("facebook")}
                        className="text-white/90 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20"
                        aria-label="Share on Facebook"
                        title="Facebook"
                      >
                        <Facebook size={20} />
                      </button>
                      <button
                        onClick={() => shareProfile("twitter")}
                        className="text-white/90 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20"
                        aria-label="Share on X"
                        title="X / Twitter"
                      >
                        <Twitter size={20} />
                      </button>
                      <button
                        onClick={() => shareProfile("linkedin")}
                        className="text-white/90 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20"
                        aria-label="Share on LinkedIn"
                        title="LinkedIn"
                      >
                        <Linkedin size={20} />
                      </button>
                      <button
                        onClick={() => shareProfile("copy")}
                        className="text-white/90 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20"
                        aria-label={t("copyLink")}
                        title={t("copyLink")}
                      >
                        <Share2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ Booking card - Prix uniquement depuis Admin (EUR principal + équivalent USD) */}
              <aside className="lg:col-span-1">
                <div className="group relative bg-white rounded-3xl shadow-2xl p-6 border border-gray-200 transition-all hover:scale-[1.01]">
                  <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-red-500/5 to-orange-500/5 group-hover:from-red-500/10 group-hover:to-orange-500/10 transition-opacity" />
                  <div className="relative z-10">
                    {/* Badge délai d'appel */}
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-full px-3 py-1 text-xs font-semibold">
                        <Phone size={14} />
                        {/* <span>Appel en ~5 min</span> */}
                        <span>
                          <FormattedMessage id="callIn5Min" />
                        </span>
                      </div>

                      {/* ✅ Prix uniquement depuis admin_config/pricing */}
                      <div className="mt-4 text-3xl sm:text-4xl font-black text-gray-900">
                        {bookingPrice ? (
                          <>
                            <span className="bg-clip-text">
                              {formatEUR(bookingPrice.eur)}
                            </span>{" "}
                            <span className="text-gray-600">
                              ({formatUSD(bookingPrice.usd)})
                            </span>
                          </>
                        ) : (
                          "—"
                        )}

                        {/* Price section in booking card */}
                        {/* <div className="mt-4 text-center">
                          {bookingPrice?.hasDiscount ? (
                            <div>
                              <div className="text-gray-500 line-through text-lg">
                                {formatEUR(bookingPrice.originalEur)}
                              </div>
                              <div className="text-3xl sm:text-4xl font-black text-red-600">
                                {formatEUR(bookingPrice.eur)}
                              </div>
                              <div className="text-xs text-green-600 font-semibold mt-1">
                                Code {bookingPrice.promoCode} appliqué (-
                                {formatEUR(bookingPrice.discountEur)})
                              </div>
                              <div className="text-gray-600 text-sm mt-1">
                                {formatUSD(bookingPrice.usd)}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-3xl sm:text-4xl font-black text-gray-900">
                                {bookingPrice
                                  ? formatEUR(bookingPrice.eur)
                                  : "—"}
                              </div>
                              <div className="text-gray-600">
                                {bookingPrice
                                  ? formatUSD(bookingPrice.usd)
                                  : "—"}
                              </div>
                            </div>
                          )}
                          <div className="text-gray-600">
                            {bookingPrice?.duration
                              ? `${bookingPrice.duration} ${t("minutes")}`
                              : "—"}
                          </div>
                        </div> */}
                      </div>

                      <div className="text-gray-600">
                        {bookingPrice?.duration
                          ? // ? `${bookingPrice.duration} ${t("minutes")}`
                            `${bookingPrice.duration} ${intl.formatMessage({ id: "providerProfile.minutes" })}`
                          : "—"}
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {/* {t("successRate")} */}
                          <FormattedMessage id="providerProfile.successRate" />
                        </span>
                        <span className="font-semibold text-gray-900">
                          {typeof provider.successRate === "number"
                            ? `${provider.successRate}%`
                            : "--"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <span className="text-gray-700 font-medium">
                          {/* {t("availability")} */}
                          <FormattedMessage id="providerProfile.availability" />
                        </span>
                        <span
                          className={`font-bold text-sm px-3 py-1 rounded-full transition-all duration-500 ${
                            isOnCall
                              ? "bg-orange-100 text-orange-800 border border-orange-300"
                              : onlineStatus.isOnline
                                ? "bg-green-100 text-green-800 border border-green-300"
                                : "bg-red-100 text-red-800 border border-red-300"
                          }`}
                        >
                          {isOnCall
                            ? `📞 ${intl.formatMessage({ id: "providerProfile.alreadyOnCall" })}`
                            : onlineStatus.isOnline
                              ? `🟢 ${intl.formatMessage({ id: "providerProfile.online" })}`
                              : `🔴 ${intl.formatMessage({ id: "providerProfile.offline" })}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {/* {t("completedCalls")} */}
                          <FormattedMessage id="providerProfile.completedCalls" />
                        </span>
                        <span className="font-semibold">
                          {typeof provider.totalCalls === "number"
                            ? provider.totalCalls
                            : "--"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleBookCall}
                      className={`w-full py-4 px-4 rounded-2xl font-bold text-lg transition-all duration-500 flex items-center justify-center gap-3 min-h-[56px] focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        onlineStatus.isOnline && !isOnCall
                          ? "bg-gradient-to-r from-green-600 to-green-500 text-white hover:scale-105 shadow-lg ring-green-600/30"
                          : "bg-gray-200 text-gray-500 cursor-not-allowed"
                      }`}
                      disabled={!onlineStatus.isOnline || isOnCall}
                      aria-label={
                        isOnCall
                          ? intl.formatMessage({ id: "providerProfile.alreadyOnCall" })
                          : onlineStatus.isOnline
                            ? intl.formatMessage({ id: "providerProfile.bookNow" })
                            : intl.formatMessage({ id: "providerProfile.unavailable" })
                      }
                    >
                      <Phone size={24} aria-hidden="true" />
                      <span className="flex-1">
                        {isOnCall
                          ? intl.formatMessage({ id: "providerProfile.alreadyOnCall" })
                          : onlineStatus.isOnline
                            ? intl.formatMessage({ id: "providerProfile.bookNow" })
                            : intl.formatMessage({ id: "providerProfile.unavailable" })}
                      </span>
                      {onlineStatus.isOnline && !isOnCall && (
                        <div className="flex gap-1 w-12" aria-hidden="true">
                          <div className="w-2 h-2 rounded-full animate-pulse bg-white/80"></div>
                          <div className="w-2 h-2 rounded-full animate-pulse delay-75 bg-white/80"></div>
                          <div className="w-2 h-2 rounded-full animate-pulse delay-150 bg-white/80"></div>
                        </div>
                      )}
                    </button>

                    <div className="mt-4 text-center text-sm min-h-[32px] flex items-center justify-center">
                      {isOnCall ? (
                        <div className="text-orange-600 font-medium">
                          📞 <FormattedMessage id="providerProfile.onCallMessage" />
                        </div>
                      ) : onlineStatus.isOnline ? (
                        <div className="text-green-600 font-medium">
                          ✅ <FormattedMessage id="providerProfile.availableNow" />
                        </div>
                      ) : (
                        <div className="text-red-600">
                          ❌ <FormattedMessage id="providerProfile.currentlyOffline" />
                        </div>
                      )}
                    </div>

                    <div className="mt-4 text-center">
                      <div className="inline-flex items-center justify-center gap-2 text-sm text-gray-600 rounded-2xl border border-gray-200 px-4 py-2">
                        <Shield size={16} aria-hidden="true" />
                        {/* <span>{t("securePayment")}</span> */}
                        <span>
                          <FormattedMessage id="providerProfile.securePayment" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </header>

        {/* ======= MAIN ======= */}
        <main className="relative bg-gradient-to-b from-white via-rose-50/50 to-white rounded-t-[28px] -mt-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Main */}
              <div className="lg:col-span-2 space-y-6 lg:space-y-8">
                {/* Translation Banner */}
                {realProviderId && !isLoading && (
                  <TranslationBanner
                    providerId={realProviderId}
                    currentLanguage={targetLanguage}
                    availableLanguages={availableLanguages}
                    onTranslationComplete={async (lang, trans) => {
                      console.log('[ProviderProfile] Translation complete for language:', lang);
                      // Switch to viewing the translated language
                      setViewingLanguage(lang);
                      viewingLanguageRef.current = lang; // Update ref immediately
                      setShowOriginal(false); // Switch to translated view after translation completes
                      
                      // Reload translation state for the language we just translated
                      if (reloadForLanguage) {
                        setTimeout(async () => {
                          try {
                            await reloadForLanguage(lang);
                            // Force state to remain after reload - prevent reverting to original
                            // Use ref to ensure we maintain the correct language
                            const currentLang = viewingLanguageRef.current || lang;
                            setViewingLanguage(currentLang);
                            viewingLanguageRef.current = currentLang;
                            setShowOriginal(false);
                            console.log('[ProviderProfile] State preserved after reload for:', currentLang);
                          } catch (error) {
                            console.error('[ProviderProfile] Error reloading translation:', error);
                            // Even on error, maintain the viewing state
                            setViewingLanguage(lang);
                            viewingLanguageRef.current = lang;
                            setShowOriginal(false);
                          }
                        }, 1000); // Wait for Firestore to update
                      }
                    }}
                    onViewTranslation={(lang) => {
                      // Handle viewing an already-translated language
                      console.log('[ProviderProfile] Viewing translation for language:', lang);
                      setViewingLanguage(lang);
                      viewingLanguageRef.current = lang; // Update ref immediately
                      setShowOriginal(false);
                      
                      if (reloadForLanguage) {
                        reloadForLanguage(lang).then(() => {
                          // Force state to remain after reload - prevent reverting to original
                          // Use ref to ensure we maintain the correct language
                          const currentLang = viewingLanguageRef.current || lang;
                          setViewingLanguage(currentLang);
                          viewingLanguageRef.current = currentLang;
                          setShowOriginal(false);
                          console.log('[ProviderProfile] State preserved after reload for:', currentLang);
                        }).catch((error) => {
                          console.error('[ProviderProfile] Error reloading translation:', error);
                          // Even on error, maintain the viewing state
                          setViewingLanguage(lang);
                          viewingLanguageRef.current = lang;
                          setShowOriginal(false);
                        });
                      }
                    }}
                    onTranslate={async (lang) => {
                      const result = await translate(lang);  // Pass the language parameter
                      return result;
                    }}
                  />
                )}
                
                {/* View Original Button - Show if translation exists */}
                {translation && originalTranslation && (
                  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm p-4 border border-gray-200 dark:border-gray-700 mb-6">
                    <button
                      onClick={() => {
                        setShowOriginal(!showOriginal);
                        // If switching to original, reset viewing language
                        if (!showOriginal) {
                          setViewingLanguage(null);
                        }
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-sm font-medium transition-colors flex items-center gap-2 border-2 border-gray-300 text-gray-500"
                    >
                      {showOriginal ? (
                        <>
                          <FormattedMessage
                            id="providerTranslation.viewTranslated"
                            defaultMessage={`View translated `}
                          />
                        </>
                      ) : (
                        <>
                          <FormattedMessage
                            id="providerTranslation.viewOriginal"
                            defaultMessage={`View original`}
                          />
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {/* Specialties */}
                <section className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200">
                  <h2 className="text-xl font-extrabold text-gray-900 mb-4">
                    {/* {t("specialties")} */}
                    <FormattedMessage id="providerProfile.specialties" />
                  </h2>
                  {derivedSpecialties.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {derivedSpecialties.map((s, i) => (
                        <span
                          key={`${s}-${i}`}
                          className={`px-3 py-2 rounded-full text-sm font-semibold border ${isLawyer ? "bg-blue-50 text-blue-800 border-blue-200" : "bg-green-50 text-green-800 border-green-200"}`}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    // <div className="text-gray-500">{t("noSpecialties")}</div>
                    <div className="text-gray-500">
                      <FormattedMessage id="providerProfile.noSpecialties" />
                    </div>
                  )}
                </section>

                {/* Languages */}
                <section className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200">
                  <h2 className="text-xl font-extrabold text-gray-900 mb-4">
                    {/* {t("languages")} */}
                    <FormattedMessage id="providerProfile.languages" />
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {languagesList.map((l, i) => (
                      <span
                        key={`${l}-${i}`}
                        className="px-3 py-2 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-sm font-semibold inline-flex items-center"
                      >
                        <Globe size={14} className="mr-1" aria-hidden="true" />
                        {formatLanguages([l], detectedLang)}
                      </span>
                    ))}
                  </div>
                </section>

                {/* Education & Certifications */}
                {isLawyer &&
                  (educationText || certificationsArray.length > 0) && (
                    <section className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200">
                      <h2 className="text-xl font-extrabold text-gray-900 mb-4">
                        {/* {t("educationCertifications")} */}
                        <FormattedMessage id="providerProfile.educationCertifications" />
                      </h2>
                      <div className="space-y-3">
                        {educationText && (
                          <div className="flex items-start gap-2">
                            <GraduationCap
                              size={18}
                              className="text-blue-600 mt-0.5 flex-shrink-0"
                              aria-hidden="true"
                            />
                            <p className="text-gray-700">
                              {educationText}
                              {provider.graduationYear
                                ? ` (${provider.graduationYear})`
                                : ""}
                            </p>
                          </div>
                        )}
                        {certificationsArray.length > 0 &&
                          certificationsArray.map((cert, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Award
                                size={16}
                                className="text-yellow-500 mt-0.5 flex-shrink-0"
                                aria-hidden="true"
                              />
                              <p className="text-gray-700">{cert}</p>
                            </div>
                          ))}
                      </div>
                    </section>
                  )}

                {/* Expat experience */}
                {isExpat && (
                  <section className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200">
                    <h2 className="text-xl font-extrabold text-gray-900 mb-4">
                      {/* {t("expatExperience")} */}
                      <FormattedMessage id="providerProfile.expatExperience" />
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Users
                          size={18}
                          className="text-green-600 flex-shrink-0"
                          aria-hidden="true"
                        />
                        {/* <p className="text-gray-700">
                          {provider.yearsAsExpat ||
                            provider.yearsOfExperience ||
                            0}{" "}
                          {t("yearsAbroad")} {t("in")} {provider.country}
                        </p> */}
                        <p className="text-gray-700">
                          {provider.yearsAsExpat ||
                            provider.yearsOfExperience ||
                            0}{" "}
                          {intl.formatMessage({ id: "providerProfile.years" })}{" "}
                          {intl.formatMessage({ id: "providerProfile.in" })}{" "}
                          {provider.country}
                        </p>
                      </div>

                      {getFirstString(
                        provider.experienceDescription,
                        preferredLangKey
                      ) && (
                        <p className="text-gray-700 whitespace-pre-line">
                          {getFirstString(
                            provider.experienceDescription,
                            preferredLangKey
                          )}
                        </p>
                      )}

                      {(() => {
                        // ALWAYS show original from sos_profiles when showOriginal is true
                        let motivationText: string | null = null;
                        if (showOriginal) {
                          motivationText = getFirstString(provider.motivation, preferredLangKey);
                        } else if (translation && viewingLanguage) {
                          // Only use translation if user explicitly selected a language
                          // Check both 'summary' (what Dashboard saves) and 'motivation' (what backend generates)
                          const trans = translation as any;
                          if (trans.summary) {
                            motivationText = typeof trans.summary === 'string' ? trans.summary : String(trans.summary);
                          } else if (trans.motivation) {
                            motivationText = typeof trans.motivation === 'string' ? trans.motivation : String(trans.motivation);
                          }
                        } else {
                          // Fallback to original
                          motivationText = getFirstString(provider.motivation, preferredLangKey);
                        }
                        return motivationText && (
                          <p className="text-gray-700 whitespace-pre-line">
                            {motivationText}
                          </p>
                        );
                      })()}
                    </div>
                  </section>
                )}

                {/* Reviews */}
                <section
                  className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200"
                  id="reviews-section"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-extrabold text-gray-900">
                      {/* {t("customerReviews")} */}
                      <FormattedMessage id="providerProfile.customerReviews" />(
                      {reviews.length || 0})
                    </h2>
                    <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 p-[1px]">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 border border-yellow-200/70 text-yellow-700 text-sm font-semibold">
                        <Star className="w-4 h-4" />
                        <span>
                          {typeof provider.rating === "number"
                            ? provider.rating.toFixed(1)
                            : "—"}
                          /5
                        </span>
                        <Award className="w-4 h-4" />
                      </span>
                    </span>
                  </div>

                  {isLoadingReviews ? (
                    <div className="text-center py-8">
                      <div
                        className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"
                        aria-hidden="true"
                      ></div>
                      <p className="mt-2 text-gray-500">
                        {/* {t("loadingReviews")} */}
                        <FormattedMessage id="providerProfile.loadingReviews" />
                      </p>
                    </div>
                  ) : (
                    <>
                      <Reviews
                        mode="summary"
                        averageRating={provider.rating || 0}
                        totalReviews={reviews.length}
                        ratingDistribution={ratingDistribution}
                      />
                      <div className="mt-8">
                        <Reviews
                          mode="list"
                          reviews={reviews}
                          showControls={!!user}
                          onHelpfulClick={handleHelpfulClick}
                          onReportClick={handleReportClick}
                        />
                      </div>
                    </>
                  )}
                </section>
              </div>

              {/* Sidebar */}
              <aside className="lg:col-span-1">
                <div className="sticky top-6 space-y-6 z-20 pb-6" style={{ maxHeight: 'calc(100vh - 3rem - 200px)' }}>
                  {/* Stats */}
                  <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200">
                    <h3 className="text-lg font-extrabold text-gray-900 mb-4">
                      {/* {t("stats")} */}
                      <FormattedMessage id="providerProfile.stats" />
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {/* {t("averageRating")} */}
                          <FormattedMessage id="providerProfile.averageRating" />
                        </span>
                        <span className="font-semibold">
                          {typeof provider.rating === "number"
                            ? provider.rating.toFixed(1)
                            : "--"}
                          /5
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {/* {t("reviews")} */}
                          <FormattedMessage id="providerProfile.reviews" />
                        </span>
                        <span className="font-semibold">{reviews.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {/* {t("successRate")} */}
                          <FormattedMessage id="providerProfile.successRate" />
                        </span>
                        <span className="font-semibold">
                          {typeof provider.successRate === "number"
                            ? `${provider.successRate}%`
                            : "--"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {/* {t("experience")} */}
                          <FormattedMessage id="providerProfile.experience" />
                        </span>
                        <span className="font-semibold">
                          {/* {isLawyer
                            ? `${provider.yearsOfExperience || 0} ${t("years")}`
                            : `${provider.yearsAsExpat || provider.yearsOfExperience || 0} ${t("years")}`
                          } */}

                          {isLawyer
                            ? `${provider.yearsOfExperience || 0} ${intl.formatMessage({ id: "years" })}`
                            : `${provider.yearsAsExpat || provider.yearsOfExperience || 0} ${intl.formatMessage({ id: "years" })}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="bg-white rounded-3xl shadow-sm p-6 border border-gray-200">
                    <h3 className="text-lg font-extrabold text-gray-900 mb-4">
                      {/* {t("information")} */}
                      <FormattedMessage id="providerProfile.information" />
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin
                          size={16}
                          className="text-gray-400 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span>
                          {/* {t("basedIn")} */}
                          <FormattedMessage id="providerProfile.basedIn" />
                          {provider.country}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <LanguagesIcon
                          size={16}
                          className="text-gray-400 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <span>
                          {/* {t("speaks")}{" "} */}
                          <FormattedMessage id="providerProfile.speaks" />
                          {formatLanguages(languagesList, detectedLang)}
                        </span>
                      </div>
                      {joinDateText && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">{joinDateText}</span>
                        </div>
                      )}
                      <div
                        className={`flex items-center gap-2 p-3 rounded-xl transition-all duration-500 ${onlineStatus.isOnline ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                      >
                        <div
                          className={`relative w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${onlineStatus.isOnline ? "bg-green-500" : "bg-red-500"}`}
                          aria-hidden="true"
                          title={
                            onlineStatus.isOnline ? t("online") : t("offline")
                          }
                        >
                          {onlineStatus.isOnline && (
                            <div className="w-6 h-6 rounded-full bg-green-500 animate-ping opacity-75 absolute"></div>
                          )}
                          <div className="w-3 h-3 bg-white rounded-full relative z-10"></div>
                        </div>
                        <span
                          className={`font-bold transition-all duration-500 ${onlineStatus.isOnline ? "text-green-700" : "text-red-700"}`}
                        >
                          {
                            onlineStatus.isOnline ? (
                              // t("onlineNow")
                              <FormattedMessage id="providerProfile.onlineNow" />
                            ) : (
                              <FormattedMessage id="providerProfile.offline" />
                            )
                            // t("offline")
                          }
                        </span>
                      </div>
                      {provider.isVerified && (
                        <div className="flex items-center gap-2">
                          <Shield
                            size={16}
                            className="text-gray-400 flex-shrink-0"
                            aria-hidden="true"
                          />
                          <span>
                            {/* {t("verifiedExpert")} */}
                            <FormattedMessage id="providerProfile.verifiedExpert" />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>
      </div>

      {/* Image modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowImageModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="image-modal-title"
        >
          <div className="relative max-w-3xl max-h-[90vh] m-4">
            <h2 id="image-modal-title" className="sr-only">
              {/* {t("photoOf")} */}
              <FormattedMessage id="providerProfile.photoOf" />
              {provider.fullName}
            </h2>
            <img
              src={mainPhoto}
              alt={`${t("photoOf")} ${provider.fullName}`}
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
              style={{
                maxWidth: IMAGE_SIZES.MODAL_MAX_WIDTH,
                maxHeight: IMAGE_SIZES.MODAL_MAX_HEIGHT,
              }}
              onError={handleImageError}
              loading="lazy"
              decoding="async"
            />
            <button
              className="absolute top-4 right-4 bg-white rounded-full p-2 text-gray-800 hover:bg-gray-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-white/50"
              onClick={() => setShowImageModal(false)}
              aria-label={t("close")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProviderProfile;
