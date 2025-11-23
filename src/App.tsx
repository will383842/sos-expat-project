// App.tsx - VERSION CORRIGÉE
import React, { useEffect, Suspense, lazy } from "react";
import { IntlProvider } from "react-intl";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Helmet, HelmetProvider } from "react-helmet-async";
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
import arMessages from "./helper/ar.json";
import { useApp } from "./contexts/AppContext";
import LocaleRouter from "./components/routing/LocaleRouter";
import { getLocaleString, parseLocaleFromPath } from "./utils/localeRoutes";

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

// Auth admin
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));

// -------------------------------------------
// Language config
// -------------------------------------------
import { aaaProfilesTranslations, mergeAaaTranslations } from "./helper/aaaprofiles";

const messages = {
  en: mergeAaaTranslations(enMessages, aaaProfilesTranslations.en),
  es: mergeAaaTranslations(esMessages, aaaProfilesTranslations.es),
  fr: mergeAaaTranslations(frMessages, aaaProfilesTranslations.fr),
  ru: mergeAaaTranslations(ruMessages, aaaProfilesTranslations.ru),
  de: mergeAaaTranslations(deMessages, aaaProfilesTranslations.de),
  hi: mergeAaaTranslations(hiMessages, aaaProfilesTranslations.hi),
  pt: mergeAaaTranslations(ptMessages, aaaProfilesTranslations.pt),
  ch: mergeAaaTranslations(chMessages, aaaProfilesTranslations.zh),
  ar: mergeAaaTranslations(arMessages, aaaProfilesTranslations.ar),
};

// --------------------------------------------
// Routes config
// --------------------------------------------

// Publiques
const routeConfigs: RouteConfig[] = [
  { path: "/", component: Home, preload: true },
  { path: "/login", component: Login, preload: true },
  { path: "/register", component: Register, preload: true },
  { path: "/register/client", component: RegisterClient },
  { path: "/register/lawyer", component: RegisterLawyer },
  { path: "/register/expat", component: RegisterExpat },
  { path: "/password-reset", component: PasswordReset },
  { path: "/tarifs", component: Pricing, alias: "/pricing", preload: true },
  { path: "/contact", component: Contact },
  { path: "/how-it-works", component: HowItWorks },
  { path: "/faq", component: FAQ },
  { path: "/centre-aide", component: HelpCenter },
  { path: "/testimonials", component: Testimonials, alias: "/temoignages" },
  {
    path: "/testimonials/:country/:language/:reviewType",
    component: TestimonialDetail,
  },
  {
    path: "/temoignages/:country/:language/:reviewType",
    component: TestimonialDetail,
  },
  { path: "/terms-clients", component: TermsClients, alias: "/cgu-clients" },
  { path: "/terms-lawyers", component: TermsLawyers, alias: "/cgu-avocats" },
  { path: "/terms-expats", component: TermsExpats, alias: "/cgu-expatries" },
  {
    path: "/privacy-policy",
    component: PrivacyPolicy,
    alias: "/politique-confidentialite",
  },
  { path: "/cookies", component: Cookies },
  { path: "/consumers", component: Consumers, alias: "/consommateurs" },
  { path: "/statut-service", component: ServiceStatus },
  { path: "/seo", component: SEO, alias: "/referencement" },
  { path: "/sos-appel", component: SOSCall },
  { path: "/appel-expatrie", component: ExpatCall },
  { path: "/providers", component: Providers },
  { path: "/provider/:id", component: ProviderProfile },
  { path: "/avocat/:country/:language/:nameId", component: ProviderProfile },
  { path: "/expatrie/:country/:language/:nameId", component: ProviderProfile },
];

// Protégées
const protectedUserRoutes: RouteConfig[] = [
  { path: "/dashboard", component: Dashboard, protected: true },
  { path: "/profile/edit", component: ProfileEdit, protected: true },
  { path: "/call-checkout", component: CallCheckout, protected: true },
  {
    path: "/call-checkout/:providerId",
    component: CallCheckout,
    protected: true,
  },
  {
    path: "/booking-request/:providerId",
    component: BookingRequest,
    protected: true,
  },
  { path: "/booking-request", component: BookingRequest, protected: true },
  { path: "/payment-success", component: PaymentSuccess, protected: true },
  {
    path: "/dashboard/messages",
    component: DashboardMessages,
    protected: true,
  },
];

// --------------------------------------------
// SEO par défaut
// --------------------------------------------
const DefaultHelmet: React.FC<{ pathname: string }> = ({ pathname }) => {
  const { pathWithoutLocale } = parseLocaleFromPath(pathname);
  const pathForMetadata = pathWithoutLocale === "/" ? "/" : pathWithoutLocale;

  const getPageMetadata = (path: string): { title: string; description: string; lang: string } => {
    const metaMap: Record<string, { title: string; description: string; lang: string }> = {
      "/": {
        title: "Accueil - Consultation Juridique Expatriés",
        description: "Service de consultation juridique pour expatriés francophones",
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
        description: "Découvrez les témoignages de nos clients expatriés et avocats partout dans le monde",
        lang: "fr",
      },
      "/temoignages": {
        title: "Témoignages Clients - Consultation Juridique Expatriés",
        description: "Découvrez les témoignages de nos clients expatriés et avocats partout dans le monde",
        lang: "fr",
      },
    };

    return metaMap[path] || {
      title: "Consultation Juridique Expatriés",
      description: "Service de consultation juridique pour expatriés",
      lang: "fr",
    };
  };

  const metadata = getPageMetadata(pathForMetadata);
  
  return (
    <Helmet>
      <html lang={metadata.lang} />
      <title>{metadata.title}</title>
      <meta name="description" content={metadata.description} />
      <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      <meta name="theme-color" content="#000000" />
    </Helmet>
  );
};

type Locale = "en" | "es" | "fr" | "de" | "ru" | "pt" | "hi" | "ch" | "ar";

// --------------------------------------------
// App
// --------------------------------------------
const App: React.FC = () => {
  const location = useLocation();
  const { language } = useApp();
  const { isMobile } = useDeviceDetection();
  const locale = (language as Locale) || "en";

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
      const preloadableRoutes = [...routeConfigs, ...protectedUserRoutes].filter(
        (r) => r.preload
      );
      if (preloadableRoutes.length > 0) {
        setTimeout(() => {
          // Intentionnellement vide
        }, 2000);
      }
    }
  }, [isMobile]);

  // ✅ CORRECTION : Fonction renderRoute simplifiée sans boucle infinie
  const renderRoute = React.useCallback((config: RouteConfig, index: number) => {
    const {
      path,
      component: Component,
      protected: isProtected,
      role,
      alias,
    } = config;

    const localePrefix = `/:locale`;
    const routes: { path: string; key: string }[] = [];

    // Handle root path specially
    if (path === "/") {
      routes.push(
        { path: localePrefix, key: `${index}-0-root` },
        { path: `${localePrefix}/`, key: `${index}-1-root-slash` }
      );
    } else {
      routes.push({ path: `${localePrefix}${path}`, key: `${index}-0-${path}` });
      if (alias) {
        routes.push({ path: `${localePrefix}${alias}`, key: `${index}-1-${alias}` });
      }
    }

    return routes.map(({ path: routePath, key }) => (
      <Route
        key={key}
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
    ));
  }, []);

  return (
    <HelmetProvider>
      <IntlProvider
        locale={locale}
        messages={messages[locale]}
        defaultLocale="fr"
      >
        <LocaleRouter>
          <div
            className={`App ${
              isMobile ? "mobile-layout" : "desktop-layout"
            }`}
          >
            <DefaultHelmet pathname={location.pathname} />
            <Suspense
              fallback={<LoadingSpinner size="large" color="red" />}
            >
              <Routes>
                {/* ✅ CORRECTION : Root redirect to locale */}
                <Route
                  path="/"
                  element={
                    <Navigate
                      to={`/${getLocaleString(language)}`}
                      replace
                    />
                  }
                />

                {/* ✅ NOUVEAU : Catch-all pour les routes sans locale */}
                <Route
                  path="/register/client"
                  element={
                    <Navigate
                      to={`/${getLocaleString(language)}/register/client`}
                      replace
                    />
                  }
                />
                <Route
                  path="/register/lawyer"
                  element={
                    <Navigate
                      to={`/${getLocaleString(language)}/register/lawyer`}
                      replace
                    />
                  }
                />
                <Route
                  path="/register/expat"
                  element={
                    <Navigate
                      to={`/${getLocaleString(language)}/register/expat`}
                      replace
                    />
                  }
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

                {/* Routes with locale prefix */}
                {routeConfigs
                  .sort((a, b) => {
                    if (a.path === "/") return -1;
                    if (b.path === "/") return 1;
                    return 0;
                  })
                  .map((cfg, i) => renderRoute(cfg, i))}
                {protectedUserRoutes.map((cfg, i) =>
                  renderRoute(cfg, i + 1000)
                )}

                {/* ADMIN routes */}
                <Route
                  path="/admin/login"
                  element={
                    <Suspense
                      fallback={
                        <LoadingSpinner size="large" color="red" />
                      }
                    >
                      <AdminLogin />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <Suspense
                      fallback={
                        <LoadingSpinner size="large" color="red" />
                      }
                    >
                      <AdminDashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <Navigate to="/admin/dashboard" replace />
                  }
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

                {/* ✅ ROUTES PROFILS - TOUS LES FORMATS POSSIBLES */}
                
                {/* Format legacy: /provider/:id */}
                <Route path="/provider/:id" element={<ProviderProfile />} />
                <Route path="/:locale/provider/:id" element={<ProviderProfile />} />
                
                {/* Format court: /:locale/:typeCountry/:nameSlug */}
                <Route 
                  path="/:locale/:typeCountry/:nameSlug" 
                  element={<ProviderProfile />} 
                />
                
                {/* Format complet généré par generateSlug: /:localeRegion/:lang/:typeCountry/:nameSlug */}
                <Route 
                  path="/:localeRegion/:lang/:typeCountry/:nameSlug" 
                  element={<ProviderProfile />} 
                />
                
                <Route 
                  path="/:localeRegion/:type/:country/:language/:nameSlugWithUid" 
                  element={<ProviderProfile />} 
                />
                
                {/* Format legacy: /avocat/:country/:language/:nameId */}
                <Route 
                  path="/avocat/:country/:language/:nameId" 
                  element={<ProviderProfile />} 
                />
                
                {/* Format legacy: /expatrie/:country/:language/:nameId */}
                <Route 
                  path="/expatrie/:country/:language/:nameId" 
                  element={<ProviderProfile />} 
                />
              </Routes>
            </Suspense>
          </div>
        </LocaleRouter>
      </IntlProvider>
    </HelmetProvider>
  );
};

export default App;