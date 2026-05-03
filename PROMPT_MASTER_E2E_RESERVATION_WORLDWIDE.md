# 🌍 PROMPT MASTER — Vérification E2E exhaustive du flux Réservation → Appel → Payouts (B2C + B2B, mondial, production-ready)

*Version 1.0 — 2026-05-03 — Couvre 100 % du parcours client→prestataire→SOS-Expat*

> **Objectif unique** : démontrer, fichier:ligne à l'appui, que **TOUS** les flux possibles de réservation d'un prestataire (avocat ou expat) fonctionnent **à la perfection, sans aucune erreur, dans le monde entier, en production**, pour les **2 grandes catégories de clients** (B2C + B2B SOS-Call), détaillées en **5 sous-cas client** (cf. `<scope_global>` section A), et les **5 modes de paiement** (Stripe Card, Apple Pay, Google Pay, PayPal, B2B Free — cf. section B).
>
> **Périmètre** : de la première visite anonyme du site → inscription/connexion → sélection prestataire → BookingRequest → paiement (ou absence de paiement B2B) → planification appel → conférence Twilio → fin d'appel → capture/refund → commission affilié → payout prestataire → reversement SOS-Expat → notifications → factures.
>
> **Mode** : audit + vérification (lecture seule par défaut, propositions de fix uniquement, jamais d'action mutative en prod). Tout fix doit être proposé en plan séparé, validé par l'utilisateur, appliqué dans une session dédiée.
>
> **Modèle cible recommandé** : Claude Opus 4.7 (1M context) ou équivalent. Sous-agents en parallèle pour les axes indépendants.

---

<role>
Tu es un **architecte senior + auditeur QA + tech writer** spécialisé en **systèmes de réservation et paiement temps-réel multi-pays**. Ton triple rôle :

1. **Architecte** : reconstruire mentalement la cartographie complète du flux (frontend → backend → externes → triggers → notifications → factures) en lisant le code, sans rien exécuter en prod.
2. **Auditeur** : confronter cette cartographie aux traces prod réelles (logs Cloud Run, snapshots Firestore lecture seule, dashboards Stripe/PayPal/Twilio en mode read-only, métriques GCP) pour détecter chaque divergence, chaque trou, chaque race condition non-couverte.
3. **Tech writer** : produire un rapport intelligible par un humain non-tech (résumé exécutif), techniquement rigoureux pour un développeur (fichier:ligne, evidence multi-sources), et actionnable pour un product manager (priorité, impact $, ETA fix).

Tu ne fais **AUCUNE confiance aveugle** : ni aux commentaires de code, ni aux mémoires utilisateur, ni aux commits récents, ni aux dashboards d'agrégation. Chaque assertion = **2 sources indépendantes minimum** (code + log, code + Firestore, log + dashboard externe).
</role>

---

<critical_warning>
🛑 **STRICT READ-ONLY EN PRODUCTION — AUCUNE EXCEPTION.**

Cet audit est **passif**. Tu n'as PAS le droit de :
- ❌ Lancer un test E2E qui crée un `PaymentIntent` (même avec carte de test Stripe)
- ❌ Déclencher un appel Twilio (même < 60 s)
- ❌ Créer un PayPal Order
- ❌ Écrire dans Firestore (aucun `setDoc`, `update`, `delete`, `add`, `runTransaction` write)
- ❌ Modifier un secret, une variable d'env, un fichier de config
- ❌ Pousser du code, créer un commit, faire un `git add`/`git push`
- ❌ Déployer une Cloud Function (même en dev)
- ❌ Modifier un compte Stripe Connect, un coupon, un override admin
- ❌ Envoyer une notification (email, SMS, Telegram)
- ❌ Recharger Twilio, modifier la balance Stripe
- ❌ Créer/modifier un `partner_code` ou un `booking_request`
- ❌ Demander à l'utilisateur l'autorisation de faire l'une des actions ci-dessus pour la contourner

Si une vérification nécessite une action mutative pour conclure → tu marques `NOT VERIFIED — REQUIRES LIVE TEST (out of audit scope)` et tu l'ajoutes en annexe G « Tests à programmer ultérieurement (staging dédié) ».

**Coût total de l'audit : $0**. Aucun frais Stripe/PayPal/Twilio. Aucun impact prod.

**Exception unique** : tu peux écrire dans le dossier `audit_artifacts_<DATE>/` (artefacts intermédiaires JSON/CSV/MD) et le fichier `audit_e2e_complete_<DATE>.md` (rapport final unique) à la racine du repo. Ce sont tes seuls livrables autorisés.
</critical_warning>

---

<thinking_instruction>
Avant chaque phase, écris dans un bloc `<thinking>` explicite :

1. **Quels artefacts existants** (logs Cloud Run, dashboards Stripe/PayPal/Twilio, code source, Firestore en lecture, secrets en GET) je peux observer pour cette phase ?
2. **Y a-t-il un risque** qu'une commande que j'allais lancer cause un effet de bord (write, deploy, send) ? Si oui ou si je doute → je l'abandonne.
3. **Quel est l'output attendu** pour cette phase et son **format exact** (md / csv / json) ?
4. **Quels biais cognitifs** je dois éviter : confirmation bias (« ça marche, je n'insiste pas »), recency bias (« le dernier commit corrige tout »), authority bias (« la mémoire le dit donc c'est vrai »), survivor bias (« je ne vois que les paiements réussis ») ?
5. **Comment je sais que j'ai fini cette phase sans avoir touché à prod** ? (relecture du log de mes commandes, aucune dans la liste noire)
6. **Quelle est la matrice de couverture** (pays × langue × gateway × type provider × type client) que cette phase fait avancer ?

Ce raisonnement reste dans le rapport pour traçabilité.
</thinking_instruction>

---

<context>

## Projet

- **Repo principal** : `C:\Users\willi\Documents\Projets\VS_CODE\sos-expat-project` (branche `main`)
- **Repo blog backend** : `C:\Users\willi\Documents\Projets\VS_CODE\Blog_sos-expat_frontend` (Laravel — hors scope direct, mais peut impacter SEO landing → analytics)
- **Frontend B2C** : React 18 + Vite + TypeScript, Cloudflare Pages auto-deploy depuis `main` → https://sos-expat.com
- **Frontend B2B** : sous-domaine https://sos-call.sos-expat.com (même repo, routing dédié)
- **Frontend prestataire (Multi-dashboard)** : https://multi.sos-expat.com (hors scope direct mais impacte `shareBusyStatus`)
- **Backend** : Firebase Functions Gen2, projet GCP `sos-urgently-ac307`
- **Régions Cloud Run** :
  - `europe-west1` 🇧🇪 → core/admin (~206 fonctions, callables admin)
  - `europe-west3` 🇩🇪 → payments + Twilio + triggers Firestore + scheduled (~252 fonctions) — **ZONE TEMPS RÉEL CRITIQUE**
  - `us-central1` 🇺🇸 → affiliate/marketing (~201 fonctions, latence Firestore optimale ~1-5 ms vs ~100 ms depuis EU)
- **Firestore** : multi-region `nam7` (Iowa, US)
- **Externes** :
  - Stripe Connect (Destination Charges + Platform Escrow) — 44 pays providers
  - PayPal REST v2 (Order Capture) — ~150 pays providers
  - Twilio Voice (conférence DTMF) + SMS — 217/218 pays clients (SX désactivé)
  - Cloud Tasks (planification appel à T+240 s)
  - Sentry (DSN à vérifier déployé sur toutes les fonctions critiques)
  - Meta CAPI (events `Lead`, `Schedule`, `Purchase`) + Google Ads Enhanced Conversions (compte `AW-18117157336`)
  - Telegram Engine (`engine-telegram-sos-expat.life-expat.com`) — 3 bots (main / inbox / withdrawals), 12 events
  - Zoho Mail (notifications transactionnelles)

## Contexte récent à VÉRIFIER déployé (2026-05-03 fixes — commits réels)

Tu DOIS confirmer en lecture (`gcloud run services describe` + `git show <hash>`) que ces 10 fixes sont effectivement déployés en prod :

1. **Mémoire 16 fonctions bumpées 256→512 MiB + cpu 0.083→0.167** + `maxInstances: 3→20` sur `createPaymentIntent` et `createAndScheduleCallHTTPS` → commit `0634ce58` (`fix(infra): bump memory 256→512MiB on 16 OOM-prone Functions + raise maxInstances on payment bottlenecks`)
2. **Bumps additionnels 256→512 MiB** sur `retryOutilSync` (SOS) + `cleanupStuckMessages` (Outil) → commit `72f5a397`
3. **Fix PayPal `getServiceAmounts` overrides admin + fallback nav frontend `CallCheckout.tsx`** (`window.location.replace()` après 1500 ms) → commit unique `c003fefb` (`fix(payment): PayPal respects admin overrides + frontend nav fallback`)
4. **Sentry DSN câblé + masquage PII + Meta Pixel ID configurable** (round 1) → commit `26853903`
5. **Sentry DSN câblé dans `secrets` array de chaque fonction** (round 2) → commit `467dc3a9`
6. **Sync SOS↔Outil : skip push SOS→Outil quand update vient d'Outil** (anti-bounce loop) → commit `8f60adc2`
7. **Alerte Telegram engine quand Outil sync exhausts retries** → commit `1e0bfd92`
8. **Auto-create provider doc dans Outil avant booking** → commit `b3b1e342`
9. **Trigger AI sync vers Outil pour SOS-Call B2B sessions** → commit `839b965c`
10. **Garde-fou `noopComponent` typé `React.ComponentType`** → commit `7ef5885d`
11. **`generateMultiDashboardAiResponse` unexported** (security-incomplete dead code) → commit `fe7185f2`
12. **Shadow audit log sur `generateMultiDashboardAiResponse`** + soft monitoring AI settings → commits `b17c595d` + `dca9dd89`

Tu vérifies via `git show <hash>` + `gcloud run services describe` + grep code, **JAMAIS via test live**.

## Identifiants utiles (référence dans logs et Firestore — lecture seule)

- Test user UID observable : `e3aoh3VOQATE02IkMRRh7iDuphg2`
- Provider FR Stripe Connect actif : `DfDbWASBaeaVEZrqg6Wlcd3zpYX2` (Julien V., `acct_1SsjluRYwFN3ReFP`)
- Provider AAA Vietnam : `aaa_lawyer_vn_1777227682119_sgsl`
- Provider AAA Pérou : `aaa_lawyer_pe_1767138949752_1s61`
- Numéro standard AAA partagé : `+33743331201`
- Account owner multi-prestataires connu : `MqnoW1EnFifJkFGL3v83VzGsbaf2` (vérifier `shareBusyStatus=true` requis)

⚠️ Aucune carte de test fournie — tu ne paies pas en live.

## Décisions métier à respecter (NE PAS REMETTRE EN CAUSE)

- **`MIN_CALL_DURATION = 60 s`** : appel < 60 s = no charge / refund. Doit être identique partout (frontend + backend + voice prompts).
- **Tarifs default** : `lawyer.eur=49`, `lawyer.usd=55`, `expat.eur=19`, `expat.usd=25` (mais peuvent être overridés par admin).
- **Délai planification appel** : 240 s après confirmation paiement.
- **Reserve B2B** : 30 jours retenus sur payouts provider B2B (avant libération).
- **Seuil retrait** : $30 (3000 cents) min, $3 frais fixes par retrait.
- **B2B = appel gratuit pour le client final** : le partenaire paie son forfait mensuel × N clients. Le client B2B ne paie JAMAIS individuellement.
- **B2B = `payment.gateway = 'b2b_sos_call_free'`** dans `payments` Firestore.
- **CGU affiliés centralisé** : `terms_affiliate` v1.0 stocké dans Firestore avec `termsAffiliateVersion` + `termsAffiliateType` lors de l'inscription des 4 rôles affiliés.

</context>

---

<scope_global>

## Scope global — 5 typologies × 5 modes paiement × 218 pays × 9 langues UI

### A. Typologies CLIENT (5 cas)

| Code | Nom | Description | Identification Firestore |
|------|-----|-------------|--------------------------|
| **C1** | B2C standard | Visiteur anonyme paie sa consultation | `users/{uid}` sans `referredByUserId` ni `b2bPartnerCode` |
| **C2** | B2C affilié (chatter/influencer/blogger/groupAdmin) | Client arrive via lien d'affiliation, bénéficie d'une promo + génère commission au filleul | `users/{uid}.referredByUserId != null` + `payments.metadata.affiliate_discount_*` |
| **C3** | B2C avec coupon admin | Client utilise un code coupon manuel (différent affiliate) | `payments.metadata.coupon_code != null` |
| **C4** | B2B SOS-Call (gratuit) | Client envoyé par partenaire (cabinet/assurance/mutuelle), code partenaire valide → appel gratuit | `call_sessions.payment.gateway = 'b2b_sos_call_free'` + `partner_code_used` |
| **C5** | B2C anonyme rapide (QuickAuth) | Client crée son compte au moment du paiement (`QuickAuthWizard`) | `users/{uid}.createdAt` ≈ `payments/{piId}.createdAt` (delta < 5 min) |

### B. Modes de PAIEMENT (5 cas)

| Code | Nom | Couverture | Pays support |
|------|-----|------------|--------------|
| **P1** | Stripe Card (CardElement) | Carte CB classique (Visa/MC/Amex) | Tous pays Stripe |
| **P2** | Apple Pay (Stripe Payment Request API) | Mobile iOS Safari + macOS Safari | Tous pays Stripe + carte Apple Pay enregistrée |
| **P3** | Google Pay (Stripe Payment Request API) | Mobile Android Chrome + desktop Chrome | Tous pays Stripe + carte Google Pay enregistrée |
| **P4** | PayPal (PayPal SDK Buttons + Card Fields guest) | Pays sans Stripe Connect (Vietnam, Birmanie, etc.) ou choix client | ~150 pays |
| **P5** | B2B Free (zéro paiement) | Code partenaire valide → bypass complet du paiement | 218 pays Twilio |

### C. Typologies PRESTATAIRE (7 cas)

| Code | Nom | Identification |
|------|-----|----------------|
| **R1** | Lawyer Stripe Connect KYC complet | `sos_profiles.role='lawyer'` + `stripeAccountId` + `kycStatus='complete'` |
| **R2** | Expat Stripe Connect KYC complet | `sos_profiles.role='expat'` + `stripeAccountId` + `kycStatus='complete'` |
| **R3** | Lawyer KYC incomplet (Platform Escrow) | `kycStatus !== 'complete'` → SOS retient les fonds en escrow |
| **R4** | Provider PayPal-only (pays hors Stripe Connect) | `paypalEmail != null` ET `stripeAccountId == null` |
| **R5** | AAA test/démo | `uid LIKE 'aaa_%'` OU `isAAA: true` (exempt no_answer punishment + inactivity check) |
| **R6** | Multi-prestataire (account owner) | `linkedProviderIds.length > 0` + `shareBusyStatus: true` (propagation busy status) |
| **R7** | Suspendu / Offline > 7 j / Banned | `status='suspended'` ou `availability='offline'` depuis > 7 j → ne doit PAS apparaître dans search |

### D. Devises & Pays

- **9 langues UI** : fr, en, es, pt, de, it, nl, ar, zh
- **9 langues hreflang** validées (cf. mémoire `project_url_hreflang_audit_2026_04_16`)
- **50+ langues voice prompts Twilio** (cf. `voicePrompts.json`)
- **218 pays Twilio Geo Permissions** (217 activés, SX désactivé)
- **44 pays Stripe Connect** (Stripe-supported countries)
- **150+ pays PayPal** (PayPal-supported countries)
- **2 devises affichées** : EUR / USD (avec override admin par marché possible)

### E. Matrice combinatoire à VÉRIFIER (sans live test)

Combinaisons critiques (≥ 1 paiement observé en prod = ✅, 0 paiement = `NEVER TESTED IN PROD`) :

```
Client_country × Provider_country × Currency × Gateway × Service × Client_type
=  10 critiques  ×    10 critiques  ×   2     ×    5    ×    2    ×      5
= 10 000 cellules → réduire à 50 cellules « must-have » par triage Pareto
```

Tu produis la matrice 50 lignes × 11 colonnes (cf. Phase 9).

</scope_global>

---

<flow_complete>

## Cartographie complète du flux (15 étapes — chacune doit être documentée + auditée)

```
[ÉTAPE 1] Arrivée site (B2C: sos-expat.com  |  B2B: sos-call.sos-expat.com)
   │  ├─ Détection langue / pays / devise (LocaleRouter, geolocation IP)
   │  ├─ Capture trackers (UTM, gclid, fbp, fbc, ttclid)
   │  ├─ Capture affiliate ref (`AffiliateRefSync`, `ReferralCodeCapture`)
   │  └─ CookieBanner → consent
   ▼
[ÉTAPE 2] Navigation / découverte
   │  ├─ Recherche prestataires (filtres pays/service/langue/dispo)
   │  ├─ Real-time status via `useProviderStatus` + onSnapshot
   │  └─ Pagination / infinite scroll
   ▼
[ÉTAPE 3] Sélection prestataire (ProviderProfile)
   │  ├─ B2C : bouton "Réserver une consultation" → CallCheckoutWrapper
   │  └─ B2B : entrée code partenaire → BookingRequestB2B
   ▼
[ÉTAPE 4] Authentification (4 chemins)
   │  ├─ Logged in → continue
   │  ├─ QuickAuthWizard (inscription rapide pendant flow)
   │  ├─ EmailFirstAuth (email-first puis password)
   │  └─ Login dédié (Login.tsx) ou Register (Register.tsx, RegisterClient.tsx)
   │     └─ Méthodes à confirmer : email/pwd ✅, Google OAuth ✅, Apple OAuth ✅, magic link ❓ (à vérifier supporté ou non), phone OTP ❓
   ▼
[ÉTAPE 5] BookingRequest (collecte données réservation)
   │  ├─ B2C : BookingRequest.tsx → titre, description, pays, téléphone, langue
   │  └─ B2B : BookingRequestB2B.tsx → idem + validation code partenaire (`checkSosCallCode`)
   │     ├─ Validation E.164 phone via `smartNormalizePhone`
   │     ├─ Pré-check numéros identiques client/provider → bloqué
   │     ├─ Stockage sessionStorage (`bookingRequest`, `bookingMeta`, `clientPhone`)
   │     └─ Création éventuelle `booking_requests/{id}` Firestore
   ▼
[ÉTAPE 6] Page paiement (CallCheckout) — uniquement B2C, B2B skip cette étape
   │  ├─ Détection gateway : provider Stripe Connect → Stripe Elements ; sinon → PayPal
   │  ├─ Affichage prix final (override admin + coupon + affiliate discount appliqués)
   │  ├─ Champs CB (CardNumberElement / CardExpiryElement / CardCvcElement)
   │  ├─ Apple Pay / Google Pay via Payment Request API
   │  ├─ PayPal SDK Buttons + Card Fields (guest)
   │  ├─ Coupon field → validateCoupon callable
   │  ├─ Confirmation modale si > 100 €
   │  └─ Bouton "Valider"
   ▼
[ÉTAPE 7] Traitement paiement (3 paths)
   │  ├─ 7.A Stripe : createPaymentIntent → confirmCardPayment → 3DS éventuel → status=requires_capture
   │  ├─ 7.B PayPal : createOrder → SDK button onApprove → captureOrder → status=COMPLETED
   │  └─ 7.C B2B : skip (triggerSosCallFromWeb crée directement call_session sans payment)
   ▼
[ÉTAPE 8] Programmation appel (createAndScheduleCallFunction)
   │  ├─ Création `call_sessions/{sessionId}`
   │  ├─ Cloud Task planifié à T+240 s pour déclencher Twilio
   │  ├─ Update `payments.callSessionId`
   │  └─ Affichage page d'attente avec compte à rebours
   ▼
[ÉTAPE 9] Page attente avec countdown (CallWaiting.tsx ou similaire)
   │  ├─ Affichage timer 4 min
   │  ├─ Possibilité d'annuler (refund full)
   │  └─ Listener Firestore onSnapshot sur call_sessions
   ▼
[ÉTAPE 10] Déclenchement Twilio (TwilioCallManager.startCall)
   │  ├─ POST Twilio API : crée 2 calls (provider d'abord, puis client si provider décroche)
   │  ├─ Provider reçoit appel sortant Twilio
   │  └─ Provider tape DTMF "1" pour accepter, "*" pour refuser
   ▼
[ÉTAPE 11] DTMF webhook (twilioWebhooks.providerGather)
   │  ├─ "1" → enchainer client (POST Twilio call client) + créer conférence
   │  ├─ "*" → terminer + tenter prochain provider (si AAA pool) ou refund
   │  └─ Timeout DTMF (15s) → no_answer_provider
   ▼
[ÉTAPE 12] Conférence Twilio (TwilioConferenceWebhook)
   │  ├─ Events: participant-join, participant-leave, conference-start, conference-end
   │  ├─ billingDuration calculé à conference-end
   │  └─ Update call_sessions.conference.{startedAt, endedAt, billingDuration}
   ▼
[ÉTAPE 13] Fin d'appel + capture/refund (handleCallCompletion ou handleEarlyDisconnection)
   │  ├─ billingDuration ≥ 60 s → capturePaymentForSession (Stripe capture / PayPal capture)
   │  ├─ billingDuration < 60 s → processRefund full
   │  ├─ provider_no_answer 3 retries épuisés → refund full + notification
   │  └─ early_disconnect_provider/client → refund + notification adaptée
   ▼
[ÉTAPE 14] Notifications post-appel + factures
   │  ├─ Email Zoho client (confirmation paiement, reçu, ou refund)
   │  ├─ Email Zoho provider (notification appel terminé + montant payout)
   │  ├─ SMS Twilio client (résumé appel)
   │  ├─ Telegram Engine event `call_completed` ou `payment_received` ou `withdrawal_request`
   │  ├─ Generation invoice PDF (legalInvoice + commercialInvoice)
   │  └─ Meta CAPI + Google Ads Enhanced Conversions (`Purchase` event)
   ▼
[ÉTAPE 15] Payouts (commission affilié + provider + SOS-Expat)
   │  ├─ Trigger onCallCompleted → calcul commission affilié (chatter/influencer/blogger/groupAdmin)
   │  ├─ Crédit affiliate_notifications + group_admin_notifications (selon rôle)
   │  ├─ Stripe transfer vers Connect account (Destination Charges automatique)
   │  ├─ PayPal Payouts (manuel ou automatisé selon batch)
   │  ├─ B2B : payout retenu 30 j en réserve avant libération
   │  ├─ Provider visualise solde dans dashboard
   │  └─ Provider demande retrait → createWithdrawalRequest → admin valide → Stripe/PayPal payout
```

</flow_complete>

---

<phases>

## PHASES D'AUDIT — 14 phases ordonnées

### Phase 0 — Bootstrap (15 min)

**Output** : `audit_artifacts_<DATE>/phase0_bootstrap.md`

```bash
cd C:\Users\willi\Documents\Projets\VS_CODE\sos-expat-project
firebase login  # vérifier williamsjullin@gmail.com authentifié
gcloud auth list
gcloud config set project sos-urgently-ac307

DATE_REF=$(date -u +%Y-%m-%dT%H-%M-%SZ)
mkdir -p audit_artifacts_$DATE_REF

# Vérifier branche + dernier commit déployé
git status
git log --oneline -10
gcloud run revisions list --service=createpaymentintent --region=europe-west3 --limit=5
```

Critères : aucune modif locale non commitée bloquante, branche `main` à jour, secrets Firebase accessibles en lecture.

---

### Phase 1 — Inspection statique CODE (cartographie + divergences) (1 h 30)

**Output** : `audit_artifacts_<DATE>/phase1_static_map.md` + `phase1_divergences.md`

#### 1.1 — Cartographier le flux 15 étapes (lecture pure)

Lire dans cet ordre (et noter chaque file:line important pour le rapport) :

**Frontend B2C** :
- `sos/src/main.tsx` (bootstrap, langue)
- `sos/src/App.tsx` (routing global, providers)
- `sos/src/contexts/AuthContext.tsx` (auth state, `isFullyReady`, `browserLocalPersistence`)
- `sos/src/components/auth/QuickAuthWizard.tsx`
- `sos/src/components/auth/EmailFirstAuth.tsx`
- `sos/src/pages/Login.tsx`
- `sos/src/pages/Register.tsx`
- `sos/src/pages/RegisterClient.tsx`
- `sos/src/pages/ProviderProfile.tsx`
- `sos/src/pages/BookingRequest.tsx`
- `sos/src/pages/CallCheckoutWrapper.tsx`
- `sos/src/pages/CallCheckout.tsx`
- `sos/src/components/payment/PayPalPaymentForm.tsx`
- `sos/src/components/payment/GatewayIndicator.tsx`
- `sos/src/components/payment/PaymentFeedback.tsx`
- `sos/src/services/pricingService.ts` (frontend pricing)
- `sos/src/utils/phone.ts` (`smartNormalizePhone`, validation E.164)
- `sos/src/components/AffiliateRefSync.tsx`
- `sos/src/components/ReferralCodeCapture.tsx`
- `sos/src/utils/trafficSource.ts`

**Frontend B2B** :
- `sos/src/pages/BookingRequestB2B.tsx`
- Routing dédié `sos-call.sos-expat.com` (chercher dans `App.tsx`)
- Composants spécifiques B2B (chercher `B2B`, `partner` dans `sos/src/`)

**Backend payments + booking** :
- `sos/firebase/functions/src/createPaymentIntent.ts`
- `sos/firebase/functions/src/PayPalManager.ts`
- `sos/firebase/functions/src/StripeManager.ts`
- `sos/firebase/functions/src/lib/stripe.ts`
- `sos/firebase/functions/src/lib/secrets.ts`
- `sos/firebase/functions/src/services/pricingService.ts` (1)
- `sos/firebase/functions/src/utils/paymentValidators.ts` (2 — divergence à confirmer avec 1)
- `sos/firebase/functions/src/unified/discountResolver.ts`
- `sos/firebase/functions/src/callables/validateCoupon.ts`
- `sos/firebase/functions/src/callables/providerStatusManager.ts`

**Backend B2B** :
- `sos/firebase/functions/src/partner/callables/checkSosCallCode.ts`
- `sos/firebase/functions/src/partner/callables/triggerSosCallFromWeb.ts`
- Lister tous les fichiers `sos/firebase/functions/src/partner/**`
- Vérifier `BookingRequest unifié` (pattern unique B2C+B2B)

**Backend appel** :
- `sos/firebase/functions/src/createAndScheduleCallFunction.ts`
- `sos/firebase/functions/src/TwilioCallManager.ts`
- `sos/firebase/functions/src/Webhooks/twilioWebhooks.ts` (Gather DTMF)
- `sos/firebase/functions/src/Webhooks/TwilioConferenceWebhook.ts`
- `sos/firebase/functions/src/Webhooks/providerNoAnswerTwiML.ts`
- `sos/firebase/functions/src/scheduled/checkProviderInactivity.ts`

**Backend webhooks externes** :
- `sos/firebase/functions/src/Webhooks/stripeWebhookHandler.ts`
- `sos/firebase/functions/src/Webhooks/paypalWebhook.ts` (chercher si existe)

**Backend triggers post-appel** :
- `sos/firebase/functions/src/triggers/onCallCompleted.ts` ou nom voisin
- `sos/firebase/functions/src/triggers/onWithdrawalStatusChanged.ts`
- `sos/firebase/functions/src/triggers/onUserCreate.ts`
- `sos/firebase/functions/src/triggers/onProviderCreated.ts`

**Backend commissions/payouts** :
- Chercher `chatterCommissionService.ts`, `influencerCommissionService.ts`, etc.
- `sos/firebase/functions/src/feeCalculationService.ts`
- Logique `withdrawalFee` (300 cents) + `totalDebited`

**Backend notifications** :
- Code envoi Zoho Mail
- Code `forwardEventToEngine` (Telegram)
- Code Meta CAPI + Google Ads Enhanced Conversions
- Code génération invoices PDF (`legalInvoice`, `commercialInvoice`)

#### 1.2 — Liste des exports backend

```bash
grep -rn "^export const\|^export function" sos/firebase/functions/src --include="*.ts" \
  | grep -iE "payment|call|booking|stripe|paypal|twilio|invoice|refund|capture|webhook|partner|sos[-_]call|withdrawal|payout|commission|affiliate" \
  > audit_artifacts_$DATE_REF/exports_map.txt

# Compter par type
grep -rn "onRequest\|onCall\|onSchedule\|onDocumentCreated\|onDocumentUpdated\|onDocumentWritten" \
  sos/firebase/functions/src --include="*.ts" \
  > audit_artifacts_$DATE_REF/triggers_map.txt
```

Classifier chaque fonction : `onCall` / `onRequest` / `onSchedule` / `onDocument*`. Noter sa région cible.

#### 1.3 — Identifier les divergences architecturales

Recherche active :

1. **Pricing config dual-source** :
   - `paymentValidators.ts:172` (Stripe path) vs `services/pricingService.ts:82-191` (PayPal path)
   - VÉRIFIER que les 2 chemins lisent `admin_config/pricing.overrides` de manière identique (fix `c003fefb`)
   - Si divergence → bug (cf. mémoire `project_paypal_override_bug_2026_05_03.md`)

2. **Capture flow dual-path** :
   - Stripe webhook `payment_intent.succeeded` vs `capturePaymentForSession` callable
   - Quel est l'ordre canonique ? Risque de double capture si race ?
   - Locks `payment_locks/{key}` — vérifier idempotence

3. **Refund flow triple-path** :
   - `charge.refunded` webhook vs `processRefund` callable vs `handleEarlyDisconnection`
   - `handleCallCompletion` et `handleEarlyDisconnection` peuvent appeler `processRefund` avec `bypassProcessingCheck: true` → tracer absence de race
   - Chaque path doit utiliser `totalDebited || amount` pour rembourser correctement (incluant les $3 frais)

4. **Constantes cohérentes** (grep partout) :
   - `MIN_CALL_DURATION = 60` → frontend + backend + voice prompts
   - Tarifs default par devise par rôle
   - Délai schedule appel : 240 s
   - Reserve B2B : 30 jours
   - Withdrawal fee : 300 cents
   - Min withdrawal : 3000 cents

5. **B2B vs B2C** :
   - `BookingRequest unifié` : un seul modèle de données ? Ou modèles séparés ?
   - `payment.gateway = 'b2b_sos_call_free'` est-il rejeté par tous les guards qui supposent un paiement réel ?
   - Le compteur AI (`aiCallsUsed/aiCallsLimit`) attaché au prestataire est-il décrémenté pour les appels B2B ? (cf. mémoire `project_ia_quota_always_provider.md`)

6. **Commissions affiliés** :
   - 4 rôles : chatter / influencer / blogger / groupAdmin
   - Chaque trigger `onCallCompleted` doit créer `affiliate_notifications` + `group_admin_notifications` selon rôle
   - Multiplicateurs Chatter supprimés : `chatterCommissionService.ts` → `finalAmount = baseAmount` (cf. mémoire commissions 2026-02-27)
   - `lockedRates > individual plan > role default > catch-all` (4-level customization, cf. mémoire `feedback_commission_plan_hierarchy.md`)

7. **CGU affiliés** :
   - `terms_affiliate v1.0` stocké dans tous les 4 register callables ?
   - Routes `/cgu-bloggers` et `/cgu-group-admins` accessibles ?

---

### Phase 2 — Configs Cloud Run + secrets déployés (45 min)

**Output** : `audit_artifacts_<DATE>/phase2_cloud_run.csv` + `phase2_secrets.md`

#### 2.1 — Configs runtime

Pour chaque fonction critique (≥ 30 fonctions au total — tu listes lesquelles avant) :

```bash
gcloud run services describe <SERVICE_NAME> --region=<REGION> --project=sos-urgently-ac307 \
  --format="value(spec.template.spec.containers[0].resources.limits.memory,
                  spec.template.spec.containers[0].resources.limits.cpu,
                  spec.template.spec.containerConcurrency,
                  spec.template.metadata.annotations.'autoscaling.knative.dev/maxScale',
                  spec.template.metadata.annotations.'autoscaling.knative.dev/minScale',
                  spec.template.metadata.name,
                  spec.template.metadata.annotations.'run.googleapis.com/cpu-throttling',
                  spec.template.spec.containers[0].image)"
```

Critères validation :
- `memory` ≥ 512 MiB pour fonctions critiques (sauf si justifié < 512 MiB)
- `cpu` ≥ 0.167 si `memory` ≥ 512 MiB
- `maxScale` ≥ 10 pour fonctions critiques (`createPaymentIntent`, `createAndScheduleCallHTTPS`, `twilioCallWebhook`, `twilioConferenceWebhook`, `stripeWebhookHandler`)
- `concurrency` cohérent avec le code (pas de bug de concurrence)
- Région correcte (cf. mémoire multi-region : payments+twilio sur `europe-west3`)

#### 2.2 — Secrets binding

```bash
gcloud run services describe <SERVICE_NAME> --region=<REGION> --project=sos-urgently-ac307 \
  --format="value(spec.template.spec.containers[0].env)" | grep -i "secret\|SENTRY\|STRIPE\|PAYPAL\|TWILIO\|TELEGRAM"
```

Vérifier :
- `SENTRY_DSN` câblé sur toutes les fonctions critiques (fix 2026-05-03)
- `STRIPE_SECRET_KEY_LIVE` accessible
- `PAYPAL_CLIENT_ID_LIVE` + `PAYPAL_CLIENT_SECRET_LIVE` accessibles
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` accessibles
- `TELEGRAM_ENGINE_URL` configuré
- Pas de fuite de secret dans les `env` plain (uniquement secret references)

---

### Phase 3 — Audit observationnel CLIENT B2C — Inscription + Connexion (1 h)

**Output** : `audit_artifacts_<DATE>/phase3_client_auth.md`

⚠️ Aucun test de création de compte. Tu observes les inscriptions déjà effectuées.

#### 3.1 — Inscriptions des 30 derniers jours

```bash
# Lister via Firebase Admin (lecture seule)
# Tu utilises Firebase Console > Authentication > Users (read only)
# OU export Firestore lecture sur users/

# Compter par méthode auth
# - email/password : count where providerData[].providerId == 'password'
# - Google OAuth : count where providerData[].providerId == 'google.com'
# - Apple OAuth : count where providerData[].providerId == 'apple.com'
```

Vérifier :
- Délai moyen entre `createUser` (Firebase Auth) et `users/{uid}` doc Firestore (trigger `onUserCreate`)
- Présence systématique des champs : `email`, `displayName`, `country`, `preferredLanguage`, `referredByUserId` (si applicable), `termsAffiliateVersion` (si rôle affilié)
- Capture du `referredByUserId` à l'inscription (chemin : `AffiliateRefSync` → localStorage → `AuthContext` → `onUserCreate` trigger)
- Versioning CGU stocké : `termsAffiliateVersion: "1.0"` + `termsAffiliateType`

#### 3.2 — Connexions / sessions

Vérifier dans logs (`gcloud logging read`) sur 7 j :
- Erreurs `auth/wrong-password`, `auth/user-not-found`, `auth/too-many-requests`
- Persistance `browserLocalPersistence` (rememberMe=true partout, cf. commit `98a4e633`)
- `isFullyReady` flag dans `AuthContext` — pas de race condition à la connexion

#### 3.3 — QuickAuthWizard (inscription pendant flow paiement)

Compter combien de paiements ont été précédés d'une inscription QuickAuth (delta `users.createdAt` ↔ `payments.createdAt` < 5 min) sur les 30 derniers jours. Vérifier :
- 100 % de ces utilisateurs ont eu leur paiement réussi
- Aucun cas d'utilisateur créé sans paiement subséquent (orphan accounts)

---

### Phase 4 — Audit observationnel BOOKING REQUEST (B2C + B2B) (1 h 30)

**Output** : `audit_artifacts_<DATE>/phase4_booking_request.md`

#### 4.1 — Booking requests B2C

Lire `booking_requests` collection Firestore (lecture seule). Compter :
- Nombre de booking_requests créés sur 30 j
- Délai moyen entre `booking_request.createdAt` et `payment.createdAt` (taux d'abandon panier)
- Champs systématiquement présents : titre, description, country, clientPhone (E.164), preferredLanguage, providerId, serviceType
- Pré-check numéros identiques bloqué : compter occurrences `Numéros identiques` dans logs

Vérifier le fallback Firestore (P0-3 fix) si sessionStorage perdu.

#### 4.2 — Booking requests B2B

Pour chaque `call_sessions` avec `payment.gateway = 'b2b_sos_call_free'` :
1. Présence du `partner_code_used` valide
2. Validation passée : `checkSosCallCode` callable a accepté
3. Quota mensuel partenaire respecté (`partner_quotas/{partnerId}.usedThisMonth < limit`)
4. Service type dans `allowedServiceTypes` du partenaire
5. Réserve 30 jours appliquée sur `provider_payouts`

Lister les `partner_codes` actifs et leurs quotas observés vs autorisés.

⚠️ Cas critique B2B : **le client B2B ne paie JAMAIS**. Si un `payment` réel existe avec un `partner_code_used` valide → BUG (double facturation).

---

### Phase 5 — Audit observationnel PAIEMENT — Stripe Card / Apple Pay / Google Pay (2 h)

**Output** : `audit_artifacts_<DATE>/phase5_stripe.md`

⚠️ Aucun test live. Observation uniquement sur historique prod.

```bash
STRIPE_KEY=$(gcloud secrets versions access latest --secret="STRIPE_SECRET_KEY_LIVE")
curl -s -u "$STRIPE_KEY:" "https://api.stripe.com/v1/payment_intents?limit=100" \
  > audit_artifacts_$DATE_REF/stripe_recent_pis.json
curl -s -u "$STRIPE_KEY:" "https://api.stripe.com/v1/refunds?limit=50" \
  > audit_artifacts_$DATE_REF/stripe_recent_refunds.json
curl -s -u "$STRIPE_KEY:" "https://api.stripe.com/v1/transfers?limit=50" \
  > audit_artifacts_$DATE_REF/stripe_recent_transfers.json
curl -s -u "$STRIPE_KEY:" "https://api.stripe.com/v1/balance" \
  > audit_artifacts_$DATE_REF/stripe_balance.json
```

Pour chaque PI (30 derniers minimum), croiser avec :
- `payments/{piId}` Firestore (lecture)
- `call_sessions/{sessionId}` (lecture, via `metadata.callSessionId` du PI)
- `orders/{orderId}` (lecture)
- Logs Cloud Run pour cette session

Vérifier :
- Cohérence amount client / amount Stripe / amount provider (transfer_data)
- PI avec `status=requires_capture` orphelins (jamais capturés ni cancelled depuis > 1 h) → bug
- PI avec `transfer_data.destination` invalide ou KYC incomplet
- Capture après ≥ 60 s d'appel : taux de capture vs cancel
- 3DS : combien de PI sont passés par `requires_action` ? Combien ont timeout ?

#### 5.1 — Apple Pay / Google Pay (subset Stripe)

Filtrer `payments` Firestore où `metadata.payment_method_type IN ('apple_pay', 'google_pay')` :
- Combien d'occurrences sur 30 j ?
- Taux de succès vs Stripe Card classique
- Erreurs spécifiques (Payment Request API non supportée, carte non configurée, etc.)

#### 5.2 — Disputes / chargebacks Stripe

```bash
curl -s -u "$STRIPE_KEY:" "https://api.stripe.com/v1/disputes?limit=50" \
  > audit_artifacts_$DATE_REF/stripe_recent_disputes.json
```

Pour chaque dispute :
- Reason (`fraudulent`, `product_not_received`, `unrecognized`, etc.)
- Status (`needs_response`, `under_review`, `won`, `lost`)
- Amount + currency
- Croiser avec `call_sessions/{sessionId}` correspondant : appel a-t-il bien eu lieu ? `billingDuration ≥ 60 s` ?
- Réponse SOS-Expat fournie en temps voulu ?
- Compter chargebacks sur 90 j → ratio chargeback. Si > 0.75 % → risque programme Stripe Excessive Chargeback (alerte P0).

#### 5.3 — Distribution observée

| Métrique | p50 | p95 | p99 |
|----------|-----|-----|-----|
| Latence `created` → `succeeded` | ? | ? | ? |
| Latence `succeeded` → `captured` (≥ 60 s appel) | ? | ? | ? |
| Latence webhook `payment_intent.succeeded` reçu | ? | ? | ? |

Taux d'erreurs par catégorie (`card_declined`, `insufficient_funds`, `expired_card`, `incorrect_cvc`, etc.).

---

### Phase 6 — Audit observationnel PAIEMENT — PayPal (1 h 30)

**Output** : `audit_artifacts_<DATE>/phase6_paypal.md`

```bash
PAYPAL_CLIENT_ID=$(gcloud secrets versions access latest --secret="PAYPAL_CLIENT_ID_LIVE")
PAYPAL_SECRET=$(gcloud secrets versions access latest --secret="PAYPAL_CLIENT_SECRET_LIVE")
ACCESS_TOKEN=$(curl -s -u "$PAYPAL_CLIENT_ID:$PAYPAL_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  https://api-m.paypal.com/v1/oauth2/token | jq -r .access_token)

# Lister orders récents — uniquement GET autorisé
# Note : PayPal n'a pas d'endpoint "list orders" public ; utiliser PayPal Dashboard > Activity
```

Vérifier sur les 30 derniers paiements PayPal :
- Orders avec `status=AUTHORIZED` orphelins (non capturés ni voidés depuis > 30 min)
- Cas du fix override admin du 2026-05-03 : comparer orders AVANT vs APRÈS le commit `c003fefb`
- Taux de cancel user (popup PayPal annulé)
- Race condition `onError` après `onApprove` : présence logs `Ignoring late onError`
- Devise : majorité EUR, vérifier que USD fonctionne (compter occurrences `currency: 'USD'`)
- Pays providers PayPal-only : vérifier qu'au moins 1 paiement réussi par pays critique (VN, MM, KH, etc.)

---

### Phase 7 — Audit observationnel B2B SOS-Call complet (1 h 30)

**Output** : `audit_artifacts_<DATE>/phase7_b2b.md`

#### 7.1 — Cycle de vie B2B

Pour chaque `call_sessions` B2B sur 60 j :
1. Présence du `partner_code_used`
2. Validation `checkSosCallCode` réussie (logs)
3. `triggerSosCallFromWeb` callable invoqué
4. Création directe `call_session` sans `payment` réel (gateway=`b2b_sos_call_free`)
5. Quota partenaire décrémenté correctement
6. Appel Twilio déclenché normalement (pas de différence avec B2C côté Twilio)
7. Si appel ≥ 60 s : provider crédité (sans déduction client)
8. Reserve 30 j appliquée avant payout

#### 7.2 — Hiérarchie partenaire (cabinet/région)

Vérifier (cf. mémoire `project_sos_call_b2b_2026_04_24.md`) :
- Documents `partners/{partnerId}` avec hiérarchie
- API keys partenaire (utilisées hors interface web)
- Filament admin pour gestion partenaires (back-office Laravel hors scope direct)

#### 7.3 — Quota & limites

Pour chaque partenaire actif :
- Quota mensuel (€N × clients)
- Conso observée
- Reset mensuel correctement appliqué (vérifier `partner_quotas` updates)
- Tentatives au-delà du quota → erreur `quota_exceeded` (compter dans logs)

#### 7.4 — IA quota pour B2B

Cf. mémoire `project_ia_quota_always_provider.md` : pour `ia.sos-expat.com`, c'est TOUJOURS le prestataire qui paie son quota IA, B2C ou B2B. Vérifier que les appels B2B décrémentent bien le quota IA du prestataire (et pas du partenaire).

---

### Phase 8 — Audit observationnel APPEL TWILIO (2 h)

**Output** : `audit_artifacts_<DATE>/phase8_twilio.md`

```bash
SID=$(gcloud secrets versions access latest --secret="TWILIO_ACCOUNT_SID")
TOKEN=$(gcloud secrets versions access latest --secret="TWILIO_AUTH_TOKEN")

# Balance Twilio
curl -s -u "$SID:$TOKEN" "https://api.twilio.com/2010-04-01/Accounts/$SID/Balance.json" \
  > audit_artifacts_$DATE_REF/twilio_balance.json

# Calls récents (50 max)
curl -s -u "$SID:$TOKEN" "https://api.twilio.com/2010-04-01/Accounts/$SID/Calls.json?PageSize=50" \
  > audit_artifacts_$DATE_REF/twilio_recent_calls.json

# Geo permissions (218 pays)
curl -s -u "$SID:$TOKEN" "https://voice.twilio.com/v1/DialingPermissions/Countries?PageSize=250" \
  > audit_artifacts_$DATE_REF/twilio_geo_permissions.json

# SMS récents
curl -s -u "$SID:$TOKEN" "https://api.twilio.com/2010-04-01/Accounts/$SID/Messages.json?PageSize=50" \
  > audit_artifacts_$DATE_REF/twilio_recent_sms.json
```

#### 8.1 — Balance & santé

- Balance Twilio actuelle (alerte si < $20)
- Nombre numéros achetés (E.164 list)
- Nombre numéros sortants vs entrants

#### 8.2 — Calls observés (sur 50 derniers)

Pour chaque call :
- Durée vs `billingDuration` du `call_sessions` correspondant (cohérence)
- Status : `completed`, `busy`, `no-answer`, `failed`, `canceled`
- Direction : `outbound-api` (provider d'abord, puis client)
- Coût : `price` field

Distribution :
- Taux d'appels réussis (≥ 60 s) sur 30 j
- Taux `no_answer_provider` sur 3 retries
- Taux `no_answer_client`
- Taux `early_disconnect_provider` vs `early_disconnect_client`

#### 8.3 — DTMF + Conference webhooks

Compter dans logs Cloud Run :
- Calls webhook `twilioWebhooks` reçus (Gather DTMF)
- Conference webhooks reçus
- Replays Twilio (idempotence : `webhookProcessed: true` déjà mis)
- DTMF "1" (accept) vs "*" (refuse)
- Timeouts Gather (15 s)

#### 8.4 — Geo permissions

Vérifier que SX (Saint-Martin) reste désactivé (volontaire). Vérifier que les 217 autres pays sont bien activés.

#### 8.5 — Voice prompts multi-langue

Lire `voicePrompts.json` (50+ langues) et croiser avec les calls observés : vérifier que la `preferredLanguage` du client se traduit en bon prompt voice. Compter combien de langues sont effectivement utilisées sur 30 j.

---

### Phase 9 — Audit cross-matrix CLIENT × PROVIDER × CURRENCY × GATEWAY (2 h)

**Output** : `audit_artifacts_<DATE>/phase9_matrix.md`

Construire une matrice 50 lignes minimum :

| Client_country | Client_type | Provider_country | Provider_role | Currency | Gateway | Service | # observés | # success | # fail | Notes |
|----------------|-------------|------------------|---------------|----------|---------|---------|------------|-----------|--------|-------|

Combinaisons critiques (≥ 1 paiement observé en succès en prod = ✅) :

```
FR/B2C/FR/Lawyer/EUR/Stripe/lawyer
FR/B2C/VN/Lawyer/EUR/PayPal/lawyer
US/B2C/FR/Expat/USD/Stripe/expat
TH/B2C/TH/Expat/EUR/Stripe ou PayPal/expat
MM/B2C/MM/Expat/USD/PayPal/expat
AU/B2C/AU/Lawyer/EUR/Stripe/lawyer
JP/B2C/JP/Expat/USD/Stripe/expat
SG/B2C/SG/Lawyer/EUR/Stripe/lawyer
PH/B2C/PH/Expat/USD/PayPal/expat
KH/B2C/KH/Expat/EUR/PayPal/expat
... (B2B subset)
FR/B2B/FR/Lawyer/EUR/b2b_free/lawyer
... (affilié subset)
FR/B2C-affilié/FR/Lawyer/EUR/Stripe-with-discount/lawyer
... (Apple Pay subset)
US/B2C/US/Expat/USD/ApplePay/expat
... (Google Pay subset)
DE/B2C/DE/Lawyer/EUR/GooglePay/lawyer
```

Si aucune trace en succès pour une combinaison critique → marquer `NEVER TESTED IN PROD` (zone d'inconnu, à programmer en staging).

---

### Phase 10 — Audit observationnel PAYOUTS (provider + commissions affilié + SOS-Expat) (2 h)

**Output** : `audit_artifacts_<DATE>/phase10_payouts.md`

#### 10.1 — Payouts provider (Stripe Connect Destination Charges)

Pour chaque transfer Stripe sur 30 j :
- Cohérence `transfer.amount` ↔ `payment.providerAmount` (champ Firestore)
- Cohérence `transfer.destination` ↔ `provider.stripeAccountId`
- Vérifier que la commission SOS (différence) reste bien sur le compte Platform Stripe
- Reserve B2B 30 j : pour B2B, le transfer doit être différé de 30 j

#### 10.2 — Payouts provider PayPal (Payouts API ou manuel)

Pour les providers PayPal-only :
- Mécanisme actuel : automatisé ou manuel ?
- Délai moyen entre `call_completed` et payout reçu
- Email PayPal correctement enregistré dans `users/{providerId}.paypalEmail`

#### 10.3 — Withdrawal requests

Compter dans `withdrawal_requests` collection sur 30 j :
- Total demandes
- Statuses : pending / approved / rejected / completed / failed
- Vérifier `withdrawalFee = 300 cents` ajouté à `totalDebited`
- Vérifier `availableBalance >= 3000 cents` avant création
- Cas `failed` → email Zoho + Telegram envoyés (cf. `onWithdrawalStatusChanged`)

#### 10.4 — Commissions affiliés

Pour chaque appel terminé sur 30 j :
- Si client a `referredByUserId` → vérifier création `affiliate_commissions/{id}`
- Multiplicateurs Chatter doivent être à 1 (`finalAmount = baseAmount`)
- Hierarchie : `lockedRates > individual plan > role default > catch-all`
- 4 rôles : chatter / influencer / blogger / groupAdmin
- Crédit `affiliate_notifications` + `group_admin_notifications`
- Top 3 cross-role + milestones all roles + Influencer $5 fixe (cf. mémoire `project_kb_audit_p0_fixes_2026_04_20.md`)

#### 10.5 — Reversement SOS-Expat (commission plateforme)

- Vérifier que la commission SOS = `client.amount - provider.amount - fees - affiliate_commission` reste sur le compte Stripe Platform
- Pour B2B, la commission SOS = `partner.subscription_per_call - provider.amount - reserve`
- Cohérence vue dans Stripe Dashboard > Balance > Available

---

### Phase 11 — Audit notifications + factures (1 h 30)

**Output** : `audit_artifacts_<DATE>/phase11_notifications.md`

#### 11.1 — Email transactionnel (Zoho ou SMTP direct)

Pour chaque `payment.status='succeeded'` sur 7 j, vérifier dans logs :
- Email confirmation envoyé au client
- Email notification envoyé au provider
- Pas de bounce / undelivered (codes SMTP 5xx)
- Templates corrects par langue (9 langues)
- **Mécanisme d'envoi à confirmer** : Zoho API ? SMTP direct ? SendGrid ? — grep `nodemailer|@sendgrid|zoho` dans backend

⚠️ **Ne pas confondre avec mémoire `project_mailflow_warmup.md`** — celle-ci concerne uniquement l'outbound presse@* (campagnes email cold), PAS le transactionnel SOS-Expat. Les deux flux sont indépendants.

#### 11.2 — SMS Twilio

Compter SMS envoyés vs paiements réussis. Vérifier qu'aucun SMS n'a échoué silencieusement.

#### 11.3 — Telegram Engine

Compter events forwardés via `forwardEventToEngine` sur 7 j :
- `new_registration`
- `call_completed`
- `payment_received`
- `withdrawal_request`
- `daily_report`
- `negative_review`
- `security_alert`
- 5 autres events

Vérifier réception côté engine (logs Hetzner si accès).

#### 11.4 — Meta CAPI + Google Ads

- `pixelEventId` présent dans `payments.metadata`
- Logs `[Meta CAPI]` envoyés pour chaque `succeeded`
- Google Ads Enhanced Conversions : compte `AW-18117157336` (cf. mémoire), 4 actions de conversion créées

#### 11.5 — Invoices PDF

Pour chaque paiement réussi :
- `legalInvoice` PDF généré et stocké (Cloud Storage)
- `commercialInvoice` PDF généré et stocké
- URLs accessibles depuis dashboard client
- Mentions légales conformes (TVA, SIRET, etc.)

---

### Phase 12 — Audit erreurs + edge cases observés en prod (1 h 30)

**Output** : `audit_artifacts_<DATE>/phase12_errors.md`

Compter dans logs Cloud Run sur 30 j :

| Erreur | Pattern de log | Occurrences 24 h | Occurrences 30 j | Sévérité |
|--------|----------------|-------------------|-------------------|----------|
| Carte refusée | `card_declined` | ? | ? | normal |
| Solde insuffisant | `insufficient_funds` | ? | ? | normal |
| 3DS timeout | `3D Secure authentication has expired` | ? | ? | bug si fréquent |
| Numéros identiques | `Numéros identiques` | ? | ? | guard OK |
| Provider offline rejected | `Le prestataire est actuellement hors ligne` | ? | ? | normal |
| Doublon paiement | `Un paiement similaire est déjà en cours` | ? | ? | bug si fréquent |
| Amount mismatch | `Amount mismatch` ou `Montant inattendu` | ? | ? | bug |
| OOM Cloud Run | `Memory limit ... exceeded` | ? | ? | doit être 0 après fix 2026-05-03 |
| HTTP 409 deploy | `unable to queue the operation` | ? | ? | normal CI/CD |
| Stripe webhook duplication | `IDEMPOTENCY: Payment already in TRULY FINAL state` | ? | ? | normal Stripe retries |
| Twilio webhook duplication | `earlyDisconnectProcessed already true` | ? | ? | normal Twilio retries |
| Provider raccroche < 60 s | `early_disconnect_provider` | ? | ? | normal |
| Client raccroche < 60 s | `early_disconnect_client` | ? | ? | normal |
| Capture réussie ≥ 60 s | `Paiement capture avec succes` | ? | ? | normal |
| `provider_no_answer` 3 retries | `failed_provider_no_answer` | ? | ? | normal si rare |
| `client_no_answer` 3 retries | `failed_client_no_answer` | ? | ? | normal si rare |
| PayPal `Amount mismatch` (ancien bug) | `[PAYPAL_DEBUG] STEP 5 FAILED: Amount mismatch` | ? | ? | doit être 0 après fix `c003fefb` (postérieur au commit) |
| Stripe stuck-on-page | utilisateur reste bloqué sur `/checkout` après `payment_intent.succeeded` (delta `succeeded_at` → navigation suivante > 5 s) | ? | ? | fallback `window.location.replace` après 1500 ms doit être effectif (commit `c003fefb`) |
| Sentry DSN missing | `[Sentry Backend] DSN not configured` | ? | ? | doit être 0 après fix `467dc3a9` (round 2) + `26853903` (round 1) |
| Bouclage sync SOS↔Outil | même `documentId` repassant > 3 fois en 60 s dans logs `[SYNC] SOS→Outil` puis `[SYNC] Outil→SOS` | ? | ? | doit être 0 après fix `8f60adc2` |
| Outil sync exhausts retries (post-bounce-fix) | alerte Telegram engine `[SYNC EXHAUSTED]` | ? | ? | observable mais ne doit pas être fréquent (commit `1e0bfd92`) |
| Quota partenaire dépassé | `quota_exceeded` | ? | ? | guard OK |
| Code partenaire invalide | `invalid_partner_code` | ? | ? | guard OK |
| KYC provider incomplet | `transfer_data invalid destination` | ? | ? | doit être traité (fallback Platform Escrow) |
| Provider banned actif (race) | `provider suspended` apparaît dans payment | ? | ? | bug si > 0 |

Pour chaque erreur fréquente (> 10 occurrences/30 j), lire 3-5 occurrences détaillées + documenter avec template `<bug>` si nécessaire.

---

### Phase 13 — Audit charge + concurrence + résilience (1 h 30)

**Output** : `audit_artifacts_<DATE>/phase13_load_resilience.md`

#### 13.1 — Pic d'instances Cloud Run sur 7 j

Pour chaque fonction critique : pic max d'instances simultanées (`gcloud monitoring`).

#### 13.2 — Cold start latency

Pour `createPaymentIntent`, `createAndScheduleCallHTTPS`, webhooks Twilio/Stripe : compter `Starting new instance` sur 24 h. Latence p95 cold start.

#### 13.3 — Concurrent bookings observés

Pic max de `call_sessions` en `pending` simultané. Vérifier qu'aucun crash ni race n'apparaît à ce pic.

#### 13.4 — Webhook replays

Stripe + Twilio : compter events où `webhookProcessed: true` était déjà mis (idempotence vérifiée).

#### 13.5 — Quota CPU régional

`europe-west3` : présence d'erreurs `INSUFFICIENT_TOKENS` ou `RESOURCE_EXHAUSTED` sur la dernière semaine. Si oui → bug capacité.

#### 13.6 — Failover régional

Si `europe-west3` tombe, est-ce que `europe-west1` ou `us-central1` peut prendre le relais sur les paiements ? (réponse probable : non, monolithique → noter en risk)

⚠️ Aucun test de charge live. Observation uniquement.

---

### Phase 14 — Audit qualité, sécurité, RGPD, i18n, SEO (1 h)

**Output** : `audit_artifacts_<DATE>/phase14_quality_security_rgpd.md`

#### 14.1 — i18n complet

Pour chaque langue UI (9 langues), comparer les clés `err.*`, `checkout.*`, `booking.*`, `payment.*` présentes dans les composants vs les clés présentes dans `helper/{lang}.json`. Lister manquants.

#### 14.2 — Sécurité

- Logs PII : grep dans logs récents `\+\d{10,}` (phone full), emails non maskés, numéros de carte.
- Secrets exposés en code : `grep -rn "sk_live_\|paypal_client_secret\|TWILIO.*[A-Za-z0-9]\{32,\}" sos/`
- CORS : vérifier `origin` correctement restreint sur callables sensibles
- Rate limiting : présence sur `createPaymentIntent`, `validateCoupon`, `triggerSosCallFromWeb`

#### 14.3 — RGPD

- `termsAffiliateVersion` + `termsAffiliateType` stockés à l'inscription (4 rôles affiliés)
- CGU accessibles : `/cgu-bloggers`, `/cgu-group-admins`
- Export utilisateur (RGPD Art. 20) : fonction existante ?
- Suppression compte (RGPD Art. 17) : fonction existante ? Cascade complète (commissions, payments, etc.) ?
- Cookie banner conforme (consent before tracking)

#### 14.4 — SEO + multi-langue

- Hreflang aligné sur 9 langues (cf. mémoire `project_url_hreflang_audit_2026_04_16`)
- Sitemaps à jour (cf. mémoires `project_sitemap_*`)
- Slugs ASCII only (cf. mémoire `feedback_slugs_ascii_only.md`)

#### 14.5 — Accessibilité (WCAG)

- Contraste, ARIA, keyboard nav sur les pages critiques (CallCheckout, BookingRequest)
- Tests rapides via Lighthouse (mode lecture seule)

#### 14.6 — Performance

- Lighthouse score sur Home, ProviderProfile, CallCheckout (3 pages critiques) — mode lecture seule
- Bundle size frontend (vérifier qu'il n'a pas explosé)

</phases>

---

<output_format>

## Format de rapport final

Le rapport DOIT être à `audit_e2e_complete_<DATE>.md` à la racine du repo, avec **exactement** la structure suivante :

```markdown
# Rapport E2E exhaustif SOS-Expat — <DATE>

## Résumé exécutif (300 mots max, lisible PM non-tech)
- Périmètre couvert : X/14 phases (Z%)
- 5 typologies CLIENT couvertes : oui/non par typologie (C1 B2C standard, C2 B2C affilié, C3 coupon, C4 B2B, C5 QuickAuth)
- 5 modes PAIEMENT couverts : oui/non par mode (P1 Stripe Card, P2 Apple Pay, P3 Google Pay, P4 PayPal, P5 B2B Free)
- 7 typologies PROVIDER couvertes : oui/non par type (R1 Lawyer Stripe, R2 Expat Stripe, R3 KYC incomplet, R4 PayPal-only, R5 AAA, R6 Multi-prestataire, R7 Suspendu)
- Matrice cross-pays : N combinaisons critiques observées en succès / M total
- Bugs P0 (bloquants production worldwide) : N
- Bugs P1 (importants) : N
- Bugs P2 (mineurs) : N
- Ratio dispute/chargeback Stripe 90 j : X.XX % (alerte P0 si > 0.75 %)
- 12 fixes 2026-05-03 déployés : N/12 confirmés
- Verdict production-readiness mondial : ✅ READY / ⚠️ READY WITH GAPS / ❌ NOT READY
- Top 3 actions urgentes
- Coût total de l'audit : $0
- Durée audit : XX h

## Phase 0 — Bootstrap
[contenu]

## Phase 1 — Inspection statique CODE
### 1.1 Cartographie 15 étapes
### 1.2 Exports + triggers
### 1.3 Divergences architecturales détectées

[Phases 2 à 14...]

## Annexe A — Bugs détectés (template strict, voir <example_bug>)

## Annexe B — Matrice de couverture observée
[tableau ≥ 50 lignes : Client × Provider × Currency × Gateway × Service × Type]

## Annexe C — Cartographie 15 étapes (avec file:line + Firestore docs + APIs externes)

## Annexe D — Logs prod consolidés
[références fichiers `audit_artifacts_<DATE>/*.json`]

## Annexe E — Architecture risks (recommandations long terme, descriptives)

## Annexe F — Self-review adversarial
[Liste angles morts, hypothèses faites, zones non concluantes]

## Annexe G — Tests à programmer ultérieurement (live, hors scope)
[Liste scénarios qui nécessiteraient un test E2E sur staging]

## Annexe H — Checklist production-ready worldwide (signoff)
[≥ 50 critères Yes/No pour valider chaque pays critique × chaque gateway]
```

## Format updates intermédiaires

Toutes les 30 min, l'agent rend un message d'update au format :

```
[CHECKPOINT <HH:MM>]
Phase actuelle : <X>
Progression : <Y>/<Z> sous-scénarios complétés
Bugs détectés ce checkpoint : <N> (dont P0: <K>)
Couverture matrice cross : <N>/50 cellules observées
Blocages : <description ou "aucun">
ETA fin de phase : <HH:MM>
Actions mutatives effectuées ce checkpoint : 0 (audit read-only)
```

</output_format>

---

<rules>

## Règles de comportement (priorité décroissante)

1. **Read-only strict** — aucune action mutative en prod, jamais. Si l'utilisateur insiste pour appliquer un fix → tu réponds que c'est en dehors du scope de cet audit, et qu'il doit créer une autre session/prompt dédié au fix.

2. **Vérification autonome multi-source** — chaque assertion = code + log, ou code + Firestore, ou log + dashboard externe. Jamais une seule source.

3. **Précision des références** — `CallCheckout.tsx:2401` plutôt que « le handler de succès ».

4. **Refus des hypothèses** — si tu ne peux pas vérifier sans action mutative → `NOT VERIFIED — REQUIRES LIVE TEST` + annexe G.

5. **Recherche active des divergences** — exemple : 2 `getPricingConfig` qui retournent des valeurs différentes pour le même input.

6. **Tests négatifs par observation** — pas de tests négatifs en live, mais observe dans logs combien de fois les guards ont rejeté correctement.

7. **Vérification d'idempotence par observation** — observe replays Stripe/Twilio webhooks, vérifie locks effectifs. Ne déclenche pas de replay artificiel.

8. **Mesures p50/p95/p99 par lecture des logs** — calcule à partir des timestamps existants. Pas de load test live.

9. **Production des artefacts en lecture seule** — fichiers `audit_e2e_complete_<DATE>.md` + `audit_artifacts_<DATE>/`. Aucune écriture vers source externe.

10. **No-fix policy absolue** — n'écris AUCUN code de fix appliqué. Documente chaque bug avec patch DESCRIPTIF (« il faudrait modifier X:Y pour faire Z »). L'utilisateur lance un autre prompt s'il veut le fix.

11. **Self-review avant rendu** — relis-le en mode adversarial : « si j'étais un manager sceptique, où je trouverais des trous ? ». Patche par documentation.

12. **Stop conditions** — tu t'arrêtes immédiatement et signales si :
    - Tu détectes un bug P0 actif causant une perte financière en cours (data loss, double charge, refund manquant)
    - Tu n'as plus accès à un outil critique (auth Firebase expirée, secrets non lisibles)
    - Tu réalises qu'une commande que tu allais lancer aurait un effet de bord
    - L'utilisateur te demande d'effectuer une action mutative (tu refuses, expliques pourquoi)

13. **Aucun test E2E live** — pas de paiement test, pas d'appel Twilio test, pas de PayPal order test.

14. **Mémoires utilisateur = hypothèses** — fais confiance au CODE et aux LOGS, pas aux mémoires. Vérifie chaque mémoire avant d'en dépendre.

15. **Communication FR** — l'utilisateur préfère le français (cf. mémoire User Preferences).

</rules>

---

<example_bug>

## Exemple de bug bien documenté (à reproduire dans le rapport)

<bug id="BUG-001" severity="P0" status="OBSERVED|ALREADY_FIXED">
  <title>Titre court explicite</title>

  <symptom>
    Ce que l'utilisateur observe (déduit de l'historique prod, pas reproduit)
  </symptom>

  <root_cause>
    Cause technique précise avec fichier:ligne (issue de l'analyse code statique)
  </root_cause>

  <evidence>
    - Log line : <horodatage> <message> (référence audit_artifacts/...)
    - Firestore doc lu : <path> avec champ <field>=<value>
    - Stripe Dashboard observation : <PI_ID> (read-only)
    - Code source : <fichier>:<ligne>
    - Au moins 2 sources indépendantes obligatoires
  </evidence>

  <suggested_fix>
    Patch DESCRIPTIF avec fichier:ligne et code à modifier.
    ⚠️ NON APPLIQUÉ — l'utilisateur décide.
  </suggested_fix>

  <impact>
    Combien d'utilisateurs touchés ? Combien de $ perdus ?
    Quel pays / langue / gateway impacté ?
    Fréquence (déduite du volume historique).
  </impact>

  <reproduction_steps_for_later>
    1. Étapes que TU N'AS PAS exécutées mais que le développeur pourrait suivre en staging.
    2. Marquer comme « hors scope de cet audit ».
  </reproduction_steps_for_later>
</bug>

</example_bug>

---

<acceptance_criteria>

## Critères d'acceptation du rapport

Le rapport est **VALIDE** si :
- ✅ Les 14 phases sont couvertes (ou justifiées si abrégées)
- ✅ Les 15 étapes du flux sont cartographiées (annexe C)
- ✅ Les 5 typologies CLIENT sont auditées (au moins 1 cas observé par typologie)
- ✅ Les 5 modes PAIEMENT sont audités (au moins 1 cas observé par mode)
- ✅ Les 7 typologies PROVIDER sont auditées
- ✅ La matrice cross-pays a ≥ 50 lignes observées
- ✅ Chaque bug détecté suit le template `<bug>` strict avec ≥ 2 sources
- ✅ Aucun scénario marqué `NOT TESTED` sans justification
- ✅ Latences p50/p95/p99 mesurées sur ≥ 100 paiements observés
- ✅ Section `Architecture risks` (annexe E) avec 5-10 recommandations long terme
- ✅ Section `Self-review` (annexe F) documentant angles morts
- ✅ Section `Tests à programmer` (annexe G)
- ✅ Section `Checklist production-ready worldwide` (annexe H) ≥ 50 critères
- ✅ Verdict explicite production-readiness dans résumé exécutif
- ✅ Coût rapporté = $0
- ✅ Aucune trace d'action mutative

Le rapport est **INVALIDE** si :
- ❌ Une phase critique (1, 5, 6, 7, 8, 10) skippée sans justification
- ❌ Un bug documenté sans evidence reproductible (< 2 sources)
- ❌ Des fixes appliqués (même un seul, même petit)
- ❌ Un test E2E lancé (création de PI/order/call)
- ❌ Credentials/secrets en clair dans le rapport
- ❌ Self-review absente ou triviale
- ❌ Annexe G absente
- ❌ Pas de verdict production-readiness explicite

</acceptance_criteria>

---

<scope_limits>

## Limites de scope

**Hors scope de cet audit** :
- Le projet `Outil-sos-expat/` (autre Firebase project) — sauf points de contact sync
- Le `Dashboard-multiprestataire/` — sauf impact sur `shareBusyStatus`
- Le module `engine_telegram_sos_expat` complet — sauf events forwardés
- Le blog Laravel `Blog_sos-expat_frontend` — sauf impact analytics/SEO
- Les outils standalone (Influenceurs Tracker, Trustpilot Members, WhatsApp Campaigns, Job Hunter Pro, Backlink Engine, etc.)
- L'admin panel — sauf si bug bloque le flux client
- L'application des fixes — phase séparée, prompt séparé

**En scope partiel** (audit léger) :
- Triggers post-paiement (commissions, transferts, payouts) — phase 10
- Notifications email/SMS/Telegram — phase 11
- Invoices PDF — phase 11
- Meta CAPI + Google Ads — phase 11
- IA quota du prestataire (B2C ou B2B) — phase 7

**100 % en scope (observation passive)** :
- 15 étapes du flux entre « visiteur arrive » et « provider crédité + SOS-Expat crédité + factures envoyées »
- 5 typologies CLIENT × 5 modes PAIEMENT × 7 typologies PROVIDER
- 9 langues UI × 218 pays Twilio × 44 pays Stripe × 150+ pays PayPal × 2 devises

</scope_limits>

---

<ambiguous_cases>

## Comment gérer les cas ambigus

**Cas 1 : Le code dit X mais les logs disent Y.**
→ Tu fais confiance aux LOGS. Tu documentes la divergence comme bug.

**Cas 2 : Une mémoire utilisateur dit X mais le code dit Y.**
→ Tu fais confiance au CODE. Mémoire = hypothèse historique potentiellement obsolète.

**Cas 3 : Un commit récent semble fixer un bug, mais le bug est encore observé dans logs récents.**
→ Tu vérifies que le commit est effectivement déployé (`gcloud run revisions list`) avant de conclure. Tu ne lances pas de test live.

**Cas 4 : Tu n'as pas les permissions pour lire un secret/document.**
→ Tu ne devines PAS. Tu marques `NOT VERIFIED — INSUFFICIENT PERMISSIONS` + tu listes ce qui te bloque.

**Cas 5 : Une vérification nécessite absolument un test live.**
→ Tu marques `NOT VERIFIED — REQUIRES LIVE TEST` + annexe G.

**Cas 6 : Le scénario donne un résultat inattendu mais qui pourrait être correct.**
→ Tu documentes les 2 hypothèses + `AMBIGUOUS — NEEDS CLARIFICATION`. Tu ne tranches pas seul.

**Cas 7 : L'utilisateur te demande pendant l'audit de « juste tester rapidement avec une petite carte ».**
→ Tu refuses fermement : « Cet audit est strictement read-only par contrat. Je ne lance pas de test mutatif même avec ton autorisation pendant cette session. Si tu veux qu'on lance des tests live, on doit créer un autre prompt/session dédié. »

**Cas 8 : Un pays critique n'a JAMAIS de paiement observé en succès en prod.**
→ Tu ne lances PAS de test live pour combler. Tu marques `NEVER TESTED IN PROD — combinaison X/Y/Z` en annexe G.

**Cas 9 : Un utilisateur a payé mais l'appel n'a jamais eu lieu (orphan payment).**
→ Bug P0 confirmé. Documente avec template `<bug>`. NE rembourse PAS toi-même.

**Cas 10 : Discordance entre `payments` Firestore et Stripe Dashboard.**
→ Bug P0 (data sync). Documente. NE corrige PAS.

**Cas 11 : Un fichier référencé dans le prompt n'existe pas (file not found).**
→ Vérifier d'abord avec `Glob` que le fichier n'a pas été renommé/déplacé. Si confirmé absent → marquer `MISSING — fichier référencé absent du repo` dans phase 1.3. Ne pas inventer de chemin alternatif. Continuer l'audit avec les fichiers existants.

**Cas 12 : Une mémoire utilisateur référencée n'existe plus.**
→ Lire `C:\Users\willi\.claude\projects\C--Users-willi-Documents-Projets-VS-CODE-sos-expat-project\memory\MEMORY.md` pour vérifier. Si absente, traiter comme info manquante (pas comme bug).

**Cas 13 : Tu trouves un commit hash différent de celui cité dans le prompt.**
→ Faire confiance à `git log` (source de vérité). Documenter la divergence dans phase 0 bootstrap. Le prompt peut contenir un hash obsolète si rebase/squash a eu lieu.

</ambiguous_cases>

---

<startup>

## Commandes de démarrage (toutes en lecture seule)

```bash
# Setup
cd C:\Users\willi\Documents\Projets\VS_CODE\sos-expat-project
firebase login
gcloud auth list  # vérifier williamsjullin@gmail.com
gcloud config set project sos-urgently-ac307

# Date de référence
DATE_REF=$(date -u +%Y-%m-%dT%H-%M-%SZ)
mkdir -p audit_artifacts_$DATE_REF

# Phase 1 — Cartographie initiale (lecture pure)
grep -rn "^export const\|^export function" sos/firebase/functions/src --include="*.ts" \
  | grep -iE "payment|call|booking|stripe|paypal|twilio|partner|sos[-_]call|withdrawal|payout|commission|affiliate" \
  > audit_artifacts_$DATE_REF/exports_map.txt

grep -rn "onRequest\|onCall\|onSchedule\|onDocumentCreated\|onDocumentUpdated\|onDocumentWritten" \
  sos/firebase/functions/src --include="*.ts" \
  > audit_artifacts_$DATE_REF/triggers_map.txt

# Phase 2 — Configs Cloud Run actuelles (read uniquement)
for fn in createpaymentintent createandschedulecallhttps twiliocallwebhook twilioconferencewebhook \
          stripewebhookhandler paypalwebhook \
          handlecallcompleted handleearningcredited consolidatedoncallcompleted \
          oncallsessionpaymentauthorized oncallsessionpaymentcaptured \
          triggersoscallfromweb checksoscallcode \
          processrefund createwithdrawalrequest onwithdrawalstatuschanged \
          validatecoupon getpricingconfig \
          forwardevent meta-capi-purchase google-ads-conversion \
          influenceronprovidercallcompleted onprofileupdated \
          unifiedreleaseheldcommissions releasepartnerpendingcommissions \
          busysafetytimeouttask checkproviderinactivity \
          syncfromoutil; do
  gcloud run services describe $fn --region=europe-west3 --project=sos-urgently-ac307 \
    --format="csv(metadata.name,spec.template.spec.containers[0].resources.limits.memory,spec.template.spec.containers[0].resources.limits.cpu,spec.template.spec.containerConcurrency,spec.template.metadata.annotations.'autoscaling.knative.dev/maxScale')" \
    >> audit_artifacts_$DATE_REF/cloud_run_configs.csv 2>/dev/null
done

# Phase 12 — Logs prod 24h (read)
gcloud logging read "resource.type=cloud_run_revision AND timestamp>=\"$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)\"" \
  --limit=10000 --format=json --project=sos-urgently-ac307 \
  > audit_artifacts_$DATE_REF/logs_prod_24h.json

# Phase 12 — OOMs détectés (last 30 days, read)
gcloud logging read "(severity=ERROR AND textPayload:\"Memory limit\") AND timestamp>=\"$(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%SZ)\"" \
  --limit=200 --format=json --project=sos-urgently-ac307 \
  > audit_artifacts_$DATE_REF/ooms_30days.json

# Phase 8 — Twilio dialing permissions snapshot (GET)
SID=$(gcloud secrets versions access latest --secret="TWILIO_ACCOUNT_SID" --project=sos-urgently-ac307)
TOKEN=$(gcloud secrets versions access latest --secret="TWILIO_AUTH_TOKEN" --project=sos-urgently-ac307)
curl -s -u "$SID:$TOKEN" "https://voice.twilio.com/v1/DialingPermissions/Countries?PageSize=250" \
  > audit_artifacts_$DATE_REF/twilio_geo_permissions.json
curl -s -u "$SID:$TOKEN" "https://api.twilio.com/2010-04-01/Accounts/$SID/Balance.json" \
  > audit_artifacts_$DATE_REF/twilio_balance.json
curl -s -u "$SID:$TOKEN" "https://api.twilio.com/2010-04-01/Accounts/$SID/Calls.json?PageSize=50" \
  > audit_artifacts_$DATE_REF/twilio_recent_calls.json

# Phase 5 — Stripe historique paiements (GET seulement)
STRIPE_KEY=$(gcloud secrets versions access latest --secret="STRIPE_SECRET_KEY_LIVE" --project=sos-urgently-ac307)
curl -s -u "$STRIPE_KEY:" "https://api.stripe.com/v1/payment_intents?limit=100" \
  > audit_artifacts_$DATE_REF/stripe_recent_pis.json
curl -s -u "$STRIPE_KEY:" "https://api.stripe.com/v1/refunds?limit=50" \
  > audit_artifacts_$DATE_REF/stripe_recent_refunds.json
curl -s -u "$STRIPE_KEY:" "https://api.stripe.com/v1/transfers?limit=50" \
  > audit_artifacts_$DATE_REF/stripe_recent_transfers.json
curl -s -u "$STRIPE_KEY:" "https://api.stripe.com/v1/balance" \
  > audit_artifacts_$DATE_REF/stripe_balance.json

# Phase 6 — PayPal access token (GET)
PAYPAL_CLIENT_ID=$(gcloud secrets versions access latest --secret="PAYPAL_CLIENT_ID_LIVE" --project=sos-urgently-ac307)
PAYPAL_SECRET=$(gcloud secrets versions access latest --secret="PAYPAL_CLIENT_SECRET_LIVE" --project=sos-urgently-ac307)
curl -s -u "$PAYPAL_CLIENT_ID:$PAYPAL_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  https://api-m.paypal.com/v1/oauth2/token \
  > audit_artifacts_$DATE_REF/paypal_token.json
```

⚠️ **Aucune de ces commandes ne modifie quoi que ce soit.** Toutes sont en GET / lecture pure.

</startup>

---

<budget>

## Budget temps + coût

**Temps total recommandé** : 18-22 h (équipe humaine senior ou agent IA avancé Opus 4.7 1M context)
**Coût financier prod** : **$0** (audit en lecture seule)
**Coût compute IA** : variable selon modèle (estimer ≤ $50 pour Claude Opus 4.7 1M context full-run)

| Phase | Temps min | Temps max | Mode |
|-------|-----------|-----------|------|
| 0 — Bootstrap | 15 min | 20 min | gcloud auth + git |
| 1 — Inspection statique | 1 h 30 | 2 h | lecture code |
| 2 — Configs Cloud Run + secrets | 45 min | 1 h | gcloud describe lecture |
| 3 — Client auth observationnel | 1 h | 1 h 15 | Firestore + Auth Console read |
| 4 — Booking requests | 1 h 30 | 2 h | Firestore + logs read |
| 5 — Stripe / Apple Pay / Google Pay | 2 h | 2 h 30 | Stripe API GET + Firestore + logs |
| 6 — PayPal | 1 h 30 | 2 h | PayPal API GET + Dashboard read |
| 7 — B2B SOS-Call complet | 1 h 30 | 2 h | Firestore + logs |
| 8 — Twilio appel | 2 h | 2 h 30 | Twilio API GET + logs |
| 9 — Cross-matrix | 2 h | 2 h 30 | Firestore + logs cross |
| 10 — Payouts | 2 h | 2 h 30 | Stripe + PayPal + Firestore |
| 11 — Notifications + factures | 1 h 30 | 2 h | Logs + Storage GET |
| 12 — Erreurs + edge cases | 1 h 30 | 2 h | Logs read |
| 13 — Charge + concurrence | 1 h 30 | 2 h | Cloud Monitoring read |
| 14 — Qualité + sécurité + RGPD + i18n + SEO | 1 h | 1 h 30 | grep + Lighthouse read |
| **TOTAL** | **18 h** | **22 h** | **lecture pure** |

**⚠️ Si temps < 8 h** : prioriser Phases 1, 2, 5, 6, 7, 8, 10. Skipper 11, 13, 14 ou marquer `LATER` en annexe G. Garder absolument la matrice cross (Phase 9) au minimum 20 lignes.

**⚠️ Si l'agent atteint 80 % du context window** : produire un rapport intermédiaire avec ce qui a été couvert + annexer G les phases non couvertes. Ne PAS rusher. Préférable : lancer plusieurs sous-agents en parallèle pour Phases 5, 6, 8, 10 indépendantes.

</budget>

---

<sub_agents_strategy>

## Stratégie sous-agents (optionnel, si modèle support multi-agent)

Pour optimiser le temps + protéger context window :

| Sous-agent | Phases déléguées | Tools | Output |
|------------|------------------|-------|--------|
| **Code-mapper** | 1, 14 (i18n, sécurité) | Grep + Read | `phase1_*.md` + `phase14_*.md` |
| **Stripe-auditor** | 5 | curl Stripe API + Firestore read | `phase5_stripe.md` |
| **PayPal-auditor** | 6 | curl PayPal + Dashboard read | `phase6_paypal.md` |
| **Twilio-auditor** | 8 | curl Twilio API + logs | `phase8_twilio.md` |
| **B2B-auditor** | 4 (B2B), 7 | Firestore + logs | `phase7_b2b.md` |
| **Payouts-auditor** | 10 | Stripe + PayPal + Firestore | `phase10_payouts.md` |
| **Notifications-auditor** | 11 | Logs + Storage GET | `phase11_notifications.md` |
| **Errors-auditor** | 12 | gcloud logging read | `phase12_errors.md` |
| **Resilience-auditor** | 13 | Cloud Monitoring | `phase13_load.md` |
| **Synthesizer (main)** | 0, 2, 3, 4 (B2C), 9, finalisation | tous | rapport final + annexes |

Tous les sous-agents reçoivent les **mêmes règles read-only**. Tous produisent un fichier markdown dans `audit_artifacts_<DATE>/`. L'agent principal synthétise.

</sub_agents_strategy>

---

<final_checklist>

## Checklist finale avant rendu

Avant de produire `audit_e2e_complete_<DATE>.md`, l'agent doit cocher :

- [ ] Les 14 phases ont été exécutées (ou justifiées si abrégées)
- [ ] Aucune commande mutative n'a été lancée (relire log session)
- [ ] La matrice cross-pays a ≥ 50 cellules observées
- [ ] Chaque bug est documenté avec ≥ 2 sources indépendantes
- [ ] Les 5 typologies CLIENT sont auditées
- [ ] Les 5 modes PAIEMENT sont audités
- [ ] Les 7 typologies PROVIDER sont auditées
- [ ] L'annexe H (checklist production-ready) a ≥ 50 critères Yes/No
- [ ] Le verdict production-readiness mondial est explicite (READY / READY WITH GAPS / NOT READY)
- [ ] La self-review (annexe F) est non triviale (≥ 5 angles morts identifiés)
- [ ] Le rapport est en français (cf. mémoire User Preferences)
- [ ] Les 12 fixes du 2026-05-03 (cf. `<context>` Contexte récent) ont été vérifiés déployés via `git show <hash>` + `gcloud run revisions list`
- [ ] Le ratio dispute/chargeback Stripe sur 90 j est < 0.75 % (sinon alerte P0)
- [ ] Aucun secret/credential en clair dans le rapport

</final_checklist>

---

**🚀 Démarre maintenant.**

**Premier livrable attendu** : update `[CHECKPOINT T+30 min]` avec :
1. Confirmation explicite que zéro action mutative n'a été effectuée
2. Progression Phase 0 (terminée) + Phase 1 démarrée
3. Premier brouillon de cartographie 15 étapes
4. Liste des fichiers déjà lus / à lire dans la prochaine demi-heure

Si tu rencontres une ambiguïté → tu utilises la grille `<ambiguous_cases>` ci-dessus. Si tu rencontres une demande d'action mutative → tu refuses et expliques.

**Bon audit. Coût : $0. Aucun impact prod.**
