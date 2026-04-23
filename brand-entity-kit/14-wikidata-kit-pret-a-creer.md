# Wikidata Kit — prêt à copier-coller

Ce fichier contient **tout ce qu'il faut** pour créer l'entrée Wikidata
de SOS-Expat dès que tu auras 3+ articles presse parus.

**Pourquoi Wikidata compte autant** :
- Source #1 du Knowledge Panel Google (panneau à droite de la recherche)
- Google SGE (AI Overviews) cite Wikidata en priorité
- Perplexity, ChatGPT Search, Gemini utilisent Wikidata comme source factuelle
- Crédibilité durable (5-10 ans de ROI après 1h de setup)

---

## Étape 1 — Compte Wikidata

1. Va sur https://www.wikidata.org
2. "Create account" en haut à droite
3. Username suggéré : `WilliamsJullin` ou `SOSExpat-Team`
4. Confirme l'email

**Astuce** : fais quelques petites modifications sur des articles existants (corriger un typo, ajouter une référence) avant de créer ta propre entité. Ça évite que ton entrée soit flaguée comme "spam" ou "conflit d'intérêt".

---

## Étape 2 — Créer un nouvel Item

1. Menu gauche → "Créer un nouvel élément"
2. **Label en français** : SOS-Expat
3. **Description en français** : Plateforme mondiale de mise en relation téléphonique avec avocat ou expatrié aidant
4. **Alias en français** : SOS Expat, sos-expat, SOS-Expat.com
5. Click "Créer"

Wikidata va te donner un ID du type `Q12345678`. **Note-le**.

---

## Étape 3 — Labels multilingues (répéter pour chaque langue)

| Lang | Label | Description |
|------|-------|-------------|
| fr | SOS-Expat | Plateforme mondiale de mise en relation téléphonique avec avocat ou expatrié aidant pour voyageurs, expatriés et nomades digitaux |
| en | SOS-Expat | Global phone-based platform connecting travelers, expats, digital nomads, students and retirees to lawyers or helpful expats |
| es | SOS-Expat | Plataforma mundial de conexión telefónica con abogado o expatriado ayudante para viajeros, expatriados y nómadas digitales |
| de | SOS-Expat | Globale Telefonplattform zur Verbindung von Reisenden, Expats, Digital Nomads mit Anwälten oder hilfsbereiten Expats |
| pt | SOS-Expat | Plataforma mundial de ligação telefónica com advogado ou expatriado ajudante para viajantes, expatriados e nómadas digitais |
| ru | SOS-Expat | Глобальная телефонная платформа, соединяющая путешественников, экспатов и цифровых кочевников с юристами или помогающими экспатами |
| zh | SOS-Expat | 全球电话平台，为旅行者、海外华人、数字游民与律师或热心海外同胞对接 |
| hi | SOS-Expat | यात्रियों, प्रवासियों, डिजिटल नोमैड को वकील या मददगार प्रवासी से जोड़ने वाला वैश्विक फ़ोन प्लेटफ़ॉर्म |
| ar | SOS-Expat | منصة هاتفية عالمية تربط المسافرين والمغتربين والبدو الرقميين بمحامين أو مغتربين مساعدين |

---

## Étape 4 — Statements (propriétés structurées)

Ajoute **dans l'ordre** ces statements via "Ajouter une déclaration" :

### Identité
| Property | Value |
|----------|-------|
| **P31** instance of | online platform (Q14657534) |
| **P31** instance of | business (Q4830453) |
| **P452** industry | legal technology (Q107529170) |
| **P452** industry | travel services (Q4416016) |
| **P571** inception | *(à compléter après immatriculation Äriregister — format YYYY-MM-DD)* |

### Localisation
| Property | Value |
|----------|-------|
| **P17** country | Estonia (Q191) |
| **P159** headquarters location | Tallinn (Q1770) |

### Web
| Property | Value | Qualifier |
|----------|-------|-----------|
| **P856** official website | https://sos-expat.com | language of work: fr, en, es, de, pt, ru, zh, hi, ar |
| **P2002** Twitter username | sosexpat | |
| **P2013** Facebook ID | sosexpat | |
| **P4264** LinkedIn company ID | sos-expat-com | |
| **P2003** Instagram username | sosexpat | |

### Juridique (à compléter après immatriculation)
| Property | Value |
|----------|-------|
| **P1454** legal form | Osaühing / OÜ (Q1123201) — Estonian private LLC |
| **P1278** Legal Entity Identifier | — *(à compléter)* |
| **P6269** Estonian Business Register ID | — *(à compléter, 8 chiffres)* |
| **P3548** VAT number | EE*(à compléter, 9 chiffres)* |

### Personnes
| Property | Value |
|----------|-------|
| **P112** founded by | Williams Jullin (créer un nouvel item Person si pas existant) |
| **P169** CEO | Williams Jullin |

### Services (contenu)
| Property | Value |
|----------|-------|
| **P2416** sports discipline / type of business | legal advice (Q14659781) |
| **P3259** language of work or name | French, English, Spanish, German, Portuguese, Russian, Chinese, Hindi, Arabic |

### Identifiants externes (DÉS QUE PARUS)
| Property | Value |
|----------|-------|
| **P2397** YouTube channel ID | — *(si existe)* |
| **P3220** Crunchbase company ID | sos-expat (après inscription Crunchbase) |
| **P7748** AngelList company | sos-expat (après inscription Wellfound) |
| **P8687** Product Hunt ID | sos-expat (si launch PH) |

---

## Étape 5 — Sources (CRITIQUE pour la notabilité Wikidata)

Chaque statement important doit avoir **au moins une source** de type
"stated in" + reference URL. Sinon l'entry sera flagué ou supprimé.

Sources à utiliser :
1. **Press article #1** — URL + date + auteur
2. **Press article #2** — URL + date + auteur
3. **Press article #3** — URL + date + auteur
4. **Crunchbase profile** — après création
5. **LinkedIn Company** — déjà actif : linkedin.com/company/sos-expat-com
6. **Wellfound profile** — après création
7. **Site officiel sos-expat.com** — pour les faits self-reportés

---

## Étape 6 — Commitments & reviews

Wikidata a des reviewers humains qui vérifient :
- ✅ Au moins 3-5 sources externes indépendantes
- ✅ Statements factuels (pas marketing)
- ✅ Labels neutres (pas promotionnels)
- ✅ Pas de conflit d'intérêts déclaré (OK de créer son propre item, mais déclarer "involvement")

**Temps avant validation** : 24-72h généralement, parfois 1-2 semaines.

---

## Étape 7 — Ajouter la référence dans le JSON-LD du site

Dès que tu as ton `Q-ID`, ajoute-le dans `sos/index.html` JSON-LD Organization :

```json
"sameAs": [
  "https://www.facebook.com/sosexpat",
  "https://twitter.com/sosexpat",
  "https://www.linkedin.com/company/sos-expat-com/",
  "https://www.instagram.com/sosexpat",
  "https://www.wikidata.org/wiki/Q12345678"  // ← ajouter cette ligne
]
```

Ça crée le lien bidirectionnel Google voit → "entité confirmée".

---

## Étape 8 — Attendre que Google ingère

Google fait un snapshot Wikidata **toutes les 24-72h**. Ton Knowledge Panel
peut apparaître progressivement :
- Semaine 1 : panneau vide ou partiel
- Semaine 2-4 : nom + logo + description courte
- Mois 2-3 : sociaux + description longue + founder
- Mois 3-6 : panneau complet avec "People also ask"

Tu peux accélérer en créant un article Wikipedia si tu as assez de sources
presse (règle Wikipedia : ~3-5 articles tier-1 requis, pas juste blogs).

---

## Checklist avant de créer Wikidata

- [ ] Compte Wikidata créé + email confirmé
- [ ] 3+ articles presse parus mentionnant SOS-Expat nominativement
- [ ] Profile Crunchbase créé
- [ ] LinkedIn Company bien rempli (bio, 9 langues, cover)
- [ ] Page /presse SOS-Expat à jour avec press releases
- [ ] **Au moins 24h passées depuis l'article presse le plus récent**
  (sinon Wikidata peut flagger comme "création suspecte")
- [ ] Éviter de créer en week-end (les reviewers Wikidata sont moins actifs)

---

## Kit complet de copier-coller pour la création rapide

Copie ces chaînes directement dans les champs Wikidata :

**Alias (EN)** :
```
SOS Expat
sos-expat
SOS-Expat.com
World Expat OÜ
```

**Description courte (EN)** :
```
Global phone-based platform connecting travelers, expats, digital nomads, students and retirees to lawyers or helpful expats in under 5 minutes, in 197 countries and 9 languages
```

**Description longue (EN)** pour le résumé (dans la langue par défaut) :
```
SOS-Expat is a phone-based assistance platform founded in Tallinn, Estonia. It connects people abroad — travelers, tourists, expats, digital nomads, students, retirees — to a local lawyer (€49 / 20 min) or a helpful expatriate (€19 / 30 min) in under 5 minutes. Available 24/7 in 197 countries with a 9-language interface (French, English, Spanish, German, Portuguese, Russian, Chinese Simplified, Hindi, Arabic). Pay-per-call model, no subscription. Founded by Williams Jullin.
</parsoid-escape>
```

---

## Après création — Actions

1. **Mets le Q-ID** dans `sos/index.html` sameAs
2. **Mets le Q-ID** dans `brand-entity-kit/01-nap-canonique.md` — section "À ajouter dès immatriculation"
3. **Share le Q-ID** avec les journalistes de la campagne presse en cours — ils pourront linker vers Wikidata dans leurs articles
4. **Monitore** le Knowledge Panel Google en tapant "SOS Expat" dans google.fr, google.com, google.de
