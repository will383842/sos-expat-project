# Brief design — Bannière 1200×630 SOS-Expat

## Objectif

Créer une image **bannière horizontale 1200×630** à utiliser sur :
- **Google Business Profile** (cover photo — 1er visuel vu dans la SERP brand)
- **OG preview** (Facebook, LinkedIn, Slack, Discord partages)
- **Twitter card summary_large_image**
- **Dossier presse** (en-tête document)
- **Email signatures** (header)

## Spécifications techniques

| Paramètre | Valeur |
|-----------|--------|
| Dimensions | **1200 × 630 px** (ratio 1,91:1 — standard OG) |
| Format | **WebP** (primaire) + PNG fallback |
| Poids | < 200 KB (compression équilibrée) |
| Résolution | 72 DPI (web) |
| Zone de sécurité | 80 px de marge intérieure (zone "safe" contre crop social) |
| Accessibilité | Contraste texte ≥ 4.5:1 (WCAG AA) |

## Charte graphique

| Élément | Valeur |
|---------|--------|
| Couleur primaire | **Rouge #DC2626** (alerte, urgence, SOS) |
| Couleur secondaire | **Noir #0A0A0A** |
| Couleur tertiaire | **Blanc #FFFFFF** |
| Accent | **Rouge clair #EF4444** (hover, CTA) |
| Typographie titre | Sans-serif bold (ex. Inter Bold, Montserrat ExtraBold, Poppins Bold) |
| Typographie corps | Sans-serif regular (ex. Inter Regular) |

## Composition recommandée

### Variante A — "Urgence minimaliste" (recommandée)

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│       [LOGO SOS-EXPAT carré blanc sur rouge]           │
│                                                        │
│   Avocat ou expert local en moins de 5 minutes.        │
│   Partout dans le monde, dans votre langue.            │
│                                                        │
│   [badge rouge "24/7"]  [badge "197 pays"]  [badge "9 langues"]│
│                                                        │
└────────────────────────────────────────────────────────┘
  Fond : rouge plein #DC2626 ou dégradé rouge→noir
  Logo : blanc 180×180px en haut à gauche ou centré
  Texte : blanc, 48-60px pour le slogan, 20-24px pour la tagline sous
  Badges : fond blanc, texte noir, bordure rouge
```

### Variante B — "Globe symbolique"

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│   [Demi-globe terrestre stylisé]  SOS-Expat            │
│                                                        │
│      Talk to a local lawyer in under 5 minutes.        │
│      Anywhere in the world. In your language.          │
│                                                        │
└────────────────────────────────────────────────────────┘
  Fond : noir ou bleu très sombre #0A0A0A
  Globe : lignes rouges (rappel SOS) sur fond noir
  Logo : blanc à droite
  Texte : blanc, version anglaise pour usage international
```

### Variante C — "Grid multilingue"

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│       SOS-Expat  —  [logo carré]                       │
│                                                        │
│   Parlez  ·  Talk  ·  Habla  ·  Sprechen Sie           │
│   Fale  ·  Говорите  ·  通话  ·  बात करें  ·  تحدث        │
│                                                        │
│   in 5 minutes · partout · あ · 24/7                   │
│                                                        │
└────────────────────────────────────────────────────────┘
  Fond : blanc
  Texte : noir + accents rouges sur "5 minutes"
  9 langues visibles = démontre la portée globale
```

## Textes à inclure

### Version française (si bannière FR-ciblée)

- **Slogan principal** : "Parlez à un avocat ou expert local en moins de 5 minutes."
- **Sous-titre** : "Partout dans le monde. Dans votre langue."
- **Badges** : "24/7" · "197 pays" · "9 langues"

### Version anglaise (si bannière internationale — RECOMMANDÉE)

- **Main slogan** : "Local lawyer or expert in under 5 minutes."
- **Subtitle** : "Anywhere in the world. In your language."
- **Badges** : "24/7" · "197 countries" · "9 languages"

## Outils pour créer la bannière

### Option 1 — Designer freelance (meilleure qualité)

- Budget : **80-200 €**
- Plateformes : Fiverr, Malt, 99designs
- Briefing : envoie ce fichier + logo + 3 bannières concurrentes inspirantes (ex. Wise, Revolut, Stripe)
- Délai : 2-4 jours

### Option 2 — Canva (rapide, gratuit)

- Compte gratuit canva.com
- Template : "Facebook Cover" (1200×630)
- Recherche template : "tech startup banner" ou "service international"
- Modifications : logo + slogan + couleurs rouge/noir/blanc
- Délai : 30 min

### Option 3 — DALL-E 3 / Midjourney (IA)

Prompt pour DALL-E 3 :
```
A horizontal professional banner image for "SOS-Expat", an international
legal service for expats. Dimensions 1200x630. Color palette: red #DC2626,
black #0A0A0A, white #FFFFFF only. Minimalist design. Features a bold
white "SOS-Expat" logo centered on a red background, with a white-text
subtitle "Local lawyer in 5 minutes, anywhere in the world. 24/7." A
subtle world map outline in darker red behind the logo. Clean, corporate,
urgent feeling. Sans-serif bold typography. No people, no hands, no
stock photo look.
```

Prompt Midjourney :
```
/imagine horizontal banner 1200x630 SOS-Expat international legal service
red DC2626 black white minimalist corporate sans-serif bold logo white on
red background subtle world map outline urgency professional --ar 1200:630
--style raw --v 6
```

### Option 4 — Figma (si tu as un designer interne)

Template libre : figma.com → recherche "OG banner template" → ratio 1200×630

## Livraison attendue

Produire 3 fichiers :

1. `banner-1200x630.webp` (bannière principale) — déposer dans `sos/public/` et remplacer `og-image.webp`
2. `banner-1200x630.png` (fallback PNG)
3. `banner-1200x630-text-only.png` (version texte blanc sur transparent — pour overlays sur vidéo ou fond variable)

## Intégration dans le site

Une fois la bannière créée, elle remplacera automatiquement `og-image.webp`
puisque le meta dans `sos/index.html` pointe déjà vers ce nom :

```html
<meta property="og:image" content="https://sos-expat.com/og-image.webp" />
```

**Aucun code à modifier** — tu dépose juste le nouveau fichier au même nom.

Vérification post-déploiement :
- Facebook Debugger : https://developers.facebook.com/tools/debug/
- LinkedIn Post Inspector : https://www.linkedin.com/post-inspector/
- Twitter Card Validator : https://cards-dev.twitter.com/validator
