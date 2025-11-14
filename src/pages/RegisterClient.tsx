// =============================================================================
// FICHIER: src/pages/RegisterClient.tsx
// Refactored to use react-intl instead of inline i18nConfig
// =============================================================================

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  lazy,
  Suspense,
} from "react";
import {
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  UserCheck,
  Clock3,
  Languages,
  ShieldCheck,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Layout from "../components/layout/Layout";
import Button from "../components/common/Button";
import { useAuth } from "../contexts/AuthContext";
import { useApp } from "../contexts/AppContext";
import { serverTimestamp, FieldValue } from "firebase/firestore";
import type { MultiValue } from "react-select";
import type { Provider } from "../types/provider";
import { FormattedMessage, useIntl } from "react-intl";

// ✅ PhoneField imports
import PhoneField from "@/components/PhoneField";
import { Controller, useForm } from "react-hook-form";
import IntlPhoneInput from "@/components/forms-data/IntlPhoneInput";
import { parsePhoneNumberFromString } from "libphonenumber-js";

// ==========================
// Lazy Components
// ==========================
const MultiLanguageSelect = lazy(
  () => import("../components/forms-data/MultiLanguageSelect")
);

// ==========================
// Constants / Regex
// ==========================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ==========================
// Types
// ==========================
interface CreateUserData {
  role: "client";
  firstName: string;
  email: string;
  languagesSpoken: string[];
  phone?: string; // added so phone can be persisted
  whatsappNumber?: string;
  isApproved: boolean;
  createdAt: FieldValue;
}

interface FormData {
  firstName: string;
  email: string;
  password: string;
  languagesSpoken: string[];
  customLanguage: string;
  clientPhone: string;
   whatsappNumber: string;
}

interface FieldErrors {
  firstName?: string;
  email?: string;
  password?: string;
  languagesSpoken?: string;
  terms?: string;
  general?: string;
  clientPhone?: string;
  whatsappNumber?: string;
}

interface FieldValidation {
  firstName: boolean;
  email: boolean;
  password: boolean;
  languagesSpoken: boolean;
  terms: boolean;
  clientPhone: boolean;
  whatsappNumber: boolean;
}

const inputClass = (hasErr?: boolean) =>
  `w-full px-3 py-3 border-2 rounded-xl bg-white text-gray-900 placeholder-gray-500 focus:outline-none transition-all duration-200 text-base 
  
    [&_input]:border-0 [&_input]:outline-none [&_input]:shadow-none
    [&_input:focus]:border-0 [&_input:focus]:outline-none [&_input:focus]:shadow-none
    [&_select]:outline-none [&_select:focus]:outline-none
  ${
    hasErr
      ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-red-50"
      : "border-gray-200 hover:border-gray-300 focus:border-red-600"
  }`;

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

// ==========================
// Helper Functions
// ==========================
const normalizeEmail = (s: string): string =>
  (s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\u00A0/g, "")
    .replace(/[\u2000-\u200D]/g, "");

const isEmailFormatValid = (email: string): boolean => EMAIL_REGEX.test(email);

const calculatePasswordStrength = (
  password: string
): { score: number; label: string; color: string } => {
  if (password.length === 0) return { score: 0, label: "", color: "" };
  let score = 0;
  let label = "";
  let color = "";
  if (password.length >= 6) score += 30;
  if (password.length >= 8) score += 20;
  if (password.length >= 10) score += 15;
  if (password.length >= 12) score += 15;
  if (/[a-z]/.test(password)) score += 5;
  if (/[A-Z]/.test(password)) score += 5;
  if (/[0-9]/.test(password)) score += 5;
  if (/[^a-zA-Z0-9]/.test(password)) score += 5;
  if (password.length < 6) {
    label = "Trop court 😅";
    color = "bg-red-500";
    score = Math.min(score, 25);
  } else if (score < 40) {
    label = "Faible 🙂";
    color = "bg-orange-500";
  } else if (score < 55) {
    label = "Moyen 👍";
    color = "bg-yellow-500";
  } else if (score < 70) {
    label = "Bon 🔥";
    color = "bg-blue-500";
  } else {
    label = "Excellent 🚀";
    color = "bg-green-500";
  }
  return { score: Math.min(100, score), label, color };
};

// ==========================
// UI Sub-components
// ==========================
const CustomFieldInput = React.memo(
  ({
    placeholder,
    value,
    onChange,
    onAdd,
    disabled,
    addLabel,
  }: {
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    onAdd: () => void;
    disabled: boolean;
    addLabel: string;
  }) => (
    <div className="mt-3 flex flex-col sm:flex-row gap-2">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300"
        onKeyDown={(e) => e.key === "Enter" && !disabled && onAdd()}
      />
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 whitespace-nowrap"
      >
        {addLabel}
      </button>
    </div>
  )
);
CustomFieldInput.displayName = "CustomFieldInput";

const FieldError = React.memo(
  ({ error, show }: { error?: string; show: boolean }) => {
    if (!show || !error) return null;
    return (
      <div className="mt-1 flex items-center gap-1 text-sm text-red-600 bg-red-50 rounded-lg px-2 py-1">
        <XCircle className="h-4 w-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }
);
FieldError.displayName = "FieldError";

const FieldSuccess = React.memo(
  ({ show, message }: { show: boolean; message: string }) => {
    if (!show) return null;
    return (
      <div className="mt-1 inline-flex items-center gap-1 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1">
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
        <span>{message}</span>
      </div>
    );
  }
);
FieldSuccess.displayName = "FieldSuccess";

const PasswordStrengthBar = React.memo(
  ({ password, label }: { password: string; label: string }) => {
    const strength = useMemo(
      () => calculatePasswordStrength(password),
      [password]
    );
    if (password.length === 0) return null;
    return (
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
          <span>{label}</span>
          <span className="font-medium">{strength.label}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${strength.color}`}
            style={{ width: `${strength.score}%` }}
          />
        </div>
      </div>
    );
  }
);
PasswordStrengthBar.displayName = "PasswordStrengthBar";

// ==========================
// Main Component
// ==========================
const RegisterClient: React.FC = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  // ✅ react-hook-form control for PhoneField
  // const { control } = useForm<{ clientPhone: string; providerPhone: string }>({
  //   defaultValues: { clientPhone: '', providerPhone: '' },
  // });
  const { control, watch } = useForm<{ clientPhone: string , whatsappNumber: string}>({
    defaultValues: { clientPhone: "",    whatsappNumber: ""  },
    mode: "onChange", // ✅ Validate on change
  });
  const clientPhone = watch("clientPhone");
  const whatsappNumber = watch("whatsappNumber");

  // Preserve provider if coming from "Book now"
  useEffect(() => {
    const rawState: unknown = location.state;
    const state = (rawState ?? null) as NavState | null;
    const sp = state?.selectedProvider;
    if (isProviderLike(sp)) {
      try {
        sessionStorage.setItem("selectedProvider", JSON.stringify(sp));
      } catch (err) {
        if (import.meta.env.DEV) console.debug("sessionStorage error:", err);
      }
    }
  }, [location.state]);

  const { register, isLoading, error } = useAuth();
  const { language } = useApp();

  // Initial form data
  const initialFormData: FormData = useMemo(
    () => ({
      firstName: "",
      email: "",
      password: "",
      languagesSpoken: [],
      customLanguage: "",
      clientPhone: "",
      whatsappNumber: "",
    }),
    []
  );

  // Component state
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedLanguages, setSelectedLanguages] = useState<
    MultiValue<{ value: string; label: string }>
  >([]);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [fieldValidation, setFieldValidation] = useState<FieldValidation>({
    firstName: false,
    email: false,
    password: false,
    languagesSpoken: false,
    terms: false,
    clientPhone: false,
    whatsappNumber: false,
  });
  const [showCustomLanguage, setShowCustomLanguage] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // ==========================
  // SEO / Meta Tags
  // ==========================
  useEffect(() => {
    document.title = intl.formatMessage({ id: "registerClient.meta.title" });

    const setMeta = (
      attr: "name" | "property",
      key: string,
      content: string
    ) => {
      let el = document.querySelector(
        `meta[${attr}="${key}"]`
      ) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta(
      "name",
      "description",
      intl.formatMessage({ id: "registerClient.meta.description" })
    );
    setMeta(
      "name",
      "keywords",
      intl.formatMessage({ id: "registerClient.meta.keywords" })
    );
    setMeta(
      "property",
      "og:title",
      intl.formatMessage({ id: "registerClient.meta.title" })
    );
    setMeta(
      "property",
      "og:description",
      intl.formatMessage({ id: "registerClient.meta.description" })
    );
    setMeta("property", "og:type", "website");
    setMeta("property", "og:locale", language === "en" ? "en_US" : "fr_FR");
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta(
      "name",
      "twitter:title",
      intl.formatMessage({ id: "registerClient.meta.title" })
    );
    setMeta(
      "name",
      "twitter:description",
      intl.formatMessage({ id: "registerClient.meta.description" })
    );

    const id = "jsonld-register-client";
    let script = document.getElementById(id) as HTMLScriptElement | null;
    const jsonld = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: intl.formatMessage({ id: "registerClient.ui.title" }),
      description: intl.formatMessage({
        id: "registerClient.meta.description",
      }),
      inLanguage: language === "en" ? "en-US" : "fr-FR",
      url: typeof window !== "undefined" ? window.location.href : undefined,
      isPartOf: {
        "@type": "WebSite",
        name: "SOS Expats",
        url: typeof window !== "undefined" ? window.location.origin : undefined,
      },
      mainEntity: { "@type": "Person", name: "Client" },
    } as const;

    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonld);
  }, [intl, language]);

  // ==========================
  // UI Helpers
  // ==========================
  const inputBase = useMemo(
    () =>
      "w-full px-4 py-3 rounded-xl border transition-all duration-200 text-sm focus:outline-none",
    []
  );

  const getInputClassName = useCallback(
    (fieldName: string, hasIcon: boolean = false) => {
      const isValid = fieldValidation[fieldName as keyof FieldValidation];
      const hasError =
        fieldErrors[fieldName as keyof FieldErrors] && touched[fieldName];
      let className = inputBase;
      if (hasIcon) className += " pl-11";
      if (hasError) {
        className +=
          " bg-red-50/50 border-red-300 focus:ring-4 focus:ring-red-500/20 focus:border-red-500";
      } else if (isValid && touched[fieldName]) {
        className +=
          " bg-green-50/50 border-green-300 focus:ring-4 focus:ring-green-500/20 focus:border-green-500";
      } else {
        className +=
          " bg-white/90 border-gray-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 hover:border-blue-400";
      }
      return className;
    },
    [inputBase, fieldValidation, fieldErrors, touched]
  );

  const isValidEmail = useCallback(
    (email: string): boolean => isEmailFormatValid(email),
    []
  );

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ==========================
  // Field Validation
  // ==========================
  const validateField = useCallback(
    (fieldName: string, value: string | string[] | boolean) => {
      const errors: FieldErrors = {};
      const validation: Partial<FieldValidation> = {};

      switch (fieldName) {
        case "firstName":
          if (!value || (typeof value === "string" && !value.trim())) {
            errors.firstName = intl.formatMessage({
              id: "registerClient.errors.firstNameRequired",
            });
            validation.firstName = false;
          } else if (typeof value === "string" && value.trim().length < 2) {
            errors.firstName = intl.formatMessage({
              id: "registerClient.errors.firstNameTooShort",
            });
            validation.firstName = false;
          } else {
            validation.firstName = true;
          }
          break;

        case "email":
          if (!value || (typeof value === "string" && !value.trim())) {
            errors.email = intl.formatMessage({
              id: "registerClient.errors.emailRequired",
            });
            validation.email = false;
          } else if (typeof value === "string" && !isValidEmail(value)) {
            errors.email = intl.formatMessage({
              id: "registerClient.errors.emailInvalid",
            });
            validation.email = false;
          } else {
            validation.email = true;
          }
          break;

        case "password":
          if (!value) {
            errors.password = intl.formatMessage({
              id: "registerClient.errors.passwordRequired",
            });
            validation.password = false;
          } else if (typeof value === "string" && value.length < 6) {
            errors.password = intl.formatMessage({
              id: "registerClient.errors.passwordTooShort",
            });
            validation.password = false;
          } else {
            validation.password = true;
          }
          break;

        case "languagesSpoken":
          if (!value || (Array.isArray(value) && value.length === 0)) {
            errors.languagesSpoken = intl.formatMessage({
              id: "registerClient.errors.languagesRequired",
            });
            validation.languagesSpoken = false;
          } else {
            validation.languagesSpoken = true;
          }
          break;

          case "whatsappNumber":
  if (!value || (typeof value === "string" && !value.trim())) {
    errors.whatsappNumber = intl.formatMessage({
      id: "registerClient.errors.whatsappRequired",
    });
    validation.whatsappNumber = false;
  } else if (typeof value === "string") {
    try {
      const parsed = parsePhoneNumberFromString(value);
      if (!parsed || !parsed.isValid()) {
        errors.whatsappNumber = intl.formatMessage({
          id: "registerClient.errors.whatsappInvalid",
        });
        validation.whatsappNumber = false;
      } else {
        validation.whatsappNumber = true;
      }
    } catch {
      errors.whatsappNumber = intl.formatMessage({
        id: "registerClient.errors.whatsappInvalid",
      });
      validation.whatsappNumber = false;
    }
  }
  break;
        case "clientPhone":
          if (!value || (typeof value === "string" && !value.trim())) {
            errors.clientPhone = intl.formatMessage({
              id: "registerClient.errors.phoneRequired",
            });
            validation.clientPhone = false;
          } else if (typeof value === "string") {
            // Use libphonenumber for robust validation to match Controller's validator
            try {
              const parsed = parsePhoneNumberFromString(value);
              if (!parsed || !parsed.isValid()) {
                errors.clientPhone = intl.formatMessage({
                  id: "registerClient.errors.phoneInvalid",
                });
                validation.clientPhone = false;
              } else {
                validation.clientPhone = true;
              }
            } catch {
              errors.clientPhone = intl.formatMessage({
                id: "registerClient.errors.phoneInvalid",
              });
              validation.clientPhone = false;
            }
          }
          break;

        case "terms":
          if (!value) {
            errors.terms = intl.formatMessage({
              id: "registerClient.errors.termsRequired",
            });
            validation.terms = false;
          } else {
            validation.terms = true;
          }
          break;
      }

      return { errors, validation };
    },
    [intl, isValidEmail]
  );

  useEffect(() => {
    // Always keep formData.clientPhone in sync with the react-hook-form value.
    // Validate on every change (including empty string) to avoid stale state
    // that would allow submission when phone is cleared/incomplete.
    const value = (clientPhone ?? "") as string;
    setFormData((prev) => ({ ...prev, clientPhone: value }));
    const { errors, validation } = validateField("clientPhone", value);
    setFieldErrors((prev) => ({ ...prev, clientPhone: errors.clientPhone }));
    setFieldValidation((prev) => ({ ...prev, ...validation }));
  }, [clientPhone, validateField]);


  useEffect(() => {
  const value = (whatsappNumber ?? "") as string;
  setFormData((prev) => ({ ...prev, whatsappNumber: value }));
  const { errors, validation } = validateField("whatsappNumber", value);
  setFieldErrors((prev) => ({ ...prev, whatsappNumber: errors.whatsappNumber }));
  setFieldValidation((prev) => ({ ...prev, ...validation }));
}, [whatsappNumber, validateField]);

  const handleFieldBlur = useCallback((fieldName: string) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      const { errors, validation } = validateField(name, value);
      setFieldErrors((prev) => ({
        ...prev,
        [name]: errors[name as keyof FieldErrors],
      }));
      setFieldValidation((prev) => ({ ...prev, ...validation }));
    },
    [validateField]
  );

  // Language handlers
  const handleAddCustomLanguage = useCallback(() => {
    const customLang = formData.customLanguage.trim();
    if (
      customLang &&
      !selectedLanguages.some((lang) => lang.value === customLang)
    ) {
      const newLanguage = { value: customLang, label: customLang };
      setSelectedLanguages((prev) => [...prev, newLanguage]);
      setFormData((prev) => ({
        ...prev,
        customLanguage: "",
        languagesSpoken: [...prev.languagesSpoken, customLang],
      }));
      setShowCustomLanguage(false);

      const newLanguages = [...formData.languagesSpoken, customLang];
      const { errors, validation } = validateField(
        "languagesSpoken",
        newLanguages
      );
      setFieldErrors((prev) => ({
        ...prev,
        languagesSpoken: errors.languagesSpoken,
      }));
      setFieldValidation((prev) => ({ ...prev, ...validation }));
    }
  }, [
    formData.customLanguage,
    formData.languagesSpoken,
    selectedLanguages,
    validateField,
  ]);

  const handleLanguagesChange = useCallback(
    (newValue: MultiValue<{ value: string; label: string }>) => {
      setSelectedLanguages(newValue);
      const languagesArray = newValue.map((lang) => lang.value);
      setFormData((prev) => ({
        ...prev,
        languagesSpoken: languagesArray,
      }));
      const { errors, validation } = validateField(
        "languagesSpoken",
        languagesArray
      );
      setFieldErrors((prev) => ({
        ...prev,
        languagesSpoken: errors.languagesSpoken,
      }));
      setFieldValidation((prev) => ({ ...prev, ...validation }));
      setShowCustomLanguage(newValue.some((lang) => lang.value === "other"));
    },
    [validateField]
  );

  const handleTermsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked;
      setTermsAccepted(isChecked);
      const { errors, validation } = validateField("terms", isChecked);
      setFieldErrors((prev) => ({ ...prev, terms: errors.terms }));
      setFieldValidation((prev) => ({ ...prev, ...validation }));
    },
    [validateField]
  );

  // Global validation
  const validateAllFields = useCallback((): boolean => {
    const allErrors: FieldErrors = {};
    const allValidation: FieldValidation = {
      firstName: false,
      email: false,
      password: false,
      languagesSpoken: false,
      terms: false,
      clientPhone: false,
          whatsappNumber: false,
    };

    const fields = [
      { name: "firstName", value: formData.firstName },
      { name: "email", value: formData.email },
      { name: "password", value: formData.password },
      { name: "languagesSpoken", value: formData.languagesSpoken },
      { name: "terms", value: termsAccepted },
      { name: "clientPhone", value: formData.clientPhone },
      { name: "whatsappNumber", value: formData.whatsappNumber },
    ];

    fields.forEach(({ name, value }) => {
      const { errors, validation } = validateField(name, value);
      Object.assign(allErrors, errors);
      Object.assign(allValidation, validation);
    });

    setFieldErrors(allErrors);
    setFieldValidation(allValidation);
    setTouched({
      firstName: true,
      email: true,
      password: true,
      languagesSpoken: true,
      terms: true,
      clientPhone: true,
      whatsappNumber: true,
    });

    return Object.keys(allErrors).length === 0;
  }, [formData, termsAccepted, validateField]);

  // Error message mapping
  const getErrorMessage = useCallback(
    (errorCode: string, originalMessage?: string): string => {
      switch (errorCode) {
        case "auth/email-already-in-use":
          return intl.formatMessage({
            id: "registerClient.errors.emailAlreadyExists",
          });
        case "sos/email-linked-to-google":
          return 'Cet email est lié à un compte Google. Utilisez "Se connecter avec Google".';
        case "auth/network-request-failed":
          return intl.formatMessage({
            id: "registerClient.errors.networkError",
          });
        case "auth/too-many-requests":
          return intl.formatMessage({
            id: "registerClient.errors.tooManyRequests",
          });
        case "auth/weak-password":
        case "auth/invalid-password":
          return intl.formatMessage({
            id: "registerClient.errors.passwordTooShort",
          });
        default:
          if (
            originalMessage &&
            (originalMessage.includes("majuscule") ||
              originalMessage.includes("minuscule") ||
              originalMessage.includes("chiffre"))
          ) {
            return intl.formatMessage({
              id: "registerClient.errors.passwordTooShort",
            });
          }
          return intl.formatMessage({
            id: "registerClient.errors.registrationError",
          });
      }
    },
    [intl]
  );

  // Form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateAllFields()) {
        scrollToTop();
        return;
      }

      try {
        // normalize/validate phone and include it when valid
        let clientPhoneToStore: string | undefined = undefined;
        if (formData.clientPhone) {
          try {
            const parsed = parsePhoneNumberFromString(formData.clientPhone);
            if (parsed && parsed.isValid()) clientPhoneToStore = parsed.number; // E.164
          } catch {
            /* ignore - validation elsewhere prevents invalid submission */
          }
        }

        let whatsappToStore: string | undefined = undefined;
if (formData.whatsappNumber) {
  try {
    const parsed = parsePhoneNumberFromString(formData.whatsappNumber);
    if (parsed && parsed.isValid()) whatsappToStore = parsed.number;
  } catch {
    /* ignore */
  }
}

        const userData: CreateUserData = {
          role: "client",
          firstName: formData.firstName.trim(),
          email: normalizeEmail(formData.email),
          languagesSpoken: formData.languagesSpoken,
          phone: clientPhoneToStore,
          whatsappNumber: whatsappToStore,
          isApproved: true,
          createdAt: serverTimestamp(),
        };

        await register(
          userData as unknown as Parameters<typeof register>[0],
          formData.password
        );
        navigate(redirect, { replace: true });
      } catch (err) {
        if (import.meta.env.DEV) console.error("register client error:", err);
        const errorObj = err as { code?: string; message?: string };
        const errorMessage = getErrorMessage(
          errorObj?.code || "unknown",
          errorObj?.message
        );
        setFieldErrors((prev) => ({ ...prev, general: errorMessage }));
        scrollToTop();
      }
    },
    [
      formData,
      validateAllFields,
      register,
      navigate,
      redirect,
      getErrorMessage,
      scrollToTop,
    ]
  );

  // Can submit?
  const canSubmit = useMemo(() => {
    const formReady =
      fieldValidation.firstName &&
      fieldValidation.email &&
      fieldValidation.password &&
      fieldValidation.languagesSpoken &&
      fieldValidation.clientPhone &&
       fieldValidation.whatsappNumber &&
      fieldValidation.terms &&
      !isLoading;
    return formReady;
  }, [fieldValidation, isLoading]);

  const errorCount = useMemo(
    () => Object.values(fieldErrors).filter(Boolean).length,
    [fieldErrors]
  );

  // ==========================
  // Render
  // ==========================
  return (
    <Layout>
      <div className="relative min-h-screen bg-gray-950 overflow-hidden">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/80 to-gray-950" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-blue-500/10" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-sky-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Header */}
        <header className="relative z-10 pt-6 sm:pt-8">
          <div className="mx-auto w-full max-w-2xl px-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-white shadow-lg mb-3 border border-white/20">
                <UserCheck className="w-8 h-8" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                <FormattedMessage id="registerClient.ui.heroTitle" />
              </h1>

              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white shadow-sm backdrop-blur">
                  <Clock3 className="h-4 w-4 text-white" />
                  <FormattedMessage id="registerClient.ui.badge247" />
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white shadow-sm backdrop-blur">
                  <Languages className="h-4 w-4 text-white" />
                  <FormattedMessage id="registerClient.ui.badgeMulti" />
                </span>
              </div>

              <div className="mx-auto mt-5 h-1 w-40 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-90" />
            </div>
          </div>
        </header>

        {/* Main Form */}
        <main className="relative z-10 mx-auto w-full max-w-2xl px-4 pb-12 pt-6 sm:pt-8">
          <div className="rounded-3xl border border-gray-200 bg-white shadow-2xl backdrop-blur-sm">
            <div className="border-b border-gray-100 px-5 py-4 sm:px-8">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                <FormattedMessage id="registerClient.ui.title" />
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                <FormattedMessage id="registerClient.ui.subtitle" />
              </p>
              <p className="mt-2 text-xs text-gray-500">
                <FormattedMessage id="registerClient.ui.alreadyRegistered" />{" "}
                <Link
                  to={`/login?redirect=${encodeURIComponent(redirect)}`}
                  className="font-semibold text-blue-600 underline decoration-2 underline-offset-2 hover:text-blue-700"
                >
                  <FormattedMessage id="registerClient.ui.login" />
                </Link>
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-8 px-5 py-6 sm:px-8 sm:py-8"
              noValidate
            >
              {/* Error Banner */}
              {(error || fieldErrors.general || errorCount > 0) && (
                <div
                  className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-4"
                  role="alert"
                  aria-live="polite"
                >
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-semibold text-red-800">
                        <FormattedMessage id="registerClient.errors.title" />
                      </h3>
                      {(error || fieldErrors.general) && (
                        <p className="mt-1 text-sm text-red-700">
                          {error || fieldErrors.general}
                        </p>
                      )}
                      {errorCount > 0 && !error && !fieldErrors.general && (
                        <div className="mt-2 text-sm text-red-700">
                          <ul className="list-none space-y-1">
                            {fieldErrors.firstName && (
                              <li>• {fieldErrors.firstName}</li>
                            )}
                            {fieldErrors.email && (
                              <li>• {fieldErrors.email}</li>
                            )}
                            {fieldErrors.password && (
                              <li>• {fieldErrors.password}</li>
                            )}
                            {fieldErrors.languagesSpoken && (
                              <li>• {fieldErrors.languagesSpoken}</li>
                            )}
                            {fieldErrors.terms && (
                              <li>• {fieldErrors.terms}</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {!error && !fieldErrors.general && (
                <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-800 flex items-center gap-1">
                      🎯{" "}
                      <FormattedMessage id="registerClient.ui.progressLabel" />
                    </span>
                    <span className="text-sm text-blue-700 font-bold">
                      {Object.values(fieldValidation).filter(Boolean).length}/7
                    </span>
                  </div>
                  <div className="h-3 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
                      style={{
                        width: `${
                          (Object.values(fieldValidation).filter(Boolean)
                            .length /
                            7) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  {canSubmit && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>
                        <FormattedMessage id="registerClient.success.allFieldsValid" />
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Personal Info Section */}
              <section>
                <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <FormattedMessage id="registerClient.ui.personalInfo" />
                </h3>

                <div className="space-y-6">
                  {/* First Name */}
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-1 block text-sm font-semibold text-gray-800"
                    >
                      <FormattedMessage id="registerClient.fields.firstName" />{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      autoComplete="given-name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onBlur={() => handleFieldBlur("firstName")}
                      placeholder={intl.formatMessage({
                        id: "registerClient.help.firstNamePlaceholder",
                      })}
                      className={getInputClassName("firstName")}
                      aria-describedby="firstName-hint firstName-error firstName-success"
                    />
                    <p
                      id="firstName-hint"
                      className="mt-1 text-xs text-gray-500"
                    >
                      <FormattedMessage id="registerClient.help.firstNameHint" />
                    </p>
                    <FieldError
                      error={fieldErrors.firstName}
                      show={!!(fieldErrors.firstName && touched.firstName)}
                    />
                    <FieldSuccess
                      show={
                        fieldValidation.firstName &&
                        touched.firstName &&
                        !fieldErrors.firstName
                      }
                      message={intl.formatMessage({
                        id: "registerClient.success.fieldValid",
                      })}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1 block text-sm font-semibold text-gray-800"
                    >
                      <FormattedMessage id="registerClient.fields.email" />{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-blue-500" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={() => handleFieldBlur("email")}
                        placeholder={intl.formatMessage({
                          id: "registerClient.help.emailPlaceholder",
                        })}
                        className={getInputClassName("email", true)}
                        aria-describedby="email-hint email-error email-success"
                      />
                    </div>
                    <p id="email-hint" className="mt-1 text-xs text-gray-500">
                      <FormattedMessage id="registerClient.help.emailHint" />
                    </p>
                    <FieldError
                      error={fieldErrors.email}
                      show={!!(fieldErrors.email && touched.email)}
                    />
                    <FieldSuccess
                      show={
                        fieldValidation.email &&
                        touched.email &&
                        !fieldErrors.email
                      }
                      message={intl.formatMessage({
                        id: "registerClient.success.emailValid",
                      })}
                    />
                  </div>

                  {/* Phone Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                    {/* <div>
                      <PhoneField
                        name="clientPhone"
                        control={control}
                        label={intl.formatMessage({
                          id: "registerClient.fields.phone",
                        })}
                        required
                        defaultCountry="FR"
                        placeholder="+33 6 12 34 56 78"
                        // errorMessage={intl.formatMessage({
                        //   id: "registerClient.errors.phoneRequired",
                        // })}
                        // className="w-full"
                      />

                      <p className="mt-1 text-xs text-gray-500">
                        <FormattedMessage id="registerClient.help.phoneHint" />
                      </p>

                      {fieldValidation.clientPhone &&
                        clientPhone &&
                        !fieldErrors.clientPhone && (
                          <div className="mt-1 inline-flex items-center gap-1 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1">
                            <CheckCircle className="h-4 w-4 flex-shrink-0" />
                            <span>
                              <FormattedMessage id="registerClient.success.phoneValid" />
                            </span>
                          </div>
                        )}
                    </div> */}
                    {/* <PhoneField
                      name="clientPhone"
                      control={control}
                      label={intl.formatMessage({
                        id: "registerClient.fields.phone",
                      })}
                      required
                      defaultCountry="FR"
                    /> */}

                    {/* <PhoneField
                      name="providerPhone"
                      control={control}
                      label={intl.formatMessage({ id: 'registerClient.fields.phone' })}
                      required
                      defaultCountry="FR"
                    /> */}

                    {/* Phone Number with country selector - same as BookingRequest */}
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-800 mb-1">
                        <FormattedMessage id="registerClient.fields.phone" />
                        <span className="text-red-500">*</span>
                      </label>

                      <Controller
                        control={control}
                        name="clientPhone"
                        rules={{
                          required: intl.formatMessage({
                            id: "registerClient.errors.phoneRequired",
                          }),
                          validate: (v) => {
                            if (!v) {
                              return intl.formatMessage({
                                id: "registerClient.errors.phoneRequired",
                              });
                            }
                            try {
                              const p = parsePhoneNumberFromString(v);
                              return p && p.isValid()
                                ? true
                                : intl.formatMessage({
                                    id: "registerClient.errors.phoneInvalid",
                                  });
                            } catch {
                              return intl.formatMessage({
                                id: "registerClient.errors.phoneInvalid",
                              });
                            }
                          },
                        }}
                        render={({ field, fieldState: { error } }) => (
                          <>
                            <IntlPhoneInput
                              value={field.value || ""}
                              onChange={field.onChange}
                              defaultCountry="fr"
                              placeholder="+33 6 12 34 56 78"
                              name="clientPhone"
                              className={`w-full px-3 py-3 border-2 rounded-xl bg-white text-gray-900 transition-all duration-200 ${
                                error || fieldErrors.clientPhone
                                  ? "border-red-500 bg-red-50"
                                  : fieldValidation.clientPhone
                                    ? "border-green-500 bg-green-50"
                                    : "border-gray-200 hover:border-gray-300 focus:border-none"
                              }`}
                            />

                            {error && (
                              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                {error.message}
                              </p>
                            )}

                            {field.value && !error && (
                              <div className="mt-1 text-xs text-gray-500">
                                International:{" "}
                                <span className="font-mono">{field.value}</span>
                              </div>
                            )}
                          </>
                        )}
                      />

                      <p className="mt-1 text-xs text-gray-500">
                        <FormattedMessage id="registerClient.help.phoneHint" />
                      </p>

                      {fieldValidation.clientPhone &&
                        clientPhone &&
                        !fieldErrors.clientPhone && (
                          <div className="mt-1 inline-flex items-center gap-1 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1">
                            <CheckCircle className="h-4 w-4 flex-shrink-0" />
                            <span>
                              <FormattedMessage id="registerClient.success.phoneValid" />
                            </span>
                          </div>
                        )}
                    </div>
                  </div>



                  {/* WhatsApp Number */}
<div className="mt-4">
  <label className="block text-sm font-semibold text-gray-800 mb-1">
    <FormattedMessage id="registerClient.fields.whatsapp" />
    <span className="text-red-500">*</span>
  </label>

  <Controller
    control={control}
    name="whatsappNumber"
    rules={{
      required: intl.formatMessage({
        id: "registerClient.errors.whatsappRequired",
      }),
      validate: (v) => {
        if (!v) {
          return intl.formatMessage({
            id: "registerClient.errors.whatsappRequired",
          });
        }
        try {
          const p = parsePhoneNumberFromString(v);
          return p && p.isValid()
            ? true
            : intl.formatMessage({
                id: "registerClient.errors.whatsappInvalid",
              });
        } catch {
          return intl.formatMessage({
            id: "registerClient.errors.whatsappInvalid",
          });
        }
      },
    }}
    render={({ field, fieldState: { error } }) => (
      <>
        <IntlPhoneInput
          value={field.value || ""}
          onChange={field.onChange}
          defaultCountry="fr"
          placeholder="+33 6 12 34 56 78"
          name="whatsappNumber"
          className={`w-full px-3 py-3 border-2 rounded-xl bg-white text-gray-900 transition-all duration-200 ${
            error || fieldErrors.whatsappNumber
              ? "border-red-500 bg-red-50"
              : fieldValidation.whatsappNumber
              ? "border-green-500 bg-green-50"
              : "border-gray-200 hover:border-gray-300 focus:border-none"
          }`}
        />

        {error && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error.message}
          </p>
        )}

        {field.value && !error && (
          <div className="mt-1 text-xs text-gray-500">
            WhatsApp: <span className="font-mono">{field.value}</span>
          </div>
        )}
      </>
    )}
  />

  <p className="mt-1 text-xs text-gray-500">
    <FormattedMessage id="registerClient.help.whatsappHint" />
  </p>

  {fieldValidation.whatsappNumber &&
    whatsappNumber &&
    !fieldErrors.whatsappNumber && (
      <div className="mt-1 inline-flex items-center gap-1 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-2 py-1">
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
        <span>
          <FormattedMessage id="registerClient.success.whatsappValid" />
        </span>
      </div>
    )}
</div>


                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1 block text-sm font-semibold text-gray-800"
                    >
                      <FormattedMessage id="registerClient.fields.password" />{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-blue-500" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={handleInputChange}
                        onBlur={() => handleFieldBlur("password")}
                        placeholder={intl.formatMessage({
                          id: "registerClient.help.minPassword",
                        })}
                        className={`${getInputClassName("password", true)} pr-11`}
                        aria-describedby="password-hint password-error password-success password-strength"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:scale-95 transition-all"
                        aria-label={intl.formatMessage({
                          id: showPassword
                            ? "registerClient.ui.ariaHidePassword"
                            : "registerClient.ui.ariaShowPassword",
                        })}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <PasswordStrengthBar
                      password={formData.password}
                      label={intl.formatMessage({
                        id: "registerClient.ui.passwordStrength",
                      })}
                    />
                    <p
                      id="password-hint"
                      className="mt-1 text-xs text-gray-500"
                    >
                      <FormattedMessage id="registerClient.help.passwordTip" />
                    </p>
                    <FieldError
                      error={fieldErrors.password}
                      show={!!(fieldErrors.password && touched.password)}
                    />
                    <FieldSuccess
                      show={
                        fieldValidation.password &&
                        touched.password &&
                        !fieldErrors.password
                      }
                      message={intl.formatMessage({
                        id: "registerClient.success.passwordValid",
                      })}
                    />
                  </div>

                  {/* Languages Spoken */}
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-800">
                      <FormattedMessage id="registerClient.fields.languagesSpoken" />{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <Suspense
                      fallback={
                        <div className="h-11 animate-pulse rounded-xl border border-gray-200 bg-gray-100 flex items-center px-3">
                          <div className="text-gray-500 text-sm">
                            <FormattedMessage id="registerClient.ui.loadingLanguages" />
                          </div>
                        </div>
                      }
                    >
                      <div
                        className={`${getInputClassName("languagesSpoken")} p-0`}
                      >
                        <MultiLanguageSelect
                          value={selectedLanguages}
                          onChange={handleLanguagesChange}
                          locale={language === "en" ? "en" : "fr"}
                          placeholder={
                            language === "fr"
                              ? "Rechercher et sélectionner les langues…"
                              : "Search and select languages…"
                          }
                        />
                      </div>
                    </Suspense>

                    {selectedLanguages.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(
                          selectedLanguages as {
                            value: string;
                            label: string;
                          }[]
                        ).map((l) => (
                          <span
                            key={l.value}
                            className="px-2.5 py-1 rounded-lg text-xs bg-blue-50 text-blue-800 border border-blue-200"
                          >
                            {l.label.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}

                    {showCustomLanguage && (
                      <CustomFieldInput
                        placeholder={intl.formatMessage({
                          id: "registerClient.actions.specifyLanguage",
                        })}
                        value={formData.customLanguage}
                        onChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            customLanguage: value,
                          }))
                        }
                        onAdd={handleAddCustomLanguage}
                        disabled={!formData.customLanguage.trim()}
                        addLabel={intl.formatMessage({
                          id: "registerClient.actions.add",
                        })}
                      />
                    )}

                    <FieldError
                      error={fieldErrors.languagesSpoken}
                      show={
                        !!(
                          fieldErrors.languagesSpoken && touched.languagesSpoken
                        )
                      }
                    />
                    <FieldSuccess
                      show={
                        fieldValidation.languagesSpoken &&
                        touched.languagesSpoken &&
                        !fieldErrors.languagesSpoken
                      }
                      message={intl.formatMessage({
                        id: "registerClient.success.fieldValid",
                      })}
                    />

                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-700 bg-blue-50 rounded-lg px-2 py-1 border border-blue-200">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                      <span>
                        🔒 SSL •{" "}
                        <FormattedMessage id="registerClient.help.dataSecure" />
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Terms & Conditions */}
              <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 px-4 py-3">
                <div className="flex items-start gap-3">
                  <input
                    id="acceptClientTerms"
                    type="checkbox"
                    required
                    checked={termsAccepted}
                    onChange={handleTermsChange}
                    onBlur={() => handleFieldBlur("terms")}
                    className={`h-5 w-5 border-gray-300 rounded mt-0.5 transition-colors ${
                      fieldErrors.terms && touched.terms
                        ? "border-red-500 text-red-600"
                        : "text-blue-600"
                    }`}
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="acceptClientTerms"
                      className="text-sm text-gray-800"
                    >
                      <FormattedMessage id="registerClient.ui.acceptTerms" />{" "}
                      <Link
                        to="/cgu-clients"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-700 underline decoration-2 underline-offset-2 hover:text-blue-800 transition-colors"
                      >
                        <FormattedMessage id="registerClient.ui.termsLink" />
                      </Link>{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <FieldError
                      error={fieldErrors.terms}
                      show={!!(fieldErrors.terms && touched.terms)}
                    />
                    <FieldSuccess
                      show={
                        fieldValidation.terms &&
                        touched.terms &&
                        !fieldErrors.terms
                      }
                      message={intl.formatMessage({
                        id: "registerClient.success.fieldValid",
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <Button
                  type="submit"
                  loading={isLoading}
                  fullWidth
                  size="large"
                  disabled={!canSubmit}
                  className={`min-h-[52px] rounded-xl font-bold text-white shadow-lg transition-all duration-300 active:scale-[0.98] transform ${
                    canSubmit
                      ? "bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-700 shadow-blue-500/30 hover:brightness-110 hover:shadow-blue-600/40 hover:scale-[1.02]"
                      : "bg-gray-400 cursor-not-allowed shadow-gray-400/20"
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <FormattedMessage id="registerClient.ui.loading" />
                    </span>
                  ) : (
                    <FormattedMessage id="registerClient.ui.createAccount" />
                  )}
                </Button>

                {!canSubmit && !isLoading && (
                  <div className="mt-4 space-y-3">
                    <p className="text-center text-xs text-gray-500 font-medium">
                      <FormattedMessage id="registerClient.ui.progressHint" />
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div
                        className={`flex items-center gap-1 transition-colors ${fieldValidation.firstName ? "text-green-600" : "text-gray-400"}`}
                      >
                        {fieldValidation.firstName ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <div className="h-3 w-3 border border-gray-300 rounded-full" />
                        )}
                        <span>
                          <FormattedMessage id="registerClient.fields.firstName" />
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-1 transition-colors ${fieldValidation.email ? "text-green-600" : "text-gray-400"}`}
                      >
                        {fieldValidation.email ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <div className="h-3 w-3 border border-gray-300 rounded-full" />
                        )}
                        <span>
                          <FormattedMessage id="registerClient.fields.email" />
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-1 transition-colors ${fieldValidation.password ? "text-green-600" : "text-gray-400"}`}
                      >
                        {fieldValidation.password ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <div className="h-3 w-3 border border-gray-300 rounded-full" />
                        )}
                        <span>
                          <FormattedMessage id="registerClient.fields.password" />
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-1 transition-colors ${fieldValidation.languagesSpoken ? "text-green-600" : "text-gray-400"}`}
                      >
                        {fieldValidation.languagesSpoken ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <div className="h-3 w-3 border border-gray-300 rounded-full" />
                        )}
                        <span>
                          <FormattedMessage id="registerClient.fields.languagesSpoken" />
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-1 col-span-2 transition-colors ${fieldValidation.terms ? "text-green-600" : "text-gray-400"}`}
                      >
                        {fieldValidation.terms ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <div className="h-3 w-3 border border-gray-300 rounded-full" />
                        )}
                        <span>
                          <FormattedMessage id="registerClient.ui.termsLink" />
                        </span>
                      </div>

                      <div
                        className={`flex items-center gap-1 transition-colors ${fieldValidation.clientPhone ? "text-green-600" : "text-gray-400"}`}
                      >
                        {fieldValidation.clientPhone ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <div className="h-3 w-3 border border-gray-300 rounded-full" />
                        )}
                        <span>
                          <FormattedMessage id="registerClient.fields.phone" />
                        </span>
                      </div>

                      <div
  className={`flex items-center gap-1 transition-colors ${fieldValidation.whatsappNumber ? "text-green-600" : "text-gray-400"}`}
>
  {fieldValidation.whatsappNumber ? (
    <CheckCircle className="h-3 w-3 text-green-500" />
  ) : (
    <div className="h-3 w-3 border border-gray-300 rounded-full" />
  )}
  <span>
    <FormattedMessage id="registerClient.fields.whatsapp" />
  </span>
</div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Footer Banner */}
          <div className="mt-8">
            <div className="relative mx-auto max-w-xl">
              <div className="absolute -inset-[1.5px] rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-700 opacity-60 blur-sm" />
              <div className="relative flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-md border border-white/15 shadow-lg hover:shadow-blue-500/20 transition-shadow">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 text-white text-sm shadow">
                  ✨
                </div>
                <p className="text-[13px] sm:text-sm text-white/95">
                  <FormattedMessage id="registerClient.ui.footerBanner" />
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default React.memo(RegisterClient);
