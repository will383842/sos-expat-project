# PROMPT AUDIT ULTRA-COMPLET : URLs, Slugs, Hreflang, Routes, Locales & Workers

## CONTEXTE GLOBAL

Tu audites l'écosystème technique complet de **SOS-Expat**, une plateforme multilangue (9 langues × 197 pays) composée de :

1. **Frontend React/TypeScript** (`sos/src/`) — SPA avec routing multilingue, slugs providers, SEO Head, hreflang
2. **Firebase Cloud Functions** (`sos/firebase/functions/src/`) — Backend : sitemaps, SSR bots, auto-indexing, migrations slugs
3. **Cloudflare Worker** (`sos/cloudflare-worker/worker.js`) — Edge cache, bot detection, blog proxy, URL rewriting, country slug data
4. **Blog Laravel 12** (`Blog_sos-expat_frontend/`) — SSR blog avec articles, landing pages, FAQ, guides, sitemaps, backlinks
5. **MC API (OLD)** (`OLD/eng-content-generate_OLD/`) — Ancien moteur de génération de contenu (landing pages, articles, liens internes)
6. **Backlink Engine** (`backlink-engine/`) — TypeScript/Node.js pour vérification et monitoring de liens

### Les 9 langues supportées
| Code interne | Code URL | Code hreflang | Pays par défaut | Notes |
|---|---|---|---|---|
| `fr` | `fr` | `fr-FR` | `fr` (France) | Langue par défaut |
| `en` | `en` | `en-US` | `us` (USA) | |
| `es` | `es` | `es-ES` | `es` (Espagne) | |
| `de` | `de` | `de-DE` | `de` (Allemagne) | |
| `ru` | `ru` | `ru-RU` | `ru` (Russie) | |
| `pt` | `pt` | `pt-PT` | `pt` (Portugal) | |
| `ch` | `zh` | `zh-Hans` | `cn` (Chine) | **TRIPLE CODE** : interne=ch, URL=zh, hreflang=zh-Hans |
| `hi` | `hi` | `hi-IN` | `in` (Inde) | |
| `ar` | `ar` | `ar-SA` | `sa` (Arabie Saoudite) | RTL |

---

## MISSION

Réalise un **audit exhaustif** de tout le système URL/slug/hreflang/routes/locales sur l'ensemble des composants. Pour chaque point, indique :
- ✅ **Point positif** (ce qui fonctionne bien)
- ❌ **Point négatif** (bug, incohérence, risque)
- 💡 **Recommandation** (solution concrète avec fichier et ligne)

---

## PARTIE 1 — AUDIT DU FORMAT LOCALE `{lang}-{country}`

### 1.1 Cohérence du format locale dans les URLs

**Fichiers à vérifier :**
- `sos/src/multilingual-system/core/routing/localeRoutes.ts` (66KB — système de routing)
- `sos/src/multilingual-system/core/routing/LocaleRouter.tsx` (validation locale)
- `sos/src/utils/slugGenerator.ts` (génération slugs providers)
- `sos/cloudflare-worker/worker.js` (data `_CS` et `_CR`, reverse lookup)
- `Blog_sos-expat_frontend/app/Http/Middleware/SetLocale.php` (extraction locale)
- `Blog_sos-expat_frontend/config/route-segments.php` (segments traduits)

**Questions d'audit :**
1. Le format `{lang}-{country}` est-il **toujours en minuscules** partout ? Vérifier que nulle part on ne trouve `FR-TH`, `fr-TH`, `Fr-Th`, etc.
2. Les locales valides sont-elles définies dans une **source unique centralisée** ou dupliquées dans N fichiers ? Lister toutes les sources de vérité.
3. Y a-t-il des cas où `fr-th` (français depuis la Thaïlande) est **légitime** vs des cas où c'est un **bug** (mélange langue/locale) ?
4. Le code chinois est-il **toujours** `zh` dans les URLs et jamais `ch` ? Grep exhaustif sur tous les fichiers.
5. Le Worker Cloudflare utilise-t-il le **même mapping** langue→pays-défaut que le frontend React et le blog Laravel ?
6. Les locales canoniques (fr-fr, en-us, etc.) sont-elles les **seules** indexables ou des locales arbitraires comme `fr-th` sont-elles aussi dans les sitemaps ?

### 1.2 Validation et redirection des locales invalides

**Questions d'audit :**
1. Que se passe-t-il si un utilisateur visite `/xx-yy/page` avec un code langue invalide ?
2. Que se passe-t-il si la langue est valide mais le pays invalide (`/fr-zz/page`) ?
3. La redirection 301 est-elle cohérente entre le Worker CF, le frontend React, et le blog Laravel ?
4. Y a-t-il des boucles de redirection possibles (redirect loops) ?
5. Les erreurs 404 sont-elles bien servies pour les URLs truly invalides (pas de soft 404) ?

---

## PARTIE 2 — AUDIT DES SLUGS

### 2.1 Slugs des articles (Blog Laravel)

**Fichiers à vérifier :**
- `Blog_sos-expat_frontend/app/Models/ArticleTranslation.php` (champ slug)
- `Blog_sos-expat_frontend/app/Http/Controllers/ArticleController.php` (résolution slug)
- `Blog_sos-expat_frontend/app/Http/Middleware/HandleRedirects.php` (ancien slug → nouveau)
- Webhook `Blog_sos-expat_frontend/app/Http/Controllers/Api/WebhookController.php` (upsert article)

**Questions d'audit :**
1. Les slugs sont-ils **toujours ASCII romanisé** pour ar/zh/hi/ru ? (Règle établie : jamais d'Unicode dans les URLs)
2. Y a-t-il une validation/sanitization centralisée des slugs à l'insertion ?
3. Les slugs dupliqués sont-ils gérés (même slug pour 2 articles dans la même langue) ?
4. Le webhook de création d'article vérifie-t-il le format du slug avant insertion en BDD ?
5. Les slugs contiennent-ils des caractères interdits (espaces, accents, majuscules, doubles tirets `--`) ?
6. Le `HandleRedirects` middleware couvre-t-il tous les cas de renommage de slug ?

### 2.2 Slugs des providers (Frontend React + Firebase)

**Fichiers à vérifier :**
- `sos/src/utils/slugGenerator.ts` (29KB — ShortID, format SEO)
- `sos/firebase/functions/src/migrations/migrateProviderSlugs.ts` (migration)
- `sos/firebase/functions/src/seo/autoIndexingTriggers.ts` (soumission Google)

**Questions d'audit :**
1. Le format `{lang}-{country}/{role-pays}/{prenom-specialite-shortid}` est-il respecté partout ?
2. Les traductions de rôle (avocat/lawyer/abogado) et de pays (thailande/thailand/tailandia) sont-elles synchronisées entre `slugGenerator.ts` et `country-slug-translations.ts` ?
3. Le ShortID 6 caractères est-il vraiment déterministe et unique ?
4. Y a-t-il des providers avec des slugs cassés ou non-migrés en production ?

### 2.3 Slugs des landing pages

**Fichiers à vérifier :**
- `sos/src/data/landing-pages/landing-slugs.ts` (24 catégories × 9 langues)
- `Blog_sos-expat_frontend/app/Models/LandingPage.php` (canonical_url, hreflang_map)
- `Blog_sos-expat_frontend/app/Http/Controllers/LandingController.php` (fallback route)

**Questions d'audit :**
1. Les `canonical_url` des landing pages sont-elles cohérentes avec le format `{lang}-{country}/...` ?
2. Le `hreflang_map` stocké en BDD est-il correct pour chaque landing page ?
3. La résolution de template (`bladeTemplate()`) fonctionne-t-elle pour tous les `audience_type` ?
4. Les landing pages générées par le MC API utilisent-elles le même format de locale que le blog ?

### 2.4 Slugs des pays (Country Slugs)

**Fichiers à vérifier :**
- `sos/src/data/country-slug-translations.ts` (62+ pays × 9 langues)
- `sos/cloudflare-worker/worker.js` (objet `_CS` embarqué)
- `Blog_sos-expat_frontend/` (table `countries` en BDD)
- `OLD/eng-content-generate_OLD/app/Models/Country.php` (champs `slug_{lang}`)

**Questions d'audit :**
1. Les traductions de pays sont-elles **identiques** entre le frontend React, le Worker CF, et le blog Laravel ?
2. Y a-t-il des pays manquants dans l'une des sources ?
3. Les slugs de pays sont-ils tous en ASCII romanisé (pas de `تايلاند` ou `タイ` dans les URLs) ?
4. Le reverse lookup `_CR` du Worker (slug → ISO code) est-il complet et sans collision ?

---

## PARTIE 3 — AUDIT HREFLANG

### 3.1 Hreflang sur le frontend React (SPA)

**Fichiers à vérifier :**
- `sos/src/multilingual-system/components/HrefLang/HreflangLinks.tsx` (composant principal)
- `sos/src/multilingual-system/components/HrefLang/HrefLangConstants.ts` (constantes)
- `sos/src/components/layout/SEOHead.tsx` (canonical + og:locale)

**Questions d'audit :**
1. Les hreflang pointent-ils vers les **pays par défaut** (fr-fr, en-us) ou vers le pays de l'URL courante ?
2. Le mapping `localeToHreflang` est-il complet et correct pour les 9 langues ?
3. Le `x-default` pointe-t-il toujours vers `fr-fr` (langue par défaut) ?
4. Les hreflang sont-ils rendus côté serveur (SSR via Puppeteer) pour que Google les voie ?
5. Y a-t-il des pages sans hreflang (pages orphelines) ?
6. Les canonical URLs sont-elles cohérentes avec les hreflang (pas de canonical ≠ hreflang self) ?

### 3.2 Hreflang sur le blog Laravel (SSR)

**Fichiers à vérifier :**
- `Blog_sos-expat_frontend/app/Services/CanonicalService.php` (HREFLANG_MAP, getHreflangLinks)
- `Blog_sos-expat_frontend/app/Http/Controllers/ArticleController.php` (show — hreflang injection)
- Templates Blade (vérifier l'injection dans le `<head>`)

**Questions d'audit :**
1. Le `HREFLANG_MAP` du blog Laravel est-il **identique** au `localeToHreflang` du frontend React ?
2. Pour un article sur la Thaïlande (`fr-th/articles/slug`), les hreflang pointent-ils vers `en-th/articles/slug-en`, `es-th/articles/slug-es`, etc. (même pays, langues différentes) ?
3. Le `x-default` pointe-t-il vers la traduction française ?
4. Que se passe-t-il si une traduction n'existe pas pour une langue ? (hreflang cassé → pénalité Google)
5. Les hreflang sont-ils présents dans le HTML SSR (pas juste injectés en JS côté client) ?
6. Les articles sans pays associé utilisent-ils bien les pays par défaut dans les hreflang ?

### 3.3 Hreflang dans les sitemaps

**Fichiers à vérifier :**
- `sos/firebase/functions/src/seo/sitemaps.ts` (sitemaps Firebase)
- `sos/firebase/functions/src/sitemap/generator.ts` (générateur)
- `Blog_sos-expat_frontend/app/Http/Controllers/SeoController.php` (sitemaps blog)

**Questions d'audit :**
1. Les sitemaps incluent-ils des `<xhtml:link rel="alternate" hreflang="...">` pour chaque URL ?
2. Les hreflang dans les sitemaps sont-ils cohérents avec ceux dans le HTML des pages ?
3. Les sitemaps n'incluent-ils que les locales canoniques (pas de `fr-th` dans les sitemaps) ?
4. Le sitemap master/index fusionne-t-il correctement Firebase + Blog sans doublons ?

---

## PARTIE 4 — AUDIT DES ROUTES

### 4.1 Routes du frontend React

**Fichiers à vérifier :**
- `sos/src/config/routes.ts` (définition des routes)
- `sos/src/App.tsx` (arbre de routing)
- `sos/firebase/functions/src/sitemap/generator.ts` (ROUTE_TRANSLATIONS)

**Questions d'audit :**
1. Les segments de route traduits (connexion/login/iniciar-sesion) sont-ils synchronisés entre le frontend et le générateur de sitemaps ?
2. Y a-t-il des routes du frontend absentes des sitemaps ?
3. Les routes protégées (admin, dashboard) sont-elles bien exclues des sitemaps et du crawl ?
4. Les routes legacy (`/es/cookies` → `/es-es/cookies`) sont-elles toutes gérées ?

### 4.2 Routes du blog Laravel

**Fichiers à vérifier :**
- `Blog_sos-expat_frontend/routes/web.php` (574 lignes)
- `Blog_sos-expat_frontend/config/route-segments.php` (segments traduits)

**Questions d'audit :**
1. Les segments traduits (`articles`/`articulos`/`artikel`/`stati`/`wenzhang`/`lekh`/`maqalat`) sont-ils complets pour les 9 langues ?
2. La route fallback (landing pages) peut-elle entrer en conflit avec d'autres routes ?
3. Les routes admin sont-elles protégées contre l'indexation (noindex, pas dans sitemap) ?
4. Les routes RSS/Feed utilisent-elles le bon format de locale ?

### 4.3 Routes du Worker Cloudflare

**Fichiers à vérifier :**
- `sos/cloudflare-worker/worker.js` (181KB)
- `sos/cloudflare-worker/wrangler.toml`

**Questions d'audit :**
1. Le Worker route-t-il correctement vers le blog (`blog.life-expat.com`) vs le frontend (Firebase/Cloudflare Pages) ?
2. Le routing blog gère-t-il tous les patterns d'URL possibles (articles, landing pages, sitemaps, feeds) ?
3. Les URLs du blog passent-elles par le même système de validation de locale que le frontend ?
4. Le Worker gère-t-il correctement les URLs avec `zh` (pas `ch`) dans le préfixe ?
5. Les sitemaps sont-ils servis avec le bon Content-Type et les bons headers de cache ?

---

## PARTIE 5 — AUDIT DU WORKER CLOUDFLARE (Edge)

### 5.1 Données pays embarquées

**Questions d'audit :**
1. L'objet `_CS` (country slugs) est-il synchronisé avec `country-slug-translations.ts` du frontend ?
2. L'objet `_CR` (reverse lookup) couvre-t-il tous les alias/variantes legacy ?
3. Y a-t-il des collisions dans le reverse lookup (deux pays avec le même slug dans une langue) ?
4. Les données sont-elles mises à jour quand on ajoute un nouveau pays dans le système ?

### 5.2 Bot detection et SSR

**Questions d'audit :**
1. L'URL envoyée à `renderForBotsV2` est-elle dans le bon format locale ?
2. Le rendu Puppeteer génère-t-il les hreflang correctement pour les bots ?
3. Le cache SSR (`ssr_cache` Firestore) utilise-t-il l'URL complète (avec locale) comme clé ?
4. Y a-t-il des cas où un bot reçoit une page avec des locales mal formées ?

### 5.3 Cache et invalidation

**Questions d'audit :**
1. La version du cache (`v11` actuellement) est-elle propagée partout quand on la bumpe ?
2. Les URLs canoniques sont-elles les clés de cache (pas les variantes) ?
3. Les landing pages cachées côté edge ont-elles les bons hreflang dans le HTML caché ?

---

## PARTIE 6 — AUDIT DE LA GÉNÉRATION DE CONTENU

### 6.1 Pipeline de génération d'articles

**Fichiers à vérifier :**
- `Blog_sos-expat_frontend/app/Console/Commands/GenerateFichesPays.php` (fiches pays)
- Webhook `Blog_sos-expat_frontend/app/Http/Controllers/Api/WebhookController.php`
- `OLD/eng-content-generate_OLD/app/Services/Content/ArticleGenerator.php` (ancien MC API)

**Questions d'audit :**
1. Les articles générés reçoivent-ils un slug ASCII romanisé dans toutes les langues ?
2. Le `locale` attribué aux articles générés est-il au bon format (`fr-th` vs `fr-fr`) ?
3. Les articles multi-pays reçoivent-ils les bonnes associations country dans la table pivot ?
4. Le contenu généré par Claude API contient-il des URLs internes avec le bon format de locale ?
5. Les images Unsplash utilisées sont-elles dédupliquées (cf. UnsplashUsageTracker) ?

### 6.2 Pipeline de génération de landing pages

**Fichiers à vérifier :**
- Landing page generation (MC API ou nouveau système)
- `Blog_sos-expat_frontend/app/Http/Controllers/LandingController.php`

**Questions d'audit :**
1. Les landing pages générées ont-elles un `canonical_url` au bon format ?
2. Le `hreflang_map` est-il généré correctement pour toutes les variantes linguistiques ?
3. Les CTAs dans les landing pages pointent-ils vers des URLs avec le bon format locale ?
4. Y a-t-il des landing pages avec des locales `fr-th` au lieu de `fr-fr` dans les canonical ?

### 6.3 Backlinks et liens internes

**Fichiers à vérifier :**
- `Blog_sos-expat_frontend/app/Services/LinkInjectorService.php` (injection liens)
- `backlink-engine/` (vérification backlinks)
- `OLD/eng-content-generate_OLD/app/Services/Linking/InternalLinkingService.php`

**Questions d'audit :**
1. Les liens internes injectés utilisent-ils le bon format `{lang}-{defaultCountry}/{segment}/{slug}` ?
2. Les liens internes respectent-ils la langue de l'article (pas de lien FR dans un article EN) ?
3. Les liens affiliés ont-ils le bon `rel="sponsored noopener"` ?
4. Les liens externes non-trusted ont-ils `rel="nofollow noopener"` ?
5. Les liens internes cassés sont-ils détectés et nettoyés automatiquement ?

---

## PARTIE 7 — AUDIT DE COHÉRENCE CROSS-SYSTÈME

### 7.1 Source unique de vérité (Single Source of Truth)

**Question critique :**
Identifier toutes les **duplications** de ces données et recommander une centralisation :

| Donnée | Frontend React | Worker CF | Blog Laravel | MC API (OLD) | Firebase Functions |
|--------|---------------|-----------|-------------|-------------|-------------------|
| Langues supportées | ? | ? | ? | ? | ? |
| Pays par défaut/langue | ? | ? | ? | ? | ? |
| Slugs pays traduits | ? | ? | ? | ? | ? |
| Hreflang mapping | ? | ? | ? | ? | ? |
| Segments route traduits | ? | ? | ? | ? | ? |
| Locales canoniques | ? | ? | ? | ? | ? |

Pour chaque cellule : indiquer le fichier exact et la ligne, puis vérifier la cohérence.

### 7.2 Cas spécifiques à traiter

1. **Le cas chinois (ch/zh/zh-Hans)** : vérifier que les 3 codes sont utilisés aux bons endroits
2. **Le cas arabe (RTL)** : vérifier que `dir="rtl"` est bien appliqué partout
3. **Le cas `fr-th`** : est-ce un article français sur la Thaïlande (légitime) ou un bug de locale ?
4. **Les URLs legacy** : toutes les anciennes URLs sont-elles redirigées en 301 ?
5. **Les doublons Google** : des variantes locale différentes pointent-elles vers le même contenu ?

### 7.3 Tests de non-régression à implémenter

Proposer une suite de tests automatisés :
1. **Test : toutes les locales valides** retournent 200
2. **Test : les locales invalides** retournent 301 (vers défaut) ou 404
3. **Test : les hreflang** sont symétriques (si A pointe vers B, B pointe vers A)
4. **Test : les canonical** sont cohérentes avec les hreflang self
5. **Test : les sitemaps** ne contiennent que des URLs retournant 200
6. **Test : les slugs** sont tous ASCII sans caractères spéciaux
7. **Test : le Worker CF** et le blog Laravel retournent la même réponse pour une même URL

---

## PARTIE 8 — PLAN D'ACTION PRIORISÉ

À la fin de l'audit, produis un **plan d'action priorisé** avec :

### P0 — Critique (à corriger immédiatement)
- Bugs d'indexation Google (hreflang cassés, canonical incorrectes, sitemaps avec 404)
- URLs qui génèrent des boucles de redirection
- Contenu dupliqué (même contenu accessible via plusieurs locales non-canoniques)

### P1 — Important (à corriger cette semaine)
- Incohérences entre les sources de vérité (mapping pays/langues)
- Slugs non-ASCII en production
- Liens internes cassés dans les articles

### P2 — Amélioration (à planifier)
- Centralisation des données de locale en une source unique
- Tests automatisés de non-régression
- Documentation technique du système de locale

### P3 — Nice-to-have
- Optimisations de performance
- Meilleure gestion du cache par locale

---

## FORMAT DE SORTIE ATTENDU

Pour chaque section, utiliser ce format :

```
### [Numéro] — [Titre du point d'audit]

**Fichiers analysés :**
- `chemin/fichier.ext:L42-L67`

**Constat :**
- ✅ [Ce qui fonctionne bien]
- ❌ [Bug/incohérence trouvée — avec preuve]
- ❌ [Autre problème]

**Impact :** [SEO / UX / Performance / Sécurité]

**Recommandation :**
💡 [Action concrète avec code ou diff suggéré]
```

---

## PARTIE 9 — AUDIT BDD & DONNÉES PRODUCTION

### 9.1 Requêtes SQL diagnostiques à exécuter sur PostgreSQL (Blog)

Exécute ces requêtes sur la BDD du blog et rapporte les résultats :

```sql
-- 1. Slugs non-ASCII (caractères Unicode dans les URLs)
SELECT id, language_id, slug FROM article_translations 
WHERE slug ~ '[^a-z0-9\-]' AND slug IS NOT NULL;

-- 2. Slugs avec doubles tirets, espaces, ou majuscules
SELECT id, slug FROM article_translations 
WHERE slug LIKE '%--%' OR slug LIKE '% %' OR slug ~ '[A-Z]';

-- 3. Slugs dupliqués dans la même langue
SELECT language_id, slug, COUNT(*) as cnt 
FROM article_translations 
WHERE is_published = true 
GROUP BY language_id, slug HAVING COUNT(*) > 1;

-- 4. Articles publiés sans slug
SELECT at.id, at.article_id, l.code 
FROM article_translations at 
JOIN languages l ON l.id = at.language_id 
WHERE at.is_published = true AND (at.slug IS NULL OR at.slug = '');

-- 5. Landing pages avec canonical_url mal formée
SELECT id, canonical_url FROM landing_pages 
WHERE canonical_url NOT SIMILAR TO '/[a-z]{2}-[a-z]{2}/%';

-- 6. Landing pages avec hreflang_map vide ou NULL
SELECT id, canonical_url FROM landing_pages 
WHERE hreflang_map IS NULL OR hreflang_map::text = '{}' OR hreflang_map::text = 'null';

-- 7. Articles avec pays associé absent de la table countries
SELECT a.id, ac.country_id FROM articles a 
JOIN article_countries ac ON ac.article_id = a.id 
LEFT JOIN countries c ON c.id = ac.country_id 
WHERE c.id IS NULL;

-- 8. Redirects qui pointent vers des slugs inexistants
SELECT r.id, r.old_path, r.new_path FROM redirects r 
LEFT JOIN article_translations at ON at.slug = r.new_path 
WHERE at.id IS NULL AND r.new_path NOT LIKE '/%';

-- 9. Langues actives vs langues avec des traductions
SELECT l.code, l.is_active, COUNT(at.id) as translation_count 
FROM languages l 
LEFT JOIN article_translations at ON at.language_id = l.id AND at.is_published = true 
GROUP BY l.code, l.is_active ORDER BY translation_count;

-- 10. Distribution des articles par pays (top 20)
SELECT c.code, c.name_en, COUNT(*) as article_count 
FROM article_countries ac 
JOIN countries c ON c.id = ac.country_id 
JOIN articles a ON a.id = ac.article_id 
WHERE a.status = 'published' 
GROUP BY c.code, c.name_en ORDER BY article_count DESC LIMIT 20;
```

### 9.2 Requêtes sur la BDD MC API (connexion `mc_api`)

```sql
-- 1. Landing pages avec locale incohérente dans canonical_url
SELECT id, canonical_url, 
  SUBSTRING(canonical_url FROM '^/([a-z]{2}-[a-z]{2})/') as extracted_locale 
FROM landing_pages 
WHERE canonical_url IS NOT NULL 
ORDER BY canonical_url;

-- 2. Vérifier que chaque landing page a des hreflang pour les 9 langues
SELECT id, canonical_url, 
  jsonb_object_keys(hreflang_map::jsonb) as lang_key 
FROM landing_pages 
WHERE hreflang_map IS NOT NULL 
LIMIT 50;
```

---

## PARTIE 10 — AUDIT DES FICHIERS i18n (URLs HARDCODÉES)

### 10.1 Fichiers de traduction

**Fichiers à vérifier :**
- `sos/src/helper/fr.json`, `en.json`, `es.json`, `de.json`, `ru.json`, `pt.json`, `ar.json`, `hi.json`, `ch.json`

**Grep à exécuter :**
```bash
# URLs hardcodées dans les fichiers i18n
grep -rn "sos-expat\.com" sos/src/helper/*.json
grep -rn "life-expat\.com" sos/src/helper/*.json

# Patterns de locale potentiellement incorrects
grep -rn "fr-th\|en-th\|es-th\|de-th" sos/src/helper/*.json
grep -rn "/ch-\|/ch/" sos/src/helper/*.json  # devrait être /zh-

# Liens internes avec format suspect
grep -rn '"/' sos/src/helper/*.json | grep -v '"/images\|"/assets\|"/icons'
```

**Questions d'audit :**
1. Y a-t-il des URLs absolues hardcodées dans les fichiers i18n au lieu d'utiliser des clés dynamiques ?
2. Les fichiers i18n contiennent-ils des références à des routes avec le mauvais format de locale ?
3. Le fichier `ch.json` utilise-t-il `zh` dans ses URLs internes (pas `ch`) ?

---

## PARTIE 11 — AUDIT DU FICHIER `_redirects` (Cloudflare Pages)

**Fichier à vérifier :**
- `sos/public/_redirects` (redirections Cloudflare Pages)

**Questions d'audit :**
1. Les locales non-canoniques (fr-be, en-gb, zh-tw, etc.) sont-elles toutes redirigées 301 vers les canoniques ?
2. Y a-t-il des règles manquantes pour certaines combinaisons langue-pays ?
3. Les règles de redirection n'entrent-elles pas en conflit avec le Worker CF ?
4. Les wildcard patterns couvrent-ils tous les segments de route traduits ?
5. L'ordre des règles est-il correct (les plus spécifiques avant les plus génériques) ?

---

## PARTIE 12 — AUDIT URLs DANS LES EMAILS, NOTIFICATIONS & API

### 12.1 URLs dans les emails (Zoho/système)

**Fichiers à vérifier :**
- `sos/firebase/functions/src/` — grep pour `sos-expat.com` dans les templates email
- Templates email avec des liens vers le site

**Questions d'audit :**
1. Les liens dans les emails utilisent-ils le bon format de locale ?
2. Les liens profils providers dans les emails utilisent-ils les slugs multilingues ?

### 12.2 URLs dans les notifications Telegram

**Fichiers à vérifier :**
- `sos/firebase/functions/src/` — fonctions qui envoient des liens via Telegram
- Engine Telegram (`engine_telegram_sos_expat`)

**Questions d'audit :**
1. Les URLs envoyées aux bots Telegram sont-elles au bon format ?

### 12.3 URLs dans les réponses API

**Fichiers à vérifier :**
- `Blog_sos-expat_frontend/routes/api.php` (endpoints publics)
- `Blog_sos-expat_frontend/app/Http/Controllers/Api/` (tous les contrôleurs API)
- `Blog_sos-expat_frontend/app/Http/Resources/` (API Resources/Transformers)

**Questions d'audit :**
1. Les endpoints API publics retournent-ils des URLs avec le bon format de locale ?
2. Les `ArticleResource` ou équivalent génèrent-ils des URLs cohérentes avec le routage web ?
3. L'endpoint de recherche retourne-t-il des slugs/URLs dans le bon format ?

---

## PARTIE 13 — AUDIT og:url, JSON-LD & DONNÉES STRUCTURÉES

### 13.1 Cohérence og:url / canonical / hreflang

**Fichiers à vérifier :**
- `Blog_sos-expat_frontend/app/Services/JsonLdService.php` (toutes les URLs dans le JSON-LD)
- `Blog_sos-expat_frontend/app/Services/CanonicalService.php` (og:url, og:locale)
- Templates Blade — `<meta property="og:url">`, `<link rel="canonical">`
- `sos/src/components/layout/SEOHead.tsx` (og:url frontend)

**Questions d'audit :**
1. `og:url` === `canonical` === `hreflang self-referencing` pour chaque page ? (Les 3 DOIVENT être identiques)
2. Les URLs dans le JSON-LD (`@id`, `url`, `mainEntityOfPage`) utilisent-elles le même format que le canonical ?
3. Le `BreadcrumbList` JSON-LD contient-il des URLs avec le bon format de locale à chaque niveau ?
4. Le `sameAs` dans le JSON-LD Organization pointe-t-il vers des URLs valides ?
5. Les URLs d'images dans le JSON-LD (`image`, `thumbnailUrl`) sont-elles absolues et valides ?

---

## PARTIE 14 — AUDIT ROUTES FAQ, OUTILS, SONDAGES, ANNUAIRE

### 14.1 Routes supplémentaires du blog

**Fichiers à vérifier :**
- `Blog_sos-expat_frontend/app/Http/Controllers/FaqController.php`
- `Blog_sos-expat_frontend/app/Http/Controllers/ToolController.php` (si existe)
- `Blog_sos-expat_frontend/app/Http/Controllers/SondageController.php` (si existe)
- `Blog_sos-expat_frontend/app/Http/Controllers/DirectoryController.php` (si existe)
- Les sitemaps correspondants dans `SeoController.php`

**Questions d'audit :**
1. Les FAQ (`content_type='qa'`) ont-elles leurs propres routes ou partagent-elles celles des articles ?
2. Les segments URL des FAQ sont-ils traduits dans les 9 langues ?
3. Les outils, sondages et annuaire ont-ils des routes avec le bon format de locale ?
4. Ces routes sont-elles dans les sitemaps correspondants ?
5. Le `FaqController` gère-t-il les hreflang correctement pour les pages FAQ ?

---

## PARTIE 15 — COMMANDES DE DIAGNOSTIC PRODUCTION

### 15.1 Tests curl à exécuter sur `sos-expat.com`

```bash
# --- TESTS FRONTEND (SPA) ---

# 1. Locale valide canonique → doit retourner 200
curl -sI "https://sos-expat.com/fr-fr/" | head -5
curl -sI "https://sos-expat.com/en-us/" | head -5
curl -sI "https://sos-expat.com/zh-cn/" | head -5

# 2. Locale non-canonique → doit retourner 301 vers canonique
curl -sI "https://sos-expat.com/fr-be/" | head -5
curl -sI "https://sos-expat.com/en-gb/" | head -5
curl -sI "https://sos-expat.com/zh-tw/" | head -5

# 3. Locale invalide → doit retourner 301 ou 404
curl -sI "https://sos-expat.com/xx-yy/" | head -5
curl -sI "https://sos-expat.com/fr-zz/" | head -5

# 4. Code chinois ch vs zh → ch ne doit PAS fonctionner
curl -sI "https://sos-expat.com/ch-cn/" | head -5
curl -sI "https://sos-expat.com/zh-cn/" | head -5

# 5. Legacy locale format (sans pays) → doit rediriger
curl -sI "https://sos-expat.com/es/cookies" | head -5
curl -sI "https://sos-expat.com/fr/connexion" | head -5

# --- TESTS BLOG ---

# 6. Article blog avec locale pays → doit retourner 200
curl -sI "https://sos-expat.com/fr-fr/articles/" | head -5
curl -sI "https://sos-expat.com/en-us/articles/" | head -5

# 7. Article avec pays non-défaut → vérifier comportement
curl -sI "https://sos-expat.com/fr-th/articles/" | head -5

# 8. Sitemaps → doivent retourner 200 + Content-Type XML
curl -sI "https://sos-expat.com/sitemap.xml" | head -10
curl -sI "https://sos-expat.com/sitemaps/articles-fr.xml" | head -10

# 9. RSS Feed → doit retourner 200
curl -sI "https://sos-expat.com/fr/feed.xml" | head -5

# --- TESTS HREFLANG (via rendu HTML) ---

# 10. Vérifier les hreflang dans le HTML d'une page
curl -s "https://sos-expat.com/fr-fr/" | grep -i 'hreflang'
curl -s "https://sos-expat.com/en-us/" | grep -i 'hreflang'

# 11. Vérifier canonical dans le HTML
curl -s "https://sos-expat.com/fr-fr/" | grep -i 'canonical'

# 12. Vérifier og:url
curl -s "https://sos-expat.com/fr-fr/" | grep -i 'og:url'

# --- TESTS BOT SSR ---

# 13. Simuler un bot Google → doit avoir les hreflang dans le HTML
curl -sA "Googlebot/2.1" "https://sos-expat.com/fr-fr/" | grep -i 'hreflang'
curl -sA "Googlebot/2.1" "https://sos-expat.com/zh-cn/" | grep -i 'hreflang'

# 14. Vérifier que le bot reçoit du HTML complet (pas juste le shell SPA)
curl -sA "Googlebot/2.1" "https://sos-expat.com/fr-fr/" | grep -c '<title>'
```

### 15.2 Grep exhaustif sur le codebase

```bash
# --- PATTERNS SUSPECTS À CHERCHER ---

# 1. Code chinois "ch" utilisé comme locale URL (devrait être "zh")
grep -rn '"/ch-' sos/src/ sos/cloudflare-worker/ Blog_sos-expat_frontend/
grep -rn "'/ch-" sos/src/ sos/cloudflare-worker/ Blog_sos-expat_frontend/
grep -rn 'ch-cn\|ch-tw\|ch-hk\|ch-sg' sos/src/ Blog_sos-expat_frontend/

# 2. Locales avec casse incorrecte
grep -rn 'FR-\|EN-\|ES-\|DE-\|RU-\|PT-\|ZH-\|HI-\|AR-' sos/src/utils/ sos/src/data/ --include="*.ts" --include="*.tsx"

# 3. fr-th et autres locales non-canoniques hardcodées
grep -rn "fr-th\|en-th\|es-th\|de-th" sos/src/ Blog_sos-expat_frontend/app/ Blog_sos-expat_frontend/config/

# 4. URLs absolues hardcodées (risque de mauvais domaine/format)
grep -rn "https://sos-expat\.com/" sos/src/helper/*.json
grep -rn "https://sos-expat\.com/" Blog_sos-expat_frontend/app/

# 5. Doublons de mapping langue→pays défaut
grep -rn "default.*country\|DEFAULT_COUNTRY\|defaultCountry\|default_countries" sos/src/ Blog_sos-expat_frontend/app/ Blog_sos-expat_frontend/config/ sos/firebase/functions/src/

# 6. Mapping hreflang dupliqué
grep -rn "hreflang\|HREFLANG\|localeToHreflang\|HREFLANG_MAP" sos/src/ Blog_sos-expat_frontend/app/ sos/firebase/functions/src/

# 7. Vérifier que "zh-Hans" est le seul hreflang chinois (pas "zh", "zh-CN", "zh-Hant")
grep -rn "zh-CN\|zh-Hant\|zh-TW" sos/src/ Blog_sos-expat_frontend/app/ sos/firebase/functions/src/
```

---

## NOTES IMPORTANTES POUR L'AUDITEUR

1. **Ne fais PAS d'hypothèses** — lis chaque fichier avant de te prononcer
2. **Exécute les greps et les requêtes SQL** — les résultats concrets sont plus utiles que les spéculations
3. **Vérifie la production** — exécute les `curl` sur `sos-expat.com` pour voir le comportement réel
4. **Attention aux données embarquées** — le Worker CF de 181KB contient des données en dur qui peuvent diverger du reste
5. **Le MC API est OLD mais sa BDD est toujours lue** — `LandingPage` utilise la connexion `mc_api` en production
6. **Ne recommande PAS de refactoring massif** — priorise les quick wins qui impactent le SEO immédiatement
7. **Vérifie la règle des 3 identiques** — pour chaque page : `canonical` === `og:url` === `hreflang self` (sinon Google est confus)
8. **Pays prioritaires à tester en premier** : TH, VN, SG, MY, PH, JP, AU, MX, BR, CR, US (marchés cibles)
9. **Attention au SPA vs SSR** — le frontend React est un SPA, les hreflang ne sont visibles par Google QUE via le rendu Puppeteer (tester avec User-Agent Googlebot)
10. **Le blog Laravel est SSR natif** — les hreflang sont dans le HTML serveur, pas besoin de Puppeteer
