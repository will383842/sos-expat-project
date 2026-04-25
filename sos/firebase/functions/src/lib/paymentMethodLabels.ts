/**
 * P1-8 FIX 2026-04-25: localized payment-method labels for Telegram
 * withdrawal confirmations across the 9 supported UI languages.
 *
 * Falls back to French (the platform's default operational language) if the
 * user locale is unknown or the requested method type has no translation.
 */

export type SupportedLocale =
  | 'fr' | 'en' | 'es' | 'de' | 'pt' | 'ru' | 'zh' | 'ar' | 'hi';

const SUPPORTED: SupportedLocale[] = [
  'fr', 'en', 'es', 'de', 'pt', 'ru', 'zh', 'ar', 'hi',
];

const PAYMENT_METHOD_LABELS: Record<SupportedLocale, Record<string, string>> = {
  fr: { bank_transfer: 'Virement bancaire', mobile_money: 'Mobile Money', wise: 'Wise' },
  en: { bank_transfer: 'Bank Transfer',     mobile_money: 'Mobile Money', wise: 'Wise' },
  es: { bank_transfer: 'Transferencia bancaria', mobile_money: 'Mobile Money', wise: 'Wise' },
  de: { bank_transfer: 'Banküberweisung',   mobile_money: 'Mobile Money', wise: 'Wise' },
  pt: { bank_transfer: 'Transferência bancária', mobile_money: 'Mobile Money', wise: 'Wise' },
  ru: { bank_transfer: 'Банковский перевод', mobile_money: 'Mobile Money', wise: 'Wise' },
  zh: { bank_transfer: '银行转账',           mobile_money: 'Mobile Money', wise: 'Wise' },
  ar: { bank_transfer: 'تحويل مصرفي',       mobile_money: 'Mobile Money', wise: 'Wise' },
  hi: { bank_transfer: 'बैंक ट्रांसफर',          mobile_money: 'Mobile Money', wise: 'Wise' },
};

/**
 * Normalize a free-form locale string ("fr-FR", "ZH-CN", "ch") into a
 * supported `SupportedLocale`. The legacy `ch` is mapped to `zh`.
 */
export function resolveLocale(raw: string | undefined | null): SupportedLocale {
  if (!raw) return 'fr';
  const lang = String(raw).toLowerCase().split(/[-_]/)[0];
  if (lang === 'ch') return 'zh';
  if ((SUPPORTED as string[]).includes(lang)) return lang as SupportedLocale;
  return 'fr';
}

/**
 * Resolve the localized label for a payment method type.
 *
 * @param methodType - bank_transfer | mobile_money | wise (or any string)
 * @param rawLocale  - user locale (preferredLanguage / language)
 * @param fallback   - shown when neither the locale nor French has the type
 */
export function getPaymentMethodLabel(
  methodType: string | undefined | null,
  rawLocale: string | undefined | null,
  fallback?: string,
): string {
  const locale = resolveLocale(rawLocale);
  const key = String(methodType ?? '');
  return (
    PAYMENT_METHOD_LABELS[locale]?.[key]
    || PAYMENT_METHOD_LABELS.fr[key]
    || fallback
    || key
    || 'Wise'
  );
}
