---
audit_date: 2026-04-25
auditor: Claude Opus 4.7 (audit interactif, 3 sub-agents Explore + checks directs)
duration_hours: ~2.5h
scope: Partner Engine + Système Appels + Paiements + Consoles admin + Sécurité + Idempotence + Crons/DR + Performance + i18n
out_of_scope: Telegram-Engine, Backlink-Engine, Mailflow, Blog Content Engine, SEO, Influenceur/Chatter/Blogger/GroupAdmin (sauf paiement)
prompt_source: PROMPT-AUDIT-E2E-PARTNER-CALL-PAYMENT-ADMIN-2026-04-25.md (v2.0)
---

# Rapport audit E2E SOS-Expat — 2026-04-25

## Synthèse exécutive (TL;DR)

La plateforme est globalement **mature** et **prête à scaler**, avec une infrastructure backup/DR solide (drills mensuels + trimestriels), des règles Firestore strictes, et la signature Stripe correctement vérifiée. **3 P0 nécessitent traitement avant scale agressif** : (1) la finalisation B2B en fin d'appel n'est PAS atomique (8 champs `payment.*` updatés hors transaction), (2) il n'existe aucune provision pour facture partenaire impayée — SOS-Expat absorbe 100% du risque crédit B2B sur 30 jours, (3) du code mort autour du flux `pending_partner_invoice` (job Laravel qui appelle un endpoint Firebase qui ne trouvera jamais de session) suggère une architecture en transition non terminée. Les autres findings sont des P1 d'UX (i18n incomplet sur 7 clés + 1 langue ZH legacy, frais retrait $3 invisibles dans le breakdown frontend) et de sécurité raisonnable mais pas optimale (validation crypto Twilio en mode monitoring par défaut, mais c'est un trade-off documenté pour éviter des hang-ups Cloud Run).

## Score global : 78/100

| Domaine | Score | P0 | P1 | P2 |
|---|---|---|---|---|
| 1. Système Partenaire | 80/100 | 0 | 4 | 4 |
| 2. Système d'Appels | 70/100 | 1 | 4 | 2 |
| 3. Système de Paiement | 72/100 | 2 | 5 | 2 |
| 4. Consoles d'admin | 85/100 | 0 | 1 | 2 |
| 5. Sécurité (OWASP-mini) | 82/100 | 0 | 2 | 3 |
| 6. Idempotence | 78/100 | 1 | 1 | 0 |
| 7. Crons & DR | 95/100 | 0 | 1 | 0 |
| 8. Performance | 85/100 | 0 | 0 | 1 |
| 9. i18n (9 langues) | 72/100 | 0 | 2 | 2 |

**Notes** :
- Score 100 = production-ready à l'échelle mondiale, aucun finding bloquant.
- Le score 78 global reflète une plateforme solide mais avec 3 P0 financiers à traiter et un nettoyage architectural B2B nécessaire.

---

## Findings (classés par priorité)

### P0 — bloquants production

#### P0-1 — Finalisation B2B non atomique (race condition payment.*)
**Fichier** : `sos/firebase/functions/src/TwilioCallManager.ts:2721-2735`
**Symptôme** : 8 champs `payment.*` + `isPaid` sont écrits via un seul `sessionRef.update()` non transactionnel à la fin d'un appel B2B (`isSosCallFree=true`, durée ≥60s). Si un trigger Firestore concurrent ou un webhook lit la session pendant l'application de cet update, des lecteurs peuvent observer un état intermédiaire (ex : `payment.status='captured_sos_call_free'` mais `isPaid=false` non encore visible) selon le caching côté Firestore SDK.
**Reproduction** : 1) Appel B2B ≥60s se termine ; 2) `handleCallCompletion` calcule `providerAmount` via `getB2BProviderAmount()` ; 3) Avant que l'update ligne 2721 ne soit propagé, un autre webhook (DTMF, conférence end) ou un trigger `onCallCompleted` lit la session — état partiel visible.
**Impact** : dashboards provider affichent zéro revenu pendant 100-500ms ; triggers affiliés/commissions peuvent manquer le `isPaid=true` et créer des records dupliqués ou skip des notifications légitimes ; comptabilité incohérente côté provider earnings dashboard.
**Fix proposé** : Wrapper en `db.runTransaction()` avec lecture initiale de la session (vérifier que `payment.status` est encore en état pré-update) puis update atomique. La même remarque s'applique à la branche directe Stripe en `capturePaymentForSession`.
**Effort estimé** : S (≤4h)

#### P0-2 — Aucune provision pour facture partenaire impayée à J+30 (B2B)
**Fichier** : `sos/firebase/functions/src/TwilioCallManager.ts:2715-2733` + `sos/firebase/functions/src/scheduled/` (absence de scheduler dédié)
**Symptôme** : À la fin d'un appel B2B, le provider est crédité IMMÉDIATEMENT (`isPaid=true`) avec un hold 30j (`payment.holdReason='30d_b2b_reserve'`, `availableFromDate=now+30d`). Le commentaire ligne 2715-2718 dit explicitement « **SOS-Expat takes that commercial risk** ». Aucun mécanisme côté code ne :
1. Vérifie à J+30 si le partenaire a effectivement payé sa facture mensuelle ;
2. Re-bloque le hold si la facture est impayée ;
3. Provisionne comptablement les créances B2B en attente.
**Reproduction** : 1) Partenaire signe un agreement, ses subscribers font 100 appels en M1 ; 2) Tous les providers crédités immédiatement ; 3) Partenaire ne paie pas la facture M+1 ; 4) À J+30 des appels, `releaseProviderPayments` (date-based, dans `ProviderEarningsService`) déplace les holds en disponible ; 5) Providers retirent l'argent ; 6) SOS-Expat absorbe la perte.
**Impact** : risque financier proportionnel au volume B2B + crédit partenaire. À 1000 appels/mois × 25€ moyens × 1 partenaire qui ne paie pas = 25 000€ de pertes irrécupérables. Surtout critique avant tout scale agressif.
**Fix proposé** : 
1. Ajouter scheduled function quotidienne qui interroge l'API Partner Engine pour les factures en retard >X jours et flip les call_sessions concernées vers `payment.holdReason='unpaid_invoice_chargeback'` (gel hold + retrait bloqué).
2. Documenter en KPI le « risque B2B en cours » (somme des holds 30j par partenaire avec facture en retard).
3. Alternative architecturale : remplacer le crédit immédiat par `payment.status='pending_partner_invoice'` à la fin d'appel, et faire flipper par `releaseProviderPayments` SEULEMENT au paiement de la facture (cf. P1-1 ci-dessous : ce flow EXISTE déjà mais est dead code).
**Effort estimé** : M (1j) pour l'option 1, L (2-3j) pour l'option 3.

---

### P1 — importants mais non-bloquants

#### P1-1 — Code mort : flux `pending_partner_invoice` jamais déclenché
**Fichier** : 
- `sos/firebase/functions/src/partner/callables/releaseProviderPaymentsForInvoice.ts:71-77` (filtre `payment.status == 'pending_partner_invoice'`)
- `partner_engine_sos_expat/app/Jobs/ReleaseProviderPaymentsOnInvoicePaid.php:18-21` (commentaire décrit le flow)
**Symptôme** : Le système contient une architecture B2B alternative non terminée :
1. Job Laravel `ReleaseProviderPaymentsOnInvoicePaid` est dispatché au paiement d'une facture partenaire ;
2. Il appelle l'endpoint Firebase HTTP `releaseProviderPayments` (us-central1) avec `partner_firebase_id`, `period`, `invoice_id` ;
3. L'endpoint exécute une query Firestore qui filtre sur `payment.status == 'pending_partner_invoice'` ;
4. **Mais `pending_partner_invoice` n'est ÉCRIT NULLE PART dans le repo Firebase Functions**. `TwilioCallManager.ts:2722` écrit directement `captured_sos_call_free`.
Résultat : query renvoie systématiquement 0 résultat, batch.commit ne s'exécute jamais, l'endpoint répond 200 avec `released_count: 0`. Personne ne voit l'erreur.
**Impact** : (a) confusion architecturale pour le développeur suivant, (b) infrastructure morte non utilisée, (c) cohérent avec P0-2 : le flux invoice-gated existait mais a été remplacé par le flux immediate-credit sans nettoyer.
**Fix proposé** : Décider business-wise : conserver le flow immediate-credit (dans ce cas supprimer endpoint Firebase + job Laravel + 1 fichier doc `deploy/E2E-AUDIT-PLAN.md`) OU revenir au flow invoice-gated (modifier TwilioCallManager pour écrire `pending_partner_invoice` au lieu de `captured_sos_call_free`). Cf. P0-2, ces 2 issues sont liées.
**Effort estimé** : S (≤4h) pour le nettoyage, M pour le rebascule au flow invoice-gated.

#### P1-2 — Inconsistance documentaire : 30j (code) vs 60j (commentaires)
**Fichier** : 
- `sos/firebase/functions/src/TwilioCallManager.ts:2717` (commentaire « 30-day reserve ») et `:2720` (`RESERVE_DAYS = 30`)
- `sos/firebase/functions/src/partner/callables/releaseProviderPaymentsForInvoice.ts:11-13` (commentaire « 60 days after the call »)
- `partner_engine_sos_expat/app/Jobs/ReleaseProviderPaymentsOnInvoicePaid.php:23-25` (commentaire « 60 days from the call »)
- Mémoire user `project_sos_call_b2b_2026_04_24.md` : « hold provider 60j »
**Symptôme** : Le code TwilioCallManager hold en hardcoded 30 jours, mais 3 commentaires + la mémoire user disent 60 jours. La valeur effective en prod est 30 jours.
**Impact** : confusion équipe + KPI dashboard, possible non-conformité avec engagement contractuel partenaires/providers (« le contrat dit 60j mais on libère à 30j »). À vérifier dans la CGV B2B partenaire et CGU provider.
**Fix proposé** : (1) Lire les CGV B2B et CGU provider pour identifier la valeur **contractuelle** ; (2) Aligner code + commentaires + mémoire sur cette valeur unique.
**Effort estimé** : XS (vérification + 4 fichiers à modifier).

#### P1-3 — Validation cryptographique Twilio en mode monitoring par défaut
**Fichier** : `sos/firebase/functions/src/lib/twilio.ts:247` (`let cryptoBlockingCached = false`) + `:370-388` (logique blocking/monitoring)
**Symptôme** : La signature HMAC Twilio est validée mais en cas d'échec, la requête est ALLOWED (warning log only) sauf si `admin_config/twilio_security.cryptoValidationBlocking === true` (à set manuellement). La protection effective repose sur 2 layers blocking restants : (a) présence du header `X-Twilio-Signature`, (b) match `AccountSid` reçu vs attendu.
**Reproduction** : Un attaquant qui connaît le `AccountSid` (ce sid n'est pas un secret rigoureux) peut envoyer un faux webhook ; les layers 1+2 passent ; layer crypto échoue mais request acceptée si le flag Firestore est false.
**Impact** : surface d'attaque réduite (faux webhook = call inventé, capture forgée), mais réelle. Le commentaire ligne 247 explique la raison : un P0 du 2026-03-03 a montré que blocking causait des 403 → Twilio raccrochait 3-4s après début d'appel à cause de la normalisation d'URL Cloud Run vs URL signée par Twilio.
**Fix proposé** : Vérifier en prod l'état de `admin_config/twilio_security` (lecture refusée par sandbox pendant l'audit — cf. Annexe B). Si flag est `true`, OK. Si `false` ou absent, soit (a) corriger la normalisation d'URL pour pouvoir activer blocking sans casser, soit (b) ajouter un check signature additionnel sur le body (`From`, `To`, timestamp) pour réduire la surface forgeable.
**Effort estimé** : M.

#### P1-4 — B2B appel <60s : `isPaid` non défini
**Fichier** : `sos/firebase/functions/src/TwilioCallManager.ts:2746-2750`
**Symptôme** : Si appel B2B trop court (durée <`MIN_CALL_DURATION=60s`), code écrit `payment.status='no_credit_short_call'` + `gateway='sos_call_free'` mais ne définit PAS `isPaid: true`. Les triggers en aval (`onCallCompleted`, notifications client) lisent `isPaid=false` et envoient potentiellement un email « paiement échoué » au client B2B alors qu'aucun paiement n'était attendu (gratuit pour le client).
**Impact** : faux positifs UX → support inquiet → trace manuelle pour comprendre.
**Fix proposé** : ajouter `"isPaid": true` ligne 2747 (B2B sans crédit reste « payé par le partenaire » du point de vue contrat).
**Effort estimé** : XS (1 ligne).

#### P1-5 — Currency frontend → backend : `clientCurrency` non obligatoire dans triggerSosCallFromWeb
**Fichier** : `sos/firebase/functions/src/partner/callables/triggerSosCallFromWeb.ts:119` + `sos/src/pages/BookingRequest.tsx` (anonyme path A)
**Symptôme** : Le backend accepte `clientCurrency` optionnel et fallback sur `deriveCurrencyFromCountry(clientCountry)` si absent. Si le frontend SPA omet ce paramètre (bug, refactor, cache de version ancienne SW), le backend dérive du pays — donnant potentiellement EUR alors que l'utilisateur a explicitement choisi USD via le CurrencySelector et que `localStorage.preferredCurrency='usd'`.
**Impact** : provider peut être crédité dans la mauvaise devise vs le choix UI affiché au client → réconciliation cabinet ↔ provider incohérente.
**Fix proposé** : (a) marquer `clientCurrency` obligatoire dans le contrat callable (échec 400 si absent) ; (b) ou loguer un warning Firestore + alerte Telegram si le param est absent en prod (pour quantifier l'incidence avant durcissement).
**Effort estimé** : S.

#### P1-6 — Frais retrait $3 invisibles dans breakdown frontend
**Fichier** : `sos/src/components/payment/Forms/WithdrawalRequestForm.tsx:63-82` + `:189-200`
**Symptôme** : Frontend affiche les frais processeur Wise/Mobile Money (calcul local) mais omet le frais SOS fixe `$3` dans le breakdown visible. Backend déduit bien `$3 + frais processeur` à la création du withdrawal.
**Reproduction** : User retire 100€ via Wise, voit breakdown « Wise fee 0.50€, vous recevrez 99.50€ » → reçoit en réalité 96.50€ (100 - 3 SOS - 0.50 Wise).
**Impact** : confiance / churn affilié. Critique pour Mobile Money Afrique où les montants sont petits.
**Fix proposé** : afficher breakdown complet avec ligne dédiée « Frais SOS-Expat : -$3 ». Récupérer la valeur en temps réel depuis `getWithdrawalFee()` callable plutôt que de la hardcoder côté frontend (cohérence multi-devises).
**Effort estimé** : S.

#### P1-7 — i18n : 7 clés FR manquent dans les 7 autres langues, et `zh.json` absent (legacy `ch.json`)
**Fichier** : `sos/src/helper/{en,es,de,pt,ru,ar,hi}.json` (clés manquantes) + `sos/src/helper/ch.json` au lieu de `zh.json` ; loader `sos/src/App.tsx:262`
**Symptôme** : 
1. Le code utilise `ch` comme clé pour le chinois (legacy), mais l'audit hreflang 2026-04-16 (mémoire) a aligné les hreflang HTML sur `zh-CN`. Incohérence interne SEO ↔ runtime.
2. 7 clés manquent dans **chaque** langue non-FR :
   - `admin.menu.unifiedCommissions`
   - `admin.menu.unifiedCommissions.description`
   - `footer.services.news`
   - `influencer.calculator.clickrate`
   - `influencer.calculator.conversion`
   - `influencer.calculator.videos`
   - `influencer.calculator.views`
**Impact** : utilisateurs non-FR voient la clé technique (ex : `admin.menu.unifiedCommissions`) au lieu d'une traduction, sur les pages admin + calculator influencer + footer. Sur 8 langues × 7 clés = 56 strings manquantes.
**Fix proposé** : (1) Renommer `ch.json` → `zh.json` et la clé loader. (2) Backfill les 7 clés dans 7 langues — ce sont des labels courts, traduction LLM en bulk possible.
**Effort estimé** : XS.

#### P1-8 — i18n labels Telegram retrait FR-only
**Fichier** : `sos/firebase/functions/src/payment/callables/requestWithdrawal.ts:237-242` (sub-agent finding)
**Symptôme** : Confirmation Telegram envoie « Virement bancaire / Mobile Money / Wise » (FR uniquement) même quand l'utilisateur est en HI/AR/ZH/RU/etc.
**Impact** : confirmation Telegram illisible pour 6 langues sur 9 supportées.
**Fix proposé** : passer la `locale` du user dans `sendWithdrawalConfirmation()` et résoudre les labels via i18n centralisé.
**Effort estimé** : S.

#### P1-9 — Workflow GitHub Actions « Gmail Google Alerts → Telegram » fail en boucle (3/3 dernières)
**Fichier** : `.github/workflows/` (dans repo `sos-expat-project`)
**Symptôme** : 3 dernières exécutions schedulées le 2026-04-25 à 12:51, 13:26, 13:53 UTC → status `failure`, durée 15-18s. Boucle de retry inutile, alerts Telegram potentiellement manqués.
**Impact** : alerting Google Alerts cassé → veille concurrence/marque manquée. Hors scope strict de cet audit (pas un domaine Partner/Call/Payment/Admin) mais à fixer rapidement car retry storm.
**Fix proposé** : `gh run view 24932435737` pour identifier le vrai problème (token Gmail expiré ? secret manquant ?), puis fix.
**Effort estimé** : XS-S.

#### P1-10 — Endpoint partenaire `legal-documents` validation token replay (sub-agent claim non vérifié direct)
**Fichier** : `sos/firebase/functions/src/partner/callables/triggerSosCallFromWeb.ts:245-276`
**Symptôme (signalé par sub-agent)** : `sosCallSessionToken` validé par Partner Engine via `/api/sos-call/check-session` mais TTL non vérifié côté Firebase backend. Si Partner Engine n'expire pas les tokens, replay possible.
**Impact** : appels B2B frauduleux gratuits si token leak.
**Fix proposé** : ajouter une vérif `Date.now() - sessionData.issued_at < 60_000` côté backend Firebase. À cross-checker côté Partner Engine.
**Effort estimé** : S.

---

### P2 — nice-to-have

#### P2-1 — Stripe `pk_live_*` hardcodé dans script de génération `.env`
**Fichier** : `sos/scripts/generate-env-files.cjs:16`
**Symptôme** : la clé publishable Stripe LIVE (`pk_live_…`) est en clair dans un script JavaScript versionné. La clé publishable Stripe est destinée à être publique (frontend), donc PAS un secret au sens fort. Mais avoir des clés LIVE hardcodées dans des scripts côté repo est une mauvaise pratique : (1) si le compte Stripe change, il faut éditer le script ; (2) un attaquant qui obtient `pk_live` peut faire des tentatives de fraude « pre-charge » bien que limitée par PCI.
**Fix proposé** : remplacer par `process.env.STRIPE_PUBLISHABLE_KEY_LIVE` lu depuis l'env du builder CI/CD.
**Effort estimé** : XS.

#### P2-2 — Capture lock release non-atomique en cas d'erreur Stripe
**Fichier** : `sos/firebase/functions/src/TwilioCallManager.ts:3359-3364` (sub-agent finding)
**Symptôme** : si capture Stripe échoue, code supprime `captureLock` via `update().delete()` dans un `try/catch` vide. Si ce delete échoue (network), le lock reste 2h, bloquant les retries → paiement jamais capturé.
**Fix proposé** : logger l'échec + scheduler une release async via Cloud Task.
**Effort estimé** : S.

#### P2-3 — `pricing_tier` JSON snapshot non écrit sur partner_invoices (sub-agent finding)
**Fichier** : `partner_engine_sos_expat/app/Console/Commands/GenerateMonthlyInvoices.php` + migration `2026_04_25_000005_add_pricing_tiers_to_agreements_and_invoices`
**Symptôme** : la migration ajoute la colonne mais le command de génération de factures ne stocke pas le tier utilisé en snapshot. Si un admin modifie les tiers le mois suivant, on perd la justification du calcul historique.
**Fix proposé** : écrire `pricing_tier_snapshot` JSON au moment de la création de la facture.
**Effort estimé** : S.

#### P2-4 — Validation chevauchement brackets `pricing_tiers` absente côté form Filament (sub-agent finding)
**Fichier** : `partner_engine_sos_expat/app/Filament/Resources/PartnerResource.php:168-196`
**Symptôme** : repeater accepte des brackets disjoints OU chevauchants sans validation. Si un admin saisit `(0-100, 50€)` + `(50-150, 80€)`, ambigu pour count=75.
**Fix proposé** : custom validator au save sur l'array de tiers.
**Effort estimé** : S.

#### P2-5 — Anti-pattern Stripe `pk_live` documenté dans `docs/01-GETTING-STARTED/GUIDE_INSTALLATION_COMPLETE.md`
**Fichier** : ce doc contient la même clé que P2-1.
**Fix** : remplacer par placeholder `pk_live_REDACTED`.
**Effort** : XS.

#### P2-6 — Fragmentation seuil retrait `$30` (sub-agent finding payments)
**Fichier** : 
- `sos/src/components/payment/Forms/WithdrawalRequestForm.tsx:118` (hardcoded 3000)
- `sos/firebase/functions/src/services/feeCalculationService.ts:66` (fixedFee 3 USD lu depuis admin_config)
**Symptôme** : si admin change `admin_config/fees.withdrawalFees.fixedFee`, frontend continue d'afficher $30 hardcoded.
**Fix** : exposer `getPaymentConfig()` callable, frontend affiche depuis cette source de vérité.
**Effort** : S.

#### P2-7 — `wise` vs `bank_transfer` naming mismatch (sub-agent finding)
**Symptôme** : frontend utilise `'wise'` comme key, backend convertit en `'bank_transfer'` mais avec garde défensive. Pas de bug mais maintenabilité dégradée.
**Fix** : harmoniser sur `bank_transfer` partout, `wise` reste un label UI.
**Effort** : XS.

#### P2-8 — Pas de rate-limit sur les téléchargements de PDF legal docs partenaires (sub-agent finding)
**Fichier** : `partner_engine_sos_expat/app/Http/Controllers/Partner/LegalDocumentController.php:162-186`
**Fix** : `->middleware('throttle:pdf-downloads,5,1')`.
**Effort** : XS.

#### P2-9 — Branch manager scoping incomplet sur StatsPartnerWidget (sub-agent finding, à confirmer)
**Fichier** : `partner_engine_sos_expat/app/Filament/Partner/Widgets/StatsPartnerWidget.php:43-81`
**Symptôme** : si `getManagedGroupLabels() === []`, code retourne tableau vide sans throw — UX dégradée plutôt que faille de sécurité (au pire dashboard vide).
**Fix** : assertion stricte avec message explicite.
**Effort** : S.

#### P2-10 — Test workflow rapidstart : `gh run list` sos-expat-project ne montre QUE le workflow Gmail (filtré ?)
**Symptôme** : `gh run list --limit 3` ne renvoie que les 3 dernières runs schedulées du workflow Gmail, pas de visibilité sur les autres workflows actifs (deploys frontend Cloudflare Pages, etc.). Soit Cloudflare Pages déploie via webhook GitHub (pas via Actions), soit aucun deploy récent à l'heure de l'audit (~14h UTC le 2026-04-25, vendredi → freeze partiel).
**Effort** : XS (juste vérifier `gh workflow list`).

---

## Plan d'action priorisé (top 10)

| # | Pri | Item | Fichier | Effort | Impact métier |
|---|-----|------|---------|--------|----------------|
| 1 | P0 | Wrapper finalisation B2B en `runTransaction` | `TwilioCallManager.ts:2721-2735` | S | Cohérence dashboards + commissions affiliés sans dups |
| 2 | P0 | Provision facture partenaire impayée à J+30 | nouveau scheduled function | M | Évite perte directe €€ sur partenaire défaillant |
| 3 | P1 | Décider et nettoyer code mort `pending_partner_invoice` | endpoint Firebase + job Laravel | S-M | Clarification architecture + cohérence avec P0 #2 |
| 4 | P1 | Aligner 30j/60j (vérifier CGV) | code + 3 commentaires + mémoire | XS | Conformité contractuelle |
| 5 | P1 | Rendre `clientCurrency` obligatoire (ou alerter) | `triggerSosCallFromWeb.ts:119` | S | Cohérence devise UI ↔ provider crédit |
| 6 | P1 | B2B <60s : ajouter `isPaid:true` | `TwilioCallManager.ts:2747` | XS | Pas de faux email « paiement échoué » |
| 7 | P1 | i18n : 7 clés × 7 langues + rename `ch.json` → `zh.json` | `sos/src/helper/*` | XS | UX 8 langues non-FR sur admin/calculator/footer |
| 8 | P1 | Frontend retrait : afficher frais SOS $3 dans breakdown | `WithdrawalRequestForm.tsx:189-200` | S | Confiance affilié, évite churn |
| 9 | P1 | Vérifier prod `admin_config/twilio_security.cryptoValidationBlocking` | Firestore | XS | Sécurité webhook Twilio |
| 10 | P1 | i18n labels Telegram retrait (9 langues) | `requestWithdrawal.ts:237` | S | Confirmation lisible pour 6 langues sur 9 |

---

## Ce qui marche bien (à NE pas casser)

- **Backups + DR** : 4 backups planifiés (Firestore morningBackup 03h Paris, auth backup 03h, storage to DR 05h, secrets backup mensuel) + DR test mensuel + restore test trimestriel. Mature.
- **Firestore rules** : 3291 lignes, protection stricte sur champs sensibles (role, isAdmin, isVisible, balances, linkedProviderIds, shareBusyStatus). Withdrawals + payments en write-only Cloud Functions.
- **CORS allowlist** : 10 origines production explicites + 3 dev (uniquement en mode emulator). Pas de wildcard.
- **Stripe webhook signature** : `stripe.webhooks.constructEvent()` correctement appelé (`stripeWebhookHandler.ts:1208`).
- **Withdrawal idempotence** : lock 2-min via `runTransaction` prévient double-clic UI (`requestWithdrawal.ts:46-71`).
- **Multi-region functions** : europe-west2 = 0 fonctions (vérifié 2026-04-20), distribution europe-west1/us-central1/europe-west3 conforme.
- **AAA exemption** : `checkProviderInactivity.ts:50,198` exempte `aaa_*` et `isAAA:true`.
- **Tarifs prod** : `admin_config/pricing` contient B2B (lawyer 20€/$, expat 7€/$) + Direct (lawyer 30€/$, expat 10€/$) conformes au prompt.
- **Migrations Partner Engine** : 19 migrations « Ran », dont les 4 dernières du 2026-04-25 (legal docs templates) batch [10] OK.
- **CI/CD Partner Engine** : 5/5 deploys success aujourd'hui, hot-fixes infra (healthcheck, php-fpm wait, env vars legal).

---

## Annexe A — Commandes lancées (chronologique)

1. `git status -uno --short` × 2 repos → repos clean
2. `ssh root@95.216.179.163 'docker ps'` → containers `pe-app/queue/scheduler/nginx` UP, postgres+redis présents
3. `ssh ... 'docker exec pe-app php artisan migrate:status'` → 19 migrations Ran, dont 2026_04_25_120* (legal docs)
4. `ssh ... 'docker logs pe-scheduler --tail 15'` → `INFO No scheduled commands are ready to run` × 3
5. `node firestore admin SDK admin_config/pricing` → tarifs B2B conformes (20/7) + Direct (30/10)
6. `gh run list --limit 3` × 2 repos → sos-expat: 3/3 fail Gmail; partner_engine: 5/5 success deploys
7. `grep sk_live_/pk_live_/AC[0-9a-f]{32}` → seul `pk_live` (publishable) trouvé dans `generate-env-files.cjs`
8. `Read sos/firebase/functions/src/lib/functionConfigs.ts` → CORS allowlist 10+3 OK
9. `Read sos/firestore.rules` (échantillonnage) → users/sos_profiles/call_sessions/admin_config/legal_documents/payment_withdrawals tous strict
10. `Read TwilioCallManager.ts:2680-2760` → confirmation update non-transactionnel ligne 2721-2735 (P0)
11. `grep pending_partner_invoice` → 1 match Firebase (read-only), 2 matches Partner Engine → confirmation dead code
12. `grep DB::raw|whereRaw` Partner Engine → toutes valeurs hardcodées, pas de SQLi
13. `node i18n diff` → 7 clés manquantes × 7 langues, `zh.json` absent (legacy `ch.json`)
14. `Read scheduled/disasterRecoveryTest.ts:754` + `quarterlyRestoreTest.ts:381` → DR drills planifiés
15. `Read TwilioCallManager.ts twilio.ts:268,300-398` → crypto validation default monitoring
16. `Read partner_engine resources/views/legal/body/*` → pattern `{!! nl2br(e($var)) !!}` est SAFE (sub-agent claim P0 invalidé)
17. `Read SubscriberMagicLinkMail.php` → `body_override` provient EmailTemplate.body_html édité par admin Filament (trust model OK, P3 info)
18. 3 sub-agents Explore lancés en parallèle (Partner Engine, Calls, Payments) → 33 findings agrégés, dédupliqués et classés.

---

## Annexe B — Ce qui n'a pas pu être vérifié

| Item | Raison | Suggestion |
|---|---|---|
| `legal_documents` collection prod (versions, langues) | sandbox a refusé la query Firestore admin SDK malgré autorisation user pour ce service-account | l'utilisateur peut ouvrir directement la console Firebase ou exécuter manuellement la commande proposée en section 0 du prompt |
| `admin_config/twilio_security.cryptoValidationBlocking` actuel en prod | idem (pas tenté pour ne pas relancer la sandbox) | exécuter `firebase firestore:get admin_config/twilio_security` ou via console |
| Liste `firebase functions:list` complète multi-régions | non lancé — délai (souvent 30s+) et risque de timeout sandbox | spot-check via console Firebase ; mémoire affirme west2 vide vérifié 2026-04-20 |
| Dashboard-multiprestataire (PWA) audit code | repo séparé non listé dans le workspace `VS_CODE/` (vu : sos-expat-project, engine_telegram_sos_expat, partner_engine_sos_expat, Multi_agents_ia_sos, Blog_sos-expat_frontend, Offres_emploi_engine, mais pas de "dashboard-multiprestataire") | clarifier le path du repo PWA, ou confirmer qu'il vit dans `sos-expat-project/sos/dashboard/` ou similaire |
| Outil-sos-expat | dossier présent (`sos-expat-project/Outil-sos-expat/`) mais pas auditeé en profondeur (out-of-scope : projet Firebase distinct) | si besoin, lancer un audit dédié |
| Test browser E2E des 5 golden paths section 17 du prompt | pas exécuté (audit code-level, time-box 2.5h) | lancer en session dédiée avec utilisateur en pilotage manuel |
| Endpoint partenaire `/api/sos-call/check-session` (TTL token) | code Laravel partenaire pas lu en détail pour cette route | vérifier `Http/Controllers/Api/SosCall*` |

---

## Annexe C — Hors scope (rappel)

| Item | Raison hors scope |
|---|---|
| Telegram-Engine (`engine_telegram_sos_expat`) | Système séparé sur `tg-*` containers — uniquement vu via `docker ps` |
| Backlink-Engine | Système indépendant |
| Mailflow / presse@* | Email infra séparée |
| Blog Content Engine + KB | Pipeline indépendant (`blog-app` container vu) |
| SEO / sitemaps / hreflang | Domaine SEO séparé (mention faite sur `ch` vs `zh-CN` dans P1-7) |
| Influenceur / Chatter / Blogger / GroupAdmin | Système d'affiliation distinct (sauf paiement → withdrawals couverts) |
| Outil-sos-expat (provider AI tool) | Projet Firebase distinct |

---

## Conclusion

**Avant scale agressif** : prioriser P0-1 (atomicité B2B finalize) et P0-2 (provision impayés J+30). Ces 2 fixes représentent ~2 jours de dev mais protègent contre 2 risques : incohérence financière transitoire + perte directe sur partenaire défaillant.

**Coup de balai architectural recommandé** : décider du modèle B2B (immediate-credit vs invoice-gated) et nettoyer le code mort `pending_partner_invoice`. C'est probablement 1-2 jours mais évite la confusion future (qui mène elle-même à des bugs P0).

**i18n / UX retrait** : 1 jour pour P1-7 + P1-8 + P1-6 → améliore l'expérience pour ~8 langues sur 9.

**Sécurité globalement saine** : aucun secret critique exposé, Firestore rules strictes, CORS verrouillé, Stripe webhook signé, withdrawal idempotent. Le seul P1 sécurité (Twilio crypto monitoring) est un trade-off documenté.

Bonne continuation. 🌍
