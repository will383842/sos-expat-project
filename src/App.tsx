// App.tsx
import React, { useEffect, Suspense, lazy, useState } from "react";
import { IntlProvider } from "react-intl";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useDeviceDetection } from "./hooks/useDeviceDetection";
import { registerSW, measurePerformance } from "./utils/performance";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoutesV2 from "@/components/admin/AdminRoutesV2";
import "./App.css";
import TemplatesEmails from "./pages/admin/marketing/TemplatesEmails";
import NotificationsRouting from "./pages/admin/marketing/Notifications";
import DelivrabiliteLogs from "./pages/admin/marketing/Delivrabilite";
import MessagesTempsReel from "./pages/admin/marketing/MessagesTempsReel";
import enMessages from "./helper/en.json";
import esMessages from "./helper/es.json";
import frMessages from "./helper/fr.json";
import ruMessages from "./helper/ru.json";
import deMessages from "./helper/de.json";
import hiMessages from "./helper/hi.json";
import ptMessages from "./helper/pt.json";
import chMessages from "./helper/ch.json";
import arMessages from './helper/ar.json';
import { useApp } from "./contexts/AppContext";
import {
  LocaleRouter,
  getLocaleString,
  parseLocaleFromPath,
  getTranslatedRouteSlug,
  getAllTranslatedSlugs,
  getRouteKeyFromSlug,
  type RouteKey,
} from "./multilingual-system";
import HreflangLinks from "./multilingual-system/components/HrefLang/HreflangLinks";

// --------------------------------------------
// Types
// --------------------------------------------
interface RouteConfig {
  path: string;
  component:
  | React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>
  | React.ComponentType<Record<string, unknown>>;
  protected?: boolean;
  role?: string;
  alias?: string;
  preload?: boolean;
  translated?: RouteKey;
}

// --------------------------------------------
// Lazy pages
// --------------------------------------------

// Accueil
const Home = lazy(() => import("./pages/Home"));

// Auth
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const RegisterExpat = lazy(() => import("./pages/RegisterExpat"));
const RegisterLawyer = lazy(() => import("./pages/RegisterLawyer"));
const RegisterClient = lazy(() => import("./pages/RegisterClient"));
const PasswordReset = lazy(() => import("./pages/PasswordReset"));

// Utilisateur
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit"));
const DashboardMessages = lazy(
  () => import("@/components/dashboard/DashboardMessages")
);

// Services
const SOSCall = lazy(() => import("./pages/SOSCall"));
const ExpatCall = lazy(() => import("./pages/ExpatCall"));
const CallCheckout = lazy(() => import("./pages/CallCheckout"));
const BookingRequest = lazy(() => import("./pages/BookingRequest"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const ProviderProfile = lazy(() => import("./pages/ProviderProfile"));
const Providers = lazy(() => import("./pages/Providers"));
const Pricing = lazy(() => import("./pages/Pricing"));

// Pages d'info
const SEO = lazy(() => import("./pages/SEO"));
const ServiceStatus = lazy(() => import("./pages/ServiceStatus"));
const Consumers = lazy(() => import("./pages/Consumers"));
const Cookies = lazy(() => import("./pages/Cookies"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsExpats = lazy(() => import("./pages/TermsExpats"));
const TermsLawyers = lazy(() => import("./pages/TermsLawyers"));
const TermsClients = lazy(() => import("./pages/TermsClients"));
const TestimonialDetail = lazy(() => import("./pages/TestimonialDetail"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Contact = lazy(() => import("./pages/Contact"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));

// Error pages
const NotFound = lazy(() => import("./pages/NotFound"));

// -------------------------------------------
// Laguage config
// -------------------------------------------
const messages = {
  en: enMessages,
  es: esMessages,
  fr: frMessages,
  ru: ruMessages,
  de: deMessages,
  hi: hiMessages,
  pt: ptMessages,
  ch: chMessages,
  ar: arMessages,
};

// --------------------------------------------
// Routes config
// --------------------------------------------

// Publiques (sans EmailVerification)
const routeConfigs: RouteConfig[] = [
  { path: "/", component: Home, preload: true },
  { path: "/login", component: Login, preload: true, translated: "login" },
  { path: "/register", component: Register, preload: true, translated: "register" },
  { path: "/register/client", component: RegisterClient, translated: "register-client" },
  { path: "/register/lawyer", component: RegisterLawyer, translated: "register-lawyer" },
  { path: "/register/expat", component: RegisterExpat, translated: "register-expat" },
  { path: "/password-reset", component: PasswordReset, translated: "password-reset" },

  // Tarifs (alias FR/EN)
  { path: "/tarifs", component: Pricing, alias: "/pricing", preload: true, translated: "pricing" },

  // Contact & aide
  { path: "/contact", component: Contact, translated: "contact" },
  { path: "/how-it-works", component: HowItWorks, translated: "how-it-works" },
  { path: "/faq", component: FAQ, translated: "faq" },
  { path: "/centre-aide", component: HelpCenter, translated: "help-center" },

  // Témoignages
  { path: "/testimonials", component: Testimonials, alias: "/temoignages", translated: "testimonials" },
  // New SEO-friendly URL format: /testimonials/country/language/review-type-urgently
  {
    path: "/testimonials/:country/:language/:reviewType",
    component: TestimonialDetail,
    translated: "testimonials",
  },
  {
    path: "/temoignages/:country/:language/:reviewType",
    component: TestimonialDetail,
    translated: "testimonials",
  },

  // Légal / info (alias FR/EN)
  { path: "/terms-clients", component: TermsClients, alias: "/cgu-clients", translated: "terms-clients" },
  { path: "/terms-lawyers", component: TermsLawyers, alias: "/cgu-avocats", translated: "terms-lawyers" },
  { path: "/terms-expats", component: TermsExpats, alias: "/cgu-expatries", translated: "terms-expats" },
  {
    path: "/privacy-policy",
    component: PrivacyPolicy,
    alias: "/politique-confidentialite",
    translated: "privacy-policy",
  },
  { path: "/cookies", component: Cookies, translated: "cookies" },
  { path: "/consumers", component: Consumers, alias: "/consommateurs", translated: "consumers" },
  { path: "/statut-service", component: ServiceStatus, translated: "service-status" },
  { path: "/seo", component: SEO, alias: "/referencement", translated: "seo" },

  // Services d'appel
  { path: "/sos-appel", component: SOSCall, translated: "sos-call" },
  { path: "/appel-expatrie", component: ExpatCall, translated: "expat-call" },

  // Fournisseurs publics
  { path: "/providers", component: Providers, translated: "providers" },
  { path: "/provider/:id", component: ProviderProfile },
  // Simplified route patterns - just type and slug
  { path: "/avocat/:slug", component: ProviderProfile, translated: "lawyer" },
  { path: "/lawyers/:slug", component: ProviderProfile, translated: "lawyer" },
  { path: "/expatrie/:slug", component: ProviderProfile, translated: "expat" },
  { path: "/expats/:slug", component: ProviderProfile, translated: "expat" },
  // Legacy routes for backward compatibility
  { path: "/avocat/:country/:language/:nameId", component: ProviderProfile, translated: "lawyer" },
  { path: "/avocat/:country/:language/*", component: ProviderProfile, translated: "lawyer" },
  { path: "/expatrie/:country/:language/:nameId", component: ProviderProfile, translated: "expat" },
  { path: "/expatrie/:country/:language/*", component: ProviderProfile, translated: "expat" },
  { path: "/lawyers/:country/:language/:nameId", component: ProviderProfile, translated: "lawyer" },
  { path: "/lawyers/:country/:language/*", component: ProviderProfile, translated: "lawyer" },
  { path: "/expats/:country/:language/:nameId", component: ProviderProfile, translated: "expat" },
  { path: "/expats/:country/:language/*", component: ProviderProfile, translated: "expat" },
];

// Protégées (utilisateur)
const protectedUserRoutes: RouteConfig[] = [
  { path: "/dashboard", component: Dashboard, protected: true, translated: "dashboard" },
  { path: "/profile/edit", component: ProfileEdit, protected: true, translated: "profile-edit" },
  { path: "/call-checkout", component: CallCheckout, protected: true, translated: "call-checkout" },
  {
    path: "/call-checkout/:providerId",
    component: CallCheckout,
    protected: true,
    translated: "call-checkout",
  },
  {
    path: "/booking-request/:providerId",
    component: BookingRequest,
    protected: true,
    translated: "booking-request",
  },
  { path: "/booking-request", component: BookingRequest, protected: true, translated: "booking-request" },
  { path: "/payment-success", component: PaymentSuccess, protected: true, translated: "payment-success" },
  {
    path: "/dashboard/messages",
    component: DashboardMessages,
    protected: true,
    translated: "dashboard-messages",
  },
];

// --------------------------------------------
// SEO par défaut
// --------------------------------------------
const DefaultHelmet: React.FC<{ pathname: string }> = ({ pathname }) => {
  // Remove locale prefix from pathname for metadata lookup
  const { pathWithoutLocale } = parseLocaleFromPath(pathname);
  const pathForMetadata = pathWithoutLocale === "/" ? "/" : pathWithoutLocale;

  const getPageMetadata = (path: string) => {
    const metaMap: Record<
      string,
      { title: string; description: string; lang: string }
    > = {
      "/": {
        title: "Accueil - Consultation Juridique Expatriés",
        description:
          "Service de consultation juridique pour expatriés francophones",
        lang: "fr",
      },
      "/login": {
        title: "Connexion - Consultation Juridique",
        description: "Connectez-vous à votre compte",
        lang: "fr",
      },
      "/pricing": {
        title: "Tarifs - Consultation Juridique",
        description: "Découvrez nos tarifs de consultation",
        lang: "fr",
      },
      "/tarifs": {
        title: "Tarifs - Consultation Juridique",
        description: "Découvrez nos tarifs de consultation",
        lang: "fr",
      },
      "/testimonials": {
        title: "Témoignages Clients - Consultation Juridique Expatriés",
        description:
          "Découvrez les témoignages de nos clients expatriés et avocats partout dans le monde",
        lang: "fr",
      },
      "/temoignages": {
        title: "Témoignages Clients - Consultation Juridique Expatriés",
        description:
          "Découvrez les témoignages de nos clients expatriés et avocats partout dans le monde",
        lang: "fr",
      },
    };

    return (
      metaMap[path] || {
        title: "Consultation Juridique Expatriés",
        description: "Service de consultation juridique pour expatriés",
        lang: "fr",
      }
    );
  };

  const metadata = getPageMetadata(pathForMetadata);
  return (
    <Helmet>
      <html lang={metadata.lang} />
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
      />
      <meta name="theme-color" content="#000000" />
    </Helmet>
  );
};

type Locale = "en" | "es" | "fr" | "de" | "ru" | "pt" | "hi" | "ch" | "ar"; // --------------------------------------------
// App
// --------------------------------------------
const App: React.FC = () => {
  const location = useLocation();
  const { language } = useApp();
  const { isMobile } = useDeviceDetection();
  const [locale, setLocale] = useState<Locale>("es"); // Default to French since your site is French
  console.log("Current locale:", locale);


  // SW + perf
  useEffect(() => {
    registerSW();
    measurePerformance();
  }, []);

  // Scroll top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Préchargement light
  useEffect(() => {
    if (!isMobile) {
      const preloadableRoutes = [
        ...routeConfigs,
        ...protectedUserRoutes,
      ].filter((r) => r.preload);
      if (preloadableRoutes.length > 0) {
        setTimeout(() => {
          // Intentionnellement vide : certains bundlers n'exposent pas _payload
        }, 2000);
      }
    }
  }, [isMobile]);

  useEffect(() => {
    console.log("language", language);
    setLocale(language);
  }, [language]);


  const renderRoute = (config: RouteConfig, index: number) => {
    const {
      path,
      component: Component,
      protected: isProtected,
      role,
      alias,
      translated,
    } = config;

    // Add locale prefix to paths - use simple parameter, validation happens in LocaleRouter
    // React Router v6 doesn't support regex in path params, so we use :locale and validate elsewhere
    const localePrefix = `/:locale`;

    // Handle root path specially - match both with and without trailing slash
    let routes: string[] = [];

    if (path === "/") {
      // For root, create routes that match both /en-us and /en-us/
      routes = [
        `${localePrefix}`,      // Matches /en-us
        `${localePrefix}/`,     // Matches /en-us/
      ];
    } else if (translated) {
      // For translated routes, generate all language variants
      const allSlugs = getAllTranslatedSlugs(translated);

      // Check if the translated slug contains a slash (nested route like "dashboard/messages")
      const hasNestedPath = allSlugs.some(slug => slug.includes("/"));

      if (hasNestedPath) {
        // For nested routes, replace the entire path
        // e.g., "/dashboard/messages" with slug "tableau-de-bord/messages" -> "/tableau-de-bord/messages"
        routes = allSlugs.map(slug => `${localePrefix}/${slug}`);
      } else {
        // Extract the pattern after the first segment
        // e.g., "/avocat/:country/:language/:nameId" -> "/:country/:language/:nameId"
        // e.g., "/register/lawyer" -> ""
        const pathMatch = path.match(/^\/[^/]+(\/.*)?$/);
        const pathPattern = pathMatch && pathMatch[1] ? pathMatch[1] : "";

        // Generate routes for all translated slugs
        routes = allSlugs.map(slug => `${localePrefix}/${slug}${pathPattern}`);
      }

      // Also include the original path for backward compatibility
      routes.push(`${localePrefix}${path}`);

      // Include alias if present
      if (alias) {
        routes.push(`${localePrefix}${alias}`);
      }
    } else {
      // Regular routes
      routes = [
        `${localePrefix}${path}`,
        ...(alias ? [`${localePrefix}${alias}`] : []),
      ];
    }

    return routes.map((routePath, i) => {
      // Debug: log route paths in development
      if (process.env.NODE_ENV === 'development' && path === "/") {
        console.log(`[Route] Registering locale route: ${routePath}`);
      }

      return (
        <Route
          key={`${index}-${i}-${routePath}`}
          path={routePath}
          element={
            isProtected ? (
              <ProtectedRoute allowedRoles={role}>
                <Component />
              </ProtectedRoute>
            ) : (
              <Component />
            )
          }
        />
      );
    });
  };

  return (
    <IntlProvider locale={locale} messages={messages[locale]} defaultLocale="fr" >
      <LocaleRouter>
        <div className={`App ${isMobile ? "mobile-layout" : "desktop-layout"}`}>
          <DefaultHelmet pathname={location.pathname} />

          {/* Dynamically generate hreflang links for all locales */}
          <HreflangLinks pathname={location.pathname} />
            <Suspense fallback={<LoadingSpinner size="large" color="red" />}>
              {/* Routes de l'app */}
              <Routes>
                {/* Root redirect to locale */}
                <Route
                  path="/"
                  element={<Navigate to={`/${getLocaleString(language)}`} replace />}
                />

                {/* Payment success route without locale (backward compatibility) */}
                <Route
                  path="/payment-success"
                  element={
                    <ProtectedRoute>
                      <PaymentSuccess />
                    </ProtectedRoute>
                  }
                />

                {/* Routes with locale prefix - Home route first for root locale path */}
                {routeConfigs
                  .sort((a, b) => {
                    // Put root path first
                    if (a.path === "/") return -1;
                    if (b.path === "/") return 1;
                    return 0;
                  })
                  .map((cfg, i) => renderRoute(cfg, i))}
                {protectedUserRoutes.map((cfg, i) => renderRoute(cfg, i + 1000))}

                {/* Admin routes - no locale prefix */}
                <Route
                  path="/admin"
                  element={<Navigate to="/admin/dashboard" replace />}
                />
                <Route path="/admin/*" element={<AdminRoutesV2 />} />

                {/* Marketing & Communication */}
                <Route
                  path="marketing/templates-emails"
                  element={<TemplatesEmails />}
                />
                <Route
                  path="marketing/notifications"
                  element={<NotificationsRouting />}
                />
                <Route
                  path="marketing/delivrabilite"
                  element={<DelivrabiliteLogs />}
                />
                <Route
                  path="marketing/messages-temps-reel"
                  element={<MessagesTempsReel />}
                />

                {/* 404 - Catch all route (must be last) */}
                <Route path="*" element={<NotFound />} />
              </Routes>

              {/* Routes admin gérées par AdminRoutesV2 */}
            </Suspense>
          </div>
        </LocaleRouter>
      </IntlProvider>
  );
};

export default App;
