# MISSION — Audit SEO / Indexation / Ranking / Crawl / Brand SERP end-to-end de sos-expat.com (v3)

Tu es un ingénieur SEO + plateforme senior. Je te confie un audit de production **sans angle mort, en profondeur extrême**. Objectif : être **certain à 100 %** de pourquoi `sos-expat.com` reste quasiment invisible sur Google malgré une indexation qui monte, pourquoi 87 % des URLs découvertes sont rejetées par Google, pourquoi un utilisateur français en France voit la home en anglais, et **quand on tape littéralement `sos-expat.com` dans Google, pourquoi seule la home ressort**.

Tu auditeras **toute la chaîne** : DNS → Cloudflare Worker → SSR Firebase Function Puppeteer → SPA React → sitemaps → hreflang → canonicals → robots.txt → cache edge → qualité de contenu → maillage interne → E-E-A-T → Core Web Vitals → brand SERP → concurrence → GSC signals. Rien ne doit être survolé. Rien ne doit être supposé — **tout doit être mesuré**.

Les hypothèses ci-dessous sont à traiter comme des **suspects**, pas comme des faits. À la fin, **un reviewer hostile doit challenger chaque conclusion**.

---

## 0. North Star business (rappel critique)

Le SEO n'est **pas le but**. Le but, c'est : consultations payantes, inscriptions prestataires, inscriptions affiliés. L'indexation, le ranking, les impressions, les clics ne sont que des étapes vers ce but. Quand tu priorises les fix, pondère toujours par **contribution business attendue**, pas par masse d'URLs.

---

## 0.1 Exports à demander à l'utilisateur en amont (bloqueurs sans ça)

Avant de commencer l'audit, l'utilisateur doit fournir :

| # | Fichier | Où le trouver | Bloqueur ? |
|---|---|---|---|
| 1 | Export GSC Performance (90 j, requêtes + pages + CTR + position) | GSC → Performance → Export → CSV | **Oui** — sans ça, impossible de répondre à « pourquoi je ne ressors pas » |
| 2 | Export détaillé des 14 592 URLs « Détectée, actuellement non indexée » | GSC → Couverture → clic ligne → Export → CSV | **Oui** — sinon on devine les patterns |
| 3 | Export des 208 URLs « Introuvable (404) » | idem | Oui |
| 4 | Export des 46 URLs « Erreur serveur 5xx » | idem | Oui |
| 5 | Export des 360 URLs « Exclue par noindex » | idem | Oui |
| 6 | Export des 575 URLs « Page avec redirection » | idem | Oui |
| 7 | Export des 664 + 557 + 61 URLs avec problèmes canonical | idem | Oui |
| 8 | GSC URL Inspection Live Test sur 30 URLs représentatives | GSC → URL Inspection → Live Test (captures rendu + HTML) | Oui |
| 9 | Logs Cloudflare Access (si souscrit) | Cloudflare dashboard → Logs → Export | Fortement recommandé |
| 10 | Logs Cloud Run `renderForBotsV2` (durée P95/P99, erreurs, timeouts) | GCP Console → Cloud Run → Logs | Fortement recommandé |
| 11 | Logs Firebase Functions complets 30 j | GCP Logging explorer | Fortement recommandé |
| 12 | Profil backlinks Ahrefs / Semrush / Majestic (RefDomains, RefPages, DR/TF) | Dashboard de l'outil → Export | Fortement recommandé |
| 13 | Accès PageSpeed Insights + CrUX data pour 20 URLs | gratuit | Non bloqueur, à faire dans l'audit |
| 14 | Rapport GA4 (sessions organic Google 90 j par page / pays / langue) | GA4 → Explore → Export | Recommandé |
| 15 | Liste des requêtes cibles business prioritaires | À fournir par l'utilisateur (mots-clés à viser) | Recommandé |
| 16 | Accès Screaming Frog ou Sitebulb pour crawl exhaustif | à installer | Recommandé |

**Si certains exports ne sont pas fournis, indique-le dans le rapport et propose la procédure manuelle plutôt que de supposer.**

---

## 0.2 Glossaire des statuts GSC (pour éviter les confusions)

| Statut GSC | Signification | Peut-elle générer du trafic ? |
|---|---|---|
| **Indexée** | URL dans l'index Google | Oui, mais pas garanti |
| **Impressions** | URL affichée au moins une fois dans une SERP (même en position 50) | Indicateur d'existence dans l'index ET d'au moins un matching avec une requête |
| **Clics** | Utilisateur a cliqué depuis une SERP | Vrai trafic |
| **Détectée, actuellement non indexée** | Google connaît l'URL (sitemap / maillage) mais a choisi de ne pas l'indexer | Non |
| **Explorée, actuellement non indexée** | Google a fetch + rendu la page, puis l'a jugée pas assez précieuse pour l'indexer | Non |
| **Exclue par noindex** | Page retournée avec meta/header noindex | Non |
| **Page en double sans URL canonique sélectionnée** | Google voit un doublon et le référencement « propre » n'est pas indiqué | Non |
| **Autre page avec balise canonique correcte** | Le canonical pointe vers une autre URL, donc celle-ci n'est pas indexée | Non (c'est l'URL canonique qui l'est) |
| **Google n'a pas choisi la même canonique que vous** | Googlement a overridé ton canonical | Non |
| **Introuvable (404)** | URL retourne 404 | Non |
| **Erreur serveur 5xx** | URL a retourné une erreur serveur | Non, et ça dégrade la confiance du site |
| **Soft 404** | URL retourne 200 mais contenu ressemble à une 404 | Non |

**Indexation ≠ ranking ≠ trafic**. Une URL indexée peut ne jamais générer une impression (position > 100 sur toutes les requêtes). Le vrai problème du site est **à la fois** une mauvaise indexation (87 % rejet) ET un mauvais ranking (2601 indexées → 24 impressions/jour max).

---

## 1. Contexte business et technique

- **Site** : `https://sos-expat.com`, 9 langues (fr, en, es, de, pt, ru, zh, ar, hi), ~197 pays.
- **Produit** : mise en relation en < 5 min avec avocats et experts locaux pour expatriés / voyageurs (YMYL juridique + conseil).
- **Stack** :
  - Front React/Vite SPA déployée sur Cloudflare Pages (auto-deploy GitHub).
  - Edge : Cloudflare Worker (`sos/cloudflare-worker/worker.js`) — routing, bot detection, cache, redirects, 410 Gone, locales legacy.
  - SSR bots : Firebase Cloud Function `renderForBotsV2` basée Puppeteer (`sos/firebase/functions/src/seo/dynamicRender.ts`), région `europe-west1`.
  - Blog : Laravel séparé, sitemaps fusionnés via master sitemap-index.
  - Data : Firestore `nam7` (US Iowa).
- **Contenus indexables** : home par locale, annuaire, programme, CGU, aide, about, profils prestataires `/{locale}/{category-country}/{slug}`, articles blog `/{locale}/articles/{slug}`, LP programmatiques (`consulter-avocat`, `sos-avocat`, `sos-avocat-{country}`, `avocat-{country}`, `country/{country}`, `expatries`, `aide`, `help`, `guides`, `news`, `blog`).
- **Échelle théorique** : 9 langues × ~200 pays × N templates + ~430 000 articles par campagne.
- **Repo** : `C:\Users\willi\Documents\Projets\VS_CODE\sos-expat-project`, branche `main`.

---

## 2. Symptômes observés (faits bruts à reconfirmer)

### 2.1 Constat utilisateur
> « Quand je tape `sos-expat.com` dans Google, je ne vois que la home. Pourtant j'ai ~2600 pages indexées et la semaine dernière on en a gagné +600. Et je suis français en France, je vois le site en anglais. »

### 2.2 Données GSC chargées dans l'audit

**Rapport Coverage GSC (2026-01-22 → 2026-04-17)** – timeseries `Date,Non indexées,Dans l'index,Impressions` :

| Date | Non indexées | Dans l'index | Impressions |
|---|---|---|---|
| 2026-01-24 | 77 | 93 | 0 |
| 2026-02-18 | 2013 | 148 | 2 |
| 2026-03-25 | 4712 | 351 | 2 |
| 2026-04-01 | 7865 | 923 | 7 |
| 2026-04-07 | 10560 | 1487 | 13 |
| 2026-04-11 | 14522 | 2073 | 6 |
| 2026-04-14 | 17326 | **2601** | 20 |
| 2026-04-17 | 17326 | 2601 | 24 |

- Indexation monte ✅ (93 → 2601 en 3 mois).
- Non-indexées explosent 🚨 (77 → 17326). **87 % des URLs découvertes ne sont PAS indexées**.
- Impressions **dérisoires** : max 24/jour pour 2601 pages indexées (≈ 0,009 imp/page/j). **Problème de ranking, pas que d'indexation**.

**Rapport Coverage GSC — Problèmes critiques (2026-04-22)** :

| Raison | Pages |
|---|---|
| **Détectée, actuellement non indexée** | **14 592** |
| Autre page avec balise canonique correcte | 664 |
| Page avec redirection | 575 |
| Page en double sans URL canonique sélectionnée | 557 |
| Exclue par balise `noindex` | 360 |
| Explorée, actuellement non indexée | 251 |
| Introuvable (404) | 208 |
| Page en double : Google n'a pas choisi la même URL canonique | 61 |
| Erreur serveur (5xx) | 46 |
| Soft 404 | 8 |
| Erreur liée à des redirections | 3 |
| Bloquée en raison d'un autre problème 4xx | 1 |

**Rapport Crawl Stats GSC (2026-04-20)** :

- Temps de réponse moyen : **Jan ~2 s → Avril ~10 s**, pic **13,75 s** le 2026-04-07.
- Host sos-expat.com statut : **« Problèmes par le passé »**.
- Ratios de réponse :
  - OK 200 : 79,17 %
  - 301 : 7,94 %
  - 404 : 6,87 %
  - **5xx : 4,29 %** (seuil Google ~1 %)
  - Autre 4xx : 1,19 %
  - **robots.txt indisponible : 0,34 %**
- Objectifs : Actualisation 73,6 % / Découverte 26,4 %.
- Bots : Smartphone 45,9 % / Page resources 44,94 % / Desktop 3,48 %.
- Types fichiers : HTML 39,43 % / JavaScript 33,62 % / **12,71 % demandes non abouties**.

**Rapports Rich Results** :
- FAQ : 264 valides, 0 invalides.
- Review snippets : 9 valides.
- Datasets : 3 valides.
- Q&A : 31 valides + **87 champs manquants**.
- **Image metadata : 0 valides, 4 problèmes**.

**Facture GCP avril partielle** : Cloud Run Functions 72,26 € (**+57 %** vs période précédente) → charge SSR Puppeteer explose.

### 2.2.bis Rapport GSC **Performance on Search** (90 j, chargé dans l'audit)

**Top requêtes** (toutes sur 90 jours) :

| Requête | Clics | Impressions | CTR | Position |
|---|---|---|---|---|
| `sos-expat.com` | 9 | 86 | 10,47 % | 2,08 |
| `sos expat` | 7 | 61 | 11,48 % | **9,54** |
| `expat-palvelut` | 0 | 13 | 0 % | 83,08 |
| `("eritel")` | 0 | 12 | 0 % | 1,08 |
| `can i open a bank account in norway` | 0 | 9 | 0 % | 66 |
| `norwegian bank account` | 0 | 9 | 0 % | 71,11 |
| `assistance expatrié` | 0 | 3 | 0 % | **29** |
| `expat influencers` | 0 | 3 | 0 % | 41 |
| `support expats` | 0 | 2 | 0 % | 86,5 |
| `english speaking lawyers in france` | 0 | 2 | 0 % | **97,5** |
| `expat news` | 0 | 2 | 0 % | 89,5 |
| `expat newsletter` | 0 | 2 | 0 % | 95 |
| `expat support services` | 0 | 2 | 0 % | 94,5 |

**Verdict brutal** :
- **Le site ne rank QUE sur sa propre marque**. Toutes les requêtes business sont en position 29 à 99.
- **Pos 9,54 sur `sos expat`** → même sa marque n'est pas dominée (norme : pos 1-2 sur sa propre marque).
- Requêtes réellement business : `assistance expatrié` pos 29, `english speaking lawyers in france` pos 97, `expat support services` pos 94 → quasi-invisible.
- **33 clics totaux en 90 jours** pour 2 601 pages indexées. La home fait 23/33 = 70 % des clics.
- Pollution avec des requêtes étrangères non pertinentes (Finnois `expat-palvelut`, `("eritel")` — spam query) qui rankent par hasard sur des contenus périphériques.

**Top pages (clics)** :
| Page | Clics | Imp | CTR | Position |
|---|---|---|---|---|
| `/` (home) | 23 | 236 | 9,75 % | 10,9 |
| `/fr-fr/temoignages` | 3 | 9 | 33,33 % | 6,44 |
| `/en-us` | 1 | 17 | 5,88 % | 17,47 |
| `/testimonials` | 1 | 14 | 7,14 % | 5,71 |
| `/fr-fr/faq` | 1 | 8 | 12,5 % | 4,5 |
| `/fr-fr/presse` | 1 | 7 | 14,29 % | 4,71 |
| `/fr-fr` | 1 | 6 | 16,67 % | 1,67 |

**Pays** :
| Pays | Clics | Impressions | Position |
|---|---|---|---|
| France | 17 | 138 | 7,34 |
| Sénégal | 12 | 32 | 4,47 |
| Royaume-Uni | 1 | 27 | 62,78 |
| Inde | 1 | 15 | 3,2 |
| Cameroun | 1 | 7 | 6,43 |
| Côte d'Ivoire | 1 | 6 | 2,33 |
| États-Unis | 0 | 139 | 22,53 |
| Finlande | 0 | 13 | 83,08 |

**Devices** :
| Device | Clics | Impressions | CTR |
|---|---|---|---|
| Desktop | 20 | 357 | 5,6 % |
| Mobile | 12 | 71 | 16,9 % |
| Tablet | 1 | 2 | 50 % |

**Anomalie mobile-first** : Googlebot crawl mobile 45,9 % mais l'index sert 5× plus d'impressions desktop (357 vs 71). Mauvais signe pour le mobile-first indexing.

### 2.2.ter Rapport GSC **Coverage Drilldown** — 14 592 URLs « Détectée, actuellement non indexée » (chargé dans l'audit)

**Fait majeur** : **TOUTES ces 14 592 URLs ont `Dernière exploration = 1970-01-01`** — autrement dit Google ne les a **JAMAIS crawlées**. Il les a juste découvertes (sitemap / maillage) puis a décidé de ne pas les fetch.

**Échantillon de patterns observés dans le drill-down** :
```
/ar-ad/maqalat/fkdt-goaz-sfry-fy-andora-dlyl-asasy-2026
/ar-fr/alhayat-fi-alkhaarij/al-bnyh-al-thtyh-al-talymyh-fy-frnsa-2026
/ar-it/alduwl/italiya
/ar-sa/alwusum/comparatif
/ar-sa/alwusum/expatriation-dubai-2026
/ar-sa/dalil/aruba
/ar-sa/maarad/sos-expat-editorial-visual-china-chinese-landscape-004-ar
/ar-sa/muhami-alemarat/layla-cons-achats--72cbhq
/ar-sa/muhamun/kn
/ar-sa/muhamun/km
/ar-sa/muhamun/mh
/ar-sa/muhamun/st
/ar-sa/التسجيل   ← arabe non romanisé (!!)
```

Patterns détectés :
- Codes pays à 2 lettres utilisés comme slug : `/kn`, `/km`, `/mh`, `/st`, `/tc` — slugs hyper-courts non interprétables.
- Pages « tags » massivement générées : `/ar-sa/alwusum/*` (tags en arabe).
- Pages « gallery » listées comme pages HTML : `/ar-sa/maarad/sos-expat-editorial-visual-*-*-*-*`.
- Slugs romanisés douteux : `fkdt-goaz-sfry-fy-andora-dlyl-asasy-2026`, `al-bnyh-al-thtyh-al-talymyh-fy-frnsa-2026`.
- **URLs non-romanisées qui traînent** (`/ar-sa/التسجيل`) — en contradiction avec la mémoire projet « slugs ASCII only ».

**Observation critique** dans `sos-expat.com-Performance-on-Search-2026-04-22/Pages.csv` — URLs qui ressortent dans la SERP mais avec des **combinaisons locale×country aberrantes** :
```
/zh-cn/minglu/egypte           ← locale zh-cn mais slug « egypte » (FR)
/zh-er/minglu/eritrea          ← locale « zh-er » (zh+Erythrée) n'existe pas
/de-cf/verzeichnis/…           ← locale « de-cf » (allemand+Centrafrique) improbable
/de-bi/verzeichnis/burundi
/ch-cn                          ← « ch-cn » ambigu (Suisse+Chine ? Charmorro ? Chinois+Chine ?)
/ch-fr, /ch-us
/fr-us/inscription              ← français aux US (légitime mais rare)
/fr-st/outils                   ← locale « fr-st » (?)
/en-es/living-abroad/…          ← EN+Espagne, mélange
/fr-fr/pays/kamailong           ← Cameroun phonétisé en chinois (??)
/fr-fr/pays/moxige              ← Mexico phonétisé
/fr-fr/pays/helan               ← Holland phonétisé
/ar-sa/التسجيل                  ← slug arabe natif (viole la règle ASCII)
```

**Conclusion data GSC** :
1. La génération programmatique produit des **combinaisons locale×country non validées** → pollution massive de l'index.
2. Google ne crawle **jamais** les 14 592 URLs découvertes → signal de faible priorité / crawl budget saturé.
3. Le site ne rank que sur **sa marque**, et même imparfaitement (pos 9,54 sur `sos expat`).
4. La home prend 70 % des clics → les pages profondes ne capturent RIEN.

### 2.2.quater Ré-énoncé du problème après intégration des données GSC

Le paradoxe initial devient clair :
- « Indexation qui monte » = 2 601 pages techniquement dans l'index Google.
- « Invisibilité » = ces 2 601 pages ne rankent **sur aucune requête business**. Elles existent dans l'index mais personne ne les trouve.
- « 14 592 pages rejetées » = Google voit les sitemaps, regarde les patterns d'URL, juge d'emblée que ça ne vaut pas un crawl.
- « Utilisateur FR voit anglais » = shell statique EN + SSR 403 pour humains sur la home.
- « Marque pas dominée » (`sos expat` pos 9,54) = la brand SERP elle-même est cassée — signal de faible autorité de domaine globale.

### 2.3 Constats HTTP live (à reconfirmer systématiquement)

3 profils UA :
- `GOOGLEBOT_MOBILE` = `Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)` ← **c'est celui qui compte (mobile-first indexing)**
- `GOOGLEBOT_DESKTOP` = `Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)`
- `HUMAIN_FR` = Chrome 120 desktop + `Accept-Language: fr-FR,fr;q=0.9,en;q=0.8`
- `HUMAIN_FR_MOBILE` = Chrome Mobile + `Accept-Language: fr-FR`
- `HUMAIN_EN` = Chrome 120 desktop + `Accept-Language: en-US,en;q=0.9`

**Page racine `/`** :
- Googlebot → 200 avec `X-SSR-Original-Status: 301` + `X-SSR-Fallback: true`.
- Humain FR → 200 avec `X-SSR-Original-Status: 403` + `X-SSR-Fallback: true`.
- Shell `index.html` : **meta OG/Twitter hardcodées en anglais**, `<title>` FR, `<html lang="fr">`. Script JS redirect timezone côté client.

**200 à Googlebot** : `/fr-fr`, `/en-us`, `/fr-fr/articles`, `/fr-fr/annuaire`, `/fr-fr/programme`, profils et articles depuis sitemaps.

**404 à Googlebot** : `/fr-fr/blog`, `/fr-fr/news`, `/fr-fr/guides`, `/fr-fr/sos-avocat`, `/fr-fr/consulter-avocat`, `/fr-fr/sos-avocat-france`, `/fr-fr/avocat-france`, `/fr-fr/aide`, `/fr-fr/help`, `/fr-fr/country/france`, `/fr-fr/expatries`.

### 2.4 Code suspect identifié

**`sos/firebase/functions/src/seo/dynamicRender.ts` (~l.386-391)** :
```js
is404 = await page.evaluate(`
  !!(
    document.querySelector('[data-page-not-found="true"]') ||
    document.querySelector('[data-provider-not-found="true"]')
  )
`);
```
Si vrai, renvoie HTTP 404 avec `X-Render-Status: 404` (~l.651).

**Commit suspect n°1** : `e84f1833 fix(worker): propagate SSR 404 instead of serving SPA 200 (soft 404 fix)`.

**Commits à auditer** :
```
69b4e53a fix(worker+robots): 410 Gone on hack URLs
f304faf0 fix(worker): whitelist lawyers+helpers LP in LP_SEGMENTS
db0902d7 fix(robots): remove Crawl-delay
8f6790a3 fix(warm-ssr): romanize Arabic slugs to ASCII
93e7911c fix(ssr): bump DEPLOY_MARKER for renderForBotsV2
9be6ff03 fix(ssr): force renderForBotsV2 cold start
99981539 chore(worker): EDGE_CACHE_VERSION v15→v16
28172f98 feat(seo): enriched robots.txt + per-sitemap lastmod
9be51f65 fix(seo): audit URL/hreflang/routes — 14 P0-P2
ae3c46fe feat(seo): master sitemap-index.xml (569 sub-sitemaps)
07400582 fix(seo): restore Firebase sitemap-index discovery
eae6a3ef feat(worker): 301 redirect trailing slash on locale homepages for bots
e6f9afc6 fix(worker): reduce SSR 404 TTL to 10min
af00306f feat(worker): version edge cache keys
b842ff19 fix(seo): deduplicate meta tags and fix html lang for bots
e84f1833 fix(worker): propagate SSR 404 instead of serving SPA 200
1c79a898 fix(seo): stripBotNoise regex failed to remove Vite bundle script
eb752539 feat(perf): add Cloudflare edge cache + SSR timeout
```

---

## 3. Hypothèses à vérifier (suspects — confirmer OU écarter avec preuves)

H1. Worker propage des 404 SSR faussement positifs depuis `e84f1833`.
H2. SSR Puppeteer déclare 404 trop vite (`data-page-not-found` posé en loading state).
H3. SSR saturé, cold starts, timeouts — GSC confirme TTFB 10 s.
H4. Shell statique EN par défaut → utilisateur FR voit EN, Google indexe signaux EN sur page FR.
H5. 14 592 « Détectée non indexée » = Google juge contenu faible / dupliqué (LP programmatiques).
H6. Canonicalisation cassée → 1 282 pages perdues.
H7. `noindex` fuité sur 360 pages qui devraient être indexables.
H8. 575 pages en chaînes de 301 → perte d'équité.
H9. 46 URLs 5xx visibles de Google.
H10. Cache edge pollué (key de cache mal définie).
H11. Sitemaps contiennent des URLs 404 / 301 → perte de confiance sitemap.
H12. Hreflang asymétrique → signal locale cassé.
H13. Meta robots / X-Robots-Tag contradictoires HTML vs header vs Helmet.
H14. Double résolution Worker vs SSR (statuts divergents selon couche).
H15. LP programmatiques = cible Helpful Content Update / SpamBrain.
H16. Core Web Vitals catastrophiques (TTFB 10 s).
H17. Maillage interne insuffisant, LP orphelines.
H18. E-E-A-T faible sur YMYL juridique.
H19. Backlinks quasi-inexistants.
H20. Cannibalisation entre LP et profils sur mêmes requêtes.
H21. robots.txt mal placé (Disallow fuité).
H22. Sitemaps partiellement ignorés par Google.
H23. Redirection JS timezone crée du pogo-sticking.
H24. Blog Laravel isolé (hreflang cross-app cassé).
H25. Firebase / Firestore throttling (facture GCP +57 %).
H26. Vary header absent / mal configuré (cache split bot vs humain).
H27. Rich results en sous-capacité (Q&A / Image metadata).
H28. Guerre d'alternates cross-TLD (sos-holidays.com, anciens alias).
H29. Brand SERP dégradé : knowledge panel absent, sitelinks mal choisis, Google ne comprend pas la marque.
H30. Intent mismatch : les pages indexées ne correspondent pas à ce que l'utilisateur cherche réellement.
H31. Content decay : articles sans date de mise à jour, pages « figées ».
H32. Cookie banner / cookiewall bloquant le premier rendu au détriment de Googlebot.
H33. Pagination `?page=N` mal gérée (duplication / canonical).
H34. `/search?q=…` ou autres résultats internes indexés par erreur.
H35. IP reputation dégradée (incident Spamhaus passé).
H36. Cross-browser / cross-fingerprint : Google WRS (Chromium ~120) voit potentiellement autre chose que notre Puppeteer.
H37. **URL patterns programmatiques cassés** : combinaisons locale×country invalides générées automatiquement (`zh-er`, `ch-cn`, `ch-fr`, `ch-us`, `de-cf`, `fr-st`, `en-es` confus) polluent l'index avec des URLs qui n'auraient jamais dû exister. Trouver où elles sont générées dans le code.
H38. **Slugs non-ASCII qui passent à travers la règle de romanisation** (`/ar-sa/التسجيل`, noms de pays phonétisés `kamailong`, `moxige`, `helan`). La mémoire projet dit « slugs ASCII only » mais la règle n'est pas appliquée.
H39. **Crawl budget famine** : les 14 592 URLs « détectée non indexée » ont toutes `dernière exploration = 1970-01-01` = jamais crawlées. Google voit le sitemap, juge le parc peu prioritaire, ne fetch rien. Cause probable : masse trop grande + qualité perçue trop faible + site trop lent.
H40. **Brand SERP faible** : position 9,54 sur `sos expat` = autorité de domaine très basse. Un site normal domine sa marque en pos 1-2. Signal que Google ne comprend pas encore l'entité « SOS-Expat » (pas de Knowledge Panel, ambiguïté avec d'autres « sos expat » ?).
H41. **Pages tag et galerie indexables à tort** : `/ar-sa/alwusum/*` (tags arabes) et `/ar-sa/maarad/*` (gallery visuels) apparaissent dans le drill-down — ce sont des pages à masse, faible valeur, qui doivent être `noindex`. Pareil potentiellement pour `/fr-fr/tags/*`, `/fr-fr/galerie/*`.
H42. **Phonétisation cross-langue des noms de pays** : `/fr-fr/pays/kamailong` (Cameroun en chinois), `/fr-fr/pays/moxige` (Mexico en chinois), `/fr-fr/pays/helan` (Holland). Fuite du pipeline de génération — mauvais dictionnaire de nom de pays injecté dans la mauvaise locale.
H43. **Dépendance trop forte au trafic marque** : 70 % des clics sur `/`, tout le reste est éparpillé. Signal que le SEO non-brand est absent, c'est-à-dire que le produit est invisible pour quelqu'un qui ne connaît pas déjà la marque.
H44. **Titles qui ressemblent à des slugs** : cas observé 2026-04-22, Google affiche `thailande-vie-sociale-en-thailande - SOS Expat` comme title d'un résultat. L'URL derrière le clic fonctionne bien (pattern réel `/fr-th/articles/{slug}-2026` en 200 via SSR Laravel), mais le `<title>` est littéralement le slug avec des tirets. Dégrade CTR, baisse la qualité perçue. À corriger au niveau de la génération de title dans le CMS Laravel.
H44-bis. **Asymétrie Laravel vs React** : preuve SERP 2026-04-22 — sur une requête brand + sujet (`sos-expat.com thailande`), **tous les 8 résultats sos-expat sont côté Laravel** (articles blog, Fiches Pays, Q/R). Aucun résultat côté React (home, profils, LP, annuaire, outils, aide). C'est cohérent avec : (a) Laravel fait du SSR natif serveur, (b) React dépend du SSR Puppeteer qui renvoie 404 à tort depuis `e84f1833`. Le problème SEO est concentré sur la partie React.
H45. **Architecture hreflang `{lang}-{country}` = pays du contenu, pas locale utilisateur**. Exemple : `/fr-th/pays/thailande` avec `hreflang="fr-TH"`. Format BCP 47 valide mais usage non-standard — la norme veut que `fr-TH` = « français tel que parlé en Thaïlande (par la minorité francophone) », pas « contenu français sur la Thaïlande ». Google peut mal interpréter ce signal et rater la correspondance utilisateur → locale. Ce choix structurel doit être audité en profondeur : bénéfice SEO réel vs confusion Google. Alternative : garder locale utilisateur (`fr-FR`, `fr-BE`…) et mettre le pays du contenu dans le path (`/fr-fr/pays/thailande`).
H46. **Incohérence locale home vs locale pages** : `/fr-th/pays/thailande` répond 200, mais `/fr-th` (home de la locale) **redirige 301 vers `/fr-fr`**. Contradictoire : si la locale `fr-th` n'a pas de home, pourquoi a-t-elle des pages ? Google voit des orphelines de locale.
H47. **Google matche le blog et les fiches pays sur queries `site: + sujet`** mais pas sur queries business pures (`avocat thailande`, `expatrie thailande`). Preuve : SERP observée 2026-04-22 pour `https://sos-expat.com/fr-th/pays/thailande` contient 8 résultats sos-expat (blog + Fiches Pays + Q/R), mais aucun de ces contenus ne sort quand on tape juste `avocat thailande` sur Google. Signal que le contenu est **indexé et pertinent pour la marque**, mais **pas compétitif hors du contexte marque**.

Chaque hypothèse → **confirmée avec preuve OU écartée avec preuve**.

---

## 4. Checklist d'audit — 35 chantiers

### Chantier A — Cartographie du parc d'URLs
1. Inventaire complet depuis `sitemap-index.xml`. Compter par type × locale.
2. Échantillonner 100 URLs par type, tester statut HTTP sous les 5 profils UA.
3. Croiser avec exports GSC fournis (14 592 non-indexées, 2 601 indexées, etc.).
4. Identifier les « templates d'URL » (regex) et variantes.
5. Documenter indexées visibles en SERP vs indexées invisibles.

### Chantier B — Cloudflare Worker
1. Lire `worker.js` intégralement.
2. Vérifier `LP_SEGMENTS` (couverture segments LP prod).
3. Détection bot : tous UA pertinents (Googlebot mobile/desktop, Bingbot, AhrefsBot, SemrushBot, PetalBot, ChatGPT-User, GPTBot, PerplexityBot, ClaudeBot, Slackbot, Twitterbot, Discordbot, WhatsApp, Applebot).
4. Politique de fallback (SSR 403, 301, timeout, 5xx).
5. Clé de cache (inclut bot/humain, locale, accept-language, path-normalized).
6. Redirects legacy (`/fr → /fr-fr`, `/blog → /`, trailing slash, `?pays=x → /annuaire/x`).
7. 410 Gone sur hack patterns — pas de false positive sur URLs légitimes.
8. HEAD vs GET cache coherence.
9. Headers émis (`Cache-Control`, `Vary`, `X-Robots-Tag`, `Content-Language`, `Link` canonical).
10. Gestion bots sur toutes les URLs de sitemap.

### Chantier C — SSR Puppeteer
1. Lire `dynamicRender.ts` intégralement.
2. Logique `is404` : signaux, fiabilité, faux positifs possibles.
3. Composants React qui posent `data-page-not-found` / `data-provider-not-found`.
4. Temps de render sur 20 URLs (cold + warm).
5. `waitUntil` + `waitForSelector` suffisants pour React + data.
6. Timeout global SSR vs Worker.
7. Cache L1/L2, `DEPLOY_MARKER`, risque cache poisoning.
8. Injection SSR : canonical, hreflang, JSON-LD, OG, Twitter, description, title.
9. Latence Firestore nam7 depuis europe-west1.
10. Puppeteer launch args, viewport, UA envoyé.
11. `stripBotNoise` — pas d'éléments utiles retirés ?
12. Taille HTML renvoyé (crawl budget).

### Chantier D — SPA React et faux 404 applicatifs
1. Grep : `data-page-not-found`, `data-provider-not-found`, `setNotFound`, `<Navigate to="/404"`, `NotFoundPage`, `Page404`, `Not Found`, `throw new NotFoundError`.
2. Pour chaque call site : distinguer loading vs not found.
3. Router `App.tsx` : path `*` qui capturerait à tort des LP.
4. Lazy-loaded chunks non fetchés dans temps Puppeteer → NotFound affiché.
5. ErrorBoundary : aucune ne set le flag 404.
6. Hooks auth : non-connecté ≠ 404 sur contenu public.
7. Grille de décision 404 vs 410 vs 301 vs canonical (voir §11).

### Chantier E — Sitemaps
1. Lister tous les sous-sitemaps du master.
2. Tester statut HTTP 200, Content-Type XML, parse valide, lastmod récent, nombre URLs.
3. Échantillonner 100 URLs par sitemap → statut Googlebot. Zéro 404/301/410 toléré.
4. `xhtml:link rel="alternate" hreflang` : toutes les 9 langues, symétrie, `x-default`.
5. Forme canonique (pas trailing slash divergent, pas query string, pas locale legacy).
6. Chaque URL indexable présente dans au moins un sitemap.
7. Aucune URL Disallow dans un sitemap.
8. Sitemap news (48 h), images, priorités.
9. Taille < 50 000 URLs et < 50 MB par fichier.
10. Soumission GSC : tous lus ?
11. **Freshness des `<lastmod>`** : pas tous à `today` (Google perd confiance).

### Chantier F — Robots.txt, X-Robots-Tag, meta robots
1. Fetch robots.txt via Worker, comparer au source.
2. Lister Disallow ; aucun ne doit couvrir URL à indexer.
3. Directives par UA.
4. `Sitemap:` déclarés.
5. `X-Robots-Tag` sur pages 200 : aucun `noindex/nofollow/none`.
6. `<meta name="robots">` SSR + SPA : pas de divergence.
7. Cross-check avec « Exclue par noindex » (360 pages).
8. Comportement sur 404.
9. `unavailable_after`.
10. Confirmer que URLs « Bloquée par robots.txt » le sont légitimement.

### Chantier G — Canonical, hreflang, duplication
1. Canonical HTML + header `Link`, self-locale.
2. Stabilité canonical vs trailing slash, query string, UA, Accept-Language.
3. Jamais canonical = home pour page interne.
4. Hreflang SSR + Helmet symétrie, 9 langues, x-default.
5. Chaque alternate existe (pas de hreflang vers 404).
6. Doublons cross-locale / cross-country (similarité cosinus shingles).
7. Divergences canonical HTML vs header.
8. Identifier les pages où Google a choisi une autre canonique.

### Chantier H — Qualité du contenu (helpful content, thin content)
1. Échantillon 50 LP → longueur texte unique, % duplication cross-LP, specificité pays/ville, sources/dates, auteur.
2. Templates > 60 % boilerplate → drapeau rouge.
3. FR vs EN vs DE même LP : traduction propre ou copie ?
4. Adéquation intent (informationnel / transactionnel / navigationnel).
5. Signaux fraîcheur : `lastmod`, `datePublished`, `dateModified`.
6. CTA cohérents intent.
7. Texte post-hydratation non présent dans SSR (Google ne le voit pas).
8. Titres/descriptions dupliqués.
9. Titre vide, description vide, H1 manquant.
10. Lorem ipsum / placeholders oubliés.
11. **Content decay** : date dernière modification, articles stagnants.

### Chantier I — Maillage interne
1. Crawler 3 niveaux depuis home. Graphe.
2. Profondeur moyenne URLs du sitemap. LP importantes ≤ 3 clics.
3. Pages orphelines (dans sitemap mais non atteignables).
4. Breadcrumbs (HTML + JSON-LD BreadcrumbList).
5. Cohérence fil d'Ariane vs URL.
6. Hubs (annuaire par pays, listings, blog par catégorie).
7. Chaque page profonde : ≥ 3-5 liens internes entrants.
8. Texte d'ancre varié, descriptif, non spammy.

### Chantier J — Core Web Vitals & performance
1. LCP, INP, CLS sur 20 URLs via PSI + CrUX.
2. Mobile vs desktop.
3. Causes : CSS/JS render-blocking, hydration, images, fonts.
4. TTFB 10 s = catastrophique.
5. Cold start Cloud Function vs latence Firestore.
6. Proposer SSR plus rapide : statique pré-généré pour top LP, ISR, edge rendering.
7. Poids pages.
8. Lazy-loading images + taille responsive.

### Chantier K — Données structurées JSON-LD
1. Lister schemas : `Organization`, `WebSite`, `WebPage`, `BreadcrumbList`, `FAQPage`, `Article`, `BlogPosting`, `LegalService`, `LocalBusiness`, `Person`, `Review`, `AggregateRating`, `Service`, `ContactPoint`, `SiteNavigationElement`.
2. Valider via Rich Results Test + Schema.org validator.
3. Cohérence JSON-LD ↔ contenu visible.
4. Corriger les 87 champs Q&A manquants.
5. Corriger Image metadata (`acquireLicensePage`, `license`, `copyrightNotice`).
6. `Service` JSON-LD sur LP (description, prix, area served, provider).
7. `Person` / `LegalService` sur profils prestataires.
8. Pas de Review fake.

### Chantier L — E-E-A-T et trust signals
1. Page About / À propos.
2. Adresses physiques, SIRET, mentions légales.
3. Vérification profils (barreau, ordre).
4. Avis clients : vrais, datés, variés, photo.
5. Mentions de presse, partenariats, certifications.
6. Couverture sociale (LinkedIn, Twitter, Instagram).
7. Politique confidentialité, CGU, cookies, RGPD.
8. Pages YMYL par catégorie.
9. Auteurs nommés sur articles, bio, credentials.

### Chantier M — Backlinks et autorité
1. Profil liens entrants (Ahrefs / Semrush / Majestic).
2. Domaines référents, qualité, contexte.
3. Liens toxiques à désavouer.
4. Opportunités (presse, partenaires, annuaires qualité).
5. Cross-check avec Backlink Engine interne.

### Chantier N — Expérience humaine FR (symptôme « je vois anglais »)
1. Vrai Chrome FR (real headers, fresh profile), capturer rendu `/`.
2. Temps entre fetch `/` et affichage `/fr-fr` (redirect JS timezone).
3. SSR `/` pour humains → 200 FR propre OU 302 edge vers `/fr-fr` ?
4. Respect cookie/localStorage locale.
5. Incognito, Edge, Firefox, Safari mobile.
6. Via referrer Google vs URL tapée directement.
7. Desktop vs mobile.
8. Geolocation IP FR réelle (utiliser proxy FR si test depuis autre pays).

### Chantier O — Cache edge et propagation
1. `EDGE_CACHE_VERSION` actuelle.
2. TTL réelle des 200, 404, 301, 5xx.
3. Version cachée empoisonnée persistante ?
4. Clé de cache Worker.
5. Purge ciblée post-fix.

### Chantier P — GSC health et signaux externes
1. Croiser Coverage + résultat audit live. 14 592 « détectée non indexée » = quelles URLs ?
2. **Croiser Performance GSC** (fichier 0.1 #1) : quelles requêtes impressions, CTR, pages top.
3. Actions manuelles éventuelles.
4. Santé sitemaps soumis.
5. URL Inspection Live Test sur 30 URLs représentatives.

### Chantier Q — Helpful Content / SpamBrain exposure
1. LP programmatiques = drapeau rouge classique.
2. Texte unique vs templaté par page.
3. Signaux « helpful » (info unique, auteur humain, valeur pratique).
4. Rapport valeur / masse contenu.
5. Stratégie : soit booster qualité, soit désindexer LP faibles (noindex + soumission).

### Chantier R — Risques cross-domaine / multi-app
1. Blog Laravel : hreflang + canonical cohérents avec React.
2. `sos-holidays.com` et alias : 301 propres ou duplication ?
3. Cloudflare Pages vs Firebase Hosting (interdit).
4. Sous-domaines (admin, api, blog) : `noindex` OK.

### Chantier S — Brand SERP audit (**NOUVEAU — répond directement à la question utilisateur**)
1. Tape `sos-expat.com` dans Google.fr, Google.com, Google.be, Google.ca, Google.mobile. Capturer la SERP.
2. Présence Knowledge Panel ? Si oui, contenu (logo, description, site officiel, réseaux sociaux).
3. Sitelinks : combien, lesquels, sont-ils pertinents ?
4. People Also Ask : questions associées.
5. Site-links search box ?
6. Featured snippet ?
7. Résultats paginés : combien d'URLs de sos-expat apparaissent en page 1 ? Page 2 ?
8. Tape `site:sos-expat.com` : combien d'URLs ressortent vraiment via cette syntaxe ?
9. Tape `SOS Expat` (marque sans TLD) : Google comprend-il que c'est la marque ?
10. Vérifier `Organization` + `WebSite` + `sameAs` JSON-LD complets (site officiel, Twitter, Facebook, LinkedIn, Instagram, logo, slogan).
11. Google Business Profile — existe-t-il ?
12. Wikipedia / Wikidata — existe-t-il une entrée ?
13. Cohérence NAP (Name Address Phone) à travers le web.
14. Vérifier que le site n'est pas considéré comme un sous-ensemble d'une autre entité.

### Chantier T — Analyse concurrentielle
1. Identifier 5-10 concurrents (français : avocats.fr, juristique.com, annuaire du barreau, justifit, etc. + internationaux : JustAnswer, LegalMatch, Lawyers.com).
2. Pour chaque concurrent : nombre d'URLs indexées, trafic organique estimé, pages qui rankent, profil backlinks.
3. Diff contenu : ce qu'ils couvrent et pas nous.
4. Diff architecture : leur maillage interne, leurs hubs.
5. Diff E-E-A-T : leurs signaux (équipe, partenaires, certifications).
6. Diff vitesse : leur TTFB, CWV.
7. Identifier les quick wins business (requêtes faibles en concurrence).

### Chantier U — Intent mapping et cannibalisation concrète
1. Liste des requêtes cibles business (fournie par utilisateur §0.1 #15).
2. Pour chaque requête : classer intent (informational / navigational / transactional / commercial investigation).
3. Pour chaque requête : quelle URL du site devrait idéalement matcher ?
4. Détecter les cannibalisations : N URLs du site visent la même requête → Google choisit une → les autres sont « détectée non indexée ».
5. Méthode cannibalisation : clusterer les pages par similarité title + H1 + top 20 mots, puis tester quelles pages Google associe à mêmes requêtes via Performance GSC.
6. Fix : canonical entre cannibales OU fusion de contenu OU différenciation d'angle éditorial.

### Chantier V — Google's own renderer (Web Rendering Service)
1. GSC → URL Inspection → Live Test sur 30 URLs. Comparer HTML rendered par Google WRS vs HTML rendered par Puppeteer SSR vs HTML SPA client-side.
2. Rich Results Test sur 10 URLs : ce que voit le renderer Google pour les structured data.
3. Screenshot capture GSC : le rendu visuel Google.
4. Mobile-Friendly Test.
5. Identifier les dissonances : Google voit-il les meta injectées par React Helmet ? Les hreflang SSR ? Le JSON-LD ?

### Chantier W — Search engine diversity
1. Bing Webmaster Tools : indexation, impressions, requêtes.
2. Yandex Webmaster (pour le marché RU).
3. Baidu Ziyuan (pour le marché ZH si visé).
4. DuckDuckGo : présence.
5. SSR compatible avec tous ces bots.
6. Sitemap soumis à tous.

### Chantier X — Accessibility / WCAG
1. WAVE, axe DevTools sur 10 pages représentatives.
2. Contrast, alt text, heading hierarchy, ARIA, keyboard navigation.
3. Signal indirect de qualité.

### Chantier Y — Pagination, recherche interne, cookie wall
1. Pagination (annuaire, blog, profils) : `rel=prev/next` (déprécié mais supporté par Bing), canonical self-reference ou canonical page 1, URLs paginées indexables ou non.
2. `/search?q=…` et autres URLs de recherche : doivent être `noindex` + `robots Disallow`.
3. Cookie banner : bloque-t-il le premier rendu ? Googlebot voit-il contenu ou banner ?
4. Interstitials mobiles (App Smart Banner, popup ads) : Google pénalise.

### Chantier Z — IP reputation, Indexing API / IndexNow
1. IP origin reputation (Spamhaus, SpamCop, autres blacklists).
2. **IndexNow** (Bing, Yandex) : mettre en place notification push sur changement sitemap.
3. **Google Indexing API** — uniquement pour `JobPosting` et `BroadcastEvent`. Ne pas l'utiliser hors de ce scope (Google punit).
4. `ping sitemap` via `https://www.google.com/ping?sitemap=...` (déprécié depuis 2023, mais GSC manuel remplace).
5. Re-soumission Sitemap dans GSC après fixes.

### Chantier AA — Mobile-first indexing validation
1. Googlebot Smartphone = 45,9 % du crawl GSC. **C'est LA version qui compte**.
2. Vérifier que SSR / Worker détectent Googlebot Mobile comme bot.
3. HTML servi à Googlebot Mobile = HTML servi à desktop ? (doit être équivalent).
4. CSS / JS mobile disponible pour rendu.
5. Tap targets, viewport, font-size mobile.
6. Pas d'interstitial mobile intrusif.
7. Mobile-Friendly Test sur 10 URLs.

### Chantier AB — Logs server-side origine
1. Logs Cloud Run `renderForBotsV2` : P50, P95, P99 duration, error rate, timeout rate.
2. Logs Firebase Functions : errors, cold start count.
3. Logs Cloudflare : taux de MISS cache, taux d'erreurs, geo répartition, bot breakdown.
4. Identifier les pics corrélés avec les chutes GSC.

### Chantier AC — Audit du pipeline de génération programmatique d'URLs (**NOUVEAU — critique vu les données GSC**)
1. Localiser dans le code source le ou les scripts qui génèrent les URLs locale×country (chercher `toLocaleUrl`, `generateLocaleCountry`, `LOCALES`, `COUNTRIES`, `buildSlug`, `slugify`).
2. Lister toutes les combinaisons locale×country réellement générées. Comparer à la matrice 9 locales × 200 pays « officielle ».
3. Identifier les combinaisons bizarres (`zh-er`, `ch-cn`, `ch-fr`, `ch-us`, `de-cf`, `fr-st`, `en-es`…). Ces codes locale violent la norme BCP 47 ou n'ont pas de population cible réaliste.
4. Vérifier la règle de romanisation ASCII : pourquoi `/ar-sa/التسجيل` échappe-t-elle au filtre ?
5. Vérifier le dictionnaire de noms de pays : `kamailong` (Cameroun), `moxige` (Mexico), `helan` (Holland) proviennent d'un dictionnaire chinois injecté en locale FR. Trouver la source et corriger.
6. Définir une **politique stricte d'émission d'URL** : ne générer une URL que si (a) la combinaison locale×country a un marché cible réel, (b) le slug est ASCII, (c) le contenu est suffisamment unique pour justifier une page.
7. Pour les URLs déjà générées et rejetées par Google : décider entre 410 Gone (si plus jamais voulues), 301 vers la version canonique propre, `noindex + nofollow`, ou amélioration du contenu.
8. Évaluer l'impact d'un ménage drastique : passer de 17 326 URLs découvertes à 3 000-5 000 URLs propres aiderait Google à prioriser les bonnes.

### Chantier AD — Pages de faible valeur à désindexer (**NOUVEAU**)
1. Lister les templates de pages à forte masse / faible valeur : pages tags (`/*/alwusum/*`, `/*/tags/*`), pages galerie (`/*/maarad/*`, `/*/galerie/*`), pages auteur sans contenu propre, pages catégorie vides.
2. Pour chaque template, décider : `noindex, follow` + retrait des sitemaps, OU amélioration du contenu.
3. Appliquer via Worker + SSR + SPA meta robots.
4. Documenter la décision dans un `robots-policy.md` versionné.

### Chantier AF — Titles qui ressemblent à des slugs + CTR SERP (**NOUVEAU — observé 2026-04-22**)
Cas concret observé : Google affiche dans la SERP `thailande-vie-sociale-en-thailande - SOS Expat` comme title d'un article. C'est un slug utilisé littéralement comme `<title>`.

1. Récupérer un échantillon de 200 articles blog (côté Laravel) et extraire `<title>`, `<h1>`, `og:title`, `<meta name="description">`.
2. Identifier les articles dont le `<title>` ressemble à un slug (tirets, pas de majuscule, pas de ponctuation).
3. Corriger à la source dans le CMS Laravel : title = phrase humaine, slug = identifiant URL, les deux doivent être distincts.
4. Vérifier la cohérence `<title>` / `og:title` / `<h1>` sur tout le blog.
5. Mesurer l'impact potentiel sur CTR : des titles propres gagnent typiquement 15-30 % de CTR.

### Chantier AG — Asymétrie santé SEO Laravel vs React (**NOUVEAU — découverte clé**)
Observation : dans le SERP des queries brand + sujet (ex. `sos-expat.com thailande`), **tous les résultats qui sortent sont côté Laravel (blog, fiches pays, Q/R)**. Aucun résultat côté React (home, profils, LP, annuaire, outils, aide). Cela éclaire le diagnostic global.

1. Tabuler les types de page × côté technique (Laravel vs React) × santé (indexé, rank, 404 Googlebot).
2. Quantifier : quel % du parc URL Laravel est indexé vs React ?
3. Quel % des clics GSC va vers Laravel vs React ?
4. Hypothèse : la régression `e84f1833` sur le Worker (propagate SSR 404) n'affecte que la partie React (SSR Puppeteer). Le blog Laravel a son propre SSR natif et n'est pas concerné.
5. Fix prioritaire : restaurer le ranking de la partie React en corrigeant le SSR Puppeteer faux-positifs + performance.
6. Stratégie transitoire : capitaliser sur le fait que Laravel fonctionne — pousser du contenu éditorial côté blog en attendant de fix React.
7. Décision stratégique long terme : migrer plus de contenus côté Laravel (pré-rendu serveur natif) ou corriger le SSR React ?

### Chantier AH — Mapping fin Laravel / React et pourquoi Laravel rank (**NOUVEAU — analyse causale**)

Le constat « Laravel rank, React ne rank pas » est confirmé. Mais **pourquoi** Laravel rank ? C'est peut-être SSR natif, mais peut-être aussi d'autres facteurs. Sans comprendre les causes réelles, on ne sait pas si la bonne stratégie est (a) réparer React, (b) migrer plus vers Laravel, (c) un hybride.

#### AH.1 — Mapping exact Laravel vs React
Lire `sos/cloudflare-worker/worker.js` et produire ce tableau en sortie :

| Pattern URL | Stack servant la page | Règle Worker (ligne worker.js) | Exemple URL | Statut Googlebot | Dans sitemap ? | Rank GSC ? |
|---|---|---|---|---|---|---|
| `/` | ? | ? | `/` | ? | ? | ? |
| `/{locale}` | ? | ? | `/fr-fr` | ? | ? | ? |
| `/{locale}/articles/*` | ? | ? | `/fr-th/articles/travailler-en-thailande-2026` | ? | ? | ? |
| `/{locale}/pays/*` | ? | ? | `/fr-th/pays/thailande` | ? | ? | ? |
| `/{locale}/categories/*` | ? | ? | `/fr-fr/categories/fiches-pays` | ? | ? | ? |
| `/{locale}/tags/*` | ? | ? | `/fr-fr/tags/assistance-expatriation` | ? | ? | ? |
| `/{locale}/{category-country}/{provider-slug}` | ? | ? | profil prestataire | ? | ? | ? |
| `/{locale}/annuaire/*` | ? | ? | `/fr-fr/annuaire/senegal` | ? | ? | ? |
| `/{locale}/help*` ou `/{locale}/centre-aide/*` | ? | ? | `/fr-fr/centre-aide` | ? | ? | ? |
| `/{locale}/faq*` | ? | ? | `/fr-fr/faq` | ? | ? | ? |
| `/{locale}/temoignages` | ? | ? | `/fr-fr/temoignages` | ? | ? | ? |
| `/{locale}/outils/*` | ? | ? | `/fr-fr/outils` | ? | ? | ? |
| `/{locale}/consulter-*` | ? | ? | `/fr-fr/consulter-avocat` | ? | ? | ? |
| `/{locale}/sos-*` | ? | ? | `/fr-fr/sos-avocat` | ? | ? | ? |
| `/{locale}/country/*` | ? | ? | `/fr-fr/country/france` | ? | ? | ? |
| `/{locale}/galerie/*` | ? | ? | `/fr-fr/galerie/...` | ? | ? | ? |
| `/{locale}/expatries` / `/{locale}/blog` / `/{locale}/news` / `/{locale}/guides` | ? | ? | ? | ? | ? | ? |

Ce tableau doit être **exhaustif** et **servir de référence** pour tous les chantiers suivants. Toute conclusion non reliée à une ligne de ce tableau est suspecte.

#### AH.2 — Pourquoi Laravel rank : isoler les facteurs
Pour deux pages, une Laravel qui rank (ex. `/fr-th/articles/travailler-en-thailande-2026`, position 3) et une React qui ne rank pas (ex. `/fr-fr/consulter-avocat`, 404), comparer point par point :

| Facteur | Laravel page | React page | Contribution au rank ? |
|---|---|---|---|
| Statut HTTP Googlebot | 200 | 404 (ou 200 vide) | ⚠️ déterminant |
| TTFB serveur | ? | ? | ? |
| Taille HTML rendu | ? | ? | ? |
| `<title>` présent + unique | ? | ? | ? |
| Meta description unique | ? | ? | ? |
| H1 présent | ? | ? | ? |
| Longueur texte unique (hors menu/footer) | ? | ? | ? |
| BreadcrumbList JSON-LD | ? | ? | ? |
| Article / LegalService JSON-LD | ? | ? | ? |
| Canonical présent | ? | ? | ? |
| Hreflang complet 9 langues | ? | ? | ? |
| Nombre de liens internes entrants | ? | ? | ? |
| Âge de l'URL (date première indexation GSC) | ? | ? | ? |
| Backlinks externes pointant vers l'URL | ? | ? | ? |
| Core Web Vitals | ? | ? | ? |
| Mobile usability | ? | ? | ? |

Classer la contribution probable au ranking : **déterminant / important / mineur / négligeable**.

Sortie attendue : un diagnostic causal clair. Exemple attendu : « Laravel rank parce que (1) il sert 200 systématiquement, (2) il a un vrai `<title>` humain à 80 % des articles, (3) son BreadcrumbList est injecté SSR, (4) il a 3 ans d'ancienneté d'indexation. React plus jeune + SSR faux-positifs + pas de BreadcrumbList + hreflang buggé sur certaines pages. »

#### AH.3 — Décision stratégique
Une fois les causes identifiées, rendre verdict parmi :
- **Option A** : Corriger React SSR (rollback `e84f1833` + fix Puppeteer + meta OG + perf) — effort M, impact +++
- **Option B** : Migrer plus de contenus vers Laravel (annuaire, LP) — effort XL, impact +++
- **Option C** : Remplacer SSR Puppeteer par SSG/ISR (Astro, Next.js SSG, Vite SSG pré-rendu) pour le parc statique — effort L, impact +++
- **Option D** : Remplacer SSR Puppeteer par Edge SSR (Cloudflare Workers + React Server Components ou Hono SSR) — effort L, impact ++
- **Option E** : Hybride — A court terme + C long terme

Rédiger la recommandation avec arguments quantifiés.

### Chantier AG — Architecture hreflang intercountry `{lang}-{country-content}` (**NOUVEAU — à valider stratégiquement**)
Le site utilise `hreflang="fr-TH"` pour désigner du contenu français sur la Thaïlande, et `/fr-th/pays/thailande` comme URL canonique. Usage non-standard de BCP 47.

1. Vérifier documentation Google sur hreflang : cette pratique est-elle reconnue ?
2. Comparer avec concurrents internationaux qui ont du contenu pays (Wikipedia, TripAdvisor, Booking, Expat.com).
3. Mesurer le taux d'indexation des pages `/{lang}-{country}/...` vs l'alternative `/{lang}/{country}/...`.
4. Tester la cohérence : si `/fr-th/...` pages existent, pourquoi `/fr-th` (home locale) redirige vers `/fr-fr` ?
5. Identifier les incohérences : `/fr-fr/pays/thailande` 301 vers `/fr-th/pays/thailande` (contenu dupliqué géré par redirect) — acceptable ? Ou aurait-il fallu consolider en une seule URL ?
6. Risque : Google sert la page `fr-th` à un utilisateur français (locale fr-FR), ou l'inverse. Tester avec différents `Accept-Language`.
7. Décision stratégique : garder architecture `{lang}-{country-content}` avec fix des incohérences, OU bascule progressive vers `{lang-locale}/{country-content}` (ex. `/fr-fr/pays/thailande` comme canonique, avec hreflang `fr-FR`, `fr-BE`, `fr-CA`…).

### Chantier AE — Brand entity building (**NOUVEAU — P0 business**)
Le rapport GSC montre position **9,54 sur `sos expat`**. C'est anormal pour une marque. Actions :
1. Vérifier que `Organization` + `WebSite` + `sameAs` JSON-LD sont complets et cohérents partout.
2. Créer / compléter Google Business Profile.
3. Créer entrée Wikidata (via edit sur wikidata.org) puis faire pointer depuis Wikipedia si existe.
4. Uniformiser NAP (Name Address Phone) sur LinkedIn, Twitter, Facebook, Instagram, Crunchbase, sociétés.com, annuaires métier.
5. Créer / nettoyer la page presse avec dossier de presse téléchargeable + logos officiels.
6. Lancer quelques communiqués pour ancrer « SOS-Expat » comme entité reconnue.
7. Demander à Google la prise en compte via URL Inspection sur la home FR + EN.

---

## 5. URLs à tester (plan de test systématique)

Tester chaque URL sous les **5 profils UA** définis en §2.3.

Pour chaque URL collecter :
- Statut HTTP, `Location`, `X-Rendered-By`, `X-SSR-Original-Status`, `X-SSR-Fallback`, `X-Render-Status`, `Content-Language`, `Cache-Control`, `Vary`, `X-Robots-Tag`, `Link` canonical.
- Dans le body : `<html lang>`, `<title>`, `<meta description>`, `<meta robots>`, `<link canonical>`, count hreflang, présence markers 404, taille body, langue dominante.

Générer un **CSV** `url,profile,status,ssr_status,render_status,content_language,canonical,html_lang,title_lang,meta_robots,og_locale,hreflang_count,body_size,has_notfound_marker`.

### 5.1 Racine et locales
`/`, `/fr`, `/en`, `/es`, `/de`, `/pt`, `/ru`, `/zh`, `/ar`, `/hi`, `/fr-fr`, `/fr-fr/`, `/en-us`, `/es-es`, `/de-de`, `/pt-pt`, `/ru-ru`, `/zh-cn`, `/ar-sa`, `/hi-in`.

### 5.2 Pages structurantes
`/fr-fr/annuaire`, `/fr-fr/annuaire/france`, `/fr-fr/annuaire?pays=france`, `/fr-fr/articles`, `/fr-fr/blog`, `/fr-fr/news`, `/fr-fr/guides`, `/fr-fr/aide`, `/fr-fr/help`, `/fr-fr/programme`, `/fr-fr/about`, `/fr-fr/contact`, `/fr-fr/cgu`, `/fr-fr/mentions-legales`, `/fr-fr/politique-confidentialite`, `/fr-fr/login`, `/fr-fr/register`.

### 5.3 LP programmatiques
`/fr-fr/consulter-avocat`, `/fr-fr/sos-avocat`, `/fr-fr/sos-avocat-france`, `/fr-fr/sos-avocat-thailande`, `/fr-fr/avocat-france`, `/fr-fr/avocat-maroc`, `/fr-fr/avocat-thailande`, `/fr-fr/country/france`, `/fr-fr/country/thailand`, `/fr-fr/country/morocco`, `/fr-fr/expatries`, `/fr-fr/consulter-helper`, `/fr-fr/sos-helper`.
Répéter pour `en-us`, `es-es`, `ar-sa` (RTL), `hi-in`, `zh-cn`.

### 5.4 Profils + articles
- 20 profils random depuis `/sitemaps/profiles-{fr,en,ar,zh}.xml`.
- 20 articles random depuis `/sitemaps/articles-{fr,en}-1.xml`.
- 20 URLs random depuis `/sitemaps/listings-fr.xml`, `/sitemaps/help-fr.xml`.

### 5.5 Edge cases
- Trailing slash, query string, locale legacy, hack patterns (410), unicode slugs.
- URL inexistante (404 propre attendu avec `noindex`).
- URL supprimée (410 Gone).
- URL paginée `?page=2`.
- URL interne search `/search?q=avocat`.

### 5.6 Non-HTML
`/robots.txt`, `/sitemap-index.xml`, tous sous-sitemaps, `/favicon.ico`, `/og-image.webp`, `/llms.txt`, `/ai.txt`, `/.well-known/security.txt`.

### 5.7 URLs GSC spécifiques
- 208 URLs 404.
- 46 URLs 5xx.
- 8 soft 404.
- 360 « exclue par noindex ».
- Échantillon 100 des 14 592 « détectée non indexée ».

### 5.8 Brand SERP queries
- `sos-expat.com` (Google.fr, .com, .be, .ca, mobile)
- `sos expat` (sans tiret, sans TLD)
- `sos-expat`
- `site:sos-expat.com`
- `site:sos-expat.com inurl:consulter-avocat`
- Requêtes business cibles fournies par utilisateur.

---

## 6. Commandes et outils

### 6.1 Shell (Git Bash sous Windows)
```bash
UA_BOT_MOBILE='Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
UA_BOT_DESKTOP='Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
UA_CHROME_FR='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

# Diagnostic statut
curl -sI -A "$UA_BOT_MOBILE" "$URL" \
  | grep -iE "^HTTP|x-render|x-ssr|location|content-language|cache-control|x-robots-tag|link|vary"

# Body + meta
curl -s -A "$UA_BOT_MOBILE" "$URL" \
  | grep -iE 'canonical|hreflang|noindex|og:|twitter:|<title|<html|data-page-not-found|data-provider-not-found' | head -50

# Diff humain vs bot
diff <(curl -s -A "$UA_CHROME_FR" -H "Accept-Language: fr-FR" https://sos-expat.com/) \
     <(curl -s -A "$UA_BOT_MOBILE" https://sos-expat.com/) | head -200

# Toutes les URLs d'un sitemap
curl -s https://sos-expat.com/sitemaps/profiles-fr.xml \
  | grep -oE "<loc>[^<]+</loc>" | sed 's/<[^>]*>//g'
```

### 6.2 Outils tiers
- **Ahrefs / Semrush / Majestic** : backlinks, KW, concurrents.
- **Screaming Frog / Sitebulb** : crawl exhaustif.
- **PageSpeed Insights + CrUX** : CWV.
- **Rich Results Test + Schema validator**.
- **GSC URL Inspection Live Test** : 30 URLs.
- **Mobile-Friendly Test** : 10 URLs.
- **WAVE, axe DevTools** : a11y.
- **Bing Webmaster, Yandex Webmaster** : search diversity.
- **Cloudflare Analytics + Logs**.
- **GCP Cloud Monitoring / Logging**.

### 6.3 Scripts à écrire
- Crawl multi-UA + collecte headers + meta.
- Diff shell humain vs bot.
- Similarité cosinus cross-URL (détection duplication).
- Validateur sitemaps (URL → statut 200).
- Parse GSC Performance CSV + cartographie intent.

---

## 7. Livrables attendus

Rapport final structuré en **9 parties** :

### 7.1 Synthèse exécutive (1 page max)
- Verdict unique sur la question initiale.
- Niveau de certitude.
- Top 5 problèmes P0 avec impact estimé.
- Effort par fix.

### 7.2 Explication du paradoxe « indexation monte + invisibilité »
- Chiffres à l'appui.
- 14 592 « détectée non indexée » : raisons, patterns, fix.
- 2 601 indexées invisibles : problème ranking.

### 7.3 Analyse brand SERP
- Captures SERP pour `sos-expat.com`, `sos expat`, `site:sos-expat.com` sur Google.fr, .com, .be, .ca, mobile.
- Présence Knowledge Panel, sitelinks, PAA.
- Comparaison avec marque concurrente (ex. justifit.fr) pour référence.
- Fix brand SERP spécifiques.

### 7.4 Catalogue complet des anomalies
Tableau : ID, criticité P0/P1/P2, chantier, description, preuve, impact (URLs affectées, % trafic), fix, effort.

### 7.5 Carte du parc d'URLs
- Total par type × langue × pays.
- Répartition statuts HTTP.
- Taux d'indexation par type × langue.
- Top 20 patterns URL en 404.
- Top 20 patterns URL en « détectée non indexée ».

### 7.6 Analyse concurrentielle
- Tableau 5-10 concurrents : URLs indexées, trafic estimé, backlinks, top pages.
- Diff stratégique : où on perd, où on peut gagner.

### 7.7 Analyse de régression
- Frise commits × métriques GSC.
- Commit déclencheur de chaque régression.
- Faisabilité rollback.

### 7.8 Performance et infra
- Courbe temps réponse Cloud Run / Firestore / Puppeteer.
- Cold start rate.
- Quotas / throttling.
- Coût corrélé charge.

### 7.9 Plan de remédiation
- Plan A (corrections propres) : ordre, fichiers, diff, tests.
- Plan B (rollback sécurité) : quoi rollback, effets de bord.
- Purge cache + re-soumission GSC + URL Inspection.
- Monitoring post-fix : métriques, seuils, fenêtre.
- Roadmap 30 / 60 / 90 j.
- Instruction finale : **un reviewer hostile challenge chaque conclusion**.

---

## 8. Règles de travail (non négociables)

1. **Vérifie par toi-même**. Les données et hypothèses sont un point de départ.
2. **Zéro supposition**. Mesure, cite commande et résultat.
3. **Règle des deux tests indépendants**. Avant d'énoncer qu'un problème existe, fournis **deux preuves d'angles différents** (exemples : `curl -I` + body `grep` ; Googlebot UA + Chrome UA ; HEAD + GET ; SERP Google + URL Inspection GSC). Un seul test n'est jamais suffisant pour conclure. **Cette règle existe parce qu'une précédente version de cet audit a conclu à tort sur des « URLs zombies » en devinant une URL à partir d'un title SERP sans la cliquer ni la tester proprement.**
4. **Toujours cliquer pour vérifier**. Si tu observes une URL en SERP et que tu veux la tester, ne la devine pas — soit scrape la SERP pour extraire l'URL réelle (attribut `href` des résultats), soit utilise l'URL Inspection GSC, soit demande à l'utilisateur de faire un screenshot du `Copier le lien` sur le résultat. Jamais deviner un slug depuis un title.
5. **`file:line`** pour toute référence code.
6. **Mesure l'impact** (URLs / % trafic) avec la grille §13.
7. **Priorise P0 business**. Ne pondère pas par masse, pondère par contribution business.
8. **Ne touche pas à la prod** sans validation explicite.
9. **Français**. Pas de baratin, densité forte.
10. **Tests impossibles** → dis-le, propose procédure manuelle.
11. **Raisonne en patterns**, pas en URLs isolées. 9 langues × 200 pays = un bug = 10 000 URLs.
12. **Indexation ≠ ranking ≠ trafic ≠ conversion**. 4 problèmes distincts, causes potentiellement différentes.
13. **Reviewer hostile à la fin** : pour chaque conclusion P0, imagine un SEO senior hostile qui cherche le défaut. Réponds explicitement aux questions suivantes : (a) Ma preuve est-elle reproductible ? Par qui ? (b) Existe-t-il une hypothèse alternative qui explique le même symptôme ? L'ai-je testée ? (c) Mon échantillon est-il représentatif ou ai-je cherché sous le lampadaire ? (d) Mon chiffre d'impact vient d'une mesure ou d'une projection ?
14. **Ne clos pas un chantier** tant qu'il reste des zones non observées.
15. **Pas de solution = pas un bon audit**. Chaque problème identifié doit avoir une recommandation actionnable avec effort estimé (voir §14).
16. **Critère d'interruption anticipée** : si tu découvres un fix P0 qui à lui seul débloquerait > 50 % du problème (ex. rollback d'un commit unique qui restaure 10 000+ URLs indexables), STOP l'audit en cours, remonte immédiatement la trouvaille avec preuve + estimation impact + plan de rollback. Ne finis pas les 30 autres chantiers avant d'avoir proposé le fix critique. Le coût d'inaction pendant 2 semaines d'audit sur un site qui saigne du trafic est plus grand que le gain d'exhaustivité.
17. **Coordination équipes** : identifier pour chaque fix s'il relève de l'équipe Laravel, de l'équipe React/Worker, de l'équipe infra/GCP, ou d'une action hors-code (GSC, Google Business Profile, Wikidata). Un plan de remédiation sans propriétaire n'est pas actionnable.

---

## 9. Arbre de décision 404 / 410 / 301 / canonical / noindex / 200

| Cas | Réponse correcte |
|---|---|
| URL jamais existé, destinée à ne pas exister | **404** + `<meta robots=noindex>` |
| URL existait, contenu retiré définitivement, aucune page équivalente | **410 Gone** |
| URL existait, a migré vers nouvelle URL 1:1 | **301** vers nouvelle URL |
| URL a plusieurs variantes (trailing slash, query param, casse) | Canonical vers forme canonique + redirect 301 si pas ambigu |
| Page existante mais contenu trop faible / dupliqué / provisoire | **200** + `<meta robots=noindex, follow>` (pas 404 !) |
| URL = résultat de recherche interne | `noindex, nofollow` + bloqué robots.txt |
| URL paginée (page 2+) | `200` + canonical self + indexable (Google gère bien depuis 2019) |
| URL temporairement indisponible | **503** + `Retry-After` |
| Contenu nécessite login | **401/403** + `noindex` |
| Erreur applicative grave | **500** (mais à corriger vite) |

**JAMAIS** : 200 sur page qui n'existe pas (soft 404), 404 sur page qui charge en loading, 301 chain > 3 hops.

---

## 10. Monitoring post-fix (critères de succès concrets)

Dashboard à mettre en place + seuils cibles 60 jours post-fix :

| Métrique | Source | Seuil cible |
|---|---|---|
| TTFB moyen Googlebot | GSC Crawl Stats | < 1,5 s |
| Ratio 5xx crawl | GSC Crawl Stats | < 0,5 % |
| Ratio 404 crawl | GSC Crawl Stats | < 2 % |
| Ratio requêtes non abouties | GSC Crawl Stats | < 2 % |
| Pages indexées | GSC Coverage | × 3 |
| Ratio indexées / découvertes | GSC Coverage | > 40 % |
| « Détectée non indexée » | GSC Coverage | ÷ 3 |
| Impressions/jour | GSC Performance | × 10 |
| Clics/jour | GSC Performance | > 0 (actuellement proche 0) |
| Position moyenne sur requêtes brand | GSC Performance | < 5 |
| Cold start rate SSR | GCP | < 5 % |
| Duration P95 SSR | GCP | < 3 s |

---

## 11.bis Arbre de décision de rollback de `e84f1833` (**NOUVEAU**)

Le commit `e84f1833 fix(worker): propagate SSR 404 instead of serving SPA 200 (soft 404 fix)` est **hypothèse #1** de la régression. Avant de le rollback, vérifier :

### 11.bis.1 Ce que le commit faisait
- Avant : Worker, quand SSR renvoie 404, renvoyait quand même 200 avec SPA shell (= soft 404 pour Google).
- Après (actuel) : Worker propage le 404 réel.
- **Intention** : éviter les soft 404 que Google pénalise.

### 11.bis.2 Pourquoi le rollback peut être la mauvaise solution
- Si SSR a **vraiment** raison (= la page n'existe pas), rollback recrée des soft 404 (Google les déteste tout autant).
- Le vrai problème n'est peut-être pas le Worker mais la détection SSR faux-positifs (Puppeteer qui détecte `data-page-not-found=true` à tort).
- Rollback = pansement qui cache le vrai bug.

### 11.bis.3 Arbre de décision

```
                    Problème : Worker sert 404 sur des URLs valides
                                         │
                ┌────────────────────────┼────────────────────────┐
                ▼                        ▼                        ▼
     SSR renvoie 404 à tort      Worker mal configuré      Route n'existe plus
     (faux positifs Puppeteer)   (règle LP_SEGMENTS        (vraie 404 légitime)
              │                    incomplète)                    │
              ▼                        │                          ▼
     Fix à la source =                 ▼                   Vraie 404, pas de fix
     corriger détection 404     Ajouter pattern LP         mais peut-être 410 +
     dans dynamicRender.ts      dans LP_SEGMENTS,          redirect historique
     (§C §D)                    pas rollback               vers équivalent
```

### 11.bis.4 Plan sûr
1. **Audit d'abord** : pour chaque URL qui renvoie 404 à Googlebot dans notre échantillon, déterminer : a) page inexistante légitime, b) page existante mais SSR faux positif, c) page existante mais route Worker non reconnue.
2. **Classer par cause**. Si (b) domine → fix SSR Puppeteer, **pas** rollback Worker.
3. **Rollback ciblé** uniquement si (c) domine ET que le fix Worker est trop complexe.
4. **Jamais rollback sans test en staging** d'abord.
5. **Canary de 24 h** sur un sous-domaine / une route avant propagation totale.

### 11.bis.5 Alternative : hot-patch ciblé
Plutôt que rollback complet, introduire dans le Worker une **liste de patterns pour lesquels ne PAS propager le SSR 404** pendant la période d'audit :
```js
const SSR_404_SOFT_PROPAGATE_EXCLUDE = [
  /^\/[a-z]{2}-[a-z]{2}\/consulter-/,
  /^\/[a-z]{2}-[a-z]{2}\/sos-/,
  /^\/[a-z]{2}-[a-z]{2}\/country\//,
  /^\/[a-z]{2}-[a-z]{2}\/avocat-[a-z]+$/,
  // ...
];
```
Avec log pour tracker combien de 404 seraient servies vs bypassées, puis décision informée.

### 11.bis.6 Alternatives SSR à évaluer en parallèle du rollback/fix

| Stratégie | Effort | Temps mise en œuvre | Risque | Gain SEO potentiel |
|---|---|---|---|---|
| A — Fix Puppeteer + rollback ciblé | M | 1-2 sem | Faible | +++ (restaure l'existant) |
| B — Migrer parc statique vers SSG (Vite SSG, Astro) | L | 3-6 sem | Moyen | ++++ (TTFB proche 0) |
| C — Edge SSR (Hono + Cloudflare Worker React) | L | 4-8 sem | Moyen-fort (reécriture) | ++++ |
| D — Next.js migration complète | XL | 2-6 mois | Fort | ++++ (mais casse la stack) |
| E — Migrer contenus vers Laravel (déjà en place) | L | 4-12 sem | Moyen | +++ (mais pas la home / profils) |
| F — Pré-render via Rendertron ou Prerender.io | S | 2-5 j | Faible | ++ (dépendance externe) |

Livrer tableau comparatif avec recommandation motivée.

---

## 11. Contexte repo — rappels

- Working dir : `C:\Users\willi\Documents\Projets\VS_CODE\sos-expat-project`.
- Branche : `main`.
- Fichiers non commités (ne pas écraser) : `sos/src/components/booking-mobile/*`.
- Multi-région : booking `europe-west1`, SSR `renderForBotsV2` `europe-west1`, payments/Twilio `europe-west3`, affiliate `us-central1`, Firestore `nam7`.
- Worker via `wrangler` (`sos/cloudflare-worker/wrangler.toml`).
- Frontend Cloudflare Pages via GitHub auto-deploy.
- Firebase Functions déploiement manuel (`firebase deploy --only functions`).
- Blog Laravel séparé, sitemaps fusionnés.
- Langue : **français**.

---

## 12. Plan de démarrage

**Étape 0 — Reproduire exactement la SERP de l'utilisateur avant tout**.
L'utilisateur a rapporté qu'en tapant `https://sos-expat.com/fr-th/pays/thailande` dans Google, il voyait 8 résultats sos-expat. Reproduis cette recherche sur Google.fr (ou demande screenshot à l'utilisateur), **extrais les URLs réelles** (attribut `href` de chaque résultat, pas le breadcrumb affiché), teste chaque URL avec Googlebot UA et avec Chrome UA. Ce geste cadre l'audit : tu sais ce que l'utilisateur voit, tu sais ce qui rank, tu sais quel côté (Laravel / React) domine le SERP pour les requêtes brand + sujet.

**Étape 1 — Vérifier exports utilisateur**. Les exports listés §0.1 sont-ils fournis ? Si non, demander avant d'aller plus loin.

**Étape 2 — Lecture code critique**.
- `sos/cloudflare-worker/worker.js` intégralement.
- `sos/firebase/functions/src/seo/dynamicRender.ts` intégralement.
- `sos/public/index.html` intégralement.
- Point d'entrée Laravel blog (chercher `routes/web.php`, `app/Http/Controllers/BlogController.php` ou équivalent).
- `sos/src/App.tsx` (router React).

**Étape 3 — `git log`** (`--since="21 days ago" --oneline`) sur dossiers sensibles.

**Étape 4 — Cartographier initialement** avant tests live (chantier A + chantier AH.1 prioritaires).

**Étape 5 — Exécuter les 35 chantiers §4** — ordre suggéré :
- **Vague 0 (urgence)** : Étape 0 ci-dessus + chantier AH.1 (mapping Laravel/React) + chantier S (Brand SERP) → établit le cadre.
- **Vague 1 (pour répondre à la question utilisateur)** : AH.2 → AG → P (GSC signals) → U (intent / cannibalisation) → AE (brand entity).
- **Vague 2 (technique)** : C (SSR Puppeteer) → D (faux 404 React) → B (Worker) → AC (pipeline URLs) → AD (pages faibles) → V (WRS Google) → AA (mobile-first) → J (CWV) → AB (logs origine).
- **Vague 3 (contenu)** : H → AF (titles Laravel) → G → F → K → I → Q.
- **Vague 4 (signaux externes)** : L → M → T → W.
- **Finition** : E → N → O → R → X → Y → Z.

**Règle d'interruption** : si un fix P0 émerge dès la vague 0 ou 1 et débloquerait > 50 % du problème, applique la règle §8.16 (stop, remonte, plan de rollback/hot-patch, puis reprends).

**Étape 6 — Récap après chaque chantier** : « vérifié / reste à vérifier ». Ne ferme que quand épuisé.

**Étape 7 — Livrer rapport §7**.

**Étape 8 — Reviewer hostile** sur chaque P0 (§8.13). Réponds aux 4 questions. Ajuste.

---

## 13. Grille d'effort (à utiliser pour chaque fix recommandé)

Chaque problème P0/P1/P2 identifié doit avoir un **effort estimé** selon cette grille :

| Niveau | Durée | Exemple |
|---|---|---|
| **S** | < 4 h | bump d'un flag, correction d'un canonical, ajout meta |
| **M** | 0,5 à 2 jours | patch Worker, correction d'un composant React isolé, ajout de JSON-LD sur un template |
| **L** | 3 à 10 jours | refonte d'un chantier (LP programmatiques, hreflang global), migration partielle |
| **XL** | > 10 jours | migration SSR (Puppeteer → SSG / Edge SSR), refonte architecture URL intercountry |

Et un **impact estimé** :

| Niveau | Portée |
|---|---|
| **impact-++++** | Restaure ou débloque > 50 % du parc URL cible / peut doubler le trafic organique |
| **impact-+++** | 10-50 % / gain significatif brand SERP + ranking non-brand |
| **impact-++** | 2-10 % / amélioration mesurable |
| **impact-+** | < 2 % / polish |

Format ligne attendue dans le plan de remédiation : `[P0][M][impact-++++] Corriger la détection faux-positifs `data-page-not-found` dans dynamicRender.ts:386. Cause : le flag est posé pendant le chargement des données. Fix : conditionner sur `hasTriedLoad=true` au lieu de `data==null`. Fichiers : sos/src/pages/LawyerLanding.tsx, sos/src/pages/HelperLanding.tsx, sos/src/pages/CountryLanding.tsx. Propriétaire : équipe React. Test : URL Inspection GSC sur 20 URLs P0.`

---

## 14. Mesures de succès du prompt (méta)

Cet audit sera considéré comme réussi si :
- On peut **expliquer causalement** en 3 phrases pourquoi le site est invisible.
- On a identifié **au moins 5 P0 spécifiques** avec preuve et impact chiffré selon la grille §13.
- On a un **plan de remédiation actionnable** dans les 15 jours avec propriétaire par fix (équipe Laravel / équipe React/Worker / infra / hors-code).
- On a des **seuils cibles** pour constater la reprise (§10).
- On a un **verdict stratégique** sur l'alternative SSR (rollback, SSG, Edge SSR, migration Laravel — voir §11.bis.6).
- Un reviewer hostile ne trouve pas de trou logique (§8.13) sur aucun P0.
- **Aucune conclusion n'est énoncée sans les deux tests indépendants** (§8.3).

Go.
