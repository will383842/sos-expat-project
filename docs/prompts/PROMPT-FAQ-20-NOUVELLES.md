# PROMPT — Créer 20 nouvelles FAQ Firestore pour SOS-Expat

## Contexte

SOS-Expat (https://sos-expat.com) est un service de mise en relation téléphonique avec un avocat ou expert local en moins de 5 minutes. 197 pays, 9 langues, 24/7. Deux types de prestataires : avocats (49€/20 min) et expatriés aidants (19€/30 min).

Il existe déjà 10 FAQ dans Firestore (collection `app_faq`). Je veux en ajouter 20 de plus pour un total de 30 FAQ, afin de maximiser le référencement SEO/AEO (Google Search, featured snippets, FAQ rich results, voice search).

## Structure exacte d'un document Firestore `app_faq`

Chaque document doit avoir EXACTEMENT cette structure :

```json
{
  "question": {
    "fr": "Question en français ?",
    "en": "Question in English?",
    "es": "¿Pregunta en español?",
    "de": "Frage auf Deutsch?",
    "pt": "Pergunta em português?",
    "ru": "Вопрос на русском?",
    "hi": "हिंदी में सवाल?",
    "ar": "سؤال بالعربية؟",
    "ch": "中文问题？"
  },
  "answer": {
    "fr": "Réponse en français. Peut contenir du HTML basique (<strong>, <a>, <ul>, <li>).",
    "en": "Answer in English...",
    "es": "...", "de": "...", "pt": "...", "ru": "...", "hi": "...", "ar": "...", "ch": "..."
  },
  "slug": {
    "fr": "slug-francais-seo-optimise",
    "en": "english-seo-optimized-slug",
    "es": "slug-espanol-optimizado",
    "de": "deutscher-seo-slug",
    "pt": "slug-portugues-otimizado",
    "ru": "ru-slug-romanise-en-ascii",
    "hi": "hi-slug-romanise-en-ascii",
    "ar": "ar-slug-romanise-en-ascii",
    "ch": "ch-slug-romanise-en-ascii"
  },
  "category": "discover",
  "tags": ["tag1", "tag2"],
  "order": 11,
  "isActive": true,
  "isFooter": false
}
```

## IMPORTANT — Langues internes

- Le chinois utilise le code `"ch"` (PAS `"zh"`) dans Firestore
- Les slugs RU/HI/AR/CH doivent être en ASCII romanisé, préfixés par le code langue (ex: `"ru-kak-rabotaet"`, `"ch-how-to-use"`, `"hi-kaise-kaam"`, `"ar-kayfa-yaemal"`)
- Les slugs FR/EN/ES/DE/PT sont la traduction naturelle en slug ASCII

## Les 6 catégories disponibles

| ID | FR | EN |
|---|---|---|
| `discover` | Découvrir SOS-Expat | Discover SOS-Expat |
| `clients` | Je cherche de l'aide | I need help |
| `providers` | Je suis prestataire | I'm a provider |
| `payments` | Paiements & Tarifs | Payments & Pricing |
| `account` | Compte & Inscription | Account & Registration |
| `technical` | Technique & Sécurité | Technical & Security |

## Les 10 FAQ existantes (NE PAS dupliquer)

1. Qu'est-ce que SOS-Expat ? (`discover`)
2. Quels sont les tarifs ? (`payments`)
3. Comment fonctionne la plateforme ? (`discover`)
4. Qui sont les prestataires ? (`providers`)
5. Comment devenir prestataire ? (`providers`)
6. Comment fonctionne le paiement ? (`payments`)
7. Combien de temps dure un appel ? (`clients`)
8. Quelle différence entre avocat et expatrié aidant ? (`clients`)
9. Comment fonctionne la rémunération ? (`providers`)
10. Comment suis-je payé ? (`providers`)

## Les 20 nouvelles FAQ à créer

Répartition souhaitée par catégorie :
- `discover` : 3 FAQ (mettre en avant le service, couverture mondiale, langues)
- `clients` : 5 FAQ (cas d'usage concrets : urgence, visa, logement, santé, juridique)
- `providers` : 3 FAQ (inscription, profil, disponibilité)
- `payments` : 3 FAQ (remboursement, devise, facturation)
- `account` : 3 FAQ (inscription, sécurité données, suppression compte)
- `technical` : 3 FAQ (connexion, qualité appel, compatibilité mobile)

## Exigences SEO/AEO

1. **Questions** : Formulées comme les gens cherchent sur Google (longue traîne, langage naturel). Ex: "Peut-on appeler un avocat le dimanche ?" plutôt que "Disponibilité du service"
2. **Réponses** : 150-300 mots, structurées avec des listes HTML `<ul><li>` quand pertinent. Commencer par une réponse directe (1 phrase) puis développer. Google extrait la 1ère phrase pour les featured snippets.
3. **Slugs** : Mots-clés principaux, 3-7 mots, sans mots vides (le, de, un). Ex: `appeler-avocat-dimanche-urgence`
4. **Tags** : 3-5 tags pertinents en anglais (utilisés pour le linking interne)
5. **Réponses naturelles pour l'AEO** : La 1ère phrase de chaque réponse doit pouvoir être lue par un assistant vocal (Alexa, Google Assistant). Pas de jargon, pas de "cliquez ici".
6. **Traductions** : Chaque FAQ traduite naturellement dans les 9 langues (pas du mot-à-mot). Adapter les exemples culturellement (ex: en AR mentionner les pays du Golfe, en HI l'Inde, en ZH la Chine).
7. **order** : De 11 à 30 (les 10 existantes sont de 1 à 10)

## Format de sortie

Génère un script JavaScript exécutable qui crée les 20 documents dans Firestore :

```javascript
// Script à exécuter dans la console Firebase ou via Node.js
// Collection: app_faq

const faqs = [
  { question: {...}, answer: {...}, slug: {...}, category: "...", tags: [...], order: 11, isActive: true, isFooter: false },
  // ... 20 FAQs
];

// Le code d'insertion Firestore sera ajouté après validation du contenu
```

## Ce que fait SOS-Expat (pour contexte des réponses)

- Mise en relation téléphonique en <5 minutes avec un avocat ou expatrié aidant local
- 197 pays couverts, 9 langues (FR, EN, ES, DE, PT, RU, ZH, HI, AR)
- Disponible 24/7
- Avocat : 49€/20 min (droit local, litiges, contrats, immigration)
- Expatrié aidant : 19€/30 min (logement, démarches, vie quotidienne, orientation)
- Paiement sécurisé par carte (Stripe)
- Pas d'abonnement, paiement à l'appel
- Prestataires vérifiés (KYC, profils approuvés)
- Avis clients visibles sur chaque profil
- Application web (pas de téléchargement)
- Confidentiel (pas d'enregistrement des appels)
