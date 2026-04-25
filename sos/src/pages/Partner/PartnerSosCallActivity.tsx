/**
 * PartnerSosCallActivity — Full activity dashboard for SOS-Call partners.
 *
 * Route: /partner/activite-sos-call
 *
 * Sections:
 *   1. KPIs of the current month (active subs, calls expert/lawyer, usage rate)
 *   2. 12-month timeline line chart (expert + lawyer calls)
 *   3. Breakdown: pie chart call types + bar chart top countries
 *   4. Top 20 subscribers by usage
 *   5. Full paginated calls history with CSV export
 */

import React, { useEffect, useMemo, useState } from 'react';
import { PartnerDashboardLayout } from '@/components/Partner';
import {
  getSosCallKpis,
  getSosCallTimeline,
  getSosCallBreakdown,
  getSosCallHierarchy,
  getSosCallTopSubscribers,
  getSosCallCallsHistory,
  exportSosCallCallsCsv,
  type SosCallKpis,
  type SosCallTimelinePoint,
  type SosCallBreakdown,
  type SosCallHierarchy,
  type SosCallTopSubscriber,
} from '@/services/partnerEngineApi';
import { Activity, Download, Loader2, Users } from 'lucide-react';

const CARD = 'bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-5';

const PartnerSosCallActivity: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<SosCallKpis | null>(null);
  const [timeline, setTimeline] = useState<SosCallTimelinePoint[]>([]);
  const [breakdown, setBreakdown] = useState<SosCallBreakdown | null>(null);
  const [topSubscribers, setTopSubscribers] = useState<SosCallTopSubscriber[]>([]);
  const [exporting, setExporting] = useState(false);
  const [calls, setCalls] = useState<any[]>([]);
  const [hierarchy, setHierarchy] = useState<SosCallHierarchy | null>(null);
  const [hierarchyDim, setHierarchyDim] = useState<'group_label' | 'region' | 'department'>('group_label');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [k, t, b, top, callsPage, h] = await Promise.all([
          getSosCallKpis().catch(() => null),
          getSosCallTimeline(12).catch(() => []),
          getSosCallBreakdown().catch(() => null),
          getSosCallTopSubscribers(undefined, 20).catch(() => []),
          getSosCallCallsHistory({ per_page: 25 }).catch(() => ({ data: [], current_page: 1, last_page: 1, per_page: 25, total: 0 })),
          getSosCallHierarchy(hierarchyDim, 'month').catch(() => null),
        ]);
        if (cancelled) return;
        setKpis(k);
        setTimeline(Array.isArray(t) ? t : []);
        setBreakdown(b);
        setTopSubscribers(Array.isArray(top) ? top : []);
        setCalls(callsPage?.data || []);
        setHierarchy(h);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Erreur de chargement');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [hierarchyDim]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportSosCallCallsCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sos-call-activite-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Export échoué: ${err instanceof Error ? err.message : 'erreur'}`);
    } finally {
      setExporting(false);
    }
  };

  const maxTimelineValue = useMemo(() => {
    if (!timeline.length) return 1;
    return Math.max(1, ...timeline.map((p) => p.total));
  }, [timeline]);

  if (loading) {
    return (
      <PartnerDashboardLayout>
        <div className="py-24 text-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin inline-block mr-2" /> Chargement…
        </div>
      </PartnerDashboardLayout>
    );
  }

  if (error) {
    return (
      <PartnerDashboardLayout>
        <div className="py-24 text-center text-red-600">{error}</div>
      </PartnerDashboardLayout>
    );
  }

  return (
    <PartnerDashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        <header className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activité SOS-Call</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Suivez l'usage des services par vos clients</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
        </header>

        {/* Section 1 — KPIs */}
        {kpis && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="text-xs uppercase tracking-wide text-gray-500">Taux d'usage</div>
              <div className="mt-1 text-2xl font-bold">{kpis.usage_rate_percent?.toFixed(1) ?? 0}%</div>
            </div>
          </div>
        )}

        {/* Section 2 — Timeline (simple CSS bar chart — Recharts dependency-free) */}
        <div className={CARD}>
          <h2 className="text-lg font-semibold mb-4">Évolution (12 derniers mois)</h2>
          {timeline.length === 0 ? (
            <div className="py-12 text-center text-gray-500">Pas encore de données</div>
          ) : (
            <div className="space-y-2">
              {timeline.map((p) => (
                <div key={p.period} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-gray-500">{p.period}</div>
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex">
                    <div
                      className="bg-blue-500"
                      style={{ width: `${(p.calls_expert / maxTimelineValue) * 100}%` }}
                      title={`Expert: ${p.calls_expert}`}
                    />
                    <div
                      className="bg-red-500"
                      style={{ width: `${(p.calls_lawyer / maxTimelineValue) * 100}%` }}
                      title={`Avocat: ${p.calls_lawyer}`}
                    />
                  </div>
                  <div className="w-12 text-xs font-semibold text-right">{p.total}</div>
                </div>
              ))}
              <div className="flex gap-4 text-xs text-gray-500 mt-2">
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 inline-block rounded"></span> Expert</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 inline-block rounded"></span> Avocat</div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3 — Breakdown */}
        {breakdown && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={CARD}>
              <h2 className="text-lg font-semibold mb-4">Répartition par type</h2>
              {breakdown.call_types?.length ? (
                <ul className="space-y-2">
                  {breakdown.call_types.map((t) => (
                    <li key={t.type} className="flex items-center justify-between">
                      <span className="text-sm">{t.type === 'lawyer' ? '⚖️ Avocat' : '👤 Expert'}</span>
                      <div className="flex-1 mx-3 h-2 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                        <div
                          className={t.type === 'lawyer' ? 'h-full bg-red-500' : 'h-full bg-blue-500'}
                          style={{ width: `${t.percent}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-12 text-right">{t.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">Aucune donnée</div>
              )}
            </div>

            <div className={CARD}>
              <h2 className="text-lg font-semibold mb-4">Top pays d'intervention</h2>
              {breakdown.top_countries?.length ? (
                <ul className="space-y-2">
                  {breakdown.top_countries.slice(0, 10).map((c) => (
                    <li key={c.country} className="flex items-center justify-between text-sm">
                      <span>{c.country}</span>
                      <span className="font-semibold">{c.count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500">Aucune donnée</div>
              )}
            </div>
          </div>
        )}

        {/* Section 4 — Top subscribers */}
        <div className={CARD}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" /> Top 20 clients par usage
          </h2>
          {topSubscribers.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2 pr-3">Client</th>
                    <th className="py-2 pr-3">Code</th>
                    <th className="py-2 pr-3">Expert</th>
                    <th className="py-2 pr-3">Avocat</th>
                    <th className="py-2 pr-3">Total</th>
                    <th className="py-2">% total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {topSubscribers.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 pr-3">{s.full_name || '—'}</td>
                      <td className="py-2 pr-3 font-mono text-xs">{s.sos_call_code || '—'}</td>
                      <td className="py-2 pr-3">{s.calls_expert}</td>
                      <td className="py-2 pr-3">{s.calls_lawyer}</td>
                      <td className="py-2 pr-3 font-semibold">{s.total_calls}</td>
                      <td className="py-2">{s.percent_of_total?.toFixed(1) ?? 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Pas encore de données</div>
          )}
        </div>

        {/* Section 4.bis — Hierarchy breakdown (only visible if partner actually uses hierarchy).
             A small cabinet with no cabinet/region/department tags sees nothing — no UI clutter. */}
        {hierarchy && hierarchy.rows.some(r => r.label !== '(non défini)') && (
          <div className={CARD}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h2 className="text-lg font-semibold">Répartition par {hierarchyDim === 'group_label' ? 'cabinet' : hierarchyDim === 'region' ? 'région' : 'département'}</h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500">Grouper par :</label>
                <select
                  value={hierarchyDim}
                  onChange={(e) => setHierarchyDim(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="group_label">Cabinet / unité</option>
                  <option value="region">Région</option>
                  <option value="department">Département / service</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2 pr-3">Label</th>
                    <th className="py-2 pr-3">Clients (actifs)</th>
                    <th className="py-2 pr-3">Expert</th>
                    <th className="py-2 pr-3">Avocat</th>
                    <th className="py-2">Total appels</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {hierarchy.rows.map((r) => (
                    <tr key={r.label}>
                      <td className="py-2 pr-3 font-medium">{r.label}</td>
                      <td className="py-2 pr-3">
                        <span className="text-gray-900 dark:text-white">{r.subscribers_active}</span>
                        <span className="text-gray-500"> / {r.subscribers_total}</span>
                      </td>
                      <td className="py-2 pr-3 text-blue-600">{r.calls_expert}</td>
                      <td className="py-2 pr-3 text-red-600">{r.calls_lawyer}</td>
                      <td className="py-2 font-semibold">{r.calls_total}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-200 dark:border-gray-700">
                  <tr className="font-semibold">
                    <td className="py-2 pr-3">Total</td>
                    <td className="py-2 pr-3">{hierarchy.total_subscribers}</td>
                    <td className="py-2 pr-3"></td>
                    <td className="py-2 pr-3"></td>
                    <td className="py-2">{hierarchy.total_calls}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Section 5 — Recent calls */}
        <div className={CARD}>
          <h2 className="text-lg font-semibold mb-4">Derniers appels</h2>
          {calls.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-800">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Subscriber</th>
                    <th className="py-2 pr-3">Durée</th>
                    <th className="py-2">Pays</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {calls.map((c: any, idx: number) => (
                    <tr key={c.id || idx}>
                      <td className="py-2 pr-3 text-xs">{c.created_at ? new Date(c.created_at).toLocaleString('fr-FR') : ''}</td>
                      <td className="py-2 pr-3">{c.provider_type === 'lawyer' ? '⚖️ Avocat' : '👤 Expert'}</td>
                      <td className="py-2 pr-3">{c.subscriber_id || '—'}</td>
                      <td className="py-2 pr-3">{c.duration_seconds ? Math.round(c.duration_seconds / 60) + ' min' : '—'}</td>
                      <td className="py-2">{c.metadata?.country || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Aucun appel encore</div>
          )}
        </div>
      </div>
    </PartnerDashboardLayout>
  );
};

export default PartnerSosCallActivity;
