# PROMPT AUDIT ULTRA-COMPLET : Tous les Sitemaps de sos-expat.com

## CONTEXTE

Le domaine `sos-expat.com` est alimenté par **3 systèmes** qui génèrent chacun des sitemaps :

1. **Firebase Cloud Functions** (europe-west1) — Sitemaps dynamiques pour le SPA : profils providers, FAQ, centre d'aide, listings pays
2. **Blog Laravel 12** (blog.life-expat.com proxied via Cloudflare) — Sitemaps SSR : articles, landing pages, guides, catégories, tags, pays, outils, sondages, annuaire, images, news Google
3. **Fichier statique** (`sitemap-static.xml`) — Pages statiques du SPA (homepage, pricing, contact, CGU, etc.)

Le tout est fédéré par un **sitemap-index.xml master** (généré par Firebase) qui merge dynamiquement Firebase + Blog à chaque requête.

Le **Cloudflare Worker** (`worker.js`, 181KB) cache tous les sitemaps à l'edge (TTL 1h) et route les requêtes vers Firebase ou Laravel selon le pattern d'URL.

### Problème signalé
J'ai l'impression qu'il manque beaucoup de sitemaps dans Google Search Console. Il faut vérifier que TOUS les sitemaps sont :
- Générés correctement
- Référencés dans le sitemap-index.xml master
- Accessibles publiquement (pas de 404/500)
- Routés correctement par le Worker CF
- Soumis à GSC

---

## INVENTAIRE COMPLET DES SITEMAPS

### A — Sitemaps Firebase (SPA)

| # | URL | Contenu | Source Firestore | Pagination |
|---|---|---|---|---|
| 1 | `/sitemap-index.xml` | Index master (merge Firebase + Blog) | — | Non |
| 2 | `/sitemap-static.xml` | ~810 pages statiques × 9 locales | Fichier statique | Non |
| 3 | `/sitemaps/profiles.xml` | Tous les profils (toutes langues) | `sos_profiles` | Oui (`?page=N`, 500/page) |
| 4 | `/sitemaps/profiles-fr.xml` | Profils langue FR | `sos_profiles` | Oui |
| 5 | `/sitemaps/profiles-en.xml` | Profils langue EN | `sos_profiles` | Oui |
| 6 | `/sitemaps/profiles-es.xml` | Profils langue ES | `sos_profiles` | Oui |
| 7 | `/sitemaps/profiles-de.xml` | Profils langue DE | `sos_profiles` | Oui |
| 8 | `/sitemaps/profiles-pt.xml` | Profils langue PT | `sos_profiles` | Oui |
| 9 | `/sitemaps/profiles-ru.xml` | Profils langue RU | `sos_profiles` | Oui |
| 10 | `/sitemaps/profiles-zh.xml` | Profils langue ZH | `sos_profiles` | Oui |
| 11 | `/sitemaps/profiles-ar.xml` | Profils langue AR | `sos_profiles` | Oui |
| 12 | `/sitemaps/profiles-hi.xml` | Profils langue HI | `sos_profiles` | Oui |
| 13 | `/sitemaps/help.xml` | Tous les articles aide (toutes langues) | `help_articles` | Non |
| 14 | `/sitemaps/help-fr.xml` | Articles aide FR | `help_articles` | Non |
| 15 | `/sitemaps/help-en.xml` | Articles aide EN | `help_articles` | Non |
| 16 | `/sitemaps/help-es.xml` | Articles aide ES | `help_articles` | Non |
| 17 | `/sitemaps/help-de.xml` | Articles aide DE | `help_articles` | Non |
| 18 | `/sitemaps/help-pt.xml` | Articles aide PT | `help_articles` | Non |
| 19 | `/sitemaps/help-ru.xml` | Articles aide RU | `help_articles` | Non |
| 20 | `/sitemaps/help-zh.xml` | Articles aide ZH | `help_articles` | Non |
| 21 | `/sitemaps/help-ar.xml` | Articles aide AR | `help_articles` | Non |
| 22 | `/sitemaps/help-hi.xml` | Articles aide HI | `help_articles` | Non |
| 23 | `/sitemaps/faq.xml` | Toutes les FAQ | `app_faq` | Non |
| 24 | `/sitemaps/country-listings.xml` | Listings pays (toutes langues) | `sos_profiles` | Non |
| 25 | `/sitemaps/listings-fr.xml` | Listings pays FR | `sos_profiles` | Non |
| 26 | `/sitemaps/listings-en.xml` | Listings pays EN | `sos_profiles` | Non |
| 27 | `/sitemaps/listings-es.xml` | Listings pays ES | `sos_profiles` | Non |
| 28 | `/sitemaps/listings-de.xml` | Listings pays DE | `sos_profiles` | Non |
| 29 | `/sitemaps/listings-pt.xml` | Listings pays PT | `sos_profiles` | Non |
| 30 | `/sitemaps/listings-ru.xml` | Listings pays RU | `sos_profiles` | Non |
| 31 | `/sitemaps/listings-zh.xml` | Listings pays ZH | `sos_profiles` | Non |
| 32 | `/sitemaps/listings-ar.xml` | Listings pays AR | `sos_profiles` | Non |
| 33 | `/sitemaps/listings-hi.xml` | Listings pays HI | `sos_profiles` | Non |

**Total Firebase : 33 sitemaps**

---

### B — Sitemaps Blog Laravel

| # | URL Pattern | Contenu | Paginé | Par langue |
|---|---|---|---|---|
| 34 | `/sitemap.xml` (blog) | Index blog (toutes les entrées ci-dessous) | Non | Non |
| 35 | `/sitemaps/articles-{lang}-{page}.xml` | Articles (hors QA/news) | Oui (45K/page) | Oui (×9) |
| 36 | `/sitemaps/news-{lang}-{page}.xml` | Articles type news | Oui (45K/page) | Oui (×9) |
| 37 | `/sitemaps/articles-qa-{lang}-{page}.xml` | Articles type Q&A/FAQ | Oui (45K/page) | Oui (×9) |
| 38 | `/sitemaps/categories-{lang}.xml` | Catégories avec articles | Non | Oui (×9) |
| 39 | `/sitemaps/tags-{lang}.xml` | Tags avec articles | Non | Oui (×9) |
| 40 | `/sitemaps/countries-{lang}.xml` | Pages pays + expatriation + vacances | Non | Oui (×9) |
| 41 | `/sitemaps/guides-{lang}.xml` | Guides pratiques (fiches) | Non | Oui (×9) |
| 42 | `/sitemaps/programme-{lang}.xml` | Pages programme affilié | Non | Oui (×9) |
| 43 | `/sitemaps/qr.xml` | Index FAQ/Q&R par langue | Non | Non (unifié) |
| 44 | `/sitemaps/qr-countries.xml` | FAQ par pays | Non | Non (unifié) |
| 45 | `/sitemaps/tools.xml` | Outils interactifs | Non | Non (unifié) |
| 46 | `/sitemaps/sondages.xml` | Sondages + résultats + stats | Non | Non (unifié) |
| 47 | `/sitemaps/directory.xml` | Annuaire par pays | Non | Non (unifié) |
| 48 | `/sitemaps/images-{lang}.xml` | Banque d'images (galerie) | Non | Oui (×9) |
| 49 | `/sitemaps/images-country-{lang}.xml` | Galeries par pays | Non | Oui (×9) |
| 50 | `/sitemaps/landings-{lang}-{page}.xml` | Landing pages MC API | Oui (45K/page) | Oui (×9) |
| 51 | `/sitemaps/priority-{lang}-{country}.xml` | Sitemaps pays prioritaires | Non | Par combo lang×pays |
| 52 | `/sitemap-news.xml` | Google News (48h, max 1000) | Non | Non (toutes langues) |

**Nombre de fichiers XML blog (estimé) :**
- Articles : 9 langues × N pages = ~9-27 fichiers
- News : 9 × N pages = ~9-18
- QA : 9 × N pages = ~9-18
- Catégories : 9
- Tags : 9
- Pays : 9
- Guides : 9
- Programme : 9
- QR + QR-countries + Tools + Sondages + Directory : 5
- Images : 9
- Images Country : 9
- Landings : 9 × N pages = ~9-27
- Priority : N combos (potentiellement 9 × 197 = 1773, mais uniquement ceux avec contenu)
- News Global : 1

**Total Blog : potentiellement 100-2000+ fichiers XML**

---

### C — Sitemaps spéciaux

| # | URL | Contenu | Notes |
|---|---|---|---|
| 53 | `/robots.txt` | Pointe vers sitemap-index.xml | Vérifie le `Sitemap:` directive |
| 54 | `/{lang}/feed.xml` | RSS Feed par langue (×9) | Pas un sitemap mais soumettable à GSC |
| 55 | `/{lang}/feed.json` | JSON Feed par langue (×9) | Pour agrégateurs |

---

## MISSION D'AUDIT

### PHASE 1 — Vérification d'accessibilité (HTTP)

**Exécute TOUS ces tests curl et rapporte les résultats :**

```bash
echo "=== PHASE 1A : SITEMAP INDEX MASTER ==="
curl -sI "https://sos-expat.com/sitemap-index.xml" | head -10
echo ""
curl -s "https://sos-expat.com/sitemap-index.xml" | head -50
echo ""
echo "Nombre total de <sitemap> dans l'index master :"
curl -s "https://sos-expat.com/sitemap-index.xml" | grep -c '<loc>'

echo ""
echo "=== PHASE 1B : SITEMAP STATIQUE ==="
curl -sI "https://sos-expat.com/sitemap-static.xml" | head -5
echo "Nombre d'URLs dans sitemap-static :"
curl -s "https://sos-expat.com/sitemap-static.xml" | grep -c '<loc>'

echo ""
echo "=== PHASE 1C : SITEMAPS FIREBASE — PROFILS ==="
for lang in fr en es de pt ru zh ar hi; do
  STATUS=$(curl -sI "https://sos-expat.com/sitemaps/profiles-${lang}.xml" -o /dev/null -w "%{http_code}")
  COUNT=$(curl -s "https://sos-expat.com/sitemaps/profiles-${lang}.xml" | grep -c '<url>')
  echo "profiles-${lang}.xml → HTTP ${STATUS} — ${COUNT} URLs"
done
curl -sI "https://sos-expat.com/sitemaps/profiles.xml" -o /dev/null -w "profiles.xml (legacy) → HTTP %{http_code}\n"

echo ""
echo "=== PHASE 1D : SITEMAPS FIREBASE — AIDE ==="
for lang in fr en es de pt ru zh ar hi; do
  STATUS=$(curl -sI "https://sos-expat.com/sitemaps/help-${lang}.xml" -o /dev/null -w "%{http_code}")
  COUNT=$(curl -s "https://sos-expat.com/sitemaps/help-${lang}.xml" | grep -c '<url>')
  echo "help-${lang}.xml → HTTP ${STATUS} — ${COUNT} URLs"
done
curl -sI "https://sos-expat.com/sitemaps/help.xml" -o /dev/null -w "help.xml (legacy) → HTTP %{http_code}\n"

echo ""
echo "=== PHASE 1E : SITEMAPS FIREBASE — FAQ ==="
curl -sI "https://sos-expat.com/sitemaps/faq.xml" -o /dev/null -w "faq.xml → HTTP %{http_code}\n"
curl -s "https://sos-expat.com/sitemaps/faq.xml" | grep -c '<url>'

echo ""
echo "=== PHASE 1F : SITEMAPS FIREBASE — LISTINGS PAYS ==="
for lang in fr en es de pt ru zh ar hi; do
  STATUS=$(curl -sI "https://sos-expat.com/sitemaps/listings-${lang}.xml" -o /dev/null -w "%{http_code}")
  COUNT=$(curl -s "https://sos-expat.com/sitemaps/listings-${lang}.xml" | grep -c '<url>')
  echo "listings-${lang}.xml → HTTP ${STATUS} — ${COUNT} URLs"
done
curl -sI "https://sos-expat.com/sitemaps/country-listings.xml" -o /dev/null -w "country-listings.xml (legacy) → HTTP %{http_code}\n"

echo ""
echo "=== PHASE 1G : SITEMAPS BLOG LARAVEL — ARTICLES ==="
for lang in fr en es de pt ru zh ar hi; do
  STATUS=$(curl -sI "https://sos-expat.com/sitemaps/articles-${lang}-1.xml" -o /dev/null -w "%{http_code}")
  COUNT=$(curl -s "https://sos-expat.com/sitemaps/articles-${lang}-1.xml" | grep -c '<url>')
  echo "articles-${lang}-1.xml → HTTP ${STATUS} — ${COUNT} URLs"
done

echo ""
echo "=== PHASE 1H : SITEMAPS BLOG — NEWS ==="
for lang in fr en es de pt ru zh ar hi; do
  STATUS=$(curl -sI "https://sos-expat.com/sitemaps/news-${lang}-1.xml" -o /dev/null -w "%{http_code}")
  echo "news-${lang}-1.xml → HTTP ${STATUS}"
done
curl -sI "https://sos-expat.com/sitemap-news.xml" -o /dev/null -w "sitemap-news.xml (Google News) → HTTP %{http_code}\n"

echo ""
echo "=== PHASE 1I : SITEMAPS BLOG — QA/FAQ ==="
for lang in fr en es de pt ru zh ar hi; do
  STATUS=$(curl -sI "https://sos-expat.com/sitemaps/articles-qa-${lang}-1.xml" -o /dev/null -w "%{http_code}")
  echo "articles-qa-${lang}-1.xml → HTTP ${STATUS}"
done

echo ""
echo "=== PHASE 1J : SITEMAPS BLOG — CATÉGORIES ==="
for lang in fr en es de pt ru zh ar hi; do
  STATUS=$(curl -sI "https://sos-expat.com/sitemaps/categories-${lang}.xml" -o /dev/null -w "%{http_code}")
  echo "categories-${lang}.xml → HTTP ${STATUS}"
done

echo ""
echo "=== PHASE 1K : SITEMAPS BLOG — TAGS ==="
for lang in fr en es de pt ru zh ar hi; do
  STATUS=$(curl -sI "https://sos-expat.com/sitemaps/tags-${lang}.xml" -o /dev/null -w "%{http_code}")
  echo "tags-${lang}.xml → HTTP ${STATUS}"
done

echo ""
echo "=== PHASE 1L : SITEMAPS BLOG — PAYS ==="
for lang in fr en es de pt ru zh ar hi; do
  STATUS=$(curl -sI "https://sos-expat.com/sitemaps/countries-${lang}.xml" -o /dev/null -w "%{http_code}")
  COUNT=$(curl -s "https://sos-expat.com/sitemaps/countries-${lang}.xml" | grep -c '<url>')
  echo "countries-${lang}.xml → HTTP ${STATUS} — ${COUNT} URLs"
done

echo ""
echo "=== PHASE 1M : SITEMAPS BLOG — GUIDES ==="
for lang in fr en es de pt ru zh ar hi; do
  STATUS=$(curl -sI "https://sos-expat.com/sitemaps/guides-${lang}.xml" -o /dev/null -w "%{http_code}")
  echo "guides-${lang}.xml → HTTP ${STATUS}"
done

echo ""
echo "=== PHASE 1N : SITEMAPS BLOG — PROGRAMME ==="
for lang in fr en es de pt ru zh ar hi; do
  STATUS=$(curl -sI "https://sos-expat.com/sitemaps/programme-${lang}.xml" -o /dev/null -w "%{http_code}")
  echo "programme-${lang}.xml → HTTP ${STATUS}"
done

echo ""
echo "=== PHASE 1O : SITEMAPS BLOG — UNIFIÉS ==="
for file in qr qr-countries tools sondages directory; do
  STATUS=$(curl -sI "https://sos-expat.com/sitemaps/${file}.xml" -o /dev/null -w "%{http_code}")
  COUNT=$(curl -s "https://sos-expat.com/sitemaps/${file}.xml" | grep -c '<url>')
  echo "${file}.xml → HTTP ${STATUS} — ${COUNT} URLs"
done

echo ""
echo "=== PHASE 1P : SITEMAPS BLOG — IMAGES ==="
for lang in fr en es de pt ru zh ar hi; do
  STATUS=$(curl -sI "https://sos-expat.com/sitemaps/images-${lang}.xml" -o /dev/null -w "%{http_code}")
  echo "images-${lang}.xml → HTTP ${STATUS}"
done
for lang in fr en es de pt ru zh ar hi; do
  STATUS=$(curl -sI "https://sos-expat.com/sitemaps/images-country-${lang}.xml" -o /dev/null -w "%{http_code}")
  echo "images-country-${lang}.xml → HTTP ${STATUS}"
done

echo ""
echo "=== PHASE 1Q : SITEMAPS BLOG — LANDING PAGES ==="
for lang in fr en es de pt ru zh ar hi; do
  STATUS=$(curl -sI "https://sos-expat.com/sitemaps/landings-${lang}-1.xml" -o /dev/null -w "%{http_code}")
  echo "landings-${lang}-1.xml → HTTP ${STATUS}"
done

echo ""
echo "=== PHASE 1R : SITEMAPS BLOG — PRIORITY (PAYS CIBLES) ==="
for combo in fr-th fr-vn fr-sg fr-my fr-ph fr-jp fr-au fr-mx fr-br fr-us en-th en-vn en-sg en-my en-ph en-jp en-au en-mx en-br en-us es-mx es-ar es-co de-de pt-br ru-ru zh-cn ar-sa hi-in; do
  STATUS=$(curl -sI "https://sos-expat.com/sitemaps/priority-${combo}.xml" -o /dev/null -w "%{http_code}")
  echo "priority-${combo}.xml → HTTP ${STATUS}"
done

echo ""
echo "=== PHASE 1S : ROBOTS.TXT ==="
curl -s "https://sos-expat.com/robots.txt" | grep -i sitemap

echo ""
echo "=== PHASE 1T : RSS FEEDS ==="
for lang in fr en es de pt ru zh ar hi; do
  STATUS=$(curl -sI "https://sos-expat.com/${lang}/feed.xml" -o /dev/null -w "%{http_code}")
  echo "${lang}/feed.xml → HTTP ${STATUS}"
done
```

**Pour chaque test, rapporter :**
- Code HTTP (200/301/404/500/503)
- Content-Type (`application/xml` ou `text/xml`)
- Nombre d'URLs `<url>` dans le XML
- Headers de cache (`Cache-Control`, `X-Cache-Status`)

---

### PHASE 2 — Vérification du sitemap-index.xml master

**Questions d'audit :**

1. **Exhaustivité** : Le `sitemap-index.xml` liste-t-il TOUS les sitemaps ci-dessus ?
   - Lister chaque `<loc>` du sitemap-index et cocher si présent dans l'inventaire
   - Identifier les sitemaps **manquants** (générés mais non référencés)
   - Identifier les sitemaps **fantômes** (référencés mais retournant 404)

2. **Merge Blog** : Le sitemapIndex Firebase fetch-t-il bien le `/sitemap.xml` du blog et en extrait-il les `<loc>` ?
   - Vérifier dans le code : `sitemaps.ts` → fonction `sitemapIndex()`
   - Que se passe-t-il si le blog est down ? (timeout 10s → mode dégradé)
   - Les sitemaps blog sont-ils ajoutés comme `<sitemap>` enfants ou leurs URLs sont-elles aplaties ?

3. **Doublons** : Y a-t-il des sitemaps référencés en double ?
   - Ex: `/sitemaps/profiles.xml` (legacy) ET `/sitemaps/profiles-fr.xml` (nouveau) → mêmes URLs ?
   - Ex: Le blog génère `/sitemaps/faq.xml` ET Firebase aussi → conflit ?

4. **Routing Worker** : Le Worker CF route-t-il chaque sitemap vers le bon backend ?
   - `/sitemap-index.xml` → Firebase function `sitemapIndex`
   - `/sitemap-static.xml` → Fichier statique Cloudflare Pages
   - `/sitemaps/profiles-*.xml` → Firebase function `sitemapProfiles`
   - `/sitemaps/articles-*.xml` → Blog Laravel
   - `/sitemaps/landings-*.xml` → Blog Laravel
   - `/sitemap.xml` → Blog Laravel (attention : pas Firebase !)
   - `/sitemap-news.xml` → Blog Laravel

   **Vérifier dans `worker.js`** : comment le Worker distingue les sitemaps Firebase des sitemaps Blog ? Y a-t-il un pattern matching explicite ou un fallback ?

5. **`<lastmod>`** : Les dates `<lastmod>` sont-elles réelles (date de dernière modification) ou toujours `new Date().toISOString()` (date de génération) ?

---

### PHASE 3 — Vérification du contenu des sitemaps

#### 3.1 Validité XML

Pour chaque sitemap accessible, vérifier :
```bash
# Tester la validité XML (ne doit pas contenir d'erreurs de parsing)
curl -s "https://sos-expat.com/sitemaps/articles-fr-1.xml" | xmllint --noout - 2>&1
curl -s "https://sos-expat.com/sitemaps/profiles-fr.xml" | xmllint --noout - 2>&1
# etc.
```

#### 3.2 Format des URLs dans les sitemaps

**Questions :**
1. Toutes les `<loc>` commencent-elles par `https://sos-expat.com/` (pas `http://`, pas `blog.life-expat.com`, pas de trailing slash incohérent) ?
2. Les locales dans les URLs sont-elles au bon format `{lang}-{country}` (minuscules) ?
3. Le code chinois est-il `zh` (pas `ch`) dans toutes les URLs ?
4. Les slugs sont-ils en ASCII romanisé (pas d'Unicode) ?
5. Y a-t-il des URLs avec des doubles slashes `//` ?

```bash
# Vérifier les URLs suspectes dans les sitemaps
curl -s "https://sos-expat.com/sitemaps/articles-fr-1.xml" | grep '<loc>' | grep -v 'https://sos-expat.com/'
curl -s "https://sos-expat.com/sitemaps/articles-fr-1.xml" | grep '<loc>' | grep -i '/ch-'
curl -s "https://sos-expat.com/sitemaps/articles-fr-1.xml" | grep '<loc>' | grep '//'| grep -v 'https://'
curl -s "https://sos-expat.com/sitemaps/profiles-fr.xml" | grep '<loc>' | grep -E '[A-Z]'
```

#### 3.3 Hreflang dans les sitemaps

**Questions :**
1. Chaque `<url>` contient-il des `<xhtml:link rel="alternate" hreflang="...">` pour les 9 langues + `x-default` ?
2. Les hreflang sont-ils **symétriques** (si FR→EN existe, EN→FR existe aussi dans le sitemap EN) ?
3. Les codes hreflang sont-ils corrects : `fr`, `en`, `es`, `de`, `ru`, `pt`, `zh-Hans`, `hi`, `ar`, `x-default` ?
4. Le `x-default` pointe-t-il vers la version FR ?
5. Les URLs dans les hreflang existent-elles réellement (pas de 404) ?

```bash
# Extraire les hreflang du premier article FR
curl -s "https://sos-expat.com/sitemaps/articles-fr-1.xml" | grep -A 15 '<url>' | head -20

# Compter les hreflang par URL
curl -s "https://sos-expat.com/sitemaps/articles-fr-1.xml" | grep -c 'xhtml:link'
curl -s "https://sos-expat.com/sitemaps/articles-fr-1.xml" | grep -c '<url>'
# Ratio attendu : ~10 hreflang par URL (9 langues + x-default)
```

#### 3.4 Images dans les sitemaps

**Questions :**
1. Les sitemaps articles contiennent-ils des `<image:image>` ?
2. Les URLs d'images sont-elles absolues et accessibles ?
3. Les sitemaps profils contiennent-ils les photos de profil ?
4. Les sitemaps images du blog ont-ils les extensions Google Image Sitemap (`<image:title>`, `<image:caption>`, `<image:geo_location>`) ?

#### 3.5 News Sitemap

**Questions :**
1. Le `/sitemap-news.xml` ne contient-il que des articles de moins de 48h ?
2. Chaque entrée a-t-elle l'extension `<news:news>` avec `<news:publication>`, `<news:publication_date>`, `<news:title>` ?
3. Le nombre d'entrées est-il ≤ 1000 (limite Google News) ?
4. Le `<news:language>` est-il correct pour chaque article ?

```bash
curl -s "https://sos-expat.com/sitemap-news.xml" | head -30
curl -s "https://sos-expat.com/sitemap-news.xml" | grep -c '<url>'
curl -s "https://sos-expat.com/sitemap-news.xml" | grep 'news:publication_date'
```

---

### PHASE 4 — Vérification des URLs référencées

#### 4.1 Sampling aléatoire (10 URLs par sitemap type)

Pour chaque type de sitemap, extraire 10 URLs aléatoires et vérifier qu'elles retournent HTTP 200 :

```bash
# Extraire 10 URLs aléatoires d'un sitemap et vérifier
extract_and_check() {
  SITEMAP_URL=$1
  echo "--- Checking ${SITEMAP_URL} ---"
  URLS=$(curl -s "${SITEMAP_URL}" | grep '<loc>' | sed 's/.*<loc>//;s/<\/loc>.*//' | shuf -n 10)
  for url in $URLS; do
    STATUS=$(curl -sI "$url" -o /dev/null -w "%{http_code}" --max-time 10)
    echo "  ${STATUS} — ${url}"
  done
}

extract_and_check "https://sos-expat.com/sitemaps/articles-fr-1.xml"
extract_and_check "https://sos-expat.com/sitemaps/profiles-fr.xml"
extract_and_check "https://sos-expat.com/sitemaps/countries-fr.xml"
extract_and_check "https://sos-expat.com/sitemaps/landings-fr-1.xml"
extract_and_check "https://sos-expat.com/sitemaps/help-fr.xml"
extract_and_check "https://sos-expat.com/sitemaps/faq.xml"
extract_and_check "https://sos-expat.com/sitemaps/tools.xml"
extract_and_check "https://sos-expat.com/sitemaps/directory.xml"
extract_and_check "https://sos-expat.com/sitemap-static.xml"
```

#### 4.2 Détection des 301/302 dans les sitemaps

Les sitemaps ne doivent JAMAIS contenir des URLs qui redirigent (pénalité Google "Page with redirect").

```bash
# Vérifier qu'aucune URL du sitemap ne redirige
check_redirects() {
  SITEMAP_URL=$1
  echo "--- Redirect check: ${SITEMAP_URL} ---"
  URLS=$(curl -s "${SITEMAP_URL}" | grep '<loc>' | sed 's/.*<loc>//;s/<\/loc>.*//')
  REDIRECT_COUNT=0
  for url in $URLS; do
    STATUS=$(curl -sI "$url" -o /dev/null -w "%{http_code}" --max-time 10)
    if [ "$STATUS" = "301" ] || [ "$STATUS" = "302" ]; then
      echo "  REDIRECT ${STATUS} — ${url}"
      REDIRECT_COUNT=$((REDIRECT_COUNT + 1))
    fi
  done
  echo "  Total redirects: ${REDIRECT_COUNT}"
}

# Tester sur les sitemaps les plus importants
check_redirects "https://sos-expat.com/sitemaps/articles-fr-1.xml"
check_redirects "https://sos-expat.com/sitemaps/profiles-fr.xml"
check_redirects "https://sos-expat.com/sitemap-static.xml"
```

#### 4.3 Vérification des locales non-canoniques dans les sitemaps

Les locales non-canoniques (`fr-th`, `en-gb`, `pt-br`, etc.) ne doivent PAS apparaître dans les sitemaps (elles sont redirigées 301).

```bash
# Chercher des locales non-canoniques dans les sitemaps
CANONICAL="fr-fr|en-us|es-es|de-de|pt-pt|ru-ru|zh-cn|ar-sa|hi-in"
for sitemap in articles-fr-1 profiles-fr countries-fr landings-fr-1; do
  echo "--- Non-canonical locales in ${sitemap}.xml ---"
  curl -s "https://sos-expat.com/sitemaps/${sitemap}.xml" | grep '<loc>' | grep -vE "(${CANONICAL})" | head -5
done
```

---

### PHASE 5 — Audit du routing Worker Cloudflare

**Fichier à lire :** `sos/cloudflare-worker/worker.js`

**Questions d'audit :**

1. **Pattern matching** : Comment le Worker décide-t-il si un sitemap va vers Firebase ou vers Laravel ?
   - Lister la logique de routing exacte (regex, if/else, switch)
   - Y a-t-il des patterns ambigus qui pourraient envoyer un sitemap au mauvais backend ?

2. **Conflit de noms** : Firebase génère `/sitemaps/faq.xml` ET le blog Laravel aussi (`/sitemaps/qr.xml` alias `/sitemaps/faq.xml`) → qui gagne ?

3. **Cache edge** :
   - Le TTL est-il bien 3600s pour tous les sitemaps ?
   - La clé de cache inclut-elle les query params (`?lang=fr&page=1`) ?
   - Le cache est-il invalidé quand un nouveau contenu est publié ? Ou faut-il attendre 1h ?
   - La version de cache (actuellement `v11`) affecte-t-elle les sitemaps ?

4. **Headers** :
   - Content-Type : `application/xml; charset=utf-8` (pas `text/html`) ?
   - `X-Robots-Tag` : absent (les sitemaps ne doivent PAS avoir `noindex`) ?
   - Pas de `X-Frame-Options` ou CSP qui bloquerait le parsing ?

```bash
# Vérifier les headers d'un sitemap
curl -sI "https://sos-expat.com/sitemaps/articles-fr-1.xml"
curl -sI "https://sos-expat.com/sitemaps/profiles-fr.xml"
curl -sI "https://sos-expat.com/sitemap-index.xml"
curl -sI "https://sos-expat.com/sitemap-static.xml"
```

---

### PHASE 6 — Audit du code de génération

#### 6.1 Firebase — `sitemaps.ts`

**Fichier :** `sos/firebase/functions/src/seo/sitemaps.ts`

**Questions :**
1. La fonction `sitemapIndex()` liste-t-elle TOUS les sitemaps Firebase (profiles ×9 langues, help ×9, listings ×9, faq, static) ?
2. Le merge blog fonctionne-t-il ? (fetch `https://sos-expat.com/sitemap.xml` avec timeout 10s)
3. Les URLs générées dans les `<loc>` utilisent-elles `https://sos-expat.com` (pas `https://sos-expat.com/` avec trailing slash ni `http://`) ?
4. Le filtre SEO score ≥40 est-il appliqué ? Quel est le `MIN_SEO_SCORE` ?
5. La pagination (500/page) est-elle correctement implémentée ?
6. Les `<xhtml:link>` hreflang sont-ils générés pour chaque `<url>` ?

#### 6.2 Blog Laravel — `SeoController.php`

**Fichier :** `Blog_sos-expat_frontend/app/Http/Controllers/SeoController.php`

**Questions :**
1. La méthode `sitemapIndex()` liste-t-elle TOUS les types de sitemaps blog ?
2. Les sitemaps vides (0 article dans une langue) sont-ils exclus de l'index ?
3. La pagination 45K est-elle correctement implémentée (count, ceil, loop) ?
4. Les sitemaps `priority-{lang}-{country}` sont-ils générés pour TOUS les combos avec contenu ?
5. Le `sitemap-news.xml` filtre-t-il bien sur `created_at >= now() - 48h` ?
6. Les hreflang dans les sitemaps blog utilisent-ils `CanonicalService::HREFLANG_MAP` ?
7. Le `x-default` est-il cohérent (FR par défaut, EN en fallback) ?
8. Les landing pages du MC API sont-elles bien incluses dans le sitemap blog ? La connexion `mc_api` fonctionne-t-elle ?

#### 6.3 Sitemap statique

**Fichier :** `sos/public/sitemap-static.xml` (~5815 lignes)

**Questions :**
1. Contient-il les 9 locales canoniques pour chaque page ?
2. Y a-t-il des pages qui ont été ajoutées au frontend mais pas au sitemap statique ?
3. Les hreflang sont-ils présents et corrects ?
4. Les `<changefreq>` et `<priority>` sont-ils raisonnables ?
5. Le fichier est-il mis à jour quand on ajoute de nouvelles routes au SPA ?

---

### PHASE 7 — Cohérence cross-système

#### 7.1 Tableau de couverture

Remplir ce tableau en vérifiant chaque case :

| Type de contenu | Sitemap Firebase | Sitemap Blog | sitemap-index.xml | GSC soumis ? |
|---|---|---|---|---|
| Pages statiques SPA | `sitemap-static.xml` | — | ? | ? |
| Profils providers | `profiles-{lang}.xml` | — | ? | ? |
| Centre d'aide | `help-{lang}.xml` | — | ? | ? |
| FAQ SPA | `faq.xml` | — | ? | ? |
| Listings pays SPA | `listings-{lang}.xml` | — | ? | ? |
| Articles blog | — | `articles-{lang}-{page}.xml` | ? | ? |
| News blog | — | `news-{lang}-{page}.xml` | ? | ? |
| Q&A blog | — | `articles-qa-{lang}-{page}.xml` | ? | ? |
| Catégories blog | — | `categories-{lang}.xml` | ? | ? |
| Tags blog | — | `tags-{lang}.xml` | ? | ? |
| Pages pays blog | — | `countries-{lang}.xml` | ? | ? |
| Guides blog | — | `guides-{lang}.xml` | ? | ? |
| Programme blog | — | `programme-{lang}.xml` | ? | ? |
| FAQ index blog | — | `qr.xml` | ? | ? |
| FAQ pays blog | — | `qr-countries.xml` | ? | ? |
| Outils blog | — | `tools.xml` | ? | ? |
| Sondages blog | — | `sondages.xml` | ? | ? |
| Annuaire blog | — | `directory.xml` | ? | ? |
| Galerie images | — | `images-{lang}.xml` | ? | ? |
| Galerie pays | — | `images-country-{lang}.xml` | ? | ? |
| Landing pages | — | `landings-{lang}-{page}.xml` | ? | ? |
| Priority pays | — | `priority-{lang}-{country}.xml` | ? | ? |
| Google News | — | `sitemap-news.xml` | ? | ? |
| **Témoignages/Avis** | ❓ AUCUN ? | ❓ AUCUN ? | ? | ? |
| **Landing affiliés publiques** | ❓ dans static ? | — | ? | ? |
| **Pages communauté** | ❓ dans static ? | — | ? | ? |
| **Sous-types : comparative** | — | ❓ dans articles ? | ? | ? |
| **Sous-types : testimonial** | — | ❓ dans articles ? | ? | ? |
| **Sous-types : statistics** | — | ❓ dans articles ? | ? | ? |
| **Sous-types : pain_point** | — | ❓ dans articles ? | ? | ? |
| **Sous-types : brand_content** | — | ❓ dans articles ? | ? | ? |
| **Sous-types : guide_city** | — | ❓ dans articles ? | ? | ? |
| **Sous-types : press_release** | — | ❓ dans articles ? | ? | ? |
| **Photos providers** | ❓ `<image:image>` dans profiles ? | — | ? | ? |
| **Vidéos** | ❓ AUCUN ? | ❓ AUCUN ? | ? | ? |

Pour chaque "?", vérifier :
- Le sitemap est-il **généré** (code existe) ?
- Est-il **référencé** dans le sitemap-index.xml ?
- Est-il **accessible** en production (HTTP 200) ?
- Est-il **soumis** à Google Search Console ?
- Contient-il des **URLs valides** (pas de 404/301) ?

#### 7.2 Sitemaps potentiellement manquants dans GSC

Basé sur l'architecture, voici les sitemaps que tu devrais trouver soumis dans GSC. Vérifie si chacun est présent :

**Sitemaps à soumettre dans GSC :**
```
https://sos-expat.com/sitemap-index.xml     ← LE PLUS IMPORTANT (index master)
```

**OU soumettre chaque sitemap individuellement si le master ne les inclut pas tous :**
```
# Firebase
https://sos-expat.com/sitemap-static.xml
https://sos-expat.com/sitemaps/profiles-fr.xml
https://sos-expat.com/sitemaps/profiles-en.xml
... (×9 langues)
https://sos-expat.com/sitemaps/help-fr.xml
... (×9)
https://sos-expat.com/sitemaps/listings-fr.xml
... (×9)
https://sos-expat.com/sitemaps/faq.xml

# Blog
https://sos-expat.com/sitemaps/articles-fr-1.xml
... (×9 langues × N pages)
https://sos-expat.com/sitemaps/news-fr-1.xml
... (×9)
https://sos-expat.com/sitemaps/articles-qa-fr-1.xml
... (×9)
https://sos-expat.com/sitemaps/categories-fr.xml
... (×9)
https://sos-expat.com/sitemaps/tags-fr.xml
... (×9)
https://sos-expat.com/sitemaps/countries-fr.xml
... (×9)
https://sos-expat.com/sitemaps/guides-fr.xml
... (×9)
https://sos-expat.com/sitemaps/programme-fr.xml
... (×9)
https://sos-expat.com/sitemaps/qr.xml
https://sos-expat.com/sitemaps/qr-countries.xml
https://sos-expat.com/sitemaps/tools.xml
https://sos-expat.com/sitemaps/sondages.xml
https://sos-expat.com/sitemaps/directory.xml
https://sos-expat.com/sitemaps/images-fr.xml
... (×9)
https://sos-expat.com/sitemaps/images-country-fr.xml
... (×9)
https://sos-expat.com/sitemaps/landings-fr-1.xml
... (×9)
https://sos-expat.com/sitemap-news.xml
```

---

### PHASE 8 — PAGES INDEXABLES SANS SITEMAP (Pages orphelines)

C'est la phase la plus critique. Beaucoup de pages existent et sont indexables mais n'apparaissent dans **aucun** sitemap.

#### 8.1 Pages témoignages/avis (SPA)

**Routes existantes dans le frontend :**
- `/testimonials` — liste des témoignages
- `/testimonials/:country/:language/:reviewType` — page détail avis (ex: `/testimonials/france/fr/avocat-urgent`)
- `/temoignages/:country/:language/:reviewType` — alias FR

**Questions :**
1. Ces pages ont-elles un sitemap dédié ? (Probablement **NON**)
2. Sont-elles dans `sitemap-static.xml` ?
3. Combien de combinaisons country×language×reviewType existent ? (potentiellement des centaines)
4. Ces pages ont-elles des données structurées `Review` et `AggregateRating` ?
5. Google voit-il ces pages uniquement via les liens internes (sans sitemap) ?

**Vérification :**
```bash
# La page témoignages existe-t-elle ?
curl -sI "https://sos-expat.com/fr-fr/temoignages" | head -5

# Les pages détail existent-elles ?
curl -sI "https://sos-expat.com/fr-fr/temoignages/france/fr/avocat-urgent" | head -5

# Chercher "testimonial" dans le sitemap-static.xml
curl -s "https://sos-expat.com/sitemap-static.xml" | grep -i "testimonial\|temoignage"
```

**Impact potentiel :** Les pages d'avis avec des données structurées `Review` génèrent des **étoiles dans les SERPs** → CTR ×2-3. Si elles ne sont pas dans les sitemaps, Google les découvre lentement voire pas du tout.

#### 8.2 Landing pages affiliés publiques (SPA)

**Routes existantes :**
- `/devenir-chatter` — Landing page chatter
- `/devenir-influenceur` — Landing page influenceur
- `/devenir-blogger` — Landing page blogueur
- `/devenir-admin-groupe` — Landing page group admin
- `/devenir-capitaine` — Landing page capitaine
- `/devenir-partenaire` — Landing page partenaire

**Questions :**
1. Ces 6 pages sont-elles dans `sitemap-static.xml` (dans les 9 locales) ?
2. Ont-elles des hreflang dans les sitemaps ?
3. Ont-elles des données structurées (JobPosting, Offer, etc.) ?

```bash
# Vérifier dans sitemap-static
curl -s "https://sos-expat.com/sitemap-static.xml" | grep -i "devenir\|chatter\|influenceur\|blogger\|admin-groupe\|capitaine\|partenaire"
```

#### 8.3 Pages communauté publiques (SPA)

**Routes existantes :**
- `/nos-influenceurs` — Annuaire influenceurs
- `/nos-blogueurs` — Annuaire blogueurs
- `/nos-chatters` — Annuaire chatters
- `/groupes-communaute` — Groupes communautaires
- `/presse` — Page presse

**Questions :**
1. Ces pages sont-elles dans `sitemap-static.xml` ?
2. Ont-elles des hreflang ?

```bash
curl -s "https://sos-expat.com/sitemap-static.xml" | grep -i "nos-influenceurs\|nos-blogueurs\|nos-chatters\|groupes-communaute\|presse"
```

#### 8.4 Sous-types d'articles blog (couverture)

Le blog Laravel a de nombreux `content_type` différents. Vérifier que CHACUN est couvert par au moins un sitemap :

| content_type | Sitemap attendu | Couvert ? |
|---|---|---|
| `article` | `articles-{lang}-{page}.xml` | Probablement oui |
| `news` | `news-{lang}-{page}.xml` | Probablement oui |
| `qa` | `articles-qa-{lang}-{page}.xml` | Probablement oui |
| `guide` | `guides-{lang}.xml` | Probablement oui |
| `tutorial` | ❓ Dans articles ou guides ? | À vérifier |
| `testimonial` | ❓ AUCUN dédié | **À vérifier** |
| `comparative` | ❓ Dans articles ? | **À vérifier** |
| `statistics` | ❓ Dans articles ? | **À vérifier** |
| `pain_point` | ❓ Dans articles ? | **À vérifier** |
| `brand_content` | ❓ Dans articles ? | **À vérifier** |
| `guide_city` | ❓ Dans guides ou articles ? | **À vérifier** |
| `press_release` | ❓ Dans news ou articles ? | **À vérifier** |
| `qa_needs` | ❓ Dans QA ? | **À vérifier** |

**Vérification dans le code :**

Lire `SeoController.php` et vérifier les requêtes SQL de chaque méthode sitemap :
- `articles-{lang}` : filtre-t-il `WHERE content_type NOT IN ('qa', 'news')` ou prend-il tout ?
- `news-{lang}` : filtre-t-il `WHERE content_type = 'news'` uniquement ?
- Si un `content_type` comme `comparative` ou `statistics` n'est ni dans articles ni dans un sitemap dédié → **pages orphelines**

```bash
# Compter les articles par content_type dans la BDD blog
# (à exécuter en SSH sur le VPS ou via un endpoint admin)
# SELECT content_type, COUNT(*) FROM articles WHERE status='published' GROUP BY content_type ORDER BY COUNT(*) DESC;
```

**Impact :** Si des articles `comparative` ou `statistics` existent en BDD mais ne sont dans aucun sitemap, Google ne les trouvera que via les liens internes → indexation lente.

#### 8.5 Photos providers dans les sitemaps

**Questions :**
1. Les sitemaps `profiles-{lang}.xml` contiennent-ils des `<image:image>` pour les photos de profil ?
2. Format attendu :
```xml
<url>
  <loc>https://sos-expat.com/fr-fr/avocat-thailande/jean-visa-k7m2p9</loc>
  <image:image>
    <image:loc>https://firebasestorage.googleapis.com/...</image:loc>
    <image:title>Jean Dupont - Avocat en Thaïlande</image:title>
    <image:caption>Avocat spécialisé visa et immigration</image:caption>
  </image:image>
</url>
```
3. Si les photos ne sont pas dans les sitemaps → Google Images ne les indexe pas → perte de trafic image

```bash
# Vérifier la présence de <image:image> dans les sitemaps profils
curl -s "https://sos-expat.com/sitemaps/profiles-fr.xml" | grep -c 'image:image'
curl -s "https://sos-expat.com/sitemaps/profiles-fr.xml" | grep 'image:loc' | head -3
```

#### 8.6 Images de la galerie blog

**Questions :**
1. Le sitemap `images-{lang}.xml` contient-il l'extension Google Image Sitemap ?
2. Les `<image:image>` ont-ils `<image:title>`, `<image:caption>`, `<image:geo_location>`, `<image:license>` ?
3. Les images sont-elles accessibles (pas de 403/404 sur les URLs d'images) ?
4. Le `images-country-{lang}.xml` couvre-t-il toutes les galeries pays ?
5. Les images des articles (`featured_image`) sont-elles aussi dans un sitemap image ?

```bash
# Vérifier le contenu du sitemap images
curl -sI "https://sos-expat.com/sitemaps/images-fr.xml" | head -5
curl -s "https://sos-expat.com/sitemaps/images-fr.xml" | head -40
curl -s "https://sos-expat.com/sitemaps/images-fr.xml" | grep -c 'image:image'

# Vérifier les images pays
curl -sI "https://sos-expat.com/sitemaps/images-country-fr.xml" | head -5
curl -s "https://sos-expat.com/sitemaps/images-country-fr.xml" | grep -c 'image:image'

# Vérifier que les articles ont des images dans leurs sitemaps
curl -s "https://sos-expat.com/sitemaps/articles-fr-1.xml" | grep -c 'image:image'
```

#### 8.7 Vidéos

**Questions :**
1. Y a-t-il des vidéos sur le site (YouTube embeds, vidéos uploadées) ?
2. Si oui, y a-t-il un **video sitemap** dédié ?
3. Le schema `VideoObject` est généré côté SPA (`VideoSchema.tsx`) mais les vidéos sont-elles dans un sitemap ?
4. Format attendu pour un video sitemap :
```xml
<url>
  <loc>https://sos-expat.com/fr-fr/page-avec-video</loc>
  <video:video>
    <video:thumbnail_loc>https://...</video:thumbnail_loc>
    <video:title>...</video:title>
    <video:description>...</video:description>
    <video:content_loc>https://...</video:content_loc>
  </video:video>
</url>
```

```bash
# Chercher si un video sitemap existe
curl -sI "https://sos-expat.com/sitemaps/videos.xml" | head -5
curl -s "https://sos-expat.com/sitemap-index.xml" | grep -i 'video'
```

#### 8.8 Données structurées (Rich Results) dans les sitemaps

Les sitemaps ne contiennent pas directement les données structurées, mais les pages référencées DOIVENT avoir les bons schemas pour les rich results. Vérifier :

| Type de page | Schema attendu | Rich Result Google | Vérifié ? |
|---|---|---|---|
| Provider profil | `LegalService` + `AggregateRating` + `Review` | ⭐ Étoiles dans les SERPs | ? |
| Article blog | `Article` + `BreadcrumbList` | 📰 Article snippet | ? |
| News blog | `NewsArticle` | 📰 Top Stories carousel | ? |
| FAQ/QA | `FAQPage` + `Question` + `Answer` | ❓ FAQ accordéon | ? |
| Guide/HowTo | `HowTo` + `HowToStep` | 📋 How-to steps | ? |
| Testimonial | `Review` + `AggregateRating` | ⭐ Étoiles | ? |
| Comparative | `ItemList` + `Product` | 📊 Product comparison | ? |
| Statistics | `Dataset` | 📈 Dataset snippet | ? |
| Tool/Calculator | ❓ `WebApplication` ? | 🔧 Tool action | ? |
| Sondage results | ❓ Aucun ? | — | ? |
| Image gallery | `ImageObject` + `ImageGallery` | 🖼️ Image pack | ? |
| Video | `VideoObject` | 🎬 Video carousel | ? |
| Landing page | `Service` / `Product` | ✅ CTA snippet | ? |
| Annuaire/Directory | `ItemList` + `LocalBusiness` | 📍 Local pack | ? |

**Test Rich Results sur les pages référencées dans les sitemaps :**
```bash
# Extraire 1 URL de chaque type de sitemap et la tester
# avec l'outil Google Rich Results Test (URL) :
# https://search.google.com/test/rich-results

# OU vérifier le JSON-LD directement :
curl -s "https://sos-expat.com/fr-fr/avocat-thailande/jean-visa-k7m2p9" | grep -o '<script type="application/ld+json">.*</script>' | head -3

# Blog articles
curl -s "https://sos-expat.com/fr-fr/articles/premier-article" | grep -o '<script type="application/ld+json">.*</script>' | head -3
```

#### 8.9 Pages de recherche

**Questions :**
1. Y a-t-il une page de recherche (`/search`, `/recherche`) ?
2. Si oui, est-elle dans les sitemaps ? (Généralement non recommandé, mais à vérifier)
3. La page de recherche a-t-elle un `SearchAction` dans le JSON-LD `WebSite` ? (Pour le sitelinks search box)

```bash
curl -s "https://sos-expat.com/sitemap-static.xml" | grep -i "search\|recherche"
```

#### 8.10 Flux RSS/Atom/JSON Feed

Les flux ne sont pas des sitemaps mais peuvent être soumis à GSC et aident le crawl :

```bash
# Vérifier les feeds
for lang in fr en es de pt ru zh ar hi; do
  STATUS_XML=$(curl -sI "https://sos-expat.com/${lang}/feed.xml" -o /dev/null -w "%{http_code}")
  STATUS_JSON=$(curl -sI "https://sos-expat.com/${lang}/feed.json" -o /dev/null -w "%{http_code}")
  echo "${lang}/feed.xml → ${STATUS_XML} | ${lang}/feed.json → ${STATUS_JSON}"
done
```

**Questions :**
1. Les feeds sont-ils référencés dans le `<head>` des pages blog ? (`<link rel="alternate" type="application/rss+xml">`)
2. Les feeds contiennent-ils les articles récents (pas vides) ?
3. Sont-ils soumis à GSC ?

---

### PHASE 9 — Vérification robots.txt

```bash
curl -s "https://sos-expat.com/robots.txt"
```

**Questions :**
1. Le `Sitemap:` directive pointe-t-il vers `https://sos-expat.com/sitemap-index.xml` ?
2. Y a-t-il d'autres directives `Sitemap:` (blog, etc.) ?
3. Les `Disallow:` ne bloquent-ils pas l'accès aux sitemaps ou aux pages référencées dans les sitemaps ?
4. Le `Crawl-delay:` (si présent) est-il raisonnable ?
5. Les routes admin sont-elles bien `Disallow:` ?
6. Les routes protégées (dashboard, affiliate, chatter, influencer, blogger, group-admin, partner) sont-elles `Disallow:` ?

---

### PHASE 10 — Plan d'action

À la fin de l'audit, produis :

#### 10.1 Liste des sitemaps manquants dans GSC
Avec la commande `curl` pour tester + l'URL exacte à soumettre dans GSC.

#### 10.2 Liste des sitemaps cassés (404/500)
Avec la cause probable et le fix (Worker routing ? Fonction pas déployée ? Route manquante ?)

#### 10.3 Liste des sitemaps avec URLs invalides
URLs qui retournent 301/404 — à corriger dans le sitemap ou dans le routing.

#### 10.4 Sitemaps vides (0 URL)
À exclure du sitemap-index ou à alimenter avec du contenu.

#### 10.5 Problèmes de cohérence
- Doublons entre Firebase et Blog
- hreflang manquants ou incorrects
- `<lastmod>` faux
- Locales non-canoniques dans les sitemaps

#### 10.6 Sitemaps à CRÉER (n'existent pas encore)

Basé sur la Phase 8, lister les sitemaps qui devraient exister mais n'ont pas de code de génération :

| Sitemap manquant | Pages couvertes | Priorité |
|---|---|---|
| `testimonials-{lang}.xml` | Pages témoignages/avis SPA | P0 (étoiles dans SERPs) |
| `videos.xml` | Pages avec vidéos embeddées | P2 (si vidéos existent) |
| Sous-types blog dédiés ? | comparative, statistics, etc. | P1 (si non inclus dans articles) |

Pour chaque sitemap à créer, proposer :
- L'implémentation (Firebase function ou route Laravel)
- Le format XML attendu (avec exemple)
- Les données structurées associées
- Comment l'ajouter au sitemap-index.xml

#### 10.7 Script de soumission GSC

Proposer un script bash utilisant l'API GSC (ou les commandes manuelles) pour soumettre tous les sitemaps manquants.

---

## FORMAT DE SORTIE ATTENDU

Pour chaque sitemap testé :

```
### [URL du sitemap]

| Critère | Résultat |
|---|---|
| HTTP Status | 200 / 404 / 500 |
| Content-Type | application/xml / text/html (❌) |
| Nombre d'URLs | N |
| Hreflang présents | Oui (9 langues + x-default) / Non ❌ |
| URLs valides (sampling) | 10/10 → 200 / 8/10 → 2 redirects ❌ |
| Référencé dans index | Oui / Non ❌ |
| Soumis GSC | Oui / Non ❌ / À vérifier |

**Problèmes trouvés :**
- ❌ [Description]

**Action :**
- 💡 [Fix concret]
```

---

## NOTES POUR L'AUDITEUR

1. **Exécute les curl en production** — ne te base pas uniquement sur le code source, le Worker CF peut transformer les réponses
2. **Le blog Laravel est proxied** via le Worker CF — une requête à `sos-expat.com/sitemaps/articles-fr-1.xml` ne va PAS directement au blog, elle passe par le Worker
3. **Le sitemap-index.xml est dynamique** — il fetche le blog à chaque requête (timeout 10s), donc il peut varier
4. **Cache 1h** — si tu corriges un sitemap, il faudra attendre 1h ou bumper la version du cache Worker
5. **Les sitemaps `priority-{lang}-{country}`** sont potentiellement les plus importants pour le SEO car ils regroupent TOUT le contenu d'un pays dans une langue — vérifie qu'ils sont tous dans l'index
6. **Google News sitemap** doit être soumis SÉPARÉMENT dans GSC (pas juste dans l'index)
7. **GSC limite à 500 sitemaps soumis** — si on dépasse, il faut regrouper via les index
8. **Les données structurées des pages comptent** — un sitemap avec des pages qui ont du JSON-LD `Review`/`AggregateRating` génère des étoiles dans les SERPs, c'est LE levier de CTR le plus puissant
9. **Les sous-types blog sont le piège** — `comparative`, `statistics`, `pain_point`, `brand_content`, `guide_city`, `press_release` peuvent être filtrés par les requêtes SQL des sitemaps et devenir des pages orphelines sans qu'on le remarque
10. **Les images comptent pour Google Images** — les sitemaps avec `<image:image>` permettent l'indexation dans Google Images, qui représente ~20% du trafic de recherche
11. **Les pages de témoignages/avis sont probablement le plus gros manque** — elles génèrent des rich results avec étoiles mais n'ont probablement aucun sitemap dédié
