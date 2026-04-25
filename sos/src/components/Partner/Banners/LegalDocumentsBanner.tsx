/**
 * LegalDocumentsBanner — non-blocking alert shown on the partner dashboard
 * when there are unsigned/pending legal documents that require partner action.
 *
 * Renders nothing if the partner has no agreement, or if all docs are
 * signed/overridden. Failures (e.g. network) are swallowed silently
 * to avoid blocking the dashboard.
 */

import React, { useEffect, useState } from 'react';
import { FileSignature, ArrowRight, Loader2 } from 'lucide-react';
import { useLocaleNavigate } from '@/multilingual-system';
import {
  listPartnerLegalDocuments,
  type LegalDocumentsListResponse,
} from '@/services/partnerEngineApi';

const LegalDocumentsBanner: React.FC = () => {
  const navigate = useLocaleNavigate();
  const [data, setData] = useState<LegalDocumentsListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listPartnerLegalDocuments()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        // Silent: banner is non-critical.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !data || !data.agreement) return null;

  const status = data.legal_status;
  if (status === 'signed' || status === 'override') return null;

  const readyCount = data.documents.filter((d) => d.status === 'ready_for_signature').length;
  if (readyCount === 0) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0">
        <FileSignature className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-blue-900 dark:text-blue-200">
          {readyCount} document{readyCount > 1 ? 's' : ''} légal{readyCount > 1 ? ' à signer' : ' à signer'}
        </div>
        <div className="text-sm text-blue-800 dark:text-blue-300">
          Pour activer le service SOS-Call pour vos abonnés, signez les documents préparés
          par notre équipe juridique.
        </div>
      </div>
      <button
        type="button"
        onClick={() => navigate('/partner/documents-legaux')}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold shrink-0"
      >
        Signer maintenant
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default LegalDocumentsBanner;
