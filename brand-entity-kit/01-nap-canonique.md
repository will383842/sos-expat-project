# NAP canonique SOS-Expat

**NAP** = Name, Address, Phone. **Bloc unique à copier-coller à l'identique**
partout sur le web pour consolider le signal d'entité auprès de Google.

⚠️ **RÈGLE D'OR** : même orthographe, même ponctuation, même ordre partout.
La moindre différence (virgule, tiret, accent) réduit l'effet.

> **Statut société 2026-04-22** : World Expat OÜ est en cours de création à
> Tallinn. Tant que l'immatriculation au Äriregister n'est pas finalisée,
> on n'affiche PAS de numéro d'enregistrement / TVA / date d'incorporation
> — mieux vaut pas d'info que fausse info (Google + journalistes).

---

## Bloc NAP canonique — FR

```
Nom : SOS-Expat
Raison sociale : World Expat OÜ (société en cours de création, Tallinn)
Forme juridique : OÜ (équivalent SARL en Estonie)
Ville : Tallinn
Pays : Estonie (EE)
Fondateur : Williams Jullin
Site web : https://sos-expat.com
Formulaire de contact : https://sos-expat.com/fr-fr/contact
Page presse : https://sos-expat.com/presse
Contact presse : contact@sos-expat.com
LinkedIn : https://www.linkedin.com/company/sos-expat-com/
```

## Bloc NAP canonique — EN

```
Name: SOS-Expat
Legal name: World Expat OÜ (company formation in progress, Tallinn)
Legal form: OÜ (Estonian private limited company)
City: Tallinn
Country: Estonia (EE)
Founder: Williams Jullin
Website: https://sos-expat.com
Contact form: https://sos-expat.com/en-us/contact
Press page: https://sos-expat.com/presse
Press contact: contact@sos-expat.com
LinkedIn: https://www.linkedin.com/company/sos-expat-com/
```

## Bloc NAP canonique — ET (Estonien, pour registres locaux)

```
Nimi: SOS-Expat
Ärinimi: World Expat OÜ (registreerimine pooleli)
Linn: Tallinn
Riik: Eesti (EE)
Asutaja: Williams Jullin
Veebileht: https://sos-expat.com
Pressikontakt: contact@sos-expat.com
LinkedIn: https://www.linkedin.com/company/sos-expat-com/
```

---

## À ajouter DÈS que la société est officiellement enregistrée

Ces champs seront à compléter + rediffuser partout où le NAP est posé
(annuaires, LinkedIn, Crunchbase, JSON-LD, Wikidata) :

- `Adresse` : rue + numéro + code postal Tallinn
- `Registrikood` : numéro Äriregister (8 chiffres)
- `Käibemaksukohustuslase number` / VAT : `EE` + 9 chiffres
- `Asutamise kuupäev` / foundingDate : date d'incorporation YYYY-MM-DD

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
LinkedIn  : https://www.linkedin.com/company/sos-expat-com/
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

Email **presse / business uniquement** : `contact@sos-expat.com`.

## Téléphone — politique

**Aucun téléphone public** (décision business). Impact :

- ✅ Schema.org : `telephone` omis, tolérant
- ✅ Wikidata : pas obligatoire
- ⚠️ Google Business Profile : validation par SMS **impossible** sans
  téléphone. Solution : Google Voice gratuit (numéro virtuel, masqué du
  public, utilisé UNIQUEMENT pour la vérification GBP). Voir
  `gbp/checklist.md`.

## Mise à jour du NAP — à faire par toi

Dès que le Äriregister confirme l'immatriculation de World Expat OÜ :

1. Complète les 4 champs manquants dans la section "À ajouter" ci-dessus
2. Colle le NAP français dans les 30 annuaires français listés dans
   `11-nap-directories.md`
3. Colle le NAP anglais dans les 30 annuaires internationaux
4. Colle les NAP dans les 9 langues dans les annuaires multilingues
   (LinkedIn, Crunchbase, etc. gèrent plusieurs langues dans un profil)
