# MEGA-PROMPT : Audit E2E Ultra-Complet du Pipeline de Génération de Contenu — sos-expat.com (2026)

## MISSION CRITIQUE

Tu es une équipe d'audit de 10 experts seniors qui doivent vérifier que TOUT le pipeline de contenu fonctionne PARFAITEMENT, de la source de données jusqu'à l'affichage sur sos-expat.com. L'audit doit être EXHAUSTIF — chaque fichier lu, chaque flux testé, chaque scénario vérifié.

**Équipe** :
- **Content Pipeline Architect** — flux de données, ETL, orchestration
- **AI Content Quality Lead** — prompts, LLM, fact-checking, hallucinations
- **SEO/AEO Technical Auditor** — structured data, sitemap, hreflang, Core Web Vitals
- **Multi-language QA Lead** — i18n, traduction IA, qualité linguistique, RTL
- **DevOps Pipeline Engineer** — queues, webhooks, monitoring, retry logic
- **Data Integrity Auditor** — cohérence entre bases de données, doublons, orphelins
- **Security & Compliance Lead** — validation input, sanitization, RGPD
- **UX/Frontend Auditor** — affichage public, navigation, mobile, accessibilité
- **Affiliate Compliance Lead** — terminologie affiliés, conformité juridique, prix corrects
- **Production Readiness Lead** — scalabilité, failover, alertes, documentation

**Résultat attendu** : Un rapport avec TOUS les points positifs, négatifs et recommandations, organisé par axe. Chaque problème doit avoir un fix concret avec fichier:ligne. À la fin, une checklist "Production Ready" avec OK/KO par critère.

---

## ARCHITECTURE COMPLÈTE DU PIPELINE

### Flux global

```
[14 Sources] → [Mission Control: scraping + clustering + enrichment]
    ↓
[Content Campaigns / Daily Scheduler / Manual triggers]
    ↓
[GenerateArticleJob: 15 phases IA avec Knowledge Base injecté]
    ├─ Phase 1-3: Validation + Recherche (Perplexity/Claude)
    ├─ Phase 4-5: Outline + Rédaction (GPT-4o)
    ├─ Phase 6-9: Titre + Meta + Snippet + FAQs
    ├─ Phase 10-11: Liens internes + Image (Unsplash)
    ├─ Phase 12-13: SEO Score + Quality Check
    └─ Phase 14-15: JSON-LD + Hreflang prep
    ↓
[PublishContentJob: rate-limited, POST webhook vers Blog]
    ↓
[Blog Laravel WebhookController@receiveArticle]
    ├─ Validation payload + HTML sanitization
    ├─ Article + ArticleTranslation created/updated
    ├─ FAQs + Sources stockés
    ├─ Image Unsplash fetch si manquante
    ├─ TranslateArticleJob dispatched × 8 langues
    ├─ IndexNow ping + Google Sitemap ping
    └─ Cache invalidation
    ↓
[9 ArticleTranslation (FR + 8 langues)]
    ↓
[Cloudflare Worker route vers VPS Blog]
    ↓
[Page publique sur sos-expat.com]
```

### Codebases (chemins exacts)

| Codebase | Chemin local | Rôle |
|----------|-------------|------|
| **Mission Control** | `Outils_communication/Mission_control_sos-expat/laravel-api/` | Génération + orchestration |
| **Blog Laravel** | `Blog_sos-expat_frontend/` | Réception + affichage + traduction |
| **SPA React** | `sos-expat-project/sos/` | App principale (login, dashboard, appels) |
| **Cloudflare Worker** | `sos-expat-project/sos/cloudflare-worker/worker.js` | Routage SPA ↔ Blog |
| **Firebase Functions** | `sos-expat-project/sos/firebase/functions/src/` | Backend appels, paiements (source de vérité pour les prix) |

### Fichiers CRITIQUES à lire obligatoirement

**Mission Control** :
- `config/knowledge-base.php` — SOURCE DE VÉRITÉ pour toute génération IA
- `app/Services/Content/ArticleGenerationService.php` — 15 phases de génération
- `app/Services/Content/KnowledgeBaseService.php` — injection du KB dans les prompts
- `app/Services/Content/QualityGuardService.php` — validation qualité
- `app/Services/Content/SeoAnalysisService.php` — scoring SEO
- `app/Services/Publishing/BlogPublisher.php` — envoi vers le blog
- `app/Services/AI/OpenAiService.php` — appels GPT-4o
- `app/Services/AI/PerplexityService.php` — recherche web
- `app/Jobs/GenerateArticleJob.php` — job principal
- `app/Jobs/PublishContentJob.php` — publication
- `app/Services/Content/DailyContentSchedulerService.php` — planification auto
- `app/Http/Controllers/ContentCampaignController.php` — campagnes

**Blog Laravel** :
- `app/Http/Controllers/Api/WebhookController.php` — réception articles
- `app/Services/TranslationService.php` — traduction 8 langues
- `app/Services/SlugService.php` — génération slugs (ASCII-only)
- `app/Models/Article.php` + `ArticleTranslation.php` + `ArticleFaq.php`
- `routes/web.php` — toutes les routes publiques (9 langues)
- `routes/api.php` — API endpoints
- `resources/views/partials/content-nav.blade.php` — navigation
- `resources/views/partials/article-card.blade.php` — card articles
- `resources/views/articles/show.blade.php` — page article détail

**Worker** :
- `cloudflare-worker/worker.js` — routage complet (BLOG_SEGMENTS, ARTICLES_SEGMENTS, etc.)

---

## 16 TYPES DE CONTENU — Vérifier que CHACUN a un pipeline fonctionnel

| # | Type | Source attendue | Pipeline auto/manuel | Catégorie Blog | Vérifier |
|---|------|----------------|---------------------|----------------|----------|
| 1 | `guide` / `pillar` | Fiches pays scrapées | Auto campaign | fiches-pays | Existe-t-il des guides publiés ? Le scraping fonctionne ? |
| 2 | `guide_city` | Fiches villes | Auto campaign | fiches-villes | Existe-t-il des guides ville publiés ? |
| 3 | `article` | Keyword clusters | Auto/Manuel | fiches-thematiques | Le clustering fonctionne ? Les articles sont pertinents ? |
| 4 | `tutorial` | Steps-based | Manuel | fiches-pratiques | Y a-t-il des tutoriels publiés ? |
| 5 | `comparative` | Comparaison | Manuel | fiches-thematiques | Y a-t-il des comparatifs publiés ? |
| 6 | `qa` / `qa_needs` | Forum questions | Auto QR daily | fiches-thematiques | Le QrDailyGenerateCommand fonctionne ? |
| 7 | `news` | RSS feeds | Auto RSS | fiches-thematiques | Les RSS sont configurés ? Les news arrivent ? |
| 8 | `statistics` | World Bank/OECD | Auto | fiches-pays | Le scraping stats fonctionne ? |
| 9 | `outreach` | Partenaires avocats | Manuel | programme | Le contenu est conforme (partenaire, pas employé) ? |
| 10 | `affiliation` | Programme affiliés | Manuel | affiliation | Terminologie correcte (jamais MLM) ? |
| 11 | `testimonial` | Témoignages | Manuel | fiches-thematiques | Témoignages réels ou inventés ? (INTERDIT d'inventer) |
| 12 | `pain_point` | Souffrances expatriés | Auto | fiches-pratiques | Le pipeline pain_point existe et fonctionne ? |
| 13 | `partner_legal` | Avocats | Manuel | programme | Conforme (partenaire indépendant) ? |
| 14 | `partner_expat` | Expatriés aidants | Manuel | programme | Conforme (partenaire indépendant) ? Prix 10€/10$ correct ? |
| 15 | `landing` | Marketing | Manuel | affiliation | Pas de termes interdits ? |
| 16 | `press_release` | Communiqués | Manuel | fiches-thematiques | Existe-t-il ? |

---

## RÈGLES CRITIQUES (à vérifier dans CHAQUE contenu)

### Prix & Montants (Source de vérité : knowledge-base.php + Firebase defaultPlans.ts)

| Service | Client paie | Partenaire reçoit | SOS-Expat prend | Durée |
|---------|------------|-------------------|-----------------|-------|
| Avocat | 49€ / 55$ | 30€ / 30$ | 19€ / 25$ | 20 min |
| Expert local | 19€ / 25$ | 10€ / 10$ | 9€ / 15$ | 30 min |

| Affiliation | Commission |
|-------------|-----------|
| Chatter : appel avocat | 5$ |
| Chatter : appel expert | 3$ |
| Chatter : filleul N1 | 1$ par appel du filleul |
| Chatter : filleul N2 | 0.50$ par appel du filleul |
| Bonus Telegram | 50$ (débloqué à 150$ de commissions directes) |
| Milestones | 5 filleuls→15$, 10→35$, 20→75$, 50→250$, 100→600$, 500→4000$ |

### Terminologie INTERDITE (dans tout contenu généré)

| INTERDIT | CORRECT |
|----------|---------|
| MLM | Programme d'affiliation |
| Recruter / Recruit | Parrainer / Inviter à rejoindre / Sponsor |
| Salarié / Employee | Affilié / Partenaire indépendant |
| Salaire / Salary | Commissions d'affiliation / Reversement |
| Recrutement | Parrainage / Programme de parrainage |
| Employé | Partenaire |
| "SOS Expat" (sans trait d'union) | "SOS-Expat.com" (avec trait d'union) |

---

## AUDIT EN 12 AXES

### AXE 1 : Knowledge Base — Intégrité & Vérité

**Action** : Lire INTÉGRALEMENT `config/knowledge-base.php` (c'est LE fichier qui contrôle toute la génération IA)

Vérifier :
1. Tous les prix correspondent au tableau ci-dessus
2. Aucun terme interdit (grep: mlm, recruit, salarié, salaire — hors règles NEVER)
3. Les 16 content_types sont tous documentés avec leurs règles
4. Les templates de contenu sont cohérents avec les types
5. Les disclaimers et mentions légales sont présents
6. Cross-check avec `sos/firebase/functions/src/config/defaultPlans.ts` pour les vrais montants en production
7. Les règles de SEO/AEO sont à jour (Helpful Content Update 2026, AEO)
8. La section affiliate programme est conforme (terminologie, montants)

### AXE 2 : Pipeline de Génération — 15 Phases

**Action** : Lire `ArticleGenerationService.php` phase par phase

Pour CHAQUE phase :
1. Le Knowledge Base est-il injecté dans le prompt système ?
2. Le prompt gère-t-il les 16 types de contenu différemment ?
3. Que se passe-t-il si l'API (GPT-4o/Perplexity) retourne une erreur ?
4. Y a-t-il un retry avec backoff ?
5. Les timeouts sont-ils suffisants ?
6. Le contenu généré est-il validé avant de passer à la phase suivante ?
7. Les coûts API sont-ils loggés ?

**Tests à faire** :
- Simuler la génération d'un article type `guide` pour la Thaïlande
- Simuler la génération d'un `qa` depuis une question de forum
- Simuler la génération d'un `news` depuis un RSS feed
- Vérifier les logs de génération pour les 15 derniers articles

### AXE 3 : Publication — Mission Control → Blog

**Action** : Lire `BlogPublisher.php` + `WebhookController@receiveArticle`

Vérifier :
1. Le payload contient TOUS les champs nécessaires (title, content_html, excerpt, meta_*, faqs, sources, images, etc.)
2. Le mapping content_type → catégorie blog est correct pour les 16 types
3. Le webhook valide le payload (pas d'injection, HTML sanitisé)
4. Les slugs sont générés correctement (ASCII-only pour AR/ZH/HI/RU)
5. Les FAQs sont bien stockées (ArticleFaq model)
6. Les sources sont bien stockées (ArticleSource model)
7. L'image Unsplash est bien fetchée si manquante
8. Le rate-limiting fonctionne (10/jour, 3/heure, 15min intervalle)
9. Les erreurs de publication sont loggées et alertées (Telegram)

**Tests** :
- Faire un curl POST sur `/api/v1/webhook/article` avec un payload test
- Vérifier que l'article apparaît en base
- Vérifier que les 8 traductions sont générées

### AXE 4 : Traduction Automatique — 9 Langues

**Action** : Lire `TranslationService.php` (Blog Laravel)

Vérifier :
1. Le service traduit bien en 8 langues cibles (EN, ES, DE, PT, RU, ZH, HI, AR)
2. Le HTML est préservé (balises, attributs, classes)
3. Les slugs traduits sont ASCII-only (pas de caractères arabes/chinois dans les URLs)
4. Les meta_title et meta_description sont traduits
5. Les FAQs sont traduites
6. L'ai_summary est traduit
7. Le JSON-LD est traduit/adapté
8. Les hreflang links pointent vers les bonnes URLs

**Tests en base** :
- Prendre 3 articles au hasard
- Pour chacun, vérifier que les 9 ArticleTranslation existent et sont publiées
- Vérifier que les slugs sont corrects par langue
- Vérifier que le contenu n'est pas tronqué

### AXE 5 : SEO & Indexation

**Action** : Vérifier toute la chaîne SEO

1. `SeoAnalysisService.php` : le scoring est-il cohérent ? (0-100)
2. IndexNow : vérifier que le ping est envoyé après publication (`IndexNowService.php`)
3. Sitemap : accéder à `/sitemap.xml` sur le site live, vérifier qu'il contient tous les articles × 9 langues
4. Hreflang : sur une page article, vérifier les `<link rel="alternate" hreflang="...">` pour les 9 langues
5. JSON-LD : vérifier Article, FAQPage, BreadcrumbList, Speakable sur une page article
6. Meta tags : canonical, robots, og:title, og:description, og:image sur chaque type de page
7. Featured snippet : le premier paragraphe fait-il 40-60 mots ?
8. Robots.txt : les bonnes pages sont-elles indexables ?

**Tests live** :
- `curl https://sos-expat.com/sitemap.xml` — vérifier la structure
- `curl https://sos-expat.com/fr-fr/articles/{slug}` — vérifier le HTML (meta, JSON-LD, hreflang)

### AXE 6 : Qualité du Contenu Publié — Scan exhaustif

**Action** : Scanner les 15 articles × 9 langues = 135 traductions

Pour CHAQUE article FR :
1. ✅ Titre complet (pas tronqué, pas "...")
2. ✅ Excerpt complet (pas tronqué)
3. ✅ Content HTML non vide (> 500 mots)
4. ✅ Prix corrects (tableau ci-dessus)
5. ✅ Commissions correctes (5$/3$ chatters)
6. ✅ Aucun terme interdit
7. ✅ Sources avec URLs valides et accessibles
8. ✅ FAQs présentes (minimum 3)
9. ✅ Image featured présente et accessible
10. ✅ Pas de témoignages inventés
11. ✅ "SOS-Expat.com" avec trait d'union (pas "SOS Expat")
12. ✅ CTA vers le bon lien (site principal ou programme affiliation)
13. ✅ Liens internes vers d'autres articles/outils du blog

Pour CHAQUE traduction (8 par article) :
1. ✅ Traduction existe et est publiée
2. ✅ Slug en ASCII (pas de caractères unicode)
3. ✅ Contenu non tronqué
4. ✅ Prix corrects dans la langue

### AXE 7 : Routage Cloudflare Worker

**Action** : Lire `worker.js` et tester tous les flux

Vérifier :
1. TOUS les segments blog (articles, pays, outils, annuaire, vie-a-letranger, actualites-expats, galerie, sondages, guides-pratiques, programme, categories, tags, recherche) sont routés vers le VPS
2. Les 9 langues ont leurs segments traduits
3. Les alias (fiches-pays → categories/fiches-pays, nos-outils → outils) font des 301
4. Les pages SPA (prestataires, tarifs, connexion, faq, inscription) NE SONT PAS routées vers le blog
5. L'API search (`/api/search/suggest`) est routée vers le blog
6. Le fallback vers la SPA fonctionne si le blog est down

**Tests** (curl avec vérification headers) :
- 10 URLs blog FR : vérifier `X-Worker-Blog-Proxy: true` + HTTP 200
- 10 URLs blog dans d'autres langues : même vérification
- 5 URLs SPA : vérifier absence de `X-Worker-Blog-Proxy`
- 5 alias : vérifier 301 + Location correct

### AXE 8 : Monitoring, Alertes & Coûts

1. Les erreurs de génération sont-elles loggées ? (GenerationLog model)
2. Les alertes Telegram sont-elles envoyées en cas d'échec ? (vérifier le code)
3. Les coûts API sont-ils trackés ? (ApiCost model — OpenAI, Perplexity, Claude)
4. Le rate limiting de publication est-il respecté ? (PublicationSchedule)
5. Y a-t-il un dashboard de monitoring dans Mission Control ?
6. Les logs Laravel (Blog) sont-ils accessibles et non saturés ?

### AXE 9 : Cohérence Frontend — Expérience Utilisateur

1. Le content-nav (barre de navigation) affiche-t-il les bons onglets ? (Pays, Outils, Annuaire, Q/R + Plus)
2. Chaque page a-t-elle un hero harmonisé (page-hero partial) ?
3. Les pages pays regroupent-elles TOUT le contenu d'un pays ?
4. Les articles sont-ils retrouvables depuis la page pays ?
5. La recherche autocomplete fonctionne-t-elle (`/api/search/suggest`) ?
6. Les cards articles sont-elles cohérentes (image, titre, excerpt, date, auteur) ?
7. Le design est-il moderne et harmonisé sur TOUTES les pages ?
8. Le mobile est-il correct (touch targets 44px, scroll horizontal nav) ?
9. Le dark mode fonctionne-t-il ?
10. Le RTL (arabe) fonctionne-t-il ?

### AXE 10 : Scalabilité & Robustesse

1. Que se passe-t-il si Mission Control génère 100 articles/jour ? (queue saturée ?)
2. Que se passe-t-il si le Blog VPS est down pendant une publication ? (retry ? perte de données ?)
3. Que se passe-t-il si 1 traduction sur 9 échoue ? (article publié en 8 langues seulement ?)
4. Que se passe-t-il si Unsplash rate-limite ? (article sans image ?)
5. Que se passe-t-il si le Worker Cloudflare est rate-limité ? (429 pour les visiteurs ?)
6. Que se passe-t-il si le token API blog expire ? (publications silencieusement perdues ?)
7. La base PostgreSQL du blog est-elle backupée ? (vérifier docker-compose volumes)

### AXE 11 : Conformité Affiliés & Juridique

1. AUCUN contenu publié ne contient "MLM", "recruter", "salarié", "recrutement"
2. Les articles chatter/influencer/blogger utilisent UNIQUEMENT "programme d'affiliation", "affilié", "parrainage"
3. Les prix affichés correspondent EXACTEMENT au knowledge-base
4. Les articles avocat/expert ne présentent PAS SOS-Expat comme un employeur
5. Les articles mentionnent que les partenaires sont INDÉPENDANTS et régis par la législation de LEUR pays
6. Les témoignages sont RÉELS (pas inventés par l'IA)
7. Le disclaimer légal est présent sur chaque article

### AXE 12 : Tests E2E — Scénarios Complets

Exécuter ces scénarios de bout en bout :

**Scénario 1 : Article guide pays**
→ Vérifier qu'un guide pays (ex: Thaïlande) est correctement généré, publié, traduit en 9 langues, accessible sur sos-expat.com/fr-fr/articles/{slug} ET trouvable depuis la page /fr-fr/pays/thailande

**Scénario 2 : Q/R automatique**
→ Vérifier le QrDailyGenerateCommand, la qualité du Q/R généré, sa publication, son affichage sur /fr-fr/vie-a-letranger

**Scénario 3 : News RSS**
→ Vérifier qu'un flux RSS est configuré, qu'une news est rewritée, publiée, visible sur /fr-fr/actualites-expats

**Scénario 4 : Article chatter (affilié)**
→ Vérifier que l'article "Devenir Chatter" est conforme : terminologie, prix, CTA, pas de MLM

**Scénario 5 : Recherche utilisateur**
→ Tester /api/search/suggest?q=visa&lang=fr → vérifier le JSON retourné → vérifier que les résultats pointent vers des pages accessibles

**Scénario 6 : Navigation utilisateur**
→ Depuis la homepage, naviguer vers Pays → Thaïlande → voir les articles → cliquer sur un article → vérifier que tout fonctionne sans erreur 404

**Scénario 7 : Changement de langue**
→ Sur un article FR, cliquer sur le sélecteur de langue → vérifier que la version EN s'affiche correctement avec le bon slug, le bon contenu traduit

**Scénario 8 : Annuaire pays**
→ Accéder à /fr-fr/annuaire → choisir un pays → vérifier que les entrées s'affichent

---

## FORMAT DU LIVRABLE

### Pour CHAQUE axe :

```
## AXE X : [Nom]

### ✅ Points positifs
- [ce qui fonctionne bien, avec preuve]

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
| Knowledge Base à jour | ✅/❌ | ... |
| 16 types de contenu documentés | ✅/❌ | ... |
| Pipeline 15 phases fonctionnel | ✅/❌ | ... |
| Publication webhook opérationnelle | ✅/❌ | ... |
| Traduction 9 langues complète | ✅/❌ | ... |
| SEO/sitemap/hreflang correct | ✅/❌ | ... |
| 135 traductions sans erreur | ✅/❌ | ... |
| Worker routage complet | ✅/❌ | ... |
| Monitoring & alertes actifs | ✅/❌ | ... |
| Frontend harmonisé | ✅/❌ | ... |
| Scalabilité validée | ✅/❌ | ... |
| Conformité affiliés 100% | ✅/❌ | ... |
| 8 scénarios E2E passés | ✅/❌ | ... |

## PLAN D'ACTION PRIORISÉ
1. [P0] ...
2. [P0] ...
3. [P1] ...
...
```

---

## CONTRAINTES IMPÉRATIVES

- **Lire le code SOURCE** — ne JAMAIS deviner ou supposer
- **Tester avec curl** quand possible (endpoints live, sitemap, pages)
- **Vérifier en base** via SSH sur le VPS (docker exec blog-app php artisan tinker)
- **Cross-checker** Mission Control ↔ Blog Laravel ↔ Worker ↔ Firebase
- **Ne PAS modifier de code** sans autorisation explicite — c'est un audit, pas un fix
- **Être exhaustif** — si un fichier est mentionné, le LIRE entièrement
- **Prouver** chaque affirmation avec un chemin de fichier et un numéro de ligne
- **Communiquer en français**
