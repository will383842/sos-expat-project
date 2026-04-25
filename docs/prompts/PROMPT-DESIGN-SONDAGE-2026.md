# PROMPT : Redesign UX/UI du Sondage Gamifie — Experience d'Exception 2026

## Contexte

Tu travailles sur le projet Blog SOS-Expat (Laravel 12, Blade + Tailwind CSS).
Le codebase est dans `C:\Users\willi\Documents\Projets\VS_CODE\Blog_sos-expat_frontend\`.

Le fichier a modifier est **UNIQUEMENT** :
`resources/views/sondages/gamified.blade.php`

## REGLES CRITIQUES — NE RIEN CASSER

### Variables Blade obligatoires (passees par le controller — NE PAS TOUCHER)
```
$seoTitle, $seoDescription, $canonical, $noindex, $hreflangLinks, $jsonLd,
$lang, $sondage, $translation, $questions, $stats, $localeCountry, $dir,
$sondageFaqs, $sondageFaqSchema, $relatedSondages, $breadcrumbJsonLd,
$resultsUrl, $segSondages, $segResultats, $freshness,
$aiSummary, $aiTopics, $contentType,
$countryCode, $countryName, $countryResponseCount
```

### Sections Blade obligatoires (NE PAS SUPPRIMER)
- `@section('seo')` avec `@include('partials.seo-head', [...])` — garder TOUS les parametres
- `@push('head')` avec preconnect
- `@section('jsonld')` avec `$sondageFaqSchema` et `$breadcrumbJsonLd`
- `@section('content')` ... `@endsection`
- `@push('scripts')` avec le JS complet

### Bloc PHP $i18n obligatoire
Le tableau `$i18n` avec les 9 langues (fr, en, es, de, pt, ru, zh, hi, ar) et les cles : start, next, back, skip, submit, thank_you, thank_sub, results, participants, multiple, required, copied, share, results_link, cta_title, cta_text, cta_btn, geo_title, of

### Elements HTML/SEO obligatoires (NE PAS SUPPRIMER)
- Breadcrumb `<nav>` avec microdata BreadcrumbList
- Section `<section id="summary" itemprop="abstract">` avec lien vers `$resultsUrl`
- `<noscript>` fallback avec les 17 questions en texte brut
- Section `sr-only` avec les questions pour les crawlers
- FAQ `<details>/<summary>` en bas de page

### Structure JS obligatoire (NE PAS MODIFIER la logique)
- IIFE `(function(){ ... })();`
- Variables : N, SID, TK, T, tok, bl, app, ss, topEl, bbk, pfill, pctEl, msgEl, c, busy, done
- Fonctions : go(n), ok(s), nxt(), coll(), saveProgress(), submitFinal(), confetti()
- Event listeners : gs-start click, gs-back click, app change (radio/checkbox), app click (data-action), keydown Enter
- Share buttons : gs-wa, gs-tw, gs-fb, gs-li, gs-share avec shareUrl/shareText
- Already answered : sessionStorage check en fin de script
- Messages motivants `msgs` objet avec 9 langues

### Logique questions (NE PAS MODIFIER)
- Questions `__countries__` → `<input>` + `<datalist>` avec pays via Locale/ResourceBundle
- Questions `single` → labels `<label class="gs-o">` avec `<input type="radio">`
- Questions `multiple` → labels avec `<input type="checkbox">`
- Questions `open` → `<textarea>`
- Auto-advance sur radio (setTimeout nxt, 400ms)
- Bouton next pour multiple/open/countries
- Bouton skip pour open seulement

### Structure des steps (NE PAS MODIFIER)
- Step 0 : Welcome (class `gs-s on`, data-step="0")
- Steps 1-17 : Questions (class `gs-s`, data-step="1" a "17")
- Step 18 : Thank you + Results (class `gs-s`, data-step="18")
- Le #gs-card wrapper pour desktop
- Le #gs-top sticky progress bar

## Ce qui DOIT changer — Le Design UNIQUEMENT

### Charte couleur SOS-Expat
- **Rouge** : #e8000d (primaire — boutons, accents, progression)
- **Noir** : var(--color-t1) (textes, headings)
- **Blanc** : var(--color-bg), var(--color-s1) (fonds, cards)
- Utiliser ces 3 couleurs comme base, avec des nuances subtiles

### Tendances Design 2026 a appliquer

**1. Welcome Screen (Step 0) — Le WOW effect**
- Le globe emoji est trop basique. Remplacer par un design plus impactant :
  - Animation CSS du globe ou un emoji plus grand avec glow effect
  - OU une illustration abstraite en CSS (cercles concentriques, lignes de connexion style "reseau mondial")
- Le titre doit etre MASSIF et impactant (clamp responsive)
- Les badges (participants, questions, 2 min) doivent etre plus visuels — glassmorphism ou neumorphism
- Le bouton CTA doit etre irresistible : plus gros, pulse animation, gradient anime
- Ajouter un subtle background pattern ou noise texture

**2. Questions (Steps 1-17) — Fluide et engageant**
- Numero de question : remplacer le cercle rouge par un design plus creatif (badge avec progression, icone dynamique)
- Le texte de la question doit respirer — plus d'espace, typo plus expressive
- Options de reponse :
  - Effet "card" plus prononce avec ombre portee
  - Hover : scale + glow subtil + elevation
  - Selection : animation satisfaisante (bounce + ripple effect CSS)
  - L'emoji dans chaque option doit etre plus mis en valeur (plus gros, separe visuellement)
- Transition entre questions : plus douce, peut-etre un fade + scale au lieu de translateY
- Pour les questions pays (datalist) : styliser l'input pour qu'il ressemble aux autres options

**3. Progress Bar — Motivante**
- La barre actuelle est OK mais peut etre plus engageante :
  - Ajouter le pourcentage EN GROS a cote
  - Le message motivant doit etre plus visible (pas juste un petit texte)
  - Peut-etre ajouter un mini emoji qui change selon la progression (🚀 debut, 💪 milieu, 🏆 fin)
- Le back button doit etre plus visible et accessible

**4. Thank You Screen (Step 18) — Celebration**
- Le confetti est bien mais le screen manque d'impact
- Les resultats (barres) doivent etre plus visuels — gradient, animation d'entree
- Le CTA SOS-Expat doit etre spectaculaire — card avec gradient, glow, shimmer
- Les boutons de partage doivent etre plus colores et engageants
- Section geo (drapeaux) : plus de vie, mini animations

**5. Card Desktop (#gs-card)**
- L'encadre est bien mais peut etre plus elegant :
  - Ombre plus prononcee (layered shadows)
  - Peut-etre un subtle border gradient
  - Le fond derriere le card pourrait avoir un pattern subtil

**6. Micro-interactions partout**
- Chaque clic doit donner un feedback visuel
- Les transitions doivent utiliser des courbes spring (cubic-bezier(.16,1,.3,1))
- Hover states sur TOUT ce qui est interactif
- Focus states accessibles et jolis (ring colore)

**7. Typographie**
- Utiliser les font-weights de maniere plus contrastee : 900 pour les titres, 400 pour le body
- Line-height genereux pour la lisibilite
- Letter-spacing negatif sur les gros titres (-0.02em)

**8. Dark Mode**
- Le design DOIT fonctionner en dark mode (le layout supporte deja dark via CSS variables)
- Les ombres et glow doivent s'adapter
- Les couleurs de fond utilisent var(--color-bg), var(--color-s1), var(--color-s2), var(--color-b1)
- Les textes utilisent var(--color-t1), var(--color-t2), var(--color-t3)

**9. Mobile First**
- Tout doit etre concu mobile-first
- Touch targets : minimum 48px de hauteur
- Padding genereux sur mobile (px-5 minimum)
- Pas de hover-only interactions (tout doit marcher au tap)
- Le card desktop ne doit PAS apparaitre sur mobile (full-width)

**10. RTL Support**
- Le design doit fonctionner en arabe (dir="rtl")
- Les fleches doivent etre inversees (deja gere avec `$lang === 'ar' ? 'rotate-180' : ''`)
- Les paddings/margins doivent utiliser des proprietes logiques quand possible (ps- au lieu de pl-)

## Ce qui NE doit PAS changer

- La logique JS (fonctions, event listeners, API calls)
- Les variables Blade et les sections SEO
- Le nombre de steps (19)
- Les types de questions et leur rendu (radio, checkbox, datalist, textarea)
- Le noscript fallback et le sr-only SEO
- Le breadcrumb et la section summary
- La FAQ en bas
- Les URLs de partage (WhatsApp, X, Facebook, LinkedIn)
- Le CSRF token et la sauvegarde progressive

## Inspiration Design

- Typeform (transitions fluides, une question par ecran)
- Linear.app (precision, minimalisme, micro-interactions)
- Vercel (typographie bold, contraste noir/blanc)
- Stripe (gradients subtils, ombres layered)
- Apple (espacement genereux, animations spring)

## Format de sortie

Reecris le fichier `gamified.blade.php` en entier. Le fichier doit :
1. Etre syntaxiquement correct (PHP + Blade + HTML + CSS + JS)
2. Garder TOUTES les fonctionnalites existantes
3. Avoir un design radicalement meilleur
4. Fonctionner sur mobile, desktop, dark mode, RTL
5. Etre deploye-ready (commit + push + le CI/CD fera le reste)
