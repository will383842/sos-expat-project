# Brand Entity Kit — SOS-Expat

Kit complet multilingue (9 langues × 197 pays) pour construire l'autorité
de marque SOS-Expat dans le Google Knowledge Graph et les services d'IA
(ChatGPT, Perplexity, Claude, Siri, Alexa).

Généré : 2026-04-22

## Objectif business

- Faire passer la position Google sur `sos expat` de **9,54 → 1-3**
- Générer le **Knowledge Panel** dans les SERPs brand
- Désambiguïser la marque pour les LLMs et assistants IA
- Consolider l'**E-E-A-T** (signal YMYL critique pour le conseil juridique)

## Structure du kit

```
brand-entity-kit/
├── 00-README.md                       ← Ce fichier (plan d'exécution)
├── 01-nap-canonique.md                ← NAP unique à copier-coller partout
├── 02-tagline-9-langues.md            ← Slogan dans les 9 langues
├── 03-descriptions-courtes.md         ← 160 caractères × 9 langues
├── 04-descriptions-longues.md         ← 400-600 mots × 9 langues
├── 05-json-ld-organization.html       ← Nouveau bloc JSON-LD enrichi
├── 06-banniere-brief-design.md        ← Brief pour générer la bannière 1200x630
├── bio-officielle/                    ← Bios presse courte + longue × 9 langues
├── gbp/                               ← Google Business Profile complet
├── wikidata/                          ← Wikidata statements + procédure
├── presse/                            ← Médias + pitch emails 9 langues
├── 11-nap-directories.md              ← 60+ annuaires à compléter
└── 12-kpis-monitoring.md              ← KPIs à suivre
```

## Plan d'exécution optimal

### Phase 1 — Semaine 1 (rapide, à faire par toi)

| J+ | Action | Qui | Durée |
|----|--------|-----|-------|
| J+0 | Remplacer JSON-LD Organization dans `sos/index.html` | Moi (push auto) | 5 min |
| J+1 | Créer bannière 1200x630 selon le brief `06-banniere-brief-design.md` | Toi (Canva/designer) | 30 min |
| J+1-2 | Compléter infos légales (SIRET, adresse, fondateur, date création) dans le NAP | Toi | 30 min |
| J+2 | Créer Google Business Profile — voir `gbp/checklist.md` | Toi | 2 h |
| J+2-5 | Compléter 15 premiers annuaires (LinkedIn, Crunchbase, Glassdoor…) | Toi | 3 h |

### Phase 2 — Semaine 2-3 (diffusion presse)

| J+ | Action | Qui | Durée |
|----|--------|-----|-------|
| J+7 | Envoyer les PDF existants + pitch email aux 130 médias ciblés | Toi (Mailmeteor / Yesware) | 1 jour |
| J+14 | Suivi journalistes + relances | Toi | 2 h |
| J+14-30 | Retombées presse attendues (3-5 reprises minimum) | Passif | — |

### Phase 3 — Semaine 4+ (Wikidata + complément)

| J+ | Action | Qui | Durée |
|----|--------|-----|-------|
| J+30 | Créer l'entrée Wikidata (avec les articles parus comme sources) | Toi | 1 h |
| J+30 | Compléter les 45 annuaires restants | Toi | 3 h étalées |
| J+30-60 | Google indexe Wikidata + Knowledge Panel apparaît | Passif | — |
| J+60 | Premier check GSC : position `sos expat` | Toi | 15 min |

## Marchés prioritaires 2026

Selon la stratégie Country Campaign (mémoire `project_country_campaign_next`) :

1. 🇹🇭 Thaïlande
2. 🇻🇳 Vietnam
3. 🇸🇬 Singapour
4. 🇲🇾 Malaisie
5. 🇵🇭 Philippines
6. 🇯🇵 Japon
7. 🇦🇺 Australie
8. 🇲🇽 Mexique
9. 🇧🇷 Brésil
10. 🇨🇷 Costa Rica
11. 🇺🇸 États-Unis

Les 9 langues supportées : **fr, en, es, de, pt, ru, zh, hi, ar**.

## Points d'attention importants

### ⚠️ Pas de téléphone public

Tu as décidé de ne pas afficher de téléphone. Cela impacte :

- **Google Business Profile** : impossible avec adresse + téléphone publics.
  Solution : "Service Area Business" + Google Voice gratuit (numéro virtuel
  utilisé UNIQUEMENT pour la validation, jamais affiché). Voir
  `gbp/checklist.md`.
- **Schema.org Organization** : le champ `telephone` reste vide. Google
  accepte l'absence, ne pénalise pas.
- **Wikidata** : pas de champ obligatoire téléphone. OK.

### ⚠️ Pas d'agence presse

Tu envoies toi-même les communiqués. Cela impose :

- Un pitch email **personnalisé par langue** (voir `presse/pitch-emails/`)
- Une **liste qualifiée** de 130 médias cibles avec contact direct
- Un **outil de mail mass** (Mailmeteor / Yesware / Lemlist) pour gérer
  les relances et mesurer les taux d'ouverture

Budget outil : **~30-50€/mois** pendant 2-3 mois = 100-150€ total.
Alternative : envois manuels en BCC via Gmail (gratuit mais 3-4 jours de
travail manuel).

### ⚠️ Bannière et visuels

Tu dois fournir :
1. **Bannière 1200×630** pour GBP + OG (brief détaillé fourni)
2. **Variantes logo** : carré (déjà OK `/logo512.png`), horizontal (manque)
3. **3-5 photos équipe ou bureau** pour GBP (améliore le CTR de 20-40 %)

## Validation finale

Ce kit contient du contenu **prêt à déployer**, mais :

- Les **traductions** ont été générées par moi ; elles sont correctes
  sémantiquement mais tu peux les faire relire par un natif pour chaque
  langue (optionnel, pour la perfection)
- Les **infos légales** (SIRET, adresse, date création) ont des
  placeholders `[À COMPLÉTER]` — toi seul peut les fournir
- Les **URLs médias** sont validées au 2026-04-22 mais peuvent évoluer ;
  re-vérifier avant envoi
