---
audit: SOS-Expat E2E
scope:
  - Système Partenaire (Partner Engine + B2B Filament)
  - Système d'Appels (Path A anonyme + Path B logged-in + B2B + Twilio)
  - Système de Paiement (Stripe + PayPal + Withdrawals + B2B 30j reserve)
  - Consoles d'administration (admin SOS-Expat + Filament + Dashboard-multiprestataire)
  - Sécurité, idempotence, crons, backups, performance
out_of_scope:
  - Telegram-Engine (engine_telegram_sos_expat)
  - Backlink-Engine
  - Mailflow / presse@*
  - Blog Content Engine + KB
  - SEO / sitemaps / hreflang
  - Influenceur / Chatter / Blogger / GroupAdmin (sauf si touche le paiement)
date: 2026-04-25
version: 2.0
estimated_effort: 8-16h (4 sessions de 2-4h)
recommended_agent: Opus 4.7 + autorisations Bash(ssh root@95.216.179.163 *) + Bash(node *firestore*)
---

# PROMPT — Audit E2E SOS-Expat (Partner / Appels / Paiement / Admin)

> **À copier-coller dans une nouvelle conversation Claude Code**, démarrant à la racine `C:\Users\willi\Documents\Projets\VS_CODE\sos-expat-project`.
> Mode `auto` recommandé. Autoriser SSH VPS + lecture Firestore admin SDK avant de démarrer.

---

# 0. RAPID-START — 30 minutes pour un état de santé global

**Lance les 8 commandes ci-dessous EN PARALLÈLE, en un seul tour de tool calls.** Note les anomalies dans un fichier scratch — tu reviendras dessus après les sections détaillées.

```bash
# 1. État repos
git -C C:/Users/willi/Documents/Projets/VS_CODE/sos-expat-project status -uno --short
git -C C:/Users/willi/Documents/Projets/VS_CODE/partner_engine_sos_expat status -uno --short

# 2. Functions multi-région (counts)
cd sos/firebase && firebase functions:list 2>&1 | grep -cE "europe-west1|us-central1|europe-west3|europe-west2"

# 3. Containers VPS
ssh root@95.216.179.163 'docker ps --format "{{.Names}} {{.Status}}" | grep pe-'

# 4. Migrations VPS
ssh root@95.216.179.163 'docker exec pe-app php artisan migrate:status | tail -15'

# 5. Crons VPS (last 5 lines de log scheduler)
ssh root@95.216.179.163 'docker logs pe-scheduler --tail 30 2>&1 | tail -10'

# 6. Tarifs prod
node -e "const a=require('firebase-admin');a.initializeApp({credential:a.credential.cert(require('./security-audit/backups/firebase-adminsdk-NEW-.json'))});a.firestore().doc('admin_config/pricing').get().then(d=>{console.log(JSON.stringify(d.data(),null,2));process.exit(0)})"

# 7. CGU prod
node -e "const a=require('firebase-admin');a.initializeApp({credential:a.credential.cert(require('./security-audit/backups/firebase-adminsdk-NEW-.json'))});a.firestore().collection('legal_documents').where('type','in',['terms_lawyers','terms_expats']).get().then(s=>{s.forEach(d=>console.log(d.id,d.data().version,d.data().language));process.exit(0)})"

# 8. Last 3 GitHub Actions deploys (les deux repos)
cd C:/Users/willi/Documents/Projets/VS_CODE/sos-expat-project && gh run list --limit 3
cd C:/Users/willi/Documents/Projets/VS_CODE/partner_engine_sos_expat && gh run list --limit 3
```

**Critères go/no-go pour continuer l'audit** :
- ✅ 4 containers `pe-*` healthy → continue
- ❌ Container en `Created` non-running → noter en P0 et continuer (bug deploy script connu)
- ❌ Functions sur europe-west2 (devrait être 0) → noter en P0
- ❌ admin_config/pricing pas de section `b2b` → noter en P0 (tarifs B2B perdus)

---

# 1. CONTEXTE GÉNÉRAL — à lire AVANT toute action

## 1.1 Plateforme

SOS-Expat met en relation des **clients du monde entier** avec des **avocats** (inscrits aux barreaux) et des **expatriés aidants** (« experts »), via des **appels téléphoniques d'urgence**. Plateforme **multilingue** (9 langues : FR, EN, ES, DE, PT, RU, ZH, AR, HI). Société : **WorldExpat OÜ** (Estonie).

## 1.2 Trois modèles économiques (CRITIQUE)

| Modèle | Qui paie ? | Provider rémunéré | Quand ? | Réserve |
|---|---|---|---|---|
| **Direct (B2C)** | Client (Stripe/PayPal) 49€ avocat / 19€ expert | 30€ avocat / 10€ expert | À la fin d'appel | 7j |
| **B2B SOS-Call (forfait)** | Partenaire en fin de mois (invoice) | 20€/$ avocat / 7€/$ expert (B2B rate) | **Immédiat** à la fin d'appel | **30j** |
| **B2B Commission (à l'acte)** | Client (prix standard) | Standard provider amount | À la fin d'appel | 7j |

**B2B SOS-Call ≠ B2B Commission**. Si tu as un doute, vérifie `agreement.economic_model`.

## 1.3 Tarifs production (devraient être dans `admin_config/pricing`)

```
lawyer.eur.providerAmount = 30   lawyer.b2b.eur.providerAmount = 20
lawyer.usd.providerAmount = 30   lawyer.b2b.usd.providerAmount = 20
expat.eur.providerAmount = 10    expat.b2b.eur.providerAmount = 7
expat.usd.providerAmount = 10    expat.b2b.usd.providerAmount = 7
```

Frais retrait : `$3` fixe + seuil min `$30` (3000 cents).

## 1.4 Repos

- `sos-expat-project` (ce repo) — frontend SPA Vite + Firebase Functions + Outil prestataire + Dashboard multiprestataire
- `partner_engine_sos_expat` — Laravel 12 Partner Engine (Filament admin + panel partenaire B2B + API publique)

## 1.5 Infrastructure

- **Firebase project** : `sos-urgently-ac307`
- **Frontend** : Cloudflare Pages (auto-deploy push `main`) — **PAS Firebase Hosting**
- **Edge cache** : Cloudflare Worker `sos/cloudflare-worker/` (intercepte SSR/blog/sitemaps)
- **Firestore** : `nam7` (Iowa) → toutes les régions ont latence vers US
- **Functions multi-régions** :
  - `europe-west1` 🇧🇪 — APIs publiques + admin (~206 fonctions, dont `createAndScheduleCall`)
  - `us-central1` 🇺🇸 — affiliate / influencer / chatter (~201 fonctions, dont `triggerSosCallFromWeb`, `releaseProviderPayments`)
  - `europe-west3` 🇩🇪 — Stripe webhooks + Twilio + triggers + scheduled (~252 fonctions)
  - `europe-west2` — **VIDE** (migré 2026-02-25, ne doit pas avoir de fonction)
- **Partner Engine VPS Hetzner** : `95.216.179.163`
  - Path : `/opt/partner-engine`
  - Containers Docker Compose : `pe-app`, `pe-queue`, `pe-scheduler`, `pe-nginx`, `pe-postgres`, `pe-redis`
  - URL prod : `https://partner-engine.sos-expat.com`
- **CI/CD Partner Engine** : GitHub Actions appleboy/ssh-action → `git pull` + `docker compose build --no-cache app queue scheduler` + `docker compose up -d --force-recreate` + `composer install` + `migrate --force`
- **Bug connu CI/CD** : containers parfois en `Created` sans démarrer → `docker compose up -d` manuel requis

## 1.6 Diagramme flow d'appel (ASCII)

```
                    ┌─ Path A (anonyme, B2B uniquement) ─┐
                    │  sos-call.sos-expat.com/?code=XXX  │
                    │             ↓                       │
                    │  triggerSosCallFromWeb (us-central1)│
                    │  clientCurrency? || country fallback│
                    └────────────────┬────────────────────┘
                                     │
                                     ↓
                    ┌─ Path B (logged-in, B2C ou B2B) ─┐
                    │  sos-expat.com/booking-request   │
                    │           ↓                       │
                    │  createAndScheduleCall (europe-west1)
                    │  currency? || country fallback   │
                    │      │                            │
                    │      ├─ partnerCode? → B2B branch │
                    │      │  skip Stripe              │
                    │      │  payment.status='isSosCallFree'
                    │      │                            │
                    │      └─ direct → Stripe Connect   │
                    │         destination charge       │
                    │         application_fee         │
                    └──────────────┬──────────────────┘
                                    │
                                    ↓
                    ┌─ TwilioCallManager (europe-west3) ─┐
                    │  Cloud Task T+240s timeout          │
                    │  Twilio Conference                  │
                    │  Gather DTMF (1=accept, 2=decline)  │
                    │  States: pending→ringing→in_progress│
                    │          →completed|failed|no_answer│
                    └──────────────┬──────────────────────┘
                                    │
                                    ↓
                    ┌─ Finalisation (B2B branch ~ligne 2693) ┐
                    │  payment.status = 'captured_sos_call_free'
                    │  payment.providerAmount = getB2BProviderAmount(...)
                    │  payment.currency = callSession.currency
                    │  payment.holdReason = '30d_b2b_reserve'
                    │  payment.availableFromDate = now + 30j
                    │  isPaid = true                       │
                    └──────────────────────────────────────┘
```

## 1.7 Multi-provider (shareBusyStatus)

- Compte parent dans `users/{accountOwnerId}` avec `linkedProviderIds: ['B','C']` + `shareBusyStatus: true`
- Helper : `findParentAccountConfig()` (array-contains query Firestore)
- Bug fix 2026-02-05 : champs dénormalisés sur **chaque provider doc** + self-healing
- Migration : `sos/scripts/migrate-denormalize-multi-provider.cjs`
- **Important** : `shareBusyStatus` doit être `true` sur le compte pour propagation

## 1.8 Profils AAA (test/démo)

- `uid.startsWith('aaa_')` ou `isAAA: true` dans `users/{uid}`
- **Exemptés** : offline punishment (no_answer), inactivity check (15-min cron)
- **Non exemptés** : busy status propagation

---

# 2. GLOSSAIRE (jargon SOS-Expat)

| Terme | Définition |
|---|---|
| **AAA** | Profile test/démo (`uid.startsWith('aaa_')` ou `isAAA: true`) |
| **Agreement** | Contrat partenaire B2B dans Partner Engine (Laravel) |
| **B2B SOS-Call** | Partenaire paie forfait, clients gratuits, provider rémunéré immédiat |
| **B2B Commission** | Partenaire reçoit commission par appel, client paie standard |
| **Branch manager** | Rôle multi-cabinet (Phase 3 2026-04-25), scoping via `managed_group_labels` |
| **CGV B2B** | Conditions Générales de Vente B2B (un des 3 docs légaux) |
| **Compte parent** | `users/{accountOwnerId}` qui possède plusieurs providers liés |
| **DPA** | Data Processing Agreement (RGPD article 28) — un des 3 docs légaux |
| **DTMF** | Tonalité du clavier téléphonique (`1` = accept appel, `2` = decline) |
| **Edge cache worker** | Cloudflare Worker qui cache SSR/blog/sitemaps avant Cloud Run |
| **Filament** | Framework admin Laravel utilisé pour Partner Engine |
| **Forfait mensuel** | Redevance partenaire B2B (flat ou tiered ou hybrid) |
| **Holds (provider)** | Montant en réserve, pas encore disponible |
| **isLegallyCleared()** | Méthode Agreement : true si signed OR override |
| **legal_status** | Colonne agreement : not_generated/draft/.../signed/override |
| **Override admin** | Escape hatch pour partenaire avec contrat papier signé hors plateforme |
| **Path A** | Flux appel anonyme (sos-call.sos-expat.com, B2B uniquement) |
| **Path B** | Flux appel logged-in (sos-expat.com, B2C ou B2B) |
| **PartnerScopedQuery** | Trait Eloquent qui filtre les rows par `partner_firebase_id` |
| **Pricing tiers** | Forfait par paliers de subscribers (0-500 → 500€, 501-1000 → 650€…) |
| **reservedB2BAmount** | Montant en hold 30j (B2B) — distinct de `reservedAmount` (7j direct) |
| **shareBusyStatus** | Propagation de l'état BUSY entre providers d'un même compte parent |
| **SOS-Call** | Service B2B où clients d'un partenaire appellent gratuitement |
| **Tiers payeur** | Concept juridique : SOS-Expat collecte de la part du partenaire pour le provider, sans lien employeur |
| **WorldExpat OÜ** | Société propriétaire (Estonie), `provider_legal_name` dans config/legal.php |

---

# 3. TEST DATA (à utiliser pour reproductibilité)

> **Ces identifiants doivent exister en prod (créés au préalable). Sinon, créer dans la première session.**

| Type | Valeur | Notes |
|---|---|---|
| Provider AAA test | `aaa_test_provider_001` | Avocat FR, isVisible=true, exempt punishments |
| Provider AAA test 2 | `aaa_test_provider_002` | Expat US |
| Partenaire test | code `AUDIT_TEST_2026` | Agreement B2B SOS-Call, lawyer+expat allowed |
| Subscriber test | tel `+33600000001` | Lié à `AUDIT_TEST_2026` |
| Carte Stripe test | `4242 4242 4242 4242` exp `12/30` cvc `123` | Visa success |
| Carte Stripe 3DS | `4000 0027 6000 3184` | 3D Secure required |
| Carte Stripe declined | `4000 0000 0000 0002` | Generic decline |
| Email PayPal sandbox | `paypal-test-buyer@sos-expat.com` | Compte PayPal sandbox |
| Admin test | `admin-audit@sos-expat.com` / mdp dans 1Password | Filament + admin SOS-Expat |
| Test partenaire login | `partner-audit@sos-expat.com` / mdp dans 1Password | Panel partenaire Filament |
| Numéros Twilio test | Voir `sos/firebase/functions/.runtimeconfig.json` | Sandbox Twilio |

**RÈGLE D'OR** : ne JAMAIS modifier de vrai partenaire / provider / call_session pendant l'audit. Tout passe par les profils `aaa_*` ou `AUDIT_TEST_*`.

---

# 4. TON RÔLE D'AUDITEUR

Tu es un auditeur **senior** mandaté pour vérifier que la plateforme est **production-ready à l'échelle mondiale** avant un scale agressif.

**Tu :**
- Lis le vrai code (pas tes souvenirs)
- Lances les vraies commandes (pas des suppositions)
- Cites `fichier:ligne` à chaque finding
- Multi-tool calls en parallèle quand checks indépendants
- Produis un rapport classé P0/P1/P2 avec plan d'action concret

**Tu NE :**
- Push rien, ne modifies rien sans accord explicite
- Drop aucune table, aucune colonne (memory : `feedback_backlink_engine_no_db_drop.md`)
- Lances aucune migration spontanée
- Ne contournes aucune règle de sécurité (pas de `--no-verify`, pas de `--no-gpg-sign`)
- Inventes pas de bug : si tu n'es pas sûr, dis « je n'ai pas pu vérifier parce que… »

**Si tu trouves un secret en clair** (clé API, mot de passe, service account JSON dans le repo) → **P0 immédiat**, alerte l'utilisateur, n'inclus PAS le secret dans ton rapport.

---

# 5. FORMAT DE FINDING (à utiliser systématiquement)

```markdown
### [P0|P1|P2] — Titre court
**Fichier** : `chemin/relatif/fichier.ts:142`
**Symptôme** : ce qui se passe (observable)
**Reproduction** : étapes minimales pour reproduire
**Impact** : conséquence métier (perte d'argent ? UX cassée ? privilege escalation ?)
**Fix proposé** : 1-2 phrases, pointer une approche concrète
**Effort estimé** : XS (<1h) | S (<4h) | M (1j) | L (2-3j) | XL (>3j)
```

**Exemple** :

```markdown
### P0 — Race condition sur withdrawal créditeur
**Fichier** : `sos/firebase/functions/src/callables/createWithdrawalRequest.ts:142`
**Symptôme** : balance updaté hors transaction Firestore
**Reproduction** : double-clic UI → 2 retraits créés, solde négatif possible
**Impact** : remboursement manuel + risque réputationnel + comptabilité incohérente
**Fix proposé** : wrap en `runTransaction()`, guard via `doc.data().version` (optimistic locking)
**Effort estimé** : S
```

---

# 6. DOMAINE 1 — SYSTÈME PARTENAIRE (Partner Engine + B2B)

## 6.1 Filament admin (panel global)

**Fichiers à auditer** (chemin absolu) :
- `partner_engine_sos_expat/app/Filament/Resources/PartnerResource.php` (wizard 5 étapes, repeater pricing_tiers)
- `partner_engine_sos_expat/app/Filament/Resources/PartnerResource/RelationManagers/`
- `partner_engine_sos_expat/app/Filament/Resources/SubscriberResource.php`
- `partner_engine_sos_expat/app/Filament/Resources/InvoiceResource.php` (vérifier breakdown tier dans infolist)
- `partner_engine_sos_expat/app/Filament/Resources/EmailTemplateResource.php`
- `partner_engine_sos_expat/app/Filament/Resources/ApiKeyResource.php`
- `partner_engine_sos_expat/app/Filament/Resources/AuditLogResource.php`
- `partner_engine_sos_expat/app/Filament/Resources/UserResource.php`
- `partner_engine_sos_expat/app/Filament/Resources/LegalDocumentTemplateResource.php`
- `partner_engine_sos_expat/app/Filament/Pages/Auth/EditAdminProfile.php` (2FA email)
- `partner_engine_sos_expat/app/Filament/Widgets/StatsOverviewWidget.php` (EUR/USD split)
- `partner_engine_sos_expat/app/Filament/Widgets/ProviderHoldsWidget.php`

**Vérifications** :
- [ ] Wizard crée correctement un partenaire avec les 3 modèles : `commission` / `sos_call` / `hybrid`
- [ ] Repeater `pricing_tiers` valide les chevauchements de brackets et le dernier `max=null` = illimité
- [ ] Quotas (`max_subscribers`, `max_calls_per_sub`) respectés côté API publique
- [ ] Action toggle Commission ↔ SOS-Call remet à zéro les champs inutilisés
- [ ] Action Suspend All / Reactivate All persiste audit log + dispatch `SyncSubscriberToFirestore`
- [ ] Filtres tableau : `economic_model`, `model_filter` (commission/sos_call), `status` fonctionnent
- [ ] **2FA email** : opt-in via profil, code 6 chiffres, TTL 10 min, RateLimiter 5 essais/15 min
- [ ] **Multi-cabinet (Phase 1+2+3)** : rôle `branch_manager`, scoping via `managed_group_labels`, écriture protégée par `PartnerScopedQuery`
- [ ] Widgets : KPIs séparés EUR/USD via `selectRaw + groupBy('cur')`
- [ ] Email templates : rendre 1 template, vérifier variables substituées
- [ ] Audit logs couvrent : override légal, suspension, toggle modèle, génération drafts, override débrayé

**Tests live** :
```bash
ssh root@95.216.179.163 "docker exec pe-app php artisan filament:list-resources"
ssh root@95.216.179.163 "docker exec pe-app php artisan route:list --path=admin | head -30"
ssh root@95.216.179.163 'docker exec pe-app php artisan tinker --execute="echo \App\Models\Agreement::count();"'
```

## 6.2 Filament partner panel (self-service)

**Fichiers** :
- `partner_engine_sos_expat/app/Filament/Partner/`
- `partner_engine_sos_expat/app/Filament/Partner/Widgets/StatsPartnerWidget.php`
- `partner_engine_sos_expat/app/Http/Controllers/Partner/PartnerSosCallController.php`
- `partner_engine_sos_expat/app/Http/Controllers/Partner/LegalDocumentController.php`
- `partner_engine_sos_expat/app/Http/Middleware/EnsurePartner*`

**Vérifications** :
- [ ] Un partenaire ne voit QUE ses propres données (`partner_firebase_id` scoping partout)
- [ ] StatsPartnerWidget appelle `Agreement::resolveBaseFee($activeSubs)` avec count actuel + count mois précédent
- [ ] Tier en cours affiché dans le breakdown (champ `pricing_tier` JSON sur `partner_invoices`)
- [ ] API publique (`routes/api.php`) refuse les requêtes sans `X-Api-Key` valide
- [ ] Routes legal documents API vérifient l'appartenance du doc au partenaire connecté

**Test API partenaire** :
```bash
ssh root@95.216.179.163 'docker exec pe-app php artisan tinker --execute="echo \App\Models\PartnerApiKey::first()?->key;"'
curl -i https://partner-engine.sos-expat.com/api/partner/legal-documents     # Attendu : 401
curl -i -H "X-Api-Key: <KEY_TROUVÉE>" https://partner-engine.sos-expat.com/api/partner/legal-documents   # Attendu : 200 + liste
```

## 6.3 Système Legal Docs (CGV B2B / DPA / Order Form)

**Fichiers clés** :
- `partner_engine_sos_expat/app/Services/LegalDocumentService.php` (597 lignes — utiliser sub-agent Explore)
- `partner_engine_sos_expat/app/Models/{LegalDocumentTemplate,PartnerLegalDocument,PartnerLegalAcceptance}.php`
- `partner_engine_sos_expat/app/Models/Agreement.php` (relations + `isLegallyCleared()`)
- `partner_engine_sos_expat/app/Observers/AgreementObserver.php` (gating `sos_call_active`)
- `partner_engine_sos_expat/resources/views/legal/body/{cgv_b2b,dpa,order_form}.blade.php`
- `partner_engine_sos_expat/resources/views/legal/{layout,signature_block,signature-evidence,preview-template}.blade.php`
- `partner_engine_sos_expat/resources/views/emails/partner_legal/{ready,signed}.blade.php`

**Vérifier la prod** :
```bash
ssh root@95.216.179.163 "docker exec pe-app php artisan migrate:status | grep '2026_04_25_120'"
# Attendu : 4 lignes "[10] Ran"

ssh root@95.216.179.163 'docker exec pe-app php artisan tinker --execute="echo \App\Models\LegalDocumentTemplate::count();"'
# Attendu : 6

ssh root@95.216.179.163 'docker exec pe-app php artisan tinker --execute="echo class_exists(\"Barryvdh\\\\DomPDF\\\\Facade\\\\Pdf\") ? \"OK\" : \"NO\";"'
# Attendu : OK
```

**Tests fonctionnels** :
- [ ] Créer agreement avec `sos_call_active = true` AVANT signature → `RuntimeException` via observer
- [ ] Générer drafts → 3 PartnerLegalDocument en `draft` avec PDFs
- [ ] Valider & envoyer → `ready_for_signature` + email partenaire envoyé
- [ ] Partenaire signe via `POST /api/partner/legal-documents/{id}/sign` → row `partner_legal_acceptances` avec IP, UA, hash SHA-256
- [ ] 3 docs signés → `agreements.legal_status = 'signed'` + `legal_signed_at` rempli
- [ ] Override admin : raison obligatoire → audit log + `legal_status = 'override'`
- [ ] Désactiver override → revient à signed/pending selon docs
- [ ] Régénérer doc déjà signé → ancien `superseded`, nouveau `draft` (signatures historiques préservées)
- [ ] PDF embed le signature_block (nom, date, IP, hash) si signé
- [ ] Preview Filament affiche le contenu Blade par défaut quand `body_html` vide

## 6.4 Pricing tiers (forfaits par paliers)

**Fichiers** :
- `partner_engine_sos_expat/app/Models/Agreement.php::resolveBaseFee()` (+46 lignes)
- `partner_engine_sos_expat/app/Services/InvoiceService.php`
- `partner_engine_sos_expat/app/Console/Commands/GenerateMonthlyInvoices.php`

**Vérifications** :
- [ ] `resolveBaseFee()` retourne le bon bracket pour 0, 250, 500, 501, 1000, 1001, 5001
- [ ] Si pas de tier matchant → log warning + fallback `monthly_base_fee`
- [ ] `partner_invoices.pricing_tier` JSON snapshot immuable (même si tiers édités après)
- [ ] L'invoice PDF affiche le bracket utilisé (snapshot), pas la définition courante

---

# 7. DOMAINE 2 — SYSTÈME D'APPELS

## 7.1 Path A (anonyme — gated subdomain)

**Fichiers** :
- `sos/src/pages/BookingRequest.tsx` (lignes ~3343-3400 desktop, ~3698-3720 mobile)
- `sos/firebase/functions/src/partner/callables/triggerSosCallFromWeb.ts` (us-central1)

**Vérifications** :
- [ ] Frontend appelle `triggerSosCallFromWeb` avec `clientCurrency: detectUserCurrency()`
- [ ] Backend : `clientCurrency || deriveCurrencyFromCountry(clientCountry)` (utilisateur prioritaire)
- [ ] `sosCallSessionToken` valide la session (anti-replay, TTL court — vérifier la valeur)
- [ ] Wizard sur `sos-call.sos-expat.com` filtré par `agreement.call_types_allowed`
- [ ] Sélection d'un `providerId` explicite court-circuite l'auto-select

**Test E2E browser anonyme** :
1. Aller sur `https://sos-call.sos-expat.com/?code=AUDIT_TEST_2026`
2. Choisir type d'appel
3. Sélectionner provider AAA
4. Soumettre — vérifier dans Firestore `call_sessions/{id}` que `payment.currency` correspond au choix UI

## 7.2 Path B (logged-in)

**Fichiers** :
- `sos/src/pages/BookingRequest.tsx` (lignes ~3151-3260 desktop, ~3719-3740 mobile)
- `sos/firebase/functions/src/createAndScheduleCallFunction.ts` (europe-west1)

**Vérifications** :
- [ ] Frontend passe `currency: detectUserCurrency()`
- [ ] Backend : `(currency === 'usd' || currency === 'eur') ? currency : fallbackFromCountry`
- [ ] Si `partnerCode` valide → branche B2B → skip Stripe → `payment.status = 'isSosCallFree'`

## 7.3 TwilioCallManager (orchestration, ~3000 lignes)

**Fichier** : `sos/firebase/functions/src/TwilioCallManager.ts` (utiliser sub-agent Explore avec "very thorough")

**Points critiques** :
- [ ] Branche B2B (~ligne 2693-2740) :
  - Lit `(callSession as any).currency || sessionPayment.currency || 'eur'`
  - Appelle `getB2BProviderAmount(serviceType, callCurrency)`
  - Écrit : `payment.status='captured_sos_call_free'`, `payment.providerAmount`, `payment.currency`, `payment.holdReason='30d_b2b_reserve'`, `payment.availableFromDate=now+30d`, `isPaid:true`
- [ ] Branche directe : Stripe Connect destination charges, application_fee, hold 7j
- [ ] Gestion `expired-session` (regex couvre FR + EN)
- [ ] AAA exempt no_answer punishment
- [ ] Multi-provider busy propagation : `findParentAccountConfig()` bien appelé
- [ ] **Atomicité** : la finalisation est-elle dans une transaction Firestore ou des updates séparés ? (CRITIQUE — voir §10 Idempotence)

## 7.4 Webhooks Twilio + Cloud Tasks (europe-west3)

**Fichiers** :
- `sos/firebase/functions/src/Webhooks/twilioWebhooks.ts`
- `sos/firebase/functions/src/Webhooks/TwilioConferenceWebhook.ts`
- `sos/firebase/functions/src/scheduled/checkProviderInactivity.ts`

**Vérifications** :
- [ ] Webhook DTMF : `1` (accept) vs `2` (decline) routés correctement
- [ ] Events conférence (`conference-start`, `participant-join`, `conference-end`) déclenchent transitions d'état
- [ ] Cloud Task T+240s timeout créé à la planification
- [ ] checkProviderInactivity exclut `aaa_*` et `isAAA: true`
- [ ] **Webhook signature Twilio** : `validateRequest` appelé sur chaque webhook (HMAC) — sinon CRITIQUE

```bash
grep -rn "validateRequest\|TwilioRequestValidator" sos/firebase/functions/src/Webhooks/
```

## 7.5 Provider selection & busy status

**Fichier** : `sos/firebase/functions/src/callables/providerStatusManager.ts`

- [ ] `findParentAccountConfig()` lookup parent account via `array-contains` query
- [ ] Busy propagation respecte la hiérarchie compte parent
- [ ] Provider AVAILABLE → BUSY : tous les `linkedProviderIds` passent BUSY (si `shareBusyStatus: true`)
- [ ] Index Firestore `users` array-contains `linkedProviderIds`

---

# 8. DOMAINE 3 — SYSTÈME DE PAIEMENT

## 8.1 Direct (Stripe + PayPal B2C)

**Fichiers** :
- `sos/firebase/functions/src/services/pricingService.ts` (`getServiceAmounts`, `getB2BProviderAmount`)
- `sos/firebase/functions/src/services/feeCalculationService.ts` (cache 5 min)
- `sos/firebase/functions/src/triggers/onProviderCreated.ts` (Stripe Express auto)
- `sos/firebase/functions/src/callables/stripeAutomaticKyc.ts`
- `sos/firebase/functions/src/PayPalManager.ts`
- `sos/lib/paymentCountries.ts` (44 Stripe / 150+ PayPal)
- `sos/src/components/payment/CallCheckout.tsx`
- `sos/src/components/payment/WithdrawalRequestForm.tsx`

**Tests fonctionnels** :
- [ ] Provider d'un pays Stripe (US, FR, DE…) reçoit Stripe Express auto via `onProviderCreated`
- [ ] Provider PayPal-country fournit juste un email
- [ ] `isVisible: false` à la création, set `true` par admin via `approveProfile`
- [ ] CurrencySelector écrit dans `localStorage.preferredCurrency`
- [ ] `detectUserCurrency()` lit ce localStorage en priorité
- [ ] Client US choisit EUR → `call_session.payment.currency = 'eur'`
- [ ] Client FR choisit USD → `call_session.payment.currency = 'usd'`

## 8.2 B2B (forfait — paiement immédiat provider)

**Vérifications** :
- [ ] Fin appel B2B → crédit provider IMMÉDIAT (pas d'attente facture partenaire)
- [ ] `payment.holdReason = '30d_b2b_reserve'` + `availableFromDate = now + 30j`
- [ ] Provider voit `reservedB2BAmount` (pas dans `availableBalance`)
- [ ] Après 30j → `releaseProviderPayments` (us-central1) déplace en `available`
- [ ] **CRITIQUE** : si facture partenaire impayée à J+30, le hold reste-t-il OU bascule en `available` ? Vérifier le code (provision pour impayés ?)

**Index Firestore requis** :
```bash
firebase firestore:indexes | grep -A4 "availableFromDate\|partnerFirebaseId"
```
Attendu :
- `(metadata.partnerFirebaseId, payment.status, metadata.createdAt)`
- `(providerId, payment.status, completedAt DESC)`
- `(providerId, payment.status, payment.availableFromDate)`

## 8.3 Withdrawals (retraits)

**Fichiers** :
- `sos/firebase/functions/src/callables/createWithdrawalRequest.ts`
- `sos/firebase/functions/src/triggers/onWithdrawalStatusChanged.ts`
- `sos/src/components/payment/WithdrawalRequestForm.tsx`
- `sos/src/components/payment/AffiliateBankDetails.tsx`

**Vérifications** :
- [ ] Seuil min `$30` partout : 4 enums TS + frontend forms + admin configs + **9 langues i18n**
- [ ] Frais `$3` fixe via `admin_config/fees`
- [ ] `createWithdrawalRequest` écrit `withdrawalFee: 300` + `totalDebited: amount + 300`
- [ ] 3 paths refund (cancel/reject/fail) utilisent `totalDebited || amount`
- [ ] WithdrawalRequestForm affiche breakdown
- [ ] "Tout retirer" UI : `availableBalance - SOS_WITHDRAWAL_FEE_CENTS`
- [ ] Affiliate Mobile Money : détection `user.country` dans `FLUTTERWAVE_COUNTRIES`
- [ ] Wise mismatch : frontend `'wise'` → backend `'bank_transfer'` (UX incohérente après reload)

## 8.4 Commissions / Affiliate

**Fichiers** :
- `sos/firebase/functions/src/services/chatterCommissionService.ts`
- `sos/src/components/payment/CommissionsHistoryTab.tsx`
- `sos/firebase/functions/src/triggers/onCallCompleted.ts`

**Vérifications** :
- [ ] Multiplicateurs Chatter SUPPRIMÉS : `finalAmount = baseAmount`
- [ ] `affiliate_notifications` + `group_admin_notifications` créées par triggers
- [ ] CommissionsHistoryTab : pagination, filtre, export CSV BOM (`﻿`) UTF-8

## 8.5 CGU & conformité légale paiement

- [ ] CGU provider v3.0 en Firestore prod (`legal_documents`, type `terms_lawyers` / `terms_expats`)
- [ ] Article B2B Fees présent en **9 langues**
- [ ] Termes : « Honoraires » / « tiers payeur » / « Prestataire de paiement agréé »
- [ ] CGU affilié centralisée (`terms_affiliate`)
- [ ] `termsAffiliateVersion: "1.0"` + `termsAffiliateType: "terms_affiliate"` stockés (eIDAS/RGPD)

## 8.6 Currency edge cases (NOUVEAU — P1)

- [ ] Si `agreement.billing_currency = EUR` et clients paient en `USD` (B2B), comment est consolidée l'invoice ?
- [ ] Taux de change figé à quel moment ? (ECB ? Stripe ?)
- [ ] `pricing_tier` snapshot conserve la devise utilisée
- [ ] Provider rémunéré en `payment.currency` du call_session, indépendant de `agreement.billing_currency`

```bash
grep -rn "exchange_rate\|convertCurrency\|forex" sos/firebase/functions/src/ partner_engine_sos_expat/app/
```

---

# 9. DOMAINE 4 — CONSOLES D'ADMINISTRATION

## 9.1 Admin SOS-Expat (sos/src/pages/admin/)

```bash
find sos/src/pages/admin -name "*.tsx" -type f | head -30
```

**Tabs critiques** :
- [ ] `IaMultiProvidersTab.tsx` — linkProvider, unlinkProvider, toggleShareBusyStatus, deleteAccount écrivent les champs **dénormalisés** sur chaque provider doc
- [ ] Pricing admin tab — modifier `lawyer.b2b.eur.providerAmount` propage au prochain call (cache 5 min)
- [ ] Withdrawal management — admin approve/reject/fail
- [ ] Provider approval (`approveProfile`) flip `isVisible: false → true`
- [ ] User management (search, ban, role)

**Test** : ouvrir `https://sos-expat.com/admin` (logged in admin) → cliquer chaque nav, pas de 404 console

## 9.2 Filament admin Partner Engine

URL : `https://partner-engine.sos-expat.com/admin`

**À tester côté humain** :
- [ ] Login → 2FA email opt-in si activé → code par email → saisie 6 chiffres
- [ ] Dashboard : 2 tuiles KPI (EUR + USD) + ProviderHoldsWidget
- [ ] Liste partenaires : badge `legal_status` visible
- [ ] Modèles Légaux : 6 templates, colonne "Contenu" badge "Défaut (code)" / "Personnalisé"
- [ ] Aperçu d'un template → modal avec contenu Blade rendu

## 9.3 Dashboard-multiprestataire (PWA)

**Repo séparé** : à localiser dans le workspace

- [ ] React 18 + Vite + Tailwind + VitePWA
- [ ] CSV export utilise BOM `﻿`
- [ ] Pas d'`alert()` (uniquement `toast()`)
- [ ] Sort client-side (évite index Firestore composite)
- [ ] Roles : `agency_manager` ou `admin`
- [ ] Real-time via `onSnapshot` dans `useAgencyProviders`
- [ ] ErrorBoundary class component wraps app
- [ ] Nested router : ProtectedRoute > AppLayout > pages

## 9.4 Outil-sos-expat (provider AI tool)

**Repo séparé** Firebase distinct :
- [ ] Présence du repo dans le workspace
- [ ] Build OK (`npm run build`)
- [ ] Déployé séparément
- [ ] Pas de mélange avec sos-urgently-ac307

---

# 10. SÉCURITÉ — OWASP-mini (P0 si manquant)

## 10.1 Secrets dans le repo

```bash
# Aucun service-account JSON en dehors de security-audit/backups/
find . -maxdepth 6 -name "*adminsdk*.json" -o -name "serviceAccountKey.json" 2>/dev/null | grep -v "security-audit/backups"

# Aucune clé Stripe live dans le code
grep -rn "sk_live_\|pk_live_" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.php" sos/src sos/firebase/functions/src partner_engine_sos_expat/app

# Aucun token Twilio en clair
grep -rn "AC[0-9a-f]\{32\}" --include="*.ts" sos/firebase/functions/src
```

**Si un secret en clair → P0 IMMÉDIAT, alerte l'utilisateur, n'inclus PAS le secret dans le rapport.**

## 10.2 Webhook signatures

- [ ] **Twilio** : `TwilioRequestValidator` ou équivalent sur tous les webhooks
- [ ] **Stripe** : `stripe.webhooks.constructEvent(body, signature, secret)` avec `Stripe-Signature` header
- [ ] **PayPal** : signature IPN ou Webhook v2

```bash
grep -rn "validateRequest\|constructEvent\|verifyWebhookSignature" sos/firebase/functions/src/Webhooks/
```

## 10.3 CSRF / XSS

- [ ] Filament : `@csrf` automatique sur tous les forms
- [ ] Blade : `{{ $var }}` partout (échappé), pas de `{!! $var !!}` sauf raison documentée
- [ ] React : pas de `dangerouslySetInnerHTML` sauf JSON-LD ou contenu Trusted

```bash
grep -rn "dangerouslySetInnerHTML\|{!! " sos/src partner_engine_sos_expat/resources
```

## 10.4 SQL injection

- [ ] Tous les query Eloquent passent par binding (`?` paramétré)
- [ ] Pas de `DB::raw($userInput)`, pas de `DB::statement` avec input non sanitizé

```bash
grep -rn "DB::raw\|DB::statement\|whereRaw" partner_engine_sos_expat/app/
```

## 10.5 Firestore Rules

**Fichier** : `sos/firebase/firestore.rules` (le lire intégralement)

- [ ] `admin_config/*` : write réservé `request.auth.token.admin == true`
- [ ] `users/{uid}` : un user ne peut écrire que ses propres champs (et JAMAIS `isAdmin`, `isVisible`, `linkedProviderIds`)
- [ ] `call_sessions/*` : read par participants, write par Cloud Functions uniquement
- [ ] `withdrawal_requests/*` : write par owner, status changes par admin/Functions
- [ ] `legal_documents/*` : read public (versions publiées), write admin

## 10.6 CORS allowlist

**Fichier** : `sos/firebase/functions/src/index.ts` ou `corsConfig.ts`

- [ ] Allowlist explicite (pas `*`)
- [ ] Inclus : `sos-expat.com`, `www.sos-expat.com`, `sos-call.sos-expat.com`, `admin.sos-expat.com`, `partner-engine.sos-expat.com`
- [ ] **Exclu** : tout domain non listé → 403

## 10.7 Replay attacks

- [ ] `sosCallSessionToken` : TTL court (< 10 min ?), single-use (consumed après création call_session)
- [ ] JWT Filament : expiration < 24h, rotation à login
- [ ] CSRF token Laravel : régénéré à chaque submit

## 10.8 Privilege escalation

**Tester** :
- [ ] Un user normal peut-il appeler `approveProfile` (admin only) ? → tester avec un token user normal
- [ ] Un partenaire peut-il lire un autre partenaire via API public ? → tester
- [ ] Un branch_manager peut-il modifier un agreement hors de son `managed_group_labels` ?

## 10.9 Session expiration & password reset

- [ ] Filament : timeout session ? Configurable via `auth.guards.web.lifetime` ?
- [ ] Frontend : Firebase Auth refresh token rotation
- [ ] Password reset : token usage limit, TTL court

---

# 11. IDEMPOTENCE & TRANSACTIONS (P0 critique)

**Tester chaque endpoint avec double-soumission** (curl 2x rapide ou onSubmit double-clic) :

| Endpoint | Comportement attendu |
|---|---|
| `createAndScheduleCall` | 2ème call → idem 1er (même call_session) ou rejet (idempotency_key) |
| `triggerSosCallFromWeb` | Idem |
| `createWithdrawalRequest` | 1 seul withdrawal créé, balance débitée 1 fois |
| `recordSignature` (legal) | 1 seule acceptance, doc en `signed` une fois |
| `legal_override` (Filament action) | 1 audit log, pas de double-flip |

**Fichiers à vérifier pour transactions Firestore** :
```bash
grep -rn "runTransaction\|firestore.runTransaction\|FieldValue.increment" sos/firebase/functions/src/callables/ sos/firebase/functions/src/triggers/
```

**Critique** :
- [ ] **Crédit provider** dans `TwilioCallManager` (B2B branch ~2693) : update isolé ou `runTransaction` ?
- [ ] **Withdrawal** : balance update + withdrawal create dans même transaction
- [ ] **Refund** : balance refund + status update atomic
- [ ] **B2B reserve release** : `releaseProviderPayments` batch atomic ?

---

# 12. CRONS & SCHEDULED FUNCTIONS

**Liste à auditer** :

| Cron | Fichier | Fréquence | Last-success ? |
|---|---|---|---|
| `releaseProviderPayments` | `sos/firebase/functions/src/scheduled/releaseProviderPayments.ts` | ? | ? |
| `GenerateMonthlyInvoices` | `partner_engine_sos_expat/app/Console/Commands/GenerateMonthlyInvoices.php` | Monthly | ? |
| `checkProviderInactivity` | `sos/firebase/functions/src/scheduled/checkProviderInactivity.ts` | 15 min | ? |
| `checkExpiredSessions` | `sos/firebase/functions/src/scheduled/...` | ? | ? |
| `dailyReportToTelegram` | `sos/firebase/functions/src/scheduled/...` | Daily | ? |
| `firestoreBackup` | ? | Daily | ? |

**Vérifs** :
```bash
# Liste des scheduled functions Firebase
firebase functions:list 2>&1 | grep -i "scheduled\|cron"

# Last invocation logs
firebase functions:log --only releaseProviderPayments --limit 5

# Laravel scheduler
ssh root@95.216.179.163 'docker logs pe-scheduler --tail 100 2>&1 | grep -E "Running|finished|error"'
```

**Acceptance** :
- [ ] Chaque cron a une dernière exécution `< sa fréquence + tolérance`
- [ ] Aucun cron silencieux depuis > 24h sans raison documentée
- [ ] Pas de cron qui fail en boucle (retry storm)

---

# 13. BACKUPS & DISASTER RECOVERY

## 13.1 Firestore exports

```bash
gcloud firestore operations list --filter="metadata.operationType=EXPORT_DOCUMENTS" --project=sos-urgently-ac307 --limit=5
```

- [ ] Export quotidien planifié
- [ ] Bucket cible identifié, quotas OK
- [ ] Last-success < 48h
- [ ] Restore drill documenté (et testé dans les 6 derniers mois)

## 13.2 PostgreSQL Partner Engine

```bash
ssh root@95.216.179.163 'ls -lah /opt/partner-engine/backups/ | tail -10'
ssh root@95.216.179.163 'docker exec pe-postgres pg_dump -U postgres partner_engine | gzip > /tmp/test_dump.sql.gz; ls -lh /tmp/test_dump.sql.gz'
```

- [ ] `pg_dump` planifié (cron host ou Laravel scheduler)
- [ ] Backups en off-site (S3, Hetzner Storage Box, etc.)
- [ ] Retention 30+ jours
- [ ] Restore drill documenté

## 13.3 RPO / RTO

- [ ] RPO (Recovery Point Objective) documenté : combien de minutes/heures de data peut-on perdre ?
- [ ] RTO (Recovery Time Objective) documenté : combien de temps pour restaurer ?
- [ ] Plan d'urgence si Hetzner VPS perdu (DNS failover, backup VPS prêt ?)

---

# 14. PERFORMANCE & LATENCY BUDGETS

| Endpoint | Budget | Mesure |
|---|---|---|
| `createAndScheduleCall` | < 2s p95 | `firebase functions:log --only createAndScheduleCall \| grep latency` |
| `triggerSosCallFromWeb` | < 2s p95 | idem |
| Edge cache hit | < 100ms | `curl -w "%{time_total}\n" https://www.sos-expat.com/...` |
| Filament admin pages | < 1.5s | DevTools Network |
| Twilio webhooks | < 500ms (Twilio timeout 15s) | logs |
| Firestore queries critiques | < 200ms | `console.time/timeEnd` |

**Cloudflare Worker test** :
```bash
curl -I -H "User-Agent: AuditBot" https://www.sos-expat.com/blog/test-article
# Attendu : cf-cache-status: HIT (deuxième hit)
# Attendu : x-edge-cache-served-at présent
```

---

# 15. i18n COMPLETENESS (9 langues)

**Frontend** :
```bash
node -e "
const langs = ['fr','en','es','de','pt','ru','zh','ar','hi'];
const data = {};
for (const l of langs) {
  try { data[l] = JSON.parse(require('fs').readFileSync(\`sos/src/helper/\${l}.json\`,'utf8')); }
  catch (e) { console.log(\`[MISSING] \${l}.json\`); }
}
const reference = data.fr || {};
const flat = (o, p='') => Object.entries(o).flatMap(([k,v]) => typeof v === 'object' && v !== null ? flat(v, p+k+'.') : [p+k]);
const refKeys = new Set(flat(reference));
for (const l of langs) {
  if (!data[l]) continue;
  const lKeys = new Set(flat(data[l]));
  const missing = [...refKeys].filter(k => !lKeys.has(k));
  console.log(\`\${l}: \${missing.length} clés manquantes (sur \${refKeys.size})\`);
}
"
```

**Filament admin** (Partner Engine) :
```bash
ssh root@95.216.179.163 'docker exec pe-app php -r "
\$fr = require \"/var/www/html/lang/fr/admin.php\";
\$en = require \"/var/www/html/lang/en/admin.php\";
\$flat = function (\$arr, \$p=\"\") use (&\$flat) {
  \$out = [];
  foreach (\$arr as \$k=>\$v) { if (is_array(\$v)) \$out = array_merge(\$out, \$flat(\$v, \$p.\$k.\".\")); else \$out[] = \$p.\$k; }
  return \$out;
};
\$frKeys = \$flat(\$fr); \$enKeys = \$flat(\$en);
echo \"FR keys: \".count(\$frKeys).PHP_EOL;
echo \"EN keys: \".count(\$enKeys).PHP_EOL;
echo \"Missing in EN: \".count(array_diff(\$frKeys, \$enKeys)).PHP_EOL;
"'
```

---

# 16. ANTI-PATTERNS À FLAGGER

```bash
# console.log de données sensibles
grep -rn "console.log.*password\|console.log.*token\|console.log.*secret\|console.log.*apiKey" sos/src sos/firebase/functions/src

# alert() (proscrit dans Dashboard PWA)
grep -rn "alert(" sos/src

# any: TypeScript strict ?
grep -rn ": any\b" sos/src sos/firebase/functions/src | wc -l   # < 50 idéalement

# Awaits manquants (.then sans rethrow)
grep -rn "\.then(" sos/firebase/functions/src | grep -v "\.catch"

# Hardcoded URLs prod
grep -rn "sos-urgently-ac307\|95.216.179.163" sos/src sos/firebase/functions/src

# Migrations rollback testées ?
ssh root@95.216.179.163 'docker exec pe-app php artisan migrate:status | wc -l'
# Tester un down() (en preprod uniquement) : artisan migrate:rollback --pretend
```

---

# 17. TESTS DE BOUT EN BOUT (5 GOLDEN PATHS)

## 17.1 Scénario 1 — Client direct B2C, Stripe FR
1. Anonyme arrive sur `sos-expat.com` (FR)
2. Choisit avocat 49€ → CallCheckout
3. CurrencySelector affiche EUR par défaut (navigator.language=fr)
4. Paie via Stripe `4242…` → `createAndScheduleCall` créé
5. Provider reçoit appel via Twilio → DTMF `1` → conférence
6. Appel terminé → `TwilioCallManager` finalise → `payment.status='captured'` + `providerAmount=30`
7. Après 7j → `releaseProviderPayments` → `availableBalance` augmente
8. Provider demande retrait → withdrawal request créée + frais $3 déduits

**Acceptance** : chaque étape produit les bons docs Firestore, emails, notifications Telegram.

## 17.2 Scénario 2 — Client B2B partenaire, choix USD
1. Anonyme va sur `sos-call.sos-expat.com/?code=AUDIT_TEST_2026`
2. CurrencySelector → USD
3. Choisit expat → wizard filtré par `agreement.call_types_allowed=['expat']`
4. Soumet → `triggerSosCallFromWeb` créé avec `clientCurrency='usd'`
5. **Pas de page paiement** — call_session direct
6. Provider AAA reçoit appel → conférence → terminé
7. Backend : `payment.status='captured_sos_call_free'`, `currency='usd'`, `providerAmount=7`, `availableFromDate=now+30j`, `holdReason='30d_b2b_reserve'`
8. Provider voit `7$` en `reservedB2BAmount` (pas en `available`)
9. À J+30 → released
10. Fin de mois → `GenerateMonthlyInvoices` crée invoice partenaire
11. Partenaire paie → audit log

## 17.3 Scénario 3 — Partenaire signe ses CGU avant activation
1. Admin crée Agreement avec `sos_call_active = false`
2. Tente `sos_call_active = true` → `RuntimeException` ✅
3. "Générer drafts" → 3 docs en draft
4. "Valider tous & envoyer" → email partenaire
5. Partenaire ouvre lien → `GET /api/partner/legal-documents` → 3 docs
6. Partenaire signe chaque doc → `partner_legal_acceptances` row
7. Après 3ème : `legal_status = 'signed'`
8. Admin recoche `sos_call_active = true` → OK ✅

## 17.4 Scénario 4 — Override admin (contrat papier)
1. Admin reçoit contrat papier signé
2. Action "Activer override légal" → raison "contrat papier 22/04/2026"
3. `legal_override = true`, `legal_status = 'override'`, audit log
4. Activer `sos_call_active = true` → OK ✅
5. Si plus tard partenaire signe e-docs → override débrayable sans casser

## 17.5 Scénario 5 — Multi-provider busy propagation
1. Compte parent A avec `linkedProviderIds: [B, C]` + `shareBusyStatus: true`
2. Provider B accepte appel → BUSY
3. C passe AUTOMATIQUEMENT BUSY (via `findParentAccountConfig`)
4. Appel terminé → B repasse AVAILABLE
5. C repasse AVAILABLE également

---

# 18. LIVRABLE FINAL

À la fin de l'audit, produis `RAPPORT-AUDIT-E2E-{YYYY-MM-DD}.md` à la racine du repo `sos-expat-project` :

```markdown
---
audit_date: 2026-MM-DD
auditor: <agent-name>
duration_hours: X
scope: voir prompt source
---

# Rapport audit E2E SOS-Expat — {DATE}

## Synthèse exécutive (TL;DR — 5 lignes max)
…

## Score global : X/100

| Domaine | Score | P0 | P1 | P2 |
|---|---|---|---|---|
| 1. Système Partenaire | X/100 | N | N | N |
| 2. Système d'Appels | X/100 | N | N | N |
| 3. Système de Paiement | X/100 | N | N | N |
| 4. Consoles d'admin | X/100 | N | N | N |
| 5. Sécurité | X/100 | N | N | N |
| 6. Idempotence | X/100 | N | N | N |
| 7. Crons & DR | X/100 | N | N | N |
| 8. Performance | X/100 | N | N | N |
| 9. i18n | X/100 | N | N | N |

## Findings (classés par priorité)

### P0 — bloquants production
(format §5)

### P1 — importants mais non-bloquants
(format §5)

### P2 — nice-to-have
(format §5)

## Plan d'action priorisé (top 10)

| # | Pri | Item | Fichier | Effort | Impact métier |
|---|-----|------|---------|--------|---------------|
| 1 | P0 | … | … | S | Perte revenus |

## Annexe A — Commandes lancées
(historique exhaustif chronologique avec output succinct)

## Annexe B — Ce qui n'a pas pu être vérifié
(transparence : si SSH refusé, si secret manquant, etc.)

## Annexe C — Ce qui est hors scope
(rappel des items déclarés out_of_scope dans le front-matter)
```

---

# 19. RÈGLES POUR L'AUDITEUR (relire avant de commencer)

1. **Lis le code, ne suppose pas.** Vérifier le vrai fichier.
2. **Multi-tool calls en parallèle** quand checks indépendants.
3. **Ne push rien**, ne modifie rien sans accord explicite.
4. **Cite chemins absolus** (`fichier:ligne`) dans le rapport.
5. **Test la prod** quand l'utilisateur autorise SSH + Firestore admin SDK.
6. **Reste silencieux** sur les choses qui marchent — pointe ce qui demande de l'attention.
7. **Pas de jargon** dans le rapport final — l'utilisateur n'est pas développeur senior, traduis l'impact en langage métier.
8. **Vérifie le périmètre légal** (RGPD, mention « avocats inscrits au barreau », « Prestataire de paiement agréé »).
9. **Si tu trouves un secret en clair** → P0, alerte, NE le mets PAS dans le rapport.
10. **Tu n'inventes pas de bug** : si tu n'es pas sûr, dis « je n'ai pas pu vérifier parce que… ».
11. **Don't over-invest** : un audit doit produire un rapport, pas être perfectionniste à 100%. À 90% de couverture, livre.
12. **Auto-mode bienvenu** : exécute, pas de plans interminables.
13. **Anti-pattern : sub-agent pour un fichier de 30 lignes**. Lis-le toi-même. Sub-agent réservé aux explorations >20 fichiers.
14. **Time-box chaque section** : si tu n'as pas trouvé en 30 min, passe à la suivante et marque "à creuser".
15. **L'utilisateur est francophone et travaille seul** : rapport en français, ton direct, pas de bullshit corporate.

---

# 20. CE QUI EST HORS SCOPE (à ne pas creuser, mais à mentionner si touché)

| Item | Raison hors scope | Si touché par l'audit |
|---|---|---|
| Telegram-Engine (`engine_telegram_sos_expat`) | Système séparé sur autre VPS | Mentionner intégration `forwardEventToEngine()` mais pas auditer en profondeur |
| Backlink-Engine | Système indépendant | Idem |
| Mailflow / presse@* | Email infra séparée | Vérifier seulement que les emails partner_legal partent |
| Blog Content Engine + KB | Pipeline indépendant | Hors scope |
| SEO / sitemaps / hreflang | Domaine SEO séparé | Hors scope |
| Influenceur / Chatter / Blogger / GroupAdmin | Système d'affiliation distinct | Sauf si touche le paiement (withdrawals communs) |
| Outil-sos-expat (provider AI tool) | Projet Firebase distinct | Vérifier seulement présence + build |

---

**Bonne chasse. L'utilisateur compte sur toi pour transformer cette plateforme en quelque chose de production-ready à l'échelle mondiale.** 🌍🚀

> **Date de génération du prompt** : 2026-04-25
> **Version** : 2.0
> **Auteur** : Claude Opus 4.7 (1M context) avec validation utilisateur (William)
