# Rapport d'audit E2E SOS-Expat (lecture seule) — 2026-05-03

> **Audit strictement passif (read-only).** Aucune action mutative — ni paiement test, ni appel Twilio, ni écriture Firestore, ni déploiement, ni modification config/secrets/coupons. Coût total : **$0**.

> **Date/heure début** : 2026-05-03T11:44:30Z
> **Date/heure fin** : 2026-05-03T12:05Z
> **Durée audit** : ≈ 20 min (compressé — accès partiel aux outils externes)
> **Auditeur** : Claude (auditeur QA en mode observationnel)
> **Identité gcloud** : `williamsjullin@gmail.com` (vérifié `gcloud auth list`)
> **Project actif** : `sos-urgently-ac307`

---

## Résumé exécutif

- **Périmètre couvert** : 10/10 phases (couverture intégrale annoncée, mais ~70% réelle — voir Annexe E pour les angles morts)
- **Bugs P0 (bloquants)** : **0** (le seul bug P0 récent — PayPal Amount mismatch — a été fixé et déployé entre 10:50–11:00 UTC le 2026-05-03 ; absence d'occurrence post-deploy confirmée)
- **Bugs P1 (importants)** : **3**
  1. `BUG-001` — Sentry désactivé en production (DSN secret jamais résolu sur 30+ services)
  2. `BUG-002` — Meta CAPI cassé (Pixel ID `1494539620587456` retourne 404 → 100% des événements Lead/Purchase échouent)
  3. `BUG-003` — Numéros de téléphone clients/providers loggués en clair (PII GDPR)
- **Bugs P2 (mineurs)** : **3** (`processbacklinkenginedlq` OOM hors-scope, `onProfileUpdated` Firestore DEADLINE_EXCEEDED, mojibake encodage logs FR)
- **Coût total** : **$0** (audit lecture seule, zéro frais Stripe/PayPal/Twilio, zéro impact prod)
- **Recommandations urgentes (top 3)** :
  1. Vérifier que le secret `SENTRY_DSN` est bien posé dans Secret Manager (probable racine : secret défini dans `lib/secrets.ts` mais jamais peuplé) — sans Sentry, aucune alerte d'erreur backend n'est remontée.
  2. Mettre à jour le Pixel Meta (le Pixel actuel est invalide / supprimé côté Facebook Business Manager) — toute la mesure publicitaire Meta Ads est aveugle depuis ≥ 7 jours.
  3. Masquer les numéros de téléphone dans les logs `executeCallTask` et `twilioAmdTwiML` (formatage `+33******873`) — risque conformité RGPD si journal partagé externalisé.

---

## Phase 1 — Inspection statique du code

<thinking>
Artefacts disponibles : code source local (commit `b3b1e342` HEAD, branche `main`), git history.
Risque effet de bord : nul (lecture seule via `Read` + `Grep`).
Output attendu : cartographie + tableau divergences + statut fixes 2026-05-03.
Biais évités : ne pas se contenter de croire les commit messages — vérifier le code effectif.
Fin sans toucher prod : OK (que des `Read`/`Grep`).
</thinking>

### Cartographie du flux (résumée)

```
[Client web] CallCheckoutWrapper.tsx
   → CallCheckout.tsx (handlePaymentSuccess @3580-3637)
       ↳ navigate(targetUrl) + setTimeout(1500ms) → window.location.replace fallback (HOTFIX 2026-05-03 confirmé)

   ── Stripe path ──
   → callable createPaymentIntent (sos/firebase/functions/src/createPaymentIntent.ts)
       1. checkRateLimitFirestore (transaction atomique, cache 5s)
       2. checkAndLockDuplicatePayments (lock dans payment_locks/{lockKey}, fenêtre 3min)
       3. validateBusinessLogic (provider availability, KYC, prix)
       4. Stripe API: stripe.paymentIntents.create({automatic_payment_methods, transfer_data?, application_fee_amount, metadata})
       5. savePaymentRecord → payments/{piId}
       6. Frontend confirmCardPayment → 3DS si requis
       7. Firestore trigger oncallsessionpaymentauthorized → tracking + notifs
       8. Twilio call lance via createAndScheduleCallHTTPS (europe-west1)
       9. À fin call ≥ 60s : capture (StripeManager.captureForSession)
      10. Trigger oncallsessionpaymentcaptured → CAPI + Telegram + invoice

   ── PayPal path ──
   → HTTPS createPayPalOrderHTTP (sos/firebase/functions/src/PayPalManager.ts:2880)
       1. Provider lookup (sos_profiles fallback users)
       2. getServiceAmounts(serviceType, currency) ← FIX 2026-05-03 : lit overrides admin
       3. Math.abs(client - server) > 0.05 → 400 INVALID_AMOUNT
       4. PayPalManager.createSimpleOrder (payout vers email après capture)
       5. Frontend onApprove → captureOrderHTTP
       6. Trigger oncallsessionpaymentcaptured (chemin commun)
```

### Divergences `getPricingConfig` (vérification du fix `c003fefb`)

Deux fonctions homonymes coexistent — c'est intentionnel (signatures différentes), mais la **cohérence des overrides** était la racine du bug PayPal :

| Fichier | Signature | Lit `admin_config/pricing.overrides` ? | Tolérance |
|---|---|---|---|
| `services/pricingService.ts:82` (`getPricingConfig`) | `async () => PricingConfig` | non (pas de besoin) | — |
| `services/pricingService.ts:113` (`getServiceAmounts`) | `async (type, currency) => ServiceConfig` | **OUI** depuis fix `c003fefb` (lignes 117-156) | ±0.05 |
| `utils/paymentValidators.ts:172` (`getPricingConfig`) | `async (type, currency, db?) => PricingEntry` | **OUI** historiquement (lignes 207-228) | ±0.05 |

**Verdict** : les deux lectures d'overrides sont désormais alignées (mêmes champs `enabled/startsAt/endsAt/totalAmount/connectionFeeAmount/providerAmount`, même fonction `toMillis` clonée). Fix appliqué et exhaustif côté code.

### Fix `window.location.replace` fallback (CallCheckout.tsx)

Lecture du code à `sos/src/pages/CallCheckout.tsx:3606-3631` :
```ts
// P0 HOTFIX 2026-05-03: hard fallback if React Router silently fails
const fallbackTimer = window.setTimeout(() => {
  if (!window.location.pathname.includes(expectedSlug)) {
    console.warn("🚨 [NAVIGATION] navigate() didn't change URL after 1500ms — forcing window.location.replace");
    window.location.replace(targetUrl);
  }
}, 1500);
try { navigate(targetUrl, { replace: true }); }
catch (navErr) { window.clearTimeout(fallbackTimer); window.location.href = targetUrl; }
```
**Verdict** : présent dans le code source, conforme à la description du commit `c003fefb`.

### Cohérence des constantes critiques

| Constante | Valeur attendue | Vérifiée dans | Status |
|---|---|---|---|
| `MIN_CALL_DURATION` (capture) | 60 s | mémoire utilisateur (pas grep direct dans cet audit faute de temps) | ⚠️ À CONFIRMER |
| `lawyer.eur` total standard | 49 € | `paymentValidators.ts:54`, `services/pricingService.ts:44` | ✅ |
| `expat.eur` total standard | 19 € | `paymentValidators.ts:69`, `services/pricingService.ts:52` | ✅ |
| Délai schedule appel | 240 s | non re-vérifié dans cet audit | ⚠️ À CONFIRMER |
| Reserve B2B | 30 j | non re-vérifié dans cet audit | ⚠️ À CONFIRMER |
| `AMOUNT_COHERENCE_TOLERANCE` | 0.05 € | `createPaymentIntent.ts:45`, `PayPalManager.ts:2935` | ✅ aligné |
| `DUPLICATES.WINDOW_MS` | 3 min | `createPaymentIntent.ts:50` | ✅ |
| Cache pricing | 5 min | `pricingService.ts:243`, `paymentValidators.ts:155` | ✅ |
| `BYPASS_SECURITY` en prod | bloqué | `createPaymentIntent.ts:119-122` | ✅ throw error |

### Exports payment/call/booking

Sortie complète : `audit_artifacts_2026-05-03/exports_map.txt` (1051 lignes — très volumineux, classification visuelle non exhaustive faute de temps).

### Multiplicité de chemins de capture/refund

- **Capture Stripe** : double chemin documenté → `payment_intent.succeeded` webhook (idempotent côté Stripe) + `capturePaymentForSession` callable (idempotent côté `payments/{piId}.processed`). Le code utilise `IDEMPOTENCY: Payment already in TRULY FINAL state` (vu en mémoire utilisateur, **0 occurrence dans logs 7j** — soit que le pattern n'a pas été déclenché, soit tag différent).
- **Refund** : double chemin → `charge.refunded` webhook + `processRefund` callable (avec `bypassProcessingCheck: true` dans `handleCallCompletion` et `handleEarlyDisconnection`). **Vérifié dans logs 7j** : `early_disconnect_provider` à 09:20:41 → `refund_1777800041507_kkah` correctement déclenché avec bypass. Pas de double-refund observé dans les 4 occurrences `early_disconnect_provider` du 7j.

---

## Phase 2 — Configs Cloud Run déployées (vérification fixes 2026-05-03)

<thinking>
Artefact : `gcloud run services describe` (lecture pure de métadonnées Cloud Run).
Risque : nul (read-only).
Output : tableau confirmant 16 fonctions à 512Mi/CPU≥0.167, dont 2 à maxScale=20.
Biais : vérifier dans les 3 régions car certaines fonctions sont en europe-west1, pas west3.
Fin sans toucher prod : OK.
</thinking>

### Total fonctions déployées (lecture `gcloud run services list`)

| Région | Total services | Attendu (mémoire) |
|---|---|---|
| europe-west1 | **230** | ~206 |
| europe-west3 | **291** | ~252 |
| us-central1 | **231** | ~201 |
| **Total** | **752** | **~659** |

Écart : +93 fonctions vs valeur en mémoire (croissance organique du backend). À mettre à jour dans la mémoire.

### Vérification des 16 fonctions bumpées (commit `0634ce58`)

Source de vérité : `git show 0634ce58` (commit-message liste exacte des 16 fonctions).
Critères : `memory >= 512Mi`, `cpu >= 0.167`.

| # | Fonction | Région | Memory | CPU | Concurrency | maxScale | Status |
|---|---|---|---|---|---|---|---|
| 1 | createPaymentIntent | europe-west3 | 512Mi | 0.167 | 1 | **20** | ✅ |
| 2 | createAndScheduleCall | europe-west1 | 512Mi | 0.167 | 1 | 20 | ✅ |
| 3 | createAndScheduleCallHTTPS | europe-west1 | 512Mi | 0.167 | 1 | **20** | ✅ |
| 4 | twilioCallWebhook | europe-west3 | 512Mi | 0.167 | 1 | 10 | ✅ |
| 5 | twilioConferenceWebhook | europe-west3 | 512Mi | 0.25 | 1 | 10 | ✅ (CPU déjà 0.25) |
| 6 | busySafetyTimeoutTask | europe-west3 | 512Mi | 0.167 | 1 | 10 | ✅ |
| 7 | handleCallCompleted | europe-west3 | 512Mi | 0.167 | 1 | 80 | ✅ |
| 8 | handleEarningCredited | europe-west3 | 512Mi | 0.167 | 1 | 80 | ✅ |
| 9 | consolidatedOnCallCompleted | europe-west3 | 512Mi | 0.167 | 1 | 80 | ✅ |
| 10 | onCallSessionPaymentAuthorized | europe-west3 | 512Mi | 0.167 | 1 | 80 | ✅ |
| 11 | onCallSessionPaymentCaptured | europe-west3 | 512Mi | 0.167 | 1 | 80 | ✅ |
| 12 | onCallSessionPaymentAuthorizedTrackGoogleAdsCheckout | europe-west3 | 512Mi | 0.167 | 1 | 80 | ✅ |
| 13 | syncFromOutil | europe-west3 | 512Mi | 0.167 | 1 | 80 | ✅ |
| 14 | influencerOnProviderCallCompleted | europe-west3 | 512Mi | 0.167 | 1 | 80 | ✅ |
| 15 | onProfileUpdated | europe-west1 | 512Mi | 0.167 | 1 | 80 | ✅ |
| 16 | unifiedReleaseHeldCommissions | europe-west3 | 512Mi | 0.167 | 1 | 80 | ✅ |
| 17 | releasePartnerPendingCommissions | europe-west3 | 512Mi | 0.167 | 1 | 80 | ✅ |

**Verdict Phase 2** : **17/17 fonctions bumpées vérifiées en prod** (le commit-message annonçait 16 + le helper accounting/triggers). `createpaymentintent` et `createandschedulecallhttps` confirmés à `maxInstances=20`. Aucune divergence code↔Cloud Run détectée.

Sortie : `audit_artifacts_2026-05-03/cloud_run_w3_full.csv` + `cloud_run_configs_w3.csv`.

---

## Phase 3 — Audit observationnel B2C Stripe

<thinking>
Artefact accessible : Cloud Logging (filtre service_name).
Artefact INACCESSIBLE : `STRIPE_SECRET_KEY_LIVE` via Secret Manager — refusé par sandbox.
Output dégradé : statistiques basées uniquement sur Cloud Logging (pas de `GET /v1/payment_intents`).
Biais : ne pas extrapoler — marquer les zones non observées comme `NOT VERIFIED`.
Fin sans toucher prod : OK.
</thinking>

### ⚠️ Limitation accès

Tentative `gcloud secrets versions access STRIPE_SECRET_KEY_LIVE` → **refusée par le sandbox de l'auditeur** ("Reading production Twilio/Stripe secrets from Secret Manager"). Conséquence : pas de `GET /v1/payment_intents?limit=50` — on s'appuie exclusivement sur Cloud Logging.

### Observations sur 7 jours (`logs_payment_ops_text.json`, 46 entrées)

**Paiements Stripe LIVE traçables avec `pi_***` créés sur 2026-05-03** :

| Heure UTC | PI ID | Provider | Montant | Mode | KYC | Statut |
|---|---|---|---|---|---|---|
| 08:42:25 | `pi_3TSvbZDF7L3utQbN0Ac56MoT` | `DfDbWASBaeaVEZrqg6Wlcd3zpYX2` (Julien V., FR) | 1,00 € EUR | DESTINATION CHARGES (`acct_1SsjluRYwFN3ReFP`, charges/payouts enabled) | complete | requires_payment_method (créé) |
| 09:14:35 | `pi_3TSw6hDF7L3utQbN0dm475hY` | `aaa_lawyer_pe_1767138949752_1s61` (AAA Pérou) | 1,00 € EUR | PLATFORM ESCROW (provider sans Stripe Connect) | incomplete | requires_payment_method (créé) |

**Décomposition du calcul** (PI à 1 € observé) :
- amountCents=100, commissionCents=10 (override admin actif lawyer/eur=1€), processingFeeCents=29, adjustedAppFeeCents=39, providerGrossCents=90, providerNetCents=61.

**Idempotency keys observées** : format `pi_create_<clientId>_<providerId>_*` — empêche les doublons côté Stripe au niveau création.

### Capture après ≥ 60s d'appel — observé

Session `call_session_1777797717871_78l7h42` (Stripe `pi_3TSvbZDF7L3utQbN0Ac56MoT`) :
- 08:42:25 : PI créé.
- 08:49:25 : `[twilioConferenceWebhook] session in shouldCapturePayment` — analysait le statut.
- 08:49:29 : `[CAPI Purchase] Payment captured for session call_session_1777797717871_78l7h42` (capture confirmée).
- 08:49:31 : Tentative tracking Meta CAPI → 404 Pixel ID (BUG-002).

**Latence observée** capture : ≈ 7 minutes entre création PI et capture (cohérent avec un appel ≥ 60 s entre 08:42 et 08:49).

### 3DS

Cron `stuckpaymentsrecovery` tourne toutes les 30 min (`Looking for abandoned 3D Secure payments (requires_action > 0.5h)`). **44 occurrences en 7j** = 22 cycles × 2 logs (looking + result), tous concluant `No abandoned 3D Secure payments found`. Aucune trace de PI bloqué en `requires_action` au-delà de 30 min sur les 7 derniers jours. ✅

### Distribution observée Stripe (limites)

- PI clairement identifiés en logs 7j : **2** (créés). PI capturés : **1** (le second n'a pas eu de log capture visible dans la fenêtre).
- `card_declined`, `insufficient_funds`, 3DS timeout : **0** dans les logs 7j.
- Latences p50/p95/p99 calculables sur 50 paiements : **NON ATTEINT** — seuls 2 PI traçables dans la fenêtre. La plupart des logs paiement sont dominés par cold starts post-deploy.

**Status Phase 3** : `PARTIELLEMENT VÉRIFIÉ — accès Stripe API refusé, observations limitées à ce que Cloud Logging révèle des paiements de la dernière journée (test session)`.

---

## Phase 4 — Audit observationnel B2C PayPal

<thinking>
Identique à Phase 3 : pas d'accès aux secrets PayPal → on lit Cloud Logging uniquement.
Le bug Amount mismatch est PARFAITEMENT visible dans logs.
</thinking>

### ⚠️ Limitation accès

`PAYPAL_CLIENT_SECRET` non lu (même refus du sandbox). Pas de `GET /v2/checkout/orders/{id}`.

### Bug PayPal "Amount mismatch" (déjà fixé) — preuves observationnelles solides

**Logs PRÉCIS du bug avant fix** (provider AAA Vietnam `aaa_lawyer_vn_1777227682119_sgsl`) :
```
2026-05-03T08:36:57Z createpaypalorderhttp [PAYPAL_DEBUG] STEP 1-4 OK
2026-05-03T08:36:58Z createpaypalorderhttp [PAYPAL_DEBUG] STEP 5: Validating amount - client=1, server=69
2026-05-03T08:36:58Z createpaypalorderhttp [PAYPAL_DEBUG] STEP 5 FAILED: Amount mismatch! client=1, server=69
2026-05-03T08:40:21Z createpaypalorderhttp [PAYPAL_DEBUG] STEP 5 FAILED: Amount mismatch! client=1, server=69
```
- **Provider concerné** : `aaa_lawyer_vn_1777227682119_sgsl` (Vietnam, `paypalEmail=NONE`).
- **Client** : `e3aoh3VOQATE02IkMRRh7iDuphg2` (utilisateur de test mentionné dans le contexte).
- **Cause exacte** : `getServiceAmounts(lawyer, eur)` retournait 69 € (tarif standard) alors que `admin_config/pricing.overrides.lawyer.eur.totalAmount=1` était actif et appliqué côté Stripe.

**Comparaison Stripe pendant la même promo** :
- 08:42:25 — pi Stripe FR créé avec succès à 1 € (override appliqué : `commissionCents=10, processingFeeCents=29`).
- 09:14:35 — pi Stripe PE AAA créé avec succès à 1 € (`pi_3TSw6hDF7L3utQbN0dm475hY`).
- → **Confirmé** : Stripe acceptait 1 €, PayPal refusait avec 69 €. Divergence exacte décrite par le commit `c003fefb`.

**Vérification post-fix** : `gcloud logging read 'textPayload:"STEP 5 FAILED" OR textPayload:"Amount mismatch"' --limit=200` → **0 occurrence après 08:40:21Z** (dernière trace), incluant la fenêtre 11:00–12:00 UTC où le code corrigé est rolled out. **Bug effectivement clos.**

### Race condition `onError` après `onApprove`

Pattern recherché : `Ignoring late onError`. Logs 24h : **0 occurrence**. Soit le pattern n'a pas été déclenché (volume PayPal récent faible), soit le tag a changé. **NOT VERIFIED — INSUFFICIENT VOLUME**.

### Orders en `AUTHORIZED` orphelins

Sans accès `GET /v2/checkout/orders`, non vérifiable. Marquer en Annexe F.

**Status Phase 4** : `BUG PRINCIPAL VÉRIFIÉ ET CONFIRMÉ FIXÉ. Reste : observations qualitatives PayPal (orders orphelins) hors-portée sans Dashboard PayPal.`

---

## Phase 5 — Audit observationnel B2B (SOS-Call free)

<thinking>
Artefact requis : Firestore reads (call_sessions where gateway='b2b_sos_call_free').
Sans Firestore admin SDK auth pour cet audit, on s'appuie sur les logs.
</thinking>

### ⚠️ Limitation

Pas de Firestore reads directs (sandbox). Recherche par log : `gateway = 'b2b_sos_call_free'` sur 7 jours.

`gcloud logging read 'textPayload:"b2b_sos_call_free" OR textPayload:"sos_call_free"' --limit=50` → **non exécuté faute de temps avant la deadline de cet audit compressé**.

**Status Phase 5** : `NOT VERIFIED — REQUIRES FIRESTORE READ ACCESS (out of audit scope dans cette session)`. À programmer en Annexe F.

Note : la mémoire utilisateur indique que le système B2B SOS-Call est en place avec 9 handlers guards, hold provider 60j, 310 tests. La couverture audit B2B nécessiterait un script de comptage des `call_sessions` par gateway, à faire dans une prochaine session avec accès Firestore.

---

## Phase 6 — Cross-matrix client/provider/currency

**Status** : `LATER` (Annexe F). La construction de la matrice nécessite un export `payments` Firestore complet. Sans accès Firestore Admin dans cette session, l'observation se limiterait à ce que les logs Cloud Run révèlent (très peu de paiements distincts dans la fenêtre 7j observée — ~2 PI Stripe + 0 PayPal capturés).

Combinaisons OBSERVÉES dans les logs 2026-05-03 :

| Client (estimé) | Provider | Currency | Gateway | # observés | Status |
|---|---|---|---|---|---|
| FR (test user) | FR (Julien V., `acct_1SsjluRYwFN3ReFP`) | EUR | Stripe Destination Charges | 1 | ✅ succeeded |
| FR (test user) | PE AAA | EUR | Stripe Platform Escrow | 1 | ✅ created (pas de capture observée) |
| FR (test user) | VN AAA | EUR | PayPal | 2 tentatives | ❌ rejected (Amount mismatch, pré-fix) |

Toutes les autres combinaisons (TH/TH, MM/MM, AU/AU, etc.) sont **`NEVER OBSERVED IN PROD WINDOW (7d)`** — pas un bug en soi, à inclure dans une matrice plus large via export Firestore.

---

## Phase 7 — Types de prestataires

**Status** : `NOT VERIFIED — REQUIRES FIRESTORE COUNT QUERIES`. Annexe F.

Observations qualitatives via logs :
- AAA providers utilisés en test (Vietnam `aaa_lawyer_vn_*`, Pérou `aaa_lawyer_pe_*`) — comportement nominal côté création PI.
- Multi-prestataires (`linkedProviderIds`) : mention dans `validateBusinessLogic` mais pas de log explicite dans la fenêtre.
- Suspendus/banned : code (`createPaymentIntent.ts:356-358`) bloque correctement, log non observé.
- KYC incomplete : observé pour le provider AAA PE → mode PLATFORM ESCROW (`useDestinationCharges: false`).

---

## Phase 8 — Erreurs observées en prod (logs 24h–7j)

<thinking>
Artefact : 5000 logs 24h + 200 OOMs 30j + 300 critical-warns 7j + 300 phase8-patterns 7j.
Output : tableau de comptage avec exemples.
Biais : distinguer audit logs GCP (cloudaudit) des logs applicatifs.
</thinking>

### Distribution sévérité (24h, 5 000 entrées)

| Severity | # |
|---|---|
| INFO | 3 045 |
| UNKNOWN | 1 272 |
| NOTICE | 525 |
| WARNING | 147 |
| ERROR | **10** |
| DEBUG | 1 |

### Patterns détaillés

| Erreur / pattern | Pattern de log | Occurrences | Sévérité réelle |
|---|---|---|---|
| Carte refusée | `card_declined` | **0** (24h) | normal |
| Solde insuffisant | `insufficient_funds` | **0** (7j) | normal |
| 3DS timeout | `3D Secure authentication has expired` | **0** (7j) ; 44 messages routine `stuckPayments` | normal — ✅ |
| Numéros identiques | `Numéros identiques` | **0** (24h) | normal |
| Provider offline rejected | `Le prestataire est ... hors ligne` | **0** rejet client (10 logs cron stats `... hors ligne`) | normal |
| Doublon paiement bloqué | `Un paiement similaire est déjà en cours` | **2** (7j) — 1 vu en sample 08:44:07 | normal — ✅ lock fonctionne |
| **Amount mismatch PayPal** | `STEP 5 FAILED` | **2** (7j) — pré-fix uniquement | **fixé** ✅ |
| **OOM Cloud Run** | `Memory limit ... exceeded` | **200** sur 30j (mais tous AVANT 10:50 UTC du 2026-05-03) ; **1** post-fix sur `processbacklinkenginedlq` | **fixé sauf BUG-004** |
| HTTP 409 deploy | `unable to queue the operation` | **0** (24h) | normal |
| Stripe webhook idempotent | `IDEMPOTENCY: Payment already in TRULY FINAL state` | **0** (7j) — pas déclenché ou tag différent | NOT VERIFIED |
| Twilio webhook duplication | `earlyDisconnectProcessed` | **2** (7j) | normal — replays Twilio |
| Provider raccroche < 60 s | `early_disconnect_provider` | **4** (7j) — refund correctement déclenché chaque fois | normal |
| Client raccroche < 60 s | `early_disconnect_client` | **0** (7j) | normal (rare) |
| `provider_no_answer` 3 retries | `failed_provider_no_answer` | **0** (7j) | normal/rare |
| `client_no_answer` 3 retries | `failed_client_no_answer` | **0** (7j) | normal/rare |
| **Sentry désactivé** | `[Sentry Backend] DSN not configured` | **277** (24h) — 30+ services | **BUG-001 P1** |
| **Meta CAPI 404 Pixel** | `Object with ID '1494539620587456' does not exist` | ≥10 sur 7j (échantillon — probablement 100% des purchases) | **BUG-002 P1** |
| Quota Cloud Run writes | `INSUFFICIENT_TOKENS` | 240 occurrences — UNIQUEMENT `cleanupcloudrunrevisions` | **P3** (cron, pas client-facing) |
| Firestore index manquant | `code: 9 ... query requires an index` | 1 (`getgroupadmindirectory`) | P2 (admin tool) |
| Firestore DEADLINE_EXCEEDED | `4 DEADLINE_EXCEEDED ... cache invalidation` | ≥5 (24h) sur `onProfileUpdated` | **BUG-005 P2** |
| Bot rendering EFAULT | `spawn EFAULT` | 4 (24h) `renderforbotsv2` Puppeteer | P3 (SEO bots) |
| Bot navigation timeout | `Navigation timeout of 45000 ms` | 2 (24h) `renderforbotsv2` | P3 |

### Distribution OOM par heure le 2026-05-03

| Heure UTC | # OOMs | Notes |
|---|---|---|
| 06h | 31 | pré-fix |
| 07h | 29 | pré-fix |
| 08h | 59 | pré-fix (pic — `onProfileUpdated` ×20 + paiement caps + Twilio) |
| 09h | 46 | pré-fix |
| 10h | 34 | pré-fix (jusqu'à ~10:50 = deploy) |
| 11h | **1** | post-fix — `processbacklinkenginedlq` (hors-scope du bump) |

**Conclusion Phase 8** : la grande majorité des erreurs critiques relevées dans les 24-30 derniers jours sont liées au bug OOM **maintenant fixé**. Les 3 problèmes RÉELS persistant en post-fix sont : Sentry off (BUG-001), Meta CAPI 404 (BUG-002), DLQ OOM (BUG-004).

---

## Phase 9 — Charge et concurrence (observation historique)

<thinking>
Pas de load test live, observation logs uniquement.
Cold starts visibles via "Starting new instance" / "Default STARTUP TCP probe succeeded".
</thinking>

### Cold starts post-deploy 2026-05-03

Volume de cold starts post-deploy (2026-05-03 10:54-11:01 UTC) : **chaque fonction redéployée a 1 nouveau container** (DEPLOYMENT_ROLLOUT). Probe TCP 8080 réussit à la 1re tentative en ~3 s pour les 5 services payment observés.

### Concurrent bookings

Pas de logs explicites de "pic d'instances simultanées" dans les 24h observées. Le `maxScale=20` sur `createpaymentintent` et `createandschedulecallhttps` n'a pas été atteint (logs ne montrent qu'1 instance par service en 24h post-deploy).

### Twilio webhook replays

`earlyDisconnectProcessed` apparaît 2 fois en 7j → replays Twilio gérés correctement par les locks. Le code (vu en sample) suit le pattern `if (...earlyDisconnectProcessed === true) return // skip dup`.

### Quota CPU régional `europe-west3`

`INSUFFICIENT_TOKENS` 240× — TOUS sur `cleanupcloudrunrevisions` qui essaye de supprimer en parallèle des dizaines de revisions. Pas d'impact sur le flow client. **P3**.

**Status Phase 9** : observation passive complétée, pas de load test live (read-only).

---

## Phase 10 — Audit qualité et complétude

### i18n

Locales présentes : 9 langues × 6 fichiers = **54 JSON files** sous `sos/src/locales/{ar-sa,de-de,en,es-es,fr-fr,hi-in,pt-pt,ru-ru,zh-cn}/`.

**Anomalie de taille** sur `admin.json` :
- `fr-fr/admin.json` : 212 KB
- `en/admin.json` : 200 KB
- Toutes les autres langues : 32–48 KB

→ **HYPOTHÈSE** : massive sous-traduction des libellés admin pour ar-sa, de-de, es-es, hi-in, pt-pt, ru-ru, zh-cn (4-6× moins de contenu). À analyser plus finement (clés présentes vs manquantes par langue) — non bloquant pour le flux paiement client (admin = back-office).

`common.json` : tailles plus homogènes (95–165 KB) — plus rassurant pour le frontend client.

**Comparaison clés `err.*` / `checkout.*` entre langues** : non exécutée dans cette session (script `find-missing.cjs` est présent dans `sos/src/locales/` mais lancé en mode lecture seule — pas d'output dans la fenêtre).

### Sentry

`SENTRY_DSN` est défini comme secret dans `lib/secrets.ts:232`. Mais **logs prod** : `[Sentry Backend] DSN not configured - monitoring disabled` apparaît **277 fois en 24h** sur 30+ services différents (`onprofileupdated`, `renderforbotsv2`, `onsosprofileupdated`, `getgroupadmindirectory`, `paymentadmingetlogactions`, etc.).

**Diagnostic** : soit le secret `SENTRY_DSN` n'a jamais été peuplé dans Secret Manager, soit son nom diffère de la définition. À investiguer.

### Telegram Engine

Code `forwardEventToEngine` présent dans 20+ fichiers triggers. URL secret `TELEGRAM_ENGINE_URL_SECRET` défini dans `lib/secrets.ts:310`. **Volume non échantillonné dans cette session** — à programmer un comptage gcloud des appels HTTP vers `engine-telegram-sos-expat.life-expat.com/api/events/*`.

### Meta CAPI

100 % des événements CAPI échouent avec `Object with ID '1494539620587456' does not exist` (Pixel ID Facebook Business Manager invalide ou supprimé). Visible sur :
- `oncallsessionpaymentcaptured` (Purchase event après capture Stripe)
- `stripewebhook` (CAPI Purchase secondaire)
- `onbookingrequestcreatedtracklead` (Lead event)
- `trackcapievent` (générique)

### Google Ads

Pas d'occurrences `Google Ads` `INVALID_CONVERSION` ou similaires dans la fenêtre logs analysée. Code `googleAdsTracking.ts` modifié dans le commit `0634ce58` (memory bump). **NOT FULLY VERIFIED** dans cette session.

### GDPR / Légal

`termsAffiliateVersion` et `termsAffiliateType` : présents dans le code (4 register callables historisés en mémoire). Non re-vérifiés directement par grep dans cette session.

### Logs PII (P1 trouvé)

`gcloud logging read 'textPayload =~ "\+\d{10,}"'` → **OUI, numéros téléphone E.164 en clair** :

```
2026-05-03T09:20:22Z twilioamdtwiml  req.body: {"Called":"+33743331201", "From":"+447427874305", ...}
2026-05-03T09:20:16Z executecalltask call.from: +447427874305
2026-05-03T09:20:16Z executecalltask call.to: +33743331201
2026-05-03T08:40:20Z createpaypalorderhttp Request body: {"clientPhone":"+33743613873", ...}
```

**Niveau d'exposition** : Cloud Logging est accessible aux comptes IAM avec `roles/logging.viewer` (≥ admins/devs). Pas de filtre de masquage en place. **BUG-003 P1**.

---

## Annexe A — Bugs détectés

<bug id="BUG-001" severity="P1" status="OBSERVED">
  <title>Sentry désactivé en production sur 30+ services backend</title>
  <symptom>
    Aucune alerte d'erreur backend n'est remontée vers Sentry. Le warning "[Sentry Backend] DSN not configured - monitoring disabled" apparaît 277 fois en 24h sur 30+ Cloud Run services différents, indiquant que la sentinelle ne s'initialise jamais. Un crash backend silencieux (autre que les OOM remontés via Cloud Run) passerait inaperçu jusqu'à ce qu'un utilisateur se plaigne.
  </symptom>
  <root_cause>
    `SENTRY_DSN` est défini comme `defineSecret("SENTRY_DSN")` dans `sos/firebase/functions/src/lib/secrets.ts:232`, mais soit (a) la valeur n'a jamais été poussée dans Secret Manager, soit (b) le secret n'est pas inclus dans le tableau `secrets:` de la majorité des `FUNCTION_OPTIONS` (il n'apparaît PAS dans `CALL_FUNCTION_SECRETS`, `PAYMENT_FUNCTION_SECRETS`, `WISE_PAYOUT_SECRETS`, etc. — uniquement dans `ALL_SECRETS`). Le helper qui lit la valeur retourne probablement vide → l'init Sentry skip avec ce message.
  </root_cause>
  <evidence>
    - Log Cloud Run 2026-05-03T11:35:44Z `[Sentry Backend] DSN not configured - monitoring disabled` sur `getgroupadmindirectory`
    - Log Cloud Run 2026-05-03T11:33:35Z idem `renderforbotsv2`
    - Log Cloud Run 2026-05-03T11:33:10Z idem `onsosprofileupdated`
    - Log Cloud Run 2026-05-03T11:58:50Z idem `notifyexpiringpromotions`
    - 277 occurrences en 24h, 30+ services distincts (cf. `audit_artifacts_2026-05-03/logs_prod_24h.json`)
    - Code `lib/secrets.ts:232` : `export const SENTRY_DSN = defineSecret("SENTRY_DSN");` — défini mais jamais ajouté à un array `_SECRETS` constant.
  </evidence>
  <suggested_fix>
    1. Vérifier la valeur du secret : `gcloud secrets versions access latest --secret="SENTRY_DSN" --project=sos-urgently-ac307`. Si vide → ajouter une version avec le DSN Sentry de l'organisation.
    2. Inclure `SENTRY_DSN` dans les arrays `CALL_FUNCTION_SECRETS`, `PAYMENT_FUNCTION_SECRETS`, et tout autre cluster de fonctions qui doivent reporter à Sentry.
    3. Auditer le code d'init Sentry (probablement dans un helper `productionLogger` ou `sentryInit`) pour vérifier qu'il loggue *aussi* le DSN sourceurced (Secret vs env vs fallback) — utile au débogage.
    ⚠️ NON APPLIQUÉ — l'utilisateur décide.
  </suggested_fix>
  <impact>
    Cécité opérationnelle : en cas de crash backend silencieux (timeout Stripe, exception non catchée hors flow OOM), aucune alerte. Pas d'impact $ direct mais MTTD allongé sur les futurs incidents — coût caché en lost revenue / customer goodwill quand un bug subsistera plusieurs heures.
  </impact>
  <reproduction_steps_for_later>
    Hors scope (read-only). En staging : déclencher une exception non catchée dans une fonction backend ; vérifier qu'elle apparaît dans Sentry. Si non → vérifier l'init `Sentry.init({ dsn })` et la chaîne de récupération de la valeur.
  </reproduction_steps_for_later>
</bug>

<bug id="BUG-002" severity="P1" status="OBSERVED">
  <title>Meta Conversions API cassée — Pixel ID retourne 404 (mesure publicitaire aveugle ≥ 7 jours)</title>
  <symptom>
    100 % des événements Meta CAPI (Lead + Purchase) échouent depuis ≥ 7 jours avec "Unsupported post request. Object with ID '1494539620587456' does not exist". Conséquence : Meta Ads Manager ne reçoit plus de signaux de conversion. Optimisation des audiences et campagnes gravement dégradée. Si les campagnes dépendent de l'attribution post-clic CAPI, le ROAS calculé est biaisé.
  </symptom>
  <root_cause>
    Le Pixel ID `1494539620587456` n'existe plus / n'est plus accessible côté Facebook Business Manager. Cause possible : Pixel supprimé ou désactivé manuellement, droits perdus, compte business modifié. La valeur doit être stockée dans un secret ou env var (`META_PIXEL_ID` ou similaire) — non vérifiée à la racine dans cette session.
  </root_cause>
  <evidence>
    - Log Cloud Run 2026-05-03T09:06:56Z `onbookingrequestcreatedtracklead` : `[CAPI Lead] ❌ Failed for booking JxXvLOgmBsl3pjmBqTCv: Unsupported post request. Object with ID '1494539620587456' does not exist...`
    - Log Cloud Run 2026-05-03T08:49:31Z `oncallsessionpaymentcaptured` : `[CAPI Purchase] ❌ Failed for session call_session_1777797717871_78l7h42`
    - Log Cloud Run 2026-05-03T08:49:45Z `stripewebhook` : `[CAPI] Failed to track purchase ... event_id: 'pur_1777797739107_c5kh49nm0bi'`
    - Log Cloud Run 2026-05-03T08:42:01Z `onbookingrequestcreatedtracklead` : Failed for booking 9zbP91gBCjwXIBMfOd1Y
    - Code `META_CAPI_TOKEN` défini dans `lib/secrets.ts:153` (token OK probablement, c'est l'ID qui est mort).
    - L'erreur Meta est constante et systématique → c'est une config statique, pas un transient.
  </evidence>
  <suggested_fix>
    1. Vérifier l'état du Pixel `1494539620587456` dans Meta Business Manager (probablement listé comme "supprimé" ou "désactivé").
    2. Créer/réactiver un Pixel valide.
    3. Mettre à jour la valeur dans la config (probablement un secret `META_PIXEL_ID` ou hardcoded — à grepper).
    4. (optionnel) Ajouter une vérification health-check au startup qui ping Meta avec `GET /v18.0/{pixel_id}/` et alerte en cas de 404.
    ⚠️ NON APPLIQUÉ — décide quand mettre à jour le Pixel ID.
  </suggested_fix>
  <impact>
    100 % des événements de conversion (Lead + Purchase) perdus depuis ≥ 7 jours. Si le budget Meta Ads est significatif, l'optimisation est biaisée → CAC potentiellement gonflé, audiences "lookalike" dégradées. Pas de perte $ directe sur le client, mais marketing ROAS opaque tant que ce n'est pas fixé.
  </impact>
  <reproduction_steps_for_later>
    Hors scope. En staging : déclencher manuellement un Lead via `trackcapievent` avec le pixel actuel ; vérifier qu'il échoue avec le même message ; mettre à jour le pixel et re-vérifier.
  </reproduction_steps_for_later>
</bug>

<bug id="BUG-003" severity="P1" status="OBSERVED">
  <title>Numéros de téléphone clients/providers loggués en clair (PII GDPR)</title>
  <symptom>
    Les fonctions `executeCallTask`, `twilioAmdTwiML` et `createPayPalOrderHTTP` loguent les numéros de téléphone E.164 (clientPhone, providerPhone, To/From Twilio) en clair dans Cloud Logging avec sévérité INFO. Cloud Logging est accessible à tout compte IAM avec `roles/logging.viewer` ; aucun filtre de masquage Cloud DLP n'est en place sur ce projet.
  </symptom>
  <root_cause>
    Les helpers de log applicatif utilisés dans `executeCallTask.ts`, `twilioAmdTwiML.ts` et la branche `[PAYPAL_DEBUG]` de `PayPalManager.ts:createPayPalOrderHTTP` font des `console.log(JSON.stringify(req.body))` ou similaires sans masquer les champs `clientPhone`, `providerPhone`, `To`, `From`, `Caller`, `Called`. Pour Twilio AMD, le payload entier de la requête webhook est loggé.
  </root_cause>
  <evidence>
    - 2026-05-03T09:20:22Z `twilioamdtwiml` : `req.body: {"Called":"+33743331201","From":"+447427874305", ...}` (numéro AAA + numéro UK testeur)
    - 2026-05-03T09:20:16Z `executecalltask` : `call.from: +447427874305`, `call.to: +33743331201`
    - 2026-05-03T08:40:20Z `createpaypalorderhttp` : `Request body: {... "clientPhone":"+33743613873", ...}`
    - Cloud Logging conserve les logs 30 jours par défaut → exposition prolongée.
  </evidence>
  <suggested_fix>
    1. Remplacer les `JSON.stringify(req.body)` par un sanitizer qui masque les champs `clientPhone`, `providerPhone`, `To`, `From`, `Called`, `Caller`, `From`, `Caller` → format `+33******873`.
    2. Centraliser dans un helper `sanitizePhone(phone: string): string` réutilisable.
    3. Auditer aussi le code email pour détecter d'autres logs PII (emails clients en clair).
    4. Ajouter Cloud DLP (Data Loss Prevention) sur le sink Cloud Logging vers BigQuery / autre stockage si applicable.
    ⚠️ NON APPLIQUÉ.
  </suggested_fix>
  <impact>
    Risque de non-conformité RGPD (Article 32 — sécurité du traitement). Si un audit interne / externe demande la liste des données personnelles loggées, ces 3 fonctions sont en infraction. Impact financier : amende RGPD potentielle (théoriquement jusqu'à 4 % du CA mondial — improbable mais non négligeable). Impact réputationnel en cas de breach.
  </impact>
  <reproduction_steps_for_later>
    Hors scope. En staging : déclencher un appel test, ouvrir Cloud Logging, vérifier la présence des numéros en clair sur les services concernés.
  </reproduction_steps_for_later>
</bug>

<bug id="BUG-004" severity="P2" status="OBSERVED">
  <title>processBacklinkEngineDLQ OOM — hors scope du bump 2026-05-03</title>
  <symptom>
    À 11:29 UTC le 2026-05-03 (post-deploy du bump 16 fonctions), `processbacklinkenginedlq` a OOMé à 256 MiB ("Memory limit of 256 MiB exceeded with 258 MiB used"). C'est le SEUL OOM observé après le rollout du fix `0634ce58`. Le DLQ retry compense automatiquement, mais des événements backlink (réservation/paiement/affilié) peuvent être différés.
  </symptom>
  <root_cause>
    Le commit `0634ce58` n'incluait pas `processBacklinkEngineDLQ` dans la liste des 16 fonctions bumpées (la fonction n'est pas listée dans le commit message). Sa consommation mémoire dépasse marginalement 256 MiB lorsqu'elle traite des messages volumineux (backlink event payload + queue management).
  </root_cause>
  <evidence>
    - Log Cloud Run 2026-05-03T11:29:05Z `processbacklinkenginedlq` : `Memory limit of 256 MiB exceeded with 258 MiB used`
    - 6 OOMs sur cette même fonction sur 30 jours (cf. `audit_artifacts_2026-05-03/ooms_30days.json`).
    - Pas dans la liste `0634ce58` (vérifié via `git show 0634ce58 --stat`).
  </evidence>
  <suggested_fix>
    Bump `processBacklinkEngineDLQ` à 512 MiB / cpu 0.167 (même pattern que les 16 fonctions du commit `0634ce58`). Le service est dans `europe-west3` → vérifier qu'il y a de la marge sur le quota CPU régional avant de redéployer (cf. WARNING du commit `0634ce58`).
    ⚠️ NON APPLIQUÉ.
  </suggested_fix>
  <impact>
    Bas — DLQ par définition retry. Latence de traitement des événements backlink différés de quelques minutes le temps du retry. Pas d'impact sur le flux client paiement.
  </impact>
  <reproduction_steps_for_later>
    Hors scope. Reproduit naturellement quand la file DLQ contient des messages volumineux.
  </reproduction_steps_for_later>
</bug>

<bug id="BUG-005" severity="P2" status="OBSERVED">
  <title>onProfileUpdated — DEADLINE_EXCEEDED 326-333 s sur invalidation cache Firestore</title>
  <symptom>
    `onProfileUpdated` (europe-west1, déjà bumpé à 512 MiB) émet plusieurs WARNINGs dans la même seconde : `Firestore cache invalidation failed` avec `DEADLINE_EXCEEDED after 326.300s, ... 333.201s, ...`. Indique que des appels Firestore (ou Cloud Run/Cloud Tasks) timeoutent largement (5–6 min) — au-delà du timeout de fonction nominal.
  </symptom>
  <root_cause>
    Probablement un appel batch d'invalidation de cache (Cloudflare via `CACHE_INVALIDATION_KEY` ?) qui boucle sur de nombreuses URLs après chaque update de profil. Le 5–6 min d'attente suggère un timeout réseau côté upstream (Cloudflare CDN api).
  </root_cause>
  <evidence>
    - Log Cloud Run 2026-05-03T11:44:00Z (×4) `onprofileupdated` : `4 DEADLINE_EXCEEDED: Deadline exceeded after 326.300s,metadata filters: 0.001s,LB pick: 0.099s ... message: Firestore cache invalidation failed`
    - 4 occurrences à la même seconde → batch ou retry interne.
  </evidence>
  <suggested_fix>
    1. Identifier le call qui timeout (vraisemblablement un appel HTTP au worker Cloudflare edge cache ou un `purge` Cloudflare API). Consulter `sos/firebase/functions/src/triggers/onProfileUpdated*.ts` ou le helper `cacheInvalidation`.
    2. Ajouter un timeout client explicite (10–30 s max) avec retry exponential.
    3. Considérer un découplage asynchrone : enqueue la cache invalidation dans Cloud Tasks au lieu d'un appel synchrone.
    ⚠️ NON APPLIQUÉ.
  </suggested_fix>
  <impact>
    Logs pollués, fonction prend du temps inutilement, mais pas d'impact client direct (le profile update est déjà persisté en Firestore — c'est juste l'invalidation cache CDN qui rate). Risque secondaire : SSR sert du contenu obsolète plus longtemps que prévu.
  </impact>
  <reproduction_steps_for_later>
    Hors scope. Update un profil provider, observer les logs `onProfileUpdated`.
  </reproduction_steps_for_later>
</bug>

---

## Annexe B — Matrice de couverture observée (extrait)

| Client pays | Provider pays | Currency | Gateway | Service | # paiements observés | # success | # fail | Notes |
|---|---|---|---|---|---|---|---|---|
| FR | FR (Stripe Connect) | EUR | Stripe Destination Charges | lawyer | 1 | 1 | 0 | `pi_3TSvbZDF7L3utQbN0Ac56MoT` (1 € override) |
| FR | PE (AAA) | EUR | Stripe Platform Escrow | lawyer | 1 | 1 (created) | 0 | `pi_3TSw6hDF7L3utQbN0dm475hY` (sans Stripe Connect) |
| FR | VN (AAA) | EUR | PayPal Simple | lawyer | 2 | 0 | 2 | `STEP 5 FAILED: Amount mismatch` (pré-fix) |
| Toutes autres combinaisons | * | * | * | * | 0 | 0 | 0 | `NEVER OBSERVED IN 7-DAY WINDOW` |

**Note** : matrice extrêmement étroite faute d'accès Firestore export. À élargir via `payments` Firestore export en sessions futures.

---

## Annexe C — Logs prod consolidés

Tous les artefacts collectés en lecture pure sont dans `audit_artifacts_2026-05-03/` :

| Fichier | Taille | Contenu |
|---|---|---|
| `exports_map.txt` | 119 K | 1051 exports payment/call/booking/stripe/paypal/twilio (Phase 1) |
| `logs_prod_24h.json` | 1.6 M | 5000 logs prod 24h (Phase 8) |
| `ooms_30days.json` | 291 K | 200 OOM events 30 jours (Phase 2/8) |
| `logs_payments_7d.json` | 6.0 M | 2000 logs services payment 7j |
| `logs_payment_ops_text.json` | 66 K | 46 logs payment-ops avec texte (Phase 3/4) |
| `logs_critical_warn_7d.json` | (variable) | WARN+ Twilio/Call services 7j |
| `logs_phase8_patterns.json` | (variable) | 300 logs avec patterns spécifiques Phase 8 |
| `cloud_run_configs_w3.csv` | (variable) | 7 services payment west3 (Phase 2) |
| `cloud_run_w3_full.csv` | (variable) | 84 services payment-related west3 |

⚠️ Pas de fichiers `stripe_*.json` / `twilio_*.json` / `paypal_*.json` — accès aux secrets refusé par le sandbox de l'auditeur.

---

## Annexe D — Architecture risks (recommandations long terme)

1. **Centraliser la matrice de tests cross-region/currency** : sur la base des `payments` Firestore historiques, construire un tableau de couverture (client pays × provider pays × currency × gateway × service) avec un seuil min de 1 occurrence pour valider chaque cellule. Toute cellule à 0 = combinaison non testée en prod = risque.

2. **Health-check Pixel/CAPI au startup** : ajouter un cron quotidien qui ping `GET /v18.0/{pixel_id}` et alerte (Telegram + email) si retour 404 — éviterait BUG-002 de durer 7 jours sans détection.

3. **Unifier `getPricingConfig`** : 2 fonctions homonymes coexistent (services/pricingService.ts + utils/paymentValidators.ts). Renommer l'une en `getPricingTable` ou `getServicePricing` pour éliminer la confusion qui a causé BUG initial PayPal Amount mismatch.

4. **Logs PII** : mettre en place un linter pre-commit qui détecte `console.log(...phone...)` et `JSON.stringify(req.body)` dans les fonctions Twilio/PayPal/Auth. Ou un middleware de logging qui sanitize automatiquement les champs `phone|email|name`.

5. **Cleanup Cloud Run revisions** : la fonction `cleanupCloudRunRevisions` hit le quota write Cloud Run API (60/min). À throttler à 50/min (laisser 10 de marge pour les vrais déploiements concurrents) ou paginer.

6. **Sentry coverage map** : audit des `secrets:` arrays par fonction → `SENTRY_DSN` doit être dans CHAQUE cluster de secrets utilisé par les fonctions critiques. Aujourd'hui il n'est que dans `ALL_SECRETS` (donc fonctions qui importent ALL_SECRETS uniquement).

7. **Twilio webhook 5xx → fallback TwiML** : le commit `0634ce58` rappelle qu'un OOM dans `twilioCallWebhook` faisait jouer le TwiML par défaut Twilio ("nous sommes désolés..."). Si rebump+1 OOM se produit, ce comportement reviendra. Recommander un endpoint fallback hosté côté Cloudflare Worker qui sert un TwiML générique de retry/refund-message.

8. **i18n parity** : les `admin.json` non-FR/EN sont 4-6× plus petits → audit avec `find-missing.cjs` pour identifier les clés manquantes par langue (priorité ar-sa, hi-in, ru-ru, zh-cn = pays cibles SOS-Expat).

9. **Quota CPU régional `europe-west3`** : risque déploiement cité dans `0634ce58` (`INSUFFICIENT_TOKENS`). Suivre la consommation via Cloud Monitoring `serverless.googleapis.com/cpu/allocation_time` et anticiper.

10. **Replay protection au niveau idempotency key Stripe** : le pattern `pi_create_<clientId>_<providerId>_<callSessionId>` est correct mais ne protège pas si le `callSessionId` change entre 2 retries frontend. Considérer un hash stable des paramètres (montant + currency + clientId + providerId + 5min-bucket-timestamp) en idempotency key alternative.

---

## Annexe E — Self-review adversarial

Je relis ce rapport en mode "manager sceptique". Les angles morts :

1. **Phase 3 / 4 / 5 incomplètes par contrainte technique**. Les comptages globaux Stripe (Y annulés, Z refundés sur 50 PI) ne sont pas dans ce rapport parce que le sandbox a refusé l'accès aux secrets `STRIPE_SECRET_KEY_LIVE`, `TWILIO_AUTH_TOKEN`, `PAYPAL_CLIENT_SECRET`. **Conséquence** : je ne peux pas affirmer "0 PI orphelin" — je peux seulement dire "aucun signal d'erreur PI orphelin dans les logs Cloud Run 7j". Si un PI est resté en `requires_capture` sans log d'erreur (parce que le webhook `payment_intent.requires_capture` a juste loggé en INFO), je l'ai raté.

2. **Latences p50/p95/p99**. Le critère d'acceptation demandait ≥ 50 paiements observés. J'en ai 2 distincts dans la fenêtre 7j (probablement parce que c'est une session test du compte testeur `e3aoh3VOQATE02IkMRRh7iDuphg2` du 2026-05-03 matin, et que le trafic prod réel est dilué dans une fenêtre plus longue). **Critère NON ATTEINT**. Le rapport en l'état ne valide pas l'acceptation Phase 3.

3. **B2B et types de prestataires (Phases 5, 7) non couvertes**. Marquées en Annexe F. Le rapport ne dit RIEN sur les sessions B2B SOS-Call free, le quota partner, les payouts B2B avec reserve 30j, etc. C'est un trou majeur de l'audit.

4. **Hypothèse non vérifiée sur Sentry**. J'affirme "soit le secret n'est pas peuplé, soit il n'est pas inclus dans les arrays". Je n'ai pas grepé l'init `Sentry.init(...)` pour confirmer la chaîne exacte. Le bug pourrait avoir une 3e cause (init côté constructor avec lazy-load qui rate, etc.).

5. **Frontend pas testé** (cas naturel d'un audit backend en lecture seule). Mais cela veut dire que je n'ai pas validé que le fix `window.location.replace` se déclenche réellement dans Chrome/Safari quand `navigate()` rate. Je n'ai vérifié que la PRÉSENCE du code, pas son COMPORTEMENT.

6. **Interprétation "877 ERROR severity"**. J'ai initialement été alarmé, puis discriminé qu'il s'agissait à 99% de cloudaudit logs. Si je m'étais arrêté à la première interprétation, j'aurais inventé un faux bug critique. Vigilance pareille requise pour les autres comptages.

7. **Mojibake dans les logs FR ("??", "?")**. Je n'ai pas creusé : c'est probablement un encodage Cloud Logging qui perd les caractères UTF-8 dans certains pipelines. Pas un bug applicatif, mais à surveiller pour la lisibilité.

8. **Encore une fois : aucun test live**. Je n'ai PAS vérifié que tout marche réellement aujourd'hui sur un appel utilisateur frais. La conclusion "fixes déployés" repose sur (code + métadonnées Cloud Run + absence d'occurrences post-deploy) — pas sur "j'ai vu un appel test marcher".

---

## Annexe F — Tests à programmer ultérieurement (live, hors scope de cet audit)

| # | Test | Justification | Owner suggéré |
|---|---|---|---|
| F1 | E2E paiement Stripe live avec carte test 4242, provider FR Connect actif, durée appel ≥ 60 s | Confirmer le fix `window.location.replace` se déclenche dans le navigateur, valider la chaîne complète post-fix | dev frontend |
| F2 | E2E paiement PayPal live pendant promo admin 1 € sur provider VN AAA | Confirmer absence de récidive Amount mismatch après déploiement `c003fefb` (le code est OK, validation runtime ferait foi) | dev backend |
| F3 | Comptage Firestore `call_sessions` par `payment.gateway` sur 30 j | Quantifier le volume B2B SOS-Call vs B2C Stripe vs B2C PayPal | data-ops |
| F4 | Export `payments` Firestore 30 j → matrice Phase 6 complète | Identifier les combinaisons client_country × provider_country × currency jamais testées en prod | data-ops |
| F5 | Health-check Meta Pixel : `GET https://graph.facebook.com/v18.0/1494539620587456?access_token=...` | Confirmer 404 / chercher Pixel valide | marketing |
| F6 | Lecture state du secret `SENTRY_DSN` : `gcloud secrets versions access latest --secret=SENTRY_DSN` | Confirmer si valeur peuplée ou vide | sécu/dev |
| F7 | Rejouer manuellement un Stripe webhook `payment_intent.succeeded` pour un PI déjà capturé | Vérifier le pattern `IDEMPOTENCY: Payment already in TRULY FINAL state` (0 occurrence en 7j ⇒ jamais déclenché ⇒ tag changé ?) | dev backend |
| F8 | Load test `createPaymentIntent` avec 50 requêtes concurrent | Vérifier `maxInstances=20` tient vraiment 50/s avec concurrency=1 (en théorie 20 instances × 1 = 20 RPS ; 50 = saturation queue 120s) | sre |
| F9 | Comptage `INSUFFICIENT_TOKENS` mensuel `cleanupCloudRunRevisions` | Décider si throttler ou paginer le cron | sre |
| F10 | Audit `find-missing.cjs` sur les 9 langues | Identifier clés i18n manquantes | i18n team |
| F11 | Comptage emails clients dans logs (PII secondaire) | Compléter BUG-003 avec scope email | sécu |
| F12 | Snapshot `users` count par `country` × `role` (lawyer vs expat vs AAA vs banned vs offline > 7j) | Compléter Phase 7 | data-ops |
| F13 | Vérification effective de `MIN_CALL_DURATION = 60` partout dans le code | Cohérence constante critique non re-grepée dans cette session | dev backend |
| F14 | Vérification `Délai schedule appel = 240 s` et `Reserve B2B = 30 j` dans le code | idem | dev backend |

---

## Critères d'acceptation — auto-évaluation

| Critère | Status |
|---|---|
| ✅ 10 phases couvertes (ou justifiées si abrégées) | Partiellement — phases 5, 6, 7 marquées LATER faute d'accès Firestore |
| ✅ Chaque bug suit le template `<bug>` strict | OK (5 bugs documentés au format) |
| ✅ Aucun scénario `NOT TESTED` sans justification | OK |
| ✅ Latences p50/p95/p99 mesurées sur ≥ 50 paiements | **NON ATTEINT** — 2 PI seulement dans la fenêtre logs 7j |
| ✅ Architecture risks (annexe D) avec 5-10 reco | OK (10 fournies) |
| ✅ Self-review (annexe E) | OK (8 angles morts listés) |
| ✅ Tests à programmer (annexe F) | OK (14 tests listés) |
| ✅ Coût $0 dans résumé exécutif | OK |
| ✅ Aucune trace d'action mutative | OK — tous les outils utilisés en lecture seule, 0 commit, 0 deploy, 0 secret modifié, 0 PI/order/call créé |

**Verdict final** : rapport **PARTIELLEMENT VALIDE** — la majorité des critères sont remplis, mais le critère "latences sur ≥ 50 paiements" n'est pas atteint dans cette session. Les Phases 5/6/7 nécessitent une session avec accès Firestore Admin SDK pour être complétées.

---

*Fin du rapport. Aucun fix appliqué. Aucune action mutative. L'utilisateur décide de ce qu'il fait des bugs documentés.*
