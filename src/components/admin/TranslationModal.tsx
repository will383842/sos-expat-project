import React, { useState, useEffect } from "react";
import Modal from "../../components/common/Modal";
import Button from "../../components/common/Button";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useProviderTranslation } from "../../hooks/useProviderTranslation";
import { SupportedLanguage } from "@/services/providerTranslationService";
import {
  Languages as LanguagesIcon,
  Eye,
  Pencil,
  Snowflake,
  Unlock,
  RefreshCw,
  Ban,
  Loader2,
} from "lucide-react";

type Lang = "fr" | "en";
const detectLang = (): Lang => {
  const ls = (localStorage.getItem("admin_lang") || "").toLowerCase();
  if (ls === "fr" || ls === "en") return ls as Lang;
  return navigator.language?.toLowerCase().startsWith("fr") ? "fr" : "en";
};
const STRINGS: Record<Lang, Record<string, string>> = {
  fr: {
    translation: "Traduction",
    languageDashboard: "Tableau des langues",
    loading: "Chargement…",
    translateAll: "Traduire tout",
    tableActions: "Actions",
    cancel: "Annuler",
    translateNow: "Traduire maintenant",
    view: "Voir",
    edit: "Modifier manuellement",
    freeze: "Geler",
    update: "Mettre à jour",
    viewCurrent: "Voir version actuelle",
    ignore: "Ignorer",
    unfreeze: "Dégeler",
    disableLanguage: "Désactiver langue",
    needsUpdate: "Mise à jour nécessaire",
    modifiedFields: "Champs modifiés",
    createdAt: "Créé",
    updatedAt: "Mis à jour",
    actions: "Actions",
  },
  en: {
    translation: "Translation",
    languageDashboard: "Language Dashboard",
    loading: "Loading…",
    translateAll: "Translate all",
    tableActions: "Actions",
    cancel: "Cancel",
    translateNow: "Translate Now",
    view: "View",
    edit: "Manually edit",
    freeze: "Freeze",
    update: "Update",
    viewCurrent: "View current version",
    ignore: "Ignore",
    unfreeze: "Unfreeze",
    disableLanguage: "Disable Language",
    needsUpdate: "Needs Update",
    modifiedFields: "Modified fields",
    createdAt: "Created",
    updatedAt: "Updated",
    actions: "Actions",
  },
};
const useI18n = () => {
  const [lang, setLang] = useState<Lang>(detectLang());
  useEffect(() => localStorage.setItem("admin_lang", lang), [lang]);
  const tLocal = (k: keyof typeof STRINGS["fr"]) => STRINGS[lang][k] ?? (k as string);
  return { tLocal, lang, setLang };
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  providerId: string | null;
  t: (k: string) => string;
};

const TranslationModal: React.FC<Props> = ({ isOpen, onClose, providerId /*, t */ }) => {
  const { tLocal } = useI18n();

  const [loading, setLoading] = useState(false);
  const [translationsDoc, setTranslationsDoc] = useState<any | null>(null);
  const [langLoading, setLangLoading] = useState<Record<SupportedLanguage, boolean>>({} as Record<SupportedLanguage, boolean>);
  const [langError, setLangError] = useState<Record<SupportedLanguage, string>>({} as Record<SupportedLanguage, string>);
  const [translateAllMode, setTranslateAllMode] = useState(false);

  const {
    translate,
    reloadForLanguage,
    availableLanguages,
    isLoading: translationLoading,
    error: translationError,
  } = useProviderTranslation(providerId, null);

  const dashboardLanguages: SupportedLanguage[] = ["en", "es", "fr", "de", "ru", "pt", "hi", "ch", "ar"];
  const anyLangBusy = Object.values(langLoading).some(Boolean);

  useEffect(() => {
    if (!isOpen) {
      setTranslationsDoc(null);
      setLangLoading({} as Record<SupportedLanguage, boolean>);
      setLangError({} as Record<SupportedLanguage, string>);
      return;
    }
    if (!providerId) return;

    const fetchTranslations = async () => {
      setLoading(true);
      try {
        const ref = doc(db, "providers_translations", providerId);
        const snap = await getDoc(ref);
        setTranslationsDoc(snap.exists() ? snap.data() : null);
      } catch (e) {
        console.error("[TranslationModal] fetch providers_translations error", e);
        setTranslationsDoc(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTranslations();
  }, [isOpen, providerId]);

  const formatTimestamp = (ts: any): string => {
    if (!ts) return "";
    let date: Date | null = null;
    if (typeof ts?.toDate === "function") date = ts.toDate();
    else if (typeof ts?._seconds === "number") {
      const ms = ts._seconds * 1000 + Math.floor((ts._nanoseconds || 0) / 1e6);
      date = new Date(ms);
    }
    if (!date) return "";
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getLangStatus = (lang: string): "missing" | "created" | "outdated" | "frozen" => {
    const tdoc = translationsDoc;
    const tmap = tdoc?.translations || {};
    const frozen = Array.isArray(tdoc?.frozenLanguages) ? tdoc.frozenLanguages : [];
    if (!tmap[lang]) return "missing";
    if (frozen.includes(lang)) return "frozen";
    const status = tmap[lang]?.status;
    if (status === "outdated") return "outdated";
    return "created";
  };

  const translateLanguage = async (lang: SupportedLanguage) => {
    if (!providerId) return;
    setLangError((prev) => ({ ...prev, [lang]: "" }));
    setLangLoading((prev) => ({ ...prev, [lang]: true }));
    try {
      await translate(lang);
      if (reloadForLanguage) await reloadForLanguage(lang);
      const ref = doc(db, "providers_translations", providerId);
      const snap = await getDoc(ref);
      setTranslationsDoc(snap.exists() ? snap.data() : null);
    } catch (e) {
      console.error("[TranslationModal] translateLanguage error", e);
      setLangError((prev) => ({
        ...prev,
        [lang]: tLocal("updatedAt") || "Update failed.",
      }));
    } finally {
      setLangLoading((prev) => ({ ...prev, [lang]: false }));
    }
  };

  const createAllMissing = async () => {
    if (!providerId || loading) return;
    for (const lang of dashboardLanguages) {
      if (getLangStatus(lang) === "missing") {
        await translateLanguage(lang as SupportedLanguage);
      }
    }
  };

  const ActionIcon = ({
    titleText,
    onClick,
    disabled,
    children,
  }: {
    titleText: string;
    onClick?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={!!disabled}
      title={titleText}
      aria-label={titleText}
      className={`p-2 rounded border hover:bg-gray-50 text-gray-700 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );

  const renderStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      missing: "bg-red-100 text-red-700",
      created: "bg-green-100 text-green-700",
      outdated: "bg-yellow-100 text-yellow-700",
      frozen: "bg-gray-200 text-gray-800",
    };
    const labels: Record<string, string> = {
      missing: "❌ missing",
      created: "✅ created",
      outdated: "⚠️ outdated",
      frozen: "🔒 frozen",
    };
    return (
      <span className={`px-2 py-1 text-xs rounded ${colors[status] || "bg-slate-100"}`}>
        {labels[status] || status}
      </span>
    );
  };

  const renderActions = (lang: SupportedLanguage, status: string) => {
    const busy = !!langLoading[lang];
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
          {status === "missing" ? (
            <ActionIcon
              titleText={tLocal("translateNow")}
              onClick={() => translateLanguage(lang)}
              disabled={busy || loading}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LanguagesIcon className="w-4 h-4" />}
            </ActionIcon>
          ) : null}

          {status === "created" && (
            <>
              <ActionIcon titleText={tLocal("view")} disabled={busy || loading}>
                <Eye className="w-4 h-4" />
              </ActionIcon>
              <ActionIcon titleText={tLocal("edit")} disabled={busy || loading}>
                <Pencil className="w-4 h-4" />
              </ActionIcon>
              <ActionIcon titleText={tLocal("freeze")} disabled={busy || loading}>
                <Snowflake className="w-4 h-4" />
              </ActionIcon>
            </>
          )}

          {status === "outdated" && (
            <>
              <ActionIcon titleText={tLocal("update")} disabled={busy || loading}>
                <RefreshCw className="w-4 h-4" />
              </ActionIcon>
              <ActionIcon titleText={tLocal("viewCurrent")} disabled={busy || loading}>
                <Eye className="w-4 h-4" />
              </ActionIcon>
              <ActionIcon titleText={tLocal("ignore")} disabled={busy || loading}>
                <Ban className="w-4 h-4" />
              </ActionIcon>
            </>
          )}

          {status === "frozen" && (
            <>
              <ActionIcon titleText={tLocal("view")} disabled={busy || loading}>
                <Eye className="w-4 h-4" />
              </ActionIcon>
              <ActionIcon titleText={tLocal("edit")} disabled={busy || loading}>
                <Pencil className="w-4 h-4" />
              </ActionIcon>
              <ActionIcon titleText={tLocal("unfreeze")} disabled={busy || loading}>
                <Unlock className="w-4 h-4" />
              </ActionIcon>
            </>
          )}

          <ActionIcon titleText={tLocal("disableLanguage")} disabled={busy || loading}>
            <Ban className="w-4 h-4" />
          </ActionIcon>
        </div>
        {langError[lang] && <div className="text-xs text-red-600 mt-1">{langError[lang]}</div>}
      </div>
    );
  };

  const LANG_LABELS: Record<SupportedLanguage, string> = {
    en: "English",
    es: "Spanish",
    fr: "French",
    de: "German",
    ru: "Russian",
    pt: "Portuguese",
    hi: "Hindi",
    ch: "Chinese",
    ar: "Arabic",
    zh: "Chinese",
  };
  const formatLanguageLabel = (lang: SupportedLanguage) =>
    `${LANG_LABELS[lang] || lang.toUpperCase()} (${lang.toUpperCase()})`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tLocal("translation")}>
      <div className="pb-4 w-full">
        <div className="border rounded p-2 sm:p-3">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold">{tLocal("languageDashboard")}</h3>
              <label className="inline-flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={translateAllMode}
                  onChange={(e) => setTranslateAllMode(e.target.checked)}
                />
                <span>{tLocal("translateAll")}</span>
              </label>
            </div>
            <div className="flex items-center gap-3">
              {loading && <span className="text-xs text-gray-500">{tLocal("loading")}</span>}
              <span className="s text-gray-600">{tLocal("tableActions")}</span>
            </div>
          </div>

          {loading ? (
            <div className="divide-y">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="py-3 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                  </div>
                  <div className="mt-2 h-3 w-2/3 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y">
              {dashboardLanguages.map((lang) => {
                const status = getLangStatus(lang);
                const details = translationsDoc?.translations?.[lang] || null;
                const modifiedFields = Array.isArray(details?.lastFieldsUpdated) ? details.lastFieldsUpdated : [];
                const updatedAt = details?.updatedAt;
                const createdAt = details?.createdAt;

                return (
                  <div key={lang} className="py-2 sm:py-3 flex items-start justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">
                          {formatLanguageLabel(lang as SupportedLanguage)}
                        </div>
                        {renderStatusBadge(status)}
                      </div>
                      {status === "outdated" && (
                        <div className="mt-1 text-xs text-gray-700">
                          <div className="font-semibold">{tLocal("needsUpdate")}</div>
                          {modifiedFields.length > 0 && (
                            <div className="mt-1">
                              <span className="text-gray-600">{tLocal("modifiedFields")}: </span>
                              <span className="text-gray-800">
                                {modifiedFields.slice(0, 5).join(", ")}
                                {modifiedFields.length > 5 ? " ..." : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      {status !== "missing" && (
                        <div className="mt-1 text-xs text-gray-500">
                          {createdAt && (
                            <div>
                              {tLocal("createdAt")}: {formatTimestamp(createdAt)}
                            </div>
                          )}
                          {updatedAt && (
                            <div>
                              {tLocal("updatedAt")}: {formatTimestamp(updatedAt)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 whitespace-nowrap">
                      {renderActions(lang as SupportedLanguage, status)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between gap-2 pt-2">
          <div>
            {translateAllMode && (
              <Button variant="secondary" onClick={createAllMissing} disabled={loading || anyLangBusy}>
                {tLocal("translateAll")}
              </Button>
            )}
          </div>
          <div>
            <Button variant="secondary" onClick={onClose} disabled={loading || anyLangBusy}>
              {tLocal("cancel")}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TranslationModal;