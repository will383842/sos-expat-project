/**
 * PartnerSosCallSection — drop-in section shown in PartnerDashboard
 * and PartnerAgreement for B2B partners with sos_call_active=true.
 *
 * Fetches KPIs + latest invoice from the Partner Engine Laravel API.
 * Self-contained — just drop <PartnerSosCallSection /> in any partner page.
 */

import React, { useEffect, useState } from 'react';
import {
  getSosCallKpis,
  listSosCallInvoices,
  type SosCallKpis,
  type SosCallInvoice,
} from '@/services/partnerEngineApi';
import { Activity, Receipt, ArrowRight, Loader2 } from 'lucide-react';
import { useLocaleNavigate } from '@/multilingual-system';

const CARD = 'bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-5';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-emerald-100 text-emerald-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-700',
};

export const PartnerSosCallSection: React.FC<{ className?: string }> = ({ className = '' }) => {
  const navigate = useLocaleNavigate();
  const [kpis, setKpis] = useState<SosCallKpis | null>(null);
  const [latestInvoice, setLatestInvoice] = useState<SosCallInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [k, invs] = await Promise.all([
          getSosCallKpis().catch(() => null),
          listSosCallInvoices({ per_page: 1 }).catch(() => ({ data: [] } as any)),
        ]);
        if (cancelled) return;
        if (!k) {
          // Partner probably doesn't have sos_call_active — silently hide the section
          setUnavailable(true);
        } else {
          setKpis(k);
          setLatestInvoice(invs?.data?.[0] || null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (unavailable) return null;
  if (loading) {
    return (
      <div className={`${CARD} ${className} text-center text-sm text-gray-500`}>
        <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Chargement des données SOS-Call…
      </div>
    );
  }
  if (!kpis) return null;

  const fmt = (amount: number, currency = 'EUR') =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">SOS-Call ce mois</h2>
          <p className="text-xs text-gray-500">Forfait mensuel B2B — période {kpis.period}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={CARD}>
          <div className="text-xs uppercase tracking-wide text-gray-500">Clients actifs</div>
          <div className="mt-1 text-2xl font-bold">{kpis.active_subscribers}</div>
        </div>
        <div className={CARD}>
          <div className="text-xs uppercase tracking-wide text-gray-500">Expert ce mois</div>
          <div className="mt-1 text-2xl font-bold text-blue-600">{kpis.calls_expert}</div>
        </div>
        <div className={CARD}>
          <div className="text-xs uppercase tracking-wide text-gray-500">Avocat ce mois</div>
          <div className="mt-1 text-2xl font-bold text-red-600">{kpis.calls_lawyer}</div>
        </div>
        <div className={CARD}>
          <div className="text-xs uppercase tracking-wide text-gray-500">Facture estimée</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">
            {fmt(kpis.estimated_invoice || 0, kpis.billing_currency || 'EUR')}
          </div>
          {(kpis.monthly_base_fee || 0) > 0 && (
            <div className="text-[11px] text-gray-500 mt-1">
              Forfait {fmt(kpis.monthly_base_fee, kpis.billing_currency || 'EUR')}
              {(kpis.billing_rate || 0) > 0 && (
                <> + {kpis.active_subscribers} × {fmt(kpis.billing_rate, kpis.billing_currency || 'EUR')}</>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Latest invoice quick-view */}
      {latestInvoice && (
        <div className={CARD}>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  Dernière facture — {latestInvoice.period}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[latestInvoice.status] || ''}`}>
                    {latestInvoice.status === 'pending' && 'En attente'}
                    {latestInvoice.status === 'paid' && 'Payée'}
                    {latestInvoice.status === 'overdue' && 'En retard'}
                    {latestInvoice.status === 'cancelled' && 'Annulée'}
                  </span>
                  <span className="ml-2">{fmt(Number(latestInvoice.total_amount), latestInvoice.billing_currency)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {latestInvoice.stripe_hosted_url && latestInvoice.status !== 'paid' && (
                <a
                  href={latestInvoice.stripe_hosted_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                >
                  Payer
                </a>
              )}
              <button
                onClick={() => navigate('/partner/factures')}
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-semibold inline-flex items-center gap-1"
              >
                Toutes les factures <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deep-link to full activity page */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate('/partner/activite-sos-call')}
          className="text-sm text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1"
        >
          Voir toute l'activité SOS-Call <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PartnerSosCallSection;
