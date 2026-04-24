# Schéma complet des parcours de réservation — SOS-Expat

**Date** : 2026-04-24
**Scope** : Tous les parcours clients possibles menant à un appel avec un prestataire (avocat ou expert expat).

---

## Vue d'ensemble — 2 univers de paiement

Un **client** peut déclencher un appel via **2 modèles économiques** distincts :

| Univers | Modèle | Point d'entrée | Paiement |
|---|---|---|---|
| **A — Client payant standard** | Stripe paymentIntent par appel | `/sos-appel`, `/appel-expatrie`, liens SEO providers | 19€ / 49€ par appel |
| **B — Subscriber SOS-Call (B2B)** | Forfait mensuel payé par partenaire | `sos-call.sos-expat.com` (Blade) ou `CallCheckout` avec code | **Gratuit pour le client** |

Les deux univers coexistent **sans se croiser** grâce au flag `agreements.sos_call_active` côté Partner Engine et `isSosCallFree` sur les `call_sessions` Firestore.

---

## Univers A — Client payant standard (système historique)

### 6 points d'entrée possibles

```
1. Homepage CTA               → /sos-appel
2. Header emergency button    → /sos-appel
3. URL SEO direct             → /avocat/:country/:language/:slug
4. URL SEO direct             → /expatrie/:country/:language/:slug
5. Page catégorie pays        → /lawyers/:countrySlug ou /expats/:countrySlug
6. Lien ancien (/appel-expatrie) → /appel-expatrie (legacy)
```

### Parcours A — flow principal (8 étapes)

```
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 1 — Entry point                                      │
│  User arrive sur /sos-appel (SOSCall.tsx)                   │
│  ou directement sur un profil providers via SEO             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 2 — Liste de providers                               │
│  /sos-appel affiche avocats + experts filtrés par :         │
│   • Pays (auto-détecté ou sélectionné)                      │
│   • Langues parlées                                         │
│   • Disponibilité (isApproved + !isBusy)                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 3 — Sélection provider                               │
│  Click carte ou "Voir le profil"                            │
│  → Navigate to /provider/:id ou /avocat/:slug               │
│    (ProviderProfile.tsx)                                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 4 — Profil provider                                  │
│  Affiche : photo, tarif, langues, spécialités, reviews      │
│  CTA : "Prendre rendez-vous maintenant"                     │
│                                                             │
│  Vérif onlineStatus (real-time Firestore):                  │
│   • online + !isBusy → CTA actif                            │
│   • busy ou offline → CTA désactivé + toast informatif      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼ (si user non connecté)
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 4.bis — AUTHENTIFICATION                             │
│  sessionStorage.setItem('loginRedirect',                    │
│    `/booking-request/${providerId}`)                        │
│  → Navigate /login?redirect=/booking-request/:providerId    │
│  Après login → redirect auto vers /booking-request          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 5 — BookingRequest.tsx                               │
│  Formulaire multi-step (mobile) ou mono-page (desktop) :    │
│   • Nom complet, téléphone (IntlTelInput E.164)             │
│   • WhatsApp (optionnel)                                    │
│   • Pays actuel, nationalité, langues                       │
│   • Motif (bookingTitle) + description                      │
│   • Moyens de vérif profil client                           │
│                                                             │
│  Validation → navigate /call-checkout/:providerId           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 6 — CallCheckout.tsx (Stripe)                        │
│  ┌──────────────────────────────────────────────────┐       │
│  │ 💡 Banner SosCallCodePanel                       │       │
│  │ "Vous avez un code SOS-Call ? [Utiliser]"        │       │
│  │ → Si click → sort du parcours A, entre en univers B│     │
│  └──────────────────────────────────────────────────┘       │
│                                                             │
│  Options de paiement :                                      │
│   • Apple Pay / Google Pay (si dispo)                       │
│   • Carte bancaire (Stripe Elements)                        │
│   • 3DS Secure auto si nécessaire                           │
│                                                             │
│  Création paymentIntent → confirmation → Firebase callable  │
│  createAndScheduleCall(providerId, clientPhone,             │
│                        paymentIntentId, amount, ...)        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 7 — PaymentSuccess.tsx                               │
│  Affiche :                                                  │
│   • Confirmation de paiement                                │
│   • Countdown 240s jusqu'à l'appel                          │
│   • onSnapshot(call_sessions/:callId) temps réel            │
│   • Statuts : scheduled → ringing → connected → completed   │
│                                                             │
│  Firebase Cloud Task (+240s) déclenche Twilio               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 8 — Appel Twilio Conference                          │
│  1. Twilio appelle le provider d'abord                      │
│  2. AMD (Answering Machine Detection) → DTMF confirm        │
│  3. Provider tape # pour accepter                           │
│  4. Twilio appelle le client                                │
│  5. Mise en conférence audio                                │
│  6. Billing commence                                        │
│                                                             │
│  À la fin : onCallCompleted trigger →                       │
│    • Commission créée (système A)                           │
│    • Stripe capture/release                                 │
│    • Email récap client + provider                          │
└─────────────────────────────────────────────────────────────┘
```

### Variantes / branches du parcours A

```
┌─ Variante A1 : Arrivée depuis URL SEO provider directe ─────┐
│ User → /avocat/fr/francais/nomdavocat                       │
│      → ProviderProfile.tsx (saute étapes 1-3)               │
│      → reste identique à partir de l'étape 4                │
└─────────────────────────────────────────────────────────────┘

┌─ Variante A2 : Provider devient busy pendant le checkout ───┐
│ Étape 5-6 : user remplit BookingRequest                     │
│ onSnapshot detecte provider.isBusy = true                   │
│ → Banner rouge "Provider vient de devenir occupé"           │
│ → Bouton "Retour aux providers dispos"                      │
└─────────────────────────────────────────────────────────────┘

┌─ Variante A3 : Payment refusé (Stripe) ─────────────────────┐
│ Étape 6 : confirmCardPayment échoue                         │
│ → Error message visible dans CallCheckout                   │
│ → User peut retry ou changer carte                          │
│ → Pas de call_session créée, pas de provider bloqué         │
└─────────────────────────────────────────────────────────────┘

┌─ Variante A4 : 3DS Secure requis ───────────────────────────┐
│ Étape 6 : paymentIntent.status === 'requires_action'        │
│ → Overlay "Vérification bancaire en cours..."               │
│ → stripe.handleCardAction() ouvre iframe 3DS                │
│ → Après validation → retour au flow normal                  │
└─────────────────────────────────────────────────────────────┘

┌─ Variante A5 : Provider ne décroche pas ────────────────────┐
│ Étape 8 : Twilio call status = no-answer après 30s          │
│ → onCallCompleted : call_sessions.status = 'no_answer'      │
│ → Stripe refund automatique                                 │
│ → Provider notifié (punition : busyReason = 'no_answer')    │
│ → Client notifié + email avec alternatives                  │
└─────────────────────────────────────────────────────────────┘

┌─ Variante A6 : Client ne décroche pas ──────────────────────┐
│ Étape 8 : Client phone no-answer                            │
│ → Twilio retry 2x automatique                               │
│ → Si échec : call_sessions.status = 'client_no_answer'      │
│ → Stripe refund automatique                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Univers B — Subscriber SOS-Call (B2B forfait)

### 3 points d'entrée possibles

```
1. Email d'activation reçu           → sos-call.sos-expat.com
2. Dashboard perso via magic link   → sos-call.sos-expat.com/mon-acces
3. Depuis CallCheckout (si déjà dans flow A, via banner panel)
```

### Parcours B1 — Flow direct depuis /sos-call (Blade)

```
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 1 — Landing Blade                                    │
│  User arrive sur sos-call.sos-expat.com                     │
│  Page Blade (SosCallWebController@index) avec Alpine.js     │
│  Locale auto-détectée via Accept-Language                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 2 — Saisie identifiants (state: initial)             │
│                                                             │
│  2 modes disponibles (toggle) :                             │
│   • mode: 'code'         → input unique "AXA-2026-X7K2P"    │
│   • mode: 'phone_email'  → phone E.164 + email (fallback)   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼ POST /api/sos-call/check
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 3 — Vérification (state: verifying)                  │
│  Partner Engine /api/sos-call/check retourne status :       │
│                                                             │
│   ┌──────────────────────────────────────────┐              │
│   │ access_granted      → continuer étape 4  │              │
│   │ code_invalid        → état erreur        │              │
│   │ phone_match_email_mismatch → état erreur │              │
│   │ not_found           → état erreur        │              │
│   │ agreement_inactive  → état erreur        │              │
│   │ expired             → état erreur        │              │
│   │ quota_reached       → état erreur        │              │
│   │ rate_limited        → état erreur        │              │
│   └──────────────────────────────────────────┘              │
│                                                             │
│  Si access_granted : session_token stocké Redis TTL 15min   │
└─────────────────────────────────────────────────────────────┘
                           │ (si access_granted)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 4 — Sélection type (state: access_granted)           │
│  Affiche :                                                  │
│   • Badge "Couvert par [partner_name]"                      │
│   • Appels restants / expiration                            │
│   • 2 boutons selon call_types_allowed :                    │
│     - 👤 Expert Expat (si 'both' ou 'expat_only')           │
│     - ⚖️ Avocat Local (si 'both' ou 'lawyer_only')          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 5 — Saisie téléphone (state: pick_phone)             │
│  "Sur quel numéro vous appeler ?"                           │
│  Input tel E.164 avec validation libphonenumber-js          │
│  Pré-rempli avec phone de l'étape 2 si mode='phone_email'   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼ Firebase callable
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 6 — triggerSosCallFromWeb (Firebase callable)        │
│  1. Load Firebase SDK lazy (ESM dynamic import)             │
│  2. httpsCallable('triggerSosCallFromWeb')                  │
│     avec sosCallSessionToken + providerType + clientPhone   │
│                                                             │
│  Côté Firebase Functions :                                  │
│  a. Re-validate session via /api/sos-call/check-session     │
│  b. Auto-select premier provider dispo (type + langue)      │
│  c. Créer call_sessions avec isSosCallFree=true             │
│     ┌──────────────────────────────────┐                    │
│     │ isSosCallFree: true              │                    │
│     │ partnerSubscriberId: X           │                    │
│     │ agreementId: Y                   │                    │
│     │ amount: 0                        │                    │
│     │ scheduledFor: now() + 240s       │                    │
│     └──────────────────────────────────┘                    │
│  d. POST /api/sos-call/log (non-blocking)                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 7 — Countdown 240s (state: call_in_progress)         │
│  Affiche :                                                  │
│   • "Un prestataire va vous appeler dans X:XX"              │
│   • Téléphone masqué ("+33 ** ** ** 78")                    │
│   • Type de provider sélectionné                            │
│                                                             │
│  Pas de Stripe, pas de provider profile, pas de BookingReq. │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  ÉTAPE 8 — Appel Twilio Conference (identique à A)          │
│  MAIS : onCallCompleted detecte isSosCallFree = true        │
│   → early return (pas de commission)                        │
│   → Pas de capture Stripe                                   │
│   → Incrément calls_expert ou calls_lawyer sur subscriber   │
│   → Création subscriber_activity avec is_sos_call=true      │
└─────────────────────────────────────────────────────────────┘
```

### Parcours B2 — Depuis dashboard subscriber (/mon-acces)

```
User → sos-call.sos-expat.com/mon-acces/login
     → Saisie email → POST /mon-acces/magic-link
     → Email envoyé avec lien single-use (Redis TTL 15min)
     → Click lien → GET /mon-acces/auth?token=X
     → Session créée (subscriber_id en session Laravel)
     → Redirect /mon-acces
     → Dashboard affiche code + bouton "Appeler maintenant"
     → Click → redirect /sos-call?code=AXA-2026-X7K2P
     → Code pré-rempli → reprend flow B1 à étape 3
```

### Parcours B3 — Depuis CallCheckout (via banner SosCallCodePanel)

```
User démarre flow A (sur /call-checkout/:providerId)
     → Voit banner "Vous avez un code SOS-Call ?"
     → Click → redirect sos-call.sos-expat.com
     → Bascule dans flow B1 à étape 1
     (Le paymentIntent Stripe en cours n'est pas créé)
```

---

## Matrice des 11 scénarios possibles

| # | Scénario | Univers | Entry point | Paiement | Durée jusqu'à appel |
|---|----------|---------|-------------|----------|----------------------|
| 1 | Client normal, tout fluide | A | /sos-appel | Stripe 19€/49€ | ~3-5 min + 240s |
| 2 | Client depuis SEO provider direct | A | /avocat/:slug | Stripe 19€/49€ | ~2-4 min + 240s |
| 3 | Client bascule sur SOS-Call via banner | A→B | /call-checkout | Gratuit | ~2-3 min + 240s |
| 4 | Client Stripe 3DS | A | /sos-appel | Stripe + 3DS | ~4-6 min + 240s |
| 5 | Client paiement refusé | A | /sos-appel | Stripe échoue | Pas d'appel |
| 6 | Subscriber avec code valide | B | /sos-call | Gratuit | ~1 min + 240s |
| 7 | Subscriber fallback phone+email | B | /sos-call | Gratuit | ~1-2 min + 240s |
| 8 | Subscriber via dashboard /mon-acces | B | /mon-acces | Gratuit | ~1 min + 240s |
| 9 | Subscriber code expiré/quota | B | /sos-call | — | Message d'erreur pédagogique |
| 10 | Provider ne répond pas (A) | A | /sos-appel | Refund Stripe auto | Pas d'appel |
| 11 | Provider ne répond pas (B) | B | /sos-call | — | Pas de débit mais incident tracké |

---

## Schéma d'interactions Firebase ↔ Partner Engine ↔ Twilio

```
┌───────────────┐     ┌──────────────────┐     ┌──────────────┐
│  SPA React    │────▶│  Firebase Funcs  │────▶│    Twilio    │
│ + Blade Page  │     │   (europe-west3  │     │              │
└───────┬───────┘     │   + us-central1) │     └──────────────┘
        │             └────────┬─────────┘              │
        │                      │                        │
        │              X-Engine-Secret                  │
        │                      │                        │
        ▼                      ▼                        ▼
┌──────────────────────────────────────────────┐   ┌──────────┐
│          Partner Engine Laravel              │   │ Firestore│
│  - /api/sos-call/check       (public)        │   │   nam7   │
│  - /api/sos-call/check-session (webhook)     │   └──────────┘
│  - /api/sos-call/log          (webhook)      │
│  - /api/webhooks/stripe/invoice-events       │
│  - /api/partner/sos-call/*    (dashboard)    │
│  - /mon-acces/*               (Blade)        │
└──────────────────────────────────────────────┘
                   │
                   ▼
         ┌──────────────────┐
         │  PostgreSQL 16   │
         │ + Redis (TTL)    │
         └──────────────────┘
```

---

## Points de décision critiques (branchement code)

1. **onCallCompleted trigger** (`sos/firebase/functions/src/partner/triggers/onCallCompleted.ts:49-55`)
   ```ts
   if (after.isSosCallFree === true || after.metadata?.isSosCallFree === true) {
     // Skip commission, skip Stripe, just log
     return;
   }
   ```

2. **createAndScheduleCall Stripe bypass** (`createAndScheduleCallFunction.ts:443-470`)
   ```ts
   if (sosCallSessionToken) {
     // Skip Stripe paymentIntent validation
     isSosCallFree = true;
   }
   ```

3. **SosCallController::check** rate limiting (`app/Http/Controllers/SosCallController.php`)
   ```php
   10 requêtes/min par IP + 5/15min par identifier + 3 échecs → blocage 10min
   ```

4. **triggerSosCallFromWeb provider auto-select** (`triggerSosCallFromWeb.ts`)
   ```ts
   // Filter: type matches, isApproved, isVisible, !isBusy, language match
   // Fallback: ignore language if no match found
   ```

---

## Tests couvrant chaque scénario

| Scénario | Fichier test | Nombre de tests |
|---|---|---|
| 1, 2 (flow A) | Pas testés unitairement (dépend Stripe) | 0 |
| 3 (banner) | SosCallCodePanel (unit test React à ajouter) | 0 |
| 6, 7 (flow B) | `SosCallCheckTest.php` | 14 |
| 6-11 (edge cases) | `SosCallEdgeCasesTest.php` | 20 |
| Blade render | `SosCallWebPageTest.php` | 12 |
| Dashboard /mon-acces | `SubscriberDashboardTest.php` | 10 |
| GDPR | `SubscriberGdprTest.php` | 6 |
| Sprint 6.bis | `HealthCheckTest.php` | 3 |
| Invariants prod | `ProductionReadinessTest.php` | 13 |
| Fin à fin | `EndToEndVerificationTest.php` | 19 |

Total tests liés aux parcours : **~97 tests sur 289**.

---

## Conclusions et recommandations

### Ce qui fonctionne parfaitement
- ✅ Les 2 univers A et B coexistent sans interférence (flag `sos_call_active`)
- ✅ Le bascule A→B via banner est non-destructif (pas de paymentIntent gaspillé)
- ✅ La gestion des 9 états d'erreur côté `/sos-call` est pédagogique
- ✅ Le circuit Blade → Firebase → Twilio fonctionne de bout en bout

### Ce qui reste perfectible
- ⚠️ Le banner SosCallCodePanel dans CallCheckout devrait idéalement **détecter** si l'utilisateur a déjà un compte subscriber (via email match) au lieu de dépendre de sa mémoire
- ⚠️ Le provider auto-select dans `triggerSosCallFromWeb` est basique (premier disponible, pas de round-robin sophistiqué)
- ⚠️ Pas de rétention du code dans le navigateur : un subscriber qui revient doit retaper son code à chaque fois
- ⚠️ Aucun flow prévu pour un subscriber qui perd ses codes et n'a pas d'email pour le magic link

### Scénarios non traités (potentiellement à ajouter)
- Subscriber avec **plusieurs codes** (ex: client AXA + client Visa Infinite) → lequel choisir ?
- Provider qui décline par DTMF pendant le call-in-progress (implémenté mais pas couvert par le parcours client visible)
- Appel **interrompu après 4min 30s** (Twilio raccroche) : récupération facturation correcte ?
- Subscriber qui veut **garder son historique** avant suppression RGPD → export JSON exists mais pas de rappel UX
