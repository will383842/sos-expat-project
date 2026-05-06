/**
 * =============================================================================
 * HOOK useLanguage - GESTION DE LA LANGUE
 * =============================================================================
 *
 * Hook personnalisé pour gérer le changement de langue dans l'application.
 * Supporte deux modes: admin (2 langues) et provider (9 langues).
 */

import { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

// Type pour la fonction de traduction (compatible avec les nouvelles versions de react-i18next)
export type TFunction = (key: string, options?: Record<string, unknown>) => string;
import {
  ADMIN_LANGUAGES,
  PROVIDER_LANGUAGES,
  LANGUAGE_NAMES,
  LANGUAGE_FLAGS,
  isRTL,
  applyLanguageStyles,
  getDateLocale,
  type AdminLanguage,
  type ProviderLanguage,
} from "../i18n";

export type LanguageMode = "admin" | "provider";

export interface LanguageInfo {
  code: string;
  name: string;
  flag: string;
}

export interface UseLanguageOptions {
  mode?: LanguageMode;
}

export interface UseLanguageReturn {
  /** Fonction de traduction t() */
  t: TFunction;
  /** Instance i18n */
  i18n: ReturnType<typeof useTranslation>["i18n"];
  /** Code de la langue actuelle */
  currentLanguage: string;
  /** Alias pour currentLanguage (compatibilité) */
  currentLocale: string;
  /** Informations sur la langue actuelle */
  currentLanguageInfo: LanguageInfo;
  /** Changer la langue */
  changeLanguage: (lang: string) => Promise<void>;
  /** Liste des langues disponibles */
  availableLanguages: readonly string[];
  /** Informations sur toutes les langues disponibles */
  availableLanguagesInfo: LanguageInfo[];
  /** La langue actuelle est-elle RTL? */
  isRTL: boolean;
  /** Code locale pour date-fns */
  dateLocale: string;
  /** Fonction pour obtenir la locale de date (compatibilité) */
  getDateLocale: () => string;
}

/**
 * Hook pour gérer la langue de l'application
 *
 * @param options - Options de configuration
 * @param options.mode - Mode de l'application ("admin" ou "provider")
 *
 * @example
 * ```tsx
 * // Dans un composant admin (2 langues)
 * const { t, currentLanguage, changeLanguage } = useLanguage({ mode: "admin" });
 *
 * // Dans un composant provider (9 langues)
 * const { t, availableLanguages, isRTL } = useLanguage({ mode: "provider" });
 * ```
 */
export function useLanguage(
  options: UseLanguageOptions = {}
): UseLanguageReturn {
  const { mode = "provider" } = options;
  // Use the correct namespace based on mode
  const namespace = mode === "admin" ? "admin" : "provider";
  const { t: rawT, i18n } = useTranslation([namespace, "common"]);

  // Stable identity across renders — without useCallback, every render creates
  // a new `t` reference, which causes infinite effect re-runs in any consumer
  // that lists `t` in their useEffect deps (cf. ConversationDetail leak 2026-05-06).
  const t = useCallback<TFunction>((key, options) => {
    if (key.includes(":")) {
      return rawT(key, options as Record<string, unknown>);
    }
    const result = rawT(`${namespace}:${key}`, options as Record<string, unknown>);
    if (result === `${namespace}:${key}` || result === key) {
      const commonResult = rawT(`common:${key}`, options as Record<string, unknown>);
      if (commonResult !== `common:${key}`) {
        return commonResult;
      }
    }
    return result;
  }, [rawT, namespace]);

  // Déterminer les langues disponibles selon le mode
  const availableLanguages =
    mode === "admin" ? ADMIN_LANGUAGES : PROVIDER_LANGUAGES;

  // Créer les informations sur les langues disponibles
  const availableLanguagesInfo: LanguageInfo[] = availableLanguages.map(
    (code) => ({
      code,
      name: LANGUAGE_NAMES[code] || code,
      flag: LANGUAGE_FLAGS[code] || "🌐",
    })
  );

  // Informations sur la langue actuelle
  const currentLanguageInfo: LanguageInfo = {
    code: i18n.language,
    name: LANGUAGE_NAMES[i18n.language] || i18n.language,
    flag: LANGUAGE_FLAGS[i18n.language] || "🌐",
  };

  /**
   * Changer la langue de l'application
   */
  const changeLanguage = useCallback(
    async (lang: string) => {
      // Valider que la langue est disponible pour ce mode
      if (!availableLanguages.includes(lang as AdminLanguage & ProviderLanguage)) {
        console.warn(
          `[useLanguage] Language "${lang}" is not available in ${mode} mode. Available: ${availableLanguages.join(", ")}`
        );
        return;
      }

      try {
        // Changer la langue dans i18next
        await i18n.changeLanguage(lang);

        // Appliquer les styles (RTL, font)
        applyLanguageStyles(lang);

        // Stocker la préférence
        localStorage.setItem("i18nextLng", lang);

        console.log(`[useLanguage] Language changed to: ${lang}`);
      } catch (error) {
        console.error("[useLanguage] Failed to change language:", error);
      }
    },
    [i18n, availableLanguages, mode]
  );

  // Appliquer les styles au montage du composant
  useEffect(() => {
    applyLanguageStyles(i18n.language);
  }, [i18n.language]);

  // Vérifier que la langue actuelle est disponible dans ce mode
  useEffect(() => {
    if (!availableLanguages.includes(i18n.language as AdminLanguage & ProviderLanguage)) {
      // Fallback vers la première langue disponible (français)
      changeLanguage(availableLanguages[0]);
    }
  }, [i18n.language, availableLanguages, changeLanguage]);

  const dateLocaleValue = getDateLocale(i18n.language);

  return {
    t,
    i18n,
    currentLanguage: i18n.language,
    currentLocale: i18n.language,
    currentLanguageInfo,
    changeLanguage,
    availableLanguages,
    availableLanguagesInfo,
    isRTL: isRTL(i18n.language),
    dateLocale: dateLocaleValue,
    getDateLocale: () => dateLocaleValue,
  };
}

export default useLanguage;
