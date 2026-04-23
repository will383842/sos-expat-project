// src/services/faqInit.ts
// Initialisation des FAQ avec traduction automatique

import { createFAQ, listFAQs, deleteFAQ, translateFAQToAllLanguages, FAQInput } from "./faq";

// Structure simplifiée : on définit en français, la traduction est automatique
interface FAQSource {
  question: string;
  answer: string;
  category: string;
  tags: string[];
  order: number;
  isActive: boolean;
  isFooter?: boolean;
}

// ============================================================================
// 🌍 DÉCOUVRIR SOS-EXPAT (10 FAQ)
// ============================================================================
const DISCOVER_FAQS: FAQSource[] = [
  {
    question: "Qu'est-ce que SOS-Expat ?",
    answer: "SOS-Expat est la première plateforme mondiale qui connecte par téléphone, en moins de 5 minutes, les voyageurs, vacanciers, expatriés, digital nomades, étudiants et retraités à un avocat francophone ou à un expatrié aidant qui connaît le terrain. Une urgence, une question administrative, un doute ou un simple conseil — nous répondons à tous les besoins dans votre langue. Consultation payante à l'acte (avocat 49€/20 min, expatrié aidant 19€/30 min), sans abonnement ni engagement. 197 pays, 9 langues, 24h/24. Peu importe votre nationalité ou votre pays.",
    category: "discover",
    tags: ["présentation", "plateforme", "mission", "voyageurs", "vacanciers", "expatriés", "digital nomades", "étudiants", "retraités", "urgence", "tarifs"],
    order: 1,
    isActive: true,
    isFooter: true
  },
  {
    question: "Comment fonctionne la plateforme ?",
    answer: "SOS-Expat vous connecte à des prestataires pour un premier contact d'aide rapide :\n\n1. Créez votre compte gratuitement\n2. Choisissez un prestataire (avocat 49€/20min ou expat aidant 19€/30min)\n3. Effectuez un paiement unique (rémunération prestataire + frais de mise en relation)\n4. Soyez mis en relation immédiatement par téléphone\n5. Évaluez votre prestataire après l'appel\n\nCes appels sont conçus pour apporter une première aide. Toute ouverture de dossier ou collaboration se poursuit directement avec le prestataire, en dehors de la plateforme.",
    category: "discover",
    tags: ["fonctionnement", "étapes", "processus", "inscription", "premier contact"],
    order: 2,
    isActive: true,
    isFooter: true
  },
  {
    question: "Dans quels pays êtes-vous disponibles ?",
    answer: "SOS-Expat est disponible dans 197 pays à travers le monde, sur tous les continents. Nos prestataires (avocats et expats aidants) couvrent l'Europe, l'Amérique du Nord et du Sud, l'Asie, l'Afrique et l'Océanie. Le service n'est pas disponible pour les résidents de France métropolitaine.",
    category: "discover",
    tags: ["pays", "couverture", "international", "monde"],
    order: 3,
    isActive: true,
    isFooter: true
  },
  {
    question: "Quelles langues sont supportées ?",
    answer: "SOS-Expat est disponible en 9 langues : Français, Anglais, Espagnol, Allemand, Portugais, Russe, Hindi, Arabe et Chinois. Vous pouvez changer la langue à tout moment. Nos prestataires parlent également plusieurs langues pour mieux vous accompagner.",
    category: "discover",
    tags: ["langues", "multilingue", "traduction"],
    order: 4,
    isActive: true,
    isFooter: false
  },
  {
    question: "Quelle différence entre avocat et expat aidant ?",
    answer: "SOS-Expat propose un premier contact rapide avec deux types de prestataires :\n\n• Avocat (49€ / 20 min) : Professionnel du droit diplômé, inscrit au barreau. Premier conseil juridique sur contrats, litiges, immigration, droit du travail...\n\n• Expat Aidant (19€ / 30 min) : Expatrié expérimenté vivant dans votre pays de destination. Premiers conseils pratiques sur démarches administratives, logement, culture locale...\n\nCes appels constituent une première aide rapide. Si un suivi ou l'ouverture d'un dossier est nécessaire, cela se fait directement entre vous et le prestataire, en dehors de la plateforme SOS-Expat.",
    category: "discover",
    tags: ["avocat", "expat aidant", "différence", "prestataire", "premier contact"],
    order: 5,
    isActive: true,
    isFooter: true
  },
  {
    question: "Comment contacter le support ?",
    answer: "Pour nous contacter :\n• Utilisez le formulaire de contact sur notre site (réponse sous 24h)\n• Rendez-vous sur la page Contact accessible depuis le menu\n• Chat en direct (disponible 24/7)\n\nNotre équipe support est multilingue et disponible pour vous aider dans votre langue.",
    category: "discover",
    tags: ["support", "contact", "aide"],
    order: 6,
    isActive: true,
    isFooter: false
  },
  {
    question: "SOS-Expat est-il disponible 24h/24 ?",
    answer: "Oui, notre plateforme est accessible 24h/24, 7j/7. Cependant, la disponibilité des prestataires varie selon les fuseaux horaires. Vous pouvez voir en temps réel quels prestataires sont disponibles et prêts à vous aider immédiatement.",
    category: "discover",
    tags: ["disponibilité", "24/7", "horaires"],
    order: 7,
    isActive: true,
    isFooter: false
  },
  {
    question: "Qui sont les prestataires sur SOS-Expat ?",
    answer: "Nos prestataires sont des professionnels vérifiés qui offrent un premier contact d'aide rapide :\n• Avocats : diplômés et inscrits au barreau de leur pays (49€/20min)\n• Expats aidants : expatriés expérimentés vivant depuis au moins 2 ans dans leur pays d'accueil (19€/30min)\n\nTous passent par un processus de vérification (KYC) et sont notés par les utilisateurs. Les tarifs sont fixés par SOS-Expat, les prestataires ne fixent pas leurs propres prix.",
    category: "discover",
    tags: ["prestataires", "vérification", "qualité", "tarifs fixes"],
    order: 8,
    isActive: true,
    isFooter: false
  }
];

// ============================================================================
// 👤 JE CHERCHE DE L'AIDE - CLIENTS (8 FAQ)
// ============================================================================
const CLIENTS_FAQS: FAQSource[] = [
  {
    question: "Comment créer une demande d'aide ?",
    answer: "1. Connectez-vous à votre compte (ou créez-en un gratuitement)\n2. Cliquez sur \"Demander de l'aide\" ou \"S.O.S Appel\"\n3. Choisissez le type de prestataire (avocat ou expat aidant)\n4. Parcourez les profils disponibles et sélectionnez celui qui correspond à vos besoins\n5. Validez le paiement pour être mis en relation immédiatement",
    category: "clients",
    tags: ["demande", "aide", "création", "client"],
    order: 10,
    isActive: true,
    isFooter: true
  },
  {
    question: "Combien de temps pour être mis en relation ?",
    answer: "La mise en relation est immédiate ! Dès que vous validez le paiement, notre système appelle automatiquement le prestataire puis vous met en relation. Si le prestataire ne répond pas après 3 tentatives (espacées de 2 minutes), vous êtes intégralement remboursé.",
    category: "clients",
    tags: ["temps", "connexion", "mise en relation", "rapidité"],
    order: 11,
    isActive: true,
    isFooter: false
  },
  {
    question: "Puis-je choisir mon prestataire ?",
    answer: "Oui ! Vous pouvez parcourir les profils des prestataires disponibles et choisir celui qui correspond le mieux à vos besoins. Chaque profil indique : spécialités, langues parlées, pays d'expertise, évaluations et disponibilité en temps réel.",
    category: "clients",
    tags: ["choix", "prestataire", "profil", "sélection"],
    order: 12,
    isActive: true,
    isFooter: false
  },
  {
    question: "Puis-je être remboursé ?",
    answer: "Oui, dans plusieurs cas :\n• Remboursement automatique si le prestataire ne répond pas après 3 tentatives\n• Remboursement sur demande en cas de problème technique\n• Remboursement partiel ou total si insatisfaction justifiée\n\nLes demandes doivent être faites dans les 24h suivant l'appel.",
    category: "clients",
    tags: ["remboursement", "garantie", "satisfaction"],
    order: 13,
    isActive: true,
    isFooter: true
  },
  {
    question: "Combien de temps dure un appel ?",
    answer: "Les durées sont fixes et adaptées à un premier contact d'aide rapide :\n\n• Appel Avocat : 20 minutes pour 49€\n• Appel Expat Aidant : 30 minutes pour 19€\n\nUn compteur affiche le temps restant pendant l'appel. Ces appels permettent d'obtenir une première aide. Pour un suivi plus approfondi ou l'ouverture d'un dossier, vous pouvez poursuivre directement avec le prestataire en dehors de la plateforme.",
    category: "clients",
    tags: ["durée", "temps", "appel", "premier contact"],
    order: 14,
    isActive: true,
    isFooter: false
  },
  {
    question: "Les appels sont-ils enregistrés ?",
    answer: "Non, aucun appel n'est enregistré pour garantir votre confidentialité. Seules les métadonnées (durée, date, tarif) sont conservées pour la facturation. Les conversations restent strictement privées entre vous et le prestataire.",
    category: "clients",
    tags: ["enregistrement", "confidentialité", "privé"],
    order: 15,
    isActive: true,
    isFooter: false
  },
  {
    question: "Puis-je recontacter le même prestataire ?",
    answer: "Oui ! Après un premier appel, vous pouvez retrouver ce prestataire dans votre historique et le recontacter directement. Vous pouvez également l'ajouter à vos favoris pour le retrouver facilement.",
    category: "clients",
    tags: ["recontacter", "favoris", "historique"],
    order: 16,
    isActive: true,
    isFooter: false
  },
  {
    question: "Comment évaluer un prestataire ?",
    answer: "Après chaque appel, vous recevez une invitation à évaluer le prestataire. Vous pouvez attribuer une note de 1 à 5 étoiles et laisser un commentaire. Ces évaluations aident les autres utilisateurs à choisir et maintiennent la qualité de notre réseau.",
    category: "clients",
    tags: ["évaluation", "note", "avis"],
    order: 17,
    isActive: true,
    isFooter: false
  }
];

// ============================================================================
// 💼 JE SUIS PRESTATAIRE (8 FAQ)
// ============================================================================
const PROVIDERS_FAQS: FAQSource[] = [
  {
    question: "Comment devenir prestataire ?",
    answer: "SOS-Expat est une plateforme de mise en relation pour des premiers contacts rapides avec des expatriés, voyageurs et vacanciers du monde entier.\n\n1. Cliquez sur \"Devenir prestataire\"\n2. Choisissez votre profil : Avocat ou Expat Aidant\n3. Remplissez le formulaire avec vos informations\n4. Téléchargez les documents requis (diplôme pour avocats, preuve de résidence pour expats)\n5. Complétez la vérification d'identité (KYC)\n6. Attendez la validation (généralement 24-48h)\n\nNote importante : Les tarifs sont définis par SOS-Expat (49€/20min pour avocats, 19€/30min pour expats). Vous n'avez pas à fixer vos propres tarifs.",
    category: "providers",
    tags: ["prestataire", "inscription", "devenir", "avocat", "expat"],
    order: 20,
    isActive: true,
    isFooter: true
  },
  {
    question: "Qu'est-ce que le KYC ?",
    answer: "KYC (Know Your Customer) est un processus de vérification d'identité obligatoire pour tous les prestataires. Il comprend :\n• Vérification de votre pièce d'identité\n• Selfie de confirmation\n• Vérification des documents professionnels\n\nCe processus garantit la sécurité de la plateforme et la confiance des clients.",
    category: "providers",
    tags: ["KYC", "vérification", "identité", "sécurité"],
    order: 21,
    isActive: true,
    isFooter: false
  },
  {
    question: "Comment suis-je payé ?",
    answer: "Les paiements sont effectués via Stripe Connect :\n• Après chaque appel réussi, votre rémunération est créditée sur votre compte Stripe\n• Les tarifs sont fixés par SOS-Expat : 49€ (20 min) pour avocats, 19€ (30 min) pour expats aidants\n• Le client fait un paiement unique, scindé entre votre rémunération et les frais de mise en relation SOS-Expat\n• Seuls les frais Stripe (~2.9%) sont déduits de votre part\n• Virements automatiques vers votre compte bancaire (quotidien, hebdomadaire ou mensuel)\n• Suivi de vos revenus dans votre tableau de bord",
    category: "providers",
    tags: ["paiement", "revenus", "stripe", "rémunération"],
    order: 22,
    isActive: true,
    isFooter: true
  },
  {
    question: "Qu'est-ce que le badge Expert Vérifié ?",
    answer: "Le badge \"Expert Vérifié\" est attribué aux prestataires qui ont :\n• Complété la vérification KYC\n• Fourni tous les documents professionnels requis\n• Maintenu une note moyenne supérieure à 4.5/5\n• Réalisé au moins 10 appels avec succès\n\nCe badge augmente votre visibilité et la confiance des clients.",
    category: "providers",
    tags: ["badge", "vérifié", "expert", "confiance"],
    order: 23,
    isActive: true,
    isFooter: false
  },
  {
    question: "Comment gérer ma disponibilité ?",
    answer: "Depuis votre tableau de bord, vous pouvez :\n• Activer/désactiver votre statut \"En ligne\"\n• Définir vos horaires de disponibilité\n• Bloquer certains créneaux\n• Recevoir des notifications quand un client vous sollicite\n\nVous êtes libre de gérer votre temps comme vous le souhaitez.",
    category: "providers",
    tags: ["disponibilité", "horaires", "planning"],
    order: 24,
    isActive: true,
    isFooter: false
  },
  {
    question: "Comment fonctionne la rémunération sur SOS-Expat ?",
    answer: "SOS-Expat est une plateforme de mise en relation pour des premiers contacts rapides. Le modèle est simple :\n\n• Tarifs fixes définis par SOS-Expat : 49€ (20 min avocat), 19€ (30 min expat aidant)\n• Le client fait un SEUL paiement qui comprend :\n  - Votre rémunération de prestataire\n  - Les frais de mise en relation SOS-Expat (couvrant Twilio, plateforme, fonctionnalités)\n• Seuls les frais de transaction Stripe (~2.9%) sont déduits de votre part\n\nImportant : Ces appels sont un premier contact d'aide rapide. Si le client souhaite ouvrir un dossier ou poursuivre la collaboration, cela se fait directement avec vous, en dehors de la plateforme SOS-Expat.",
    category: "providers",
    tags: ["rémunération", "frais", "tarification", "premier contact"],
    order: 25,
    isActive: true,
    isFooter: false
  },
  {
    question: "Comment améliorer mon profil ?",
    answer: "Pour attirer plus de clients :\n• Complétez à 100% votre profil\n• Ajoutez une photo professionnelle\n• Détaillez vos spécialités et expériences\n• Maintenez une bonne note (répondez rapidement, soyez professionnel)\n• Obtenez le badge Expert Vérifié",
    category: "providers",
    tags: ["profil", "amélioration", "visibilité"],
    order: 26,
    isActive: true,
    isFooter: false
  },
  {
    question: "Que faire si je ne peux pas répondre à un appel ?",
    answer: "Si vous ne pouvez pas répondre :\n• Le système réessaie 3 fois (espacées de 2 minutes)\n• Si vous ne répondez pas, le client est remboursé automatiquement\n• Votre score de réactivité peut être affecté\n\nNous recommandons de passer en mode \"Hors ligne\" si vous n'êtes pas disponible.",
    category: "providers",
    tags: ["appel", "manqué", "réactivité"],
    order: 27,
    isActive: true,
    isFooter: false
  }
];

// ============================================================================
// 💰 PAIEMENTS & TARIFS (8 FAQ)
// ============================================================================
const PAYMENTS_FAQS: FAQSource[] = [
  {
    question: "Comment fonctionne le paiement ?",
    answer: "Le paiement s'effectue avant la mise en relation, de manière 100% sécurisée via Stripe :\n\n1. Vous choisissez votre prestataire (avocat ou expat aidant)\n2. Vous effectuez un paiement unique (19€ ou 49€) qui comprend :\n   - La rémunération du prestataire\n   - Les frais de mise en relation SOS-Expat (Twilio, plateforme)\n3. Vous êtes mis en relation immédiatement par téléphone\n4. Si l'appel n'aboutit pas, remboursement automatique à 100%\n\nCe premier contact vous permet d'obtenir une aide rapide. Toute suite (dossier, collaboration) se fait directement avec le prestataire, en dehors de SOS-Expat.",
    category: "payments",
    tags: ["paiement", "stripe", "sécurité", "frais", "premier contact"],
    order: 30,
    isActive: true,
    isFooter: true
  },
  {
    question: "Quels sont les tarifs ?",
    answer: "Nos tarifs sont simples, fixes et transparents :\n\n• Appel Avocat : 49€ pour 20 minutes de premier conseil juridique\n• Appel Expat Aidant : 19€ pour 30 minutes de premiers conseils pratiques\n\nCe tarif unique comprend la rémunération du prestataire + les frais de mise en relation SOS-Expat. Aucun frais caché. Remboursement à 100% si l'appel n'aboutit pas.\n\nCes appels sont conçus pour apporter une première aide rapide aux expatriés, voyageurs et vacanciers du monde entier.",
    category: "payments",
    tags: ["tarifs", "prix", "avocat", "expat", "premier contact"],
    order: 31,
    isActive: true,
    isFooter: true
  },
  {
    question: "Le paiement est-il sécurisé ?",
    answer: "Oui, 100% sécurisé ! Nous utilisons Stripe, le leader mondial des paiements en ligne :\n• Chiffrement SSL/TLS de toutes les transactions\n• Certification PCI DSS niveau 1 (le plus haut niveau de sécurité)\n• Vos données bancaires ne sont jamais stockées sur nos serveurs\n• Protection contre la fraude intégrée",
    category: "payments",
    tags: ["sécurité", "paiement", "stripe", "SSL"],
    order: 32,
    isActive: true,
    isFooter: true
  },
  {
    question: "Quels moyens de paiement sont acceptés ?",
    answer: "Nous acceptons de nombreux moyens de paiement :\n• Cartes bancaires : Visa, Mastercard, American Express\n• Portefeuilles numériques : Apple Pay, Google Pay\n• Paiements mobiles selon votre pays\n\nToutes les devises principales sont supportées avec conversion automatique.",
    category: "payments",
    tags: ["carte", "visa", "mastercard", "apple pay", "google pay"],
    order: 33,
    isActive: true,
    isFooter: false
  },
  {
    question: "Comment demander un remboursement ?",
    answer: "Pour demander un remboursement :\n1. Connectez-vous à votre compte\n2. Allez dans \"Mes appels\" > sélectionnez l'appel concerné\n3. Cliquez sur \"Demander un remboursement\"\n4. Expliquez brièvement la raison\n\nDélai de traitement : 24-48h ouvrées\nDélai de crédit : 3-5 jours ouvrés selon votre banque",
    category: "payments",
    tags: ["remboursement", "demande", "délai", "procédure"],
    order: 34,
    isActive: true,
    isFooter: true
  },
  {
    question: "Puis-je obtenir une facture ?",
    answer: "Oui, vous recevez automatiquement une facture PDF après chaque appel, téléchargeable depuis votre tableau de bord. La facture contient toutes les informations légales : service utilisé, durée, prix, TVA et numéro de facture.",
    category: "payments",
    tags: ["facture", "pdf", "téléchargement"],
    order: 35,
    isActive: true,
    isFooter: false
  },
  {
    question: "Y a-t-il des frais cachés ?",
    answer: "Non, aucun frais caché ! Le prix affiché est le prix final :\n• Avocat : 49€ TTC pour 20 minutes\n• Expat aidant : 19€ TTC pour 30 minutes\n\nPas d'abonnement, pas de frais d'inscription, pas de frais supplémentaires.",
    category: "payments",
    tags: ["frais", "transparence", "prix"],
    order: 36,
    isActive: true,
    isFooter: false
  },
  {
    question: "Puis-je payer en plusieurs fois ?",
    answer: "Non, les paiements se font en une seule fois car nos services sont des consultations ponctuelles. Les tarifs sont accessibles : 19€ pour un expat aidant et 49€ pour un avocat. Le paiement est requis avant la mise en relation.",
    category: "payments",
    tags: ["paiement", "échelonnement", "tarif"],
    order: 37,
    isActive: true,
    isFooter: false
  }
];

// ============================================================================
// 👤 COMPTE & INSCRIPTION (8 FAQ)
// ============================================================================
const ACCOUNT_FAQS: FAQSource[] = [
  {
    question: "Comment créer un compte ?",
    answer: "Vous pouvez créer un compte en quelques secondes :\n• Avec Google : 1 clic et c'est fait !\n• Par email : renseignez votre email, mot de passe, langues parlées et téléphone\n\nL'inscription est 100% gratuite. Vous ne payez que lorsque vous utilisez nos services.",
    category: "account",
    tags: ["inscription", "compte", "création", "gratuit"],
    order: 40,
    isActive: true,
    isFooter: true
  },
  {
    question: "Pourquoi dois-je fournir mon numéro de téléphone ?",
    answer: "Votre numéro de téléphone est essentiel pour :\n• Recevoir les appels des prestataires lors des consultations\n• Vous notifier des mises à jour importantes\n\nNous ne l'utilisons jamais pour du spam ou de la publicité. Votre numéro reste confidentiel.",
    category: "account",
    tags: ["téléphone", "numéro", "confidentialité"],
    order: 41,
    isActive: true,
    isFooter: false
  },
  {
    question: "Comment modifier mes informations ?",
    answer: "Vous pouvez modifier toutes vos informations depuis votre profil :\n1. Connectez-vous à votre compte\n2. Allez dans \"Mon profil\" ou \"Paramètres\"\n3. Modifiez les informations souhaitées\n4. Sauvegardez\n\nVous pouvez changer : email, téléphone, langues, photo, mot de passe.",
    category: "account",
    tags: ["modification", "profil", "paramètres"],
    order: 42,
    isActive: true,
    isFooter: false
  },
  {
    question: "Comment supprimer mon compte ?",
    answer: "Pour supprimer votre compte :\n1. Allez dans \"Paramètres\" > \"Compte\"\n2. Cliquez sur \"Supprimer mon compte\"\n3. Confirmez votre choix\n\nAttention : cette action est irréversible. Toutes vos données seront supprimées conformément au RGPD.",
    category: "account",
    tags: ["suppression", "compte", "RGPD"],
    order: 43,
    isActive: true,
    isFooter: false
  },
  {
    question: "J'ai oublié mon mot de passe, que faire ?",
    answer: "Pas de panique ! Pour réinitialiser votre mot de passe :\n1. Cliquez sur \"Mot de passe oublié\" sur la page de connexion\n2. Entrez votre adresse email\n3. Vous recevrez un lien de réinitialisation (valable 1h)\n4. Créez un nouveau mot de passe sécurisé",
    category: "account",
    tags: ["mot de passe", "oublié", "réinitialisation"],
    order: 44,
    isActive: true,
    isFooter: true
  },
  {
    question: "Puis-je avoir plusieurs comptes ?",
    answer: "Non, un seul compte par personne est autorisé. Si vous êtes à la fois client et prestataire, vous pouvez activer les deux rôles sur le même compte. Cela simplifie la gestion et évite les confusions.",
    category: "account",
    tags: ["compte", "multiple", "rôle"],
    order: 45,
    isActive: true,
    isFooter: false
  },
  {
    question: "Comment changer de langue ?",
    answer: "Pour changer la langue de l'interface :\n• Cliquez sur le sélecteur de langue (drapeau) dans le menu\n• Choisissez parmi les 9 langues disponibles\n\nVotre préférence est sauvegardée automatiquement pour vos prochaines visites.",
    category: "account",
    tags: ["langue", "changement", "interface"],
    order: 46,
    isActive: true,
    isFooter: false
  },
  {
    question: "Mon compte est-il accessible depuis plusieurs appareils ?",
    answer: "Oui ! Votre compte SOS-Expat est accessible depuis n'importe quel appareil (smartphone, tablette, ordinateur). Connectez-vous simplement avec vos identifiants. Vos données et historique sont synchronisés automatiquement.",
    category: "account",
    tags: ["appareil", "synchronisation", "mobile"],
    order: 47,
    isActive: true,
    isFooter: false
  }
];

// ============================================================================
// 🔒 TECHNIQUE & SÉCURITÉ (7 FAQ)
// ============================================================================
const TECHNICAL_FAQS: FAQSource[] = [
  {
    question: "Mes données sont-elles protégées ?",
    answer: "Oui, la protection de vos données est notre priorité :\n• Chiffrement AES-256 de toutes les données\n• Serveurs sécurisés en Europe (Firebase/Google Cloud)\n• Conformité RGPD\n• Aucun enregistrement des appels\n• Vos données ne sont jamais vendues à des tiers\n• Authentification à deux facteurs disponible",
    category: "technical",
    tags: ["données", "sécurité", "RGPD", "confidentialité"],
    order: 50,
    isActive: true,
    isFooter: true
  },
  {
    question: "Comment fonctionne l'authentification ?",
    answer: "Nous proposons plusieurs méthodes d'authentification sécurisées :\n• Connexion avec Google (OAuth 2.0)\n• Email + mot de passe\n• Authentification à deux facteurs (2FA) optionnelle\n\nToutes les connexions sont chiffrées et sécurisées.",
    category: "technical",
    tags: ["authentification", "connexion", "2FA", "sécurité"],
    order: 51,
    isActive: true,
    isFooter: false
  },
  {
    question: "L'application fonctionne-t-elle hors connexion ?",
    answer: "SOS-Expat nécessite une connexion internet pour fonctionner car les appels sont passés via notre système téléphonique. Cependant, certaines pages (FAQ, profil) peuvent être consultées en mode hors ligne grâce à la mise en cache.",
    category: "technical",
    tags: ["hors ligne", "connexion", "internet"],
    order: 52,
    isActive: true,
    isFooter: false
  },
  {
    question: "Quels navigateurs sont supportés ?",
    answer: "SOS-Expat fonctionne sur tous les navigateurs modernes :\n• Google Chrome (recommandé)\n• Mozilla Firefox\n• Safari\n• Microsoft Edge\n\nNous recommandons de toujours utiliser la dernière version de votre navigateur pour une expérience optimale.",
    category: "technical",
    tags: ["navigateur", "compatibilité", "chrome", "firefox"],
    order: 53,
    isActive: true,
    isFooter: false
  },
  {
    question: "Y a-t-il une application mobile ?",
    answer: "SOS-Expat est une application web progressive (PWA) qui fonctionne comme une application native sur mobile. Vous pouvez l'ajouter à votre écran d'accueil depuis votre navigateur pour un accès rapide. Une application native est en cours de développement.",
    category: "technical",
    tags: ["application", "mobile", "PWA"],
    order: 54,
    isActive: true,
    isFooter: false
  },
  {
    question: "Comment signaler un bug ou un problème ?",
    answer: "Pour signaler un problème technique :\n1. Allez dans \"Aide\" > \"Signaler un problème\"\n2. Décrivez le bug avec le plus de détails possible\n3. Ajoutez une capture d'écran si possible\n\nNotre équipe technique traite les signalements sous 24-48h.",
    category: "technical",
    tags: ["bug", "problème", "signalement", "support"],
    order: 55,
    isActive: true,
    isFooter: false
  },
  {
    question: "Comment fonctionne le système d'appel ?",
    answer: "Notre système d'appel utilise la technologie Twilio :\n1. Vous initiez un appel depuis la plateforme\n2. Notre système appelle d'abord le prestataire\n3. Une fois le prestataire connecté, vous êtes appelé\n4. Les deux lignes sont fusionnées pour la conversation\n\nQualité audio HD garantie.",
    category: "technical",
    tags: ["appel", "téléphone", "Twilio", "technologie"],
    order: 56,
    isActive: true,
    isFooter: false
  }
];

// ============================================================================
// TOUTES LES FAQ COMBINÉES
// ============================================================================
const ALL_FAQ_SOURCES: FAQSource[] = [
  ...DISCOVER_FAQS,
  ...CLIENTS_FAQS,
  ...PROVIDERS_FAQS,
  ...PAYMENTS_FAQS,
  ...ACCOUNT_FAQS,
  ...TECHNICAL_FAQS,
];

/**
 * Initialise les FAQ prédéfinies dans Firestore avec traduction automatique
 * @returns Le résultat de l'initialisation
 */
export async function initializeFAQs(): Promise<{
  success: boolean;
  created: number;
  skipped: number;
  total: number;
  errors: string[];
}> {
  const result = {
    success: true,
    created: 0,
    skipped: 0,
    total: ALL_FAQ_SOURCES.length,
    errors: [] as string[],
  };

  try {
    // Vérifier les FAQ existantes
    const existingFAQs = await listFAQs();
    const existingQuestions = new Set(
      existingFAQs.map((faq) => {
        // Utiliser la question FR comme clé unique
        const questionFr = faq.question?.fr || faq.question?.en || '';
        return questionFr.toLowerCase().trim();
      })
    );

    console.log(
      `[initFAQs] ${existingFAQs.length} FAQ existantes, ${ALL_FAQ_SOURCES.length} à créer`
    );

    for (const faqSource of ALL_FAQ_SOURCES) {
      const questionKey = faqSource.question.toLowerCase().trim();

      // Vérifier si une FAQ avec cette question existe déjà
      if (existingQuestions.has(questionKey)) {
        result.skipped++;
        console.log(`[initFAQs] "${faqSource.question.substring(0, 40)}..." existe déjà, ignorée`);
        continue;
      }

      try {
        // Traduire automatiquement dans toutes les langues
        console.log(`[initFAQs] Traduction de "${faqSource.question.substring(0, 40)}..."...`);
        const { question, answer, slug } = await translateFAQToAllLanguages(
          faqSource.question,
          faqSource.answer
        );

        // Créer la FAQ complète
        const faqData: FAQInput = {
          question,
          answer,
          slug,
          category: faqSource.category,
          tags: faqSource.tags,
          order: faqSource.order,
          isActive: faqSource.isActive,
          isFooter: faqSource.isFooter,
        };

        await createFAQ(faqData);
        result.created++;
        console.log(`[initFAQs] ✓ "${faqSource.question.substring(0, 40)}..." créée`);

        // Petite pause pour éviter de surcharger l'API de traduction
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        const errorMsg = `Erreur "${faqSource.question.substring(0, 30)}": ${error instanceof Error ? error.message : String(error)}`;
        result.errors.push(errorMsg);
        console.error(`[initFAQs] ✗ ${errorMsg}`);
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
    }

    console.log(`\n[initFAQs] TERMINÉ:`);
    console.log(`  - Total: ${result.total} FAQ`);
    console.log(`  - Créées: ${result.created}`);
    console.log(`  - Ignorées: ${result.skipped}`);
    console.log(`  - Erreurs: ${result.errors.length}`);
  } catch (error) {
    result.success = false;
    result.errors.push(
      `Erreur globale: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return result;
}

/**
 * Supprime TOUTES les FAQ de Firestore
 * @returns Le résultat de la suppression
 */
export async function deleteAllFAQs(): Promise<{
  success: boolean;
  deleted: number;
  errors: string[];
}> {
  const result = {
    success: true,
    deleted: 0,
    errors: [] as string[],
  };

  try {
    console.log("[deleteAllFAQs] Chargement des FAQs existantes...");
    const existingFAQs = await listFAQs();
    console.log(`[deleteAllFAQs] ${existingFAQs.length} FAQs à supprimer`);

    for (const faq of existingFAQs) {
      try {
        await deleteFAQ(faq.id);
        result.deleted++;
        console.log(`[deleteAllFAQs] ✓ FAQ "${faq.id}" supprimée`);
      } catch (error) {
        const errorMsg = `Erreur suppression "${faq.id}": ${error instanceof Error ? error.message : String(error)}`;
        result.errors.push(errorMsg);
        console.error(`[deleteAllFAQs] ✗ ${errorMsg}`);
      }
    }

    if (result.errors.length > 0) {
      result.success = false;
    }

    console.log(`\n[deleteAllFAQs] TERMINÉ: ${result.deleted} FAQs supprimées, ${result.errors.length} erreurs`);
  } catch (error) {
    result.success = false;
    result.errors.push(`Erreur globale: ${error instanceof Error ? error.message : String(error)}`);
  }

  return result;
}

/**
 * Supprime toutes les FAQs existantes puis réinitialise avec les FAQs prédéfinies
 * C'est la fonction à utiliser pour corriger les slugs non traduits
 * @returns Le résultat combiné de la suppression et de l'initialisation
 */
export async function resetAndInitializeFAQs(): Promise<{
  success: boolean;
  deleted: number;
  created: number;
  total: number;
  errors: string[];
}> {
  console.log("=".repeat(60));
  console.log("[RESET FAQ] Début de la réinitialisation complète...");
  console.log("=".repeat(60));

  const result = {
    success: true,
    deleted: 0,
    created: 0,
    total: ALL_FAQ_SOURCES.length,
    errors: [] as string[],
  };

  // Étape 1: Supprimer toutes les FAQs existantes
  console.log("\n[ÉTAPE 1/2] Suppression des FAQs existantes...");
  const deleteResult = await deleteAllFAQs();
  result.deleted = deleteResult.deleted;
  result.errors.push(...deleteResult.errors);

  if (!deleteResult.success) {
    console.warn("[RESET FAQ] ⚠ Certaines suppressions ont échoué, mais on continue...");
  }

  // Petite pause entre suppression et création
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Étape 2: Créer les nouvelles FAQs avec traductions
  console.log("\n[ÉTAPE 2/2] Création des nouvelles FAQs avec traductions...");

  for (const faqSource of ALL_FAQ_SOURCES) {
    try {
      console.log(`[RESET FAQ] Traduction: "${faqSource.question.substring(0, 50)}..."`);

      const { question, answer, slug } = await translateFAQToAllLanguages(
        faqSource.question,
        faqSource.answer
      );

      // Log des slugs générés pour vérification
      console.log(`  → Slugs: FR=${slug.fr?.substring(0, 30)}, EN=${slug.en?.substring(0, 30)}, ES=${slug.es?.substring(0, 30)}`);

      const faqData: FAQInput = {
        question,
        answer,
        slug,
        category: faqSource.category,
        tags: faqSource.tags,
        order: faqSource.order,
        isActive: faqSource.isActive,
        isFooter: faqSource.isFooter,
      };

      await createFAQ(faqData);
      result.created++;
      console.log(`[RESET FAQ] ✓ FAQ créée (${result.created}/${result.total})`);

      // Pause pour éviter de surcharger l'API de traduction
      await new Promise(resolve => setTimeout(resolve, 800));

    } catch (error) {
      const errorMsg = `Erreur "${faqSource.question.substring(0, 30)}": ${error instanceof Error ? error.message : String(error)}`;
      result.errors.push(errorMsg);
      console.error(`[RESET FAQ] ✗ ${errorMsg}`);
    }
  }

  result.success = result.errors.length === 0;

  console.log("\n" + "=".repeat(60));
  console.log("[RESET FAQ] TERMINÉ!");
  console.log(`  - FAQs supprimées: ${result.deleted}`);
  console.log(`  - FAQs créées: ${result.created}/${result.total}`);
  console.log(`  - Erreurs: ${result.errors.length}`);
  console.log("=".repeat(60));

  return result;
}

/**
 * Export des sources FAQ pour référence
 */
export const PREDEFINED_FAQS = {
  discover: DISCOVER_FAQS,
  clients: CLIENTS_FAQS,
  providers: PROVIDERS_FAQS,
  payments: PAYMENTS_FAQS,
  account: ACCOUNT_FAQS,
  technical: TECHNICAL_FAQS,
  all: ALL_FAQ_SOURCES,
};
