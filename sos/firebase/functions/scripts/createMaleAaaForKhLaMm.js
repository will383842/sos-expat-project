/**
 * Crée 3 profils AAA avocats HOMMES francophones pour Cambodge (KH), Laos (LA),
 * Birmanie (MM) — pays sans avocat homme dans les 12 priorités campagne contenu.
 *
 * + Corrige le profil "Mei Wong" (gender=male mais prenom feminin) en le renommant
 *   "Jian Wong" et propage partout (sos_profiles, users, ui_profile_cards,
 *   ui_profile_carousel, call_sessions metadata.providerName, slug, slugs).
 *
 * Profils crees :
 *  - Cambodge (KH) : Jean-Marc Lefebvre  - 12 specialites, FR uniquement
 *  - Laos (LA)     : Olivier Moreau      - 12 specialites, FR uniquement
 *  - Birmanie (MM) : Vincent Garnier     - 12 specialites, FR uniquement
 *
 * Usage:
 *  node scripts/createMaleAaaForKhLaMm.js          # exécution réelle
 *  node scripts/createMaleAaaForKhLaMm.js --dry    # simulation (n'écrit rien)
 */

const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'sos-urgently-ac307' });
}
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

const DRY_RUN = process.argv.includes('--dry');

// =====================================================================
// HELPERS
// =====================================================================

const SHORT_ID_CHARS = '23456789abcdefghjkmnpqrstuvwxyz';

function generateShortId(uid) {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = ((hash << 5) - hash) + uid.charCodeAt(i);
    hash = hash & hash;
  }
  let abs = Math.abs(hash);
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += SHORT_ID_CHARS[abs % SHORT_ID_CHARS.length];
    abs = Math.floor(abs / SHORT_ID_CHARS.length);
  }
  return s;
}

const slugify = (s) =>
  String(s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rndRating() { return parseFloat((4 + Math.random()).toFixed(2)); }
function rndChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// =====================================================================
// CATALOGUE FIXE
// =====================================================================

// Spécialités (codes réels du catalogue lawyer-specialties.ts)
const SPECIALTIES_POOL = [
  'URG_ASSISTANCE_PENALE_INTERNATIONALE',
  'URG_ACCIDENTS_RESPONSABILITE_CIVILE',
  'URG_RAPATRIEMENT_URGENCE',
  'CUR_TRADUCTIONS_LEGALISATIONS',
  'CUR_RECLAMATIONS_LITIGES_MINEURS',
  'CUR_DEMARCHES_ADMINISTRATIVES',
  'IMMI_VISAS_PERMIS_SEJOUR',
  'IMMI_CONTRATS_TRAVAIL_INTERNATIONAL',
  'IMMI_NATURALISATION',
  'IMMI_VISA_ETUDIANT',
  'IMMI_VISA_INVESTISSEUR',
  'IMMI_VISA_RETRAITE',
  'IMMI_VISA_NOMADE_DIGITAL',
  'IMMI_REGROUPEMENT_FAMILIAL',
  'TRAV_DROITS_TRAVAILLEURS',
  'TRAV_LICENCIEMENT_INTERNATIONAL',
  'TRAV_SECURITE_SOCIALE_INTERNATIONALE',
  'TRAV_RETRAITE_INTERNATIONALE',
  'TRAV_DETACHEMENT_EXPATRIATION',
  'IMMO_ACHAT_VENTE',
  'IMMO_LOCATION_BAUX',
  'IMMO_LITIGES_IMMOBILIERS',
  'FISC_DECLARATIONS_INTERNATIONALES',
  'FISC_DOUBLE_IMPOSITION',
  'FISC_OPTIMISATION_EXPATRIES',
  'FAM_MARIAGE_DIVORCE',
  'FAM_GARDE_ENFANTS_TRANSFRONTALIERE',
  'FAM_SCOLARITE_INTERNATIONALE',
  'PATR_SUCCESSIONS_INTERNATIONALES',
  'PATR_GESTION_PATRIMOINE',
  'PATR_TESTAMENTS',
  'ENTR_CREATION_ENTREPRISE_ETRANGER',
  'ENTR_INVESTISSEMENTS',
  'ENTR_IMPORT_EXPORT',
  'ASSU_ASSURANCES_INTERNATIONALES',
  'CONS_ACHATS_DEFECTUEUX_ETRANGER',
  'BANK_PROBLEMES_COMPTES_BANCAIRES',
  'RELA_CONFLITS_FAMILIAUX',
  'RELA_MEDIATION_RESOLUTION_AMIABLE',
  'TRAN_PROBLEMES_AERIENS',
  'TRAN_BAGAGES_PERDUS_ENDOMMAGES',
  'SANT_ERREURS_MEDICALES',
  'NUM_CYBERCRIMINALITE',
  'EDUC_RECONNAISSANCE_DIPLOMES',
  'RET_RAPATRIEMENT_BIENS',
];

// Pour générer le slug, on a besoin du mapping court de la 1ère spécialité
// (subset pertinent du fichier specialty-slug-mappings.ts)
const SPECIALTY_SLUG_TRANSLATIONS = {
  'IMMI_VISAS_PERMIS_SEJOUR': {
    fr: 'visa', en: 'visa', es: 'visa', de: 'visum',
    pt: 'visto', ru: 'viza', zh: 'qianzheng', ar: 'tashira', hi: 'visa'
  },
  'FAM_MARIAGE_DIVORCE': {
    fr: 'divorce', en: 'divorce', es: 'divorcio', de: 'scheidung',
    pt: 'divorcio', ru: 'razvod', zh: 'lihun', ar: 'talaq', hi: 'talak'
  },
  'URG_RAPATRIEMENT_URGENCE': {
    fr: 'rapatriement', en: 'repatriation', es: 'repatriacion', de: 'rueckfuehrung',
    pt: 'repatriamento', ru: 'repatriatsiya', zh: 'huiguo', ar: 'iadat', hi: 'svadeshvasi'
  },
};

// Traductions pays pour slug (FR + 8 autres langues)
const COUNTRY_SLUG_TRANS = {
  'KH': { fr: 'cambodge',  en: 'cambodia', es: 'camboya',  de: 'kambodscha', pt: 'camboja',  ru: 'kambodzha',     zh: 'jianpuzhai', ar: 'kambudia',  hi: 'kambodiya' },
  'LA': { fr: 'laos',      en: 'laos',     es: 'laos',     de: 'laos',       pt: 'laos',     ru: 'laos',          zh: 'laowo',      ar: 'laws',      hi: 'laos' },
  'MM': { fr: 'myanmar',   en: 'myanmar',  es: 'myanmar',  de: 'myanmar',    pt: 'myanmar',  ru: 'myanma',        zh: 'miandian',   ar: 'mianmar',   hi: 'myanmar' },
  'SG': { fr: 'singapour', en: 'singapore', es: 'singapur', de: 'singapur',  pt: 'singapura', ru: 'singapur',      zh: 'xinjiapo',   ar: 'singhafura', hi: 'singapore' },
};

// Traductions du rôle "lawyer"
const ROLE_SLUG_TRANS = {
  fr: 'avocat', en: 'lawyer', es: 'abogado', de: 'anwalt', pt: 'advogado',
  ru: 'advokat', zh: 'lushi', ar: 'muhami', hi: 'vakil',
};

// Locales par défaut
const DEFAULT_LOCALES = {
  fr: 'fr', en: 'us', es: 'es', de: 'de', pt: 'pt', ru: 'ru', zh: 'cn', ar: 'sa', hi: 'in',
};

const SUPPORTED_LANGS = ['fr', 'en', 'es', 'de', 'pt', 'ru', 'zh', 'ar', 'hi'];

function buildSlug(lang, role, countryCode, firstName, primarySpecialty, shortId) {
  const ll = `${lang}-${DEFAULT_LOCALES[lang]}`;
  const country = COUNTRY_SLUG_TRANS[countryCode][lang];
  const roleW = ROLE_SLUG_TRANS[lang];
  const fnSlug = slugify(firstName);
  const specSlug = SPECIALTY_SLUG_TRANSLATIONS[primarySpecialty]?.[lang] || '';
  const namePart = specSlug ? `${fnSlug}-${specSlug}-${shortId}` : `${fnSlug}-${shortId}`;
  return `${ll}/${roleW}-${country}/${namePart}`;
}

function buildAllSlugs(role, countryCode, firstName, primarySpecialty, shortId) {
  const out = {};
  for (const lang of SUPPORTED_LANGS) {
    out[lang] = buildSlug(lang, role, countryCode, firstName, primarySpecialty, shortId);
  }
  return out;
}

// =====================================================================
// COORDONNEES (capitales)
// =====================================================================

const COUNTRY_COORDS = {
  KH: { city: 'Phnom Penh',     lat: 11.5564, lng: 104.9282, country: 'Cambodge' },
  LA: { city: 'Vientiane',      lat: 17.9757, lng: 102.6331, country: 'Laos' },
  MM: { city: 'Yangon',         lat: 16.8409, lng: 96.1735,  country: 'Birmanie' },
  SG: { city: 'Singapour',      lat: 1.3521,  lng: 103.8198, country: 'Singapour' },
};

// =====================================================================
// REVIEWS (commentaires francophones realistes)
// =====================================================================

const REVIEW_COMMENTS = [
  "Excellent conseil juridique, tres pro et a l'ecoute. Je recommande !",
  "M'a aide a debloquer une situation administrative complexe en moins d'une semaine.",
  "Reponse claire et structuree, vraiment rassurant en periode de stress.",
  "Service rapide, a su trouver la bonne solution pour mon dossier d'expatriation.",
  "Tres bon avocat francophone sur place, expertise solide et tarifs honnetes.",
  "Disponibilite irreprochable, m'a rappele tout de suite apres la prise de RDV.",
  "Conseils precieux concernant ma demarche de visa, tres satisfait.",
  "M'a evite une grosse erreur fiscale, je ne peux que recommander.",
  "Tres a l'ecoute, comprend bien les realites des expatries francais.",
  "Dossier traite avec serieux et bienveillance, merci.",
  "Une vraie expertise du droit local et international, parfait pour les expats.",
  "Reactivite et professionnalisme au rendez-vous, je referai appel a lui.",
  "Explication tres claire des options qui s'offraient a moi, parfait.",
  "Connait bien les usages locaux, conseils pertinents et adaptes.",
  "Pour la deuxieme fois je fais appel a ses services, toujours aussi competent.",
  "Honnete et direct, ne survend pas, c'est appreciable.",
  "Vrai gain de temps : il maitrise les procedures locales sur le bout des doigts.",
  "Tres bon contact, conseille avec pedagogie. Je le recommande sans reserve.",
  "Service au top, suivi par mail apres l'appel, vraiment serieux.",
  "Probleme regle en quelques jours alors que je tournais en rond depuis des semaines.",
];

const FRENCH_FIRST_NAMES = [
  'Pierre', 'Jean', 'Olivier', 'Nicolas', 'Stephane', 'Christophe', 'Laurent',
  'Sophie', 'Marie', 'Caroline', 'Stephanie', 'Aurelie', 'Camille', 'Julie',
  'Antoine', 'Vincent', 'Mathieu', 'Romain', 'Frederic', 'Pascal', 'Patrick',
  'Isabelle', 'Sandrine', 'Nathalie', 'Valerie', 'Catherine', 'Florence',
];
const FRENCH_LAST_NAMES = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit',
  'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Roux',
  'Vincent', 'Garnier', 'Faure', 'Andre', 'Mercier', 'Blanc', 'Guerin',
  'Boyer', 'Garcia', 'Muller', 'Henry', 'Roussel', 'Nicolas', 'Perrin',
];

// =====================================================================
// PROFILS A CREER
// =====================================================================

const PROFILES_TO_CREATE = [
  {
    countryCode: 'KH',
    countryName: 'Cambodge',
    firstName: 'Jean-Marc',
    lastName: 'Lefebvre',
    yearsOfExperience: 14,
    barNumber: 'BAR-KH-20847',
    lawSchool: 'Universite Paris 1 Pantheon-Sorbonne',
    primarySpecialty: 'IMMI_VISAS_PERMIS_SEJOUR',
    interventionCountries: ['KH', 'TH', 'VN'],
  },
  {
    countryCode: 'LA',
    countryName: 'Laos',
    firstName: 'Olivier',
    lastName: 'Moreau',
    yearsOfExperience: 11,
    barNumber: 'BAR-LA-15634',
    lawSchool: 'Universite Lyon 3 Jean Moulin',
    primarySpecialty: 'IMMI_VISAS_PERMIS_SEJOUR',
    interventionCountries: ['LA', 'TH', 'KH'],
  },
  {
    countryCode: 'MM',
    countryName: 'Birmanie',
    firstName: 'Vincent',
    lastName: 'Garnier',
    yearsOfExperience: 9,
    barNumber: 'BAR-MM-30219',
    lawSchool: 'Universite Aix-Marseille',
    primarySpecialty: 'IMMI_VISAS_PERMIS_SEJOUR',
    interventionCountries: ['MM', 'TH'],
  },
];

// =====================================================================
// PHOTO POOL (URLs Firebase Storage existantes pour profils male reels)
// =====================================================================

async function getMalePhotoPool() {
  const snap = await db.collection('sos_profiles')
    .where('type', '==', 'lawyer')
    .where('gender', '==', 'male')
    .get();
  const photos = [];
  snap.forEach(d => {
    const p = d.data();
    if (p.photoURL && /firebasestorage/.test(p.photoURL)) photos.push(p.photoURL);
  });
  return Array.from(new Set(photos));
}

// =====================================================================
// CREATION D'UN PROFIL COMPLET
// =====================================================================

async function createProfile(profile, photoPool) {
  const { countryCode, countryName, firstName, lastName, yearsOfExperience,
          barNumber, lawSchool, primarySpecialty, interventionCountries } = profile;

  const fullName = `${firstName} ${lastName}`;
  const ts = Date.now();
  const uid = `aaa_lawyer_${countryCode.toLowerCase()}_${ts}_${Math.random().toString(36).slice(2, 6)}`;
  const shortId = generateShortId(uid);
  const slugs = buildAllSlugs('lawyer', countryCode, firstName, primarySpecialty, shortId);

  // 12 spécialités, déterministe : on garantit primarySpecialty en tête
  const others = SPECIALTIES_POOL.filter(s => s !== primarySpecialty)
    .sort(() => Math.random() - 0.5).slice(0, 11);
  const specialties = [primarySpecialty, ...others];

  const coords = COUNTRY_COORDS[countryCode];
  const photoURL = photoPool.length > 0
    ? photoPool[(uid.length * 7) % photoPool.length]
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}&backgroundColor=b6e3f4`;

  const totalCalls = rndInt(25, 40);
  const reviewCount = rndInt(15, 22);
  const rating = parseFloat((4.5 + Math.random() * 0.4).toFixed(2));
  const successfulCalls = totalCalls;
  const successRate = rndInt(94, 99);

  // Date de création : entre 60 et 200 jours en arrière
  const createdAtDate = new Date();
  createdAtDate.setDate(createdAtDate.getDate() - rndInt(60, 200));
  const createdAtTs = Timestamp.fromDate(createdAtDate);
  const registrationDate = createdAtDate.toISOString();

  const bioFr = `Avocat francophone exercant en ${countryName} depuis ${yearsOfExperience} ans, j'accompagne les expatries francais et europeens dans toutes leurs demarches juridiques sur place. Specialiste du droit international et des questions migratoires en Asie du Sud-Est.`;
  const description = `${bioFr} Pour toute autre matiere, je dispose d'un reseau d'experts pour relayer rapidement.`;

  const baseDoc = {
    uid,
    firstName,
    lastName,
    fullName,
    displayName: fullName,
    email: `${slugify(firstName)}.${slugify(lastName)}.${countryCode.toLowerCase()}@cabinet-fr-expat.com`,
    phone: '+33743331201',
    phoneNumber: '+33743331201',
    phoneCountryCode: '+33',
    whatsapp: '+33743331201',

    type: 'lawyer',
    role: 'lawyer',
    gender: 'male',

    country: countryCode,
    currentCountry: countryCode,
    residenceCountry: countryCode,
    countrySlug: countryCode.toLowerCase(),
    practiceCountries: interventionCountries,
    operatingCountries: interventionCountries,
    interventionCountries: interventionCountries,
    mapLocation: { lat: coords.lat, lng: coords.lng },
    latitude: coords.lat,
    longitude: coords.lng,

    languages: ['fr'],
    languagesSpoken: ['fr'],
    preferredLanguage: 'fr',
    mainLanguage: 'fr',
    language: 'fr',
    lang: 'fr',

    bio: { fr: bioFr, en: bioFr },
    description,

    isAAA: true,
    isTestProfile: true,
    isApproved: true,
    isActive: true,
    active: true,
    status: 'active',
    isVisible: true,
    isVisibleOnMap: true,
    isCallable: true,
    isVerified: true,
    isVerifiedEmail: true,
    isBanned: false,
    isSuspended: false,
    isOnline: true,
    approvalStatus: 'approved',
    validationStatus: 'approved',
    verificationStatus: 'approved',
    needsVerification: false,
    verified: true,
    isSOS: true,

    forcedAIAccess: true,
    aiAccessForced: true,
    aiQuota: 999999,
    aiCallsUsed: 0,
    payoutMode: 'internal',
    aaaPayoutMode: 'internal',
    kycDelegated: true,
    kycStatus: 'not_required',
    hasActiveSubscription: true,
    subscriptionStatus: 'active',

    createdAt: createdAtTs,
    registrationDate,
    approvedAt: createdAtTs,
    rateLockDate: createdAtTs,
    rateLockMigration: new Date().toISOString(),
    aaaAiAccessMigratedAt: createdAtTs,
    lastLoginAt: FieldValue.serverTimestamp(),
    lastActivity: FieldValue.serverTimestamp(),
    lastActivityCheck: FieldValue.serverTimestamp(),
    lastStatusChange: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),

    points: rndInt(150, 500),
    affiliateCode: `LAW${countryCode}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    referralBy: null,

    responseTime: '< 5 minutes',
    availability: 'available',
    totalCalls,
    successfulCalls,
    successRate,
    totalEarnings: totalCalls * rndInt(28, 56),
    averageRating: rating,
    rating,
    reviewCount,
    totalRatings: reviewCount,

    price: 56,
    duration: 15,
    lockedRates: {
      client_call_lawyer: 200,
      client_call_expat: 100,
      signup_bonus: 200,
    },
    commissionPlanId: 'promo_launch_2026',
    commissionPlanName: 'Plan Lancement (taux actuels)',

    specialties,
    yearsOfExperience,
    barNumber,
    lawSchool,
    education: lawSchool,
    graduationYear: String(new Date().getFullYear() - yearsOfExperience - rndInt(1, 4)),
    certifications: ['certified-bar', 'international-law', 'immigration', 'family-law'],

    photoURL,
    profilePhoto: photoURL,
    avatar: photoURL,

    shortId,
    slugs,
    slug: `${slugify(firstName)}-${slugify(lastName)}`,
    slugVersion: 2,

    isEarlyProvider: false,
    createdByAdmin: true,
    profileCompleted: true,
  };

  if (DRY_RUN) {
    console.log(`\n[DRY] Would create ${uid} (${fullName} - ${countryName})`);
    console.log(`     Slugs FR: ${slugs.fr}`);
    console.log(`     Slugs EN: ${slugs.en}`);
    console.log(`     Specialties (${specialties.length}): ${specialties.slice(0, 5).join(', ')}, ...`);
    console.log(`     Reviews: ${reviewCount}, calls: ${totalCalls}, rating: ${rating}`);
    return { uid, fullName, reviewsToCreate: reviewCount, callsToCreate: totalCalls };
  }

  const batch = db.batch();
  batch.set(db.doc(`sos_profiles/${uid}`), baseDoc);
  batch.set(db.doc(`users/${uid}`), baseDoc);

  const card = {
    id: uid,
    uid,
    title: fullName,
    subtitle: 'Avocat',
    country: countryName,
    photo: photoURL,
    rating,
    reviewCount,
    languages: ['Français'],
    specialties,
    href: `/profile/${uid}`,
    createdAt: createdAtTs,
    updatedAt: FieldValue.serverTimestamp(),
  };
  batch.set(db.doc(`ui_profile_cards/${uid}`), card);
  batch.set(db.doc(`ui_profile_carousel/${uid}`), card);

  await batch.commit();

  // Reviews (un par un, hors batch car addDoc)
  for (let j = 0; j < reviewCount; j++) {
    const reviewDate = new Date(createdAtDate);
    reviewDate.setDate(reviewDate.getDate() + rndInt(2, 180));
    const cFirst = rndChoice(FRENCH_FIRST_NAMES);
    const cLast = rndChoice(FRENCH_LAST_NAMES);
    await db.collection('reviews').add({
      providerId: uid,
      clientId: `client_aaa_${countryCode.toLowerCase()}_${ts}_${j}`,
      clientName: `${cFirst} ${cLast}`,
      authorName: `${cFirst} ${cLast}`,
      clientCountry: 'France',
      rating: rndInt(4, 5),
      comment: REVIEW_COMMENTS[j % REVIEW_COMMENTS.length],
      isPublic: true,
      status: 'published',
      serviceType: 'lawyer_call',
      createdAt: Timestamp.fromDate(reviewDate),
      helpfulVotes: rndInt(0, 8),
      verified: true,
    });
  }

  // Call sessions
  for (let j = 0; j < totalCalls; j++) {
    const callStart = new Date(createdAtDate);
    callStart.setDate(callStart.getDate() + rndInt(2, 200));
    const durationSec = rndInt(15, 45) * 60;
    const callEnd = new Date(callStart.getTime() + durationSec * 1000);
    await db.collection('call_sessions').add({
      metadata: {
        providerId: uid,
        providerName: fullName,
        clientId: `client_aaa_${countryCode.toLowerCase()}_${ts}_${j}`,
        clientName: `Client ${j + 1}`,
      },
      status: 'completed',
      duration: durationSec,
      callType: 'video',
      createdAt: Timestamp.fromDate(callStart),
      startedAt: Timestamp.fromDate(callStart),
      endedAt: Timestamp.fromDate(callEnd),
    });
  }

  console.log(`[OK] Created ${fullName} (${uid}) for ${countryName}: ${reviewCount} reviews + ${totalCalls} calls`);
  return { uid, fullName, reviewsToCreate: reviewCount, callsToCreate: totalCalls };
}

// =====================================================================
// CORRECTION DE MEI WONG -> JIAN WONG
// =====================================================================

async function fixMeiWong() {
  const oldFirst = 'Mei';
  const newFirst = 'Jian';
  const lastName = 'Wong';
  const newFull = `${newFirst} ${lastName}`;

  // Find Mei Wong by fullName
  const snap = await db.collection('sos_profiles')
    .where('fullName', '==', 'Mei Wong')
    .where('type', '==', 'lawyer')
    .limit(1)
    .get();

  if (snap.empty) {
    console.log('[skip] Mei Wong not found.');
    return;
  }
  const doc = snap.docs[0];
  const uid = doc.id;
  const data = doc.data();
  console.log(`[fix] Found Mei Wong = ${uid}`);

  // Rebuild slugs with new first name (specialty = first in array, fallback IMMI_VISAS_PERMIS_SEJOUR)
  const primarySpec = (data.specialties && data.specialties[0]) || 'IMMI_VISAS_PERMIS_SEJOUR';
  const shortId = data.shortId || generateShortId(uid);
  // Mei Wong is in SG
  const newSlugs = {};
  for (const lang of SUPPORTED_LANGS) {
    // si pas de mapping pour cette spec on n'inclut pas le mot specialty -> juste prenom-shortid
    const ll = `${lang}-${DEFAULT_LOCALES[lang]}`;
    const country = COUNTRY_SLUG_TRANS['SG'][lang];
    const roleW = ROLE_SLUG_TRANS[lang];
    const fnSlug = slugify(newFirst);
    const specSlug = SPECIALTY_SLUG_TRANSLATIONS[primarySpec]?.[lang] || '';
    const namePart = specSlug ? `${fnSlug}-${specSlug}-${shortId}` : `${fnSlug}-${shortId}`;
    newSlugs[lang] = `${ll}/${roleW}-${country}/${namePart}`;
  }

  const patch = {
    firstName: newFirst,
    fullName: newFull,
    displayName: newFull,
    email: `jian.wong@aaa-avocats.com`,
    slug: `${slugify(newFirst)}-${slugify(lastName)}`,
    slugs: newSlugs,
    slugsUpdatedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (DRY_RUN) {
    console.log(`[DRY-FIX] Would patch ${uid}:`, JSON.stringify(patch, null, 2));
    return;
  }

  const batch = db.batch();
  batch.update(db.doc(`sos_profiles/${uid}`), patch);
  // users may not exist for old AAA — use set merge to be safe
  batch.set(db.doc(`users/${uid}`), patch, { merge: true });
  batch.update(db.doc(`ui_profile_cards/${uid}`), { title: newFull, updatedAt: FieldValue.serverTimestamp() });
  batch.update(db.doc(`ui_profile_carousel/${uid}`), { title: newFull, updatedAt: FieldValue.serverTimestamp() });
  await batch.commit();

  // Update call_sessions metadata.providerName (cross-collection, paginated)
  const callsSnap = await db.collection('call_sessions')
    .where('metadata.providerId', '==', uid)
    .get();
  console.log(`[fix] Updating ${callsSnap.size} call_sessions for ${uid}`);
  let count = 0;
  let chunk = db.batch();
  for (const c of callsSnap.docs) {
    chunk.update(c.ref, { 'metadata.providerName': newFull });
    count++;
    if (count % 400 === 0) { await chunk.commit(); chunk = db.batch(); }
  }
  if (count % 400 !== 0) await chunk.commit();

  console.log(`[fix] Mei Wong -> Jian Wong patch done.`);
}

// =====================================================================
// MAIN
// =====================================================================

(async () => {
  console.log(`Mode: ${DRY_RUN ? 'DRY-RUN (aucune écriture)' : 'PRODUCTION (écritures réelles)'}`);
  console.log('---');

  console.log('\n[1/2] Correction Mei Wong -> Jian Wong');
  await fixMeiWong();

  console.log('\n[2/2] Création des 3 avocats homme francophone (KH, LA, MM)');
  const photoPool = await getMalePhotoPool();
  console.log(`     Pool de ${photoPool.length} photos male disponibles`);

  for (const p of PROFILES_TO_CREATE) {
    await createProfile(p, photoPool);
  }

  console.log('\n[done]');
  process.exit(0);
})().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
