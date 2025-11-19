/**
 * LocaleRouter Component
 * Handles automatic locale prefix management and redirects
 */
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../contexts/AppContext";
import {
  parseLocaleFromPath,
  getLocaleString,
  hasLocalePrefix,
  getSupportedLocales,
} from "../../utils/localeRoutes";
import { useParams } from "react-router-dom";

interface LocaleRouterProps {
  children: React.ReactNode;
}

const LocaleRouter: React.FC<LocaleRouterProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useApp();
  const params = useParams<{ locale?: string }>();

  useEffect(() => {
    const { pathname } = location;
    
    // Skip locale handling for admin routes, marketing routes, and payment-success (backward compatibility)
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/marketing") ||
      pathname.startsWith("/payment-success")
    ) {
      return;
    }

    // Validate locale parameter if present
    if (params.locale) {
      const supportedLocales = getSupportedLocales();
      if (!supportedLocales.includes(params.locale)) {
        // Invalid locale - redirect to valid one
        const locale = getLocaleString(language);
        const { pathWithoutLocale } = parseLocaleFromPath(pathname);
        navigate(`/${locale}${pathWithoutLocale}`, { replace: true });
        return;
      }
    }

    // If path doesn't have locale prefix and is not root, redirect to add it
    if (!hasLocalePrefix(pathname) && pathname !== "/") {
      const locale = getLocaleString(language);
      const newPath = `/${locale}${pathname}`;
      if (newPath !== pathname) {
        navigate(newPath, { replace: true });
      }
      return;
    }

    // If path has locale prefix, extract and update language
    if (hasLocalePrefix(pathname)) {
      const { lang } = parseLocaleFromPath(pathname);
      
      // Only update language if it's different - this syncs URL locale with app language
      // This happens when user navigates directly to a URL with a different locale
      if (lang && lang !== language) {
        setLanguage(lang);
      }
    } else if (pathname === "/") {
      // Root path without locale - redirect to default locale
      const locale = getLocaleString(language);
      navigate(`/${locale}`, { replace: true });
    }
  }, [location.pathname, language, navigate, setLanguage, params.locale]);

  return <>{children}</>;
};

export default LocaleRouter;

