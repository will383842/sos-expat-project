// src/pages/admin/AdminPayments.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  orderBy,
  query,
  limit,
  where,
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
  updateDoc,
} from 'firebase/firestore';
import { db, functions } from '../../config/firebase';
import { httpsCallable } from 'firebase/functions';
import AdminLayout from '../../components/admin/AdminLayout';
import Button from '../../components/common/Button';
import { RefreshCw, Search, CheckCircle, XCircle, Download, Phone } from 'lucide-react';
import { isUrlExpired } from '../../utils/urlUtils';

type PaymentStatus = 'paid' | 'refunded' | 'failed' | 'pending';

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  downloadUrl: string;
  type?: string;
  callId: string;
  createdAt?: Timestamp | Date;
}

interface CallSessionData {
  status?: 'pending' | 'provider_connecting' | 'client_connecting' | 'both_connecting' | 'active' | 'completed' | 'failed' | 'cancelled';
  createdAt?: Timestamp | Date;
  metadata?: {
    createdAt?: Timestamp | Date;
  };
  participants?: {
    client?: {
      connectedAt?: Timestamp | Date;
      disconnectedAt?: Timestamp | Date;
      status?: string;
    };
  };
  payment?: {
    duration?: number;
  };
}

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  providerId: string;
  providerName?: string;
  clientId: string;
  clientName?: string;
  createdAt: Date;
  callSessionId?: string;
  providerAmount?: number;
  commissionAmount?: number;
  duration?: number;
  callSession?: CallSessionData;
  invoices?: InvoiceRecord[];
  callDate?: Date;
}

const PAGE_SIZE = 25;

const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Filtres
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [startDate, setStartDate] = useState<string>(''); // yyyy-mm-dd
  const [endDate, setEndDate] = useState<string>(''); // yyyy-mm-dd
  const [search, setSearch] = useState<string>('');

  // Conversion sécurisée Date -> Timestamp (pour where)
  const startTs = useMemo(() => {
    if (!startDate) return undefined;
    const d = new Date(startDate);
    if (Number.isNaN(d.getTime())) return undefined;
    // début de journée
    d.setHours(0, 0, 0, 0);
    return Timestamp.fromDate(d);
  }, [startDate]);

  const endTs = useMemo(() => {
    if (!endDate) return undefined;
    const d = new Date(endDate);
    if (Number.isNaN(d.getTime())) return undefined;
    // fin de journée
    d.setHours(23, 59, 59, 999);
    return Timestamp.fromDate(d);
  }, [endDate]);

  const mapSnapToPayment = (docSnap: QueryDocumentSnapshot<DocumentData>): PaymentRecord => {
    const data = docSnap.data() as {
      amount?: number;
      currency?: string;
      status?: PaymentStatus;
      providerId?: string;
      providerName?: string;
      clientId?: string;
      clientName?: string;
      createdAt?: Timestamp | Date;
      callSessionId?: string;
      sessionId?: string;
      providerAmount?: number;
      providerAmountEuros?: number;
      commissionAmount?: number;
      commissionAmountEuros?: number;
      duration?: number;
    };

    // createdAt: on accepte Timestamp | Date | undefined
    let createdAtDate: Date = new Date();
    const val = data.createdAt;
    if (val instanceof Timestamp) {
      createdAtDate = val.toDate();
    } else if (val instanceof Date) {
      createdAtDate = val;
    }

    return {
      id: docSnap.id,
      amount: data.amount ?? 0,
      currency: data.currency ?? 'EUR',
      status: (data.status ?? 'pending') as PaymentStatus,
      providerId: data.providerId ?? '',
      providerName: data.providerName,
      clientId: data.clientId ?? '',
      clientName: data.clientName,
      createdAt: createdAtDate,
      callSessionId: data.callSessionId || data.sessionId,
      providerAmount: data.providerAmount ?? data.providerAmountEuros,
      commissionAmount: data.commissionAmount ?? data.commissionAmountEuros,
      duration: data.duration,
    };
  };

  // Fetch call session data
  const fetchCallSession = async (callSessionId: string): Promise<CallSessionData | null> => {
    if (!callSessionId) return null;
    try {
      const sessionDoc = await getDoc(doc(db, 'call_sessions', callSessionId));
      if (sessionDoc.exists()) {
        return sessionDoc.data() as CallSessionData;
      }
    } catch (error) {
      console.error('Error fetching call session:', error);
    }
    return null;
  };

  // Fetch invoice records for a call
  const fetchInvoices = async (callId: string): Promise<InvoiceRecord[]> => {
    if (!callId) return [];
    try {
      const invoicesRef = collection(db, 'invoice_records');
      const q = query(invoicesRef, where('callId', '==', callId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        let createdAtDate: Date = new Date();
        const val = data.createdAt;
        if (val instanceof Timestamp) {
          createdAtDate = val.toDate();
        } else if (val instanceof Date) {
          createdAtDate = val;
        }
        
        return {
          id: docSnap.id,
          invoiceNumber: data.invoiceNumber || '',
          downloadUrl: data.downloadUrl || '',
          type: data.type,
          callId: data.callId || callId,
          createdAt: createdAtDate,
        };
      });
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  };

  // Fetch additional data for payments
  const enrichPayments = async (paymentRecords: PaymentRecord[]): Promise<PaymentRecord[]> => {
    return Promise.all(
      paymentRecords.map(async (payment) => {
        if (!payment.callSessionId) return payment;

        const [callSession, invoices] = await Promise.all([
          fetchCallSession(payment.callSessionId),
          fetchInvoices(payment.callSessionId),
        ]);

        let callDate: Date | undefined;
        let callDuration: number | undefined = payment.duration;

        if (callSession) {
          // Get call date from call session
          const sessionCreatedAt = callSession.metadata?.createdAt || callSession.createdAt;
          if (sessionCreatedAt) {
            if (sessionCreatedAt instanceof Timestamp) {
              callDate = sessionCreatedAt.toDate();
            } else if (sessionCreatedAt instanceof Date) {
              callDate = sessionCreatedAt;
            }
          }
          
          // Calculate duration based on call session status
          const sessionStatus = callSession.status;
          
          if (sessionStatus === 'failed') {
            // If call failed, show 0 duration
            callDuration = 0;
          } else if (sessionStatus === 'completed') {
            // If call completed, calculate duration from client connectedAt - disconnectedAt
            const client = callSession.participants?.client;
            if (client?.connectedAt && client?.disconnectedAt) {
              let connectedAtDate: Date;
              let disconnectedAtDate: Date;
              
              // Convert connectedAt to Date
              if (client.connectedAt instanceof Timestamp) {
                connectedAtDate = client.connectedAt.toDate();
              } else if (client.connectedAt instanceof Date) {
                connectedAtDate = client.connectedAt;
              } else {
                connectedAtDate = new Date(client.connectedAt);
              }
              
              // Convert disconnectedAt to Date
              if (client.disconnectedAt instanceof Timestamp) {
                disconnectedAtDate = client.disconnectedAt.toDate();
              } else if (client.disconnectedAt instanceof Date) {
                disconnectedAtDate = client.disconnectedAt;
              } else {
                disconnectedAtDate = new Date(client.disconnectedAt);
              }
              
              // Calculate duration in minutes
              const durationMs = disconnectedAtDate.getTime() - connectedAtDate.getTime();
              callDuration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
            } else if (callSession.payment?.duration) {
              // Fallback to payment duration if available
              callDuration = callSession.payment.duration;
            }
          } else {
            // For other statuses, use payment duration if available
            if (!callDuration && callSession.payment?.duration) {
              callDuration = callSession.payment.duration;
            }
          }
        }

        return {
          ...payment,
          callSession,
          invoices,
          callDate,
          duration: callDuration,
        };
      })
    );
  };

  const buildQuery = useCallback(
    async (reset = false) => {
      setIsLoading(true);
      try {
        const colRef = collection(db, 'payments'); // adapte le nom si besoin
        const constraints: Parameters<typeof query>[1][] = [];

        // Filtres WHERE
        if (statusFilter !== 'all') {
          constraints.push(where('status', '==', statusFilter));
        }
        if (startTs) {
          constraints.push(where('createdAt', '>=', startTs));
        }
        if (endTs) {
          constraints.push(where('createdAt', '<=', endTs));
        }

        // Tri
        constraints.push(orderBy('createdAt', 'desc'));

        // Pagination
        if (!reset && lastDoc) {
          constraints.push(startAfter(lastDoc));
        }

        // Limite
        constraints.push(limit(PAGE_SIZE));

        const q = query(colRef, ...constraints);
        const snap = await getDocs(q);

        const pageItems = snap.docs.map(mapSnapToPayment);
        
        // Enrich with call session and invoice data
        const enrichedItems = await enrichPayments(pageItems);
        
        setLastDoc(snap.docs.length ? snap.docs[snap.docs.length - 1] : null);

        setHasMore(snap.docs.length === PAGE_SIZE);

        if (reset) {
          setPayments(enrichedItems);
        } else {
          setPayments((prev) => [...prev, ...enrichedItems]);
        }
      } catch (err) {
        console.error('Error loading payments:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter, startTs, endTs, lastDoc]
  );

  // Chargement initial et à chaque changement de filtres
  useEffect(() => {
    // on remet la pagination à zéro quand les filtres changent
    setLastDoc(null);
    setHasMore(true);
    void buildQuery(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, startTs, endTs]);

  const filteredBySearch = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return payments;
    return payments.filter((p) =>
      [p.id, p.providerId, p.providerName, p.clientId, p.clientName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))
    );
  }, [payments, search]);

  // Handle invoice download with expiration check
  const handleInvoiceDownload = useCallback(async (invoice: InvoiceRecord, e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      let downloadUrl = invoice.downloadUrl;
      
      // Check if URL is expired
      if (isUrlExpired(downloadUrl)) {
        // Generate fresh URL using cloud function
        const generateInvoiceDownloadUrlFn = httpsCallable<{ invoiceId: string }, { downloadUrl: string }>(
          functions,
          'generateInvoiceDownloadUrl'
        );
        
        const result = await generateInvoiceDownloadUrlFn({ invoiceId: invoice.id });
        downloadUrl = result.data.downloadUrl;
        
        // Update the invoice record in local state (optional, for immediate UI update)
        setPayments((prevPayments) =>
          prevPayments.map((payment) => {
            if (payment.invoices) {
              const updatedInvoices = payment.invoices.map((inv) =>
                inv.id === invoice.id ? { ...inv, downloadUrl } : inv
              );
              return { ...payment, invoices: updatedInvoices };
            }
            return payment;
          })
        );
      }
      
      // Download the invoice
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. Please try again.');
    }
  }, []);

  return (
    <AdminLayout>
      <div className="p-6 text-black">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Paiements</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void buildQuery(true)}>
              <RefreshCw size={16} className="mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white border rounded-lg p-4 mb-4 text-black">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium mb-1">Statut</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
              >
                <option value="all">Tous</option>
                <option value="paid">Payé</option>
                <option value="pending">En attente</option>
                <option value="failed">Échec</option>
                <option value="refunded">Remboursé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Du</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Au</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Recherche</label>
              <div className="flex">
                <input
                  className="flex-1 border rounded-l px-3 py-2"
                  placeholder="id / client / prestataire…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="border border-l-0 rounded-r px-3 py-2 grid place-items-center">
                  <Search size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase px-4 py-3">
                  Date Paiement
                </th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase px-4 py-3">
                  Client Payé
                </th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase px-4 py-3">
                  Prestataire
                </th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase px-4 py-3">
                  Ulixai
                </th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase px-4 py-3">
                  Appel
                </th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase px-4 py-3">
                  Durée
                </th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase px-4 py-3">
                  Factures
                </th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase px-4 py-3">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBySearch.map((p) => {
                const providerInvoice = p.invoices?.find((inv) => inv.invoiceNumber.startsWith('PRV-'));
                const platformInvoice = p.invoices?.find((inv) => inv.invoiceNumber.startsWith('PLT-'));
                
                return (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {new Intl.DateTimeFormat('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }).format(p.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {p.amount.toFixed(2)} {p.currency}
                      </div>
                      <div className="text-xs text-gray-500">
                        {p.clientName ?? p.clientId}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {p.providerAmount !== undefined
                          ? `${p.providerAmount.toFixed(2)} ${p.currency}`
                          : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {p.providerName ?? p.providerId}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.commissionAmount !== undefined
                        ? `${p.commissionAmount.toFixed(2)} ${p.currency}`
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {p.callDate ? (
                        <div className="flex items-center gap-1">
                          <Phone size={14} className="text-gray-400" />
                          <span>
                            {new Intl.DateTimeFormat('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }).format(p.callDate)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.duration !== undefined ? (
                        <span>{p.duration} min</span>
                      ) : p.callSession?.status === 'failed' ? (
                        <span>0 min</span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {providerInvoice && (
                          <button
                            onClick={(e) => handleInvoiceDownload(providerInvoice, e)}
                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 gap-1 cursor-pointer bg-transparent border-none p-0"
                            title="Provider invoice"
                          >
                            <Download size={12} />
                            Provider invoice
                          </button>
                        )}
                        {platformInvoice && (
                          <button
                            onClick={(e) => handleInvoiceDownload(platformInvoice, e)}
                            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 gap-1 cursor-pointer bg-transparent border-none p-0"
                            title="Ulixai invoice (commission amount)"
                          >
                            <Download size={12} />
                            Ulixai invoice (commission amount)
                          </button>
                        )}
                        {(!providerInvoice && !platformInvoice) && (
                          <span className="text-xs text-gray-400">Aucune</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.status === 'paid' ? (
                        <span className="inline-flex items-center text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded">
                          <CheckCircle size={14} className="mr-1" /> Payé
                        </span>
                      ) : p.status === 'refunded' ? (
                        <span className="inline-flex items-center text-blue-700 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded">
                          Remboursé
                        </span>
                      ) : p.status === 'failed' ? (
                        <span className="inline-flex items-center text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded">
                          <XCircle size={14} className="mr-1" /> Échec
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
                          En attente
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!isLoading && filteredBySearch.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                    Aucun paiement trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {isLoading && (
            <div className="p-4 text-center text-gray-600">Chargement…</div>
          )}
        </div>

        {hasMore && !isLoading && (
          <div className="mt-4 flex justify-center">
            <Button onClick={() => void buildQuery(false)}>Charger plus</Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;
