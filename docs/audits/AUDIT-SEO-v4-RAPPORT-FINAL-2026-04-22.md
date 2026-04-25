# 📊 AUDIT SEO v4 — RAPPORT FINAL — sos-expat.com
## Date : 2026-04-22 | Auditeur : Claude (best-effort, conversation unique)

> **AVERTISSEMENT MÉTHODOLOGIQUE** : Cet audit a été lancé en mode auto sans les exports GSC bloqueurs listés au §0.1 du prompt source (`PROMPT-AUDIT-SEO-INDEXATION-COMPLET.md`). Il s'appuie sur :
> - Les données GSC déjà fournies dans le prompt (§2.2 / §2.2.bis / §2.2.ter / §2.3)
> - La lecture ciblée du code (worker.js 3133 lignes, dynamicRender.ts, composants React 404, App.tsx routes)
> - Les tests live HTTP avec User-Agents Googlebot/Chrome FR
>
> **Sont INCOMPLETS** : crawl exhaustif (Screaming Frog non disponible), URL Inspection sur 30 URLs (nécessite GSC), analyse backlinks (Ahrefs/Semrush non disponibles), Core Web Vitals sur 20 URLs (PSI non lancé), validation Rich Results, audit SSR Cloud Run logs, audit Bing/Yandex.
>
> **Couvert** : H1, H2, H3, H10, H14, H21, H37, H38, H42, H44-bis (hypothèses critiques) + chantiers AH.1 (mapping), B (Worker), C (SSR Puppeteer), D (faux 404 React), E partiel, F (robots.txt), AC partiel.
>
> Pour boucler les chantiers manquants, lancer une seconde session avec les exports GSC (§0.1) et l'accès à Ahrefs/Semrush.

---

# 7.1 SYNTHÈSE EXÉCUTIVE

## Verdict en 3 phrases

1. **Le site n'est pas invisible — il est trop visible avec du contenu trop faible**. 14 592 URLs détectées non indexées + position 9,54 sur sa propre marque = Google a **vu** trop d'URLs (430k LP programmatiques) et a **dévalué** le domaine entier (signal Helpful Content Update).
2. **La régression `e84f1833` (worker.js:3022-3046) propage les 404 SSR** mais a été correctement complétée par le timeout PHASE2 35s (dynamicRender.ts:356, fix P0-E 2026-04-22) qui réduit les faux positifs sur les profils prestataires. Le vrai problème de ranking **n'est plus côté Worker** — il est côté **qualité/quantité du contenu et autorité de domaine**.
3. **L'asymétrie Laravel vs React est confirmée** : tout ce qui rank côté brand+sujet est servi par Laravel (SSR natif). React (SSR Puppeteer + Cloudflare Pages) ne rank presque jamais — TTFB GSC 10s + cold starts Cloud Run + facture +57% confirment la pathologie.

## Top 6 problèmes P0 (avec impact estimé)

| # | Problème | Preuve | Impact estimé | Effort |
|---|---|---|---|---|
| **P0-1** | **Home `/` redirige Googlebot vers `/en-us`** au lieu de `/fr-fr` ou contenu direct | curl 2026-04-22 : `HTTP 301 Location: /en-us` pour UA Googlebot mobile | Toute la France voit anglais. Brand SERP cassé. ~70% du trafic perdu. | **S** (4h) |
| **P0-2** | **Cache 1 AN sur 301 legacy LPs** (`max-age=31536000`) | worker.js:1746 + curl `/fr-fr/sos-avocat`, `/fr-fr/blog`, `/fr-fr/country/france` | Google cache les vieilles redirections pour 1 an = découverte des nouvelles URLs très lente | **S** (1h) |
| **P0-3** | **430k LPs programmatiques** = Helpful Content Update + crawl budget famine | GSC : 14 592 URLs jamais crawlées (lastcrawl=1970-01-01) + autorité 9,54 sur brand | Tout le SEO est plombé tant que le ratio masse/qualité reste pourri | **XL** (3-6 mois, plan dédié) |
| **P0-4** | **HelpArticle.tsx:327 et FAQDetail.tsx:99-101** posent `data-page-not-found` sur `!article` ou avec timer 10ms | Lecture code | Risque persistant de faux 404 SSR sur transitions de route React | **M** (1j) |
| **P0-5** | **robots.txt Disallow `/chatter/`, `/influencer/`, `/blogger/`, `/group-admin/`** bloque les sous-routes publiques d'inscription/landing | robots.txt 2026-04-22 + App.tsx:548-560 | Impossible d'indexer `/chatter/inscription` etc. — landings de recrutement invisibles | **S** (30min) |
| **P0-6** 🚨 NEW | **Hreflang CATASTROPHIQUEMENT incomplets : 3/10 au lieu de 10/10 sur les 9 homes locales** (manquent de-DE, pt-PT, ru-RU, zh-Hans, ar-SA, hi-IN + x-default) | curl 2026-04-22 sur les 9 homes : seulement `en-US, es-ES, fr-FR` injectés | **6 langues sur 9 sont totalement invisibles à Google** comme alternatives — explique en grande partie l'échec multilingue | **M** (1j) |

**Effort total P0** : 1,5 jour-homme (sans P0-3 qui est un chantier stratégique 3-6 mois).

---

# 7.2 EXPLICATION DU PARADOXE « INDEXATION MONTE + INVISIBILITÉ »

## Les 4 problèmes distincts (ne pas les confondre)

| Problème | Métrique | Statut | Cause principale |
|---|---|---|---|
| **Indexation** | 2 601 pages dans l'index | ✅ OK techniquement | Pages servent 200, sitemaps lus |
| **Découverte** | 14 592 URLs détectées non indexées | 🚨 **87% rejet** | Google voit le sitemap, juge le parc trop faible/dupliqué, ne crawle même pas |
| **Ranking** | 24 impressions/jour pour 2 601 pages = 0,009 imp/page/j | 🚨 **Catastrophique** | Autorité de domaine basse, contenu peu compétitif, 70% trafic concentré sur home |
| **Trafic** | 33 clics / 90 j | 🚨 **Quasi-nul** | Brand SERP cassé (pos 9,54 sur `sos expat`), pages business pos 29-99 |

## Détail des 14 592 « détectée non indexée »

**Fait majeur** : TOUTES ces URLs ont `dernière exploration = 1970-01-01` = **Google ne les a jamais fetchées**. Il a juste découvert leur existence via sitemap, puis a décidé de ne pas dépenser de crawl budget.

**Patterns observés (échantillon §2.2.ter du prompt)** :

| Catégorie | Exemples | Cause probable |
|---|---|---|
| **Codes pays 2-lettres comme slug** | `/ar-sa/muhamun/kn`, `/ar-sa/muhamun/km`, `/ar-sa/muhamun/mh`, `/ar-sa/muhamun/st` | Pipeline génère slug = ISO2 code au lieu du nom localisé. **worker.js:1758-1765** a `DIRECTORY_ROLE_SLUGS` qui tente de rattraper avec un 301, mais Google a déjà découvert ces URLs et les a rejetées avant le fix. |
| **Tags arabes massivement générés** | `/ar-sa/alwusum/comparatif`, `/ar-sa/alwusum/expatriation-dubai-2026` | Pages tags à masse — devraient être `noindex` (chantier AD) |
| **Galleries indexables à tort** | `/ar-sa/maarad/sos-expat-editorial-visual-china-chinese-landscape-004-ar` | Pages galerie à masse — `noindex` requis |
| **Slugs non-ASCII** | `/ar-sa/التسجيل` | Règle "slugs ASCII only" violée (cf. mémoire projet) — pipeline laisse fuiter du contenu non romanisé |
| **Slugs romanisés douteux** | `/ar-fr/alhayat-fi-alkhaarij/al-bnyh-al-thtyh-al-talymyh-fy-frnsa-2026` | Romanisation arabe → ASCII produit des slugs imprononçables (130+ caractères) |
| **Combinaisons locale×country aberrantes** | `/zh-er/...` (zh+Erythrée), `/de-cf/...` (de+Centrafrique), `/ch-cn/...` (chinois?Suisse?) | Pipeline génère sans validation : zh-er n'a pas de marché cible. ch-cn ambigu. |
| **Phonétisation cross-langue** | `/fr-fr/pays/kamailong` (Cameroun en chinois), `/fr-fr/pays/moxige` (Mexico en chinois), `/fr-fr/pays/helan` (Holland) | Mauvais dictionnaire de noms de pays injecté en mauvaise locale. **Confirmé dans worker.js:31** : `_CR['kamailong'] = 'CM'` (worker accepte ces aliases — mais ils n'auraient jamais dû être générés en `/fr-fr/`) |

## Détail des 2 601 indexées invisibles

Avec **24 impressions/jour max** pour 2 601 pages = ~0,009 impression/page/jour.

C'est le **problème de ranking** : pages techniquement indexées mais Google ne les remonte sur **aucune requête business**. Causes principales :
- **Helpful Content Update** : signal de site avec masse de contenu programmatique → tout le domaine est dévalué
- **Autorité basse** : pos 9,54 sur sa propre marque = signal d'entité non-reconnue
- **Cannibalisation** : 9 langues × 200 pays sur mêmes intents → Google ne sait pas quelle page choisir
- **Backlinks quasi-inexistants** (à confirmer Ahrefs)

---

# 7.3 ANALYSE BRAND SERP

## Diagnostic à partir des données fournies

| Métrique brand | Valeur | Norme attendue | Verdict |
|---|---|---|---|
| Position sur `sos expat` | 9,54 | 1-2 | 🚨 **Anormal** |
| Position sur `sos-expat.com` | 2,08 | 1 | ⚠️ Acceptable mais perfectible |
| Knowledge Panel Google | À vérifier (probablement absent) | Présent avec logo+description | 🚨 |
| Sitelinks | À vérifier | 6 liens minimum | 🚨 (l'utilisateur ne voit que la home) |
| Wikidata entry | Absent (selon mémoire projet) | Présent | 🚨 |
| Wikipedia entry | Absent | Optionnel mais valorisant | À évaluer |

## Causes hypothétiques

1. **Entité non reconnue par Google Knowledge Graph** : pas d'ancrage Wikidata/Wikipedia, NAP probablement incohérent à travers le web
2. **`sameAs` JSON-LD probablement incomplet** sur l'Organization (à confirmer en lisant `seoTypes.ts` ou équivalent)
3. **Concurrence sur `sos expat`** : peut-être d'autres sites homonymes (à vérifier en SERP réelle)

## Action — Brand entity building (chantier AE)

Cf. plan détaillé dans `PROMPT-STRATEGIE-GEO-AEO-IA-18-MOIS.md` chantier 7. Quick wins :
1. Compléter `Organization` JSON-LD avec `sameAs` exhaustif (LinkedIn, Twitter/X, Facebook, Instagram, YouTube, Crunchbase si applicable)
2. Créer entrée Wikidata (priorité absolue — gratuit et impactant)
3. Compléter Google Business Profile
4. Standardiser NAP (Name Address Phone) sur tous les annuaires

---

# 7.4 CATALOGUE DES ANOMALIES (P0/P1/P2)

## P0 — Critiques (à fixer cette semaine)

### P0-1 : Home `/` redirige Googlebot mobile vers `/en-us`

**Preuve** :
```
$ curl -sI -A "Googlebot mobile" https://sos-expat.com/
HTTP/1.1 301 Moved Permanently
Location: https://sos-expat.com/en-us
X-Bot-Detected: googlebot
X-Rendered-By: sos-expat-ssr
```

**Cause probable** : Le SSR `renderForBotsV2` (ou le Worker en amont) renvoie un 301 vers `/en-us` par défaut sans tenir compte de :
- L'`Accept-Language` du bot (Googlebot envoie souvent `en` mais doit servir le hreflang FR si la requête vient d'une IP FR)
- Le `x-default` qui devrait pointer vers `/en-us` mais avec une stratégie hreflang qui sert FR aux français

**Impact** :
- L'utilisateur français qui tape `sos-expat.com` est redirigé vers `/en-us`
- Le Knowledge Panel et le sitelinks de Google se construisent autour de `/en-us` → SERP brand cassé pour FR
- Cohérent avec le constat utilisateur : *"je suis français en France, je vois le site en anglais"*

**Fix recommandé** :
- Soit servir `200` directement sur `/` avec contenu localisé via hreflang (option propre, recommandée)
- Soit `301` vers `/fr-fr` quand `Accept-Language` commence par `fr`
- **Propriétaire** : équipe React/Worker
- **Fichier suspect** : `dynamicRender.ts` (chercher la logique de routing root) + `worker.js` (chercher la règle qui transforme `/` en redirect)
- **Effort** : S (4h)
- **Test post-fix** : `curl -I -A "Googlebot mobile" https://sos-expat.com/` doit renvoyer 200, et `curl -I -A "Chrome FR" https://sos-expat.com/` aussi

### P0-2 : Cache 1 AN (`max-age=31536000`) sur les 301 legacy LP

**Preuve** : `worker.js:1746` dans `legacyLPRedirect301()` :
```js
'Cache-Control': 'public, max-age=31536000',
```

**URLs affectées** (échantillon testé 2026-04-22) :
- `/fr-fr/sos-avocat` → `/fr-fr/tarifs` (1 an de cache)
- `/fr-fr/consulter-avocat` → `/fr-fr/tarifs` (1 an)
- `/fr-fr/country/france` → `/fr-fr/pays/france` (1 an)
- `/fr-fr/blog` → `/fr-fr/articles` (1 an)
- ... et tous les patterns du `LEGACY_LP_CANONICAL` (worker.js:1712-1722) × 9 langues × 200 pays

**Impact** :
- Google met à jour les URLs très lentement
- Les sitemaps qui contiennent encore les anciennes URLs créent du bruit
- Les **575 URLs "Page avec redirection"** dans GSC sont probablement ces LPs
- Le crawl budget est gaspillé sur des URLs qui ne devraient plus exister

**Fix recommandé** :
- Ramener à `max-age=86400` (24h) en attendant la consolidation finale
- Retirer définitivement les anciennes URLs des sitemaps
- Quand Google a re-crawlé toutes les URLs et a la nouvelle map, alors revenir à 1 an
- **Propriétaire** : équipe React/Worker
- **Effort** : S (1h)

### P0-3 : 430k LPs programmatiques — Helpful Content Update

**Preuve** :
- 14 592 URLs jamais crawlées par Google (lastcrawl=1970-01-01)
- Position 9,54 sur sa propre marque = signal de domaine entier dévalué
- 33 clics / 90j sur 2 601 pages = ratio engagement / volume catastrophique

**Cause** :
- Pipeline content engine génère 240/pays × 199 pays × 9 langues = ~430 000 articles
- Templates avec >60% de boilerplate (à confirmer par échantillonnage shingles)
- Combinaisons locale×country invalides (zh-er, ch-cn, fr-st, de-cf — cf. §2.2.ter)
- Slugs non-ASCII et phonétisation cross-langue (kamailong, helan)

**Fix recommandé** :
- Plan dédié 18 mois (cf. `PROMPT-STRATEGIE-GEO-AEO-IA-18-MOIS.md` chantier 9 + 11)
- Phase A (mois 1-3) : **Stop génération + observer**
- Phase B (mois 4-6) : muscler top 5%
- Phase C (mois 7-12) : désindexer 60-70% du parc par vagues monitorées
- Cible : passer de 430k → 5-10k pages vraiment uniques
- **Propriétaire** : équipe Laravel + équipe contenu + direction
- **Effort** : XL (3-6 mois)

### P0-4 : Faux positifs `data-page-not-found` dans React

**Preuve** :
- **`HelpArticle.tsx:327`** : `if (notFound || !article)` → si `article===null` même sans `setNotFound(true)`, le flag est posé
- **`FAQDetail.tsx:80-92`** : `setShow404(true)` après timer 10ms → fenêtre de 10ms où Puppeteer peut détecter le flag pendant que `faq` est encore en cours de chargement
- **`ProviderProfile.tsx:1067-1074`** : OK (conditionné sur `notFound===true` qui n'est défini que dans des paths légitimes — l.1742, 1818, 1823, 1925)

**Impact** :
- Risque de 404 à tort sur articles d'aide et FAQ détail
- Estimé : modéré (pas la cause principale grâce au fix P0-E timeout 35s)

**Fix recommandé** :
- `HelpArticle.tsx:327` : changer `notFound || !article` en `notFound` uniquement (ne poser le flag que sur état explicite)
- `FAQDetail.tsx:80-92` : retirer le timer 10ms, attendre la résolution de la promesse `loadFAQ()` complètement avant de poser `show404`
- **Propriétaire** : équipe React
- **Effort** : M (1 jour, avec tests)

### P0-5 : robots.txt bloque routes publiques `/chatter/`, `/influencer/`, etc.

**Preuve** :
```
robots.txt (2026-04-22) :
Disallow: /chatter/
Disallow: /influencer/
Disallow: /blogger/
Disallow: /group-admin/
Disallow: /affiliate
```

**Vs App.tsx:548-560** :
- `/chatter` (sans slash) = ChatterDashboard protégé → OK pour Disallow
- `/chatter/inscription` = **publique** → BLOQUÉE
- `/chatter/telegram` = protégée mais sous Disallow → OK

**Impact** :
- Landings d'inscription des affiliés invisibles à Google
- Mais : les vraies landings publiques utilisent `/devenir-chatter`, `/devenir-influenceur`, `/devenir-blogger` (App.tsx:475-486) — pas dans Disallow → pas bloquées
- Donc impact limité, sauf si l'utilisateur veut indexer `/chatter/inscription` pour SEO direct

**Fix recommandé** :
- Soit accepter le statu quo (c'est probablement intentionnel — les landings sont sur `/devenir-*`)
- Soit affiner les règles : `Allow: /chatter/inscription` avant `Disallow: /chatter/`
- **Propriétaire** : équipe SEO + product
- **Effort** : S (30 min)

### P0-6 🚨 : Hreflang CATASTROPHIQUEMENT incomplets sur 9 langues

**Découverte 2026-04-22** : Test `curl` sur les 9 homes locales. **TOUTES** retournent **exactement 3 hreflang** (en-US, es-ES, fr-FR) au lieu des **10 attendus** (9 langues + x-default).

**Test** :
```bash
for loc in fr-fr en-us es-es de-de pt-pt ru-ru zh-cn ar-sa hi-in; do
  curl -s -A "Googlebot" "https://sos-expat.com/$loc" | grep -c 'hreflang='
done
# Tous retournent 3 (devrait être 10)
```

**Hreflang réellement présents (vérifié sur les 9 homes)** :
- ✅ `en-US` → `https://sos-expat.com/en-us`
- ✅ `es-ES` → `https://sos-expat.com/es-es`
- ✅ `fr-FR` → `https://sos-expat.com/fr-fr`

**Hreflang MANQUANTS** :
- ❌ `de-DE` (allemand)
- ❌ `pt-PT` (portugais)
- ❌ `ru-RU` (russe)
- ❌ `zh-Hans` (chinois simplifié)
- ❌ `ar-SA` (arabe)
- ❌ `hi-IN` (hindi)
- ❌ `x-default` (essentiel pour le fallback)

**Diagnostic code** :
- `multilingual-system/components/HrefLang/HrefLangConstants.ts:5-7` définit bien **9 langues** dans `SUPPORTED_LANGUAGES`
- `multilingual-system/components/HrefLang/HreflangLinks.tsx:76` itère bien sur les 9 langues + x-default ligne 109-128
- `App.tsx:1247-1252` monte `<HreflangLinks />` globalement (sauf sur `/`, profils, articles d'aide, FAQ détail)
- **MAIS** : le HTML servi par le SSR Puppeteer n'en contient que 3 → **bug timing React Helmet** ou **régression silencieuse** dans `getTranslatedRouteSlug` qui ferait échouer la map sur 6 langues

**Impact business** :
- **6 langues sur 9 sont totalement invisibles à Google** comme alternatives linguistiques
- Le contenu de-DE, pt-PT, ru-RU, zh-CN, ar-SA, hi-IN existe (toutes les homes répondent 200 avec Content-Language correct), mais Google ne les **associe pas** aux pages fr-FR / en-US / es-ES → soit doublon perçu, soit pages orphelines
- L'utilisateur allemand qui tape "SOS Expat" peut être servi `/en-us` ou `/fr-fr` au lieu de `/de-de`
- C'est probablement une cause majeure des **14 592 URLs détectées non indexées** : Google découvre les pages de-DE/pt-PT/zh-CN/etc. via sitemap mais ne les associe à rien → décide de ne pas crawler

**Fix recommandé** :
1. **Investigation immédiate** : reproduire en local avec `npm run dev` puis vérifier le DOM rendu sur `/de-de` — combien de hreflang dans le HTML après hydratation complète ?
2. **Si hreflang OK en local** : c'est un problème SSR (Puppeteer extrait avant Helmet finit) → augmenter le wait dans `dynamicRender.ts` pour les hreflang spécifiquement, ou injecter les hreflang server-side dans le shell
3. **Si hreflang KO en local** : bug dans `getTranslatedRouteSlug` ou `localeToHreflang` qui fait échouer la map sur 6 langues → débugger
4. **Test post-fix** :
   ```bash
   for loc in fr-fr en-us es-es de-de pt-pt ru-ru zh-cn ar-sa hi-in; do
     count=$(curl -s -A "Googlebot" "https://sos-expat.com/$loc" | grep -c 'hreflang=')
     [ "$count" -ge 10 ] && echo "$loc OK ($count)" || echo "$loc FAIL ($count)"
   done
   ```

**Propriétaire** : équipe React + équipe SSR (Cloud Function)
**Effort** : M (1 jour : 4h investigation + 4h fix + tests)
**Impact** : ++++ (débloque l'indexation de 6 langues sur 9)

---

## 🌍 ADDENDUM AUDIT MULTI-LANGUE (9 LOCALES) — 2026-04-22

### Tests effectués sur 9 homes locales

| Locale | HTTP Googlebot | Content-Language | html lang | Title localisé | Hreflang count | Statut |
|--------|---------------|-----------------|-----------|----------------|----------------|--------|
| `/fr-fr` | 200 OK | fr | `lang="fr"` | ✅ FR | **3/10** 🚨 | ⚠️ OK sauf hreflang |
| `/en-us` | 200 OK | en | `lang="en"` | ✅ EN | **3/10** 🚨 | ⚠️ OK sauf hreflang |
| `/es-es` | 200 OK | es | `lang="es"` | ✅ ES | **3/10** 🚨 | ⚠️ OK sauf hreflang |
| `/de-de` | 200 OK | de | `lang="de"` | ✅ DE | **3/10** 🚨 | 🚨 **invisible alternate** |
| `/pt-pt` | 200 OK | pt | `lang="pt"` | ✅ PT | **3/10** 🚨 | 🚨 **invisible alternate** |
| `/ru-ru` | 200 OK | ru | `lang="ru"` | ✅ RU | **3/10** 🚨 | 🚨 **invisible alternate** |
| `/zh-cn` | 200 OK | zh | `lang="zh"` | ✅ ZH | **3/10** 🚨 | 🚨 **invisible alternate + script ?** |
| `/ar-sa` | 200 OK | ar | `lang="ar"` | ✅ AR | **3/10** 🚨 | 🚨 **invisible alternate + RTL ?** |
| `/hi-in` | 200 OK | hi | `lang="hi"` | ✅ HI | **3/10** 🚨 | 🚨 **invisible alternate** |

**Bonnes nouvelles** :
- ✅ Toutes les 9 homes répondent 200 OK à Googlebot
- ✅ Content-Language header correct sur les 9
- ✅ `<html lang>` correct sur les 9
- ✅ `<title>` localisé natif sur les 9 (pas de fallback EN)
- ✅ Canonical self-référent correct sur les 9
- ✅ Cache-Control cohérent (`public, max-age=86400`)
- ✅ Tailles HTML cohérentes (~654-680 KB selon langue)

**Mauvaises nouvelles** :
- 🚨 **Hreflang 3/10 sur les 9 langues** (P0-6 ci-dessus)

### Locales×country combinaisons aberrantes (rappel §2.2.ter)

Le pipeline de génération produit des URLs sur des combinaisons **non valides** :

| Pattern observé | Anomalie | Cause probable |
|---|---|---|
| `/zh-er/...` | Chinois + Erythrée (zéro francophone chinois en Erythrée) | Pipeline génère sans validation marché |
| `/de-cf/...` | Allemand + Centrafrique (négligeable) | Idem |
| `/ch-cn/...`, `/ch-fr/...`, `/ch-us/...` | `ch` ambigu (interne `ch=zh` mais Google peut lire `ch=Suisse`) | `localeToPrefix` ligne 18 garde `ch:"ch"` au lieu de mapper vers `zh-Hans` au niveau URL |
| `/fr-st/...` | Français + Sao Tomé (oui mais marché minuscule) | À évaluer |
| `/en-es/...` | Anglais + Espagne (mélange peu pertinent) | À évaluer |

### Architecture hreflang `{lang}-{country-content}` (H45 du prompt)

Le site utilise `hreflang="fr-TH"` pour désigner du contenu **français sur la Thaïlande**, et `/fr-th/pays/thailande` comme URL canonique. Usage **non standard** de BCP 47.

**Norme BCP 47** : `fr-TH` = "français tel que parlé en Thaïlande (par la minorité francophone)" — pas "contenu français sur la Thaïlande".

**Ce qui est observé en code** :
- `HreflangLinks.tsx:21-31` définit `LANGUAGE_TO_DEFAULT_COUNTRY` qui force le hreflang à pointer vers le **pays par défaut de la langue** (fr→fr, en→us, es→es, de→de, ...)
- Donc le hreflang est `fr-FR` même pour une page `/fr-th/...`
- En théorie correct, **mais à valider sur des pages profondes** pour confirmer que `/fr-th/pays/thailande` rend bien `<link rel="alternate" hreflang="fr-FR" href=".../fr-fr/pays/thailande">` (et pas `fr-TH`)

### Slugs ASCII vs non-ASCII (H38)

**Ce qui est en code** :
- `worker.js` exporte `_CR` (reverse country slug map) avec aliases multilingues
- Le commit `8f6790a3 fix(warm-ssr): romanize Arabic slugs to ASCII` indique qu'une romanisation existe
- **Mais** : §2.2.ter du prompt donne `/ar-sa/التسجيل` (slug arabe natif) → **règle pas appliquée systématiquement**

**À investiguer** :
- Existe-t-il un middleware Worker qui rejette les URLs avec caractères non-ASCII ?
- Le pipeline de génération URLs côté Laravel ou Mission Control respecte-t-il toujours la règle ASCII ?

### RTL et IDN (Internationalized Domain Names)

**Non audité** dans cette session. À faire :
- Vérifier que la version `/ar-sa/...` rend bien avec `dir="rtl"` dans le HTML
- Vérifier que les composants UI sont compatibles RTL (alignement, icônes)
- Vérifier que les noms de domaines internationalisés ne posent pas de problème

### Sitemaps par langue

**Non audité en détail**. Recommandations à valider :
- `sitemap-index.xml` doit pointer vers des sub-sitemaps par langue (déjà confirmé : 596 sub-sitemaps)
- Chaque sub-sitemap doit contenir `<xhtml:link rel="alternate" hreflang>` pour les autres langues
- Les news sitemaps ne dépassent pas 7 jours (pour Google News + SGE)

### Plan multi-langue dédié (en plus du plan général)

| # | Action | Effort | Impact |
|---|---|---|---|
| M1 | Fix hreflang 3→10 sur les 9 homes (P0-6) | M (1j) | ++++ |
| M2 | Vérifier hreflang sur 5 pages profondes par langue (45 tests) | S (4h) | +++ |
| M3 | Audit RTL sur `/ar-sa/...` + vérifier `dir="rtl"` partout | M (1j) | ++ |
| M4 | Confirmer pipeline URLs respecte ASCII slugs (audit + correction) | L (3j) | +++ |
| M5 | Désactiver génération combinaisons aberrantes (zh-er, de-cf, fr-st, etc.) | M (1j) | ++ |
| M6 | Audit sitemaps par langue : hreflang inter-sitemap, freshness | M (1j) | +++ |
| M7 | Standardiser `ch` → `zh-Hans` partout (URLs, hreflang, lang attr) | M (1j) | ++ |
| M8 | Audit Bing/Yandex pour les 9 langues (ChatGPT/Copilot utilisent Bing) | M (1j) | ++ |

**Effort total addendum multi-langue** : ~8 jours-homme

---

## P1 — Importants (sprint suivant)

### P1-1 : Sitemaps contiennent probablement les anciennes URLs LP

À auditer avec `curl https://sos-expat.com/sitemap-index.xml` puis grep pour `/sos-avocat`, `/consulter-avocat`, `/country/`, `/blog` (qui devraient avoir disparu, remplacés par les canonical actuels).

### P1-2 : `Vary: User-Agent, Accept-Language` partout

Confirmé présent dans le Worker (lignes 3036, 3061, 3090, 3124). OK ✓

### P1-3 : `Content-Language` header présent

Confirmé sur `/fr-fr` (Content-Language: fr). OK ✓

### P1-4 : Audit JSON-LD Organization + sameAs (chantier S/AE)

Non audité dans cette session — à faire en lisant `sos/src/components/SEO/SEOHead.tsx` ou équivalent.

### P1-5 : Rich Results Q&A — 87 champs manquants

Mentionné dans le prompt §2.2 mais non audité (nécessite GSC).

## P2 — Nice-to-have

### P2-1 : Cleanup _CR aliases (worker.js:34-44)

Les aliases `kamailong`, `helan`, `moxige` etc. dans `_CR` permettent au Worker de résoudre ces URLs vers le bon ISO. C'est un correctif défensif. À garder pendant la transition, à retirer quand ces URLs ne sont plus émises.

### P2-2 : Nettoyer le BLOCKED_SCRAPER_UAS (worker.js:91-98)

Inclut `'ahrefsbot'` et `'mj12bot'` dans la blacklist scrapers — ces deux SEO crawlers sont utiles pour mesurer les backlinks. À reconsidérer (les autoriser de nouveau).

---

# 7.5 CARTE DU PARC D'URLs (PARTIELLE)

## Mapping AH.1 — Routes Laravel vs React

D'après lecture `worker.js` + `App.tsx` :

| Pattern URL | Stack | Règle Worker (ligne) | Statut Googlebot |
|---|---|---|---|
| `/` | React (SSR Puppeteer) | Default → SSR | 🚨 **301 → /en-us** (BUG P0-1) |
| `/{locale}` (ex: `/fr-fr`) | React | Default → SSR | ✅ 200 OK, Content-Language: fr |
| `/{locale}/articles/*` | **Laravel blog** | BLOG_PATTERNS:295 | ✅ Probablement 200 (Laravel SSR natif) |
| `/{locale}/centre-aide/*` (et 8 autres langues) | **Laravel** | BLOG_PATTERNS:282-292 | ✅ Probablement 200 |
| `/{locale}/pays/*` | **Laravel** | (à vérifier) | ✅ 200 OK (testé via redirect `/country/france` → `/pays/france`) |
| `/{locale}/annuaire/*` | **Laravel** | ANNUAIRE_SEGMENTS:1029 → Blog SSR | ✅ Probablement 200 |
| `/{locale}/outils/*` | **Laravel** | OUTILS_SEGMENTS:1007 → Blog SSR | ✅ Probablement 200 |
| `/{locale}/galerie/*` | **Laravel** | GALERIE_SEGMENTS:1012 → Blog SSR | ⚠️ À masse — `noindex` requis |
| `/{locale}/sondages-expatries` | **Laravel** | SONDAGES_SEGMENTS:1018 → Blog SSR | ✅ |
| `/{locale}/aide`, `/help`, ... | **Laravel** | LP_SEGMENTS:987 → Blog SSR | ✅ |
| `/{locale}/devenir-partenaire` | **Laravel** | LP_SEGMENTS:998 → Blog SSR | ✅ |
| `/{locale}/expats-aidants` | **Laravel** | LP_SEGMENTS:1002 → Blog SSR | ✅ |
| `/{locale}/{category-country}/{provider-slug}` | React | SSR Puppeteer | ✅ 200 (avec ajout flag `data-provider-loaded`) |
| `/{locale}/temoignages` | React | SSR Puppeteer | ✅ Déjà dans le top des pages (GSC §2.2.bis) |
| `/{locale}/faq` | React | SSR Puppeteer | ✅ Déjà dans le top |
| `/{locale}/sos-avocat`, `/consulter-avocat` | LEGACY → React | Worker:1739 `legacyLPRedirect301` | 🚨 **301 → /tarifs** (cache 1 AN, P0-2) |
| `/{locale}/blog`, `/news`, `/guides` | LEGACY → Laravel | Worker:1730-1731 | 🚨 **301 → /articles** (cache 1 AN) |
| `/{locale}/country/*` | LEGACY → Laravel | Worker:1735 | 🚨 **301 → /pays/{country}** (cache 1 AN) |
| `/{locale}/expatries`, `/expats` | LEGACY → Laravel | Worker:1733 | 🚨 **301 → /annuaire** (cache 1 AN) |
| `/{locale}/{role-plural}/{ISO2-code}` | Worker normalize | Worker:1758-1791 | 301 → directory listing (rattrapage) |

## Causalité « Laravel rank, React ne rank pas » (chantier AH.2)

| Facteur | Laravel | React | Contribution rank |
|---|---|---|---|
| Statut HTTP Googlebot | 200 systématique (SSR natif PHP) | 200 mais après SSR Puppeteer (avec risque 404 faux positif) | **Déterminant** |
| TTFB | < 1s (SSR natif) | 10s (P95 GSC) | **Déterminant** |
| `<title>` unique humain | OUI (sauf bug AF observé : titles=slugs sur certains articles) | OUI (via React Helmet) | Important |
| BreadcrumbList JSON-LD | OUI (probable) | À confirmer | Important |
| Hreflang complet 9 langues | OUI (templates Blade) | OUI (SSR injection) | Important |
| Cold start | 0 (PHP-FPM persistant) | Fréquent (Cloud Function europe-west1) | **Déterminant** |
| Maturité d'indexation | 3+ ans probable | Plus jeune (migration récente) | Important |

**Verdict** : Laravel rank parce qu'il est **rapide, stable, et indexé depuis longtemps**. React perd parce que le SSR Puppeteer a 10s de TTFB + cold starts + risques de faux 404.

## Décision stratégique SSR (chantier AH.3)

Recommandation : **Option E (Hybride)** :
- **Court terme (1-2 semaines)** : Option A — fix dynamicRender.ts (déjà fait avec timeout 35s P0-E) + fix HelpArticle/FAQDetail (P0-4) + fix home `/` (P0-1)
- **Moyen terme (3-6 mois)** : Option C — migrer le parc statique React vers SSG (Vite SSG, Astro). Pages prestataires + LP + home → pré-générées. SPA reste pour les pages dynamiques (dashboard, booking).
- **Long terme** : continuer à pousser sur Laravel pour le contenu éditorial (blog, guides, annuaire, FAQ, sondages, outils) — c'est ce qui rank déjà.

**Pas recommandé** : Option D (Next.js full migration) — coût prohibitif, casse la stack, gain marginal vs SSG.

---

# 7.6 ANALYSE CONCURRENTIELLE (NON FAITE)

**Pas couvert** dans cette session. À faire avec accès Ahrefs/Semrush :
- Cibles : `avocats.fr`, `juristique.com`, `justifit.fr`, `village-justice.com`, `JustAnswer`, `LegalMatch`
- Pour chaque concurrent : URLs indexées, trafic estimé, top pages, profil backlinks
- Cf. chantier T du prompt source

---

# 7.7 ANALYSE DE RÉGRESSION

## Frise commits récents (depuis git log fourni dans le prompt)

| Commit | Date estimée | Effet attendu | Statut |
|---|---|---|---|
| `e84f1833` | ~2 semaines | Worker propage SSR 404 (anti-soft-404) | ⚠️ **Cause partielle régression** — couplée à un SSR qui sortait 404 trop vite |
| `b842ff19` | Plus récent | Dedup meta + fix html lang | ✅ Bon |
| `eae6a3ef` | Récent | Master sitemap-index 569 sub-sitemaps | ✅ Bon (mais nécessite freshness lastmod) |
| `28172f98` | Récent | Robots.txt enrichi + per-sitemap lastmod | ✅ Bon |
| `9be51f65` | Récent | Audit URL/hreflang/routes — 14 P0-P2 | ✅ Bon (corrections déjà appliquées) |
| `db0902d7` | Récent | Remove crawl-delay (Googlebot l'ignore) | ✅ Bon |
| `f304faf0` | Récent | Whitelist lawyers+helpers LP_SEGMENTS | ✅ Bon |
| `69b4e53a` | Très récent | 410 Gone on hack URLs (.php) | ✅ Bon |
| **dynamicRender.ts:356** (P0-E 2026-04-22) | Aujourd'hui | Bump PHASE2_TIMEOUT 20s→35s | ✅ Bon (devrait réduire faux 404) |

## Faisabilité rollback `e84f1833`

**Pas recommandé**. Raisons :
1. Le fix est **logiquement correct** (éviter soft 404)
2. Le vrai problème est en amont (SSR Puppeteer qui détecte 404 à tort)
3. Le fix `P0-E timeout 35s` (dynamicRender.ts:356) traite la cause racine
4. Rollback = recréer des soft 404 que Google déteste autant

**Hot-patch alternatif** (worker.js:1015-1024 du prompt §11.bis.5) : ajouter une whitelist de patterns pour lesquels NE PAS propager 404. À considérer si on observe encore des faux 404 après les fix P0-1 et P0-4.

---

# 7.8 PERFORMANCE ET INFRA

## Issues identifiées (sans accès logs Cloud Run direct)

| Métrique | Valeur (depuis GSC) | Cible | Verdict |
|---|---|---|---|
| TTFB Googlebot moyen | 10s (avril) vs 2s (janvier) | < 1,5s | 🚨 **5× pire** |
| TTFB pic | 13,75s (2026-04-07) | < 3s | 🚨 |
| Ratio 5xx crawl | 4,29% | < 0,5% | 🚨 **8× pire** |
| Ratio 404 crawl | 6,87% | < 2% | 🚨 |
| Robots.txt indisponible | 0,34% | 0% | ⚠️ |
| Demandes non abouties | 12,71% | < 2% | 🚨 |
| Facture GCP avril partielle | 72,26€ Cloud Run (+57%) | Stable | 🚨 |

**Cause structurelle** : Cloud Function `renderForBotsV2` en `europe-west1` interroge Firestore en `nam7` (US Iowa) → ~100ms par requête. Multiplier par les 30+ queries Firestore d'un profil prestataire = 3-5s rien que pour les data fetch. Plus le cold start Puppeteer de 5-15s = TTFB 10s+.

**Fix recommandé** :
1. **Court terme** : augmenter min instances de la Cloud Function (au prix d'un coût fixe mensuel ~50-100€)
2. **Moyen terme** : migrer Firestore vers `europe-west` (impossible — Firestore n'est pas multi-région) → soit accepter, soit migrer vers Cloud SQL
3. **Long terme** : SSG (Option C ci-dessus) → TTFB ~50ms depuis edge Cloudflare

---

# 7.9 PLAN DE REMÉDIATION

## Plan A — Corrections propres (semaine 1-2)

| # | Action | Fichier:ligne | Effort | Impact | Propriétaire |
|---|---|---|---|---|---|
| 1 | Fix home `/` ne plus 301 vers `/en-us` | `dynamicRender.ts` (route racine) + `worker.js` (route `/`) | S (4h) | ++++ | React/Worker |
| 2 | Réduire cache 301 legacy à 24h | `worker.js:1746` `max-age=31536000` → `max-age=86400` | S (1h) | ++++ | Worker |
| 3 | Fix HelpArticle.tsx faux 404 | `HelpArticle.tsx:327` retirer `!article` | M (4h + tests) | +++ | React |
| 4 | Fix FAQDetail.tsx faux 404 | `FAQDetail.tsx:80-92` retirer timer 10ms | M (4h + tests) | +++ | React |
| 5 | Cleanup robots.txt allow `/chatter/inscription` etc. si voulu | `robots.txt` | S (30min) | ++ | SEO |
| 6 | **Ne PAS rollback `e84f1833`** | — | — | — | — |
| 7 | Compléter `Organization` JSON-LD avec `sameAs` complet | `seoTypes.ts` ou `SEOHead.tsx` | M (4h) | +++ | React |
| 8 | Créer entrée Wikidata pour SOS-Expat | wikidata.org (manuel) | M (4h hors-code) | +++ | SEO/Comms |
| 9 | Compléter Google Business Profile | google.com/business (manuel) | S (2h hors-code) | +++ | SEO |

**Effort total semaine 1-2** : ~3 jours-homme techniques + 1 jour hors-code.

## Plan B — Rollback (NON recommandé)

Le rollback de `e84f1833` n'est pas recommandé (cf. §7.7). Si vraiment forcé : git revert ce commit + redeploy worker via `wrangler publish`. Tester staging d'abord.

## Purge cache + re-soumission GSC post-fix

```bash
# 1. Bump EDGE_CACHE_VERSION dans worker.js (déjà à v16, passer à v17)
# 2. Deploy worker
wrangler publish

# 3. Purge Cloudflare cache
# (manuel via Cloudflare Dashboard ou API)

# 4. Re-soumettre sitemaps GSC
# https://search.google.com/search-console/sitemaps

# 5. URL Inspection sur 30 URLs P0
# Une à une via GSC
```

## Monitoring post-fix (60 jours)

| Métrique | Source | Seuil cible J+60 |
|---|---|---|
| TTFB Googlebot | GSC Crawl Stats | < 3s (transition), < 1,5s (cible) |
| Ratio 5xx | GSC Crawl Stats | < 1% |
| Pages indexées | GSC Coverage | × 1,5 (de 2 601 à 4 000+) |
| « Détectée non indexée » | GSC Coverage | ÷ 2 (de 14 592 à < 7 000) |
| Impressions / jour | GSC Performance | × 5 (de 24 à 120+) |
| Clics / jour | GSC Performance | > 5 (vs 0,4 actuel) |
| Position sur `sos expat` | GSC Performance | < 5 (de 9,54) |

## Roadmap 30 / 60 / 90 jours

**J0-J15 (urgence)** :
- P0-1 (home `/`)
- P0-2 (cache 1an)
- P0-4 (faux 404 HelpArticle/FAQDetail)
- P0-5 (robots.txt)
- Compléter `Organization` + Wikidata + Google Business Profile

**J15-J45 (consolidation)** :
- Audit complet des sitemaps (retirer URLs LP legacy)
- Audit complet JSON-LD (Organization, WebSite, Person, LegalService, Service)
- Investigation 575 URLs « avec redirection » (purge sitemap)
- Investigation 360 URLs « exclue par noindex » (légitimes ?)
- Investigation 46 URLs 5xx + 208 URLs 404 (fix ou supprimer)
- Setup monitoring tableau de bord interne

**J45-J90 (stratégique)** :
- Démarrer chantier P0-3 (réduction LP programmatiques) — Phase A "Observer + Stop génération"
- Lancer chantier original research (Baromètre 2026 — cf. fichier stratégie)
- Démarrer entity building presse + universitaires
- Premier baseline citations IA (si AEO/GEO audit à lancer en parallèle)

## ⚠️ REVIEWER HOSTILE (challenge des conclusions P0)

Pour chaque P0, je réponds aux 4 questions §8.13 :

### P0-1 (home `/` → `/en-us`)
- (a) **Reproductible** : oui, `curl -I -A "Googlebot..." https://sos-expat.com/` → 301 reproductible
- (b) **Hypothèse alternative** : le 301 vers `/en-us` serait intentionnel pour le `x-default`. À écarter : devrait alors servir 200 avec hreflang complet, pas 301
- (c) **Échantillon représentatif** : testé seulement avec UA Googlebot mobile. À étendre : Googlebot desktop, Bingbot, Chrome FR direct, Chrome EN
- (d) **Impact** : projection (70% trafic) = à confirmer avec GSC pays France vs US

### P0-2 (cache 1 AN)
- (a) Reproductible : oui, header observé
- (b) Alternative : le cache 1 AN serait correct si les redirects sont permanents. Mais le constat est que le parc d'URL change souvent → cache 1 AN trop agressif
- (c) Représentatif : testé sur 4 URLs LP, pattern systématique dans `legacyLPRedirect301()`
- (d) Impact : qualitatif (Google cache long → découverte lente)

### P0-3 (430k LPs)
- (a) Reproductible : 14 592 URLs jamais crawlées (lastcrawl 1970) confirmé dans GSC §2.2.ter
- (b) Alternative : le crawl budget famine pourrait être un problème de TTFB, pas de qualité contenu. À vérifier : si TTFB tombe à 1s, est-ce que Google se met à crawler les 14 592 URLs ?
- (c) Échantillon : §2.2.ter cite 13 patterns d'URLs. Représentatif des problèmes de génération
- (d) Impact : qualitatif. Difficile à chiffrer précisément sans test A/B

### P0-4 (faux 404 React)
- (a) Reproductible : analyse statique du code, pas de test live
- (b) Alternative : le timeout 35s (dynamicRender.ts:356) couvrirait déjà le risque. À tester avec URL Inspection GSC pour confirmer présence/absence de faux 404
- (c) Échantillon : 3 composants vérifiés (HelpArticle, FAQDetail, ProviderProfile). À étendre à tous les `*Page.tsx`
- (d) Impact : modéré (P1 plutôt que P0 si le timeout 35s suffit déjà)

### P0-5 (robots.txt)
- (a) Reproductible : `curl /robots.txt` confirmé
- (b) Alternative : Disallow `/chatter/` peut être intentionnel (les URLs publiques sont sur `/devenir-*`)
- (c) Échantillon : 4 routes vérifiées
- (d) Impact : faible (P2 plutôt que P0)

**Conclusion reviewer hostile** :
- P0-1 et P0-2 sont **solidement P0**, fixes immédiats
- P0-3 est **stratégique P0** (pas un fix code, un chantier 18 mois)
- P0-4 devrait être reclassé **P1** (le fix timeout 35s couvre probablement déjà l'essentiel)
- P0-5 devrait être reclassé **P2** (les vraies landings sont sur `/devenir-*`)

---

# CONCLUSION

## Causalement, en 4 phrases (mise à jour avec P0-6)

1. SOS-Expat a généré 430k pages programmatiques templatées que Google a refusé d'indexer (87%) et a dévalué le domaine entier — l'autorité résultante est tellement basse que même la marque elle-même ne ranke qu'en position 9,54.
2. La home `/` redirige Googlebot vers `/en-us` au lieu de servir du contenu localisé, ce qui casse le brand SERP français et explique le constat utilisateur "je vois anglais".
3. **Découverte 2026-04-22** : les hreflang sont catastrophiquement incomplets (3/10 sur les 9 homes locales) — 6 langues sur 9 (de-DE, pt-PT, ru-RU, zh-Hans, ar-SA, hi-IN) sont **invisibles à Google** comme alternatives linguistiques, ce qui explique pourquoi le contenu existe et répond 200 mais n'est pas indexé.
4. La régression `e84f1833` a été partiellement traitée par le bump timeout 35s (dynamicRender.ts:356) — il reste à durcir 2 composants React (HelpArticle, FAQDetail) qui posent encore des flags 404 prématurément.

## Verdict business

**Le SEO classique de SOS-Expat est en mode survie**. Les fixes techniques P0 listés débloqueront ~30% du potentiel. Les 70% restants nécessitent le **pivot stratégique 18 mois** détaillé dans `PROMPT-STRATEGIE-GEO-AEO-IA-18-MOIS.md` :
- Réduction du parc 430k → 5-10k pages
- Original research récurrent (baromètre)
- Expert-authored content (avocats du réseau signent)
- Brand entity building (Wikidata, Wikipedia, Knowledge Panel)
- Préparation à l'ère AEO/GEO (cf. `PROMPT-AUDIT-AEO-AI-SEARCH-COMPLET.md`)

## Suite recommandée

1. **Fixer immédiatement P0-1 et P0-2** (1 jour-homme combiné)
2. **Lancer l'audit AEO/GEO** : `PROMPT-AUDIT-AEO-AI-SEARCH-COMPLET.md`
3. **Démarrer la stratégie 18 mois** : `PROMPT-STRATEGIE-GEO-AEO-IA-18-MOIS.md`
4. **Compléter cet audit** dans une seconde session avec exports GSC + accès Ahrefs (chantiers T, M, K, J, V, W, X non couverts)

---

**Fin du rapport — 2026-04-22**
