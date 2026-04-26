/**
 * PartnerLanding - B2B Premium Landing Page
 *
 * Dark premium design with cyan/blue identity for Partners.
 * Mobile-first, accessible, glassmorphism cards, micro-animations.
 * Targets: B2B partners — real estate agencies, banks, insurance companies,
 * relocation firms, law firms, associations, media, international corporations.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functionsAffiliate } from '@/config/firebase';
import Layout from '@/components/layout/Layout';
import HreflangLinks from '@/multilingual-system/components/HrefLang/HreflangLinks';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import { getLocaleString, getTranslatedRouteSlug } from '@/multilingual-system/core/routing/localeRoutes';
import { useApp } from '@/contexts/AppContext';
import { countriesData } from '@/data/countries';
import { getCountryName } from '@/utils/countryUtils';
import { languagesData, type SupportedLocale } from '@/data/languages-spoken';
import {
  ArrowRight,
  Check,
  Plus,
  Minus,
  Globe,
  DollarSign,
  BarChart3,
  Users,
  Shield,
  TrendingUp,
  Zap,
  HeadphonesIcon,
  Loader2,
  ExternalLink,
  Briefcase,
  Mail,
  Clock,
  CreditCard,
  Building2,
  Plane,
  Scale,
  Heart,
  GraduationCap,
  Handshake,
  MessageSquare,
  Code,
  Languages,
  PhoneCall,
  Landmark,
  Truck,
  Network,
  FileText,
  Lock,
  Receipt,
  Activity,
  Layers,
  PieChart,
} from 'lucide-react';

// ============================================================================
// STYLES
// ============================================================================
const globalStyles = `
  @media (max-width: 768px) {
    .partner-landing h1 { font-size: 2.25rem !important; }
    .partner-landing h2 { font-size: 1.875rem !important; }
    .partner-landing h3 { font-size: 1.5rem !important; }
  }
  .partner-landing h1,
  .partner-landing h2,
  .partner-landing h3 {
    color: white;
  }
  .partner-landing h1 span,
  .partner-landing h2 span,
  .partner-landing h3 span {
    font-size: inherit;
  }
  @keyframes pulse-glow-cyan {
    0%, 100% { box-shadow: 0 0 20px rgba(6, 182, 212, 0.4); }
    50% { box-shadow: 0 0 40px rgba(6, 182, 212, 0.6); }
  }
  .animate-pulse-glow-cyan { animation: pulse-glow-cyan 2s ease-in-out infinite; }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  .animate-float { animation: float 3s ease-in-out infinite; }
  @keyframes count-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-count-up { animation: count-up 0.6s ease-out forwards; }
  .section-content {
    padding: 3rem 1rem;
    position: relative;
  }
  @media (min-width: 640px) { .section-content { padding: 4rem 1.5rem; } }
  @media (min-width: 1024px) { .section-content { padding: 6rem 2rem; } }
  .section-lazy {
    content-visibility: auto;
    contain-intrinsic-size: auto 600px;
  }
  @media (prefers-reduced-motion: reduce) {
    .animate-bounce,
    .animate-pulse-glow-cyan,
    .animate-float,
    .animate-count-up,
    .transition-all,
    .transition-colors,
    .transition-transform {
      animation: none !important;
      transition: none !important;
    }
  }
  .glass-card {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .glass-card:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(6, 182, 212, 0.2);
  }
`;

// ============================================================================
// CONSTANTS
// ============================================================================
// Backend SupportedPartnerLanguage uses 'zh' (NOT 'ch'). The form sends 'zh'
// to satisfy backend validation, even though the app's UI locale uses 'ch'.
const FORM_LANGUAGES = ['fr', 'en', 'es', 'de', 'pt', 'ar', 'zh', 'ru', 'hi'] as const;
type FormLanguage = typeof FORM_LANGUAGES[number];

// Map app UI locale (which uses 'ch' for Chinese) to the locale field used by
// countriesData / languagesData lookups.
const COUNTRY_NAME_LOCALES = ['fr', 'en', 'es', 'de', 'pt', 'zh', 'ar', 'ru'] as const;
type CountryNameLocale = typeof COUNTRY_NAME_LOCALES[number];

function uiLocaleToCountryLocale(locale: string): CountryNameLocale {
  if (locale === 'ch') return 'zh';
  if ((COUNTRY_NAME_LOCALES as readonly string[]).includes(locale)) {
    return locale as CountryNameLocale;
  }
  return 'en';
}

function uiLocaleToLanguageLabelLocale(locale: string): SupportedLocale {
  // languagesData uses 'ch' (matches the app convention).
  const supported: SupportedLocale[] = ['fr', 'en', 'es', 'ru', 'de', 'hi', 'pt', 'ch', 'ar'];
  return (supported.includes(locale as SupportedLocale) ? locale : 'en') as SupportedLocale;
}

// ============================================================================
// SEO CONSTANTS (same pattern as Home.tsx for unification)
// ============================================================================
const SEO_CONSTANTS = {
  SITE_NAME: 'SOS Expat',
  BASE_URL: 'https://sos-expat.com',
  LOGO_URL: 'https://sos-expat.com/sos-logo.webp',
  OG_IMAGE_URL: 'https://sos-expat.com/og-image.webp',
  TWITTER_HANDLE: '@sosexpat',
  SOCIAL: {
    facebook: 'https://www.facebook.com/sosexpat',
    linkedin: 'https://www.linkedin.com/company/sos-expat-com/',
    twitter: 'https://twitter.com/sosexpat',
    instagram: 'https://www.instagram.com/sosexpat',
  },
} as const;

const OG_LOCALES: Record<string, string> = {
  fr: 'fr_FR', en: 'en_US', es: 'es_ES', de: 'de_DE',
  pt: 'pt_PT', ru: 'ru_RU', zh: 'zh_CN', ch: 'zh_CN', ar: 'ar_SA', hi: 'hi_IN',
};

const SUPPORTED_LANGS = ['fr', 'en', 'es', 'de', 'pt', 'ru', 'ch', 'ar', 'hi'] as const;

// ============================================================================
// FAQ ACCORDION
// ============================================================================
const FAQItem: React.FC<{
  questionId: string;
  answerId: string;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ questionId, answerId, isOpen, onToggle }) => {
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden transition-colors duration-200 hover:border-white/20">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left min-h-[48px]"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${answerId}`}
      >
        <span className="text-base sm:text-lg font-semibold text-white pr-2">
          <FormattedMessage id={questionId} />
        </span>
        <span className={`flex flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full items-center justify-center transition-all duration-300 ${isOpen ? 'bg-cyan-500 text-white' : 'bg-white/10 text-cyan-400'}`}>
          {isOpen ? (
            <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </span>
      </button>
      <div
        id={`faq-answer-${answerId}`}
        role="region"
        aria-labelledby={questionId}
        className={`overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-sm sm:text-base text-gray-400 leading-relaxed">
          <FormattedMessage id={answerId} />
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TRUSTED PARTNERS SECTION
// ============================================================================
const TrustedPartnersSection: React.FC = () => {
  const [partners, setPartners] = useState<Array<{
    id: string;
    websiteName: string;
    websiteLogo?: string;
    websiteUrl: string;
  }>>([]);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const q = query(
          collection(db, 'partners'),
          where('isVisible', '==', true),
          where('status', '==', 'active')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          websiteName: doc.data().websiteName || '',
          websiteLogo: doc.data().websiteLogo,
          websiteUrl: doc.data().websiteUrl || '',
        }));
        setPartners(data);
      } catch {
        // silent
      }
    };
    fetchPartners();
  }, []);

  if (partners.length === 0) return null;

  return (
    <section className="section-content section-lazy" aria-label="Trusted partners">
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400 mb-4">
          <FormattedMessage id="partner.landing.v2.trust.overline" defaultMessage="Partenaires actifs" />
        </p>
        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          <FormattedMessage id="partner.landing.v2.trust.title" defaultMessage="Ils nous font confiance" />
        </h2>
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
          {partners.map((p) => (
            <a
              key={p.id}
              href={p.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 glass-card rounded-xl px-6 py-4 transition-all duration-200 group hover:scale-105"
              aria-label={`${p.websiteName} - partner website`}
            >
              {p.websiteLogo ? (
                <img
                  src={p.websiteLogo}
                  alt={p.websiteName}
                  className="h-10 w-auto object-contain"
                  loading="lazy"
                />
              ) : (
                <Globe className="w-8 h-8 text-cyan-400" />
              )}
              <span className="text-white font-medium">{p.websiteName}</span>
              <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

// ============================================================================
// ANIMATED COUNTER
// ============================================================================
const AnimatedStat: React.FC<{
  value: string;
  label: string;
  icon: React.ReactNode;
}> = ({ value, label, icon }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`text-center transition-all duration-700 ${visible ? 'animate-count-up' : 'opacity-0 translate-y-5'}`}
    >
      <div className="flex justify-center mb-3">{icon}</div>
      <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
        {value}
      </div>
      <div className="text-gray-400 text-sm md:text-base">{label}</div>
    </div>
  );
};

// ============================================================================
// APPLICATION FORM
// ============================================================================
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  language: string;
  organizationName: string;
  message: string;
}

const INITIAL_FORM: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  country: '',
  language: '',
  organizationName: '',
  message: '',
};

const ApplicationForm: React.FC = () => {
  const intl = useIntl();
  const { language: uiLanguage } = useApp();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  // Localised, alphabetically-sorted country list (priority-1 countries first).
  const countryOptions = useMemo(() => {
    const locale = uiLocaleToCountryLocale(uiLanguage as string);
    const items = countriesData
      .filter(c => c.code !== 'SEPARATOR' && !c.disabled)
      .map(c => ({
        code: c.code,
        name: getCountryName(c.code, locale),
        priority: c.priority ?? 3,
      }));
    return items.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.name.localeCompare(b.name, locale);
    });
  }, [uiLanguage]);

  // Localised language list, restricted to the 9 backend-supported codes.
  const languageOptions = useMemo(() => {
    const labelLocale = uiLocaleToLanguageLabelLocale(uiLanguage as string);
    return FORM_LANGUAGES.map((code) => {
      // languagesData uses 'zh' as the code for Chinese — same as our form code.
      const lang = languagesData.find(l => l.code === code);
      const label = lang?.labels?.[labelLocale] || lang?.name || code;
      return { code: code as FormLanguage, label };
    }).sort((a, b) => a.label.localeCompare(b.label));
  }, [uiLanguage]);

  const validate = (): string | null => {
    if (!form.firstName.trim()) return intl.formatMessage({ id: 'partner.landing.form.error.firstName', defaultMessage: 'First name is required' });
    if (!form.lastName.trim()) return intl.formatMessage({ id: 'partner.landing.form.error.lastName', defaultMessage: 'Last name is required' });
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return intl.formatMessage({ id: 'partner.landing.form.error.email', defaultMessage: 'Valid email is required' });
    if (!form.country) return intl.formatMessage({ id: 'partner.landing.form.error.country', defaultMessage: 'Country is required' });
    if (!form.language) return intl.formatMessage({ id: 'partner.landing.form.error.language', defaultMessage: 'Language is required' });
    if (!form.organizationName.trim()) return intl.formatMessage({ id: 'partner.landing.form.error.organizationName', defaultMessage: 'Organization name is required' });
    if (form.message.length > 1000)
      return intl.formatMessage({ id: 'partner.landing.form.error.messageTooLong', defaultMessage: 'Message must be under 1000 characters' });
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const submitFn = httpsCallable(functionsAffiliate, 'submitPartnerApplication');
      await submitFn({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        country: form.country,
        language: form.language,
        websiteName: form.organizationName.trim(),
        message: form.message.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error('Submit partner application error:', err);
      setError(
        err?.message || intl.formatMessage({ id: 'partner.landing.form.error.generic', defaultMessage: 'An error occurred. Please try again.' })
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 sm:py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all min-h-[48px]";
  const selectClass = "w-full px-4 py-3 sm:py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm sm:text-base text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all appearance-none min-h-[48px]";
  const labelClass = "block text-sm sm:text-base font-medium text-gray-300 mb-1.5";

  if (submitted) {
    return (
      <div className="text-center py-16 px-6">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">
          <FormattedMessage id="partner.landing.form.success.title" defaultMessage="Message envoyé !" />
        </h3>
        <p className="text-gray-400 max-w-md mx-auto">
          <FormattedMessage id="partner.landing.form.success.message" defaultMessage="Merci pour votre intérêt. Notre équipe vous recontacte sous 48h pour discuter de votre partenariat." />
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Row: firstName + lastName */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pf-firstName" className={labelClass}>
            <FormattedMessage id="partner.landing.form.firstName" defaultMessage="First name" /> *
          </label>
          <input
            id="pf-firstName"
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            className={inputClass}
            required
            autoComplete="given-name"
          />
        </div>
        <div>
          <label htmlFor="pf-lastName" className={labelClass}>
            <FormattedMessage id="partner.landing.form.lastName" defaultMessage="Last name" /> *
          </label>
          <input
            id="pf-lastName"
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            className={inputClass}
            required
            autoComplete="family-name"
          />
        </div>
      </div>

      {/* Row: email + phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pf-email" className={labelClass}>
            <FormattedMessage id="partner.landing.form.email" defaultMessage="Email" /> *
          </label>
          <input
            id="pf-email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className={inputClass}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="pf-phone" className={labelClass}>
            <FormattedMessage id="partner.landing.form.phone" defaultMessage="Phone" />
          </label>
          <input
            id="pf-phone"
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className={inputClass}
            autoComplete="tel"
          />
        </div>
      </div>

      {/* Row: country + language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pf-country" className={labelClass}>
            <FormattedMessage id="partner.landing.form.country" defaultMessage="Country" /> *
          </label>
          <select
            id="pf-country"
            name="country"
            value={form.country}
            onChange={handleChange}
            className={selectClass}
            required
          >
            <option value="">{intl.formatMessage({ id: 'partner.landing.form.selectCountry', defaultMessage: 'Select a country' })}</option>
            {countryOptions.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pf-language" className={labelClass}>
            <FormattedMessage id="partner.landing.form.language" defaultMessage="Language" /> *
          </label>
          <select
            id="pf-language"
            name="language"
            value={form.language}
            onChange={handleChange}
            className={selectClass}
            required
          >
            <option value="">{intl.formatMessage({ id: 'partner.landing.form.selectLanguage', defaultMessage: 'Select a language' })}</option>
            {languageOptions.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Organization / company name */}
      <div>
        <label htmlFor="pf-organizationName" className={labelClass}>
          <FormattedMessage id="partner.landing.form.organizationName" defaultMessage="Nom de l'organisation" /> *
        </label>
        <input
          id="pf-organizationName"
          type="text"
          name="organizationName"
          value={form.organizationName}
          onChange={handleChange}
          className={inputClass}
          required
          autoComplete="organization"
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="pf-message" className={labelClass}>
          <FormattedMessage id="partner.landing.form.message" defaultMessage="Message (optional)" />
          <span className="text-gray-500 ml-2">({form.message.length}/1000)</span>
        </label>
        <textarea
          id="pf-message"
          name="message"
          value={form.message}
          onChange={handleChange}
          maxLength={1000}
          rows={4}
          className={inputClass}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-base sm:text-lg rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[56px] will-change-transform"
      >
        {submitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <FormattedMessage id="partner.landing.form.submit" defaultMessage="Nous contacter" />
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const PartnerLanding: React.FC = () => {
  const intl = useIntl();
  const location = useLocation();
  const { language } = useApp();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  const openContactModal = () => setShowContactModal(true);
  const closeContactModal = () => setShowContactModal(false);

  // Sticky CTA: show after scrolling past hero
  useEffect(() => {
    const onScroll = () => {
      setShowStickyCTA(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ======= URL Construction (same pattern as Home) =======
  const defaultLocale = getLocaleString(language as 'fr' | 'en' | 'es' | 'de' | 'ru' | 'pt' | 'ch' | 'hi' | 'ar');
  const partnerSlug = getTranslatedRouteSlug('partner-landing' as any, language as any) || 'devenir-partenaire';
  const canonicalUrl = `${SEO_CONSTANTS.BASE_URL}/${defaultLocale}/${partnerSlug}`;

  // ======= SEO Meta Data =======
  const seoData = useMemo(() => ({
    title: intl.formatMessage({ id: 'partner.landing.v2.seo.title', defaultMessage: 'Programme Partenaire B2B - SOS-Expat | Assistance Juridique Expatriés' }),
    description: intl.formatMessage({ id: 'partner.landing.v2.seo.description', defaultMessage: 'Une offre exceptionnelle pour différencier votre marque : où qu\'ils soient dans le monde, vos clients joignent un avocat qui parle leur langue en moins de 5 minutes par téléphone. 197 pays, 24h/24. Voyageurs, vacanciers, digital nomades, expatriés. Forfait mensuel B2B, API REST, dashboard temps réel.' }),
    keywords: intl.formatMessage({ id: 'seo.partner.keywords', defaultMessage: 'avocat dans leur langue 5 minutes, mise en relation téléphone avocat international urgence, partenaire SOS Expat, programme partenariat B2B voyageurs vacanciers digital nomades expatriés, assistance téléphonique internationale 24/7, urgence à l\'étranger, agence de voyage partenaire, tour-opérateur, comité d\'entreprise CSE, assurance voyage, ambassade partenaire, banque partenaire, accord B2B sur mesure, offre exceptionnelle marque' }),
    ogTitle: intl.formatMessage({ id: 'seo.partner.ogTitle', defaultMessage: 'Programme Partenaire SOS-Expat | Un Avocat dans Leur Langue, Où Qu\'ils Soient, en 5 Minutes' }),
    ogDescription: intl.formatMessage({ id: 'seo.partner.ogDescription', defaultMessage: 'Une offre exceptionnelle à proposer à vos clients : où qu\'ils soient dans le monde, ils joignent un avocat qui parle leur langue en moins de 5 minutes par téléphone. Voyageurs, vacanciers, digital nomades, expatriés. 197 pays, 24/7. Accord de partenariat sur mesure, outils d\'intégration, account manager dédié.' }),
    twitterTitle: intl.formatMessage({ id: 'seo.partner.twitterTitle', defaultMessage: 'Partenaire SOS-Expat | Un Avocat dans Leur Langue, Où Qu\'ils Soient, en 5 min' }),
    twitterDescription: intl.formatMessage({ id: 'seo.partner.twitterDescription', defaultMessage: 'Une offre exceptionnelle pour différencier votre marque : où qu\'ils soient dans le monde, vos clients joignent un avocat qui parle leur langue par téléphone en moins de 5 minutes. 197 pays, 24/7. Tour-opérateurs, CSE, assurances, ambassades, banques, associations.' }),
  }), [intl]);

  // ======= JSON-LD Schema.org — Organization (enriched, with @id) =======
  const jsonLdOrganization = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SEO_CONSTANTS.BASE_URL}/#organization`,
    'name': SEO_CONSTANTS.SITE_NAME,
    'url': SEO_CONSTANTS.BASE_URL,
    'logo': {
      '@type': 'ImageObject',
      'url': SEO_CONSTANTS.LOGO_URL,
      'width': 512,
      'height': 512,
    },
    'description': seoData.description,
    'sameAs': Object.values(SEO_CONSTANTS.SOCIAL),
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'partnerships',
      'availableLanguage': ['French', 'English', 'Spanish', 'German', 'Portuguese', 'Russian', 'Chinese', 'Arabic', 'Hindi'],
      'areaServed': 'Worldwide',
    },
    'knowsAbout': [
      'Expatriation', 'Legal assistance abroad', 'Immigration law', 'International relocation',
      'International law', 'B2B partnerships', 'Administrative assistance for expats',
      'Consular services', 'Cross-border legal advice', 'Expat support services',
    ],
  }), [seoData.description]);

  // ======= JSON-LD — WebSite (SearchAction) =======
  const jsonLdWebSite = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SEO_CONSTANTS.BASE_URL}/#website`,
    'name': SEO_CONSTANTS.SITE_NAME,
    'url': SEO_CONSTANTS.BASE_URL,
    'inLanguage': language === 'ch' ? 'zh' : language,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${SEO_CONSTANTS.BASE_URL}/${{
          fr: 'recherche', en: 'search', es: 'buscar', de: 'suche',
          pt: 'pesquisa', ru: 'poisk', ch: 'sousuo', hi: 'khoj', ar: 'bahth',
        }[language] || 'recherche'}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }), [language]);

  // ======= JSON-LD — FAQPage (8 FAQ items from the page) =======
  // 2026-04-25 refactor: list explicit IDs instead of iterating 1..8 because
  // q6 (rémunération) and q8 (réduction) were removed and replaced by q9 (invoicing)
  // and q10 (e-signature). Hard-coding the IDs keeps Schema.org output consistent.
  const FAQ_ID_LIST = [1, 2, 3, 4, 5, 7, 9, 10] as const;
  const jsonLdFAQ = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': FAQ_ID_LIST.map((n) => ({
      '@type': 'Question',
      'name': intl.formatMessage({ id: `partner.landing.v2.faq.q${n}` }),
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': intl.formatMessage({ id: `partner.landing.v2.faq.a${n}` }),
      },
    })),
  }), [intl]);

  // ======= JSON-LD — BreadcrumbList =======
  const jsonLdBreadcrumb = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': intl.formatMessage({ id: 'breadcrumb.home', defaultMessage: 'Accueil' }),
        'item': `${SEO_CONSTANTS.BASE_URL}/${defaultLocale}`,
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': intl.formatMessage({ id: 'partner.landing.v2.seo.title', defaultMessage: 'Programme Partenaire' }),
        'item': canonicalUrl,
      },
    ],
  }), [intl, defaultLocale, canonicalUrl]);

  // ======= JSON-LD — HowTo (4 steps from the page) =======
  const jsonLdHowTo = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    'name': intl.formatMessage({ id: 'partner.landing.v2.hero.badge', defaultMessage: 'SOS-Call for Business' }),
    'description': seoData.description,
    'image': 'https://sos-expat.com/og-image.webp',
    'totalTime': 'PT10M',
    'step': [
      {
        '@type': 'HowToStep',
        'position': 1,
        'name': intl.formatMessage({ id: 'partner.landing.v2.steps.apply.title', defaultMessage: 'Échangeons' }),
        'text': intl.formatMessage({ id: 'partner.landing.v2.steps.apply.desc', defaultMessage: 'Contactez-nous pour nous parler de votre organisation.' }),
        'image': 'https://sos-expat.com/og-image.webp',
      },
      {
        '@type': 'HowToStep',
        'position': 2,
        'name': intl.formatMessage({ id: 'partner.landing.v2.steps.negotiate.title', defaultMessage: 'Construisons ensemble' }),
        'text': intl.formatMessage({ id: 'partner.landing.v2.steps.negotiate.desc', defaultMessage: 'Nous définissons ensemble les termes de votre partenariat.' }),
        'image': 'https://sos-expat.com/og-image.webp',
      },
      {
        '@type': 'HowToStep',
        'position': 3,
        'name': intl.formatMessage({ id: 'partner.landing.v2.steps.integrate.title', defaultMessage: 'Intégrez' }),
        'text': intl.formatMessage({ id: 'partner.landing.v2.steps.integrate.desc', defaultMessage: 'Ajoutez vos clients un par un, importez-les en CSV ou synchronisez via l\'API REST. Chaque client reçoit automatiquement son email d\'activation avec son code d\'accès.' }),
        'image': 'https://sos-expat.com/og-image.webp',
      },
      {
        '@type': 'HowToStep',
        'position': 4,
        'name': intl.formatMessage({ id: 'partner.landing.v2.steps.earn.title', defaultMessage: 'Profitez' }),
        'text': intl.formatMessage({ id: 'partner.landing.v2.steps.earn.desc', defaultMessage: 'Vos clients accèdent à un service d\'exception et vous profitez des avantages négociés.' }),
        'image': 'https://sos-expat.com/og-image.webp',
      },
    ],
  }), [intl, seoData.description]);

  // ======= JSON-LD — Speakable WebPage (AI) =======
  const jsonLdSpeakable = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonicalUrl}#webpage`,
    'url': canonicalUrl,
    'name': seoData.title,
    'description': seoData.description,
    'isPartOf': { '@id': `${SEO_CONSTANTS.BASE_URL}/#website` },
    'about': { '@id': `${SEO_CONSTANTS.BASE_URL}/#organization` },
    'speakable': {
      '@type': 'SpeakableSpecification',
      'cssSelector': ['#partner-heading', '#value-heading', '#howto-heading', '#faq-heading', '#cta-heading'],
    },
    'specialty': 'B2B Partner Program for Expatriation Services',
  }), [canonicalUrl, seoData]);

  // ======= JSON-LD — ProfessionalService (B2B offering) =======
  const jsonLdService = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${SEO_CONSTANTS.BASE_URL}/#partner-service`,
    'name': `${SEO_CONSTANTS.SITE_NAME} - Partner Program`,
    'url': canonicalUrl,
    'image': { '@type': 'ImageObject', 'url': SEO_CONSTANTS.LOGO_URL, 'width': 512, 'height': 512 },
    'provider': { '@type': 'Organization', '@id': `${SEO_CONSTANTS.BASE_URL}/#organization` },
    // address required by Google for LocalBusiness/ProfessionalService
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': 'Paris',
      'addressCountry': 'FR',
    },
    'priceRange': '$$',
    'areaServed': 'Worldwide',
    'serviceType': 'B2B Partnership Program',
    'description': seoData.description,
    'hasOfferCatalog': {
      '@type': 'OfferCatalog',
      'name': intl.formatMessage({ id: 'partner.landing.v2.value.custom.title', defaultMessage: 'Un partenariat sur mesure' }),
      'itemListElement': [
        {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'EUR',
          'itemOffered': {
            '@type': 'Service',
            'name': intl.formatMessage({ id: 'partner.landing.v2.value.monetize.title', defaultMessage: 'Un service complémentaire pour votre audience' }),
          },
        },
        {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'EUR',
          'itemOffered': {
            '@type': 'Service',
            'name': intl.formatMessage({ id: 'partner.landing.v2.value.tools.title', defaultMessage: 'Outils clés en main' }),
          },
        },
      ],
    },
  }), [intl, canonicalUrl, seoData.description]);

  // ---- Value proposition cards ----
  const valueCards = [
    {
      icon: Users,
      gradient: 'from-cyan-500 to-blue-500',
      titleId: 'partner.landing.v2.value.monetize.title',
      titleDefault: 'Un service complémentaire pour votre audience',
      descId: 'partner.landing.v2.value.monetize.desc',
      descDefault: 'Vos clients, membres ou abonnés ont besoin d\'aide juridique et administrative à l\'étranger. SOS-Expat prend en charge ce service pour vous : une tâche en moins, une vraie valeur ajoutée pour votre communauté.',
    },
    {
      icon: Handshake,
      gradient: 'from-blue-500 to-indigo-500',
      titleId: 'partner.landing.v2.value.custom.title',
      titleDefault: 'Un partenariat sur mesure',
      descId: 'partner.landing.v2.value.custom.desc',
      descDefault: "Chaque collaboration est unique. Nous construisons ensemble les termes du partenariat : volume, mode d'accès pour vos clients, segmentation, personnalisation, conditions commerciales. Forfait flexible et adapté à votre taille.",
    },
    {
      icon: Code,
      gradient: 'from-indigo-500 to-purple-500',
      titleId: 'partner.landing.v2.value.tools.title',
      titleDefault: 'Outils clés en main',
      descId: 'partner.landing.v2.value.tools.desc',
      descDefault: 'API REST avec bulk import, dashboard partenaire pour ajouter et suivre vos clients en temps réel, email d\'activation automatique personnalisable à votre marque, et un account manager unique pour piloter le partenariat.',
    },
  ];

  // ---- How it works steps ----
  const steps = [
    {
      icon: MessageSquare,
      color: 'from-cyan-500 to-blue-500',
      titleId: 'partner.landing.v2.steps.apply.title',
      titleDefault: 'Échangeons',
      descId: 'partner.landing.v2.steps.apply.desc',
      descDefault: 'Contactez-nous pour nous parler de votre organisation et de votre audience. Nous vous répondons sous 48h.',
    },
    {
      icon: Handshake,
      color: 'from-blue-500 to-indigo-500',
      titleId: 'partner.landing.v2.steps.negotiate.title',
      titleDefault: 'Construisons ensemble',
      descId: 'partner.landing.v2.steps.negotiate.desc',
      descDefault: 'Nous définissons ensemble les termes de votre partenariat : services pour vos clients, avantages mutuels, mode de recommandation.',
    },
    {
      icon: Code,
      color: 'from-indigo-500 to-purple-500',
      titleId: 'partner.landing.v2.steps.integrate.title',
      titleDefault: 'Intégrez',
      descId: 'partner.landing.v2.steps.integrate.desc',
      descDefault: 'Ajoutez vos clients un par un, importez-les en CSV ou synchronisez depuis votre CRM via l\'API REST. Chaque client reçoit ensuite automatiquement son email d\'activation avec son code d\'accès personnel. Notre équipe technique vous accompagne.',
    },
    {
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      titleId: 'partner.landing.v2.steps.earn.title',
      titleDefault: 'Profitez',
      descId: 'partner.landing.v2.steps.earn.desc',
      descDefault: 'Vos clients accèdent à un service d\'exception, et vous bénéficiez des avantages négociés dans votre accord. Suivi en temps réel.',
    },
  ];

  // ---- Partner profiles ----
  // Aligned with the actual prospect list (SOS-Expat-Cibles-EXHAUSTIF.xlsx, 168 targets, 17 segments).
  // "Médias & presse" was intentionally removed: media outlets belong to the blogger/influencer
  // program, not the B2B SOS-Call for Business subscription program represented on this page.
  const partnerProfiles = [
    { icon: Landmark, titleId: 'partner.landing.v2.profiles.embassy', titleDefault: 'Embassies & consulates' },
    { icon: Shield, titleId: 'partner.landing.v2.profiles.insurance', titleDefault: 'Insurers & brokers' },
    { icon: CreditCard, titleId: 'partner.landing.v2.profiles.banking', titleDefault: 'Banks & fintech' },
    { icon: Heart, titleId: 'partner.landing.v2.profiles.association', titleDefault: 'Federations & associations' },
    { icon: Truck, titleId: 'partner.landing.v2.profiles.relocation', titleDefault: 'Movers & relocation' },
    { icon: Plane, titleId: 'partner.landing.v2.profiles.travel', titleDefault: 'Travel agencies, tour operators & cruises' },
    { icon: Building2, titleId: 'partner.landing.v2.profiles.realestate', titleDefault: 'International real estate' },
    { icon: Scale, titleId: 'partner.landing.v2.profiles.legal', titleDefault: 'Law firms' },
    { icon: GraduationCap, titleId: 'partner.landing.v2.profiles.education', titleDefault: 'Schools & universities' },
    { icon: Briefcase, titleId: 'partner.landing.v2.profiles.corporate', titleDefault: 'International groups' },
    { icon: Handshake, titleId: 'partner.landing.v2.profiles.independent', titleDefault: 'Cabinets & agences indépendants' },
    { icon: Users, titleId: 'partner.landing.v2.profiles.smb', titleDefault: 'Commerçants, TPE & freelances' },
  ];

  // ---- Advantages ----
  // 2026-04-25 refactor: aligned with the B2B SOS-Call for Business program.
  // Removed: "Réduction pour votre audience" (commission-program promise, not part
  // of the B2B subscription model represented on this page).
  // Added:   "API REST + bulk import" advantage for corporate prospects.
  // Reframed:"Paiement rapide" → "Facturation simple" (the partner pays an invoice,
  //          they do not receive payouts on this program).
  const advantages = [
    {
      icon: DollarSign,
      titleId: 'partner.landing.v2.advantages.commission.title',
      titleDefault: 'Forfait flexible et négocié',
      descId: 'partner.landing.v2.advantages.commission.desc',
      descDefault: "Pas de formule imposée. Nous adaptons les termes du partenariat à votre volume et vos objectifs : per-member, forfait, paliers, ou sur-mesure.",
    },
    {
      icon: BarChart3,
      titleId: 'partner.landing.v2.advantages.dashboard.title',
      titleDefault: 'Dashboard temps réel',
      descId: 'partner.landing.v2.advantages.dashboard.desc',
      descDefault: 'Suivez les appels, durées et KPI consolidés en direct depuis votre tableau de bord partenaire.',
    },
    {
      icon: Mail,
      titleId: 'partner.landing.v2.advantages.widget.title',
      titleDefault: "Email d'activation automatique",
      descId: 'partner.landing.v2.advantages.widget.desc',
      descDefault: "Chacun de vos clients reçoit automatiquement un email avec son code d'accès personnel et le lien pour appeler. Templates personnalisables à votre marque, en 9 langues.",
    },
    {
      icon: HeadphonesIcon,
      titleId: 'partner.landing.v2.advantages.manager.title',
      titleDefault: 'Account manager dédié',
      descId: 'partner.landing.v2.advantages.manager.desc',
      descDefault: "Un interlocuteur unique pour répondre à vos questions, optimiser votre intégration et vous accompagner.",
    },
    {
      icon: Code,
      titleId: 'partner.landing.v2.advantages.api.title',
      titleDefault: 'API REST + bulk import',
      descId: 'partner.landing.v2.advantages.api.desc',
      descDefault: "Synchronisez vos clients depuis votre CRM ou ERP. Bearer key, scopes, jusqu'à 500 clients importés par appel API.",
    },
    {
      icon: Receipt,
      titleId: 'partner.landing.v2.advantages.payment.title',
      titleDefault: 'Facturation simple',
      descId: 'partner.landing.v2.advantages.payment.desc',
      descDefault: 'Une facture unique en fin de mois. Paiement net 15 jours par défaut, ou conditions négociées. Carte, virement, prélèvement.',
    },
  ];

  // ---- Pricing formulas (3 formules + sur-mesure) ----
  // Public framing — actual € amounts are negotiated 1:1 (kept off the public page).
  // Maps to InvoiceService.calculateInvoiceData billing modes:
  //   permember = (a) per-member, flat = (b) flat fee, tiered = (d) tiered, custom = (c)/(e) hybrid.
  const formulas = [
    {
      icon: Users,
      gradient: 'from-cyan-500 to-blue-500',
      titleId: 'partner.landing.v2.formulas.permember.title',
      titleDefault: 'Per-member',
      descId: 'partner.landing.v2.formulas.permember.desc',
      descDefault: 'Vous payez par client actif. Idéal si votre volume monte progressivement.',
    },
    {
      icon: Layers,
      gradient: 'from-blue-500 to-indigo-500',
      titleId: 'partner.landing.v2.formulas.flat.title',
      titleDefault: 'Forfait fixe',
      descId: 'partner.landing.v2.formulas.flat.desc',
      descDefault: 'Un montant mensuel fixe quel que soit votre volume. Idéal pour budgets prévisibles.',
    },
    {
      icon: PieChart,
      gradient: 'from-indigo-500 to-purple-500',
      titleId: 'partner.landing.v2.formulas.tiered.title',
      titleDefault: 'Paliers',
      descId: 'partner.landing.v2.formulas.tiered.desc',
      descDefault: 'Tarif dégressif par tranches de clients. Idéal pour les gros volumes.',
    },
    {
      icon: Handshake,
      gradient: 'from-purple-500 to-pink-500',
      titleId: 'partner.landing.v2.formulas.custom.title',
      titleDefault: 'Sur-mesure',
      descId: 'partner.landing.v2.formulas.custom.desc',
      descDefault: 'Hybride, contrat-cadre, conditions spécifiques : on construit avec vous.',
    },
  ];

  // ---- Corporates block (high-volume, integration-ready) ----
  const corporateFeatures = [
    {
      icon: Code,
      titleId: 'partner.landing.v2.corporates.api.title',
      titleDefault: 'API REST',
      descId: 'partner.landing.v2.corporates.api.desc',
      descDefault: "Bearer key, scopes par usage. Bulk import jusqu'à 500 clients par appel API. Idéal pour synchronisation depuis votre CRM.",
    },
    {
      icon: Network,
      titleId: 'partner.landing.v2.corporates.hierarchy.title',
      titleDefault: 'Hiérarchie multi-cabinet',
      descId: 'partner.landing.v2.corporates.hierarchy.desc',
      descDefault: 'Scoping par cabinet, région, département. Chaque branch manager pilote son périmètre dans son dashboard.',
    },
    {
      icon: Receipt,
      titleId: 'partner.landing.v2.corporates.invoice.title',
      titleDefault: 'Facturation fin de mois',
      descId: 'partner.landing.v2.corporates.invoice.desc',
      descDefault: 'Une facture unique mensuelle, paiement net 15 jours (ou conditions négociées). Carte bancaire, virement, prélèvement.',
    },
    {
      icon: FileText,
      titleId: 'partner.landing.v2.corporates.legal.title',
      titleDefault: 'Signature électronique CGV',
      descId: 'partner.landing.v2.corporates.legal.desc',
      descDefault: 'CGV B2B, DPA, Order Form signés en ligne avec preuve probante (IP, horodatage, hash SHA-256, PDF archivés).',
    },
    {
      icon: Lock,
      titleId: 'partner.landing.v2.corporates.gdpr.title',
      titleDefault: 'Conformité internationale',
      descId: 'partner.landing.v2.corporates.gdpr.desc',
      descDefault: 'DPA conforme RGPD (UE), CCPA (Californie), LGPD (Brésil), PIPEDA (Canada), POPIA (Afrique du Sud), APP (Australie). Hébergement multi-régions, audit trail complet, sous-traitants identifiés. Adapté aux services juridiques exigeants partout dans le monde.',
    },
    {
      icon: Activity,
      titleId: 'partner.landing.v2.corporates.tracking.title',
      titleDefault: 'Suivi temps réel',
      descId: 'partner.landing.v2.corporates.tracking.desc',
      descDefault: "Dashboard live : nombre d'appels, durée, KPI consolidés. Export CSV. API events pour intégration BI interne.",
    },
  ];

  // ---- Key stats ----
  const stats = [
    {
      value: '197',
      labelId: 'partner.landing.v2.stats.countries',
      labelDefault: 'pays couverts',
      icon: <Globe className="w-8 h-8 text-cyan-400" />,
    },
    {
      value: '9',
      labelId: 'partner.landing.v2.stats.languages',
      labelDefault: 'langues supportées',
      icon: <Languages className="w-8 h-8 text-cyan-400" />,
    },
    {
      value: '24/7',
      labelId: 'partner.landing.v2.stats.availability',
      labelDefault: 'disponibilité',
      icon: <Clock className="w-8 h-8 text-cyan-400" />,
    },
    {
      value: '< 5 min',
      labelId: 'partner.landing.v2.stats.connection',
      labelDefault: 'mise en relation',
      icon: <PhoneCall className="w-8 h-8 text-cyan-400" />,
    },
  ];

  // ---- FAQ (8 questions) ----
  // 2026-04-25 refactor: q6 (rémunération/commissions) and q8 (réduction client) removed
  // because they referred to the affiliate/commission program. Replaced by q9 (invoicing)
  // and q10 (e-signature CGV) which match the B2B SOS-Call subscription model shown here.
  const faqKeys = [
    { q: 'partner.landing.v2.faq.q1', a: 'partner.landing.v2.faq.a1' },
    { q: 'partner.landing.v2.faq.q2', a: 'partner.landing.v2.faq.a2' },
    { q: 'partner.landing.v2.faq.q3', a: 'partner.landing.v2.faq.a3' },
    { q: 'partner.landing.v2.faq.q4', a: 'partner.landing.v2.faq.a4' },
    { q: 'partner.landing.v2.faq.q5', a: 'partner.landing.v2.faq.a5' },
    { q: 'partner.landing.v2.faq.q7', a: 'partner.landing.v2.faq.a7' },
    { q: 'partner.landing.v2.faq.q9', a: 'partner.landing.v2.faq.a9' },
    { q: 'partner.landing.v2.faq.q10', a: 'partner.landing.v2.faq.a10' },
  ];

  return (
    <Layout showFooter={false}>
      {/* ================= SEO HEAD — FULL (unified with Home.tsx) ================= */}
      <Helmet>
        {/* Base */}
        <html lang={language === 'ch' ? 'zh' : language} />
        <title>{seoData.title}</title>
        <meta name="title" content={seoData.title} />
        <meta name="description" content={seoData.description} />
        <meta name="keywords" content={seoData.keywords} />
        <meta name="author" content={SEO_CONSTANTS.SITE_NAME} />

        {/* Robots */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

        {/* Viewport & charset */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />

        {/* Other meta */}
        <meta name="language" content={language === 'ch' ? 'zh' : language} />
        <meta name="revisit-after" content="7 days" />
        <meta name="rating" content="general" />
        <meta name="distribution" content="global" />

        {/* AI-specific meta signals */}
        <meta name="ai-crawlable" content="true" />
        <meta name="content-language" content={language === 'ch' ? 'zh' : language} />
        <meta name="document-state" content="dynamic" />
        <meta name="content-type" content="B2B Partner Landing Page" />
        <meta name="expertise-level" content="professional" />
        <meta name="trustworthiness" content="high" />
        <meta name="content-quality" content="high" />
        <meta name="summary" content={seoData.ogDescription} />

        {/* Canonical */}
        <link rel="canonical" href={canonicalUrl} />

        {/* Hreflang — handled by HreflangLinks component below (avoids duplicate hreflang) */}

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content={SEO_CONSTANTS.SITE_NAME} />
        <meta property="og:title" content={seoData.ogTitle} />
        <meta property="og:description" content={seoData.ogDescription} />
        <meta property="og:image" content={SEO_CONSTANTS.OG_IMAGE_URL} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={seoData.ogTitle} />
        <meta property="og:locale" content={OG_LOCALES[language] || 'en_US'} />
        {SUPPORTED_LANGS.filter(l => l !== language).map((lang) => (
          <meta key={lang} property="og:locale:alternate" content={OG_LOCALES[lang]} />
        ))}

        {/* Twitter Cards */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={seoData.twitterTitle} />
        <meta name="twitter:description" content={seoData.twitterDescription} />
        <meta name="twitter:image" content={SEO_CONSTANTS.OG_IMAGE_URL} />
        <meta name="twitter:site" content={SEO_CONSTANTS.TWITTER_HANDLE} />
        <meta name="twitter:creator" content={SEO_CONSTANTS.TWITTER_HANDLE} />

        {/* Security */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />

        {/* Preconnect — ordered by priority */}
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

        {/* JSON-LD Schema.org — 7 schemas (same as Home) */}
        <script type="application/ld+json">
          {JSON.stringify(jsonLdOrganization)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(jsonLdWebSite)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(jsonLdService)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(jsonLdFAQ)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(jsonLdBreadcrumb)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(jsonLdSpeakable)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(jsonLdHowTo)}
        </script>
      </Helmet>
      <BreadcrumbSchema items={[
        { name: intl.formatMessage({ id: 'breadcrumb.home', defaultMessage: 'Home' }), url: '/' },
        { name: intl.formatMessage({ id: 'breadcrumb.partners', defaultMessage: 'Partners' }) }
      ]} />
      {/* HreflangLinks removed: handled globally in App.tsx L1086 */}

      <style>{globalStyles}</style>

      <div className="partner-landing bg-black text-white min-h-screen">

        {/* ================================================================
            SECTION 1 — HERO
        ================================================================ */}
        <section
          className="relative overflow-hidden min-h-[100svh] flex items-center"
          aria-label={intl.formatMessage({ id: 'partner.landing.v2.hero.ariaLabel', defaultMessage: 'Partner program hero' })}
        >
          {/* Background layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/30 via-black to-blue-950/30" aria-hidden="true" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.08),transparent_50%)]" aria-hidden="true" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.08),transparent_50%)]" aria-hidden="true" />

          {/* Floating decorative elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl animate-float" aria-hidden="true" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} aria-hidden="true" />

          <div className="relative section-content w-full pt-20 pb-16 md:pt-28 md:pb-24">
            <div className="max-w-5xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-full text-cyan-400 text-sm font-semibold mb-8">
                <Zap className="w-4 h-4" />
                <FormattedMessage id="partner.landing.v2.hero.badge" defaultMessage="SOS-Call for Business" />
              </div>

              {/* Headline */}
              <h1 id="partner-heading" className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] mb-8 tracking-tight">
                <FormattedMessage
                  id="partner.landing.v2.hero.title"
                  defaultMessage="Où qu'ils soient dans le monde, un avocat dans leur langue en {highlight}"
                  values={{
                    highlight: (
                      <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        {intl.formatMessage({ id: 'partner.landing.v2.hero.highlight', defaultMessage: 'moins de 5 minutes' })}
                      </span>
                    ),
                  }}
                />
              </h1>

              {/* Subtitle — broken into airy lines so it doesn't feel like a wall of text */}
              <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-loose">
                <FormattedMessage
                  id="partner.landing.v2.hero.subtitle"
                  defaultMessage="Offrez à vos clients la tranquillité d'esprit où qu'ils soient dans le monde. Voyageurs, vacanciers, touristes, digital nomades, expatriés, étudiants : pour tout besoin ou urgence à l'étranger, ils joignent par téléphone un avocat qui parle leur langue. Ou un expatrié aidant local pour les démarches pratiques. 24h/24, 7j/7, toute l'année, jours fériés inclus, dans 197 pays. Une offre exceptionnelle qui différencie votre marque, sans aucune logistique pour vos équipes."
                />
              </p>

              {/* CTA */}
              <button
                onClick={openContactModal}
                className="inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-base sm:text-lg rounded-2xl transition-all active:scale-[0.98] animate-pulse-glow-cyan min-h-[48px] sm:min-h-[56px] shadow-2xl shadow-cyan-500/20 will-change-transform"
                aria-label={intl.formatMessage({ id: 'partner.landing.v2.hero.cta.aria', defaultMessage: 'Ouvrir le formulaire de contact partenaire' })}
              >
                <FormattedMessage id="partner.landing.v2.hero.cta" defaultMessage="Discutons de votre partenariat" />
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Trust indicators */}
              <div className="mt-14 flex flex-wrap justify-center gap-6 md:gap-10">
                {[
                  { icon: Globe, text: intl.formatMessage({ id: 'partner.landing.v2.hero.trust.countries', defaultMessage: '197 pays' }) },
                  { icon: Languages, text: intl.formatMessage({ id: 'partner.landing.v2.hero.trust.languages', defaultMessage: 'Toutes les langues' }) },
                  { icon: Clock, text: intl.formatMessage({ id: 'partner.landing.v2.hero.trust.availability', defaultMessage: '24/7 · 365 j/an' }) },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-400">
                    <item.icon className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce hidden sm:flex flex-col items-center gap-1" aria-hidden="true">
            <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
              <div className="w-1.5 h-3 rounded-full bg-cyan-400/60 animate-pulse" />
            </div>
          </div>

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent" aria-hidden="true" />
        </section>

        {/* ================================================================
            SECTION 2 — TRUSTED PARTNERS (from Firestore)
        ================================================================ */}
        <TrustedPartnersSection />

        {/* ================================================================
            SECTION 3 — PROPOSITION DE VALEUR
        ================================================================ */}
        <section className="section-content section-lazy" aria-labelledby="value-heading">
          <div className="max-w-6xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400 text-center mb-4">
              <FormattedMessage id="partner.landing.v2.value.overline" defaultMessage="Pourquoi SOS-Expat ?" />
            </p>
            <h2 id="value-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-16">
              <FormattedMessage id="partner.landing.v2.value.title" defaultMessage="Pourquoi devenir partenaire ?" />
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {valueCards.map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={i}
                    className="glass-card rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] group"
                  >
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${card.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">
                      <FormattedMessage id={card.titleId} defaultMessage={card.titleDefault} />
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      <FormattedMessage id={card.descId} defaultMessage={card.descDefault} />
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Inline CTA after value props */}
            <div className="text-center mt-12">
              <button
                onClick={openContactModal}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-base sm:text-lg rounded-2xl transition-all active:scale-[0.98] min-h-[48px] sm:min-h-[56px] shadow-lg shadow-cyan-500/10 will-change-transform"
              >
                <FormattedMessage id="partner.landing.v2.inline.cta" defaultMessage="Discutons de votre partenariat" />
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 3.5 — TROIS FORMULES TARIFAIRES
        ================================================================ */}
        <section className="section-content section-lazy" aria-labelledby="formulas-heading">
          <div className="max-w-6xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400 text-center mb-4">
              <FormattedMessage id="partner.landing.v2.formulas.overline" defaultMessage="Trois formules, un seul forfait mensuel" />
            </p>
            <h2 id="formulas-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6">
              <FormattedMessage id="partner.landing.v2.formulas.title" defaultMessage="Une tarification adaptée à votre volume" />
            </h2>
            <p className="text-gray-400 text-center max-w-3xl mx-auto mb-14 text-lg">
              <FormattedMessage
                id="partner.landing.v2.formulas.subtitle"
                defaultMessage="Un seul forfait mensuel pour offrir le service à vos clients. Trois modes de facturation au choix, plus du sur-mesure si besoin. Tarifs négociés ensemble."
              />
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {formulas.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className="glass-card rounded-2xl p-7 transition-all duration-300 hover:scale-[1.02] hover:border-cyan-500/30 group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${f.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      <FormattedMessage id={f.titleId} defaultMessage={f.titleDefault} />
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      <FormattedMessage id={f.descId} defaultMessage={f.descDefault} />
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 4 — COMMENT CA MARCHE
        ================================================================ */}
        <section
          className="section-content section-lazy bg-gradient-to-b from-black via-gray-950 to-black"
          aria-labelledby="howto-heading"
        >
          <div className="max-w-6xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400 text-center mb-4">
              <FormattedMessage id="partner.landing.v2.steps.overline" defaultMessage="Simple et rapide" />
            </p>
            <h2 id="howto-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-16">
              <FormattedMessage id="partner.landing.v2.steps.title" defaultMessage="Comment ça marche" />
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {/* Connecting line (desktop only) */}
              <div className="hidden lg:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-cyan-500/30 via-indigo-500/30 to-purple-500/30" aria-hidden="true" />

              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="text-center relative">
                    <div className="relative mb-6 inline-block">
                      <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-black border-2 border-cyan-400 flex items-center justify-center text-sm font-bold text-cyan-400">
                        {i + 1}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      <FormattedMessage id={step.titleId} defaultMessage={step.titleDefault} />
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                      <FormattedMessage id={step.descId} defaultMessage={step.descDefault} />
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 5 — POUR QUI
        ================================================================ */}
        <section className="section-content section-lazy" aria-labelledby="profiles-heading">
          <div className="max-w-6xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400 text-center mb-4">
              <FormattedMessage id="partner.landing.v2.profiles.overline" defaultMessage="Tous les secteurs concernés" />
            </p>
            <h2 id="profiles-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6">
              <FormattedMessage id="partner.landing.v2.profiles.title" defaultMessage="Qui peut devenir partenaire ?" />
            </h2>
            <p className="text-gray-400 text-center max-w-2xl mx-auto mb-14 text-lg">
              <FormattedMessage
                id="partner.landing.v2.profiles.subtitle"
                defaultMessage="Entreprises, agences de voyage, tour-opérateurs, comités d'entreprise, assurances, ambassades, consulats, associations, institutions — toute organisation en contact avec des voyageurs, vacanciers, expatriés, étudiants ou professionnels en mobilité internationale, partout dans le monde."
              />
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {partnerProfiles.map((profile, i) => {
                const Icon = profile.icon;
                return (
                  <div
                    key={i}
                    className="glass-card rounded-2xl p-6 text-center transition-all duration-300 hover:scale-[1.03] hover:border-cyan-500/30 group"
                  >
                    <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 flex items-center justify-center mb-4 group-hover:from-cyan-500/20 group-hover:to-blue-500/20 transition-colors">
                      <Icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-sm md:text-base font-semibold">
                      <FormattedMessage id={profile.titleId} defaultMessage={profile.titleDefault} />
                    </h3>
                  </div>
                );
              })}
            </div>

            {/* Inline CTA after profiles */}
            <div className="text-center mt-12">
              <button
                onClick={openContactModal}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 border-2 border-cyan-500/50 hover:border-cyan-400 hover:bg-cyan-500/10 text-cyan-400 font-bold text-base sm:text-lg rounded-2xl transition-all active:scale-[0.98] min-h-[48px] sm:min-h-[56px] will-change-transform"
              >
                <FormattedMessage id="partner.landing.v2.inline.cta2" defaultMessage="Votre secteur est concerné ? Parlons-en" />
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 5.5 — POUR LES CORPORATES (high-volume integration)
        ================================================================ */}
        <section
          className="section-content section-lazy bg-gradient-to-b from-black via-gray-950 to-black"
          aria-labelledby="corporates-heading"
        >
          <div className="max-w-6xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400 text-center mb-4">
              <FormattedMessage id="partner.landing.v2.corporates.overline" defaultMessage="Pour toutes les tailles" />
            </p>
            <h2 id="corporates-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-6">
              <FormattedMessage id="partner.landing.v2.corporates.title" defaultMessage="Du cabinet indépendant au grand groupe" />
            </h2>
            <p className="text-gray-400 text-center max-w-2xl mx-auto mb-14 text-base md:text-lg leading-relaxed">
              <FormattedMessage
                id="partner.landing.v2.corporates.subtitle"
                defaultMessage="Indépendants, ajoutez vos clients un par un ou par CSV depuis le dashboard : SOS-Expat envoie automatiquement à chaque client son email d'activation avec son code d'accès. Grands groupes, branchez l'API REST pour synchroniser depuis votre CRM (jusqu'à 500 clients par appel) et pilotez plusieurs cabinets dans un dashboard unifié."
              />
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {corporateFeatures.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={i}
                    className="glass-card rounded-2xl p-7 transition-all duration-300 hover:scale-[1.02] hover:border-cyan-500/30 group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-5 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-colors">
                      <Icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      <FormattedMessage id={feat.titleId} defaultMessage={feat.titleDefault} />
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      <FormattedMessage id={feat.descId} defaultMessage={feat.descDefault} />
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 6 — AVANTAGES
        ================================================================ */}
        <section
          className="section-content section-lazy bg-gradient-to-b from-black via-gray-950 to-black"
          aria-labelledby="advantages-heading"
        >
          <div className="max-w-6xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400 text-center mb-4">
              <FormattedMessage id="partner.landing.v2.advantages.overline" defaultMessage="Vos avantages" />
            </p>
            <h2 id="advantages-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-16">
              <FormattedMessage id="partner.landing.v2.advantages.title" defaultMessage="Tout ce dont vous avez besoin" />
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advantages.map((adv, i) => {
                const Icon = adv.icon;
                return (
                  <div
                    key={i}
                    className="glass-card rounded-2xl p-7 transition-all duration-300 hover:scale-[1.02] group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-5 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-colors">
                      <Icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      <FormattedMessage id={adv.titleId} defaultMessage={adv.titleDefault} />
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      <FormattedMessage id={adv.descId} defaultMessage={adv.descDefault} />
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 7 — CHIFFRES CLES
        ================================================================ */}
        <section className="section-content section-lazy" aria-labelledby="stats-heading">
          <div className="max-w-5xl mx-auto">
            <h2 id="stats-heading" className="sr-only">
              <FormattedMessage id="partner.landing.v2.stats.title" defaultMessage="Key figures" />
            </h2>

            <div className="glass-card rounded-3xl p-8 md:p-12 lg:p-16">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                {stats.map((stat, i) => (
                  <AnimatedStat
                    key={i}
                    value={stat.value}
                    label={intl.formatMessage({ id: stat.labelId, defaultMessage: stat.labelDefault })}
                    icon={stat.icon}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 8 — FAQ
        ================================================================ */}
        <section
          className="section-content section-lazy bg-gradient-to-b from-black via-gray-950 to-black"
          aria-labelledby="faq-heading"
        >
          <div className="max-w-3xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400 text-center mb-4">
              <FormattedMessage id="partner.landing.v2.faq.overline" defaultMessage="FAQ" />
            </p>
            <h2 id="faq-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12">
              <FormattedMessage id="partner.landing.v2.faq.title" defaultMessage="Questions fréquentes" />
            </h2>

            <div className="space-y-3" role="list">
              {faqKeys.map((faq, i) => (
                <FAQItem
                  key={i}
                  questionId={faq.q}
                  answerId={faq.a}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 9 — CTA FINAL (Partnership value)
        ================================================================ */}
        <section
          className="section-content section-lazy relative"
          aria-labelledby="cta-heading"
        >
          {/* Background accent */}
          <div className="absolute inset-0 bg-gradient-to-b from-black via-cyan-950/10 to-black" aria-hidden="true" />

          <div className="relative max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-cyan-400 text-sm font-semibold mb-6">
              <Handshake className="w-4 h-4" />
              <FormattedMessage id="partner.landing.v2.cta.badge" defaultMessage="Sans engagement" />
            </div>

            <h2 id="cta-heading" className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              <FormattedMessage id="partner.landing.v2.cta.title" defaultMessage="Offrez un service d'exception à votre communauté" />
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-6 leading-relaxed">
              <FormattedMessage
                id="partner.landing.v2.cta.subtitle"
                defaultMessage="Un partenariat avec SOS-Expat, c'est un service complémentaire pour vos clients, une tâche en moins pour vos équipes, et une vraie valeur ajoutée pour votre organisation. Parlons-en."
              />
            </p>
            <p className="text-gray-500 text-sm mb-10">
              <FormattedMessage
                id="partner.landing.v2.cta.reassurance"
                defaultMessage="Aucun engagement, aucun frais. Notre équipe vous recontacte sous 48h."
              />
            </p>

            <button
              onClick={openContactModal}
              className="inline-flex items-center gap-3 px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-base sm:text-lg rounded-2xl transition-all active:scale-[0.98] animate-pulse-glow-cyan min-h-[48px] sm:min-h-[56px] shadow-2xl shadow-cyan-500/20 will-change-transform"
            >
              <FormattedMessage id="partner.landing.v2.cta.button" defaultMessage="Démarrer la conversation" />
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* ================================================================
            MODAL — Contact Form (Popup)
        ================================================================ */}
        {showContactModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-heading"
          >
            {/* Backdrop — visual only; closing requires the X button */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Modal content */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-950 border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl">
              {/* Close button */}
              <button
                onClick={closeContactModal}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                aria-label={intl.formatMessage({ id: 'partner.landing.v2.modal.close', defaultMessage: 'Fermer' })}
              >
                <Plus className="w-5 h-5 text-gray-400 rotate-45" />
              </button>

              <div className="text-center mb-8">
                <h3 id="modal-heading" className="text-2xl md:text-3xl font-bold text-white mb-3">
                  <FormattedMessage id="partner.landing.v2.modal.title" defaultMessage="Parlons de votre partenariat" />
                </h3>
                <p className="text-gray-400">
                  <FormattedMessage id="partner.landing.v2.modal.subtitle" defaultMessage="Partagez-nous quelques informations, nous vous recontactons sous 48h pour construire ensemble votre partenariat." />
                </p>
              </div>

              <ApplicationForm />

              <p className="text-center text-gray-500 text-xs mt-6">
                <FormattedMessage
                  id="partner.landing.v2.modal.footer"
                  defaultMessage="En soumettant ce formulaire, vous acceptez d'être contacté par l'équipe SOS-Expat. Aucun engagement, aucun frais."
                />
              </p>
            </div>
          </div>
        )}

        {/* ================================================================
            MINI FOOTER
        ================================================================ */}
        <footer className="border-t border-white/5 py-8 pb-24 lg:pb-8 text-center" role="contentinfo">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} SOS-Expat.{' '}
            <FormattedMessage id="partner.landing.v2.footer.rights" defaultMessage="Tous droits réservés." />
          </p>
        </footer>
      </div>

      {/* ================================================================
          STICKY CTA — Mobile only (same pattern as affiliate pages)
      ================================================================ */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden transition-all duration-300 ${showStickyCTA && !showContactModal ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="bg-black/90 backdrop-blur-md border-t border-white/10 px-4 py-3">
          <button
            onClick={openContactModal}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-base rounded-2xl transition-all active:scale-[0.98] min-h-[48px] sm:min-h-[52px] shadow-lg shadow-cyan-500/20 will-change-transform"
          >
            <FormattedMessage id="partner.landing.v2.hero.cta" defaultMessage="Discutons de votre partenariat" />
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default PartnerLanding;
