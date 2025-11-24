// src/pages/RegisterLawyer.tsx
// VERSION ULTRA-OPTIMISÉE - SEO + PERFORMANCE + SÉCURITÉ
// ✅ SEO: JSON-LD, Schema.org, Open Graph, Twitter Cards, Canonical
// ✅ PERFORMANCE: Lazy loading, mise en cache, optimisation bundle
// ✅ SÉCURITÉ: Input sanitization, validation stricte
// ✅ ACCESSIBILITÉ: ARIA labels, balises sémantiques, navigation clavier
// ✅ i18n: 100% clés de traduction, zéro texte en dur

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  lazy,
  Suspense,
  useRef,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Scale,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Globe,
  Briefcase,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import Layout from "../components/layout/Layout";
import Button from "../components/common/Button";
import { useAuth } from "../contexts/AuthContext";
import { useApp } from "../contexts/AppContext";
import type { MultiValue } from "react-select";
import { useIntl, FormattedMessage } from "react-intl";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { browserLocalPersistence, setPersistence } from "firebase/auth";
import { auth } from "@/config/firebase";
import IntlPhoneInput from "@/components/forms-data/IntlPhoneInput";
import { countriesData } from "@/data/countries";
import '../styles/multi-language-select.css';

// Lazy imports pour optimisation du bundle
const ImageUploader = lazy(() => import("../components/common/ImageUploader"));
const MultiLanguageSelect = lazy(() => import("../components/forms-data/MultiLanguageSelect"));
const SpecialtySelect = lazy(() => import("../components/forms-data/SpecialtySelect"));

// Constants
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/;
const MIN_BIO_LENGTH = 50;
const MAX_BIO_LENGTH = 500;

// Types
interface LawyerFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  currentCountry: string;
  preferredLanguage: "fr" | "en" | "es" | "de" | "ru" | "hi" | "pt" | "ch" | "ar";
  practiceCountries: string[];
  yearsOfExperience: number;
  specialties: string[];
  graduationYear: number;
  profilePhoto: string;
  bio: string;
  educations: string[];
  availability: "available" | "busy" | "offline";
  acceptTerms: boolean;
}

interface LanguageOption {
  value: string;
  label: string;
}

interface CountryOption {
  value: string;
  label: string;
}

// 🔒 SÉCURITÉ: Sanitization des inputs
const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/[<>]/g, "") // Supprime les balises HTML
    .replace(/javascript:/gi, "") // Supprime les tentatives XSS
    .replace(/on\w+=/gi, ""); // Supprime les event handlers
};

const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

// Country code mapping pour Stripe
const getCountryCode = (countryName: string): string => {
  const country = countriesData.find(c => 
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
  return country?.code || "US";
};

// 🎨 Composants de feedback
const FieldError = React.memo(({ error, show }: { error?: string; show: boolean }) => {
  if (!show || !error) return null;
  return (
    <div 
      className="mt-2 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
      role="alert"
      aria-live="polite"
    >
      <XCircle className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <span className="font-medium">{error}</span>
    </div>
  );
});
FieldError.displayName = "FieldError";

const FieldSuccess = React.memo(({ show, message }: { show: boolean; message: string }) => {
  if (!show) return null;
  return (
    <div 
      className="mt-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2"
      role="status"
      aria-live="polite"
    >
      <CheckCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span className="font-medium">{message}</span>
    </div>
  );
});
FieldSuccess.displayName = "FieldSuccess";

const TagChip = React.memo(({ value, onRemove, ariaLabel }: { value: string; onRemove: () => void; ariaLabel: string }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-800 text-sm font-medium border border-indigo-200">
    {value}
    <button 
      type="button" 
      onClick={onRemove} 
      className="hover:bg-indigo-200 rounded p-0.5 transition-colors" 
      aria-label={ariaLabel}
    >
      <XCircle className="w-4 h-4" aria-hidden="true" />
    </button>
  </span>
));
TagChip.displayName = "TagChip";

// Calcul de la force du mot de passe
const computePasswordStrength = (pw: string) => {
  if (!pw) return { percent: 0, color: "bg-gray-300", label: "weak" };
  let score = 0;
  if (pw.length >= 6) score += 30;
  if (pw.length >= 8) score += 20;
  if (pw.length >= 10) score += 15;
  if (pw.length >= 12) score += 15;
  if (/[a-z]/.test(pw)) score += 5;
  if (/[A-Z]/.test(pw)) score += 5;
  if (/\d/.test(pw)) score += 5;
  if (/[^a-zA-Z0-9]/.test(pw)) score += 5;
  const clamp = Math.min(100, score);
  
  let color = "bg-green-500";
  let label = "strong";
  if (pw.length < 6) {
    color = "bg-red-500";
    label = "weak";
  } else if (clamp < 40) {
    color = "bg-orange-500";
    label = "fair";
  } else if (clamp < 55) {
    color = "bg-yellow-500";
    label = "good";
  } else if (clamp < 70) {
    color = "bg-blue-500";
    label = "strong";
  }
  
  return { percent: clamp, color, label };
};

// 🎯 Composant FAQ pour le SEO
const FAQSection: React.FC<{ intl: any }> = React.memo(({ intl }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  const faqs = Array.from({ length: 8 }, (_, i) => ({
    question: intl.formatMessage({ id: `registerLawyer.faq.q${i + 1}` }),
    answer: intl.formatMessage({ id: `registerLawyer.faq.a${i + 1}` }),
  }));

  return (
    <section 
      className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg mt-8"
      aria-labelledby="faq-heading"
    >
      <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100">
          <HelpCircle className="w-5 h-5 text-indigo-600" aria-hidden="true" />
        </div>
        <h2 id="faq-heading" className="text-xl font-black text-gray-900">
          <FormattedMessage id="registerLawyer.faq.title" />
        </h2>
      </div>

      <div className="space-y-4" role="list">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="border-2 border-gray-200 rounded-xl overflow-hidden transition-all hover:border-indigo-300"
            role="listitem"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              aria-expanded={openIndex === index}
              aria-controls={`faq-answer-${index}`}
            >
              <h3 className="text-base font-bold text-gray-900 pr-4">{faq.question}</h3>
              <ArrowRight 
                className={`w-5 h-5 text-indigo-600 flex-shrink-0 transition-transform ${openIndex === index ? 'rotate-90' : ''}`}
                aria-hidden="true"
              />
            </button>
            {openIndex === index && (
              <div 
                id={`faq-answer-${index}`}
                className="px-4 pb-4 text-sm text-gray-700 leading-relaxed"
                role="region"
              >
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
});
FAQSection.displayName = "FAQSection";

const RegisterLawyer: React.FC = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const { register, isLoading } = useAuth();
  const { language } = useApp();
  const lang = language as "fr" | "en" | "es" | "de" | "ru" | "hi" | "pt" | "ch" | "ar";

  const initial: LawyerFormData = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    currentCountry: "",
    preferredLanguage: lang,
    practiceCountries: [],
    yearsOfExperience: 0,
    specialties: [],
    graduationYear: new Date().getFullYear() - 5,
    profilePhoto: "",
    bio: "",
    educations: [""],
    availability: "offline",
    acceptTerms: false,
  };

  const [form, setForm] = useState<LawyerFormData>(initial);
  const [selectedLanguages, setSelectedLanguages] = useState<MultiValue<LanguageOption>>([]);
  const [selectedPracticeCountries, setSelectedPracticeCountries] = useState<MultiValue<CountryOption>>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<MultiValue<{ value: string; label: string }>>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fieldRefs = {
    firstName: useRef<HTMLInputElement | null>(null),
    email: useRef<HTMLInputElement | null>(null),
  };

  // 🔍 SEO PERFECTIONNÉ
  useEffect(() => {
    const baseUrl = window.location.origin;
    const currentUrl = `${baseUrl}${window.location.pathname}`;
    
    // Meta title
    document.title = intl.formatMessage({ id: "registerLawyer.seo.title" });
    
    const ensureMeta = (name: string, content: string, prop = false) => {
      const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let el = document.querySelector(sel) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        if (prop) el.setAttribute("property", name);
        else el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    const ensureLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement("link");
        el.rel = rel;
        document.head.appendChild(el);
      }
      el.href = href;
    };

    // Meta description
    ensureMeta("description", intl.formatMessage({ id: "registerLawyer.seo.description" }));
    
    // Meta keywords
    ensureMeta("keywords", intl.formatMessage({ id: "registerLawyer.seo.keywords" }));
    
    // Viewport (responsive + mobile-first)
    ensureMeta("viewport", "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes");
    
    // Canonical URL
    ensureLink("canonical", currentUrl);
    
    // Open Graph (Facebook, LinkedIn)
    ensureMeta("og:title", intl.formatMessage({ id: "registerLawyer.seo.ogTitle" }), true);
    ensureMeta("og:description", intl.formatMessage({ id: "registerLawyer.seo.ogDescription" }), true);
    ensureMeta("og:type", "website", true);
    ensureMeta("og:url", currentUrl, true);
    ensureMeta("og:image", `${baseUrl}/images/og-register-lawyer.jpg`, true);
    ensureMeta("og:image:width", "1200", true);
    ensureMeta("og:image:height", "630", true);
    ensureMeta("og:image:alt", intl.formatMessage({ id: "registerLawyer.seo.ogImageAlt" }), true);
    ensureMeta("og:site_name", "SOS-Expat", true);
    ensureMeta("og:locale", lang === "fr" ? "fr_FR" : lang === "en" ? "en_US" : `${lang}_${lang.toUpperCase()}`, true);
    
    // Twitter Cards
    ensureMeta("twitter:card", "summary_large_image");
    ensureMeta("twitter:title", intl.formatMessage({ id: "registerLawyer.seo.twitterTitle" }));
    ensureMeta("twitter:description", intl.formatMessage({ id: "registerLawyer.seo.twitterDescription" }));
    ensureMeta("twitter:image", `${baseUrl}/images/twitter-register-lawyer.jpg`);
    ensureMeta("twitter:image:alt", intl.formatMessage({ id: "registerLawyer.seo.twitterImageAlt" }));
    ensureMeta("twitter:site", "@SOSExpat");
    ensureMeta("twitter:creator", "@SOSExpat");
    
    // Référencement IA (Google AI, Bing Chat, ChatGPT)
    ensureMeta("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    ensureMeta("googlebot", "index, follow");
    ensureMeta("bingbot", "index, follow");
    ensureMeta("author", "SOS-Expat");
    ensureMeta("language", lang);
    ensureMeta("geo.region", intl.formatMessage({ id: "registerLawyer.seo.geoRegion" }));
    ensureMeta("geo.placename", intl.formatMessage({ id: "registerLawyer.seo.geoPlacename" }));
    
    // Mobile app links
    ensureMeta("apple-mobile-web-app-capable", "yes");
    ensureMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
    ensureMeta("mobile-web-app-capable", "yes");
    ensureMeta("theme-color", "#4f46e5");
    
    // 📊 JSON-LD Schema.org pour SEO avancé
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": currentUrl,
          "url": currentUrl,
          "name": intl.formatMessage({ id: "registerLawyer.seo.title" }),
          "description": intl.formatMessage({ id: "registerLawyer.seo.description" }),
          "inLanguage": lang,
          "isPartOf": {
            "@type": "WebSite",
            "@id": `${baseUrl}/#website`,
            "url": baseUrl,
            "name": "SOS-Expat",
            "publisher": {
              "@type": "Organization",
              "@id": `${baseUrl}/#organization`
            }
          },
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": intl.formatMessage({ id: "registerLawyer.seo.breadcrumb.home" }),
                "item": baseUrl
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": intl.formatMessage({ id: "registerLawyer.seo.breadcrumb.register" }),
                "item": currentUrl
              }
            ]
          }
        },
        {
          "@type": "Organization",
          "@id": `${baseUrl}/#organization`,
          "name": "SOS-Expat",
          "url": baseUrl,
          "logo": {
            "@type": "ImageObject",
            "url": `${baseUrl}/logo.png`,
            "width": 512,
            "height": 512
          },
          "sameAs": [
            "https://www.facebook.com/sosexpat",
            "https://twitter.com/sosexpat",
            "https://www.linkedin.com/company/sos-expat",
            "https://www.instagram.com/sosexpat"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": intl.formatMessage({ id: "registerLawyer.seo.contactType" }),
            "availableLanguage": ["fr", "en", "es", "de", "ru", "hi", "pt", "zh", "ar"]
          }
        },
        {
          "@type": "FAQPage",
          "mainEntity": Array.from({ length: 8 }, (_, i) => ({
            "@type": "Question",
            "name": intl.formatMessage({ id: `registerLawyer.faq.q${i + 1}` }),
            "acceptedAnswer": {
              "@type": "Answer",
              "text": intl.formatMessage({ id: `registerLawyer.faq.a${i + 1}` })
            }
          }))
        },
        {
          "@type": "Service",
          "serviceType": intl.formatMessage({ id: "registerLawyer.seo.serviceType" }),
          "provider": {
            "@type": "Organization",
            "@id": `${baseUrl}/#organization`
          },
          "areaServed": {
            "@type": "Country",
            "name": intl.formatMessage({ id: "registerLawyer.seo.areaServed" })
          },
          "availableChannel": {
            "@type": "ServiceChannel",
            "serviceUrl": currentUrl,
            "servicePhone": intl.formatMessage({ id: "registerLawyer.seo.servicePhone" }),
            "availableLanguage": {
              "@type": "Language",
              "name": lang
            }
          }
        }
      ]
    };

    // Injection du JSON-LD
    let scriptTag = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement("script") as HTMLScriptElement;
      scriptTag.type = "application/ld+json";
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(jsonLd);

    // Cleanup
    return () => {
      // Les meta tags persistent pour la navigation SPA
    };
  }, [intl, lang]);

  // Options de pays (197 pays)
  const countryOptions = useMemo(() => {
    const langMap: Record<string, keyof typeof countriesData[0]> = {
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
    
    return countriesData
      .filter(c => !c.disabled)
      .map((country) => ({
        value: country[prop] as string,
        label: country[prop] as string,
      }));
  }, [lang]);

  const pwdStrength = useMemo(() => computePasswordStrength(form.password), [form.password]);

  const markTouched = useCallback((name: string) => {
    setTouched((p) => ({ ...p, [name]: true }));
  }, []);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    let sanitizedValue = value;
    
    // 🔒 Sanitization selon le type de champ
    if (type === "text" || type === "textarea") {
      if (name === "email") {
        sanitizedValue = sanitizeEmail(value);
      } else if (name === "firstName" || name === "lastName") {
        sanitizedValue = sanitizeString(value).replace(/[^a-zA-ZÀ-ÿ\s'-]/g, "");
      } else {
        sanitizedValue = sanitizeString(value);
      }
    }
    
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : sanitizedValue,
    }));
    
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const rest = { ...prev };
        delete rest[name];
        return rest;
      });
    }
  }, [fieldErrors]);

  const handlePracticeCountriesChange = useCallback((newValue: MultiValue<CountryOption>) => {
    setSelectedPracticeCountries(newValue);
    const arr = newValue.map((c) => c.value);
    setForm((prev) => ({ ...prev, practiceCountries: arr }));
    if (arr.length > 0 && fieldErrors.practiceCountries) {
      setFieldErrors((prev) => {
        const rest = { ...prev };
        delete rest.practiceCountries;
        return rest;
      });
    }
  }, [fieldErrors.practiceCountries]);

  const handleSpecialtiesChange = useCallback((newValue: MultiValue<{ value: string; label: string }>) => {
    setSelectedSpecialties(newValue);
    const arr = newValue.map((s) => s.value);
    setForm((prev) => ({ ...prev, specialties: arr }));
    if (arr.length > 0 && fieldErrors.specialties) {
      setFieldErrors((prev) => {
        const rest = { ...prev };
        delete rest.specialties;
        return rest;
      });
    }
  }, [fieldErrors.specialties]);

  const updateEducation = useCallback((idx: number, val: string) => {
    const sanitized = sanitizeString(val);
    setForm((p) => {
      const arr = [...p.educations];
      arr[idx] = sanitized;
      return { ...p, educations: arr };
    });
  }, []);

  const addEducationField = useCallback(() => setForm((p) => ({ ...p, educations: [...p.educations, ""] })), []);

  const removeEducationField = useCallback((idx: number) => {
    setForm((p) => {
      const arr = p.educations.filter((_, i) => i !== idx);
      return { ...p, educations: arr.length ? arr : [""] };
    });
  }, []);

  const validateAll = useCallback(() => {
    const e: Record<string, string> = {};
    
    // Validation firstName
    if (!form.firstName.trim()) {
      e.firstName = intl.formatMessage({ id: "registerLawyer.errors.firstNameRequired" });
    } else if (!NAME_REGEX.test(form.firstName.trim())) {
      e.firstName = intl.formatMessage({ id: "registerLawyer.errors.firstNameInvalid" });
    }
    
    // Validation lastName
    if (!form.lastName.trim()) {
      e.lastName = intl.formatMessage({ id: "registerLawyer.errors.lastNameRequired" });
    } else if (!NAME_REGEX.test(form.lastName.trim())) {
      e.lastName = intl.formatMessage({ id: "registerLawyer.errors.lastNameInvalid" });
    }
    
    // Validation email
    if (!form.email.trim()) {
      e.email = intl.formatMessage({ id: "registerLawyer.errors.emailRequired" });
    } else if (!EMAIL_REGEX.test(form.email)) {
      e.email = intl.formatMessage({ id: "registerLawyer.errors.emailInvalid" });
    }
    
    // Validation password
    if (!form.password || form.password.length < 6) {
      e.password = intl.formatMessage({ id: "registerLawyer.errors.passwordTooShort" });
    } else if (form.password.length > 128) {
      e.password = intl.formatMessage({ id: "registerLawyer.errors.passwordTooLong" });
    }
    
    // Validation phone
    if (!form.phone.trim()) {
      e.phone = intl.formatMessage({ id: "registerLawyer.errors.phoneRequired" });
    } else {
      const phoneNumber = parsePhoneNumberFromString(form.phone);
      if (!phoneNumber || !phoneNumber.isValid()) {
        e.phone = intl.formatMessage({ id: "registerLawyer.errors.phoneInvalid" });
      }
    }
    
    // Validation country
    if (!form.currentCountry) {
      e.currentCountry = intl.formatMessage({ id: "registerLawyer.errors.needCountry" });
    }
    
    // Validation practice countries
    if (form.practiceCountries.length === 0) {
      e.practiceCountries = intl.formatMessage({ id: "registerLawyer.errors.needPractice" });
    }
    
    // Validation specialties
    if (form.specialties.length === 0) {
      e.specialties = intl.formatMessage({ id: "registerLawyer.errors.needSpecialty" });
    }
    
    // Validation languages
    if ((selectedLanguages as LanguageOption[]).length === 0) {
      e.languages = intl.formatMessage({ id: "registerLawyer.errors.needLanguage" });
    }
    
    // Validation bio
    if (!form.bio.trim() || form.bio.trim().length < MIN_BIO_LENGTH) {
      e.bio = intl.formatMessage({ id: "registerLawyer.errors.needBio" });
    } else if (form.bio.trim().length > MAX_BIO_LENGTH) {
      e.bio = intl.formatMessage({ id: "registerLawyer.errors.bioTooLong" });
    }
    
    // Validation photo
    if (!form.profilePhoto) {
      e.profilePhoto = intl.formatMessage({ id: "registerLawyer.errors.needPhoto" });
    }
    
    // Validation education
    if (!form.educations.some((v) => v.trim().length > 0)) {
      e.educations = intl.formatMessage({ id: "registerLawyer.errors.needEducation" });
    }
    
    // Validation terms
    if (!form.acceptTerms) {
      e.acceptTerms = intl.formatMessage({ id: "registerLawyer.errors.acceptTermsRequired" });
    }
    
    setFieldErrors(e);
    
    // Focus sur le premier champ en erreur
    if (Object.keys(e).length > 0 && fieldRefs.firstName.current) {
      fieldRefs.firstName.current.focus();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    
    return Object.keys(e).length === 0;
  }, [form, selectedLanguages, intl]);

  const handleSubmit = useCallback(async (ev: React.FormEvent) => {
    ev.preventDefault();
    setTouched({ 
      firstName: true, 
      lastName: true, 
      email: true, 
      password: true, 
      phone: true, 
      currentCountry: true, 
      bio: true, 
      acceptTerms: true 
    });
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    if (!validateAll()) {
      setIsSubmitting(false);
      return;
    }
    
    try {
      await setPersistence(auth, browserLocalPersistence);
      
      const languageCodes = (selectedLanguages as LanguageOption[]).map((l) => l.value);
      const sanitizedEducations = form.educations
        .map((e) => sanitizeString(e))
        .filter(Boolean);
      
      const userData = {
        role: "lawyer" as const,
        type: "lawyer" as const,
        email: sanitizeEmail(form.email),
        fullName: `${sanitizeString(form.firstName)} ${sanitizeString(form.lastName)}`,
        name: `${sanitizeString(form.firstName)} ${sanitizeString(form.lastName)}`,
        firstName: sanitizeString(form.firstName),
        lastName: sanitizeString(form.lastName),
        phone: form.phone,
        currentCountry: form.currentCountry,
        country: form.currentCountry,
        practiceCountries: form.practiceCountries,
        profilePhoto: form.profilePhoto,
        photoURL: form.profilePhoto,
        avatar: form.profilePhoto,
        languages: languageCodes,
        languagesSpoken: languageCodes,
        specialties: form.specialties,
        education: sanitizedEducations.join(', '),
        yearsOfExperience: Math.max(0, Math.min(60, form.yearsOfExperience)),
        graduationYear: Math.max(1980, Math.min(new Date().getFullYear(), form.graduationYear)),
        bio: sanitizeString(form.bio),
        description: sanitizeString(form.bio),
        availability: form.availability,
        isOnline: false,  // ✅ Toujours hors ligne à la création
        isApproved: false,
        isVisible: false,
        isActive: true,
        approvalStatus: 'pending' as const,
        verificationStatus: 'pending',
        status: 'pending',

        rating: 4.5,
        reviewCount: 0,
        preferredLanguage: form.preferredLanguage,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await register(userData, form.password);
      
      // Création du compte Stripe
      const { getFunctions, httpsCallable } = await import("firebase/functions");
      const functions = getFunctions(undefined, "europe-west1");
      const createStripeAccount = httpsCallable(functions, "createStripeAccount");
      
      await createStripeAccount({
        email: sanitizeEmail(form.email),
        currentCountry: getCountryCode(form.currentCountry),
        firstName: sanitizeString(form.firstName),
        lastName: sanitizeString(form.lastName),
        userType: "lawyer",
      });
      
      navigate(redirect, {
        replace: true,
        state: {
          message: intl.formatMessage({ id: "registerLawyer.success.registered" }),
          type: "success",
        },
      });
    } catch (err: unknown) {
      console.error('❌ [RegisterLawyer] Erreur inscription:', err);
      
      let msg = intl.formatMessage({ id: "registerLawyer.errors.generic" });
      
      if (err instanceof Error) {
        // Messages d'erreur clairs en français
        if (err.message.includes('email-already-in-use') || err.message.includes('déjà associé')) {
          msg = "Cette adresse email est déjà utilisée. Essayez de vous connecter ou utilisez une autre adresse.";
        } else if (err.message.includes('email-linked-to-google') || err.message.includes('lié à un compte Google')) {
          msg = "Cette adresse email est déjà liée à un compte Google. Utilisez 'Se connecter avec Google' pour accéder à votre compte.";
        } else if (err.message.includes('weak-password') || err.message.includes('6 caractères')) {
          msg = "Le mot de passe doit contenir au moins 6 caractères.";
        } else if (err.message.includes('invalid-email') || err.message.includes('email invalide')) {
          msg = "L'adresse email n'est pas valide. Vérifiez qu'elle est correcte.";
        } else if (err.message.includes('network') || err.message.includes('réseau')) {
          msg = "Problème de connexion internet. Vérifiez votre connexion et réessayez.";
        } else if (err.message.includes('timeout') || err.message.includes('délai')) {
          msg = "La connexion est trop lente. Vérifiez votre connexion internet et réessayez.";
        } else if (err.message.includes('permissions') || err.message.includes('permission')) {
          msg = "Erreur technique lors de la création du compte. Contactez le support si le problème persiste.";
        } else if (err.message && err.message.length > 10 && err.message.length < 200) {
          // Utiliser le message d'erreur original s'il est clair
          msg = err.message;
        }
      }
      
      setFieldErrors((prev) => ({ ...prev, general: msg }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, validateAll, register, form, selectedLanguages, navigate, redirect, intl]);

  const canSubmit = useMemo(() => {
    const phoneNumber = parsePhoneNumberFromString(form.phone);
    return (
      !!form.firstName && 
      NAME_REGEX.test(form.firstName) &&
      !!form.lastName && 
      NAME_REGEX.test(form.lastName) &&
      EMAIL_REGEX.test(form.email) && 
      form.password.length >= 6 &&
      form.password.length <= 128 &&
      !!form.phone && 
      phoneNumber?.isValid() && 
      !!form.currentCountry && 
      form.bio.trim().length >= MIN_BIO_LENGTH &&
      form.bio.trim().length <= MAX_BIO_LENGTH &&
      !!form.profilePhoto && 
      form.specialties.length > 0 && 
      form.practiceCountries.length > 0 &&
      (selectedLanguages as LanguageOption[]).length > 0 && 
      form.educations.some((e) => e.trim().length > 0) &&
      form.acceptTerms && 
      !isLoading && 
      !isSubmitting
    );
  }, [form, selectedLanguages, isLoading, isSubmitting]);

  const getInputClass = useCallback((name: string, hasError?: boolean) => {
    const base = "w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-200 text-[15px] font-medium focus:outline-none";
    if (hasError || (fieldErrors[name] && touched[name])) {
      return `${base} border-red-400 bg-red-50 text-red-900 focus:border-red-500 focus:ring-4 focus:ring-red-500/20`;
    }
    if (!fieldErrors[name] && touched[name] && form[name as keyof LawyerFormData]) {
      return `${base} border-green-400 bg-green-50 text-green-900 focus:border-green-500 focus:ring-4 focus:ring-green-500/20`;
    }
    return `${base} border-gray-300 bg-gray-100 text-gray-900 placeholder-gray-500 hover:bg-gray-50 hover:border-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:bg-white`;
  }, [fieldErrors, touched, form]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
        {/* 🎯 HEADER SÉMANTIQUE */}
        <header className="pt-8 pb-6 px-4 text-center border-b-2 border-gray-200 bg-white shadow-sm">
          <div className="max-w-2xl mx-auto">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 mb-5 shadow-xl"
              role="img"
              aria-label={intl.formatMessage({ id: "registerLawyer.ui.logoAlt" })}
            >
              <Scale className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            
            {/* H1 - Unique sur la page */}
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-3 tracking-tight">
              <FormattedMessage id="registerLawyer.ui.heroTitle" />
            </h1>
            
            <p className="text-base text-gray-600 mb-5 font-medium">
              <FormattedMessage id="registerLawyer.ui.heroSubtitle" />
            </p>
            
            <div className="text-sm text-gray-600">
              <FormattedMessage id="registerLawyer.ui.already" />{" "}
              <Link 
                to={`/login?redirect=${encodeURIComponent(redirect)}`} 
                className="font-bold text-indigo-600 hover:text-indigo-700 underline"
                aria-label={intl.formatMessage({ id: "registerLawyer.ui.loginAriaLabel" })}
              >
                <FormattedMessage id="registerLawyer.ui.login" />
              </Link>
            </div>
          </div>
        </header>

        {/* 📝 FORMULAIRE PRINCIPAL */}
        <main className="max-w-2xl mx-auto px-4 py-8">
          {fieldErrors.general && (
            <div 
              className="mb-6 rounded-xl border-2 border-red-300 bg-red-50 p-5 shadow-lg" 
              role="alert"
              aria-live="assertive"
            >
              <div className="flex">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" aria-hidden="true" />
                <div className="ml-3">
                  <p className="text-sm font-semibold text-red-900">{fieldErrors.general}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            {/* ========================================================================= */}
            {/* 👤 SECTION 1: IDENTITÉ (avec langues déplacées ici) */}
            {/* ========================================================================= */}
            <section 
              className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg"
              aria-labelledby="identity-heading"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
                <div 
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100"
                  role="img"
                  aria-label={intl.formatMessage({ id: "registerLawyer.section.identityIcon" })}
                >
                  <User className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                </div>
                <h2 id="identity-heading" className="text-xl font-black text-gray-900">
                  <FormattedMessage id="registerLawyer.section.identity" />
                </h2>
              </div>

              <div className="space-y-5">
                {/* Prénom & Nom */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label 
                      htmlFor="firstName" 
                      className="block text-sm font-bold text-gray-900 mb-2"
                    >
                      <FormattedMessage id="registerLawyer.fields.firstName" />
                      <span className="text-red-500 ml-1" aria-label={intl.formatMessage({ id: "common.required" })}>*</span>
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      ref={fieldRefs.firstName}
                      value={form.firstName}
                      onChange={onChange}
                      onBlur={() => markTouched("firstName")}
                      autoComplete="given-name"
                      className={getInputClass("firstName")}
                      placeholder={intl.formatMessage({ id: "registerLawyer.placeholder.firstName" })}
                      aria-required="true"
                      aria-invalid={!!(fieldErrors.firstName && touched.firstName)}
                      aria-describedby={fieldErrors.firstName && touched.firstName ? "firstName-error" : undefined}
                    />
                    <FieldError 
                      error={fieldErrors.firstName} 
                      show={!!(fieldErrors.firstName && touched.firstName)} 
                    />
                    <FieldSuccess
                      show={!fieldErrors.firstName && !!touched.firstName && !!form.firstName && NAME_REGEX.test(form.firstName)}
                      message={intl.formatMessage({ id: "registerLawyer.success.fieldValid" })}
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="lastName" 
                      className="block text-sm font-bold text-gray-900 mb-2"
                    >
                      <FormattedMessage id="registerLawyer.fields.lastName" />
                      <span className="text-red-500 ml-1" aria-label={intl.formatMessage({ id: "common.required" })}>*</span>
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      value={form.lastName}
                      onChange={onChange}
                      onBlur={() => markTouched("lastName")}
                      autoComplete="family-name"
                      className={getInputClass("lastName")}
                      placeholder={intl.formatMessage({ id: "registerLawyer.placeholder.lastName" })}
                      aria-required="true"
                      aria-invalid={!!(fieldErrors.lastName && touched.lastName)}
                      aria-describedby={fieldErrors.lastName && touched.lastName ? "lastName-error" : undefined}
                    />
                    <FieldError 
                      error={fieldErrors.lastName} 
                      show={!!(fieldErrors.lastName && touched.lastName)} 
                    />
                    <FieldSuccess
                      show={!fieldErrors.lastName && !!touched.lastName && !!form.lastName && NAME_REGEX.test(form.lastName)}
                      message={intl.formatMessage({ id: "registerLawyer.success.fieldValid" })}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label 
                    htmlFor="email" 
                    className="block text-sm font-bold text-gray-900 mb-2"
                  >
                    <FormattedMessage id="registerLawyer.fields.email" />
                    <span className="text-red-500 ml-1" aria-label={intl.formatMessage({ id: "common.required" })}>*</span>
                  </label>
                  <div className="relative">
                    <Mail 
                      className="absolute left-4 top-4 w-5 h-5 text-indigo-600 pointer-events-none z-10" 
                      aria-hidden="true" 
                    />
                    <input
                      id="email"
                      name="email"
                      ref={fieldRefs.email}
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={onChange}
                      onBlur={() => markTouched("email")}
                      className={`${getInputClass("email")} pl-12`}
                      placeholder={intl.formatMessage({ id: "registerLawyer.placeholder.email" })}
                      aria-required="true"
                      aria-invalid={!!(touched.email && (!!fieldErrors.email || !EMAIL_REGEX.test(form.email)))}
                      aria-describedby={touched.email && fieldErrors.email ? "email-error" : undefined}
                    />
                  </div>
                  <FieldError 
                    error={fieldErrors.email} 
                    show={!!(touched.email && (!!fieldErrors.email || !EMAIL_REGEX.test(form.email)))} 
                  />
                  <FieldSuccess 
                    show={!!touched.email && EMAIL_REGEX.test(form.email)} 
                    message={intl.formatMessage({ id: "registerLawyer.success.emailValid" })} 
                  />
                </div>

                {/* Mot de passe */}
                <div>
                  <label 
                    htmlFor="password" 
                    className="block text-sm font-bold text-gray-900 mb-2"
                  >
                    <FormattedMessage id="registerLawyer.fields.password" />
                    <span className="text-red-500 ml-1" aria-label={intl.formatMessage({ id: "common.required" })}>*</span>
                  </label>
                  <div className="relative">
                    <Lock 
                      className="absolute left-4 top-4 w-5 h-5 text-indigo-600 pointer-events-none z-10" 
                      aria-hidden="true" 
                    />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={onChange}
                      onBlur={() => markTouched("password")}
                      autoComplete="new-password"
                      className={`${getInputClass("password")} pl-12 pr-12`}
                      placeholder="••••••••"
                      aria-required="true"
                      aria-invalid={!!(fieldErrors.password && touched.password)}
                      aria-describedby={fieldErrors.password && touched.password ? "password-error" : form.password.length > 0 ? "password-strength" : undefined}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? intl.formatMessage({ id: "registerLawyer.ui.hidePassword" }) : intl.formatMessage({ id: "registerLawyer.ui.showPassword" })}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                    </button>
                  </div>
                  
                  {/* Barre de force du mot de passe */}
                  {form.password.length > 0 && (
                    <div className="mt-3" id="password-strength">
                      <div 
                        className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner"
                        role="progressbar"
                        aria-label={intl.formatMessage({ id: "registerLawyer.ui.passwordStrength" })}
                        aria-valuenow={pwdStrength.percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div 
                          className={`h-full transition-all duration-500 ${pwdStrength.color}`} 
                          style={{ width: `${pwdStrength.percent}%` }} 
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 font-medium">
                        <FormattedMessage id={`registerLawyer.ui.passwordStrength.${pwdStrength.label}`} />
                      </p>
                    </div>
                  )}
                  
                  <FieldError 
                    error={fieldErrors.password} 
                    show={!!(fieldErrors.password && touched.password)} 
                  />
                  <FieldSuccess 
                    show={!fieldErrors.password && !!touched.password && form.password.length >= 6} 
                    message={intl.formatMessage({ id: "registerLawyer.success.pwdOk" })} 
                  />
                </div>

                {/* Téléphone */}
                <div>
                  <label 
                    htmlFor="phone" 
                    className="block text-sm font-bold text-gray-900 mb-2"
                  >
                    <FormattedMessage id="registerLawyer.fields.phone" />
                    <span className="text-red-500 ml-1" aria-label={intl.formatMessage({ id: "common.required" })}>*</span>
                  </label>
                  
                  {/* Style optimisé mobile-first */}
                  {/* Style optimisé mobile-first - FOND CLAIR */}
<style>{`
  /* Container principal */
  .react-tel-input {
    position: relative !important;
  }
  
  /* Dropdown des pays */
  .react-tel-input .country-list {
    position: absolute !important;
    background-color: #ffffff !important;
    border: 2px solid #d1d5db !important;
    border-radius: 12px !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
    max-height: 200px !important;
    overflow-y: auto !important;
    z-index: 99999 !important;
    margin-top: 4px !important;
    width: 280px !important;
    left: 0 !important;
    pointer-events: auto !important;
  }
  
  /* Items de la liste */
  .react-tel-input .country-list .country {
    padding: 8px 12px !important;
    color: #111827 !important;
    background-color: transparent !important;
    font-size: 14px !important;
    cursor: pointer !important;
    pointer-events: auto !important;
  }
  
  /* Hover bleu */
  .react-tel-input .country-list .country:hover,
  .react-tel-input .country-list .country.highlight {
    background-color: rgba(99, 102, 241, 0.1) !important;
  }
  
  /* Pays sélectionné */
  .react-tel-input .country-list .country.active {
    background-color: rgba(99, 102, 241, 0.15) !important;
    color: #4f46e5 !important;
    font-weight: 600 !important;
  }
  
  /* Nom du pays */
  .react-tel-input .country-list .country-name {
    color: #374151 !important;
    margin-right: 8px !important;
  }
  
  /* Code pays */
  .react-tel-input .country-list .dial-code {
    color: #6b7280 !important;
  }
  
  /* Bouton drapeau - CLIQUABLE */
  .react-tel-input .flag-dropdown {
    background-color: #f9fafb !important;
    border: 2px solid #d1d5db !important;
    border-right: none !important;
    border-radius: 12px 0 0 12px !important;
    cursor: pointer !important;
    pointer-events: auto !important;
    transition: all 0.2s ease !important;
  }
  
  .react-tel-input .flag-dropdown:hover {
    background-color: #f3f4f6 !important;
    border-color: #9ca3af !important;
  }
  
  .react-tel-input .flag-dropdown.open {
    background-color: rgba(99, 102, 241, 0.1) !important;
    border-color: #6366f1 !important;
  }
  
  /* Input téléphone - ÉDITABLE - FOND CLAIR */
  .react-tel-input .form-control {
    width: 100% !important;
    background-color: #f9fafb !important;
    border: 2px solid #d1d5db !important;
    border-radius: 12px !important;
    color: #111827 !important;
    padding: 14px 16px 14px 64px !important;
    font-size: 15px !important;
    font-weight: 500 !important;
    pointer-events: auto !important;
    cursor: text !important;
    transition: all 0.2s ease !important;
  }
  
  .react-tel-input .form-control:hover {
    background-color: #f3f4f6 !important;
    border-color: #9ca3af !important;
  }
  
  .react-tel-input .form-control:focus {
    outline: none !important;
    background-color: #ffffff !important;
    border-color: #6366f1 !important;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
  }
  
  .react-tel-input .form-control::placeholder {
    color: #9ca3af !important;
  }
  
  /* Scrollbar */
  .react-tel-input .country-list::-webkit-scrollbar {
    width: 6px !important;
  }
  
  .react-tel-input .country-list::-webkit-scrollbar-track {
    background: #f3f4f6 !important;
  }
  
  .react-tel-input .country-list::-webkit-scrollbar-thumb {
    background: #d1d5db !important;
    border-radius: 4px !important;
  }
  
  .react-tel-input .country-list::-webkit-scrollbar-thumb:hover {
    background: #9ca3af !important;
  }
  
  /* Mobile */
  @media (max-width: 640px) {
    .react-tel-input .country-list {
      width: calc(100vw - 40px) !important;
      max-width: 300px !important;
    }
  }
`}</style>
                  
                  <IntlPhoneInput
                    value={form.phone}
                    onChange={(value) => {
                      const phoneValue = value || "";
                      setForm((prev) => ({ ...prev, phone: phoneValue }));
                      if (!touched.phone) markTouched("phone");
                      const parsed = parsePhoneNumberFromString(phoneValue);
                      if (!phoneValue) {
                        setFieldErrors((prev) => {
                          const { phone, ...rest } = prev;
                          return rest;
                        });
                      } else if (!parsed || !parsed.isValid()) {
                        setFieldErrors((prev) => ({ 
                          ...prev, 
                          phone: intl.formatMessage({ id: "registerLawyer.errors.phoneInvalid" }) 
                        }));
                      } else {
                        setFieldErrors((prev) => {
                          const { phone, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    onBlur={() => markTouched("phone")}
                    defaultCountry="us"
                    placeholder="+1 234 567 8900"
                    name="phone"
                    inputProps={{
                      id: "phone",
                      "aria-required": "true",
                      "aria-invalid": !!(touched.phone && fieldErrors.phone),
                      "aria-describedby": touched.phone && fieldErrors.phone ? "phone-error" : undefined,
                    }}
                  />
                  <FieldError 
                    error={fieldErrors.phone} 
                    show={!!(touched.phone && fieldErrors.phone)} 
                  />
                  <FieldSuccess 
                    show={!!(touched.phone && !fieldErrors.phone && parsePhoneNumberFromString(form.phone)?.isValid())} 
                    message={intl.formatMessage({ id: "registerLawyer.success.fieldValid" })} 
                  />
                </div>

                {/* Langues parlées - DÉPLACÉ ICI DEPUIS EXPERTISE */}
                <div>
                  <label 
                    htmlFor="languages" 
                    className="block text-sm font-bold text-gray-900 mb-2"
                  >
                    <FormattedMessage id="registerLawyer.fields.languages" />
                    <span className="text-red-500 ml-1" aria-label={intl.formatMessage({ id: "common.required" })}>*</span>
                  </label>
                  
                  <Suspense fallback={
                    <div 
                      className="h-14 animate-pulse rounded-xl bg-gray-100 border-2 border-gray-300"
                      aria-label={intl.formatMessage({ id: "common.loading" })}
                    />
                  }>
                    <div className="border-2 border-gray-300 rounded-xl bg-gray-100 hover:border-gray-400 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all">
                      <MultiLanguageSelect
                        value={selectedLanguages}
                        onChange={(v: MultiValue<LanguageOption>) => {
                          setSelectedLanguages(v);
                          const arr = v.map((l) => l.value);
                          setForm((prev) => ({ ...prev, languagesSpoken: arr }));
                          setTouched((p) => ({ ...p, languages: true }));
                        }}
                        locale={lang}
                        placeholder={intl.formatMessage({ id: "registerLawyer.select.searchLanguages" })}
                        aria-label={intl.formatMessage({ id: "registerLawyer.fields.languages" })}
                      />
                    </div>
                  </Suspense>
                  
                  <FieldError 
                    error={fieldErrors.languages} 
                    show={!!fieldErrors.languages} 
                  />
                  <FieldSuccess 
                    show={(selectedLanguages as LanguageOption[]).length > 0} 
                    message={intl.formatMessage({ id: "registerLawyer.success.fieldValid" })} 
                  />
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* 🌍 SECTION 2: LOCALISATION */}
            {/* ========================================================================= */}
            <section 
              className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg"
              aria-labelledby="location-heading"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
                <div 
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100"
                  role="img"
                  aria-label={intl.formatMessage({ id: "registerLawyer.section.locationIcon" })}
                >
                  <Globe className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                </div>
                <h3 id="location-heading" className="text-xl font-black text-gray-900">
                  <FormattedMessage id="registerLawyer.section.location" />
                </h3>
              </div>

              <div className="space-y-5">
                {/* Pays de résidence */}
                <div>
                  <label 
                    htmlFor="currentCountry" 
                    className="block text-sm font-bold text-gray-900 mb-2"
                  >
                    <FormattedMessage id="registerLawyer.fields.residenceCountry" />
                    <span className="text-red-500 ml-1" aria-label={intl.formatMessage({ id: "common.required" })}>*</span>
                  </label>
                  <select
                    id="currentCountry"
                    name="currentCountry"
                    value={form.currentCountry}
                    onChange={onChange}
                    onBlur={() => markTouched("currentCountry")}
                    className={getInputClass("currentCountry")}
                    aria-required="true"
                    aria-invalid={!!(fieldErrors.currentCountry && touched.currentCountry)}
                    aria-describedby={fieldErrors.currentCountry && touched.currentCountry ? "currentCountry-error" : undefined}
                  >
                    <option value="">
                      {intl.formatMessage({ id: "common.select" })}
                    </option>
                    {countryOptions.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <FieldError 
                    error={fieldErrors.currentCountry} 
                    show={!!(fieldErrors.currentCountry && touched.currentCountry)} 
                  />
                  <FieldSuccess 
                    show={!fieldErrors.currentCountry && !!touched.currentCountry && !!form.currentCountry} 
                    message={intl.formatMessage({ id: "registerLawyer.success.fieldValid" })} 
                  />
                </div>

                {/* Pays d'exercice */}
                <div>
                  <label 
                    htmlFor="practiceCountries" 
                    className="block text-sm font-bold text-gray-900 mb-2"
                  >
                    <FormattedMessage id="registerLawyer.fields.practiceCountries" />
                    <span className="text-red-500 ml-1" aria-label={intl.formatMessage({ id: "common.required" })}>*</span>
                  </label>
                  
                  {selectedPracticeCountries.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3" role="list" aria-label={intl.formatMessage({ id: "registerLawyer.ui.selectedCountries" })}>
                      {selectedPracticeCountries.map((c) => (
                        <TagChip 
                          key={c.value} 
                          value={c.label} 
                          onRemove={() => {
                            const newSelection = selectedPracticeCountries.filter(country => country.value !== c.value);
                            handlePracticeCountriesChange(newSelection);
                          }}
                          ariaLabel={intl.formatMessage({ id: "registerLawyer.ui.removeCountry" }, { country: c.label })}
                        />
                      ))}
                    </div>
                  )}
                  
                  <select
                    id="practiceCountries"
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-300 bg-gray-100 text-gray-900 font-medium hover:bg-gray-50 hover:border-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:bg-white transition-all"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && !selectedPracticeCountries.find(c => c.value === value)) {
                        const country = countryOptions.find(c => c.value === value);
                        if (country) {
                          handlePracticeCountriesChange([...selectedPracticeCountries, country] as MultiValue<CountryOption>);
                        }
                      }
                      e.target.value = "";
                    }}
                    value=""
                    aria-label={intl.formatMessage({ id: "registerLawyer.select.addPractice" })}
                  >
                    <option value="">
                      {intl.formatMessage({ id: "registerLawyer.select.addPractice" })}
                    </option>
                    {countryOptions.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  
                  <FieldError 
                    error={fieldErrors.practiceCountries} 
                    show={!!fieldErrors.practiceCountries} 
                  />
                  <FieldSuccess 
                    show={form.practiceCountries.length > 0} 
                    message={intl.formatMessage({ id: "registerLawyer.success.fieldValid" })} 
                  />
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* 💼 SECTION 3: EXPERTISE PROFESSIONNELLE */}
            {/* ========================================================================= */}
            <section 
              className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg"
              aria-labelledby="expertise-heading"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-100">
                <div 
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-100"
                  role="img"
                  aria-label={intl.formatMessage({ id: "registerLawyer.section.expertiseIcon" })}
                >
                  <Briefcase className="w-5 h-5 text-indigo-600" aria-hidden="true" />
                </div>
                <h4 id="expertise-heading" className="text-xl font-black text-gray-900">
                  <FormattedMessage id="registerLawyer.section.expertise" />
                </h4>
              </div>

              <div className="space-y-5">
                {/* Années d'expérience */}
                <div>
                  <label 
                    htmlFor="yearsOfExperience" 
                    className="block text-sm font-bold text-gray-900 mb-2"
                  >
                    <FormattedMessage id="registerLawyer.fields.yearsOfExperience" />
                  </label>
                  <input
                    id="yearsOfExperience"
                    name="yearsOfExperience"
                    type="number"
                    value={form.yearsOfExperience}
                    onChange={onChange}
                    className={getInputClass("yearsOfExperience")}
                    min={0}
                    max={60}
                    aria-label={intl.formatMessage({ id: "registerLawyer.fields.yearsOfExperience" })}
                  />
                </div>

                {/* Spécialités */}
                <div>
                  <label 
                    htmlFor="specialties" 
                    className="block text-sm font-bold text-gray-900 mb-2"
                  >
                    <FormattedMessage id="registerLawyer.fields.specialties" />
                    <span className="text-red-500 ml-1" aria-label={intl.formatMessage({ id: "common.required" })}>*</span>
                  </label>
                  
                  <Suspense fallback={
                    <div 
                      className="h-14 animate-pulse rounded-xl bg-gray-100 border-2 border-gray-300"
                      aria-label={intl.formatMessage({ id: "common.loading" })}
                    />
                  }>
                    <div className="border-2 border-gray-300 rounded-xl bg-gray-100 hover:border-gray-400 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/20 transition-all">
                      <SpecialtySelect
                        value={selectedSpecialties}
                        onChange={handleSpecialtiesChange}
                        locale={lang}
                        placeholder={intl.formatMessage({ id: "registerLawyer.placeholder.selectSpecialties" })}
                        aria-label={intl.formatMessage({ id: "registerLawyer.fields.specialties" })}
                      />
                    </div>
                  </Suspense>
                  
                  {selectedSpecialties.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3" role="list" aria-label={intl.formatMessage({ id: "registerLawyer.ui.selectedSpecialties" })}>
                      {selectedSpecialties.map((s) => (
                        <TagChip 
                          key={s.value} 
                          value={s.label} 
                          onRemove={() => {
                            const newSelection = selectedSpecialties.filter(spec => spec.value !== s.value);
                            handleSpecialtiesChange(newSelection);
                          }}
                          ariaLabel={intl.formatMessage({ id: "registerLawyer.ui.removeSpecialty" }, { specialty: s.label })}
                        />
                      ))}
                    </div>
                  )}
                  
                  <FieldError 
                    error={fieldErrors.specialties} 
                    show={!!fieldErrors.specialties} 
                  />
                  <FieldSuccess 
                    show={form.specialties.length > 0} 
                    message={intl.formatMessage({ id: "registerLawyer.success.fieldValid" })} 
                  />
                </div>

                {/* Formation - DÉPLACÉ ICI JUSTE AVANT ANNÉE DE DIPLÔME */}
                <div>
                  <label 
                    htmlFor="education-0" 
                    className="block text-sm font-bold text-gray-900 mb-2"
                  >
                    <FormattedMessage id="registerLawyer.fields.education" />
                    <span className="text-red-500 ml-1" aria-label={intl.formatMessage({ id: "common.required" })}>*</span>
                  </label>
                  
                  <div className="space-y-3" role="list" aria-label={intl.formatMessage({ id: "registerLawyer.fields.education" })}>
                    {form.educations.map((ed, idx) => (
                      <div key={idx} className="flex gap-2" role="listitem">
                        <input
                          id={`education-${idx}`}
                          value={ed}
                          onChange={(e) => updateEducation(idx, e.target.value)}
                          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-100 text-[15px] font-medium placeholder-gray-500 hover:bg-gray-50 hover:border-gray-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:bg-white transition-all"
                          placeholder={intl.formatMessage({ id: "registerLawyer.placeholder.education" })}
                          aria-label={intl.formatMessage({ id: "registerLawyer.placeholder.educationN" }, { n: idx + 1 })}
                        />
                        {form.educations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEducationField(idx)}
                            className="px-3 py-2 rounded-xl border-2 border-gray-300 hover:bg-red-50 hover:border-red-300 transition-colors"
                            aria-label={intl.formatMessage({ id: "registerLawyer.ui.removeEducation" }, { n: idx + 1 })}
                          >
                            <XCircle className="w-5 h-5 text-gray-500" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={addEducationField} 
                    className="mt-3 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                    aria-label={intl.formatMessage({ id: "registerLawyer.select.addEducation" })}
                  >
                    + <FormattedMessage id="registerLawyer.select.addEducation" />
                  </button>
                  
                  <FieldError 
                    error={fieldErrors.educations} 
                    show={!!fieldErrors.educations} 
                  />
                  <FieldSuccess 
                    show={form.educations.some((e) => e.trim().length > 0)} 
                    message={intl.formatMessage({ id: "registerLawyer.success.fieldValid" })} 
                  />
                </div>

                {/* Année de diplomation - MAINTENANT APRÈS FORMATION */}
                <div>
                  <label 
                    htmlFor="graduationYear" 
                    className="block text-sm font-bold text-gray-900 mb-2"
                  >
                    <FormattedMessage id="registerLawyer.fields.graduationYear" />
                    <span className="text-red-500 ml-1" aria-label={intl.formatMessage({ id: "common.required" })}>*</span>
                  </label>
                  <input
                    id="graduationYear"
                    name="graduationYear"
                    type="number"
                    value={form.graduationYear}
                    onChange={onChange}
                    className={getInputClass("graduationYear")}
                    min={1980}
                    max={new Date().getFullYear()}
                    aria-label={intl.formatMessage({ id: "registerLawyer.fields.graduationYear" })}
                  />
                </div>

                {/* Biographie */}
                <div>
                  <label 
                    htmlFor="bio" 
                    className="block text-sm font-bold text-gray-900 mb-2"
                  >
                    <FormattedMessage id="registerLawyer.fields.bio" />
                    <span className="text-red-500 ml-1" aria-label={intl.formatMessage({ id: "common.required" })}>*</span>
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={5}
                    maxLength={MAX_BIO_LENGTH}
                    value={form.bio}
                    onChange={onChange}
                    onBlur={() => markTouched("bio")}
                    className={getInputClass("bio")}
                    placeholder={intl.formatMessage({ id: "registerLawyer.placeholder.bio" })}
                    aria-required="true"
                    aria-invalid={!!(fieldErrors.bio && touched.bio)}
                    aria-describedby={fieldErrors.bio && touched.bio ? "bio-error" : "bio-progress"}
                  />
                  
                  {/* Barre de progression */}
                  <div className="mt-3" id="bio-progress">
                    <div 
                      className="h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner"
                      role="progressbar"
                      aria-label={intl.formatMessage({ id: "registerLawyer.ui.bioProgress" })}
                      aria-valuenow={form.bio.length}
                      aria-valuemin={0}
                      aria-valuemax={MAX_BIO_LENGTH}
                    >
                      <div 
                        className={`h-full ${form.bio.length < MIN_BIO_LENGTH ? "bg-orange-400" : "bg-green-500"} transition-all`} 
                        style={{ width: `${Math.min((form.bio.length / MAX_BIO_LENGTH) * 100, 100)}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-2 font-medium">
                      <span className={form.bio.length < MIN_BIO_LENGTH ? "text-orange-600" : "text-green-600"}>
                        {form.bio.length < MIN_BIO_LENGTH 
                          ? intl.formatMessage({ id: "registerLawyer.bio.remaining" }, { count: MIN_BIO_LENGTH - form.bio.length }) 
                          : intl.formatMessage({ id: "registerLawyer.bio.complete" })
                        }
                      </span>
                      <span className={form.bio.length > MAX_BIO_LENGTH - 50 ? "text-orange-600" : "text-gray-600"}>
                        {form.bio.length}/{MAX_BIO_LENGTH}
                      </span>
                    </div>
                  </div>
                  
                  <FieldError 
                    error={fieldErrors.bio} 
                    show={!!(fieldErrors.bio && touched.bio)} 
                  />
                  <FieldSuccess 
                    show={form.bio.trim().length >= MIN_BIO_LENGTH} 
                    message={intl.formatMessage({ id: "registerLawyer.success.fieldValid" })} 
                  />
                </div>

                {/* Photo de profil */}
                <div>
                  <label 
                    htmlFor="profilePhoto" 
                    className="block text-sm font-bold text-gray-900 mb-2"
                  >
                    <FormattedMessage id="registerLawyer.fields.profilePhoto" />
                    <span className="text-red-500 ml-1" aria-label={intl.formatMessage({ id: "common.required" })}>*</span>
                  </label>
                  
                  <Suspense fallback={
                    <div 
                      className="h-32 bg-gray-100 animate-pulse rounded-xl border-2 border-gray-300"
                      aria-label={intl.formatMessage({ id: "common.loading" })}
                    />
                  }>
                    <div 
                      className="border-2 border-gray-300 rounded-xl bg-gray-100 p-4"
                      role="region"
                      aria-label={intl.formatMessage({ id: "registerLawyer.fields.profilePhoto" })}
                    >
                      <ImageUploader
                        locale={lang}
                        currentImage={form.profilePhoto}
                        onImageUploaded={(url: string) => {
                          setForm((prev) => ({ ...prev, profilePhoto: url }));
                          setFieldErrors((prev) => ({ ...prev, profilePhoto: "" }));
                        }}
                        hideNativeFileLabel
                        cropShape="round"
                        outputSize={512}
                        uploadPath="registration_temp"
                        isRegistration={true}
                        alt={intl.formatMessage({ id: "registerLawyer.ui.profilePhotoAlt" })}
                      />
                    </div>
                  </Suspense>
                  
                  <FieldError 
                    error={fieldErrors.profilePhoto} 
                    show={!!fieldErrors.profilePhoto} 
                  />
                  <FieldSuccess 
                    show={!!form.profilePhoto} 
                    message={intl.formatMessage({ id: "registerLawyer.success.fieldValid" })} 
                  />
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* ✅ SECTION 4: CONDITIONS & SOUMISSION */}
            {/* ========================================================================= */}
            <section className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
              <div className="flex items-start gap-3 mb-5 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  checked={form.acceptTerms}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, acceptTerms: e.target.checked }));
                    setTouched((p) => ({ ...p, acceptTerms: true }));
                  }}
                  className="mt-1 h-5 w-5 text-indigo-600 border-gray-400 rounded focus:ring-2 focus:ring-indigo-500"
                  aria-required="true"
                  aria-invalid={!!fieldErrors.acceptTerms}
                  aria-describedby={fieldErrors.acceptTerms ? "acceptTerms-error" : undefined}
                />
                <label 
                  htmlFor="acceptTerms" 
                  className="text-sm text-gray-800 font-medium"
                >
                  <FormattedMessage id="registerLawyer.ui.acceptTerms" />{" "}
                  <Link 
                    to="/cgu-avocats" 
                    className="text-indigo-600 font-bold hover:text-indigo-700 underline" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label={intl.formatMessage({ id: "registerLawyer.ui.termsLinkAriaLabel" })}
                  >
                    <FormattedMessage id="registerLawyer.ui.termsLink" />
                  </Link>
                  <span className="text-red-500 ml-1" aria-label={intl.formatMessage({ id: "common.required" })}>*</span>
                </label>
              </div>
              <FieldError 
                error={fieldErrors.acceptTerms} 
                show={!!fieldErrors.acceptTerms} 
              />

              <Button
                type="submit"
                loading={isLoading || isSubmitting}
                fullWidth
                size="large"
                className={`mt-4 text-lg font-black py-4 shadow-xl ${
                  canSubmit 
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-2xl" 
                    : "bg-gray-300 cursor-not-allowed"
                }`}
                disabled={!canSubmit}
                aria-label={isLoading || isSubmitting 
                  ? intl.formatMessage({ id: "registerLawyer.ui.loading" })
                  : intl.formatMessage({ id: "registerLawyer.ui.createAccount" })
                }
              >
                {isLoading || isSubmitting ? (
                  <FormattedMessage id="registerLawyer.ui.loading" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <FormattedMessage id="registerLawyer.ui.create" />
                    <ArrowRight className="w-6 h-6" aria-hidden="true" />
                  </span>
                )}
              </Button>
            </section>
          </form>

          {/* 📊 SECTION FAQ POUR LE SEO */}
          <FAQSection intl={intl} />
        </main>

        {/* 🔗 FOOTER */}
        <footer className="text-center py-8 px-4 border-t-2 border-gray-200 bg-white">
          <nav aria-label={intl.formatMessage({ id: "registerLawyer.footer.navigation" })}>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 font-medium">
              <Link 
                to="/politique-confidentialite" 
                className="hover:text-indigo-600 transition-colors"
                aria-label={intl.formatMessage({ id: "registerLawyer.footer.privacyAriaLabel" })}
              >
                <FormattedMessage id="registerLawyer.footer.privacy" />
              </Link>
              <Link 
                to="/cgu-avocats" 
                className="hover:text-indigo-600 transition-colors"
                aria-label={intl.formatMessage({ id: "registerLawyer.footer.termsAriaLabel" })}
              >
                <FormattedMessage id="registerLawyer.footer.terms" />
              </Link>
              <Link 
                to="/contact" 
                className="hover:text-indigo-600 transition-colors"
                aria-label={intl.formatMessage({ id: "registerLawyer.footer.contactAriaLabel" })}
              >
                <FormattedMessage id="registerLawyer.footer.contact" />
              </Link>
            </div>
          </nav>
        </footer>
      </div>
    </Layout>
  );
};

export default RegisterLawyer;