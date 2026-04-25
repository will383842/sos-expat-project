# AUDIT COMPLET — SYSTÈME PARTENAIRES B2B SOS-EXPAT

**Date** : 2026-04-23
**Version** : 3 (recentrée exclusivement sur les partenaires + système de paiement détaillé)

**Objectif** : Savoir avec une **extrême précision** ce qui est implémenté pour le **système partenaires B2B UNIQUEMENT** (ni chatter, ni influencer, ni blogger, ni groupAdmin — ces systèmes sont des affiliés gamifiés distincts).

**Périmètre** :
- Backend Laravel Partner Engine (VPS Hetzner)
- Backend Firebase Functions `partner/` (cloud)
- Frontend Partner React (dashboard partenaire)
- Admin UI gestion partenaires
- **Système de paiement partenaires détaillé** (personnalisation par contrat, withdrawal, 2-phase lifecycle)
- Dashboard membre/subscriber (abonnés des partenaires)
- Hiérarchie siège → agences (dans le cadre partenaire B2B)

**Légende** :
- ✅ Fonctionnel et opérationnel
- ⚠️ Partiel
- ❌ Non implémenté
- 🔒 Désactivé par flag config

---

## SYNTHÈSE EXÉCUTIVE

| Élément | État | Détails |
|---------|------|---------|
| **Backend Laravel Partner Engine** | ✅ | VPS Hetzner, 40 routes, 7 tables, 138 tests |
| **Backend Firebase partner/** | ✅ | 24 callables, 2 triggers, 2 scheduled |
| **Dashboard partenaire (11 pages)** | ✅ | `/partner/*` tous opérationnels |
| **Admin UI partenaires (8 pages)** | ✅ | Toutes fonctionnelles (Fraud/Stats/Widgets complets) |
| **Système de paiement partenaire** | ✅ | Withdrawal Wise/PayPal/Stripe/Bank/Mobile Money, 2-phase lifecycle, personnalisable par contrat |
| **Personnalisation par partenaire** | ✅ | Commission lawyer/expat séparés, fixed/percent, hold 7j & release 24h configurables **par partenaire** |
| **Dashboard subscriber (membre)** | ❌ | Backend prêt, **aucune UI** frontend |
| **Hiérarchie siège → agences pour partenaires** | ❌ | Pas de modèle "partner mère → filiales" |
| **Facturation / VAT automatique** | ❌ | Champs présents (companyName, vatNumber) mais pas de système de facture |
| **Batch payout automatique partenaires** | ⚠️ | Manual (admin traite 1 par 1), infra prête pour batch |

---

# PARTIE 1 — ARCHITECTURE GLOBALE PARTENAIRES

## 1.1 Vue d'ensemble architecturale

```
┌─────────────────────────────────────────────────────────┐
│                    SOS-EXPAT SPA (React)                 │
│  ┌─────────────────┐           ┌─────────────────┐       │
│  │ /partner/*      │           │ /admin/partners/*│      │
│  │ (11 pages)      │           │ (8 pages)        │      │
│  └────────┬────────┘           └────────┬────────┘       │
│           │                             │                 │
└───────────┼─────────────────────────────┼─────────────────┘
            │                             │
            │ httpsCallable (Firebase)    │ httpsCallable
            │ + REST (Partner Engine)     │
            ▼                             ▼
┌─────────────────────────────┐  ┌──────────────────────────┐
│  Firebase Functions partner/│  │  Partner Engine Laravel  │
│  (us-central1 + europe-w3)  │  │  (VPS Hetzner 8082)      │
│  • 24 callables             │◄─┤  • 40 REST routes        │
│  • 2 triggers               │  │  • 14 controllers        │
│  • 2 scheduled              │  │  • 7 tables PostgreSQL   │
│  • Firestore write          │──►  • Redis queue           │
└─────────────────────────────┘  └──────────────────────────┘
            │                             │
            ▼                             ▼
┌─────────────────────────────┐  ┌──────────────────────────┐
│       Firestore             │  │     PostgreSQL 16        │
│  • partners/                │  │  • agreements            │
│  • partner_commissions/     │  │  • subscribers           │
│  • partner_notifications/   │  │  • subscriber_activities │
│  • partner_config/current   │  │  • csv_imports           │
│  • partner_applications/    │  │  • partner_monthly_stats │
│  • partner_subscribers/     │  │  • email_templates       │
│  • partner_affiliate_clicks/│  │  • audit_logs            │
│  • partner_promo_widgets/   │  │                          │
└─────────────────────────────┘  └──────────────────────────┘
```

## 1.2 Rôles et responsabilités de chaque système

| Système | Source de vérité pour | Pas responsable de |
|---------|----------------------|-------------------|
| **Partner Engine Laravel** | Agreements (contrats), subscribers, subscriber activities, CSV imports, audit logs, monthly stats aggregation | Commissions finales, balances partenaire, withdrawals, discounts clients |
| **Firebase Functions partner/** | Commissions finales, balances, notifications, withdrawals, affiliate clicks, discount computation, partner profile | Contrats, liste subscribers, historique agreements |
| **Firestore** | État temps réel (balances, commissions, notifs) | Données relationnelles complexes |
| **PostgreSQL** | Données relationnelles (contrats, subscribers, activités) | État temps réel |

## 1.3 Communication inter-systèmes

**Firebase → Partner Engine** (2 webhooks POST, header `X-Engine-Secret`) :
- `POST /api/webhooks/subscriber-registered` — quand un subscriber s'inscrit via invitation
- `POST /api/webhooks/call-completed` — quand un appel est complété et payé

**Partner Engine → Firestore** (via jobs Redis queue) :
- `SyncSubscriberToFirestore` → écrit `partner_subscribers/{inviteToken}`
- `SyncPartnerCommissionToFirestore` → écrit `partner_commissions/{id}` (backup)

**Secrets Firebase** :
- `PARTNER_ENGINE_URL_SECRET` (URL base)
- `PARTNER_ENGINE_API_KEY_SECRET` (clé shared `X-Engine-Secret`)

---

# PARTIE 2 — BACKEND LARAVEL PARTNER ENGINE

**Localisation** : `C:\Users\willi\Documents\Projets\VS_CODE\partner_engine_sos_expat\`
**VPS** : Hetzner `95.216.179.163:8082`, path `/opt/partner-engine/`
**URL** : `https://partner-engine.life-expat.com`
**Stack** : Laravel 12, PHP 8.2+, PostgreSQL 16, Redis 7, Docker Compose

## 2.1 Dépendances majeures

```json
"require": {
  "php": "^8.2",
  "kreait/laravel-firebase": "^6.2",
  "laravel/framework": "^12.0",
  "laravel/tinker": "^2.10.1",
  "maatwebsite/excel": "^3.1",
  "predis/predis": "^3.4"
}
```

## 2.2 Routes API — 40 routes vérifiées

### Webhooks (non authentifiés, secret partagé)
| # | Verbe | Route | Controller |
|---|-------|-------|-----------|
| 1 | GET | `/health` | HealthController@index |
| 2 | POST | `/webhooks/call-completed` | WebhookController@callCompleted |
| 3 | POST | `/webhooks/subscriber-registered` | WebhookController@subscriberRegistered |

### Partenaire (auth Firebase + rôle partner)
| # | Verbe | Route | Controller |
|---|-------|-------|-----------|
| 4 | GET | `/partner/dashboard` | DashboardController@index |
| 5 | GET | `/partner/agreement` | AgreementController@show |
| 6 | GET | `/partner/activity` | ActivityController@index |
| 7 | GET | `/partner/stats` | StatsController@index |
| 8 | GET | `/partner/earnings/breakdown` | DashboardController@earningsBreakdown |
| 9 | GET | `/partner/subscribers` | SubscriberController@index |
| 10 | POST | `/partner/subscribers` | SubscriberController@store |
| 11 | POST | `/partner/subscribers/import` | SubscriberController@import |
| 12 | GET | `/partner/subscribers/export` | SubscriberController@export |
| 13 | GET | `/partner/subscribers/{id}` | SubscriberController@show |
| 14 | PUT | `/partner/subscribers/{id}` | SubscriberController@update |
| 15 | DELETE | `/partner/subscribers/{id}` | SubscriberController@destroy |
| 16 | POST | `/partner/subscribers/{id}/resend-invitation` | SubscriberController@resendInvitation |

### Subscriber self-service (auth Firebase + rôle subscriber) — **2 endpoints SEULEMENT**
| # | Verbe | Route | Controller |
|---|-------|-------|-----------|
| 17 | GET | `/subscriber/me` | SubscriberSelfController@me |
| 18 | GET | `/subscriber/activity` | SubscriberSelfController@activity |

❗ **Ces 2 endpoints backend existent mais AUCUNE UI frontend ne les utilise**.

### Admin (auth Firebase + rôle admin) — 22 routes
Routes admin pour : partners list/detail/activity, stats, agreements CRUD + renew, subscribers admin (suspend/reactivate/bulk-delete/import), CSV imports history, email templates CRUD, audit log.

## 2.3 Schema PostgreSQL — 7 tables dédiées

### Table `agreements` (contrat commercial) — CLÉ POUR PERSONNALISATION

**Fichier** : `database/migrations/2026_03_16_000001_create_agreements_table.php`

| Champ | Type | Usage |
|-------|------|-------|
| `id` | bigint PK | ID |
| `partner_firebase_id` | string(128) | Lien vers Firestore partner |
| `partner_name` | string(255) | Nom partenaire |
| `name` | string(255) | Nom de l'accord |
| `status` | string(20) | `draft` / `active` / `paused` / `expired` (défaut: draft) |
| **REMISES CLIENTS** | | |
| `discount_type` | string(20) | `none` / `fixed` / `percent` (défaut: none) |
| `discount_value` | integer | Cents ou % selon type |
| `discount_max_cents` | integer nullable | Cap max pour % discount |
| `discount_label` | string nullable | Texte affiché au client |
| **COMMISSIONS (SOS → partenaire)** | | |
| `commission_per_call_lawyer` | integer | Cents (défaut: 500 = $5) |
| `commission_per_call_expat` | integer | Cents (défaut: 300 = $3) |
| `commission_type` | string(20) | `fixed` / `percent` (défaut: fixed) |
| `commission_percent` | decimal(5,2) nullable | 0-100% (si commission_type = percent) |
| **LIMITES** | | |
| `max_subscribers` | integer nullable | Limite nombre de subscribers |
| `max_calls_per_subscriber` | integer nullable | Limite appels/subscriber |
| **DURÉE** | | |
| `starts_at` | timestamp nullable | Date début |
| `expires_at` | timestamp nullable | Date fin |
| `notes` | text nullable | Notes libres |
| `created_at`, `updated_at`, `deleted_at` | — | Audit + soft delete |

**Capacités de personnalisation par partenaire** :
- ✅ Commission **fixe** différente lawyer/expat OU **pourcentage** du prix call
- ✅ Discount **fixe** ou **percentage avec cap max**
- ✅ Limites volumétriques (max subscribers, max calls)
- ✅ Durée contractuelle custom (starts_at, expires_at)
- ✅ Label discount traduit pour affichage client

### Table `subscribers` (abonnés du partenaire)

| Champ | Type | Usage |
|-------|------|-------|
| `id` | bigint PK | ID |
| `partner_firebase_id` | string(128) | Partenaire parent |
| `agreement_id` | FK → agreements | Contrat appliqué |
| `email` | string | Email du subscriber |
| `first_name, last_name, phone, country, language` | string | Profil |
| `firebase_uid` | string nullable | Lien Firebase Auth après registration |
| `invite_token` | string unique | Token invitation unique |
| `affiliate_code` | string nullable | Code affiliate dédié |
| `status` | string | `invited` → `registered` → `active` / `suspended` / `expired` |
| `total_calls` | integer | Compteur appels |
| `total_spent_cents` | integer | Total payé (après discount) |
| `total_discount_cents` | integer | Total remise appliquée |
| `tags` | jsonb | Tags libres |
| `custom_fields` | jsonb | Champs custom |
| + softDeletes + unique(partner_id, email) | | |

### Table `subscriber_activities` (logs activité subscribers)

| Champ | Type | Usage |
|-------|------|-------|
| `id` | bigint PK | |
| `subscriber_id` | FK cascade | Subscriber lié |
| `partner_firebase_id` | string | Partenaire |
| `type` | enum | `call_completed` / `registered` / `invitation_sent` / `discount_applied` |
| `call_session_id` | string unique partial PG | Call ID (idempotence) |
| `provider_type` | string | lawyer / expat |
| `call_duration_seconds` | integer | Durée appel |
| `amount_paid_cents` | integer | Montant payé par le subscriber |
| `discount_applied_cents` | integer | Remise appliquée |
| `commission_earned_cents` | integer | Commission du partenaire sur cet appel |
| `metadata` | jsonb | Métadonnées |

### Tables secondaires
- `csv_imports` — historique imports CSV (filename, total_rows, imported, duplicates, errors jsonb, status)
- `partner_monthly_stats` — agrégation mensuelle (revenue, commissions, discounts, conversion_rate)
- `email_templates` — templates email custom par partenaire (invitation/reminder/expiration)
- `audit_logs` — qui/quoi/quand avec IP

## 2.4 Services Laravel — 5 services

| Service | Méthodes publiques | Rôle |
|---------|-------------------|------|
| **FirebaseService** | Auth verification | Init Firebase Admin SDK |
| **AgreementService** | create, update, delete, renew | Gestion contrats + sync Firestore sur status change |
| **SubscriberService** | create, update, delete, suspend, reactivate, resendInvitation | CRUD subscribers + email invitation |
| **StatsService** | partnerDashboard, earningsBreakdown, partnerMonthlyStats, globalStats | Agrégation stats |
| **AuditService** | log | Enregistrement audit |

### Focus `AgreementService::renew()`

- Crée nouvel accord (copie)
- Change l'ancien → `status = expired`
- Migre subscribers actifs vers le nouvel accord
- Permet surcharges : `name`, `starts_at`, `expires_at`, `status`
- **Atomique** via transaction Laravel

### Focus `AgreementService::update()`

- Si `status` change → déclenche `SyncSubscriberToFirestore` pour tous les subscribers liés
- Si `status = expired` → marque aussi les subscribers liés comme `expired`

## 2.5 Jobs queue Redis — 4 jobs

| Job | Rôle |
|-----|------|
| **SendSubscriberInvitation** | Email invitation via mailable `SubscriberInvitation` (contient invite_token) |
| **SyncSubscriberToFirestore** | Sync subscriber → Firestore `partner_subscribers/{inviteToken}` |
| **SyncPartnerCommissionToFirestore** | Sync commission → Firestore `partner_commissions/{id}` (backup) |
| **ProcessCsvImport** | Parse CSV, valide, crée subscribers, log erreurs, stocke `error_details` |

**Queue config** : driver `redis`, client `predis`
**Worker** : `php artisan queue:work redis --queue=high,default --sleep=3 --tries=3 --max-time=3600`

## 2.6 Scheduled commands — 3 commands

| Command | Signature | Cron | Rôle |
|---------|-----------|------|------|
| **AggregateMonthlyStats** | `stats:aggregate` | `0 1 * * *` (1AM UTC daily) | Agréger stats mois précédent dans `partner_monthly_stats` |
| **ExpireAgreementsCommand** | `agreements:expire` | `0 2 * * *` (2AM UTC daily) | Marquer accords expirés, subscribers → `expired`, sync Firestore |
| **CheckFailedJobs** | `jobs:check-failed` | `*/5 * * * *` | Monitorer failed jobs, alerter Telegram |

## 2.7 Tests — 17 fichiers / 138 méthodes

- **Feature (8)** : AdminApi, AgreementCrud, AuthMiddleware, PartnerDashboard, PartnerSubscriberCrud, SubscriberSelfService, CallCompletedWebhook, SubscriberRegisteredWebhook
- **Unit (8)** : Commands (Aggregate, Expire), Jobs (ProcessCsv), Models (Agreement, Subscriber), Services (Agreement, Firebase, Subscriber)
- **TestCase.php** (base)

## 2.8 Infrastructure Docker — 6 containers

| Service | Image | Port exposé |
|---------|-------|-------------|
| pe-postgres | postgres:16-alpine | 127.0.0.1:5433 |
| pe-redis | redis:7-alpine | interne |
| pe-app | PHP-FPM custom | interne |
| pe-queue | custom (queue worker) | interne |
| pe-scheduler | custom (schedule:run 60s) | interne |
| pe-nginx | nginx:alpine | 127.0.0.1:8083 |

**Firebase credentials** : `./storage/app/firebase-credentials.json` monté read-only

## 2.9 CI/CD GitHub Actions — 2 workflows

- `deploy.yml` : push → main → SSH VPS Hetzner → rebuild Docker → restart → migrate → optimize cache
- `setup-vps.yml` : setup initial VPS (workflow_dispatch)

⚠️ Pas de linting ni tests automatisés dans le CI.

---

# PARTIE 3 — BACKEND FIREBASE FUNCTIONS `partner/`

**Localisation** : `sos/firebase/functions/src/partner/`
**Total** : 38 fichiers TypeScript

## 3.1 Régions de déploiement

| Type | Région | Fichier config |
|------|--------|----------------|
| **Callables partner (user)** | **us-central1** | `functionConfigs.ts:220` (`partnerConfig`) |
| **Callables admin partner** | **us-central1** | `functionConfigs.ts:233` (`partnerAdminConfig`) |
| **Triggers Firestore** | **europe-west3** | `onPartnerCreated.ts:21` |
| **Scheduled functions** | **europe-west3** | `releasePartnerPendingCommissions.ts:268`, `updatePartnerMonthlyStats.ts:228` |

## 3.2 Callables partenaires (11 exports)

| Callable | Auth | Rôle |
|----------|------|------|
| **createPartner** | Admin only | Crée Auth user + custom claims, génère affiliate code + provider code `PROV-{code}`, envoie email + notif 9 langues |
| **getPartnerDashboard** | Partner | Retourne profil + commissions récentes + clics + stats mensuelles + notifs |
| **updatePartnerProfile** | Partner | Modifie contact, website, config discount |
| **getPartnerCommissions** | Partner | Liste paginée avec filtres status/date |
| **getPartnerClicks** | Partner | Timeline clics affiliate avec conversion |
| **getPartnerWidgets** | Partner | Widgets promo disponibles (button/banner) |
| **getPartnerNotifications** | Partner | Notifs non-lues + récentes multilingue |
| **markPartnerNotificationRead** | Partner | Marquer notification lue |
| **partnerRequestWithdrawal** | Partner | Demande retrait (détail section 5) |
| **trackPartnerClick** | **Public** (no auth) | Tracking clic affiliate, rate limit 30/min par IP hash |
| **submitPartnerApplication** | **Public** (no auth) | Candidature partenaire publique |

## 3.3 Callables admin (13 exports)

- `adminPartnersList` — liste paginée + filtres
- `adminPartnerDetail` — profil + commissions + clicks breakdown
- `adminUpdatePartnerConfig` — modifier toggle partenaire (visibility, status, admin notes)
- **`adminUpdatePartnerCommissionConfig`** — ⭐ **personnaliser commission + hold + release + discount par partenaire** (détail section 5)
- `adminTogglePartnerVisibility` — toggle visibilité dans listing
- `adminTogglePartnerStatus` — active/suspended/banned
- `adminIssueManualCommission` — créer commission manuelle (ajustement/compensation)
- `adminGetPartnerStats` — stats (clicks, conversions, retention)
- `adminManagePartnerWidgets` — CRUD widgets promo
- `adminPartnerApplicationsList` — candidatures en attente
- `adminUpdatePartnerApplication` — update application status
- `adminConvertApplicationToPartner` — convertir candidature en Partner
- `adminDeletePartner` — soft delete

## 3.4 Triggers — 4 fichiers

| Fichier | Type | Path/Event | Région |
|---------|------|-----------|--------|
| onPartnerCreated.ts | Firestore `onDocumentCreated` | `partners/{partnerId}` | europe-west3 |
| onCallCompleted.ts | Handler (appelé depuis consolidated trigger) | `call_sessions/{sessionId}` onUpdate (isPaid: false→true) | europe-west3 |
| forwardToPartnerEngine.ts | 2 helpers : `handlePartnerSubscriberRegistered`, `forwardCallToPartnerEngine` | webhooks HTTP POST | — |
| index.ts | Barrel exports | — | — |

### Handler `onCallCompleted` — logique en 10 étapes

1. Vérifie système partner actif (`partner_config/current.isSystemActive`)
2. Détecte client référé par partenaire (3 méthodes fallback) :
   - `user.partnerReferredById` (direct)
   - `user.partnerReferredBy` code → lookup
   - `partner_affiliate_clicks.convertedUserId` (click conversion, fenêtre 30 jours)
3. Bloque self-referral
4. Valide partner `status === 'active'`
5. Min call duration check (anti-fraude)
6. Détecte duplicates (sourceId + partnerId + type)
7. Calcule commission via `calculateCommissionAmount(partner, providerType, callPrice)`
8. Crée commission atomique (status `pending`, `pendingBalance +=`, `totalEarned +=`)
9. Crée notification multilingue 9 langues
10. **Forward NON-BLOQUANT vers Partner Engine** (try-catch, si échec la commission reste créée)

## 3.5 Scheduled functions — 2 fichiers

| Fonction | Cron | Timeout | Mémoire |
|----------|------|---------|---------|
| **releasePartnerPendingCommissions** | `15 * * * *` (hourly à :15 UTC) | 300s | 256MiB |
| **updatePartnerMonthlyStats** | `0 2 * * *` (daily 2AM UTC) | 540s | 256MiB |

(Détail logique dans section 5.5)

## 3.6 Services — 3 services

| Service | Fonctions publiques |
|---------|---------------------|
| **partnerCommissionService** | createPartnerCommission (atomic + balance), updateCommissionStatus, calculateCommissionAmount, isDuplicateCommission |
| **partnerConfigService** | getPartnerConfig (cache 5min), clearPartnerConfigCache |
| **partnerDiscountService** | getPartnerDiscount (fixed/percentage/cap/expiry), getPartnerDiscountInfo (public) |

## 3.7 Types (`types.ts`, 419 lignes)

**Enums (5)** :
- `SupportedPartnerLanguage` — 9 langues (fr, en, es, de, pt, ar, zh, ru, hi)
- `PartnerCategory` — 11 catégories (expatriation, travel, legal, finance, insurance, relocation, education, media, association, corporate, other)
- `PartnerTrafficTier` — 6 tiers (lt10k, 10k-50k, 50k-100k, 100k-500k, 500k-1m, gt1m)
- `PartnerCommissionStatus` — pending / validated / available / paid / cancelled
- `PartnerNotificationType` — 7 types (system_announcement, commission_earned, commission_available, withdrawal_approved, withdrawal_completed, withdrawal_rejected, withdrawal_failed)

**Interfaces (10)** : Partner, PartnerApplication, PartnerCommissionConfig, PartnerDiscountConfig, PartnerCommission, PartnerNotification, PartnerAffiliateClick, PartnerConfig, PartnerPromoWidget, GetPartnerDashboardResponse

**Input types (2)** : CreatePartnerInput, SubmitPartnerApplicationInput

---

# PARTIE 4 — FRONTEND PARTENAIRE

## 4.1 Pages partenaires protégées — 11 pages opérationnelles

Routes `/partner/*` dans `App.tsx:623-633`, rôle requis `partner` :

| Fichier | Route | Fonctionnalités |
|---------|-------|-----------------|
| **PartnerDashboard.tsx** | `/partner/tableau-de-bord` | KPI cards, balance card, earnings chart (Recharts), recent commissions, notifs, copy affiliate link |
| **PartnerEarnings.tsx** | `/partner/gains` | Tableau commissions paginé, filtres statut/date, export CSV BOM UTF-8 |
| **PartnerClicks.tsx** | `/partner/statistiques` | Graphique clics 30j/6m/12m, conversion clics→appels |
| **PartnerSubscribers.tsx** | `/partner/abonnes` | Tableau subscribers (5 statuts), search, filtres, import/export CSV, ajout manuel, resend invitation |
| **PartnerAgreement.tsx** | `/partner/accord` | Vue accord commercial (dates, statut, commission config, discount config) |
| **PartnerWidgets.tsx** | `/partner/widgets` | Gallery widgets (button/banner), preview, copy HTML/embed code |
| **PartnerResources.tsx** | `/partner/ressources` | Composant `AffiliateResources` (shared) |
| **PartnerProfile.tsx** | `/partner/profil` | Upload photo Firebase Storage (max 5MB), édition contact, reset password |
| **PartnerPayments.tsx** | `/partner/paiements` | Retraits, méthodes paiement, formulaire retrait, historique, fee affichée |
| **PartnerSuspended.tsx** | `/partner/suspendu` | Page blocage + raison + contact |
| **PartnerTelegramOnboarding.tsx** | `/partner/telegram` | Link Telegram bot (obligatoire pour withdrawal) |

## 4.2 Pages partenaires publiques — 2 pages

| Fichier | Route | État |
|---------|-------|------|
| **PartnerLanding.tsx** | `/devenir-partenaire` | ✅ Public (landing B2B premium, 7 sections, FAQ) |
| **PartnersPage.tsx** | `/partenaires` | 🔒 Caché si `partner_config/current.isPartnerListingPageVisible === false` |

## 4.3 Layout Partner (`src/components/Partner/Layout/PartnerDashboardLayout.tsx`)

- Sidebar responsive mobile
- Gradient theme blue-600 → indigo-700
- **9 items de menu** : Dashboard, Earnings, Subscribers, Agreement, Statistics, Widgets, Resources, Profile, Payments
- Redirect auto si `partner.status in ["suspended", "banned"]` → `/partner/suspendu`
- Copy affiliate link + toast
- Badge notifications (lazy-loaded)

## 4.4 Composants Partner (`src/components/Partner/Cards/` + `Layout/`)

- PartnerBalanceCard (solde actuel + retrait possible)
- PartnerStatsCard (KPI générique)
- PartnerEarningsChart (Recharts line/bar)
- PartnerClicksChart (Recharts area)
- PartnerRecentCommissions (table)

## 4.5 Hook `usePartner` — 502 lignes

**Retourne** :
```typescript
{
  dashboardData: PartnerDashboardData,
  partner: Partner,
  commissions: PartnerCommission[],
  notifications: PartnerNotification[],
  isLoading, error, isPartner,
  // Actions
  refreshDashboard(),
  requestWithdrawal(input),
  updateProfile(input),
  markNotificationRead(notificationId),
  markAllNotificationsRead(),
  // Computed
  affiliateLink, unreadNotificationsCount, canWithdraw, totalBalance
}
```

**Souscriptions Firestore real-time** :
- `partner_commissions` (50 derniers)
- `partner_notifications` (20 derniers)

## 4.6 Service `partnerEngineApi.ts` — 528 lignes, 45+ fonctions

**Base URL** : `https://partner-engine.life-expat.com` (configurable `VITE_PARTNER_ENGINE_URL`)

**Endpoints Partner (13)** :
- getPartnerDashboard, getPartnerSubscribers, getPartnerSubscriber
- createPartnerSubscriber, updatePartnerSubscriber, deletePartnerSubscriber
- resendSubscriberInvitation, importSubscribersCsv, exportSubscribersCsv
- getPartnerAgreement, getPartnerActivity, getPartnerStats, getPartnerEarningsBreakdown

**Endpoints Subscriber (2)** : getSubscriberMe, getSubscriberActivity → ⚠️ **Définis dans l'API mais AUCUNE UI ne les utilise**

**Endpoints Admin (20+)** : adminGetPartners, adminCreateAgreement, adminUpdateAgreement, adminRenewAgreement, adminSuspendSubscriber, adminImportSubscribers, adminGetEmailTemplates, etc.

## 4.7 Admin UI Partners — 8 pages fonctionnelles

Routes `AdminRoutesV2.tsx:1686-1694` :

| Route | Composant | Lignes | Rôle |
|-------|-----------|--------|------|
| `/admin/partners` | AdminPartnersList | — | Tableau 8 colonnes, search, filter, batch ops, export |
| `/admin/partners/create` | AdminPartnerCreate | — | **Formulaire 7 sections** (détail section 5.7) |
| `/admin/partners/:partnerId` | AdminPartnerDetail | — | **5 onglets** (Overview / Commissions / Clicks / Withdrawals / Settings) |
| `/admin/partners/config` | AdminPartnersConfig | — | Toggles système (`partner_config/current`) |
| `/admin/partners/widgets` | AdminPartnersWidgets | **437** | CRUD widgets, types button/banner, 7 dimensions, UTM tracking |
| `/admin/partners/stats` | AdminPartnersStats | **289** | 4 stat cards, AreaChart mensuel, top performers |
| `/admin/partners/applications` | AdminPartnerApplications | — | Status badges, expandable rows, inline notes, accept/reject |
| `/admin/partners/fraud` | AdminPartnersFraud | **352** | Détection fraude : high_ratio, circular_referral, multiple_accounts, suspicious_pattern. Severity low→critical. Actions dismiss/take_action/block |

---

# PARTIE 5 — SYSTÈME DE PAIEMENT PARTENAIRES ⭐

Cette section détaille EXACTEMENT comment fonctionne le système de paiement, incluant **la personnalisation par partenaire pour les gros contrats**.

## 5.1 Double flux de paiement

```
┌────────────────────────────────────────────────────────┐
│  FLUX 1 : CLIENTS DU PARTENAIRE → SOS-EXPAT            │
│  (les clients paient leurs appels, avec réduction)     │
│                                                          │
│  Client clique affiliate_code du partenaire              │
│     ▼                                                    │
│  user.partnerReferredById stocké                         │
│     ▼                                                    │
│  Lors du paiement call :                                 │
│   → partnerDiscountService.getPartnerDiscount()          │
│   → Applique remise (fixed ou % avec cap)               │
│     ▼                                                    │
│  Client paie : originalPrice - discountAmount            │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│  FLUX 2 : SOS-EXPAT → PARTENAIRE                        │
│  (commissions versées au partenaire)                     │
│                                                          │
│  Call completed + isPaid=true                            │
│     ▼                                                    │
│  Trigger onCallCompleted (europe-west3)                  │
│   → calculateCommissionAmount(partner, providerType)     │
│   → createPartnerCommission() [status=pending]           │
│   → partner.pendingBalance += amount                     │
│   → partner.totalEarned += amount                        │
│     ▼                                                    │
│  [Scheduled hourly releasePartnerPendingCommissions]     │
│   Phase 1 : après holdPeriodDays (7j par défaut)        │
│     pending → validated                                  │
│     pendingBalance → validatedBalance                    │
│   Phase 2 : après releaseDelayHours (24h par défaut)    │
│     validated → available                                │
│     validatedBalance → availableBalance                  │
│     ▼                                                    │
│  Partenaire : partnerRequestWithdrawal (callable)        │
│   → Valide Telegram, min amount, balance                 │
│   → Déduit availableBalance - amount - fee               │
│   → PaymentService.createWithdrawalRequest()             │
│     ▼                                                    │
│  Admin approuve → processWithdrawal → Wise/Flutterwave   │
│   → Transfert international                              │
│   → Status : processing → sent → completed              │
└────────────────────────────────────────────────────────┘
```

## 5.2 FLUX 1 — Discount clients du partenaire

### Calcul du discount (`partnerDiscountService.ts`)

```typescript
async function getPartnerDiscount(clientUid, originalPrice): Promise<DiscountResult>
```

**Logique** :
1. Charge `user.partnerReferredById`
2. Charge `partners/{partnerId}.discountConfig`
3. Valide :
   - `discountConfig.isActive === true`
   - Partner `status === 'active'`
   - Si `expiresAt` → `now < expiresAt`
4. Calcul :
   - **Fixed** : `discount_value` cents → `/100` pour dollars
   - **Percentage** : `(originalPrice * value) / 100`
     - Si `maxDiscountCents` → `Math.min(discountAmount, maxDiscountCents / 100)`
   - Arrondi 2 décimales
   - Plafond : `Math.min(discountAmount, originalPrice)`

**Retour** :
```typescript
{
  hasDiscount: boolean,
  discountAmount: number,        // en dollars/euros
  originalPrice: number,
  finalPrice: number,            // originalPrice - discountAmount
  label: string | null,          // "Remise Expatica 10%"
  partnerId: string | null,
  partnerCode: string | null,
}
```

### Structure `PartnerDiscountConfig`

```typescript
{
  isActive: boolean;
  type: 'fixed' | 'percentage';
  value: number;                 // cents si fixed, pourcentage 0-100 si percentage
  maxDiscountCents?: number;     // cap pour percentage (ex: max $10 même si 20% donnerait $15)
  label: string;                 // "Remise partenaire X"
  labelTranslations?: Record<string, string>;  // 9 langues
  expiresAt?: Timestamp;         // null = permanent
}
```

## 5.3 FLUX 2 — Commission partenaire

### Structure `PartnerCommissionConfig` (dans chaque Partner doc)

```typescript
{
  commissionPerCallLawyer: number;      // cents USD (défaut: 500 = $5)
  commissionPerCallExpat: number;       // cents USD (défaut: 300 = $3)
  usePercentage: boolean;
  commissionPercentage?: number;        // 0-100%
  holdPeriodDays: number;               // défaut: 7 jours
  releaseDelayHours: number;            // défaut: 24h
  minimumCallDuration: number;          // défaut: 60s (anti-fraude)
}
```

### Calcul commission (`partnerCommissionService.ts`)

```typescript
function calculateCommissionAmount(partner, providerType, callPrice?) {
  if (partner.commissionConfig.usePercentage 
      && partner.commissionConfig.commissionPercentage 
      && callPrice) {
    return Math.round(callPrice * commissionPercentage / 100);  // cents
  }
  
  return providerType === 'lawyer'
    ? partner.commissionConfig.commissionPerCallLawyer
    : partner.commissionConfig.commissionPerCallExpat;
}
```

**Exemple concret** :
- Gros partenaire : usePercentage=true, commissionPercentage=30 → 30% du prix call
- Partenaire standard : commissionPerCallLawyer=500, commissionPerCallExpat=300

### Création commission (`createPartnerCommission`)

**Atomique** (transaction Firestore) :
1. Crée doc `partner_commissions/{id}` avec :
   - `status: 'pending'`
   - `createdAt: now`
   - `amount`, `partnerId`, `sourceId` (call session), `type`, etc.
2. Incrémente `partners/{partnerId}` :
   - `pendingBalance += amount`
   - `totalEarned += amount`
   - `totalCommissions += 1`
   - `currentMonthStats.earnings += amount`
   - `currentMonthStats.calls += 1` (si client_referral)

**Idempotence** : dédup via `sourceId + type` (pas de double commission)

## 5.4 Structure balances du partenaire

**Dans `partners/{partnerId}` Firestore** :

```typescript
{
  // Balances (tous cents USD)
  totalEarned: number;         // total gagné depuis le début
  availableBalance: number;    // prêt à retirer
  pendingBalance: number;      // en attente validation (status pending)
  validatedBalance: number;    // validé, en attente release (status validated)
  totalWithdrawn: number;      // total déjà retiré
  
  // Méthode de paiement
  preferredPaymentMethod: 'wise' | 'bank_transfer' | 'mobile_money' | 'paypal' | 'stripe' | null;
  paymentMethodId?: string;
  pendingWithdrawalId: string | null;  // verrouille un retrait en cours
  
  // Config custom (clé pour gros contrats)
  commissionConfig: PartnerCommissionConfig;
  discountConfig?: PartnerDiscountConfig;
  
  // ... autres champs profil
}
```

## 5.5 Commission lifecycle — 2-phase release

**Fichier** : `scheduled/releasePartnerPendingCommissions.ts`
**Cron** : `15 * * * *` (chaque heure à :15 UTC)

### Phase 1 : `pending` → `validated`

```typescript
async function validatePendingCommissions() {
  // Pour chaque commission status="pending" :
  // 1. Charge holdPeriodDays du partner (override) ou default global
  let holdPeriodDays = config.defaultHoldPeriodDays;  // 7 jours défaut global
  if (partner.commissionConfig?.holdPeriodDays != null) {
    holdPeriodDays = partner.commissionConfig.holdPeriodDays;  // OVERRIDE PER-PARTNER
  }
  
  // 2. Si now > createdAt + holdPeriodDays :
  //    Transaction atomique :
  //      commission.status = 'validated'
  //      commission.validatedAt = now
  //      partner.pendingBalance -= amount
  //      partner.validatedBalance += amount
}
```

### Phase 2 : `validated` → `available`

```typescript
async function releaseValidatedCommissions() {
  // Pour chaque commission status="validated" :
  // 1. Charge releaseDelayHours du partner (override) ou default global
  let releaseDelayHours = config.defaultReleaseDelayHours;  // 24h défaut global
  if (partner.commissionConfig?.releaseDelayHours != null) {
    releaseDelayHours = partner.commissionConfig.releaseDelayHours;  // OVERRIDE
  }
  
  // 2. Si now > validatedAt + releaseDelayHours :
  //    Transaction atomique :
  //      commission.status = 'available'
  //      commission.availableAt = now
  //      partner.validatedBalance -= amount
  //      partner.availableBalance += amount
  //    Crée notification multilingue (commission_available)
}
```

**Limits** : max 200 commissions par run (batch)

### États complets

```
pending (création)
  │
  │ [holdPeriodDays = 7j par défaut, override per-partner]
  ▼
validated (validatedAt)
  │
  │ [releaseDelayHours = 24h par défaut, override per-partner]
  ▼
available (availableAt) ← prêt pour withdrawal
  │
  │ [user demande retrait]
  ▼
pendingWithdrawalId set (lock)
  │
  │ [admin approval + process]
  ▼
processing → sent → completed / paid

États alternatifs :
  [n'importe quel état] → cancelled (admin annule)
```

## 5.6 Withdrawal — Retrait des commissions

### Callable `partnerRequestWithdrawal`

**Conditions préalables** :
1. ✅ Partenaire authentifié
2. ✅ **Compte Telegram connecté** (OBLIGATOIRE)
3. ✅ `config.withdrawalsEnabled === true`
4. ✅ Montant ≥ `minimumWithdrawalAmount` (défaut : 3000¢ = $30)
5. ✅ Pas de retrait déjà en attente (`pendingWithdrawalId === null`)
6. ✅ Balance suffisante (amount + fee)

**Input** :
```typescript
{
  amount: number;         // cents
  paymentMethodId: string;
}
```

**Flux atomique** :

1. Charge config partenaire
2. Récupère fee fixe via `getWithdrawalFee()` (défaut : $3 = 300¢)
3. Valide minimum et balance
4. **Transaction atomique** :
   - Claim slot exclusif : `pendingWithdrawalId = pending_lock_{timestamp}`
   - Déduit : `availableBalance -= (amount + fee)`
   - Incrémente : `totalWithdrawn += amount`
5. Appelle `PaymentService.createWithdrawalRequest()`
6. **Confirmation Telegram** (double vérification) :
   - Envoie message Telegram au partenaire
   - Si échec → annule retrait, restaure balance (rollback complet)
7. Retour : `{ success: true, withdrawalId, telegramConfirmationRequired: true }`

### PaymentService centralisé

**Fichier** : `sos/firebase/functions/src/payment/services/paymentService.ts`

**Modes de paiement supportés** :
- **Wise** (virements bancaires internationaux) — IBAN, Account Number, Routing, Sort Code, SWIFT/BIC
- **Bank transfer** (via Wise)
- **Mobile Money** via Flutterwave — Orange Money, Wave, MTN Momo, Moov, Airtel, M-Pesa (cryptage numéros)
- **PayPal** — payouts
- **Stripe** — Connect payouts

### Structure `WithdrawalRequest`

```typescript
{
  id: string;
  userId: string;
  userType: 'partner' | 'chatter' | 'influencer' | ...;
  userEmail, userName: string;
  
  amount: number;             // cents
  withdrawalFee: number;      // cents ($3 par défaut)
  totalDebited: number;       // amount + withdrawalFee
  
  sourceCurrency: 'USD';      // TOUJOURS USD
  targetCurrency: string;     // EUR, XOF, GHS, KES, etc.
  exchangeRate?: number;
  convertedAmount?: number;
  fees?: number;
  netAmount?: number;
  
  paymentMethodId: string;
  provider: 'wise' | 'flutterwave' | 'manual';
  methodType: 'bank_transfer' | 'mobile_money' | 'wise';
  paymentDetails: BankTransferDetails | MobileMoneyDetails;
  
  status: WithdrawalStatus;   // pending → validating → approved → queued → processing → sent → completed
  statusHistory: StatusHistoryEntry[];
  isAutomatic: boolean;
  retryCount: number;
  maxRetries: number;
  
  // Timestamps
  requestedAt, approvedAt, processedAt, sentAt, completedAt, rejectedAt, failedAt;
  
  // Audit
  processedBy, approvedBy, approvalNote;
  errorCode, errorMessage;
  
  // Provider tracking
  providerTransactionId, providerStatus, providerResponse;
}
```

### Workflow complet withdrawal

```
pending (créé par partner)
  ▼
validating (admin review)
  ▼
approved (admin.approveWithdrawal(id, note?))
  ▼
queued
  ▼
processing (admin.processWithdrawal → PaymentRouter → Wise/Flutterwave API)
  ▼
sent (provider confirme envoi)
  ▼
completed (provider confirme arrivée)

Branches terminales :
  → rejected (admin refuse)
  → failed (provider erreur)
```

**Admin approval** : `adminApproveWithdrawal(withdrawalId, adminId, approvalNote?)`
**Admin process** : `adminProcessWithdrawal(withdrawalId, adminId?, approvalNote?)` — utilise PaymentRouter
**Completion** : `completeWithdrawal(withdrawalId, providerData?)` — appelée quand provider confirme

### Fee calculation (`feeCalculationService.ts`)

Config admin-editable :
```typescript
feeConfig.fixedFee  // ex: 3.00 dollars
// Conversion : dollars → cents = fixedFee * 100 = 300
```

La fee est :
- Débitée du balance du partenaire (atomiquement au moment de la demande)
- Stockée dans `withdrawal.withdrawalFee`
- Incluse dans `withdrawal.totalDebited`

## 5.7 Personnalisation par partenaire (gros contrats)

**C'est LA clé pour les gros partenariats.** Chaque partenaire peut avoir une config commission/discount complètement différente, modifiable à tout moment par l'admin.

### Callable `adminUpdatePartnerCommissionConfig`

**Input** :
```typescript
{
  partnerId: string;                    // obligatoire
  // Commission
  commissionPerCallLawyer?: number;
  commissionPerCallExpat?: number;
  usePercentage?: boolean;
  commissionPercentage?: number;        // si usePercentage=true
  // Lifecycle
  holdPeriodDays?: number;              // OVERRIDE per-partner
  releaseDelayHours?: number;           // OVERRIDE per-partner
  minimumCallDuration?: number;         // anti-fraude
  // Discount pour leurs clients
  discountConfig?: Partial<PartnerDiscountConfig>;
}
```

**Validation** :
- Valeurs numériques ≥ 0
- Si `usePercentage` → `commissionPercentage` in [0, 100]
- Si `discountConfig.type === 'percentage'` → `value` in [0, 100]

### Priorité de configuration (4 niveaux)

Pour chaque paramètre (holdPeriodDays, releaseDelayHours, minimumCallDuration, commissionPerCallLawyer/Expat, etc.) :

```
1. partner.commissionConfig.{field}       ← PARTNER-SPECIFIC (priorité max)
2. partner_config/current.default{Field}  ← GLOBAL DEFAULT (fallback)
3. PARTNER_CONSTANTS.DEFAULT_{FIELD}      ← HARDCODED (ultime fallback)
```

**Exemple gros contrat** :
- Partner "Expatica" (gros média)
  - `usePercentage: true, commissionPercentage: 30` → 30% du prix de chaque call
  - `holdPeriodDays: 3` (au lieu de 7) → validation plus rapide
  - `releaseDelayHours: 2` (au lieu de 24) → disponibilité quasi immédiate
  - `discountConfig: { type: 'percentage', value: 15, maxDiscountCents: 1000 }` → 15% de réduction pour ses lecteurs, max $10
- Partner standard
  - `commissionPerCallLawyer: 500, commissionPerCallExpat: 300`
  - `holdPeriodDays: 7, releaseDelayHours: 24` (defaults)
  - `discountConfig: { type: 'fixed', value: 500 }` → $5 de réduction fixe

### Admin UI : AdminPartnerCreate.tsx

**7 sections du formulaire de création partenaire** :

| Section | Champs |
|---------|--------|
| **Email** | email, sendCredentials (bool) |
| **Contact** | firstName, lastName, phone, country, language |
| **Website** | websiteUrl, websiteName, websiteDescription, websiteCategory, websiteTraffic (6 tiers) |
| **Affiliate Code** | affiliateCode (regex `[A-Z0-9]{3,20}`) |
| **Commissions** ⭐ | usePercentage, commissionPerCallLawyer, commissionPerCallExpat, commissionPercentage, holdPeriodDays, releaseDelayHours |
| **Discount** ⭐ | discountEnabled, discountType (fixed/percentage), discountValue, discountMaxCents, discountLabel |
| **Contract** | contractStartDate, contractEndDate, contractNotes |
| **Commercial** | contactName, contactEmail, companyName, vatNumber |

**Defaults appliqués** :
```typescript
commissionPerCallLawyer: 500,    // $5
commissionPerCallExpat: 300,     // $3
holdPeriodDays: 7,
releaseDelayHours: 24,
discountType: 'fixed',
discountValue: 500,              // $5 cents
```

### Admin UI : AdminPartnerDetail.tsx

**5 onglets** :

1. **Overview** — stats, statut, infos de base
2. **Commissions** ⭐ — **modifier config commission/discount à tout moment**, issue manual commission
3. **Clicks** — stats des clics affiliés
4. **Withdrawals** — historique des retraits
5. **Settings** — textes/descriptions, toggle visibilité

**Onglet Commissions** : appelle `adminUpdatePartnerCommissionConfig` pour modifier :
- commissionPerCallLawyer, commissionPerCallExpat
- usePercentage, commissionPercentage
- holdPeriodDays, releaseDelayHours, minimumCallDuration
- discountConfig (isActive, type, value, maxDiscountCents, label, labelTranslations, expiresAt)

## 5.8 Partner Config global (`partner_config/current`)

**Document Firestore** `partner_config/current` — défaults globaux système :

```typescript
{
  id: "current",
  isSystemActive: true,
  withdrawalsEnabled: true,
  minimumWithdrawalAmount: 3000,               // $30
  defaultCommissionPerCallLawyer: 500,         // $5
  defaultCommissionPerCallExpat: 300,          // $3
  defaultHoldPeriodDays: 7,
  defaultReleaseDelayHours: 24,
  defaultMinimumCallDuration: 60,              // 60s
  attributionWindowDays: 30,                   // fenêtre click→conversion
  isPartnerListingPageVisible: false,          // 🔒 /partenaires caché par défaut
  isPartnerFooterLinkVisible: false,           // 🔒 lien footer caché
  createdAt, updatedAt
}
```

**Cache** : 5 minutes TTL via `partnerConfigService.getPartnerConfig()`

## 5.9 Constantes `PARTNER_CONSTANTS` (types.ts)

```typescript
{
  MIN_WITHDRAWAL_AMOUNT: 3000,           // $30 minimum retrait
  SOS_WITHDRAWAL_FEE_CENTS: 300,         // $3 fee SOS
  DEFAULT_HOLD_PERIOD_DAYS: 7,           // 7 jours avant validation
  DEFAULT_RELEASE_DELAY_HOURS: 24,       // 24h avant disponibilité
  DEFAULT_MIN_CALL_DURATION: 60,         // 60s anti-fraude
  DEFAULT_COMMISSION_LAWYER: 500,        // $5 par call lawyer
  DEFAULT_COMMISSION_EXPAT: 300,         // $3 par call expat
  ATTRIBUTION_WINDOW_DAYS: 30,           // 30j fenêtre attribution
  AFFILIATE_CODE_REGEX: /^[A-Z0-9]{3,20}$/,
  AFFILIATE_BASE_URL: "https://sos-expat.com",
}
```

## 5.10 Multi-currency

**Commissions** : **TOUJOURS en cents USD** (unique source de vérité)

**Withdrawals** : support multi-devises à la conversion
- `sourceCurrency: 'USD'` (toujours)
- `targetCurrency: string` (EUR, XOF, GHS, KES, etc.)
- `exchangeRate` appliqué au moment du payout
- `convertedAmount` en devise cible
- Fees provider en cents USD

**Exemple** : commission 1000¢ USD → partenaire Sénégal demande retrait → `targetCurrency='XOF'`, `exchangeRate=655`, `convertedAmount=6550 XOF`

## 5.11 Stats financières (breakdown)

### Service Laravel `StatsService.php`

**`partnerDashboard(partnerFirebaseId)`** :
```
{
  total_subscribers: count,
  active_subscribers: count (status=active),
  new_this_month: count (created since month start),
  calls_this_month: count (activities type=call_completed),
  revenue_this_month_cents: sum(commission_earned_cents),
  conversion_rate: (active/total) * 100,
}
```

**`earningsBreakdown(partnerFirebaseId)`** :
```
{
  subscribers: {
    total_cents: somme toutes commissions call_completed,
    this_month_cents: somme depuis début mois,
    by_agreement: [
      {
        agreement_id,
        agreement_name,
        total_cents,
        call_count,
      }
    ],
  }
}
```

**Join SQL** : `subscriber_activities → subscribers → agreements GROUP BY agreement.id`

**`partnerMonthlyStats(partnerFirebaseId, months=12)`** :
Retourne 12 derniers mois de `partner_monthly_stats` (agrégations précalculées par `AggregateMonthlyStats` command nocturne).

## 5.12 Batch payout

**Actuellement** : **MANUEL pour partners** (audit strict)
- Admin approuve chaque withdrawal individuellement (`adminApproveWithdrawal`)
- Admin déclenche paiement (`adminProcessWithdrawal`) → appelle Wise/Flutterwave
- Confirmation provider → `completeWithdrawal`

**Infrastructure prête pour batch** :
- `getPendingWithdrawals()` callable admin (dashboard)
- Admin peut sélectionner plusieurs → batch approve/process manuellement

**Pas de scheduled batch automatique** (voulu pour partners, contrairement aux affiliés).

## 5.13 Taxes et facturation

**Champs présents dans Partner** :
```typescript
{
  companyName?: string;
  vatNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
  companyAddress?: string;
}
```

**❌ Non implémenté** :
- Calcul VAT automatique selon country/vatNumber
- Génération PDF invoice
- Accounting trail automatique

**Audit trail** : `audit_logs` (Laravel) + `partner_monthly_stats` → peuvent servir de source pour factures manuelles.

---

# PARTIE 6 — DASHBOARD SUBSCRIBER (MEMBRE) ❌

**Les subscribers sont les clients finaux des partenaires** — invités par le partenaire via email, ils s'inscrivent et bénéficient du discount sur leurs appels.

## 6.1 Backend — Prêt

- ✅ `SubscriberSelfController.php` (Laravel)
- ✅ 2 endpoints : `GET /subscriber/me`, `GET /subscriber/activity`
- ✅ Middleware `RequireSubscriber` (vérifie `role === 'subscriber'` + lien subscriber)
- ✅ Client frontend : `getSubscriberMe()`, `getSubscriberActivity()` dans `partnerEngineApi.ts`

## 6.2 Frontend — AUCUNE UI

**Recherches exhaustives** :
- ❌ `src/pages/Subscriber/` — dossier n'existe pas
- ❌ `src/pages/Membre/`, `src/pages/Member/`, `src/pages/Abonne/` — aucun n'existe
- ❌ Grep `App.tsx` `/subscriber|/member|/membre|/abonne|/abonné` → **0 match**
- ❌ Aucune constante `SubscriberDashboard`, `MemberPage`

**Fichiers avec "Subscriber" pour info** :
- `/partner/PartnerSubscribers.tsx` → page **PARTNER** pour gérer ses subscribers (côté partenaire)
- `/admin/AdminB2BMembers.tsx` → admin B2B (pas subscriber générique)
- `/admin/Telegram/AdminTelegramSubscribers.tsx` → Telegram (hors Partner Engine)

## 6.3 Conclusion

**Phase 7 du Partner Engine jamais terminée.** Un subscriber :
1. Reçoit son invitation email avec invite_token
2. S'inscrit via le flow standard SOS-Expat (rôle subscriber)
3. Bénéficie automatiquement du discount partenaire sur ses appels
4. **N'a aucune page dédiée en self-service** pour voir :
   - Son statut d'abonnement
   - Sa réduction active (montant, cap, expiry)
   - Son historique d'appels avec remises appliquées
   - Son affiliate code (s'il peut parrainer d'autres)

**Pour débloquer** : créer `src/pages/Subscriber/SubscriberDashboard.tsx` et `SubscriberActivity.tsx` + routes `/subscriber/*` + layout dédié, qui appelleraient les 2 endpoints Laravel déjà prêts.

---

# PARTIE 7 — HIÉRARCHIE SIÈGE → AGENCES (CÔTÉ PARTENAIRE)

## 7.1 Question : un partenaire peut-il avoir une structure siège + filiales ?

**Recherche** : grep de `parentPartnerId`, `parentOrgId`, `parentCompanyId`, `hierarchyLevel`, `regionId`, `subPartners` dans le code `partner/`.

**Résultat** : **AUCUN champ hiérarchique détecté** dans le modèle partenaire.

## 7.2 Modèle actuel

Un partenaire = **une entité plate** :
- 1 doc `partners/{partnerId}` (Firestore)
- 0 ou N agreements dans Laravel (généralement 1 active à la fois, historique des autres en expired/paused/draft)
- 0 ou N subscribers liés à l'agreement actif

**Pas de notion de** :
- ❌ Partner "mère" avec sous-partners enfants
- ❌ Partner holding avec filiales
- ❌ Partner siège avec agences régionales
- ❌ Partager les subscribers/commissions entre plusieurs partners

## 7.3 Workaround actuel (si besoin d'agences)

Si un "gros partenaire" a besoin de plusieurs entités :
- **Option A** : créer un seul partner avec agreements multiples (un par entité/région) → mais un seul partner = un seul login, un seul dashboard
- **Option B** : créer plusieurs partners distincts (un par agence) → chaque agence = login indépendant, facturation indépendante
- **Option C** : utiliser le système `agency_manager` existant (linkedProviderIds) pour agréger plusieurs providers → mais c'est pour les providers, pas les partenaires

## 7.4 Pour supporter une vraie hiérarchie partenaires

Il faudrait ajouter :
- Champ `parentPartnerId?: string` dans `partners/{partnerId}`
- Champ `partnerHierarchyLevel: 'master' | 'branch' | 'sub-branch'`
- Champ `region?: string` pour grouper par région
- Rôle secondaire `partner_manager` (gère plusieurs partners enfants)
- Agrégation des stats : partner master voit stats aggregées de ses branches
- Règles Firestore : partner master lit ses sub-partners
- Redistribution commissions : répartir commission entre parent/enfant selon ratio

**Estimation** : ~2-3 semaines de dev pour une hiérarchie 2 niveaux (master + branches) avec agrégation stats + redistribution commissions.

---

# PARTIE 8 — INVENTAIRE COMPLET

## 8.1 Backend Partner Engine Laravel

| Élément | Quantité |
|---------|----------|
| Routes API | 40 |
| Controllers | 14 |
| Services | 5 |
| Middleware | 5 |
| Models | 7 |
| Jobs queue Redis | 4 |
| Mailables | 2 |
| Console commands | 3 |
| Migrations | 9 |
| Tables PostgreSQL | 7 (+ queue tables Laravel) |
| Tests (fichiers) | 17 |
| Tests (méthodes) | 138 |
| Docker services | 6 |
| GitHub workflows | 2 |

## 8.2 Backend Firebase Functions `partner/`

| Élément | Quantité |
|---------|----------|
| Fichiers TypeScript | 38 |
| Callables user-facing | 11 |
| Callables admin | 13 |
| Triggers | 4 (onPartnerCreated + onCallCompleted handler + 2 forward helpers + index) |
| Scheduled functions | 2 |
| Services | 3 |
| Région callables | **us-central1** |
| Région triggers/scheduled | europe-west3 |

## 8.3 Frontend Partner

| Élément | Quantité |
|---------|----------|
| Pages Partner protégées | 11 |
| Pages Partner publiques | 2 |
| Admin Partners pages | 8 (toutes fonctionnelles, dont Fraud 352L, Stats 289L, Widgets 437L) |
| Items menu Partner Layout | 9 |
| Hook usePartner | 502 lignes |
| Service partnerEngineApi | 528 lignes, 45+ fonctions |

---

# PARTIE 9 — ÉTAT OPÉRATIONNEL & MANQUES

## 9.1 Ce qui est opérationnel en production ✅

### Backend
- Partner Engine Laravel déployé sur VPS Hetzner (6 containers Docker)
- CI/CD automatique (push main → deploy)
- 40 routes API avec auth + rate limiting par rôle
- 138 méthodes de test
- Firebase Functions partner/ (24 callables dans us-central1, triggers + scheduled dans europe-west3)
- Bridge Firebase ↔ Partner Engine (2 webhooks sécurisés)

### Paiement
- **Withdrawal mechanism COMPLET** : Wise / Bank transfer / Mobile Money (Flutterwave) / PayPal / Stripe
- **2-phase lifecycle** : hold 7j puis release 24h (configurable par partenaire)
- **Personnalisation par partenaire** : commission fixe/percent, discount fixed/percent avec cap, hold/release durées
- **Multi-currency** : commissions USD, withdrawal convertible
- **Double vérification Telegram** pour retraits
- **Fee transparent** ($3 par transaction, configurable)
- **Rollback atomique** en cas d'échec Telegram

### Frontend
- 11 pages partner protégées + 2 publiques
- 8 pages admin partner (toutes fonctionnelles, 3 pages complexes : Fraud 352L, Widgets 437L, Stats 289L)
- Real-time Firestore subscriptions (commissions, notifications)
- Dashboard avec balance, earnings chart, clicks analytics, subscribers CRUD, agreement view, widgets, resources, profile, payments, Telegram onboarding

## 9.2 Ce qui manque ❌

### Dashboard subscriber (CRITIQUE pour UX membres)
- Backend 100% prêt (`SubscriberSelfController` + 2 endpoints + middleware + API client)
- **Aucune UI frontend** (pas de pages, pas de routes)
- Un subscriber ne peut pas consulter son statut/réduction/historique en self-service

### Facturation automatique
- Champs présents (`companyName`, `vatNumber`, `companyAddress`)
- Pas de calcul VAT selon pays
- Pas de génération PDF invoice
- Pas de reconciliation comptable automatique

### Hiérarchie partner siège → filiales
- Aucun modèle de hiérarchie (parent/enfant, master/branch)
- Pour un gros partenaire multi-régions : créer plusieurs partners distincts (workaround)

### Listing public partenaires
- Flag `isPartnerListingPageVisible: false` par défaut
- Page `/partenaires` existe mais masquée
- Décision stratégique à prendre

## 9.3 Ce qui est partiel ⚠️

### Batch payout automatique
- Actuellement 100% manuel (admin traite 1 par 1)
- Infrastructure prête (`getPendingWithdrawals` permet batch UI)
- Pas de scheduled automatique (volontaire : audit strict)

### Partner Engine CI/CD
- Deploy auto OK
- Pas de linting automatique
- Pas de tests automatiques avant deploy

### KYC partenaires
- `companyName`, `vatNumber` stockés mais pas vérifiés
- Pas de flux de validation KYC auto (upload docs, vérification ID)

### Rate limiting Firebase callables
- Pas détecté au niveau callable
- Risk d'abus sur `trackPartnerClick` (public) — MAIS protégé par rate limit 30/min par IP hash

## 9.4 Recommandations prioritaires

| Priorité | Action | Impact |
|----------|--------|--------|
| **P0** | Implémenter Dashboard subscriber (`src/pages/Subscriber/` + routes + layout) | Débloquer Phase 7, self-service membres |
| **P1** | KYC flow partenaires (vérif identité + VAT UE) | Compliance légale, protection fraude |
| **P2** | Générer invoices PDF mensuelles par partenaire | Simplifier comptabilité des gros partenaires |
| **P2** | Rate limiting Firebase callables (partnerRequestWithdrawal notamment) | Sécurité |
| **P3** | Hiérarchie partner master/branches (si besoin gros comptes multi-entités) | Scale enterprise |
| **P3** | Batch payout scheduled (après stabilisation manual) | Opérations à grande échelle |
| **P3** | Linting + tests auto en CI Partner Engine | Qualité code |

---

# PARTIE 10 — FICHIERS CLÉS AVEC RÉFÉRENCES

## Backend Laravel Partner Engine
- `partner_engine_sos_expat/routes/api.php` (40 routes)
- `partner_engine_sos_expat/database/migrations/2026_03_16_000001_create_agreements_table.php` (schema agreements)
- `partner_engine_sos_expat/app/Models/Agreement.php` (castings, relations)
- `partner_engine_sos_expat/app/Services/AgreementService.php` (create, update, delete, renew + sync Firestore)
- `partner_engine_sos_expat/app/Services/StatsService.php` (partnerDashboard, earningsBreakdown, monthlyStats)
- `partner_engine_sos_expat/app/Http/Controllers/Admin/AgreementAdminController.php` (API admin contrats)
- `partner_engine_sos_expat/app/Http/Controllers/Subscriber/SubscriberSelfController.php` (2 endpoints prêts sans UI)
- `partner_engine_sos_expat/docker-compose.yml` (6 services)
- `partner_engine_sos_expat/.github/workflows/deploy.yml` (CI/CD)

## Backend Firebase Functions
- `sos/firebase/functions/src/partner/index.ts` (barrel 24 callables)
- `sos/firebase/functions/src/partner/types.ts` (419 lignes, 10 interfaces, 5 enums, `PARTNER_CONSTANTS`, `DEFAULT_PARTNER_CONFIG`)
- `sos/firebase/functions/src/partner/callables/partnerRequestWithdrawal.ts` (retrait opérationnel 5 modes)
- `sos/firebase/functions/src/partner/callables/trackPartnerClick.ts` (public, rate limit 30/min IP)
- `sos/firebase/functions/src/partner/callables/createPartner.ts` (admin-only, génère codes + envoie email)
- `sos/firebase/functions/src/partner/callables/admin/updatePartnerCommissionConfig.ts` (⭐ personnalisation per-partner)
- `sos/firebase/functions/src/partner/triggers/forwardToPartnerEngine.ts` (2 webhooks, X-Engine-Secret, 10s timeout)
- `sos/firebase/functions/src/partner/triggers/onCallCompleted.ts` (handler 10 étapes)
- `sos/firebase/functions/src/partner/scheduled/releasePartnerPendingCommissions.ts` (Phase 1 + Phase 2, override per-partner)
- `sos/firebase/functions/src/partner/scheduled/updatePartnerMonthlyStats.ts` (agrégation mensuelle)
- `sos/firebase/functions/src/partner/services/partnerCommissionService.ts` (createPartnerCommission, calculateCommissionAmount)
- `sos/firebase/functions/src/partner/services/partnerDiscountService.ts` (getPartnerDiscount, cap percentage)
- `sos/firebase/functions/src/partner/services/partnerConfigService.ts` (cache 5min)
- `sos/firebase/functions/src/payment/services/paymentService.ts` (PaymentService centralisé)
- `sos/firebase/functions/src/services/feeCalculationService.ts` (fee $3 configurable)
- `sos/firebase/functions/src/functionConfigs.ts:220,233` (régions us-central1)

## Frontend Partner
- `sos/src/App.tsx:495-497,623-633` (routes publiques + protégées)
- `sos/src/pages/Partner/` (11 pages protégées)
- `sos/src/pages/Partners/` (2 pages publiques)
- `sos/src/components/Partner/Layout/PartnerDashboardLayout.tsx` (9 items menu, redirect suspended lignes 48-52)
- `sos/src/components/Partner/Cards/` (5 composants)
- `sos/src/services/partnerEngineApi.ts` (528L, 45+ fonctions, base URL https://partner-engine.life-expat.com)
- `sos/src/hooks/usePartner.ts` (502L, Firestore real-time)

## Frontend Admin Partners
- `sos/src/pages/admin/Partners/AdminPartnersList.tsx`
- `sos/src/pages/admin/Partners/AdminPartnerCreate.tsx` (⭐ formulaire 7 sections)
- `sos/src/pages/admin/Partners/AdminPartnerDetail.tsx` (⭐ 5 onglets, dont Commissions editable)
- `sos/src/pages/admin/Partners/AdminPartnersConfig.tsx`
- `sos/src/pages/admin/Partners/AdminPartnersWidgets.tsx` (437L — page complète)
- `sos/src/pages/admin/Partners/AdminPartnersStats.tsx` (289L — page complète)
- `sos/src/pages/admin/Partners/AdminPartnerApplications.tsx`
- `sos/src/pages/admin/Partners/AdminPartnersFraud.tsx` (352L — page complète)
- `sos/src/pages/admin/AdminRoutesV2.tsx:1686-1694` (routes admin/partners)

## Sécurité
- `sos/firestore.rules:1970-1986` (partner_commissions, partner_notifications permissions)

---

**Fin de l'audit — 2026-04-23 v3 (focus exclusif partenaires + paiement détaillé)**
