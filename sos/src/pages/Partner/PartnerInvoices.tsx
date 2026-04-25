/**
 * PartnerInvoices — SOS-Call monthly invoices for the connected partner.
 *
 * Route: /partner/factures (conditional — only if the partner's agreement has sos_call_active=true)
 *
 * Shows:
 *   - Summary widgets (total paid, pending, overdue)
 *   - Paginated table with period, amount, status, download PDF, pay online (Stripe hosted)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { PartnerDashboardLayout } from '@/components/Partner';
import {
  listSosCallInvoices,
  downloadSosCallInvoicePdf,
  type SosCallInvoice,
} from '@/services/partnerEngineApi';
import { Download, ExternalLink, Loader2, Receipt } from 'lucide-react';

const STATUS_STYLES: Record<SosCallInvoice['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const STATUS_LABELS: Record<SosCallInvoice['status'], string> = {
  pending: 'En attente',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
};

const PartnerInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<SosCallInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | SosCallInvoice['status']>('all');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listSosCallInvoices({ per_page: 50, status: filterStatus === 'all' ? undefined : filterStatus })
      .then((res) => {
        if (!cancelled) setInvoices(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Erreur chargement factures');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filterStatus]);

  const summary = useMemo(() => {
    const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const totalPending = invoices.filter((i) => i.status === 'pending').reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const totalOverdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + Number(i.total_amount || 0), 0);
    return { totalPaid, totalPending, totalOverdue, count: invoices.length };
  }, [invoices]);

  const handleDownload = async (invoice: SosCallInvoice) => {
    setDownloadingId(invoice.id);
    try {
      const blob = await downloadSosCallInvoicePdf(invoice.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Échec du téléchargement: ${err instanceof Error ? err.message : 'erreur'}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount);

  return (
    <PartnerDashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <header className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes factures SOS-Call</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Facturation mensuelle forfaitaire</p>
          </div>
        </header>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide text-gray-500">Total payé</div>
            <div className="mt-1 text-2xl font-bold text-emerald-600">{formatAmount(summary.totalPaid, 'EUR')}</div>
          </div>
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide text-gray-500">En attente</div>
            <div className="mt-1 text-2xl font-bold text-yellow-600">{formatAmount(summary.totalPending, 'EUR')}</div>
          </div>
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-5">
            <div className="text-xs uppercase tracking-wide text-gray-500">En retard</div>
            <div className="mt-1 text-2xl font-bold text-red-600">{formatAmount(summary.totalOverdue, 'EUR')}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Filtrer :</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">Toutes</option>
            <option value="pending">En attente</option>
            <option value="paid">Payées</option>
            <option value="overdue">En retard</option>
            <option value="cancelled">Annulées</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin inline-block mr-2" />
              Chargement…
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-600">{error}</div>
          ) : invoices.length === 0 ? (
            <div className="py-16 text-center text-gray-500">Aucune facture pour le moment.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/40">
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="p-3">N°</th>
                    <th className="p-3">Période</th>
                    <th className="p-3">Clients</th>
                    <th className="p-3">Montant</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3">Échéance</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                      <td className="p-3 font-mono text-xs">{inv.invoice_number}</td>
                      <td className="p-3">{inv.period}</td>
                      <td className="p-3">{inv.active_subscribers}</td>
                      <td className="p-3">
                        <div className="font-semibold">{formatAmount(Number(inv.total_amount), inv.billing_currency)}</div>
                        {inv.pricing_tier && (
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Palier {inv.pricing_tier.min}–{inv.pricing_tier.max ?? '∞'}
                          </div>
                        )}
                        {!inv.pricing_tier && Number(inv.monthly_base_fee || 0) > 0 && Number(inv.billing_rate || 0) > 0 && (
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Forfait + {inv.active_subscribers} × {formatAmount(Number(inv.billing_rate), inv.billing_currency)}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[inv.status]}`}>
                          {STATUS_LABELS[inv.status]}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{new Date(inv.due_date).toLocaleDateString('fr-FR')}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {inv.stripe_hosted_url && inv.status !== 'paid' && (
                            <a
                              href={inv.stripe_hosted_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
                            >
                              <ExternalLink className="w-3 h-3" /> Payer
                            </a>
                          )}
                          <button
                            onClick={() => handleDownload(inv)}
                            disabled={downloadingId === inv.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-medium disabled:opacity-50"
                          >
                            {downloadingId === inv.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PartnerDashboardLayout>
  );
};

export default PartnerInvoices;
