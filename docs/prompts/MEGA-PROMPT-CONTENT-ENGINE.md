# MEGA-PROMPT — Content Engine SOS-Expat — Vérification + Complétion + Perfection absolue

Consulte la mémoire `project_blog_content_engine.md` et `prompt_megaprompt_final.md` pour le contexte complet des sessions 1 et 2. TOUT le code des phases 1-6 est déjà déployé.

## PROJETS

- Blog : `C:\Users\willi\Documents\Projets\VS_CODE\Blog_sos-expat_frontend`
- Mission Control : `C:\Users\willi\Documents\Projets\VS_CODE\Outils_communication\Mission_control_sos-expat`
- SOS SPA : `C:\Users\willi\Documents\Projets\VS_CODE\sos-expat-project`

## OBJECTIF

Vérifier TOUT de bout en bout, compléter ce qui manque, et atteindre la perfection absolue pour devenir la référence mondiale n°1 pour expatriés, voyageurs, digital nomads, investisseurs, étudiants à l'étranger. 197 pays × 9 langues. Mets 50 agents IA en parallèle. ZÉRO erreur. ZÉRO approximation.

---

# ═══════════════════════════════════════════════════════════
# PARTIE A — VÉRIFICATION COMPLÈTE E2E DE L'EXISTANT
# ═══════════════════════════════════════════════════════════

## A.1 — KNOWLEDGE BASE v2.0

Lire `config/knowledge-base.php` (MC) et vérifier CHAQUE donnée contre le code source SOS-Expat :
- Prix exacts EUR/USD → croiser avec `sos/src/services/pricingService.ts`
- Provider payouts → croiser avec `pricingService.ts`
- Commissions 5 programmes au centime → croiser avec `sos/src/types/chatter.ts`, `blogger.ts`, `influencer.ts`, `groupAdmin.ts`, `affiliate.ts`
- Captain tiers → croiser avec `types/chatter.ts`
- Withdrawal rules → croiser avec `WithdrawalRequestForm.tsx`
- Mobile Money providers → croiser avec `types/payment.ts`
- Subscription tiers → croiser avec `types/subscription.ts`
- Legal (entité, CGU versions, disclaimers) → croiser avec `Terms*.tsx`
- Si UNE donnée est fausse → CORRIGER immédiatement

Vérifier `KnowledgeBaseService.php` :
- `getSystemPrompt()` injecte les 20 sections
- `getLightPrompt()` a les sections essentielles
- `getTranslationContext()` données correctes
- `getProgramPrompt()` formate chaque programme
- Syntaxe PHP valide

## A.2 — ANTI-DUPLICATE GUARD

Vérifier `GenerationGuardService.php` :
- `check()` pour articles (3 couches : slug, Jaccard >0.50, cross-source 0.60-0.75)
- `checkQa()` pour Q/R
- `checkComparative()` pour comparatifs
- `batchCheck()` existe
- CROSS-TYPE check (article mot-clé vs fiche pays) — si MANQUANT = bug CRITIQUE
- Intégré dans ArticleGenerationService, GenerateQrBlogJob, NewsGenerationService, ComparativeGenerationService

## A.3 — INJECTION KB DANS TOUS LES GÉNÉRATEURS

Vérifier que le KB est injecté dans :
- `ArticleGenerationService.php` (8 phases)
- `GenerateQrBlogJob.php` (optimizeTitle + generateFrContent)
- `NewsGenerationService.php` (extractFacts + rewriteContent)
- `ComparativeGenerationService.php` (6 prompts)
- `GenerateFichesPays.php` (Blog-side) — KB est côté MC, PAS côté Blog. Les prompts Blog ont-ils les bonnes infos SOS-Expat ? Faut-il créer un KB côté Blog aussi ?

## A.4 — PIPELINES E2E (tracer chaque chaîne)

Pour chaque pipeline, vérifier qu'AUCUN maillon n'est cassé :

**Q/R** : MC GenerateQrBlogJob → Guard → KB → Claude → PostProcessor → webhook → Blog WebhookController → Article + FAQ → TranslateArticleJob → 9 langues → visible `/vie-a-letranger/{slug}`

**News** : MC NewsGenerationService → Guard → KB → 2 passes → anti-plagiat → PostProcessor → webhook → Blog → auto-publish → TranslateArticleJob → 9 langues → visible `/actualites-expats/{slug}`

**Fiches Pays** : MC FichesPays.tsx → MC proxy → Blog FichesApiController → Artisan fiches:generate → 7 étapes (Tavily+Claude) → webhook interne → WebhookController → tag → TranslateArticleJob → visible `/pays/{slug}`

**Articles MC** : ArticleCreate.tsx → GeneratedArticleController → GenerateArticleJob → ArticleGenerationService 15 phases → GeneratedArticle DB → PublishContentJob → BlogPublisher → Blog API

**Chatters/Influenceurs/Admin/Avocats/Expats** : ContentGenerator.tsx → expansion {pays}×197 → GenerateArticleJob → même pipeline Articles

**Art Mots Clés** : ArtMotsCles.tsx → import CSV → generateArticle() → même pipeline Articles

**Comparatifs** : ComparativeCreate.tsx → ComparativeController → GenerateComparativeJob → PublishContentJob

**Landings** : LandingCreate.tsx → LandingPageController → PublishContentJob

## A.5 — CATÉGORIES & PUBLICATION

Vérifier `WebhookController.php` mapping content_type → category_slug :
- guide → fiches-pays ✓, tutorial → fiches-pratiques ✓, qa/news/article/comparative → fiches-thematiques ✓
- outreach → programme ✓, landing/affiliation → affiliation ✓
- Toutes les catégories dans CategorySeeder avec traductions 9 langues
- Chaque catégorie a page listing + pages détail

## A.6 — NAVIGATION MC

Vérifier `Layout.tsx` : tous les NavLink → routes existantes dans `App.tsx` → composants existent
Vérifier l'ordre et la complétude.

## A.7 — SYNTAXE PHP COMPLÈTE

`php -l` sur TOUS les fichiers modifiés dans les 2 projets (Blog + MC).

---

# ═══════════════════════════════════════════════════════════
# PARTIE B — ONGLETS MANQUANTS À CRÉER
# ═══════════════════════════════════════════════════════════

5 types ont une config IA dans `ContentTypeConfig.php` mais PAS d'onglet MC :

| Onglet à créer | content_type | Config IA | Description |
|---|---|---|---|
| 🎯 Art Longues Traînes | `qa_needs` | 600-1500 mots, featured snippet | Requêtes longue traîne spécifiques, position 0 |
| 🏙️ Fiches Villes | `guide_city` | 2500-4000 mots, quartiers, coût par zone | Guides par ville pour expatriés |
| 📖 Tutoriels | `tutorial` | Config article par défaut | Guides pratiques pas-à-pas |
| 🤝 Part. Avocats | `partner_legal` | 1500-3000 mots, juridique expert | Contenu PAR des avocats partenaires |
| 🌐 Part. Expats | `partner_expat` | 1200-2500 mots, vécu terrain | Contenu PAR des expats partenaires |

Pour chacun, créer dans `ContentGenerator.tsx` un nouveau type avec les bonnes props (`contentType`, `title`, `description`, `instructions`) correspondant à `ContentTypeConfig.php`.
Ajouter routes dans `App.tsx`, NavLinks dans `Layout.tsx`.
Les 3 sous-onglets (Sources | Items | Générer) sont déjà dans le composant ContentGenerator.

Navigation finale COMPLÈTE :
```
── Piloter ──
  ⚡ Command Center | 📊 Vue d'ensemble | 🎯 Orchestrator ← NOUVEAU

── Contenu ──
  ❓ Q/R | 📰 News RSS
  🌍 Fiches Pays | ✈️ Fiches Pays Expat | 🏖️ Fiches Pays Vacances
  🏙️ Fiches Villes ← NOUVEAU
  💬 Chatters | 📢 Influenceurs | 👥 Admin Groupes | ⚖️ Avocats | 🧳 Expats Aidants
  🔑 Art Mots Clés | 🎯 Art Longues Traînes ← NOUVEAU | 📝 Art Titre Manuel
  📖 Tutoriels ← NOUVEAU
  ⚖️ Comparatifs SEO
  📖 Témoignages | 🤝 Part. Avocats ← NOUVEAU | 🌐 Part. Expats ← NOUVEAU
  📊 Sondages | 🌐 Outils Visiteurs | 🔵 Clusters

── Affiliation ──
  💰 Comparatifs Affiliés | 🤝 Programmes

── Landing Generator ──
  🛬 Landing Pages

── Optimiser & Publier ──
  ✅ Qualité | 🔍 SEO | 🔑 Mots-clés | 🕸️ Maillage interne
  📤 Publication | 🌐 Traductions | 🖼️ Médias | 💰 Coûts IA | 🧩 Templates
```

---

# ═══════════════════════════════════════════════════════════
# PARTIE C — UNIFORMISATION UI/UX MISSION CONTROL
# ═══════════════════════════════════════════════════════════

PROBLÈME : chaque onglet a une UI DIFFÉRENTE (GenerateQr, NewsHub, FichesPays, ContentGenerator, ArtMotsCles, ComparativesList, ArticlesList).

Créer UN composant `<UnifiedContentTab />` avec 4 sous-onglets harmonisés :
1. **Sources** : config pipeline, template titre, instructions IA, quota
2. **Items** : liste filtrable (status, cluster, intention, pays, recherche), actions individuelles
3. **Générer** : expansion pays, batch (5/20/tout), manuel, bulk, CSV import
4. **Stats** : graphiques publication (jour/semaine/mois), score SEO/AEO moyen, taux erreur

Design MC (charte existante) :
- Background : #090d12 (bg), #101419 (surface), #171c23 (surface2)
- Accent : violet #7c3aed, violet-light #a78bfa
- Cards : bg-surface/60 backdrop-blur border-border/30 rounded-2xl
- Boutons : bg-gradient-to-r from-violet to-violet-light rounded-xl shadow-lg
- Font : DM Sans (body), Syne (titres), DM Mono (data)

---

# ═══════════════════════════════════════════════════════════
# PARTIE D — CONTENT ORCHESTRATOR (page globale de pilotage)
# ═══════════════════════════════════════════════════════════

Nouvelle page `/content/orchestrator` (dans "Piloter") :

**Section 1 — Objectif quotidien** : input nombre total contenus/jour (ex: 100) → impact calculé (×9 langues = 900 pages/jour)

**Section 2 — Répartition par type** : tableau avec % ou nombre fixe pour chaque type de contenu. Total = 100%. News RSS séparé (nombre max/jour indépendant). Si stock épuisé → type skipé, % redistribué.

**Section 3 — Dashboard temps réel** : publiés/cible, traduits, indexés, erreurs, score SEO moyen, score AEO moyen. Progress bars par type.

**Section 4 — Historique** : 7 derniers jours, total mois, scores moyens, doublons bloqués par Guard.

**Section 5 — Indexation intelligente** : espacement 3-5 min entre articles, heures 06:00→22:00 UTC, jours actifs configurables, IndexNow batch, sitemap ping max 1×/heure.

**Section 6 — Alertes** : stock bas, erreurs >5/jour, score SEO <75, quota non atteint.

Backend : table `content_orchestrator_config` (daily_target, distribution jsonb, schedule, is_active) + table `content_orchestrator_logs` (date, type, generated, published, translated, errors, avg_seo, avg_aeo) + controller + job `RunDailyOrchestrationJob` dans console.php.

---

# ═══════════════════════════════════════════════════════════
# PARTIE E — TEMPLATES HTML ARTICLES (Design sur sos-expat.com)
# ═══════════════════════════════════════════════════════════

Chaque article publié sur sos-expat.com doit avoir un design PARFAIT et UNIFORME.

Charte SOS-Expat.com : rouge #DC2626, blanc, noir slate-900/950.

## E.1 — Créer `config/html-templates.php` (MC)

Contenant TOUS les templates HTML injectés dans les prompts IA :
- Encadré "Bon à savoir" : bg-red-50 border-l-4 border-red-600
- Encadré "Attention" : bg-amber-50 border-l-4 border-amber-500
- Encadré "Conseil pratique" : bg-emerald-50 border-l-4 border-emerald-500
- "En bref" summary box : bg-slate-50 border-slate-200 rounded-xl
- Table données : thead bg-slate-900 text-white, tbody divide-slate-200
- CTA SOS-Expat : gradient from-red-600 to-orange-500, bouton blanc
- Figure/image Unsplash : figure rounded-xl, figcaption attribution
- Blockquote stylisé
- Liste à puces stylisée
- FAQ accordion
- Liens externes officiels (section dédiée)
- Disclaimer date
- Articles suggérés (grid 3 cols)
- Retour en haut

## E.2 — Corriger TOUS les prompts de génération

GenerateFichesPays.php (P3/P4), ArticleGenerationService (phase 5), GenerateQrBlogJob, NewsGenerationService, ComparativeGenerationService : injecter les templates HTML de `config/html-templates.php` pour que CHAQUE générateur produise le MÊME HTML.

## E.3 — Tailwind Safelist (CRITIQUE)

Le HTML des articles est en base — Tailwind PurgeCSS ne scanne PAS la DB.
Ajouter dans `tailwind.config.js` du blog un safelist avec regex :
```js
safelist: [
  { pattern: /^bg-(red|amber|emerald|blue|green|slate)-(50|100|200|700|800|900)$/ },
  { pattern: /^border-(red|amber|emerald|blue|green|slate)-(200|500|600)$/ },
  { pattern: /^text-(red|amber|emerald|blue|green|slate)-(400|500|600|700|800)$/ },
  { pattern: /^(from|to)-(red|orange)-(500|600)$/ },
  'bg-gradient-to-r', 'border-l-4', 'rounded-r-lg', 'not-prose',
  'border-collapse', 'divide-y', 'overflow-hidden', 'rounded-xl',
  'hover:bg-slate-50', 'hover:scale-105', 'transition-transform',
]
```

## E.4 — Vérifier le rendu blog

Lire `articles/show.blade.php`, `countries/hub.blade.php`, `faq/show.blade.php` : le content_html s'affiche dans .prose-blog ? Les classes Tailwind du HTML généré fonctionnent ? Tables responsive (overflow-x-auto) ? RTL arabe (border-l-4 → border-s-4 logical) ?

---

# ═══════════════════════════════════════════════════════════
# PARTIE F — SEO PERFECTION ABSOLUE
# ═══════════════════════════════════════════════════════════

## F.1 — Structure HTML sémantique

- 1 seul `<h1>` par page (dans le template Blade, PAS dans le HTML généré)
- `<h2>` (4-12), `<h3>`, `<h4>` — jamais de saut
- Mots-clés LSI intégrés naturellement (densité 1-2%)
- Vérifier TOUS les prompts IA : "PAS de `<h1>`"

## F.2 — Meta tags

- **Title** : 50-60 chars, mot-clé premiers 3 mots, année si pertinent, " | SOS Expat"
- **Description** : 140-155 chars (PAS 160 — mobile tronque), verbe d'action, mot-clé, CTA
- **Viewport** : `width=device-width, initial-scale=1`
- **Robots** : `index, follow, max-image-preview:large, max-snippet:-1` (noindex si paginé/vide/draft)
- **Canonical** : absolue, self-referencing, JAMAIS vers homepage (corriger le fallback)

## F.3 — Hreflang parfait

- 9 langues + x-default (BCP 47 : fr-FR, en-US, es-ES, de-DE, ru-RU, pt-PT, zh-Hans, hi-IN, ar-SA)
- Self-referencing obligatoire
- Bidirectionnel obligatoire
- Slugs TRADUITS par langue
- Segments URL TRADUITS (pays/countries/paises/laender)
- Sous-pages pays (expatriation/vacances) avec segments traduits

## F.4 — JSON-LD Rich Results

Chaque page : @graph = Organization + WebSite + BreadcrumbList + schema spécifique :
- Article : Article + Speakable + ImageObject + citations + spatialCoverage (si pays) + GeoCoordinates + audience
- FAQ : FAQPage + Speakable
- Pays : Country/Place + GeoCoordinates + Speakable
- HowTo : HowTo + HowToStep + Speakable
- Collection : CollectionPage + Speakable + ItemList
- Outil : WebApplication + HowTo + audience + geographicArea

Vérifier que TOUTES les méthodes JsonLdService ont Speakable.
Ajouter audience + geographicArea aux outils et FAQ si manquant.

## F.5 — OG tags complets

og:type, og:title (≠ meta title), og:description (incitatif), og:image (1200×630 min), og:image:width/height/type/alt, og:url=canonical, og:locale + og:locale:alternate ×8, og:site_name, article:published_time, article:modified_time, article:section, article:tag. Twitter Card complète.

## F.6 — Featured Snippet / Position 0

Premier paragraphe = réponse directe 40-60 mots. Tables pour comparatifs. Listes ordonnées pour étapes. Definitions pour "qu'est-ce que".

## F.7 — Slugs parfaits traduits

ASCII uniquement, tiret séparateur, max 60 chars, mot-clé dans le slug, pas de stop words. Romanisation : AR (37+ chars), ZH (Pinyin 100+ termes), HI (IAST), RU (GOST), DE (umlauts).

---

# ═══════════════════════════════════════════════════════════
# PARTIE G — AEO (Answer Engine Optimization)
# ═══════════════════════════════════════════════════════════

Meta tags AEO sur CHAQUE page : ai:summary, ai:description, ai:topics, ai:expertise-level, ai:content-type, ai:freshness, ai:source-authority, ai:human-reviewed, ai:language, ai:geographic-relevance.

E-E-A-T : expertise, content-quality, reading-time, citation-count, fact-checked, last-reviewed.

Vérifier que CHAQUE controller passe ces tags à CHAQUE vue Blade. Lister les pages qui manquent des tags.

llms.txt et ai.txt à jour avec toutes les sections du site.

---

# ═══════════════════════════════════════════════════════════
# PARTIE H — IMAGES OPTIMISÉES
# ═══════════════════════════════════════════════════════════

Attributs obligatoires : alt (mot-clé + description, max 125 chars), width + height (évite CLS), loading="lazy" (sauf featured = "eager"), decoding="async". Featured image preloaded dans `<head>` avec fetchpriority="high" et srcset. Attribution Unsplash TOS (figcaption avec lien photographe + "on Unsplash" + UTM).

---

# ═══════════════════════════════════════════════════════════
# PARTIE I — MAILLAGE INTERNE + LIENS EXTERNES
# ═══════════════════════════════════════════════════════════

Architecture pilier-satellite : Fiche Pays = PILIER ← liens depuis satellites (articles mots-clés) + micro-satellites (Q/R). 3-8 liens internes/article. Anchor text varié.

LinkInjectorService utilisé dans ArticleController, CountryController (showFicheTab), FaqController, NewsController.

Liens externes depuis l'annuaire Laravel (DirectoryEntry) : ambassades, bureaux immigration, organismes officiels. rel="noopener" target="_blank". 2-5 liens externes haute autorité/article.

Articles suggérés en bas de page (3-6 cards connexes).

---

# ═══════════════════════════════════════════════════════════
# PARTIE J — SOMMAIRE / TOC + SCROLL-SYNC
# ═══════════════════════════════════════════════════════════

TOC desktop sticky sidebar sur TOUS les articles (pas seulement hub). TOC mobile accordéon `<details>`. IDs sur chaque H2/H3. Scroll-sync JS (IntersectionObserver → highlight section active dans TOC). Retour en haut après chaque section.

---

# ═══════════════════════════════════════════════════════════
# PARTIE K — ANTI-DUPLICATE CONTENT
# ═══════════════════════════════════════════════════════════

Hreflang parfait (9 langues = 9 traductions, pas 9 duplicatas). Canonical unique/page. GenerationGuardService cross-type (article vs fiche pays). Contenu haute valeur (min 1500 mots articles, 3000 fiches, 300 Q/R). Données chiffrées obligatoires. Tables comparatives. FAQ 5-8 questions. Sources citées. Content_rules anti-cannibalisation dans KB.

---

# ═══════════════════════════════════════════════════════════
# PARTIE L — SITEMAPS COMPLETS
# ═══════════════════════════════════════════════════════════

Sitemap index avec TOUS les types × 9 langues. Hreflang alternates dans chaque `<url>`. Sous-pages pays (expatriation/vacances) dans countries sitemap. lastmod ISO 8601 basé sur updated_at. Priority : news 0.9, fiches 0.8, articles 0.7, Q/R 0.6, listings 0.5.

---

# ═══════════════════════════════════════════════════════════
# PARTIE M — CORE WEB VITALS + MOBILE FIRST
# ═══════════════════════════════════════════════════════════

LCP <2.5s (featured preloaded, pas de render-blocking). CLS <0.1 (images width+height, font-display:swap). INP <200ms (pas de JS bloquant). Mobile first : tables overflow-x-auto, images responsive, TOC accordéon, font 16px min, touch targets 48px min. RTL arabe (dir="rtl", border-s-4 logical properties). Preconnect Unsplash CDN.

---

# ═══════════════════════════════════════════════════════════
# PARTIE N — TRADUCTIONS SEO PARFAITES
# ═══════════════════════════════════════════════════════════

TranslationService dual-provider (gpt-4o-mini primary, Haiku fallback). Contexte pays préservé ($countryContext). KB translation context injecté. meta_title tronqué 60 chars, meta_description 155 chars. og_image_url hérité source. json_ld généré/caché DB. FAQ traduites (Q+A). Slug unique/langue via SlugService. geo.region = pays ARTICLE (pas locale lecteur).

---

# ═══════════════════════════════════════════════════════════
# PARTIE O — CLOUDFLARE WORKER
# ═══════════════════════════════════════════════════════════

Vérifier `worker.js` : 4+ segments OK, tous segments traduits 9 langues dans BLOG_SEGMENTS, /images/flags/*.webp proxié. Tester mentalement : /ar-sa/alduwl/tayland/ightrab → blog proxy ✓

---

# ═══════════════════════════════════════════════════════════
# PARTIE P — INDEXATION + ROBOTS
# ═══════════════════════════════════════════════════════════

robots.txt : Allow /, Disallow /admin/ /api/, AI crawlers autorisés avec Crawl-delay:2, Sitemap URL. IndexNow immédiat après publication. Google sitemap ping max 1×/heure. Publication espacée 3-5 min (Orchestrator).

---

# ═══════════════════════════════════════════════════════════
# RÉSULTAT ATTENDU
# ═══════════════════════════════════════════════════════════

Pour chaque partie (A-P), donner :
- ✅ PARFAIT (avec preuve file:line)
- ❌ BUG (description + fix code immédiat + commiter + pusher)
- ⚠️ AMÉLIORATION (recommandation + implémenter si faisable)

Corriger IMMÉDIATEMENT tout ❌. Implémenter les ⚠️ impactants.
Commiter et pusher après chaque correction.

Score cible : **100/100**
Objectif : **n°1 mondial en 9 langues, 197 pays, en quelques mois**
Standard : **meilleur que Expatica, InterNations, Numbeo, Nomad List — TOUS**
