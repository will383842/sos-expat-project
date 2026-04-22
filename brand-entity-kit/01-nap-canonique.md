# NAP canonique SOS-Expat

**NAP** = Name, Address, Phone. **Bloc unique à copier-coller à l'identique**
partout sur le web pour consolider le signal d'entité auprès de Google.

⚠️ **RÈGLE D'OR** : même orthographe, même ponctuation, même ordre partout.
La moindre différence (virgule, tiret, accent) réduit l'effet.

---

## Bloc NAP canonique — FR

```
Nom : SOS-Expat
Raison sociale : [À COMPLÉTER — ex. SOS-Expat OÜ]
Forme juridique : [À COMPLÉTER — probablement OÜ (équivalent SARL en Estonie)]
Adresse : [À COMPLÉTER — rue + numéro]
Code postal : [À COMPLÉTER]
Ville : Tallinn
Pays : Estonie (EE)
Registre commercial estonien (Äriregister) : [À COMPLÉTER — n° d'enregistrement 8 chiffres]
N° TVA intracommunautaire : EE[À COMPLÉTER — 9 chiffres]
Site web : https://sos-expat.com
Formulaire de contact : https://sos-expat.com/fr-fr/contact
Formulaire presse : https://sos-expat.com/fr-fr/presse
Contact presse : contact@sos-expat.com
```

## Bloc NAP canonique — EN

```
Name: SOS-Expat
Legal name: [TO COMPLETE — e.g. SOS-Expat OÜ]
Legal form: [TO COMPLETE — likely OÜ (Estonian LLC equivalent)]
Address: [TO COMPLETE — street + number]
Postal code: [TO COMPLETE]
City: Tallinn
Country: Estonia (EE)
Estonian Business Register (Äriregister): [TO COMPLETE — 8-digit registration number]
EU VAT: EE[TO COMPLETE — 9 digits]
Website: https://sos-expat.com
Contact form: https://sos-expat.com/en-us/contact
Press form: https://sos-expat.com/en-us/press
Press contact: contact@sos-expat.com
```

## Bloc NAP canonique — ET (Estonien, pour registres locaux)

```
Nimi: SOS-Expat
Ärinimi: [TÄITA — nt SOS-Expat OÜ]
Aadress: [TÄITA — täielik ametlik aadress]
Linn: Tallinn
Riik: Eesti (EE)
Registrikood: [TÄITA — 8-kohaline]
Käibemaksukohustuslase number: EE[TÄITA]
Veebileht: https://sos-expat.com
Pressikontakt: contact@sos-expat.com
```

---

## Variantes du nom — RÈGLE STRICTE

Google tolère ces variantes en `alternateName` mais **le NOM CANONIQUE
est `SOS-Expat`** (avec tiret, S et E majuscules).

| Variante | Usage |
|----------|-------|
| **SOS-Expat** | ✅ CANONIQUE — à utiliser partout en premier |
| SOS Expat | Autorisé comme `alternateName` (sans tiret, orthographe user-friendly) |
| SOS-Expat.com | Autorisé comme `alternateName` (avec TLD, pour clarifier) |
| sos-expat | Autorisé en URL / identifiant technique uniquement |
| SOSExpat | ❌ À éviter (casse la lisibilité) |
| Sos Expat | ❌ À éviter (orthographe non-brand) |

## Tagline officielle — 9 langues

Voir fichier `02-tagline-9-langues.md` pour le slogan par langue.

## Description courte — 9 langues

Voir fichier `03-descriptions-courtes.md`.

## Logos officiels

| Fichier | URL | Usage |
|---------|-----|-------|
| Logo carré 512×512 | `https://sos-expat.com/logo512.png` | OG, JSON-LD, GBP, réseaux sociaux (avatar) |
| Logo carré 112×112 | (à générer) | Favicon large, Schema.org logo |
| Logo horizontal | (à créer) | Header, bannière email, signatures |
| Bannière 1200×630 | `https://sos-expat.com/og-image.webp` | OG social preview, GBP cover |

## Couleurs brand

| Rôle | Couleur |
|------|---------|
| Primaire | **Rouge** `#DC2626` (valeur exacte à confirmer) |
| Secondaire | **Noir** `#000000` |
| Fond | **Blanc** `#FFFFFF` |
| Texte primaire | **Noir** `#000000` |
| Accent | **Rouge** `#DC2626` |

## Réseaux sociaux officiels (confirmés 2026-04-22)

```
Facebook  : https://www.facebook.com/sosexpat
Twitter/X : https://twitter.com/sosexpat
LinkedIn  : https://www.linkedin.com/company/sos-expat
Instagram : https://www.instagram.com/sosexpat
```

**Pas de YouTube, TikTok, Threads, Pinterest, WeChat, VKontakte, LINE,
ShareChat à ce jour.**

## Domaines officiels

| Domaine | Usage | Statut |
|---------|-------|--------|
| sos-expat.com | Principal | ✅ canonique |
| www.sos-expat.com | Alias | 301 → sos-expat.com |
| sos-holidays.com | Alternatif | 301 ou rebrand à trancher |

## Email — politique

Tu as choisi de **ne pas afficher d'email support public** ; le contact se
fait via le formulaire du site dans les 9 langues. Cohérent UX ; sans
impact SEO si bien documenté dans le JSON-LD (`contactPoint.url` plutôt
que `contactPoint.email`).

Email **presse uniquement** : `contact@sos-expat.com` (à confirmer — typo
initiale reçue `contactsos-expat.com`).

## Téléphone — politique

**Aucun téléphone public** (décision business). Impact :

- ✅ Schema.org : `telephone` omis, tolérant
- ✅ Wikidata : pas obligatoire
- ⚠️ Google Business Profile : validation par SMS **impossible** sans
  téléphone. Solution : Google Voice gratuit (numéro virtuel, masqué du
  public, utilisé UNIQUEMENT pour la vérification GBP). Voir
  `gbp/checklist.md`.

## Mise à jour du NAP — à faire par toi

Remplace les `[À COMPLÉTER]` dans ce fichier avec les vraies valeurs, puis :

1. Colle le NAP français dans les 30 annuaires français listés dans
   `11-nap-directories.md`
2. Colle le NAP anglais dans les 30 annuaires internationaux
3. Colle les NAP dans les 9 langues dans les annuaires multilingues
   (LinkedIn, Crunchbase, etc. gèrent plusieurs langues dans un profil)
