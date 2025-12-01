// src/pages/Login.tsx - VERSION COMPLÈTE AVEC REACT-INTL
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Component,
} from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useIntl } from "react-intl";
import {
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  Shield,
  Smartphone,
  Globe,
  CheckCircle,
  Sparkles,
  Star,
  Lock,
  Mail,
  User,
} from "lucide-react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Layout from "../components/layout/Layout";
import Button from "../components/common/Button";
import { useAuth } from "../contexts/AuthContext";
import { useApp } from "../contexts/AppContext";
import type { Provider } from "../contexts/types";
import {
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  getRedirectResult,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { FormattedMessage } from "react-intl";

// Types
interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

interface ExistingUserData {
  role?: string;
  photoURL?: string;
  profilePhoto?: string;
  avatar?: string;
}

type GtagFunction = (...args: unknown[]) => void;
interface GtagWindow {
  gtag?: GtagFunction;
}
const getGtag = (): GtagFunction | undefined =>
  typeof window !== "undefined"
    ? (window as unknown as GtagWindow).gtag
    : undefined;

// PWA install hook
type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BIPEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BIPEvent);
    };
    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      const gtag = getGtag();
      if (gtag) {
        gtag("event", "pwa_installed", { event_category: "engagement" });
      }
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return { started: false as const };
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice) {
        const gtag = getGtag();
        if (gtag) {
          gtag("event", "pwa_install_prompt", {
            event_category: "engagement",
            outcome: choice.outcome,
            platform: choice.platform,
          });
        }
      }
      return { started: true as const };
    } catch {
      return { started: false as const };
    }
  }, [deferredPrompt]);

  return { install, isInstalled, canInstall: !!deferredPrompt };
};

// PWA Install Icon Component
function PWAInstallIconWithHint({
  canInstall,
  onInstall,
}: {
  canInstall: boolean;
  onInstall: () => void;
}) {
  const intl = useIntl();
  const [showHint, setShowHint] = useState(false);
  const [hintMessageId, setHintMessageId] = useState("");
  const hideTimer = useRef<number | null>(null);

  const computeHintMessageId = (): string => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" &&
        (navigator.maxTouchPoints ?? 0) > 1);
    const isAndroid = /Android/i.test(ua);
    const isDesktop = !isIOS && !isAndroid;

    if (isIOS) return "installHintIOS";
    if (isAndroid) return "installHintAndroid";
    if (isDesktop) return "installHintDesktop";
    return "installHintGeneric";
  };

  const reveal = (messageId?: string) => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setHintMessageId(messageId ?? computeHintMessageId());
    setShowHint(true);
  };

  const scheduleHide = (delay = 1600) => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(
      () => setShowHint(false),
      delay
    ) as unknown as number;
  };

  const onClick = () => {
    if (canInstall) onInstall();
    else {
      reveal();
      scheduleHide(2800);
    }
  };

  return (
    <div className="relative select-none">
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => {
          reveal("toggleDownloadApp");
        }}
        onMouseLeave={() => scheduleHide()}
        onTouchStart={() => {
          reveal("toggleDownloadApp");
          scheduleHide(1400);
        }}
        className="ml-1 w-14 h-14 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/40 touch-manipulation"
        title={intl.formatMessage({ id: "pwa.install" })}
        aria-label={intl.formatMessage({ id: "pwa.install" })}
      >
        <img
          src="/sos-logo.jpg"
          alt={intl.formatMessage({ id: "pwa.iconAlt" })}
          className={`${canInstall ? "animate-bounce" : "animate-pulse"} w-full h-full object-cover`}
        />
      </button>

      <div
        className={`absolute left-1/2 -translate-x-1/2 mt-3 w-[260px] sm:w-[320px] text-sm rounded-2xl shadow-2xl border transition-all duration-200 ${
          showHint
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-1 pointer-events-none"
        } bg-white/95 backdrop-blur-xl border-gray-200 text-gray-900`}
        role="status"
      >
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/95 rotate-45 border-l border-t border-gray-200" />
        <div className="px-4 py-3">
          <div className="font-extrabold text-gray-900">
            {intl.formatMessage({ id: "toggleDownloadApp" })}
          </div>
          {hintMessageId && (
            <div className="mt-1 leading-relaxed text-gray-700">
              {intl.formatMessage({ id: hintMessageId })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Error Boundary
interface ErrorBoundaryProps {
  children: React.ReactNode;
  FallbackComponent: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorFallbackProps {
  error: Error | null;
  resetErrorBoundary: () => void;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <this.props.FallbackComponent
          error={this.state.error}
          resetErrorBoundary={() =>
            this.setState({ hasError: false, error: null })
          }
        />
      );
    }

    return this.props.children;
  }
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  resetErrorBoundary,
}) => {
  const intl = useIntl();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4 py-16">
      <div className="bg-white/10 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl max-w-md w-full text-center border border-red-500/30">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
          <AlertCircle className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-black text-white mb-3">
          {intl.formatMessage({ id: "error.title" })}
        </h2>
        <p className="text-gray-300 mb-8 text-base leading-relaxed">
          {intl.formatMessage({ id: "error.description" })}
        </p>
        <Button
          onClick={resetErrorBoundary}
          className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl"
        >
          {intl.formatMessage({ id: "error.retry" })}
        </Button>
      </div>
    </div>
  );
};

// MAIN LOGIN COMPONENT
const Login: React.FC = () => {
  const intl = useIntl();
  const { language } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { login, loginWithGoogle, isLoading, error, user, authInitialized } =
    useAuth();

  const { install, canInstall } = usePWAInstall();

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    rememberMe: false,
  });

  const emailDebounceRef = useRef<number | null>(null);
  const passwordDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (emailDebounceRef.current)
        window.clearTimeout(emailDebounceRef.current);
      if (passwordDebounceRef.current)
        window.clearTimeout(passwordDebounceRef.current);
    };
  }, []);

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isFormTouched, setIsFormTouched] = useState<boolean>(false);
  const [submitAttempts, setSubmitAttempts] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  // Get redirect URL from sessionStorage first (most reliable), then query params, then default to dashboard
  // sessionStorage is set BEFORE navigation, so it's more reliable than query params which might get lost
  // If user came from translation on provider profile, redirect back to that profile
  // Otherwise, redirect to dashboard
  const redirectFromStorage = sessionStorage.getItem("loginRedirect");
  const redirectFromParams = searchParams.get("redirect");
  
  // Priority: sessionStorage > query params > default dashboard
  // sessionStorage is set by TranslationBanner before navigation, so it's most reliable
  const redirectUrl = redirectFromStorage || redirectFromParams || "/dashboard";
  
  // If we have redirect from params but not in storage, store it as backup
  useEffect(() => {
    if (redirectFromParams && !redirectFromStorage) {
      sessionStorage.setItem("loginRedirect", redirectFromParams);
    }
  }, [redirectFromParams, redirectFromStorage]);
  
  const encodedRedirectUrl = encodeURIComponent(redirectUrl);
  const currentLang = language || "fr";

  const onInstallClick = useCallback(() => {
    install();
  }, [install]);

  const navigateToRegister = useCallback(() => {
    const registerUrl = `/register?redirect=${encodedRedirectUrl}`;
    navigate(registerUrl, {
      state: location.state,
    });
  }, [encodedRedirectUrl, navigate, location.state]);

  type NavState = Readonly<{ selectedProvider?: Provider }>;

  function isProviderLike(v: unknown): v is Provider {
    if (typeof v !== "object" || v === null) return false;
    const o = v as Record<string, unknown>;
    return (
      typeof o.id === "string" &&
      typeof o.name === "string" &&
      (o.type === "lawyer" || o.type === "expat")
    );
  }

  useEffect(() => {
    const savedRememberMe = localStorage.getItem("rememberMe") === "1";
    const savedEmail = localStorage.getItem("savedEmail") || "";

    if (savedRememberMe && savedEmail) {
      setFormData((prev) => ({
        ...prev,
        email: savedEmail,
        rememberMe: true,
      }));
    }
  }, []);

  useEffect(() => {
    const rawState: unknown = location.state;
    const state = (rawState ?? null) as NavState | null;
    const sp = state?.selectedProvider;

    if (isProviderLike(sp)) {
      try {
        sessionStorage.setItem("selectedProvider", JSON.stringify(sp));
      } catch {
        // sessionStorage not available
      }
    }
  }, [location.state]);

  useEffect(() => {
    const markStart = performance.now();
    return () => {
      const markEnd = performance.now();
      if (process.env.NODE_ENV === "development") {
        console.log(`Login rendered in ${(markEnd - markStart).toFixed(2)}ms`);
      }
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const metaData = useMemo(
    () => ({
      title: intl.formatMessage({ id: "meta.title" }),
      description: intl.formatMessage({ id: "meta.description" }),
      keywords: intl.formatMessage({ id: "meta.keywords" }),
      ogTitle: intl.formatMessage({ id: "meta.og_title" }),
      ogDescription: intl.formatMessage({ id: "meta.og_description" }),
      canonicalUrl: `${window.location.origin}/${currentLang}/login`,
      alternateUrls: {
        fr: `${window.location.origin}/fr/login`,
        en: `${window.location.origin}/en/login`,
      },
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": `${window.location.origin}/${currentLang}/login#webpage`,
        name: intl.formatMessage({ id: "meta.title" }),
        description: intl.formatMessage({ id: "meta.description" }),
        url: `${window.location.origin}/${currentLang}/login`,
        inLanguage: currentLang,
        isPartOf: {
          "@type": "WebSite",
          "@id": `${window.location.origin}#website`,
          name: "SOS Expats",
          url: window.location.origin,
          potentialAction: {
            "@type": "SearchAction",
            target: `${window.location.origin}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
        mainEntity: {
          "@type": "LoginAction",
          "@id": `${window.location.origin}/${currentLang}/login#loginaction`,
          name: intl.formatMessage({ id: "login.title" }),
          description: intl.formatMessage({ id: "login.subtitle" }),
          target: `${window.location.origin}/${currentLang}/login`,
          object: {
            "@type": "Person",
            name: "Utilisateur SOS Expats",
          },
        },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Accueil",
              item: window.location.origin,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: intl.formatMessage({ id: "login.title" }),
              item: `${window.location.origin}/${currentLang}/login`,
            },
          ],
        },
        author: {
          "@type": "Organization",
          "@id": `${window.location.origin}#organization`,
          name: "SOS Expats",
          url: window.location.origin,
          logo: `${window.location.origin}/sos-logo.jpg`,
          sameAs: [
            "https://www.facebook.com/sosexpats",
            "https://www.linkedin.com/company/sosexpats",
            "https://twitter.com/sosexpats",
          ],
        },
        publisher: { "@id": `${window.location.origin}#organization` },
      },
    }),
    [intl, currentLang]
  );

  const emailRegex = useMemo(
    () =>
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    []
  );

  const validateField = useCallback(
    (field: keyof LoginFormData, value: string | boolean): string | null => {
      switch (field) {
        case "email":
          if (!value) return intl.formatMessage({ id: "validation.email_required" });
          if (typeof value === "string" && !emailRegex.test(value)) {
            return intl.formatMessage({ id: "validation.email_invalid" });
          }
          return null;
        case "password":
          if (!value) return intl.formatMessage({ id: "validation.password_required" });
          if (typeof value === "string" && value.length < 6) {
            return intl.formatMessage({ id: "validation.password_min_length" });
          }
          return null;
        default:
          return null;
      }
    },
    [emailRegex, intl]
  );

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};

    const emailError = validateField("email", formData.email);
    const passwordError = validateField("password", formData.password);

    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, validateField]);

  const handleFieldChange = useCallback(
    (field: keyof LoginFormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setIsFormTouched(true);

      if (formErrors[field as keyof FormErrors]) {
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
      }

      if (typeof value === "string") {
        const ref =
          field === "email"
            ? emailDebounceRef
            : field === "password"
              ? passwordDebounceRef
              : null;
        if (ref) {
          if (ref.current) window.clearTimeout(ref.current);
          ref.current = window.setTimeout(() => {
            const err = validateField(field as keyof LoginFormData, value);
            if (err) {
              setFormErrors((prev) => ({ ...prev, [field]: err }));
            }
          }, 300);
        }
      }
    },
    [formErrors, validateField]
  );

  const clearSavedData = useCallback(() => {
    localStorage.removeItem("rememberMe");
    localStorage.removeItem("savedEmail");
    setFormData((prev) => ({
      ...prev,
      email: "",
      rememberMe: false,
    }));
  }, []);

  useEffect(() => {
    document.title = metaData.title;

    const updateMetaTag = (
      name: string,
      content: string,
      property?: boolean
    ) => {
      const attribute = property ? "property" : "name";
      let meta = document.querySelector(
        `meta[${attribute}="${name}"]`
      ) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    updateMetaTag("description", metaData.description);
    updateMetaTag("keywords", metaData.keywords);
    updateMetaTag(
      "robots",
      "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
    );
    updateMetaTag("author", "SOS Expats");
    updateMetaTag("language", currentLang);

    const ogLocale =
      currentLang === "fr"
        ? "fr_FR"
        : currentLang === "en"
          ? "en_US"
          : `${String(currentLang)}_${String(currentLang).toUpperCase()}`;

    updateMetaTag("og:type", "website", true);
    updateMetaTag("og:title", metaData.ogTitle, true);
    updateMetaTag("og:description", metaData.ogDescription, true);
    updateMetaTag("og:url", metaData.canonicalUrl, true);
    updateMetaTag("og:site_name", "SOS Expats", true);
    updateMetaTag("og:locale", ogLocale, true);
    updateMetaTag(
      "og:image",
      `${window.location.origin}/images/og-login-${currentLang}.jpg`,
      true
    );
    updateMetaTag("og:image:width", "1200", true);
    updateMetaTag("og:image:height", "630", true);
    updateMetaTag("og:image:alt", intl.formatMessage({ id: "meta.og_image_alt" }), true);

    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:site", "@sosexpats");
    updateMetaTag("twitter:creator", "@sosexpats");
    updateMetaTag("twitter:title", metaData.ogTitle);
    updateMetaTag("twitter:description", metaData.ogDescription);
    updateMetaTag(
      "twitter:image",
      `${window.location.origin}/images/twitter-login-${currentLang}.jpg`
    );
    updateMetaTag("twitter:image:alt", intl.formatMessage({ id: "meta.twitter_image_alt" }));

    updateMetaTag(
      "category",
      "Authentication, Expat Services, International Support"
    );
    updateMetaTag("coverage", "Worldwide");
    updateMetaTag("distribution", "Global");
    updateMetaTag("rating", "General");
    updateMetaTag("revisit-after", "1 days");
    updateMetaTag("classification", "Business, Services, Authentication");

    updateMetaTag("mobile-web-app-capable", "yes");
    updateMetaTag("apple-mobile-web-app-capable", "yes");
    updateMetaTag("apple-mobile-web-app-status-bar-style", "default");
    updateMetaTag("apple-mobile-web-app-title", "SOS Expats");
    updateMetaTag("theme-color", "#dc2626");
    updateMetaTag("msapplication-navbutton-color", "#dc2626");
    updateMetaTag("application-name", "SOS Expats");

    let canonical = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = metaData.canonicalUrl;

    document
      .querySelectorAll('link[rel="alternate"][hreflang]')
      .forEach((link) => link.parentElement?.removeChild(link));

    Object.entries(metaData.alternateUrls).forEach(([lang, url]) => {
      const alternate = document.createElement("link");
      alternate.rel = "alternate";
      alternate.hreflang = lang;
      alternate.href = url;
      document.head.appendChild(alternate);
    });

    const xDefault = document.createElement("link");
    xDefault.rel = "alternate";
    xDefault.hreflang = "x-default";
    xDefault.href = metaData.alternateUrls.fr;
    document.head.appendChild(xDefault);

    let structuredDataScript = document.querySelector(
      "#structured-data"
    ) as HTMLScriptElement | null;
    if (!structuredDataScript) {
      structuredDataScript = document.createElement("script");
      structuredDataScript.id = "structured-data";
      structuredDataScript.type = "application/ld+json";
      document.head.appendChild(structuredDataScript);
    }
    structuredDataScript.textContent = JSON.stringify(metaData.structuredData);
  }, [metaData, intl, currentLang]);

  const isFormValid =
    !formErrors.email &&
    !formErrors.password &&
    formData.email.length > 0 &&
    formData.password.length > 0;

  const formProgress = useMemo(() => {
    const fields = [
      formData.email.length > 0,
      formData.password.length >= 6,
      !formErrors.email,
      !formErrors.password,
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  }, [formData, formErrors]);

  useEffect(() => {
    if (authInitialized && user) {
      // Get redirect URL - prioritize sessionStorage (set before navigation) over query params
      // sessionStorage is more reliable because it's set BEFORE navigation happens
      const redirectFromStorage = sessionStorage.getItem("loginRedirect");
      const redirectFromParams = searchParams.get("redirect");
      const redirectToUse = redirectFromStorage || redirectFromParams || "/dashboard";
      
      // Decode the redirect URL (it was encoded when passed to login page)
      const finalUrl = decodeURIComponent(redirectToUse);

      // Clear the stored redirect after using it (important to prevent reusing old redirects)
      sessionStorage.removeItem("loginRedirect");

      const getUserId = (u: unknown): string | undefined => {
        const obj = u as { uid?: string; id?: string };
        return obj?.uid || obj?.id;
      };

      const gtag = getGtag();
      if (gtag) {
        gtag("event", "login_success", {
          method: "email",
          user_id: getUserId(user),
          redirect_url: finalUrl,
        });
      }

      // Only clear selectedProvider if not going to booking or provider profile
      // This preserves provider data when user returns to profile after login (e.g., from translation)
      const goingToBooking = finalUrl.startsWith("/booking-request/");
      const goingToProviderProfile = finalUrl.includes("/avocat/") || 
                                     finalUrl.includes("/expatrie/") || 
                                     finalUrl.includes("/expats/") ||
                                     finalUrl.includes("/lawyers/") ||
                                     finalUrl.includes("/provider/");
      
      if (!goingToBooking && !goingToProviderProfile) {
        sessionStorage.removeItem("selectedProvider");
      }
      sessionStorage.removeItem("loginAttempts");

      // Navigate to the redirect URL (provider profile if coming from translation, dashboard otherwise)
      console.log("[Login] Redirecting to:", finalUrl);
      navigate(finalUrl, { replace: true });
    }
  }, [authInitialized, user, navigate, searchParams]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!isOnline) {
        setFormErrors({ general: intl.formatMessage({ id: "error.offline" }) });
        return;
      }

      if (!validateForm()) {
        setSubmitAttempts((prev) => prev + 1);

        const gtag = getGtag();
        if (gtag) {
          gtag("event", "login_validation_failed", {
            attempts: submitAttempts + 1,
            errors: Object.keys(formErrors).join(","),
          });
        }

        return;
      }

      try {
        performance.mark("login-attempt-start");

        const persistenceType = formData.rememberMe
          ? browserLocalPersistence
          : browserSessionPersistence;

        await setPersistence(auth, persistenceType);

        if (formData.rememberMe) {
          localStorage.setItem("rememberMe", "1");
          localStorage.setItem(
            "savedEmail",
            formData.email.trim().toLowerCase()
          );
        } else {
          localStorage.removeItem("rememberMe");
          localStorage.removeItem("savedEmail");
        }

        await login(formData.email.trim().toLowerCase(), formData.password);

        performance.mark("login-attempt-end");
        performance.measure("login-attempt", {
          start: "login-attempt-start",
          end: "login-attempt-end",
        });

        const gtag = getGtag();
        if (gtag) {
          gtag("event", "login_attempt_success", {
            email_domain: formData.email.split("@")[1],
            remember_me: formData.rememberMe,
            attempt_number: submitAttempts + 1,
          });
        }
      } catch (loginError) {
        console.error("Login error:", loginError);
        setSubmitAttempts((prev) => prev + 1);

        const gtag = getGtag();
        if (gtag) {
          gtag("event", "login_attempt_failed", {
            error_type:
              loginError instanceof Error ? loginError.message : "unknown",
            attempts: submitAttempts + 1,
            email_domain: formData.email.split("@")[1],
          });
        }
      }
    },
    [formData, validateForm, login, submitAttempts, isOnline, intl, formErrors]
  );

  const handleGoogleLogin = useCallback(async () => {
    try {
      performance.mark("google-login-start");

      const persistenceType = formData.rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence;

      await setPersistence(auth, persistenceType);

      await loginWithGoogle();

      performance.mark("google-login-end");
      performance.measure("google-login", {
        start: "google-login-start",
        end: "google-login-end",
      });

      const gtag = getGtag();
      if (gtag) {
        gtag("event", "login_success", {
          method: "google",
          remember_me: formData.rememberMe,
        });
      }
    } catch (googleError) {
      console.error("Google login error:", googleError);

      const gtag = getGtag();
      if (gtag) {
        gtag("event", "login_failed", {
          method: "google",
          error_type:
            googleError instanceof Error ? googleError.message : "unknown",
        });
      }
    }
  }, [loginWithGoogle, formData.rememberMe]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => {
      const newValue = !prev;

      const gtag = getGtag();
      if (gtag) {
        gtag("event", "password_visibility_toggled", {
          visible: newValue,
          page: "login",
        });
      }

      return newValue;
    });
  }, []);

  const redirectHandledRef = useRef(false);
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const isCrossOriginIsolated = window.crossOriginIsolated === true;
        if (!isCrossOriginIsolated) return;
        if (redirectHandledRef.current) return;

        const result = await getRedirectResult(auth);
        if (!result || !result.user) return;

        redirectHandledRef.current = true;
        const googleUser = result.user;

        const userRef = {
          doc: () => ({
            get: () => ({
              exists: () => false,
              data: () => ({}) as ExistingUserData,
            }),
          }),
        };
        const userDoc = await userRef.doc().get();

        if (userDoc.exists()) {
          const existingData = userDoc.data();

          if (existingData.role && existingData.role !== "client") {
            await auth.signOut();
            const { message, helpText } = {
              message: intl.formatMessage({ id: "error.googleRestricted" }),
              helpText: intl.formatMessage({ id: "error.googleHelpText" }),
            };
            setFormErrors({
              general: helpText ? `${message}\n\n💡 ${helpText}` : message,
            });

            await logAuthEvent("google_login_role_restriction", {
              userId: googleUser.uid,
              userEmail: googleUser.email,
              blockedRole: existingData.role,
            });
            return;
          }
        }

        await logAuthEvent("successful_google_login", {
          userId: googleUser.uid,
          userEmail: googleUser.email,
          isNewUser: !userDoc.exists(),
          deviceType: "desktop",
          connectionSpeed: "fast",
        });
      } catch (e) {
        console.warn("[Auth] getRedirectResult error", e);
      } finally {
        if (!cancelled) {
          console.log("Google redirect flow completed");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [intl]);

  const logAuthEvent = async (type: string, data: Record<string, unknown>) => {
    try {
      console.log("Auth Event:", type, data);
    } catch (error) {
      console.warn("Erreur logging auth:", error);
    }
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4 py-16">
        <div className="text-center max-w-sm w-full">
          <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/20">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
              <LoadingSpinner size="large" color="red" />
            </div>
            <h2 className="text-xl font-black text-white mb-3">
              {intl.formatMessage({ id: "loading.message" })}
            </h2>
            <p className="text-base text-gray-400 mb-6">
              {intl.formatMessage({ id: "loading.verifying" })}
            </p>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full animate-pulse transition-all duration-1000"
                style={{ width: "70%" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        const gtag = getGtag();
        if (gtag) {
          gtag("event", "login_error_boundary", {
            error: error.message,
            component_stack: errorInfo.componentStack,
          });
        }
      }}
    >
      <Layout>
        <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col justify-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          {!isOnline && (
            <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-3 text-center text-sm font-bold z-50 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-center space-x-2">
                <Globe className="inline h-5 w-5 animate-pulse" />
                <span>{intl.formatMessage({ id: "offline.message" })}</span>
              </div>
            </div>
          )}

          <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
            <header className="text-center mb-10">
              <div className="inline-flex items-center space-x-3 bg-white/10 backdrop-blur-xl rounded-full pl-6 pr-2 py-3 border border-white/20 mb-8">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-bold">
                  <FormattedMessage
                    id="app.install"
                    values={{
                      strong: (chunks) => <strong>{chunks}</strong>,
                    }}
                  />
                </span>
                <PWAInstallIconWithHint
                  canInstall={canInstall}
                  onInstall={onInstallClick}
                />
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>

              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500 via-red-600 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300">
                <LogIn className="w-12 h-12 text-white" />
              </div>

              <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 tracking-tight">
                {intl.formatMessage({ id: "login.title" })}
              </h1>

              <p className="text-lg text-gray-400 max-w-sm mx-auto leading-relaxed mb-6">
                {intl.formatMessage({ id: "login.subtitle" })}
              </p>

              <p className="text-base text-gray-500">
                {intl.formatMessage({ id: "login.or" })}{" "}
                <button
                  onClick={navigateToRegister}
                  className="font-black text-transparent bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text hover:from-red-400 hover:to-orange-400 transition-all duration-300 underline decoration-2 underline-offset-4"
                  aria-label={intl.formatMessage({ id: "login.create_account_aria" })}
                >
                  {intl.formatMessage({ id: "login.create_account" })}
                </button>
              </p>

              {redirectUrl && redirectUrl.includes("/booking-request/") && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-500/30 rounded-2xl">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm text-blue-300 font-bold">
                        🎯 {intl.formatMessage({ id: "redirect.message" })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </header>
          </div>

          {/* I'll continue with the form section in the next part due to length... */}

          <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white/10 backdrop-blur-xl py-10 px-8 shadow-2xl sm:rounded-3xl sm:px-12 border border-white/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-blue-500 to-red-500" />

              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-400">
                    {intl.formatMessage({ id: "form.progress" })}
                  </span>
                  <span className="text-sm font-black text-transparent bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text">
                    {formProgress}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-500 ease-out shadow-lg"
                    style={{ width: `${formProgress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center mb-8">
                <Shield
                  className="h-5 w-5 text-green-400 mr-2 animate-pulse"
                  aria-hidden="true"
                />
                <span className="text-sm text-gray-400 font-bold">
                  {intl.formatMessage({ id: "security.ssl" })}
                </span>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                {(error || formErrors.general) && (
                  <div
                    className="bg-red-500/10 backdrop-blur-xl border border-red-500/30 p-4 rounded-2xl"
                    role="alert"
                  >
                    <div className="flex">
                      <AlertCircle
                        className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <div className="ml-3">
                        <h3 className="text-sm font-black text-red-300 mb-1">
                          {intl.formatMessage({ id: "error.title" })}
                        </h3>
                        <div className="text-sm text-red-200 leading-relaxed">
                          {error || formErrors.general}
                        </div>
                        {submitAttempts >= 3 && (
                          <div className="mt-3">
                            <Link
                              to="/password-reset"
                              className="text-sm text-red-400 hover:text-red-300 underline font-bold"
                            >
                              {intl.formatMessage({ id: "login.forgot_password_help" })}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-bold text-gray-300 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {intl.formatMessage({ id: "login.email_label" })}
                      <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    onBlur={() => setIsFormTouched(true)}
                    className="appearance-none block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                    placeholder={intl.formatMessage({ id: "login.email_placeholder" })}
                  />
                  {formErrors.email && (
                    <p className="mt-2 text-sm text-red-400 font-medium">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-bold text-gray-300 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      {intl.formatMessage({ id: "login.password_label" })}
                      <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={formData.password}
                      onChange={(e) =>
                        handleFieldChange("password", e.target.value)
                      }
                      onBlur={() => setIsFormTouched(true)}
                      className="appearance-none block w-full px-4 py-3 pr-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                      placeholder={intl.formatMessage({ id: "login.password_placeholder" })}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors duration-200"
                      aria-label={intl.formatMessage({ id: showPassword ? "login.hide_password" : "login.show_password" })}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="mt-2 text-sm text-red-400 font-medium">
                      {formErrors.password}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) =>
                        handleFieldChange("rememberMe", e.target.checked)
                      }
                      className="h-4 w-4 text-red-600 bg-white/10 border-white/20 rounded focus:ring-red-500 transition-colors duration-200"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-3 text-gray-300 select-none cursor-pointer font-bold"
                    >
                      {intl.formatMessage({ id: "login.remember_me" })}
                    </label>
                    {formData.rememberMe && formData.email && (
                      <span className="ml-2 text-xs text-green-400 font-black">
                        ✓ {intl.formatMessage({ id: "remember_me.saved" })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {localStorage.getItem("rememberMe") === "1" && (
                      <button
                        type="button"
                        onClick={clearSavedData}
                        className="text-xs text-gray-500 hover:text-gray-300 underline transition-colors duration-200 font-bold"
                      >
                        {intl.formatMessage({ id: "remember_me.clear" })}
                      </button>
                    )}

                    <Link
                      to="/password-reset"
                      className="font-black text-transparent bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text hover:from-red-300 hover:to-orange-300 transition-all duration-300 underline decoration-2 underline-offset-4"
                    >
                      {intl.formatMessage({ id: "login.forgot_password" })}
                    </Link>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                    type="submit"
                    loading={isLoading}
                    fullWidth
                    size="large"
                    className={`py-5 text-lg font-black rounded-2xl transition-all duration-300 transform min-h-[60px] ${
                      isFormValid && !isLoading && isOnline
                        ? "bg-gradient-to-r from-red-600 via-red-500 to-orange-500 hover:from-red-700 hover:via-red-600 hover:to-orange-600 text-white shadow-2xl hover:shadow-red-500/50 hover:scale-[1.02] active:scale-[0.98] focus:ring-4 focus:ring-red-500/50"
                        : "bg-white/10 text-gray-500 cursor-not-allowed backdrop-blur-sm border border-white/20"
                    }`}
                    disabled={!isFormValid || isLoading || !isOnline}
                    aria-describedby="login-button-description"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3" />
                        {intl.formatMessage({ id: "login.logging_in" })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <LogIn size={20} className="mr-3" aria-hidden="true" />
                        {intl.formatMessage({ id: "login.submit_button" })}
                      </div>
                    )}
                  </Button>
                  <p id="login-button-description" className="sr-only">
                    {intl.formatMessage({ id: "login.submit_button_description" })}
                  </p>
                </div>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/10 backdrop-blur-xl text-gray-400 font-black rounded-full">
                      {intl.formatMessage({ id: "login.or_divider" })}
                    </span>
                  </div>
                </div>

                <div>
                  <Button
                    type="button"
                    onClick={handleGoogleLogin}
                    loading={isLoading}
                    fullWidth
                    size="large"
                    variant="outline"
                    className="py-5 text-lg font-black bg-white hover:bg-gray-100 text-gray-900 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] min-h-[60px] shadow-xl"
                    disabled={isLoading || !isOnline}
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    {intl.formatMessage({ id: "login.google_login" })}
                  </Button>
                </div>
              </form>

              <footer className="mt-10 text-center space-y-6">
                <p className="text-base text-gray-400">
                  {intl.formatMessage({ id: "login.new_user" })}{" "}
                  <button
                    onClick={navigateToRegister}
                    className="font-black text-transparent bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text hover:from-red-400 hover:to-orange-400 transition-all duration-300 underline decoration-2 underline-offset-4"
                  >
                    {intl.formatMessage({ id: "login.create_account" })}
                  </button>
                </p>

                <div>
                  <button
                    onClick={navigateToRegister}
                    className="w-full py-4 px-6 bg-transparent border-2 border-white/30 hover:border-white/50 text-white font-black rounded-2xl hover:bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <User className="w-5 h-5" />
                      <span>{intl.formatMessage({ id: "create_account.button" })}</span>
                      <Sparkles className="w-5 h-5 text-yellow-400" />
                    </div>
                  </button>
                </div>

                <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Shield className="h-3 w-3 mr-1 text-green-400" />
                    <span className="font-bold">{intl.formatMessage({ id: "trust.secure" })}</span>
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="flex items-center">
                    <Smartphone className="h-3 w-3 mr-1 text-blue-400" />
                    <span className="font-bold">PWA Mobile</span>
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="flex items-center">
                    <Star className="h-3 w-3 mr-1 text-yellow-400" />
                    <span className="font-bold">{intl.formatMessage({ id: "trust.support_24_7" })}</span>
                  </span>
                </div>

                {process.env.NODE_ENV === "development" && (
                  <div className="text-xs text-gray-600 font-medium">
                    ⚡ Optimized for Core Web Vitals
                  </div>
                )}
              </footer>
            </div>
          </div>

          <link
            rel="preload"
            href="/fonts/inter.woff2"
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
          <link rel="preconnect" href="https://accounts.google.com" />
          <link rel="dns-prefetch" href="//www.google-analytics.com" />

          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js')
                      .then(registration => console.log('SW registered:', registration))
                      .catch(error => console.log('SW registration failed:', error));
                  });
                }
              `,
            }}
          />
        </main>
      </Layout>
    </ErrorBoundary>
  );
};

export default React.memo(Login);
