// firebase/functions/src/services/pricingService.ts
import { db as firestore } from '../utils/firebase';

export interface ServiceConfig {
  totalAmount: number;
  connectionFeeAmount: number;
  providerAmount: number;
  duration: number;
  currency: string;
}

/**
 * B2B provider rates (SOS-Call free calls — partner pays a monthly flat fee).
 * Only `providerAmount` is configurable; the other ServiceConfig fields don't
 * apply (no client-facing total, no connectionFee since no client payment).
 */
export interface B2BProviderRate {
  providerAmount: number;
}

export interface PricingConfig {
  lawyer: {
    eur: ServiceConfig;
    usd: ServiceConfig;
    b2b?: {
      eur?: B2BProviderRate;
      usd?: B2BProviderRate;
    };
  };
  expat: {
    eur: ServiceConfig;
    usd: ServiceConfig;
    b2b?: {
      eur?: B2BProviderRate;
      usd?: B2BProviderRate;
    };
  };
}

// Configuration par défaut (fallback backend) - lawyer: 20min, expat: 30min
// B2B fallback = 70% of direct rate (admin can override in /admin/pricing)
const DEFAULT_PRICING_CONFIG: PricingConfig = {
  lawyer: {
    eur: { totalAmount: 49, connectionFeeAmount: 19, providerAmount: 30, duration: 20, currency: 'eur' },
    usd: { totalAmount: 55, connectionFeeAmount: 25, providerAmount: 30, duration: 20, currency: 'usd' },
    b2b: {
      eur: { providerAmount: 21 }, // 70% of 30
      usd: { providerAmount: 21 }
    }
  },
  expat: {
    eur: { totalAmount: 19, connectionFeeAmount: 9, providerAmount: 10, duration: 30, currency: 'eur' },
    usd: { totalAmount: 25, connectionFeeAmount: 15, providerAmount: 10, duration: 30, currency: 'usd' },
    b2b: {
      eur: { providerAmount: 7 }, // 70% of 10
      usd: { providerAmount: 7 }
    }
  }
};

/**
 * Provider amount for a B2B SOS-Call free call.
 * Falls back to 70% of the direct rate if no admin override is configured.
 */
export const getB2BProviderAmount = async (
  serviceType: 'lawyer' | 'expat',
  currency: 'eur' | 'usd' = 'eur'
): Promise<number> => {
  const config = await getPricingConfig();
  const override = config[serviceType]?.b2b?.[currency]?.providerAmount;
  if (typeof override === 'number' && override > 0) {
    return override;
  }
  // Fallback: 70% of the standard direct rate
  const directRate = config[serviceType][currency].providerAmount;
  return Math.round(directRate * 0.7 * 100) / 100;
};

/**
 * Récupère la configuration pricing côté backend
 */
export const getPricingConfig = async (): Promise<PricingConfig> => {
  try {
    const configDoc = await firestore.doc('admin_config/pricing').get();
    
    if (configDoc.exists) {
      const data = configDoc.data() as PricingConfig;
      
      if (isValidPricingConfig(data)) {
        return data;
      } else {
        console.warn('Configuration pricing invalide, utilisation du fallback');
        return DEFAULT_PRICING_CONFIG;
      }
    } else {
      console.warn('Configuration pricing non trouvée, utilisation du fallback');
      return DEFAULT_PRICING_CONFIG;
    }
  } catch (error) {
    console.error('Erreur récupération pricing config:', error);
    return DEFAULT_PRICING_CONFIG;
  }
};

/**
 * Récupère les montants pour un service et devise spécifiques.
 *
 * Tient compte de l'override admin actif (`admin_config/pricing.overrides`)
 * pour rester aligné avec `utils/paymentValidators.ts:getPricingConfig` utilisé
 * par Stripe. Sans cela, PayPal rejetait avec "Amount mismatch" pendant qu'une
 * promo admin (ex. 1€) était active : Stripe acceptait, PayPal refusait.
 */
export const getServiceAmounts = async (
  serviceType: 'lawyer' | 'expat',
  currency: 'eur' | 'usd' = 'eur'
): Promise<ServiceConfig> => {
  // Lecture brute du doc Firestore pour accéder aux overrides (la map d'overrides
  // ne fait pas partie du type PricingConfig).
  try {
    const configDoc = await firestore.doc('admin_config/pricing').get();
    const raw = configDoc.exists ? (configDoc.data() as Record<string, unknown>) : null;

    if (raw) {
      const ovTable = (raw.overrides as Record<string, unknown> | undefined)?.[serviceType] as
        | Record<string, OverrideEntry>
        | undefined;
      const ov = ovTable?.[currency];

      const now = Date.now();
      const startsAt = toMillis(ov?.startsAt);
      const endsAt = toMillis(ov?.endsAt);
      const overrideActive =
        ov?.enabled === true &&
        (startsAt ? now >= startsAt : true) &&
        (endsAt ? now <= endsAt : true);

      if (overrideActive && typeof ov?.totalAmount === 'number') {
        const standardCfg = (raw[serviceType] as PricingConfig['lawyer'] | undefined)?.[currency]
          ?? DEFAULT_PRICING_CONFIG[serviceType][currency];
        const total = ov.totalAmount;
        const conn = typeof ov.connectionFeeAmount === 'number' ? ov.connectionFeeAmount : 0;
        const providerAmt = typeof ov.providerAmount === 'number'
          ? ov.providerAmount
          : Math.max(0, total - conn);
        return {
          totalAmount: total,
          connectionFeeAmount: conn,
          providerAmount: providerAmt,
          duration: standardCfg.duration,
          currency,
        };
      }
    }
  } catch (err) {
    console.error('[pricingService] override lookup failed, falling back to standard pricing:', err);
  }

  // Standard (sans override actif) — comportement historique
  const config = await getPricingConfig();
  return config[serviceType][currency];
};

/**
 * Structure d'un override admin tel que persisté dans `admin_config/pricing.overrides`.
 * Synchronisée avec `utils/paymentValidators.ts:PricingOverride`.
 */
interface OverrideEntry {
  enabled?: boolean;
  startsAt?: unknown;
  endsAt?: unknown;
  totalAmount?: number;
  connectionFeeAmount?: number;
  providerAmount?: number;
  stackableWithCoupons?: boolean;
}

/**
 * Convertit un Firestore Timestamp / number en millisecondes.
 * Synchronisé avec `utils/paymentValidators.ts:toMillis`.
 */
function toMillis(v: unknown): number | undefined {
  if (typeof v === 'number') return v;
  if (v && typeof v === 'object') {
    const ts = v as { seconds?: number; toDate?: () => Date };
    if (typeof ts.toDate === 'function') {
      try { return ts.toDate()!.getTime(); } catch { /* ignore */ }
    }
    if (typeof ts.seconds === 'number') return ts.seconds * 1000;
  }
  return undefined;
}

/**
 * Valide et calcule les montants pour une transaction
 */
export const validateAndCalculateAmounts = async (
  serviceType: 'lawyer' | 'expat',
  currency: 'eur' | 'usd' = 'eur',
  clientAmount?: number
): Promise<{
  isValid: boolean;
  config: ServiceConfig;
  errors: string[];
}> => {
  const errors: string[] = [];
  const config = await getServiceAmounts(serviceType, currency);
  
  // Validation du montant client si fourni
  if (clientAmount !== undefined) {
    if (Math.abs(clientAmount - config.totalAmount) > 0.01) {
      errors.push(`Montant incorrect: attendu ${config.totalAmount}, reçu ${clientAmount}`);
    }
  }
  
  // Validation de la cohérence des montants
  const calculatedProviderAmount = config.totalAmount - config.connectionFeeAmount;
  if (Math.abs(calculatedProviderAmount - config.providerAmount) > 0.01) {
    errors.push('Erreur de calcul des montants dans la configuration');
  }
  
  return {
    isValid: errors.length === 0,
    config,
    errors
  };
};

/**
 * NOTE: Les prix EUR et USD sont fixés DIRECTEMENT dans la console d'administration.
 * Il n'y a PAS de conversion automatique entre devises.
 * Chaque devise a son propre prix défini manuellement dans admin_config/pricing.
 *
 * Pour les seuils fiscaux TVA (threshold tracking), voir thresholds/types.ts
 * qui utilise des taux de change pour le suivi de conformité fiscale uniquement.
 */

/**
 * Récupère la configuration avec cache
 */
class PricingConfigCache {
  private cache: PricingConfig | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async get(): Promise<PricingConfig> {
    const now = Date.now();
    
    if (this.cache && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cache;
    }

    this.cache = await getPricingConfig();
    this.lastFetch = now;
    return this.cache;
  }

  clear(): void {
    this.cache = null;
    this.lastFetch = 0;
  }
}

export const pricingConfigCache = new PricingConfigCache();

/**
 * Validation de la structure de configuration
 */
const isValidPricingConfig = (config: any): config is PricingConfig => {
  try {
    return (
      config &&
      typeof config === 'object' &&
      config.lawyer &&
      config.expat &&
      isValidServiceConfig(config.lawyer.eur) &&
      isValidServiceConfig(config.lawyer.usd) &&
      isValidServiceConfig(config.expat.eur) &&
      isValidServiceConfig(config.expat.usd)
    );
  } catch {
    return false;
  }
};

const isValidServiceConfig = (config: any): config is ServiceConfig => {
  return (
    config &&
    typeof config === 'object' &&
    typeof config.totalAmount === 'number' &&
    typeof config.connectionFeeAmount === 'number' &&
    typeof config.providerAmount === 'number' &&
    typeof config.duration === 'number' &&
    typeof config.currency === 'string' &&
    config.totalAmount > 0 &&
    config.connectionFeeAmount >= 0 &&
    config.providerAmount >= 0 &&
    config.duration > 0 &&
    ['eur', 'usd'].includes(config.currency)
  );
};
