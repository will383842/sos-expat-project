# AUDIT SOS-CALL — GAP ANALYSIS EXHAUSTIF

**Date** : 2026-04-23
**Version** : 3 (ajout console admin Filament, domaines sos-expat.com, clarification architecture hybride Firebase + Laravel)
**Spec source** : `C:\Users\willi\Documents\Projets\SOS-Call-Spec-ClaudeCode-Final.md`

**Objectif** : Comparer EXHAUSTIVEMENT la spec SOS-Call avec l'existant (Partner Engine Laravel + Firebase Functions + Frontend React), identifier précisément ce qui existe, ce qu'il faut modifier, ce qu'il faut créer.

**Méthodologie** : 3 audits croisés par Explore agents + lecture directe des fichiers clés (migrations, services, callables, composants).

---

## DÉCISIONS ARCHITECTURALES CLÉS (v3)

1. ❌ **PAS DE SMS OTP** — trop contraignant à l'étranger. Remplacé par **code unique** (ex: `AXA-2026-X7K2P`) + fallback phone+email optionnel. Page dédiée "code invalide" avec message pédagogique.
2. ✅ **FLOW EXISTANT 100% INTACT** — le chemin standard `/sos-appel → BookingRequest → CallCheckout → Stripe → createAndScheduleCall` n'est **pas modifié**. SOS-Call est un **chemin parallèle** qui coexiste sans impact.
3. ✅ **240 secondes** — `CALL_DELAY_SECONDS` inchangé. Même timing Twilio qu'aujourd'hui.
4. ✅ **Partenaire dynamique** — badge "Couvert par `{{partner_name}}`" chargé depuis `agreement.partner_name`.
5. ✅ **4 méthodes d'inscription client** par le partenaire (UI manuelle / CSV / API REST / Webhook CRM Phase 2).
6. ✅ **ARCHITECTURE HYBRIDE** — on garde Firebase+Twilio+Google Cloud pour le système d'appel (existant, éprouvé), Laravel Partner Engine pour tout ce qui concerne les partenaires B2B.
7. ✅ **Console admin Filament 3** — nouvelle console admin Laravel dédiée aux partenaires sur `admin.sos-expat.com`, **indépendante** de Firebase/Google Cloud, installée dans Partner Engine existant.
8. ✅ **Page `/sos-call` Blade Laravel** — servie sur `sos-call.sos-expat.com`, haute disponibilité, zéro dépendance SPA React.
9. ✅ **Domaines tous en `sos-expat.com`** — migration de `life-expat.com` vers `sos-expat.com` pour cohérence de marque.

---

## ARCHITECTURE CIBLE — 3 ENTRÉES, 1 BACKEND UNIFIÉ

```
╔═════════════════════════════════════════════════════════════════╗
║  APPELS (existant, inchangé)                                     ║
║                                                                   ║
║  • Firebase Functions (europe-west3)                             ║
║    - createAndScheduleCall (MODIF : 1 if pour sosCallSessionToken)║
║    - onCallCompleted (MODIF : early return si isSosCallFree)     ║
║    - Cloud Tasks (planification T+240s)                          ║
║  • Twilio conference                                             ║
║  • Firestore call_sessions                                       ║
║                                                                   ║
║  Modif total : ~100 lignes ajoutées sur 4000+ existantes         ║
╚═════════════════════════════════════════════════════════════════╝
                              │
                              │ (pont : 1 callable checkSosCallCode)
                              │
╔═════════════════════════════════════════════════════════════════╗
║  PARTNER ENGINE LARAVEL (existant, étendu pour SOS-Call)         ║
║  VPS Hetzner 95.216.179.163                                      ║
║  Un seul projet, 3 sous-domaines distincts :                     ║
║                                                                   ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │ partner-engine.sos-expat.com                             │    ║
║  │ → API REST (routes/api.php)                              │    ║
║  │ → Consommée par SPA React (dashboards partenaires)       │    ║
║  │ → 40 routes existantes + 3 nouveaux endpoints SOS-Call   │    ║
║  └─────────────────────────────────────────────────────────┘    ║
║                                                                   ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │ sos-call.sos-expat.com                                   │    ║
║  │ → Page publique (routes/sos-call.php)                    │    ║
║  │ → Blade Laravel + Alpine.js + Tailwind                   │    ║
║  │ → Ultra-léger (~200 lignes), haute dispo                 │    ║
║  │ → NOUVEAU                                                 │    ║
║  └─────────────────────────────────────────────────────────┘    ║
║                                                                   ║
║  ┌─────────────────────────────────────────────────────────┐    ║
║  │ admin.sos-expat.com ⭐                                    │    ║
║  │ → Console admin FILAMENT 3 (routes/filament.php)         │    ║
║  │ → Laravel + Livewire + Alpine + Tailwind                 │    ║
║  │ → Auth Laravel Sanctum + 2FA TOTP                        │    ║
║  │ → 0 dépendance Firebase / Google Cloud                   │    ║
║  │ → NOUVEAU                                                 │    ║
║  └─────────────────────────────────────────────────────────┘    ║
║                                                                   ║
║  Même DB PostgreSQL + même Redis + même queue                    ║
╚═════════════════════════════════════════════════════════════════╝
                              │
                              │ (données consommées)
                              │
╔═════════════════════════════════════════════════════════════════╗
║  SPA REACT sos-expat.com (existant, légèrement enrichi)          ║
║                                                                   ║
║  • /partner/* → 11 pages dashboard partenaire existantes         ║
║    - Enrichir PartnerSubscribers.tsx (colonnes SOS-Call)         ║
║    - Enrichir PartnerAgreement.tsx (section SOS-Call)            ║
║                                                                   ║
║  • /admin/partners/* → 8 pages admin partenaires existantes      ║
║    - Enrichir AdminPartnerCreate.tsx (section 8)                 ║
║    - Enrichir AdminPartnerDetail.tsx (onglet 6)                  ║
║    - MIGRATION PROGRESSIVE vers Filament (Phase 2, dans 2-3 mois)║
║                                                                   ║
║  • Tout le reste du SPA (clients, providers, chatters, etc.)     ║
║    → Pas touché                                                   ║
╚═════════════════════════════════════════════════════════════════╝
```

---

## SYNTHÈSE EXÉCUTIVE

| Composant | État | Effort restant |
|-----------|------|----------------|
| **Infrastructure de base** | ✅ 95% prête | 2h (installer dompdf + Filament) |
| **Backend Laravel — Migrations SOS-Call** | ❌ 4 migrations à créer | 4h |
| **Backend Laravel — SosCallController (3 endpoints, sans OTP)** | ❌ À créer | 1.5 jour |
| **Backend Laravel — Jobs + Commande facturation + PDF** | ❌ À créer | 3 jours |
| **Firebase Functions — 1 callable proxy checkSosCallCode** | ❌ À créer | 4h |
| **Firebase Functions — Modif createCallSession + onCallCompleted** | ⚠️ À modifier (~100 lignes) | 1 jour |
| **Page publique `/sos-call`** (Blade Laravel, sous-domaine dédié) | ❌ À créer | 2 jours |
| **Console admin Filament** (install + ressources + widgets dashboard) | ❌ À créer | 5 jours |
| **SPA React existant — Enrichissements** (colonnes SOS-Call) | ⚠️ À enrichir | 2 jours |
| **Page `/mon-acces` dashboard subscriber** (Blade ou React) | ❌ À créer | 1-2 jours |
| **Estimation totale MVP** | — | **~20 jours** (MVP commercialisable) |

**Faisabilité globale** : ✅ **Complètement faisable**. L'infrastructure est prête à 95% (Twilio SMS, Redis, Zoho SMTP, Telegram, libphonenumber-js, IntlPhoneInput, AAA bypass pattern existant). Il n'y a **aucun blocage architectural**.

**Principaux risques identifiés** :
1. ⚡ **Cohérence sosCallSessionToken** entre Laravel Redis et Firebase callables (nécessite check HTTP vers Partner Engine)
2. ⚡ **Bypass Stripe** dans `createAndScheduleCallFunction.ts` : la validation `paymentIntentId.startsWith('pi_')` doit être adaptée pour accepter le `sosCallSessionToken` alternatif
3. ⚡ **Rate limiting anti-brute-force** : protection contre énumération (5 tentatives/15min par phone, 10/min par IP)
4. ⚡ **Question UX "phone match + email ne match pas"** : page dédiée avec message pédagogique "Utilisez l'email fourni à {{partner_name}}"

---

# PARTIE 1 — INFRASTRUCTURE EXISTANTE VÉRIFIÉE

## 1.1 Twilio (voice + SMS notifications) — ✅ OPÉRATIONNEL

**Fichier principal** : `sos/firebase/functions/src/notificationPipeline/providers/sms/twilioSms.ts`

**Déjà utilisé pour** :
- Conférence téléphonique (flow d'appel standard, réutilisé tel quel par SOS-Call)
- Notifications SMS provider (event `booking_paid_provider`)
- Pas utilisé pour OTP (pas besoin dans l'architecture retenue)

**Secrets Firebase** (déjà configurés dans `lib/secrets.ts`) :
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

**Verdict SOS-Call** : ✅ **Aucune modification nécessaire**. Le système SOS-Call réutilise Twilio uniquement pour la conférence téléphonique (même flow qu'aujourd'hui, CALL_DELAY_SECONDS = 240s inchangé).

## 1.2 Redis dans Partner Engine Laravel — ✅ OPÉRATIONNEL

**Config** :
- `config/cache.php` : store par défaut = `redis`
- `config/database.php` : client `predis` (v3.4)
- `config/session.php` : driver Redis
- `.env.example` : `REDIS_HOST=pe-redis, REDIS_PORT=6379, REDIS_DB=0`

**Usage actuel dans le code** :
```php
Cache::remember("user:{$uid}", 300, ...)      // RequirePartner.php:27
Cache::remember("partner:{$uid}", 300, ...)   // Cache partner 5min
Cache::remember('firebase_access_token', 3500, ...)  // Token Firebase ~1h
```

**Utilisable immédiatement pour sessions SOS-Call** :
```php
Cache::put("sos_call_attempts:{$phone}", $count, 900);   // TTL 15 min — compteur anti-brute-force
Cache::put("sos_call_block:{$phone}", true, 600);        // TTL 10 min — blocage après 3 échecs
Cache::put("sos_call_session:{$token}", $data, 900);     // TTL 15 min — session après match validé
```

**Verdict** : ✅ **Aucune installation requise**, prêt pour stockage sessions temporaires et rate limiting.

## 1.3 Génération PDF — ❌ À INSTALLER

**État actuel** : Aucune lib PDF dans `composer.json` de Partner Engine.

**Action requise** :
```bash
composer require barryvdh/laravel-dompdf
```

**Usage prévu** :
```php
use Barryvdh\DomPDF\Facade\Pdf;
$pdf = Pdf::loadView('invoices.sos_call_monthly', $data)->stream('invoice.pdf');
```

**Effort** : 30 min (install + config publish).

## 1.4 Email Zoho SMTP — ✅ OPÉRATIONNEL

**Config `config/mail.php`** :
```php
'host' => 'smtppro.zoho.eu',
'port' => 465,
'encryption' => 'ssl',
'from' => ['address' => 'noreply@sos-expat.com', 'name' => 'SOS-Expat']
```

**Usage actuel** : `SendSubscriberInvitation` job envoie déjà des emails multilingues via Zoho.

**Verdict** : ✅ **Prêt pour le job `SendSosCallActivationEmail`**.

## 1.5 Telegram Engine — ✅ OPÉRATIONNEL

**Config `config/services.php`** :
```php
'telegram_engine' => [
  'url' => env('TELEGRAM_ENGINE_URL', 'https://engine-telegram-sos-expat.life-expat.com'),
  'api_key' => env('TELEGRAM_ENGINE_API_KEY'),
]
```

**Usage actuel** (exemple `ExpireAgreementsCommand.php:80-93`) :
```php
Http::timeout(5)
  ->withHeaders(['X-Engine-Secret' => $apiKey])
  ->post("{$url}/api/events/{$eventSlug}", $data);
```

**Events disponibles pour SOS-Call** :
- `partner-subscriber-registered` (déjà utilisé)
- Nouveaux à créer : `sos-call-invoice-generated`, `sos-call-invoice-overdue`, `sos-call-suspension-triggered`

**Verdict** : ✅ **Prêt pour notifications admin**.

## 1.6 IntlPhoneInput + libphonenumber — ✅ OPÉRATIONNEL

**Composant** : `sos/src/components/forms-data/IntlPhoneInput.tsx`
**Dépendances** :
- `react-phone-input-2@2.15.1`
- `libphonenumber-js@1.12.15`

**Utility** : `sos/src/utils/phone.ts` (202 lignes)
- `smartNormalizePhone(input)` → E.164 strict
- Gestion trunk prefix (0 pour FR, 8 pour RU, etc.)
- Validation finale : `/^\+[1-9]\d{6,14}$/`

**Output garanti** : `+33612345678` format standard E.164.

**Verdict** : ✅ **Composant réutilisable tel quel** dans la page `/sos-call`.

## 1.7 createAndScheduleCall Firebase — ✅ EXISTE (à modifier)

**Fichier** : `sos/firebase/functions/src/createAndScheduleCallFunction.ts`

**Pattern AAA existant (ligne 841-851)** :
```typescript
const isAAA = providerId.startsWith('aaa_') || providerUserData?.isAAA === true;
providerForcedAIAccess = isAAA || providerUserData?.forcedAIAccess === true;
```

**Validation paymentIntent (ligne 432-474)** :
```typescript
if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
  throw new HttpsError('invalid-argument', 'PaymentIntent ID invalide');
}
```

**Verdict** : ✅ **Pattern AAA = base pour SOS-Call bypass**. Modification nécessaire : ajouter un flag `isSosCallFree` qui court-circuite la validation Stripe.

## 1.8 Subscriber table — ⚠️ 90% PRÊT

**Champs présents** (vérifié `2026_03_16_000002_create_subscribers_table.php`) :
- ✅ `phone` VARCHAR(50) + index (format E.164 appliqué applicativement)
- ✅ `email` VARCHAR(255) + index + unique(partner_firebase_id, email)
- ✅ `agreement_id` FK vers agreements
- ✅ `status` VARCHAR(20) — valeurs : `invited | registered | active | suspended | expired`
- ✅ `language` VARCHAR(5) (default 'fr') — pour emails multilingues
- ✅ `invite_token` VARCHAR(64) unique
- ✅ `total_calls`, `total_spent_cents`, `total_discount_cents`

**Champs SOS-Call manquants** :
- ❌ `sos_call_code` VARCHAR(20) unique (format `AXA-2026-X7K2P`)
- ❌ `sos_call_activated_at` TIMESTAMP
- ❌ `sos_call_expires_at` TIMESTAMP nullable
- ❌ `calls_expert` INTEGER (default 0)
- ❌ `calls_lawyer` INTEGER (default 0)

**Verdict** : ⚠️ **1 migration à créer** pour ajouter 5 colonnes.

## 1.9 Agreement table — ⚠️ 70% PRÊT

**Champs présents** (vérifié `2026_03_16_000001_create_agreements_table.php`) :
- ✅ `max_subscribers`, `max_calls_per_subscriber`
- ✅ `starts_at`, `expires_at`
- ✅ `commission_per_call_lawyer`, `commission_per_call_expat` (existant pour ancien modèle commission)
- ✅ `discount_type`, `discount_value`, `discount_max_cents`, `discount_label`

**Champs SOS-Call manquants** :
- ❌ `billing_rate` DECIMAL(8,2) — tarif €/$ par client/mois (défaut: 3.00)
- ❌ `billing_currency` VARCHAR(3) — EUR/USD
- ❌ `payment_terms_days` TINYINT — défaut: 15
- ❌ `call_types_allowed` VARCHAR(20) — `both | expat_only | lawyer_only`
- ❌ `sos_call_active` BOOLEAN — défaut: true
- ❌ `billing_email` VARCHAR(255) nullable

**Verdict** : ⚠️ **1 migration à créer** pour ajouter 6 colonnes.

## 1.10 Email Templates — ⚠️ STRUCTURE OK, MULTI-LANGUE ABSENT

**Migration** : `2026_03_16_000006_create_email_templates_table.php`

**Structure actuelle** :
```sql
CREATE TABLE email_templates (
  id, partner_firebase_id, type VARCHAR(50), subject, body_html, is_active,
  UNIQUE (partner_firebase_id, type)
);
```

**Limitation** : Pas de support multi-langue natif. Un partenaire = un seul template par type.

**Pour SOS-Call** (9 langues : fr, en, es, de, pt, ar, zh, ru, hi), **3 approches possibles** :

| Approche | Effort | Avantage |
|----------|--------|----------|
| **A** — Ajouter colonne `language VARCHAR(5)` + unique sur `(partner_firebase_id, type, language)` | 2h migration + refactor | Clean, extensible |
| **B** — Types nommés `sos_call_activation_fr`, `..._en`, etc. | 0h | Zero migration, mais moche |
| **C** — Champ JSON `body_html_by_lang` | 1h migration | 1 row par template |

**Recommandation** : **Approche A** pour cohérence future (les autres types bénéficieront aussi du multi-langue).

## 1.11 Audit Logs — ✅ OPÉRATIONNEL

**Service** : `app/Services/AuditService.php::log()`

**Usage pour SOS-Call** :
```php
$this->audit->log(
  'system', 'system',
  'sos_call.code_requested',
  'subscriber', $subscriber->id,
  ['phone_last_four' => substr($phone, -4)],
  $request->ip()
);
```

**Events SOS-Call à logger** :
- `sos_call.access_granted` (match exact → session token généré)
- `sos_call.email_mismatch` (phone trouvé mais email différent)
- `sos_call.not_found` (ni phone ni email trouvé)
- `sos_call.rate_limited` (blocage après 3 tentatives)
- `sos_call.quota_reached` (limite appels atteinte)
- `sos_call.call_triggered` (appel déclenché après match)
- `sos_call.invoice_generated` (facture mensuelle)
- `sos_call.suspension_triggered` (impayé)

**Verdict** : ✅ **Prêt à l'emploi**.

---

# PARTIE 2 — BACKEND LARAVEL — MODIFICATIONS REQUISES

## 2.1 Migration 1 — Ajouter champs SOS-Call à `agreements`

**Nouveau fichier** : `database/migrations/2026_04_23_000001_add_sos_call_fields_to_agreements.php`

```php
Schema::table('agreements', function (Blueprint $table) {
  $table->decimal('billing_rate', 8, 2)->default(3.00);
  $table->string('billing_currency', 3)->default('EUR');
  $table->unsignedTinyInteger('payment_terms_days')->default(15);
  $table->string('call_types_allowed', 20)->default('both');  // both|expat_only|lawyer_only
  $table->boolean('sos_call_active')->default(true);
  $table->string('billing_email', 255)->nullable();
});
```

**Update model `Agreement.php`** : ajouter aux `$fillable` et `$casts`.

## 2.2 Migration 2 — Ajouter champs SOS-Call à `subscribers`

**Nouveau fichier** : `database/migrations/2026_04_23_000002_add_sos_call_fields_to_subscribers.php`

```php
Schema::table('subscribers', function (Blueprint $table) {
  $table->string('sos_call_code', 20)->nullable()->unique();
  $table->timestamp('sos_call_activated_at')->nullable();
  $table->timestamp('sos_call_expires_at')->nullable();
  $table->unsignedInteger('calls_expert')->default(0);
  $table->unsignedInteger('calls_lawyer')->default(0);
  
  // Index composite pour lookup rapide (phone + email + status)
  $table->index(['phone', 'email', 'status'], 'idx_sos_call_lookup');
  
  // Index pour queries par code
  $table->index('sos_call_code', 'idx_sos_call_code');
});
```

**Update model `Subscriber.php`** : ajouter fillable + casts (`sos_call_activated_at` et `sos_call_expires_at` en datetime).

## 2.3 Migration 3 — Créer table `partner_invoices`

**Nouveau fichier** : `database/migrations/2026_04_23_000003_create_partner_invoices_table.php`

```php
Schema::create('partner_invoices', function (Blueprint $table) {
  $table->bigIncrements('id');
  $table->foreignId('agreement_id')->constrained('agreements')->cascadeOnDelete();
  $table->string('partner_firebase_id', 128)->index();
  $table->string('period', 7);  // YYYY-MM
  $table->unsignedInteger('active_subscribers');
  $table->decimal('billing_rate', 8, 2);
  $table->string('billing_currency', 3);
  $table->decimal('total_amount', 10, 2);
  $table->unsignedInteger('calls_expert')->default(0);
  $table->unsignedInteger('calls_lawyer')->default(0);
  $table->decimal('total_cost', 10, 2);  // coût interne SOS-Expat (pas refacturé)
  $table->string('status', 20)->default('pending');  // pending|paid|overdue
  $table->string('pdf_path', 512)->nullable();
  $table->date('due_date');
  $table->timestamp('paid_at')->nullable();
  $table->timestamps();
  
  $table->unique(['agreement_id', 'period'], 'uq_partner_invoice_period');
  $table->index(['status', 'due_date'], 'idx_invoice_status_due');
});
```

**Nouveau model** : `app/Models/PartnerInvoice.php` avec relations (agreement).

## 2.4 Migration 4 — Multi-langue pour email_templates

**Nouveau fichier** : `database/migrations/2026_04_23_000004_add_language_to_email_templates.php`

```php
Schema::table('email_templates', function (Blueprint $table) {
  // Drop l'unique existant
  $table->dropUnique('uq_email_templates_partner_type');
  
  // Ajouter language
  $table->string('language', 5)->default('fr')->after('type');
  
  // Recréer l'unique avec language
  $table->unique(['partner_firebase_id', 'type', 'language'], 'uq_email_templates_partner_type_language');
});
```

## 2.5 Modifier `SubscriberService::create()`

**Fichier** : `app/Services/SubscriberService.php`

**Avant dispatcher `SendSubscriberInvitation`**, ajouter :

```php
// Generate unique sos_call_code (loop until unique)
$subscriber->sos_call_code = $this->generateUniqueSosCallCode($partner->name ?? 'SOS');
$subscriber->sos_call_activated_at = now();
$subscriber->sos_call_expires_at = $agreement->expires_at; // null si permanent
$subscriber->save();

// Dispatch SOS-Call activation email
SendSosCallActivationEmail::dispatch($subscriber);
```

**Nouvelle méthode privée** :

```php
private function generateUniqueSosCallCode(string $partnerName): string
{
  $prefix = strtoupper(substr(preg_replace('/[^A-Z0-9]/i', '', $partnerName), 0, 3));
  $year = date('Y');
  $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I, O, 0, 1
  
  do {
    $random = '';
    for ($i = 0; $i < 5; $i++) {
      $random .= $chars[random_int(0, strlen($chars) - 1)];
    }
    $code = "{$prefix}-{$year}-{$random}";
    $exists = Subscriber::where('sos_call_code', $code)->exists();
  } while ($exists);
  
  return $code;
}
```

## 2.6 Nouveau `SosCallController` — 3 endpoints (sans OTP)

**Fichier** : `app/Http/Controllers/SosCallController.php`

### Endpoint 1 — `POST /sos-call/check` (public, throttled)

Vérifie l'éligibilité directement via phone + email. Si match complet → génère session token immédiatement.

```php
public function check(Request $request)
{
  $data = $request->validate([
    'phone' => 'required|string|max:50',
    'email' => 'required|email|max:255',
  ]);
  
  $phone = $this->normalizePhone($data['phone']);  // E.164 attendu
  $email = strtolower(trim($data['email']));
  
  // Rate limit par IP et par phone (anti-brute-force)
  if (Cache::get("sos_call_block:{$phone}")) {
    return response()->json(['status' => 'rate_limited'], 429);
  }
  
  // Étape 1 : chercher un subscriber par phone (pour détecter le cas "email mismatch")
  $subscriberByPhone = Subscriber::where('phone', $phone)
    ->where('status', 'active')
    ->where(function($q) {
      $q->whereNull('sos_call_expires_at')
        ->orWhere('sos_call_expires_at', '>', now());
    })
    ->with('agreement')
    ->first();
  
  // Étape 2 : chercher le match exact (phone + email)
  $subscriberExact = $subscriberByPhone
    && $subscriberByPhone->email === $email
    ? $subscriberByPhone : null;
  
  // Incrémente compteur tentatives
  $attempts = Cache::increment("sos_call_attempts:{$phone}") ?: 1;
  Cache::put("sos_call_attempts:{$phone}", $attempts, 900);  // TTL 15 min
  
  if ($attempts >= 3) {
    Cache::put("sos_call_block:{$phone}", true, 600);  // 10 min blocage
    Cache::forget("sos_call_attempts:{$phone}");
    return response()->json(['status' => 'too_many_attempts'], 429);
  }
  
  // CAS A : Match exact trouvé
  if ($subscriberExact && $subscriberExact->agreement
      && $subscriberExact->agreement->sos_call_active
      && $subscriberExact->agreement->status === 'active') {
    
    // Check quota
    if ($subscriberExact->agreement->max_calls_per_subscriber !== null
        && ($subscriberExact->calls_expert + $subscriberExact->calls_lawyer) >= $subscriberExact->agreement->max_calls_per_subscriber) {
      return response()->json(['status' => 'quota_reached']);
    }
    
    // Générer session token immédiatement (pas d'OTP)
    $sessionToken = bin2hex(random_bytes(16));  // 32 chars hex
    
    $callsRemaining = $subscriberExact->agreement->max_calls_per_subscriber
      ? $subscriberExact->agreement->max_calls_per_subscriber - ($subscriberExact->calls_expert + $subscriberExact->calls_lawyer)
      : null;
    
    Cache::put("sos_call_session:{$sessionToken}", [
      'subscriber_id' => $subscriberExact->id,
      'partner_firebase_id' => $subscriberExact->partner_firebase_id,
      'agreement_id' => $subscriberExact->agreement_id,
      'call_types_allowed' => $subscriberExact->agreement->call_types_allowed,
      'calls_remaining' => $callsRemaining,
      'used' => false,
    ], 900);  // 15 min
    
    // Effacer compteur tentatives
    Cache::forget("sos_call_attempts:{$phone}");
    
    $this->audit->log('system', 'system', 'sos_call.access_granted', 'subscriber', $subscriberExact->id, [], $request->ip());
    
    return response()->json([
      'status' => 'access_granted',
      'session_token' => $sessionToken,
      'partner_name' => $subscriberExact->agreement->partner_name,
      'call_types_allowed' => $subscriberExact->agreement->call_types_allowed,
      'calls_remaining' => $callsRemaining,
    ]);
  }
  
  // CAS B : Phone trouvé mais email ne matche pas → message pédagogique
  if ($subscriberByPhone) {
    $this->audit->log('system', 'system', 'sos_call.email_mismatch', 'subscriber', $subscriberByPhone->id,
      ['email_domain' => explode('@', $email)[1] ?? null], $request->ip());
    
    $attemptsRemaining = 3 - $attempts;
    return response()->json([
      'status' => 'email_mismatch',
      'partner_name' => $subscriberByPhone->agreement->partner_name ?? null,
      'attempts_remaining' => $attemptsRemaining,
    ]);
  }
  
  // CAS C : Ni phone ni email connu
  $this->audit->log('system', 'system', 'sos_call.not_found', null, null,
    ['phone_last_four' => substr($phone, -4), 'email_domain' => explode('@', $email)[1] ?? null],
    $request->ip()
  );
  
  return response()->json(['status' => 'not_found']);
}
```

**Retours possibles** :
| `status` | Sens | UI frontend |
|----------|------|-------------|
| `access_granted` | Match complet → session créée | État "confirmé" (boutons Expert/Avocat) |
| `email_mismatch` | Phone trouvé mais email différent | État dédié avec formulaire de re-saisie email |
| `not_found` | Ni phone ni email connu | État "non trouvé" + accès standard ou support |
| `quota_reached` | Limite d'appels atteinte | Message "Vous avez utilisé votre quota mensuel" |
| `rate_limited` / `too_many_attempts` | Trop de tentatives | Message "Réessayez dans 10 min" |

### Endpoint 2 — `POST /sos-call/check-session` (auth webhook secret)

```php
public function checkSession(Request $request)
{
  $data = $request->validate([
    'session_token' => 'required|string|size:32',
    'call_type' => 'required|in:lawyer,expat',
  ]);
  
  $session = Cache::get("sos_call_session:{$data['session_token']}");
  if (!$session || $session['used']) {
    return response()->json(['valid' => false, 'reason' => 'invalid_or_used']);
  }
  
  // Vérifier call_type autorisé
  $allowed = $session['call_types_allowed'];
  if ($allowed === 'expat_only' && $data['call_type'] !== 'expat') {
    return response()->json(['valid' => false, 'reason' => 'call_type_not_allowed']);
  }
  if ($allowed === 'lawyer_only' && $data['call_type'] !== 'lawyer') {
    return response()->json(['valid' => false, 'reason' => 'call_type_not_allowed']);
  }
  
  return response()->json([
    'valid' => true,
    'subscriber_id' => $session['subscriber_id'],
    'partner_firebase_id' => $session['partner_firebase_id'],
    'agreement_id' => $session['agreement_id'],
  ]);
}
```

### Endpoint 3 — `POST /sos-call/log` (auth webhook secret)

```php
public function log(Request $request)
{
  $data = $request->validate([
    'session_token' => 'required|string|size:32',
    'call_session_id' => 'required|string',
    'call_type' => 'required|in:lawyer,expat',
    'duration_seconds' => 'nullable|integer|min:0',
  ]);
  
  $session = Cache::get("sos_call_session:{$data['session_token']}");
  if (!$session) {
    return response()->json(['success' => false, 'reason' => 'session_not_found'], 404);
  }
  
  $subscriber = Subscriber::find($session['subscriber_id']);
  if (!$subscriber) {
    return response()->json(['success' => false, 'reason' => 'subscriber_not_found'], 404);
  }
  
  // Transaction atomique
  DB::transaction(function() use ($subscriber, $data, $session) {
    // Increment compteurs
    if ($data['call_type'] === 'expat') {
      $subscriber->increment('calls_expert');
    } else {
      $subscriber->increment('calls_lawyer');
    }
    $subscriber->increment('total_calls');
    
    // Créer subscriber_activity
    SubscriberActivity::create([
      'subscriber_id' => $subscriber->id,
      'partner_firebase_id' => $subscriber->partner_firebase_id,
      'type' => 'call_completed',
      'call_session_id' => $data['call_session_id'],  // Unicité via index partial PG
      'provider_type' => $data['call_type'],
      'call_duration_seconds' => $data['duration_seconds'] ?? 0,
      'amount_paid_cents' => 0,  // Gratuit pour le client
      'discount_applied_cents' => $data['call_type'] === 'lawyer' ? 4900 : 1900,  // Info uniquement
      'commission_earned_cents' => 0,  // Forfait, pas commission à l'acte
      'metadata' => ['is_sos_call' => true],
    ]);
    
    // Invalider session (usage unique)
    Cache::put("sos_call_session:{$data['session_token']}", 
      array_merge($session, ['used' => true]), 900);
  });
  
  return response()->json(['success' => true]);
}
```

## 2.7 Routes SOS-Call

**Fichier** : `routes/api.php` — ajouter :

```php
// Public routes (rate-limited)
Route::prefix('sos-call')->group(function () {
  Route::post('/check', [SosCallController::class, 'check'])
    ->middleware('throttle:sos-call-check');
});

// Webhook routes (auth via secret)
Route::prefix('sos-call')->middleware('webhook.secret')->group(function () {
  Route::post('/check-session', [SosCallController::class, 'checkSession']);
  Route::post('/log', [SosCallController::class, 'log']);
});
```

**Configuration throttle** (`app/Providers/RouteServiceProvider.php`) :

```php
RateLimiter::for('sos-call-check', fn($r) => [
  Limit::perMinute(10)->by($r->ip()),
  Limit::perMinutes(5, 5)->by($r->input('phone', '')),  // 5 checks/5min par phone
]);
```

## 2.8 Job `SendSosCallActivationEmail`

**Fichier** : `app/Jobs/SendSosCallActivationEmail.php`

```php
class SendSosCallActivationEmail implements ShouldQueue
{
  public int $tries = 3;
  public int $backoff = 60;
  public function __construct(public Subscriber $subscriber) {
    $this->onQueue('high');  // Prioritaire
  }
  
  public function handle(): void
  {
    $agreement = $this->subscriber->agreement;
    $language = $this->subscriber->language ?? 'fr';
    
    // Chercher template custom (partenaire + langue)
    $template = EmailTemplate::where('partner_firebase_id', $this->subscriber->partner_firebase_id)
      ->where('type', 'sos_call_activation')
      ->where('language', $language)
      ->where('is_active', true)
      ->first();
    
    // Fallback template par défaut (langue)
    if (!$template) {
      $template = EmailTemplate::whereNull('partner_firebase_id')
        ->where('type', 'sos_call_activation')
        ->where('language', $language)
        ->where('is_active', true)
        ->first();
    }
    
    $data = [
      'first_name' => $this->subscriber->first_name,
      'partner_name' => $agreement->partner_name,
      'agreement_label' => $agreement->name,
      'call_types_allowed' => $agreement->call_types_allowed,
      'expires_at' => $this->subscriber->sos_call_expires_at,
      'sos_call_url' => config('app.sos_call_url', 'https://sos-expat.com/sos-call'),
    ];
    
    if ($template) {
      $subject = $this->renderTemplate($template->subject, $data);
      $body = $this->renderTemplate($template->body_html, $data);
      Mail::to($this->subscriber->email)->send(new SosCallActivationMail($subject, $body));
    } else {
      // Fallback Blade template
      Mail::to($this->subscriber->email)->send(
        new SosCallActivationMail(null, null, 'emails.sos-call-activation', $data, $language)
      );
    }
  }
}
```

## 2.9 Commande `GenerateMonthlyInvoices`

**Fichier** : `app/Console/Commands/GenerateMonthlyInvoices.php`
**Schedule** : `0 6 1 * *` (1er du mois à 6h UTC)

```php
class GenerateMonthlyInvoices extends Command
{
  protected $signature = 'invoices:generate-monthly';
  
  public function handle(): int
  {
    $previousMonth = now()->subMonth()->format('Y-m');
    $startOfMonth = now()->subMonth()->startOfMonth();
    $endOfMonth = now()->subMonth()->endOfMonth();
    
    $agreements = Agreement::where('status', 'active')
      ->where('sos_call_active', true)
      ->get();
    
    foreach ($agreements as $agreement) {
      $this->processAgreement($agreement, $previousMonth, $startOfMonth, $endOfMonth);
    }
    
    return self::SUCCESS;
  }
  
  private function processAgreement(Agreement $agreement, string $period, $start, $end): void
  {
    // Skip si déjà facturé
    $existing = PartnerInvoice::where('agreement_id', $agreement->id)
      ->where('period', $period)->first();
    if ($existing) return;
    
    // Count subscribers actifs sur la période
    $activeSubscribers = Subscriber::where('partner_firebase_id', $agreement->partner_firebase_id)
      ->where('status', 'active')
      ->where('sos_call_activated_at', '<=', $end)
      ->where(function($q) use ($start) {
        $q->whereNull('sos_call_expires_at')->orWhere('sos_call_expires_at', '>=', $start);
      })
      ->count();
    
    // Count appels du mois
    $calls = SubscriberActivity::whereHas('subscriber', fn($q) => 
      $q->where('partner_firebase_id', $agreement->partner_firebase_id))
      ->where('type', 'call_completed')
      ->whereJsonContains('metadata->is_sos_call', true)
      ->whereBetween('created_at', [$start, $end])
      ->selectRaw("SUM(CASE WHEN provider_type = 'expat' THEN 1 ELSE 0 END) as expat_count,
                   SUM(CASE WHEN provider_type = 'lawyer' THEN 1 ELSE 0 END) as lawyer_count")
      ->first();
    
    $callsExpert = $calls->expat_count ?? 0;
    $callsLawyer = $calls->lawyer_count ?? 0;
    
    $totalAmount = $activeSubscribers * $agreement->billing_rate;
    $totalCost = ($callsExpert * 10) + ($callsLawyer * 30);
    
    $invoice = PartnerInvoice::create([
      'agreement_id' => $agreement->id,
      'partner_firebase_id' => $agreement->partner_firebase_id,
      'period' => $period,
      'active_subscribers' => $activeSubscribers,
      'billing_rate' => $agreement->billing_rate,
      'billing_currency' => $agreement->billing_currency,
      'total_amount' => $totalAmount,
      'calls_expert' => $callsExpert,
      'calls_lawyer' => $callsLawyer,
      'total_cost' => $totalCost,
      'status' => 'pending',
      'due_date' => now()->addDays($agreement->payment_terms_days)->toDateString(),
    ]);
    
    // Générer PDF
    $invoice->pdf_path = $this->invoiceService->generatePdf($invoice);
    $invoice->save();
    
    // Envoyer email avec PDF
    Mail::to($agreement->billing_email ?? $agreement->contact_email)
      ->send(new MonthlyInvoiceMail($invoice));
    
    // Programmer suspension J+payment_terms_days
    SuspendOnNonPayment::dispatch($invoice)
      ->delay(now()->addDays($agreement->payment_terms_days));
    
    // Notification Telegram admin
    $this->notifyTelegram('sos-call-invoice-generated', [
      'partner_name' => $agreement->partner_name,
      'period' => $period,
      'amount' => $totalAmount,
      'currency' => $agreement->billing_currency,
    ]);
  }
}
```

**Ajouter dans `app/Console/Kernel.php` (si existe) ou `routes/console.php`** :
```php
Schedule::command('invoices:generate-monthly')->monthlyOn(1, '06:00');
```

## 2.10 Job `SuspendOnNonPayment`

**Fichier** : `app/Jobs/SuspendOnNonPayment.php`

```php
class SuspendOnNonPayment implements ShouldQueue
{
  public function __construct(public PartnerInvoice $invoice) {}
  
  public function handle(): void
  {
    // Recharger l'invoice depuis DB (status peut avoir changé)
    $this->invoice->refresh();
    
    if ($this->invoice->status !== 'pending') return;
    
    DB::transaction(function() {
      // Passer tous les subscribers de l'agreement en suspended
      Subscriber::where('agreement_id', $this->invoice->agreement_id)
        ->where('status', 'active')
        ->update(['status' => 'suspended']);
      
      // Passer invoice en overdue
      $this->invoice->update(['status' => 'overdue']);
    });
    
    // Notifications
    $agreement = $this->invoice->agreement;
    Mail::to($agreement->billing_email ?? $agreement->contact_email)
      ->send(new InvoiceOverdueMail($this->invoice));
    
    $this->notifyTelegram('sos-call-suspension-triggered', [
      'partner_name' => $agreement->partner_name,
      'invoice_id' => $this->invoice->id,
      'amount_overdue' => $this->invoice->total_amount,
    ]);
  }
}
```

## 2.11 Service PDF `InvoiceService`

**Fichier** : `app/Services/InvoiceService.php`

**Vue Blade** : `resources/views/invoices/sos_call_monthly.blade.php`

```php
use Barryvdh\DomPDF\Facade\Pdf;

class InvoiceService
{
  public function generatePdf(PartnerInvoice $invoice): string
  {
    $invoice->load('agreement');
    $pdf = Pdf::loadView('invoices.sos_call_monthly', [
      'invoice' => $invoice,
      'agreement' => $invoice->agreement,
      'invoiceNumber' => 'SOS' . str_replace('-', '', $invoice->period) . '-' . str_pad($invoice->id, 4, '0', STR_PAD_LEFT),
    ]);
    
    $filename = "invoices/{$invoice->partner_firebase_id}/{$invoice->period}.pdf";
    Storage::disk('local')->put($filename, $pdf->output());
    return $filename;
  }
}
```

---

# PARTIE 3 — FIREBASE FUNCTIONS — MODIFICATIONS REQUISES

## 3.1 Nouvelle callable `checkSosCallEligibility`

**Fichier** : `sos/firebase/functions/src/partner/callables/checkSosCallEligibility.ts`

**Rôle** : proxy HTTP entre le frontend et le Partner Engine Laravel pour vérifier éligibilité phone+email.

```typescript
export const checkSosCallEligibility = onCall({
  region: 'us-central1',
  secrets: [PARTNER_ENGINE_URL_SECRET, PARTNER_ENGINE_API_KEY_SECRET],
}, async (req) => {
  const { phone, email } = req.data;
  
  // Validation basique
  if (!phone?.match(/^\+[1-9]\d{8,14}$/)) {
    throw new HttpsError('invalid-argument', 'Invalid phone format');
  }
  if (!email?.includes('@')) {
    throw new HttpsError('invalid-argument', 'Invalid email');
  }
  
  const response = await fetch(`${PARTNER_ENGINE_URL_SECRET.value()}/api/sos-call/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': req.rawRequest.ip,  // Pour rate limiting Laravel
    },
    body: JSON.stringify({ phone, email }),
    signal: AbortSignal.timeout(10000),
  });
  
  return await response.json();
  // Retourne : { status, partner_name?, call_types_allowed?, session_token?, calls_remaining?, attempts_remaining? }
});
```

## 3.2 Export dans `partner/index.ts`

```typescript
export { checkSosCallEligibility } from './callables/checkSosCallEligibility';
```

**Note** : 1 seule callable au lieu de 2 (pas d'OTP). Le matching est immédiat, pas de 2ème étape de vérification.

## 3.4 Modifier `createAndScheduleCallFunction.ts`

**Fichier** : `sos/firebase/functions/src/createAndScheduleCallFunction.ts`

**Ajouter au type `CreateCallRequest`** :
```typescript
sosCallSessionToken?: string;
```

**Avant validation paymentIntent (ligne ~430)** :
```typescript
let isSosCallFree = false;
let sosCallData = null;

if (request.data.sosCallSessionToken) {
  // Vérifier session auprès du Partner Engine
  const sosCheck = await fetch(`${PARTNER_ENGINE_URL}/api/sos-call/check-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Engine-Secret': PARTNER_ENGINE_SECRET.value(),
    },
    body: JSON.stringify({
      session_token: request.data.sosCallSessionToken,
      call_type: providerType, // 'lawyer' | 'expat'
    }),
  }).then(r => r.json());
  
  if (sosCheck.valid) {
    isSosCallFree = true;
    sosCallData = sosCheck;
  }
}

// Skip validation Stripe si SOS-Call free
if (!isSosCallFree) {
  if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
    throw new HttpsError('invalid-argument', 'PaymentIntent ID invalide');
  }
  // ... validation Stripe existante
}
```

**Ajouter à la création de `call_sessions`** :
```typescript
{
  // ... champs existants
  isSosCallFree,
  partnerSubscriberId: sosCallData?.subscriber_id ?? null,
  metadata: {
    ...existingMetadata,
    isSosCallFree,
    sosCallSessionToken: isSosCallFree ? request.data.sosCallSessionToken : undefined,
  },
}
```

**Après création de l'appel (non-bloquant)** :
```typescript
if (isSosCallFree) {
  // Logger auprès du Partner Engine (non-bloquant)
  fetch(`${PARTNER_ENGINE_URL}/api/sos-call/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Engine-Secret': PARTNER_ENGINE_SECRET.value(),
    },
    body: JSON.stringify({
      session_token: request.data.sosCallSessionToken,
      call_session_id: callSession.id,
      call_type: providerType,
      duration_seconds: 0, // Sera mis à jour par onCallCompleted
    }),
  }).catch(err => logger.warn('SOS-Call log failed (non-blocking)', err));
}
```

## 3.5 Modifier `partner/triggers/onCallCompleted.ts`

**Ajouter au début du handler** (après check `wasNotPaid`/`isNowPaid`) :

```typescript
// Skip commission si SOS-Call free (modèle forfait, pas commission)
if (after.metadata?.isSosCallFree === true || after.isSosCallFree === true) {
  logger.info('[partnerOnCallCompleted] SOS-Call free — skip commission', {
    sessionId,
    subscriberId: after.partnerSubscriberId,
  });
  return;
}

// ... code existant (commission partner)
```

## 3.6 Modifier `createPaymentIntent.ts`

**Optionnel** : si on veut que le frontend appelle `createPaymentIntent` même pour SOS-Call (pour uniformité), ajouter en tête :

```typescript
// Check SOS-Call session token
if (data.sosCallSessionToken) {
  return {
    success: true,
    clientSecret: `sos_call_free_${callSessionId}`,  // fake secret
    paymentIntentId: `sos_call_free_${callSessionId}`,
    amount: 0,
    currency,
    serviceType,
    status: 'succeeded',
    expiresAt: new Date(Date.now() + 15*60*1000).toISOString(),
    stripeMode: 'sos_call_free',
    isSosCallFree: true,
  };
}
```

**Recommandation** : **Ne pas passer par `createPaymentIntent` pour SOS-Call**. Le frontend appelle directement `createAndScheduleCall` avec le `sosCallSessionToken`. C'est plus propre.

---

# PARTIE 4 — FRONTEND REACT — PAGES À CRÉER/MODIFIER

## 4.1 Nouvelle page `/sos-call` (6 états — sans OTP)

**Route** : ajouter dans `sos/src/App.tsx`
```typescript
const SosCallPage = lazy(() => import('./pages/SosCall/SosCallPage'));
{ path: "/sos-call", component: SosCallPage, translated: "sos-call" }
```

**Composants à créer** :
```
sos/src/pages/SosCall/
├── SosCallPage.tsx              (page principale, machine à états)
├── PhoneEmailStep.tsx            (État 1 : saisie phone + email)
├── VerifyingStep.tsx             (État 2 : spinner vérification)
├── AccessConfirmedStep.tsx       (État 3 : choix Expert/Avocat)
├── EmailMismatchStep.tsx         (État 4 : phone OK, email KO — re-saisie email)
├── NotFoundStep.tsx              (État 5 : non trouvé + accès standard)
└── CallInProgressStep.tsx        (État 6 : appel en cours, countdown 4 min)

sos/src/hooks/
└── useSosCall.ts                 (logique états + Firebase callable)
```

**Machine à états simplifiée (sans OTP)** :
```typescript
type SosCallState = 
  | {type: 'initial'}
  | {type: 'verifying'}
  | {type: 'confirmed', sessionToken: string, partnerName: string, callTypesAllowed: string, callsRemaining: number|null}
  | {type: 'email_mismatch', partnerName: string, attemptsRemaining: number}
  | {type: 'not_found'}
  | {type: 'quota_reached'}
  | {type: 'rate_limited'}
  | {type: 'call_in_progress', callSessionId: string, scheduledFor: string};

export function useSosCall() {
  const [state, setState] = useState<SosCallState>({type: 'initial'});
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  const checkEligibility = async () => {
    setState({type: 'verifying'});
    const result = await httpsCallable('checkSosCallEligibility')({phone, email});
    const data = result.data as any;
    
    switch (data.status) {
      case 'access_granted':
        setState({type: 'confirmed', sessionToken: data.session_token, ...data});
        break;
      case 'email_mismatch':
        setState({type: 'email_mismatch', partnerName: data.partner_name, attemptsRemaining: data.attempts_remaining});
        break;
      case 'quota_reached':
        setState({type: 'quota_reached'});
        break;
      case 'rate_limited':
      case 'too_many_attempts':
        setState({type: 'rate_limited'});
        break;
      default:
        setState({type: 'not_found'});
    }
  };
  
  const triggerCall = async (callType: 'lawyer' | 'expat') => {
    if (state.type !== 'confirmed') return;
    
    const callData = {
      providerType: callType,
      serviceType: callType === 'lawyer' ? 'lawyer_call' : 'expat_call',
      sosCallSessionToken: state.sessionToken,
      clientPhone: phone,
      // ... autres champs
    };
    
    const result = await httpsCallable('createAndScheduleCall')(callData);
    setState({type: 'call_in_progress', callSessionId: result.data.sessionId, scheduledFor: result.data.scheduledFor});
  };
  
  return { state, phone, setPhone, email, setEmail, checkEligibility, triggerCall };
}
```

### État 4 — `EmailMismatchStep.tsx` (CRITIQUE pour UX)

Affiché quand le phone est reconnu dans la base mais l'email ne matche pas.

```tsx
export function EmailMismatchStep({partnerName, attemptsRemaining, phone, onRetry}) {
  const [newEmail, setNewEmail] = useState('');
  
  return (
    <div className="email-mismatch">
      <Alert type="warning" icon="⚠️">
        <h2>Email incorrect</h2>
        <p>
          Votre numéro de téléphone est reconnu, mais l'email saisi ne correspond pas.
        </p>
        <p className="hint">
          Assurez-vous d'utiliser l'email que vous avez communiqué à <strong>{partnerName}</strong> lors de votre inscription.
        </p>
      </Alert>
      
      <div className="retry-form">
        <input type="tel" value={phone} disabled />  {/* Phone conservé, grisé */}
        <input 
          type="email" 
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          placeholder="Email renseigné chez votre partenaire"
          autoFocus
        />
        <button onClick={() => onRetry(phone, newEmail)}>
          Réessayer
        </button>
        <p className="attempts">Tentatives restantes : {attemptsRemaining}/3</p>
      </div>
      
      <hr />
      
      <div className="fallback-options">
        <p>Vous ne retrouvez pas votre email ?</p>
        <a href={`mailto:contact@${partnerName.toLowerCase()}.com`}>
          📞 Contacter votre partenaire
        </a>
        <a href="/sos-appel" className="standard-access">
          💳 Accès standard 19€/49€
        </a>
      </div>
    </div>
  );
}
```

## 4.2 Page `/mon-acces` (dashboard subscriber) — Phase 7 oubliée

**Route** : `{ path: "/mon-acces", component: SubscriberDashboard, protected: true, role: 'subscriber' }`

**Composants** :
```
sos/src/pages/Subscriber/
├── SubscriberDashboard.tsx    (page principale)
└── SubscriberActivity.tsx     (historique 5 derniers appels)

sos/src/hooks/
└── useSubscriber.ts           (GET /subscriber/me + /subscriber/activity)
```

**Fonctionnalités** :
- Statut accès : "Actif jusqu'au [date]" ou "Expiré"
- Partenaire : "Accès via [partner_name]"
- Types d'aide disponibles
- Appels restants (si limite)
- Historique 5 derniers appels (date, type, durée)
- Bouton "Appeler maintenant" → `/sos-call`

## 4.3 Enrichir `/partner/abonnes` (PartnerSubscribers.tsx)

**Colonnes à ajouter au tableau existant** :
- Statut SOS-Call : badge (actif / expiré / suspendu / quota atteint)
- Code SOS-Call (affiché, copiable)
- Appels utilisés : `calls_expert + calls_lawyer / max` (ou `/∞`)
- Date d'expiration si applicable

**Détail subscriber** :
- Code SOS-Call en lecture seule (large, copiable)
- Bouton "Renvoyer email d'activation"
- Bouton "Suspendre / Réactiver"
- Historique SOS-Call de ce client (date, type d'appel, durée)

## 4.4 Enrichir `/partner/accord` (PartnerAgreement.tsx)

**Nouvelle section "SOS-Call"** à ajouter :
- Tarif mensuel : `billing_rate` + `billing_currency`
- Types d'appels autorisés : `call_types_allowed`
- Limite appels/client : `max_calls_per_subscriber` ou "Illimité"
- Limite subscribers totaux : `max_subscribers` ou "Illimité"
- Prochaine facture estimée : `active_subscribers * billing_rate`
- Date prochaine facturation : 1er du mois suivant
- Délai de paiement : `payment_terms_days` jours

## 4.5 Enrichir `AdminPartnerCreate.tsx` (Section 8)

**Nouvelle section "SOS-Call Billing"** :

| Champ | Type | Défaut |
|-------|------|--------|
| `sos_call_active` | toggle | `true` |
| `billing_rate` | number (2 décimales) | `3.00` |
| `billing_currency` | select | `EUR` |
| `payment_terms_days` | number | `15` |
| `call_types_allowed` | select | `both` |
| `billing_email` | email (optionnel) | `null` (fallback contact_email) |
| `max_calls_per_subscriber` | number (optionnel) | `null` (illimité) |
| `max_subscribers` | number (optionnel) | `null` (illimité) |

## 4.6 Enrichir `AdminPartnerDetail.tsx` (Onglet 6)

**Nouvel onglet "SOS-Call"** (après Overview/Commissions/Clicks/Withdrawals/Settings) :

**Section 1 — Configuration** :
- Toggle `sos_call_active`
- Édition `billing_rate`, `billing_currency`, `payment_terms_days`, `call_types_allowed`, `max_calls_per_subscriber`, `max_subscribers`, `billing_email`
- Bouton "Sauvegarder"

**Section 2 — Stats du mois en cours** :
- Clients actifs ce mois
- Appels expert déclenchés
- Appels avocat déclenchés
- Montant facture estimée : `active_subscribers × billing_rate`
- Coût interne SOS-Expat : `(calls_expert × 10) + (calls_lawyer × 30)`
- Marge estimée : `montant_facture - cout_interne`

**Section 3 — Historique factures** :
- Tableau : Période / Clients / Montant / Statut (pending/paid/overdue) / Bouton PDF
- Bouton "Générer facture manuelle" (date picker du mois)

**Section 4 — Actions** :
- Bouton "Suspendre tous les clients" (rouge, confirmation)
- Bouton "Réactiver tous les clients" (vert, si facture payée)

---

# PARTIE 5 — RÉPONSE AUX QUESTIONS UX

## 5.1 Question 1 : Skip page paiement + compte à rebours immédiat

### Réponse : OUI, exactement comme tu l'imagines.

**Flow simplifié (sans OTP)** :

```
Étape A — /sos-call (saisie)
  Client tape phone + email
  → checkEligibility() → callable checkSosCallEligibility → Laravel POST /sos-call/check
  → Matching direct phone + email (pas d'OTP, pas de SMS)
  → Si match complet: session_token généré (Redis TTL 15 min)
  → État = 'confirmed' en moins de 500ms

Étape B — Choix type d'appel (Expert / Avocat)
  Badge vert "✅ Couvert par {{partner_name}}"
  Boutons selon call_types_allowed
  Clic sur "Expert Expat" ou "Avocat Local"
  
  ╔══════════════════════════════════════════════════════════╗
  ║  ICI : ZÉRO PAGE PAIEMENT                                ║
  ║  → Appel direct à createAndScheduleCall                  ║
  ║    avec sosCallSessionToken (pas de paymentIntentId)     ║
  ║  → Backend Firebase :                                    ║
  ║    1. Vérifie session auprès Partner Engine              ║
  ║    2. Skip validation Stripe                             ║
  ║    3. Crée call_sessions avec isSosCallFree=true         ║
  ║    4. Réserve provider (lawyer/expat)                    ║
  ║    5. Planifie Twilio conference dans 240 secondes       ║
  ║  → Retourne sessionId + scheduledFor (timestamp)         ║
  ╚══════════════════════════════════════════════════════════╝

Étape C — Compte à rebours DÉMARRE IMMÉDIATEMENT (240s INCHANGÉ)
  Composant CallInProgress :
    "⏱️ Votre appel commence dans 3:47"
    "Gardez votre téléphone à portée"
    "Prêt à recevoir l'appel au +33 6** *** **78"
  Timer décompte de 240s → 0s (CALL_DELAY_SECONDS inchangé)
  À T-0 : Twilio appelle client puis provider (conférence)
```

**Durée totale de l'UX client** : ~2 secondes de saisie + 500ms matching + 240s countdown = appel qui sonne en moins de 5 minutes.

### Implémentation UX côté frontend :

```tsx
// AccessConfirmedStep.tsx
<div className="confirmed-screen">
  <Badge>✅ Couvert par {partnerName}</Badge>
  <p>Inclus dans votre contrat — gratuit</p>
  {callsRemaining !== null && (
    <p>{callsRemaining} appel(s) restant(s) ce mois</p>
  )}
  
  {['both', 'expat_only'].includes(callTypesAllowed) && (
    <button onClick={() => triggerCall('expat')}>
      👤 Expert Expat (démarches, visa, admin)
    </button>
  )}
  {['both', 'lawyer_only'].includes(callTypesAllowed) && (
    <button onClick={() => triggerCall('lawyer')}>
      ⚖️ Avocat Local (arrestation, accident, litige)
    </button>
  )}
</div>

// CallInProgressStep.tsx
<div className="call-in-progress">
  <h1>Votre appel {callType === 'lawyer' ? 'avocat' : 'expert'} arrive</h1>
  <CountdownTimer seconds={240} onComplete={() => setState('ringing')} />
  <p>Gardez votre téléphone {maskedPhone} à portée de main</p>
  <p>Vous allez recevoir un appel de SOS-Expat</p>
</div>
```

### Délai backend actuel : `CALL_DELAY_SECONDS = 240` (4 minutes)

**Ce délai est INCHANGÉ pour SOS-Call**. Cloud Tasks programme Twilio à T+240s pour donner le temps au provider de recevoir sa notif SMS et être prêt. **Même UX que le flow standard actuel**.

## 5.2 Question 2 : Plan de secours si phone match mais email ne match pas

### La solution retenue : page dédiée "Email incorrect"

Quand le backend retourne `status: 'email_mismatch'` (phone trouvé dans la base mais email différent), on affiche un **écran dédié** avec un message pédagogique et un formulaire de re-saisie.

### Le problème réel

Scénarios où ça peut arriver :
1. Client a changé d'email depuis son inscription chez le partenaire
2. Partenaire a fait une typo dans l'email (jean.dupnt@email.com au lieu de jean.dupont@email.com)
3. Client utilise un alias email (jean+partner@email.com vs jean@email.com)
4. Client tape un email différent par oubli (perso vs pro)
5. Client ne se souvient plus du bon email
6. Client est en vraie urgence et ne peut pas chercher

**C'est un cas critique** : un client légitimement couvert qui ne peut pas accéder à l'urgence.

### Solution retenue — 2 cas distincts

Le backend distingue **2 cas** différents pour une UX adaptée à chacun :

#### CAS A : `email_mismatch` (phone reconnu, email différent)

**Page dédiée "Email incorrect"** :
- Message pédagogique : "Votre numéro est reconnu, mais l'email ne correspond pas. Assurez-vous d'utiliser l'email fourni à **{{partner_name}}** lors de votre inscription."
- Phone pré-rempli et grisé (inutile de le retaper)
- Input email vide pour re-saisie
- Compteur de tentatives affiché (max 3)
- Après 3 échecs → blocage 10 min + bouton "Contacter le partenaire"

**Sécurité** :
- Rate limit : 5 tentatives max par phone sur 15 min
- Blocage IP : 10 tentatives max par IP sur 15 min
- Le message ne révèle pas l'email enregistré (pas d'info leak)
- Audit log de chaque tentative

#### CAS B : `not_found` (ni phone ni email trouvé)

**Page "Non trouvé"** avec 3 voies :
1. **Réessayer** : formulaire vierge (au cas où typo sur les 2 champs)
2. **Accès standard payant** : redirection `/sos-appel` → flux standard 19€/49€ (déjà existant)
3. **Contacter le support** : formulaire d'aide urgente (Option humaine)

### UI de l'État "Non trouvé"

```tsx
// NotFoundStep.tsx
<div className="not-found-screen">
  <Alert type="info">
    Ces informations ne correspondent à aucun accès SOS-Call actif.
  </Alert>
  
  <p className="hint">
    Vérifiez que vous utilisez bien les coordonnées (téléphone + email)
    que vous avez communiquées à votre partenaire lors de l'inscription.
  </p>
  
  <div className="actions">
    <button onClick={onRetry} className="secondary">
      Réessayer
    </button>
    
    <a href="/sos-appel" className="primary">
      💳 Accès standard ({priceLocal})
    </a>
  </div>
  
  <hr />
  
  <div className="support-section">
    <p>Vous pensez être couvert par un partenaire mais rencontrez un problème ?</p>
    <button onClick={onContactSupport}>
      📧 Nous contacter
    </button>
  </div>
</div>
```

### Sécurité globale sans OTP

**Pourquoi le matching phone+email direct est suffisant comme mesure anti-fraude** :

| Vecteur d'attaque | Difficulté | Mitigation existante |
|-------------------|------------|----------------------|
| Deviner phone d'un client réel | Moyenne (entourage) | — |
| Deviner email d'un client réel | Élevée (à moins de le connaître personnellement) | — |
| Deviner les DEUX ensemble | Très élevée | Rate limit 5 tentatives/15 min par phone |
| Brute force par IP | Bloqué | Rate limit 10/min par IP |
| Attaque de masse | Bloqué | Captcha invisible (hCaptcha) sur premier check |
| Abus "entourage" (conjoint utilise les infos) | Faible impact | Coût mutualisé dans forfait partenaire (10€/30€ absorbé) |

**Conclusion** : pas besoin d'OTP. Le risque résiduel est acceptable dans le cadre B2B partenaire (pas d'enjeu financier direct pour le client, coût mutualisé dans forfait mensuel).

---

# PARTIE 5.3 — GARANTIE "NE RIEN CASSER" — 2 CHEMINS PARALLÈLES

**Principe fondamental** : le flow existant reste **100% intact**. Le système SOS-Call est un **chemin parallèle** qui coexiste sans jamais modifier le comportement du flow standard.

## Les 2 chemins coexistants

```
╔════════════════════════════════════════════════════════════════╗
║  CHEMIN A — FLOW STANDARD (NE CHANGE PAS, ZÉRO MODIFICATION)   ║
║                                                                  ║
║  /sos-appel ou /appel-expatrie                                  ║
║    → Choix du provider (lawyer/expat)                           ║
║    → BookingRequest.tsx (formulaire)                            ║
║    → CallCheckout.tsx (page paiement)                           ║
║    → createPaymentIntent → Stripe (webhook succeeded)           ║
║    → createAndScheduleCall(paymentIntentId)                     ║
║    → Twilio conference à T+240s                                 ║
║                                                                  ║
║  Client paie 19€/49€ (ou $25/$55)                               ║
╚════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════╗
║  CHEMIN B — NOUVEAU SOS-CALL (PARALLÈLE)                         ║
║                                                                  ║
║  /sos-call (nouvelle page publique)                             ║
║    → Formulaire phone + email                                   ║
║    → checkSosCallEligibility → Partner Engine Laravel           ║
║    → Si match exact: sosCallSessionToken (Redis 15 min)         ║
║    → Badge "Couvert par {{partner_name}}"                       ║
║    → Choix Expert/Avocat                                        ║
║    → createAndScheduleCall(sosCallSessionToken)  ← SANS Stripe  ║
║      ├─ Backend détecte le token → bypass Stripe                ║
║      ├─ Skip paymentIntentId validation                         ║
║      └─ Crée call_sessions avec isSosCallFree=true              ║
║    → Twilio conference à T+240s (MÊME délai)                    ║
║                                                                  ║
║  Client ne paie rien. Partenaire facturé en fin de mois.        ║
╚════════════════════════════════════════════════════════════════╝
```

## Justification technique — pourquoi A n'est pas cassé

### Fichiers NON modifiés (flow A intact)
- ✅ `sos/src/pages/SOSCall.tsx` (sélection provider)
- ✅ `sos/src/pages/BookingRequest.tsx` (formulaire)
- ✅ `sos/src/pages/CallCheckout.tsx` (page paiement)
- ✅ `sos/firebase/functions/src/createPaymentIntent.ts` (création PaymentIntent Stripe)
- ✅ Toutes les routes `/sos-appel`, `/appel-expatrie`, `/call-checkout`, `/booking-request` (inchangées)

### Fichiers modifiés (avec ajout OPTIONNEL, flow A préservé)

**`createAndScheduleCallFunction.ts`** : 
```typescript
// Ajout d'un champ optionnel au type
interface CreateCallRequest {
  // ... tous les champs existants
  sosCallSessionToken?: string;  // NOUVEAU, optionnel
}

// Ajout en tête de la fonction (block if)
if (request.data.sosCallSessionToken) {
  // Nouveau chemin SOS-Call : skip Stripe, vérifier le token Laravel
  const sosCheck = await fetch(`${PARTNER_ENGINE_URL}/api/sos-call/check-session`, {...});
  if (sosCheck.valid) {
    isSosCallFree = true;
  }
}

// Branchement SEULEMENT si pas SOS-Call
if (!isSosCallFree) {
  // TOUT le code existant Stripe (paymentIntentId validation, etc.)
  // ← Inchangé, exécuté exactement comme avant pour le flow standard
}
```

**Garantie** : si `sosCallSessionToken` est absent (= tous les appels flow A), le nouveau block `if` est ignoré et le code existant s'exécute **identiquement** à aujourd'hui.

**`partner/triggers/onCallCompleted.ts`** :
```typescript
// Ajout d'un early return en tête
if (after.isSosCallFree === true) {
  logger.info('SOS-Call free — skip commission');
  return;
}

// TOUT le code commission existant continue pour le flow standard
```

**Garantie** : les appels flow A n'ont pas `isSosCallFree`, donc le return n'est pas déclenché, le code commission tourne normalement.

## Pattern prouvé : AAA profiles

Ce pattern "ajout optionnel sans casser" existe déjà depuis longtemps dans le code pour les profils AAA (test/démo) :

**`createAndScheduleCallFunction.ts:841-851`** :
```typescript
const isAAA = providerId.startsWith('aaa_') || providerUserData?.isAAA === true;
providerForcedAIAccess = isAAA || providerUserData?.forcedAIAccess === true;
// AAA bypass logic...
```

Cette logique AAA coexiste avec le flow normal depuis 2 ans sans jamais l'avoir cassé. Le SOS-Call suit exactement le même pattern.

---

# PARTIE 5.4 — MÉTHODES D'INSCRIPTION DES CLIENTS PAR LE PARTENAIRE

Le partenaire dispose de **4 méthodes** pour enregistrer ses clients dans SOS-Expat, du plus simple au plus automatisé.

## Méthode 1 — Ajout manuel via UI (✅ EXISTE DÉJÀ)

**Route** : `/partner/abonnes` (page `PartnerSubscribers.tsx`)
**Bouton** : "Ajouter un client"
**Formulaire minimal** :
- Prénom, nom
- Email (obligatoire, unique par partenaire)
- Téléphone (E.164 normalisé automatiquement via IntlPhoneInput)
- Pays (ISO 2 lettres)
- Langue (fr/en/es/de/pt/ar/zh/ru/hi)
- Date d'expiration (optionnel, sinon hérite de l'agreement)

**Flux à la validation** :
1. Appel `POST /partner/subscribers` (Laravel, auth Firebase)
2. `SubscriberService::create()` → création subscriber en base
3. Génération automatique du `sos_call_code` (format `AXA-2026-X7K2P`)
4. Status = `active` immédiatement
5. Dispatch du job `SendSosCallActivationEmail` (queue Redis)
6. Email d'activation envoyé au client dans sa langue

**Idéal pour** : petits partenaires, ajouts ponctuels, tests, démos.

## Méthode 2 — Import CSV via UI (✅ EXISTE DÉJÀ)

**Route** : `/partner/abonnes` → bouton "Importer CSV"
**Format CSV attendu** :
```csv
email,first_name,last_name,phone,country,language,expires_at
jean.dupont@email.com,Jean,Dupont,+33612345678,FR,fr,2026-12-31
marie.martin@email.com,Marie,Martin,+33623456789,FR,fr,
...
```

**Traitement asynchrone** :
1. Upload via multipart/form-data → `POST /partner/subscribers/import`
2. CSV stocké temporairement → dispatch `ProcessCsvImport` job
3. Job parse ligne par ligne (chunked, 1000 rows/chunk)
4. Pour chaque ligne : création subscriber + génération code + envoi email
5. Logs erreurs dans `csv_imports.error_details` (JSONB)
6. Rapport disponible dans `/partner/abonnes` → onglet "Imports CSV"

**Capacités** :
- Jusqu'à 50k lignes par fichier
- Gestion doublons (skip avec log)
- Validation E.164 phone + email format
- Rollback automatique en cas d'erreur critique

**Idéal pour** : partenaires moyens (100-10k clients), ajouts trimestriels ou annuels.

## Méthode 3 — API REST Partenaire (✅ EXISTE DÉJÀ)

Pour les partenaires qui veulent **automatiser via leur propre système**.

**Authentification** : Firebase ID token avec custom claim `role: 'partner'` (Bearer token)

**Endpoints Laravel disponibles** :
```
POST   /api/partner/subscribers               Créer 1 subscriber
POST   /api/partner/subscribers/import        Import CSV via API (multipart)
GET    /api/partner/subscribers               Lister (paginé curseur)
GET    /api/partner/subscribers/{id}          Détail + 20 dernières activités
PUT    /api/partner/subscribers/{id}          Modifier profil
DELETE /api/partner/subscribers/{id}          Soft delete
POST   /api/partner/subscribers/{id}/resend-invitation  Renvoyer email
GET    /api/partner/subscribers/export        Export JSON
```

**Rate limit** : 60 requêtes/minute par partenaire (extensible sur demande)

**Exemple d'usage (Node.js côté partenaire)** :
```javascript
// Créer un client
const response = await fetch('https://partner-engine.life-expat.com/api/partner/subscribers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${firebaseIdToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'jean.dupont@email.com',
    first_name: 'Jean',
    last_name: 'Dupont',
    phone: '+33612345678',
    country: 'FR',
    language: 'fr',
    expires_at: '2026-12-31',
  }),
});

const result = await response.json();
// {
//   success: true,
//   subscriber: {
//     id: 12345,
//     sos_call_code: "AXA-2026-X7K2P",
//     status: "active",
//     activation_email_sent: true,
//     ...
//   }
// }
```

**Idéal pour** : partenaires avec CRM custom, ERP, workflows internes qui veulent synchroniser automatiquement.

## Méthode 4 — Webhook entrant depuis CRM (❌ PHASE 2, pas MVP)

Pour les **très gros partenaires** (AXA, Visa, entreprises avec Salesforce/SAP/HubSpot) qui ont des **milliers de nouveaux contrats par jour**.

**Architecture** :
```
CRM Partenaire (Salesforce / SAP / HubSpot / custom)
  │
  │  événement "new_contract_signed" ou "subscriber_added"
  ▼
Webhook configuré côté CRM → Partner Engine
  │
  ▼
POST https://partner-engine.life-expat.com/api/v2/partner/webhooks/subscribers
Headers:
  X-Partner-API-Key: [clé par partenaire]
  X-Webhook-Signature: [HMAC SHA256 pour auth]
Body:
  {
    external_id: "CRM-AXA-123456",
    email: "...",
    phone: "...",
    ...
    coverage_start: "2026-01-01",
    coverage_end: "2026-12-31"
  }
  │
  ▼
Partner Engine :
  1. Vérifie signature HMAC
  2. Déduplique par external_id (unique per partner)
  3. Crée ou met à jour subscriber
  4. Génère sos_call_code si nouveau
  5. Envoie email d'activation
  6. Répond 200 avec subscriber_id SOS-Expat
  │
  ▼
CRM Partenaire stocke subscriber_id
  → synchronisation bidirectionnelle permanente
```

**Sécurité** :
- HMAC SHA256 sur le payload (signature vérifiée côté Partner Engine)
- IP allowlist (IPs autorisées du CRM partenaire)
- Rate limit 1000 req/min (suffisant pour AXA)

**Connecteurs natifs à développer (Phase 3)** :
- Salesforce Managed Package
- SAP RFC adapter
- HubSpot Workflow action
- Générique webhook-compatible

**Idéal pour** : AXA (1M+ clients potentiels), Visa, entreprises Fortune 500.

## Récapitulatif des 4 méthodes

| Méthode | Volume typique | État | Effort côté partenaire | Temps réel ? |
|---------|----------------|------|------------------------|--------------|
| **1. UI manuelle** | 1-50 clients | ✅ Existe | Clics (zéro tech) | Instantané |
| **2. Import CSV UI** | 50-10k clients | ✅ Existe | Excel → Export CSV | Batch |
| **3. API REST** | 100-50k clients | ✅ Existe | Dev backend côté partenaire | Temps réel |
| **4. Webhook CRM** | 10k-1M+ clients | ❌ Phase 2 | Config CRM + webhook | Temps réel |

**Pour le MVP SOS-Call** : méthodes 1, 2 et 3 déjà disponibles (aucun dev nécessaire). Méthode 4 à prévoir quand on signe des comptes Fortune 500.

---

# PARTIE 5.5 — CONSOLE ADMIN FILAMENT 3 ⭐ NOUVEAU

**Objectif** : avoir une console d'administration dédiée à la gestion des partenaires B2B, **100% indépendante de Firebase et Google Cloud**, sur `admin.sos-expat.com`.

## 5.5.1 Installation dans Partner Engine Laravel existant

**Un seul projet Laravel, 3 entrées (API + Page client + Console admin)** — pas de duplication.

```bash
cd /opt/partner-engine
composer require filament/filament:^3.2
php artisan filament:install --panels
php artisan make:filament-user  # créer l'admin initial
```

**Configuration** :
- Panel : `app/Providers/Filament/AdminPanelProvider.php`
- Path : `/admin` (ou domain : `admin.sos-expat.com`)
- Auth : email + password + 2FA TOTP
- Theme : Tailwind CSS, mode sombre/clair

**Sous-domaine Nginx** :
```nginx
server {
  server_name admin.sos-expat.com;
  root /opt/partner-engine/public;
  # ... SSL Let's Encrypt, PHP-FPM, etc.
}
```

## 5.5.2 Ressources Filament à créer

### `PartnerResource` — Gestion complète des partenaires

**Liste (TableView)** :
- Colonnes : Logo, Nom, Catégorie, Status (badge), Clients actifs, Revenus mois, Dernière activité
- Filtres : status, catégorie, pays, avec/sans SOS-Call actif
- Actions : Voir détail, Suspendre, Réactiver, Générer facture, Export CSV
- Bulk actions : Export multiple, Suspendre groupe

**Formulaire (Create/Edit)** organisé en **onglets** :
1. **Informations générales** : nom, email, téléphone, site web, catégorie, langue
2. **Accord commercial** : date début/fin, status, notes
3. **Config SOS-Call** : `billing_rate`, `billing_currency`, `payment_terms_days`, `call_types_allowed`, `max_calls_per_subscriber`, `max_subscribers`, `default_subscriber_duration_days`, `max_subscriber_duration_days`, `billing_email`
4. **Commissions (legacy)** : config commission à l'acte (si partenaire utilise aussi le modèle commission)
5. **Discount (legacy)** : config discount pour leurs clients

**Page Détail (ViewRecord)** :
Onglets :
- Vue d'ensemble (stats + graphiques)
- Subscribers (relation)
- Factures (relation)
- Activité (audit log)
- Appels SOS-Call (timeline)
- Configuration (éditable inline)

### `SubscriberResource` — Vue globale tous subscribers

**Liste** :
- Colonnes : Partenaire, Nom complet, Email, Téléphone, Code SOS-Call, Statut, Appels utilisés, Expiration
- Filtres : partenaire, statut, quota atteint, expiration proche, langue
- Search : nom, email, téléphone, code
- Bulk actions : Export CSV, Suspendre/Réactiver groupe, Prolonger expiration

**Formulaire** :
- Partenaire (select searchable)
- Agreement (select, filtré par partenaire)
- Profil : prénom, nom, email, téléphone (IntlTelInput custom)
- SOS-Call : code (read-only, généré auto), activated_at, expires_at
- Compteurs (read-only) : calls_expert, calls_lawyer
- Status (select : active / suspended / expired)

**Actions spéciales** :
- "Régénérer code SOS-Call" (si perdu)
- "Renvoyer email d'activation"
- "Voir historique d'appels"

### `InvoiceResource` — Factures mensuelles

**Liste** :
- Colonnes : Période (YYYY-MM), Partenaire, Clients actifs, Montant, Devise, Statut (badge coloré), Due date, Paid at
- Filtres : statut (pending/paid/overdue), partenaire, période, devise
- Bulk actions : Export CSV, Marquer comme payée en masse

**Actions** :
- Voir PDF (embed preview)
- Télécharger PDF
- Marquer comme payée (avec champ "Méthode paiement" + "Note")
- Renvoyer email facture
- Annuler facture

**Création manuelle** :
- Sélection partenaire + période
- Génération automatique PDF à la création

### `PartnerApplicationResource` — Candidatures B2B

Remplace l'équivalent React actuel. Mêmes fonctionnalités :
- Liste candidatures avec statut (pending/contacted/accepted/rejected)
- Inline notes
- Action "Convertir en Partenaire" qui pré-remplit le formulaire PartnerResource

### `FraudAlertResource` — Alertes fraude

Remplace `AdminPartnersFraud.tsx` (352 lignes React) :
- Types : high_ratio, circular_referral, multiple_accounts, suspicious_pattern
- Severity : low/medium/high/critical
- Actions : dismiss, take_action, block partner

### `PromoWidgetResource` — Widgets promo

Remplace `AdminPartnersWidgets.tsx` (437 lignes React) :
- CRUD widgets (button/banner)
- 7 dimensions standards
- UTM tracking
- Preview HTML embed code
- Stats par widget (views, clicks, conversions)

### `AgreementResource` — Relation depuis PartnerResource

Généralement accédé depuis l'onglet "Accord" du partenaire, mais aussi listable globalement.

### `AuditLogResource` — Timeline audit (read-only)

- Liste paginée des actions
- Filtres : actor_role, action, resource_type, date range
- Search dans details (JSON)
- Export CSV

### `PartnerConfigResource` — Config système (singleton)

Page unique pour `partner_config/current` :
- Toggle `isSystemActive`
- Toggle `withdrawalsEnabled`
- Défauts globaux : commission, hold period, release delay
- Flags visibilité (isPartnerListingPageVisible, etc.)

## 5.5.3 Widgets Dashboard Filament

Page d'accueil `admin.sos-expat.com` :

```
┌─────────────────────────────────────────────────────────────────┐
│  DASHBOARD SOS-EXPAT ADMIN                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐   │
│  │ Partenaires  │ Subscribers  │ Revenus mois │ Appels mois  │   │
│  │ actifs       │ actifs       │              │              │   │
│  │   12         │  45 230      │  135 690€    │    687       │   │
│  │ ↑ +2 ce mois │ ↑ +3240      │ ↑ +15%       │ ↑ +12%       │   │
│  └──────────────┴──────────────┴──────────────┴──────────────┘   │
│                                                                   │
│  ────────────────────────────────────────────────────────────   │
│                                                                   │
│  📈 REVENUS MENSUELS (12 derniers mois)                          │
│  [Chart Line : evolution revenus EUR + USD]                      │
│                                                                   │
│  ────────────────────────────────────────────────────────────   │
│                                                                   │
│  🏆 TOP 5 PARTENAIRES              🌍 TOP 10 PAYS D'UTILISATION │
│  1. AXA Expatriate  24 900€        🇹🇭 Thaïlande  187 appels  │
│  2. Visa Infinite   18 200€        🇦🇪 Dubai      142 appels  │
│  3. Santa Fe        12 500€        🇸🇬 Singapour   98 appels  │
│  4. Kuoni Voyages    9 800€        🇺🇸 USA         76 appels  │
│  5. Allied Mvg       8 400€        🇯🇵 Japon       54 appels  │
│                                                                   │
│  ────────────────────────────────────────────────────────────   │
│                                                                   │
│  💰 FACTURES EN ATTENTE           ⚠️ ALERTES FRAUDE ACTIVES     │
│  Avril 2026 — AXA        🔴 24 900€  3 alertes haute sévérité   │
│  Avril 2026 — Visa       🟡 18 200€  2 alertes moyenne          │
│  Mars 2026 — Kuoni       🔴 Overdue!  [Voir toutes →]            │
│                                                                   │
│  ────────────────────────────────────────────────────────────   │
│                                                                   │
│  📋 DERNIERS APPELS SOS-CALL                                     │
│  15/04 14:23  Jean Dupont (AXA)   🇹🇭 TH  Avocat   18 min        │
│  15/04 13:47  Marie Martin (Visa) 🇦🇪 AE  Expert   22 min        │
│  [Voir tous →]                                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Widgets à créer** :

| Widget | Type | Data source |
|--------|------|-------------|
| `StatsOverviewWidget` | StatsOverview (4 cards) | Agrégats PostgreSQL |
| `RevenueChartWidget` | Line chart 12 mois | `partner_invoices` |
| `TopPartnersWidget` | Table top 5 | `partner_monthly_stats` |
| `TopCountriesWidget` | Table top 10 | `subscriber_activities` |
| `PendingInvoicesWidget` | Table avec alertes | `partner_invoices` WHERE status in (pending, overdue) |
| `FraudAlertsWidget` | Table compacte | `fraud_alerts` WHERE status = active |
| `RecentCallsWidget` | Table derniers 20 | `subscriber_activities` WHERE is_sos_call = true |

## 5.5.4 Avantages concrets Filament vs React SPA

| Aspect | React SPA actuel | Filament 3 |
|--------|------------------|------------|
| **Temps de dev CRUD basique** | 1-2 jours par page | 1-2 heures par ressource |
| **Tableaux avec filtres** | À coder manuellement | Natif (search, sort, filter) |
| **Export CSV** | À coder | Natif (1 ligne) |
| **Formulaires complexes** | React Hook Form + validation | Déclaratif natif |
| **Relations (has-many)** | À implémenter | Natif (RelationManager) |
| **Policies/Permissions** | À coder | Natif (Laravel Gate) |
| **Dark mode** | À implémenter | Natif |
| **Notifications toast** | react-hot-toast | Natif (avec undo) |
| **Bulk actions** | À coder | Natif |
| **Authentification 2FA** | Firebase | Natif Filament |

## 5.5.5 Stratégie de coexistence (PAS de migration obligatoire)

**Principe ferme** : les pages React existantes **NE SONT PAS SUPPRIMÉES**. Filament vient **en parallèle** comme outil admin complémentaire, spécialisé SOS-Call.

### Phase 1 — MVP SOS-Call (ce qu'on fait maintenant)

**Filament = spécialisé SOS-Call** :
- `InvoiceResource` (factures mensuelles — NOUVEAU, pas d'équivalent React)
- `SubscriberResource` (vue globale subscribers avec compteurs SOS-Call)
- `PartnerSosCallConfigResource` (config SOS-Call par partenaire : billing_rate, duration, quotas)
- Widgets dashboard dédiés SOS-Call (revenus, factures en attente, appels gratuits)

**SPA React reste l'outil principal pour les 8 pages admin partenaires + 2 pages cachées** :
- `/admin/partners` (liste) ← REGARDE TOUJOURS ICI pour voir les partenaires
- `/admin/partners/:partnerId` (détail 5 onglets) ← ajoute un 6ème onglet "SOS-Call"
- `/admin/partners/create` (nouveau) ← ajoute une section 8 "SOS-Call Billing"
- `/admin/partners/applications` (candidatures)
- `/admin/partners/fraud` (352L, parfaite, **NE PAS TOUCHER**)
- `/admin/partners/config` (configuration globale)
- `/admin/partners/stats` (289L, parfaite, **NE PAS TOUCHER**)
- `/admin/partners/widgets` (437L, parfaite, **NE PAS TOUCHER**)

### Phase 2 — Optionnel, plus tard (PAS OBLIGATOIRE)

Si tu trouves Filament plus agréable après 2-3 mois, tu **POURRAIS** migrer certaines pages vers Filament. Mais **rien ne t'y oblige**. Les 10 pages React actuelles sont stables, testées, opérationnelles et rapportent de la valeur business.

**Ce qui ne sera JAMAIS supprimé** :
- `AdminPartnersFraud.tsx` (352L de logique custom)
- `AdminPartnersStats.tsx` (289L avec graphiques)
- `AdminPartnersWidgets.tsx` (437L de CRUD complet)
- `AdminPartnerDetail.tsx` (1100L avec 5 onglets)
- `AdminPartnersList.tsx` (862L)
- `AdminPartnerCreate.tsx` (700L)
- `AdminPartnerApplications.tsx` (468L)
- `AdminPartnersConfig.tsx` (29L, redirect)

**Total préservé : ~4200 lignes de code React qui fonctionnent en prod.**

## 5.5.6 Fichiers à créer pour Filament MVP

```
partner-engine/
├── app/
│   ├── Filament/
│   │   ├── Resources/
│   │   │   ├── PartnerResource.php                       (~400 lignes)
│   │   │   ├── SubscriberResource.php                    (~300 lignes)
│   │   │   ├── InvoiceResource.php                       (~250 lignes)
│   │   │   ├── PartnerApplicationResource.php            (~200 lignes)
│   │   │   ├── FraudAlertResource.php                    (~150 lignes)
│   │   │   ├── PromoWidgetResource.php                   (~200 lignes)
│   │   │   ├── AuditLogResource.php                      (~100 lignes)
│   │   │   └── PartnerConfigResource.php                 (~150 lignes)
│   │   ├── Widgets/
│   │   │   ├── StatsOverviewWidget.php                   (~80 lignes)
│   │   │   ├── RevenueChartWidget.php                    (~120 lignes)
│   │   │   ├── TopPartnersWidget.php                     (~80 lignes)
│   │   │   ├── TopCountriesWidget.php                    (~80 lignes)
│   │   │   ├── PendingInvoicesWidget.php                 (~100 lignes)
│   │   │   ├── FraudAlertsWidget.php                     (~80 lignes)
│   │   │   └── RecentCallsWidget.php                     (~80 lignes)
│   │   └── Pages/
│   │       └── Dashboard.php                              (~50 lignes)
│   └── Providers/
│       └── Filament/
│           └── AdminPanelProvider.php                     (~100 lignes)
└── config/
    └── filament.php                                       (config par défaut)
```

**Total estimé Filament MVP** : ~2500 lignes, **5 jours de dev** par un dev Laravel compétent (la majorité étant déclaratif/configuratif).

---

# PARTIE 5.6 — VÉRIFICATION FINALE EXHAUSTIVE (v3)

Audit complet croisé effectué — résultats confirmés.

## 5.6.1 Structure EXACTE du menu admin partenaires

**Source** : `src/config/adminMenu.ts:1051-1104`

```
📁 Partenariat (parent, header non cliquable)
  └─ 📁 Partenaires (groupe)
     ├─ Liste des partenaires       → /admin/partners             [AdminPartnersList 862L]
     ├─ Candidatures                 → /admin/partners/applications [AdminPartnerApplications 468L]
     ├─ Nouveau partenaire           → /admin/partners/create       [AdminPartnerCreate 700L]
     ├─ Fraude Partenaires 🟡 NEW    → /admin/partners/fraud        [AdminPartnersFraud 351L]
     ├─ Configuration                → /admin/partners/config       [AdminPartnersConfig 29L]
     └─ Statistiques                 → /admin/partners/stats        [AdminPartnersStats 288L]
```

**Total visible dans le menu : 8 items** (1 parent + 1 groupe + 6 items réels)

## 5.6.2 Pages cachées du menu mais opérationnelles

| Page | Route | Lignes | Accès |
|------|-------|--------|-------|
| **Widgets** | `/admin/partners/widgets` | 436 | Placé dans `Marketing → Ressources → Widgets` (pas avec les autres partners) |
| **Détail partenaire** | `/admin/partners/:partnerId` | 1100 | Volontairement non-menué. Accès par clic sur un partenaire dans la liste. 5 onglets : Vue d'ensemble, Commissions, Clics, Retraits, Paramètres |

**Total pages admin partenaires opérationnelles : 10** (8 dans menu + 2 cachées accessibles par route/navigation)

**Total lignes code admin partenaires : ~4234 lignes** (non négociables, on garde tout)

## 5.6.3 Pages dashboard partenaire (côté partenaire)

**Source** : `src/pages/Partner/` + `src/components/Partner/Layout/PartnerDashboardLayout.tsx:54-109`

**11 pages opérationnelles, 9 items dans le menu partenaire** :

```
PARTNER DASHBOARD MENU (src/components/Partner/Layout/PartnerDashboardLayout.tsx)
├─ Tableau de bord      → /partner/tableau-de-bord        (PartnerDashboard 276L)
├─ Mes gains            → /partner/gains                   (PartnerEarnings 407L)
├─ Mes abonnés          → /partner/abonnes                 (PartnerSubscribers 755L)
├─ Mon accord           → /partner/accord                  (PartnerAgreement 293L)
├─ Statistiques         → /partner/statistiques            (PartnerClicks 207L)
├─ Widgets              → /partner/widgets                 (PartnerWidgets 372L)
├─ Ressources           → /partner/ressources              (PartnerResources 20L)
├─ Mon profil           → /partner/profil                  (PartnerProfile 605L)
└─ Paiements            → /partner/paiements               (PartnerPayments 622L)

Pages hors menu (accès par navigation ou redirection) :
   PartnerSuspended      → /partner/suspendu (112L)  — auto-redirect si banni/suspendu
   PartnerTelegramOnboarding → /partner/telegram (22L) — onboarding Telegram obligatoire
```

**Total : ~3691 lignes de code pour le dashboard partenaire. On garde tout, on enrichit légèrement 2 pages** (`PartnerSubscribers` + `PartnerAgreement`) pour afficher les infos SOS-Call.

## 5.6.4 Dashboard subscriber (client du partenaire) — INEXISTANT

**Vérifications exhaustives** :
- ❌ Dossier `src/pages/Subscriber/` : **n'existe pas**
- ❌ Routes `/subscriber`, `/abonne`, `/mon-acces`, `/membre` : **0 occurrence**
- ❌ Composants `SubscriberDashboard`, `MemberPage` : **0 occurrence**

**Backend 100% prêt mais inutilisé** :
- ✅ `SubscriberSelfController` avec 2 endpoints opérationnels (`GET /subscriber/me`, `GET /subscriber/activity`)
- ✅ Middleware `RequireSubscriber` fonctionnel
- ✅ Rôle `subscriber` dans les claims Firebase possible

**À créer MVP SOS-Call** :
- `src/pages/Subscriber/SubscriberDashboard.tsx` (principal)
- `src/pages/Subscriber/SubscriberActivity.tsx` (historique)
- `src/hooks/useSubscriber.ts` (data fetching)
- Route `/mon-acces` dans `App.tsx`

## 5.6.5 Systèmes critiques à NE PAS CASSER

### A. Notifications partenaires (7 types actifs)

| Type notification | Trigger | Fichier |
|-------------------|---------|---------|
| `system_announcement` | Création partenaire | `createPartner.ts:301-322` |
| `commission_earned` | Call complété + isPaid=true | `onCallCompleted.ts:203-237` |
| `commission_available` | Release scheduled | `releasePartnerPendingCommissions.ts` |
| `withdrawal_approved` | Admin approuve | `onWithdrawalStatusChanged.ts:104-127` |
| `withdrawal_completed` | Paiement confirmé | `onWithdrawalStatusChanged.ts:200-222` |
| `withdrawal_rejected` | Retrait refusé | `onWithdrawalStatusChanged.ts:248-270` |
| `withdrawal_failed` | Échec paiement | `onWithdrawalStatusChanged.ts:224-246` |

**Mitigation SOS-Call** :
- Ajouter champ `source: 'sosExpat_call' | 'sos_call'` dans `partner_notifications` pour différencier
- Dans `onCallCompleted.ts` : early return si `isSosCallFree === true` → **aucune notification de commission** (modèle forfait, pas de commission à l'acte)

### B. AdminInbox centralisé (`src/pages/admin/AdminInbox.tsx`)

**5 types de messages agrégés** :
- `captain_applications`
- `contact_messages` (notamment source `partner_application_form`)
- `user_feedback`
- `partner_applications` (⚠️ important pour SOS-Call)
- `payment_withdrawals`

**Le formulaire `submitPartnerApplication` crée automatiquement** :
1. Un doc dans `admin_notifications`
2. Un doc dans `contact_messages` (source=`partner_application_form`, category=`partner`, status=`new`, priority=`high`)

**Mitigation SOS-Call** : si on ajoute des événements admin pour SOS-Call (ex: facture impayée, suspension), les router vers `contact_messages` avec `category: 'sos_call'` pour qu'ils apparaissent dans l'AdminInbox.

### C. Emails automatiques Zoho (9 emails actifs)

Templates : `sos/firebase/functions/src/email/welcomeTemplates.ts`

1. **Welcome partenaire** (9 langues) → trigger `onPartnerCreated`
2. **Welcome application convertie** → `adminConvertApplicationToPartner`
3. **Password reset** → `createPartner` si `sendCredentials=true`
4. **Withdrawal request** → `onWithdrawalCreated`
5. **Withdrawal approved** → `onWithdrawalStatusChanged` (5 status emails)
6. **Withdrawal sent**
7. **Withdrawal completed**
8. **Withdrawal rejected**
9. **Withdrawal failed**

**+ 2 emails Laravel** :
- `AgreementExpiring.php` (expiration contrat)
- `SubscriberInvitation.php` (invitation client)

**Mitigation SOS-Call** : ajouter 2 nouveaux templates sans toucher aux existants :
- `sos_call_activation` (email d'activation au client final)
- `monthly_invoice` (facture mensuelle au partenaire)
- `invoice_overdue` (relance impayé)

### D. Trigger `onCallCompleted.ts` (CRITIQUE — ne pas casser)

**Logique actuelle** :
1. Écoute `call_sessions/{sessionId}` (isPaid false → true)
2. Détecte référence partenaire via `user.partnerReferredById` ou `partner_affiliate_clicks`
3. Calcule commission via `calculateCommissionAmount`
4. Crée doc `partner_commissions` (status=pending)
5. Incrémente `partner.pendingBalance`, `partner.totalEarned`
6. Crée `partner_notification` type=commission_earned
7. Forward vers Partner Engine Laravel (non-bloquant)

**Mitigation SOS-Call** : **ajout d'un early return en tête** du handler :
```typescript
if (after.metadata?.isSosCallFree === true || after.isSosCallFree === true) {
  logger.info('[partnerOnCallCompleted] SOS-Call — skip commission');
  return;  // Aucune commission, aucune notification
}
// ... code existant inchangé
```

### E. Webhooks Partner Engine (ne pas modifier)

**2 endpoints existants** :
- `POST /api/webhooks/call-completed` : payload actuel traité, AUCUNE modification
- `POST /api/webhooks/subscriber-registered` : payload actuel traité, AUCUNE modification

**Ajout pour SOS-Call** : **nouveaux endpoints séparés** :
- `POST /api/sos-call/check` (public)
- `POST /api/sos-call/check-session` (webhook secret)
- `POST /api/sos-call/log` (webhook secret)

### F. Telegram withdrawals (obligatoire, inchangé)

- `partnerRequestWithdrawal` exige `telegramId` (ligne 66-74)
- Double confirmation Telegram avant exécution (ligne 174)
- Non-SOS-Call scope : **0 modification** nécessaire

### G. Collection `partner_subscribers` Firestore

- Écrite UNIQUEMENT par Partner Engine (via jobs Laravel `SyncSubscriberToFirestore`)
- Permissions Firestore : `read` par owner, `write` = false (Cloud Functions + Partner Engine Admin SDK uniquement)
- **Mitigation SOS-Call** : le champ `sos_call_code` sera ajouté à cette collection lors de la sync (nouveau champ, pas de conflit)

## 5.6.6 Points spécifiques aux données existantes

### Subscribers existants (avant migration SOS-Call)

- **Problème** : les subscribers créés avant l'ajout de `sos_call_code` auront `NULL` dans cette colonne
- **Impact** : ils ne pourront pas accéder à `/sos-call` (code NULL ≠ code saisi)
- **Décision business à prendre** :
  - **Option A** : script de migration qui génère des codes pour tous les subscribers existants rétroactivement
  - **Option B** : seuls les nouveaux subscribers (post-déploiement) ont un code SOS-Call. Les anciens continuent avec l'ancien système (invite_token pour invitation email uniquement)
  - **Option C** : permettre aux anciens subscribers de se connecter avec phone+email fallback, générer le code à la première connexion réussie

**Recommandation** : **Option C** (hybride) — permet de ne pas casser l'existant ET de progressivement convertir au nouveau système.

### Agreements existants

- **Problème** : les agreements créés avant la migration auront leurs nouveaux champs avec des valeurs par défaut
- **Valeurs par défaut raisonnables** :
  - `billing_rate = 3.00`
  - `billing_currency = 'EUR'`
  - `payment_terms_days = 15`
  - `call_types_allowed = 'both'`
  - `sos_call_active = false` (⚠️ **FAUX par défaut**, pas true !)
  - `billing_email = null` (fallback contact_email)
- **Décision** : `sos_call_active = false` par défaut pour que **les agreements existants ne basculent pas automatiquement en SOS-Call**. L'admin active manuellement SOS-Call pour chaque partenaire qui passe au modèle forfait.

### Firestore subscribers (collection partner_subscribers)

- Ajout champ `sos_call_code` (string | null)
- Index composite nouveau : `(sos_call_code, status)` pour lookup rapide
- Anciens docs : pas de sos_call_code, ignorés par /sos-call

## 5.6.7 Checklist pré-implémentation (zéro régression garantie)

```
Avant chaque sprint SOS-Call, vérifier :

[✓] Flow standard (19€/49€) fonctionne toujours
    [ ] Tester /sos-appel → BookingRequest → CallCheckout → Stripe → appel
    [ ] Vérifier paymentIntent créé correctement
    [ ] Vérifier commission partenaire créée (si applicable)

[✓] Notifications partenaires
    [ ] Vérifier que commission_earned n'est PAS créée pour SOS-Call
    [ ] Vérifier que commission_earned EST créée pour flow standard
    [ ] Tester marquage notification comme lue

[✓] Admin UI (8 pages visibles + 2 cachées)
    [ ] Liste partenaires charge toujours
    [ ] Détail partenaire ouvre (5 onglets + 6ème SOS-Call)
    [ ] Candidatures restent dans AdminInbox
    [ ] Fraude reste fonctionnelle (351L intactes)
    [ ] Stats restent fonctionnelles (288L intactes)
    [ ] Widgets restent fonctionnels (436L intactes)

[✓] Dashboard partenaire (11 pages)
    [ ] Chaque page charge correctement
    [ ] Subscribers affiche les colonnes existantes + nouvelles
    [ ] Accord affiche les sections existantes + nouvelle section SOS-Call
    [ ] Paiements 4 tabs restent fonctionnels
    [ ] Telegram onboarding toujours obligatoire

[✓] Webhooks Partner Engine
    [ ] /webhooks/call-completed fonctionne comme avant
    [ ] /webhooks/subscriber-registered fonctionne comme avant
    [ ] Nouveaux endpoints /sos-call/* isolés, pas d'impact

[✓] Firebase Functions
    [ ] createAndScheduleCall fonctionne avec paymentIntentId classique
    [ ] createAndScheduleCall fonctionne avec sosCallSessionToken
    [ ] onCallCompleted skip commission si SOS-Call
    [ ] onCallCompleted crée commission si NOT SOS-Call

[✓] Emails
    [ ] Welcome partenaire toujours envoyé à création
    [ ] Withdrawal emails (5 états) toujours envoyés
    [ ] Agreement expiring toujours envoyé
    [ ] Nouveaux emails SOS-Call envoyés (activation, facture, impayé)

[✓] Tests existants passent
    [ ] 138 tests Laravel (Partner Engine)
    [ ] Tests Firebase Functions existants
    [ ] Ajouter tests spécifiques SOS-Call
```

---

# PARTIE 6 — PLAN D'IMPLÉMENTATION SPRINT PAR SPRINT

## Sprint 1 — Backend SOS-Call fonctionnel (5-6 jours)

**Objectif** : service opérationnel en back-end pour les tests.

| Tâche | Durée | Fichier |
|-------|-------|---------|
| Migration 1 — agreements (6 champs) | 2h | `database/migrations/*_add_sos_call_fields_to_agreements.php` |
| Migration 2 — subscribers (5 champs + index) | 2h | `*_add_sos_call_fields_to_subscribers.php` |
| Migration 3 — partner_invoices (nouvelle table) | 2h | `*_create_partner_invoices_table.php` |
| Migration 4 — email_templates multi-langue | 1h | `*_add_language_to_email_templates.php` |
| Update models (Agreement, Subscriber, new PartnerInvoice) | 2h | `app/Models/*.php` |
| Install `barryvdh/laravel-dompdf` | 30min | `composer.json` |
| Modifier `SubscriberService::create()` — génération sos_call_code | 2h | `app/Services/SubscriberService.php` |
| `SosCallController` — 4 endpoints | 1.5 jour | `app/Http/Controllers/SosCallController.php` |
| Routes + throttle custom | 2h | `routes/api.php` + `RouteServiceProvider.php` |
| `SmsService` — wrapper appel callable Firebase | 3h | `app/Services/SmsService.php` |
| Tests unitaires (PHPUnit) | 4h | `tests/Feature/Sos/*.php` |
| Callable Firebase `sendSosCallOtp` | 2h | `sos/firebase/functions/src/partner/callables/sendSosCallOtp.ts` |
| Callable Firebase `verifySosCallOtp` | 2h | `.../verifySosCallOtp.ts` |
| Exports `partner/index.ts` | 30min | — |
| Secrets Firebase (PARTNER_ENGINE_URL, PARTNER_ENGINE_SECRET) | 30min | `firebase functions:config:set` |

**Livrables Sprint 1** :
- ✅ Un subscriber peut vérifier son éligibilité via API (phone + email)
- ✅ Session token généré et stocké en Redis après match réussi
- ✅ Callable Firebase `checkSosCallEligibility` opérationnelle
- ✅ Tests passent (y compris cas `email_mismatch` et rate limiting)

## Sprint 2 — Bypass paiement Firebase (3-4 jours)

| Tâche | Durée | Fichier |
|-------|-------|---------|
| Modifier `createAndScheduleCallFunction.ts` (bypass sosCallSessionToken) | 1 jour | `sos/firebase/functions/src/createAndScheduleCallFunction.ts` |
| Modifier `partner/triggers/onCallCompleted.ts` (skip commission) | 2h | `.../partner/triggers/onCallCompleted.ts` |
| Ajouter champs `call_sessions` : `isSosCallFree`, `partnerSubscriberId` | 1h | TwilioCallManager.ts (type) |
| Logger appel auprès Laravel (`/sos-call/log`) | 3h | createAndScheduleCallFunction.ts |
| Tests E2E (flow complet sans Stripe) | 4h | — |
| Déploiement Firebase (europe-west3 + us-central1) | 1h | — |

**Livrables Sprint 2** :
- ✅ Un appel peut être créé sans paiement Stripe avec un sosCallSessionToken valide
- ✅ Pas de commission partenaire générée pour les appels SOS-Call
- ✅ Log fiable dans `subscriber_activities`

## Sprint 3 — Frontend /sos-call (3-4 jours)

| Tâche | Durée | Fichier |
|-------|-------|---------|
| Route /sos-call dans App.tsx | 30min | `sos/src/App.tsx` |
| Hook `useSosCall` (state machine simplifié, sans OTP) | 6h | `sos/src/hooks/useSosCall.ts` |
| PhoneEmailStep (État 1) avec IntlPhoneInput réutilisé | 4h | `sos/src/pages/SosCall/PhoneEmailStep.tsx` |
| VerifyingStep (État 2) | 1h | `.../VerifyingStep.tsx` |
| AccessConfirmedStep (État 3) — choix Expert/Avocat + "Couvert par {{partner_name}}" | 4h | `.../AccessConfirmedStep.tsx` |
| **EmailMismatchStep (État 4)** — nouvelle page dédiée | 4h | `.../EmailMismatchStep.tsx` |
| NotFoundStep (État 5) + lien accès standard | 3h | `.../NotFoundStep.tsx` |
| CallInProgressStep (État 6) + CountdownTimer 240s | 4h | `.../CallInProgressStep.tsx` |
| SosCallPage orchestration | 3h | `.../SosCallPage.tsx` |
| Traductions FR/EN/ES/DE/PT/AR/ZH/RU/HI | 4h | `sos/src/helper/*.json` |
| Tests Cypress / Playwright E2E | 4h | — |

**Livrables Sprint 3** :
- ✅ Page /sos-call fonctionnelle avec 7 états
- ✅ UX mobile-first (pensée pour urgence à l'étranger)
- ✅ 9 langues

## Sprint 4 — Facturation automatique mensuelle (3-4 jours)

| Tâche | Durée | Fichier |
|-------|-------|---------|
| Job `SendSosCallActivationEmail` + template multilingue | 1 jour | `app/Jobs/SendSosCallActivationEmail.php` |
| Vue Blade `emails/sos_call_activation.blade.php` (9 langues) | 1 jour | `resources/views/emails/` |
| Commande `GenerateMonthlyInvoices` | 6h | `app/Console/Commands/GenerateMonthlyInvoices.php` |
| `InvoiceService::generatePdf()` + template Blade | 6h | `app/Services/InvoiceService.php` + vue |
| Mailable `MonthlyInvoiceMail` avec PDF attaché | 3h | `app/Mail/MonthlyInvoiceMail.php` |
| Job `SuspendOnNonPayment` | 4h | `app/Jobs/SuspendOnNonPayment.php` |
| Mailable `InvoiceOverdueMail` | 2h | `app/Mail/InvoiceOverdueMail.php` |
| Notifications Telegram admin (3 events) | 2h | controller + service |
| Schedule dans `routes/console.php` | 30min | — |
| Tests facturation (fake dates) | 4h | — |

**Livrables Sprint 4** :
- ✅ Factures générées automatiquement le 1er du mois
- ✅ PDF envoyé au partenaire par email
- ✅ Suspension automatique des subscribers si impayé à J+payment_terms_days
- ✅ Telegram admin notifié

## Sprint 5 — Console admin Filament 3 ⭐ (5 jours)

| Tâche | Durée | Fichier |
|-------|-------|---------|
| Installation Filament + config panel + sous-domaine Nginx + SSL | 4h | `composer require filament/filament` + `AdminPanelProvider.php` |
| Auth + 2FA TOTP | 2h | `config/filament.php` |
| **InvoiceResource** (factures, PDF preview, actions) | 6h | `app/Filament/Resources/InvoiceResource.php` |
| **SubscriberResource** (vue globale, filtres, bulk actions) | 6h | `app/Filament/Resources/SubscriberResource.php` |
| **PartnerResource** (CRUD + onglets config SOS-Call + RelationManagers) | 1 jour | `app/Filament/Resources/PartnerResource.php` |
| **Widgets Dashboard** (7 widgets : stats, chart, top, factures, fraude) | 6h | `app/Filament/Widgets/*.php` |
| Tests + QA | 4h | — |

**Livrables Sprint 5** :
- ✅ Console admin sur `admin.sos-expat.com` opérationnelle
- ✅ Auth Laravel + 2FA TOTP
- ✅ 3 ressources Filament clés (Partner, Subscriber, Invoice)
- ✅ Dashboard avec 7 widgets et graphiques
- ✅ 100% indépendant de Firebase/Google Cloud

## Sprint 6 — Enrichir SPA React existant + page subscriber (3-4 jours)

| Tâche | Durée |
|-------|-------|
| Enrichir `/partner/abonnes` (colonnes SOS-Call + détail) | 1 jour |
| Enrichir `/partner/accord` (section SOS-Call) | 6h |
| Section 8 dans `AdminPartnerCreate.tsx` | 6h |
| Onglet SOS-Call dans `AdminPartnerDetail.tsx` (6ème onglet) | 1 jour |
| Page `/mon-acces` (Subscriber dashboard, Blade ou React) | 1 jour |
| Tests UI | 4h |

**Livrables Sprint 6** :
- ✅ Dashboard partenaire enrichi pour SOS-Call
- ✅ Admin SPA React peut aussi créer/modifier config SOS-Call (doublon temporaire avec Filament, utile pendant la transition)
- ✅ Subscriber a son dashboard `/mon-acces`

## Sprint 7 — Polish + Production (2-3 jours)

| Tâche | Durée |
|-------|-------|
| Monitoring + alertes (erreurs, failed jobs, Filament logs) | 4h |
| Documentation utilisateur (admin Filament + partenaire) | 4h |
| QA complète + corrections | 1 jour |
| Déploiement staging | 2h |
| Tests utilisateurs réels (1 partenaire pilote) | 1 jour |
| Déploiement production | 2h |

**Total : ~20-22 jours de dev (MVP complet avec console Filament)**

---

## PHASE 2 — Migration progressive du SPA React vers Filament (optionnel, plus tard)

Une fois le MVP validé (2-3 mois), tu pourras migrer progressivement les 8 pages `/admin/partners/*` React vers Filament pour unifier la console admin partenaires :

| Page React | Ressource Filament équivalente | Effort migration |
|------------|-------------------------------|------------------|
| `AdminPartnersList.tsx` | `PartnerResource` (déjà créée) | 1 jour |
| `AdminPartnerDetail.tsx` | `PartnerResource::ViewRecord` (déjà créée) | 1 jour |
| `AdminPartnerCreate.tsx` | `PartnerResource::CreateRecord` (déjà créée) | 0 (inclus) |
| `AdminPartnersFraud.tsx` (352L) | `FraudAlertResource` | 1 jour |
| `AdminPartnersStats.tsx` (289L) | Widgets dashboard Filament | 0.5 jour |
| `AdminPartnersWidgets.tsx` (437L) | `PromoWidgetResource` | 1.5 jour |
| `AdminPartnerApplications.tsx` | `PartnerApplicationResource` | 1 jour |
| `AdminPartnersConfig.tsx` | `PartnerConfigResource` | 0.5 jour |

**Effort Phase 2** : 5-7 jours supplémentaires quand tu seras prêt.

---

# PARTIE 7 — POINTS D'ATTENTION CRITIQUES

## 7.1 Cohérence `partner_firebase_id` vs `agreement_id`

**Problème** : Un subscriber est lié à un `agreement_id` et pas directement au `partner_firebase_id`. La spec demande parfois l'un, parfois l'autre.

**Solution** : toujours charger l'agreement en eager loading (`with('agreement')`) et utiliser `$subscriber->agreement->partner_firebase_id`.

## 7.2 Idempotence check-eligibility

**Problème** : Si l'utilisateur rafraîchit la page, il peut déclencher plusieurs fois le check (pas de SMS coût mais audit logs redondants).

**Solution** : Rate limiter (5 tentatives/15 min par phone) + débounce frontend 1s sur le submit + désactivation bouton pendant la requête.

## 7.3 Normalisation phone côté backend

**Problème** : Le frontend envoie E.164 mais rien ne garantit que le backend reçoive toujours E.164.

**Solution** : Dans `SosCallController::normalizePhone()`, valider avec regex `/^\+[1-9]\d{6,14}$/` et rejeter si invalide. Pas de normalisation supplémentaire — le frontend est responsable.

## 7.5 Cohérence sos_call_expires_at ↔ agreement.expires_at

**Problème** : Si un admin met à jour `agreement.expires_at`, les subscribers ne sont pas automatiquement synchronisés.

**Solution** :
- Dans `AgreementService::update()`, si `expires_at` change → dispatcher un job qui met à jour tous les subscribers liés
- OU : ne pas stocker `sos_call_expires_at` sur le subscriber et toujours le dériver de `agreement.expires_at` au runtime (moins de données, plus simple)

**Recommandation** : Deuxième approche (pas de duplication).

## 7.6 Concurrent access to same subscriber

**Problème** : Deux appels SOS-Call simultanés pour le même subscriber → double incrémentation de `calls_expert/lawyer`.

**Solution** : Utiliser `lockForUpdate()` dans la transaction `SosCallController::log()` :
```php
$subscriber = Subscriber::where('id', $session['subscriber_id'])->lockForUpdate()->first();
```

## 7.7 Saturation Redis en forte charge

**Problème** : Si un partenaire type AXA a 500k clients et un buzz marketing, Redis peut saturer (`maxmemory 128MB` dans docker-compose actuellement).

**Solution** : Monitorer `Cache::memory_usage` + alerter via Telegram si > 70%. Passer à 256MB+ si besoin. Éviction LRU configurée automatiquement sur le container `pe-redis`.

## 7.8 Protection CSRF sur routes publiques

**Problème** : Les routes `/sos-call/*` sont publiques, potentiellement cibles d'attaques CSRF ou spam.

**Solution** :
- Rate limiting par IP (déjà prévu)
- Captcha invisible (hCaptcha ou reCAPTCHA v3) sur le formulaire initial
- CORS strict : seul `sos-expat.com` peut appeler les callables Firebase

## 7.9 Session token à usage unique

**Problème** : Si le token est intercepté, il peut être réutilisé pour déclencher un appel.

**Solution** : Marquer `used: true` immédiatement après la première utilisation (déjà dans la spec). Faire la vérification atomique avec `lockForUpdate()` ou Redis `SETNX`.

## 7.10 Facturation — gestion des mois partiels

**Problème** : Si un subscriber est activé le 15 du mois, doit-il être facturé au plein tarif ?

**Décision business à prendre** :
- **Option A** : Plein tarif dès l'activation (simple, avantage partenaire vs client)
- **Option B** : Pro-rata jour par jour (complexe, juste)
- **Option C** : Facturé à partir du mois suivant (simple, favorable au partenaire)

**Recommandation** : **Option C** (facturation au mois complet à partir du mois suivant) → évite complexité pro-rata.

## 7.11 Tests de charge

**Important** : en cas de buzz marketing AXA, la page `/sos-call` peut recevoir 1000+ requêtes/minute.

**À tester** :
- Lookup Firestore `subscribers.where(phone=X, email=Y)` avec 100k+ rows → index composite obligatoire
- Redis peut gérer 10k sessions concurrentes ? Vérifier Docker Compose (`maxmemory 128MB` actuellement — à augmenter si besoin)
- Throughput Partner Engine `/api/sos-call/check` : capable de gérer 1000 req/min ? Tester avec Apache Bench

---

# PARTIE 8 — INVENTAIRE FINAL DES CHANGEMENTS

## 8.1 Nouveaux fichiers à créer

### Backend Laravel (11 fichiers)
1. `database/migrations/2026_04_23_000001_add_sos_call_fields_to_agreements.php`
2. `database/migrations/2026_04_23_000002_add_sos_call_fields_to_subscribers.php`
3. `database/migrations/2026_04_23_000003_create_partner_invoices_table.php`
4. `database/migrations/2026_04_23_000004_add_language_to_email_templates.php`
5. `app/Models/PartnerInvoice.php`
6. `app/Http/Controllers/SosCallController.php`
7. `app/Services/SmsService.php`
8. `app/Services/InvoiceService.php`
9. `app/Jobs/SendSosCallActivationEmail.php`
10. `app/Jobs/SuspendOnNonPayment.php`
11. `app/Console/Commands/GenerateMonthlyInvoices.php`

### Emails Blade (2 templates × 9 langues = 18 fichiers)
- `resources/views/emails/sos_call_activation/fr.blade.php` + 8 autres
- `resources/views/emails/monthly_invoice/fr.blade.php` + 8 autres

### Mailables Laravel (3 fichiers)
- `app/Mail/SosCallActivationMail.php`
- `app/Mail/MonthlyInvoiceMail.php`
- `app/Mail/InvoiceOverdueMail.php`

### PDF invoice (1 Blade)
- `resources/views/invoices/sos_call_monthly.blade.php`

### Firebase Functions (2 fichiers)
- `sos/firebase/functions/src/partner/callables/sendSosCallOtp.ts`
- `sos/firebase/functions/src/partner/callables/verifySosCallOtp.ts`

### Frontend React (12 fichiers)
- `sos/src/pages/SosCall/SosCallPage.tsx`
- `sos/src/pages/SosCall/PhoneEmailStep.tsx`
- `sos/src/pages/SosCall/VerifyingStep.tsx`
- `sos/src/pages/SosCall/OtpStep.tsx`
- `sos/src/pages/SosCall/AccessConfirmedStep.tsx`
- `sos/src/pages/SosCall/NotFoundStep.tsx`
- `sos/src/pages/SosCall/OtpInvalidStep.tsx`
- `sos/src/pages/SosCall/CallInProgressStep.tsx`
- `sos/src/pages/SosCall/EmergencyContactModal.tsx`
- `sos/src/hooks/useSosCall.ts`
- `sos/src/pages/Subscriber/SubscriberDashboard.tsx`
- `sos/src/pages/Subscriber/SubscriberActivity.tsx`
- `sos/src/hooks/useSubscriber.ts`

### Tests (estimé ~15 fichiers)

**Total nouveaux fichiers : ~60 fichiers**

## 8.2 Fichiers à modifier

### Backend Laravel (5 fichiers)
- `app/Models/Agreement.php` (fillable + casts)
- `app/Models/Subscriber.php` (fillable + casts)
- `app/Models/EmailTemplate.php` (language)
- `app/Services/SubscriberService.php` (génération code + dispatch job)
- `routes/api.php` (4 nouvelles routes)
- `app/Providers/RouteServiceProvider.php` (throttle custom)
- `routes/console.php` (schedule command)
- `composer.json` (ajout barryvdh/laravel-dompdf)

### Firebase Functions (3 fichiers)
- `sos/firebase/functions/src/createAndScheduleCallFunction.ts` (bypass Stripe)
- `sos/firebase/functions/src/partner/triggers/onCallCompleted.ts` (skip commission)
- `sos/firebase/functions/src/partner/index.ts` (exports)
- `sos/firebase/functions/src/lib/secrets.ts` (PARTNER_ENGINE_URL_SECRET, PARTNER_ENGINE_SECRET)

### Frontend React (6 fichiers)
- `sos/src/App.tsx` (2 nouvelles routes : /sos-call + /mon-acces)
- `sos/src/pages/admin/Partners/AdminPartnerCreate.tsx` (section 8)
- `sos/src/pages/admin/Partners/AdminPartnerDetail.tsx` (onglet 6)
- `sos/src/pages/Partner/PartnerSubscribers.tsx` (colonnes SOS-Call)
- `sos/src/pages/Partner/PartnerAgreement.tsx` (section SOS-Call)
- `sos/src/helper/fr.json` + 8 autres langues (nouvelles clés `sos_call.*`)

---

# PARTIE 9 — MATRICE FINALE GAP ANALYSIS

| Composant | Spec | Existant | Action | Effort |
|-----------|------|----------|--------|--------|
| Twilio (voice conference) | ✅ Requis | ✅ Opérationnel | Réutilisation existant | 0h |
| Redis sessions/rate-limit | ✅ Requis | ✅ Opérationnel | Utilisation directe | 0h |
| dompdf | ✅ Requis | ❌ Absent | `composer require` | 30min |
| Zoho SMTP | ✅ Requis | ✅ Opérationnel | 0 modif | 0h |
| Telegram notif | ✅ Requis | ✅ Opérationnel | Ajouter events | 2h |
| libphonenumber-js | ✅ Requis | ✅ Opérationnel | 0 modif | 0h |
| Table agreements | 6 champs à ajouter | Base OK | Migration | 2h |
| Table subscribers | 5 champs + index | Base OK | Migration | 2h |
| Table partner_invoices | Nouvelle table | ❌ Absente | Migration + model | 3h |
| Table email_templates | Multi-langue | Sans `language` | Migration | 1h |
| SubscriberService::create() | Génère code | Sans génération | Modif + méthode | 2h |
| SosCallController | 4 endpoints | ❌ Absent | Nouveau controller | 1.5 jour |
| Routes SOS-Call | 4 routes | ❌ Absentes | Ajout routes/api.php | 30min |
| Throttle custom | 2 throttle | Base throttle existe | RouteServiceProvider | 1h |
| SendSosCallActivationEmail | Nouveau job | ❌ Absent | Nouveau job + template | 1 jour |
| GenerateMonthlyInvoices | Commande | ❌ Absent | Commande + service | 1.5 jour |
| SuspendOnNonPayment | Nouveau job | ❌ Absent | Nouveau job | 4h |
| InvoiceService PDF | Nouveau service | ❌ Absent | Service + Blade | 1 jour |
| sendSosCallOtp callable | Nouveau | ❌ Absent | Nouvelle callable | 2h |
| verifySosCallOtp callable | Nouveau | ❌ Absent | Nouvelle callable | 2h |
| createAndScheduleCall | Bypass Stripe | Validation Stripe existante | Modif ~50 lignes | 1 jour |
| onCallCompleted partner | Skip commission | Commission toujours créée | Ajout early return | 2h |
| call_sessions type | `isSosCallFree` | Sans flag | Ajout 2 champs | 30min |
| Page /sos-call | 7 états | ❌ Absente | Nouvelle page | 3-4 jours |
| Page /mon-acces | Dashboard subscriber | ❌ Absente | Nouvelle page | 2 jours |
| PartnerSubscribers.tsx | Colonnes SOS-Call | Sans | Enrichissement | 1 jour |
| PartnerAgreement.tsx | Section SOS-Call | Sans | Enrichissement | 6h |
| AdminPartnerCreate.tsx | Section 8 | 7 sections | Ajout section | 6h |
| AdminPartnerDetail.tsx | Onglet 6 | 5 onglets | Ajout onglet complet | 1 jour |
| Emergency support modal | Option 1 ma reco | Non spécifié | UX + callable | 1 jour |

**Total MVP : ~20-25 jours**

---

# PARTIE 10 — CONCLUSION

## 10.1 État global

Le système SOS-Call est **entièrement faisable** avec l'infrastructure existante. **95% des briques de base sont prêtes** (Twilio conference, Redis, Zoho SMTP, Telegram, libphonenumber, IntlPhoneInput, Firebase callables, AAA bypass pattern, Partner Engine Laravel complet avec 4 méthodes d'inscription client déjà implémentées).

Il reste principalement à **orchestrer** ces briques via :
- 4 migrations Laravel
- 4 endpoints SosCallController
- 2 callables Firebase
- 2 modifications Firebase existants (createAndScheduleCall + onCallCompleted)
- 1 page frontend majeure (/sos-call 7 états)
- Enrichissements UI partenaire + admin

## 10.2 Durée réaliste

**MVP testable** : ~15 jours (Sprints 1-3)
**MVP commercialisable** : ~20-25 jours (tous sprints)

## 10.3 Risques résiduels

1. **Facturation multi-devise** (USD/EUR) — penser à la TVA UE si facturation France
2. **Partenaires avec CRM** — intégration API webhook (Phase 2, pas MVP)
3. **Volumes élevés** — stress-test avec 100k subscribers avant production
4. **Support 24/7 humain** (Option 1) — nécessite permanence
5. **Conformité RGPD** — email d'activation contient données personnelles, politique de rétention à définir

## 10.4 Réponses aux 2 questions UX

**Q1 — Skip page paiement + compte à rebours immédiat ?**
✅ **OUI.** Après matching phone+email validé (sans OTP), clic sur "Expert" ou "Avocat" → bypass Stripe complet → createAndScheduleCall appelée directement → **compte à rebours 4 minutes démarre immédiatement** (Cloud Tasks programme Twilio à T+240s, timing inchangé).

**Q2 — Plan de secours si phone match mais email ne matche pas ?**
✅ **Page dédiée "Email incorrect"** qui :
- Affiche "Votre numéro est reconnu, mais l'email ne correspond pas"
- Précise "Utilisez l'email fourni à **{{partner_name}}** lors de votre inscription"
- Pré-remplit le phone (grisé)
- Permet de re-saisir uniquement l'email
- 3 tentatives max avant blocage 10 min
- Fallback : lien "Contacter votre partenaire" + "Accès standard payant"

**Q3 — Ne rien casser du flow actuel ?**
✅ **Garanti par design.** Le SOS-Call est un chemin **parallèle** (`/sos-call`), pas une modification du flow existant (`/sos-appel` → `CallCheckout` → Stripe). Les modifications backend sont **additives** (champ optionnel `sosCallSessionToken`, early return si `isSosCallFree=true`). Pattern identique au bypass AAA qui coexiste depuis 2 ans sans impact.

**Q4 — Comment le partenaire enregistre ses clients ?**
✅ **4 méthodes disponibles** (3 déjà implémentées) :
- Ajout manuel via UI `/partner/abonnes` (1-50 clients)
- Import CSV via UI (50-10k clients)
- API REST (100-50k clients, via `POST /partner/subscribers`)
- Webhook CRM entrant (Phase 2, pour 10k-1M+ clients)

À chaque ajout, le `sos_call_code` est généré automatiquement et un email d'activation envoyé au client dans sa langue.

---

**Fin de l'audit — 2026-04-23**
**Emplacement** : `C:\Users\willi\Documents\Projets\VS_CODE\sos-expat-project\AUDIT-SOS-CALL-GAP-ANALYSIS-2026-04-23.md`
