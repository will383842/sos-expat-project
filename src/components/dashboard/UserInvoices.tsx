import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useIntl } from 'react-intl';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceRecord {
  id: string;
  clientId: string;
  providerId: string;
  amount: number;
  status: string;
  downloadUrl: string;
  createdAt: { seconds: number; nanoseconds: number };
}

export default function UserInvoices() {
  const { user } = useAuth();
  const intl = useIntl();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const PAGE_SIZE = 10;

  const exportSinglePDF = (invoice: any) => {
    console.log('Export PDF:', invoice);
    alert(intl.formatMessage({ id: 'userInvoices.exportPdfNotImplemented' }));
  };

  useEffect(() => {
    if (!user?.uid) return;

    const fetchInvoices = async () => {
      setLoading(true);
      setError(null);

      try {
        const roleField = user.role === 'client' ? 'clientId' : 'providerId';

        const q = query(
          collection(db, 'invoice_records'),
          where(roleField, '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        );

        const snapshot = await getDocs(q);
        const fetchedInvoices: InvoiceRecord[] = [];

        snapshot.forEach((doc) => {
          fetchedInvoices.push({
            id: doc.id,
            ...(doc.data() as Omit<InvoiceRecord, 'id'>),
          });
        });

        setInvoices(fetchedInvoices);
        setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.size === PAGE_SIZE);
      } catch (err: any) {
        console.error('Erreur chargement factures:', err);
        console.error('Error code:', err.code);
        console.error('Error message:', err.message);
        console.error('User role:', user?.role);
        console.error('User UID:', user?.uid);
        setError(intl.formatMessage({ id: 'userInvoices.loadError' }));
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [user]);

  const fetchMore = async () => {
    if (!lastDoc || !user?.uid) return;
    setLoadingMore(true);

    try {
      const roleField = user.role === 'client' ? 'clientId' : 'providerId';

      const q = query(
        collection(db, 'invoice_records'),
        where(roleField, '==', user.uid),
        orderBy('createdAt', 'desc'),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      const moreInvoices: InvoiceRecord[] = [];

      snapshot.forEach((doc) => {
        moreInvoices.push({
          id: doc.id,
          ...(doc.data() as Omit<InvoiceRecord, 'id'>),
        });
      });

      setInvoices((prev) => [...prev, ...moreInvoices]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.size === PAGE_SIZE);
    } catch (err) {
      console.error('Erreur chargement supplémentaire:', err);
      setError(intl.formatMessage({ id: 'userInvoices.loadMoreError' }));
    } finally {
      setLoadingMore(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(intl.formatMessage({ id: 'userInvoices.title' }), 14, 15);

    const tableData = invoices.map((invoice) => [
      invoice.id,
      invoice.amount.toFixed(2) + ' €',
      invoice.status,
      new Date(invoice.createdAt.seconds * 1000).toLocaleDateString(intl.locale),
    ]);

    autoTable(doc, {
      head: [[
        intl.formatMessage({ id: 'userInvoices.table.id' }),
        intl.formatMessage({ id: 'userInvoices.table.amount' }),
        intl.formatMessage({ id: 'userInvoices.table.status' }),
        intl.formatMessage({ id: 'userInvoices.table.date' })
      ]],
      body: tableData,
      startY: 20,
    });

    doc.save(intl.formatMessage({ id: 'userInvoices.pdfFilename' }));
  };

  if (loading) return <p>{intl.formatMessage({ id: 'userInvoices.loading' })}</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (invoices.length === 0) return <p>{intl.formatMessage({ id: 'userInvoices.noInvoices' })}</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-2">
        {intl.formatMessage({ id: 'userInvoices.title' })}
      </h2>

      <button
        onClick={exportPDF}
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        {intl.formatMessage({ id: 'userInvoices.exportPdf' })}
      </button>

      <ul className="space-y-2">
        {invoices.map((invoice) => (
          <li key={invoice.id} className="border p-4 rounded-md shadow-sm">
            <p>
              <strong>{intl.formatMessage({ id: 'userInvoices.amount' })}:</strong> {invoice.amount.toFixed(2)} €
            </p>
            <p>
              <strong>{intl.formatMessage({ id: 'userInvoices.status' })}:</strong> {invoice.status}
            </p>
            <p>
              <strong>{intl.formatMessage({ id: 'userInvoices.date' })}:</strong>{' '}
              {new Date(invoice.createdAt.seconds * 1000).toLocaleDateString(intl.locale)}
            </p>
            <div className="flex gap-4 mt-2">
              <a
                href={invoice.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {intl.formatMessage({ id: 'userInvoices.downloadInvoice' })}
              </a>

              <button
                onClick={() => exportSinglePDF(invoice)}
                className="text-green-600 underline"
              >
                {intl.formatMessage({ id: 'userInvoices.exportPdf' })}
              </button>
            </div>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          onClick={fetchMore}
          disabled={loadingMore}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loadingMore 
            ? intl.formatMessage({ id: 'userInvoices.loadingMore' })
            : intl.formatMessage({ id: 'userInvoices.loadMore' })
          }
        </button>
      )}
    </div>
  );
}


