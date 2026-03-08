/**
 * LocaleRouter Component
 * Handles automatic locale prefix management and redirects
 * IMPORTANT: All redirects preserve query params (?ref=, ?promo=, etc.)
 */
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../../contexts/AppContext";
import {
  parseLocaleFromPath,
  getLocaleString,
  hasLocalePrefix,
  getSupportedLocales,
  getRouteKeyFromSlug,
  getTranslatedRouteSlug,
} from "./localeRoutes";
import { useParams } from "react-router-dom";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

interface LocaleRouterProps {
  children: React.ReactNode;
}

const LocaleRouter: React.FC<LocaleRouterProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useApp();
  const params = useParams<{ locale?: string }>();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    setIsValidating(true);
    const { pathname, search, hash } = location;

    // Helper: navigate while preserving query params and hash
    const navigatePreserving = (newPath: string) => {
      navigate(`${newPath}${search}${hash}`, { replace: true });
    };

    // CRITICAL: Decode URL to handle Unicode characters (Hindi, Chinese, Arabic, Russian)
    // Browser may encode Unicode in pathname, so we need to decode it
    let decodedPathname: string;
    try {
      decodedPathname = decodeURIComponent(pathname);
    } catch (e) {
      // If decoding fails (invalid encoding), use original
      decodedPathname = pathname;
    }

    // Skip locale handling for admin routes, marketing routes, and payment-success (backward compatibility)
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/marketing") ||
      pathname.startsWith("/payment-success")
    ) {
      setIsValidating(false);
      return;
    }


    // Validate locale parameter if present
    if (params.locale) {
      const supportedLocales = getSupportedLocales();
      if (!supportedLocales.includes(params.locale)) {
        // Invalid locale - redirect to valid one (preserve query params)
        const locale = getLocaleString(language);
        const { pathWithoutLocale } = parseLocaleFromPath(decodedPathname);
        navigatePreserving(`/${locale}${pathWithoutLocale}`);
        return;
      }
    }

    // If path doesn't have locale prefix and is not root, redirect to add it
    if (!hasLocalePrefix(decodedPathname) && decodedPathname !== "/") {
      const locale = getLocaleString(language);
      const newPath = `/${locale}${decodedPathname}`;
      if (newPath !== decodedPathname) {
        navigatePreserving(newPath);
      }
      return;
    }

    // If path has locale prefix, extract and update language
    if (hasLocalePrefix(decodedPathname)) {
      const { lang, pathWithoutLocale } = parseLocaleFromPath(decodedPathname);

      // Only update language if it's different - this syncs URL locale with app language
      // This happens when user navigates directly to a URL with a different locale
      if (lang && lang !== language) {
        setLanguage(lang);
      }

      // Check if the path contains an old slug that should be translated
      // e.g., /en-us/sos-appel should redirect to /en-us/emergency-call
      // e.g., /en-us/आपात-कॉल should redirect to /en-us/emergency-call (Hindi to English)
      // e.g., /en-us/register/client should redirect to /en-us/पंजीकरण/ग्राहक (English to Hindi)
      if (pathWithoutLocale && pathWithoutLocale !== "/") {
        const pathSegments = pathWithoutLocale.split("/").filter(Boolean);
        if (pathSegments.length > 0) {
          // Try to match multi-segment paths first (e.g., "register/client")
          let routeKey = null;
          let matchedSegments = 0;
          let matchedPath = "";

          if (pathSegments.length >= 2) {
            // Try matching first two segments as a compound route
            const twoSegmentPath = `${pathSegments[0]}/${pathSegments[1]}`;
            routeKey = getRouteKeyFromSlug(twoSegmentPath);
            if (routeKey) {
              matchedSegments = 2;
              matchedPath = twoSegmentPath;
            }
          }

          // If no multi-segment match, try just the first segment
          if (!routeKey) {
            const firstSegment = pathSegments[0];
            routeKey = getRouteKeyFromSlug(firstSegment);
            if (routeKey) {
              matchedSegments = 1;
              matchedPath = firstSegment;
            }
          }

          // If this is a known route key slug, check if it matches the current language
          if (routeKey && lang) {
            const correctSlug = getTranslatedRouteSlug(routeKey, lang);

            // If the slug doesn't match the correct translation for this language, redirect
            if (matchedPath !== correctSlug) {
              const restOfPath = pathSegments.slice(matchedSegments).join("/");
              const newPath = `/${getLocaleString(lang)}/${correctSlug}${restOfPath ? `/${restOfPath}` : ""}`;
              navigatePreserving(newPath);
              return;
            }
          }
        }
      }
    } else if (decodedPathname === "/") {
      // Root path without locale - redirect to default locale (preserve query params)
      const locale = getLocaleString(language);
      navigatePreserving(`/${locale}`);
      return; // Don't set isValidating to false, we're redirecting
    }

    // Validation complete, show content
    setIsValidating(false);
  }, [location.pathname, language, navigate, setLanguage, params.locale]);

  // Show loading spinner while validating locale to prevent 404 flash
  if (isValidating) {
    return <LoadingSpinner size="large" color="red" />;
  }

  return <>{children}</>;
};

export default LocaleRouter;
