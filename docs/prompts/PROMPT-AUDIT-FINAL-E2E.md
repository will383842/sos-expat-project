# MEGA-PROMPT : Audit E2E Final — Pipeline de Contenu SOS-Expat.com (2026)

## MISSION

Tu es une équipe d'audit de 10 experts seniors. Tu dois vérifier que TOUT le pipeline de contenu fonctionne PARFAITEMENT de bout en bout. L'audit doit être EXHAUSTIF — chaque fichier lu, chaque flux testé, chaque scénario vérifié. Tu dois LIRE LE CODE SOURCE, pas deviner. Tu dois TESTER EN LIVE via WebFetch et SSH. Tu dois CROISER les données entre les 3 codebases.

**Communique TOUJOURS en français.**

---

## ARCHITECTURE DU PIPELINE

```
[Orchestrateur MC — 18 types × distribution %]
    ↓
[GenerateFromSourceJob — sélection aléatoire d'un item source]
    ↓
[GenerateArticleJob — 15 phases IA (GPT-4o titre/contenu, GPT-4o-mini meta/FAQ)]
    ├─ Phase 1-3: Validation + Recherche Perplexity + Titre (GPT-4o)
    ├─ Phase 4-5: Excerpt + Contenu principal (GPT-4o)
    ├─ Phase 6-9: FAQ + Meta + AEO + Liens internes (GPT-4o-mini)
    ├─ Phase 10-13: Image + SEO Score + Quality Check + Anti-plagiat
    └─ Phase 14-15: JSON-LD + Publication
    ↓
[QualityGuard — score ≥ 60 + pas de brand issues → auto-publish]
    ↓
[PublishContentJob → BlogPublisher → Blog Laravel /api/v1/articles]
    ↓
[Blog: ArticleApiController — validation + catégorisation intelligente + Unsplash auto]
    ↓
[TranslateArticleJob → 8 × TranslateSingleLanguageJob (GPT-4o-mini)]
    ↓
[9 ArticleTranslation publiées + IndexNow + sitemap]
    ↓
[Cloudflare Worker route vers VPS Blog → sos-expat.com]
```

**Pipeline séparé News RSS :**
```
[FetchRssFeedsJob (4h) → RelevanceFilterService (GPT-4o-mini score)]
    ↓
[RunNewsGenerationJob (08h UTC) → NewsGenerationService]
    ├─ Passe 1: Extraction faits (GPT-4o-mini)
    ├─ Passe 2: Rédaction (Claude Sonnet, fallback GPT-4o-mini)
    ├─ Anti-plagiat Jaccard < 30%
    └─ POST direct → Blog /api/v1/webhook/article
    ↓
[Blog: WebhookController — validation + Unsplash + TranslateArticleJob]
```

---

## CODEBASES (chemins exacts)

| Codebase | Chemin local | Rôle |
|----------|-------------|------|
| **Mission Control** | `Outils_communication/Mission_control_sos-expat/laravel-api/` | Génération + orchestration |
| **Blog Laravel** | `Blog_sos-expat_frontend/` | Réception + affichage + traduction |
| **SPA React** | `sos-expat-project/sos/` | App principale |
| **Cloudflare Worker** | `sos-expat-project/sos/cloudflare-worker/worker.js` | Routage SPA ↔ Blog |

---

## 12 AXES D'AUDIT

### AXE 1 : Pipeline de génération — vérifie que les 18 types se génèrent

Pour CHAQUE type, vérifie via SSH (`root@95.216.179.163`) :
```bash
docker exec inf-app php artisan tinker --execute="
\$dist = json_decode(DB::table('content_orchestrator_config')->first()->type_distribution, true);
arsort(\$dist);
foreach (\$dist as \$type => \$pct) echo \"\$type: \$pct%\" . PHP_EOL;
echo 'Status: ' . DB::table('content_orchestrator_config')->first()->status;
echo ' | Target: ' . DB::table('content_orchestrator_config')->first()->daily_target;
echo ' | Today: ' . DB::table('content_orchestrator_config')->first()->today_generated . PHP_EOL;
echo 'Failed jobs: ' . DB::table('failed_jobs')->count() . PHP_EOL;
echo 'Items source ready: ' . DB::table('generation_source_items')->where('processing_status','ready')->count() . PHP_EOL;
"
```

Vérifie aussi :
- `SKIP_ALL_GENERATION` est bien `false` dans `GenerateFromSourceJob.php`
- `SKIP_SOURCES` ne contient que `annuaires`
- La sélection des items est bien `inRandomOrder()` (pas orderByDesc)
- Les `DAILY_LIMITS` dans `GenerationSchedulerService.php` sont suffisants

### AXE 2 : Publication automatique — vérifie que les articles arrivent sur le Blog

- `GenerateArticleJob.php` : la variable `$canPublish` est bien définie (pas `$qualityPassed`)
- Score ≥ 60 ET pas d'issues → auto-publish
- `PublishContentJob.php` : `isWithinSchedule()` supporte les 3 formats de jours (abrév, complet, int)
- `retryUntil()` s'adapte au `scheduled_at`
- `PublicationSchedule` : limites suffisantes (200/jour, 20/heure)

Teste la publication en live :
```bash
docker exec inf-postgres psql -U inf_user -d mission_control -c "SELECT status, count(*) FROM publication_queue GROUP BY status;"
```

### AXE 3 : Réception Blog — validation + catégorisation + images

Vérifie dans `WebhookController.php` ET `ArticleApiController.php` :
- Les 19 content_types sont acceptés dans la validation
- Le mapping `match(true)` content_type → catégorie est cohérent entre les 2 fichiers
- Le smart category mapping (regex keywords → visa-immigration, sante-assurance, etc.) fonctionne
- **Unsplash auto-fetch** est présent dans les DEUX contrôleurs (pas seulement WebhookController)
- `Purifier::clean()` est appliqué sur le HTML
- L'image alt utilise le titre (pas l'alt générique Unsplash)

### AXE 4 : Traduction automatique — 9 langues

Vérifie via SSH :
```bash
docker exec blog-app php artisan tinker --execute="
\$articles = \App\Models\Article::where('status','published')->with('translations')->get();
\$incomplete = \$articles->filter(fn(\$a) => \$a->translations->count() < 9);
echo 'Total: ' . \$articles->count() . ' | Incomplets: ' . \$incomplete->count() . PHP_EOL;
foreach (\$incomplete as \$a) echo '  [' . \$a->translations->count() . '/9] ' . substr(\$a->translations->first()->title ?? '?', 0, 50) . PHP_EOL;
echo 'Jobs pending: ' . DB::table('jobs')->where('queue','translations')->count() . PHP_EOL;
echo 'Jobs failed: ' . DB::table('failed_jobs')->where('queue','translations')->count() . PHP_EOL;
"
```

Vérifie dans le code :
- `TranslateArticleJob` accepte `Article|string` (UUID)
- `TranslateSingleLanguageJob` a `string $articleId` (pas int)
- `json_ld` stocké en array brut (pas json_encode)
- `Purifier::clean()` sur le HTML traduit
- `failed()` avec alerte Telegram
- 2 workers traduction (blog-queue + blog-translation-worker)

### AXE 5 : SEO technique — tester en LIVE

Fetch ces URLs avec WebFetch :
- `https://sos-expat.com/sitemap.xml` → structure valide, sous-sitemaps par langue
- `https://sos-expat.com/robots.txt` → crawlers AI autorisés
- `https://sos-expat.com/llms.txt` → section Pricing présente
- `https://sos-expat.com/ai.txt` → prix + date dynamique
- `https://sos-expat.com/.well-known/indexnow-key.txt` → clé présente
- `https://sos-expat.com/api/search/suggest?q=visa&lang=fr` → JSON valide

### AXE 6 : SEO on-page — vérifier sur un article LIVE

Fetch un article en FR, EN et AR. Pour chaque langue vérifier :
- `<title>` traduit, < 60 chars, mot-clé + année + pays
- `<meta description>` traduite, 120-155 chars, verbe d'action
- `og:site_name` = "SOS-Expat & Travelers" (avec tiret)
- `og:locale` correct (fr_FR, en_US, ar_SA)
- `hreflang` pour 9 langues + x-default
- `<html dir="rtl">` pour l'arabe
- Slug ASCII (pas de caractères Unicode)
- JSON-LD : Author Person (pas Organization), Speakable, FAQPage, BreadcrumbList
- `disambiguatingDescription` présent
- Featured snippet (40-60 mots, premier paragraphe)
- robots : `max-image-preview:large, max-snippet:-1`

### AXE 7 : E-E-A-T — vérifier les 5 templates

Pour CHAQUE template (`articles/show`, `news/show`, `faq/show`, `countries/hub`, `countries/show`) :
- Auteur humain visible (nom + titre, pas juste "SOS-Expat")
- Author Person dans JSON-LD
- Sources avec trust_score
- Disclaimer légal multilingue
- Date de publication + date de mise à jour
- Sticky CTA mobile
- Language switcher
- Breadcrumbs HTML + JSON-LD
- Maillage interne "Pour aller plus loin"
- Tags cliquables

### AXE 8 : Conformité & terminologie

Grep dans les 2 codebases (HORS règles NEVER) :
- "MLM" → INTERDIT
- "recruter" / "recruit" → INTERDIT
- "salarié" / "salarie" → INTERDIT
- "recrutement" → INTERDIT
- "SOS Expat" sans tiret → INTERDIT (doit être "SOS-Expat")
- "simulé" dans les prompts → INTERDIT

Vérifier les prix dans `knowledge-base.php` vs Firebase `defaultPlans.ts` :
- Avocat : 49€/55$, payout 30€/30$, 20 min
- Expert : 19€/25$, payout 10€/10$, 30 min

### AXE 9 : Anti-plagiat — vérifie les 4 niveaux

1. Pré-génération : `GenerationGuardService` (slug + titre Jaccard > 0.50 + cross-source)
2. Post-génération : `SimilarityCheckerService` (trigrammes Jaccard source vs généré < 30%)
3. Inter-articles : `ContentPostProcessor` (shingling 5-mots vs 50 derniers)
4. Doublon global : titre Jaccard > 0.80 tous pays

Vérifier les scores de similarité des articles récents :
```bash
docker exec inf-postgres psql -U inf_user -d mission_control -c "SELECT id, similarity_score, title FROM rss_feed_items WHERE status = 'published' ORDER BY updated_at DESC LIMIT 10;"
```

### AXE 10 : Performance & Coûts

- `CostTrackerService` : `shouldBlock()` par défaut `true`
- Budget journalier et mensuel configurés
- Phases non-critiques sur GPT-4o-mini (pas GPT-4o)
- Fallback GPT-4o-mini dans `NewsGenerationService` quand Claude 5xx
- Fallback Claude Haiku dans `TranslationService`
- Images Unsplash en `w=1200` (pas 1080) pour Google Discover
- Cache Unsplash 24h (nulls = 1h)
- `LinkInjectorService` : max 5 internes + 3 externes

Coûts du jour :
```bash
docker exec inf-app php artisan tinker --execute="
echo 'Today: ' . (DB::table('api_costs')->where('created_at','>=',now()->startOfDay())->sum('cost_cents') / 100) . ' USD' . PHP_EOL;
echo 'Budget: ' . config('services.ai.daily_budget', 5000) / 100 . ' USD' . PHP_EOL;
"
```

### AXE 11 : Cloudflare Worker — routage

Vérifier que tous les segments sont synchronisés avec `route-segments.php` du Blog :
- Articles, news, pays, outils, annuaire, galerie, sondages, guides, programme, search, FAQ
- Pas de segments fantômes (segments dans le Worker qui n'existent pas dans le Blog)
- Alias 301 corrects
- Pages SPA NON routées vers le Blog
- Fallback SPA si Blog down

### AXE 12 : Monitoring & alertes

- `CheckApiHealthCommand` : check quotidien des 4 APIs
- Alertes Telegram sur : PublishContentJob failed, TranslateArticleJob failed, NewsGeneration failed
- `QualityGuardService` : détecte MLM/recruter/salarié/recrutement
- Backup off-site dans `backup.sh` (rsync Hetzner Storage Box)
- Backup schedulé dans `console.php` (02:30 UTC)

---

## TESTS E2E — 8 scénarios

**Scénario 1 : Article classique auto-généré**
→ L'orchestrateur sélectionne un type → génère → QualityGuard → auto-publish → Blog → traduction 9 langues → visible sur sos-expat.com avec image + FAQs + hreflang

**Scénario 2 : News RSS**
→ RSS fetch → scoring pertinence → génération avec anti-plagiat → POST webhook Blog → image Unsplash → traduction 9 langues → visible sur /actualites-expats

**Scénario 3 : Article souffrance (pain_point)**
→ Type sélectionné (20% distribution) → intent "urgency" → encadré urgence → CTA urgent → publication → visible avec catégorie correcte

**Scénario 4 : Changement de langue**
→ Sur un article FR → cliquer sur EN → URL traduite correcte → contenu traduit → hreflang cohérent → slug ASCII

**Scénario 5 : Recherche**
→ /api/search/suggest?q=visa&lang=fr → résultats JSON → liens accessibles

**Scénario 6 : Article sans image**
→ Vérifier que ZÉRO article publié n'a pas d'image → si trouvé, diagnostiquer pourquoi

**Scénario 7 : Budget API épuisé**
→ Vérifier que `shouldBlock()` = true → le pipeline s'arrête proprement → alerte Telegram

**Scénario 8 : Stock source épuisé**
→ Vérifier que l'orchestrateur skip le type vide → continue avec les autres → pas de crash

---

## FORMAT DU RAPPORT

### Pour CHAQUE axe :

```
## AXE X : [Nom]

### ✅ Points positifs
- [ce qui fonctionne bien, avec preuve fichier:ligne]

### ❌ Problèmes critiques (P0)
- [Problème] — Fichier: ligne — Impact — Fix proposé

### ⚠️ Problèmes importants (P1)
- [Problème] — Fichier: ligne — Impact — Fix proposé

### 💡 Améliorations recommandées (P2)
- [Recommandation] — Bénéfice attendu

### 📊 Tests effectués
- [Test] → [Résultat] → [PASS/FAIL]
```

### En fin de rapport :

```
## CHECKLIST PRODUCTION READY

| Critère | Status | Détail |
|---------|--------|--------|
| Pipeline 18 types fonctionnel | ✅/❌ | ... |
| Auto-publication opérationnelle | ✅/❌ | ... |
| Traduction 9 langues complète | ✅/❌ | ... |
| Images Unsplash sur tous les articles | ✅/❌ | ... |
| SEO/AEO parfait sur les 5 templates | ✅/❌ | ... |
| E-E-A-T complet | ✅/❌ | ... |
| Conformité terminologie 100% | ✅/❌ | ... |
| Anti-plagiat 4 niveaux actif | ✅/❌ | ... |
| Worker routage synchronisé | ✅/❌ | ... |
| Monitoring & alertes actifs | ✅/❌ | ... |
| Coûts optimisés | ✅/❌ | ... |
| 8 scénarios E2E passés | ✅/❌ | ... |

## PLAN D'ACTION PRIORISÉ
1. [P0] ...
2. [P1] ...
3. [P2] ...
```

---

## CONTRAINTES

- **Lire le code SOURCE** — ne JAMAIS deviner
- **Tester en LIVE** avec WebFetch (URLs sos-expat.com) et SSH (VPS 95.216.179.163)
- **Cross-checker** Mission Control ↔ Blog ↔ Worker ↔ Firebase
- **Ne PAS modifier de code** — c'est un audit, pas un fix
- **Être exhaustif** — si un fichier est mentionné, le LIRE entièrement
- **Prouver** chaque affirmation avec fichier:ligne ou résultat de test
- **Communiquer en français**
