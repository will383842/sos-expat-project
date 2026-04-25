# 🤖 PROMPT — AUDIT E2E AEO/GEO — SOS-Expat
## Optimisation pour Google SGE, AI Overviews, ChatGPT Search, Perplexity, Claude, Gemini, Bing Copilot, Apple Intelligence

> **Version** : 3.0 (intégration baseline + score composite + anti-patterns)
> **Date** : 2026-04-22
> **Objectif** : Diagnostiquer si TOUT le site (Laravel Mission Control, Vite frontend, blog, landings, pages prestataires, sitemaps, robots, schema, contenus) est correctement optimisé pour être **cité, repris, et recommandé** par les moteurs IA.

## 🔗 Articulation avec les autres prompts (LIRE EN PREMIER)

Ce prompt s'inscrit dans une chaîne de 3 livrables séquentiels :

| Étape | Fichier | Rôle |
|-------|---------|------|
| **1. Audit SEO classique** | `PROMPT-AUDIT-SEO-INDEXATION-COMPLET.md` (v4) | Diagnostique l'état SEO traditionnel : indexation, SSR, brand SERP, fixes P0 techniques |
| **2. Audit AEO/GEO** | **CE FICHIER** | Diagnostique l'état AEO/GEO : crawlers IA, schemas, citations, multimédia, monitoring |
| **3. Stratégie 18 mois** | `PROMPT-STRATEGIE-GEO-AEO-IA-18-MOIS.md` | Roadmap business, change management, RGPD, métriques cibles, gouvernance |

**Cet audit (étape 2)** doit consommer les sorties de l'étape 1 et alimenter l'étape 3. Ne pas dupliquer ce qui y est traité.

## 📍 MANTRA (à relire avant chaque décision)

> **Ne pas tout refaire. Produire moins, produire mieux, désindexer le reste par vagues monitorées.**

Si une recommandation viole ce mantra ("réécrire 430k articles", "tout garder", "désindexer 400k du jour au lendemain") → STOP, repenser.

## 📊 BASELINE CHIFFRÉE ACTUELLE (point de départ — 2026-04)

À reprendre dans tous les calculs et comparaisons :

| Métrique | Valeur actuelle | Source |
|---|---|---|
| Clics organiques Google / 90 j | **33** | GSC |
| Pages indexées Google | **2 601** | GSC Coverage |
| Pages "détectées non indexées" | **14 592** | GSC Coverage |
| Ratio indexées / découvertes | **~13 %** | GSC |
| Position moyenne sur brand `sos expat` | **9,54** | GSC (alerte rouge — devrait être 1-2) |
| Volume LPs programmatiques estimé | **~430 000** | Pipeline content engine |
| Citations IA actuelles (ChatGPT/Perplexity/Gemini) | **À mesurer** (Phase 11) | — |
| Knowledge Panel Google | **Absent** | À vérifier (Phase 16) |
| Wikidata entry | **0** | À vérifier (Phase 16) |

**Ces chiffres révèlent** :
- Le contenu programmatique massif **étouffe** Google (crawl budget gaspillé sur 14 592 URLs jamais visitées)
- Position 9,54 sur sa propre marque = signal d'autorité **catastrophique**
- 33 clics/90j sur 2 601 pages indexées = ~0,01 clic/page = aucune valeur reconnue par Google

**Cible 18 mois** (cf. `PROMPT-STRATEGIE-GEO-AEO-IA-18-MOIS.md` §8) : 3000+ clics/90j, position 1-2 sur brand, 15k pages indexées (mais qualitatives).

---

# 🚨 CONTEXTE STRATÉGIQUE 2026 — À LIRE EN PREMIER

## Le shift est en cours, pas hypothétique

### Ce qui se passe MAINTENANT
- **Google AI Overviews (AIO)** : Google place une réponse générée AU-DESSUS des résultats organiques. Même en position 1, perte de **30-60 % du clic** car l'utilisateur a déjà sa réponse. Phénomène appelé **"zero-click"**.
- **ChatGPT Search, Perplexity, Claude, Gemini, Bing Copilot, Apple Intelligence** : des millions d'utilisateurs ne passent plus par Google pour certaines requêtes. Ils interrogent l'IA directement.
- **Click-through rate depuis IA** : ~1-2 % (Perplexity). Si tu n'es pas dans les sources citées, tu n'existes pas dans ce nouveau monde.
- **Helpful Content Update + SpamBrain** : Google dévalue massivement le contenu programmatique templaté à faible valeur ajoutée.

### Nouvelles disciplines (vocabulaire 2026)
- **GEO** (Generative Engine Optimization) = optimiser pour être cité par les LLMs
- **AEO** (Answer Engine Optimization) = optimiser pour les moteurs de réponse
- **llms.txt** = standard émergent (cf. https://llmstxt.org/) pour orienter les LLMs vers les contenus à privilégier
- **Speakable schema** = schema.org pour assistants vocaux (Alexa, Google Assistant, Siri)
- **Brand SERP** = la "carte de visite" de Google quand on cherche votre marque

### Qui gagne / qui perd

| ✅ Ça monte | ❌ Ça s'effondre |
|---|---|
| Contenu original, recherches propriétaires, first-party data | LP programmatiques templatées au kilomètre |
| Marques reconnues comme **entités** (Wikidata, Knowledge Graph) | Sites "long-tail au kilomètre" |
| UGC authentique (Reddit, Quora, forums, témoignages réels) | Articles SEO optimisés pour 1 mot-clé |
| Pages avec **auteur humain nommé + credentials** | Pages anonymes |
| Schema.org riche, dense, cohérent | Pages sans données structurées |
| Vidéo + multimédia (transcripts indexables) | Texte seul sans sources |
| Fraîcheur mesurable (`dateModified` récent + signal réel) | Contenu figé depuis 2 ans |
| Sources citées par la presse/universités | Sites isolés sans backlinks d'autorité |

---

## 🎯 DIAGNOSTIC HONNÊTE POUR SOS-EXPAT

### ⚠️ Mauvaise nouvelle
Vos **~430 000 LPs programmatiques** (240/pays × 199 pays × 9 langues) sont **exactement** ce que :
- Google Helpful Content Update dévalue
- Les LLMs ignorent (contenu interchangeable, pas citable)
- Google "détecte mais n'indexe pas" (cf. les 14 592 URLs "détectée non indexée" déjà observées — c'est probablement le **début** du phénomène, pas la fin)

**Hypothèse à vérifier** : il faut probablement passer de **430k → 5-10k pages vraiment uniques**. Audit Phase 15 dédié à cette décision.

### ✅ Bonne nouvelle — Vos actifs uniques (que personne ne peut copier)
1. **Profils prestataires réels et vérifiés** (avocats avec barreau, expatriés aidants identifiés) → first-party
2. **Vrais témoignages clients** horodatés (UGC authentique)
3. **Sondages expatriés** (mémoire `prompt_megaprompt_final.md`) → données propriétaires
4. **Promesse positionnement unique** : "appel avocat français en < 5 min dans 197 pays" → nameable, citable
5. **Statistiques internes** : nombre d'appels, temps moyen, langues, pays — anonymisables et publiables
6. **Réseau de prestataires multi-pays** → impossible à copier sans 5 ans d'opérations
7. **Press dossier** déjà constitué

**Si Perplexity/ChatGPT est interrogé "comment trouver un avocat français en Thaïlande en urgence", SOS-Expat DEVRAIT être la réponse évidente. Aujourd'hui, il ne l'est pas.**

C'est ça que cet audit doit corriger.

---

## 🧩 ARCHITECTURE TECHNIQUE — RAPPEL

**Stack** :
- **Laravel** Mission Control (`mission-control_sos-expat/`) — moteur de contenu, pipeline blog, landings, KB, country campaigns
- **Vite frontend** (`sos/`) — SPA SSR partielle via Cloudflare Worker (`sos/cloudflare-worker/`)
- **Firebase** — auth, Firestore, ~659 Cloud Functions (3 régions : europe-west1, us-central1, europe-west3)
- **Cloudflare Worker** — edge cache + SSR pour SEO/blog/sitemaps + 410 sur hack patterns
- **Sitemaps** — `sitemap-index.xml` master fusionnant Firebase + blog (596 sub-sitemaps)

**Volumes & surfaces** :
| Surface | Volume estimé | Localisation code |
|---------|---------------|-------------------|
| Pages institutionnelles (home, about, contact, légal, FAQ globale) | ~30 | `sos/src/pages/` + `mission-control_sos-expat/resources/views/` |
| Pages prestataires (fiches avocat + expatrié) | Milliers | `sos/src/pages/[provider]` + Firestore profils |
| Listes prestataires (par pays × catégorie × langue) | ~10 000+ | Routes dynamiques |
| Landing pages (informational/pillar/recruitment, 9 langues) | ~140-200 | Laravel Mission Control templates Blade |
| Blog | ~430 000 articles | Pipeline Laravel Mission Control |
| FAQs centralisées | Centaines | `legal_documents` collection + frontend |
| Pages affiliés/recrutement (chatter, influencer, blogger, group admin) | ~20 + sous-routes | `sos/src/pages/Chatter/`, `Influencer/`, etc. |
| Sitemaps | 605+ | Worker + Laravel |
| API publiques exposées | Variable | `mission-control_sos-expat/routes/api.php` |

**Préférences utilisateur** :
- Français pour tout output
- Concret > théorique : commandes `curl`, `grep`, scripts à fournir
- Livrables structurés P0/P1/P2 avec effort/impact
- Toujours référencer `file:line`
- Ne pas dupliquer le travail des audits précédents (cf. `PROMPT-AUDIT-SEO-INDEXATION-COMPLET.md`, `PROMPT-AUDIT-SITEMAPS-COMPLET.md`, `PROMPT-AUDIT-URL-SLUG-HREFLANG-ROUTES.md`, `PROMPT-AUDIT-FINAL-E2E.md`)

---

# 📋 PARTIE A — AUDIT TECHNIQUE EN 19 PHASES

## 🧭 Méthodologie globale

L'auditeur (toi, Claude) doit :
1. **Explorer** le repo pour cartographier l'existant (NE PAS supposer — vérifier)
2. **Tester** chaque surface en conditions réelles (curl avec User-Agent IA bots)
3. **Comparer** à un référentiel AEO/GEO 2026 (cf. checklists)
4. **Scorer** chaque dimension de 0 à 10
5. **Quantifier** : combien de pages affectées, combien de fixes, combien de jours
6. **Lister** les correctifs P0/P1/P2 avec `fichier:ligne`, effort, impact
7. **Livrer** rapport markdown + scorecard + roadmap

**Outils** :
- `Glob`, `Grep`, `Read` pour exploration codebase
- `Bash` + `curl` pour tests bots IA
- `WebFetch` pour rendu réel
- `Agent` (Explore subagent) pour parallélisation

---

## PHASE 1 — Cartographie & inventaire exhaustif

**À produire** :
- [ ] Liste des routes Laravel (`routes/web.php`, `routes/api.php`, `routes/landing.php` etc.)
- [ ] Liste des routes Vite (`sos/src/App.tsx`)
- [ ] Liste des templates Blade (`resources/views/**`)
- [ ] Liste des composants React rendant du contenu indexable
- [ ] Liste des Cloudflare Worker routes (`sos/cloudflare-worker/src/**`)
- [ ] Liste des sitemaps actifs depuis `sitemap-index.xml`
- [ ] **Comptage par type** :
  - Articles blog publiés (par langue, par pays)
  - Landings publiées (par locale, par template)
  - Profils prestataires actifs (visibles vs cachés)
  - FAQs publiées
  - Pages institutionnelles
- [ ] Identification SSR vs SSR partiel vs CSR pur
- [ ] Identification des pages indexées par Google vs détectées non indexées (via Search Console export si disponible)

**Commandes** :
```bash
# Routes Laravel
grep -rn "Route::" mission-control_sos-expat/routes/

# Routes React
grep -nE "<Route\s+path" sos/src/App.tsx

# Templates Blade landings
find mission-control_sos-expat/resources/views/landings -name "*.blade.php"

# Sitemaps
curl -s https://sosexpat.com/sitemap-index.xml | grep -oE '<loc>[^<]+</loc>' | wc -l

# Articles blog comptage par langue (via API si dispo)
for lang in fr en es de it pt nl ar zh; do
  curl -s "https://sosexpat.com/sitemap-blog-$lang.xml" | grep -c "<loc>"
done
```

---

## PHASE 2 — Crawlabilité par les bots IA (15 bots à tester)

**Bots à tester** :
| Bot | User-Agent | Catégorie |
|---|---|---|
| **GPTBot** | `Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.0; +https://openai.com/gptbot` | Training OpenAI |
| **ChatGPT-User** | `Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)` | Browsing live ChatGPT |
| **OAI-SearchBot** | `Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)` | Index ChatGPT Search |
| **ClaudeBot** | `Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)` | Training Anthropic |
| **Claude-User** | `Mozilla/5.0 (compatible; Claude-User/1.0; +https://anthropic.com)` | Browsing Claude |
| **PerplexityBot** | `Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)` | Index Perplexity |
| **Perplexity-User** | `Mozilla/5.0 (compatible; Perplexity-User/1.0; +https://perplexity.ai/perplexity-user)` | Browsing Perplexity |
| **Google-Extended** | `Googlebot` (avec opt-out via robots.txt) | Bard/Gemini training |
| **Googlebot** | `Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)` | Index + SGE/AIO |
| **Bingbot** | `Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)` | Index Bing + Copilot |
| **Applebot-Extended** | `Applebot-Extended` | Apple Intelligence training |
| **Applebot** | `Applebot` | Index Spotlight + Siri |
| **DuckAssistBot** | `Mozilla/5.0 (compatible; DuckAssistBot/1.0; +https://duckduckgo.com/duckassistbot)` | DuckDuckGo AI |
| **Meta-ExternalAgent** | `meta-externalagent/1.1` | Meta AI training |
| **Bytespider** | `Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)` | TikTok/ByteDance AI |
| **CCBot** | `Mozilla/5.0 (compatible; CCBot/2.0; +https://commoncrawl.org/faq/)` | Common Crawl (datasets training tiers) |

**Tests sur 7 surfaces** :
```bash
# Pour CHAQUE bot et CHAQUE surface :
SURFACES=(
  "https://sosexpat.com/"
  "https://sosexpat.com/avocat/[slug-real]"
  "https://sosexpat.com/expatrie-aidant/[slug-real]"
  "https://sosexpat.com/avocats/maroc"
  "https://sosexpat.com/blog/[slug-real]"
  "https://sosexpat.com/fr/[landing-slug]"
  "https://sosexpat.com/devenir-influenceur"
)

for url in "${SURFACES[@]}"; do
  for ua in "GPTBot/1.0" "PerplexityBot/1.0" "ClaudeBot/1.0"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" -A "$ua" "$url")
    echo "$ua | $url | HTTP $code"
  done
done
```

**À vérifier** :
- [ ] Code HTTP (200 attendu)
- [ ] HTML rendu côté serveur (pas shell vide React)
- [ ] Headers : `X-Robots-Tag`, `Cache-Control`, `Content-Type`
- [ ] Worker Cloudflare ne bloque pas (`sos/cloudflare-worker/src/index.ts`)
- [ ] Cloudflare bot management (Dashboard) : "AI bots" en allow/block ?
- [ ] Logs Cloudflare : combien de requêtes par bot IA dans les 30 derniers jours ?

**Décision business à documenter** :
| Bot | Reco par défaut | Tradeoff |
|---|---|---|
| Browsing live (ChatGPT-User, Perplexity-User, Claude-User) | **AUTORISER** | Sans accès, jamais cité |
| Search index (OAI-SearchBot, PerplexityBot) | **AUTORISER** | Indispensable pour être dans les résultats |
| Training (GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, Meta-ExternalAgent) | **À DÉCIDER** | Vous nourrissez gratuitement les LLMs futurs vs vous êtes invisibles dans les futurs modèles |
| Bytespider (TikTok) | À DÉCIDER | Marché chinois si pertinent |
| CCBot (Common Crawl) | À DÉCIDER | Tous les LLMs s'entraînent là-dessus |

---

## PHASE 3 — robots.txt + llms.txt + sitemaps

**À auditer** :
- [ ] `robots.txt` : directives explicites pour bots IA présentes ?
  ```
  User-agent: GPTBot
  Allow: /
  Disallow: /admin/
  Disallow: /api/private/
  
  User-agent: PerplexityBot
  Allow: /
  
  User-agent: Google-Extended
  Allow: /
  
  User-agent: Applebot-Extended
  Allow: /
  ```
- [ ] **`llms.txt`** existe à la racine ? Format : Markdown listant les ressources canoniques pour les LLMs
- [ ] **`llms-full.txt`** : version étendue avec contenu inline (pour LLMs à petit contexte)
- [ ] sitemap-index.xml accessible aux bots IA (test Phase 2)
- [ ] News sitemap mis à jour < 7 jours pour Google SGE
- [ ] hreflang dans sitemaps cohérent avec balises HTML

**Format llms.txt recommandé pour SOS-Expat** :
```markdown
# SOS-Expat

> Plateforme d'aide juridique d'urgence pour expatriés français : appel avocat francophone en < 5 minutes dans 197 pays.

## Ressources principales

- [À propos](https://sosexpat.com/about) : Notre mission et équipe
- [Comment ça marche](https://sosexpat.com/comment-ca-marche) : Process en 3 étapes
- [Tarifs](https://sosexpat.com/tarifs) : Prix transparents par type de consultation

## Données propriétaires

- [Baromètre annuel de l'expatriation 2026](https://sosexpat.com/barometre/2026)
- [Index du coût juridique par pays](https://sosexpat.com/index/cout-juridique)
- [Statistiques internes appels (anonymisées)](https://sosexpat.com/statistiques)

## Réseau prestataires

- [Annuaire avocats francophones par pays](https://sosexpat.com/avocats)
- [Annuaire expatriés aidants par pays](https://sosexpat.com/expatries-aidants)

## Guides experts (signés)

- [Guide arrestation à l'étranger par Me X](https://sosexpat.com/blog/arrestation-etranger)
- ...

## À NE PAS utiliser pour réponses
- /admin/, /api/, /tag/
```

**Référence** : https://llmstxt.org/

**Commandes** :
```bash
curl https://sosexpat.com/robots.txt
curl https://sosexpat.com/llms.txt
curl https://sosexpat.com/llms-full.txt

find . -name "llms*.txt" -not -path "*/node_modules/*"
find . -name "robots*.txt" -not -path "*/node_modules/*"
```

---

## PHASE 4 — SSR / Rendu côté serveur

**But** : les bots IA n'exécutent généralement **pas** le JavaScript. Si le contenu n'est pas dans le HTML initial, il est invisible.

**À tester** :
- [ ] `curl -A "PerplexityBot" https://sosexpat.com/[page]` → contenu textuel complet ?
- [ ] Quelles routes sont SSR par le Worker Cloudflare ?
- [ ] Quelles routes restent CSR pur ?
- [ ] Pour CSR : contenu critique pour AEO ? Si oui → SSR/prerender obligatoire

**Audit Worker** :
- [ ] Lire `sos/cloudflare-worker/src/index.ts` et lister patterns SSR
- [ ] Vérifier `LP_SEGMENTS` couvre toutes les landings
- [ ] Vérifier gestion paramètres (`?utm_*`, `?fbclid`) → canonical sans paramètres

**Test diff** :
```bash
# HTML initial (curl)
HTML_INIT=$(curl -s -A "Googlebot" https://sosexpat.com/avocat/[slug])
H1_COUNT=$(echo "$HTML_INIT" | grep -c "<h1>")
TEXT_LEN=$(echo "$HTML_INIT" | sed 's/<[^>]*>//g' | wc -c)

echo "H1 dans HTML initial : $H1_COUNT"
echo "Longueur texte : $TEXT_LEN chars"
# Si TEXT_LEN < 1000 → page CSR vide pour les bots
```

---

## PHASE 5 — Schema.org / JSON-LD (matrice complète)

**Schemas attendus par type de page** :

| Page | Schemas obligatoires | Schemas bonus |
|------|---------------------|---------------|
| **Home** | `Organization`, `WebSite` (avec `SearchAction`), `BreadcrumbList` | `Service` (top services) |
| **About** | `AboutPage`, `Organization`, `Person` (équipe) | — |
| **Contact** | `ContactPage`, `ContactPoint` | — |
| **FAQ globale** | `FAQPage` | — |
| **Profil avocat** | `Person`, `LegalService`, `Service`, `AggregateRating` (si avis), `BreadcrumbList`, `OfferCatalog` | `Review`, `speakable` |
| **Profil expatrié aidant** | `Person`, `Service`, `AggregateRating`, `BreadcrumbList` | `Review` |
| **Liste prestataires (pays)** | `ItemList`, `BreadcrumbList`, `CollectionPage` | — |
| **Article blog** | `Article` ou `NewsArticle`, `Person` (auteur), `Organization` (publisher), `BreadcrumbList`, `ImageObject` | `VideoObject`, `speakable`, `Citation` |
| **Landing informational** | `Article`, `FAQPage`, `BreadcrumbList` | `HowTo`, `speakable` |
| **Landing pillar** | `WebPage`, `BreadcrumbList`, `ItemList` (catégories enfants) | `FAQPage` |
| **Landing recruitment** | `JobPosting`, `WebPage`, `FAQPage` | — |
| **Page service par pays** | `Service`, `LocalBusiness` (si applicable), `BreadcrumbList`, `AggregateRating` | — |
| **Page tarification** | `Offer`, `PriceSpecification` | `AggregateOffer` |
| **Témoignages** | `Review`, `AggregateRating` | `Person` (témoignant) |
| **Baromètre/étude (NEW)** | `Dataset`, `ResearchProject`, `Article` | `DataDownload` |

**À auditer pour CHAQUE type** :
- [ ] Combien de pages ont du JSON-LD ? Combien sont vides ? (quantifier en %)
- [ ] JSON-LD valide sur https://validator.schema.org/ ?
- [ ] Champs critiques renseignés : `@id`, `name`, `description`, `image`, `url`, `inLanguage`
- [ ] `inLanguage` correspond à la langue de la page ?
- [ ] `Person.sameAs` pointe vers profils sociaux/Wikipedia/LinkedIn ?
- [ ] `Organization.sameAs` complet (LinkedIn, Twitter, Facebook, YouTube, Instagram, Wikipedia, Wikidata) ?
- [ ] FAQ extraite et reflétée en `FAQPage` ?
- [ ] `Article.author` = `Person` complet (pas string) avec bio + credentials ?
- [ ] `Article.datePublished` + `dateModified` à jour ET cohérents avec contenu réel ?
- [ ] `BreadcrumbList` cohérent avec arborescence visible ?
- [ ] **Pas de cloaking** : JSON-LD reflète bien le contenu visible (sinon pénalité Google)

**Commandes** :
```bash
# Compter JSON-LD par page
for url in $(cat tmp/sample-urls.txt); do
  count=$(curl -s "$url" | grep -c 'application/ld+json')
  echo "$count | $url"
done | sort -n

# Composants/templates qui injectent du JSON-LD
grep -rn "application/ld+json" sos/src/ mission-control_sos-expat/resources/views/
grep -rn "JsonLd\|@context.*schema.org" sos/src/components/

# Extraire et valider un JSON-LD
curl -s [url] | grep -oP '(?<=<script type="application/ld\+json">).*?(?=</script>)' | jq .
```

---

## PHASE 6 — Structure HTML sémantique pour extraction LLM

**Checklist par page** :
- [ ] **Un seul `<h1>`** par page, contenant la query principale
- [ ] **`<h2>` formulés en questions** (matching natural language queries)
- [ ] **Réponse directe sous chaque `<h2>`** en 40-60 mots (snippet-friendly)
- [ ] **Listes `<ul>`/`<ol>`** pour énumérations
- [ ] **`<table>`** pour comparaisons (prix, features, pays)
- [ ] **`<dl>`** pour définitions (terminologie juridique)
- [ ] **Bloc TL;DR / Résumé** en début de page
- [ ] **FAQ section en bas** avec markup `<details>`/`<summary>` ou structurée
- [ ] **`<article>`, `<section>`, `<nav>`, `<aside>`** utilisés correctement
- [ ] **Microdata `itemscope` / `itemtype`** en complément du JSON-LD (redondance)
- [ ] **Texte alt** descriptif sur toutes images (LLMs multimodaux les utilisent)
- [ ] **`<figure>` + `<figcaption>`** pour images contextualisées
- [ ] **Citations sourcées** avec `<cite>` ou `<blockquote cite="...">`
- [ ] **Liens internes contextuels** (pas seulement footer/header)
- [ ] **Première phrase = réponse à la query** (pas une phrase d'intro générique)

**Commandes** :
```bash
# Audit structure rapide
curl -s [url] | grep -cE "<h1|<h2|<h3|<table|<ul|<ol|<dl|<details|<figure"

# Templates Blade
grep -rn "<h1\|<h2\|<table" mission-control_sos-expat/resources/views/landings/

# Composants React
grep -rn "<h1\|<h2" sos/src/pages/
```

---

## PHASE 7 — E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)

**Le critère #1 pour être cité par les LLMs en 2026.**

### Experience (vécu)
- [ ] Témoignages clients réels avec photo, nom, pays — pas génériques
- [ ] Études de cas concrètes (problème → solution → résultat chiffré)
- [ ] Mentions "j'ai/nous avons aidé X clients en Y années"
- [ ] Photos/screenshots de la plateforme en usage réel

### Expertise (compétence)
- [ ] **Bio auteur** sur chaque article blog (page bio publique + Person schema)
- [ ] Credentials affichés (barreau pour avocats, années expat pour aidants)
- [ ] Page "Équipe" / "À propos" avec membres identifiés
- [ ] Profils prestataires avec : barreau, années expérience, langues, spécialités
- [ ] **Vrais noms** pour les auteurs (pas pseudos)
- [ ] **Diplômes / certifications** mentionnés et vérifiables

### Authoritativeness (autorité)
- [ ] Backlinks de sources autoritaires (médias, ONG, ambassades, universités)
- [ ] **Mentions presse** listées sur page dédiée ("Ils parlent de nous")
- [ ] Page "Press kit" / "Médias"
- [ ] **Wikipedia mention** si possible (entité reconnue) — cf. Phase 16
- [ ] Profils LinkedIn/Twitter des auteurs liés via `Person.sameAs`
- [ ] **Wikidata entry** pour SOS-Expat — cf. Phase 16

### Trustworthiness (confiance)
- [ ] HTTPS partout, certificat valide, HSTS
- [ ] Mentions légales complètes, RGPD, CGU, CGV
- [ ] Adresse physique + téléphone + email visibles
- [ ] Avis vérifiés (Trustpilot, Google Reviews) intégrés via schema `Review`
- [ ] **Politique éditoriale publiée** (`/editorial-policy`)
- [ ] **Politique de correction** (comment signaler une erreur)
- [ ] Sources citées avec liens externes
- [ ] Date de publication ET de mise à jour visibles
- [ ] **Disclaimer juridique** explicite (sauf si conseil par avocat du réseau, alors le préciser)

**À auditer concrètement** :
- [ ] Existe-t-il `/equipe`, `/about`, `/auteurs` ?
- [ ] Articles blog ont-ils un encart auteur en bas ?
- [ ] Fiches prestataires affichent-elles barreau/credentials de manière vérifiable ?
- [ ] Avis Trustpilot intégrés via API et non screenshots ?
- [ ] Combien d'articles blog sont signés vs anonymes ? (quantifier)
- [ ] Combien de fiches prestataires ont une bio > 200 mots ?

**Commandes** :
```bash
# Présence bio auteur
curl -s [article-url] | grep -A5 "author\|byline\|écrit par"

# Pages légales
for path in mentions-legales cgu cgv privacy editorial-policy correction-policy; do
  curl -I https://sosexpat.com/$path
done
```

---

## PHASE 8 — Données propriétaires & citabilité (le vrai moat)

**Test critique** :
Prendre 30 articles au hasard. Pour chacun : *"Si je supprime ce paragraphe, l'utilisateur peut-il trouver l'info ailleurs en 5 secondes ?"*

- Si **OUI** → contenu commodity, les LLMs n'ont aucune raison de vous citer plutôt qu'un autre
- Si **NON** → contenu citable

**Action** : produire un score de "citabilité" sur l'échantillon (0-10) + extrapolation au catalogue total.

### Sources de données propriétaires possibles
- [ ] **Statistiques internes anonymisées** :
  - Nombre d'appels traités par pays
  - Temps moyen de réponse
  - Top 10 problèmes par pays
  - Évolution mensuelle/annuelle
- [ ] **Baromètre annuel de l'expatriation** :
  - Sondage 1000+ expatriés
  - Publié chaque année (fraîcheur)
  - Téléchargeable en PDF + page web
  - Citée par presse → backlinks
- [ ] **Index propriétaires** :
  - Coût juridique moyen par pays
  - Délai d'obtention de visa par pays
  - Comparatif assurance santé expat
- [ ] **Datasets téléchargeables** (CSV, JSON) avec licence claire (CC-BY 4.0 par ex.)
- [ ] **Calculateurs interactifs** :
  - Coût de vie expat par pays
  - Impôts expat selon convention fiscale
  - Conversion devise + frais bancaires
- [ ] **Témoignages exclusifs** (pas repris d'ailleurs) avec consentement explicite
- [ ] **Glossaire métier** (terminologie juridique d'expat) avec definition `<dl>` + schema `DefinedTerm`

**À auditer** :
- [ ] Page `/statistiques` ou `/insights` publique ?
- [ ] Chiffres dans articles sourcés (interne ou externe) ?
- [ ] `AudienceContextService` injecte-t-il données spécifiques par pays ?
- [ ] Pipeline content engine produit-elle du **différenciant** ou de la reformulation ?

---

## PHASE 9 — Multi-langue & multi-pays

**Checklist** :
- [ ] hreflang correct (déjà audité 2026-04-16, vérifier conformité actuelle)
- [ ] `<html lang="...">` correspond à la langue
- [ ] `inLanguage` JSON-LD = langue de la page
- [ ] Pas de mélange de langues dans une page (sauf citations)
- [ ] **Localisation réelle** (devises, banques, lois) pas juste traduction
- [ ] Slugs ASCII (déjà en place)
- [ ] URLs canoniques par langue (pas de `?lang=`)
- [ ] x-default défini
- [ ] Sitemaps par langue ou hreflang dans sitemap

**Test 9 langues** :
```bash
for lang in fr en es de it pt nl ar zh; do
  curl -s "https://sosexpat.com/$lang/" | grep -E "<html lang|hreflang" | head -5
  echo "---"
done
```

---

## PHASE 10 — Pages prestataires (avocats + expatriés aidants)

**Probablement le plus gros gap actuel selon mon hypothèse.**

**Pour qu'un LLM puisse répondre "Qui est l'avocat X spécialisé en Y au pays Z ?" avec citation, chaque fiche doit contenir** :

### Contenu visible
- [ ] URL canonique stable (slug = nom + ville/pays + spécialité)
- [ ] `<title>` : "Nom — Spécialité — Ville | SOS-Expat"
- [ ] `<meta description>` : 150-160 chars avec specialty + langue + pays
- [ ] H1 = nom + rôle
- [ ] **Bio en 200+ mots** (pas 2 lignes)
- [ ] Spécialités listées (`<ul>`)
- [ ] Langues parlées (`<ul>`)
- [ ] Tarifs transparents (`<dl>` ou `<table>`)
- [ ] Disponibilités structurées (jours/horaires)
- [ ] Photo professionnelle + alt descriptif
- [ ] Avis clients (avec dates, prénoms, pays)
- [ ] CTA appel/booking
- [ ] **Pays d'intervention** clairement listés
- [ ] **Barreau / association professionnelle** vérifiable

### JSON-LD complet
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://sosexpat.com/avocat/[slug]#person",
  "name": "Maître Jean Dupont",
  "givenName": "Jean",
  "familyName": "Dupont",
  "honorificPrefix": "Maître",
  "jobTitle": "Avocat",
  "image": "https://...",
  "url": "https://sosexpat.com/avocat/[slug]",
  "description": "Avocat francophone spécialisé en droit pénal international, basé à Casablanca depuis 2010.",
  "worksFor": {
    "@type": "Organization",
    "name": "SOS-Expat",
    "url": "https://sosexpat.com"
  },
  "knowsLanguage": ["fr", "en", "ar"],
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Casablanca",
    "addressCountry": "MA"
  },
  "hasCredential": [
    {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "license",
      "name": "Inscription au Barreau de Casablanca",
      "recognizedBy": {
        "@type": "Organization",
        "name": "Ordre des Avocats de Casablanca"
      }
    }
  ],
  "memberOf": {
    "@type": "Organization",
    "name": "Barreau de Casablanca"
  },
  "sameAs": [
    "https://www.linkedin.com/in/jeandupont",
    "https://avocats.fr/jean-dupont"
  ],
  "knowsAbout": ["Droit pénal international", "Extradition", "Garde à vue à l'étranger"],
  "yearsOfExperience": 14
}
```

Imbriqué : `Service` schema pour chaque prestation, `AggregateRating` si avis disponibles, `Review` pour témoignages individuels.

**À auditer** :
- [ ] Lire `sos/src/pages/[provider-page].tsx` pour structure actuelle
- [ ] Combien de fiches ont JSON-LD complet vs vide ? (quantifier)
- [ ] Fiches SSR par le Worker ?
- [ ] Avis Trustpilot intégrés par fiche ?
- [ ] Bio moyenne en mots ?

---

## PHASE 11 — Tests réels sur les moteurs IA

**Ne pas se contenter de l'audit technique — vérifier ce que voient les utilisateurs.**

**Méthode** :
1. **Lister 50 queries cibles** par persona :
   - Expat débutant ("comment trouver avocat français Maroc")
   - Expat confirmé ("convention fiscale France-Thaïlande")
   - Futur expat ("démarches expat Bali")
   - Urgence ("perdu papiers Vietnam que faire")
2. **Tester chaque query** sur :
   - Google (mode classique)
   - Google AI Overviews (compte test US/EU)
   - ChatGPT (mode Search)
   - Perplexity (normal + Pro)
   - Claude (avec tool browsing)
   - Gemini
   - Bing Copilot
   - DuckDuckGo Chat
   - Apple Intelligence (si accessible)
3. **Pour chaque résultat** :
   - SOS-Expat est-il cité ?
   - À quelle position ?
   - Avec quelle URL exacte ?
   - Le contenu cité est-il à jour ET exact ?
   - Concurrents cités ? (lesquels)
4. **Capturer screenshots** pour preuves

**Livrable** : tableau Google Sheet ou markdown avec :
| Query | Moteur | SOS cité ? | Position | URL citée | Concurrents | Screenshot |

**Métriques agrégées à calculer** :
- **AI Citation Rate** : % de queries où SOS-Expat est cité, par moteur
- **AI Position Avg** : position moyenne de citation
- **AI Coverage** : nombre d'URLs uniques de SOS-Expat citées
- **Concurrent Map** : top 10 concurrents cités systématiquement

---

## PHASE 12 — Détection patterns IA générés (anti-pénalisation)

**Avec ~430k articles auto-générés, risque de filigrane stylistique IA → Helpful Content Update.**

**Patterns rouges à chercher** :
- [ ] Phrases types : "il est important de noter que", "en conclusion", "en somme", "il convient de souligner", "n'oublions pas que" — fréquence anormale
- [ ] Structure répétitive : intro générique + 3 H2 identiques + conclusion sur tous les articles
- [ ] Manque de spécificité : chiffres ronds, pas de dates précises, pas de noms propres
- [ ] Absence de "voix" éditoriale (tous les articles se ressemblent)
- [ ] Liens internes pauvres ou répétitifs
- [ ] Métadonnées identiques sur articles différents
- [ ] FAQ génériques (mêmes questions partout)
- [ ] **Hallucinations factuelles** : noms de lois, dates, prix inventés
- [ ] **Phrases mortes** : "dans le monde d'aujourd'hui", "à l'ère du numérique"

**Méthode quantitative** :
```bash
# Échantillonner 100 articles, extraire intros
for slug in $(shuf -n 100 tmp/blog-slugs.txt); do
  curl -s "https://sosexpat.com/blog/$slug" \
    | sed -n 's/.*<p>\(.*\)<\/p>.*/\1/p' \
    | head -1
done > tmp/intros-sample.txt

# Diversité : combien d'intros distinctes ?
sort tmp/intros-sample.txt | uniq -c | sort -rn | head -20

# N-grammes communs
cat tmp/intros-sample.txt | tr ' ' '\n' | sort | uniq -c | sort -rn | head -50
```

**Livrable** :
- Score "détectabilité-IA" sur échantillon
- Recommandations pour humaniser
- Liste articles à supprimer/réécrire

---

## PHASE 13 — Pipeline content engine — diagnostic AEO

**Auditer `mission-control_sos-expat/`** :
- [ ] `KnowledgeBaseService.php` injecte-t-il données propriétaires ?
- [ ] Templates Blade landings : structure HTML AEO-conforme ?
- [ ] Pipeline blog : produit-elle JSON-LD complet par article ?
- [ ] `AudienceContextService` : suffisamment localisé ?
- [ ] Étape "scoring qualité" : critères AEO inclus ?
- [ ] Système prompt LLM : instructions structure questions/réponses ?
- [ ] Insertion auteur : Person + bio + credentials générés ?
- [ ] FAQ extractor : intégré en `FAQPage` schema ?
- [ ] Images : alt text généré par IA ou vide ?
- [ ] **Détection doublons** : pipeline détecte-t-elle articles trop similaires ?

**Recommandations attendues** :
- Lister correctifs pipeline (vs correctifs article par article)
- Décider : régénérer le catalogue, le filtrer, ou le garder ?

---

## PHASE 14 — Performance & UX (signaux indirects AEO)

**Checklist** :
- [ ] Core Web Vitals : LCP < 2.5s, INP < 200ms, CLS < 0.1
- [ ] Mobile-first : layout responsive, touch targets > 48px
- [ ] WCAG 2.1 AA (alt, contrast, ARIA, keyboard nav)
- [ ] Pas de pop-ups intrusifs
- [ ] HTTPS + HSTS + CSP
- [ ] Compression Brotli + cache Cloudflare optimal
- [ ] `loading="lazy"` images
- [ ] WebP/AVIF
- [ ] Pas de layout shift
- [ ] Pas de JavaScript bloquant le render
- [ ] **First Meaningful Paint < 1s** (les bots IA timeout vite)

**Outils** : PageSpeed Insights, WebPageTest, Lighthouse CI

```bash
for url in $(cat tmp/sample-urls.txt); do
  curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=$url&strategy=mobile&key=$PSI_KEY" \
    | jq '{url: .id, perf: .lighthouseResult.categories.performance.score}'
done
```

---

## PHASE 15 — 🆕 Audit programmatique LP & stratégie de consolidation par vagues

**LE chantier le plus impactant. Réfère à la mantra : "Produire moins, produire mieux, désindexer par vagues monitorées."**

**Hypothèse confirmée par baseline** :
- 14 592 URLs "détectées non indexées" → Google a déjà décidé de les ignorer
- 33 clics / 90j sur 2 601 indexées → contenu massivement dévalué
- ~430 000 LPs programmatiques templatées → exactement ce que Helpful Content Update + LLMs dévaluent

### 15.1 Score composite par URL (formule)

Pour chaque URL du parc, collecter via GSC + GA4 + Ahrefs/Semrush + crawl interne :
- `impressions_gsc_90j`
- `clics_gsc_90j`
- `position_moy_gsc` (queries utiles)
- `backlinks_externes` (Ahrefs/Semrush)
- `liens_internes_entrants`
- `conversion_appel` (GA4 → Firestore events)
- `fraicheur_jours` (depuis dateModified)
- `longueur_unique_mots` (hors boilerplate)
- `originalite_pct` (hors duplication cross-locale via shingles)

**Score composite (0-100) par URL** :

```
Score = (impressions × 3)
      + (clics × 10)
      + (backlinks × 5)
      + (liens_internes × 1)
      + (conversion × 20)
      + (fraicheur_normalisée × 2)
      + (longueur_normalisée × 1)
      + (originalité × 2)
```

### 15.2 Décision par segment de score

| Score | % estimé du parc | Décision | Action technique |
|---|---|---|---|
| **≥ 50** | 1-3 % | **Garder + muscler** | Auteur, data propriétaire, 1500-3000 mots, vidéo, JSON-LD dense |
| **20-49** | 5-10 % | **Garder basique** | Fix title, ajout auteur, dateModified à jour |
| **5-19** | 20-30 % | **Fusionner** ou **désindexer** | Si page hub pertinente : 301 + consolidation. Sinon `noindex, follow` + retrait sitemap |
| **0-4** | 60-70 % | **Désindexer** | Étape 1 : `noindex, follow` + retrait sitemap. Étape 2 (après 6 mois) : 410 Gone |

### 15.3 Phasage de transition (CRITIQUE — par vagues, pas brutal)

**Phase A (mois 1-3) — Observer + Arrêter**
- **Zéro désindexation**. On observe d'abord.
- **Arrêter immédiatement** tous pipelines de génération programmatique de nouvelles LP
- Calculer le score composite sur l'intégralité du parc
- Établir baseline : trafic, impressions, conversions

**Phase B (mois 4-6) — Muscler le top 5%**
- Enrichir les ~5 000 pages top score (≥ 50)
- Publier le premier asset premium (Baromètre annuel — cf. fichier stratégie)
- **Toujours pas de désindexation**

**Phase C (mois 7-12) — Désindexation par vagues monitorées**
- **Vague 1** : 10 % du segment score 0-4 (les pires, aucun trafic depuis 180 j)
- **Attendre 4 semaines**, monitorer GSC + trafic organique total + impressions brand + impressions business
- **🚨 CRITÈRE D'ARRÊT** : si trafic baisse > 10 % vs baseline → **PAUSE + investigation**
- **Vague 2** : 20 % supplémentaire, même monitoring
- Continuer par vagues de 20 % jusqu'à avoir nettoyé 60-70 % du parc
- Conserver ~5-10 k URLs au total (score ≥ 20)

**Phase D (mois 13-18) — Finalisation**
- Vagues finales (410 Gone sur pages désindexées il y a > 6 mois et jamais réutilisées)
- 1 asset premium tous les 2 mois en rythme de croisière

### 15.4 Technique des désindexations (par cas)

| Cas | Action HTTP + meta |
|---|---|
| Page sans valeur, aucun backlink, aucun trafic | Étape 1 : `noindex, follow` + retrait sitemap. Étape 2 (6 mois) : 410 Gone |
| Page avec backlinks externes mais faible valeur | **301** vers page équivalente ou hub (préserve l'équité de lien) |
| Page avec trafic faible mais non-nul | Fusionner contenu avec page sœur plus forte, puis 301 |
| Page avec erreur technique (404 actuelle) | 410 Gone direct si jamais eu de valeur |
| Page doublon cross-locale | Garder 1 canonical, autres pointent vers elle en `<link rel="canonical">` |

**Tout changement** doit passer par staging + test URL Inspection GSC avant déploiement massif.

### 15.5 Monitoring de la transition

Dashboard avec, sur chaque vague :
- Pages désindexées (volume, % du parc)
- Impressions totales GSC (ne doit **PAS** baisser sur queries business)
- Clics totaux GSC
- Position moyenne sur queries brand + top business
- 404 / 5xx ratio (doit rester stable)
- Temps réponse moyen Googlebot
- Pages indexées (doit baisser puis stabiliser — normal)

**Objectif paradoxal** : le trafic organique doit **monter** pendant la transition (libération crawl budget + concentration autorité + réduction duplication perçue).

### Livrables Phase 15
- Tableau de décision : URL | Score | Décision (kill/merge/enrich/keep) | Effort | Vague
- Plan de redirections 301 (consolidation) + 410 (suppression différée)
- Plan de mise à jour sitemap par vague
- Dashboard de monitoring avec critères go/no-go par vague

**🚨 ATTENTION** : action IRRÉVERSIBLE en partie (410). Décisions à valider avec utilisateur avant exécution. Comité go/no-go entre chaque vague.

---

## PHASE 16 — 🆕 Brand SERP & entity building

**But** : devenir une **entité reconnue** par Google Knowledge Graph + Wikidata.

### Brand SERP (cherchez "SOS-Expat" sur Google)
- [ ] **Knowledge Panel** présent ? (encart à droite avec logo, description, sites sociaux)
- [ ] **Sitelinks** affichés (6 liens directs vers sections du site) ?
- [ ] **Page "SOS-Expat"** sur Wikipedia (FR, EN minimum) ?
- [ ] **Page Wikidata** (Q-identifier) ?
- [ ] **Profil Crunchbase** ?
- [ ] **Profil LinkedIn entreprise** complet ?
- [ ] **Profil Google Business** vérifié ?
- [ ] **Avis Trustpilot** affichés sur SERP avec étoiles ?

### Entity building program
- [ ] **Wikidata** : créer entrée Q-identifier avec :
  - `instance of` : online service
  - `country` : France (siège)
  - `inception` : date création
  - `official website`, social profiles
  - `described at URL` : pages clés
- [ ] **Wikipedia** : article si éligibilité notabilité (presse + sources tierces requises)
- [ ] **Google Business Profile** : entreprise vérifiée
- [ ] **Crunchbase** : profil société
- [ ] **DBpedia** : suit Wikipedia
- [ ] **Annuaires d'autorité** : Zenefits, Owler, etc.
- [ ] **Schema `Organization` enrichi** sur home avec `sameAs` complet pointant vers TOUTES ces entités

### Mention veille
- [ ] Setup Google Alerts sur "SOS-Expat", "SOSExpat", "sos expat"
- [ ] Setup Mention/Brand24 pour mentions sur forums, Reddit, Quora
- [ ] **Réponses sur Reddit/Quora** : seed authentique (pas spam) — les LLMs valorisent UGC

**Test** :
```bash
# Knowledge Graph API (si clé dispo)
curl "https://kgsearch.googleapis.com/v1/entities:search?query=SOS-Expat&key=$KG_KEY&limit=1"

# Wikidata
curl "https://www.wikidata.org/w/api.php?action=wbsearchentities&search=SOS-Expat&language=fr&format=json"
```

---

## PHASE 17 — 🆕 Multimédia, Vidéo, Voice search, Speakable schema

**Les LLMs valorisent le multimédia (transcripts indexables) ET les assistants vocaux montent.**

### Vidéo (YouTube + page)
- [ ] Page entreprise YouTube vérifiée ?
- [ ] **Vidéos cas concrets** : "Avocat explique : que faire si arrestation à l'étranger"
- [ ] Vidéos courtes intégrées dans articles blog (top trafic)
- [ ] **Schema `VideoObject`** sur pages avec vidéo :
  ```json
  {
    "@type": "VideoObject",
    "name": "...",
    "description": "...",
    "thumbnailUrl": "...",
    "uploadDate": "2026-...",
    "duration": "PT3M15S",
    "contentUrl": "https://www.youtube.com/watch?v=...",
    "embedUrl": "https://www.youtube.com/embed/...",
    "transcript": "..."
  }
  ```
- [ ] **Transcripts** publiés en HTML sous chaque vidéo
- [ ] Sous-titres SRT/VTT téléchargeables
- [ ] YouTube Shorts pour visibilité Reels/TikTok
- [ ] Vidéos chapitrées (timestamps dans description)

### Audio / Podcast
- [ ] Podcast SOS-Expat (interviews avocats / témoignages expats) ?
- [ ] **Schema `PodcastEpisode`** + RSS feed
- [ ] Distribué sur Spotify, Apple Podcasts, Google Podcasts
- [ ] Transcripts publiés

### Voice search & Speakable schema
- [ ] **Schema `speakable`** sur pages avec FAQ courtes :
  ```json
  {
    "@type": "WebPage",
    "speakable": {
      "@type": "SpeakableSpecification",
      "cssSelector": [".tldr", ".faq-answer"]
    }
  }
  ```
- [ ] Réponses courtes (< 30 secondes lues à voix haute) testables sur Google Assistant
- [ ] FAQ optimisée pour requêtes vocales ("Comment...", "Quel est...")

### Images optimisées AI
- [ ] Alt text descriptif (LLMs multimodaux les utilisent)
- [ ] Schema `ImageObject` sur images clés
- [ ] Images originales (pas stock photos génériques)
- [ ] Infographies citables

---

## PHASE 18 — 🆕 Monitoring AI citation rate (mesurer pour piloter)

**Sans mesure = pas d'amélioration mesurable. Setup tracking IA.**

### Outils à mettre en place
- [ ] **Otterly.ai** ou **Profound** ou **Peec.ai** : suivi citations IA dans ChatGPT/Perplexity/Gemini
- [ ] **Search Console** : surveiller "AI features" dans le rapport Performance (quand Google le débloque)
- [ ] **Bing Webmaster Tools** : surveiller Copilot citations
- [ ] **Logs Cloudflare** : tracker requêtes par User-Agent IA (croissance ?)
- [ ] **Mention/Brand24** : tracker mentions de marque sur le web

### KPIs à suivre mensuellement
- [ ] **AI Citation Rate** (par moteur) sur 50 queries cibles
- [ ] **AI Traffic Share** (% trafic venant de moteurs IA)
- [ ] **Bot crawl rate** par bot IA (depuis logs)
- [ ] **Brand mention volume** sur le web
- [ ] **Knowledge Panel completeness** (% champs renseignés)

### Dashboard à créer
- [ ] Onglet "AI Visibility" dans le dashboard interne
- [ ] Données mises à jour mensuellement
- [ ] Alertes sur baisse de citation

### Tests automatisés
- [ ] Script de test mensuel sur 50 queries cibles via API (OpenAI/Perplexity/Anthropic)
- [ ] Logs des résultats en BDD
- [ ] Graphes d'évolution

---

## PHASE 19 — 🆕 Analyse concurrentielle GEO

**But** : avant de définir quoi produire, savoir **qui est cité ACTUELLEMENT** par les IA sur tes requêtes cibles. Décoder pourquoi pour pouvoir déclasser.

### 19.1 Benchmark sur 30 requêtes business

Pour chacune des 30 requêtes cibles (Phase 11), noter qui est cité par ChatGPT, Perplexity, Claude, Gemini, Google AIO :

| Requête | Source #1 cité | Source #2 | Source #3 | Pourquoi ces sources ? (gov/presse/forum/concurrent/Wikipedia) |
|---|---|---|---|---|
| `avocat francophone Thaïlande urgence` | ? | ? | ? | ? |
| `aide juridique expatrié France` | ? | ? | ? | ? |
| `que faire si arrestation à l'étranger` | ? | ? | ? | ? |
| `appel avocat français urgent international` | ? | ? | ? | ? |
| ... (30 lignes) | | | | |

### 19.2 Décoder les patterns

Les sources citées sont-elles majoritairement :
- [ ] **Sites gouvernementaux / officiels** (ambassade, consulat, gouv.fr, France Diplomatie) ?
- [ ] **Sites de presse** (Le Monde, Figaro, Le Point, Le Petit Journal, French Morning, French Radar, Expatis, Pink Guide) ?
- [ ] **Forums / communautés** (Expat.com, Reddit r/expatFR, Le Forum de Bangkok, Quora) ?
- [ ] **Concurrents directs** (JustAnswer, Avocat.fr, Village de la Justice, autre) ?
- [ ] **Wikipedia** ?
- [ ] **Blogs spécialisés** (expat-assurance, le-blog-du-canard-expat, autres) ?
- [ ] **Sites partenaires** (assurances expat, banques expat) ?

### 19.3 Identifier les formats gagnants

Pour les 5 sources citées le plus souvent, analyser ce qui les fait citer :
- Articles longs avec table des matières (TOC) ?
- Études de cas concrètes ?
- Témoignages horodatés ?
- Données chiffrées (statistiques, prix) ?
- Vidéos YouTube ?
- PDF officiels téléchargeables ?
- Auteur expert nommé ?
- Date de publication récente (< 12 mois) ?
- Schema.org riche (Article, FAQPage, HowTo) ?
- Backlinks d'autorité ?

### 19.4 Identifier le gap SOS-Expat

Pour chaque requête, lister :
- **Ce que SOS-Expat a et que les concurrents n'ont pas** (avocats vérifiés, appel <5min, 197 pays, data first-party)
- **Ce qui manque** pour être cité (auteur expert ? data publiée ? schema ? autorité de domaine ? ancienneté ?)
- **Effort estimé** pour déclasser la source actuelle (S/M/L/XL)

### 19.5 Plan d'attaque par cluster de requêtes

Grouper les 30 requêtes en 5-7 clusters thématiques. Pour chaque cluster :
- **Angle gagnant** (ex: pour cluster "urgence à l'étranger" → guide expert + témoignages cas réels + vidéo avocat + statistiques internes anonymisées)
- **Format prioritaire** (article long + vidéo + page hub avec données ?)
- **Auteur(s)** désigné(s) du réseau
- **Délai** (T1/T2/T3)
- **KPI** : entrer dans top 3 sources citées sur les requêtes du cluster en 6 mois

### Livrable Phase 19
- Fichier `AUDIT-AEO-COMPETITIVE-GEO.md` avec :
  - Tableau benchmark 30 requêtes × 5 IA = 150 cellules
  - Top 10 concurrents identifiés avec analyse de pourquoi cités
  - Top 5 formats gagnants identifiés
  - Plan d'attaque par cluster (5-7 clusters)
  - Estimation budget contenu pour combler le gap

---

# 📋 PARTIE B — PIVOT STRATÉGIQUE 18 MOIS (résumé — détails dans fichier dédié)

> **⚠️ NE PAS DUPLIQUER** : la stratégie complète 18 mois (chantiers détaillés, gouvernance, change management, RGPD, métriques chiffrées par horizon, outils + budget) est dans :
>
> 📄 **`PROMPT-STRATEGIE-GEO-AEO-IA-18-MOIS.md`**
>
> Cette Partie B est un **récap** pour cohérence d'ensemble — l'auditeur doit produire son rapport en **renvoyant explicitement** vers ce fichier stratégie pour la suite opérationnelle.

## Vision 18 mois (extrait fichier stratégie)

> "Quand un utilisateur demande à n'importe quelle IA conversationnelle 'comment joindre un avocat français à l'étranger en urgence', SOS-Expat doit être **cité dans les 3 premières sources** dans 80%+ des cas."

## Les 10 chantiers GEO/AEO (résumés — détails dans fichier stratégie)

| # | Chantier | Trimestre démarrage | Effort |
|---|----------|---------------------|--------|
| 1 | Audit crawlers IA | T1 (mois 1) | S |
| 2 | Refonte llms.txt | T1 (mois 1) | S |
| 3 | Baseline citation IA (30 requêtes × 5 moteurs) | T1 (mois 1) | M |
| 4 | First-party data publiable (baromètre, indice, observatoire) | T2 (mois 4) | L-XL |
| 5 | Expert-authored content (auteurs nommés + reviewers juridiques) | T2 (mois 4) | L |
| 6 | Vidéo + podcast + speakable schema | T2 (mois 4) | L |
| 7 | Entité reconnue (Wikidata, Wikipedia, Knowledge Graph, Crunchbase) | T1 (mois 2) | M |
| 8 | Structured data dense et cohérente | T1-T2 (3 vagues) | M-L |
| 9 | Pivot contenu : 430k → 5-10k pages profondes | T3 (mois 7-12) | XL |
| 10 | Mesure et itération (dashboard, KPIs mensuels) | T1 → continu | M |
| 11 | Stratégie transition parc existant (par vagues monitorées) | T1 → T6 | XL |
| 12 | Pièges à éviter (15 anti-patterns — cf. Annexe ce fichier) | Continu | — |
| 13 | Analyse concurrentielle GEO | T1 (mois 1-2) | M |

**Pour les détails complets (livrables, dépendances, budget, gouvernance, RGPD, métriques chiffrées T1/T3/T6, change management) → consulter `PROMPT-STRATEGIE-GEO-AEO-IA-18-MOIS.md`.**

---

# 📊 LIVRABLES ATTENDUS DE L'AUDIT

À la fin de l'audit, produire **8 fichiers** :

### 1. `AUDIT-AEO-SCORECARD.md`
Tableau de score par dimension (19 phases) :
| Dimension | Score /10 | Constat | Volume affecté | Priorité |
|-----------|-----------|---------|----------------|----------|
| Crawlabilité bots IA | X/10 | ... | ... | P0/P1/P2 |
| ... | ... | ... | ... | ... |
| **TOTAL** | **X/190** | | | |

### 2. `AUDIT-AEO-FIXES-P0.md`
Correctifs critiques (semaine 1-2) :
- Description problème
- `fichier:ligne`
- Solution recommandée
- Effort (XS/S/M/L/XL)
- Impact (1-5)
- Dépendances

### 3. `AUDIT-AEO-FIXES-P1.md`
Correctifs importants (sprint suivant)

### 4. `AUDIT-AEO-FIXES-P2.md`
Correctifs nice-to-have (backlog)

### 5. `AUDIT-AEO-LP-REDUCTION-PLAN.md`
Plan de réduction des LPs (Phase 15) :
- Inventaire complet
- Décision par URL ou par cluster
- Plan de redirections
- Calendrier d'exécution

### 6. `AUDIT-AEO-AI-CITATION-BASELINE.md`
Baseline mesurée (Phase 11) :
- 50 queries testées sur 8 moteurs IA
- AI Citation Rate par moteur
- Concurrents identifiés
- Screenshots de preuve

### 7. `AUDIT-AEO-PIVOT-18M-ROADMAP.md`
Roadmap stratégique 18 mois (Partie B) avec :
- Chantiers détaillés
- Ressources nécessaires (humaines, budget)
- KPIs cibles
- Risques

### 8. `AUDIT-AEO-EXEC-SUMMARY.md`
Synthèse 2 pages pour décideur :
- État actuel (forces, faiblesses)
- Risque si statu quo
- Plan recommandé en 3 horizons (J0-J30, J30-J90, J90-J18M)
- Budget estimé
- Décisions à valider

---

# 🎬 INSTRUCTIONS POUR L'AUDITEUR (toi, Claude)

**Avant de commencer** :
1. Lire ce prompt en entier (les 19 phases + Partie B + Annexes A/B/C)
2. Lire `MEMORY.md` pour contexte projet
3. Lire les audits récents pour ne pas dupliquer :
   - `PROMPT-AUDIT-SEO-INDEXATION-COMPLET.md`
   - `PROMPT-AUDIT-SITEMAPS-COMPLET.md`
   - `PROMPT-AUDIT-URL-SLUG-HREFLANG-ROUTES.md`
   - `PROMPT-AUDIT-FINAL-E2E.md`
   - `PROMPT-AUDIT-CONTENT-PIPELINE-E2E.md`
4. Demander à l'utilisateur :
   - URL de production confirmée
   - Échantillon de 30 URLs représentatives (5 prestataires, 5 listes, 5 landings, 10 blog, 5 légales)
   - Décision business : autoriser/bloquer bots IA training (GPTBot, ClaudeBot)
   - Accès Search Console (export 14k URLs non indexées notamment)
   - Accès logs Cloudflare (analytics par bot)
   - Budget approximatif disponible pour le pivot 18 mois (chantier 2 et 4 demandent ressources)

**Méthodologie d'exécution** :
- Avancer phase par phase, dans l'ordre
- Pour chaque phase, **explorer le code AVANT de conclure** — ne pas supposer
- Utiliser `Agent` (Explore subagent) pour parallélliser les audits indépendants (ex: schema prestataires VS schema blog)
- Tester en conditions réelles avec `curl` + User-Agents IA
- Référencer systématiquement `fichier:ligne`
- **Quantifier** systématiquement (X% des Y pages affectées) avec baseline chiffrée actuelle (33 clics, 2601 indexées, etc.)
- **Reviewer hostile** : pour chaque P0, défendre face à CMO sceptique
- **Mantra** : "Produire moins, produire mieux, désindexer par vagues monitorées"

**Format de rapport intermédiaire (par phase)** :
```
## Phase N — [Nom]
**Score** : X/10
**Volume affecté** : N pages / N total (X%)
**Constats clés** :
- ...
**Correctifs recommandés** :
- P0 : [fichier:ligne] ...
- P1 : ...
**Effort total estimé** : X jours-homme
```

**Communication** :
- Français
- Concret > théorique
- Toujours commandes/scripts pour les corrections
- Ne jamais inventer URL, schema, ou route — vérifier dans le code

---

# ⚠️ POINTS D'ATTENTION SPÉCIFIQUES

1. **Ne pas casser l'existant** : tout correctif sans introduire de régression SEO classique (qui reste majoritaire en trafic).
2. **Mesurer avant d'agir** : avant de bloquer/autoriser un bot, mesurer le trafic actuel depuis lui (logs Cloudflare).
3. **Décisions business explicites** : autoriser GPTBot pour training = nourrir gratuitement OpenAI. C'est business, pas technique.
4. **RGPD** : avis clients dans schema `Review` doivent avoir consentement (vérifier process Trustpilot).
5. **Cohérence JSON-LD vs HTML visible** : Google pénalise schémas non reflétés en visible (cloaking).
6. **Pas de spam de schemas** : ajouter 10 types de schema sur une page bruite. Ajouter UNIQUEMENT ce qui correspond.
7. **Pipeline content** : si bug dans pipeline, fixer pipeline + régénérer, pas patcher article par article.
8. **Volume** : avec 430k articles, prioriser les pages à fort trafic (top 1000 sessions/mois) pour les fixes manuels.
9. **Phase 15 = irréversible en partie** (suppression 410). VALIDER avec utilisateur avant exécution.
10. **Pivot 18 mois = engagement business** : nécessite validation direction/budget. L'audit propose, la direction dispose.

---

# 🚫 ANNEXE A — 15 PIÈGES À ÉVITER (anti-patterns critiques)

À relire avant chaque recommandation. Tout fix qui contredit cette liste = à reconsidérer.

1. **Ne pas désindexer 400 k pages en une nuit** — Monitoring par vagues obligatoire (cf. Phase 15.3). Critère d'arrêt -10% trafic.
2. **Ne pas générer du contenu IA sans revue humaine** — Google et LLMs détectent le "AI slop" et pénalisent.
3. **Ne pas créer de faux auteurs** (persona IA avec photo générée). Risque légal + détectable par reverse image search + détruit l'E-E-A-T dès démasqué.
4. **Ne pas acheter des backlinks** — Penguin, détection systématique, pénalité long terme.
5. **Ne pas spammer Reddit/Quora/HackerNews** avec liens vers soi. Bannissement, réputation détruite.
6. **Ne pas traduire automatiquement les assets premium** en 9 langues. LLM voit la duplication. Choisir 2-3 langues de qualité > 9 médiocres.
7. **Ne pas bourrer le JSON-LD** de données incohérentes avec le contenu visible. Google pénalise la sur-optimisation structured data (cloaking).
8. **Ne pas mettre `noindex` partout par prudence**. Chaque noindex doit avoir une raison documentée.
9. **Ne pas bloquer les crawlers IA par défaut**. Bloquer GPTBot/ClaudeBot/PerplexityBot = invisible dans l'IA de demain. Sauf cas particuliers (PI sensible).
10. **Ne pas créer des assets premium sans plan de distribution**. Un baromètre non relayé presse = investissement brûlé.
11. **Ne pas empiler les outils SaaS SEO** avant baseline. Otterly + Peec + Semrush + Ahrefs + SE Ranking = 1500€/mois. Choisir 1-2 d'abord.
12. **Ne pas oublier Bing**. Bing alimente ChatGPT Search + Copilot. Invisible sur Bing = invisible dans ces IA.
13. **Ne pas promettre de résultats à 30 jours à la direction**. Le GEO prend 3-9 mois pour des effets mesurables.
14. **Ne pas ignorer les hallucinations LLM** sur la marque. Si ChatGPT dit "SOS-Expat est gratuit" → action (cf. fichier stratégie §4.bis.2).
15. **Ne pas violer le RGPD** en publiant first-party data sans anonymisation rigoureuse (cf. fichier stratégie §4.bis.1, Article 89 RGPD).

---

# 🛠️ ANNEXE B — Outils recommandés (avec coûts indicatifs)

| Besoin | Outil | Coût indicatif |
|---|---|---|
| Tracking citation IA (ChatGPT, Perplexity, Gemini) | Otterly.ai, Peec.ai, AthenaHQ, Semrush AI Toolkit | 50-200 €/mois |
| AIO tracking | Semrush Position Tracking (AI Overview) ou SE Ranking | inclus dans suite |
| Structured data validation + monitoring | Schema App, Schema Markup Generator | gratuit / 50€/mois |
| Backlinks + mentions | Ahrefs / Semrush | 200-400 €/mois |
| Wikidata / Wikipedia | Manuel + Wikidata Query Service | gratuit |
| GSC + Bing Webmaster + Yandex | Natifs | gratuit |
| Data publication (PDF, infographies) | Canva Pro / Figma | 10-50 €/mois |
| Podcast / Vidéo hosting | YouTube + Spotify | gratuit |
| Validation JSON-LD | https://validator.schema.org/ + Google Rich Results Test | gratuit |
| Test PageSpeed | PageSpeed Insights API + Lighthouse CI | gratuit |

**Budget outils total réaliste** : **200-600 €/mois**.

**Budget contenu** (équipe rédac + data + presse) : variable, **minimum 5-10 k€/mois** pour pivot ambitieux (cf. fichier stratégie).

---

# 🧪 ANNEXE C — Règles de travail de l'auditeur

1. **Ne refais pas l'audit SEO v4** — consomme ses sorties (`PROMPT-AUDIT-SEO-INDEXATION-COMPLET.md`)
2. **Ne refais pas la stratégie 18 mois** — pointe vers `PROMPT-STRATEGIE-GEO-AEO-IA-18-MOIS.md`
3. **Chiffre TOUT** — chaque recommandation doit avoir baseline + cible + temporalité
4. **Chaque fix a un propriétaire nommé** (équipe ou personne)
5. **Français, dense, sans jargon inutile**
6. **Priorise par ROI GEO** — l'action qui amène le plus de citations IA / presse / autorité par euro investi en premier
7. **Vérifie par échantillonnage** — ne pas affirmer "ChatGPT ne cite pas SOS-Expat" sans tester 10 requêtes
8. **🎯 REVIEWER HOSTILE** — pour CHAQUE P0, défendre le choix face à un CMO sceptique qui dit *"c'est du vent, montre-moi le ROI"*. Si tu ne sais pas répondre, ce n'est pas P0.
9. **Intègre la contrainte business** — SOS-Expat est un marketplace transactionnel, pas un média. Le contenu doit in fine amener à un appel payant.
10. **Mantra avant chaque décision** — "Produire moins, produire mieux, désindexer par vagues monitorées"

---

# 📚 RÉFÉRENCES

- **llms.txt standard** : https://llmstxt.org/
- **Schema.org** : https://schema.org/
- **Speakable schema** : https://schema.org/speakable
- **Google AI features in Search** : https://developers.google.com/search/docs/appearance/ai-features
- **Google E-E-A-T** : https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- **OpenAI GPTBot** : https://platform.openai.com/docs/gptbot
- **Anthropic ClaudeBot** : https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web
- **Perplexity Bot** : https://docs.perplexity.ai/guides/bots
- **Cloudflare AI bot blocking** : https://developers.cloudflare.com/bots/concepts/bot/
- **Wikidata** : https://www.wikidata.org/
- **Google Knowledge Graph API** : https://developers.google.com/knowledge-graph
- **Helpful Content Update doc** : https://developers.google.com/search/updates/helpful-content-update

---

# 🚀 LANCEMENT

Pour exécuter cet audit, dans une nouvelle conversation Claude (Opus 4.7+) avec accès au repo :

> "Lance l'audit AEO/GEO complet selon `PROMPT-AUDIT-AEO-AI-SEARCH-COMPLET.md`. Commence par les questions stratégiques (autoriser/bloquer bots IA, échantillon URLs, accès GSC). Puis exécute les 19 phases dans l'ordre. Pour la suite stratégique post-audit, oriente vers `PROMPT-STRATEGIE-GEO-AEO-IA-18-MOIS.md`. Produis les 8 livrables à la fin. Travail estimé : 10-18h selon profondeur."

---

**Fin du prompt v2 — bon audit + bon pivot.**
