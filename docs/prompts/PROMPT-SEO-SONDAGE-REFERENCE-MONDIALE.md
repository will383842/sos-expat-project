# PROMPT : Page Resultats Sondage — Reference Mondiale SEO/AEO

## Contexte

Tu travailles sur le projet Blog SOS-Expat (Laravel 12, PostgreSQL, Blade + Tailwind CSS, 9 langues).
Le codebase est dans `C:\Users\willi\Documents\Projets\VS_CODE\Blog_sos-expat_frontend\`.

Nous avons un sondage universel "Le Grand Sondage Expat & Voyageur 2026" avec :
- 17 questions, 9 langues (fr, en, es, de, pt, ru, zh, hi, ar)
- 6 321+ participants, 54 pays, toutes nationalites
- Page sondage : `/{locale}/sondages-expatries/{slug}` (gamified, step-by-step)
- **Page resultats** : `/{locale}/sondages-expatries/{slug}/resultats` ← C'EST CETTE PAGE QU'IL FAUT OPTIMISER
- Page statistiques : `/{locale}/sondages-expatries/statistiques`
- Export CSV disponible
- SondageAnalyticsService avec SQL JSONB (insights, cross-tabs, segmentation, country deep-dive)
- Donnees CC BY 4.0 (libre d'utilisation avec attribution)

## Objectif

Faire de la page resultats LA REFERENCE MONDIALE pour les donnees sur l'expatriation, les voyageurs, les digital nomads et les vacanciers. Cette page doit etre citee par les journalistes, blogueurs, chercheurs, LLMs (ChatGPT, Perplexity, Gemini), et generer des backlinks naturels.

Cible : TOUTES les nationalites du monde entier, pas uniquement la France.

## Fichiers cles a modifier

1. `resources/views/sondages/resultats.blade.php` — la vue principale (deja existante avec KPIs, charts, cross-tabs, FAQ)
2. `app/Http/Controllers/SondageController.php` — methode `resultats()` (passe les variables SEO a la vue)
3. `app/Services/SondageAnalyticsService.php` — service analytics SQL
4. `resources/views/partials/seo-head.blade.php` — partial SEO (meta, OG, JSON-LD)
5. `app/Http/Controllers/SeoController.php` — sitemap

## Checklist SEO/AEO a implementer — TOUT doit etre parfait

### 1. Meta Tags (dans le controller + seo-head)
- [ ] `<title>` : unique, 50-60 chars, keyword-rich, traduit en 9 langues. Ex FR: "Resultats Sondage Expatries 2026 — 6 000+ participants, 54 pays | SOS-Expat"
- [ ] `<meta name="description">` : 150-160 chars, compelling, avec chiffres cles, traduit en 9 langues
- [ ] `<meta name="keywords">` : mots-cles semantiques par langue (expat survey results, donnees expatriation, cost of living abroad data, etc.)
- [ ] `<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">`
- [ ] Canonical URL
- [ ] Hreflang x 9 langues + x-default

### 2. Open Graph + Twitter Cards
- [ ] og:type = "website"
- [ ] og:title, og:description (distincts du meta title/desc — plus accrocheurs)
- [ ] og:image : generer une image OG dynamique ou utiliser une image dediee avec les KPIs
- [ ] og:locale pour chaque langue
- [ ] twitter:card = "summary_large_image"
- [ ] twitter:site = "@SOS_Expat"

### 3. JSON-LD Structured Data (CRITIQUE pour rich results)
- [ ] `@type: Dataset` enrichi avec distribution (CSV), spatialCoverage, temporalCoverage, keywords, creator, license CC BY 4.0
- [ ] `@type: FAQPage` avec les questions de la FAQ
- [ ] `@type: BreadcrumbList`
- [ ] `@type: WebPage` avec speakable (pour Google Assistant / voice search)
- [ ] `@type: Organization` (SOS-Expat)
- [ ] Tout dans un `@graph` propre

### 4. Speakable (AEO Voice Search)
- [ ] Ajouter `speakable` dans le JSON-LD WebPage pointant vers les selecteurs CSS des KPIs et du resume
- [ ] Les KPIs doivent etre dans des elements avec des classes CSS specifiques pour le speakable

### 5. Hierarchie Headings (H1 → H4)
- [ ] 1 seul `<h1>` : le titre du sondage + "Resultats"
- [ ] `<h2>` pour chaque grande section : "Chiffres cles", "En un coup d'oeil", "Resultats detailles", "Analyses croisees", "FAQ"
- [ ] `<h3>` pour chaque question individuelle
- [ ] `<h4>` si sous-sections (ventilation par profil, country deep-dive)
- [ ] Verifier qu'il n'y a pas de saut de niveau (h1 → h3 sans h2)

### 6. Resume / TL;DR pour LLMs
- [ ] Section `<section id="summary" itemprop="abstract">` en haut de page
- [ ] 3-5 phrases resumant les conclusions cles du sondage
- [ ] Doit etre le premier contenu textuel apres le header
- [ ] Balisage semantique : `<article>`, `itemprop="description"`, `role="main"`

### 7. Sommaire / Table of Contents
- [ ] `<nav id="toc" aria-label="Table of contents">` avec ancres vers chaque section
- [ ] Ancres : #chiffres-cles, #graphiques, #q-1, #q-2, ..., #analyses-croisees, #faq
- [ ] Sticky on scroll sur desktop (sidebar ou top)
- [ ] Traduit en 9 langues

### 8. Fil d'Ariane (Breadcrumb)
- [ ] HTML avec microdata `itemscope itemtype="https://schema.org/BreadcrumbList"`
- [ ] JSON-LD BreadcrumbList dans le @graph
- [ ] 3 niveaux : SOS-Expat > Sondages > Resultats

### 9. Maillage Interne
- [ ] Liens vers : page du sondage (formulaire), page statistiques, annuaire par pays, articles lies, outils, FAQ
- [ ] Section "Voir aussi" en bas avec 4-6 liens contextuels
- [ ] Liens dans le contenu (inline) vers les pages pertinentes
- [ ] Liens vers les versions dans les autres langues

### 10. Mots-cles Semantiques (par langue)
- [ ] FR: sondage expatries, resultats enquete expat, cout de la vie etranger, problemes expatriation, satisfaction expatries, donnees mobilite internationale, etude expatriation 2026
- [ ] EN: expat survey results, expatriation data, cost of living abroad, expat problems worldwide, digital nomad statistics, international mobility data, expat satisfaction survey 2026
- [ ] ES: resultados encuesta expatriados, datos expatriacion, costo de vida extranjero
- [ ] DE: Expat-Umfrage Ergebnisse, Auswanderung Daten, Lebenshaltungskosten Ausland
- [ ] PT: resultados pesquisa expatriados, dados expatriacao, custo de vida exterior
- [ ] RU: результаты опроса экспатов, данные эмиграции, стоимость жизни за рубежом
- [ ] ZH: 外籍人士调查结果, 移民数据, 海外生活成本
- [ ] HI: प्रवासी सर्वेक्षण परिणाम, प्रवासन डेटा
- [ ] AR: نتائج استطلاع المغتربين, بيانات الهجرة
- [ ] Integrer ces mots-cles naturellement dans le contenu, les meta, les alt text, les titres

### 11. Rich Snippets / Position 0
- [ ] FAQPage JSON-LD pour obtenir les FAQ dans les SERP
- [ ] Dataset JSON-LD pour Google Dataset Search
- [ ] Les KPIs en gros chiffres dans des elements `<data value="6321">` pour extraction
- [ ] Tableaux HTML avec `<caption>` pour les cross-tabs (Google extrait les tableaux)
- [ ] Listes ordonnees `<ol>` pour les classements (top problemes, top services)

### 12. AEO (Answer Engine Optimization) — LLMs
- [ ] `<meta name="ai:summary">` avec resume de 200 chars
- [ ] `<meta name="ai:topics">` avec les sujets couverts
- [ ] `<meta name="ai:freshness">` = date de derniere mise a jour reelle
- [ ] `<meta name="ai:source-authority">` = "community-research-data"
- [ ] `<meta name="ai:content-type">` = "dataset"
- [ ] `<meta name="ai:expertise">` = "expatriation, international mobility, digital nomad lifestyle"
- [ ] `<meta name="ai:geo-relevance">` = "worldwide"
- [ ] `<meta name="ai:fact-checked">` = "true"
- [ ] Contenu structure en paragraphes courts et clairs que les LLMs peuvent extraire
- [ ] Chaque KPI doit etre extractible : "X% des expatries rencontrent des problemes administratifs"

### 13. Geo-targeting (mondial)
- [ ] Pas de geo-restriction — la page doit etre indexee mondialement
- [ ] `geoRelevance: worldwide` dans les meta
- [ ] Contenu neutre (pas de reference a un pays specifique dans l'intro)
- [ ] Hreflang couvre 9 langues × variantes pays

### 14. Backlinks Automatiques
- [ ] Widget embeddable : code `<blockquote>` + `<script>` que les blogueurs peuvent copier-coller
- [ ] Le widget inclut automatiquement un lien `<a href="https://sos-expat.com/...">Source: SOS-Expat.com</a>`
- [ ] Section "Pour la presse" avec citation pre-formatee incluant le lien
- [ ] Export CSV avec header incluant l'URL source et la licence CC BY 4.0
- [ ] JSON-LD Dataset avec `creator.url` = "https://sos-expat.com"
- [ ] OpenGraph bien configure pour que chaque partage social genere un lien retour
- [ ] API publique JSON pour les developpeurs qui veulent integrer les donnees (endpoint `/api/v1/public/{locale}/sondages-resultats`)

### 15. Performance & Crawlabilite
- [ ] Chart.js charge en defer uniquement sur cette page (pas globalement)
- [ ] Images : loading="lazy", dimensions explicites, alt text descriptifs
- [ ] Preconnect vers les CDN utilises (flagcdn.com, cdn.jsdelivr.net)
- [ ] Pas de render-blocking JS
- [ ] Page dans le sitemap avec changefreq=daily, priority=0.9
- [ ] `<link rel="preconnect">` pour les domaines externes

### 16. Accessibilite (aide aussi le SEO)
- [ ] `<html lang="fr">` correct par langue
- [ ] `dir="rtl"` pour l'arabe
- [ ] Alt text sur toutes les images (drapeaux, charts)
- [ ] `aria-label` sur les sections, nav, boutons
- [ ] Contraste couleurs suffisant (WCAG AA)
- [ ] Focus visible sur les elements interactifs

### 17. Contenu supplementaire a ajouter
- [ ] Section "Methodologie" : comment les donnees sont collectees, taille d'echantillon, biais potentiels, anonymisation
- [ ] Section "Citation" : comment citer ces donnees (format APA, MLA, journalistique)
- [ ] Section "Telechargement" : CSV + futur PDF rapport
- [ ] Section "API" : endpoint public pour les developpeurs
- [ ] Section "Presse" : contact presse, kit media, communique type

## Contraintes techniques

- Laravel 12, Blade templates, Tailwind CSS
- PostgreSQL avec JSONB pour les reponses
- 9 langues : fr, en, es, de, pt, ru, zh, hi, ar
- Le contenu doit etre SSR (server-side rendered) pour le SEO
- Chart.js pour les graphiques (CDN, pas npm)
- Pas de framework JS supplementaire (Alpine.js deja present dans le layout)
- Les traductions sont inline dans les templates (pas de fichiers lang pour les nouvelles sections)

## Resultat attendu

Quand un journaliste cherche "expat survey 2026 results" ou "donnees expatriation monde" ou "digital nomad statistics" dans n'importe quelle langue, cette page doit apparaitre en page 1 de Google. Quand ChatGPT ou Perplexity repond a une question sur l'expatriation, il doit citer ces donnees avec un lien vers SOS-Expat.com.

Chaque blogueur ou site qui utilise nos donnees doit automatiquement generer un backlink vers nous via le widget, la citation, ou le lien dans le CSV.
