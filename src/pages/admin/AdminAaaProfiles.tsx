// Imports des traductions AAA par langue
import aaaTranslationsFr from "../../helper/aaaprofiles/admin_aaa_fr.json";
import aaaTranslationsEn from "../../helper/aaaprofiles/admin_aaa_en.json";
import aaaTranslationsEs from "../../helper/aaaprofiles/admin_aaa_es.json";
import aaaTranslationsDe from "../../helper/aaaprofiles/admin_aaa_de.json";
import aaaTranslationsPt from "../../helper/aaaprofiles/admin_aaa_pt.json";
import aaaTranslationsRu from "../../helper/aaaprofiles/admin_aaa_ru.json";
import aaaTranslationsZh from "../../helper/aaaprofiles/admin_aaa_zh.json";
import aaaTranslationsAr from "../../helper/aaaprofiles/admin_aaa_ar.json";
import aaaTranslationsHi from "../../helper/aaaprofiles/admin_aaa_hi.json";

const TRANSLATIONS_MAP: Record<string, any> = {
  fr: aaaTranslationsFr,
  en: aaaTranslationsEn,
  es: aaaTranslationsEs,
  de: aaaTranslationsDe,
  pt: aaaTranslationsPt,
  ru: aaaTranslationsRu,
  zh: aaaTranslationsZh,
  ar: aaaTranslationsAr,
  hi: aaaTranslationsHi,
};

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import type { DocumentData as FirestoreData } from 'firebase/firestore';
import {
  Users, UserPlus, Scale, Flag, Check, AlertCircle, Loader, RefreshCw,
  Save, AlertTriangle, Edit, Eye, Trash, EyeOff, Star, Search, List, Calendar, X
} from 'lucide-react';
import {
  collection, addDoc, setDoc, doc, serverTimestamp, getDocs, query,
  where, updateDoc, deleteDoc, runTransaction, Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import AdminLayout from '../../components/admin/AdminLayout';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../contexts/AuthContext';

const ImageUploader = React.lazy(() => import('../../components/common/ImageUploader'));

import { countriesData } from '../../data/countries';
import { languagesData } from '../../data/languages-spoken';
import { flattenLawyerSpecialities } from '../../data/lawyer-specialties';
import { expatHelpTypesData } from '../../data/expat-help-types';
import { getNamesByCountry } from '../../data/names-by-country';
import { getLawyerSpecialityLabel } from '../../data/lawyer-specialties';
import { getExpatHelpTypeLabel } from '../../data/expat-help-types';

// ✅ IMPORTS CORRIGÉS depuis slugGenerator
import { 
  generateSlug,
  slugify,
  LANGUAGE_TO_I18N,
  getLanguageCode,
  formatPublicName,
  COUNTRY_TO_MAIN_LANGUAGE  // ✅ AJOUT
} from '../../utils/slugGenerator';

// ==========================================
// 🌍 COORDONNÉES GPS RÉALISTES PAR PAYS
// ==========================================
const COUNTRY_COORDINATES: Record<string, Array<{ city: string; lat: number; lng: number }>> = {
  // Europe francophone
  'France': [
    { city: 'Paris', lat: 48.8566, lng: 2.3522 },
    { city: 'Lyon', lat: 45.7640, lng: 4.8357 },
    { city: 'Marseille', lat: 43.2965, lng: 5.3698 },
    { city: 'Toulouse', lat: 43.6047, lng: 1.4442 },
    { city: 'Nice', lat: 43.7102, lng: 7.2620 }
  ],
  'Belgique': [
    { city: 'Bruxelles', lat: 50.8503, lng: 4.3517 },
    { city: 'Anvers', lat: 51.2194, lng: 4.4025 },
    { city: 'Gand', lat: 51.0543, lng: 3.7174 }
  ],
  'Suisse': [
    { city: 'Zurich', lat: 47.3769, lng: 8.5417 },
    { city: 'Genève', lat: 46.2044, lng: 6.1432 },
    { city: 'Lausanne', lat: 46.5197, lng: 6.6323 }
  ],
  'Canada': [
    { city: 'Montréal', lat: 45.5017, lng: -73.5673 },
    { city: 'Québec', lat: 46.8139, lng: -71.2080 },
    { city: 'Toronto', lat: 43.6532, lng: -79.3832 },
    { city: 'Vancouver', lat: 49.2827, lng: -123.1207 }
  ],
  
  // Asie du Sud-Est
  'Thaïlande': [
    { city: 'Bangkok', lat: 13.7563, lng: 100.5018 },
    { city: 'Chiang Mai', lat: 18.7883, lng: 98.9853 },
    { city: 'Phuket', lat: 7.8804, lng: 98.3923 },
    { city: 'Pattaya', lat: 12.9236, lng: 100.8825 }
  ],
  'Vietnam': [
    { city: 'Hô-Chi-Minh-Ville', lat: 10.8231, lng: 106.6297 },
    { city: 'Hanoï', lat: 21.0285, lng: 105.8542 },
    { city: 'Da Nang', lat: 16.0544, lng: 108.2022 }
  ],
  'Cambodge': [
    { city: 'Phnom Penh', lat: 11.5564, lng: 104.9282 },
    { city: 'Siem Reap', lat: 13.3671, lng: 103.8448 }
  ],
  
  // Amérique du Nord
  'États-Unis': [
    { city: 'New York', lat: 40.7128, lng: -74.0060 },
    { city: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
    { city: 'Miami', lat: 25.7617, lng: -80.1918 },
    { city: 'San Francisco', lat: 37.7749, lng: -122.4194 }
  ],
  'Mexique': [
    { city: 'Mexico', lat: 19.4326, lng: -99.1332 },
    { city: 'Cancún', lat: 21.1619, lng: -86.8515 },
    { city: 'Guadalajara', lat: 20.6597, lng: -103.3496 }
  ],
  
  // Europe
  'Espagne': [
    { city: 'Madrid', lat: 40.4168, lng: -3.7038 },
    { city: 'Barcelone', lat: 41.3851, lng: 2.1734 },
    { city: 'Valencia', lat: 39.4699, lng: -0.3763 },
    { city: 'Séville', lat: 37.3891, lng: -5.9845 }
  ],
  'Portugal': [
    { city: 'Lisbonne', lat: 38.7223, lng: -9.1393 },
    { city: 'Porto', lat: 41.1579, lng: -8.6291 },
    { city: 'Faro', lat: 37.0194, lng: -7.9322 }
  ],
  'Allemagne': [
    { city: 'Berlin', lat: 52.5200, lng: 13.4050 },
    { city: 'Munich', lat: 48.1351, lng: 11.5820 },
    { city: 'Francfort', lat: 50.1109, lng: 8.6821 },
    { city: 'Hambourg', lat: 53.5511, lng: 9.9937 }
  ],
  'Royaume-Uni': [
    { city: 'Londres', lat: 51.5074, lng: -0.1278 },
    { city: 'Manchester', lat: 53.4808, lng: -2.2426 },
    { city: 'Édimbourg', lat: 55.9533, lng: -3.1883 }
  ],
  'Italie': [
    { city: 'Rome', lat: 41.9028, lng: 12.4964 },
    { city: 'Milan', lat: 45.4642, lng: 9.1900 },
    { city: 'Florence', lat: 43.7696, lng: 11.2558 }
  ],
  
  // Océanie
  'Australie': [
    { city: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { city: 'Melbourne', lat: -37.8136, lng: 144.9631 },
    { city: 'Brisbane', lat: -27.4698, lng: 153.0251 },
    { city: 'Perth', lat: -31.9505, lng: 115.8605 }
  ],
  'Nouvelle-Zélande': [
    { city: 'Auckland', lat: -36.8485, lng: 174.7633 },
    { city: 'Wellington', lat: -41.2865, lng: 174.7762 }
  ],
  
  // Afrique du Nord
  'Maroc': [
    { city: 'Casablanca', lat: 33.5731, lng: -7.5898 },
    { city: 'Rabat', lat: 34.0209, lng: -6.8416 },
    { city: 'Marrakech', lat: 31.6295, lng: -7.9811 }
  ],
  'Tunisie': [
    { city: 'Tunis', lat: 36.8065, lng: 10.1815 },
    { city: 'Sfax', lat: 34.7406, lng: 10.7603 }
  ],
  
  // Asie
  'Japon': [
    { city: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { city: 'Osaka', lat: 34.6937, lng: 135.5023 },
    { city: 'Kyoto', lat: 35.0116, lng: 135.7681 }
  ],
  'Chine': [
    { city: 'Pékin', lat: 39.9042, lng: 116.4074 },
    { city: 'Shanghai', lat: 31.2304, lng: 121.4737 },
    { city: 'Hong Kong', lat: 22.3193, lng: 114.1694 }
  ],
  'Singapour': [
    { city: 'Singapour', lat: 1.3521, lng: 103.8198 }
  ],
  'Inde': [
    { city: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { city: 'Delhi', lat: 28.7041, lng: 77.1025 },
    { city: 'Bangalore', lat: 12.9716, lng: 77.5946 }
  ],
  
  // Moyen-Orient
  'Émirats arabes unis': [
    { city: 'Dubaï', lat: 25.2048, lng: 55.2708 },
    { city: 'Abu Dhabi', lat: 24.4539, lng: 54.3773 }
  ],
  'Israël': [
    { city: 'Tel Aviv', lat: 32.0853, lng: 34.7818 },
    { city: 'Jérusalem', lat: 31.7683, lng: 35.2137 }
  ],
  
  // Amérique du Sud
  'Brésil': [
    { city: 'São Paulo', lat: -23.5505, lng: -46.6333 },
    { city: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729 },
    { city: 'Brasília', lat: -15.8267, lng: -47.9218 }
  ],
  'Argentine': [
    { city: 'Buenos Aires', lat: -34.6037, lng: -58.3816 },
    { city: 'Córdoba', lat: -31.4201, lng: -64.1888 }
  ],
  'Chili': [
    { city: 'Santiago', lat: -33.4489, lng: -70.6693 },
    { city: 'Valparaíso', lat: -33.0472, lng: -71.6127 }
  ],
};

// Fonction pour obtenir une coordonnée aléatoire pour un pays
const getCountryCoordinates = (country: string): { lat: number; lng: number } => {
  const coords = COUNTRY_COORDINATES[country];
  if (coords && coords.length > 0) {
    const selected = coords[Math.floor(Math.random() * coords.length)];
    // Ajouter une légère variation (±0.05°) pour éviter les doublons exacts
    return {
      lat: selected.lat + (Math.random() - 0.5) * 0.1,
      lng: selected.lng + (Math.random() - 0.5) * 0.1
    };
  }
  // Fallback : coordonnées mondiales aléatoires
  return {
    lat: -40 + Math.random() * 80,
    lng: -180 + Math.random() * 360
  };
};

// ==========================================
// 🎓 UNIVERSITÉS PAR PAYS (3-5 par pays)
// ==========================================
const UNIVERSITIES_BY_COUNTRY: Record<string, string[]> = {
  'France': [
    'Université Paris 1 Panthéon-Sorbonne',
    'Université Paris 2 Panthéon-Assas',
    'Université de Lyon',
    'Université d\'Aix-Marseille',
    'Université de Toulouse'
  ],
  'Belgique': [
    'Université Libre de Bruxelles',
    'Université Catholique de Louvain',
    'Université de Liège'
  ],
  'Suisse': [
    'Université de Genève',
    'Université de Lausanne',
    'Université de Zurich'
  ],
  'Canada': [
    'Université de Montréal',
    'Université McGill',
    'Université de Toronto',
    'Université de British Columbia'
  ],
  'Thaïlande': [
    'Chulalongkorn University',
    'Thammasat University',
    'Mahidol University'
  ],
  'Vietnam': [
    'Vietnam National University',
    'Ho Chi Minh City University of Law',
    'Hanoi Law University'
  ],
  'États-Unis': [
    'Harvard Law School',
    'Stanford Law School',
    'Yale Law School',
    'Columbia Law School',
    'NYU School of Law'
  ],
  'Royaume-Uni': [
    'University of Oxford',
    'University of Cambridge',
    'London School of Economics',
    'King\'s College London'
  ],
  'Espagne': [
    'Universidad Complutense de Madrid',
    'Universidad de Barcelona',
    'Universidad de Valencia'
  ],
  'Allemagne': [
    'Humboldt-Universität zu Berlin',
    'Ludwig-Maximilians-Universität München',
    'Universität Frankfurt'
  ],
  'Australie': [
    'University of Sydney',
    'University of Melbourne',
    'Australian National University'
  ],
  'Japon': [
    'University of Tokyo',
    'Kyoto University',
    'Waseda University'
  ],
  'Brésil': [
    'Universidade de São Paulo',
    'Universidade Federal do Rio de Janeiro',
    'Pontifícia Universidade Católica'
  ],
  // Fallback générique pour les pays non listés
  '_DEFAULT': [
    'Université Nationale',
    'École Supérieure de Droit',
    'Institut Universitaire'
  ]
};

const getUniversity = (country: string): string => {
  const universities = UNIVERSITIES_BY_COUNTRY[country] || UNIVERSITIES_BY_COUNTRY['_DEFAULT'];
  return universities[Math.floor(Math.random() * universities.length)];
};

// ==========================================
// ⏱️ TEMPS DE RÉPONSE VARIÉS
// ==========================================
const RESPONSE_TIMES = [
  '< 5 minutes',
];

const getResponseTime = (): string => {
  const rand = Math.random();
  if (rand < 0.4) return RESPONSE_TIMES[0]; // 100% : < 5 min
};

// ==========================================
// 🌍 GÉNÉRATION DE PAYS PRÉCÉDENTS (0-3)
// ==========================================
const getPreviousCountries = (currentCountry: string, allCountries: string[]): string[] => {
  const count = Math.floor(Math.random() * 4); // 0 à 3 pays
  if (count === 0) return [];
  
  const available = allCountries.filter(c => c !== currentCountry);
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// ==========================================
// 📅 ANNÉE DE DIPLÔME RÉALISTE
// ==========================================
const getGraduationYear = (experience: number, minAge: number = 27): number => {
  // Âge moyen de fin d'études : 25 ans pour un avocat, 23 pour un expat
  const studyCompletionAge = minAge === 27 ? 25 : 23;
  const currentYear = new Date().getFullYear();
  // Année de diplôme = année actuelle - expérience - années depuis fin d'études
  const graduationYear = currentYear - experience - Math.floor(Math.random() * 3);
  return graduationYear;
};

// ==========================================
// 🎯 HELPERS
// ==========================================

const getCountryNames = (): string[] => {
  return countriesData
    .filter(country => country.code !== 'SEPARATOR' && !country.disabled)
    .map(country => country.nameFr);
};

const getLanguageNames = (): string[] => {
  return languagesData.map(lang => lang.name);
};

const getLawyerSpecialtyCodes = (): string[] => {
  return flattenLawyerSpecialities().map(spec => spec.code);
};

const getExpatHelpTypeCodes = (): string[] => {
  return expatHelpTypesData.filter(type => !type.disabled).map(type => type.code);
};

const COUNTRIES_LIST = getCountryNames();
const LANGUAGE_OPTIONS = getLanguageNames();
const LAWYER_SPECIALTIES = getLawyerSpecialtyCodes();
const EXPAT_HELP_TYPES = getExpatHelpTypeCodes();

// ==========================================
// 🌍 MAPPINGS PAYS ET LANGUES
// ==========================================

/**
 * Convertit un nom de pays en code ISO
 */
const getCountryCode = (countryName: string): string => {
  const country = countriesData.find(c => c.nameFr === countryName);
  return country?.code || 'FR';
};

/**
 * Convertit un nom de langue en code ISO
 */
const getLanguageCodesFromNames = (languageNames: string[]): string[] => {
  return languageNames.map(name => {
    const langCode = getLanguageCode(name);
    return langCode || 'fr';
  });
};

const START_DATE = new Date('2025-08-20');
const TODAY = new Date();

// ==========================================
// 🎯 SYSTÈME DE TRACKING PERSISTANT - ZÉRO DOUBLON
// ==========================================

interface UsedContent {
  type: 'bio' | 'review';
  role?: string;
  langCode: string;
  index: number;
  key?: string;
  usedAt: any;
  profileId?: string;
}

// Cache en mémoire pour éviter trop de lectures Firestore
const memoryCache = {
  usedBios: new Map<string, Set<number>>(),
  usedReviews: new Map<string, Set<string>>(),
  isLoaded: false
};

/**
 * 📄 Charge tout le contenu déjà utilisé depuis Firestore
 * Appelé au démarrage et avant chaque génération
 */
async function loadUsedContent(): Promise<void> {
  if (memoryCache.isLoaded) return;
  
  console.log('📄 Chargement du contenu utilisé depuis Firestore...');
  
  try {
    const usedContentRef = collection(db, 'aaa_used_content');
    const snapshot = await getDocs(usedContentRef);
    
    let biosCount = 0;
    let reviewsCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data() as UsedContent;
      
      if (data.type === 'bio' && data.role) {
        const key = `${data.role}_${data.langCode}`;
        if (!memoryCache.usedBios.has(key)) {
          memoryCache.usedBios.set(key, new Set());
        }
        memoryCache.usedBios.get(key)!.add(data.index);
        biosCount++;
      }
      
      if (data.type === 'review') {
        const key = data.langCode;
        if (!memoryCache.usedReviews.has(key)) {
          memoryCache.usedReviews.set(key, new Set());
        }
        memoryCache.usedReviews.get(key)!.add(data.key!);
        reviewsCount++;
      }
    });
    
    memoryCache.isLoaded = true;
    
    console.log('✅ Contenu chargé avec succès:', {
      totalDocuments: snapshot.size,
      bios: biosCount,
      reviews: reviewsCount,
      détail: {
        bios: Array.from(memoryCache.usedBios.entries()).map(([k, v]) => `${k}: ${v.size} utilisées`),
        reviews: Array.from(memoryCache.usedReviews.entries()).map(([k, v]) => `${k}: ${v.size} utilisées`)
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors du chargement du contenu:', error);
    throw new Error(`Impossible de charger le contenu utilisé: ${error}`);
  }
}

/**
 * 💾 Sauvegarde une bio comme utilisée dans Firestore
 */
async function saveUsedBio(
  role: Role,
  langCode: string,
  bioIndex: number,
  profileId: string
): Promise<void> {
  const docId = `bio_${role}_${langCode}_${bioIndex}`;
  
  try {
    await setDoc(doc(db, 'aaa_used_content', docId), {
      type: 'bio',
      role,
      langCode,
      index: bioIndex,
      profileId,
      usedAt: serverTimestamp()
    });
    
    // Mettre à jour le cache en mémoire
    const key = `${role}_${langCode}`;
    if (!memoryCache.usedBios.has(key)) {
      memoryCache.usedBios.set(key, new Set());
    }
    memoryCache.usedBios.get(key)!.add(bioIndex);
    
    console.log(`💾 Bio sauvegardée: ${docId}`);
  } catch (error) {
    console.error('❌ Erreur sauvegarde bio:', error);
    throw error;
  }
}

/**
 * 💾 Sauvegarde un commentaire d'avis comme utilisé dans Firestore
 */
async function saveUsedReview(
  langCode: string,
  reviewKey: string,
  profileId: string
): Promise<void> {
  // Remplacer les points par underscores pour Firestore
  const cleanKey = reviewKey.replace(/\./g, '_');
  const docId = `review_${langCode}_${cleanKey}`;
  
  try {
    await setDoc(doc(db, 'aaa_used_content', docId), {
      type: 'review',
      langCode,
      key: reviewKey,
      profileId,
      usedAt: serverTimestamp()
    });
    
    // Mettre à jour le cache en mémoire
    if (!memoryCache.usedReviews.has(langCode)) {
      memoryCache.usedReviews.set(langCode, new Set());
    }
    memoryCache.usedReviews.get(langCode)!.add(reviewKey);
    
    console.log(`💾 Review sauvegardée: ${docId}`);
  } catch (error) {
    console.error('❌ Erreur sauvegarde review:', error);
    throw error;
  }
}

/**
 * 📋 Récupère toutes les clés de reviews disponibles
 * Construit dynamiquement la liste complète : 5 catégories × 80 commentaires = 400 reviews
 */
function getAllReviewKeys(): string[] {
  const categories = ['veryShort', 'short', 'medium', 'long', 'veryLong'];
  const keys: string[] = [];
  
  for (const category of categories) {
    for (let i = 1; i <= 80; i++) {
      keys.push(`admin.aaa.reviews.${category}.${i}`);
    }
  }
  
  return keys;
}

/**
 * 🎯 Obtient une bio unique garantie sans doublon
 * @throws Error si toutes les bios sont déjà utilisées
 */
async function getUniqueBio(
  t: any,
  role: Role,
  langCode: string,
  profileId: string
): Promise<string> {
  const bioKey = `admin.aaa.bio.${role}`;
  const templatesObj = t(bioKey, { returnObjects: true, lng: langCode });
  
  // ✅ CONVERTIR L'OBJET EN ARRAY
  let templates: string[] = [];
  if (templatesObj && typeof templatesObj === 'object' && !Array.isArray(templatesObj)) {
    templates = Object.values(templatesObj);
  } else if (Array.isArray(templatesObj)) {
    templates = templatesObj;
  }
  
  // Fallback si les templates ne sont pas chargés
  if (templates.length === 0) {
    console.warn(`⚠️ Aucun template trouvé pour ${bioKey} en ${langCode}`);
    const fallbackKey = role === 'lawyer' 
      ? 'admin.aaa.bio.lawyer.1' 
      : 'admin.aaa.bio.expat.1';
    return t(fallbackKey, { lng: langCode });
  }

  const key = `${role}_${langCode}`;
  const used = memoryCache.usedBios.get(key) || new Set<number>();
  
  // 🛑 VÉRIFICATION CRITIQUE : Toutes les bios sont-elles utilisées ?
  if (used.size >= templates.length) {
    const errorMessage = 
      `❌ PLUS DE BIOS DISPONIBLES - LIMITE ATTEINTE\n\n` +
      `📊 Statistiques:\n` +
      `   Type: ${role}\n` +
      `   Langue: ${langCode}\n` +
      `   Bios utilisées: ${used.size}/${templates.length}\n\n` +
      `💡 Solutions possibles:\n` +
      `   1. Ajoutez plus de bios dans le fichier JSON (recommandé 200+)\n` +
      `   2. Utilisez une autre langue\n` +
      `   3. Contactez le développeur pour augmenter les templates\n\n` +
      `📍 Chemin JSON: admin.aaa.bio.${role}`;
    
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  // 🎲 Trouver un index non utilisé avec protection contre boucle infinie
  let index: number;
  let attempts = 0;
  const maxAttempts = templates.length * 10; // Sécurité : 10× le nombre de templates
  
  do {
    index = Math.floor(Math.random() * templates.length);
    attempts++;
    
    if (attempts > maxAttempts) {
      const errorMessage = 
        `❌ ERREUR SYSTÈME - Impossible de trouver une bio unique\n\n` +
        `Tentatives: ${attempts}/${maxAttempts}\n` +
        `Utilisées: ${used.size}/${templates.length}\n` +
        `Type: ${role}, Langue: ${langCode}\n\n` +
        `Cela ne devrait JAMAIS arriver. Contactez le développeur.`;
      
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  } while (used.has(index));
  
  // 💾 Sauvegarder dans Firestore + cache
  await saveUsedBio(role, langCode, index, profileId);
  
  const progress = `${used.size + 1}/${templates.length}`;
  const percentage = Math.round(((used.size + 1) / templates.length) * 100);
  
  console.log(
    `✅ Bio unique trouvée: ${role}_${langCode}_${index}\n` +
    `   Progression: ${progress} (${percentage}%)\n` +
    `   ProfileId: ${profileId}`
  );
  
  // ⚠️ Avertissement si on approche de la limite
  if (percentage >= 80) {
    console.warn(
      `⚠️ ATTENTION: ${percentage}% des bios ${role}_${langCode} sont utilisées!\n` +
      `   Il reste seulement ${templates.length - used.size - 1} bios disponibles.\n` +
      `   Préparez des templates supplémentaires.`
    );
  }
  
  return templates[index];
}

// ========================================
// 🌍 TRADUCTION DES CODES DE SPÉCIALITÉS
// ========================================

/**
 * Convertit les codes de spécialités en labels traduits
 * @example ["URG_ASSISTANCE_PENALE_INTERNATIONALE"] → ["Assistance pénale internationale"]
 */
function translateSpecialtyCodes(
  codes: string[],
  role: Role,
  langCode: string
): string[] {
  if (role === 'lawyer') {
    return codes.map(code => 
      getLawyerSpecialityLabel(code, langCode as 'fr' | 'en' | 'es' | 'de' | 'pt')
    );
  } else {
    return codes.map(code => 
      getExpatHelpTypeLabel(code, langCode as 'fr' | 'en' | 'es' | 'de' | 'pt' | 'ru' | 'zh' | 'ar' | 'hi')
    );
  }
}
/**
 * 🌍 Génère une bio multilingue pour toutes les langues disponibles
 */
async function getMultilingualBio(
  t: any,
  role: Role,
  profileId: string,
  specialties: string[],
  country: string,
  experience: number
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const languages = ['fr', 'en', 'es', 'de', 'pt'];
  
  for (const lang of languages) {
    try {
      const bioTemplate = await getUniqueBio(t, role, lang, profileId);
      
      // ✅ CORRECTION : Traduire les codes en labels
      const translatedSpecialties = translateSpecialtyCodes(specialties, role, lang);
      
      const bio = interpolateBio(bioTemplate, {
        specialties: translatedSpecialties.join(', '),
        help: translatedSpecialties.join(', '),
        services: translatedSpecialties.join(', '), // Pour compatibilité avec d'autres templates
        country,
        experience
      });
      result[lang] = bio;
    } catch (error) {
      console.error(`❌ Erreur génération bio ${role} en ${lang}:`, error);
      if (lang !== 'fr' && result['en']) {
        result[lang] = result['en'];
      }
    }
  }
  
  return result;
}

/**
 * 🌍 Génère une motivation multilingue pour expatriés
 */
async function getMultilingualMotivation(
  country: string,
  experience: number
): Promise<Record<string, string>> {
  const motivationTemplates: Record<string, string[]> = {
    fr: [
      'Passionné par l\'aide aux expatriés à {country}',
      'Expert de la vie d\'expatrié à {country} depuis {experience} ans',
      'J\'accompagne les nouveaux arrivants à {country} dans leurs démarches',
      'Expatrié expérimenté, je partage mes connaissances de {country}',
      'Facilitateur d\'intégration pour expatriés à {country}'
    ],
    en: [
      'Passionate about helping expats in {country}',
      'Expert in expat life in {country} for {experience} years',
      'I support newcomers in {country} with their procedures',
      'Experienced expat, I share my knowledge of {country}',
      'Integration facilitator for expats in {country}'
    ],
    es: [
      'Apasionado por ayudar a expatriados en {country}',
      'Experto en vida de expatriado en {country} desde hace {experience} años',
      'Acompaño a los recién llegados a {country} en sus trámites',
      'Expatriado experimentado, comparto mis conocimientos de {country}',
      'Facilitador de integración para expatriados en {country}'
    ],
    de: [
      'Leidenschaftlich daran interessiert, Expats in {country} zu helfen',
      'Experte für Expat-Leben in {country} seit {experience} Jahren',
      'Ich unterstütze Neuankömmlinge in {country} bei ihren Verfahren',
      'Erfahrener Expat, ich teile mein Wissen über {country}',
      'Integrationsförderer für Expats in {country}'
    ],
    pt: [
      'Apaixonado por ajudar expatriados em {country}',
      'Especialista em vida de expatriado em {country} há {experience} anos',
      'Acompanho os recém-chegados em {country} nos seus procedimentos',
      'Expatriado experiente, partilho os meus conhecimentos de {country}',
      'Facilitador de integração para expatriados em {country}'
    ]
  };

  const result: Record<string, string> = {};
  const languages = ['fr', 'en', 'es', 'de', 'pt'];

  for (const lang of languages) {
    const templates = motivationTemplates[lang] || motivationTemplates['en'];
    const template = templates[Math.floor(Math.random() * templates.length)];
    result[lang] = template
      .replace('{country}', country)
      .replace('{experience}', experience.toString());
  }

  return result;
}

/**
 * 🌍 Certifications multilingues
 */
const CERTIFICATIONS_MULTILINGUE: Record<string, Record<string, string>> = {
  'certified-bar': {
    fr: 'Barreau certifié',
    en: 'Certified Bar',
    es: 'Colegio de Abogados certificado',
    de: 'Zertifizierte Anwaltskammer',
    pt: 'Ordem dos Advogados certificada'
  },
  'international-law': {
    fr: 'Spécialiste en droit international',
    en: 'International Law Specialist',
    es: 'Especialista en Derecho Internacional',
    de: 'Spezialist für Internationales Recht',
    pt: 'Especialista em Direito Internacional'
  },
  'mediator': {
    fr: 'Médiateur agréé',
    en: 'Accredited Mediator',
    es: 'Mediador acreditado',
    de: 'Akkreditierter Mediator',
    pt: 'Mediador credenciado'
  },
  'business-law': {
    fr: 'Droit des affaires certifié',
    en: 'Certified Business Law',
    es: 'Derecho Empresarial certificado',
    de: 'Zertifiziertes Wirtschaftsrecht',
    pt: 'Direito Empresarial certificado'
  },
  'family-law': {
    fr: 'Expert en droit de la famille',
    en: 'Family Law Expert',
    es: 'Experto en Derecho de Familia',
    de: 'Familienrechtsexperte',
    pt: 'Especialista em Direito de Família'
  },
  'tax-law': {
    fr: 'Droit fiscal avancé',
    en: 'Advanced Tax Law',
    es: 'Derecho Fiscal avanzado',
    de: 'Fortgeschrittenes Steuerrecht',
    pt: 'Direito Fiscal avançado'
  },
  'real-estate': {
    fr: 'Droit immobilier certifié',
    en: 'Certified Real Estate Law',
    es: 'Derecho Inmobiliario certificado',
    de: 'Zertifiziertes Immobilienrecht',
    pt: 'Direito Imobiliário certificado'
  },
  'notary': {
    fr: 'Notaire public',
    en: 'Notary Public',
    es: 'Notario público',
    de: 'Notar',
    pt: 'Notário público'
  },
  'arbitrator': {
    fr: 'Arbitre international',
    en: 'International Arbitrator',
    es: 'Árbitro internacional',
    de: 'Internationaler Schiedsrichter',
    pt: 'Árbitro internacional'
  },
  'immigration': {
    fr: 'Consultant en immigration',
    en: 'Immigration Consultant',
    es: 'Consultor de inmigración',
    de: 'Einwanderungsberater',
    pt: 'Consultor de imigração'
  }
};

function getMultilingualCertifications(count: number = 2): string[] {
  const certKeys = Object.keys(CERTIFICATIONS_MULTILINGUE);
  const shuffled = [...certKeys].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, certKeys.length));
}

/**
 * 💬 Obtient un commentaire d'avis unique garanti sans doublon
 * @throws Error si tous les commentaires sont déjà utilisés
 */
async function getUniqueReviewComment(
  t: any,
  profileLanguages: string[],
  profileId: string
): Promise<{ key: string; text: string }> {
  // 🌍 Déterminer la langue de l'avis
  let reviewLang = 'fr';
  for (const lang of profileLanguages) {
    if (LANGUAGE_TO_I18N[lang]) {
      reviewLang = LANGUAGE_TO_I18N[lang];
      break;
    }
  }

  const used = memoryCache.usedReviews.get(reviewLang) || new Set<string>();
  const allKeys = getAllReviewKeys(); // 400 reviews disponibles
  
  // 🛑 VÉRIFICATION CRITIQUE : Tous les commentaires sont-ils utilisés ?
  if (used.size >= allKeys.length) {
    const errorMessage = 
      `❌ PLUS DE COMMENTAIRES D'AVIS DISPONIBLES - LIMITE ATTEINTE\n\n` +
      `📊 Statistiques:\n` +
      `   Langue: ${reviewLang}\n` +
      `   Commentaires utilisés: ${used.size}/${allKeys.length}\n\n` +
      `💡 Solutions possibles:\n` +
      `   1. Ajoutez plus de reviews dans le fichier JSON (recommandé 600+)\n` +
      `   2. Utilisez une autre langue\n` +
      `   3. Contactez le développeur pour augmenter les templates\n\n` +
      `📍 Chemin JSON: admin.aaa.reviews.(veryShort|short|medium|long|veryLong)`;
    
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  // 🎲 Trouver une clé non utilisée avec protection contre boucle infinie
  let key: string;
  let attempts = 0;
  const maxAttempts = allKeys.length * 10; // Sécurité : 10× le nombre de reviews
  
  do {
    key = allKeys[Math.floor(Math.random() * allKeys.length)];
    attempts++;
    
    if (attempts > maxAttempts) {
      const errorMessage = 
        `❌ ERREUR SYSTÈME - Impossible de trouver un commentaire unique\n\n` +
        `Tentatives: ${attempts}/${maxAttempts}\n` +
        `Utilisés: ${used.size}/${allKeys.length}\n` +
        `Langue: ${reviewLang}\n\n` +
        `Cela ne devrait JAMAIS arriver. Contactez le développeur.`;
      
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
  } while (used.has(key));
  
  // 💾 Sauvegarder dans Firestore + cache
  await saveUsedReview(reviewLang, key, profileId);
  
  const progress = `${used.size + 1}/${allKeys.length}`;
  const percentage = Math.round(((used.size + 1) / allKeys.length) * 100);
  
  console.log(
    `✅ Review unique trouvée: ${reviewLang}_${key}\n` +
    `   Progression: ${progress} (${percentage}%)\n` +
    `   ProfileId: ${profileId}`
  );
  
  // ⚠️ Avertissement si on approche de la limite
  if (percentage >= 80) {
    console.warn(
      `⚠️ ATTENTION: ${percentage}% des reviews ${reviewLang} sont utilisées!\n` +
      `   Il reste seulement ${allKeys.length - used.size - 1} commentaires disponibles.\n` +
      `   Préparez des templates supplémentaires.`
    );
  }
  
  // ✅ Toujours utiliser FR comme fallback
  const fallbackText = t(key, { lng: 'fr' });
  
  console.log(`✅ Review générée:`, {
    key,
    profileLanguages,
    fallbackPreview: fallbackText.substring(0, 50) + '...'
  });
  
  return { key, text: fallbackText };
}

// ==========================================
// FIN DU SYSTÈME DE TRACKING PERSISTANT
// ==========================================

function randomDateBetween(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return new Date(randomTime);
}

function weeksSince(date: Date): number {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
}

const genName = (gender: Gender, country: string) => {
  const names = getNamesByCountry(country);
  const firstName = names[gender][randomInt(0, names[gender].length - 1)];
  const lastName = names.lastNames[randomInt(0, names.lastNames.length - 1)];
  return { firstName, lastName, fullName: `${firstName} ${lastName}` };
};

const interpolateBio = (template: string, values: Record<string, any>): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] || '');
};

type Role = 'lawyer' | 'expat';
type Gender = 'male' | 'female';

interface AaaProfile {
  id: string; fullName: string; firstName: string; lastName: string; email: string;
  phone: string; phoneCountryCode: string; type: Role; country: string; languages: string[];
  specialties: string[]; rating: number; reviewCount: number; yearsOfExperience: number;
  profilePhoto: string; description: string; isOnline: boolean; isVisible: boolean;
  isCallable: boolean; createdAt: Date; isTestProfile?: boolean; price?: number; duration?: number;
  role?: Role; totalCalls?: number; mainInterventionCountry?: string;
  practiceCountries?: string[]; helpTypes?: string[]; graduationYear?: number;
  educations?: string[]; yearsAsExpat?: number; whatsapp?: string; currentCountry?: string;
  currentPresenceCountry?: string; residenceCountry?: string; presenceCountry?: string;
  interventionCountry?: string; languagesSpoken?: string[]; preferredLanguage?: string;
  acceptTerms?: boolean; provider?: string; isEarlyProvider?: boolean; earlyBadge?: 'lawyer' | 'expat';
  lawSchool?: string; certifications?: string[]; motivation?: string | Record<string, string>; responseTime?: string;
  previousCountries?: string[]; mapLocation?: { lat: number; lng: number }; slug?: string;
  bio?: string | Record<string, string>;
}

interface GenerationForm {
  count: number; roleDistribution: { lawyer: number; expat: number };
  genderDistribution: { male: number; female: number }; countries: string[]; languages: string[];
  minExperience: number; maxExperience: number; minAge: number; maxAge: number;
  allowRealCalls: boolean; isTestProfile: boolean; customPhoneNumber: string;
  useCustomPhone: boolean; markAsEarly: boolean; earlyPercentage: number;
}

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomChoice = <T,>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

const randomRating = (): number => {
  const r = Math.random();
  if (r < 0.95) return parseFloat((4 + Math.random()).toFixed(2));
  return parseFloat((3 + Math.random() * 0.9).toFixed(2));
};

const pickLanguages = (selected: string[], country: string): string[] => {
  // 🛡️ PROTECTION 1 : Si aucune langue sélectionnée, utiliser Français par défaut
  const pool = selected.length > 0 ? [...selected] : ['Français'];
  
  const result = new Set<string>();
  
  // ✅ Utiliser la mapping depuis slugGenerator
  const mainLangFromMapping = Object.entries(LANGUAGE_TO_I18N).find(
    ([langName]) => langName.toLowerCase() === country.toLowerCase()
  )?.[0];
  
  const mainLang = mainLangFromMapping || 'Français';
  const foundMainLang = pool.find((l) => l.toLowerCase() === mainLang.toLowerCase());
  if (foundMainLang) result.add(foundMainLang);
  
  const pushIf = (lang: string) => {
    const found = pool.find((l) => l.toLowerCase() === lang.toLowerCase());
    if (found) result.add(found);
  };
  
  pushIf('Anglais');
  
  const maxExtra = Math.min(3, pool.length);
  const addCount = randomInt(0, maxExtra);
  for (let i = 0; i < addCount; i++) {
    const cand = pool[randomInt(0, pool.length - 1)];
    result.add(cand);
  }
  
  // 🛡️ PROTECTION 2 : Garantir au moins une langue (double sécurité)
  if (result.size === 0) {
    result.add('Français');
  }
  
  return Array.from(result);
};

const genEmail = (firstName: string, lastName: string) =>
  `${slugify(firstName)}.${slugify(lastName)}@example.com`;

const AdminAaaProfiles: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const intl = useIntl();

  // ✅ NOUVELLE fonction t() avec support multi-langue
  const t = (
    id: string,
    options?: { lng?: string; returnObjects?: boolean; [key: string]: any }
  ): any => {
    // Langue courante de l'admin (fr, en, es, ...)
    const intlLang = intl.locale?.split('-')[0] || 'fr';
    const lang = options?.lng || intlLang;
    const translations = TRANSLATIONS_MAP[lang] || TRANSLATIONS_MAP['fr'];

    // Naviguer dans l'objet JSON avec le chemin (ex: "admin.aaa.reviews.short.1")
    const keys = id.split('.');
    let value: any = translations;

    for (const key of keys) {
      if (value && typeof value === 'object') {
        value = value[key];
      } else {
        return id; // Retourne la clé si non trouvé
      }
    }

    // Si on demande le tableau/objet brut (bios, etc.)
    if (options?.returnObjects) {
      return value;
    }

    return typeof value === 'string' ? value : id;
  };

  const [activeTab, setActiveTab] = useState<'generate' | 'manage' | 'planner'>('generate');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [existingProfiles, setExistingProfiles] = useState<AaaProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'lawyer' | 'expat'>('all');
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<AaaProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<AaaProfile>>({});
  const [newProfilePhoto, setNewProfilePhoto] = useState<string>('');
  const [uploadingPhotoFor, setUploadingPhotoFor] = useState<string | null>(null);

  const [formData, setFormData] = useState<GenerationForm>({
    count: 10, roleDistribution: { lawyer: 50, expat: 50 },
    genderDistribution: { male: 50, female: 50 },
    countries: ['Canada', 'Thaïlande', 'Australie', 'Espagne', 'Allemagne'],
    languages: ['Français', 'Anglais'], minExperience: 2, maxExperience: 15,
    minAge: 27, maxAge: 65, allowRealCalls: false, isTestProfile: true,
    customPhoneNumber: '+33743331201', useCustomPhone: true, markAsEarly: false, earlyPercentage: 20,
  });

  const [planner] = useState({
    enabled: false, dailyCount: 20, regionCountries: ['Thaïlande', 'Vietnam', 'Cambodge'],
    role: 'expat' as Role, genderBias: { male: 50, female: 50 }, languages: ['Français', 'Anglais'],
  });

  useEffect(() => {
    if (!currentUser || (currentUser as { role?: string }).role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    
    // ✅ CHARGER LE CONTENU UTILISÉ AU DÉMARRAGE
    loadUsedContent().catch((error) => {
      console.error('❌ Erreur chargement contenu utilisé:', error);
      setError(`Impossible de charger le contenu utilisé: ${error.message}`);
    });
    
    if (activeTab === 'manage') loadExistingProfiles().catch(() => {});
  }, [currentUser, navigate, activeTab]);

  const filteredProfiles = useMemo(() => {
    let filtered = existingProfiles;
    if (roleFilter !== 'all') {
      filtered = filtered.filter(p => (p.type || p.role) === roleFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.country?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [existingProfiles, searchTerm, roleFilter]);

  if (!COUNTRIES_LIST || !LANGUAGE_OPTIONS || !LAWYER_SPECIALTIES) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader className="animate-spin mx-auto mb-4" size={48} />
            <p className="text-gray-600">{t('admin.loading')}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const loadExistingProfiles = async () => {
    try {
      setIsLoadingProfiles(true);
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const all = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id, ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        } as AaaProfile;
      });
      const profiles = all
        .filter((p) => p.isTestProfile === true)
        .sort((a, b) => (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0));
      setExistingProfiles(profiles);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const handleCountryToggle = (country: string) => {
    setFormData((prev) => ({
      ...prev,
      countries: prev.countries.includes(country)
        ? prev.countries.filter((c) => c !== country)
        : [...prev.countries, country],
    }));
  };

  const handleLanguageToggle = (language: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
  };

  const handleSelectAllCountries = () => {
    setFormData((prev) => ({
      ...prev,
      countries: prev.countries.length === COUNTRIES_LIST.length ? [] : [...COUNTRIES_LIST],
    }));
  };

  const handleSelectAllLanguages = () => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.length === LANGUAGE_OPTIONS.length ? [] : [...LANGUAGE_OPTIONS],
    }));
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(date);

  const generateAaaProfiles = async () => {
    try {
      // ✅ CHARGER LE CONTENU UTILISÉ AVANT LA GÉNÉRATION
      await loadUsedContent();
      
      setIsGenerating(true);
      setGeneratedCount(0);
      setSuccess(null);
      setError(null);

      const { count, roleDistribution, genderDistribution, countries, languages,
        minExperience, maxExperience, customPhoneNumber, useCustomPhone, markAsEarly, earlyPercentage } = formData;

      if (count <= 0) return setError('Nombre invalide');
      if (countries.length === 0) return setError('Aucun pays sélectionné');
      if (languages.length === 0) return setError('Aucune langue sélectionnée');

      const lawyerCount = Math.round((roleDistribution.lawyer / 100) * count);
      const maleCount = Math.round((genderDistribution.male / 100) * count);

      let malesGenerated = 0;
      let lawyersGenerated = 0;

      for (let i = 0; i < count; i++) {
        const gender: Gender = malesGenerated < maleCount ? 'male' : 'female';
        if (gender === 'male') malesGenerated++;
        const role: Role = lawyersGenerated < lawyerCount ? 'lawyer' : 'expat';
        if (role === 'lawyer') lawyersGenerated++;
        const isEarly = markAsEarly && (i < Math.floor(count * earlyPercentage / 100));
        await generateOne(role, gender, countries, languages, minExperience, maxExperience, customPhoneNumber, useCustomPhone, isEarly);
        setGeneratedCount((n) => n + 1);
      }

      setSuccess(`${count} profils générés avec succès`);
      if (activeTab === 'manage') loadExistingProfiles();
    } catch (e: any) {
      console.error(e);
      setError(`Erreur: ${e.message || 'unknown'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateOne = async (
    role: Role, gender: Gender, countries: string[], languages: string[],
    minExperience: number, maxExperience: number, customPhoneNumber: string,
    useCustomPhone: boolean, isEarly: boolean = false
  ): Promise<string> => {
    const country = randomChoice(countries);
    const countryCode = getCountryCode(country);
    const { firstName, lastName, fullName } = genName(gender, country);
    const email = genEmail(firstName, lastName);
    const experience = randomInt(minExperience, maxExperience);
    const phone = useCustomPhone ? customPhoneNumber : '+33743331201';
    const selectedLanguages = pickLanguages(languages, country);
    const languageCodes = getLanguageCodesFromNames(selectedLanguages);

    // 📅 Date de création : toujours entre le 20 août 2025 et aujourd'hui
    const createdAt = randomDateBetween(START_DATE, TODAY);

    // 📆 Nombre de semaines depuis l'inscription (min 1)
    const rawWeeks = weeksSince(createdAt);
    const weeks = Math.max(1, rawWeeks);

    // 📞 1 à 3 appels par semaine
    const callsPerWeek = randomInt(1, 3);
    const totalCalls = Math.max(1, weeks * callsPerWeek);

    // ⭐ 1 à 2 avis par semaine depuis l'inscription
    const reviewsPerWeek = randomInt(1, 2);
    const reviewCount = Math.max(1, Math.min(totalCalls, weeks * reviewsPerWeek));

    const profilePhoto = '';
    const rating = isEarly ? Math.min(5.0, randomRating() + 0.2) : randomRating();

    const uid = `aaa_${role}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    let specialties: string[] = [];
    if (role === 'lawyer') {
      const count = randomInt(2, 4);
      while (specialties.length < count) {
        const s = randomChoice(LAWYER_SPECIALTIES);
        if (!specialties.includes(s)) specialties.push(s);
      }
    } else {
      const count = randomInt(2, 4);
      while (specialties.length < count) {
        const s = randomChoice(EXPAT_HELP_TYPES);
        if (!specialties.includes(s)) specialties.push(s);
      }
    }

    // ✅ Déterminer la langue principale pour le slug
    const mainLanguage = selectedLanguages[0] || 'Français';
    const langCode = getLanguageCode(mainLanguage);

    // ✅ Bio multilingue
    const bio = await getMultilingualBio(
      t,
      role,
      uid,
      specialties,
      country,
      experience
    );

    // 🆕 COORDONNÉES GPS RÉALISTES
    const mapLocation = getCountryCoordinates(country);
    
    // 🆕 TEMPS DE RÉPONSE VARIÉ
    const responseTime = getResponseTime() || '< 5 minutes';
    
    // 🆕 PAYS PRÉCÉDENTS (0-3)
    const previousCountries = getPreviousCountries(country, countries);

    // ✅ GÉNÉRATION DU SLUG SEO (70 caractères max)
    const profileSlug = generateSlug({
      firstName,
      lastName,
      role,
      country,
      languages: selectedLanguages,
      specialties,
      locale: langCode
    });

    console.log(`🔗 Slug généré: ${profileSlug} (${profileSlug.length} caractères)`);

   
 const baseUser: any = {
    uid, firstName, lastName, fullName, email, phone, phoneCountryCode: '+33',
    country: countryCode, currentCountry: countryCode, preferredLanguage: langCode, languages: languageCodes,
    profilePhoto, avatar: profilePhoto, isTestProfile: true, isActive: true,
    isApproved: true, isVerified: true, approvalStatus: 'approved', verificationStatus: 'approved',
    isOnline: false, isVisible: true,
    isVisibleOnMap: true, isCallable: formData.allowRealCalls,
    createdAt: Timestamp.fromDate(createdAt), updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(), role, isSOS: true, points: 0,
    affiliateCode: `AAA${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    referralBy: null, bio, 
    slug: profileSlug,
    responseTime,
    availability: 'available', totalCalls, totalEarnings: 0, averageRating: rating,
    rating, reviewCount, isEarlyProvider: isEarly,
    mapLocation,
  };

  // ✅ Ajouter earlyBadge seulement si isEarly est true
  if (isEarly) {
    baseUser.earlyBadge = role;
  }

    if (role === 'lawyer') {
      const lawSchool = getUniversity(country);
      const certificationKeys = getMultilingualCertifications(randomInt(1, 3));
      const graduationYear = getGraduationYear(experience, 27);
      
      Object.assign(baseUser, {
        specialties, practiceCountries: [countryCode], yearsOfExperience: experience,
        barNumber: `BAR${randomInt(10000, 99999)}`,
        lawSchool,
        graduationYear,
        certifications: certificationKeys,
        needsVerification: false, verificationStatus: 'approved',
      });
    } else {
      const previousCountryCodes = previousCountries.map(c => getCountryCode(c));
      const motivation = await getMultilingualMotivation(country, experience);
      
      Object.assign(baseUser, {
        helpTypes: specialties, specialties, residenceCountry: countryCode,
        yearsAsExpat: experience, yearsOfExperience: experience, 
        previousCountries: previousCountryCodes,
        motivation,
        needsVerification: false, verificationStatus: 'approved',
      });
    }

    // ✅ NETTOYER LES VALEURS UNDEFINED AVANT FIRESTORE
  const cleanBaseUser = Object.entries(baseUser).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as any);

  await setDoc(doc(db, 'users', uid), cleanBaseUser);

  const providerProfile: FirestoreData = {
    ...cleanBaseUser, uid, type: role, fullName, createdByAdmin: true, profileCompleted: true,
  };
    await setDoc(doc(db, 'sos_profiles', uid), providerProfile);

    const card = {
      id: uid, uid, title: fullName,
      subtitle: role === 'lawyer' ? 'Avocat' : 'Expatrié aidant',
      country, photo: profilePhoto, rating, reviewCount, languages: selectedLanguages,
      specialties: (providerProfile.specialties as string[]) || [],
      href: `/profile/${uid}`,
      slug: profileSlug,
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'ui_profile_cards', uid), card);
    await setDoc(doc(db, 'ui_profile_carousel', uid), card);

    const serviceType = role === 'lawyer' ? 'lawyer_call' : 'expat_call';
    
    // ✅ SOLUTION B : GÉNÉRATION DES AVIS AVEC PRÉNOMS UNIQUEMENT
    for (let j = 0; j < reviewCount; j++) {
      // Calculer la date de l'avis
      const daysSinceCreation = Math.floor((TODAY.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const reviewDaysAfterCreation = Math.floor((j / reviewCount) * daysSinceCreation);
      const reviewDate = new Date(createdAt.getTime() + reviewDaysAfterCreation * 24 * 60 * 60 * 1000);
      
      // Note entre 4.0 et 5.0
      const r = parseFloat((4.0 + Math.random()).toFixed(1));
      
      // ✅ GÉNÉRER UN PRÉNOM RÉALISTE DE CLIENT
      const clientGender: Gender = Math.random() > 0.5 ? 'male' : 'female';
      
      // 70% du pays du provider, 30% d'un autre pays aléatoire
      const clientCountryForName = Math.random() > 0.7 
        ? country 
        : randomChoice(countries);
      
      // ✅ Extraction du prénom uniquement
      const { firstName: clientFirstName } = genName(clientGender, clientCountryForName);
      
      // Obtenir un commentaire unique traduit
      const reviewComment = await getUniqueReviewComment(t, selectedLanguages, uid);
      
      // Créer l'avis dans Firestore
      await addDoc(collection(db, 'reviews'), {
        providerId: uid, 
        clientId: `aaa_client_${Date.now()}_${j}`,
        clientName: clientFirstName, // ✅ Prénom uniquement : "Marie", "John", "Somchai", etc.
        clientCountry: clientCountryForName, 
        rating: r,
        comment: reviewComment.text,
        commentKey: reviewComment.key,
        isPublic: true, 
        status: 'published',
        serviceType,
        createdAt: Timestamp.fromDate(reviewDate), 
        helpfulVotes: randomInt(0, 10),
      });
    }

    for (let j = 0; j < totalCalls; j++) {
      const daysSinceCreation = Math.floor((TODAY.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const callDaysAfterCreation = Math.floor((j / totalCalls) * daysSinceCreation);
      const callDate = new Date(createdAt.getTime() + callDaysAfterCreation * 24 * 60 * 60 * 1000);
      await addDoc(collection(db, 'calls'), {
        providerId: uid, providerName: fullName, clientId: `client_${j + 1}`,
        clientName: `Client ${j + 1}`, status: 'completed', duration: randomInt(15, 45),
        callType: 'video', createdAt: Timestamp.fromDate(callDate),
        updatedAt: Timestamp.fromDate(callDate), completedAt: Timestamp.fromDate(callDate),
      });
    }
    return uid;
  };

  const handleEditProfile = (profile: AaaProfile) => {
    setSelectedProfile(profile);
    setEditFormData({
      firstName: profile.firstName, lastName: profile.lastName, email: profile.email,
      phone: profile.phone, phoneCountryCode: profile.phoneCountryCode, country: profile.country,
      languages: profile.languages || [], specialties: profile.specialties || [],
      description: profile.description || '', isOnline: profile.isOnline, isVisible: profile.isVisible,
      isCallable: profile.isCallable, rating: profile.rating, reviewCount: profile.reviewCount,
      yearsOfExperience: profile.yearsOfExperience, isEarlyProvider: profile.isEarlyProvider,
      earlyBadge: profile.earlyBadge, type: profile.type || profile.role,
      lawSchool: profile.lawSchool,
      certifications: profile.certifications || [],
      motivation: profile.motivation,
      responseTime: profile.responseTime,
      previousCountries: profile.previousCountries || [],
      graduationYear: profile.graduationYear,
      mapLocation: profile.mapLocation,
      slug: profile.slug
    });
    setNewProfilePhoto(profile.profilePhoto);
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!selectedProfile) return;
    try {
      setIsLoading(true);
      const fullName = `${editFormData.firstName} ${editFormData.lastName}`.trim();
      
      // ✅ Régénérer le slug si nom/pays/langue changés
      let newSlug = editFormData.slug;
      if (
        editFormData.firstName !== selectedProfile.firstName ||
        editFormData.lastName !== selectedProfile.lastName ||
        editFormData.country !== selectedProfile.country ||
        JSON.stringify(editFormData.languages) !== JSON.stringify(selectedProfile.languages)
      ) {
        const mainLanguage = editFormData.languages?.[0] || 'Français';
        const langCode = getLanguageCode(mainLanguage);
        
        newSlug = generateSlug({
          firstName: editFormData.firstName || selectedProfile.firstName,
          lastName: editFormData.lastName || selectedProfile.lastName,
          role: (editFormData.type || selectedProfile.type) as 'lawyer' | 'expat',
          country: editFormData.country || selectedProfile.country,
          languages: editFormData.languages || selectedProfile.languages,
          specialties: editFormData.specialties || selectedProfile.specialties || [],
          locale: langCode
        });
        
        console.log(`🔄 Slug régénéré: ${newSlug}`);
      }
      
      const cleanData = Object.entries({
        ...editFormData,
        fullName,
        slug: newSlug,
        profilePhoto: newProfilePhoto, 
        avatar: newProfilePhoto, 
        photoURL: newProfilePhoto,
        updatedAt: serverTimestamp(),
      }).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      await updateDoc(doc(db, 'users', selectedProfile.id), cleanData);
      
      const sosProfileRef = doc(db, 'sos_profiles', selectedProfile.id);
      try {
        await updateDoc(sosProfileRef, cleanData);
      } catch (sosError: any) {
        if (sosError.code === 'not-found') {
          console.log('⚠️ sos_profiles inexistant, création...');
          await setDoc(sosProfileRef, {
            ...cleanData,
            uid: selectedProfile.id,
            createdAt: serverTimestamp(),
            createdByAdmin: true,
            profileCompleted: true
          });
        } else {
          throw sosError;
        }
      }
      
      const cardUpdate = {
        title: fullName,
        photo: newProfilePhoto,
        rating: editFormData.rating,
        reviewCount: editFormData.reviewCount,
        languages: editFormData.languages,
        specialties: editFormData.specialties,
        slug: newSlug,
        updatedAt: serverTimestamp()
      };
      
      try {
        await updateDoc(doc(db, 'ui_profile_cards', selectedProfile.id), cardUpdate);
      } catch (cardError: any) {
        if (cardError.code === 'not-found') {
          console.log('⚠️ ui_profile_cards inexistant, création...');
          await setDoc(doc(db, 'ui_profile_cards', selectedProfile.id), {
            id: selectedProfile.id,
            uid: selectedProfile.id,
            title: fullName,
            subtitle: editFormData.type === 'lawyer' ? 'Avocat' : 'Expatrié aidant',
            country: editFormData.country,
            photo: newProfilePhoto,
            rating: editFormData.rating,
            reviewCount: editFormData.reviewCount,
            languages: editFormData.languages,
            specialties: editFormData.specialties,
            href: `/profile/${selectedProfile.id}`,
            slug: newSlug,
            createdAt: serverTimestamp()
          });
        } else {
          console.warn('⚠️ Erreur mise à jour ui_profile_cards:', cardError);
        }
      }
      
      try {
        await updateDoc(doc(db, 'ui_profile_carousel', selectedProfile.id), cardUpdate);
      } catch (carouselError: any) {
        if (carouselError.code === 'not-found') {
          console.log('⚠️ ui_profile_carousel inexistant, création...');
          await setDoc(doc(db, 'ui_profile_carousel', selectedProfile.id), {
            id: selectedProfile.id,
            uid: selectedProfile.id,
            title: fullName,
            subtitle: editFormData.type === 'lawyer' ? 'Avocat' : 'Expatrié aidant',
            country: editFormData.country,
            photo: newProfilePhoto,
            rating: editFormData.rating,
            reviewCount: editFormData.reviewCount,
            languages: editFormData.languages,
            specialties: editFormData.specialties,
            href: `/profile/${selectedProfile.id}`,
            slug: newSlug,
            createdAt: serverTimestamp()
          });
        } else {
          console.warn('⚠️ Erreur mise à jour ui_profile_carousel:', carouselError);
        }
      }
      
      setShowEditModal(false);
      setSelectedProfile(null);
      await loadExistingProfiles();
      alert('✅ Profil mis à jour avec succès');
    } catch (e: any) {
      console.error('❌ Erreur mise à jour:', e);
      alert(`❌ Erreur: ${e.message || e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!selectedProfile) return;
    try {
      setIsLoading(true);
      await deleteDoc(doc(db, 'sos_profiles', selectedProfile.id));
      await deleteDoc(doc(db, 'users', selectedProfile.id));
      setShowDeleteModal(false);
      setSelectedProfile(null);
      await loadExistingProfiles();
      alert('Profil supprimé');
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVisibility = async (profileId: string, currentVisibility: boolean) => {
    try {
      const newVisibility = !currentVisibility;
      await updateDoc(doc(db, 'users', profileId), {
        isVisible: newVisibility, isVisibleOnMap: newVisibility, updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'sos_profiles', profileId), {
        isVisible: newVisibility, isVisibleOnMap: newVisibility, updatedAt: serverTimestamp(),
      });
      await loadExistingProfiles();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleOnline = async (profileId: string, currentOnline: boolean) => {
    const profile = existingProfiles.find((p) => p.id === profileId);
    if (!currentOnline && (!profile?.phone || profile.phone === '')) {
      alert('Numéro de téléphone requis');
      return;
    }
    try {
      const newOnline = !currentOnline;
      await updateDoc(doc(db, 'users', profileId), {
        isOnline: newOnline, availability: newOnline ? 'available' : 'offline', updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'sos_profiles', profileId), {
        isOnline: newOnline, availability: newOnline ? 'available' : 'offline', updatedAt: serverTimestamp(),
      });
      await loadExistingProfiles();
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkToggleOnline = async (online: boolean) => {
    if (selectedProfiles.length === 0) {
      alert('Sélectionnez au moins un profil');
      return;
    }
    if (online) {
      const missing = selectedProfiles.filter((id) => {
        const p = existingProfiles.find((x) => x.id === id);
        return !p?.phone;
      });
      if (missing.length > 0) {
        alert(`${missing.length} profils sans téléphone`);
        return;
      }
    }
    try {
      for (const id of selectedProfiles) {
        await updateDoc(doc(db, 'users', id), {
          isOnline: online, availability: online ? 'available' : 'offline', updatedAt: serverTimestamp(),
        });
        await updateDoc(doc(db, 'sos_profiles', id), {
          isOnline: online, availability: online ? 'available' : 'offline', updatedAt: serverTimestamp(),
        });
      }
      await loadExistingProfiles();
      setSelectedProfiles([]);
      alert(`${selectedProfiles.length} profils mis à jour`);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleSelectProfile = (id: string) => {
    setSelectedProfiles((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const ids = filteredProfiles.map((p) => p.id);
    setSelectedProfiles((prev) => (prev.length === ids.length ? [] : ids));
  };

  const handleEditLanguageToggle = (language: string) => {
    setEditFormData((prev) => ({
      ...prev,
      languages: prev.languages?.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...(prev.languages || []), language],
    }));
  };

  const handleEditCertificationToggle = (certification: string) => {
    setEditFormData((prev) => ({
      ...prev,
      certifications: prev.certifications?.includes(certification)
        ? prev.certifications.filter((c) => c !== certification)
        : [...(prev.certifications || []), certification],
    }));
  };

  const handleEditPreviousCountryToggle = (country: string) => {
    setEditFormData((prev) => ({
      ...prev,
      previousCountries: prev.previousCountries?.includes(country)
        ? prev.previousCountries.filter((c) => c !== country)
        : [...(prev.previousCountries || []), country],
    }));
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Profils AAA</h1>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('generate')} className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center ${activeTab === 'generate' ? 'bg-red-600 text-white hover:bg-red-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              <UserPlus className="mr-2" size={18} /> Générer
            </button>
            <button onClick={() => setActiveTab('manage')} className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center ${activeTab === 'manage' ? 'bg-red-600 text-white hover:bg-red-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              <List className="mr-2" size={18} /> Gérer ({existingProfiles.length})
            </button>
            <button onClick={() => setActiveTab('planner')} className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center ${activeTab === 'planner' ? 'bg-red-600 text-white hover:bg-red-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              <Calendar className="mr-2" size={18} /> Planner
            </button>
          </div>
        </div>

        {activeTab === 'generate' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Paramètres de génération</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de profils</label>
                <input type="number" min={1} max={200} value={formData.count} onChange={(e) => setFormData((p) => ({ ...p, count: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Distribution Rôles</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Avocats</span>
                        <span>{formData.roleDistribution.lawyer}%</span>
                      </label>
                      <input type="range" min={0} max={100} step={5} value={formData.roleDistribution.lawyer} onChange={(e) => { const v = Number(e.target.value); setFormData((p) => ({ ...p, roleDistribution: { lawyer: v, expat: 100 - v } })); }} className="w-full" />
                    </div>
                    <div>
                      <label className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Expatriés</span>
                        <span>{formData.roleDistribution.expat}%</span>
                      </label>
                      <input type="range" min={0} max={100} step={5} value={formData.roleDistribution.expat} onChange={(e) => { const v = Number(e.target.value); setFormData((p) => ({ ...p, roleDistribution: { lawyer: 100 - v, expat: v } })); }} className="w-full" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Distribution Genre</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Hommes</span>
                        <span>{formData.genderDistribution.male}%</span>
                      </label>
                      <input type="range" min={0} max={100} step={5} value={formData.genderDistribution.male} onChange={(e) => { const v = Number(e.target.value); setFormData((p) => ({ ...p, genderDistribution: { male: v, female: 100 - v } })); }} className="w-full" />
                    </div>
                    <div>
                      <label className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Femmes</span>
                        <span>{formData.genderDistribution.female}%</span>
                      </label>
                      <input type="range" min={0} max={100} step={5} value={formData.genderDistribution.female} onChange={(e) => { const v = Number(e.target.value); setFormData((p) => ({ ...p, genderDistribution: { male: 100 - v, female: v } })); }} className="w-full" />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    Pays ({formData.countries.length} sélectionnés)
                  </h3>
                  <button
                    type="button"
                    onClick={handleSelectAllCountries}
                    className="text-xs px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
                  >
                    {formData.countries.length === COUNTRIES_LIST.length ? '❌ Désélectionner tout' : '✅ Sélectionner tout'}
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {COUNTRIES_LIST.map((country: string) => (
                      <label key={country} className="flex items-center text-sm">
                        <input type="checkbox" checked={formData.countries.includes(country)} onChange={() => handleCountryToggle(country)} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mr-2" />
                        {country}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">
                    Langues ({formData.languages.length} sélectionnées)
                  </h3>
                  <button
                    type="button"
                    onClick={handleSelectAllLanguages}
                    className="text-xs px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
                  >
                    {formData.languages.length === LANGUAGE_OPTIONS.length ? '❌ Désélectionner tout' : '✅ Sélectionner tout'}
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {LANGUAGE_OPTIONS.map((language: string) => (
                      <label key={language} className="flex items-center text-sm">
                        <input type="checkbox" checked={formData.languages.includes(language)} onChange={() => handleLanguageToggle(language)} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mr-2" />
                        {language}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center mb-3">
                  <input id="useCustomPhone" type="checkbox" checked={formData.useCustomPhone} onChange={(e) => setFormData((p) => ({ ...p, useCustomPhone: e.target.checked }))} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                  <label htmlFor="useCustomPhone" className="ml-2 text-sm font-medium text-gray-700">Utiliser un numéro personnalisé</label>
                </div>
                {formData.useCustomPhone && (
                  <>
                    <input type="text" placeholder="+33743331201" value={formData.customPhoneNumber} onChange={(e) => setFormData((p) => ({ ...p, customPhoneNumber: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                    <p className="text-xs text-gray-500 mt-1">Format international</p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Expérience (années)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Min</label>
                      <input type="number" min={1} max={50} value={formData.minExperience} onChange={(e) => setFormData((p) => ({ ...p, minExperience: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Max</label>
                      <input type="number" min={1} max={50} value={formData.maxExperience} onChange={(e) => setFormData((p) => ({ ...p, maxExperience: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Âge</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Min</label>
                      <input type="number" min={23} max={80} value={formData.minAge} onChange={(e) => setFormData((p) => ({ ...p, minAge: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Max</label>
                      <input type="number" min={23} max={80} value={formData.maxAge} onChange={(e) => setFormData((p) => ({ ...p, maxAge: Number(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">⚠️ Minimum : 23 ans pour expatriés, 27 ans pour avocats</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                  <Star className="mr-2" size={20} />
                  Early Providers
                </h3>
                <label className="flex items-center mb-3">
                  <input type="checkbox" checked={formData.markAsEarly} onChange={(e) => setFormData(p => ({ ...p, markAsEarly: e.target.checked }))} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                  <span className="ml-2 text-sm text-gray-700">Marquer comme Early Providers</span>
                </label>
                {formData.markAsEarly && (
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pourcentage</label>
                    <input type="number" min={1} max={100} value={formData.earlyPercentage} onChange={(e) => setFormData(p => ({ ...p, earlyPercentage: parseInt(e.target.value, 10) }))} className="w-24 px-3 py-2 border border-gray-300 rounded-md" />
                    <p className="text-xs text-gray-500 mt-1">{Math.floor(formData.count * formData.earlyPercentage / 100)} profils sur {formData.count}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input id="allowRealCalls" type="checkbox" checked={formData.allowRealCalls} onChange={(e) => setFormData((p) => ({ ...p, allowRealCalls: e.target.checked }))} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                <label htmlFor="allowRealCalls" className="ml-2 block text-sm text-gray-700">Autoriser les appels réels</label>
              </div>

              <div className="pt-4">
                <button onClick={generateAaaProfiles} disabled={isGenerating} className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
                  {isGenerating ? (
                    <>
                      <Loader className="animate-spin mr-2" size={20} />
                      Génération {generatedCount}/{formData.count}
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2" size={20} />
                      Générer {formData.count} profils
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                      <div className="mt-2 text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <Check className="h-5 w-5 text-green-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Succès</h3>
                      <div className="mt-2 text-sm text-green-700">{success}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'manage' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Profils ({filteredProfiles.length})
              </h3>
              <div className="flex items-center space-x-4">
                {selectedProfiles.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleBulkToggleOnline(true)} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors">
                      🟢 En ligne ({selectedProfiles.length})
                    </button>
                    <button onClick={() => handleBulkToggleOnline(false)} className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors">
                      ⚫ Hors ligne ({selectedProfiles.length})
                    </button>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <button onClick={() => setRoleFilter('all')} className={`px-3 py-1 text-sm rounded transition-colors ${roleFilter === 'all' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    Tous
                  </button>
                  <button onClick={() => setRoleFilter('lawyer')} className={`px-3 py-1 text-sm rounded transition-colors flex items-center ${roleFilter === 'lawyer' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    <Scale className="mr-1" size={14} /> Avocats
                  </button>
                  <button onClick={() => setRoleFilter('expat')} className={`px-3 py-1 text-sm rounded transition-colors flex items-center ${roleFilter === 'expat' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                    <Users className="mr-1" size={14} /> Expatriés
                  </button>
                </div>

                <div className="relative">
                  <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
                <button onClick={loadExistingProfiles} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center">
                  <RefreshCw size={16} className="mr-2" />
                  Actualiser
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input type="checkbox" checked={selectedProfiles.length === filteredProfiles.length && filteredProfiles.length > 0} onChange={handleSelectAll} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profil</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pays</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Téléphone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créé le</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoadingProfiles ? (
                      <tr>
                        <td colSpan={11} className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                          </div>
                          <p className="mt-2 text-gray-500">Chargement...</p>
                        </td>
                      </tr>
                    ) : filteredProfiles.length > 0 ? (
                      filteredProfiles.map((profile) => (
                        <tr key={profile.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input type="checkbox" checked={selectedProfiles.includes(profile.id)} onChange={() => handleSelectProfile(profile.id)} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              {profile.profilePhoto ? (
                                <img 
                                  src={profile.profilePhoto} 
                                  alt={profile.fullName} 
                                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-300" 
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-400">
                                  <span className="text-2xl">📷</span>
                                </div>
                              )}
                              
                              <button
                                onClick={() => handleEditProfile(profile)}
                                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                title="Modifier la photo"
                                disabled={uploadingPhotoFor === profile.id}
                              >
                                {uploadingPhotoFor === profile.id ? (
                                  <Loader className="animate-spin" size={18} />
                                ) : (
                                  <Edit size={18} />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {profile.firstName} {profile.lastName.charAt(0)}.
                                </div>
                                <div className="text-sm text-gray-500">{profile.email}</div>
                                {profile.isEarlyProvider && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                    🏷️ {profile.earlyBadge === 'lawyer' ? 'Early Lawyer' : 'Early Expat'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${(profile.type || profile.role) === 'lawyer' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                              {(profile.type || profile.role) === 'lawyer' ? 'Avocat' : 'Expatrié'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{profile.country}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star key={i} size={14} className={i < Math.floor(profile.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'} />
                              ))}
                              <span className="ml-1">{(profile.rating || 0).toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              📞 {profile.totalCalls || 0} appels • ⭐ {profile.reviewCount} avis
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {profile.phone || 'Non renseigné'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${profile.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {profile.isOnline ? '🟢 En ligne' : '⚫ Hors ligne'}
                              </span>
                              {!profile.isVisible && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Caché</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {profile.createdAt ? formatDate(new Date(profile.createdAt)) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 max-w-xs truncate" title={profile.slug}>
                            {profile.slug ? (
                              <span className="font-mono text-blue-600">
                                {profile.slug.length > 30 ? `${profile.slug.substring(0, 30)}...` : profile.slug}
                              </span>
                            ) : (
                              <span className="text-red-500">❌ Aucun</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => window.open(`/profile/${profile.id}`, '_blank')} 
                                className="text-blue-600 hover:text-blue-800" 
                                title="Voir"
                              >
                                <Eye size={18} />
                              </button>
                              <button onClick={() => handleEditProfile(profile)} className="text-green-600 hover:text-green-800" title="Éditer">
                                <Edit size={18} />
                              </button>
                              <button onClick={() => handleToggleOnline(profile.id, profile.isOnline)} className={`${profile.isOnline ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`} title={profile.isOnline ? 'Mettre hors ligne' : 'Mettre en ligne'} disabled={!profile.isOnline && (!profile.phone || profile.phone === '')}>
                                {profile.isOnline ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                              <button onClick={() => handleToggleVisibility(profile.id, profile.isVisible)} className={`${profile.isVisible ? 'text-yellow-600 hover:text-yellow-800' : 'text-gray-600 hover:text-gray-800'}`} title={profile.isVisible ? 'Cacher' : 'Afficher'}>
                                {profile.isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                              <button onClick={() => { setSelectedProfile(profile); setShowDeleteModal(true); }} className="text-red-600 hover:text-red-800" title="Supprimer">
                                <Trash size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={11} className="px-6 py-4 text-center text-gray-500">
                          Aucun profil trouvé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'planner' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Planificateur</h2>
            <p className="text-sm text-gray-600 mb-6">Automatisation de la génération de profils</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activer</label>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={planner.enabled} readOnly />
                  <span className="text-sm text-gray-600">Actif</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre par jour</label>
                <input type="number" min={1} max={200} value={planner.dailyCount} readOnly className="w-full px-3 py-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                <select value={planner.role} disabled className="w-full px-3 py-2 border rounded">
                  <option value="lawyer">Avocat</option>
                  <option value="expat">Expatrié</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-6">Fonctionnalité à venir</p>
          </div>
        )}

        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Éditer le profil" size="large">
          {selectedProfile && (
            <div className="space-y-4 max-h-[80vh] overflow-y-auto px-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input type="text" value={editFormData.firstName || ''} onChange={(e) => setEditFormData((p) => ({ ...p, firstName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input type="text" value={editFormData.lastName || ''} onChange={(e) => setEditFormData((p) => ({ ...p, lastName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={editFormData.email || ''} onChange={(e) => setEditFormData((p) => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input type="text" value={editFormData.phone || ''} onChange={(e) => setEditFormData((p) => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="+33743331201" />
                  <p className="text-xs text-gray-500 mt-1">Format international</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo de profil</label>
                <div className="flex items-center space-x-4">
                  {newProfilePhoto ? (
                    <img src={newProfilePhoto} alt="Photo" className="w-20 h-20 rounded-full object-cover border-2 border-gray-300" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-dashed border-gray-400">
                      <span className="text-gray-400">?</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <Suspense fallback={<div>Chargement...</div>}>
                      <ImageUploader
                        currentImage={newProfilePhoto}
                        onImageUploaded={(url) => setNewProfilePhoto(url)}
                        uploadPath="profile_photos"
                        maxSizeMB={5}
                        isRegistration={false}
                      />
                    </Suspense>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, WEBP jusqu'à 5MB</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Langues parlées ({editFormData.languages?.length || 0} sélectionnées)
                </h3>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {LANGUAGE_OPTIONS.map((language: string) => (
                      <label key={language} className="flex items-center text-sm">
                        <input type="checkbox" checked={editFormData.languages?.includes(language) || false} onChange={() => handleEditLanguageToggle(language)} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mr-2" />
                        {language}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {(editFormData.type || editFormData.role) === 'lawyer' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Université / École de droit</label>
                    <input 
                      type="text" 
                      value={editFormData.lawSchool || ''} 
                      onChange={(e) => setEditFormData((p) => ({ ...p, lawSchool: e.target.value }))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                      placeholder="Ex: Université Paris 1 Panthéon-Sorbonne"
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Certifications ({editFormData.certifications?.length || 0} sélectionnées)
                    </h3>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.keys(CERTIFICATIONS_MULTILINGUE).map((certKey: string) => (
                          <label key={certKey} className="flex items-center text-sm">
                            <input 
                              type="checkbox" 
                              checked={editFormData.certifications?.includes(certKey) || false} 
                              onChange={() => handleEditCertificationToggle(certKey)} 
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mr-2" 
                            />
                            {CERTIFICATIONS_MULTILINGUE[certKey].fr}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Année de diplôme</label>
                    <input 
                      type="number" 
                      min={1960} 
                      max={new Date().getFullYear()} 
                      value={editFormData.graduationYear || ''} 
                      onChange={(e) => setEditFormData((p) => ({ ...p, graduationYear: parseInt(e.target.value, 10) }))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                    />
                  </div>
                </>
              )}

              {(editFormData.type || editFormData.role) === 'expat' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Motivation / Présentation (Français)</label>
                    <textarea 
                      value={typeof editFormData.motivation === 'string' ? editFormData.motivation : (editFormData.motivation as Record<string, string>)?.fr || ''} 
                      onChange={(e) => {
                        if (typeof editFormData.motivation === 'object') {
                          setEditFormData((p) => ({ 
                            ...p, 
                            motivation: {
                              ...(p.motivation as Record<string, string>),
                              fr: e.target.value
                            }
                          }));
                        } else {
                          setEditFormData((p) => ({ ...p, motivation: e.target.value }));
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                      rows={3}
                      placeholder="Ex: Passionné par l'aide aux expatriés à..."
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Pays précédents ({editFormData.previousCountries?.length || 0} sélectionnés)
                    </h3>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {COUNTRIES_LIST.filter(c => c !== editFormData.country).map((country: string) => (
                          <label key={country} className="flex items-center text-sm">
                            <input 
                              type="checkbox" 
                              checked={editFormData.previousCountries?.includes(country) || false} 
                              onChange={() => handleEditPreviousCountryToggle(country)} 
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mr-2" 
                            />
                            {country}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temps de réponse</label>
                <select 
                  value={editFormData.responseTime || '< 5 minutes'} 
                  onChange={(e) => setEditFormData((p) => ({ ...p, responseTime: e.target.value }))} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {RESPONSE_TIMES.map((time: string) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Localisation GPS</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Latitude</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      value={editFormData.mapLocation?.lat || ''} 
                      onChange={(e) => setEditFormData((p) => ({ 
                        ...p, 
                        mapLocation: { ...p.mapLocation!, lat: parseFloat(e.target.value) } 
                      }))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Longitude</label>
                    <input 
                      type="number" 
                      step="0.0001"
                      value={editFormData.mapLocation?.lng || ''} 
                      onChange={(e) => setEditFormData((p) => ({ 
                        ...p, 
                        mapLocation: { ...p.mapLocation!, lng: parseFloat(e.target.value) } 
                      }))} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" 
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Coordonnées pour affichage sur la carte</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                  <input type="number" min={3} max={5} step={0.1} value={editFormData.rating || 4.5} onChange={(e) => setEditFormData((p) => ({ ...p, rating: parseFloat(e.target.value) }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre d'avis</label>
                  <input type="number" min={0} max={100} value={editFormData.reviewCount || 5} onChange={(e) => setEditFormData((p) => ({ ...p, reviewCount: parseInt(e.target.value, 10) }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expérience (années)</label>
                  <input type="number" min={1} max={50} value={editFormData.yearsOfExperience || 5} onChange={(e) => setEditFormData((p) => ({ ...p, yearsOfExperience: parseInt(e.target.value, 10) }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <div className="flex items-center space-x-4">
                  <button type="button" onClick={() => setEditFormData(p => ({ ...p, isOnline: true }))} className={`flex-1 px-4 py-3 rounded-md transition-colors font-medium ${editFormData.isOnline ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    🟢 En ligne
                  </button>
                  <button type="button" onClick={() => setEditFormData(p => ({ ...p, isOnline: false }))} className={`flex-1 px-4 py-3 rounded-md transition-colors font-medium ${!editFormData.isOnline ? 'bg-gray-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    ⚫ Hors ligne
                  </button>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Early Provider</label>
                <label className="flex items-center">
                  <input type="checkbox" checked={!!editFormData.isEarlyProvider} onChange={(e) => setEditFormData(p => ({ ...p, isEarlyProvider: e.target.checked, earlyBadge: e.target.checked ? ((p.type || p.role) === 'lawyer' ? 'lawyer' : 'expat') : undefined }))} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                  <span className="ml-2 text-sm text-gray-700">Marquer comme Early Provider</span>
                </label>
                {editFormData.isEarlyProvider && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                    {(editFormData.type || editFormData.role) === 'lawyer' ? '🏷️ Early Lawyer' : '🏷️ Early Expat'}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <label className="flex items-center">
                  <input type="checkbox" checked={!!editFormData.isVisible} onChange={(e) => setEditFormData((p) => ({ ...p, isVisible: e.target.checked }))} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                  <span className="ml-2 text-sm text-gray-700">Visible</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" checked={!!editFormData.isCallable} onChange={(e) => setEditFormData((p) => ({ ...p, isCallable: e.target.checked }))} className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                  <span className="ml-2 text-sm text-gray-700">Appelable</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t sticky bottom-0 bg-white">
                <button onClick={() => setShowEditModal(false)} disabled={isLoading} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button onClick={handleSaveProfile} disabled={isLoading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors flex items-center">
                  {isLoading ? <Loader className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
                  Enregistrer
                </button>
              </div>
            </div>
          )}
        </Modal>

        <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Supprimer le profil" size="small">
          {selectedProfile && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Attention</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        Confirmer la suppression de :
                        <br />
                        <strong>{selectedProfile.fullName}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button onClick={() => setShowDeleteModal(false)} disabled={isLoading} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button onClick={handleDeleteProfile} disabled={isLoading} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors flex items-center">
                  {isLoading ? <Loader className="animate-spin mr-2" size={16} /> : <Trash className="mr-2" size={16} />}
                  Supprimer
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdminAaaProfiles;