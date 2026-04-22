# Wikidata — Création de l'entrée SOS-Expat

## ⚠️ Règle critique : notabilité

Wikidata **refuse** les entrées self-promotion. Il faut **3+ sources tierces
indépendantes** (articles de presse, annuaires reconnus, études
académiques). Sans sources → suppression en 24-48 h + risque de ban du
compte.

**Ordre d'exécution obligatoire** :

1. D'abord → **diffuser tes PDFs presse aux 130 médias ciblés** (voir
   `presse/strategie-diffusion.md`)
2. Attendre 2-6 semaines pour que 3-5 médias reprennent
3. **Puis seulement** créer l'entrée Wikidata avec ces articles comme
   sources

**Tenter Wikidata sans sources = perte de temps et compte brûlé.**

---

## Pré-requis (une fois les articles parus)

☐ 3+ URLs d'articles presse sur médias reconnus mentionnant SOS-Expat
  (pas juste ton site ou tes réseaux sociaux)
☐ Compte Wikidata actif (créé il y a ≥ 4 jours, avec quelques éditions
  mineures pour ne pas être "new editor")
☐ Infos légales complètes (nom juridique, adresse Tallinn, date création,
  fondateur, site web, réseaux sociaux)
☐ Logo en fichier libre de droits (CC-BY-SA ou CC0) uploadé sur Wikimedia
  Commons

---

## Étape 1 — Créer un compte Wikidata (si pas déjà fait)

1. Va sur [wikidata.org](https://www.wikidata.org)
2. Clique **"Create account"** en haut à droite
3. Choisis un nom d'utilisateur **qui ne contient PAS "SOS-Expat"** (ex.
   ton nom personnel "ManonS" ou pseudo neutre)
4. **IMPORTANT** : déclare sur ta page utilisateur ton **conflit
   d'intérêt** (règle Wikidata) :

   ```wikitext
   == Disclosure of paid/affiliated contributions ==

   I am affiliated with SOS-Expat and I may contribute items related to
   this entity. I commit to following the WP:COI guidelines: provide
   reliable sources, avoid promotional language, respect NPOV (neutral
   point of view).
   ```

5. Avant de créer SOS-Expat, fais **5-10 éditions mineures** sur des
   items existants (corriger des typos, ajouter des labels manquants)
   pour établir la crédibilité du compte

---

## Étape 2 — Uploader le logo sur Commons (10 min)

1. Va sur [commons.wikimedia.org/wiki/Special:Upload](https://commons.wikimedia.org/wiki/Special:Upload)
2. **Fichier** : `logo512.png` (ou version SVG si tu as)
3. **Nom cible** : `SOS-Expat logo.png`
4. **Description** :
   ```wikitext
   == Summary ==
   {{Information
   |description={{en|Official logo of SOS-Expat, an international legal
   assistance platform based in Tallinn, Estonia.}}
   |date=2026-04-22
   |source=Official website https://sos-expat.com/logo512.png
   |author=SOS-Expat
   |permission=Copyright held by SOS-Expat, released under CC BY-SA 4.0
   for use in Wikimedia projects.
   }}
   [[Category:Logos of companies of Estonia]]
   [[Category:Legal services]]
   ```
5. **Licence** : choisis **CC BY-SA 4.0** (compatible Wikidata) ou **fair
   use** si tu ne veux pas libérer le logo
6. Clique **Upload**

---

## Étape 3 — Créer l'item SOS-Expat

### 3.a — Nouveau item vide

1. Va sur [wikidata.org/wiki/Special:NewItem](https://www.wikidata.org/wiki/Special:NewItem)
2. **Label (en)** : `SOS-Expat`
3. **Description (en)** : `International platform connecting expats and travelers with local lawyers and experts in 9 languages`
4. **Aliases (en)** : `SOS Expat`, `sos-expat.com`, `SOS-Expat OÜ`
5. Clique **Create**

Google te donne un ID : `Q[numéro]` (ex. Q123456789). Note-le, c'est ton
identifiant permanent.

### 3.b — Ajouter les labels dans les 9 langues

Dans l'onglet **"Terms"** de ta fiche Q[ID], ajoute :

| Lang | Label | Description | Aliases |
|------|-------|-------------|---------|
| en | SOS-Expat | International platform connecting expats and travelers with local lawyers and experts in 9 languages | SOS Expat, sos-expat.com |
| fr | SOS-Expat | Plateforme internationale mettant en relation les expatriés et voyageurs avec des avocats et experts locaux en 9 langues | SOS Expat, sos-expat.com |
| es | SOS-Expat | Plataforma internacional que conecta a expatriados y viajeros con abogados y expertos locales en 9 idiomas | SOS Expat |
| de | SOS-Expat | Internationale Plattform, die Expats und Reisende mit lokalen Anwälten und Experten in 9 Sprachen verbindet | SOS Expat |
| pt | SOS-Expat | Plataforma internacional que conecta expatriados e viajantes com advogados e especialistas locais em 9 idiomas | SOS Expat |
| ru | SOS-Expat | Международная платформа, связывающая экспатов и путешественников с местными юристами и экспертами на 9 языках | SOS Expat |
| zh | SOS-Expat | 国际平台，以9种语言将海外人士和旅行者与当地律师和专家联系起来 | SOS Expat |
| hi | SOS-Expat | अंतरराष्ट्रीय मंच जो प्रवासियों और यात्रियों को 9 भाषाओं में स्थानीय वकीलों और विशेषज्ञों से जोड़ता है | SOS Expat |
| ar | SOS-Expat | منصة دولية تربط المغتربين والمسافرين بالمحامين والخبراء المحليين بـ 9 لغات | SOS Expat |
| et | SOS-Expat | Rahvusvaheline platvorm, mis ühendab välismaalasi ja reisijaid kohalike juristide ja ekspertidega 9 keeles | SOS Expat |

---

## Étape 4 — Ajouter les statements (propriétés P)

Onglet "Statements" → clique "add statement". Chaque statement =
propriété + valeur + **source** (reference).

### Statements obligatoires (pour notabilité)

| Property | Nom | Valeur | Source requise |
|----------|-----|--------|----------------|
| **P31** | instance of | `business (Q4830453)` OU `legal service (Q6486)` | Pas obligatoire (type) |
| **P17** | country | `Estonia (Q191)` | Äriregister |
| **P159** | headquarters location | `Tallinn (Q1770)` | Äriregister |
| **P571** | inception (date création) | `[À COMPLÉTER — YYYY-MM-DD]` | Äriregister |
| **P856** | official website | `https://sos-expat.com` | Site officiel |
| **P154** | logo image | `SOS-Expat logo.png` (Commons) | Site officiel |
| **P1813** | short name | `SOS-Expat` | — |
| **P452** | industry | `legal services (Q12154793)` | Description business |
| **P1056** | product or material produced | `legal consultation (Q1252971)`, `expatriate assistance` | Site officiel |
| **P452** | industry | `LegalTech (Q28149028)` | Description business |

### Identifiants externes (boost entité)

| Property | Nom | Valeur |
|----------|-----|--------|
| **P2002** | Twitter username | `sosexpat` |
| **P2013** | Facebook ID | `sosexpat` |
| **P4264** | LinkedIn company ID | `sos-expat` |
| **P2003** | Instagram username | `sosexpat` |
| **P2397** | YouTube channel ID | (si existe, sinon omet) |
| **P1651** | YouTube video ID | (si tu as une vidéo promo) |
| **P1581** | official blog URL | `https://sos-expat.com/fr-fr/articles` |

### Identifiants régionaux (Estonie)

| Property | Nom | Valeur |
|----------|-----|--------|
| **P1320** | OpenCorporates ID | (cherche ton entreprise sur opencorporates.com, copie l'ID) |
| **P1278** | Legal Entity Identifier (LEI) | (si tu en as un — voir gleif.org) |
| **P6269** | Estonian Business Register ID | `[À COMPLÉTER — 8 chiffres]` |
| **P3548** | VAT number | `EE[À COMPLÉTER]` |

### Statements "service"

| Property | Nom | Valeur |
|----------|-----|--------|
| **P2936** | language used | French (Q150), English (Q1860), Spanish (Q1321), German (Q188), Portuguese (Q5146), Russian (Q7737), Chinese (Q7850), Hindi (Q1568), Arabic (Q13955) |
| **P3320** | board member | `[fondateur]` (Q[ID] si notable, sinon string) |

---

## Étape 5 — Ajouter les sources (references) à chaque statement

**CRITIQUE** : sans sources, tes statements sont considérés "self-claimed"
et peuvent être supprimés.

Pour chaque statement ci-dessus, clique l'icône **"Add reference"** et
remplis :

### Source type 1 — Site officiel

```
Property: P854 (reference URL) = https://sos-expat.com/about
Property: P813 (retrieved) = 2026-04-22
```

Utilisable pour : nom, site web, logo, réseaux sociaux, tagline.

### Source type 2 — Article presse

```
Property: P854 (reference URL) = [URL article presse]
Property: P1433 (published in) = [nom du média, ex. "Les Échos"]
Property: P577 (publication date) = [YYYY-MM-DD]
Property: P50 (author) = [nom journaliste]
Property: P1476 (title) = [titre article]
```

**MINIMUM 3 articles presse** pour que l'item passe la notabilité.

### Source type 3 — Registre commercial

```
Property: P854 (reference URL) = https://ariregister.rik.ee/eng/company/[ID]
Property: P813 (retrieved) = 2026-04-22
```

Pour les statements "legal form", "registration ID", "address".

---

## Étape 6 — Attendre validation communauté

Après sauvegarde, l'item est **live immédiatement** mais peut être :

- **Patrouillé** (admin vérifie notabilité) sous 2-7 jours
- **Supprimé** si notabilité insuffisante → redemander après plus de presse
- **Conservé** si OK → ton Q[ID] devient permanent

Tu peux suivre les modifications sur [l'historique de l'item](https://www.wikidata.org/wiki/Q[ID]?action=history).

---

## Étape 7 — Cross-link depuis Wikidata vers ton site

Une fois Q[ID] obtenu et stable (≥ 7 jours) :

### 7.a — Ajouter dans `sameAs` JSON-LD

Modifie `sos/index.html` ligne ~106 (Organization `sameAs`) :

```json
"sameAs": [
  "https://www.wikidata.org/wiki/Q[TON_ID]",
  "https://www.facebook.com/sosexpat",
  "https://twitter.com/sosexpat",
  "https://www.linkedin.com/company/sos-expat",
  "https://www.instagram.com/sosexpat"
]
```

→ Signal fort à Google : "Wikidata me reconnaît comme entité officielle"

### 7.b — Ajouter le lien Wikidata dans le footer du site

Petit lien discret en footer :

```html
<a href="https://www.wikidata.org/wiki/Q[TON_ID]" rel="external">
  SOS-Expat sur Wikidata
</a>
```

### 7.c — Wikipedia en suite (optionnel, 6+ mois)

Une entrée **Wikipedia** (séparée de Wikidata) est possible si tu
atteins la notabilité Wikipedia — plus exigeante (≥ 3 articles presse
**national**, pas local, avec **couverture substantielle**, pas juste
mention).

**À tenter seulement après 10-15 articles presse sur 12 mois.** Sinon
risque de suppression rapide.

---

## Ce qui va arriver après (bénéfices)

| Délai | Événement |
|-------|-----------|
| J+1 | Item Q[ID] créé, visible publiquement |
| J+7-14 | Patrouillé par un admin Wikidata |
| J+14-30 | Google commence à indexer les statements dans son Knowledge Graph |
| J+30-60 | Knowledge Panel SOS-Expat commence à apparaître dans SERP brand Google |
| J+60-90 | Wikidata devient source pour ChatGPT / Claude / Perplexity — tes infos officielles remplacent les infos génériques |
| J+90+ | Position `sos expat` remonte vers 1-3 (combiné avec GBP + presse) |

## Support / si tu coinces

- Docs Wikidata (en) : [Wikidata:Introduction](https://www.wikidata.org/wiki/Wikidata:Introduction)
- Aide Wikidata (fr) : [Wikidata:Introduction/fr](https://www.wikidata.org/wiki/Wikidata:Introduction/fr)
- Communauté (poser questions) : [Wikidata:Project chat](https://www.wikidata.org/wiki/Wikidata:Project_chat)
- **Si suspension/ban** : possibilité de faire appel sur [Wikidata:Requests for undeletion](https://www.wikidata.org/wiki/Wikidata:Requests_for_undeletion)
