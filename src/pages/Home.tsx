// src/pages/Home.tsx - VERSION COMPLETE AVEC TOUCHES DE COULEUR VARIÉES
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Helmet } from "react-helmet-async";
import { Form, Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Play,
  Shield,
  Globe,
  Users,
  Zap,
  DollarSign,
  Check,
  Star,
  Phone,
  Award,
  Clock,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Briefcase,
  User,
  AlertCircle,
  Headphones,
} from "lucide-react";
import Layout from "../components/layout/Layout";
import ProfilesCarousel from "../components/home/ProfileCarousel";
import {
  usePricingConfig,
  detectUserCurrency,
  getEffectivePrice,
} from "@/services/pricingService";
import { FormattedMessage, useIntl } from "react-intl";
import { useApp } from "../contexts/AppContext";

/* ================================
   Types
   ================================ */
interface Stat {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  cta: string;
  color: string;
}

type EffectivePrice = {
  price: { totalAmount: number };
  standard: { totalAmount: number };
  override?: { label?: string } | null;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/* ================================
   Données Avis
   ================================ */
type TypeEchange = "avocat" | "expatrié";
interface Review {
  id: string;
  name: string;
  city: string;
  avatar: string;
  fallback: string;
  comment: string;
  typeEchange: TypeEchange;
}

const faceParams =
  "?auto=format&fit=crop&w=600&h=600&q=80&crop=faces&ixlib=rb-4.0.3";

const REVIEWS: Review[] = [
  {
    id: "fr-man",
    name: "Thomas Laurent",
    city: "Lille, France",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e" +
      faceParams,
    fallback: "https://i.pravatar.cc/600?img=12",
    typeEchange: "avocat",
    comment:
      "Je redoutais d'appeler un avocat. Il a été cool, clair et ultra efficace : solution trouvée en 15 min grâce au droit local au Brésil.",
  },
  {
    id: "us-woman",
    name: "Emily Johnson",
    city: "Austin, États-Unis",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1" +
      faceParams,
    fallback: "https://i.pravatar.cc/600?img=47",
    typeEchange: "expatrié",
    comment:
      "Nouvelle à Lyon, panique préfecture. Une expatriée m'a rappelée en quelques minutes, tout expliqué en FR/EN. Je me suis sentie accompagnée.",
  },
  {
    id: "cn-man",
    name: "Li Wei",
    city: "Shanghai, Chine",
    avatar:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12" +
      faceParams,
    fallback: "https://i.pravatar.cc/600?img=32",
    typeEchange: "avocat",
    comment:
      "Assurance santé internationale : réglé dans la journée. L'avocat bilingue a tout clarifié au téléphone, documents à l'appui. Net et précis.",
  },
  {
    id: "th-woman",
    name: "Nok Suphansa",
    city: "Bangkok, Thaïlande",
    avatar:
      "https://images.unsplash.com/photo-1554151228-14d9def656e4" + faceParams,
    fallback: "https://i.pravatar.cc/600?img=65",
    typeEchange: "expatrié",
    comment:
      "Hospitalisation imprévue en voyage. Une expatriée m'a guidée pour les démarches et a servi d'interprète. Humain, rassurant, efficace.",
  },
  {
    id: "ru-man",
    name: "Ivan Petrov",
    city: "Saint-Pétersbourg, Russie",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d" +
      faceParams,
    fallback: "https://i.pravatar.cc/600?img=10",
    typeEchange: "avocat",
    comment:
      "Achat à Lisbonne : l'avocat m'a rappelé, vérifié les clauses, orienté vers la bonne étude notariale. Rapide et sans surprise.",
  },
  {
    id: "sn-woman",
    name: "Awa Diop",
    city: "Dakar, Sénégal",
    avatar:
      "https://images.unsplash.com/photo-1544005316-00a74bdc7f77" + faceParams,
    fallback: "https://i.pravatar.cc/600?img=68",
    typeEchange: "expatrié",
    comment:
      "Visa Canada en rade. Une expatriée à Montréal m'a donné les bons justificatifs et les vrais délais. J'ai gagné des semaines.",
  },
];

/* ================================
   Slider d'avis
   ================================ */
function ReviewsSlider({ theme = "dark" }: { theme?: "dark" | "light" }) {
  const [current, setCurrent] = useState(0);
  const intl = useIntl();
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const isDark = theme === "dark";

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setCurrent((p) => (p + 1) % REVIEWS.length);
    }, 4500);
    return () => window.clearInterval(id);
  }, [paused]);

  const goTo = (i: number) => setCurrent((i + REVIEWS.length) % REVIEWS.length);
  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx > 0) {
        prev();
      } else {
        next();
      }
    }
    touchStartX.current = null;
  };

  const labelType = (t: TypeEchange): string => {
    return t === "avocat"
      ? intl.formatMessage({ id: "call.type.lawyer" })
      : intl.formatMessage({ id: "call.type.expat" });
  };

  const onImgError = (
    e: React.SyntheticEvent<HTMLImageElement>,
    fallback: string
  ) => {
    const img = e.currentTarget;
    if (img.src !== fallback) {
      img.src = fallback;
    }
  };

  return (
    <div
      className="relative max-w-[980px] mx-auto select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-label={intl.formatMessage({ id: "reviews.slider.ariaLabel" })}
    >
      <div className="overflow-hidden rounded-[28px]">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {REVIEWS.map((r, idx) => (
            <article key={r.id} className="w-full shrink-0 px-2 sm:px-4">
              <Link
                to="/testimonials"
                className="block rounded-[28px] border border-red-100 bg-white p-6 sm:p-10 md:p-12 hover:border-red-300 hover:shadow-2xl transition-all duration-300"
                aria-label={intl.formatMessage(
                  { id: "reviews.viewReview" },
                  { name: r.name }
                )}
              >
                <div className="mb-5 sm:mb-6 inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-full px-3.5 py-2 text-xs sm:text-sm font-semibold shadow-md">
                  {r.typeEchange === "avocat" ? (
                    <Briefcase size={14} aria-hidden="true" />
                  ) : (
                    <User size={14} aria-hidden="true" />
                  )}
                  {labelType(r.typeEchange)}
                </div>

                <div className="flex flex-col md:flex-row md:items-start items-center gap-5 sm:gap-7 md:gap-8 text-center md:text-left">
                  <div className="flex flex-col items-center md:items-start">
                    <div
                      className={`relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full p-[3px] ${isDark ? "bg-gray-800" : "bg-gradient-to-br from-red-600 to-red-700"} shadow-lg`}
                    >
                      <img
                        src={r.avatar}
                        alt={intl.formatMessage(
                          { id: "reviews.avatarAlt" },
                          { name: r.name }
                        )}
                        className="w-full h-full rounded-full object-cover"
                        loading={idx === current ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={idx === current ? "high" : "low"}
                        referrerPolicy="no-referrer"
                        onError={(e) => onImgError(e, r.fallback)}
                        width="112"
                        height="112"
                      />
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                        <div
                          className={`font-extrabold ${isDark ? "text-white" : "text-gray-900"} text-lg sm:text-xl leading-tight`}
                        >
                          {r.name}
                        </div>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-600 text-white shadow-sm whitespace-nowrap">
                          {intl.formatMessage({ id: "reviews.earlyBetaUser" })}
                        </span>
                      </div>
                      <div
                        className={`mt-0.5 inline-flex items-center gap-1 ${isDark ? "text-gray-300/90" : "text-gray-600"} text-xs sm:text-sm`}
                      >
                        <MapPin size={16} aria-hidden="true" />
                        <span>{r.city}</span>
                      </div>
                      <div
                        className="mt-2 inline-flex gap-1"
                        role="img"
                        aria-label={intl.formatMessage({
                          id: "reviews.rating5Stars",
                        })}
                      >
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={18}
                            className="text-yellow-400 fill-yellow-400"
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <blockquote
                    className={`${isDark ? "text-white/95" : "text-gray-700"} text-base sm:text-lg md:text-xl leading-7 sm:leading-8 md:leading-9 max-w-[58ch]`}
                    cite={`/testimonials#${r.id}`}
                  >
                    "{r.comment}"
                  </blockquote>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>

      <button
        onClick={prev}
        className="absolute left-1 sm:left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 w-10 h-10 sm:w-12 sm:h-12 bg-white hover:bg-gray-50 rounded-full border border-gray-200 hover:border-red-400 transition-all duration-300 flex items-center justify-center text-gray-700 active:scale-95 shadow-lg"
        aria-label={intl.formatMessage({ id: "reviews.previous" })}
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
      </button>
      <button
        onClick={next}
        className="absolute right-1 sm:right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 w-10 h-10 sm:w-12 sm:h-12 bg-white hover:bg-gray-50 rounded-full border border-gray-200 hover:border-red-400 transition-all duration-300 flex items-center justify-center text-gray-700 active:scale-95 shadow-lg"
        aria-label={intl.formatMessage({ id: "reviews.next" })}
      >
        <ChevronRightIcon className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
      </button>

      <div className="flex items-center justify-center gap-2 mt-6" role="tablist">
        {REVIEWS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${current === i ? "w-8 bg-red-600 shadow-lg shadow-red-500/50" : "w-2 bg-gray-300 hover:bg-gray-400"}`}
            aria-label={intl.formatMessage(
              { id: "reviews.goToReview" },
              { number: i + 1 }
            )}
            role="tab"
            aria-selected={current === i}
          />
        ))}
      </div>

      <div className="text-center mt-7 sm:mt-8">
        <Link
          to="/testimonials"
          className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold transition-colors"
          aria-label={intl.formatMessage({ id: "reviews.viewAllLink" })}
        >
          <span>
            <FormattedMessage id="reviews.viewAll" />
          </span>
          <ChevronRightIcon className="w-5 h-5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

const PRICING_PLANS: PricingPlan[] = [];

/* ================================
   Page principale
   ================================ */
const OptimizedHomePage: React.FC = () => {
  const intl = useIntl();
  const { language } = useApp();

  const seoTitle = intl.formatMessage({ id: "seo.home.title" });
  const seoDescription = intl.formatMessage({ id: "seo.home.description" });
  const seoKeywords = intl.formatMessage({ id: "seo.home.keywords" });
  const canonicalUrl = `https://sos-expat.com/${language}`;

  const organizationSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: intl.formatMessage({ id: "seo.organization.name" }),
      url: "https://sos-expat.com",
      logo: "https://sos-expat.com/logo.png",
      description: seoDescription,
      address: {
        "@type": "PostalAddress",
        addressCountry: "FR",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+33-1-XX-XX-XX-XX",
        contactType: intl.formatMessage({ id: "seo.contactType" }),
        availableLanguage: ["fr", "en", "de", "ru", "zh", "es", "pt", "ar", "hi"],
      },
      sameAs: [
        "https://www.facebook.com/sosexpat",
        "https://twitter.com/sosexpat",
        "https://www.linkedin.com/company/sosexpat",
      ],
    }),
    [intl, seoDescription]
  );

  const serviceSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: intl.formatMessage({ id: "seo.service.type" }),
      provider: {
        "@type": "Organization",
        name: intl.formatMessage({ id: "seo.organization.name" }),
      },
      areaServed: {
        "@type": "Place",
        name: intl.formatMessage({ id: "seo.service.areaServed" }),
      },
      offers: {
        "@type": "Offer",
        priceRange: "19€-49€",
        priceCurrency: "EUR",
      },
    }),
    [intl]
  );

  const breadcrumbSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: intl.formatMessage({ id: "seo.breadcrumb.home" }),
          item: "https://sos-expat.com",
        },
      ],
    }),
    [intl]
  );

  const faqSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: intl.formatMessage({ id: "seo.faq.q1" }),
          acceptedAnswer: {
            "@type": "Answer",
            text: intl.formatMessage({ id: "seo.faq.a1" }),
          },
        },
        {
          "@type": "Question",
          name: intl.formatMessage({ id: "seo.faq.q2" }),
          acceptedAnswer: {
            "@type": "Answer",
            text: intl.formatMessage({ id: "seo.faq.a2" }),
          },
        },
        {
          "@type": "Question",
          name: intl.formatMessage({ id: "seo.faq.q3" }),
          acceptedAnswer: {
            "@type": "Answer",
            text: intl.formatMessage({ id: "seo.faq.a3" }),
          },
        },
      ],
    }),
    [intl]
  );

  const productSchemaExpat = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Product",
      name: intl.formatMessage({ id: "pricing.expat.title" }),
      description: intl.formatMessage({ id: "pricing.expat.description" }),
      offers: {
        "@type": "Offer",
        price: "19",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: "https://sos-expat.com/sos-appel",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "15420",
      },
    }),
    [intl]
  );

  const productSchemaLawyer = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Product",
      name: intl.formatMessage({ id: "pricing.lawyer.title" }),
      description: intl.formatMessage({ id: "pricing.lawyer.description" }),
      offers: {
        "@type": "Offer",
        price: "49",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: "https://sos-expat.com/sos-appel",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "15420",
      },
    }),
    [intl]
  );

  const howToSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: intl.formatMessage({ id: "seo.howto.name" }),
      description: intl.formatMessage({ id: "seo.howto.description" }),
      step: [
        {
          "@type": "HowToStep",
          name: intl.formatMessage({ id: "seo.howto.step1.name" }),
          text: intl.formatMessage({ id: "seo.howto.step1.text" }),
        },
        {
          "@type": "HowToStep",
          name: intl.formatMessage({ id: "seo.howto.step2.name" }),
          text: intl.formatMessage({ id: "seo.howto.step2.text" }),
        },
        {
          "@type": "HowToStep",
          name: intl.formatMessage({ id: "seo.howto.step3.name" }),
          text: intl.formatMessage({ id: "seo.howto.step3.text" }),
        },
      ],
      totalTime: "PT5M",
    }),
    [intl]
  );

  const stats: Stat[] = [
    {
      value: "304 Millions",
      label: "statsExpatriatesHelped",
      icon: <Users className="w-8 h-8" aria-hidden="true" />,
      color: "from-red-500 to-red-600",
    },
    {
      value: "197+",
      label: "statsCountriesCovered",
      icon: <Shield className="w-8 h-8" aria-hidden="true" />,
      color: "from-red-600 to-red-700",
    },
    {
      value: "24/7",
      label: "statsUrgentSupport",
      icon: <Clock className="w-8 h-8" aria-hidden="true" />,
      color: "from-red-700 to-red-800",
    },
  ];

  const features = [];

  const {
    pricing,
    loading: pricingLoading,
    error: pricingError,
  } = usePricingConfig();

  const [selectedCurrency, setSelectedCurrency] = useState<"eur" | "usd">(
    () => {
      try {
        const saved = localStorage.getItem("preferredCurrency") as
          | "eur"
          | "usd"
          | null;
        return saved && ["eur", "usd"].includes(saved)
          ? saved
          : detectUserCurrency();
      } catch {
        return detectUserCurrency();
      }
    }
  );

  useEffect(() => {
    try {
      localStorage.setItem("preferredCurrency", selectedCurrency);
    } catch {
      /* ignore */
    }
  }, [selectedCurrency]);

  return (
    <>
      <Helmet>
        <html lang={language} />
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="googlebot" content="index, follow" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta
          property="og:image"
          content="https://sos-expat.com/og-image.jpg"
        />
        <meta property="og:site_name" content="SOS Expat" />
        <meta property="og:locale" content={language === "fr" ? "fr_FR" : "en_US"} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta
          name="twitter:image"
          content="https://sos-expat.com/twitter-image.jpg"
        />

        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(serviceSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">
          {JSON.stringify(productSchemaExpat)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(productSchemaLawyer)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(howToSchema)}
        </script>

        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </Helmet>

      <Layout>
        <main className="min-h-screen bg-white">
          {/* SECTION 1: HERO - ULTRA DYNAMIQUE AVEC MAXIMUM DE PEPS */}
          <section className="relative pt-20 sm:pt-24 pb-28 sm:pb-36 overflow-hidden" aria-labelledby="hero-title">
            {/* Fond rouge ultra-vif avec dégradé intense */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-red-600 to-red-800" />
            
            {/* Effets lumineux ultra-prononcés et colorés */}
            <div className="absolute inset-0 overflow-hidden">
              {/* Effet orange-jaune intense en haut */}
              <div className="absolute -top-40 left-1/4 w-[1200px] h-[1200px] bg-gradient-to-br from-orange-300/70 via-yellow-400/60 to-red-400/60 rounded-full blur-[200px]" aria-hidden="true" />
              
              {/* Effet rose-rouge intense en bas */}
              <div className="absolute -bottom-40 right-1/4 w-[1400px] h-[1400px] bg-gradient-to-tl from-pink-500/60 via-red-600/50 to-red-800/60 rounded-full blur-[250px]" aria-hidden="true" />
              
              {/* Effet central jaune-orange pour la luminosité */}
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-gradient-to-r from-yellow-300/40 via-orange-400/50 to-red-400/40 rounded-full blur-[180px]" aria-hidden="true" />
              
              {/* Accent supplémentaire rose vif */}
              <div className="absolute bottom-1/3 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-pink-400/50 to-red-500/40 rounded-full blur-[150px]" aria-hidden="true" />
            </div>

            {/* Overlay de contraste */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-red-900/30" aria-hidden="true" />

            {/* Grille ultra-visible */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff20_2px,transparent_2px),linear-gradient(to_bottom,#ffffff20_2px,transparent_2px)] bg-[size:60px_60px] opacity-60" aria-hidden="true" />

            {/* Formes géométriques ultra-marquées et colorées */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Grand cercle orange gauche */}
              <div className="absolute top-10 left-5 w-64 h-64 border-[6px] border-orange-300/50 rounded-full shadow-[0_0_60px_rgba(251,146,60,0.4)]" aria-hidden="true" />
              
              {/* Carré rose en rotation */}
              <div className="absolute bottom-20 right-10 w-48 h-48 border-[6px] border-pink-400/50 rotate-45 shadow-[0_0_60px_rgba(244,114,182,0.4)]" aria-hidden="true" />
              
              {/* Petit carré jaune */}
              <div className="absolute top-1/4 right-1/3 w-32 h-32 bg-yellow-400/30 rounded-3xl rotate-12 shadow-[0_0_40px_rgba(250,204,21,0.5)]" aria-hidden="true" />
              
              {/* Cercle moyen orange-rose */}
              <div className="absolute bottom-1/3 left-1/3 w-40 h-40 border-[5px] border-gradient-to-r from-orange-400 to-pink-400 rounded-full shadow-[0_0_50px_rgba(251,146,60,0.4)]" style={{ borderImage: 'linear-gradient(135deg, rgba(251,146,60,0.6), rgba(244,114,182,0.6)) 1' }} aria-hidden="true" />
              
              {/* Petits accents dispersés */}
              <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-300/40 rounded-full shadow-[0_0_30px_rgba(253,224,71,0.5)]" aria-hidden="true" />
              <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-orange-400/40 rounded-2xl rotate-45 shadow-[0_0_35px_rgba(251,146,60,0.5)]" aria-hidden="true" />
              <div className="absolute bottom-1/4 right-1/3 w-12 h-12 bg-pink-400/40 rounded-full shadow-[0_0_25px_rgba(244,114,182,0.5)]" aria-hidden="true" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-16 sm:mb-24">
                {/* H1 ultra-impactant avec ombres colorées */}
                <h1 id="hero-title" className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 sm:mb-8 leading-[1.05] tracking-tight">
                  <span className="inline-block text-white drop-shadow-[0_10px_50px_rgba(0,0,0,0.9)] filter contrast-125">
                    <FormattedMessage id="welcome" />
                  </span>
                  <br />
                  <span className="relative inline-block mt-2">
                    {/* Halo lumineux multi-couleurs */}
                    <span className="absolute -inset-4 bg-gradient-to-r from-yellow-300/40 via-orange-400/40 to-pink-400/40 blur-[40px]" aria-hidden="true" />
                    <span className="absolute -inset-2 bg-gradient-to-r from-yellow-200/30 via-orange-300/30 to-red-300/30 blur-[25px]" aria-hidden="true" />
                    
                    <span className="relative text-white drop-shadow-[0_10px_50px_rgba(0,0,0,0.9)] filter contrast-125 brightness-110">
                      <FormattedMessage id="welcomeSubtitle" />
                    </span>
                  </span>
                </h1>

                {/* Sous-titres ultra-contrastés */}
                <p className="text-xl sm:text-2xl md:text-3xl text-white font-black max-w-4xl mx-auto mb-4 sm:mb-5 leading-relaxed drop-shadow-[0_8px_40px_rgba(0,0,0,0.9)] filter contrast-125 brightness-110">
                  <FormattedMessage id="heroSubtitle" />
                </p>
                <p className="text-lg sm:text-xl md:text-2xl text-white max-w-4xl mx-auto mb-12 sm:mb-16 leading-relaxed drop-shadow-[0_6px_35px_rgba(0,0,0,0.8)] font-extrabold filter brightness-105">
                  <FormattedMessage id="heroDescription" />
                </p>

                {/* Boutons CTAs ultra-percutants */}
                <nav className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-5 sm:gap-7 max-w-2xl mx-auto" aria-label={intl.formatMessage({ id: "hero.cta.ariaLabel" })}>
                  <a
                    href="/sos-appel"
                    className="group relative overflow-hidden bg-white hover:bg-gray-50 text-red-700 hover:text-red-800 px-10 sm:px-14 py-6 sm:py-7 rounded-full font-black text-xl sm:text-2xl transition-all duration-300 hover:scale-110 shadow-[0_30px_90px_rgba(0,0,0,0.7),0_0_60px_rgba(255,255,255,0.3)] hover:shadow-[0_40px_120px_rgba(0,0,0,0.9),0_0_80px_rgba(255,255,255,0.4)] flex items-center justify-center space-x-4 touch-manipulation border-4 border-white/40"
                    aria-label={intl.formatMessage({ id: "urgentButton.ariaLabel" })}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-100 via-orange-100 to-red-100 opacity-30 group-hover:opacity-50 transition-opacity duration-300 rounded-full" aria-hidden="true" />
                    <AlertCircle className="relative w-8 h-8 sm:w-9 sm:h-9" aria-hidden="true" />
                    <span className="relative flex-1 text-center sm:text-left">
                      <FormattedMessage id="urgentButton" />
                    </span>
                    <ArrowRight className="relative w-6 h-6 sm:w-7 sm:h-7 group-hover:translate-x-2 transition-transform duration-300" aria-hidden="true" />
                  </a>

                  <a
                    href="/sos-appel"
                    className="group flex items-center justify-center space-x-3 px-10 sm:px-12 py-6 sm:py-7 rounded-full bg-white/25 hover:bg-white/35 backdrop-blur-xl text-white border-4 border-white/70 hover:border-white/90 transition-all duration-300 hover:scale-105 font-bold text-lg sm:text-xl touch-manipulation shadow-[0_25px_70px_rgba(0,0,0,0.6),0_0_40px_rgba(255,255,255,0.2)]"
                    aria-label={intl.formatMessage({ id: "seeExperts.ariaLabel" })}
                  >
                    <Headphones className="w-6 h-6 sm:w-7 sm:h-7" aria-hidden="true" />
                    <span className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                      <FormattedMessage id="seeExperts" />
                    </span>
                  </a>
                </nav>
              </div>

              {/* Stats cards ultra-vibrantes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-7 md:gap-9" role="list">
                {stats.map((stat, index) => (
                  <article
                    key={index}
                    className="group text-center p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-white/25 to-white/15 backdrop-blur-xl border-4 border-white/60 hover:border-white/80 hover:from-white/30 hover:to-white/20 transition-all duration-300 hover:scale-110 touch-manipulation shadow-[0_30px_80px_rgba(0,0,0,0.6),0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_40px_100px_rgba(0,0,0,0.8),0_0_60px_rgba(255,255,255,0.25)]"
                    role="listitem"
                  >
                    <div
                      className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${stat.color} mb-4 sm:mb-5 group-hover:scale-110 transition-transform duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(255,255,255,0.2)] border-2 border-white/30`}
                    >
                      <div className="text-white drop-shadow-[0_4px_15px_rgba(0,0,0,0.8)]">{stat.icon}</div>
                    </div>
                    <div className="text-4xl sm:text-5xl font-black text-white mb-3 drop-shadow-[0_8px_40px_rgba(0,0,0,0.9)] filter contrast-125 brightness-110">
                      {stat.value}
                    </div>
                    <div className="text-white font-black text-base sm:text-lg drop-shadow-[0_6px_20px_rgba(0,0,0,0.8)] filter brightness-110">
                      <FormattedMessage id={stat.label} />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 2: EXPERTS - BLANC ÉPURÉ */}
          <section className="py-24 sm:py-32 bg-white relative overflow-hidden" aria-labelledby="experts-title">
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
              <header className="text-center mb-12 sm:mb-16">
                <div className="inline-flex items-center space-x-2 bg-red-50 rounded-full px-6 sm:px-7 py-3 sm:py-3.5 border border-red-200 mb-6 sm:mb-7 shadow-sm">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" aria-hidden="true" />
                  <span className="text-red-700 font-bold text-base sm:text-lg">
                    <FormattedMessage id="expertsBadge" />
                  </span>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" aria-hidden="true" />
                </div>

                <h2 id="experts-title" className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 mb-5 sm:mb-6">
                  <FormattedMessage id="no" />
                  <span className="text-red-600">
                    {" "}
                    experts
                  </span>{" "}
                  <FormattedMessage id="expertsTitle" />
                </h2>
                <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto">
                  <FormattedMessage id="expertsDescription" />
                </p>
              </header>

              <ProfilesCarousel />
            </div>
          </section>

          {/* SECTION 3: TARIFS - NOIR PUR AVEC EFFETS ROUGES */}
          <section
            className="py-24 sm:py-32 bg-gray-950 relative overflow-hidden"
            aria-labelledby="pricing-title"
          >
            {/* Effets lumineux rouges séparés */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 left-1/3 w-[700px] h-[700px] bg-red-600/20 rounded-full blur-3xl animate-pulse" aria-hidden="true" />
              <div className="absolute bottom-0 right-1/3 w-[700px] h-[700px] bg-red-700/20 rounded-full blur-3xl animate-pulse delay-1000" aria-hidden="true" />
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:32px_32px]" aria-hidden="true" />

            {void PRICING_PLANS.length}

            {(() => {
              const DEFAULT_USD_RATE = 1.08 as const;

              const formatBothCurrencies = (
                value: number,
                currency: "EUR" | "USD"
              ): string => {
                return new Intl.NumberFormat(
                  currency === "EUR" ? "fr-FR" : "en-US",
                  {
                    style: "currency",
                    currency,
                    maximumFractionDigits: 0,
                  }
                ).format(value);
              };

              interface OfferCardProps {
                badge: string;
                title: string;
                minutes: number;
                euroPrice: number;
                usdOverride?: number;
                description: string;
                features: string[];
                usdRate?: number;
                accentGradient: string;
                icon: React.ReactNode;
                borderColor: string;
                currency?: "eur" | "usd";
                renderPrice?: React.ReactNode;
              }

              const PriceBlock: React.FC<{
                euro: number;
                usdRate?: number;
                usdOverride?: number;
                minutes: number;
                currency?: "eur" | "usd";
              }> = ({ euro, usdRate, usdOverride, minutes, currency }) => {
                if (currency) {
                  const code = currency.toUpperCase() as "EUR" | "USD";
                  const formatted = formatBothCurrencies(euro, code);
                  return (
                    <div
                      className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
                      aria-label={intl.formatMessage({ id: "pricing.ariaLabel" })}
                    >
                      <div className="flex items-end gap-3">
                        <span className="text-4xl sm:text-5xl font-black text-gray-900 leading-none">
                          {formatted}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-white font-bold shadow-lg">
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        <span>{minutes} min</span>
                      </div>
                    </div>
                  );
                }

                const effectiveRate: number =
                  typeof usdRate === "number" ? usdRate : DEFAULT_USD_RATE;
                const usdValue =
                  typeof usdOverride === "number"
                    ? usdOverride
                    : Math.round(euro * effectiveRate);

                return (
                  <div
                    className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
                    aria-label={intl.formatMessage({ id: "pricing.ariaLabel" })}
                  >
                    <div className="flex items-end gap-3">
                      <span className="text-4xl sm:text-5xl font-black text-gray-900 leading-none">
                        {formatBothCurrencies(euro, "EUR")}
                      </span>
                      <span className="text-xl sm:text-2xl font-extrabold text-gray-700 leading-none">
                        ({formatBothCurrencies(usdValue, "USD")})
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-white font-bold shadow-lg">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      <span>{minutes} min</span>
                    </div>
                  </div>
                );
              };

              const OfferCard: React.FC<OfferCardProps> = ({
                badge,
                title,
                minutes,
                euroPrice,
                usdOverride,
                description,
                features,
                usdRate,
                accentGradient,
                icon,
                borderColor,
                currency,
                renderPrice,
              }) => {
                return (
                  <article
                    className={`group relative h-full flex flex-col p-6 sm:p-8 rounded-3xl border-4 ${borderColor} bg-white backdrop-blur-sm transition-all duration-300 hover:shadow-[0_20px_80px_rgba(220,38,38,0.4)] hover:scale-[1.02] focus-within:scale-[1.02] overflow-hidden`}
                    aria-label={intl.formatMessage(
                      { id: "pricing.card.ariaLabel" },
                      { title, minutes }
                    )}
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentGradient} opacity-[0.05] group-hover:opacity-[0.08] transition-opacity duration-300`}
                      aria-hidden="true"
                    />
                    <div className="relative z-10 flex-1 flex flex-col">
                      <div className="flex items-center justify-between mb-5 sm:mb-6">
                        <div className="inline-flex items-center gap-2 bg-red-600 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-white text-xs sm:text-sm font-bold shadow-lg">
                          {icon}
                          <FormattedMessage id={badge} />
                        </div>
                        <div className="text-xs sm:text-sm text-gray-700 font-bold">
                          <FormattedMessage id="callInApprox5Min" />
                        </div>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 drop-shadow-sm">
                        <FormattedMessage id={title} />
                      </h3>
                      <p className="text-gray-700 mb-5 sm:mb-6 leading-relaxed text-sm sm:text-base font-medium">
                        <FormattedMessage id={description} />
                      </p>

                      {renderPrice ?? (
                        <PriceBlock
                          euro={euroPrice}
                          usdRate={usdRate}
                          usdOverride={usdOverride}
                          minutes={minutes}
                          currency={currency}
                        />
                      )}

                      <ul
                        className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3"
                        role="list"
                        aria-label={intl.formatMessage({ id: "pricing.benefits.ariaLabel" })}
                      >
                        {features.map((f, i) => (
                          <li
                            key={i}
                            role="listitem"
                            className="flex items-start gap-2 sm:gap-3"
                          >
                            <span
                              className={`mt-0.5 sm:mt-1 inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br ${accentGradient} shadow-lg`}
                              aria-hidden="true"
                            >
                              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                            </span>
                            <span className="text-gray-800 text-sm sm:text-base font-medium">{f}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-6 sm:mt-8 md:mt-auto">
                        <Link
                          to="/sos-appel"
                          className={`inline-flex items-center justify-center w-full px-5 sm:px-6 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-500 ${`bg-gradient-to-r ${accentGradient}`} hover:scale-105 shadow-[0_10px_40px_rgba(220,38,38,0.4)] hover:shadow-[0_15px_60px_rgba(220,38,38,0.6)]`}
                          aria-label={intl.formatMessage(
                            { id: "pricing.cta.ariaLabel" },
                            { title }
                          )}
                        >
                          <FormattedMessage id="bookMyConsultation" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              };

              const expatBenefits: string[] = [
                intl.formatMessage({ id: "benefits.expat.experience" }),
                intl.formatMessage({ id: "benefits.expat.housing" }),
                intl.formatMessage({ id: "benefits.expat.procedures" }),
                intl.formatMessage({ id: "benefits.expat.cultural" }),
                intl.formatMessage({ id: "benefits.expat.network" }),
                intl.formatMessage({ id: "benefits.expat.support" }),
              ];

              const lawyerBenefits: string[] = [
                intl.formatMessage({ id: "benefits.lawyer.analysis" }),
                intl.formatMessage({ id: "benefits.lawyer.advice" }),
                intl.formatMessage({ id: "benefits.lawyer.confidentiality" }),
                intl.formatMessage({ id: "benefits.lawyer.response" }),
                intl.formatMessage({ id: "benefits.lawyer.expertise" }),
                intl.formatMessage({ id: "benefits.lawyer.guidance" }),
              ];

              const expatExamples = useMemo(
                () => [
                  intl.formatMessage({ id: "examples.expat.housing" }),
                  intl.formatMessage({ id: "examples.expat.schooling" }),
                  intl.formatMessage({ id: "examples.expat.immigration" }),
                ],
                [intl]
              );

              const lawyerExamples = useMemo(
                () => [
                  intl.formatMessage({ id: "examples.lawyer.contract" }),
                  intl.formatMessage({ id: "examples.lawyer.dispute" }),
                  intl.formatMessage({ id: "examples.lawyer.accident" }),
                ],
                [intl]
              );

              const additionalExamples = useMemo(
                () => [
                  intl.formatMessage({ id: "examples.additional.justice" }),
                  intl.formatMessage({ id: "examples.additional.job" }),
                  intl.formatMessage({ id: "examples.additional.network" }),
                ],
                [intl]
              );

              const combinedExamples: string[] = Array.from(
                new Set([
                  ...expatExamples,
                  ...lawyerExamples,
                  ...additionalExamples,
                ])
              );

              const renderStaticPricing = (): JSX.Element => (
                <>
                  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
                    <header className="text-center mb-12 sm:mb-16">
                      <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-full px-5 sm:px-6 py-2.5 sm:py-3 border border-white/30 mb-5 sm:mb-6 shadow-xl">
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                        <span className="text-white font-bold text-sm sm:text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                          <FormattedMessage id="pricingBadge" />
                        </span>
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-300" aria-hidden="true" />
                      </div>

                      <h2
                        id="pricing-title"
                        className="text-4xl sm:text-5xl font-black text-white mb-3 sm:mb-4 drop-shadow-2xl"
                      >
                        <FormattedMessage id="pricing.heading" />{" "}
                        <span className="text-white">
                          <FormattedMessage id="pricing.headingHighlight" />
                        </span>{" "}
                        <FormattedMessage id="pricing.headingEnd" />
                      </h2>
                      <p className="text-lg sm:text-xl text-white max-w-3xl mx-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
                        <FormattedMessage
                          id="pricing.choosePerson"
                          values={{
                            strong: (chunks) => <strong className="text-white">{chunks}</strong>,
                          }}
                        />
                      </p>
                    </header>

                    <div className="grid gap-6 sm:gap-8 md:grid-cols-2 items-stretch max-w-5xl mx-auto">
                      <OfferCard
                        badge="pricing.expat.badge"
                        title="pricing.expat.title"
                        minutes={30}
                        euroPrice={19}
                        usdOverride={25}
                        description="pricing.expat.description"
                        features={expatBenefits}
                        accentGradient="from-red-500 to-red-600"
                        icon={<User className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />}
                        borderColor="border-red-200"
                      />
                      <OfferCard
                        badge="pricing.lawyer.badge"
                        title="pricing.lawyer.title"
                        minutes={20}
                        euroPrice={49}
                        usdOverride={55}
                        description="pricing.lawyer.description"
                        features={lawyerBenefits}
                        accentGradient="from-red-600 to-red-700"
                        icon={<Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />}
                        borderColor="border-red-300"
                      />
                    </div>

                    <div
                      className="mt-8 sm:mt-10 rounded-3xl border border-white/30 bg-white/10 backdrop-blur-sm p-5 sm:p-6 md:p-8 max-w-5xl mx-auto"
                      role="region"
                      aria-labelledby="examples-title"
                    >
                      <header className="flex flex-col items-center gap-3 mb-5 sm:mb-6">
                        <div className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-red-600 shadow-lg">
                          <Sparkles className="text-white w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                        </div>
                        <h3
                          id="examples-title"
                          className="text-lg sm:text-xl md:text-2xl font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                        >
                          <FormattedMessage id="concreteExamples" />
                        </h3>
                        <p className="text-white/95 text-xs sm:text-sm md:text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                          <FormattedMessage id="concreteExamplesDescription" />
                        </p>
                      </header>

                      <ul className="grid gap-2.5 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" role="list">
                        {combinedExamples.map((ex, i) => (
                          <li
                            key={i}
                            className="group flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
                            role="listitem"
                          >
                            <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-600 shadow-md" aria-hidden="true">
                              <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                            </span>
                            <span className="text-white text-xs sm:text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">{ex}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <footer className="mt-10 sm:mt-14 text-center">
                      <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 bg-white/10 backdrop-blur-sm rounded-2xl px-5 sm:px-6 md:px-8 py-3 sm:py-4 border border-white/20" role="list">
                        <div className="flex items-center space-x-2 text-white" role="listitem">
                          <Shield className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                          <span className="font-medium text-xs sm:text-sm md:text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                            <FormattedMessage id="confidentialityGuarantee" />
                          </span>
                        </div>
                        <div className="hidden sm:block w-px h-6 bg-white/30" aria-hidden="true" />
                        <div className="flex items-center space-x-2 text-white" role="listitem">
                          <Globe className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                          <span className="font-medium text-xs sm:text-sm md:text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                            <FormattedMessage id="expertsIn150Countries" />
                          </span>
                        </div>
                        <div className="hidden sm:block w-px h-6 bg-white/30" aria-hidden="true" />
                        <div className="flex items-center space-x-2 text-white" role="listitem">
                          <Zap className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                          <span className="font-medium text-xs sm:text-sm md:text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                            <FormattedMessage id="instantReservation" />
                          </span>
                        </div>
                      </div>
                    </footer>
                  </div>
                </>
              );

              return (
                <>
                  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
                    <header className="text-center mb-12 sm:mb-16">
                      <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-sm rounded-full px-5 sm:px-6 py-2.5 sm:py-3 border border-white/30 mb-5 sm:mb-6 shadow-xl">
                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-white" aria-hidden="true" />
                        <span className="text-white font-bold text-sm sm:text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                          <FormattedMessage id="pricingBadge" />
                        </span>
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-300" aria-hidden="true" />
                      </div>

                      <h2
                        id="pricing-title"
                        className="text-4xl sm:text-5xl font-black text-white mb-3 sm:mb-4 drop-shadow-2xl"
                      >
                        <FormattedMessage id="pricing.heading" />{" "}
                        <span className="text-white">
                          <FormattedMessage id="pricing.headingHighlight" />
                        </span>{" "}
                        <FormattedMessage id="pricing.headingEnd" />
                      </h2>
                      <p className="text-lg sm:text-xl text-white max-w-3xl mx-auto drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)]">
                        <FormattedMessage
                          id="pricing.choosePerson"
                          values={{
                            strong: (chunks) => <strong className="text-white">{chunks}</strong>,
                          }}
                        />
                      </p>
                    </header>

                    {pricingLoading ? (
                      <div className="text-center py-12 sm:py-16" role="status">
                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-red-400 mx-auto mb-4" aria-hidden="true" />
                        <p className="text-white text-sm sm:text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                          {intl.formatMessage({ id: "pricing.loading" })}
                        </p>
                      </div>
                    ) : pricingError || !pricing ? (
                      renderStaticPricing()
                    ) : (
                      <>
                        <div className="text-center mb-6 sm:mb-8">
                          <div className="inline-flex bg-white/15 rounded-full p-1 backdrop-blur-sm border border-white/30" role="radiogroup" aria-label={intl.formatMessage({ id: "pricing.currencySelector.ariaLabel" })}>
                            <button
                              onClick={() => setSelectedCurrency("eur")}
                              className={`px-4 sm:px-6 py-2 rounded-full transition-all font-semibold text-sm sm:text-base ${
                                selectedCurrency === "eur"
                                  ? "bg-red-600 text-white shadow-lg"
                                  : "text-white hover:bg-white/15"
                              }`}
                              role="radio"
                              aria-checked={selectedCurrency === "eur"}
                              aria-label="EUR"
                            >
                              🇪🇺 EUR
                            </button>
                            <button
                              onClick={() => setSelectedCurrency("usd")}
                              className={`px-4 sm:px-6 py-2 rounded-full transition-all font-semibold text-sm sm:text-base ${
                                selectedCurrency === "usd"
                                  ? "bg-red-600 text-white shadow-lg"
                                  : "text-white hover:bg-white/15"
                              }`}
                              role="radio"
                              aria-checked={selectedCurrency === "usd"}
                              aria-label="USD"
                            >
                              🇺🇸 USD
                            </button>
                          </div>
                        </div>

                        {(() => {
                          const currency = selectedCurrency;
                          const currencySymbol = currency === "eur" ? "€" : "$";

                          const effLawyer = getEffectivePrice(
                            pricing as any,
                            "lawyer",
                            currency
                          ) as EffectivePrice;
                          const effExpat = getEffectivePrice(
                            pricing as any,
                            "expat",
                            currency
                          ) as EffectivePrice;

                          const minutesLawyer = pricing.lawyer[currency].duration;
                          const minutesExpat = pricing.expat[currency].duration;

                          const renderEffPrice = (
                            eff: EffectivePrice,
                            minutes: number
                          ) => (
                            <div
                              className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
                              aria-label={intl.formatMessage({ id: "pricing.ariaLabel" })}
                            >
                              <div className="flex items-end gap-2">
                                {eff.override ? (
                                  <div className="flex items-end gap-2">
                                    <span className="line-through text-gray-500 text-lg sm:text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                                      {currencySymbol}
                                      {eff.standard.totalAmount.toFixed(2)}
                                    </span>
                                    <span className="text-4xl sm:text-5xl font-bold text-gray-900 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                                      {currencySymbol}
                                      {eff.price.totalAmount.toFixed(2)}
                                    </span>
                                    {eff.override?.label && (
                                      <span className="text-xs px-2 py-1 bg-red-600 text-white rounded-full shadow-md">
                                        {eff.override.label}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-4xl sm:text-5xl font-bold text-gray-900 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                                    {currencySymbol}
                                    {eff.price.totalAmount.toFixed(0)}
                                  </span>
                                )}
                              </div>
                              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-white font-semibold shadow-lg">
                                <Clock className="w-4 h-4" aria-hidden="true" />
                                <span>{minutes} min</span>
                              </div>
                            </div>
                          );

                          return (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
                              <OfferCard
                                badge="pricing.expat.badge"
                                title="pricing.expat.title"
                                minutes={minutesExpat}
                                euroPrice={effExpat.price.totalAmount}
                                description="pricing.expat.description"
                                features={expatBenefits}
                                accentGradient="from-red-500 to-red-600"
                                icon={<User className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />}
                                borderColor="border-red-200"
                                renderPrice={renderEffPrice(
                                  effExpat,
                                  minutesExpat
                                )}
                              />

                              <OfferCard
                                badge="pricing.lawyer.badge"
                                title="pricing.lawyer.title"
                                minutes={minutesLawyer}
                                euroPrice={effLawyer.price.totalAmount}
                                description="pricing.lawyer.description"
                                features={lawyerBenefits}
                                accentGradient="from-red-600 to-red-700"
                                icon={<Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />}
                                borderColor="border-red-300"
                                renderPrice={renderEffPrice(
                                  effLawyer,
                                  minutesLawyer
                                )}
                              />
                            </div>
                          );
                        })()}

                        <div className="text-center mt-5 sm:mt-6">
                          <span className="text-xs text-white/70 bg-white/10 px-3 py-1 rounded-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                            <FormattedMessage id="pricing.adminSync" />
                          </span>
                        </div>

                        <div
                          className="mt-8 sm:mt-10 rounded-3xl border border-white/30 bg-white/10 backdrop-blur-sm p-5 sm:p-6 md:p-8 max-w-5xl mx-auto"
                          role="region"
                          aria-labelledby="examples-title"
                        >
                          <header className="flex flex-col items-center gap-3 mb-5 sm:mb-6">
                            <div className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-red-600 shadow-lg">
                              <Sparkles className="text-white w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                            </div>
                            <h3
                              id="examples-title"
                              className="text-lg sm:text-xl md:text-2xl font-extrabold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                            >
                              <FormattedMessage id="concreteExamples" />
                            </h3>
                            <p className="text-white/95 text-xs sm:text-sm md:text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                              <FormattedMessage id="concreteExamplesDescription" />
                            </p>
                          </header>

                          <ul className="grid gap-2.5 sm:gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" role="list">
                            {combinedExamples.map((ex, i) => (
                              <li
                                key={i}
                                className="group flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
                                role="listitem"
                              >
                                <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-600 shadow-md" aria-hidden="true">
                                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                                </span>
                                <span className="text-white text-xs sm:text-sm drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">{ex}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <footer className="mt-10 sm:mt-14 text-center">
                          <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 bg-white/10 backdrop-blur-sm rounded-2xl px-5 sm:px-6 md:px-8 py-3 sm:py-4 border border-white/20" role="list">
                            <div className="flex items-center space-x-2 text-white" role="listitem">
                              <Shield className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                              <span className="font-medium text-xs sm:text-sm md:text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                                <FormattedMessage id="confidentialityGuarantee" />
                              </span>
                            </div>
                            <div className="hidden sm:block w-px h-6 bg-white/30" aria-hidden="true" />
                            <div className="flex items-center space-x-2 text-white" role="listitem">
                              <Globe className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                              <span className="font-medium text-xs sm:text-sm md:text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                                <FormattedMessage id="expertsIn150Countries" />
                              </span>
                            </div>
                            <div className="hidden sm:block w-px h-6 bg-white/30" aria-hidden="true" />
                            <div className="flex items-center space-x-2 text-white" role="listitem">
                              <Zap className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                              <span className="font-medium text-xs sm:text-sm md:text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                                <FormattedMessage id="instantReservation" />
                              </span>
                            </div>
                          </div>
                        </footer>
                      </>
                    )}
                  </div>
                </>
              );
            })()}
          </section>

          {/* SECTION 4: POURQUOI CHOISIR - BLANC PUR */}
          <section
            className="py-24 sm:py-32 bg-white"
            aria-labelledby="why-title"
          >
            {void features.length}

            {(() => {
              interface AdvantageItem {
                id: string;
                title: string;
                tagline: string;
                caption: string;
                icon: React.ReactNode;
                gradient: string;
              }

              const advantages: AdvantageItem[] = useMemo(
                () => [
                  {
                    id: "speed-worldwide",
                    title: intl.formatMessage({ id: "advantage.speed.title" }),
                    tagline: intl.formatMessage({
                      id: "advantage.speed.tagline",
                    }),
                    caption: intl.formatMessage({
                      id: "advantage.speed.caption",
                    }),
                    icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />,
                    gradient: "from-red-600 to-red-700",
                  },
                  {
                    id: "coffee-fast",
                    title: intl.formatMessage({ id: "advantage.coffee.title" }),
                    tagline: intl.formatMessage({
                      id: "advantage.coffee.tagline",
                    }),
                    caption: intl.formatMessage({
                      id: "advantage.coffee.caption",
                    }),
                    icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />,
                    gradient: "from-red-700 to-red-800",
                  },
                  {
                    id: "multi",
                    title: intl.formatMessage({ id: "advantage.multi.title" }),
                    tagline: intl.formatMessage({
                      id: "advantage.multi.tagline",
                    }),
                    caption: intl.formatMessage({
                      id: "advantage.multi.caption",
                    }),
                    icon: <Globe className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />,
                    gradient: "from-red-500 to-red-600",
                  },
                ],
                [intl]
              );

              const AdvantageCard: React.FC<{ item: AdvantageItem }> = ({
                item,
              }) => {
                return (
                  <article
                    className="group relative rounded-3xl border border-red-100 bg-white p-6 sm:p-8 md:p-10 shadow-sm transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] focus-within:scale-[1.02] text-center"
                    aria-labelledby={`adv-title-${item.id}`}
                    tabIndex={0}
                  >
                    <div
                      className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-300 rounded-3xl`}
                      aria-hidden="true"
                    />
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="relative mb-5 sm:mb-6">
                        <div
                          className={`mx-auto flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-lg`}
                          aria-hidden="true"
                        >
                          {item.icon}
                        </div>
                      </div>

                      <h3
                        id={`adv-title-${item.id}`}
                        className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-snug"
                      >
                        {item.title}
                      </h3>

                      <p className="mt-3 text-gray-600 max-w-[36ch] text-sm sm:text-base">
                        {item.tagline}
                      </p>

                      <div className="mt-5 sm:mt-6 flex items-center justify-center">
                        <span
                          className={`inline-flex rounded-full p-[1px] bg-gradient-to-r ${item.gradient} shadow-md`}
                        >
                          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs sm:text-sm text-gray-600">
                            <span
                              className={`inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gradient-to-r ${item.gradient}`}
                              aria-hidden="true"
                            />
                            {item.caption}
                          </span>
                        </span>
                      </div>
                    </div>
                  </article>
                );
              };

              return (
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                  <header className="text-center mb-10 sm:mb-12 md:mb-16">
                    <h2
                      id="why-title"
                      className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 sm:mb-6"
                    >
                      <FormattedMessage id="why.heading" />{" "}
                      <span className="text-red-600">
                        <FormattedMessage id="why.headingHighlight" />
                      </span>
                      <FormattedMessage id="why.headingEnd" />
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                      <FormattedMessage id="home.mobileFirstDesc" />
                    </p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8" role="list">
                    {advantages.map((adv) => (
                      <AdvantageCard key={adv.id} item={adv} />
                    ))}
                  </div>
                </div>
              );
            })()}
          </section>

          {/* SECTION 5: REJOIGNEZ - NOIR PUR AVEC EFFETS ROUGES */}
          <section
            className="py-24 sm:py-32 bg-gray-950 relative overflow-hidden"
            aria-labelledby="join-title"
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 right-1/3 w-[700px] h-[700px] bg-red-600/20 rounded-full blur-3xl animate-pulse" aria-hidden="true" />
              <div className="absolute bottom-1/4 left-1/3 w-[700px] h-[700px] bg-red-700/20 rounded-full blur-3xl animate-pulse delay-1000" aria-hidden="true" />
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:32px_32px]" aria-hidden="true" />

            {(() => {
              interface JoinCardProps {
                label: string;
                title: string;
                benefits: string[];
                ctaLabel: string;
                ctaHref: string;
                icon: React.ReactNode;
                gradient: string;
              }

              const JoinCard: React.FC<JoinCardProps> = ({
                label,
                title,
                benefits,
                ctaLabel,
                ctaHref,
                icon,
                gradient,
              }) => {
                return (
                  <article className="group relative h-full flex flex-col rounded-3xl border-4 border-white/50 bg-white backdrop-blur-sm p-6 sm:p-8 md:p-10 shadow-[0_12px_60px_rgba(0,0,0,0.6)] transition-all duration-300 hover:shadow-[0_20px_80px_rgba(0,0,0,0.8)]">
                    <div
                      className={`pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br ${gradient} opacity-[0.05] group-hover:opacity-[0.08] transition-opacity duration-300`}
                      aria-hidden="true"
                    />
                    <div className="relative z-10 flex-1 flex flex-col">
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1.5 text-white shadow-lg">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-lg text-white bg-white/20 shadow-md`}
                            aria-hidden="true"
                          >
                            {icon}
                          </span>
                          <span className="text-xs sm:text-sm font-bold">{label}</span>
                        </div>
                      </div>

                      <h3 className="mt-5 sm:mt-6 text-xl sm:text-2xl md:text-3xl font-black text-gray-900">
                        {title}
                      </h3>

                      <ul
                        className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3 mb-3"
                        role="list"
                        aria-label={intl.formatMessage({ id: "join.benefits.ariaLabel" })}
                      >
                        {benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-2.5 sm:gap-3" role="listitem">
                            <span
                              className={`mt-0.5 sm:mt-1 inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded-full text-white bg-gradient-to-r ${gradient} shadow-md`}
                              aria-hidden="true"
                            >
                              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </span>
                            <span className="text-gray-800 text-sm sm:text-base font-medium">{b}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-6 sm:mt-8 md:mt-auto">
                        <a
                          href={ctaHref}
                          className={`group/cta inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 sm:px-6 py-3 sm:py-4 font-bold text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-500 bg-gradient-to-r ${gradient} hover:scale-105 hover:text-white shadow-[0_10px_40px_rgba(220,38,38,0.4)] hover:shadow-[0_15px_60px_rgba(220,38,38,0.6)] text-sm sm:text-base`}
                          aria-label={ctaLabel}
                        >
                          {ctaLabel}
                          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                        </a>
                        <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm text-gray-700 font-medium">
                          <FormattedMessage
                            id="join.appTip"
                            values={{
                              strong: (chunks) => <strong className="text-gray-900 font-bold">{chunks}</strong>,
                            }}
                          />
                        </p>
                      </div>
                    </div>
                  </article>
                );
              };

              const joinTitle = intl.formatMessage({ id: "join.title" });
              const joinSubtitle = intl.formatMessage({ id: "join.subtitle" });

              const lawyerCard: JoinCardProps = useMemo(
                () => ({
                  label: intl.formatMessage({ id: "join.lawyer.label" }),
                  title: intl.formatMessage({ id: "join.lawyer.title" }),
                  benefits: [
                    intl.formatMessage({ id: "join.lawyer.benefit1" }),
                    intl.formatMessage({ id: "join.lawyer.benefit2" }),
                    intl.formatMessage({ id: "join.lawyer.benefit3" }),
                    intl.formatMessage({ id: "join.lawyer.benefit4" }),
                    intl.formatMessage({ id: "join.lawyer.benefit5" }),
                    intl.formatMessage({ id: "join.lawyer.benefit6" }),
                  ],
                  ctaLabel: intl.formatMessage({ id: "join.lawyer.cta" }),
                  ctaHref: "/register/lawyer",
                  icon: <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />,
                  gradient: "from-red-600 to-red-700",
                }),
                [intl]
              );

              const expatCard: JoinCardProps = useMemo(
                () => ({
                  label: intl.formatMessage({ id: "join.expat.label" }),
                  title: intl.formatMessage({ id: "join.expat.title" }),
                  benefits: [
                    intl.formatMessage({ id: "join.expat.benefit1" }),
                    intl.formatMessage({ id: "join.expat.benefit2" }),
                    intl.formatMessage({ id: "join.expat.benefit3" }),
                    intl.formatMessage({ id: "join.expat.benefit4" }),
                    intl.formatMessage({ id: "join.expat.benefit5" }),
                    intl.formatMessage({ id: "join.expat.benefit6" }),
                    intl.formatMessage({ id: "join.expat.benefit7" }),
                    intl.formatMessage({ id: "join.expat.benefit8" }),
                  ],
                  ctaLabel: intl.formatMessage({ id: "join.expat.cta" }),
                  ctaHref: "/register/expat",
                  icon: <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" aria-hidden="true" />,
                  gradient: "from-red-500 to-red-600",
                }),
                [intl]
              );

              return (
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
                  <header className="text-center mb-10 sm:mb-12 md:mb-16">
                    <h2
                      id="join-title"
                      className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 sm:mb-4 drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
                    >
                      {joinTitle}
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-white max-w-3xl mx-auto drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] font-medium">
                      {joinSubtitle}
                    </p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 md:gap-8 items-stretch">
                    <JoinCard {...expatCard} />
                    <JoinCard {...lawyerCard} />
                  </div>
                </div>
              );
            })()}
          </section>

          {/* SECTION 6: AVIS - BLANC PUR */}
          <section className="py-24 sm:py-32 bg-white relative overflow-hidden" aria-labelledby="reviews-title">
            <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
              <header className="text-center mb-8 sm:mb-10 md:mb-14">
                <span className="inline-flex rounded-full p-[1px] bg-red-600 shadow-md mb-4 sm:mb-5 md:mb-6">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 border border-red-100 text-red-700">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                    <span className="font-semibold text-xs sm:text-sm md:text-base">
                      <FormattedMessage id="reviewsRating" />
                    </span>
                    <Award className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                  </span>
                </span>
                <h2 id="reviews-title" className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                  <FormattedMessage id="reviews.heading" />{" "}
                  <span className="text-red-600">
                    <FormattedMessage id="reviews.headingHighlight" />
                  </span>
                </h2>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-xl text-gray-600 max-w-3xl mx-auto">
                  <FormattedMessage id="reviewsDescription" />
                </p>
              </header>

              <ReviewsSlider theme="light" />
            </div>
          </section>

          {/* SECTION 7: FAQ - BLANC PUR */}
          <section className="py-24 sm:py-32 bg-white relative overflow-hidden" aria-labelledby="faq-title">
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
              <header className="text-center mb-12 sm:mb-16">
                <div className="inline-flex items-center space-x-2 bg-red-50 rounded-full px-5 sm:px-6 py-2.5 sm:py-3 border border-red-200 mb-5 sm:mb-6 shadow-md">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" aria-hidden="true" />
                  <span className="text-red-700 font-bold text-sm sm:text-base">
                    <FormattedMessage id="faq.badge" />
                  </span>
                </div>

                <h2 id="faq-title" className="text-4xl sm:text-5xl font-black text-gray-900 mb-3 sm:mb-4">
                  <FormattedMessage id="faq.heading" />{" "}
                  <span className="text-red-600">
                    <FormattedMessage id="faq.headingHighlight" />
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                  <FormattedMessage id="faq.description" />
                </p>
              </header>

              <div className="space-y-4 sm:space-y-6" role="list">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <details
                    key={num}
                    className="group bg-white rounded-2xl border border-gray-200 hover:border-red-300 transition-all duration-300 shadow-sm hover:shadow-lg"
                    role="listitem"
                  >
                    <summary className="flex items-center justify-between p-6 sm:p-8 cursor-pointer list-none">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 pr-4 flex-1">
                        <FormattedMessage id={`faq.q${num}`} />
                      </h3>
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white group-open:rotate-180 transition-transform duration-300">
                        <ChevronRightIcon className="w-5 h-5 rotate-90" aria-hidden="true" />
                      </div>
                    </summary>
                    <div className="px-6 sm:px-8 pb-6 sm:pb-8 text-gray-700 text-base sm:text-lg leading-relaxed">
                      <FormattedMessage id={`faq.a${num}`} />
                    </div>
                  </details>
                ))}
              </div>

              <div className="mt-12 sm:mt-16 text-center">
                <p className="text-gray-600 mb-6 text-base sm:text-lg">
                  <FormattedMessage id="faq.moreQuestions" />
                </p>
                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 sm:px-10 py-4 sm:py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 hover:scale-105 shadow-lg"
                  aria-label={intl.formatMessage({ id: "faq.contactUs.ariaLabel" })}
                >
                  <Phone className="w-5 h-5" aria-hidden="true" />
                  <FormattedMessage id="faq.contactUs" />
                </a>
              </div>
            </div>
          </section>

          {/* SECTION 8: CTA FINAL - ROUGE PUR IMPACTANT */}
          <section className="py-24 sm:py-32 bg-gradient-to-b from-red-600 via-red-700 to-red-800 relative overflow-hidden" aria-labelledby="cta-final-title">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] bg-red-500/30 rounded-full blur-3xl animate-pulse" aria-hidden="true" />
              <div className="absolute bottom-1/4 right-1/4 w-[800px] h-[800px] bg-red-700/25 rounded-full blur-3xl animate-pulse delay-700" aria-hidden="true" />
            </div>
            
            <div className="relative z-10 max-w-5xl mx-auto text-center px-4 sm:px-6">
              <h2 id="cta-final-title" className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-5 sm:mb-6 md:mb-8 drop-shadow-[0_6px_30px_rgba(0,0,0,0.9)]">
                <FormattedMessage id="readyToBeHelped" />
              </h2>
              <p className="text-lg sm:text-xl md:text-2xl text-white/95 mb-8 sm:mb-10 md:mb-12 leading-relaxed max-w-3xl mx-auto drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] font-medium">
                <FormattedMessage
                  id="pricing.ctaDesc"
                  values={{
                    strong: (chunks) => <strong className="font-black text-white">{chunks}</strong>,
                  }}
                />
              </p>

              <div className="mb-8 sm:mb-10 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-white" role="list">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/30 px-3 sm:px-4 py-1.5 sm:py-2 border-2 border-white/50 backdrop-blur-sm text-xs sm:text-sm font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" role="listitem">
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                  <FormattedMessage id="securedLabel" />
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/30 px-3 sm:px-4 py-1.5 sm:py-2 border-2 border-white/50 backdrop-blur-sm text-xs sm:text-sm font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" role="listitem">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                  <FormattedMessage id="lessThan5Minutes" />
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/30 px-3 sm:px-4 py-1.5 sm:py-2 border-2 border-white/50 backdrop-blur-sm text-xs sm:text-sm font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]" role="listitem">
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                  <FormattedMessage id="worldwideLabel" />
                </span>
              </div>

              <nav className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-5 sm:gap-7" aria-label={intl.formatMessage({ id: "cta.final.ariaLabel" })}>
                <a
                  href="/register"
                  className="group relative overflow-hidden bg-white hover:bg-gray-50 text-red-700 hover:text-red-800 px-10 sm:px-12 py-5 sm:py-6 rounded-full font-black text-lg sm:text-xl transition-all duration-300 hover:scale-110 shadow-[0_0_60px_rgba(255,255,255,0.4)] hover:shadow-[0_0_80px_rgba(255,255,255,0.6)] flex items-center justify-center gap-3 sm:gap-4 touch-manipulation"
                  aria-label={intl.formatMessage({ id: "startFree.ariaLabel" })}
                >
                  <span>
                    <FormattedMessage id="startFree" />
                  </span>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1.5 transition-transform duration-300" aria-hidden="true" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" aria-hidden="true" />
                </a>

                <a
                  href="/sos-appel"
                  className="group relative overflow-hidden bg-white/10 hover:bg-white/20 backdrop-blur-xl text-white px-10 sm:px-12 py-5 sm:py-6 rounded-full font-bold text-lg sm:text-xl transition-all duration-300 hover:scale-105 shadow-[0_0_40px_rgba(0,0,0,0.5)] hover:shadow-[0_0_60px_rgba(0,0,0,0.7)] flex items-center justify-center gap-3 sm:gap-4 touch-manipulation border-3 border-white/40"
                  aria-label={intl.formatMessage({ id: "urgentNow.ariaLabel" })}
                >
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" aria-hidden="true" />
                  <span>
                    <FormattedMessage id="urgentNow" />
                  </span>
                </a>
              </nav>
            </div>
          </section>
        </main>
      </Layout>
    </>
  );
};

export default OptimizedHomePage;