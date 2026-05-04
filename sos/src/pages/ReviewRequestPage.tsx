import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import { useIntl } from "react-intl";
import Layout from "../components/layout/Layout";
import ReviewForm from "../components/review/ReviewForm";
import Button from "../components/common/Button";
import { db } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";

type LoadState =
  | { kind: "loading" }
  | { kind: "not_found" }
  | { kind: "forbidden" }
  | { kind: "already_submitted" }
  | { kind: "submitted" }
  | {
      kind: "ready";
      providerId: string;
      providerName: string;
      callId: string;
      serviceType: "lawyer_call" | "expat_call";
    };

const ReviewRequestPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const intl = useIntl();
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(`/login?returnUrl=${encodeURIComponent(`/review/${requestId}`)}`);
      return;
    }
    if (!requestId) {
      setState({ kind: "not_found" });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const reqSnap = await getDoc(doc(db, "reviews_requests", requestId));
        if (cancelled) return;
        if (!reqSnap.exists()) {
          setState({ kind: "not_found" });
          return;
        }
        const data = reqSnap.data();

        if (data.clientId !== user.id) {
          setState({ kind: "forbidden" });
          return;
        }

        const callId = data.callSessionId as string;

        // Idempotency: review already submitted?
        const existingReview = await getDocs(
          query(
            collection(db, "reviews"),
            where("callId", "==", callId),
            where("clientId", "==", user.id),
            limit(1)
          )
        );
        if (cancelled) return;
        if (!existingReview.empty) {
          setState({ kind: "already_submitted" });
          return;
        }

        // Resolve provider name (best-effort)
        const providerId = data.providerId as string;
        let providerName = "";
        try {
          const provSnap = await getDoc(doc(db, "users", providerId));
          if (provSnap.exists()) {
            const p = provSnap.data();
            providerName = (p.firstName as string) || (p.name as string) || "";
          }
        } catch {
          /* provider name is optional */
        }
        if (cancelled) return;

        const serviceType: "lawyer_call" | "expat_call" =
          data.serviceType === "lawyer_call" ? "lawyer_call" : "expat_call";

        setState({
          kind: "ready",
          providerId,
          providerName,
          callId,
          serviceType,
        });
      } catch (err) {
        console.error("[ReviewRequestPage] load error:", err);
        if (!cancelled) setState({ kind: "not_found" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requestId, user, authLoading, navigate]);

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-12">
        {state.kind === "loading" && (
          <div className="text-center py-16 text-gray-500">
            {intl.formatMessage({ id: "common.loading", defaultMessage: "Chargement…" })}
          </div>
        )}

        {state.kind === "not_found" && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-3">
              {intl.formatMessage({
                id: "reviewRequest.notFound.title",
                defaultMessage: "Demande introuvable",
              })}
            </h1>
            <p className="text-gray-600 mb-6">
              {intl.formatMessage({
                id: "reviewRequest.notFound.message",
                defaultMessage:
                  "Cette demande d'avis n'existe pas ou a expiré.",
              })}
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              {intl.formatMessage({
                id: "common.backToDashboard",
                defaultMessage: "Retour au tableau de bord",
              })}
            </Button>
          </div>
        )}

        {state.kind === "forbidden" && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-3">
              {intl.formatMessage({
                id: "reviewRequest.forbidden.title",
                defaultMessage: "Accès refusé",
              })}
            </h1>
            <p className="text-gray-600 mb-6">
              {intl.formatMessage({
                id: "reviewRequest.forbidden.message",
                defaultMessage:
                  "Cette demande d'avis ne vous appartient pas.",
              })}
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              {intl.formatMessage({
                id: "common.backToDashboard",
                defaultMessage: "Retour au tableau de bord",
              })}
            </Button>
          </div>
        )}

        {state.kind === "already_submitted" && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-3">
              {intl.formatMessage({
                id: "reviewRequest.already.title",
                defaultMessage: "Avis déjà envoyé",
              })}
            </h1>
            <p className="text-gray-600 mb-6">
              {intl.formatMessage({
                id: "reviewRequest.already.message",
                defaultMessage: "Merci, nous avons bien reçu votre avis pour cet appel.",
              })}
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              {intl.formatMessage({
                id: "common.backToDashboard",
                defaultMessage: "Retour au tableau de bord",
              })}
            </Button>
          </div>
        )}

        {state.kind === "submitted" && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-3">
              {intl.formatMessage({
                id: "reviewRequest.thanks.title",
                defaultMessage: "Merci pour votre avis !",
              })}
            </h1>
            <p className="text-gray-600 mb-6">
              {intl.formatMessage({
                id: "reviewRequest.thanks.message",
                defaultMessage:
                  "Votre retour aide notre communauté à choisir les bons experts.",
              })}
            </p>
            <Button onClick={() => navigate("/dashboard")}>
              {intl.formatMessage({
                id: "common.backToDashboard",
                defaultMessage: "Retour au tableau de bord",
              })}
            </Button>
          </div>
        )}

        {state.kind === "ready" && (
          <div className="bg-white rounded-lg shadow">
            <ReviewForm
              providerId={state.providerId}
              providerName={state.providerName}
              callId={state.callId}
              serviceType={state.serviceType}
              onSuccess={() => setState({ kind: "submitted" })}
              onCancel={() => navigate("/dashboard")}
            />
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReviewRequestPage;
