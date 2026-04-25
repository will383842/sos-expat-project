/**
 * PartnerLegalDocuments — B2B click-wrap signature page.
 *
 * Route: /partner/documents-legaux
 *
 * Lists the 3 legal documents (CGV B2B, DPA, Order Form) that the partner must
 * sign before SOS-Call can be activated for their subscribers. Each document
 * can be previewed inline (HTML), downloaded as PDF, or signed via a click-wrap
 * modal that captures the signer's name + email and confirms reading.
 *
 * After signing, the modal collapses to a "✓ Signé" badge and the partner can
 * re-download the signed PDF (with embedded signature evidence block) at any
 * time. Once all 3 are signed, a success banner appears confirming legal
 * status is now 'signed' and SOS-Call activation is possible.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PartnerDashboardLayout } from '@/components/Partner';
import {
  CheckCircle2,
  ShieldCheck,
  FileSignature,
  Download,
  AlertTriangle,
  Loader2,
  ScrollText,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  listPartnerLegalDocuments,
  getPartnerLegalDocument,
  signPartnerLegalDocument,
  downloadPartnerLegalDocumentPdf,
  type LegalDocumentSummary,
  type LegalDocumentsListResponse,
  type LegalDocumentKind,
} from '@/services/partnerEngineApi';
import { useAuth } from '@/contexts/AuthContext';

const KIND_LABEL: Record<LegalDocumentKind, string> = {
  cgv_b2b: 'Conditions Générales de Vente B2B',
  dpa: 'Accord de traitement des données (DPA)',
  order_form: 'Bon de commande SOS-Call',
};

const KIND_DESCRIPTION: Record<LegalDocumentKind, string> = {
  cgv_b2b:
    'Cadre contractuel général entre votre entité et SOS-Expat : tarification, durée, résiliation, responsabilité, juridiction.',
  dpa: "Accord obligatoire au titre de l'article 28 RGPD : SOS-Expat agit en sous-traitant des données de vos abonnés.",
  order_form:
    "Bon de commande propre à votre accord : reprend vos paramètres spécifiques (forfait, paliers, devise, quotas).",
};

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  draft: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    label: 'En préparation',
  },
  pending_admin_validation: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-300',
    label: 'En attente de validation admin',
  },
  ready_for_signature: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
    label: 'À signer',
  },
  signed: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-800 dark:text-emerald-300',
    label: 'Signé',
  },
  superseded: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-500 dark:text-gray-400',
    label: 'Remplacé',
  },
};

const PartnerLegalDocuments: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<LegalDocumentsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{
    summary: LegalDocumentSummary;
    html: string;
  } | null>(null);
  const [signingDoc, setSigningDoc] = useState<LegalDocumentSummary | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await listPartnerLegalDocuments();
      setData(resp);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const sortedDocs = useMemo(() => {
    if (!data?.documents) return [];
    const order: Record<string, number> = { cgv_b2b: 0, dpa: 1, order_form: 2 };
    return [...data.documents].sort(
      (a, b) => (order[a.kind] ?? 99) - (order[b.kind] ?? 99),
    );
  }, [data]);

  const allSigned =
    data?.legal_status === 'signed' || data?.legal_status === 'override';
  const hasReadyToSign = sortedDocs.some((d) => d.status === 'ready_for_signature');

  const openPreview = useCallback(async (doc: LegalDocumentSummary) => {
    try {
      const detail = await getPartnerLegalDocument(doc.id);
      setPreviewDoc({ summary: doc, html: detail.rendered_html });
    } catch (err) {
      alert(`Erreur preview: ${err instanceof Error ? err.message : ''}`);
    }
  }, []);

  const handleDownload = useCallback(async (doc: LegalDocumentSummary) => {
    setDownloadingId(doc.id);
    try {
      const blob = await downloadPartnerLegalDocumentPdf(doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.kind}-v${doc.template_version || 'na'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Erreur téléchargement: ${err instanceof Error ? err.message : ''}`);
    } finally {
      setDownloadingId(null);
    }
  }, []);

  return (
    <PartnerDashboardLayout>
      <div className="space-y-6 p-4 sm:p-6">
        {/* Header */}
        <header className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white shrink-0">
            <ScrollText className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Documents légaux
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Signature électronique de votre partenariat B2B avec SOS-Expat.
              <br />
              <span className="text-xs">
                Conforme eIDAS — chaque signature est horodatée, scellée par hash SHA-256
                et opposable juridiquement.
              </span>
            </p>
          </div>
        </header>

        {/* Status banner */}
        {!loading && data && (
          <>
            {allSigned ? (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Tous les documents sont signés
                  </div>
                  <div className="text-sm text-emerald-800 dark:text-emerald-300">
                    Votre partenariat B2B est juridiquement formalisé. Vos abonnés peuvent
                    désormais bénéficier du service SOS-Call dès activation par notre équipe.
                  </div>
                </div>
              </div>
            ) : hasReadyToSign ? (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-start gap-3">
                <FileSignature className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-blue-900 dark:text-blue-200">
                    Action requise — signature de vos documents partenariat
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    Avant d'activer le service SOS-Call, merci de relire et signer
                    électroniquement les {sortedDocs.length} documents ci-dessous.
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-gray-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-200">
                    Documents non encore disponibles
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-400">
                    Notre équipe prépare votre dossier juridique. Vous serez notifié par
                    email dès que vos documents seront prêts à signer.
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Document list */}
        {loading ? (
          <div className="py-20 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin inline-block mr-2" />
            Chargement…
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-600">{error}</div>
        ) : sortedDocs.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            Aucun document légal à présenter pour le moment.
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDocs.map((doc) => {
              const badge = STATUS_BADGE[doc.status] ?? STATUS_BADGE.draft;
              const canSign = doc.status === 'ready_for_signature';
              const isSigned = doc.status === 'signed';
              return (
                <div
                  key={doc.id}
                  className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {KIND_LABEL[doc.kind] ?? doc.title}
                        </h2>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          v{doc.template_version || 'na'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {KIND_DESCRIPTION[doc.kind]}
                      </p>
                      {isSigned && doc.signed_at && (
                        <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-2">
                          Signé le{' '}
                          {new Date(doc.signed_at).toLocaleString('fr-FR', {
                            dateStyle: 'long',
                            timeStyle: 'short',
                            timeZone: 'UTC',
                          })}{' '}
                          UTC par <strong>{doc.signed_by_email}</strong>
                          {doc.signed_pdf_hash && (
                            <span
                              className="block font-mono text-[10px] break-all text-gray-500"
                              title="Empreinte SHA-256 du document signé"
                            >
                              SHA-256: {doc.signed_pdf_hash}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 lg:flex-nowrap shrink-0">
                      <button
                        type="button"
                        onClick={() => void openPreview(doc)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/40"
                      >
                        <ScrollText className="w-4 h-4" />
                        Lire
                      </button>
                      {doc.pdf_available && (
                        <button
                          type="button"
                          onClick={() => void handleDownload(doc)}
                          disabled={downloadingId === doc.id}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/40"
                        >
                          {downloadingId === doc.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          PDF
                        </button>
                      )}
                      {canSign && (
                        <button
                          type="button"
                          onClick={() => setSigningDoc(doc)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                        >
                          <FileSignature className="w-4 h-4" />
                          Signer
                        </button>
                      )}
                      {isSigned && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                          <ShieldCheck className="w-4 h-4" />
                          Signé
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewDoc && (
        <PreviewModal
          title={previewDoc.summary.title}
          html={previewDoc.html}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* Signature modal */}
      {signingDoc && (
        <SignatureModal
          doc={signingDoc}
          defaultName={
            user?.firstName || user?.displayName?.split(' ')[0] || ''
          }
          defaultEmail={user?.email || ''}
          onClose={() => setSigningDoc(null)}
          onSigned={() => {
            setSigningDoc(null);
            void reload();
          }}
        />
      )}
    </PartnerDashboardLayout>
  );
};

// ─────────────────────────────────────────────────────────────────
// Preview modal — read the full document in HTML before signing
// ─────────────────────────────────────────────────────────────────

const PreviewModal: React.FC<{
  title: string;
  html: string;
  onClose: () => void;
}> = ({ title, html, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {title}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="overflow-y-auto p-6 flex-1">
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────
// Signature modal — click-wrap with name + email + double consent
// ─────────────────────────────────────────────────────────────────

const SignatureModal: React.FC<{
  doc: LegalDocumentSummary;
  defaultName: string;
  defaultEmail: string;
  onClose: () => void;
  onSigned: () => void;
}> = ({ doc, defaultName, defaultEmail, onClose, onSigned }) => {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [confirmRead, setConfirmRead] = useState(false);
  const [accept, setAccept] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    confirmRead &&
    accept &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await signPartnerLegalDocument(doc.id, {
        signer_name: name.trim(),
        signer_email: email.trim(),
      });
      onSigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de signature');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Signature électronique
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-sm text-blue-900 dark:text-blue-200">
            Vous signez : <strong>{KIND_LABEL[doc.kind] ?? doc.title}</strong>
            <br />
            Version <span className="font-mono">{doc.template_version || 'na'}</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom du signataire
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              placeholder="Nom et prénom"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email du signataire
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              placeholder="email@entreprise.com"
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={confirmRead}
              onChange={(e) => setConfirmRead(e.target.checked)}
              disabled={submitting}
              className="mt-0.5"
            />
            <span>
              Je confirme avoir lu intégralement le document avant de le signer.
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={accept}
              onChange={(e) => setAccept(e.target.checked)}
              disabled={submitting}
              className="mt-0.5"
            />
            <span>
              <strong>J'accepte</strong> les termes du document et reconnais que cette
              signature électronique a la même valeur juridique qu'une signature
              manuscrite (eIDAS, art. 25 §2).
            </span>
          </label>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-3">
            Lors de la signature, nous enregistrons : votre nom, email, adresse IP,
            user-agent du navigateur, date et heure UTC précises, ainsi qu'une empreinte
            SHA-256 du document. Ces éléments constituent la preuve eIDAS de votre
            signature.
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="px-4 py-2 rounded-xl text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signature en cours…
              </>
            ) : (
              <>
                <FileSignature className="w-4 h-4" />
                Signer électroniquement
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerLegalDocuments;
