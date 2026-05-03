# 🗺️ Prompt — Cartographier le parcours utilisateur complet (User → Site → Paiement → Appel → Payout prestataire)
*Version 1.0 — strict read-only, sortie = documentation exhaustive*

---

<role>
Tu es un **architecte produit + tech writer senior**. Ta mission : produire la **documentation complète du parcours utilisateur** SOS-Expat, du moment où un visiteur arrive sur le site jusqu'au moment où le prestataire encaisse son argent. Chaque étape doit être tracée précisément : quel écran, quel composant, quelle fonction backend, quel document Firestore, quelle API externe, quels états possibles, quelles branches, quelles erreurs.

Tu opères en **mode strict lecture seule** : tu lis le code, les logs, la configuration ; tu n'exécutes AUCUNE action mutative.

Tu produis un **document narratif lisible par un humain non-technique** ET techniquement précis (file:line references, noms de fonctions, structures de documents Firestore).
</role>

<critical_warning>
🛑 **AUCUNE MODIFICATION AUTORISÉE.**
- ❌ Tu ne lances pas de paiement test
- ❌ Tu ne déclenches pas d'appel Twilio
- ❌ Tu ne modifies aucun fichier (sauf `audit_artifacts_<DATE>/journey_user.md` qui est ton livrable)
- ❌ Tu ne déploies rien
- ❌ Tu ne crées aucun document Firestore

Tu **observes** et **décris**. Coût : $0.
</critical_warning>

---

<context>

## Projet

- **Site** : https://sos-expat.com (B2C) + https://sos-call.sos-expat.com (B2B)
- **Repo** : `C:\Users\willi\Documents\Projets\VS_CODE\sos-expat-project`
- **Frontend** : React 18 + Vite + TypeScript (Cloudflare Pages)
- **Backend** : Firebase Functions Gen2 (`sos-urgently-ac307`, régions `europe-west1` / `europe-west3` / `us-central1`)
- **Firestore** : `nam7` (Iowa)
- **Externe** : Stripe Connect (Destination Charges), PayPal REST v2, Twilio Voice + SMS, Cloud Tasks, Telegram Engine

## Périmètre du parcours

Tu documentes les **15 étapes** suivantes, dans l'ordre chronologique :

```
1. Arrivée sur le site → 2. Navigation / découverte → 3. Sélection d'un prestataire
→ 4. Authentification (login ou inscription) → 5. Formulaire de réservation
→ 6. Page de paiement → 7. Traitement du paiement (Stripe ou PayPal)
→ 8. Programmation de l'appel → 9. Page d'attente avec compte à rebours
→ 10. Déclenchement Twilio → 11. Confirmation DTMF (les 2 parties)
→ 12. Conversation pendant l'appel → 13. Fin d'appel et capture/refund
→ 14. Notifications post-appel → 15. Payout vers le prestataire
```

</context>

---

<scope_per_axis>

Pour chaque étape, tu **dois** documenter ces 6 dimensions :

1. **Ce que voit l'utilisateur** (écran, composant React, message, animation)
2. **Ce que fait le frontend** (handler, state update, navigation)
3. **Ce que fait le backend** (callable invoked, trigger fired, doc créé/modifié)
4. **Ce qui change dans Firestore** (collection, doc, champs avant/après)
5. **Ce qui change côté externe** (Stripe API, PayPal API, Twilio API)
6. **Branches possibles** (OK, erreur user, erreur infra, retry, timeout, edge case)

Tu dois aussi traiter les **3 types de clients** :
- B2C standard (paie via Stripe ou PayPal)
- B2C affilié (a un `referredByUserId` ou code affilié actif → réduction)
- B2B SOS-Call (envoyé par partenaire avec code → forfait partenaire couvre l'appel)

Et les **3 types de prestataires** :
- Réel avec Stripe Connect KYC complet
- Réel avec PayPal email (pays sans Stripe Connect)
- AAA (test/démo, payout interne ou externe)

</scope_per_axis>

---

<phases>

## Étape 1 — Arrivée sur le site

**À documenter** :
- Quels sont les 5 points d'entrée principaux ? (homepage `/`, landing `/sos-appel`, deeplinks `/expert/{slug}`, pages SEO `/{country}/{service}`, B2B `sos-call.sos-expat.com`)
- Que se passe-t-il au premier paint ? (splash screen `index.html` lignes 628+, `app-mounted` event, MutationObserver fallback)
- Quels trackers se chargent ? (GA4, Meta Pixel, Hotjar, Google Ads, Sentry — chercher `App.tsx`)
- Quelles données sont capturées en localStorage / sessionStorage ?
  - `sos_affiliate_ref`, `sos_referral_*` (cf. `AffiliateRefSync`, `ReferralCodeCapture`)
  - UTM params (cf. `trafficSource.ts`)
  - `fbp`, `fbc` (Meta Pixel)
  - `gclid`, `ttclid`
  - `selectedCurrency`, `preferredCurrency`
- Détection de la langue (`detectLanguageFromURL` dans `main.tsx`, `LocaleRouter`)
- Détection du pays (geolocation IP, fallback `LANGUAGE_TO_COUNTRY`)
- Cookie consent (CookieBanner)

**Fichiers à lire** :
- `sos/src/main.tsx`
- `sos/src/App.tsx`
- `sos/index.html`
- `sos/src/components/common/MetaPageViewTracker.tsx`
- `sos/src/components/analytics/InternationalTracker.tsx`
- `sos/src/utils/trafficSource.ts`
- `sos/src/components/ReferralCodeCapture.tsx`
- `sos/src/components/AffiliateRefSync.tsx`

## Étape 2 — Navigation / découverte d'un prestataire

**À documenter** :
- Pages principales : `Home.tsx`, `ProvidersByCountry.tsx`, `Categories/`, `SOSCall.tsx`
- Comment fonctionne la recherche prestataires (filtres pays, service type, langue, disponibilité) ?
- Composant `ProfileCarousel.tsx` (cf. logique d'affichage)
- Indicateur de disponibilité prestataire : `online + available` / `online + busy` / `offline`
- Pagination / infinite scroll
- Fetch des prestataires depuis Firestore (`sos_profiles` collection) — quelles requêtes, quels indexes
- Cache navigation (TanStack Query, durée TTL)

**Fichiers à lire** :
- `sos/src/pages/Home.tsx`
- `sos/src/pages/ProvidersByCountry.tsx`
- `sos/src/pages/SOSCall.tsx`
- `sos/src/components/home/ProfileCarousel.tsx`
- `sos/src/services/providers/*` (si existant)
- `sos/firebase/functions/src/services/providersService.ts` (si existant)

## Étape 3 — Sélection d'un prestataire

**À documenter** :
- Fiche prestataire : `ProviderProfile.tsx` — quels champs affichés, photo, bio, langues, spécialités, prix, durée, reviews
- Bouton "Réserver" → où ça mène ?
- Ce qui se passe au clic : capture du `selectedProvider` en sessionStorage (`CallCheckoutWrapper.tsx:288`)
- Vérification disponibilité en temps réel (cf. `useProviderStatus` hook si existant)
- Cas où le prestataire devient `busy` ou `offline` entre la sélection et le clic
- Cas multi-prestataire (`shareBusyStatus`, `linkedProviderIds`) — comment l'app gère un compte propriétaire avec plusieurs profils

**Fichiers à lire** :
- `sos/src/pages/ProviderProfile.tsx`
- `sos/src/pages/CallCheckoutWrapper.tsx` (loadData function)
- `sos/firebase/functions/src/callables/providerStatusManager.ts`

## Étape 4 — Authentification

**À documenter** :
- Détection user logged in / logged out (`AuthContext.tsx`, `isFullyReady`)
- Si logged in : continue direct vers réservation
- Si logged out : 2 chemins
  - **Inscription rapide** (`QuickAuthWizard.tsx` ou `EmailFirstAuth.tsx`)
  - **Inscription complète** (`Register.tsx`, `RegisterClient.tsx`)
- Méthodes auth supportées : email/password, Google OAuth, Apple OAuth, phone (?), magic link (?)
- Persistance : `browserLocalPersistence` (cf. commit `98a4e633` — rememberMe=true partout)
- CGU + Privacy Policy : versioning `termsAffiliateVersion`, signature stockée dans Firestore
- Capture du `referredByUserId` à l'inscription (cf. `AuthContext` ou trigger `onUserCreate`)
- Double sources de auth : Firebase Auth + Firestore `users/{uid}`
- Gestion erreurs (network, user-disabled, weak-password, email-exists)

**Fichiers à lire** :
- `sos/src/contexts/AuthContext.tsx`
- `sos/src/components/auth/QuickAuthWizard.tsx`
- `sos/src/components/auth/EmailFirstAuth.tsx`
- `sos/src/pages/Login.tsx`
- `sos/src/pages/Register.tsx`
- `sos/src/pages/RegisterClient.tsx`
- `sos/firebase/functions/src/triggers/onUserCreate.ts` (si existant)

## Étape 5 — Formulaire de réservation (BookingRequest)

**À documenter** :
- Page `BookingRequest.tsx` (B2C) ou `BookingRequestB2B.tsx` (B2B SOS-Call)
- Champs collectés :
  - Titre de la demande
  - Description du problème
  - Pays concerné par la demande
  - Numéro de téléphone client (validation E.164 via `smartNormalizePhone`)
  - Langue de l'appel
  - Nationalité (?)
  - Prénom / nom
- Validation côté client (Zod ? React Hook Form ?)
- Stockage en sessionStorage (`bookingRequest`, `bookingMeta`, `clientPhone`)
- Création éventuelle d'un doc `booking_requests/{id}` en Firestore (P0-3 fix : fallback Firestore)
- Pré-check : numéros identiques client/provider bloqué (cf. fix `98a4e633`)
- Affichage du prix dynamique (admin override actif ? affiliate discount ? coupon ?)
- Affichage de la durée d'appel (lawyer 20 min, expat 30 min)
- Différences B2B :
  - Pas de prix affiché ("Pris en charge par {partner}")
  - Vérification du code partenaire (`checkSosCallCode` callable)
  - Vérification du quota mensuel partenaire
  - Vérification que le service est dans les `allowedServiceTypes` du partenaire

**Fichiers à lire** :
- `sos/src/pages/BookingRequest.tsx`
- `sos/src/pages/BookingRequestB2B.tsx`
- `sos/firebase/functions/src/partner/callables/checkSosCallCode.ts`
- `sos/src/utils/phone.ts`

## Étape 6 — Page de paiement (CallCheckout)

**À documenter** :
- Routing : `CallCheckoutWrapper.tsx` charge le provider, puis `CallCheckout.tsx` rend la page
- Détection du gateway selon pays prestataire :
  - 46 pays Stripe Connect → Stripe Elements
  - ~150 pays PayPal → PayPalPaymentForm
  - Hybride : si provider Stripe Connect mais client paie depuis pays PayPal → frontend choisit
- Composant `GatewayIndicator` (qui affiche quel gateway est utilisé)
- Affichage du prix final (après promo / coupon / affiliate / override admin)
- Champs CB Stripe (CardNumberElement, CardExpiryElement, CardCvcElement) ou CardElement mobile
- Apple Pay / Google Pay via Payment Request API
- PayPal SDK Buttons + Card Fields (guest checkout)
- Coupon code field (validation server-side via `validateCoupon` callable)
- Bouton "Valider le paiement"
- Confirmation modale si montant > 100€ (`handlePaymentSubmit`)
- États visuels : `isProcessing`, `error`, `currentStep`, `callProgress`

**Fichiers à lire** :
- `sos/src/pages/CallCheckoutWrapper.tsx`
- `sos/src/pages/CallCheckout.tsx`
- `sos/src/components/payment/PayPalPaymentForm.tsx`
- `sos/src/components/payment/GatewayIndicator.tsx`
- `sos/src/components/payment/PaymentFeedback.tsx`
- `sos/src/services/pricingService.ts` (frontend pricing)
- `sos/firebase/functions/src/callables/validateCoupon.ts`

## Étape 7 — Traitement du paiement

**À documenter** par gateway :

### 7.A Stripe Path
1. `actuallySubmitPayment()` ou Apple Pay handler
2. Frontend appelle `httpsCallable("createPaymentIntent")` avec `paymentData` (amount, commissionAmount, providerAmount, currency, providerId, clientId, callSessionId, metadata)
3. Backend `createPaymentIntent.ts` :
   - Vérifie auth (`request.auth`)
   - Validate amount limits (`validateAmountSecurity`)
   - Validate business logic (provider exists, online, etc.)
   - Get pricing config (avec override admin si actif)
   - Apply coupon
   - Apply affiliate discount (`resolveAffiliateDiscount`)
   - Validate amount mismatch (`Math.abs(client - expected) > 0.5` reject)
   - Create lock anti-doublon (`payment_locks/{key}`)
   - Call Stripe API : `stripeManager.createPaymentIntent`
     - Mode `Destination Charges` si provider a Stripe Connect KYC complet
     - Mode `Platform Escrow` si KYC incomplet ou pas de compte
   - Retourne `clientSecret`
4. Frontend : `stripe.confirmCardPayment(clientSecret, { payment_method: { card: ... } })`
5. Stripe traite 3DS si requis (status `requires_action` → `stripe.handleCardAction`)
6. Status final : `requires_capture` (auth hold)
7. Document `payments/{piId}` créé via `savePaymentRecord` (côté backend)

### 7.B PayPal Path
1. User clique sur le bouton PayPal SDK
2. SDK appelle `createOrder` qui POST vers `createpaypalorderhttp` (Cloud Run europe-west3)
3. Backend `PayPalManager.ts:2889+` :
   - Valide auth Firebase token
   - Récupère provider (Firestore)
   - Vérifie `paypalEmail` présent (sinon platform escrow)
   - Récupère server pricing (`getServiceAmounts` qui lit overrides depuis fix 2026-05-03)
   - Valide amount mismatch (tolérance 0.05)
   - Crée order PayPal via `manager.createSimpleOrder`
4. SDK ouvre popup PayPal, user approuve
5. SDK appelle `onApprove` → POST `authorizepaypalorderhttp`
6. Backend autorise (capture_method = AUTHORIZE, pas CAPTURE)
7. Frontend reçoit `authorizationId` + status

### 7.C B2B Path
1. Frontend appelle `triggerSosCallFromWeb` callable (région europe-west1)
2. Backend valide code partenaire, quota, service type
3. Backend crée `call_sessions/{id}` avec `payment.gateway = 'b2b_sos_call_free'`, `payment.intentId = null`
4. Pas de PaymentIntent / pas de PayPal Order
5. Schedule Cloud Task immédiatement (pas d'autorisation à attendre)

**Fichiers à lire** :
- `sos/firebase/functions/src/createPaymentIntent.ts`
- `sos/firebase/functions/src/StripeManager.ts`
- `sos/firebase/functions/src/PayPalManager.ts`
- `sos/firebase/functions/src/partner/callables/triggerSosCallFromWeb.ts`
- `sos/firebase/functions/src/lib/stripe.ts`

## Étape 8 — Programmation de l'appel

**À documenter** :
- Frontend appelle `httpsCallable("createAndScheduleCall")` avec `callData` (provider/client phones, paymentIntentId, etc.)
- Backend `createAndScheduleCallFunction.ts:createAndScheduleCallHTTPS` :
  - Vérifie auth + payment status
  - Crée `call_sessions/{id}` avec status `pending`
  - Crée `payments/{id}` link (`payment.intentId` ↔ `callSessionId`)
  - Schedule Cloud Task vers `executeCallTask` avec délai 240s (4 min)
  - Crée notifications client + provider dans `message_events`
    - Client : `call.scheduled.client` (in-app uniquement)
    - Provider : `booking_paid_provider` (SMS + in-app + email selon config)
  - Sync Outil IA (cf. `forcedAIAccess`)
- Persiste `orders/{id}` côté frontend (`persistPaymentDocs`)
- Telegram event `forwardEventToEngine('call_completed')` à terme (mais pas ici, plutôt après l'appel)

**Fichiers à lire** :
- `sos/firebase/functions/src/createAndScheduleCallFunction.ts`
- `sos/firebase/functions/src/lib/tasks.ts` (scheduleCallTaskWithIdempotence)

## Étape 9 — Page d'attente avec compte à rebours

**À documenter** :
- Frontend navigate vers `/{locale}/{translatedSlug}` (ex: `/fr-fr/paiement-reussi`)
- `PaymentSuccess.tsx` mount
- Lecture `lastPaymentSuccess` depuis sessionStorage (durée 30s)
- Fallback : URL params (rétrocompatibilité)
- Initialisation : `callId`, `paymentIntentId`, `orderId`, `providerId`, `serviceType`, `amount`, `duration`
- Compte à rebours : 240s (4 min) jusqu'au déclenchement Twilio
- Subscription Firestore : `onSnapshot(call_sessions/{callId})` pour voir status temps réel
  - `pending` → `calling` → `connected` → `completed` ou `failed`
- Affichage du provider, du service, du prix
- Banner B2B "Pris en charge par {partnerName}" si applicable
- Modal review post-appel (déclenché par `onSnapshot` quand status=`completed` et durée >= 60s)

**Fichiers à lire** :
- `sos/src/pages/PaymentSuccess.tsx`

## Étape 10 — Déclenchement Twilio (Cloud Task → executeCallTask)

**À documenter** :
- Après 240s, Cloud Task fire vers `executeCallTask` (HTTP function)
- `executeCallTask` lit `call_sessions/{id}`
- Si status != `pending` → skip (idempotency)
- Récupère phones décryptés (`decryptPhoneNumber`)
- Set provider `busy` (`setProviderBusy` callable)
- Lance 2 appels Twilio en parallèle :
  - `twilioClient.calls.create({ to: clientPhone, from: TWILIO_PHONE_NUMBER, url: <client TwiML URL> })`
  - `twilioClient.calls.create({ to: providerPhone, from: TWILIO_PHONE_NUMBER, url: <provider TwiML URL> })`
- Stocke `participants.client.callSid` et `participants.provider.callSid`
- Caller ID affiché : `+447427874305` (UK)

**Fichiers à lire** :
- `sos/firebase/functions/src/runtime/executeCallTask.ts` (ou équivalent)
- `sos/firebase/functions/src/TwilioCallManager.ts`
- `sos/firebase/functions/src/Webhooks/twilioWebhooks.ts` (initial call URL)

## Étape 11 — Confirmation DTMF (les 2 parties)

**À documenter** :
- Twilio appelle le client → joue prompt vocal (`getIntroText` + `getConfirmationText` from `voicePrompts.json`)
- Le client doit appuyer sur `1` (Gather DTMF)
- Webhook `twilioGatherResponse` reçoit le DTMF
- Si pressé `1` → join conference room (Twilio Conference)
- Sinon → status = `no_answer`, retry (jusqu'à 3 essais via `callParticipantWithRetries`)
- Idem côté provider
- Quand les 2 parties ont rejoint la conférence → `conference-start` webhook
- 50 langues supportées pour les voice prompts (`voicePrompts.json`)

**Fichiers à lire** :
- `sos/firebase/functions/src/Webhooks/twilioWebhooks.ts` (twilioGatherResponse)
- `sos/firebase/functions/src/content/voicePrompts.json`

## Étape 12 — Conversation pendant l'appel

**À documenter** :
- Conférence Twilio active
- Recording (si activé via `record: 'record-from-start'`)
- `participant-join` webhook → set `participants.{type}.connectedAt`
- `participant-leave` webhook → set `participants.{type}.disconnectedAt`
- `conference.duration` calculé en temps réel
- `billingDuration` = `now - conference.startedAt` quand un participant raccroche
- Pas de timeout côté Twilio (sauf force end via Cloud Task `forceEndCallTask` à la durée prévue)

**Fichiers à lire** :
- `sos/firebase/functions/src/Webhooks/TwilioConferenceWebhook.ts`
- `sos/firebase/functions/src/runtime/forceEndCallTask.ts`

## Étape 13 — Fin d'appel et capture/refund

**À documenter** :
- Une partie raccroche → `twilioCallWebhook` (call.completed) ou `twilioConferenceWebhook` (conference-end)
- Calcul du `billingDuration` (depuis le moment où les 2 sont connectés)
- Si `billingDuration >= MIN_CALL_DURATION (60s)` :
  - `handleCallCompletion(sessionId, billingDuration)` → `capturePaymentForSession`
  - Stripe : `paymentIntents.capture(piId, { amount_to_capture: total })` → status `succeeded`
  - PayPal : `paypalManager.captureAuthorization(authorizationId)` → status `CAPTURED`
  - Transfer auto vers provider (Destination Charges) ou capture sur compte plateforme (escrow)
  - Mise à jour `payments/{id}.status = 'captured'` puis `'succeeded'` après webhook
- Si `billingDuration < 60s` :
  - `handleEarlyDisconnection(sessionId, participantType, duration)`
  - Si les 2 étaient connectés : `handleCallFailure` → `processRefund`
    - Stripe + status authorized → `cancelPayment` → status `cancelled`
    - Stripe + status captured → `refundPayment` → status `refunded`
    - PayPal + status authorized → `voidAuthorization` → status `voided`
    - PayPal + status captured → `refundPayment` → status `refunded`
  - Sinon : retry loop si `attemptCount < 3`
- Si `provider_no_answer` après 3 retries : refund + provider mis offline (sauf AAA / manuel)
- Si `client_no_answer` après 3 retries : refund + provider remis available

**Fichiers à lire** :
- `sos/firebase/functions/src/TwilioCallManager.ts` (handleCallCompletion, handleEarlyDisconnection, handleCallFailure, processRefund, capturePaymentForSession)
- `sos/firebase/functions/src/Webhooks/twilioWebhooks.ts` (handleCallCompleted)
- `sos/firebase/functions/src/Webhooks/TwilioConferenceWebhook.ts` (handleConferenceEnd)
- `sos/firebase/functions/src/Webhooks/stripeWebhookHandler.ts` (payment_intent.succeeded, charge.refunded)

## Étape 14 — Notifications post-appel

**À documenter** :
- Trigger `consolidatedOnCallCompleted` (ou `handleCallCompleted` du moduleemailMarketing)
- Email client : confirmation appel + facture PDF
- Email provider : confirmation paiement reçu
- SMS client : "Votre appel est terminé"
- Telegram engine : event `call_completed` envoyé à `engine-telegram-sos-expat.life-expat.com`
  - Bot principal `@sos_expat_bot` → admin chat 7560535072
- Trigger `onCallSessionPaymentCaptured` → Meta CAPI Purchase event
- Trigger `onCallSessionPaymentAuthorizedTrackGoogleAdsCheckout` → Google Ads conversion
- Génération invoices PDF (`createInvoices` dans TwilioCallManager)
  - Invoice client (TVA selon pays)
  - Invoice provider (commission deduction)
- Demande de review (modal frontend ou email post-appel)
- Affiliate commissions calculées et créées :
  - `chatter_commissions/{id}` (referral $5 fixe)
  - `influencer_commissions/{id}` (5%)
  - `blogger_commissions/{id}` (configurable)
  - `group_admin_commissions/{id}` ($5 fixe)
  - `affiliate_commissions/{id}` (catch-all)
  - `commissions/{id}` (unified system)
- Triggers post-commission : `onCommissionCreated` → mise à jour totaux affilié

**Fichiers à lire** :
- `sos/firebase/functions/src/triggers/consolidatedOnCallCompleted.ts`
- `sos/firebase/functions/src/emailMarketing/functions/transactions.ts` (handleCallCompleted, handleEarningCredited)
- `sos/firebase/functions/src/triggers/capiTracking.ts`
- `sos/firebase/functions/src/triggers/googleAdsTracking.ts`
- `sos/firebase/functions/src/notifications/notifyAfterPayment.ts`

## Étape 15 — Payout vers le prestataire (encaissement)

**À documenter** :
- 4 modes de payout selon le profil du prestataire :

### 15.A Stripe Connect Destination Charges (KYC complet)
- Le `transfer_data.destination` du PaymentIntent fait que le transfer est AUTOMATIQUE à la capture
- Le prestataire reçoit `(amount - application_fee_amount)` instantanément sur son compte Stripe Connect
- Le payout vers son compte bancaire suit le rolling schedule Stripe (généralement 7 jours pour FR, 14 jours pour US, etc.)
- Pas d'action backend requise

### 15.B Stripe Platform Escrow (KYC incomplet)
- Argent reste sur le compte plateforme
- Quand le provider complète son KYC → `onProviderKycCompleted` trigger → transfer manuel via `stripeManager.createTransfer`

### 15.C PayPal Payouts API
- `processProviderPayoutPayPal` dans PayPalManager
- POST `/v1/payments/payouts` avec `recipient_type: EMAIL`
- Provider reçoit l'argent sur son email PayPal
- Frais Stripe-like : configurable

### 15.D AAA (test/démo)
- `aaaPayoutMode = 'internal'` → skip payout, argent reste sur plateforme
- `aaaPayoutMode = 'external'` → transfer vers compte consolidé AAA (cf. `aaa_external_payouts` collection)

### Cas spécial B2B (30-day reserve)
- Pour les sessions B2B, le crédit provider est immédiat MAIS le payout effectif est différé de 30 jours
- Permet à SOS-Expat d'absorber le risque de défaut du partenaire (qui paie après facturation)
- Cf. `provider_payouts/{id}.releaseDate = createdAt + 30 days`

### Triggers post-payout
- `onProviderTransferCompleted` → met à jour `users/{providerId}.totalEarnings`
- Email "Vous avez reçu X€" envoyé au provider
- Telegram event `withdrawal_request` si le provider demande un retrait depuis dashboard

**Fichiers à lire** :
- `sos/firebase/functions/src/StripeManager.ts` (executePayoutForCallSession, processProviderPayout)
- `sos/firebase/functions/src/PayPalManager.ts` (processProviderPayoutPayPal)
- `sos/firebase/functions/src/accounting/triggers.ts` (onProviderTransferCompleted)
- `sos/firebase/functions/src/partner/scheduled/releasePartnerPendingCommissions.ts`

## Étape 16 — Reviews post-appel (côté client)

**À documenter** :
- Modal review déclenchée automatiquement quand `call_sessions.status = 'completed'` ET `billingDuration >= 60s` (cf. `PaymentSuccess.tsx:showReviewModal`)
- Note 1-5 étoiles + commentaire optionnel
- Stockage : `reviews/{reviewId}` avec champs `clientId`, `providerId`, `callSessionId`, `rating`, `comment`, `createdAt`, `language`
- Trigger `onReviewCreated` :
  - Met à jour `users/{providerId}.averageRating` et `reviewCount`
  - Met à jour `sos_profiles/{providerId}.rating` et `reviewCount`
  - Recalcule le ranking provider (impact sur ProfileCarousel)
  - Si rating <= 2 → Telegram alert `negative_review` à l'admin chat
- Email rappel J+1 si pas de review
- Email rappel J+7 si toujours pas de review
- Affichage des reviews sur `ProviderProfile.tsx`
- Modération admin (collection `review_reports` si flag)
- Anti-fraude : vérifier qu'un client ne peut review que les providers avec qui il a eu un call ≥ 60s

**Branches** :
- ✅ Review soumise → trigger update + email confirmation provider
- 🟠 Modal fermée sans review → email rappel
- 🟠 Review négative → admin alert
- ❌ Review tentée sans call valide → reject server-side

**Fichiers à lire** :
- `sos/src/pages/PaymentSuccess.tsx` (showReviewModal)
- `sos/src/components/reviews/ReviewModal.tsx` (si existant)
- `sos/firebase/functions/src/triggers/onReviewCreated.ts` (si existant)
- `sos/src/pages/admin/AdminReviews.tsx`

## Étape 17 — Withdrawal (retrait des gains par le prestataire)

**À documenter** :
- Le provider voit son solde sur son dashboard (`users/{providerId}.totalEarnings` ou `availableBalance`)
- Seuil minimum : **$30** (3000 cents — harmonisé sur 4 types.ts backend, frontend forms, admin configs, 9 langues)
- Frais retrait : **$3 fixe** par transaction (configurable via `admin_config/fees`, `feeCalculationService.ts`, cache 5 min)
- Méthodes selon pays :
  - **Stripe Connect** : payout auto sur rolling schedule
  - **PayPal** : `paypalManager.processProviderPayout` via Payouts API → email
  - **Wise** : `wiseProvider` (frontend `'wise'` → backend `'bank_transfer'`)
  - **Flutterwave Mobile Money** : pour pays Afrique (cf. `flutterwaveProvider.ts`, `FLUTTERWAVE_COUNTRIES` détection auto via `user.country` dans `AffiliateBankDetails.tsx`)
  - **Bank transfer** : SEPA pour EU
- Flux client → backend :
  - Provider clique "Retirer" sur dashboard
  - Frontend appelle `requestWithdrawal` callable (régions différentes : `payment/`, `chatter/`, `influencer/`, `blogger/`, `groupAdmin/`, `partner/` callables)
  - Backend `createWithdrawalRequest` :
    - Calcule `withdrawalFee` ($3) + `totalDebited` (amount + fee)
    - Crée `payment_withdrawals/{id}` avec status `pending`
    - Déduit `totalDebited` du `availableBalance` (transaction atomique)
    - Lock anti-doublon
  - Admin valide manuellement OU auto-validation pour montants < threshold
  - Trigger `onWithdrawalStatusChanged` :
    - Si status=`approved` → exécute payout via gateway choisi
    - Si status=`failed` → rembourse le `totalDebited` au `availableBalance` + email Zoho + Telegram alert
    - Si status=`completed` → email confirmation + Telegram event `withdrawal_completed`
- Affichage tracking : `WithdrawalTracker.tsx`, `WithdrawalStatusBadge.tsx`, `WithdrawalBottomSheet.tsx`
- Historique : `WithdrawalsHistoryTab` filtré par status, export CSV BOM
- Telegram bot dédié `@sos_expat_withdrawals_bot` (chat 7560535072) — withdrawals UNIQUEMENT

**Branches** :
- ✅ Retrait validé + payout exécuté → email + Telegram + crédit bancaire/PayPal
- 🟠 Retrait pending validation admin → notification admin Telegram
- 🟠 Payout failed (email PayPal invalide, IBAN incorrect) → refund balance, email Zoho user
- ❌ Solde insuffisant → reject avec message clair
- ❌ Tentative retrait < $30 → reject "Montant minimum $30"
- ❌ Doublon (lock actif) → reject "Une demande de retrait est déjà en cours"

**Fichiers à lire** :
- `sos/firebase/functions/src/payment/callables/requestWithdrawal.ts`
- `sos/firebase/functions/src/affiliate/callables/requestWithdrawal.ts`
- `sos/firebase/functions/src/chatter/callables/requestWithdrawal.ts`
- `sos/firebase/functions/src/influencer/callables/requestWithdrawal.ts`
- `sos/firebase/functions/src/blogger/callables/requestWithdrawal.ts`
- `sos/firebase/functions/src/groupAdmin/callables/requestWithdrawal.ts`
- `sos/firebase/functions/src/partner/callables/partnerRequestWithdrawal.ts`
- `sos/firebase/functions/src/triggers/onWithdrawalStatusChanged.ts`
- `sos/firebase/functions/src/payment/providers/flutterwaveProvider.ts`
- `sos/firebase/functions/src/payment/providers/wiseProvider.ts`
- `sos/src/components/payment/WithdrawalRequestForm.tsx`
- `sos/src/components/payment/Tracking/WithdrawalTracker.tsx`
- `sos/src/components/payment/AffiliateBankDetails.tsx`

## Étape 18 — Disputes / Chargebacks (cas exceptionnel)

**À documenter** :
- Stripe webhook `charge.dispute.created` → trigger `handleDisputeCreated`
  - Set `payments/{id}.disputed = true`
  - Telegram alert `security_alert` à l'admin
  - Freeze le transfer provider en cours (si pas encore exécuté)
- Stripe webhook `charge.dispute.funds_withdrawn` → l'argent est temporairement bloqué chez Stripe
- Stripe webhook `charge.dispute.closed`:
  - `won` → unfreeze, transfer provider exécuté
  - `lost` → admin doit décider du provider clawback (récupérer auprès du provider) ou absorber par SOS-Expat
- PayPal disputes : `case_resolved` webhook similaire
- Flux admin :
  - Admin reçoit Telegram alert
  - Admin va sur `AdminDisputes.tsx` (si existant) ou Stripe Dashboard
  - Admin upload evidence (call recording, transcript, etc.)
  - Stripe traite la dispute (généralement 60-75 jours)
- Impact provider :
  - Si dispute `lost` → option A: clawback auto via `chatter_commissions cancel`, option B: SOS-Expat absorbe
  - Si dispute fréquente sur même provider → flag automatique pour review

**Branches** :
- 🟠 Dispute opened → freeze + admin alert
- ✅ Dispute won → unfreeze, transfer normal
- ❌ Dispute lost → décision manuelle clawback ou absorbe

**Fichiers à lire** :
- `sos/firebase/functions/src/Webhooks/stripeWebhookHandler.ts` (chercher `dispute`)
- `sos/firebase/functions/src/admin/disputes/` (si existant)

</phases>

---

<output_format>

## Format du document final

Le livrable est `audit_artifacts_<DATE>/journey_user.md`, structuré ainsi :

```markdown
# Parcours utilisateur SOS-Expat — Du clic à l'encaissement
*Date : <DATE>*
*Mode : audit lecture seule*

## Synthèse visuelle (diagramme texte)

[ASCII diagram du flow avec branches]

## Légende des types de clients

- **B2C standard** : ...
- **B2C affilié** : ...
- **B2B SOS-Call** : ...

## Légende des types de prestataires

- **Stripe Connect KYC complet** : ...
- **Stripe KYC incomplet** : ...
- **PayPal email** : ...
- **AAA** : ...

---

## Étape 1 — Arrivée sur le site

### Ce que voit l'utilisateur
[narratif]

### Ce que fait le frontend
| Composant | Action | File:line |
|---|---|---|
| `App.tsx` | Mount, dispatch app-mounted | `App.tsx:976-996` |
| `MetaPageViewTracker` | Track page view | `MetaPageViewTracker.tsx:...` |
| ... | ... | ... |

### Ce que fait le backend
[Aucun appel backend à cette étape, ou liste]

### Ce qui change dans Firestore
[Aucun ou liste collection/doc/champs]

### Ce qui change côté externe
- GA4 : event `page_view`
- Meta Pixel : event `PageView`
- ...

### Branches
- ✅ Cas nominal : ...
- 🟠 Cookie consent refusé : ...
- ❌ JS désactivé : ...

---

[répéter le même bloc pour chaque étape]

---

## Annexe A — Tableau récapitulatif des collections Firestore touchées

| Collection | Étape de création | Champs critiques | Étape de finalisation |
|---|---|---|---|
| `payment_locks` | 7 | createdAt, callSessionId | 7 (release sur erreur) |
| `payments` | 7 | status, intentId, providerStripeAccountId | 13 (capture/refund) |
| `call_sessions` | 8 | status, scheduledFor, payment | 13 (completed/failed) |
| `orders` | 8 | status, totalSaved | 14 (invoice generation) |
| `invoices` | 14 | url, sentStatus | - |
| ... | ... | ... | ... |

## Annexe B — Tableau des callables/HTTP functions

| Function | Région | Trigger | Étape | Notes |
|---|---|---|---|---|
| `createPaymentIntent` | europe-west3 | callable | 7 | 512MiB, max 20 |
| `createAndScheduleCallHTTPS` | europe-west1 | callable | 8 | 512MiB, max 20 |
| ... | ... | ... | ... | ... |

## Annexe C — Branches d'erreur consolidées

[Tableau complet erreur → étape → message → état final]

## Annexe D — Différences entre les types de clients

| Étape | B2C standard | B2C affilié | B2B SOS-Call |
|---|---|---|---|
| 5 — BookingRequest | `BookingRequest.tsx` | idem + capture ref | `BookingRequestB2B.tsx` |
| 6 — Paiement | Stripe ou PayPal | idem + discount affiché | Pas de paiement |
| 7 — Backend | createPaymentIntent | idem | triggerSosCallFromWeb |
| ... | ... | ... | ... |

## Annexe E — Différences entre les types de prestataires

[Tableau similaire pour les 4 types]

## Annexe F — Glossaire

- **PI** : PaymentIntent (Stripe)
- **Destination Charges** : mode Stripe où le PI est créé sur la plateforme avec `transfer_data.destination` pour transférer auto au provider
- **Platform Escrow** : mode où l'argent reste sur la plateforme jusqu'à transfer manuel
- **MIN_CALL_DURATION** : 60 secondes, seuil de capture vs refund
- **DTMF** : Dual-Tone Multi-Frequency, signal pour confirmer la prise d'appel (presser 1)
- **Idempotency** : même requête rejouée = même effet (pas d'effet de bord en double)
- **AAA profile** : compte de test/démo, exempt de certaines règles métier
- ...
```

</output_format>

---

<rules>

## Règles de comportement

1. **Read-only strict** — aucune action mutative. Si tu hésites sur une commande → ne la lance pas.

2. **Précision des références** — chaque assertion technique doit être suivie d'une référence `fichier.ts:ligne` ou `Firestore: collection/path/champ`.

3. **Lisibilité grand public** — chaque étape commence par un paragraphe narratif compréhensible par un non-développeur (ex: « Le client clique sur Réserver. Une page apparaît avec... »). Les détails techniques viennent ensuite.

4. **Exhaustivité des branches** — pour chaque étape, lister TOUS les chemins possibles (✅ nominal, 🟠 dégradé, ❌ erreur). Ne pas se contenter du happy path.

5. **Différenciation par type de client/prestataire** — chaque étape doit mentionner si le comportement diffère pour B2C standard / B2C affilié / B2B, et pour Stripe Connect / PayPal / AAA.

6. **Schémas textuels** — utiliser des diagrammes ASCII pour les flows complexes (étapes 7, 13, 15).

7. **Exemples concrets** — pour chaque étape, donner au moins 1 exemple chiffré (ex: « Pour un appel avocat 49€ FR avec promo override admin à 1€ et coupon WELCOME10 stackable... »).

8. **Cross-references** — quand une étape dépend d'une autre, mettre le lien (ex: « voir Étape 7 »).

9. **Pas d'invention** — si tu ne trouves pas l'info dans le code, marque `À DOCUMENTER MANUELLEMENT` plutôt que d'extrapoler.

10. **Self-review** — avant de rendre, relis le document et vérifie : « est-ce qu'un nouveau dev peut comprendre comment marche le système juste avec ce document ? ». Si non, complète.

</rules>

---

<cross_matrix>

## Matrice combinatoire complète à couvrir

Le document doit explicitement traiter le **produit cartésien** des dimensions suivantes. Pour chaque combinaison significative, indiquer :
- ✅ Comportement attendu (passe)
- ❌ Cas où le système doit refuser (avec message)
- ⚠️ Cas dégradé (passe avec banner / fallback)

### Dimensions

| Dimension | Valeurs possibles | Cardinalité |
|---|---|---|
| **Type de client** | B2C standard, B2C affilié (chatter/influencer/blogger/groupAdmin/partner), B2B SOS-Call | 7 |
| **Auth state** | Already logged in, Logged out → Quick Auth, Logged out → Full Register | 3 |
| **Type de prestataire** | Réel + Stripe Connect KYC complet, Réel + Stripe KYC incomplet, Réel sans Stripe (PayPal email), AAA internal payout, AAA external payout, Multi-prestataire propriétaire, Multi-prestataire enfant | 7 |
| **État prestataire au moment du booking** | online+available, online+busy, offline, suspended, banned | 5 |
| **Méthode de paiement** | Stripe CardElement desktop, Stripe CardElement mobile, Stripe Apple Pay, Stripe Google Pay, PayPal compte, PayPal carte (guest), B2B (gratuit) | 7 |
| **Devise** | EUR, USD | 2 |
| **Promotion active** | Aucune, Override admin, Coupon, Affiliate, Override+Coupon stackable, Override+Affiliate stackable, Coupon+Affiliate, Triple stacking | 8 |
| **Pays client** | FR, US, UK, DE, ES, IT, BE, MX, BR, TH, VN, MM, LA, KH, ID, PH, MY, SG, TW, JP, AU | 21 |
| **Pays prestataire** | idem + provider stripe-incompatible (AF, BD, CU, IR, IQ, KP, SY, etc.) | ~25 |
| **Langue UI** | fr, en, es, de, ru, pt, ch, hi, ar | 9 |
| **Langue voice prompts** | 50 langues (cf. voicePrompts.json) | 50 |
| **Durée appel** | <60s (refund), 60-120s (capture courte), 120-240s (capture moyenne), >=durée prévue (capture max), provider_no_answer×3, client_no_answer×3, 3DS timeout, network drop pendant appel | 8 |
| **Erreur réseau** | Aucune, frontend offline temporaire, backend timeout, Cloud Run cold start, OOM Cloud Run, quota CPU saturé, Stripe webhook duplication, Twilio webhook duplication | 8 |

**Produit cartésien théorique** : 7 × 3 × 7 × 5 × 7 × 2 × 8 × 21 × 25 × 9 × 50 × 8 × 8 ≈ 11 milliards de combinaisons.

**Combinaisons significatives à documenter** : ~80 (échantillon représentatif couvrant chaque axe au moins 2 fois).

### Combinaisons obligatoires (40 cas qui DOIVENT être dans le doc)

#### Bloc A — B2C Stripe golden paths (10 cas)
- A.1 — FR client, FR provider, EUR, lawyer, Stripe CB desktop, online+available, no promo, durée 5min, Stripe Connect KYC ok → ✅ capture + transfer auto
- A.2 — FR client, FR provider, EUR, expat, Stripe Apple Pay mobile, online, no promo, durée 30min → ✅ capture
- A.3 — US client, US provider, USD, lawyer, Stripe Google Pay, no promo, durée 10min → ✅ capture USD
- A.4 — DE client, FR provider (cross-border), EUR, expat, Stripe CB, no promo, durée 8min → ✅ capture
- A.5 — FR client, AAA provider (Vietnam), EUR, lawyer, Stripe CB, override admin 1€, durée 60s → ✅ capture 1€, AAA internal payout (skip)
- A.6 — UK client, FR provider, EUR, lawyer, Stripe Apple Pay, coupon WELCOME10 (-10%), durée 4min → ✅ capture 44.10€
- A.7 — FR client affiliate via influencer, FR provider, EUR, expat, Stripe CB, affiliate 5%, durée 6min → ✅ capture 18.05€
- A.8 — FR client (1ère réservation post-inscription), FR provider, EUR, lawyer, Stripe CB, no promo, durée 5min → ✅ capture + tracking new_user
- A.9 — FR client, multi-prestataire enfant (status partagé via owner), EUR, lawyer, Stripe CB, durée 5min → ✅ capture sur compte propriétaire
- A.10 — FR client, FR provider en KYC incomplet, EUR, lawyer, Stripe CB, durée 5min → ✅ capture sur platform escrow, transfer différé

#### Bloc B — B2C PayPal golden paths (8 cas)
- B.1 — FR client, VN provider PayPal-only, EUR, lawyer, PayPal compte, no promo, durée 5min → ✅ capture + payout PayPal email
- B.2 — TH client, TH provider, EUR, expat, PayPal carte guest, no promo, durée 10min → ✅
- B.3 — FR client, MM provider, EUR, lawyer, PayPal compte, **override admin 1€**, durée 5min → ✅ (fix 2026-05-03 vérifié)
- B.4 — VN client, VN provider, EUR, lawyer, PayPal compte, durée 30s → ✅ void authorization
- B.5 — LA client, LA provider sans PayPal email, EUR, expat, PayPal compte, durée 5min → ✅ capture sur platform, payout différé
- B.6 — KH client, KH provider, EUR, lawyer, PayPal compte, coupon -5€, durée 4min → ✅
- B.7 — ID client, ID provider, USD, expat, PayPal compte, no promo, durée 8min → ✅
- B.8 — FR client, FR AAA provider, EUR, expat, PayPal compte, no promo, durée 5min → ✅ AAA internal skip

#### Bloc C — B2B SOS-Call (5 cas)
- C.1 — Client B2B avec code partenaire valide, FR provider, lawyer dans `allowedServiceTypes`, durée 5min → ✅ capture B2B + 30j reserve
- C.2 — Client B2B, code partenaire valide, expat alors que partenaire = lawyer-only → ❌ refus avec message
- C.3 — Client B2B, code partenaire avec quota mensuel atteint → ❌ refus avec message
- C.4 — Client B2B, code partenaire expiré → ❌ refus
- C.5 — Client B2B, durée appel <60s → ✅ `isPaid: true` quand même (pas de refund possible B2B)

#### Bloc D — Erreurs paiement (12 cas)
- D.1 — Stripe carte refusée (`card_declined`) → ❌ message "Carte refusée 💳", PI canceled, retry possible
- D.2 — Stripe solde insuffisant → ❌ "Solde insuffisant 💰"
- D.3 — Stripe CVC incorrect → ❌ "Code de sécurité incorrect 🔐"
- D.4 — Stripe carte expirée → ❌ "Carte expirée 📅"
- D.5 — Stripe 3DS timeout (>10min) → ❌ "L'authentification 3D Secure a expiré"
- D.6 — PayPal user cancel popup → ⚠️ "Paiement annulé"
- D.7 — Numéros client/provider identiques → ❌ pré-check frontend "Vous ne pouvez pas vous appeler vous-même"
- D.8 — Provider numéro invalide (regex E.164 fail) → ❌ "Le prestataire n'a pas de numéro valide"
- D.9 — Provider devient offline entre booking et paiement → ❌ "Le prestataire est actuellement hors ligne"
- D.10 — Doublon paiement (lock actif <5min) → ❌ "Un paiement similaire est déjà en cours"
- D.11 — Amount mismatch (frontend envoie tarif différent du backend) → ❌ HttpsError invalid-argument
- D.12 — Network drop pendant `confirmCardPayment` → ❌ timeout 60s, retry conseillé

#### Bloc E — Erreurs appel (8 cas)
- E.1 — Provider décroche pas (3 retries) → ❌ message TwiML "Le prestataire n'a pas répondu, vous serez remboursé immédiatement"
- E.2 — Client décroche pas (3 retries) → ❌ refund + SMS provider "Client did not answer"
- E.3 — Provider raccroche après 30s → ✅ refund/cancel, message "Appel trop court, remboursement émis"
- E.4 — Client raccroche après 30s → idem
- E.5 — Conference fail (Twilio infra error) → ❌ refund + admin alert
- E.6 — Twilio webhook duplication → ✅ idempotency lock fonctionne, pas de double processRefund
- E.7 — OOM Cloud Run pendant `twilioCallWebhook` → ❌ Twilio joue son message default + PI stuck (à éviter avec fix 2026-05-03)
- E.8 — Cloud Task fire mais provider est devenu offline entre temps → ⚠️ retry ou refund ?

#### Bloc F — Edge cases auth (4 cas)
- F.1 — User pas connecté arrive sur CallCheckout via deeplink → redirect login
- F.2 — User connecté mais email non vérifié → blocage ?
- F.3 — User suspendu admin tente de réserver → ❌ refus
- F.4 — User connecté avec session expirée → re-auth silencieuse ou redirect login

#### Bloc G — Edge cases payout prestataire (3 cas)
- G.1 — Stripe Connect désactivé après création (compte fermé) → fallback platform escrow
- G.2 — PayPal email invalide → payout pending, admin doit le corriger manuellement
- G.3 — AAA external account déconnecté → log dans `aaa_external_payouts` avec status pending

#### Bloc H — Reviews + cycle vie post-appel (5 cas)
- H.1 — Client soumet review 5★ après call >= 60s → ✅ `reviews/{id}` créé, provider rating recalculé
- H.2 — Client soumet review 1★ → ✅ admin Telegram alert `negative_review`
- H.3 — Client ferme modal sans review → email rappel J+1, J+7
- H.4 — Client tente review sur call < 60s → ❌ reject server-side
- H.5 — Client tente review sur provider avec qui il n'a jamais call → ❌ reject

#### Bloc I — Cancellations / withdrawals client/provider (6 cas)
- I.1 — Client annule entre paiement (08:42) et déclenchement Twilio (08:46) → refund auto, Cloud Task cancellé
- I.2 — Provider annule scheduled call avant Twilio fire → refund client, provider mis offline ou warning
- I.3 — Client annule pendant 3DS → PI reste en `requires_action` → cleanup auto via stuckPaymentsRecovery
- I.4 — Client tente annulation après Twilio call déclenché → impossible (call en cours)
- I.5 — Provider devient suspendu admin entre booking et call → refund client + reschedule offert
- I.6 — Force-end-call task à durée prévue (1200s lawyer / 1800s expat) → end conference, capture standard

#### Bloc J — Withdrawals provider (8 cas)
- J.1 — Provider FR demande $50 retrait Stripe Connect → ✅ payout auto rolling schedule (~7j)
- J.2 — Provider VN demande $50 retrait PayPal → ✅ Payouts API → email PayPal
- J.3 — Provider TG demande $50 retrait Mobile Money via Flutterwave → ✅ MoMo confirmé
- J.4 — Provider EU demande $100 retrait SEPA Wise → ✅ Wise transfer
- J.5 — Provider tente retrait $20 (< seuil $30) → ❌ reject "Montant minimum $30"
- J.6 — Provider avec balance $40 tente $40 retrait → ✅ accepté mais frais $3 → reçoit $37
- J.7 — Provider avec PayPal email invalide → withdrawal `failed`, balance restaurée + email Zoho + Telegram alert
- J.8 — Provider tente 2 retraits simultanés → ❌ lock anti-doublon, 2e refusé

#### Bloc K — Cascade refund → affiliate commissions (5 cas)
- K.1 — Refund après commission Chatter → `cancelChatterCommissions` annule la commission
- K.2 — Refund après commission Influencer → `cancelInfluencerCommissions` annule
- K.3 — Refund après commission Blogger → `cancelBloggerCommissions` annule
- K.4 — Refund après commission GroupAdmin → `cancelGroupAdminCommissions` annule
- K.5 — Refund avec 5 affiliés en cascade (chatter parrain + influencer + groupAdmin + partner + unified) → toutes annulées via `Promise.allSettled`

#### Bloc L — Disputes / chargebacks (4 cas)
- L.1 — Client conteste paiement Stripe valide → `dispute.created` → freeze provider transfer + admin alert
- L.2 — Dispute won (SOS-Expat fournit evidence : recording, transcript) → unfreeze, transfer provider
- L.3 — Dispute lost → décision admin : clawback provider OU SOS-Expat absorbe
- L.4 — Provider avec 3 disputes/mois → flag automatique review admin

#### Bloc M — Multi-prestataire & concurrence (5 cas)
- M.1 — Provider A (multi-prestataire) busy → linked B/C/D propagés busy via `findParentAccountConfig`
- M.2 — 2 clients réservent provider A simultanément → 1er gagne via transaction atomique `setProviderBusy`, 2e voit "busy"
- M.3 — Real-time onSnapshot status provider → frontend voit transition online → busy → available
- M.4 — `shareBusyStatus: false` sur compte propriétaire → providers liés indépendants
- M.5 — Multi-call same client : 2e booking sur même provider 1h après le 1er → ✅ accepté (lock anti-doublon expiré)

#### Bloc N — Tax/VAT par pays (5 cas)
- N.1 — Client FR + provider FR → invoice avec TVA 20% FR
- N.2 — Client B2B EU avec n° TVA valide → invoice exempt TVA intra-EU (reverse charge)
- N.3 — Client US + provider US → invoice avec sales tax selon état (CA, NY, TX, etc.)
- N.4 — OSS VAT déclaration trimestrielle (FR/EU) → `generateOssVatDeclaration` callable
- N.5 — Client hors EU → invoice sans TVA (export service)

#### Bloc O — Notifications cross-canal (5 cas)
- O.1 — Booking confirmé → email + SMS provider + in-app + push FCM + Telegram (5 canaux)
- O.2 — Email bounce → retry 3 fois puis marquer `failed`, ne bloque pas les autres canaux
- O.3 — SMS undelivered Twilio → retry, fallback WhatsApp si configuré
- O.4 — Push FCM token invalide → cleanup token, fallback in-app
- O.5 — Telegram engine down → log + retry, ne bloque pas les autres canaux

#### Bloc P — Admin actions (5 cas)
- P.1 — Admin force-cancel un call en cours → conference end, refund client, provider reset available
- P.2 — Admin force-refund un PI déjà capturé → `stripeManager.refundPayment` + cancel commissions
- P.3 — Admin suspend un provider → `users/{id}.status = 'suspended'` → futurs bookings refusés
- P.4 — Admin valide manuellement un KYC Stripe Connect → trigger transfer des paiements escrow en attente
- P.5 — Admin modifie un override admin → broadcast cache invalidation côté Stripe + PayPal pricing

#### Bloc Q — GDPR / data deletion (3 cas)
- Q.1 — User demande suppression compte → callable `requestAccountDeletion` → freeze 30j puis purge
- Q.2 — Pendant freeze, call_sessions historiques anonymisés (clientId → "DELETED_<hash>")
- Q.3 — Invoices conservées (obligation légale 10 ans FR) mais user data anonymisée

#### Bloc R — Auth edge cases (4 cas)
- R.1 — User connecté avec email non vérifié tente booking → blocage avec message "Vérifiez votre email"
- R.2 — Session expirée pendant le checkout → re-auth silencieuse via refresh token
- R.3 — User inscrit via Google OAuth puis essaie login email/password → message "Utilisez Google pour vous connecter"
- R.4 — Reset password pendant booking actif → session invalidée, re-login obligatoire

#### Bloc S — AI Outil sync (3 cas)
- S.1 — Booking complété → sync vers Outil-sos-expat (autre Firebase project) avec `forcedAIAccess: true` pour le call
- S.2 — Outil sync échoue (network, auth) → log warning, ne bloque pas le booking (non-blocking)
- S.3 — Provider avec `forcedAIAccess: false` mais avec subscription active → sync quand même autorisée

</cross_matrix>

<test_plan_per_step>

## Plan de tests à documenter pour chaque étape

Pour chaque étape, le document doit lister explicitement :

### A. Tests fonctionnels (✅ ce qui doit marcher)
Pour chaque combinaison significative de la matrice ci-dessus, décrire :
- Préconditions (état Firestore, user, provider)
- Action utilisateur attendue
- État final attendu (Firestore, Stripe/PayPal, Twilio)

### B. Tests négatifs (❌ ce qui doit être refusé)
Pour chaque guard / validation, vérifier que le système refuse correctement :
- Quel est le check ?
- Quel message d'erreur l'utilisateur voit ?
- Quel état final dans Firestore ?

### C. Tests de robustesse (⚠️ ce qui doit dégrader proprement)
- Network errors
- Timeouts
- Cloud Run cold starts
- Webhook duplications
- Concurrent bookings

### D. Tests d'idempotence (🔁 ce qui peut être rejoué sans dégât)
- Stripe webhook replays (idempotency via `stripe_webhook_events`)
- Twilio webhook replays (idempotency via `metadata.earlyDisconnectProcessed`)
- Cloud Task retry sur `executeCallTask`
- `processRefund` rejoué après crash

### E. Tests d'observabilité (📊 ce qui doit être loggé)
- Telegram notifications attendues à chaque étape
- Sentry capture (si DSN configuré)
- GA4 + Meta Pixel + Google Ads events
- Stripe webhook events
- Logs structurés (production_logger)

### F. Tests de cohérence financière (💰 ce qui doit boucler)
- Total client = commission SOS + montant provider + frais Stripe/PayPal
- Sum(captures) = Sum(provider transfers) + Sum(commissions affiliés) + Sum(plateforme)
- Refunds annulent bien les commissions affiliés (cancel cascade)

</test_plan_per_step>

<acceptance_criteria>

Le document est **VALIDE** si :
- ✅ Les **18 étapes** sont documentées avec les 6 dimensions chacune (15 cœur du flow + 16 reviews + 17 withdrawals + 18 disputes)
- ✅ Chaque étape a au moins une référence `fichier:ligne`
- ✅ Les 6 annexes sont remplies
- ✅ Les 7 sections "Test scenarios" (A à F) sont remplies pour chaque étape
- ✅ Les **108 cas obligatoires** de la matrice combinatoire (Blocs A-S) sont tous traités :
  - Bloc A (Stripe golden) : 10 cas
  - Bloc B (PayPal golden) : 8 cas
  - Bloc C (B2B SOS-Call) : 5 cas
  - Bloc D (Erreurs paiement) : 12 cas
  - Bloc E (Erreurs appel) : 8 cas
  - Bloc F (Edge cases auth) : 4 cas
  - Bloc G (Edge cases payout) : 3 cas
  - Bloc H (Reviews) : 5 cas
  - Bloc I (Cancellations) : 6 cas
  - Bloc J (Withdrawals) : 8 cas
  - Bloc K (Cascade refund affiliés) : 5 cas
  - Bloc L (Disputes / chargebacks) : 4 cas
  - Bloc M (Multi-prestataire & concurrence) : 5 cas
  - Bloc N (Tax/VAT par pays) : 5 cas
  - Bloc O (Notifications cross-canal) : 5 cas
  - Bloc P (Admin actions) : 5 cas
  - Bloc Q (GDPR / data deletion) : 3 cas
  - Bloc R (Auth edge cases) : 4 cas
  - Bloc S (AI Outil sync) : 3 cas
- ✅ Au moins 8 schémas ASCII présents (vue d'ensemble + étapes 7, 11, 13, 15, 16, 17, 18)
- ✅ Glossaire d'au moins 30 termes (incluant les nouveaux : dispute, chargeback, OSS VAT, Flutterwave Mobile Money, Wise, FCM, etc.)
- ✅ Aucune action mutative effectuée
- ✅ Pour chaque test, indication si **observable en prod** (via logs/Firestore historiques) ou **nécessite un test live** (à programmer dans une autre session)

Le document est **INVALIDE** si :
- ❌ Une étape (sur 18) est manquante
- ❌ Aucune référence `fichier:ligne`
- ❌ Le langage est incompréhensible pour un non-développeur sur les paragraphes narratifs
- ❌ Les annexes sont absentes ou squelettiques
- ❌ Moins de **80 cas obligatoires traités** (sur 108)
- ❌ Pas de distinction `observable in prod` vs `requires live test`
- ❌ Les blocs H, I, J, K, L (les plus critiques pour la cohérence financière + UX post-call) sont skippés

</acceptance_criteria>

---

<startup>

```bash
cd C:\Users\willi\Documents\Projets\VS_CODE\sos-expat-project
DATE_REF=$(date -u +%Y-%m-%dT%H-%M-%SZ)
mkdir -p audit_artifacts_$DATE_REF

# Lire les fichiers clés (étape 1)
for file in sos/src/main.tsx sos/src/App.tsx sos/index.html; do
  echo "=== $file ===" >> audit_artifacts_$DATE_REF/journey_inputs.txt
  cat "$file" >> audit_artifacts_$DATE_REF/journey_inputs.txt 2>/dev/null
done

# (... répéter pour les fichiers de chaque étape)

# Produire le livrable
touch audit_artifacts_$DATE_REF/journey_user.md
```

</startup>

---

**🚀 Démarre maintenant. Premier livrable attendu : sommaire des 15 étapes avec 1 phrase descriptive chacune. Ensuite remplir étape par étape.**
