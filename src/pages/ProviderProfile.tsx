// src/pages/ProviderProfile.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { parseLocaleFromPath, getLocaleString } from "../utils/localeRoutes";
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
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowLeft,
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

// 👉 Pricing admin (source de vérité)
import { usePricingConfig } from "../services/pricingService";

/// Imports des traductions AAA par langue
import aaaTranslationsFr from '../helper/aaaprofiles/admin_aaa_fr.json';
import aaaTranslationsEn from '../helper/aaaprofiles/admin_aaa_en.json';
import aaaTranslationsEs from '../helper/aaaprofiles/admin_aaa_es.json';
import aaaTranslationsDe from '../helper/aaaprofiles/admin_aaa_de.json';
import aaaTranslationsPt from '../helper/aaaprofiles/admin_aaa_pt.json';
import aaaTranslationsRu from '../helper/aaaprofiles/admin_aaa_ru.json';
import aaaTranslationsZh from '../helper/aaaprofiles/admin_aaa_zh.json';
import aaaTranslationsAr from '../helper/aaaprofiles/admin_aaa_ar.json';
import aaaTranslationsHi from '../helper/aaaprofiles/admin_aaa_hi.json';
import { 
  getCountryName, 
  formatLanguages,
  convertLanguageNamesToCodes
} from "../utils/formatters";

// ✅ NOUVEAU : Import du système de slugs
import { 
  generateSlug, 
  formatPublicName,
  slugify 
} from "../utils/slugGenerator";
import { useSnippetGenerator } from '../hooks/useSnippetGenerator';

// Mapping des traductions par langue
const aaaTranslationsMap: Record<string, any> = {
  fr: aaaTranslationsFr,
  en: aaaTranslationsEn,
  es: aaaTranslationsEs,
  de: aaaTranslationsDe,
  pt: aaaTranslationsPt,
  ru: aaaTranslationsRu,
  zh: aaaTranslationsZh,
  ar: aaaTranslationsAr,
  hi: aaaTranslationsHi,
};

import { FormattedMessage, useIntl } from "react-intl";
import { getLawyerSpecialityLabel } from "../data/lawyer-specialties";
import { getExpatHelpTypeLabel } from "../data/expat-help-types";

/* ===================================================================== */

const IMAGE_SIZES = {
  AVATAR_MOBILE: 80,
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

// ✅ NOUVEAU : Seuil pour définir un appel réussi (en secondes)
const SUCCESSFUL_CALL_THRESHOLD_SECONDS = 120; // 2 minutes

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

// ✅ AuthUser ad hoc (n'hérite pas)
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
  residenceCountry?: string;
  operatingCountries?: string[];
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

// ✅ NOUVEAU : Interface pour les statistiques calculées
interface ProviderStats {
  totalCallsReceived: number;
  successfulCalls: number;
  successRate: number;
  averageRating: number;
  totalReviews: number;
  completedCalls: number;
  realReviewsCount: number;
}

interface RouteParams extends Record<string, string | undefined> {
  id?: string;
  country?: string;
  language?: string;
  type?: string;
  slug?: string;
  profileId?: string;
  name?: string;
  nameSlug?: string;
  typeCountry?: string;
  locale?: string;
  localeRegion?: string;
  lang?: string;
  nameSlugWithUid?: string;
}

// Utils
const detectLanguage = (): "fr" | "en" =>
  typeof navigator !== "undefined" && navigator.language
    ? navigator.language.toLowerCase().startsWith("fr")
      ? "fr"
      : "en"
    : "en";

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
  preferredLang?: string,
  intl?: any
): string => {
  const chain = [
    getFirstString(p.description, preferredLang),
    getFirstString(p.bio, preferredLang),
    getFirstString(p.professionalDescription, preferredLang),
    getFirstString(p.experienceDescription, preferredLang),
  ];
  return (
    chain.find(Boolean) ||
    (intl ? intl.formatMessage({ id: "providerProfile.noDescriptionAvailable" }) : "")
  );
};

const toStringFromAny = (
  val: unknown,
  preferred?: string
): string | undefined => getFirstString(val, preferred);

const isFsTimestamp = (v: unknown): v is FsTimestamp =>
  typeof (v as FsTimestamp | null)?.toDate === "function";

const LOCALE_MAPPING: Record<string, string> = {
  'fr': 'fr-FR',
  'en': 'en-US',
  'es': 'es-ES',
  'de': 'de-DE',
  'pt': 'pt-PT',
  'ru': 'ru-RU',
  'zh': 'zh-CN',
  'ar': 'ar-SA',
  'hi': 'hi-IN'
};

const formatJoinDate = (val: TSLike, langCode: string): string | undefined => {
  if (!val) return undefined;
  const d = isFsTimestamp(val)
    ? val.toDate()
    : val instanceof Date 
      ? val
      : undefined;
  if (!d) return undefined;
  
  const locale = LOCALE_MAPPING[langCode] || 'fr-FR';
  const fmt = new Intl.DateTimeFormat(locale, {
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

// ✅ NOUVEAU : Fonction pour formater le nom court (Prénom + Initiale)
const formatShortName = (provider: SosProfile): string => {
  const firstName = provider.firstName || "";
  const lastName = provider.lastName || "";
  const lastInitial = lastName.charAt(0).toUpperCase();
  return lastInitial ? `${firstName} ${lastInitial}.` : firstName;
};

// ✅ CORRIGÉ : Fonction pour calculer les statistiques RÉELLES du prestataire
const calculateProviderStats = async (providerId: string): Promise<ProviderStats> => {
  try {
    // 1. Récupérer tous les appels du prestataire
    const callSessionsQuery = query(
      collection(db, "call_sessions"),
      where("metadata.providerId", "==", providerId)
    );
    const callSessionsSnapshot = await getDocs(callSessionsQuery);
    
    let totalCallsReceived = 0;
    let successfulCalls = 0;
    let completedCalls = 0;

    callSessionsSnapshot.forEach((doc) => {
      const data = doc.data();
      totalCallsReceived++;
      
      // Vérifier si l'appel est complété
      if (data.status === "completed" || data.endedAt) {
        completedCalls++;
        
        // Calculer la durée de l'appel
        const startedAt = data.startedAt?.toDate?.() || data.createdAt?.toDate?.();
        const endedAt = data.endedAt?.toDate?.();
        
        if (startedAt && endedAt) {
          const durationSeconds = (endedAt.getTime() - startedAt.getTime()) / 1000;
          
          // Appel réussi si durée > 2 minutes
          if (durationSeconds >= SUCCESSFUL_CALL_THRESHOLD_SECONDS) {
            successfulCalls++;
          }
        }
      }
    });

    // 2. ✅ CORRIGÉ : Récupérer UNIQUEMENT les reviews RÉELLES (sans commentKey = sans AAA)
    const reviewsQuery = query(
      collection(db, "reviews"),
      where("providerId", "==", providerId)
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    
    let totalRating = 0;
    let totalReviews = 0;
    let realReviewsCount = 0;

    reviewsSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // ✅ FILTRER : Ignorer les avis AAA (qui ont un commentKey)
      const isAAA = data.commentKey !== undefined && data.commentKey !== null;
      
      if (!isAAA && typeof data.rating === "number") {
        totalRating += data.rating;
        realReviewsCount++;
        totalReviews++;
      }
    });

    // ✅ LOGIQUE : N'afficher une moyenne QUE s'il y a des données réelles
    const averageRating = realReviewsCount > 0 ? totalRating / realReviewsCount : 0;
    const successRate = totalCallsReceived > 0 
      ? Math.round((successfulCalls / totalCallsReceived) * 100) 
      : 0;

    return {
      totalCallsReceived,
      successfulCalls,
      successRate,
      averageRating,
      totalReviews,
      completedCalls,
      realReviewsCount,
    };
  } catch (error) {
    console.error("Error calculating provider stats:", error);
    return {
      totalCallsReceived: 0,
      successfulCalls: 0,
      successRate: 0,
      averageRating: 0,
      totalReviews: 0,
      completedCalls: 0,
      realReviewsCount: 0,
    };
  }
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
  nameSlug,
  typeCountry,
} = params;
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useApp();

  const detectedLang = useMemo(
    () =>
      language === "fr" || language === "en"
        ? (language as "fr" | "en")
        : detectLanguage(),
    [language]
  );

  const preferredLangKey = useMemo(() => {
    const validLocales = ['fr', 'en', 'es', 'de', 'pt', 'ru', 'zh', 'ar', 'hi'] as const;
    type ValidLocale = typeof validLocales[number];
    
    if (validLocales.includes(language as ValidLocale)) {
      return language as ValidLocale;
    }
    if (validLocales.includes(detectedLang as ValidLocale)) {
      return detectedLang as ValidLocale;
    }
    return 'en' as ValidLocale;
  }, [language, detectedLang]);

  const translateAAA = useCallback((key: string): string => {
    if (!key) return '';
    
    try {
      const keys = key.split('.');
      const translations = aaaTranslationsMap[preferredLangKey] || aaaTranslationsMap['fr'];
      let value: any = translations;
      
      for (const k of keys) {
        value = value?.[k];
      }
      
      return typeof value === 'string' ? value : key;
    } catch {
      return key;
    }
  }, [preferredLangKey]);

  const [provider, setProvider] = useState<SosProfile | null>(null);
  const [realProviderId, setRealProviderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // ✅ NOUVEAU : État pour les statistiques calculées
  const [providerStats, setProviderStats] = useState<ProviderStats>({
    totalCallsReceived: 0,
    successfulCalls: 0,
    successRate: 0,
    averageRating: 0,
    totalReviews: 0,
    completedCalls: 0,
    realReviewsCount: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

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
        
        // ✅ TRADUIRE les avis selon la langue active
        const translatedReviews = providerReviews.map(review => {
          const reviewWithKey = review as any;
          
          // Si commentKey existe, traduire via translateAAA
          const translatedComment = reviewWithKey.commentKey 
            ? translateAAA(reviewWithKey.commentKey)
            : review.comment;
          
          return { 
            ...review, 
            comment: translatedComment 
          };
        });
        
        setReviews(translatedReviews);
        
        const distribution: RatingDistribution = {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        };
        
        translatedReviews.forEach((r) => {
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
    [realLoadReviews, translateAAA]
  );

useEffect(() => {
  const loadProviderData = async (): Promise<void> => {
    setIsLoading(true);
    setNotFound(false);

    try {
      let providerData: SosProfile | null = null;
      let foundProviderId: string | null = null;

      // ✅ ÉTAPE 1 : Collecter TOUS les identifiants possibles
      const possibleIds = [
        id,
        params.slug,
        params.profileId,
        params.name,
        params.nameSlug,
        params.nameId,
        params.nameSlugWithUid,
        location.pathname.split("/").pop(),
      ].filter((x): x is string => Boolean(x));

      // ✅ ÉTAPE 2 : Pour chaque ID, extraire l'UID potentiel (dernier segment de 8+ chars)
      const potentialUids = new Set<string>();
      
      for (const rawId of possibleIds) {
        // Ajouter l'ID brut
        potentialUids.add(rawId);
        
        // Extraire UID si présent (dernier segment après tiret, 8+ chars)
        const uidMatch = rawId.match(/[a-zA-Z0-9]{8,}$/);
        if (uidMatch) {
          potentialUids.add(uidMatch[0]);
        }
        
        // Extraire aussi le dernier token après le dernier tiret
        const lastToken = rawId.split("-").pop();
        if (lastToken && lastToken.length >= 8) {
          potentialUids.add(lastToken);
        }
      }

      // ✅ ÉTAPE 3 : Tester chaque UID potentiel
      for (const testId of potentialUids) {
        if (providerData) break; // Déjà trouvé

        // Méthode 1 : Par document ID
        try {
          const ref = doc(db, "sos_profiles", testId);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const data = snap.data();
            const normalized = normalizeUserData(data, snap.id);
            providerData = {
              ...normalized,
              id: snap.id,
              uid: normalized.uid || snap.id,
              type: (data?.type as "lawyer" | "expat") || "expat",
              description: pickDescription({ ...normalized, ...data }, preferredLangKey, intl),
              specialties: toArrayFromAny(data?.specialties, preferredLangKey),
              helpTypes: toArrayFromAny(data?.helpTypes, preferredLangKey),
              operatingCountries: toArrayFromAny(data?.operatingCountries, preferredLangKey),
              residenceCountry: data?.residenceCountry || data?.country,
            } as SosProfile;
            foundProviderId = snap.id;
            break;
          }
        } catch (e) {
          console.warn('Error searching by doc ID:', testId, e);
        }

        // Méthode 2 : Par champ uid
        try {
          const qByUid = query(
            collection(db, "sos_profiles"),
            where("uid", "==", testId),
            where("isActive", "==", true),
            where("isApproved", "==", true),
            limit(1)
          );
          const qsUid = await getDocs(qByUid);
          if (!qsUid.empty) {
            const found = qsUid.docs[0];
            const data = found.data();
            const normalized = normalizeUserData(data, found.id);
            providerData = {
              ...normalized,
              id: found.id,
              uid: normalized.uid || found.id,
              type: (data?.type as "lawyer" | "expat") || "expat",
              description: pickDescription({ ...normalized, ...data }, preferredLangKey, intl),
              specialties: toArrayFromAny(data?.specialties, preferredLangKey),
              helpTypes: toArrayFromAny(data?.helpTypes, preferredLangKey),
              operatingCountries: toArrayFromAny(data?.operatingCountries, preferredLangKey),
              residenceCountry: data?.residenceCountry || data?.country,
            } as SosProfile;
            foundProviderId = found.id;
            break;
          }
        } catch (e) {
          console.warn('Error searching by uid:', testId, e);
        }
      }

      // ✅ ÉTAPE 4 : Si toujours pas trouvé, chercher par slug
      if (!providerData && possibleIds.length > 0) {
        const slugNoUid = possibleIds[0].replace(/-[a-zA-Z0-9]{8,}$/, "");
        
        try {
          const qSlug = query(
            collection(db, "sos_profiles"),
            where("slug", "==", slugNoUid),
            where("isActive", "==", true),
            where("isApproved", "==", true),
            limit(1)
          );
          const qsSlug = await getDocs(qSlug);
          if (!qsSlug.empty) {
            const m = qsSlug.docs[0];
            const data = m.data();
            const normalized = normalizeUserData(data, m.id);
            providerData = {
              ...normalized,
              id: m.id,
              uid: normalized.uid || m.id,
              type: (data?.type as "lawyer" | "expat") || "expat",
              description: pickDescription({ ...normalized, ...data }, preferredLangKey, intl),
              specialties: toArrayFromAny(data?.specialties, preferredLangKey),
              helpTypes: toArrayFromAny(data?.helpTypes, preferredLangKey),
              operatingCountries: toArrayFromAny(data?.operatingCountries, preferredLangKey),
              residenceCountry: data?.residenceCountry || data?.country,
            } as SosProfile;
            foundProviderId = m.id;
          }
        } catch (e) {
          console.warn('Error searching by slug:', e);
        }
      }

      // ✅ ÉTAPE 5 : State fallback
      if (!providerData && location.state) {
        const state = location.state as LocationState;
        const navData = state.selectedProvider || state.providerData;
        if (navData) {
          providerData = {
            uid: navData.id || "",
            id: navData.id || "",
            fullName: navData.fullName || `${navData.firstName || ""} ${navData.lastName || ""}`.trim(),
            firstName: navData.firstName || "",
            lastName: navData.lastName || "",
            type: navData.type === "lawyer" ? "lawyer" : "expat",
            country: navData.country || "",
            languages: navData.languages || ["Français"],
            specialties: toArrayFromAny(navData.specialties, preferredLangKey),
            helpTypes: toArrayFromAny(navData.helpTypes, preferredLangKey),
            description: navData.description || navData.bio || "",
            profilePhoto: navData.profilePhoto || navData.avatar,
            rating: Number(navData.rating) || 0,
            reviewCount: Number(navData.reviewCount) || 0,
            yearsOfExperience: Number(navData.yearsOfExperience) || 0,
            isActive: true,
            isApproved: true,
            isVerified: !!navData.isVerified,
            operatingCountries: toArrayFromAny(navData.operatingCountries, preferredLangKey),
            residenceCountry: navData.residenceCountry || navData.country,
          } as SosProfile;
          foundProviderId = navData.id || "";
        }
      }

      // ✅ VÉRIFICATION FINALE
      if (providerData && foundProviderId) {
        if (providerData.isActive === false || providerData.isApproved === false) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }
        
        if (!providerData.fullName?.trim()) {
          providerData.fullName = `${providerData.firstName || ""} ${providerData.lastName || ""}`.trim() || 
            intl.formatMessage({ id: "providerProfile.defaultProfileName" });
        }
        
        setProvider(providerData);
        setRealProviderId(foundProviderId);
        
        // ✅ NOUVEAU : Charger les statistiques réelles
        setIsLoadingStats(true);
        const stats = await calculateProviderStats(foundProviderId);
        setProviderStats(stats);
        setIsLoadingStats(false);
        
        if (typeof requestIdleCallback !== "undefined") {
          requestIdleCallback(() => loadReviews(foundProviderId, providerData.uid));
        } else {
          await loadReviews(foundProviderId, providerData.uid);
        }
      } else {
        setNotFound(true);
      }
    } catch (e) {
      console.error("Error loading provider:", e);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  loadProviderData();
}, [id, typeParam, countryParam, langParam, preferredLangKey, params.slug, params.profileId, params.name, params.nameSlug, params.nameId]);

  // ✅ Realtime online status + Vérification désinscription
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
          
          // ✅ Vérifier si le provider vient de se désinscrire
          const isActive = data.isActive !== false;
          const isApproved = data.isApproved !== false;
          
          if (!isActive || !isApproved) {
            setNotFound(true);
            setProvider(null);
            return;
          }
          
          // ✅ Si tout est OK, mettre à jour normalement
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
  }, [realProviderId]);

  // ✅ Recharger les avis quand la langue change
  useEffect(() => {
    if (realProviderId && provider) {
      loadReviews(realProviderId, provider.uid);
    }
  }, [preferredLangKey, realProviderId, provider?.uid, loadReviews]);
  
  // ✅ Redirect si not found
  useEffect(() => {
    if (!isLoading && !provider && notFound) {
      const tmo = setTimeout(
        () => navigate("/sos-appel"),
        ANIMATION_DURATIONS.LOADING_DELAY
      );
      return () => clearTimeout(tmo);
    }
  }, [isLoading, provider, notFound, navigate]);

  // ✅ SEO avec nouveau système de slugs
 const updateSEOMetadata = useCallback(() => {
  if (!provider || isLoading || seoUpdatedRef.current) return;
  
  try {
    const fullSlug = generateSlug({
      firstName: provider.firstName || '',
      lastName: provider.lastName || '',
      role: provider.type,
      country: provider.country,
      languages: provider.languages || ['Français'],
      specialties: provider.type === 'lawyer' 
        ? (provider.specialties || [])
        : (provider.helpTypes || []),
      locale: language,
      uid: provider.uid || provider.id || realProviderId || '',
    });
    
    const seoUrl = `/${fullSlug}`;

    const displayName = formatPublicName(provider);
    const isLawyer = provider.type === "lawyer";
    
    const roleLabel = isLawyer
      ? intl.formatMessage({ id: "providerProfile.lawyer" })
      : intl.formatMessage({ id: "providerProfile.expat" });
    
    const pageTitle = `${displayName} - ${roleLabel} ${intl.formatMessage({ id: "providerProfile.in" })} ${getCountryName(provider.country, preferredLangKey)} | SOS Expat & Travelers`;
    
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

    const ogDesc = pickDescription(provider, preferredLangKey, intl).slice(0, 160);
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
      LOCALE_MAPPING[preferredLangKey] || "en_US"
    );
    
    seoUpdatedRef.current = true;
  } catch (e) {
    console.error("Error updating SEO metadata:", e);
  }
}, [provider, isLoading, preferredLangKey, intl, language]);

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
      
      const fullSlug = generateSlug({
        firstName: provider.firstName || '',
        lastName: provider.lastName || '',
        role: provider.type,
        country: provider.country,
        languages: provider.languages || ['Français'],
        specialties: provider.type === 'lawyer' 
          ? (provider.specialties || [])
          : (provider.helpTypes || []),
        locale: language,
        uid: provider.uid || provider.id || '',
      });
      
      const currentUrl = `${window.location.origin}/${fullSlug}`;
      const displayName = formatPublicName(provider);
      const isLawyer = provider.type === "lawyer";
      
      const roleLabel = isLawyer
        ? intl.formatMessage({ id: "providerProfile.lawyer" })
        : intl.formatMessage({ id: "providerProfile.expat" });
      
      const title = `${displayName} - ${roleLabel} ${intl.formatMessage({ id: "providerProfile.in" })} ${getCountryName(provider.country, preferredLangKey)}`;

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
            alert(intl.formatMessage({ id: "providerProfile.linkCopied" }));
          } else {
            const textArea = document.createElement("textarea");
            textArea.value = currentUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            alert(intl.formatMessage({ id: "providerProfile.linkCopied" }));
          }
          break;
      }
    },
    [provider, intl, language, preferredLangKey]
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
      const reason = window.prompt(intl.formatMessage({ id: "providerProfile.reportReason" }));
      if (reason) {
        try {
          await reportReview(reviewId, reason);
          alert(intl.formatMessage({ id: "providerProfile.reportThanks" }));
        } catch (e) {
          console.error("Error reporting review:", e);
        }
      }
    },
    [user, navigate, intl]
  );

  const renderStars = useCallback((rating?: number) => {
    const safe =
      typeof rating === "number" && !Number.isNaN(rating) ? rating : 0;
    const full = Math.floor(safe);
    const hasHalf = safe - full >= 0.5;
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={
          i < full
            ? "text-yellow-500 fill-yellow-500"
            : i === full && hasHalf
              ? "text-yellow-500"
              : "text-gray-400"
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

  const languageCodes = useMemo(() => {
    return convertLanguageNamesToCodes(languagesList);
  }, [languagesList]);
  
  const mainPhoto: string =
    provider?.profilePhoto ||
    provider?.photoURL ||
    provider?.avatar ||
    "/default-avatar.png";
  
  const descriptionText = useMemo(
    () => (provider ? pickDescription(provider, preferredLangKey, intl) : ""),
    [provider, preferredLangKey, intl]
  );

  // ✅ NOUVEAU : Vérifier si le prestataire est "nouveau" (pas de données réelles)
  const isNewProvider = useMemo(() => {
    return providerStats.completedCalls === 0 && providerStats.realReviewsCount === 0;
  }, [providerStats]);

  // ✅ NOUVEAU : Générer les snippets optimisés pour Position 0
  const snippetData = useSnippetGenerator(
    provider ? {
      firstName: provider.firstName,
      lastName: provider.lastName,
      type: provider.type,
      country: provider.country,
      city: provider.city,
      languages: provider.languages,
      specialties: provider.specialties || [],
      helpTypes: provider.helpTypes || [],
      yearsOfExperience: provider.yearsOfExperience,
      yearsAsExpat: provider.yearsAsExpat,
      rating: providerStats.averageRating || provider.rating,
      reviewCount: providerStats.realReviewsCount || provider.reviewCount,
      successRate: providerStats.successRate || provider.successRate,
      totalCalls: providerStats.completedCalls || provider.totalCalls,
      description: descriptionText
    } : null,
    language
  );
  
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
  
  // ✅ Spécialités traduites correctement
  const derivedSpecialties = useMemo(() => {
    if (!provider) {
      return [];
    }
    
    const codes = isLawyer
      ? toArrayFromAny(provider.specialties, preferredLangKey)
      : toArrayFromAny(provider.helpTypes || provider.specialties, preferredLangKey);
    
    const translated = codes.map((code) => {
      try {
        const cleanCode = code.trim().toUpperCase();
        
        if (isLawyer) {
          const label = getLawyerSpecialityLabel(cleanCode, preferredLangKey as any);
          return label !== cleanCode ? label : code;
        } else {
          const label = getExpatHelpTypeLabel(cleanCode, preferredLangKey as any);
          return label !== cleanCode ? label : code;
        }
      } catch (e) {
        return code;
      }
    });
    
    const result = translated
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    
    return result;
  }, [provider, isLawyer, preferredLangKey]);
  
  const joinDateText = useMemo(() => {
    if (!provider) return undefined;
    const formatted = formatJoinDate(
      provider.createdAt || provider.updatedAt || null,
      preferredLangKey
    );
    if (!formatted) return undefined;
    return `${intl.formatMessage({ id: "providerProfile.memberSince" })} ${formatted}`;
  }, [provider, preferredLangKey, intl]);

  // ✅ Variables de traduction
  const yearsLabel = intl.formatMessage({ id: "providerProfile.years" });
  const minutesLabel = intl.formatMessage({ id: "providerProfile.minutes" });

  // ✅ CORRIGÉ : structuredData avec preferredLangKey
  const structuredData = useMemo<Record<string, unknown> | undefined>(() => {
    if (!provider) return undefined;
    const displayName = formatPublicName(provider);
    
    const roleLabel = isLawyer
      ? intl.formatMessage({ id: "providerProfile.attorney" })
      : intl.formatMessage({ id: "providerProfile.consultant" });
    
    const data: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": isLawyer ? "Attorney" : "Person",
      "@id": `${window.location.origin}${window.location.pathname}`,
      name: displayName,
      image: {
        "@type": "ImageObject",
        url: mainPhoto,
        width: IMAGE_SIZES.MODAL_MAX_WIDTH,
        height: IMAGE_SIZES.MODAL_MAX_HEIGHT,
      },
      description: descriptionText,
      address: { 
        "@type": "PostalAddress", 
        addressCountry: provider.country 
      },
      jobTitle: roleLabel,
      worksFor: {
        "@type": "Organization",
        name: "SOS Expat & Travelers",
        url: window.location.origin,
      },
      knowsLanguage: languagesList.map((lang) => ({
        "@type": "Language",
        name: lang,
      })),
      aggregateRating: providerStats.realReviewsCount > 0 ? {
        "@type": "AggregateRating",
        ratingValue: providerStats.averageRating || 0,
        reviewCount: providerStats.realReviewsCount || 0,
        bestRating: 5,
        worstRating: 1,
      } : undefined,
    };
    return data;
  }, [
    provider,
    isLawyer,
    mainPhoto,
    descriptionText,
    intl,
    languagesList,
    providerStats,
  ]);

  // ✅ Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-50">
          <LoadingSpinner 
            size="large" 
            color="red" 
            text={intl.formatMessage({ id: "providerProfile.loading" })} 
          />
        </div>
      </Layout>
    );
  }

  // ✅ Not found - Message amélioré
  if (notFound || !provider) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-50 px-4">
          <div className="max-w-md mx-auto p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center shadow-xl">
                <AlertTriangle className="w-12 h-12 text-red-700" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              <FormattedMessage id="providerProfile.notFound" />
            </h2>
            <p className="text-slate-700 mb-8 font-medium">
              <FormattedMessage id="providerProfile.notFoundDescription" />
            </p>
            
            <button
              onClick={() => navigate("/sos-appel")}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-700 to-red-600 text-white rounded-xl hover:from-red-800 hover:to-red-700 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 font-bold"
            >
              <svg 
                className="w-5 h-5 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              <FormattedMessage id="providerProfile.backToExperts" />
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ✅ CORRIGÉ : Titres SEO avec intl et preferredLangKey
  const roleLabel = isLawyer
    ? intl.formatMessage({ id: "providerProfile.lawyer" })
    : intl.formatMessage({ id: "providerProfile.expat" });
  
  const seoTitle = `${formatPublicName(provider)} - ${roleLabel} ${intl.formatMessage({ id: "providerProfile.in" })} ${getCountryName(provider.country, preferredLangKey)} | SOS Expat & Travelers`;
  
  const seoDescription = `${intl.formatMessage({ id: "providerProfile.consult" })} ${formatPublicName(provider)}, ${roleLabel.toLowerCase()} ${intl.formatMessage({ id: "providerProfile.frenchSpeaking" })} ${intl.formatMessage({ id: "providerProfile.in" })} ${getCountryName(provider.country, preferredLangKey)}. ${descriptionText.slice(0, 120)}...`;

  return (
    <Layout>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        canonicalUrl={`/${generateSlug({
          firstName: provider.firstName || '',
          lastName: provider.lastName || '',
          role: provider.type,
          country: provider.country,
          languages: provider.languages || ['Français'],
          specialties: provider.type === 'lawyer' 
            ? (provider.specialties || [])
            : (provider.helpTypes || []),
          locale: language,
          uid: provider.uid || provider.id || ''
        })}`}
        ogImage={mainPhoto}
        ogType="profile"
        structuredData={structuredData}
      />

      {/* ✅ NOUVEAU : Snippets JSON-LD pour Position 0 */}
      {snippetData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: snippetData.jsonLD }}
        />
      )}

      {/* 🎨 DESIGN MOBILE-FIRST OPTIMISÉ ET ÉPURÉ */}
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 pb-28">
        
        {/* ✅ HEADER - Simplifié */}
        <header className="bg-white border-b-2 border-slate-300 shadow-md sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <button
              onClick={() => navigate("/sos-appel")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-xl transition-all font-bold shadow-md hover:shadow-lg"
              aria-label={intl.formatMessage({ id: "providerProfile.backToExperts" })}
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
              <span className="text-sm"><FormattedMessage id="providerProfile.backToExperts" /></span>
            </button>
          </div>
        </header>

        {/* ✅ HERO OPTIMISÉ - Layout vertical épuré */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-3xl p-5 border-3 border-slate-300 shadow-2xl">
            
            {/* Ligne 1 : Photo + Nom + Badges */}
            <div className="flex items-start gap-4 mb-4">
              {/* Photo avec status */}
              <div className="relative flex-shrink-0">
                <div className="p-[3px] rounded-full bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500 shadow-lg">
                  <img
                    src={mainPhoto}
                    alt={formatShortName(provider)}
                    className="w-20 h-20 rounded-full object-cover border-3 border-white cursor-pointer"
                    onClick={() => setShowImageModal(true)}
                    onError={handleImageError}
                    loading="eager"
                    fetchPriority="high"
                  />
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full border-3 border-white shadow-lg ${
                    onlineStatus.isOnline ? "bg-green-600" : "bg-slate-500"
                  }`}
                  title={onlineStatus.isOnline 
                    ? intl.formatMessage({ id: "providerProfile.online" })
                    : intl.formatMessage({ id: "providerProfile.offline" })
                  }
                >
                  {onlineStatus.isOnline && (
                    <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>
                  )}
                </div>
              </div>

              {/* Nom + Badges vérifié/nouveau */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h1 className="text-xl font-black text-slate-900 truncate">
                    {formatShortName(provider)}
                  </h1>
                  {provider.isVerified && (
                    <Shield size={16} className="text-blue-700 flex-shrink-0" strokeWidth={2.5} />
                  )}
                </div>
                
                {isNewProvider && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-200 to-orange-200 border border-yellow-400 rounded-full text-xs font-black text-yellow-900">
                    <Sparkles size={12} strokeWidth={2.5} />
                    <FormattedMessage id="providerProfile.new" />
                  </span>
                )}

                {/* Rating - Compact */}
                {!isNewProvider && (
                  <div className="flex items-center gap-1 mt-1.5">
                    {renderStars(providerStats.averageRating || provider.rating)}
                    <span className="text-xs font-black text-slate-900 ml-1">
                      {providerStats.averageRating 
                        ? providerStats.averageRating.toFixed(1)
                        : (typeof provider.rating === "number" ? provider.rating.toFixed(1) : "--")}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      ({providerStats.realReviewsCount})
                    </span>
                  </div>
                )}
                {isNewProvider && (
                  <p className="text-xs font-bold text-slate-600 italic mt-1.5">
                    <FormattedMessage id="providerProfile.noRatingsYet" />
                  </p>
                )}
              </div>
            </div>

            {/* Ligne 2 : Spécialités - MAX 2 badges */}
            {derivedSpecialties.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {derivedSpecialties.slice(0, 2).map((s, i) => (
                  <span
                    key={`${s}-${i}`}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      isLawyer 
                        ? "bg-blue-100 text-blue-900 border border-blue-300" 
                        : "bg-green-100 text-green-900 border border-green-300"
                    }`}
                  >
                    {s}
                  </span>
                ))}
                {derivedSpecialties.length > 2 && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                    +{derivedSpecialties.length - 2}
                  </span>
                )}
              </div>
            )}

            {/* Ligne 3 : Langues - Compact sur une ligne */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-4">
              <Globe size={14} className="flex-shrink-0 text-blue-700" strokeWidth={2.5} />
              <span className="truncate">
                {languageCodes.slice(0, 2).map((code) => formatLanguages([code], preferredLangKey)).join(", ")}
                {languageCodes.length > 2 && ` +${languageCodes.length - 2}`}
              </span>
            </div>

            {/* Ligne 4 : Prix + Statut - Côte à côte */}
            <div className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border-2 border-slate-300">
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-black text-slate-900">
                  {bookingPrice ? formatEUR(bookingPrice.eur) : "—"}
                </div>
                <div className="text-xs font-bold text-slate-700 flex items-center gap-0.5">
                  <Clock size={12} strokeWidth={2.5} />
                  {bookingPrice?.duration || 20}{minutesLabel.charAt(0)}
                </div>
              </div>

              <div
                className={`px-3 py-1.5 rounded-lg text-xs font-black shadow-md ${
                  isOnCall
                    ? "bg-orange-200 text-orange-900 border border-orange-400"
                    : onlineStatus.isOnline
                      ? "bg-green-200 text-green-900 border border-green-400"
                      : "bg-slate-200 text-slate-700 border border-slate-300"
                }`}
              >
                {isOnCall
                  ? intl.formatMessage({ id: "providerProfile.onCall" })
                  : onlineStatus.isOnline
                    ? intl.formatMessage({ id: "providerProfile.available" })
                    : intl.formatMessage({ id: "providerProfile.offline" })}
              </div>
            </div>
          </div>
        </div>

        {/* ✅ CONTENU PRINCIPAL */}
        <main className="max-w-7xl mx-auto px-4 space-y-4">
          
          {/* Description */}
          <section className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-300">
            <h2 className="text-base font-black text-slate-900 mb-3">
              <FormattedMessage id="providerProfile.about" />
            </h2>
            <p className="text-slate-800 leading-relaxed whitespace-pre-line text-sm font-medium">
              {descriptionText}
            </p>
          </section>

          {/* Spécialités complètes */}
          {derivedSpecialties.length > 0 && (
            <section className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-300">
              <h2 className="text-base font-black text-slate-900 mb-3">
                <FormattedMessage id="providerProfile.specialties" />
              </h2>
              <div className="flex flex-wrap gap-2">
                {derivedSpecialties.map((s, i) => (
                  <span
                    key={`${s}-${i}`}
                    className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                      isLawyer 
                        ? "bg-blue-50 text-blue-900 border border-blue-200" 
                        : "bg-green-50 text-green-900 border border-green-200"
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Pays d'intervention */}
          {provider.operatingCountries && provider.operatingCountries.length > 0 && (
            <section className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-300">
              <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-red-700" strokeWidth={2.5} />
                <FormattedMessage id="providerProfile.operatingCountries" />
              </h2>
              <div className="flex flex-wrap gap-2">
                {provider.operatingCountries.map((countryCode, index) => (
                  <span
                    key={`${countryCode}-${index}`}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-bold text-slate-800"
                  >
                    {getCountryName(countryCode, preferredLangKey)}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Langues */}
          <section className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-300">
            <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
              <Globe size={16} className="text-blue-700" strokeWidth={2.5} />
              <FormattedMessage id="providerProfile.languages" />
            </h2>
            <div className="flex flex-wrap gap-2">
              {languageCodes.map((code, i) => (
                <span
                  key={`${code}-${i}`}
                  className="px-3 py-1.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-full text-sm font-bold"
                >
                  {formatLanguages([code], preferredLangKey)}
                </span>
              ))}
            </div>
          </section>

          {/* Stats */}
          {!isNewProvider && (
            <section className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-300">
              <h2 className="text-base font-black text-slate-900 mb-3">
                <FormattedMessage id="providerProfile.stats" />
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="text-2xl font-black text-slate-900">
                    {isLoadingStats ? "..." : `${providerStats.successRate}%`}
                  </div>
                  <div className="text-xs font-bold text-slate-700">
                    <FormattedMessage id="providerProfile.successRate" />
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="text-2xl font-black text-slate-900">
                    {isLoadingStats ? "..." : providerStats.completedCalls}
                  </div>
                  <div className="text-xs font-bold text-slate-700">
                    <FormattedMessage id="providerProfile.completedCalls" />
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="text-2xl font-black text-slate-900">
                    {isLawyer
                      ? `${provider.yearsOfExperience || 0}`
                      : `${provider.yearsAsExpat || provider.yearsOfExperience || 0}`}
                  </div>
                  <div className="text-xs font-bold text-slate-700">
                    {yearsLabel} <FormattedMessage id="providerProfile.experience" />
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="text-2xl font-black text-slate-900">
                    {providerStats.averageRating
                      ? providerStats.averageRating.toFixed(1)
                      : "--"}
                  </div>
                  <div className="text-xs font-bold text-slate-700">
                    <FormattedMessage id="providerProfile.averageRating" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Formation */}
          {isLawyer && (educationText || certificationsArray.length > 0 || provider.graduationYear) && (
            <section className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-300">
              <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
                <GraduationCap size={16} className="text-blue-700" strokeWidth={2.5} />
                <FormattedMessage id="providerProfile.education" />
              </h2>
              <div className="space-y-2">
                {educationText && (
                  <div className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-700 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{educationText}</p>
                      {provider.graduationYear && (
                        <p className="text-xs font-bold text-slate-700 mt-0.5">
                          <FormattedMessage id="providerProfile.graduated" /> {provider.graduationYear}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {certificationsArray.length > 0 &&
                  certificationsArray.map((cert, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Award size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                      <p className="text-sm font-bold text-slate-800">{cert}</p>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-900">
                <FormattedMessage id="providerProfile.customerReviews" />
              </h2>
              {!isNewProvider && (
                <span className="px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-full text-sm font-black text-yellow-900">
                  {providerStats.averageRating
                    ? providerStats.averageRating.toFixed(1)
                    : "—"}
                  /5
                </span>
              )}
            </div>

            {isLoadingReviews ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-red-700 mx-auto"></div>
              </div>
            ) : isNewProvider ? (
              <div className="text-center py-8 text-slate-700">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-yellow-600" strokeWidth={2.5} />
                <p className="font-black mb-1 text-sm">
                  <FormattedMessage id="providerProfile.newProviderNoReviews" />
                </p>
                <p className="text-xs font-bold">
                  <FormattedMessage id="providerProfile.beTheFirst" />
                </p>
              </div>
            ) : (
              <>
                <Reviews
                  mode="summary"
                  averageRating={providerStats.averageRating || 0}
                  totalReviews={providerStats.realReviewsCount}
                  ratingDistribution={ratingDistribution}
                />
                <div className="mt-4">
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

          {/* FAQ */}
          {snippetData?.snippets?.faqContent && snippetData.snippets.faqContent.length > 0 && (
            <section className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-300">
              <h2 className="text-base font-black text-slate-900 mb-3">
                <FormattedMessage id="providerProfile.frequentlyAskedQuestions" />
              </h2>
              <div className="space-y-2">
                {snippetData.snippets.faqContent.map((faq, index) => (
                  <details 
                    key={`faq-${index}`}
                    className="group border border-slate-300 rounded-xl overflow-hidden"
                  >
                    <summary className="flex justify-between items-center cursor-pointer list-none p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                      <h3 className="text-sm font-black text-slate-900 pr-3">
                        {faq.question}
                      </h3>
                      <svg
                        className="w-5 h-5 text-slate-700 transition-transform group-open:rotate-180 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-3 py-3 text-sm font-medium text-slate-800 leading-relaxed bg-white border-t border-slate-300">
                      <p className="whitespace-pre-line">{faq.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Partage */}
          <section className="bg-white rounded-2xl p-5 shadow-lg border-2 border-slate-300">
            <h3 className="text-sm font-black text-slate-900 mb-3 text-center">
              <FormattedMessage id="providerProfile.share" />
            </h3>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => shareProfile("facebook")}
                className="p-2.5 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors border border-blue-300"
                aria-label="Facebook"
              >
                <Facebook size={20} strokeWidth={2} />
              </button>
              <button
                onClick={() => shareProfile("twitter")}
                className="p-2.5 bg-sky-100 text-sky-700 rounded-xl hover:bg-sky-200 transition-colors border border-sky-300"
                aria-label="Twitter"
              >
                <Twitter size={20} strokeWidth={2} />
              </button>
              <button
                onClick={() => shareProfile("linkedin")}
                className="p-2.5 bg-blue-100 text-blue-800 rounded-xl hover:bg-blue-200 transition-colors border border-blue-300"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} strokeWidth={2} />
              </button>
              <button
                onClick={() => shareProfile("copy")}
                className="p-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors border border-slate-300"
                aria-label={intl.formatMessage({ id: "providerProfile.copyLink" })}
              >
                <Share2 size={20} strokeWidth={2} />
              </button>
            </div>
          </section>

        </main>
      </div>

      {/* ✅ CTA FLOTTANT (FAB) */}
      <div className="fixed bottom-0 left-0 right-0 z-45 bg-white border-t-3 border-slate-300 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <button
            onClick={handleBookCall}
            disabled={!onlineStatus.isOnline || isOnCall}
            className={`w-full py-3.5 rounded-xl font-black text-base transition-all flex items-center justify-center gap-2 shadow-xl ${
              onlineStatus.isOnline && !isOnCall
                ? "bg-gradient-to-r from-green-700 to-green-600 text-white hover:shadow-2xl active:scale-[0.98] border-2 border-green-800"
                : "bg-slate-400 text-slate-700 cursor-not-allowed border-2 border-slate-500"
            }`}
          >
            {onlineStatus.isOnline && !isOnCall ? (
              <>
                <Phone size={22} strokeWidth={2.5} />
                <span>Appeler • {bookingPrice ? formatEUR(bookingPrice.eur) : "—"}</span>
              </>
            ) : isOnCall ? (
              <>
                <XCircle size={22} strokeWidth={2.5} />
                <FormattedMessage id="providerProfile.alreadyOnCall" />
              </>
            ) : (
              <>
                <XCircle size={22} strokeWidth={2.5} />
                <FormattedMessage id="providerProfile.unavailable" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Image modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={mainPhoto}
              alt={formatPublicName(provider)}
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
              onError={handleImageError}
              loading="lazy"
            />
            <button
              className="absolute top-4 right-4 bg-white rounded-full p-3 text-slate-900 hover:bg-slate-100 transition-colors shadow-xl"
              onClick={() => setShowImageModal(false)}
              aria-label={intl.formatMessage({ id: "providerProfile.close" })}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProviderProfile;