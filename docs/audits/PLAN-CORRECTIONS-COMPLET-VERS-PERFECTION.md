# 🎯 PLAN DE CORRECTIONS COMPLET — VERS LA PERFECTION SEO/AEO/GEO
## SOS-Expat.com — Roadmap consolidée 2026-04-22

> **Source** : Consolidation des 3 audits/prompts existants
> 1. `PROMPT-AUDIT-SEO-INDEXATION-COMPLET.md` (audit SEO classique exécuté partiellement)
> 2. `PROMPT-AUDIT-AEO-AI-SEARCH-COMPLET.md` (audit AEO/GEO — non exécuté)
> 3. `PROMPT-STRATEGIE-GEO-AEO-IA-18-MOIS.md` (stratégie business — référence)
> 4. `AUDIT-SEO-v4-RAPPORT-FINAL-2026-04-22.md` (rapport produit aujourd'hui)
>
> **AVERTISSEMENT** : Cette roadmap mélange du concret (fixes techniques découverts par tests live) et du projeté (chantiers stratégiques non audités en détail). Les "Effort" sont des estimations à valider par l'équipe.

---

# 🚨 PARTIE 1 — URGENCES (cette semaine, ~3 j-h)

## 🔥 P0-1 : Fix home `/` qui redirige Googlebot vers `/en-us`

**Symptôme** : `curl -I -A "Googlebot" https://sos-expat.com/` → `HTTP 301 Location: /en-us`
**Impact** : "Français voit anglais" + brand SERP cassé. ~70% trafic potentiel perdu.
**Fix** :
- Soit servir `200` directement sur `/` avec hreflang complet (recommandé)
- Soit `301` selon `Accept-Language` (`fr*` → `/fr-fr`, `en*` → `/en-us`, fallback x-default)
**Fichiers** : `dynamicRender.ts` + `worker.js` (chercher la règle root)
**Effort** : S (4h) | **Impact** : ++++ | **Propriétaire** : équipe React/Worker
**Test** : `curl -I -A "Googlebot mobile" https://sos-expat.com/` doit retourner 200, pas 301

---

## 🔥 P0-2 : Réduire cache 1 AN sur 301 legacy LPs

**Symptôme** : `worker.js:1746` `Cache-Control: max-age=31536000` (1 an) sur tous les redirects legacy
**Impact** : Google met 1 an à découvrir les nouvelles URLs canoniques. Crawl budget gaspillé.
**Fix** : Remplacer `max-age=31536000` par `max-age=86400` (24h) tant qu'on n'a pas stabilisé l'arborescence
**Fichier** : `sos/cloudflare-worker/worker.js:1746`
**Effort** : S (1h) | **Impact** : ++++ | **Propriétaire** : Worker

---

## 🔥 P0-6 : Hreflang catastrophiques — 3/10 au lieu de 10/10 sur les 9 langues

**Symptôme** : `curl` sur les 9 homes (`/fr-fr`, `/en-us`, `/es-es`, `/de-de`, `/pt-pt`, `/ru-ru`, `/zh-cn`, `/ar-sa`, `/hi-in`) → seulement 3 hreflang (`en-US`, `es-ES`, `fr-FR`). MANQUENT : `de-DE`, `pt-PT`, `ru-RU`, `zh-Hans`, `ar-SA`, `hi-IN`, **x-default**.
**Impact** : 6 langues sur 9 invisibles à Google comme alternatives → cause majeure des 14 592 URLs détectées non indexées
**Fix** :
1. Reproduire en local (`npm run dev`) → vérifier DOM rendu sur `/de-de`
2. Si OK en local mais KO en prod : bug SSR Puppeteer (extraction avant Helmet) → augmenter wait dans `dynamicRender.ts` ou injecter hreflang server-side
3. Si KO en local : bug dans `getTranslatedRouteSlug` ou `localeToHreflang` qui fait échouer la map
**Fichiers** :
- `sos/src/multilingual-system/components/HrefLang/HreflangLinks.tsx` (composant)
- `sos/src/multilingual-system/components/HrefLang/HrefLangConstants.ts` (config)
- `sos/firebase/functions/src/seo/dynamicRender.ts` (timing SSR)
**Effort** : M (1j) | **Impact** : ++++ | **Propriétaire** : React + SSR
**Test post-fix** :
```bash
for loc in fr-fr en-us es-es de-de pt-pt ru-ru zh-cn ar-sa hi-in; do
  count=$(curl -s -A "Googlebot" "https://sos-expat.com/$loc" | grep -c 'hreflang=')
  [ "$count" -ge 10 ] && echo "$loc OK ($count)" || echo "$loc FAIL ($count)"
done
```

---

## 🔥 P0-4 : Fix faux 404 React (HelpArticle + FAQDetail)

**Symptôme** :
- `HelpArticle.tsx:327` : `if (notFound || !article)` → flag posé sur `article===null` même sans setNotFound
- `FAQDetail.tsx:80-92` : `setShow404(true)` après timer 10ms → fenêtre de 10ms où Puppeteer peut détecter
**Impact** : Faux 404 résiduels sur transitions React (couvert partiellement par fix P0-E timeout 35s)
**Fix** :
- `HelpArticle.tsx:327` : changer `notFound || !article` en `notFound` uniquement
- `FAQDetail.tsx:80-92` : retirer le timer 10ms, attendre résolution complète de `loadFAQ()`
**Effort** : M (1j) | **Impact** : +++ | **Propriétaire** : React

---

## 🔥 P0-1bis : Compléter Organization JSON-LD avec sameAs exhaustif

**Symptôme** : Position 9,54 sur sa propre marque = entité non reconnue par Knowledge Graph
**Fix** : Compléter `Organization` JSON-LD avec :
```json
"sameAs": [
  "https://www.linkedin.com/company/sos-expat",
  "https://twitter.com/sos_expat",
  "https://www.facebook.com/sosexpat",
  "https://www.instagram.com/sos.expat",
  "https://www.youtube.com/@sos-expat",
  "https://www.crunchbase.com/organization/sos-expat",
  "https://www.wikidata.org/wiki/Q[ID]"  // après création Wikidata
]
```
**Fichier** : `sos/src/components/layout/SEOHead.tsx` ou équivalent (chercher `Organization`)
**Effort** : S (4h) | **Impact** : +++ | **Propriétaire** : React

---

## 🔥 Hors-code 1 : Créer entrée Wikidata pour SOS-Expat

**Action** : Manuellement sur https://www.wikidata.org/
- Créer Q-identifier
- `instance of` : online platform
- `country` : France
- `inception` : date création
- `official website` : sos-expat.com
- `founder`, `social media`, `described at URL`
**Effort** : M (4h hors-code) | **Impact** : +++ | **Propriétaire** : SEO/Comms

## 🔥 Hors-code 2 : Compléter Google Business Profile

**Action** : https://www.google.com/business/ — vérifier + enrichir entreprise
**Effort** : S (2h hors-code) | **Impact** : +++ | **Propriétaire** : SEO

## 🔥 Hors-code 3 : Audit + Fix robots.txt cross-locale (P0-5)

**Symptôme** : Disallow `/chatter/`, `/influencer/`, `/blogger/`, `/group-admin/` peut bloquer routes publiques
**Fix** : Soit accepter (les vraies landings sont sur `/devenir-*`), soit affiner avec `Allow:` avant `Disallow:`
**Fichier** : `robots.txt`
**Effort** : S (30min) | **Impact** : ++ | **Propriétaire** : SEO

---

# ⚡ PARTIE 2 — SPRINT SUIVANT (2-4 semaines, ~10 j-h)

## P1 — Multi-langue (les 9 langues vraiment cohérentes)

| # | Action | Fichier | Effort | Impact |
|---|---|---|---|---|
| M1 | Vérifier hreflang sur 5 pages profondes × 9 langues = 45 tests | curl batch | S (4h) | +++ |
| M2 | Audit RTL sur `/ar-sa/...` : `dir="rtl"`, alignement, icônes flippées | tous composants RTL-sensibles | M (1j) | ++ |
| M3 | Standardiser `ch` → `zh-Hans` partout (URLs, hreflang, lang attr) | `HrefLangConstants.ts:18-19` | M (1j) | ++ |
| M4 | Désactiver génération combinaisons aberrantes (`zh-er`, `ch-cn`, `fr-st`, `de-cf`, `en-es`) dans pipeline | Mission Control Laravel | M (1j) | +++ |
| M5 | Confirmer pipeline URLs respecte ASCII slugs systématiquement | Pipeline génération + validator | L (3j) | +++ |
| M6 | Audit sitemaps par langue : hreflang inter-sitemap, freshness `<lastmod>`, taille < 50k URLs | `sos/firebase/functions/src/seo/sitemaps.ts` | M (1j) | +++ |
| M7 | Audit Bing Webmaster + Yandex Webmaster pour les 9 langues (Bing alimente ChatGPT/Copilot) | Setup + soumission sitemaps | M (1j) | ++ |
| M8 | Vérifier que `/{locale}/{path}` rendent du contenu **localisé natif**, pas traduit machine | Échantillon 50 pages × 9 langues | L (3j) | +++ |

## P1 — Technique (qualité indexation)

| # | Action | Fichier | Effort | Impact |
|---|---|---|---|---|
| T1 | Purger sitemaps des URLs LP legacy (sos-avocat, consulter-avocat, blog, country/) | `sos/firebase/functions/src/seo/sitemaps.ts` | M (1j) | +++ |
| T2 | Investigation 575 URLs « avec redirection » dans GSC (purge sitemap) | GSC export + audit | M (1j) | ++ |
| T3 | Investigation 360 URLs « exclue par noindex » (légitimes ou bug ?) | GSC export | S (4h) | ++ |
| T4 | Investigation 46 URLs 5xx (corriger ou supprimer) | GSC + Cloud Run logs | M (1j) | +++ |
| T5 | Investigation 208 URLs 404 (corriger, 301 ou 410) | GSC export | M (1j) | ++ |
| T6 | Audit JSON-LD complet (Organization, WebSite, Person, LegalService, Service, BreadcrumbList, FAQPage, Article) | Composants SEO | L (3j) | +++ |
| T7 | Corriger 87 champs Q&A manquants (Rich Results) | Composants FAQ | M (1j) | ++ |
| T8 | Corriger Image metadata (4 problèmes Rich Results) | Composants Image | S (4h) | + |
| T9 | Augmenter min instances Cloud Function `renderForBotsV2` (réduire cold starts → TTFB < 3s) | GCP config | S (2h, +50-100€/mois) | +++ |

## P1 — Performance & Core Web Vitals

| # | Action | Effort | Impact |
|---|---|---|---|
| CWV1 | Audit PageSpeed Insights sur 20 URLs représentatives (mobile + desktop) | M (1j) | +++ |
| CWV2 | Optimiser LCP (lazy-loading images, preload fonts, hero optimisé) | L (3j) | +++ |
| CWV3 | Réduire INP (split bundles, optimiser handlers React) | L (3j) | ++ |
| CWV4 | WebP/AVIF généralisé (`<picture>` + srcset) | M (1j) | ++ |
| CWV5 | Setup Lighthouse CI dans pipeline build | M (1j) | ++ |

---

# 🤖 PARTIE 3 — AEO/GEO (préparation à l'ère IA, ~15 j-h)

> **À exécuter dans une session dédiée** avec le prompt `PROMPT-AUDIT-AEO-AI-SEARCH-COMPLET.md` (19 phases). Ce qui suit est le résumé des actions probables.

## P0-AEO : Fondations (semaine 1-2)

| # | Action | Effort | Impact |
|---|---|---|---|
| A1 | Audit complet des 16 bots IA (GPTBot, ClaudeBot, PerplexityBot, ChatGPT-User, OAI-SearchBot, Claude-User, Perplexity-User, Google-Extended, Applebot-Extended, Bingbot, DuckAssistBot, Meta-ExternalAgent, Bytespider, CCBot) — autoriser browsing, décider training | M (1j) | +++ |
| A2 | Vérifier robots.txt : ajouter directives explicites pour bots IA | S (2h) | +++ |
| A3 | **Créer/refondre `llms.txt`** à la racine (format https://llmstxt.org) — curated, pas exhaustif | M (1j) | +++ |
| A4 | Créer `llms-full.txt` (version étendue avec contenu inline) | S (4h) | ++ |
| A5 | Vérifier SSR sur les 7 surfaces critiques pour bots IA (les LLMs n'exécutent pas JS) | M (1j) | +++ |

## P0-AEO : Schema.org dense par type de page

| # | Action | Effort | Impact |
|---|---|---|---|
| A6 | `Organization` + `WebSite` + `SearchAction` enrichis sur home | S (4h) | +++ |
| A7 | `Person` + `LegalService` + `AggregateRating` + `BreadcrumbList` complet sur fiches avocats | L (3j) | ++++ |
| A8 | `Person` + `Service` + `AggregateRating` sur fiches expatriés aidants | M (1j) | ++++ |
| A9 | `Article` + `Person` (auteur) + `Organization` (publisher) + `BreadcrumbList` sur articles blog | L (3j sur pipeline) | +++ |
| A10 | `FAQPage` schema sur toutes pages avec FAQ | M (1j) | +++ |
| A11 | `JobPosting` schema sur landings recrutement (chatter, influencer, blogger, GA) | M (1j) | ++ |
| A12 | `Service` + `LocalBusiness` sur pages service par pays | M (1j) | ++ |
| A13 | `Dataset` + `ResearchProject` sur baromètres/études (futurs) | S (2h) | +++ |
| A14 | Validation systématique via Rich Results Test + Schema.org validator | S (4h) | ++ |

## P1-AEO : E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)

| # | Action | Effort | Impact |
|---|---|---|---|
| A15 | Bio publique pour chaque auteur d'article blog (page `/auteurs/[slug]`) | L (3j + ongoing) | ++++ |
| A16 | Credentials affichés et vérifiables sur chaque fiche prestataire (barreau, années, langues) | M (1j sur pipeline) | ++++ |
| A17 | Page `/equipe` avec membres identifiés | M (1j) | ++ |
| A18 | Politique éditoriale publique `/editorial-policy` | S (4h) | ++ |
| A19 | Politique de correction `/correction-policy` | S (2h) | + |
| A20 | Témoignages clients réels datés avec photos + Trustpilot intégré via API (pas screenshots) | M (1j) | +++ |

## P0-AEO : Multimédia + Voice + Speakable

| # | Action | Effort | Impact |
|---|---|---|---|
| A21 | `VideoObject` schema sur pages avec vidéo (transcripts publiés en HTML) | M (1j) | +++ |
| A22 | `speakable` schema sur FAQ courtes (Google Assistant, Alexa) | S (4h) | ++ |
| A23 | Alt text descriptif sur toutes les images critiques | L (3j) | ++ |
| A24 | Schema `ImageObject` sur images clés | S (4h) | + |
| A25 | Setup chaîne YouTube + premières vidéos cas concrets ("L'avocat explique...") | XL (chantier continu) | ++++ |
| A26 | Setup podcast "Expat & Justice" + RSS + distribution Spotify/Apple | XL (chantier continu) | ++ |

## P1-AEO : Monitoring AI Citation Rate

| # | Action | Effort | Impact |
|---|---|---|---|
| A27 | Setup Otterly.ai ou Peec.ai (50-200 €/mois) | S (2h) | +++ |
| A28 | Lister 30 queries cibles business par persona (expat débutant, urgence, futur expat) | M (1j) | +++ |
| A29 | **Baseline citation IA** : tester 30 queries × 8 moteurs (ChatGPT, Perplexity, Claude, Gemini, AIO, Bing Copilot, DuckDuckGo, Apple Intel) | M (1j) | +++ |
| A30 | Setup dashboard interne "AI Visibility" + KPIs mensuels | M (1j) | ++ |
| A31 | Re-mesure mensuelle (J+30, J+90, J+180) | S (récurrent) | +++ |

## P0-AEO : Analyse concurrentielle GEO

| # | Action | Effort | Impact |
|---|---|---|---|
| A32 | Pour 30 queries cibles : identifier qui est cité actuellement (gouv, presse, forums, concurrents, Wikipedia) | M (1j) | +++ |
| A33 | Décoder les patterns gagnants (formats, longueur, schema, fraîcheur) | S (4h) | +++ |
| A34 | Plan d'attaque par cluster de 5-7 thématiques | M (1j) | +++ |

---

# 📊 PARTIE 4 — STRATÉGIQUE 18 MOIS (transformation business)

> Détails complets dans `PROMPT-STRATEGIE-GEO-AEO-IA-18-MOIS.md`. Ce qui suit est le récap.

## 🌪️ Chantier 11 — Réduction du parc 430k → 5-10k (par vagues monitorées)

**LE chantier le plus impactant.** Sans lui, tout le reste est sous-optimal.

### Phase A (mois 1-3) — Observer + Stop
- **STOP** la génération programmatique de nouvelles LP (immédiat)
- Calculer score composite par URL (formule §15.1 du fichier AEO)
- Baseline : trafic, impressions, conversions par URL
- **Zéro désindexation** pendant ces 3 mois

### Phase B (mois 4-6) — Muscler le top 5%
- Enrichir les ~5 000 pages top score (≥ 50)
- Publier le **premier asset premium** (Baromètre annuel)
- Toujours pas de désindexation

### Phase C (mois 7-12) — Désindexation par vagues
- Vague 1 : 10% du segment 0-4 (les pires) → `noindex, follow` + retrait sitemap
- Attendre 4 semaines, monitorer
- **Critère d'arrêt : si trafic baisse > 10% → PAUSE**
- Vagues suivantes : 20% à chaque fois

### Phase D (mois 13-18) — Finalisation
- 410 Gone sur pages désindexées il y a 6+ mois
- 1 asset premium / 2 mois en rythme de croisière

**Effort total** : XL (3-6 mois équipe contenu + tech) | **Impact** : ++++

---

## 📊 Chantier 4 — Original Research récurrent (premier baromètre Q3 2026)

| Trimestre | Asset | Effort | Impact |
|---|---|---|---|
| Q3 2026 | **Baromètre de l'expatriation francophone 2026** (sondage 1500+ expats) | XL (4-6 sem équipe) | ++++ |
| Q4 2026 | **Index du coût juridique par pays** (data interne anonymisée) | L (3 sem) | +++ |
| Q1 2027 | **Comparatif assurance santé expat 50 pays** | L (3 sem) | +++ |
| Q2 2027 | **État de l'urgence à l'étranger** (top problèmes par pays) | L (3 sem) | +++ |
| Continu | **1 statistique propriétaire / mois** publiée + relayée presse | S (récurrent) | +++ |

**Format pour chaque asset** : page web longue + PDF téléchargeable + infographie + dataset CSV/JSON + communiqué presse + version EN minimum

---

## ✍️ Chantier 5 — Expert-authored content (200 articles/an signés vs 100k templatés)

| Action | Effort | Impact |
|---|---|---|
| Recruter 20-50 avocats du réseau prêts à signer | M (3 sem PR) | ++++ |
| Système d'attribution dans Mission Control : `Article.author` = `Person` complet | M (1 sem dev) | +++ |
| Page `/auteurs/[nom-avocat]` avec bio + photo + barreau + LinkedIn + liste articles | M (1 sem dev) | +++ |
| Process éditorial : avocat fournit angle, rédacteur structure, avocat valide | Continu | +++ |
| **Reviewer juridique senior** valide chaque article YMYL (`schema:reviewedBy`) | Continu | +++ |
| Page "Comité éditorial" (gouvernance, processus de vérification, corrections) | S (4h) | ++ |

---

## 🎥 Chantier 6 — Production vidéo + podcast

| Format | Cadence | Effort | Impact |
|---|---|---|---|
| "L'avocat explique..." | 1/sem (3-5 min) | L (continu) | ++++ |
| "Témoignages expats" | 1/mois (10-15 min) | M (continu) | +++ |
| Podcast "Expat & Justice" | 2/mois (30-45 min) | M (continu) | ++ |

**Tout transcrit en HTML** + `VideoObject`/`PodcastEpisode` schema + distribution YouTube/Spotify/Apple

---

## 🏛️ Chantier 7 — Entity building (entité reconnue Google + Wikidata + Wikipedia)

| Action | Effort | Impact |
|---|---|---|
| Wikidata entry (Q-identifier complet) | M (1j) | +++ |
| Wikipedia entry (si critères atteints — besoin 5-10 sources presse) | XL (continu sur 6+ mois) | ++++ |
| Google Business Profile complet | S (2h) | ++ |
| Crunchbase profil société | S (2h) | ++ |
| LinkedIn entreprise actif (posts hebdo) | Continu | +++ |
| Annuaires d'autorité (Owler, Zenefits, etc.) | M (1j) | + |
| **Schema `Organization` enrichi** sur home avec `sameAs` complet pointant vers TOUTES ces entités | S (2h) | +++ |
| 1 communiqué presse / trimestre | Continu | +++ |

---

## 🔗 Chantier 6/strat — Backlinks d'autorité

| Action | Effort | Impact |
|---|---|---|
| **3-5 partenariats universitaires** (échange data vs publications) | XL (continu) | ++++ |
| **1 mention presse / mois** grâce aux baromètres | M (continu) | ++++ |
| Guest posts sur sites d'autorité (forums expats, sites consulaires) | M (continu) | +++ |
| Sponsoring d'événements expat (Salon Paris des expatriés, etc.) | L (continu) | ++ |
| Mentions Wikipedia sur articles connexes (expatriation, assistance juridique) | M (continu) | +++ |

---

# 🌍 PARTIE 5 — MULTI-LANGUE EXHAUSTIF (les 9 langues × 199 pays)

## Garanties à atteindre pour chaque locale

Pour CHAQUE locale `{lang}-{country}` (théoriquement 1 800 combinaisons, en pratique limité à ~50-100 marchés réels) :

### Niveau page individuelle
- [ ] HTTP 200 OK pour Googlebot mobile + desktop + ChatGPT-User + PerplexityBot + ClaudeBot
- [ ] `<html lang="{lang}">` correct
- [ ] `<title>` localisé natif (pas traduction machine)
- [ ] `<meta description>` localisée native, 150-160 caractères
- [ ] Content-Language header
- [ ] Cache-Control cohérent
- [ ] **10 hreflang complets** (9 langues + x-default)
- [ ] Canonical self-référent
- [ ] `<h1>` unique localisé
- [ ] Structure HTML sémantique (h2 questions, listes, tables)
- [ ] JSON-LD avec `inLanguage` correct
- [ ] Pas de fallback EN sur du contenu FR/DE/etc.
- [ ] Pas de mélange de langues dans une page

### Niveau pipeline de génération
- [ ] **ASCII slugs uniquement** (romanisation systématique pour ar, zh, hi, ru)
- [ ] **Validation des combinaisons locale×country** : ne générer que celles avec marché cible réel
- [ ] **Pas de phonétisation cross-langue** (`kamailong`, `helan`, `moxige` interdits en FR)
- [ ] **Localisation réelle** : devises, banques, lois, noms de villes adaptés (cf. `AudienceContextService`)
- [ ] **Auteurs locaux** quand possible (ex: avocat marocain pour articles MA)

### Niveau RTL (ar)
- [ ] `dir="rtl"` partout sur `/ar-*/...`
- [ ] CSS RTL-aware (margin/padding inversés)
- [ ] Icônes flippées si directionnelles (←/→)
- [ ] Composants UI testés en RTL
- [ ] Polices arabes lisibles (Cairo, Tajawal, Noto Sans Arabic)

### Niveau CJK (zh, hi)
- [ ] Polices appropriées (Noto Sans SC pour zh, Noto Sans Devanagari pour hi)
- [ ] Pas de cassure de caractères (CJK width)
- [ ] Encodage UTF-8 partout

### Niveau sitemaps
- [ ] 1 sitemap par langue OU `<xhtml:link rel="alternate" hreflang>` dans sitemap unique
- [ ] `<lastmod>` cohérent (pas tous à `today`)
- [ ] Tailles < 50 000 URLs et < 50 MB
- [ ] News sitemap < 7 jours (pour Google News + SGE)

### Niveau hreflang inter-pays
- [ ] Décision stratégique sur architecture : `{lang}-{country-content}` (ex: `/fr-th/...` = contenu FR sur Thaïlande) vs `{lang-locale}` (ex: `/fr-fr/pays/thailande`)
- [ ] Si `{lang-country-content}` retenu : documenter chez Google Search Central
- [ ] Hreflang inter-locale du même pays : `fr-FR`, `fr-BE`, `fr-CA`, `fr-CH` cohérents

---

# 🔧 PARTIE 6 — P2 BACKLOG (nice-to-have)

| # | Action | Effort | Impact |
|---|---|---|---|
| B1 | Cleanup `_CR` aliases dans worker.js (kamailong, helan, moxige) — quand pipeline corrigé | S (1h) | + |
| B2 | Retirer `ahrefsbot` et `mj12bot` de `BLOCKED_SCRAPER_UAS` (utiles pour mesurer backlinks) | S (10min) | + |
| B3 | Setup IndexNow (Bing, Yandex) pour push instantané | S (4h) | ++ |
| B4 | Setup Bing Webmaster + Yandex Webmaster + soumission sitemaps | S (4h) | ++ |
| B5 | Setup Baidu Ziyuan (si marché ZH visé) | S (4h) | + |
| B6 | Audit accessibility WCAG 2.1 AA (WAVE + axe DevTools) sur 10 pages | M (1j) | ++ |
| B7 | Audit pagination (`?page=N`) : canonical self-reference, indexable ou non | S (4h) | + |
| B8 | Audit `/search?q=` interne : doit être noindex + Disallow | S (2h) | + |
| B9 | Audit cookie banner : ne bloque pas le premier rendu pour Googlebot | S (4h) | ++ |
| B10 | Migration Cloud Function `renderForBotsV2` europe-west1 → europe-west3 (latence Firestore) | M (1j) | ++ |
| B11 | Évaluer migration React → SSG (Vite SSG, Astro) pour pages statiques (TTFB ~50ms) | XL (3-6 mois) | ++++ |
| B12 | Audit des 5xx logs Cloud Run pour identifier patterns de timeout | M (1j) | ++ |

---

# 📅 ROADMAP CONSOLIDÉE PAR HORIZON

## Semaine 1-2 (urgences) — ~3 j-h
- ✅ P0-1 (home `/`)
- ✅ P0-2 (cache 1 an)
- ✅ P0-6 (hreflang 6 langues invisibles)
- ✅ P0-4 (faux 404 React)
- ✅ Hors-code : Wikidata + Google Business Profile + sameAs JSON-LD

## Mois 1 — ~10 j-h
- ✅ Tous les P1 multi-langue (M1-M8)
- ✅ T1-T9 technique (sitemaps, GSC anomalies, JSON-LD)
- ✅ A1-A5 fondations AEO (bots, llms.txt, SSR)

## Mois 2-3 — ~15 j-h
- ✅ A6-A14 schema.org dense
- ✅ A15-A20 E-E-A-T
- ✅ A21-A26 multimédia (chantiers de production démarrés)
- ✅ A27-A34 monitoring + analyse concurrentielle
- ✅ CWV1-CWV5 performance
- ✅ **Chantier 11 Phase A** : STOP génération + observer

## Mois 4-6 — chantier stratégique
- ✅ **Chantier 11 Phase B** : muscler top 5%
- ✅ Premier asset premium : Baromètre 2026
- ✅ 50 articles experts signés (Chantier 5)
- ✅ Chaîne YouTube active (10 premières vidéos)
- ✅ Wikipedia tentative

## Mois 7-12 — pivot
- ✅ **Chantier 11 Phase C** : désindexation par vagues monitorées
- ✅ Index coût juridique publié
- ✅ Podcast lancé
- ✅ 100 vidéos
- ✅ 3 partenariats universitaires
- ✅ 10 mentions presse majeures

## Mois 13-18 — scale
- ✅ **Chantier 11 Phase D** : finalisation 410 Gone
- ✅ 1 asset premium / 2 mois rythme croisière
- ✅ Extension multi-langue (EN d'abord, puis ES/DE/PT/AR/ZH/RU/HI)
- ✅ Bilan AI Citation Rate × 10 vs baseline T1

---

# 📊 KPIs CIBLES PAR HORIZON

| Métrique | Aujourd'hui (2026-04) | T1 (3 mois) | T3 (9 mois) | T6 (18 mois) |
|---|---|---|---|---|
| Clics organiques Google / 90 j | 33 | 100 | 600 | 3 000+ |
| Position `sos expat` (brand) | 9,54 | < 5 | < 3 | 1-2 |
| Pages indexées | 2 601 | 3 500 | 8 000 | 15 000 (qualitatives) |
| Ratio indexées / découvertes | 13 % | 25 % | 50 % | 70 %+ |
| Hreflang complets (9/9 + x-default) | **3/10 🚨** | **10/10 ✅** | 10/10 | 10/10 |
| TTFB Googlebot | 10 s | 3 s | 1,5 s | < 1 s |
| Citations ChatGPT (30 queries) | baseline | +50 % | × 3 | × 10 |
| Citations Perplexity | baseline | +50 % | × 3 | × 10 |
| Présence AIO Google | 0 | 2-5 % queries | 15 % | 30-40 % |
| Wikidata entry | 0 | créée | complète | liée à 20+ entités |
| Knowledge Panel Google brand | absent | partiel | présent basique | complet logo+desc |
| Backlinks RefDomains qualité | à mesurer | +20 | +100 | +500 |
| Publications first-party | 0 | 1 | 3 | 8+ |
| Top 10 AIO requêtes business | 0 | 0-2 | 5-10 | 20+ |

---

# 💰 BUDGET ESTIMÉ

## Outils SaaS (mensuel)
- Otterly.ai ou Peec.ai (tracking IA) : 50-200 €
- Semrush ou Ahrefs (backlinks + KW + AIO) : 200-400 €
- Schema App ou validator pro (optionnel) : 50 €
- Canva Pro / Figma : 10-50 €
- **Total outils** : **200-600 €/mois**

## Équipe / contenu
- 1 data analyst (Baromètre, Index) : 0,5 ETP
- 1 PR / Comms (relations presse, Wikidata, Wikipedia) : 0,3 ETP
- 1 rédacteur expert (coordination avocats, articles signés) : 0,5 ETP
- 1 vidéaste (production hebdomadaire) : 0,3 ETP (ou freelance ~3 k€/mois)
- 1 dev SEO/technique (fixes + monitoring) : 0,2 ETP
- **Total équipe ambitieux** : ~5-10 k€/mois selon location

## Infra
- Cloud Function min instances (réduire cold starts) : +50-100 €/mois
- Sondages externes (1 500 répondants × 2/an) : ~10 k€/an
- Sponsoring événements expat : ~5 k€/an

## Total opérationnel ambitieux
- **~7-12 k€/mois** + 15 k€/an de "campagnes"
- Soit **~110-160 k€/an** pour exécuter le pivot complet

---

# ⚠️ POINTS D'ATTENTION

1. **NE PAS** rollback `e84f1833` — la cause racine est traitée à la source (timeout 35s)
2. **NE PAS** désindexer 400k URLs en une nuit — vagues monitorées avec critère d'arrêt -10% trafic
3. **NE PAS** générer du contenu IA sans revue humaine
4. **NE PAS** créer de faux auteurs (persona IA avec photo générée)
5. **NE PAS** acheter des backlinks (Penguin)
6. **NE PAS** spammer Reddit/Quora (réputation détruite)
7. **NE PAS** traduire automatiquement les assets premium en 9 langues (LLM voit la duplication)
8. **NE PAS** bloquer GPTBot/ClaudeBot/PerplexityBot par défaut
9. **NE PAS** promettre de résultats à 30 jours à la direction
10. **NE PAS** violer le RGPD en publiant first-party data sans anonymisation rigoureuse

---

# ✅ CRITÈRES DE PERFECTION (definition of done)

Le site sera considéré "parfait" SEO/AEO/GEO quand :

### Technique
- [ ] 100% des pages SSR servent 200 (pas 301/404 sur URLs canoniques)
- [ ] TTFB Googlebot < 1,5 s sur 95% des URLs
- [ ] Ratio 5xx crawl < 0,5 %
- [ ] Core Web Vitals dans le vert sur 90% du parc (LCP < 2,5 s, INP < 200 ms, CLS < 0,1)
- [ ] 0 soft 404 dans GSC

### Multilingue
- [ ] 10 hreflang complets (9 langues + x-default) sur 100% des pages multilingues
- [ ] `<html lang>` correct sur 100% des pages
- [ ] `inLanguage` JSON-LD correct sur 100% des pages
- [ ] 0 mélange de langues dans une page (sauf citations)
- [ ] Slugs ASCII sur 100% des URLs
- [ ] Combinaisons locale×country : seulement les marchés cibles réels

### Indexation
- [ ] Ratio indexées / découvertes > 70%
- [ ] Pages "détectée non indexée" < 1 000 (vs 14 592 actuels)
- [ ] 100% des URLs en sitemap répondent 200 (pas 301/404/410)

### Ranking
- [ ] Position 1-2 sur sa propre marque `sos expat`
- [ ] Top 10 sur 50+ requêtes business (vs ~3 actuelles)
- [ ] 3 000+ clics organiques / 90 j (vs 33)

### Brand entity
- [ ] Knowledge Panel Google présent (logo, description, sociaux)
- [ ] Sitelinks (6+ liens) sur recherche brand
- [ ] Wikidata entry complète avec 20+ propriétés
- [ ] Wikipedia entry (si éligible)
- [ ] Google Business Profile vérifié et enrichi

### AEO/GEO
- [ ] Cité dans top 3 sources sur ChatGPT/Perplexity/Claude/Gemini sur 80% des queries cibles
- [ ] Présent dans Google AI Overviews sur 30%+ des queries business
- [ ] llms.txt complet et maintenu
- [ ] Schema.org dense (10+ types) avec validation Rich Results 100%

### Contenu
- [ ] Parc passé de 430k à ~10k pages vraiment uniques
- [ ] 100% des articles YMYL signés par expert nommé + reviewer juridique
- [ ] 1 asset premium publié / 2 mois (baromètres, indices, rapports)
- [ ] Bibliothèque vidéo > 100 vidéos transcrites

### Monitoring
- [ ] Dashboard interne "AI Visibility" actif
- [ ] Re-mesure mensuelle des 30 queries cibles
- [ ] Alertes automatiques sur baisse trafic / position / citation rate

---

**Fin du plan — 2026-04-22**
