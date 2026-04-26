/**
 * BookingRequestB2B.tsx
 *
 * Slim booking page for B2B subscribers who arrived from sos-call.sos-expat.com
 * (or any partner gated entry point). The full BookingRequest page is hostile
 * to this flow because it is built around the B2C payment journey:
 *   - "Choose a provider" copy → wrong, the provider is already chosen
 *   - "Continue to payment ($X)" → wrong, partner foots the bill
 *   - "Your card will not be charged until..." → wrong, no card involved
 *
 * This component is the dedicated B2B journey:
 *   - Provider already selected (via :providerId URL param or sessionStorage)
 *   - SOS-Call session token validated upstream (URL ?sosCallToken or sessionStorage)
 *   - Form is reduced to phone + country + language + consent
 *   - Single CTA "Trigger the call" → calls triggerSosCallFromWeb (us-central1)
 *   - On success → /payment-success?callId=...
 *
 * Mounted from BookingRequest.tsx with an early-return when useGatedFlow is true,
 * so existing routes (/booking-request/:providerId and locale-translated aliases)
 * keep working without any App.tsx changes.
 */

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useParams } from "react-router-dom";
import {
  useLocaleNavigate,
  getTranslatedRouteSlug,
} from "../multilingual-system";
import {
  CheckCircle,
  AlertTriangle,
  Loader2,
  Sparkles,
  Shield,
  Clock,
  Phone as PhoneIcon,
  Globe,
  Languages as LanguagesIcon,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { FormattedMessage, useIntl } from "react-intl";

import Layout from "../components/layout/Layout";
import Button from "../components/common/Button";
import { useApp } from "../contexts/AppContext";
import { useAuth } from "../contexts/AuthContext";

import { db, functionsAffiliate } from "../config/firebase";
import { httpsCallable, type HttpsCallable } from "firebase/functions";
import {
  doc,
  onSnapshot,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import type { Provider } from "../types/provider";
import { normalizeProvider } from "../types/provider";

import IntlPhoneInput from "@/components/forms-data/IntlPhoneInput";
import { detectUserCurrency } from "../services/pricingService";
import {
  getCountriesForLocale,
  resolveCountryName,
} from "../data/countries";
import {
  languagesData,
  getLanguageLabel,
} from "../data/languages-spoken";

type CallTypeAllowed = "lawyer" | "expat" | "both" | string;
type SupportedLocale = "fr" | "en" | "es" | "de" | "pt" | "ru" | "ar" | "hi" | "ch";

interface SosCallSession {
  token: string;
  partnerName: string | null;
  callTypesAllowed: CallTypeAllowed;
}

const SUPPORTED_LOCALES: SupportedLocale[] = [
  "fr", "en", "es", "de", "pt", "ru", "ar", "hi", "ch",
];

const normalizeLocale = (raw: unknown): SupportedLocale => {
  const lc = String(raw || "fr").toLowerCase();
  if (lc === "zh") return "ch";
  return (SUPPORTED_LOCALES.includes(lc as SupportedLocale)
    ? (lc as SupportedLocale)
    : "fr");
};

const BookingRequestB2B: React.FC = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useLocaleNavigate();
  const { language } = useApp();
  const { user } = useAuth();
  const intl = useIntl();

  const locale = useMemo<SupportedLocale>(
    () => normalizeLocale(language),
    [language]
  );

  // Provider state
  const [provider, setProvider] = useState<Provider | null>(null);
  const [providerLoading, setProviderLoading] = useState(true);

  // Session B2B (token from sos-call.sos-expat.com)
  const [session, setSession] = useState<SosCallSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [sessionExpiredModal, setSessionExpiredModal] = useState(false);

  // Form state
  const [clientPhone, setClientPhone] = useState<string>(
    () => (user as any)?.phoneNumber || ""
  );
  const [clientCountry, setClientCountry] = useState<string>(
    () => (user as any)?.country || ""
  );
  const [clientLanguage, setClientLanguage] = useState<string>(locale);
  const [consent, setConsent] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Hydrate session from URL or sessionStorage on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let token = params.get("sosCallToken") || "";
    let partnerName = params.get("partnerName") || "";
    let callTypesAllowed = params.get("callTypesAllowed") || "";

    if (!token) {
      try {
        token = sessionStorage.getItem("sosCall.token") || "";
        partnerName =
          partnerName || sessionStorage.getItem("sosCall.partnerName") || "";
        callTypesAllowed =
          callTypesAllowed ||
          sessionStorage.getItem("sosCall.callTypesAllowed") ||
          "";
      } catch {
        /* ignore sessionStorage failures */
      }
    }

    if (token) {
      setSession({
        token,
        partnerName: partnerName || null,
        callTypesAllowed: callTypesAllowed || "both",
      });
      try {
        sessionStorage.setItem("sosCall.token", token);
        if (partnerName)
          sessionStorage.setItem("sosCall.partnerName", partnerName);
        if (callTypesAllowed)
          sessionStorage.setItem("sosCall.callTypesAllowed", callTypesAllowed);
      } catch {
        /* ignore */
      }
    }
    setSessionLoaded(true);
  }, []);

  // Load provider — sessionStorage cache first, then Firestore live snapshot
  useEffect(() => {
    if (!providerId) {
      setProviderLoading(false);
      return;
    }

    let unsub: (() => void) | undefined;

    (async () => {
      try {
        try {
          const cached = sessionStorage.getItem("selectedProvider");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.id) {
              setProvider(parsed);
              setProviderLoading(false);
            }
          }
        } catch {
          /* ignore */
        }

        const isShortId = providerId.length <= 8;
        let docId = providerId;
        if (isShortId) {
          const q = query(
            collection(db, "sos_profiles"),
            where("shortId", "==", providerId)
          );
          const snap = await getDocs(q);
          if (!snap.empty) docId = snap.docs[0].id;
        }

        const ref = doc(db, "sos_profiles", docId);
        unsub = onSnapshot(
          ref,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data() as Record<string, unknown>;
              const normalized = normalizeProvider({
                id: snap.id,
                ...(data as any),
              } as any);
              setProvider(normalized);
              try {
                sessionStorage.setItem(
                  "selectedProvider",
                  JSON.stringify(normalized)
                );
              } catch {
                /* ignore */
              }
            } else {
              setProvider(null);
            }
            setProviderLoading(false);
          },
          () => {
            setProviderLoading(false);
          }
        );

        // Initial best-effort fetch in case onSnapshot is slow on cold start
        try {
          const oneShot = await getDoc(ref);
          if (oneShot.exists()) {
            const data = oneShot.data() as Record<string, unknown>;
            const normalized = normalizeProvider({
              id: oneShot.id,
              ...(data as any),
            } as any);
            setProvider((p) => p || normalized);
          }
        } catch {
          /* ignore */
        }
      } catch {
        setProviderLoading(false);
      }
    })();

    return () => {
      if (unsub) unsub();
    };
  }, [providerId]);

  const providerType = useMemo<"lawyer" | "expat">(() => {
    const t = String(
      (provider as any)?.type || (provider as any)?.role || ""
    ).toLowerCase();
    return t === "lawyer" ? "lawyer" : "expat";
  }, [provider]);

  const partnerLabel =
    session?.partnerName ||
    intl.formatMessage({
      id: "bookingB2B.defaultPartner",
      defaultMessage: "votre partenaire",
    });

  const callTypeAllowed = useMemo(() => {
    if (!session) return true;
    const allowed = String(session.callTypesAllowed || "both").toLowerCase();
    if (allowed === "both") return true;
    if (allowed === "lawyer" && providerType === "lawyer") return true;
    if (allowed === "expat" && providerType === "expat") return true;
    return false;
  }, [session, providerType]);

  // Country options for the current locale
  const countryOptions = useMemo(
    () => getCountriesForLocale(locale),
    [locale]
  );

  // Language options for the current locale (top 30 most-used + alphabetical)
  const languageOptions = useMemo(() => {
    const safeLocale = locale === "ch" ? "ch" : locale;
    return languagesData
      .map((l) => ({
        code: l.code,
        label: getLanguageLabel(l, safeLocale as any),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, locale));
  }, [locale]);

  // Pretty provider info
  const providerName = useMemo(() => {
    const p: any = provider || {};
    return (
      p.name ||
      [p.firstName, p.lastName].filter(Boolean).join(" ").trim() ||
      "—"
    );
  }, [provider]);

  const providerCountryLabel = useMemo(() => {
    const code: string =
      (provider as any)?.country ||
      (provider as any)?.currentCountry ||
      (provider as any)?.currentCountryCode ||
      "";
    if (!code) return null;
    return resolveCountryName(code, locale);
  }, [provider, locale]);

  const providerLanguagesLabel = useMemo(() => {
    const langs: string[] =
      (provider as any)?.languagesSpoken ||
      (provider as any)?.languages ||
      [];
    if (!Array.isArray(langs) || langs.length === 0) return null;
    return langs
      .map((code) => {
        const found = languagesData.find(
          (l) => l.code.toLowerCase() === String(code).toLowerCase()
        );
        return found ? getLanguageLabel(found, locale as any) : code;
      })
      .slice(0, 4)
      .join(", ");
  }, [provider, locale]);

  // Submit
  const onSubmit = useCallback(async () => {
    setFormError(null);

    if (!session?.token) {
      setSessionExpiredModal(true);
      return;
    }
    if (!provider?.id) {
      setFormError(
        intl.formatMessage({
          id: "bookingB2B.errors.noProvider",
          defaultMessage: "Prestataire introuvable.",
        })
      );
      return;
    }
    if (!callTypeAllowed) {
      setFormError(
        providerType === "lawyer"
          ? intl.formatMessage({
              id: "bookingB2B.errors.notAllowedLawyer",
              defaultMessage:
                "Votre forfait ne couvre pas les appels avec un avocat. Choisissez un expert.",
            })
          : intl.formatMessage({
              id: "bookingB2B.errors.notAllowedExpat",
              defaultMessage:
                "Votre forfait ne couvre pas les appels avec un expert. Choisissez un avocat.",
            })
      );
      return;
    }
    if (!clientPhone || clientPhone.length < 7) {
      setFormError(
        intl.formatMessage({
          id: "bookingB2B.errors.phoneRequired",
          defaultMessage: "Numéro de téléphone obligatoire.",
        })
      );
      return;
    }
    if (!consent) {
      setFormError(
        intl.formatMessage({
          id: "bookingB2B.errors.consentRequired",
          defaultMessage:
            "Veuillez accepter les conditions d'utilisation pour continuer.",
        })
      );
      return;
    }

    setSubmitting(true);
    try {
      const trigger: HttpsCallable<
        Record<string, unknown>,
        {
          success: boolean;
          callSessionId?: string;
          message?: string;
          providerDisplayName?: string;
        }
      > = httpsCallable(functionsAffiliate, "triggerSosCallFromWeb");

      const sosCallCurrency = detectUserCurrency();
      const result = await trigger({
        sosCallSessionToken: session.token,
        providerType,
        providerId: provider.id,
        clientPhone,
        clientLanguage,
        clientCountry,
        clientCurrency: sosCallCurrency,
      });

      if (!result?.data?.success) {
        throw new Error(result?.data?.message || "SCHEDULE_FAILED");
      }

      const callId = result.data.callSessionId;
      try {
        sessionStorage.setItem(
          "lastPaymentSuccess",
          JSON.stringify({
            callId,
            providerId: provider.id,
            providerRole:
              (provider as any).role ||
              (provider as any).type ||
              "expat",
            serviceType:
              providerType === "lawyer" ? "lawyer_call" : "expat_call",
            amount: 0,
            isSosCallFree: true,
            partnerName: session.partnerName,
            savedAt: Date.now(),
          })
        );
      } catch {
        /* ignore */
      }

      const successSlug = getTranslatedRouteSlug(
        "payment-success",
        locale as any
      );
      navigate(
        `/${successSlug}${callId ? `?callId=${encodeURIComponent(callId)}` : ""}`,
        { replace: true }
      );
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      if (
        /expired|expir[ée]|invalid.*session|session.*invalide|invalid.*token|token.*invalide|SOS-Call session/i.test(
          raw
        )
      ) {
        setSessionExpiredModal(true);
        try {
          sessionStorage.removeItem("sosCall.token");
          sessionStorage.removeItem("sosCall.partnerName");
          sessionStorage.removeItem("sosCall.callTypesAllowed");
        } catch {
          /* ignore */
        }
        setSubmitting(false);
        return;
      }
      setFormError(
        intl.formatMessage({
          id: "bookingB2B.errors.scheduleFailed",
          defaultMessage:
            "Impossible de programmer l'appel. Réessayez dans quelques instants.",
        })
      );
      setSubmitting(false);
    }
  }, [
    session,
    provider,
    providerType,
    callTypeAllowed,
    clientPhone,
    clientLanguage,
    clientCountry,
    consent,
    navigate,
    locale,
    intl,
  ]);

  // Loading skeleton
  if (!sessionLoaded || providerLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2
            className="h-8 w-8 animate-spin text-red-600"
            aria-hidden="true"
          />
        </div>
      </Layout>
    );
  }

  // No session → bounce to sos-call landing (or show fallback)
  if (!session) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <AlertTriangle
            className="h-12 w-12 text-amber-500 mx-auto mb-4"
            aria-hidden="true"
          />
          <h1 className="text-2xl font-bold mb-3">
            <FormattedMessage
              id="bookingB2B.noSession.title"
              defaultMessage="Session B2B introuvable"
            />
          </h1>
          <p className="text-gray-600 mb-6">
            <FormattedMessage
              id="bookingB2B.noSession.body"
              defaultMessage="Pour utiliser un appel pris en charge par votre partenaire, retournez à la page d'accès et saisissez votre code."
            />
          </p>
          <a
            href="https://sos-call.sos-expat.com"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl"
          >
            <FormattedMessage
              id="bookingB2B.noSession.cta"
              defaultMessage="Retour à la page d'accès"
            />
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </Layout>
    );
  }

  // Provider not found
  if (!provider) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <AlertTriangle
            className="h-12 w-12 text-amber-500 mx-auto mb-4"
            aria-hidden="true"
          />
          <h1 className="text-2xl font-bold mb-3">
            <FormattedMessage
              id="bookingB2B.providerNotFound.title"
              defaultMessage="Prestataire introuvable"
            />
          </h1>
          <p className="text-gray-600">
            <FormattedMessage
              id="bookingB2B.providerNotFound.body"
              defaultMessage="Ce prestataire n'est plus disponible. Veuillez en choisir un autre depuis sos-call.sos-expat.com."
            />
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-to-b from-red-50 via-white to-white min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
          {/* Partner banner */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl px-5 py-4 md:px-6 md:py-5 shadow-lg flex items-start gap-3 mb-6">
            <Sparkles
              className="h-6 w-6 md:h-7 md:w-7 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <div className="font-semibold text-sm md:text-base leading-snug">
                <FormattedMessage
                  id="bookingB2B.banner.title"
                  defaultMessage="Appel pris en charge par {partner}"
                  values={{
                    partner: <strong>{partnerLabel}</strong>,
                  }}
                />
              </div>
              <div className="text-red-100 text-xs md:text-sm mt-0.5">
                <FormattedMessage
                  id="bookingB2B.banner.subtitle"
                  defaultMessage="Vous ne payez rien — le forfait de votre partenaire couvre la totalité de l'appel."
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            <FormattedMessage
              id="bookingB2B.title"
              defaultMessage="Confirmez vos informations"
            />
          </h1>
          <p className="text-gray-600 mb-6 md:mb-8">
            <FormattedMessage
              id="bookingB2B.subtitle"
              defaultMessage="Plus qu'une étape : confirmez votre numéro et déclenchez l'appel. Vous serez contacté dans moins de 5 minutes."
            />
          </p>

          {/* Provider summary card (read-only) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 mb-3">
              <CheckCircle
                className="h-4 w-4 text-green-500"
                aria-hidden="true"
              />
              <span>
                <FormattedMessage
                  id="bookingB2B.providerCard.heading"
                  defaultMessage="Votre prestataire"
                />
              </span>
            </div>
            <div className="flex items-start gap-4">
              {(provider as any).avatar || (provider as any).profilePhoto ? (
                <img
                  src={
                    (provider as any).avatar ||
                    (provider as any).profilePhoto
                  }
                  alt={providerName}
                  className="h-16 w-16 md:h-20 md:w-20 rounded-full object-cover ring-2 ring-red-100"
                  loading="lazy"
                />
              ) : (
                <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xl">
                  {providerName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-lg text-gray-900 truncate">
                  {providerName}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {providerType === "lawyer" ? (
                    <FormattedMessage
                      id="bookingB2B.providerCard.lawyer"
                      defaultMessage="Avocat agréé"
                    />
                  ) : (
                    <FormattedMessage
                      id="bookingB2B.providerCard.expat"
                      defaultMessage="Expert expatrié"
                    />
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  {providerCountryLabel && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {providerCountryLabel}
                    </span>
                  )}
                  {providerLanguagesLabel && (
                    <span className="inline-flex items-center gap-1">
                      <LanguagesIcon
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      {providerLanguagesLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!submitting) onSubmit();
            }}
            className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-5"
            noValidate
          >
            <div>
              <label
                htmlFor="b2b-phone"
                className="block text-sm font-semibold text-gray-800 mb-1.5"
              >
                <FormattedMessage
                  id="bookingB2B.form.phone.label"
                  defaultMessage="Votre numéro de téléphone"
                />
                <span className="text-red-600 ms-1" aria-hidden="true">
                  *
                </span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                <FormattedMessage
                  id="bookingB2B.form.phone.hint"
                  defaultMessage="Le prestataire vous appellera sur ce numéro dans moins de 5 minutes."
                />
              </p>
              <IntlPhoneInput
                id="b2b-phone"
                value={clientPhone}
                onChange={setClientPhone}
                disabled={submitting}
                locale={locale as any}
                aria-required={true}
                aria-invalid={!!formError && !clientPhone}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="b2b-country"
                  className="block text-sm font-semibold text-gray-800 mb-1.5"
                >
                  <FormattedMessage
                    id="bookingB2B.form.country.label"
                    defaultMessage="Pays où vous vous trouvez"
                  />
                </label>
                <div className="relative">
                  <Globe
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
                    aria-hidden="true"
                  />
                  <select
                    id="b2b-country"
                    value={clientCountry}
                    onChange={(e) => setClientCountry(e.target.value)}
                    disabled={submitting}
                    className="w-full ps-9 pe-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  >
                    <option value="">
                      {intl.formatMessage({
                        id: "bookingB2B.form.country.placeholder",
                        defaultMessage: "— Sélectionnez —",
                      })}
                    </option>
                    {countryOptions.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="b2b-language"
                  className="block text-sm font-semibold text-gray-800 mb-1.5"
                >
                  <FormattedMessage
                    id="bookingB2B.form.language.label"
                    defaultMessage="Langue de l'appel"
                  />
                </label>
                <div className="relative">
                  <LanguagesIcon
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
                    aria-hidden="true"
                  />
                  <select
                    id="b2b-language"
                    value={clientLanguage}
                    onChange={(e) => setClientLanguage(e.target.value)}
                    disabled={submitting}
                    className="w-full ps-9 pe-3 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  >
                    {languageOptions.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Consent */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                disabled={submitting}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                aria-required={true}
              />
              <span className="text-sm text-gray-700 leading-snug">
                <FormattedMessage
                  id="bookingB2B.form.consent"
                  defaultMessage="J'accepte les <terms>conditions d'utilisation</terms> et la <privacy>politique de confidentialité</privacy>."
                  values={{
                    terms: (chunks) => (
                      <a
                        href={`/${getTranslatedRouteSlug("terms-clients", locale as any)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-700 underline hover:text-red-800"
                      >
                        {chunks}
                      </a>
                    ),
                    privacy: (chunks) => (
                      <a
                        href={`/${getTranslatedRouteSlug("privacy-policy", locale as any)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-700 underline hover:text-red-800"
                      >
                        {chunks}
                      </a>
                    ),
                  }}
                />
              </span>
            </label>

            {formError && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-4 py-3 flex items-start gap-2"
              >
                <AlertTriangle
                  className="h-4 w-4 mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{formError}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              disabled={submitting}
              fullWidth
              size="large"
            >
              <PhoneIcon className="h-5 w-5 me-2" aria-hidden="true" />
              <FormattedMessage
                id="bookingB2B.form.submit"
                defaultMessage="Déclencher l'appel maintenant"
              />
            </Button>

            <p className="text-xs text-center text-gray-500">
              <FormattedMessage
                id="bookingB2B.form.submit.hint"
                defaultMessage="En cliquant, le prestataire vous appellera dans moins de 5 minutes. Aucun paiement requis — pris en charge par {partner}."
                values={{ partner: <strong>{partnerLabel}</strong> }}
              />
            </p>
          </form>

          {/* Trust badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
            <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <Sparkles
                className="h-5 w-5 text-red-600 shrink-0"
                aria-hidden="true"
              />
              <div className="text-xs text-gray-700">
                <div className="font-semibold">
                  <FormattedMessage
                    id="bookingB2B.trust.nopay.title"
                    defaultMessage="Vous ne payez rien"
                  />
                </div>
                <div className="text-gray-500">
                  <FormattedMessage
                    id="bookingB2B.trust.nopay.body"
                    defaultMessage="Pris en charge par votre partenaire"
                  />
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <Clock
                className="h-5 w-5 text-red-600 shrink-0"
                aria-hidden="true"
              />
              <div className="text-xs text-gray-700">
                <div className="font-semibold">
                  <FormattedMessage
                    id="bookingB2B.trust.fast.title"
                    defaultMessage="Moins de 5 minutes"
                  />
                </div>
                <div className="text-gray-500">
                  <FormattedMessage
                    id="bookingB2B.trust.fast.body"
                    defaultMessage="Disponible 24/7/365"
                  />
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <Shield
                className="h-5 w-5 text-red-600 shrink-0"
                aria-hidden="true"
              />
              <div className="text-xs text-gray-700">
                <div className="font-semibold">
                  <FormattedMessage
                    id="bookingB2B.trust.secure.title"
                    defaultMessage="Données chiffrées"
                  />
                </div>
                <div className="text-gray-500">
                  <FormattedMessage
                    id="bookingB2B.trust.secure.body"
                    defaultMessage="Conformité RGPD"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session-expired modal */}
      {sessionExpiredModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="b2b-expired-title"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle
                className="h-6 w-6 text-amber-500"
                aria-hidden="true"
              />
              <h2
                id="b2b-expired-title"
                className="text-lg font-bold text-gray-900"
              >
                <FormattedMessage
                  id="bookingB2B.expired.title"
                  defaultMessage="Session expirée"
                />
              </h2>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              <FormattedMessage
                id="bookingB2B.expired.body"
                defaultMessage="Votre session B2B a expiré. Pour relancer un appel, retournez à la page d'accès et saisissez à nouveau votre code partenaire."
              />
            </p>
            <a
              href="https://sos-call.sos-expat.com"
              className="block w-full text-center bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl"
            >
              <FormattedMessage
                id="bookingB2B.expired.cta"
                defaultMessage="Retour à la page d'accès"
              />
            </a>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BookingRequestB2B;
