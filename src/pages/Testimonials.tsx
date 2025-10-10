import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  MapPin,
  Calendar,
  ArrowRight,
  Search,
  Sparkles,
  ChevronRight,
  Briefcase,
  User,
  Award,
  Shield,
  Clock,
  Globe,
} from "lucide-react";
import Layout from "../components/layout/Layout";
import { useApp } from "../contexts/AppContext";
import { logAnalyticsEvent } from "../utils/firestore";
import { FormattedMessage, useIntl } from "react-intl";

// =================== TYPES ===================
export interface Review {
  id: string;
  callId: string;
  clientId: string;
  providerId: string;
  rating: number;
  comment: string;
  isPublic: boolean;
  createdAt: Date;
  clientName: string;
  clientCountry: string;
  serviceType: "lawyer_call" | "expat_call";
  status: "published" | "pending" | "rejected";
  helpfulVotes: number;
  clientAvatar?: string;
  verified: boolean;
}

type ReviewType = Review;
type FilterType = "all" | "avocat" | "expatrie";

interface TestimonialsStats {
  count: number;
  averageRating: number;
  countries: number;
}

// =================== CONSTANTS ===================
const STATS_AVERAGE_RATING = 4.9;
const STATS_COUNTRIES = 150;
const STATS_TOTAL_TESTIMONIALS = 2347;
const TESTIMONIALS_PER_PAGE = 9;

// =================== I18N CONFIGURATION ===================
const translations = {
  fr: {
    meta: {
      title: "Témoignages clients - SOS Expats",
      description:
        "Découvrez les expériences de nos utilisateurs partout dans le monde",
    },
    hero: {
      badge: "4,9/5 • +2 500 avis vérifiés",
      title: "Témoignages clients",
      subtitle:
        "Découvrez les expériences de nos utilisateurs partout dans le monde",
      stats: {
        testimonials: "Témoignages",
        averageRating: "Note moyenne",
        countries: "Pays",
      },
    },
    filters: {
      all: "Tous les avis",
      lawyers: "Avocats",
      expats: "Expatriés",
      searchPlaceholder: "Rechercher dans les témoignages...",
    },
    card: {
      verified: "Vérifié",
      helpful: "utile",
      readMore: "Lire la suite",
      foundHelpful: "trouvent cela utile",
      lawyer: "Avocat",
      expat: "Expatrié",
    },
    loading: {
      testimonials: "Chargement des témoignages...",
      noResults: "Aucun témoignage trouvé.",
      adjustCriteria: "Essayez de modifier vos critères de recherche.",
      loadMore: "Voir plus de témoignages",
      clearSearch: "Effacer la recherche",
    },
    pagination: {
      page: "Page",
      of: "sur",
    },
    stats: {
      showing: "Sur",
      total: "témoignages au total",
    },
    cta: {
      secured: "Sécurisé & confidentiel",
      response5min: "Réponse en moins de 5 min",
      countries150: "150+ pays couverts",
      title: "Vous êtes avocat ou expatrié ?",
      subtitle:
        "Rejoignez notre réseau d'experts et transformez vos compétences en opportunités réelles. Aidez d'autres expatriés et voyageurs tout en développant votre activité.",
      findExpert: "Trouver un expert",
      becomeExpert: "Devenir expert",
      joinExperts:
        "Rejoignez plus de 2 000 experts qui font confiance à SOS Expats",
    },
    aria: {
      backToTop: "Retour en haut",
      languageSelector: "Sélecteur de langue",
      filterButton: "Filtre",
      searchInput: "Champ de recherche",
      testimonialCard: "Carte de témoignage",
      pageButton: "Page",
      unknownDate: "Date inconnue",
    },
  },
  en: {
    meta: {
      title: "Client Testimonials - SOS Expats",
      description: "Discover the experiences of our users worldwide",
    },
    hero: {
      badge: "4.9/5 • +2,500 verified reviews",
      title: "Client testimonials",
      subtitle: "Discover the experiences of our users worldwide",
      stats: {
        testimonials: "Testimonials",
        averageRating: "Average rating",
        countries: "Countries",
      },
    },
    filters: {
      all: "All reviews",
      lawyers: "Lawyers",
      expats: "Expats",
      searchPlaceholder: "Search testimonials...",
    },
    card: {
      verified: "Verified",
      helpful: "helpful",
      readMore: "Read more",
      foundHelpful: "found this helpful",
      lawyer: "Lawyer",
      expat: "Expat",
    },
    loading: {
      testimonials: "Loading testimonials...",
      noResults: "No testimonials found.",
      adjustCriteria: "Try adjusting your search criteria.",
      loadMore: "See more testimonials",
      clearSearch: "Clear search",
    },
    pagination: {
      page: "Page",
      of: "of",
    },
    stats: {
      showing: "Out of",
      total: "total testimonials",
    },
    cta: {
      secured: "Secure & confidential",
      response5min: "Response in less than 5 min",
      countries150: "150+ countries covered",
      title: "Are you a lawyer or an expat?",
      subtitle:
        "Join our expert network and transform your skills into real opportunities. Help other expats and travelers while growing your business.",
      findExpert: "Find an expert",
      becomeExpert: "Become an expert",
      joinExperts: "Join over 2,000 experts who trust SOS Expats",
    },
    aria: {
      backToTop: "Back to top",
      languageSelector: "Language selector",
      filterButton: "Filter",
      searchInput: "Search input",
      testimonialCard: "Testimonial card",
      pageButton: "Page",
      unknownDate: "Unknown date",
    },
  },
};

// =================== HELPER FUNCTIONS ===================
const detectBrowserLanguage = (): string => {
  if (typeof navigator === "undefined") return "fr";
  const browserLang = navigator.language || navigator.languages?.[0] || "fr";
  return browserLang.startsWith("en") ? "en" : "fr";
};

const smoothScrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// ✅ FONCTION DE MAPPING DES PAYS POUR URL SEO
const createCountrySlug = (country: string): string => {
  const slugMap: Record<string, string> = {
    // Pays avec caractères spéciaux
    Thaïlande: "thailande",
    "Royaume-Uni": "royaume-uni",
    "États-Unis": "etats-unis",
    "Émirats Arabes Unis": "emirats-arabes-unis",
    "Corée du Sud": "coree-du-sud",
    "Nouvelle-Zélande": "nouvelle-zelande",
    "Afrique du Sud": "afrique-du-sud",
    "Côte d'Ivoire": "cote-divoire",
    "République Tchèque": "republique-tcheque",
    "Arabie Saoudite": "arabie-saoudite",
    Norvège: "norvege",
    Suède: "suede",
    Pérou: "perou",
    Sénégal: "senegal",
    Indonésie: "indonesie",
    Grèce: "grece",
    Danemark: "danemark",
    Finlande: "finlande",
    Islande: "islande",
    Irlande: "irlande",
    Turquie: "turquie",
    // Pays simples (déjà en bon format)
    Canada: "canada",
    Espagne: "espagne",
    Allemagne: "allemagne",
    Italie: "italie",
    Portugal: "portugal",
    Belgique: "belgique",
    Suisse: "suisse",
    Australie: "australie",
    Japon: "japon",
    Brésil: "bresil",
    Mexique: "mexique",
    Argentine: "argentine",
    Chili: "chili",
    Colombie: "colombie",
    Maroc: "maroc",
    Tunisie: "tunisie",
    Vietnam: "vietnam",
    Cambodge: "cambodge",
    Inde: "inde",
    Chine: "chine",
    Singapour: "singapour",
    Malaisie: "malaisie",
    Philippines: "philippines",
    Qatar: "qatar",
    Croatie: "croatie",
    Pologne: "pologne",
    Hongrie: "hongrie",
    Roumanie: "roumanie",
    Bulgarie: "bulgarie",
    Russie: "russie",
    Ukraine: "ukraine",
    Luxembourg: "luxembourg",
    Autriche: "autriche",
  };

  return (
    slugMap[country] ||
    country
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "")
  );
};

// =================== MOCK DATA WITH i18n SUPPORT ===================
const createMockReviews = (language: string): ReviewType[] => {
  const reviews_fr: ReviewType[] = [
    // Expatriés (9 témoignages - 55%)
    {
      id: "1",
      callId: "call1",
      clientId: "client1",
      providerId: "provider1",
      rating: 5,
      comment:
        "Incroyable ! En 3 minutes j'avais un expatrié français au bout du fil depuis Bangkok. Il m'a expliqué toute la procédure visa Thaïlandais, les pièges à éviter et m'a même donné les contacts de son agent immobilier. Service qui change la vie !",
      isPublic: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      clientName: "Aisha M.",
      clientCountry: "Thaïlande",
      serviceType: "expat_call",
      status: "published",
      helpfulVotes: 23,
      clientAvatar:
        "https://images.unsplash.com/photo-1643842730000-db266bbc1b28?q=80&w=400&h=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

      // clientAvatar:"https://images.unsplash.com/photo-1494790108755-2616b74193d4?auto=format&fit=crop&w=400&h=400&q=80",
      verified: true,
    },
    {
      id: "2",
      callId: "call2",
      clientId: "client2",
      providerId: "provider2",
      rating: 5,
      comment:
        "Génial ! L'expatrié m'a aidé avec mon installation à Vancouver. Banque, logement, assurance santé, transport... tout en 30 minutes ! Il connaissait tous les bons plans et m'a évité des mois de galère administrative.",
      isPublic: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      clientName: "Chen L.",
      clientCountry: "Canada",
      serviceType: "expat_call",
      status: "published",
      helpfulVotes: 31,
      clientAvatar:
        "https://images.unsplash.com/photo-1601455763557-db1bea8a9a5a?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyJTIwbWFsZXxlbnwwfHwwfHx8MA%3D%3D",

      // clientAvatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
      verified: true,
    },
    {
      id: "3",
      callId: "call3",
      clientId: "client3",
      providerId: "provider3",
      rating: 4,
      comment:
        "Super expérience ! Expatrié à Melbourne depuis 8 ans, il m'a donné tous les conseils pour mon working holiday visa. Écoles, quartiers, jobs... Une mine d'or d'informations pratiques !",
      isPublic: true,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      clientName: "Emma K.",
      clientCountry: "Australie",
      serviceType: "expat_call",
      status: "published",
      helpfulVotes: 18,
      clientAvatar:
        "https://images.unsplash.com/photo-1677537946831-4590ff82359c?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjB8fGF2YXRhciUyMGZlbWFsZXxlbnwwfHwwfHx8MA%3D%3D",
      // clientAvatar:
      //   "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",

      verified: true,
    },
    {
      id: "4",
      callId: "call4",
      clientId: "client4",
      providerId: "provider4",
      rating: 5,
      comment:
        "Excellent ! L'expatrié vivant à Dubaï depuis 5 ans m'a tout expliqué : visa, compte bancaire, logement, culture locale. Il m'a même mis en contact avec sa communauté d'expats français !",
      isPublic: true,
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      clientName: "Kwame A.",
      clientCountry: "Émirats Arabes Unis",
      serviceType: "expat_call",
      status: "published",
      helpfulVotes: 27,
      clientAvatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",

      // clientAvatar:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",
      // clientAvatar:
      //   "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",

      verified: true,
    },
    {
      id: "5",
      callId: "call5",
      clientId: "client5",
      providerId: "provider5",
      rating: 5,
      comment:
        "Parfait ! En urgence depuis Tokyo, j'ai eu un expatrié en 2 minutes. Il m'a aidé avec la paperasse japonaise complexe et m'a orienté vers les bonnes administrations. Très rassurant !",
      isPublic: true,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      clientName: "Yuki T.",
      clientCountry: "Japon",
      serviceType: "expat_call",
      status: "published",
      helpfulVotes: 22,
      clientAvatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",

      // clientAvatar:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
      verified: true,
    },
    {
      id: "6",
      callId: "call6",
      clientId: "client6",
      providerId: "provider6",
      rating: 4,
      comment:
        "Très utile ! L'expatrié français en Norvège m'a donné tous les tips pour Oslo : logement étudiant, jobs d'appoint, transports. Il m'a fait gagner un temps précieux pour mes études !",
      isPublic: true,
      createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      clientName: "Fatima R.",
      clientCountry: "Norvège",
      serviceType: "expat_call",
      status: "published",
      helpfulVotes: 15,
      // clientAvatar:"https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",
      clientAvatar:
        "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",

      // clientAvatar:"https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",
      verified: true,
    },
    {
      id: "7",
      callId: "call7",
      clientId: "client7",
      providerId: "provider7",
      rating: 5,
      comment:
        "Formidable ! Depuis le Brésil, l'expatrié m'a tout expliqué sur São Paulo : quartiers sûrs, carte de transports, meilleures écoles pour mes enfants. Une aide inestimable !",
      isPublic: true,
      createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
      clientName: "Carlos M.",
      clientCountry: "Brésil",
      serviceType: "expat_call",
      status: "published",
      helpfulVotes: 29,
      // clientAvatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
      clientAvatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",

      // clientAvatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
      verified: true,
    },
    {
      id: "8",
      callId: "call8",
      clientId: "client8",
      providerId: "provider8",
      rating: 5,
      comment:
        "Extraordinaire ! L'expatrié à Singapour m'a guidé pas à pas pour mon installation. Permis de travail, logement, banque locale... Tout était clair et détaillé. Service top !",
      isPublic: true,
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      clientName: "Priya S.",
      clientCountry: "Singapour",
      serviceType: "expat_call",
      status: "published",
      helpfulVotes: 33,
      // clientAvatar:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
      // clientAvatar:
      //   "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
      clientAvatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",

      verified: true,
    },
    {
      id: "9",
      callId: "call9",
      clientId: "client9",
      providerId: "provider9",
      rating: 4,
      comment:
        "Très professionnel ! L'expatrié français en Corée du Sud m'a donné tous les conseils pour Séoul : visa étudiant, logement universitaire, culture coréenne. Parfait pour mon échange !",
      isPublic: true,
      createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      clientName: "Jin W.",
      clientCountry: "Corée du Sud",
      serviceType: "expat_call",
      status: "published",
      helpfulVotes: 19,
      // clientAvatar:"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",
      // clientAvatar:"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",
      clientAvatar:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",

      verified: true,
    },

    // Avocats (7 témoignages - 45%)
    {
      id: "10",
      callId: "call10",
      clientId: "client10",
      providerId: "provider10",
      rating: 5,
      comment:
        "Avocat exceptionnel ! Depuis Londres, problème urgent avec mon propriétaire. L'avocat m'a expliqué mes droits en droit anglais, les démarches à suivre et m'a orienté vers un solicitor local. Précis et efficace !",
      isPublic: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      clientName: "James P.",
      clientCountry: "Royaume-Uni",
      serviceType: "lawyer_call",
      status: "published",
      helpfulVotes: 41,
      // clientAvatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
      // clientAvatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
      clientAvatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",

      verified: true,
    },
    {
      id: "11",
      callId: "call11",
      clientId: "client11",
      providerId: "provider11",
      rating: 5,
      comment:
        "Consultation remarquable ! Accident de voiture en Allemagne, l'avocat spécialisé en droit international m'a tout expliqué : assurances, procédures, droits. Il m'a évité des erreurs coûteuses !",
      isPublic: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      clientName: "Anya V.",
      clientCountry: "Allemagne",
      serviceType: "lawyer_call",
      status: "published",
      helpfulVotes: 38,
      // clientAvatar:
      //   "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
      clientAvatar:
        "https://images.unsplash.com/photo-1625262550495-1d3bfb5c1502?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTc2fHxhdmF0YXIlMjBtYWxlfGVufDB8fDB8fHww",

      verified: true,
    },
    {
      id: "12",
      callId: "call12",
      clientId: "client12",
      providerId: "provider12",
      rating: 4,
      comment:
        "Très compétent ! Litige commercial en Italie, l'avocat m'a donné une analyse claire de ma situation juridique et les options disponibles. Conseil précieux pour mon business !",
      isPublic: true,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      clientName: "Giuseppe L.",
      clientCountry: "Italie",
      serviceType: "lawyer_call",
      status: "published",
      helpfulVotes: 26,
      // clientAvatar:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",
      clientAvatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",

      verified: true,
    },
    {
      id: "13",
      callId: "call13",
      clientId: "client13",
      providerId: "provider13",
      rating: 5,
      comment:
        "Avocat brillant ! Problème de visa aux États-Unis, il m'a expliqué toutes les procédures d'immigration, les risques et solutions. Grâce à lui, j'ai évité l'expulsion !",
      isPublic: true,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      clientName: "Maria G.",
      clientCountry: "États-Unis",
      serviceType: "lawyer_call",
      status: "published",
      helpfulVotes: 45,
      // clientAvatar:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
      clientAvatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",

      verified: true,
    },
    {
      id: "14",
      callId: "call14",
      clientId: "client14",
      providerId: "provider14",
      rating: 5,
      comment:
        "Service juridique excellent ! Divorce international complexe, l'avocat a su naviguer entre droit français et espagnol. Conseil clair, stratégie efficace. Je recommande vivement !",
      isPublic: true,
      createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
      clientName: "Ahmed B.",
      clientCountry: "Espagne",
      serviceType: "lawyer_call",
      status: "published",
      helpfulVotes: 34,
      // clientAvatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
      clientAvatar:
        "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",

      verified: true,
    },
    {
      id: "15",
      callId: "call15",
      clientId: "client15",
      providerId: "provider15",
      rating: 4,
      comment:
        "Très professionnel ! Contrat de travail au Mexique, l'avocat m'a expliqué toutes les clauses, mes droits et obligations. Il m'a aidé à négocier de meilleures conditions !",
      isPublic: true,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      clientName: "Sofia R.",
      clientCountry: "Mexique",
      serviceType: "lawyer_call",
      status: "published",
      helpfulVotes: 21,
      // clientAvatar:"https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",
      clientAvatar:
        "https://images.unsplash.com/photo-1701615004837-40d8573b6652?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",

      verified: true,
    },
    {
      id: "16",
      callId: "call16",
      clientId: "client16",
      providerId: "provider16",
      rating: 5,
      comment:
        "Avocat remarquable ! Problème fiscal en Suisse, il m'a expliqué les implications légales, les démarches et m'a orienté vers un fiscaliste local. Service impeccable !",
      isPublic: true,
      createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
      clientName: "Lars H.",
      clientCountry: "Suisse",
      serviceType: "lawyer_call",
      status: "published",
      helpfulVotes: 37,
      // clientAvatar:"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",
      clientAvatar:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YXZhdGFyfGVufDB8fDB8fHww",

      verified: true,
    },
  ];

  const reviews_en: ReviewType[] = [
    // Expats (9 testimonials - 55%)
    {
      id: "1",
      callId: "call1",
      clientId: "client1",
      providerId: "provider1",
      rating: 5,
      comment:
        "Incredible! In 3 minutes I had a French expat on the phone from Bangkok. He explained the entire Thai visa procedure, pitfalls to avoid, and even gave me his real estate agent's contacts. Life-changing service!",
      isPublic: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      clientName: "Aisha M.",
      clientCountry: "Thailand",
      serviceType: "expat_call",
      status: "published",
      helpfulVotes: 23,
      clientAvatar:
        "https://images.unsplash.com/photo-1643842730000-db266bbc1b28?q=80&w=400&h=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      // clientAvatar:"https://images.unsplash.com/photo-1494790108755-2616b74193d4?auto=format&fit=crop&w=400&h=400&q=80",
      verified: true,
    },
    {
      id: "2",
      callId: "call2",
      clientId: "client2",
      providerId: "provider2",
      rating: 5,
      comment:
        "Brilliant! The expat helped me with my Vancouver setup. Banking, housing, health insurance, transport... everything in 30 minutes! He knew all the insider tips and saved me months of administrative hassle.",
      isPublic: true,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      clientName: "Chen L.",
      clientCountry: "Canada",
      serviceType: "expat_call",
      status: "published",
      helpfulVotes: 31,
      // clientAvatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
      clientAvatar:
        "https://images.unsplash.com/photo-1601455763557-db1bea8a9a5a?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyJTIwbWFsZXxlbnwwfHwwfHx8MA%3D%3D",
      verified: true,
    },
    {
      id: "3",
      callId: "call3",
      clientId: "client3",
      providerId: "provider3",
      rating: 4,
      comment:
        "Great experience! Expat in Melbourne for 8 years, he gave me all the advice for my working holiday visa. Schools, neighborhoods, jobs... A goldmine of practical information!",
      isPublic: true,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      clientName: "Emma K.",
      clientCountry: "Australia",
      serviceType: "expat_call",
      status: "published",
      helpfulVotes: 18,
      clientAvatar:
        "https://images.unsplash.com/photo-1677537946831-4590ff82359c?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjB8fGF2YXRhciUyMGZlbWFsZXxlbnwwfHwwfHx8MA%3D%3D",
      // clientAvatar:
      // "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
      verified: true,
    },
    {
      id: "4",
      callId: "call4",
      clientId: "client4",
      providerId: "provider4",
      rating: 5,
      comment:
        "Excellent! The expat living in Dubai for 5 years explained everything: visa, bank account, housing, local culture. He even connected me with his French expat community!",
      isPublic: true,
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      clientName: "Kwame A.",
      clientCountry: "United Arab Emirates",
      serviceType: "expat_call",
      status: "published",
      helpfulVotes: 27,
      clientAvatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",
      verified: true,
    },
    {
      id: "5",
      callId: "call5",
      clientId: "client5",
      providerId: "provider5",
      rating: 5,
      comment:
        "Perfect! In urgent situation from Tokyo, I got an expat in 2 minutes. He helped me with complex Japanese paperwork and directed me to the right administrations. Very reassuring!",
      isPublic: true,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      clientName: "Yuki T.",
      clientCountry: "Japan",
      serviceType: "expat_call",
      status: "published",
      helpfulVotes: 22,
      clientAvatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
      verified: true,
    },
    {
      id: "6",
      callId: "call6",
      clientId: "client6",
      providerId: "provider6",
      rating: 4,
      comment:
        "Very useful! The French expat in Norway gave me all the tips for Oslo: student housing, part-time jobs, transport. He saved me precious time for my studies!",
      isPublic: true,
      createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      clientName: "Fatima R.",
      clientCountry: "Norway",
      serviceType: "expat_call",
      status: "published",
      helpfulVotes: 15,
      clientAvatar:
        "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",
      verified: true,
    },
    {
      id: "7",
      callId: "call7",
      clientId: "client7",
      providerId: "provider7",
      rating: 5,
      comment:
        "Wonderful! From Brazil, the expat explained everything about São Paulo: safe neighborhoods, transport cards, best schools for my children. Invaluable help!",
      isPublic: true,
      createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
      clientName: "Carlos M.",
      clientCountry: "Brazil",
      serviceType: "expat_call",
      status: "published",
      helpfulVotes: 29,
      clientAvatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
      verified: true,
    },
    {
      id: "8",
      callId: "call8",
      clientId: "client8",
      providerId: "provider8",
      rating: 5,
      comment:
        "Extraordinary! The expat in Singapore guided me step by step for my installation. Work permit, housing, local bank... Everything was clear and detailed. Top service!",
      isPublic: true,
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      clientName: "Priya S.",
      clientCountry: "Singapore",
      serviceType: "expat_call",
      status: "published",
      helpfulVotes: 33,
      clientAvatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
      verified: true,
    },
    {
      id: "9",
      callId: "call9",
      clientId: "client9",
      providerId: "provider9",
      rating: 4,
      comment:
        "Very professional! The French expat in South Korea gave me all the advice for Seoul: student visa, university housing, Korean culture. Perfect for my exchange!",
      isPublic: true,
      createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      clientName: "Jin W.",
      clientCountry: "South Korea",
      serviceType: "expat_call",
      status: "published",
      helpfulVotes: 19,
      clientAvatar:
        "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",
      verified: true,
    },

    // Lawyers (7 testimonials - 45%)
    {
      id: "10",
      callId: "call10",
      clientId: "client10",
      providerId: "provider10",
      rating: 5,
      comment:
        "Exceptional lawyer! From London, urgent problem with my landlord. The lawyer explained my rights in English law, the steps to follow and directed me to a local solicitor. Precise and efficient!",
      isPublic: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      clientName: "James P.",
      clientCountry: "United Kingdom",
      serviceType: "lawyer_call",
      status: "published",
      helpfulVotes: 41,
      clientAvatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
      verified: true,
    },
    {
      id: "11",
      callId: "call11",
      clientId: "client11",
      providerId: "provider11",
      rating: 5,
      comment:
        "Remarkable consultation! Car accident in Germany, the lawyer specialized in international law explained everything: insurance, procedures, rights. He saved me from costly mistakes!",
      isPublic: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      clientName: "Anya V.",
      clientCountry: "Germany",
      serviceType: "lawyer_call",
      status: "published",
      helpfulVotes: 38,
      clientAvatar:
        "https://images.unsplash.com/photo-1625262550495-1d3bfb5c1502?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTc2fHxhdmF0YXIlMjBtYWxlfGVufDB8fDB8fHww",
      // clientAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
      verified: true,
    },
    {
      id: "12",
      callId: "call12",
      clientId: "client12",
      providerId: "provider12",
      rating: 4,
      comment:
        "Very competent! Commercial dispute in Italy, the lawyer gave me a clear analysis of my legal situation and available options. Valuable advice for my business!",
      isPublic: true,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      clientName: "Giuseppe L.",
      clientCountry: "Italy",
      serviceType: "lawyer_call",
      status: "published",
      helpfulVotes: 26,
      // clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80',
      clientAvatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
      verified: true,
    },
    {
      id: "13",
      callId: "call13",
      clientId: "client13",
      providerId: "provider13",
      rating: 5,
      comment:
        "Brilliant lawyer! Visa problem in the United States, he explained all immigration procedures, risks and solutions. Thanks to him, I avoided deportation!",
      isPublic: true,
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      clientName: "Maria G.",
      clientCountry: "United States",
      serviceType: "lawyer_call",
      status: "published",
      helpfulVotes: 45,
      clientAvatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
      verified: true,
    },
    {
      id: "14",
      callId: "call14",
      clientId: "client14",
      providerId: "provider14",
      rating: 5,
      comment:
        "Excellent legal service! Complex international divorce, the lawyer navigated between French and Spanish law. Clear advice, effective strategy. Highly recommend!",
      isPublic: true,
      createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
      clientName: "Ahmed B.",
      clientCountry: "Spain",
      serviceType: "lawyer_call",
      status: "published",
      helpfulVotes: 34,
      // clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80',
      clientAvatar:
        "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
      verified: true,
    },
    {
      id: "15",
      callId: "call15",
      clientId: "client15",
      providerId: "provider15",
      rating: 4,
      comment:
        "Very professional! Employment contract in Mexico, the lawyer explained all clauses, my rights and obligations. He helped me negotiate better conditions!",
      isPublic: true,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      clientName: "Sofia R.",
      clientCountry: "Mexico",
      serviceType: "lawyer_call",
      status: "published",
      helpfulVotes: 21,
      // clientAvatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80',
      clientAvatar:
        "https://images.unsplash.com/photo-1701615004837-40d8573b6652?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
      verified: true,
    },
    {
      id: "16",
      callId: "call16",
      clientId: "client16",
      providerId: "provider16",
      rating: 5,
      comment:
        "Remarkable lawyer! Tax issue in Switzerland, he explained legal implications, procedures and directed me to a local tax specialist. Impeccable service!",
      isPublic: true,
      createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
      clientName: "Lars H.",
      clientCountry: "Switzerland",
      serviceType: "lawyer_call",
      status: "published",
      helpfulVotes: 37,
      clientAvatar:
        "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YXZhdGFyfGVufDB8fDB8fHww",
      // clientAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80',
      verified: true,
    },
  ];

  return language === "en" ? reviews_en : reviews_fr;
};

// =================== MAIN COMPONENT ===================
const Testimonials: React.FC = () => {
  const intl = useIntl();
  const { language } = useApp();
  const navigate = useNavigate();

  // Use detected language or app language
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return (
        // localStorage.getItem("testimonials_language") ||
        // localStorage.getItem("sos_language") ||
        language
        // detectBrowserLanguage()
      );
    }
    return language || "fr";
  });

  // 🔥 CORRECTION: Utiliser useMemo pour recalculer t quand la langue change
  const t = useMemo(() => {
    const selectedTranslations =
      translations[currentLanguage as keyof typeof translations] ||
      translations.fr;
    console.log(
      "🌍 Traductions actives:",
      currentLanguage,
      selectedTranslations.hero.title
    ); // Debug
    return selectedTranslations;
  }, [currentLanguage]);

  // State
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [testimonials, setTestimonials] = useState<ReviewType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  // Memoized values
  const stats = useMemo<TestimonialsStats>(
    () => ({
      count: STATS_TOTAL_TESTIMONIALS,
      averageRating: STATS_AVERAGE_RATING,
      countries: STATS_COUNTRIES,
    }),
    []
  );

  const filteredTestimonials = useMemo(() => {
    return testimonials.filter((review) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        review.comment?.toLowerCase().includes(searchLower) ||
        review.clientName?.toLowerCase().includes(searchLower) ||
        review.clientCountry?.toLowerCase().includes(searchLower)
      );
    });
  }, [testimonials, searchTerm]);

  const currentPageTestimonials = useMemo(() => {
    const startIndex = (page - 1) * TESTIMONIALS_PER_PAGE;
    const endIndex = startIndex + TESTIMONIALS_PER_PAGE;
    return filteredTestimonials.slice(startIndex, endIndex);
  }, [filteredTestimonials, page]);

  const totalPages = Math.ceil(
    filteredTestimonials.length / TESTIMONIALS_PER_PAGE
  );

  // Load testimonials
  const loadTestimonials = useCallback(async () => {
    try {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 300)); // Réduit le délai pour une meilleure UX

      const mockReviews = createMockReviews(currentLanguage);
      let filteredReviews = mockReviews;

      if (filter === "avocat") {
        filteredReviews = mockReviews.filter(
          (review) => review.serviceType === "lawyer_call"
        );
      } else if (filter === "expatrie") {
        filteredReviews = mockReviews.filter(
          (review) => review.serviceType === "expat_call"
        );
      }

      filteredReviews.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      setTestimonials(filteredReviews);

      logAnalyticsEvent({
        eventType: "testimonials_loaded",
        eventData: {
          filter,
          total_count: filteredReviews.length,
          language: currentLanguage,
        },
      });
    } catch (error) {
      console.error("Error loading testimonials:", error);
      setTestimonials(createMockReviews(currentLanguage));
    } finally {
      setIsLoading(false);
    }
  }, [filter, currentLanguage]);

  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  // Charger les témoignages au montage et quand le filtre ou la langue change
  useEffect(() => {
    loadTestimonials();
  }, [loadTestimonials]);

  // Effect séparé pour forcer le rechargement quand la langue change
  useEffect(() => {
    // Réinitialiser la page à 1 quand la langue change
    setPage(1);
    // Effacer le terme de recherche pour éviter des résultats incohérents
    setSearchTerm("");
    // Recharger immédiatement
    loadTestimonials();
  }, [currentLanguage]);

  // Persist language choice
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("testimonials_language", currentLanguage);
      document.documentElement.lang = currentLanguage;
      // Update page title and meta description
      document.title = t.meta.title;
      const metaDescription = document.querySelector(
        'meta[name="description"]'
      );
      if (metaDescription) {
        metaDescription.setAttribute("content", t.meta.description);
      }
    }
  }, [currentLanguage, t.meta.title, t.meta.description]);

  // Event handlers
  const handleFilterChange = useCallback((newFilter: FilterType) => {
    setFilter(newFilter);
    setPage(1);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setPage(1);
    },
    []
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    smoothScrollToTop();
  }, []);

  // ✅ FONCTION DE REDIRECTION CORRIGÉE POUR URL SEO PARFAITE
  const handleTestimonialClick = useCallback(
    (testimonial: ReviewType) => {
      // Déterminer le type de service pour l'URL (lawyer ou expat)
      const serviceType =
        testimonial.serviceType === "lawyer_call" ? "lawyer" : "expat";

      // Créer le slug du pays pour l'URL SEO
      const countrySlug = createCountrySlug(testimonial.clientCountry);

      // Obtenir l'année du témoignage
      const year = testimonial.createdAt.getFullYear();

      // Construire l'URL SEO-friendly parfaite pour Google
      // Format: /testimonials/:serviceType/:country/:year/:language/:id
      const path = `/testimonials/${serviceType}/${countrySlug}/${year}/${currentLanguage}/${testimonial.id}`;

      console.log("🚀 Navigation vers:", path); // Pour débugger
      navigate(path);

      // Analytics pour tracking
      logAnalyticsEvent({
        eventType: "testimonial_clicked",
        eventData: {
          testimonial_id: testimonial.id,
          service_type: serviceType,
          country: countrySlug,
          year: year,
          language: currentLanguage,
        },
      });
    },
    [navigate, currentLanguage]
  );

  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      console.log(
        "🌍 Changement de langue:",
        currentLanguage,
        "->",
        newLanguage
      ); // Debug
      setCurrentLanguage(newLanguage);
      // Force un re-render immédiat
      setIsLoading(true);
    },
    [currentLanguage]
  );

  const formatDate = (date: Date): string => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return t.aria.unknownDate;
    }
    return date.toLocaleDateString(
      currentLanguage === "fr" ? "fr-FR" : "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  const getServiceTypeLabel = (serviceType: string): string => {
    return serviceType === "lawyer_call" ? t.card.lawyer : t.card.expat;
  };

  const getServiceTypeClass = (serviceType: string): string => {
    return serviceType === "lawyer_call"
      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
      : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white";
  };

  return (
    <Layout>
      <div
        className="min-h-screen bg-gray-50"
        key={`testimonials-${currentLanguage}`}
      >
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 sm:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-blue-500/10" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 text-center">
            {/* Language Selector */}
            <div className="flex justify-end mb-8">
              <div className="relative">
                <label htmlFor="language-selector" className="sr-only">
                  {/* {t.aria.languageSelector} */}
                  <FormattedMessage id="testimonials.aria.languageSelector" />
                </label>
                <select
                  id="language-selector"
                  value={currentLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className={`bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all duration-300 ${
                    isLoading ? "opacity-50 cursor-wait" : "hover:bg-white/20"
                  }`}
                  aria-label={t.aria.languageSelector}
                  disabled={isLoading}
                >
                  <option value="fr">🇫🇷 Français</option>
                  <option value="en">🇺🇸 English</option>
                  <option value="es">🇪🇸 Español</option>
                </select>
                {isLoading && (
                  <div className="absolute inset-y-0 right-2 flex items-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 sm:px-6 py-2 sm:py-3 border border-white/20 mb-6 sm:mb-8">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current" />
              <span className="font-semibold text-sm sm:text-base">
                {/* {t.hero.badge} */}
                <FormattedMessage id="testy.hero.badge" />
              </span>
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-4 sm:mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent">
                {t.hero.title.split(" ")[0]}
              </span>
              <br />
              <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                {t.hero.title.split(" ")[1]}
              </span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4">
              {/* {t.hero.subtitle} */}
              <FormattedMessage id="testy.hero.subtitle" />
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-black text-white mb-2">
                  {stats.count}
                </div>
                <div className="text-white/80 font-medium">
                  {/* {t.hero.stats.testimonials} */}
                  <FormattedMessage id="testimonials.hero.stats.testimonials" />
                </div>
              </div>
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-black text-white mb-2">
                  {stats.averageRating}
                </div>
                <div className="text-white/80 font-medium">
                  {/* {t.hero.stats.averageRating} */}
                  <FormattedMessage id="testimonials.hero.stats.averageRating" />
                </div>
              </div>
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-green-500 to-teal-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-black text-white mb-2">
                  {stats.countries}+
                  {/* <FormattedMessage id="testimonials.hero.stats.countries" />+ */}
                </div>
                <div className="text-white/80 font-medium">
                  {/* {t.hero.stats.countries} */}
                  <FormattedMessage id="testimonials.hero.stats.countries" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 py-6 sm:py-8 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-center justify-between">
              {/* Filter buttons */}
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start">
                <button
                  onClick={() => handleFilterChange("all")}
                  className={`group inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 touch-manipulation min-h-[48px] ${
                    filter === "all"
                      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg scale-105"
                      : "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md hover:scale-105 border border-gray-200/50"
                  }`}
                  aria-label={`${t.aria.filterButton}: ${t.filters.all}`}
                >
                  <Sparkles className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                  {/* {t.filters.all} */}
                  <FormattedMessage id="testy.filters.all" />
                </button>
                <button
                  onClick={() => handleFilterChange("avocat")}
                  className={`group inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 touch-manipulation min-h-[48px] ${
                    filter === "avocat"
                      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg scale-105"
                      : "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md hover:scale-105 border border-gray-200/50"
                  }`}
                  aria-label={`${t.aria.filterButton}: ${t.filters.lawyers}`}
                >
                  <Briefcase className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                  {/* {t.filters.lawyers} */}
                  <FormattedMessage id="testy.filters.lawyers" />
                </button>
                <button
                  onClick={() => handleFilterChange("expatrie")}
                  className={`group inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 touch-manipulation min-h-[48px] ${
                    filter === "expatrie"
                      ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg scale-105"
                      : "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white hover:shadow-md hover:scale-105 border border-gray-200/50"
                  }`}
                  aria-label={`${t.aria.filterButton}: ${t.filters.expats}`}
                >
                  <User className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                  {/* {t.filters.expats} */}
                  <FormattedMessage id="testy.filters.expats" />
                </button>
              </div>

              {/* Search bar */}
              <div className="relative w-full max-w-sm">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder={t.filters.searchPlaceholder}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-12 pr-6 py-3 w-full border border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 placeholder-gray-500 text-sm sm:text-base min-h-[48px] touch-manipulation"
                  aria-label={t.aria.searchInput}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <div className="py-12 sm:py-16 relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-1/4 w-64 h-64 bg-gradient-to-r from-red-500/5 to-orange-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
            <div className="mb-8 p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-gray-200/50">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-black text-gray-900">
                    {filteredTestimonials.length}
                  </div>
                  {/* <div className="text-gray-600">
                    {filter === "all"
                      ?  t.filters.all.toLowerCase()
                      : filter === "avocat"
                        ? t.filters.lawyers.toLowerCase()
                        : t.filters.expats.toLowerCase()}
                  </div> */}

                  <div className="text-gray-600">
                    {filter === "all" ? (
                      <FormattedMessage id="testy.filters.all" />
                    ) : // t.filters.all.toLowerCase()
                    filter === "avocat" ? (
                      <FormattedMessage id="testy.filters.lawyers" />
                    ) : (
                      // t.filters.lawyers.toLowerCase()
                      <FormattedMessage id="testy.filters.expats" />

                      // t.filters.expats.toLowerCase()
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>
                    {/* {t.stats.showing} */}
                    <FormattedMessage id="testy.stats.showing" />
                    {STATS_TOTAL_TESTIMONIALS}
                    {/* {t.stats.total} */}
                    <FormattedMessage id="testy.stats.total" />
                  </span>
                  <div className="w-1 h-1 bg-gray-400 rounded-full" />
                  <span>4,9/5 ⭐</span>
                </div>
              </div>

              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min((filteredTestimonials.length / STATS_TOTAL_TESTIMONIALS) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {isLoading && currentPageTestimonials.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                {Array.from({ length: TESTIMONIALS_PER_PAGE }, (_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-200" />
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                          <div className="h-3 bg-gray-200 rounded w-16" />
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        {Array.from({ length: 5 }, (_, j) => (
                          <div
                            key={j}
                            className="w-3 h-3 bg-gray-200 rounded"
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 mb-6">
                      <div className="h-4 bg-gray-200 rounded w-full" />
                      <div className="h-4 bg-gray-200 rounded w-5/6" />
                      <div className="h-4 bg-gray-200 rounded w-4/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTestimonials.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-100 mb-4 sm:mb-6">
                  <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <p className="text-lg sm:text-xl text-gray-600 font-medium">
                  {/* {t.loading.noResults} */}
                  <FormattedMessage id="testy.loading.noResults" />
                </p>
                <p className="text-gray-500 mt-2">
                  {/* {t.loading.adjustCriteria} */}
                  <FormattedMessage id="testy.loading.adjustCriteria" />
                </p>
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setPage(1);
                    }}
                    className="mt-4 text-red-600 hover:text-red-700 font-medium"
                  >
                    {/* {t.loading.clearSearch} */}
                    {/* {t.loading.clearSearch} */}
                    <FormattedMessage id="testy.loading.clearSearch" />
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                  {currentPageTestimonials.map((testimonial, index) => (
                    <article
                      key={testimonial.id}
                      className="group relative bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 touch-manipulation active:scale-[0.98] opacity-0 animate-[fadeInUp_0.6s_ease-out_forwards]"
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => handleTestimonialClick(testimonial)}
                      aria-label={`${t.aria.testimonialCard} ${testimonial.clientName}`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-orange-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative z-10 p-6 sm:p-8">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden ring-2 ring-gray-100 group-hover:ring-red-200 transition-all duration-300">
                                <img
                                  src={
                                    testimonial.clientAvatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.clientName)}&background=random`
                                  }
                                  alt={testimonial.clientName}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              {testimonial.verified && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                  <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-base sm:text-lg">
                                {testimonial.clientName}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold ${getServiceTypeClass(testimonial.serviceType)}`}
                                >
                                  {testimonial.serviceType === "lawyer_call" ? (
                                    <Briefcase className="w-3 h-3" />
                                  ) : (
                                    <User className="w-3 h-3" />
                                  )}
                                  {getServiceTypeLabel(testimonial.serviceType)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={
                                  i < Math.floor(testimonial.rating)
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                }
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
                          <div className="flex items-center space-x-1.5">
                            <MapPin size={14} />
                            <span className="capitalize font-medium">
                              {testimonial.clientCountry}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Calendar size={14} />
                            <span>{formatDate(testimonial.createdAt)}</span>
                          </div>
                        </div>

                        <blockquote className="text-gray-700 mb-6 leading-relaxed text-sm sm:text-base line-clamp-4">
                          "{testimonial.comment}"
                        </blockquote>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>{testimonial.helpfulVotes}</span>
                            <span>
                              {/* {t.card.foundHelpful} */}
                              <FormattedMessage id="testy.card.foundHelpful" />
                            </span>
                          </div>
                          <button className="group/btn inline-flex items-center text-red-600 hover:text-red-700 text-sm font-semibold transition-colors min-h-[44px] px-2 touch-manipulation">
                            <span>
                              {/* {t.card.readMore} */}
                              <FormattedMessage id="testy.card.readMore" />
                            </span>
                            <ArrowRight
                              size={14}
                              className="ml-1 transition-transform duration-200 group-hover/btn:translate-x-0.5"
                            />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col items-center gap-6 mt-12">
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            disabled={isLoading}
                            className={`min-h-[44px] min-w-[44px] rounded-xl font-semibold transition-all duration-300 touch-manipulation ${
                              pageNum === page
                                ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg scale-110"
                                : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 hover:scale-105"
                            }`}
                            aria-label={`${t.aria.pageButton} ${pageNum}`}
                          >
                            {pageNum}
                          </button>
                        )
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      <FormattedMessage id="testy.pagination.page" />
                      {page}
                      <FormattedMessage id="testy.pagination.of" />
                      {totalPages}
                      {/* {t.pagination.page} {page} {t.pagination.of} {totalPages} */}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <style
            dangerouslySetInnerHTML={{
              __html: `
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `,
            }}
          />
        </div>

        {/* CTA Section */}
        <section className="relative bg-gradient-to-r from-red-600 via-red-500 to-orange-500 py-16 sm:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/20" />
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 left-1/3 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 right-1/3 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-6 bg-white/10 backdrop-blur-sm rounded-2xl px-4 sm:px-8 py-3 sm:py-4 border border-white/20 mb-6 sm:mb-8">
              <div className="flex items-center space-x-2 text-white/90">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-sm sm:text-base">
                  {/* {t.cta.secured} */}
                  <FormattedMessage id="testy.cta.secured" />
                </span>
              </div>
              <div className="w-px h-4 sm:h-6 bg-white/20 hidden sm:block" />
              <div className="flex items-center space-x-2 text-white/90">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-sm sm:text-base">
                  {/* {t.cta.response5min} */}
                  <FormattedMessage id="testy.cta.response5min" />
                </span>
              </div>
              <div className="w-px h-4 sm:h-6 bg-white/20 hidden sm:block" />
              <div className="flex items-center space-x-2 text-white/90">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-sm sm:text-base">
                  {/* {t.cta.countries150} */}
                  <FormattedMessage id="testy.cta.countries150" />
                </span>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-4 sm:mb-6">
              {/* {t.cta.title} */}
              <FormattedMessage id="testy.cta.title" />
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-white/95 mb-8 sm:mb-12 leading-relaxed max-w-4xl mx-auto px-4">
              {/* {t.cta.subtitle} */}
              <FormattedMessage id="testy.cta.subtitle" />
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <button
                onClick={() => (window.location.href = "/sos-appel")}
                className="group relative overflow-hidden bg-white text-red-600 hover:text-red-700 px-8 sm:px-12 py-4 sm:py-6 rounded-3xl font-black text-lg sm:text-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl flex items-center gap-3 sm:gap-4 min-h-[56px] active:scale-95 touch-manipulation"
              >
                <span>
                  {/* {t.cta.findExpert} */}
                  <FormattedMessage id="testy.cta.findExpert" />
                </span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />
              </button>

              <a
                href="/register"
                className="group relative overflow-hidden border-2 border-white bg-transparent text-white px-8 sm:px-12 py-4 sm:py-6 rounded-3xl font-bold text-lg sm:text-xl transition-all duration-300 hover:scale-105 hover:bg-white/10 flex items-center gap-3 sm:gap-4 min-h-[56px] active:scale-95 touch-manipulation"
              >
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>
                  {/* {t.cta.becomeExpert} */}
                  <FormattedMessage id="testy.cta.becomeExpert" />
                </span>
              </a>
            </div>

            <div className="mt-8 sm:mt-12 text-white/80">
              <p className="text-base sm:text-lg px-4">
                {/* {t.cta.joinExperts} */}
                <FormattedMessage id="testy.cta.joinExperts" />
              </p>
            </div>
          </div>
        </section>

        {/* Floating Back to Top Button */}
        <button
          onClick={smoothScrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 w-14 h-14 flex items-center justify-center touch-manipulation"
          style={{ display: "block" }}
          aria-label={t.aria.backToTop}
        >
          <ChevronRight className="w-5 h-5 rotate-[-90deg]" />
        </button>
      </div>
    </Layout>
  );
};

export default Testimonials;
