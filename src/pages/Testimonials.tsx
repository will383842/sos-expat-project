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
import { createMockReviewsData } from "@/constants/testimonials";

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
// const createMockReviews = (language: string): ReviewType[] => {
//   const reviews_fr: ReviewType[] = [
//     // Expatriés (9 témoignages - 55%)
//     {
//       id: "1",
//       callId: "call1",
//       clientId: "client1",
//       providerId: "provider1",
//       rating: 5,
//       comment:
//         "Incroyable ! En 3 minutes j'avais un expatrié français au bout du fil depuis Bangkok. Il m'a expliqué toute la procédure visa Thaïlandais, les pièges à éviter et m'a même donné les contacts de son agent immobilier. Service qui change la vie !",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
//       clientName: "Aisha M.",
//       clientCountry: "Thaïlande",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 23,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1643842730000-db266bbc1b28?q=80&w=400&h=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",

//       // clientAvatar:"https://images.unsplash.com/photo-1494790108755-2616b74193d4?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "2",
//       callId: "call2",
//       clientId: "client2",
//       providerId: "provider2",
//       rating: 5,
//       comment:
//         "Génial ! L'expatrié m'a aidé avec mon installation à Vancouver. Banque, logement, assurance santé, transport... tout en 30 minutes ! Il connaissait tous les bons plans et m'a évité des mois de galère administrative.",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
//       clientName: "Chen L.",
//       clientCountry: "Canada",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 31,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1601455763557-db1bea8a9a5a?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyJTIwbWFsZXxlbnwwfHwwfHx8MA%3D%3D",

//       // clientAvatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "3",
//       callId: "call3",
//       clientId: "client3",
//       providerId: "provider3",
//       rating: 4,
//       comment:
//         "Super expérience ! Expatrié à Melbourne depuis 8 ans, il m'a donné tous les conseils pour mon working holiday visa. Écoles, quartiers, jobs... Une mine d'or d'informations pratiques !",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
//       clientName: "Emma K.",
//       clientCountry: "Australie",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 18,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1677537946831-4590ff82359c?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjB8fGF2YXRhciUyMGZlbWFsZXxlbnwwfHwwfHx8MA%3D%3D",
//       // clientAvatar:
//       //   "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",

//       verified: true,
//     },
//     {
//       id: "4",
//       callId: "call4",
//       clientId: "client4",
//       providerId: "provider4",
//       rating: 5,
//       comment:
//         "Excellent ! L'expatrié vivant à Dubaï depuis 5 ans m'a tout expliqué : visa, compte bancaire, logement, culture locale. Il m'a même mis en contact avec sa communauté d'expats français !",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
//       clientName: "Kwame A.",
//       clientCountry: "Émirats Arabes Unis",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 27,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",

//       // clientAvatar:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",
//       // clientAvatar:
//       //   "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",

//       verified: true,
//     },
//     {
//       id: "5",
//       callId: "call5",
//       clientId: "client5",
//       providerId: "provider5",
//       rating: 5,
//       comment:
//         "Parfait ! En urgence depuis Tokyo, j'ai eu un expatrié en 2 minutes. Il m'a aidé avec la paperasse japonaise complexe et m'a orienté vers les bonnes administrations. Très rassurant !",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
//       clientName: "Yuki T.",
//       clientCountry: "Japon",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 22,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",

//       // clientAvatar:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "6",
//       callId: "call6",
//       clientId: "client6",
//       providerId: "provider6",
//       rating: 4,
//       comment:
//         "Très utile ! L'expatrié français en Norvège m'a donné tous les tips pour Oslo : logement étudiant, jobs d'appoint, transports. Il m'a fait gagner un temps précieux pour mes études !",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
//       clientName: "Fatima R.",
//       clientCountry: "Norvège",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 15,
//       // clientAvatar:"https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",
//       clientAvatar:
//         "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",

//       // clientAvatar:"https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "7",
//       callId: "call7",
//       clientId: "client7",
//       providerId: "provider7",
//       rating: 5,
//       comment:
//         "Formidable ! Depuis le Brésil, l'expatrié m'a tout expliqué sur São Paulo : quartiers sûrs, carte de transports, meilleures écoles pour mes enfants. Une aide inestimable !",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
//       clientName: "Carlos M.",
//       clientCountry: "Brésil",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 29,
//       // clientAvatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
//       clientAvatar:
//         "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",

//       // clientAvatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "8",
//       callId: "call8",
//       clientId: "client8",
//       providerId: "provider8",
//       rating: 5,
//       comment:
//         "Extraordinaire ! L'expatrié à Singapour m'a guidé pas à pas pour mon installation. Permis de travail, logement, banque locale... Tout était clair et détaillé. Service top !",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
//       clientName: "Priya S.",
//       clientCountry: "Singapour",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 33,
//       // clientAvatar:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
//       // clientAvatar:
//       //   "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
//       clientAvatar:
//         "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",

//       verified: true,
//     },
//     {
//       id: "9",
//       callId: "call9",
//       clientId: "client9",
//       providerId: "provider9",
//       rating: 4,
//       comment:
//         "Très professionnel ! L'expatrié français en Corée du Sud m'a donné tous les conseils pour Séoul : visa étudiant, logement universitaire, culture coréenne. Parfait pour mon échange !",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
//       clientName: "Jin W.",
//       clientCountry: "Corée du Sud",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 19,
//       // clientAvatar:"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",
//       // clientAvatar:"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",
//       clientAvatar:
//         "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",

//       verified: true,
//     },

//     // Avocats (7 témoignages - 45%)
//     {
//       id: "10",
//       callId: "call10",
//       clientId: "client10",
//       providerId: "provider10",
//       rating: 5,
//       comment:
//         "Avocat exceptionnel ! Depuis Londres, problème urgent avec mon propriétaire. L'avocat m'a expliqué mes droits en droit anglais, les démarches à suivre et m'a orienté vers un solicitor local. Précis et efficace !",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
//       clientName: "James P.",
//       clientCountry: "Royaume-Uni",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 41,
//       // clientAvatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
//       // clientAvatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
//       clientAvatar:
//         "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",

//       verified: true,
//     },
//     {
//       id: "11",
//       callId: "call11",
//       clientId: "client11",
//       providerId: "provider11",
//       rating: 5,
//       comment:
//         "Consultation remarquable ! Accident de voiture en Allemagne, l'avocat spécialisé en droit international m'a tout expliqué : assurances, procédures, droits. Il m'a évité des erreurs coûteuses !",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//       clientName: "Anya V.",
//       clientCountry: "Allemagne",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 38,
//       // clientAvatar:
//       //   "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
//       clientAvatar:
//         "https://images.unsplash.com/photo-1625262550495-1d3bfb5c1502?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTc2fHxhdmF0YXIlMjBtYWxlfGVufDB8fDB8fHww",

//       verified: true,
//     },
//     {
//       id: "12",
//       callId: "call12",
//       clientId: "client12",
//       providerId: "provider12",
//       rating: 4,
//       comment:
//         "Très compétent ! Litige commercial en Italie, l'avocat m'a donné une analyse claire de ma situation juridique et les options disponibles. Conseil précieux pour mon business !",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
//       clientName: "Giuseppe L.",
//       clientCountry: "Italie",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 26,
//       // clientAvatar:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",
//       clientAvatar:
//         "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",

//       verified: true,
//     },
//     {
//       id: "13",
//       callId: "call13",
//       clientId: "client13",
//       providerId: "provider13",
//       rating: 5,
//       comment:
//         "Avocat brillant ! Problème de visa aux États-Unis, il m'a expliqué toutes les procédures d'immigration, les risques et solutions. Grâce à lui, j'ai évité l'expulsion !",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
//       clientName: "Maria G.",
//       clientCountry: "États-Unis",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 45,
//       // clientAvatar:"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
//       clientAvatar:
//         "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",

//       verified: true,
//     },
//     {
//       id: "14",
//       callId: "call14",
//       clientId: "client14",
//       providerId: "provider14",
//       rating: 5,
//       comment:
//         "Service juridique excellent ! Divorce international complexe, l'avocat a su naviguer entre droit français et espagnol. Conseil clair, stratégie efficace. Je recommande vivement !",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
//       clientName: "Ahmed B.",
//       clientCountry: "Espagne",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 34,
//       // clientAvatar:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
//       clientAvatar:
//         "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",

//       verified: true,
//     },
//     {
//       id: "15",
//       callId: "call15",
//       clientId: "client15",
//       providerId: "provider15",
//       rating: 4,
//       comment:
//         "Très professionnel ! Contrat de travail au Mexique, l'avocat m'a expliqué toutes les clauses, mes droits et obligations. Il m'a aidé à négocier de meilleures conditions !",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
//       clientName: "Sofia R.",
//       clientCountry: "Mexique",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 21,
//       // clientAvatar:"https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",
//       clientAvatar:
//         "https://images.unsplash.com/photo-1701615004837-40d8573b6652?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",

//       verified: true,
//     },
//     {
//       id: "16",
//       callId: "call16",
//       clientId: "client16",
//       providerId: "provider16",
//       rating: 5,
//       comment:
//         "Avocat remarquable ! Problème fiscal en Suisse, il m'a expliqué les implications légales, les démarches et m'a orienté vers un fiscaliste local. Service impeccable !",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
//       clientName: "Lars H.",
//       clientCountry: "Suisse",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 37,
//       // clientAvatar:"https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",
//       clientAvatar:
//         "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YXZhdGFyfGVufDB8fDB8fHww",

//       verified: true,
//     },
//   ];

//   const reviews_en: ReviewType[] = [
//     // Expats (9 testimonials - 55%)
//     {
//       id: "1",
//       callId: "call1",
//       clientId: "client1",
//       providerId: "provider1",
//       rating: 5,
//       comment:
//         "Incredible! In 3 minutes I had a French expat on the phone from Bangkok. He explained the entire Thai visa procedure, pitfalls to avoid, and even gave me his real estate agent's contacts. Life-changing service!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
//       clientName: "Aisha M.",
//       clientCountry: "Thailand",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 23,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1643842730000-db266bbc1b28?q=80&w=400&h=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//       // clientAvatar:"https://images.unsplash.com/photo-1494790108755-2616b74193d4?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "2",
//       callId: "call2",
//       clientId: "client2",
//       providerId: "provider2",
//       rating: 5,
//       comment:
//         "Brilliant! The expat helped me with my Vancouver setup. Banking, housing, health insurance, transport... everything in 30 minutes! He knew all the insider tips and saved me months of administrative hassle.",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
//       clientName: "Chen L.",
//       clientCountry: "Canada",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 31,
//       // clientAvatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
//       clientAvatar:
//         "https://images.unsplash.com/photo-1601455763557-db1bea8a9a5a?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyJTIwbWFsZXxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "3",
//       callId: "call3",
//       clientId: "client3",
//       providerId: "provider3",
//       rating: 4,
//       comment:
//         "Great experience! Expat in Melbourne for 8 years, he gave me all the advice for my working holiday visa. Schools, neighborhoods, jobs... A goldmine of practical information!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
//       clientName: "Emma K.",
//       clientCountry: "Australia",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 18,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1677537946831-4590ff82359c?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjB8fGF2YXRhciUyMGZlbWFsZXxlbnwwfHwwfHx8MA%3D%3D",
//       // clientAvatar:
//       // "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "4",
//       callId: "call4",
//       clientId: "client4",
//       providerId: "provider4",
//       rating: 5,
//       comment:
//         "Excellent! The expat living in Dubai for 5 years explained everything: visa, bank account, housing, local culture. He even connected me with his French expat community!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
//       clientName: "Kwame A.",
//       clientCountry: "United Arab Emirates",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 27,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "5",
//       callId: "call5",
//       clientId: "client5",
//       providerId: "provider5",
//       rating: 5,
//       comment:
//         "Perfect! In urgent situation from Tokyo, I got an expat in 2 minutes. He helped me with complex Japanese paperwork and directed me to the right administrations. Very reassuring!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
//       clientName: "Yuki T.",
//       clientCountry: "Japan",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 22,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "6",
//       callId: "call6",
//       clientId: "client6",
//       providerId: "provider6",
//       rating: 4,
//       comment:
//         "Very useful! The French expat in Norway gave me all the tips for Oslo: student housing, part-time jobs, transport. He saved me precious time for my studies!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
//       clientName: "Fatima R.",
//       clientCountry: "Norway",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 15,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "7",
//       callId: "call7",
//       clientId: "client7",
//       providerId: "provider7",
//       rating: 5,
//       comment:
//         "Wonderful! From Brazil, the expat explained everything about São Paulo: safe neighborhoods, transport cards, best schools for my children. Invaluable help!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
//       clientName: "Carlos M.",
//       clientCountry: "Brazil",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 29,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "8",
//       callId: "call8",
//       clientId: "client8",
//       providerId: "provider8",
//       rating: 5,
//       comment:
//         "Extraordinary! The expat in Singapore guided me step by step for my installation. Work permit, housing, local bank... Everything was clear and detailed. Top service!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
//       clientName: "Priya S.",
//       clientCountry: "Singapore",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 33,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "9",
//       callId: "call9",
//       clientId: "client9",
//       providerId: "provider9",
//       rating: 4,
//       comment:
//         "Very professional! The French expat in South Korea gave me all the advice for Seoul: student visa, university housing, Korean culture. Perfect for my exchange!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
//       clientName: "Jin W.",
//       clientCountry: "South Korea",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 19,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },

//     // Lawyers (7 testimonials - 45%)
//     {
//       id: "10",
//       callId: "call10",
//       clientId: "client10",
//       providerId: "provider10",
//       rating: 5,
//       comment:
//         "Exceptional lawyer! From London, urgent problem with my landlord. The lawyer explained my rights in English law, the steps to follow and directed me to a local solicitor. Precise and efficient!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
//       clientName: "James P.",
//       clientCountry: "United Kingdom",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 41,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "11",
//       callId: "call11",
//       clientId: "client11",
//       providerId: "provider11",
//       rating: 5,
//       comment:
//         "Remarkable consultation! Car accident in Germany, the lawyer specialized in international law explained everything: insurance, procedures, rights. He saved me from costly mistakes!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//       clientName: "Anya V.",
//       clientCountry: "Germany",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 38,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1625262550495-1d3bfb5c1502?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTc2fHxhdmF0YXIlMjBtYWxlfGVufDB8fDB8fHww",
//       // clientAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "12",
//       callId: "call12",
//       clientId: "client12",
//       providerId: "provider12",
//       rating: 4,
//       comment:
//         "Very competent! Commercial dispute in Italy, the lawyer gave me a clear analysis of my legal situation and available options. Valuable advice for my business!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
//       clientName: "Giuseppe L.",
//       clientCountry: "Italy",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 26,
//       // clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80',
//       clientAvatar:
//         "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "13",
//       callId: "call13",
//       clientId: "client13",
//       providerId: "provider13",
//       rating: 5,
//       comment:
//         "Brilliant lawyer! Visa problem in the United States, he explained all immigration procedures, risks and solutions. Thanks to him, I avoided deportation!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
//       clientName: "Maria G.",
//       clientCountry: "United States",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 45,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "14",
//       callId: "call14",
//       clientId: "client14",
//       providerId: "provider14",
//       rating: 5,
//       comment:
//         "Excellent legal service! Complex international divorce, the lawyer navigated between French and Spanish law. Clear advice, effective strategy. Highly recommend!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
//       clientName: "Ahmed B.",
//       clientCountry: "Spain",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 34,
//       // clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80',
//       clientAvatar:
//         "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "15",
//       callId: "call15",
//       clientId: "client15",
//       providerId: "provider15",
//       rating: 4,
//       comment:
//         "Very professional! Employment contract in Mexico, the lawyer explained all clauses, my rights and obligations. He helped me negotiate better conditions!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
//       clientName: "Sofia R.",
//       clientCountry: "Mexico",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 21,
//       // clientAvatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80',
//       clientAvatar:
//         "https://images.unsplash.com/photo-1701615004837-40d8573b6652?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "16",
//       callId: "call16",
//       clientId: "client16",
//       providerId: "provider16",
//       rating: 5,
//       comment:
//         "Remarkable lawyer! Tax issue in Switzerland, he explained legal implications, procedures and directed me to a local tax specialist. Impeccable service!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
//       clientName: "Lars H.",
//       clientCountry: "Switzerland",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 37,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YXZhdGFyfGVufDB8fDB8fHww",
//       // clientAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80',
//       verified: true,
//     },
//   ];

//   const reviews_de: ReviewType[] = [
//     // Expatriés (9 testimonials - 55%)
//     {
//       id: "1",
//       callId: "call1",
//       clientId: "client1",
//       providerId: "provider1",
//       rating: 5,
//       comment:
//         "Unglaublich! In 3 Minuten hatte ich einen französischen Auswanderer aus Bangkok in der Leitung. Er erklärte mir das gesamte Thai-Visa-Verfahren, worauf ich achten sollte und gab mir sogar die Kontaktdaten seines Immobilienmaklers. Ein Service, der das Leben verändert!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
//       clientName: "Aisha M.",
//       clientCountry: "Thailand",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 23,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1643842730000-db266bbc1b28?q=80&w=400&h=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "2",
//       callId: "call2",
//       clientId: "client2",
//       providerId: "provider2",
//       rating: 5,
//       comment:
//         "Großartig! Der Auswanderer half mir bei meiner Ansiedlung in Vancouver. Bank, Wohnung, Krankenversicherung, Verkehr... alles in 30 Minuten! Er kannte alle Tipps und Tricks und ersparti mir Monate verwaltungstechnischer Schwierigkeiten.",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
//       clientName: "Chen L.",
//       clientCountry: "Kanada",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 31,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1601455763557-db1bea8a9a5a?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyJTIwbWFsZXxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "3",
//       callId: "call3",
//       clientId: "client3",
//       providerId: "provider3",
//       rating: 4,
//       comment:
//         "Großartige Erfahrung! Der seit 8 Jahren in Melbourne lebende Auswanderer gab mir alle Tipps für mein Working-Holiday-Visum. Schulen, Viertel, Jobs... Eine Fundgrube praktischer Informationen!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
//       clientName: "Emma K.",
//       clientCountry: "Australien",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 18,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1677537946831-4590ff82359c?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjB8fGF2YXRhciUyMGZlbWFsZXxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "4",
//       callId: "call4",
//       clientId: "client4",
//       providerId: "provider4",
//       rating: 5,
//       comment:
//         "Ausgezeichnet! Der seit 5 Jahren in Dubai lebende Auswanderer erklärte mir alles: Visum, Bankkonto, Wohnung, Lokalkultur. Er verband mich sogar mit seiner Gemeinschaft französischer Auswanderer!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
//       clientName: "Kwame A.",
//       clientCountry: "Vereinigte Arabische Emirate",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 27,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "5",
//       callId: "call5",
//       clientId: "client5",
//       providerId: "provider5",
//       rating: 5,
//       comment:
//         "Perfekt! In dringender Situation aus Tokio hatte ich in 2 Minuten einen Auswanderer in der Leitung. Er half mir bei den komplexen japanischen Unterlagen und orientierte mich auf die richtigen Behörden. Sehr beruhigend!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
//       clientName: "Yuki T.",
//       clientCountry: "Japan",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 22,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "6",
//       callId: "call6",
//       clientId: "client6",
//       providerId: "provider6",
//       rating: 4,
//       comment:
//         "Sehr nützlich! Der französische Auswanderer in Norwegen gab mir alle Tipps für Oslo: Studentenwohnung, Nebenjobs, Verkehr. Er sparte mir viel Zeit bei meinen Studien!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
//       clientName: "Fatima R.",
//       clientCountry: "Norwegen",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 15,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "7",
//       callId: "call7",
//       clientId: "client7",
//       providerId: "provider7",
//       rating: 5,
//       comment:
//         "Großartig! Der Auswanderer aus Brasilien erklärte mir alles über São Paulo: sichere Viertel, Fahrkarten, beste Schulen für meine Kinder. Eine unschätzbare Hilfe!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
//       clientName: "Carlos M.",
//       clientCountry: "Brasilien",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 29,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "8",
//       callId: "call8",
//       clientId: "client8",
//       providerId: "provider8",
//       rating: 5,
//       comment:
//         "Außergewöhnlich! Der Auswanderer in Singapur führte mich Schritt für Schritt durch meine Ansiedlung. Arbeitsgenehmigung, Wohnung, Localbank... Alles war klar und detailliert. Spitzenservice!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
//       clientName: "Priya S.",
//       clientCountry: "Singapur",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 33,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "9",
//       callId: "call9",
//       clientId: "client9",
//       providerId: "provider9",
//       rating: 4,
//       comment:
//         "Sehr professionell! Der französische Auswanderer in Südkorea gab mir alle Tipps für Seoul: Studentenvisum, Universitätswohnung, koreanische Kultur. Perfekt für meinen Auslandsaufenthalt!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
//       clientName: "Jin W.",
//       clientCountry: "Südkorea",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 19,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },

//     // Lawyers (7 testimonials - 45%)
//     {
//       id: "10",
//       callId: "call10",
//       clientId: "client10",
//       providerId: "provider10",
//       rating: 5,
//       comment:
//         "Außergewöhnlicher Anwalt! Dringendes Problem mit meinem Vermieter aus London. Der Anwalt erklärte mir meine Rechte im englischen Recht, die erforderlichen Schritte und orientierte mich auf einen lokalen Solicitor. Präzise und effizient!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
//       clientName: "James P.",
//       clientCountry: "Vereinigtes Königreich",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 41,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "11",
//       callId: "call11",
//       clientId: "client11",
//       providerId: "provider11",
//       rating: 5,
//       comment:
//         "Bemerkenswerte Beratung! Autounfall in Deutschland, der auf internationales Recht spezialisierte Anwalt erklärte mir alles: Versicherungen, Verfahren, Rechte. Er ersparti mir kostspielige Fehler!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//       clientName: "Anya V.",
//       clientCountry: "Deutschland",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 38,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1625262550495-1d3bfb5c1502?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTc2fHxhdmF0YXIlMjBtYWxlfGVufDB8fDB8fHww",
//       verified: true,
//     },
//     {
//       id: "12",
//       callId: "call12",
//       clientId: "client12",
//       providerId: "provider12",
//       rating: 4,
//       comment:
//         "Sehr kompetent! Handelsstreit in Italien, der Anwalt gab mir eine klare Analyse meiner Rechtsposition und der verfügbaren Optionen. Wertvoller Rat für mein Geschäft!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
//       clientName: "Giuseppe L.",
//       clientCountry: "Italien",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 26,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "13",
//       callId: "call13",
//       clientId: "client13",
//       providerId: "provider13",
//       rating: 5,
//       comment:
//         "Brillanter Anwalt! Visumprobleme in den USA, er erklärte mir alle Einwanderungsverfahren, Risiken und Lösungen. Dank ihm bin ich der Abschiebung entgangen!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
//       clientName: "Maria G.",
//       clientCountry: "Vereinigte Staaten",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 45,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "14",
//       callId: "call14",
//       clientId: "client14",
//       providerId: "provider14",
//       rating: 5,
//       comment:
//         "Ausgezeichneter Rechtsdienst! Komplexe internationale Scheidung, der Anwalt navigierte zwischen französischem und spanischem Recht. Klarer Rat, effektive Strategie. Ich empfehle dringend!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
//       clientName: "Ahmed B.",
//       clientCountry: "Spanien",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 34,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "15",
//       callId: "call15",
//       clientId: "client15",
//       providerId: "provider15",
//       rating: 4,
//       comment:
//         "Sehr professionell! Arbeitsvertrag in Mexiko, der Anwalt erklärte mir alle Klauseln, meine Rechte und Pflichten. Er half mir, bessere Bedingungen zu verhandeln!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
//       clientName: "Sofia R.",
//       clientCountry: "Mexiko",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 21,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1701615004837-40d8573b6652?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "16",
//       callId: "call16",
//       clientId: "client16",
//       providerId: "provider16",
//       rating: 5,
//       comment:
//         "Bemerkenswerter Anwalt! Steuerproblem in der Schweiz, er erklärte mir die rechtlichen Auswirkungen, die Schritte und orientierte mich auf einen lokalen Steuerberater. Tadelloses Service!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
//       clientName: "Lars H.",
//       clientCountry: "Schweiz",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 37,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YXZhdGFyfGVufDB8fDB8fHww",
//       verified: true,
//     },
//   ];

//   const reviews_ru: ReviewType[] = [
//     // Эмигранты (9 отзывов - 55%)
//     {
//       id: "1",
//       callId: "call1",
//       clientId: "client1",
//       providerId: "provider1",
//       rating: 5,
//       comment:
//         "Невероятно! За 3 минуты я связался с французским эмигрантом из Бангкока. Он объяснил мне всю процедуру получения таиландской визы, на какие подводные камни обратить внимание и даже дал мне контакты своего риэлтора. Услуга, которая меняет жизнь!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
//       clientName: "Aisha M.",
//       clientCountry: "Таиланд",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 23,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1643842730000-db266bbc1b28?q=80&w=400&h=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "2",
//       callId: "call2",
//       clientId: "client2",
//       providerId: "provider2",
//       rating: 5,
//       comment:
//         "Отлично! Эмигрант помог мне с переселением в Ванкувер. Банк, жилье, медицинская страховка, транспорт... всё за 30 минут! Он знал все лучшие советы и избавил меня от месяцев административных сложностей.",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
//       clientName: "Chen L.",
//       clientCountry: "Канада",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 31,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1601455763557-db1bea8a9a5a?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyJTIwbWFsZXxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "3",
//       callId: "call3",
//       clientId: "client3",
//       providerId: "provider3",
//       rating: 4,
//       comment:
//         "Превосходный опыт! Эмигрант в Мельбурне уже 8 лет дал мне все советы по рабочей визе для отпуска. Школы, районы, работа... Кладезь практической информации!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
//       clientName: "Emma K.",
//       clientCountry: "Австралия",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 18,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1677537946831-4590ff82359c?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjB8fGF2YXRhciUyMGZlbWFsZXxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "4",
//       callId: "call4",
//       clientId: "client4",
//       providerId: "provider4",
//       rating: 5,
//       comment:
//         "Отлично! Эмигрант, живущий в Дубае 5 лет, объяснил мне всё: визу, банковский счет, жилье, местную культуру. Он даже познакомил меня со своей общиной французских эмигрантов!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
//       clientName: "Kwame A.",
//       clientCountry: "Объединённые Арабские Эмираты",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 27,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "5",
//       callId: "call5",
//       clientId: "client5",
//       providerId: "provider5",
//       rating: 5,
//       comment:
//         "Идеально! В срочной ситуации из Токио эмигрант ответил за 2 минуты. Он помог мне с запутанной японской бюрократией и направил в нужные учреждения. Очень успокаивающе!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
//       clientName: "Yuki T.",
//       clientCountry: "Япония",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 22,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "6",
//       callId: "call6",
//       clientId: "client6",
//       providerId: "provider6",
//       rating: 4,
//       comment:
//         "Очень полезно! Французский эмигрант в Норвегии дал мне все советы для Осло: студенческое жилье, подработки, транспорт. Он сэкономил мне драгоценное время для учёбы!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
//       clientName: "Fatima R.",
//       clientCountry: "Норвегия",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 15,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "7",
//       callId: "call7",
//       clientId: "client7",
//       providerId: "provider7",
//       rating: 5,
//       comment:
//         "Замечательно! Эмигрант из Бразилии объяснил мне всё о Сан-Паулу: безопасные районы, карта проездов, лучшие школы для моих детей. Неоценимая помощь!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
//       clientName: "Carlos M.",
//       clientCountry: "Бразилия",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 29,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "8",
//       callId: "call8",
//       clientId: "client8",
//       providerId: "provider8",
//       rating: 5,
//       comment:
//         "Исключительно! Эмигрант в Сингапуре пошагово помог мне с переселением. Рабочее разрешение, жилье, местный банк... Всё было ясно и подробно. Премиальный сервис!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
//       clientName: "Priya S.",
//       clientCountry: "Сингапур",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 33,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "9",
//       callId: "call9",
//       clientId: "client9",
//       providerId: "provider9",
//       rating: 4,
//       comment:
//         "Очень профессионально! Французский эмигрант в Корее дал мне все советы для Сеула: студенческую визу, студенческое жилье, корейскую культуру. Идеально для моего обмена!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
//       clientName: "Jin W.",
//       clientCountry: "Южная Корея",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 19,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     // Адвокаты (7 отзывов - 45%)
//     {
//       id: "10",
//       callId: "call10",
//       clientId: "client10",
//       providerId: "provider10",
//       rating: 5,
//       comment:
//         "Выдающийся адвокат! Срочная проблема с арендодателем из Лондона. Адвокат объяснил мои права в английском праве, необходимые шаги и направил на местного solicitor. Точно и эффективно!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
//       clientName: "James P.",
//       clientCountry: "Соединённое Королевство",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 41,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "11",
//       callId: "call11",
//       clientId: "client11",
//       providerId: "provider11",
//       rating: 5,
//       comment:
//         "Примечательная консультация! ДТП в Германии, адвокат, специализирующийся на международном праве, объяснил всё: страховки, процедуры, права. Спас меня от дорогостоящих ошибок!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//       clientName: "Anya V.",
//       clientCountry: "Германия",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 38,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1625262550495-1d3bfb5c1502?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTc2fHxhdmF0YXIlMjBtYWxlfGVufDB8fDB8fHww",
//       verified: true,
//     },
//     {
//       id: "12",
//       callId: "call12",
//       clientId: "client12",
//       providerId: "provider12",
//       rating: 4,
//       comment:
//         "Очень компетентный! Коммерческий спор в Италии, адвокат дал ясный анализ моего юридического статуса и доступные варианты. Ценный совет для моего бизнеса!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
//       clientName: "Giuseppe L.",
//       clientCountry: "Италия",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 26,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "13",
//       callId: "call13",
//       clientId: "client13",
//       providerId: "provider13",
//       rating: 5,
//       comment:
//         "Блестящий адвокат! Проблема с визой в США, он объяснил все иммиграционные процедуры, риски и решения. Благодаря ему избежал депортации!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
//       clientName: "Maria G.",
//       clientCountry: "Соединённые Штаты",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 45,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "14",
//       callId: "call14",
//       clientId: "client14",
//       providerId: "provider14",
//       rating: 5,
//       comment:
//         "Отличный юридический сервис! Сложный международный развод, адвокат умело ориентировался между французским и испанским правом. Ясный совет, эффективная стратегия. Настоятельно рекомендую!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
//       clientName: "Ahmed B.",
//       clientCountry: "Испания",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 34,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "15",
//       callId: "call15",
//       clientId: "client15",
//       providerId: "provider15",
//       rating: 4,
//       comment:
//         "Очень профессионально! Трудовой договор в Мексике, адвокат объяснил все пункты, мои права и обязанности. Помог мне договориться о лучших условиях!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
//       clientName: "Sofia R.",
//       clientCountry: "Мексика",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 21,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1701615004837-40d8573b6652?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "16",
//       callId: "call16",
//       clientId: "client16",
//       providerId: "provider16",
//       rating: 5,
//       comment:
//         "Замечательный адвокат! Налоговая проблема в Швейцарии, он объяснил юридические последствия, необходимые шаги и направил на местного налогового консультанта. Безупречный сервис!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
//       clientName: "Lars H.",
//       clientCountry: "Швейцария",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 37,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YXZhdGFyfGVufDB8fDB8fHww",
//       verified: true,
//     },
//   ];

//   const reviews_es: ReviewType[] = [
//     // Expatriados (9 testimonios - 55%)
//     {
//       id: "1",
//       callId: "call1",
//       clientId: "client1",
//       providerId: "provider1",
//       rating: 5,
//       comment:
//         "¡Increíble! En 3 minutos tenía a un expatriado francés desde Bangkok en la línea. Me explicó todo el proceso del visado tailandés, los errores a evitar y hasta me dio los contactos de su agente inmobiliario. ¡Un servicio que cambia la vida!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
//       clientName: "Aisha M.",
//       clientCountry: "Tailandia",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 23,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1643842730000-db266bbc1b28?q=80&w=400&h=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "2",
//       callId: "call2",
//       clientId: "client2",
//       providerId: "provider2",
//       rating: 5,
//       comment:
//         "¡Genial! El expatriado me ayudó con mi instalación en Vancouver. Banco, vivienda, seguro de salud, transporte... ¡todo en 30 minutos! Conocía todos los trucos y me evitó meses de problemas administrativos.",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
//       clientName: "Chen L.",
//       clientCountry: "Canadá",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 31,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1601455763557-db1bea8a9a5a?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyJTIwbWFsZXxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "3",
//       callId: "call3",
//       clientId: "client3",
//       providerId: "provider3",
//       rating: 4,
//       comment:
//         "¡Súper experiencia! Expatriado en Melbourne desde hace 8 años, me dio todos los consejos para mi visado de vacaciones-trabajo. Escuelas, barrios, empleos... ¡Una mina de información práctica!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
//       clientName: "Emma K.",
//       clientCountry: "Australia",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 18,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1677537946831-4590ff82359c?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjB8fGF2YXRhciUyMGZlbWFsZXxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "4",
//       callId: "call4",
//       clientId: "client4",
//       providerId: "provider4",
//       rating: 5,
//       comment:
//         "¡Excelente! El expatriado que vive en Dubái desde hace 5 años me explicó todo: visado, cuenta bancaria, vivienda, cultura local. ¡Incluso me puso en contacto con su comunidad de franceses allí!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
//       clientName: "Kwame A.",
//       clientCountry: "Emiratos Árabes Unidos",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 27,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "5",
//       callId: "call5",
//       clientId: "client5",
//       providerId: "provider5",
//       rating: 5,
//       comment:
//         "¡Perfecto! En una urgencia desde Tokio, tuve a un expatriado en la línea en 2 minutos. Me ayudó con la complicada burocracia japonesa y me orientó sobre las administraciones adecuadas. ¡Muy tranquilizador!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
//       clientName: "Yuki T.",
//       clientCountry: "Japón",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 22,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "6",
//       callId: "call6",
//       clientId: "client6",
//       providerId: "provider6",
//       rating: 4,
//       comment:
//         "¡Muy útil! El expatriado francés en Noruega me dio todos los consejos para Oslo: alojamiento para estudiantes, trabajos temporales, transporte. ¡Me ahorró mucho tiempo para mis estudios!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
//       clientName: "Fatima R.",
//       clientCountry: "Noruega",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 15,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "7",
//       callId: "call7",
//       clientId: "client7",
//       providerId: "provider7",
//       rating: 5,
//       comment:
//         "¡Formidable! Desde Brasil, el expatriado me explicó todo sobre São Paulo: barrios seguros, tarjeta de transporte, las mejores escuelas para mis hijos. ¡Una ayuda invaluable!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
//       clientName: "Carlos M.",
//       clientCountry: "Brasil",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 29,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "8",
//       callId: "call8",
//       clientId: "client8",
//       providerId: "provider8",
//       rating: 5,
//       comment:
//         "¡Extraordinario! El expatriado en Singapur me guió paso a paso para mi instalación. Permiso de trabajo, alojamiento, banco local... ¡Todo estaba claro y detallado. Servicio top!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
//       clientName: "Priya S.",
//       clientCountry: "Singapur",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 33,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "9",
//       callId: "call9",
//       clientId: "client9",
//       providerId: "provider9",
//       rating: 4,
//       comment:
//         "¡Muy profesional! El expatriado francés en Corea del Sur me dio todos los consejos para Seúl: visado de estudiante, alojamiento universitario, cultura coreana. ¡Perfecto para mi intercambio!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
//       clientName: "Jin W.",
//       clientCountry: "Corea del Sur",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 19,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     // Abogados (7 testimonios - 45%)
//     {
//       id: "10",
//       callId: "call10",
//       clientId: "client10",
//       providerId: "provider10",
//       rating: 5,
//       comment:
//         "¡Abogado excepcional! Desde Londres, problema urgente con mi arrendador. El abogado me explicó mis derechos en derecho inglés, los trámites y me orientó hacia un solicitor local. ¡Preciso y eficaz!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
//       clientName: "James P.",
//       clientCountry: "Reino Unido",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 41,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "11",
//       callId: "call11",
//       clientId: "client11",
//       providerId: "provider11",
//       rating: 5,
//       comment:
//         "¡Consulta notable! Accidente de coche en Alemania, el abogado especializado en derecho internacional me explicó todo: seguros, procedimientos, derechos. ¡Me evitó cometer errores costosos!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//       clientName: "Anya V.",
//       clientCountry: "Alemania",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 38,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1625262550495-1d3bfb5c1502?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTc2fHxhdmF0YXIlMjBtYWxlfGVufDB8fDB8fHww",
//       verified: true,
//     },
//     {
//       id: "12",
//       callId: "call12",
//       clientId: "client12",
//       providerId: "provider12",
//       rating: 4,
//       comment:
//         "¡Muy competente! Disputa comercial en Italia, el abogado me dio un análisis claro de mi situación jurídica y las opciones disponibles. ¡Consejo valioso para mi negocio!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
//       clientName: "Giuseppe L.",
//       clientCountry: "Italia",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 26,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "13",
//       callId: "call13",
//       clientId: "client13",
//       providerId: "provider13",
//       rating: 5,
//       comment:
//         "¡Abogado brillante! Problema de visado en Estados Unidos, me explicó todos los trámites de inmigración, riesgos y soluciones. ¡Gracias a él evité la deportación!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
//       clientName: "Maria G.",
//       clientCountry: "Estados Unidos",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 45,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "14",
//       callId: "call14",
//       clientId: "client14",
//       providerId: "provider14",
//       rating: 5,
//       comment:
//         "¡Servicio jurídico excelente! Divorcio internacional complicado, el abogado supo gestionar el derecho francés y español. Consejo claro, estrategia eficaz. ¡Lo recomiendo totalmente!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
//       clientName: "Ahmed B.",
//       clientCountry: "España",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 34,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "15",
//       callId: "call15",
//       clientId: "client15",
//       providerId: "provider15",
//       rating: 4,
//       comment:
//         "¡Muy profesional! Contrato de trabajo en México, el abogado me explicó todas las cláusulas, mis derechos y obligaciones. ¡Me ayudó a negociar mejores condiciones!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
//       clientName: "Sofia R.",
//       clientCountry: "México",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 21,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1701615004837-40d8573b6652?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "16",
//       callId: "call16",
//       clientId: "client16",
//       providerId: "provider16",
//       rating: 5,
//       comment:
//         "¡Abogado magnífico! Problema fiscal en Suiza, me explicó las implicaciones legales, los trámites y me orientó hacia un fiscalista local. ¡Servicio impecable!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
//       clientName: "Lars H.",
//       clientCountry: "Suiza",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 37,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YXZhdGFyfGVufDB8fDB8fHww",
//       verified: true,
//     },
//   ];

//   const reviews_hi: ReviewType[] = [
//     // प्रवासी (9 समीक्षाएं - 55%)
//     {
//       id: "1",
//       callId: "call1",
//       clientId: "client1",
//       providerId: "provider1",
//       rating: 5,
//       comment:
//         "अविश्वसनीय! 3 मिनट में बैंकॉक से एक फ्रांसीसी प्रवासी से मेरी बात हुई। उन्होंने थाई वीज़ा की पूरी प्रक्रिया, बचने योग्य गलतियां समझाईं और मुझे अपने रियल एस्टेट एजेंट का संपर्क भी दिया। ये सेवा जीवन बदल देने वाली है!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
//       clientName: "आयशा एम.",
//       clientCountry: "थाईलैंड",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 23,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1643842730000-db266bbc1b28?q=80&w=400&h=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "2",
//       callId: "call2",
//       clientId: "client2",
//       providerId: "provider2",
//       rating: 5,
//       comment:
//         "शानदार! प्रवासी ने वैंकूवर में मेरी स्थापना में मदद की। बैंक, आवास, स्वास्थ्य बीमा, परिवहन... सब कुछ 30 मिनट में! उन्हें सभी अच्छे सौदों की जानकारी थी और उन्होंने मुझे महीनों की प्रशासनिक परेशानियों से बचाया।",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
//       clientName: "चेन एल.",
//       clientCountry: "कनाडा",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 31,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1601455763557-db1bea8a9a5a?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyJTIwbWFsZXxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "3",
//       callId: "call3",
//       clientId: "client3",
//       providerId: "provider3",
//       rating: 4,
//       comment:
//         "बहुत अच्छा अनुभव! मेलबर्न में 8 साल से रहने वाले प्रवासी ने मुझे मेरे वर्किंग हॉलिडे वीज़ा के लिए सभी सलाह दीं। स्कूल, इलाके, नौकरियां... व्यावहारिक जानकारी का खजाना!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
//       clientName: "एम्मा के.",
//       clientCountry: "ऑस्ट्रेलिया",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 18,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1677537946831-4590ff82359c?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjB8fGF2YXRhciUyMGZlbWFsZXxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "4",
//       callId: "call4",
//       clientId: "client4",
//       providerId: "provider4",
//       rating: 5,
//       comment:
//         "उत्कृष्ट! दुबई में 5 साल से रहने वाले प्रवासी ने मुझे सब कुछ समझाया: वीज़ा, बैंक खाता, आवास, स्थानीय संस्कृति। उन्होंने मुझे अपने फ्रांसीसी प्रवासियों के समुदाय से भी जोड़ा!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
//       clientName: "क्वामे ए.",
//       clientCountry: "संयुक्त अरब अमीरात",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 27,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "5",
//       callId: "call5",
//       clientId: "client5",
//       providerId: "provider5",
//       rating: 5,
//       comment:
//         "परफेक्ट! टोक्यो से आपातकालीन स्थिति में, मुझे 2 मिनट में एक प्रवासी मिला। उन्होंने जटिल जापानी कागजी कार्रवाई में मेरी मदद की और मुझे सही प्रशासनों की ओर निर्देशित किया। बहुत आश्वस्त करने वाला!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
//       clientName: "युकी टी.",
//       clientCountry: "जापान",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 22,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "6",
//       callId: "call6",
//       clientId: "client6",
//       providerId: "provider6",
//       rating: 4,
//       comment:
//         "बहुत उपयोगी! नॉर्वे में फ्रांसीसी प्रवासी ने मुझे ओस्लो के लिए सभी टिप्स दिए: छात्र आवास, अंशकालिक नौकरियां, परिवहन। उन्होंने मेरी पढ़ाई के लिए कीमती समय बचाया!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
//       clientName: "फातिमा आर.",
//       clientCountry: "नॉर्वे",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 15,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "7",
//       callId: "call7",
//       clientId: "client7",
//       providerId: "provider7",
//       rating: 5,
//       comment:
//         "शानदार! ब्राज़ील से, प्रवासी ने मुझे साओ पाउलो के बारे में सब कुछ समझाया: सुरक्षित इलाके, परिवहन कार्ड, मेरे बच्चों के लिए सर्वश्रेष्ठ स्कूल। अमूल्य सहायता!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
//       clientName: "कार्लोस एम.",
//       clientCountry: "ब्राज़ील",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 29,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "8",
//       callId: "call8",
//       clientId: "client8",
//       providerId: "provider8",
//       rating: 5,
//       comment:
//         "असाधारण! सिंगापुर में प्रवासी ने मेरी स्थापना के लिए कदम दर कदम मार्गदर्शन किया। वर्क परमिट, आवास, स्थानीय बैंक... सब कुछ स्पष्ट और विस्तृत था। शीर्ष सेवा!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
//       clientName: "प्रिया एस.",
//       clientCountry: "सिंगापुर",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 33,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "9",
//       callId: "call9",
//       clientId: "client9",
//       providerId: "provider9",
//       rating: 4,
//       comment:
//         "बहुत पेशेवर! दक्षिण कोरिया में फ्रांसीसी प्रवासी ने मुझे सियोल के लिए सभी सलाह दीं: छात्र वीज़ा, विश्वविद्यालय आवास, कोरियाई संस्कृति। मेरे एक्सचेंज के लिए परफेक्ट!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
//       clientName: "जिन डब्ल्यू.",
//       clientCountry: "दक्षिण कोरिया",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 19,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },

//     // वकील (7 समीक्षाएं - 45%)
//     {
//       id: "10",
//       callId: "call10",
//       clientId: "client10",
//       providerId: "provider10",
//       rating: 5,
//       comment:
//         "असाधारण वकील! लंदन से, मकान मालिक के साथ तत्काल समस्या। वकील ने मुझे अंग्रेजी कानून में मेरे अधिकार, अनुसरण करने योग्य कदम समझाए और मुझे स्थानीय सॉलिसिटर की ओर निर्देशित किया। सटीक और प्रभावी!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
//       clientName: "जेम्स पी.",
//       clientCountry: "यूनाइटेड किंगडम",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 41,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "11",
//       callId: "call11",
//       clientId: "client11",
//       providerId: "provider11",
//       rating: 5,
//       comment:
//         "उल्लेखनीय परामर्श! जर्मनी में कार दुर्घटना, अंतरराष्ट्रीय कानून में विशेषज्ञ वकील ने मुझे सब कुछ समझाया: बीमा, प्रक्रियाएं, अधिकार। उन्होंने मुझे महंगी गलतियों से बचाया!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//       clientName: "आन्या वी.",
//       clientCountry: "जर्मनी",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 38,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1625262550495-1d3bfb5c1502?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTc2fHxhdmF0YXIlMjBtYWxlfGVufDB8fDB8fHww",
//       verified: true,
//     },
//     {
//       id: "12",
//       callId: "call12",
//       clientId: "client12",
//       providerId: "provider12",
//       rating: 4,
//       comment:
//         "बहुत सक्षम! इटली में व्यावसायिक विवाद, वकील ने मुझे मेरी कानूनी स्थिति का स्पष्ट विश्लेषण और उपलब्ध विकल्प दिए। मेरे व्यवसाय के लिए मूल्यवान सलाह!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
//       clientName: "ग्यूसेप एल.",
//       clientCountry: "इटली",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 26,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "13",
//       callId: "call13",
//       clientId: "client13",
//       providerId: "provider13",
//       rating: 5,
//       comment:
//         "शानदार वकील! संयुक्त राज्य अमेरिका में वीज़ा समस्या, उन्होंने मुझे सभी आप्रवासन प्रक्रियाएं, जोखिम और समाधान समझाए। उनके लिए धन्यवाद, मैंने निर्वासन से बचा!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
//       clientName: "मारिया जी.",
//       clientCountry: "संयुक्त राज्य अमेरिका",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 45,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "14",
//       callId: "call14",
//       clientId: "client14",
//       providerId: "provider14",
//       rating: 5,
//       comment:
//         "उत्कृष्ट कानूनी सेवा! जटिल अंतरराष्ट्रीय तलाक, वकील फ्रांसीसी और स्पेनिश कानून के बीच नेविगेट करने में सक्षम थे। स्पष्ट सलाह, प्रभावी रणनीति। मैं दृढ़ता से अनुशंसा करता हूं!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
//       clientName: "अहमद बी.",
//       clientCountry: "स्पेन",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 34,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "15",
//       callId: "call15",
//       clientId: "client15",
//       providerId: "provider15",
//       rating: 4,
//       comment:
//         "बहुत पेशेवर! मेक्सिको में रोजगार अनुबंध, वकील ने मुझे सभी खंड, मेरे अधिकार और दायित्व समझाए। उन्होंने मुझे बेहतर शर्तों पर बातचीत करने में मदद की!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
//       clientName: "सोफिया आर.",
//       clientCountry: "मेक्सिको",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 21,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1701615004837-40d8573b6652?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "16",
//       callId: "call16",
//       clientId: "client16",
//       providerId: "provider16",
//       rating: 5,
//       comment:
//         "उल्लेखनीय वकील! स्विट्जरलैंड में कर समस्या, उन्होंने मुझे कानूनी निहितार्थ, कदम समझाए और मुझे स्थानीय कर सलाहकार की ओर निर्देशित किया। त्रुटिहीन सेवा!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
//       clientName: "लार्स एच.",
//       clientCountry: "स्विट्जरलैंड",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 37,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YXZhdGFyfGVufDB8fDB8fHww",
//       verified: true,
//     },
//   ];

//   const reviews_ch: ReviewType[] = [
//     {
//       id: "1",
//       callId: "call1",
//       clientId: "client1",
//       providerId: "provider1",
//       rating: 5,
//       comment:
//         "太棒了！短短三分钟，我就联系上了一位身在曼谷的法国侨民。他详细地给我讲解了整个泰国签证流程，包括需要避免的陷阱，甚至还给了我他房产经纪人的联系方式。这项服务简直改变了我的人生！",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
//       clientName: "艾莎·M.",
//       clientCountry: "泰国",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 23,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1643842730000-db266bbc1b28?q=80&w=400&h=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//       // clientAvatar:"https://images.unsplash.com/photo-1494790108755-2616b74193d4?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "2",
//       callId: "call2",
//       clientId: "client2",
//       providerId: "provider2",
//       rating: 5,
//       comment:
//         "太棒了！这位外籍人士帮我安顿好了在温哥华的一切。银行、住房、医疗保险、交通……所有事情30分钟就搞定了！他知道所有内幕消息，帮我省去了几个月的行政麻烦。",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
//       clientName: "陈L.",
//       clientCountry: "加拿大",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 31,
//       // clientAvatar:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
//       clientAvatar:
//         "https://images.unsplash.com/photo-1601455763557-db1bea8a9a5a?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyJTIwbWFsZXxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "3",
//       callId: "call3",
//       clientId: "client3",
//       providerId: "provider3",
//       rating: 4,
//       comment:
//         "非常棒的体验！我在墨尔本生活了8年，他为我的打工度假签证提供了所有建议。学校、社区、工作……简直是实用信息的宝库！",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
//       clientName: "艾玛·K.",
//       clientCountry: "澳大利亚",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 18,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1677537946831-4590ff82359c?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjB8fGF2YXRhciUyMGZlbWFsZXxlbnwwfHwwfHx8MA%3D%3D",
//       // clientAvatar:
//       // "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "4",
//       callId: "call4",
//       clientId: "client4",
//       providerId: "provider4",
//       rating: 5,
//       comment:
//         "太棒了！这位在迪拜生活了五年的外籍人士给我讲解了一切：签证、银行账户、住房、当地文化等等。他甚至还帮我联系了他的法国外籍人士社群！",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
//       clientName: "夸梅·A.",
//       clientCountry: "阿拉伯联合酋长国",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 27,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "5",
//       callId: "call5",
//       clientId: "client5",
//       providerId: "provider5",
//       rating: 5,
//       comment:
//         "太好了！我当时身在东京，情况紧急，两分钟之内就联系到了一位外籍人士。他帮我处理了复杂的日本文件，并指引我去了正确的部门。真是太让人放心了！",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
//       clientName: "由纪·T.",
//       clientCountry: "日本",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 22,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "6",
//       callId: "call6",
//       clientId: "client6",
//       providerId: "provider6",
//       rating: 4,
//       comment:
//         "太有用了！那位在挪威的法国侨民给了我很多关于奥斯陆的建议：学生公寓、兼职工作、交通等等。他帮我节省了宝贵的学习时间！",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
//       clientName: "法蒂玛·R。",
//       clientCountry: "挪威",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 15,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "7",
//       callId: "call7",
//       clientId: "client7",
//       providerId: "provider7",
//       rating: 5,
//       comment:
//         "太棒了！这位来自巴西的外国人详细地介绍了圣保罗的情况：安全的街区、交通卡、适合我孩子的好学校等等。真是帮了我大忙！",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
//       clientName: "卡洛斯·M.",
//       clientCountry: "巴西",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 29,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "8",
//       callId: "call8",
//       clientId: "client8",
//       providerId: "provider8",
//       rating: 5,
//       comment:
//         "太棒了！这位在新加坡的外国人一步一步地指导我完成所有手续。工作许可、住房、当地银行……一切都清晰明了、讲解详尽。一流的服务！",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
//       clientName: "普里亚·S。",
//       clientCountry: "新加坡",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 33,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "9",
//       callId: "call9",
//       clientId: "client9",
//       providerId: "provider9",
//       rating: 4,
//       comment:
//         "非常专业！这位在韩国的法国侨民给了我很多关于首尔的建议：学生签证、大学住宿、韩国文化等等。对我的交换学习来说简直完美！",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
//       clientName: "金文",
//       clientCountry: "韩国",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 19,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },

//     // Lawyers (7 testimonials - 45%)
//     {
//       id: "10",
//       callId: "call10",
//       clientId: "client10",
//       providerId: "provider10",
//       rating: 5,
//       comment:
//         "这位律师太棒了！我住在伦敦，和房东之间出了紧急纠纷。律师详细解释了我在英国法律下的权利，以及我应该采取的步骤，并推荐了一位当地的律师。他办事精准高效！",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
//       clientName: "詹姆斯·P。",
//       clientCountry: "英国",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 41,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "11",
//       callId: "call11",
//       clientId: "client11",
//       providerId: "provider11",
//       rating: 5,
//       comment:
//         "咨询效果极佳！我在德国出了车祸，这位精通国际法的律师详细解释了所有问题：保险、程序、我的权利。他帮我避免了代价高昂的错误！",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//       clientName: "安雅V.",
//       clientCountry: "德国",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 38,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1625262550495-1d3bfb5c1502?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTc2fHxhdmF0YXIlMjBtYWxlfGVufDB8fDB8fHww",
//       // clientAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "12",
//       callId: "call12",
//       clientId: "client12",
//       providerId: "provider12",
//       rating: 4,
//       comment:
//         "非常专业！我遇到意大利的商业纠纷，这位律师清晰地分析了我的法律处境和可行的方案。对我的业务来说，这是非常宝贵的建议！",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
//       clientName: "朱塞佩·L.",
//       clientCountry: "意大利",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 26,
//       // clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80',
//       clientAvatar:
//         "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "13",
//       callId: "call13",
//       clientId: "client13",
//       providerId: "provider13",
//       rating: 5,
//       comment:
//         "这位律师太棒了！我在美国遇到了签证问题，他详细解释了所有移民程序、风险和解决方案。多亏了他，我才避免了被遣返！",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
//       clientName: "玛丽亚·G。",
//       clientCountry: "美国",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 45,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "14",
//       callId: "call14",
//       clientId: "client14",
//       providerId: "provider14",
//       rating: 5,
//       comment:
//         "卓越的法律服务！复杂的国际离婚案件，律师精通法国和西班牙法律。建议清晰明了，策略有效。强烈推荐！",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
//       clientName: "艾哈迈德·B.",
//       clientCountry: "西班牙",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 34,
//       // clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80',
//       clientAvatar:
//         "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "15",
//       callId: "call15",
//       clientId: "client15",
//       providerId: "provider15",
//       rating: 4,
//       comment:
//         "非常专业！墨西哥的雇佣合同，律师详细解释了所有条款、我的权利和义务。他还帮我争取到了更好的待遇！",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
//       clientName: "索菲亚·R.",
//       clientCountry: "墨西哥",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 21,
//       // clientAvatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80',
//       clientAvatar:
//         "https://images.unsplash.com/photo-1701615004837-40d8573b6652?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "16",
//       callId: "call16",
//       clientId: "client16",
//       providerId: "provider16",
//       rating: 5,
//       comment:
//         "这位律师太棒了！我遇到了瑞士的税务问题，他详细解释了相关的法律规定和程序，并推荐了一位当地的税务专家。服务无可挑剔！",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
//       clientName: "拉尔斯·H.",
//       clientCountry: "瑞士",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 37,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YXZhdGFyfGVufDB8fDB8fHww",
//       // clientAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80',
//       verified: true,
//     },
//   ];

//   const reviews_pt: ReviewType[] = [
//     {
//       id: "1",
//       callId: "call1",
//       clientId: "client1",
//       providerId: "provider1",
//       rating: 5,
//       comment:
//         "Fantástico! Em apenas três minutos, consegui entrar em contato com um expatriado francês em Bangkok. Ele me explicou detalhadamente todo o processo de visto tailandês, incluindo as armadilhas a evitar, e até me passou o contato de seu corretor de imóveis. Este serviço mudou minha vida!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
//       clientName: "Aisha M.",
//       clientCountry: "Tailândia",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 23,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1643842730000-db266bbc1b28?q=80&w=400&h=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "2",
//       callId: "call2",
//       clientId: "client2",
//       providerId: "provider2",
//       rating: 5,
//       comment:
//         "Fantástico! Este expatriado me ajudou a resolver tudo em Vancouver. Banco, moradia, seguro de saúde, transporte... tudo em apenas 30 minutos! Ele conhece todos os macetes e me poupou meses de problemas administrativos.",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
//       clientName: "Chen L.",
//       clientCountry: "Canadá",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 31,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1601455763557-db1bea8a9a5a?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YXZhdGFyJTIwbWFsZXxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "3",
//       callId: "call3",
//       clientId: "client3",
//       providerId: "provider3",
//       rating: 4,
//       comment:
//         "Experiência muito boa! Vivo em Melbourne há 8 anos e ele me deu todos os conselhos para meu visto de trabalho e férias. Escola, comunidade, trabalho... um verdadeiro tesouro de informações práticas!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
//       clientName: "Emma K.",
//       clientCountry: "Austrália",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 18,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1677537946831-4590ff82359c?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjB8fGF2YXRhciUyMGZlbWFsZXxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "4",
//       callId: "call4",
//       clientId: "client4",
//       providerId: "provider4",
//       rating: 5,
//       comment:
//         "Fantástico! Este expatriado que vive em Dubai há cinco anos me explicou tudo: visto, conta bancária, moradia, cultura local e muito mais. Ele até me conectou com sua comunidade de expatriados franceses!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
//       clientName: "Kwame A.",
//       clientCountry: "Emirados Árabes Unidos",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 27,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "5",
//       callId: "call5",
//       clientId: "client5",
//       providerId: "provider5",
//       rating: 5,
//       comment:
//         "Excelente! Eu estava em Tóquio em uma situação urgente e consegui contato com um expatriado em apenas dois minutos. Ele me ajudou com documentos complicados em japonês e me orientou aos departamentos corretos. Muito tranquilizador!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
//       clientName: "Yuki T.",
//       clientCountry: "Japão",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 22,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "6",
//       callId: "call6",
//       clientId: "client6",
//       providerId: "provider6",
//       rating: 4,
//       comment:
//         "Muito útil! Este expatriado francês na Noruega me deu ótimos conselhos sobre Oslo: apartamentos para estudantes, trabalho meio período, transporte e muito mais. Me poupou tempo de estudo valioso!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
//       clientName: "Fatima R.",
//       clientCountry: "Noruega",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 15,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "7",
//       callId: "call7",
//       clientId: "client7",
//       providerId: "provider7",
//       rating: 5,
//       comment:
//         "Fantástico! Este estrangeiro do Brasil me explicou tudo sobre São Paulo em detalhes: bairros seguros, cartão de transporte, escolas boas para meu filho e muito mais. Muito me ajudou!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
//       clientName: "Carlos M.",
//       clientCountry: "Brasil",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 29,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "8",
//       callId: "call8",
//       clientId: "client8",
//       providerId: "provider8",
//       rating: 5,
//       comment:
//         "Fantástico! Este estrangeiro em Singapura me guiou passo a passo em todos os procedimentos. Visto de trabalho, moradia, banco local... tudo estava claro e bem explicado. Serviço de primeira classe!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
//       clientName: "Priya S.",
//       clientCountry: "Singapura",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 33,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "9",
//       callId: "call9",
//       clientId: "client9",
//       providerId: "provider9",
//       rating: 4,
//       comment:
//         "Muito profissional! Este expatriado francês na Coreia do Sul me deu ótimos conselhos sobre Seul: visto de estudante, acomodação universitária, cultura coreana e muito mais. Perfeito para meu intercâmbio!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
//       clientName: "Kim Min",
//       clientCountry: "Coreia do Sul",
//       serviceType: "expat_call",
//       status: "published",
//       helpfulVotes: 19,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },

//     // Lawyers (7 testimonials - 45%)
//     {
//       id: "10",
//       callId: "call10",
//       clientId: "client10",
//       providerId: "provider10",
//       rating: 5,
//       comment:
//         "Este advogado foi fantástico! Eu estava em Londres com uma disputa urgente com meu senhorio. O advogado explicou detalhadamente meus direitos sob a lei britânica e os passos que deveria tomar, além de recomendar um advogado local. Muito eficiente e preciso!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
//       clientName: "James P.",
//       clientCountry: "Reino Unido",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 41,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "11",
//       callId: "call11",
//       clientId: "client11",
//       providerId: "provider11",
//       rating: 5,
//       comment:
//         "Consultoria excelente! Eu estava na Alemanha e sofri um acidente de carro. Este advogado especializado em direito internacional explicou tudo em detalhes: seguro, procedimentos, meus direitos. Ele me ajudou a evitar erros custosos!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//       clientName: "Anja V.",
//       clientCountry: "Alemanha",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 38,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1625262550495-1d3bfb5c1502?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTc2fHxhdmF0YXIlMjBtYWxlfGVufDB8fDB8fHww",
//       verified: true,
//     },
//     {
//       id: "12",
//       callId: "call12",
//       clientId: "client12",
//       providerId: "provider12",
//       rating: 4,
//       comment:
//         "Muito profissional! Eu tinha uma disputa comercial na Itália e este advogado analisou claramente minha posição legal e opções viáveis. Conselhos muito valiosos para meu negócio!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
//       clientName: "Giuseppe L.",
//       clientCountry: "Itália",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 26,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "13",
//       callId: "call13",
//       clientId: "client13",
//       providerId: "provider13",
//       rating: 5,
//       comment:
//         "Este advogado foi fantástico! Eu tinha um problema de visto nos Estados Unidos e ele explicou em detalhes todos os procedimentos de imigração, riscos e soluções. Graças a ele, evitei ser deportado!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
//       clientName: "Maria G.",
//       clientCountry: "Estados Unidos",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 45,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
//       verified: true,
//     },
//     {
//       id: "14",
//       callId: "call14",
//       clientId: "client14",
//       providerId: "provider14",
//       rating: 5,
//       comment:
//         "Serviço jurídico excelente! Caso complexo de divórcio internacional, o advogado domina leis francesa e espanhola. Aconselhamento claro e estratégia eficaz. Altamente recomendado!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000),
//       clientName: "Ahmed B.",
//       clientCountry: "Espanha",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 34,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "15",
//       callId: "call15",
//       clientId: "client15",
//       providerId: "provider15",
//       rating: 4,
//       comment:
//         "Muito profissional! Contrato de emprego no México, o advogado explicou em detalhes todas as cláusulas, meus direitos e obrigações. Ele até me ajudou a negociar melhores termos!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
//       clientName: "Sofia R.",
//       clientCountry: "México",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 21,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1701615004837-40d8573b6652?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D",
//       verified: true,
//     },
//     {
//       id: "16",
//       callId: "call16",
//       clientId: "client16",
//       providerId: "provider16",
//       rating: 5,
//       comment:
//         "Este advogado foi fantástico! Eu tinha um problema fiscal na Suíça e ele explicou em detalhes a legislação relevante e procedimentos, além de recomendar um especialista fiscal local. Serviço impecável!",
//       isPublic: true,
//       createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
//       clientName: "Lars H.",
//       clientCountry: "Suíça",
//       serviceType: "lawyer_call",
//       status: "published",
//       helpfulVotes: 37,
//       clientAvatar:
//         "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YXZhdGFyfGVufDB8fDB8fHww",
//       verified: true,
//     },
//   ];



//   const reviews_ar: ReviewType[] = [
//   // المغتربون (9 شهادات - 55%)
//   {
//     id: "1",
//     callId: "call1",
//     clientId: "client1",
//     providerId: "provider1",
//     rating: 5,
//     comment:
//       "لا يصدق! في 3 دقائق كان لدي مغترب فرنسي من بانكوك على الهاتف. شرح لي كامل إجراءات التأشيرة التايلاندية، المخاطر التي يجب تجنبها وأعطاني حتى جهات اتصال وكيله العقاري. خدمة تغير الحياة!",
//     isPublic: true,
//     createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
//     clientName: "Aisha M.",
//     clientCountry: "تايلاند",
//     serviceType: "expat_call",
//     status: "published",
//     helpfulVotes: 23,
//     clientAvatar: "https://images.unsplash.com/photo-1643842730000-db266bbc1b28?q=80&w=400&h=400&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//     verified: true,
//   },
//   {
//     id: "2",
//     callId: "call2",
//     clientId: "client2",
//     providerId: "provider2",
//     rating: 5,
//     comment:
//       "رائع! ساعدني المغترب في تثبيت أموري في فانكوفر. البنك والسكن والتأمين الصحي والنقل... كل شيء في 30 دقيقة! كان يعرف جميع الحيل الداخلية وأنقذني من أشهر من الإزعاج الإداري.",
//     isPublic: true,
//     createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
//     clientName: "Chen L.",
//     clientCountry: "كندا",
//     serviceType: "expat_call",
//     status: "published",
//     helpfulVotes: 19,
//     clientAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
//     verified: true,
//   },
//   {
//     id: "3",
//     callId: "call3",
//     clientId: "client3",
//     providerId: "provider3",
//     rating: 4,
//     comment:
//       "تجربة رائعة! المغترب الذي يعيش في ملبورن منذ 8 سنوات أعطاني كل النصائح: الفيزا والعمل والأحياء... كنز من المعلومات العملية!",
//     isPublic: true,
//     createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
//     clientName: "Emma K.",
//     clientCountry: "أستراليا",
//     serviceType: "expat_call",
//     status: "published",
//     helpfulVotes: 17,
//     clientAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
//     verified: true,
//   },
//   {
//     id: "4",
//     callId: "call4",
//     clientId: "client4",
//     providerId: "provider4",
//     rating: 5,
//     comment:
//       "ممتاز! المغترب الذي يعيش في دبي منذ 5 سنوات شرح لي كل شيء: الفيزا وفتح حساب بنكي والسكن والثقافة المحلية. حتى ربطني بمجتمع المغتربين الفرنسيين!",
//     isPublic: true,
//     createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
//     clientName: "Kwame A.",
//     clientCountry: "الإمارات العربية المتحدة",
//     serviceType: "expat_call",
//     status: "published",
//     helpfulVotes: 21,
//     clientAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",
//     verified: true,
//   },
//   {
//     id: "5",
//     callId: "call5",
//     clientId: "client5",
//     providerId: "provider5",
//     rating: 5,
//     comment:
//       "مثالي! في حالة طارئة من طوكيو، حصلت على مغترب في دقيقتين. ساعدني مع الأوراق اليابانية المعقدة وأرشدني إلى الإدارات الصحيحة. مطمئن جداً!",
//     isPublic: true,
//     createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
//     clientName: "Yuki T.",
//     clientCountry: "اليابان",
//     serviceType: "expat_call",
//     status: "published",
//     helpfulVotes: 18,
//     clientAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
//     verified: true,
//   },
//   {
//     id: "6",
//     callId: "call6",
//     clientId: "client6",
//     providerId: "provider6",
//     rating: 4,
//     comment:
//       "مفيد جداً! المغترب الفرنسي في النرويج أعطاني كل النصائح لأوسلو: السكن الطلابي والعمل بدوام جزئي والنقل. وفر لي وقتاً قيماً للدراسة!",
//     isPublic: true,
//     createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
//     clientName: "Fatima R.",
//     clientCountry: "النرويج",
//     serviceType: "expat_call",
//     status: "published",
//     helpfulVotes: 16,
//     clientAvatar: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",
//     verified: true,
//   },
//   {
//     id: "7",
//     callId: "call7",
//     clientId: "client7",
//     providerId: "provider7",
//     rating: 5,
//     comment:
//       "رائع! من البرازيل شرح لي المغترب كل شيء عن ساو باولو: الأحياء الآمنة وبطاقات النقل والمدارس الأفضل لأطفالي. مساعدة لا تقدر بثمن!",
//     isPublic: true,
//     createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
//     clientName: "Carlos M.",
//     clientCountry: "البرازيل",
//     serviceType: "expat_call",
//     status: "published",
//     helpfulVotes: 22,
//     clientAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
//     verified: true,
//   },
//   {
//     id: "8",
//     callId: "call8",
//     clientId: "client8",
//     providerId: "provider8",
//     rating: 5,
//     comment:
//       "استثنائي! المغترب في سنغافورة أرشدني خطوة بخطوة للتثبيت. تصريح العمل والسكن والبنك المحلي... كل شيء كان واضحاً ومفصلاً. خدمة من الدرجة الأولى!",
//     isPublic: true,
//     createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
//     clientName: "Priya S.",
//     clientCountry: "سنغافورة",
//     serviceType: "expat_call",
//     status: "published",
//     helpfulVotes: 20,
//     clientAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=400&q=80",
//     verified: true,
//   },
//   {
//     id: "9",
//     callId: "call9",
//     clientId: "client9",
//     providerId: "provider9",
//     rating: 4,
//     comment:
//       "احترافي جداً! المغترب الفرنسي في كوريا الجنوبية أعطاني كل نصيحة لسيول: تأشيرة الطالب والإسكان الجامعي والثقافة الكورية. مثالي لتبادلي!",
//     isPublic: true,
//     createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000),
//     clientName: "Jin W.",
//     clientCountry: "كوريا الجنوبية",
//     serviceType: "expat_call",
//     status: "published",
//     helpfulVotes: 15,
//     clientAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&h=400&q=80",
//     verified: true,
//   },
//   // المحامون (7 شهادات - 45%)
//   {
//     id: "10",
//     callId: "call10",
//     clientId: "client10",
//     providerId: "provider10",
//     rating: 5,
//     comment:
//       "محامٍ استثنائي! من لندن، مشكلة عاجلة مع صاحب منزلي. شرح المحامي حقوقي بموجب القانون الإنجليزي والخطوات المطلوبة وأرشدني إلى محام محلي. دقيق وفعال!",
//     isPublic: true,
//     createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
//     clientName: "James P.",
//     clientCountry: "المملكة المتحدة",
//     serviceType: "lawyer_call",
//     status: "published",
//     helpfulVotes: 25,
//     clientAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=400&q=80",
//     verified: true,
//   },
//   {
//     id: "11",
//     callId: "call11",
//     clientId: "client11",
//     providerId: "provider11",
//     rating: 5,
//     comment:
//       "استشارة رائعة! حادث سيارة في ألمانيا، شرح المحامي المتخصص في القانون الدولي كل شيء: التأمين والإجراءات والحقوق. أنقذني من أخطاء مكلفة!",
//     isPublic: true,
//     createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
//     clientName: "Anya V.",
//     clientCountry: "ألمانيا",
//     serviceType: "lawyer_call",
//     status: "published",
//     helpfulVotes: 24,
//     clientAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&h=400&q=80",
//     verified: true,
//   },
//   {
//     id: "12",
//     callId: "call12",
//     clientId: "client12",
//     providerId: "provider12",
//     rating: 4,
//     comment:
//       "كفء جداً! نزاع تجاري في إيطاليا أعطاني المحامي تحليلاً واضحاً لحالتي القانونية والخيارات المتاحة. نصيحة قيمة لعملي!",
//     isPublic: true,
//     createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
//     clientName: "Giuseppe L.",
//     clientCountry: "إيطاليا",
//     serviceType: "lawyer_call",
//     status: "published",
//     helpfulVotes: 14,
//     clientAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&h=400&q=80",
//     verified: true,
//   },
//   {
//     id: "13",
//     callId: "call13",
//     clientId: "client13",
//     providerId: "provider13",
//     rating: 5,
//     comment:
//       "محامٍ رائع! مشكلة فيزا في الولايات المتحدة شرح لي جميع إجراءات الهجرة والمخاطر والحلول. بفضله تجنبت الترحيل!",
//     isPublic: true,
//     createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
//     clientName: "Maria G.",
//     clientCountry: "الولايات المتحدة",
//     serviceType: "lawyer_call",
//     status: "published",
//     helpfulVotes: 26,
//     clientAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&h=400&q=80",
//     verified: true,
//   },
//   {
//     id: "14",
//     callId: "call14",
//     clientId: "client14",
//     providerId: "provider14",
//     rating: 5,
//     comment:
//       "خدمة قانونية ممتازة! طلاق دولي معقد تمكن المحامي من التنقل بين القانون الفرنسي والإسباني. نصيحة واضحة واستراتيجية فعالة. أوصي به بشدة!",
//     isPublic: true,
//     createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
//     clientName: "Ahmed B.",
//     clientCountry: "إسبانيا",
//     serviceType: "lawyer_call",
//     status: "published",
//     helpfulVotes: 19,
//     clientAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&h=400&q=80",
//     verified: true,
//   },
//   {
//     id: "15",
//     callId: "call15",
//     clientId: "client15",
//     providerId: "provider15",
//     rating: 4,
//     comment:
//       "احترافي جداً! عقد العمل في المكسيك شرح المحامي جميع البنود وحقوقي والتزاماتي. ساعدني في التفاوض على ظروف أفضل!",
//     isPublic: true,
//     createdAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000),
//     clientName: "Sofia R.",
//     clientCountry: "المكسيك",
//     serviceType: "lawyer_call",
//     status: "published",
//     helpfulVotes: 13,
//     clientAvatar: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=400&h=400&q=80",
//     verified: true,
//   },
//   {
//     id: "16",
//     callId: "call16",
//     clientId: "client16",
//     providerId: "provider16",
//     rating: 5,
//     comment:
//       "محامٍ ملحوظ! مشكلة ضريبية في سويسرا شرح الآثار القانونية والإجراءات وأرشدني إلى متخصص ضريبي محلي. خدمة لا تشوبها شائبة!",
//     isPublic: true,
//     createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
//     clientName: "Lars H.",
//     clientCountry: "سويسرا",
//     serviceType: "lawyer_call",
//     status: "published",
//     helpfulVotes: 12,
//     clientAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YXZhdGFyfGVufDB8fDB8fHww",
//     verified: true,
//   },
// ];


//   // return language === "en" ? reviews_en : reviews_fr;
//   return language === "en"
//     ? reviews_en
//     : language === "es"
//       ? reviews_es
//       : language === "de"
//         ? reviews_de
//         : language === "ru"
//           ? reviews_ru
//           : language === "hi"
//             ? reviews_hi
//             : language === "ch"
//               ? reviews_ch
//               : language === "pt"
//                 ? reviews_pt
//                 : language === "ar"
//                   ? reviews_ar
//                 : reviews_fr;
// };

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
  // const t = useMemo(() => {
  //   const selectedTranslations =
  //     translations[currentLanguage as keyof typeof translations] ||
  //     translations.fr;
  //   console.log(
  //     "🌍 Traductions actives:",
  //     currentLanguage,
  //     selectedTranslations.hero.title
  //   ); // Debug
  //   return selectedTranslations;
  // }, [currentLanguage]);

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

      const mockReviews = createMockReviewsData(currentLanguage);
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
      setTestimonials(createMockReviewsData(currentLanguage));
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
      // document.title = t.meta.title;
      document.title = intl.formatMessage({ id: "testy.meta.title" });
      const metaDescription = document.querySelector(
        'meta[name="description"]'
      );
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          intl.formatMessage({ id: "testy.meta.description" })
        );
      }
    }
  }, [currentLanguage, intl]);

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
      
      console.log("client country : ", testimonial.clientCountry);

      // Créer le slug du pays pour l'URL SEO
      const countrySlug = createCountrySlug(testimonial.clientCountry);

      // Obtenir l'année du témoignage
      const year = testimonial.createdAt.getFullYear();

      // Construire l'URL SEO-friendly parfaite pour Google
      // Format: /testimonials/:serviceType/:country/:year/:language/:id
      console.log("country slug : ", countrySlug);

      // const path = `/testimonials/${serviceType}/${countrySlug}/${year}/${currentLanguage}/${testimonial.id}`;
      const path = `/testimonials/${testimonial.id}`;

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
      return intl.formatMessage({ id: "testy.aria.unknownDate" });
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
    return serviceType === "lawyer_call"
      ? intl.formatMessage({ id: "testy.card.lawyer" })
      : intl.formatMessage({ id: "testy.card.expat" });
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
                {/* {t.hero.title.split(" ")[0]} */}
                {intl.formatMessage({ id: "testy.hero.titleFirst" })}
              </span>
              <br />
              <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                {/* {t.hero.title.split(" ")[1]} */}
                {intl.formatMessage({ id: "testy.hero.titleSecond" })}
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
                  aria-label={`${intl.formatMessage({ id: "testy.aria.filterButton" })}: ${intl.formatMessage({ id: "testy.filters.all" })}`}
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
                  aria-label={`${intl.formatMessage({ id: "testy.aria.filterButton" })}: ${intl.formatMessage({ id: "testy.filters.lawyers" })}`}
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
                  aria-label={`${intl.formatMessage({ id: "testy.aria.filterButton" })}: ${intl.formatMessage({ id: "testy.filters.expats" })}`}
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
                  placeholder={intl.formatMessage({
                    id: "testy.filters.searchPlaceholder",
                  })}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-12 pr-6 py-3 w-full border border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 placeholder-gray-500 text-sm sm:text-base min-h-[48px] touch-manipulation"
                  aria-label={intl.formatMessage({
                    id: "testy.aria.searchInput",
                  })}
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
                  <div className="text-gray-600">
                    {filter === "all" ? (
                      <FormattedMessage id="testy.filters.all" />
                    ) : 
                    filter === "avocat" ? (
                      <FormattedMessage id="testy.filters.lawyers" />
                    ) : (
                      <FormattedMessage id="testy.filters.expats" />

                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>
                  
                    <FormattedMessage id="testy.stats.showing" />
                    {STATS_TOTAL_TESTIMONIALS}
                
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
                      aria-label={`${intl.formatMessage({ id: "testy.aria.testimonialCard" })} ${testimonial.clientName}`}
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
                            aria-label={`${intl.formatMessage({ id: "testy.aria.pageButton" })} ${pageNum}`}
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

      </div>
    </Layout>
  );
};

export default Testimonials;
