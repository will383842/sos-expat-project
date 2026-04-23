# Bios auteurs d'articles — kit E-E-A-T

Google SGE / AI Overviews cite en priorité les sources **signées par un
expert nommé avec credentials vérifiables**. Les articles blog anonymes
(ou signés "SOS-Expat team") sont **pénalisés** dans les AI answers.

Ce fichier définit les bios types à utiliser pour tes 4 catégories
d'auteurs.

---

## Structure JSON-LD Author (à injecter dans chaque article)

```json
{
  "@type": "Article",
  "author": {
    "@type": "Person",
    "name": "Williams Jullin",
    "url": "https://sos-expat.com/auteurs/williams-jullin",
    "image": "https://sos-expat.com/auteurs/williams-jullin.jpg",
    "jobTitle": "Fondateur, SOS-Expat",
    "knowsAbout": ["Expatriation", "International mobility", "Legal tech", "Emergency help abroad"],
    "alumniOf": "…",
    "sameAs": [
      "https://www.linkedin.com/in/williamsjullin/",
      "https://twitter.com/williamsjullin"
    ]
  },
  "reviewedBy": {
    "@type": "Person",
    "name": "Me. [Nom de l'avocat relecteur]",
    "jobTitle": "Avocat au Barreau de [Ville]",
    "identifier": "RPVA / CCBE ID si disponible"
  },
  "dateModified": "2026-04-23",
  "datePublished": "2026-XX-XX"
}
```

---

## 4 types d'auteurs possibles pour ton site

### 1. Founder (Williams Jullin)
- **Utilisation** : articles stratégiques, manifestes, tribunes
- **Fréquence** : 1-2 par mois
- **Bio template** :

> Williams Jullin est le fondateur de SOS-Expat.com, plateforme mondiale
> d'aide téléphonique à l'étranger. Il a travaillé [X années dans Y
> secteur]. Avant de créer SOS-Expat, il [expérience précédente].
> Diplômé de [école], il est basé à Tallinn (Estonie). Il intervient
> régulièrement dans les médias sur les sujets de mobilité
> internationale, legaltech et accès démocratisé au conseil juridique.

### 2. Avocats partenaires (experts juridiques)
- **Utilisation** : articles YMYL (Your Money Your Life) — droit, fiscal, visa
- **Fréquence** : obligatoire sur tout article légal
- **Bio template** :

> Me. [Prénom Nom] est avocat au Barreau de [Ville], spécialisé en
> [droit international privé / immigration / fiscalité expatriation].
> Il/elle est diplômé(e) de [école], inscrit au [ordre], et exerce
> depuis [N] ans. Partenaire vérifié SOS-Expat depuis [date].
> Langues : français, anglais, [autres].

**Champs E-E-A-T requis** :
- Bar registration number (RPVA code / CCBE ID)
- Lien vers le profil de l'ordre (ex: cnb.avocat.fr/...)
- Date de vérification SOS-Expat
- Disclaimer standard : "Cet article constitue un avis juridique
  général et ne remplace pas une consultation individuelle."

### 3. Expatriés aidants (experts terrain)
- **Utilisation** : articles pratiques, retours d'expérience, conseils
  administratifs par pays
- **Fréquence** : 50-70% du contenu blog
- **Bio template** :

> [Prénom Nom] vit à [Ville, Pays] depuis [N] ans. Expatrié(e)
> [nationalité → pays de destination], il/elle est expatrié aidant
> vérifié sur SOS-Expat. Spécialités : [administratif / logement /
> santé / fiscalité] dans [pays]. Langues parlées : [liste].

### 4. Journalistes / rédacteurs invités
- **Utilisation** : tribunes, analyses, entretiens
- **Fréquence** : 1-2 par trimestre
- **Bio template** :

> [Prénom Nom] est journaliste indépendant(e), spécialisé(e) dans
> [sujet]. Il/elle a notamment écrit pour [Le Monde / Le Figaro /
> BBC / etc.]. Cet article a été rédigé sur commande de SOS-Expat
> en toute indépendance éditoriale.

---

## Page /auteurs/{slug} — à créer côté Laravel blog

Chaque auteur doit avoir sa page dédiée :
- `https://sos-expat.com/fr-fr/auteurs/williams-jullin`
- `https://sos-expat.com/fr-fr/auteurs/me-sophie-dupont`
- etc.

**Contenu minimal par page auteur** :
- Photo professionnelle (300×300 min)
- Nom + titre
- Bio longue (200-400 mots)
- Credentials (diplômes, numéros d'ordre)
- Langues parlées
- Spécialités / thèmes
- Liste des articles publiés (auto via relation BlogArticle.author_id)
- Liens sociaux (LinkedIn surtout)
- JSON-LD Person structuré

Ces pages servent de **cibles pour les liens `author.url`** dans les articles.

---

## Template Blade — exemple

```blade
{{-- resources/views/auteurs/show.blade.php --}}
@extends('layouts.app')

@section('content')
<article itemscope itemtype="https://schema.org/Person">
  <img src="{{ $author->image_url }}" alt="{{ $author->name }}" itemprop="image">
  <h1 itemprop="name">{{ $author->name }}</h1>
  <p itemprop="jobTitle">{{ $author->job_title }}</p>

  <div itemprop="description">
    {!! $author->bio !!}
  </div>

  @if($author->credentials)
    <section>
      <h2>Credentials</h2>
      <ul>
        @foreach($author->credentials as $cred)
          <li>{{ $cred->label }} @if($cred->verification_url)
            — <a href="{{ $cred->verification_url }}" rel="noopener" itemprop="identifier">vérifier</a>
          @endif</li>
        @endforeach
      </ul>
    </section>
  @endif

  <section>
    <h2>Articles de {{ $author->name }}</h2>
    @foreach($author->articles as $article)
      <a href="{{ route('article.show', $article) }}">{{ $article->title }}</a>
    @endforeach
  </section>

  <link itemprop="sameAs" href="{{ $author->linkedin_url }}">
</article>
@endsection
```

---

## Migration DB Laravel (à faire côté blog repo)

Ajouter à la table `articles` (ou équivalent) :
- `author_id` → foreign key vers `users` ou `authors`
- `reviewed_by_id` → foreign key pour le reviewer juridique (optionnel)

Créer table `authors` :
- id, name, slug, bio, job_title, image_url, linkedin_url, bar_registration, credentials (JSON), languages (JSON), specialties (JSON), created_at

---

## Plan d'action progressif

### Phase 1 (cette semaine) — 1h
1. Crée ta propre bio personnelle + photo (Williams Jullin)
2. Injecte-la dans tous les articles "existants" signés actuellement
   "SOS-Expat team" → signe "Par Williams Jullin"
3. Ajoute JSON-LD Author dans le Blade `articles/show.blade.php`

### Phase 2 (2-4 semaines) — 2-3h
4. Ajoute 3-5 bios d'avocats partenaires (ceux qui ont accepté)
5. Ajoute 3-5 bios d'expats aidants vérifiés
6. Crée les pages `/auteurs/{slug}` associées

### Phase 3 (2-3 mois) — processus continu
7. Chaque nouvel article = auteur nommé obligatoire
8. Articles YMYL (juridique, fiscal, visa) → reviewer juridique obligatoire
9. Disclaimer légal en bas de chaque article YMYL

---

## Impact attendu

| Métrique | Avant | Après 3 mois |
|----------|-------|--------------|
| Citations par AI Overviews | Presque 0 | +30-50% |
| Ranking articles YMYL | Moyen | +2-3 positions |
| Trust signal Google | Moyen | Fort |
| Position Knowledge Panel | Instable | Stable si Wikidata OK |

C'est l'investissement SEO **à plus gros ROI long terme** pour un site
qui produit du contenu.
