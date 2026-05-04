// src/components/payment/PayPalPaymentForm.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  PayPalButtons,
  PayPalCardFieldsProvider,
  PayPalNumberField,
  PayPalExpiryField,
  PayPalCVVField,
  usePayPalCardFields,
  usePayPalScriptReducer,
  DISPATCH_ACTION,
} from "@paypal/react-paypal-js";
import { auth, getCloudRunUrl } from "../../config/firebase";
import { AlertCircle, CheckCircle, Lock } from "lucide-react";
import { FormattedMessage, useIntl } from "react-intl";
import { usePricingConfig } from "../../services/pricingService";
import { getCurrentTrafficSource } from "../../utils/trafficSource";
import { getStoredMetaIdentifiers } from "../../utils/fbpCookie";
import { getOrCreateEventId } from "../../utils/sharedEventId";

interface BookingData {
  firstName?: string;
  lastName?: string;
  title?: string;
  description?: string;
  clientPhone?: string;
  currentCountry?: string;
  // P2 FIX: Client languages for SMS notifications
  clientLanguages?: string[];
}

interface PayPalPaymentFormProps {
  amount: number;
  currency: string;
  providerId: string;
  providerPayPalMerchantId?: string;
  callSessionId: string;
  clientId: string;
  description?: string;
  serviceType?: 'lawyer' | 'expat';
  // P0 FIX: Phone numbers required for Twilio call
  clientPhone: string;
  providerPhone: string;
  // P0 FIX: Languages for Twilio voice prompts
  clientLanguages: string[];
  providerLanguages: string[];
  // Booking data for validation
  bookingData?: BookingData;
  onSuccess: (details: PayPalSuccessDetails) => void;
  onError: (error: Error) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

interface PayPalSuccessDetails {
  orderId: string;
  payerId: string;
  status: string;
  captureId?: string;
  authorizationId?: string; // AUTHORIZE flow: ID de l'autorisation (pas de capture immédiate)
}

interface CreateOrderResponse {
  orderId: string;
  approvalUrl: string;
}

interface CaptureOrderResponse {
  success: boolean;
  captureId: string;
  status: string;
}

// Mapping des codes d'erreur PayPal vers des clés i18n
const PAYPAL_ERROR_I18N_KEYS: Record<string, string> = {
  // Erreurs de carte/instrument
  INSTRUMENT_DECLINED: "payment.paypal.err.instrumentDeclined",
  CARD_DECLINED: "payment.paypal.err.instrumentDeclined",
  INSUFFICIENT_FUNDS: "payment.paypal.err.insufficientFunds",
  CARD_EXPIRED: "payment.paypal.err.cardExpired",
  INVALID_CARD_NUMBER: "payment.paypal.err.invalidCardNumber",
  INVALID_CVV: "payment.paypal.err.invalidCvv",

  // Erreurs de paiement
  PAYER_ACTION_REQUIRED: "payment.paypal.err.payerActionRequired",
  PAYER_CANNOT_PAY: "payment.paypal.err.payerCannotPay",
  TRANSACTION_REFUSED: "payment.paypal.err.transactionRefused",
  PAYMENT_DENIED: "payment.paypal.err.paymentDenied",

  // Erreurs de configuration
  INVALID_CURRENCY: "payment.paypal.err.invalidCurrency",
  DUPLICATE_INVOICE_ID: "payment.paypal.err.duplicateInvoice",
  ORDER_NOT_APPROVED: "payment.paypal.err.orderNotApproved",
  AUTHORIZATION_VOIDED: "payment.paypal.err.authorizationVoided",

  // Erreurs serveur/réseau
  INTERNAL_SERVER_ERROR: "payment.paypal.err.serverError",
  NETWORK_ERROR: "payment.paypal.err.networkError",

  // Erreurs de prestataire (nouveau)
  PROVIDER_NOT_CONFIGURED: "payment.paypal.err.providerNotConfigured",
  INVALID_AMOUNT: "payment.paypal.err.invalidAmount",
};

// Détecte si l'erreur est VRAIMENT causée par une extension de navigateur
// On ne veut PAS afficher ce message pour des erreurs normales
function isNetworkError(error: unknown): boolean {
  if (!error) return false;

  const err = error as Error;
  const message = err?.message?.toLowerCase() || "";
  const name = err?.name || "";

  // Seulement les vraies erreurs de blocage par extension
  // AbortError avec "user aborted" = extension qui bloque
  if (name === "AbortError" && message.includes("user aborted")) {
    return true;
  }

  // ERR_BLOCKED_BY_CLIENT = extension bloquante confirmée
  if (message.includes("err_blocked_by_client") || message.includes("net::err_blocked")) {
    return true;
  }

  // Ne PAS considérer comme erreur réseau :
  // - TypeError génériques (erreurs JS normales)
  // - "failed to fetch" seul (peut être serveur down, CORS, etc.)
  // - "network error" seul (trop générique)

  return false;
}

function extractPayPalErrorCode(error: unknown): string {
  // Vérifier d'abord si c'est une erreur réseau
  if (isNetworkError(error)) {
    return "NETWORK_ERROR";
  }

  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;
    let errorCode = (err.code as string) || (err.name as string) || "";
    if (!errorCode && Array.isArray(err.details)) {
      const detail = err.details[0] as Record<string, unknown>;
      errorCode = (detail?.issue as string) || "";
    }
    return errorCode;
  }
  return "";
}

// Composant bouton pour soumettre les champs de carte
const CardFieldsSubmitButton: React.FC<{
  isProcessing: boolean;
  disabled: boolean;
  formattedAmount: string;
  onSubmit: () => void;
  onError?: (error: unknown) => void;
}> = ({ isProcessing, disabled, formattedAmount, onSubmit, onError }) => {
  const { cardFieldsForm } = usePayPalCardFields();
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    if (!cardFieldsForm) return;
    const checkValidity = async () => {
      try {
        const formState = await cardFieldsForm.getState();
        setIsFormValid(formState.isFormValid);
      } catch {
        // ignore
      }
    };
    checkValidity();
    const interval = setInterval(checkValidity, 500);
    return () => clearInterval(interval);
  }, [cardFieldsForm]);

  const handleClick = async () => {
    if (!cardFieldsForm) return;
    const formState = await cardFieldsForm.getState();
    if (!formState.isFormValid) return;
    onSubmit();
    cardFieldsForm.submit().catch((err) => {
      if (import.meta.env.DEV) console.error("Card submit error:", err);
      onError?.(err);
    });
  };

  const isButtonDisabled = disabled || isProcessing || !isFormValid;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isButtonDisabled}
      className={`w-full h-12 rounded-xl font-semibold text-white text-base
        transition-all duration-200 flex items-center justify-center gap-2
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
        active:scale-[0.98] touch-manipulation
        ${isButtonDisabled
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-gradient-to-r from-red-500 to-orange-500 shadow-lg shadow-red-500/30"
        }`}
    >
      {isProcessing ? (
        <>
          <div className="animate-spin rounded-full border-2 border-white border-t-transparent w-4 h-4" />
          <span><FormattedMessage id="payment.processing" defaultMessage="Traitement..." /></span>
        </>
      ) : (
        <>
          <Lock className="w-4 h-4" aria-hidden="true" />
          <span>
            <FormattedMessage
              id="payment.payAmount"
              defaultMessage="Payer {amount}"
              values={{ amount: formattedAmount }}
            />
          </span>
        </>
      )}
    </button>
  );
};

export const PayPalPaymentForm: React.FC<PayPalPaymentFormProps> = ({
  amount,
  currency,
  providerId,
  callSessionId,
  clientId,
  description,
  serviceType = 'expat',
  clientPhone,
  providerPhone,
  clientLanguages,
  providerLanguages,
  bookingData,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
}) => {
  const [scriptState, dispatch] = usePayPalScriptReducer();
  const { isPending, isRejected } = scriptState;
  const [isProcessing, setIsProcessing] = useState(false);

  // Worldwide compatibility: keep the SDK currency aligned with the order currency.
  // The PayPalScriptProvider boots in EUR; when the user toggles to USD (or any other
  // supported currency), reload the SDK so PayPal does not reject the order with
  // CURRENCY_NOT_SUPPORTED.
  useEffect(() => {
    const desiredCurrency = (currency || "EUR").toUpperCase();
    const currentCurrency = (scriptState.options?.currency as string | undefined)?.toUpperCase();
    if (currentCurrency && currentCurrency !== desiredCurrency) {
      dispatch({
        type: DISPATCH_ACTION.RESET_OPTIONS,
        value: { ...scriptState.options, currency: desiredCurrency },
      });
    }
  }, [currency, dispatch, scriptState.options]);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorCode, setErrorCode] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | null>(null);
  const [sdkLoadTimeout, setSdkLoadTimeout] = useState(false);

  const intl = useIntl();
  const currentOrderIdRef = useRef<string>("");
  // P0 FIX: Track successful payment to suppress late onError from PayPal SDK
  // The PayPal SDK can fire onError AFTER onApprove has already succeeded
  // (race condition when order is AUTHORIZED but SDK expects COMPLETED)
  const paymentSucceededRef = useRef(false);

  // Safety timeout: if SDK is still pending after 15 seconds, show error
  useEffect(() => {
    if (isPending && !sdkLoadTimeout) {
      const timeoutId = setTimeout(() => {
        if (isPending) {
          console.error("PayPal SDK loading timeout after 15s");
          setSdkLoadTimeout(true);
        }
      }, 15000);
      return () => clearTimeout(timeoutId);
    }
  }, [isPending, sdkLoadTimeout]);

  // Stabiliser le montant pour éviter les re-renders du SDK PayPal
  const stableAmount = useRef(amount);
  useEffect(() => {
    if (Math.abs(stableAmount.current - amount) > 0.01) {
      stableAmount.current = amount;
    }
  }, [amount]);

  const getTranslatedErrorMessage = (code: string): string => {
    const i18nKey = PAYPAL_ERROR_I18N_KEYS[code];
    if (i18nKey) {
      return intl.formatMessage({ id: i18nKey });
    }
    return intl.formatMessage({ id: "payment.paypal.err.generic" });
  };

  const { pricing, loading: pricingLoading } = usePricingConfig();
  const currencyKey = (currency?.toLowerCase() || 'eur') as 'eur' | 'usd';
  const pricingConfig = pricing?.[serviceType]?.[currencyKey];
  const platformFee = pricingConfig?.connectionFeeAmount ?? Math.round(amount * 0.39 * 100) / 100;
  const providerAmount = pricingConfig?.providerAmount ?? Math.round((amount - platformFee) * 100) / 100;

  // Création de l'ordre PayPal (utilisé par les deux méthodes)
  // Utilise la version HTTP de la fonction pour éviter les problèmes CORS
  // `paymentMethodHint` lets the backend know whether the order will be paid via
  // PayPal wallet (no `payment_source` restriction → keeps PayPal button working
  // worldwide) or via the advanced Card Fields (adds `payment_source.card` with
  // SCA_WHEN_REQUIRED so PSD2 cards in the EEA pass 3DS without forcing friction
  // on cards from regions where SCA is not mandated).
  const createOrder = useCallback(async (paymentMethodHint: "paypal" | "card"): Promise<string> => {
    try {
      setIsProcessing(true);
      setPaymentStatus("processing");

      // Obtenir le token d'authentification Firebase
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      const idToken = await currentUser.getIdToken();

      // Collect tracking data for Meta CAPI attribution
      const metaIds = getStoredMetaIdentifiers();
      const trafficSource = getCurrentTrafficSource();
      const pixelEventId = getOrCreateEventId(`purchase_${callSessionId}`, 'purchase');

      // Appeler la fonction HTTP au lieu de la fonction callable
      const response = await fetch(
        getCloudRunUrl('createpaypalorderhttp', 'europe-west3'),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            callSessionId,
            amount,
            providerAmount,
            platformFee,
            currency: currency.toUpperCase(),
            providerId,
            clientId,
            paymentMethod: paymentMethodHint,
            // P0 FIX: Phone numbers required for Twilio call
            clientPhone,
            providerPhone,
            // P0 FIX: Languages for Twilio voice prompts
            clientLanguages,
            providerLanguages,
            // P1 FIX: Send booking title, description and country for SMS notifications to provider
            title: bookingData?.title || description || `Appel SOS-Expat - Session ${callSessionId}`,
            description: bookingData?.description || description || `Appel SOS-Expat - Session ${callSessionId}`,
            clientCurrentCountry: bookingData?.currentCountry || "",
            serviceType,
            metadata: {
              ...(metaIds.fbp && { fbp: metaIds.fbp }),
              ...(metaIds.fbc && { fbc: metaIds.fbc }),
              pixelEventId,
              ...(trafficSource?.utm_source && { utm_source: trafficSource.utm_source }),
              ...(trafficSource?.utm_medium && { utm_medium: trafficSource.utm_medium }),
              ...(trafficSource?.utm_campaign && { utm_campaign: trafficSource.utm_campaign }),
              ...(trafficSource?.utm_content && { utm_content: trafficSource.utm_content }),
              ...(trafficSource?.utm_term && { utm_term: trafficSource.utm_term }),
              ...(trafficSource?.gclid && { gclid: trafficSource.gclid }),
              ...(trafficSource?.ttclid && { ttclid: trafficSource.ttclid }),
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        const err = new Error(errorData.error || `HTTP ${response.status}`);
        // Attach error code for better UX messages
        (err as any).code = errorData.code || "";
        throw err;
      }

      const result: CreateOrderResponse & { success: boolean } = await response.json();
      currentOrderIdRef.current = result.orderId;
      return result.orderId;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("PayPal createOrder error:", error);
      }
      setPaymentStatus("error");
      setErrorCode(extractPayPalErrorCode(error));
      setIsProcessing(false);
      throw error;
    }
  }, [amount, currency, providerId, callSessionId, clientId, description, serviceType, platformFee, providerAmount, clientPhone, providerPhone, clientLanguages, providerLanguages, bookingData]);

  // Two thin wrappers so each PayPal SDK component creates an order tagged with its
  // payment source. The PayPal Buttons flow MUST stay generic (no `payment_source`)
  // so PayPal wallet payments work worldwide; the Card Fields flow adds 3DS/SCA
  // configuration server-side.
  const createPayPalOrder = useCallback(() => createOrder("paypal"), [createOrder]);
  const createCardOrder = useCallback(() => createOrder("card"), [createOrder]);

  // Autorisation après approbation (AUTHORIZE flow comme Stripe)
  // L'autorisation bloque les fonds mais ne les capture pas encore
  // La capture se fait côté serveur après 2 minutes d'appel
  // Si l'appel dure moins de 2 minutes, l'autorisation est annulée (void)
  const authorizeOrder = useCallback(async (orderId: string, payerId?: string): Promise<void> => {
    try {
      // Obtenir le token d'authentification Firebase
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }
      const idToken = await currentUser.getIdToken();

      // Appeler la fonction HTTP d'autorisation (pas de capture immédiate)
      const response = await fetch(
        getCloudRunUrl('authorizepaypalorderhttp', 'europe-west3'),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            orderId,
            callSessionId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        const err = new Error(errorData.error || `HTTP ${response.status}`);
        // Attach error code for better UX messages
        (err as any).code = errorData.code || "";
        throw err;
      }

      const result = await response.json();

      if (result.success) {
        // P0 FIX: Mark as succeeded BEFORE setting state to prevent race condition
        // with PayPal SDK's onError firing after successful authorization
        paymentSucceededRef.current = true;
        setPaymentStatus("success");
        onSuccess({
          orderId,
          payerId: payerId || "",
          status: result.status,
          // authorizationId au lieu de captureId - la capture se fera après 2 min d'appel
          authorizationId: result.authorizationId,
        });
      } else {
        throw new Error("Autorisation PayPal échouée");
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("PayPal authorizeOrder error:", error);
      }
      setPaymentStatus("error");
      const code = extractPayPalErrorCode(error);
      setErrorCode(code);
      onError(error instanceof Error ? error : new Error(getTranslatedErrorMessage(code)));
    } finally {
      setIsProcessing(false);
    }
  }, [callSessionId, onSuccess, onError, intl]);

  // Handler pour PayPal Buttons
  const onApprove = useCallback(async (data: { orderID: string; payerID?: string | null }): Promise<void> => {
    setPaymentMethod("paypal");
    await authorizeOrder(data.orderID, data.payerID || undefined);
  }, [authorizeOrder]);

  // Handler pour Card Fields
  const onCardApprove = useCallback(async (data: { orderID: string }): Promise<void> => {
    setPaymentMethod("card");
    await authorizeOrder(data.orderID);
  }, [authorizeOrder]);

  const handleError = useCallback((err: Record<string, unknown>) => {
    // P0 FIX: Suppress late onError from PayPal SDK if payment already succeeded
    // The SDK can fire onError AFTER onApprove resolved successfully (race condition)
    if (paymentSucceededRef.current) {
      console.warn("⚠️ [PayPal] Ignoring late onError - payment already succeeded:", err);
      return;
    }
    if (import.meta.env.DEV) {
      console.error("PayPal handleError:", err);
    }
    setPaymentStatus("error");
    const code = extractPayPalErrorCode(err);
    setErrorCode(code);
    setIsProcessing(false);
    onError(new Error(getTranslatedErrorMessage(code)));
  }, [onError, getTranslatedErrorMessage]);

  const handleCancel = useCallback(() => {
    setPaymentStatus("idle");
    setIsProcessing(false);
    setPaymentMethod(null);
    onCancel?.();
  }, [onCancel]);

  const resetForm = () => {
    setPaymentStatus("idle");
    setErrorCode("");
    setPaymentMethod(null);
    setIsProcessing(false);
    paymentSucceededRef.current = false;
  };

  // Loading state - skeleton compact (PayPal button + carte)
  if (isPending) {
    return (
      <div className="paypal-payment-container space-y-3">
        <div className="h-11 bg-yellow-100/60 rounded-xl animate-pulse" />
        <div className="h-3" />
        <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
        </div>
        <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Error state du script PayPal (rejected or timeout)
  if (isRejected || sdkLoadTimeout) {
    return (
      <div className="space-y-4">
        <div className="flex items-center p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <AlertCircle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-red-700 font-medium block">
              <FormattedMessage
                id="payment.paypal.loadError"
                defaultMessage="Impossible de charger le système de paiement. Veuillez rafraîchir la page."
              />
            </span>
            {sdkLoadTimeout && (
              <span className="text-red-600 text-sm block mt-1">
                <FormattedMessage
                  id="payment.paypal.timeoutHint"
                  defaultMessage="Un bloqueur de publicités ou une extension de sécurité peut bloquer le chargement."
                />
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-red-500/30"
        >
          <FormattedMessage id="payment.paypal.reload" defaultMessage="Rafraîchir la page" />
        </button>
      </div>
    );
  }

  // Success state
  if (paymentStatus === "success") {
    return (
      <div className="flex flex-col items-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <span className="text-green-800 font-semibold text-lg text-center">
          <FormattedMessage
            id="payment.paypal.success"
            defaultMessage="Paiement effectué avec succès !"
          />
        </span>
      </div>
    );
  }

  // Error state
  if (paymentStatus === "error") {
    // Erreur réseau - message spécial avec instructions
    if (errorCode === "NETWORK_ERROR") {
      return (
        <div className="space-y-4">
          <div className="p-5 bg-orange-50 border-2 border-orange-200 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <span className="text-orange-800 block font-semibold text-base">
                  <FormattedMessage
                    id="payment.paypal.networkError.title"
                    defaultMessage="Problème de connexion détecté"
                  />
                </span>
                <span className="text-orange-700 text-sm block mt-2">
                  <FormattedMessage
                    id="payment.paypal.networkError.description"
                    defaultMessage="Une extension de navigateur (antivirus, bloqueur de pub) semble bloquer le paiement."
                  />
                </span>
                <ul className="text-orange-700 text-sm mt-4 space-y-2 list-disc list-inside">
                  <li>
                    <FormattedMessage
                      id="payment.paypal.networkError.tip1"
                      defaultMessage="Essayez en navigation privée (Ctrl+Maj+N)"
                    />
                  </li>
                  <li>
                    <FormattedMessage
                      id="payment.paypal.networkError.tip2"
                      defaultMessage="Désactivez temporairement votre antivirus web"
                    />
                  </li>
                  <li>
                    <FormattedMessage
                      id="payment.paypal.networkError.tip3"
                      defaultMessage="Désactivez les bloqueurs de publicités"
                    />
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-red-500/30"
          >
            <FormattedMessage id="payment.paypal.retry" defaultMessage="Réessayer" />
          </button>
        </div>
      );
    }

    // Erreur standard
    return (
      <div className="space-y-4">
        <div className="flex items-center p-4 bg-red-50 border-2 border-red-200 rounded-xl">
          <AlertCircle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-red-800 block font-semibold">
              <FormattedMessage id="payment.paypal.error" defaultMessage="Erreur de paiement" />
            </span>
            <span className="text-red-600 text-sm block mt-1">
              {errorCode ? getTranslatedErrorMessage(errorCode) : (
                <FormattedMessage
                  id="payment.paypal.errorRetry"
                  defaultMessage="Veuillez réessayer ou utiliser un autre moyen de paiement."
                />
              )}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="w-full py-3 px-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-red-500/30"
        >
          <FormattedMessage id="payment.paypal.retry" defaultMessage="Réessayer" />
        </button>
      </div>
    );
  }

  const formattedAmount = intl.formatNumber(amount, {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="paypal-payment-container space-y-3">

      {/* Processing overlay — minimal */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="animate-spin rounded-full border-2 border-red-200 border-t-red-500 w-4 h-4" />
          <span className="text-gray-700 text-sm font-medium">
            <FormattedMessage
              id="payment.paypal.processing"
              defaultMessage="Traitement sécurisé en cours..."
            />
          </span>
        </div>
      )}

      {/* 1. PayPal — express checkout en haut (above the fold) */}
      <div className={`paypal-buttons-container transition-opacity duration-200 ${disabled || isProcessing ? "opacity-50 pointer-events-none" : ""}`}>
        <PayPalButtons
          style={{
            layout: "horizontal",
            color: "gold",
            shape: "rect",
            label: "paypal",
            height: 44,
            tagline: false,
          }}
          disabled={disabled || isProcessing}
          createOrder={createPayPalOrder}
          onApprove={onApprove}
          onError={handleError}
          onCancel={handleCancel}
        />
      </div>

      {/* 2. Séparateur fin */}
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-2 bg-white text-gray-400 text-[11px] font-medium uppercase tracking-wider">
            <FormattedMessage id="payment.orPayByCard" defaultMessage="ou par carte" />
          </span>
        </div>
      </div>

      {/* 3. Champs carte — sans header redondant */}
      <div className={`transition-opacity duration-200 ${disabled || isProcessing ? "opacity-50" : ""}`}>
        <PayPalCardFieldsProvider
          createOrder={createCardOrder}
          onApprove={onCardApprove}
          onError={handleError}
          // On demande au SDK PayPal de rendre ses inputs internes sans bordure
          // ni fond pour éviter le double-rectangle (iframe interne sur notre wrapper).
          // Si le SDK ignore certaines props, c'est silencieux côté client.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={{
            input: {
              "font-size": "16px",
              "font-family": "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              "font-weight": "500",
              "color": "#0f172a",
              "padding": "0 14px",
              "line-height": "48px",
              "background-color": "transparent",
              "background": "transparent",
              "border": "0",
              "border-width": "0",
              "border-style": "none",
              "outline": "none",
              "box-shadow": "none",
              "appearance": "none",
              "-webkit-appearance": "none",
            },
            "input::placeholder": {
              "color": "#94a3b8",
              "font-weight": "400",
            },
            "input:focus": {
              "color": "#0f172a",
              "outline": "none",
              "box-shadow": "none",
              "border": "0",
            },
            ".invalid": {
              "color": "#ef4444",
            },
          } as any}
        >
          <div className="space-y-2">
            {/* Numéro de carte (label invisible pour SR) */}
            <div className="paypal-field-wrapper">
              <PayPalNumberField className="paypal-field-inner" />
            </div>

            {/* Expiration + CVV */}
            <div className="grid grid-cols-2 gap-2">
              <div className="paypal-field-wrapper">
                <PayPalExpiryField className="paypal-field-inner" />
              </div>
              <div className="paypal-field-wrapper">
                <PayPalCVVField className="paypal-field-inner" />
              </div>
            </div>

            {/* Bouton primaire avec montant */}
            <CardFieldsSubmitButton
              isProcessing={isProcessing && paymentMethod === "card"}
              disabled={disabled}
              formattedAmount={formattedAmount}
              onSubmit={() => setPaymentMethod("card")}
              onError={(err) => {
                if (paymentSucceededRef.current) return;
                setIsProcessing(false);
                setPaymentStatus("error");
                setErrorCode(extractPayPalErrorCode(err));
              }}
            />
          </div>
        </PayPalCardFieldsProvider>
      </div>
    </div>
  );
};

export default PayPalPaymentForm;
