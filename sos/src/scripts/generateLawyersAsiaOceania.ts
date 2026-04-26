/**
 * =============================================================================
 * SCRIPT: Génération d'Avocats AAA Hommes - ASIE (sauf Chine) + AUSTRALIE
 * =============================================================================
 *
 * Contraintes :
 * - Profils MASCULINS uniquement (gender: 'male')
 * - Langue d'intervention : FRANÇAIS UNIQUEMENT (languages: ['fr'])
 * - Ethnicité variée (prénoms/noms selon le pays principal de résidence)
 * - Pays d'intervention : Asie (sauf Chine) + Australie + Japon (Japon ⊂ Asie)
 * - Date d'inscription : entre 2026-02-10 et 2026-03-30
 * - Note rating : >= 4.0 (4 ou 5 étoiles)
 * - Avis : rating >= 4, jamais deux fois le même commentaire (unicité globale)
 * - Au moins 1 avocat masculin AAA par pays cible
 * - Apparaissent dans AdminAaaProfiles (isAAA: true, isTestProfile: true)
 * - Pas de photo (à ajouter manuellement plus tard)
 *
 * Usage console admin :
 *   generateLawyersAsiaOceania({ dryRun: true })   // vérifie d'abord
 *   generateLawyersAsiaOceania({ dryRun: false })  // crée les profils manquants
 */

import {
  collection, addDoc, setDoc, doc, serverTimestamp, Timestamp,
  getDocs, query, where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getNamesByCountry } from '../data/names-by-country';
import { countriesData } from '../data/countries';

// =============================================================================
// PAYS CIBLES : ASIE (sauf Chine) + AUSTRALIE
// =============================================================================

interface TargetCountry { code: string; nameFr: string; nameEn: string; }

function getTargetCountries(): TargetCountry[] {
  const asia = countriesData.filter(
    (c: any) => c.region === 'Asia' && c.code !== 'CN' && c.code !== 'SEPARATOR' && !c.disabled
  );
  const oceaniaAU = countriesData.filter(
    (c: any) => c.region === 'Oceania' && c.code === 'AU' && !c.disabled
  );
  return [...asia, ...oceaniaAU].map((c: any) => ({
    code: c.code, nameFr: c.nameFr, nameEn: c.nameEn,
  }));
}

// Petites îles Pacifique — l'avocat australien les couvre aussi (intervention)
function getPacificSmallIslands(): TargetCountry[] {
  return countriesData
    .filter((c: any) => c.region === 'Oceania' && c.code !== 'AU' && c.code !== 'SEPARATOR' && !c.disabled)
    .map((c: any) => ({ code: c.code, nameFr: c.nameFr, nameEn: c.nameEn }));
}

// Minimums par pays (par défaut 1) — le user demande 2 en Thaïlande et 2 au Vietnam
const MIN_PER_COUNTRY: Record<string, number> = {
  TH: 2,
  VN: 2,
};
const DEFAULT_MIN = 1;

// =============================================================================
// SPÉCIALITÉS JURIDIQUES (codes synchronisés avec lawyer-specialties.ts)
// =============================================================================

const LAWYER_SPECIALTIES = [
  'URG_ASSISTANCE_PENALE_INTERNATIONALE', 'URG_ACCIDENTS_RESPONSABILITE_CIVILE', 'URG_RAPATRIEMENT_URGENCE',
  'CUR_TRADUCTIONS_LEGALISATIONS', 'CUR_RECLAMATIONS_LITIGES_MINEURS', 'CUR_DEMARCHES_ADMINISTRATIVES',
  'IMMI_VISAS_PERMIS_SEJOUR', 'IMMI_CONTRATS_TRAVAIL_INTERNATIONAL', 'IMMI_NATURALISATION',
  'IMMO_ACHAT_VENTE', 'IMMO_LOCATION_BAUX', 'IMMO_LITIGES_IMMOBILIERS',
  'FISC_DECLARATIONS_INTERNATIONALES', 'FISC_DOUBLE_IMPOSITION', 'FISC_OPTIMISATION_EXPATRIES',
  'FAM_MARIAGE_DIVORCE', 'FAM_GARDE_ENFANTS_TRANSFRONTALIERE', 'FAM_SCOLARITE_INTERNATIONALE',
  'PATR_SUCCESSIONS_INTERNATIONALES', 'PATR_GESTION_PATRIMOINE', 'PATR_TESTAMENTS',
  'ENTR_CREATION_ENTREPRISE_ETRANGER', 'ENTR_INVESTISSEMENTS', 'ENTR_IMPORT_EXPORT',
  'ASSU_ASSURANCES_INTERNATIONALES', 'ASSU_PROTECTION_DONNEES', 'ASSU_CONTENTIEUX_ADMINISTRATIFS',
  'BANK_PROBLEMES_COMPTES_BANCAIRES', 'BANK_VIREMENTS_CREDITS', 'BANK_SERVICES_FINANCIERS',
];

const CERTIFICATIONS = [
  'certified-bar', 'international-law', 'mediator', 'business-law', 'family-law',
  'tax-law', 'real-estate', 'notary', 'arbitrator', 'immigration', 'criminal-law',
  'human-rights', 'environmental-law',
];

// =============================================================================
// BIOS MASCULINES (le profil est toujours masculin)
// =============================================================================

const BIO_TEMPLATES = [
  "Avocat fort de {exp} années d'expérience en droit international, je conseille les expatriés francophones. Installé en {pays}, j'interviens également dans {autres_pays}. Spécialiste reconnu en {specialty}.",
  "Inscrit au barreau depuis {exp} ans, je me consacre aux problématiques juridiques des Français à l'étranger. Depuis {pays}, j'accompagne mes clients dans {autres_pays}.",
  "Passionné par le droit international, j'exerce depuis {exp} ans. Établi en {pays}, j'interviens aussi dans {autres_pays}. Mon expertise principale : {specialty}.",
  "Après {exp} ans de pratique juridique, j'ai développé une expertise pointue. Basé en {pays}, je couvre également {autres_pays}. À votre écoute en français.",
  "Spécialiste du droit des expatriés depuis {exp} ans, je suis votre interlocuteur privilégié. Depuis {pays}, j'interviens dans {autres_pays}.",
  "Diplômé en droit international, je propose un accompagnement juridique complet. Résident en {pays}, je pratique aussi dans {autres_pays}.",
  "Avec {exp} années au service des expatriés francophones, j'offre une expertise sur mesure. Bureau en {pays}, interventions dans {autres_pays}.",
  "Mon cabinet, établi en {pays}, se dédie à l'accompagnement juridique des francophones dans {autres_pays}. Spécialité : {specialty}.",
  "Juriste chevronné avec {exp} ans de pratique, je guide les expatriés francophones. Depuis {pays}, j'interviens dans {autres_pays}.",
  "Expert juridique basé en {pays}, je cumule {exp} ans d'expérience. J'interviens également dans {autres_pays}. Compétences en {specialty}.",
  "Dédié à la défense des intérêts des expatriés depuis {exp} ans, je vous accueille en français. Résidant en {pays}, je couvre aussi {autres_pays}.",
  "Avocat exerçant en {pays} depuis {exp} ans, je propose mes services aux francophones dans {autres_pays}. Expert en {specialty}.",
  "Spécialiste du droit transfrontalier, j'exerce depuis {exp} ans. Mon cabinet en {pays} couvre également {autres_pays}.",
  "À votre service en français, je conseille les expatriés depuis {exp} ans. Installé en {pays}, j'interviens dans {autres_pays}.",
  "Ancien collaborateur de cabinets internationaux, je pratique en {pays} depuis {exp} ans et accompagne les Français dans {autres_pays}.",
];

// =============================================================================
// LABELS DE SPÉCIALITÉS (codes → libellé FR utilisé dans les avis)
// =============================================================================

const SPECIALTY_LABELS_FR: Record<string, string> = {
  URG_ASSISTANCE_PENALE_INTERNATIONALE: 'assistance pénale internationale',
  URG_ACCIDENTS_RESPONSABILITE_CIVILE: 'accidents et responsabilité civile',
  URG_RAPATRIEMENT_URGENCE: 'rapatriement d\'urgence',
  CUR_TRADUCTIONS_LEGALISATIONS: 'traductions et légalisations',
  CUR_RECLAMATIONS_LITIGES_MINEURS: 'litiges mineurs et réclamations',
  CUR_DEMARCHES_ADMINISTRATIVES: 'démarches administratives',
  IMMI_VISAS_PERMIS_SEJOUR: 'visa et permis de séjour',
  IMMI_CONTRATS_TRAVAIL_INTERNATIONAL: 'contrats de travail internationaux',
  IMMI_NATURALISATION: 'naturalisation',
  IMMO_ACHAT_VENTE: 'achat-vente immobilier',
  IMMO_LOCATION_BAUX: 'baux et locations',
  IMMO_LITIGES_IMMOBILIERS: 'litiges immobiliers',
  FISC_DECLARATIONS_INTERNATIONALES: 'déclarations fiscales internationales',
  FISC_DOUBLE_IMPOSITION: 'double imposition',
  FISC_OPTIMISATION_EXPATRIES: 'optimisation fiscale expatriés',
  FAM_MARIAGE_DIVORCE: 'mariage et divorce internationaux',
  FAM_GARDE_ENFANTS_TRANSFRONTALIERE: 'garde d\'enfants transfrontalière',
  FAM_SCOLARITE_INTERNATIONALE: 'scolarité internationale',
  PATR_SUCCESSIONS_INTERNATIONALES: 'succession internationale',
  PATR_GESTION_PATRIMOINE: 'gestion de patrimoine',
  PATR_TESTAMENTS: 'testaments internationaux',
  ENTR_CREATION_ENTREPRISE_ETRANGER: 'création d\'entreprise à l\'étranger',
  ENTR_INVESTISSEMENTS: 'investissements internationaux',
  ENTR_IMPORT_EXPORT: 'import-export',
  ASSU_ASSURANCES_INTERNATIONALES: 'assurances internationales',
  ASSU_PROTECTION_DONNEES: 'protection des données',
  ASSU_CONTENTIEUX_ADMINISTRATIFS: 'contentieux administratif',
  BANK_PROBLEMES_COMPTES_BANCAIRES: 'comptes bancaires internationaux',
  BANK_VIREMENTS_CREDITS: 'virements et crédits internationaux',
  BANK_SERVICES_FINANCIERS: 'services financiers',
};

// =============================================================================
// VILLES PRINCIPALES (par pays cible) — utilisées dans les avis pour ancrer le pays
// =============================================================================

const CITIES_FR: Record<string, string> = {
  AF: 'Kaboul', AM: 'Erevan', AZ: 'Bakou', BH: 'Manama',
  BD: 'Dacca', BT: 'Thimphou', BN: 'Bandar Seri Begawan', KH: 'Phnom Penh',
  GE: 'Tbilissi', HK: 'Hong Kong', IN: 'New Delhi', ID: 'Jakarta',
  IR: 'Téhéran', IQ: 'Bagdad', IL: 'Tel-Aviv', JP: 'Tokyo',
  JO: 'Amman', KZ: 'Astana', KP: 'Pyongyang', KR: 'Séoul',
  KW: 'Koweït City', KG: 'Bichkek', LA: 'Vientiane', LB: 'Beyrouth',
  MO: 'Macao', MY: 'Kuala Lumpur', MV: 'Malé', MN: 'Oulan-Bator',
  MM: 'Naypyidaw', NP: 'Katmandou', OM: 'Mascate', PK: 'Islamabad',
  PS: 'Ramallah', PH: 'Manille', QA: 'Doha', SA: 'Riyad',
  SG: 'Singapour', LK: 'Colombo', SY: 'Damas', TW: 'Taipei',
  TJ: 'Douchanbé', TH: 'Bangkok', TL: 'Dili', TR: 'Istanbul',
  TM: 'Achgabat', AE: 'Dubaï', UZ: 'Tachkent', VN: 'Hô Chi Minh-Ville',
  YE: 'Sanaa', AU: 'Sydney',
};

// Préposition de localisation correcte par pays (au/aux/en + nom)
function prepPays(nameFr: string, code: string): string {
  const masculin = ['JP','VN','TH','LA','KH','MM','PK','AF','BD','NP','BT','IR','IQ','LB','YE','OM','QA','BH','KW','TJ','KZ','KG','UZ','TM','AZ','BN','TL','TW','KP'];
  const pluriel = ['PH','AE','MV'];
  if (pluriel.includes(code)) return `aux ${nameFr}`;
  if (masculin.includes(code)) return `au ${nameFr}`;
  return `en ${nameFr}`;
}

// Override de mapping pour les pays où getNamesByCountry tomberait en fallback Latin
// (la map names-by-country.ts utilise des nameEn différents ou n'a pas le pays)
const NAMES_OVERRIDE_NAMEEN: Record<string, string> = {
  HK: 'China',           // Hong Kong → noms chinois
  MO: 'China',           // Macao → noms chinois
  PS: 'State of Palestine', // map utilise 'State of Palestine'
  KR: 'South Korea',     // map utilise 'South Korea'
  KP: 'North Korea',     // map utilise 'North Korea'
  TL: 'Timor-Leste',
};

function nameKeyForCountry(target: TargetCountry): string {
  return NAMES_OVERRIDE_NAMEEN[target.code] || target.nameEn;
}

// =============================================================================
// TEMPLATES D'AVIS CONTEXTUELS (placeholders : {pays}, {ville}, {specialty}, {prep_pays})
// rating ≥ 4. Chaque rendu final est garanti unique grâce au tracking global.
// =============================================================================

const REVIEW_TEMPLATES = [
  "Excellent avocat francophone basé à {ville}, parfaitement à l'écoute de mes besoins en {specialty}.",
  "Conseils juridiques exceptionnels {prep_pays}, je le recommande vivement à toute la communauté française.",
  "Très satisfait de ses services {prep_pays} : réponse rapide et solution efficace pour mon dossier de {specialty}.",
  "Expertise remarquable en droit {prep_pays}, dossier complexe de {specialty} résolu en quelques semaines.",
  "Un professionnel dévoué basé à {ville}, toujours disponible et réactif. Le français parlé est impeccable.",
  "Accompagnement précieux dans mes démarches administratives à {ville}, surtout pour la {specialty}.",
  "Service impeccable, communication claire en français malgré la distance avec {pays}.",
  "Avocat très compétent à {ville} qui a réglé mon dossier de {specialty} bien plus rapidement que prévu.",
  "Professionnalisme exemplaire {prep_pays}, je referai appel à ses services sans hésiter.",
  "Excellent suivi de dossier malgré le décalage horaire avec {pays}, toujours joignable.",
  "Ses conseils m'ont été extrêmement précieux pour ma {specialty} {prep_pays}, un grand merci.",
  "Grande expertise juridique : il maîtrise parfaitement le droit local {prep_pays} et le droit français.",
  "Très bonne expérience globale, je recommande sans hésitation à tout francophone {prep_pays}.",
  "Avocat sérieux et rigoureux à {ville}, résultats parfaitement conformes à mes attentes.",
  "Pédagogue et patient, il m'a expliqué en français toutes les options possibles en matière de {specialty}.",
  "Service client irréprochable, il répond toujours rapidement même depuis {pays}.",
  "A su gérer mon dossier de {specialty} {prep_pays} avec brio malgré sa grande complexité.",
  "Je suis très reconnaissant pour son aide précieuse dans cette affaire délicate à {ville}.",
  "Maîtrise parfaite du sujet, conseils en {specialty} toujours avisés et adaptés au contexte local.",
  "Excellent rapport qualité-prix pour un service haut de gamme à {ville}.",
  "Très bon avocat francophone {prep_pays}, ce qui est rare et précieux dans cette région.",
  "Il parle parfaitement français à {ville}, nos échanges sont toujours fluides et clairs.",
  "Compétence et sérieux au rendez-vous, pleinement satisfait du résultat de ma {specialty}.",
  "A pris le temps de bien comprendre ma situation d'expatrié {prep_pays} avant de proposer des solutions.",
  "Tarifs raisonnables {prep_pays} pour un service de qualité supérieure en français.",
  "Son expérience avec les expatriés français {prep_pays} fait vraiment toute la différence.",
  "Je le recommande chaleureusement à tous les Français vivant {prep_pays}.",
  "Un avocat de confiance à {ville}, j'ai pu résoudre mes problèmes légaux grâce à lui.",
  "Efficacité et professionnalisme {prep_pays}, exactement ce que je recherchais.",
  "Grâce à son expertise en {specialty}, j'ai obtenu mon dossier sans difficulté {prep_pays}.",
  "Excellent accompagnement pour mon dossier de {specialty} {prep_pays}, merci infiniment.",
  "A su défendre mes intérêts avec brio face à une situation complexe à {ville}.",
  "Disponible même le week-end depuis {pays} quand j'avais des urgences.",
  "Documents rédigés avec soin en français et conseils extrêmement précis pour ma {specialty}.",
  "Un vrai professionnel à {ville} qui connaît son métier sur le bout des doigts.",
  "Réactivité impressionnante depuis {pays}, réponse en moins de 24h systématiquement.",
  "Très content d'avoir trouvé un avocat francophone aussi compétent {prep_pays}.",
  "Son réseau local à {ville} m'a permis de résoudre des problèmes administratifs complexes.",
  "Prend le temps d'expliquer en français les procédures locales {prep_pays}.",
  "Honoraires transparents dès le départ, aucune mauvaise surprise pour mon dossier de {specialty}.",
  "Avocat méticuleux à {ville} qui ne laisse rien au hasard dans le traitement du dossier.",
  "Il a parfaitement géré mon contentieux fiscal avec l'administration {prep_pays}.",
  "Précision juridique impressionnante, je me sens en sécurité avec lui {prep_pays}.",
  "Sa connaissance du droit local {prep_pays} m'a évité bien des écueils administratifs.",
  "Réponses claires en français, structurées et toujours documentées par les textes locaux.",
  "Approche pragmatique et orientée résultats pour ma {specialty} {prep_pays}.",
  "Son sens de la stratégie juridique m'a permis de gagner mon procès à {ville}.",
  "Empathique et compréhensif tout en restant rigoureusement professionnel à {ville}.",
  "A obtenu un règlement à l'amiable favorable {prep_pays} quand je pensais devoir aller au procès.",
  "Confidentialité totale, aucun souci concernant la sensibilité de mon dossier {prep_pays}.",
  "Maîtrise impeccable de la procédure locale {prep_pays}, dossier bouclé en un temps record.",
  "Conseils anticipateurs en {specialty} qui m'ont évité plusieurs erreurs coûteuses {prep_pays}.",
  "Excellent négociateur, il a obtenu des conditions très avantageuses {prep_pays}.",
  "Prend des notes précises et envoie systématiquement un compte-rendu en français.",
  "Disponible pour des appels en visio depuis {pays}, très pratique depuis la France.",
  "Bonne articulation avec le notaire local pour ma {specialty} {prep_pays}.",
  "Travail collaboratif efficace avec mon expert-comptable français pour mes affaires {prep_pays}.",
  "Solides références dans la communauté française expatriée à {ville}.",
  "Mes proches expatriés à {ville} lui ont aussi fait confiance et tous sont satisfaits.",
  "Cabinet sérieux à {ville}, accueil chaleureux et organisé en français.",
  "M'a accompagné lors d'un contrôle fiscal stressant {prep_pays}, parfaitement préparé.",
  "Connaissance fine de la convention fiscale bilatérale entre la France et {pays}.",
  "Sa rigueur dans la rédaction des actes en {specialty} m'a impressionné.",
  "Une ressource précieuse pour tout Français installé {prep_pays}.",
  "Excellent dans la gestion des dossiers d'immigration complexes {prep_pays}.",
  "Patient avec mes nombreuses questions sur la {specialty}, jamais pressé.",
  "M'a évité un piège juridique {prep_pays} qui aurait pu me coûter cher.",
  "Stratégie de défense parfaitement calibrée à ma situation d'expat {prep_pays}.",
  "Grande capacité d'écoute en français, comprend immédiatement les enjeux locaux.",
  "Réactif aux mails depuis {pays}, généralement une réponse dans la journée.",
  "Son équipe au cabinet de {ville} est tout aussi professionnelle que lui.",
  "Réelle empathie face aux difficultés humaines de mon dossier {prep_pays}.",
  "M'a aidé à monter ma société {prep_pays} sans aucun accroc administratif.",
  "Excellent intermédiaire avec les administrations locales {prep_pays}.",
  "Sa lettre de mise en demeure a suffi à débloquer la situation {prep_pays}.",
  "Il connaît parfaitement les arcanes du droit local {prep_pays} et international.",
  "Très bon en {specialty}, m'a bien défendu malgré la complexité du droit local.",
  "Conseils éclairés en {specialty} pour ma situation transfrontalière France-{pays}.",
  "Sa veille juridique permanente sur le droit {prep_pays} est un vrai plus.",
  "Excellent en {specialty}, achat à {ville} sans aucune surprise.",
  "Il a structuré mon patrimoine international entre la France et {pays} avec brio.",
  "Sa maîtrise du droit comparé entre la France et {pays} est impressionnante.",
  "Recommandé par notre consul à {ville}, jamais déçu.",
  "Précieux dans la gestion de la double imposition France/{pays}.",
  "Conseils pertinents pour optimiser ma situation fiscale d'expat {prep_pays}.",
  "M'a sauvé d'une régularisation administrative compliquée {prep_pays}.",
  "A traité mon dossier {prep_pays} avec la plus grande discrétion.",
  "Dossier de {specialty} accepté grâce à ses conseils {prep_pays}.",
  "Très bon réseau de partenaires locaux à {ville}, indispensable.",
  "Argumentation solide qui a convaincu le tribunal de {ville}.",
  "Mémoires rédigés en français et en langue locale avec une clarté remarquable.",
  "A négocié de bonnes conditions de divorce international entre la France et {pays}.",
  "Excellent en droit de la famille transfrontalier France/{pays}.",
  "Sa connaissance des procédures de garde {prep_pays} m'a beaucoup aidé.",
  "Solution juridique trouvée pour ma {specialty} {prep_pays}.",
  "Disponible pour des consultations le soir depuis {pays}, parfait pour les expatriés.",
  "Compréhension fine des enjeux culturels locaux {prep_pays} dans mon dossier.",
  "Réelle expertise terrain {prep_pays}, pas seulement théorique.",
  "Sa clarté dans les explications fait de lui un excellent pédagogue, même sur la {specialty}.",
  "M'a fait économiser plusieurs milliers d'euros sur mes impôts entre la France et {pays}.",
  "Précieux conseil pour transférer ma résidence fiscale {prep_pays} en toute légalité.",
  "Excellente gestion de mon dossier KYC bancaire {prep_pays}.",
  "A débloqué un compte bancaire {prep_pays} bloqué depuis des mois.",
  "Sa lettre au régulateur {prep_pays} a fait toute la différence.",
  "Recours administratif gagné {prep_pays} grâce à sa procédure rigoureuse.",
  "Très bon en contentieux administratif local {prep_pays}.",
  "M'a guidé dans le labyrinthe des démarches consulaires françaises {prep_pays}.",
  "Une véritable boussole juridique pour les expatriés français {prep_pays}.",
  "Précis, rapide, et toujours dans le respect de la déontologie même {prep_pays}.",
  "Confiance totale, je lui transmets tous mes dossiers complexes {prep_pays}.",
  "Service haut de gamme à {ville} à un tarif tout à fait correct.",
  "Excellente organisation à {ville}, jamais de retard dans les délais.",
  "Sa réactivité dans une urgence familiale {prep_pays} m'a impressionné.",
  "Présent au tribunal de {ville} le jour J, parfaitement préparé.",
  "Connaissance pointue des registres fonciers {prep_pays}.",
  "M'a aidé à régulariser un titre de propriété ancien {prep_pays}.",
  "Excellent en succession internationale entre la France et {pays}.",
  "Efficacité redoutable dans les procédures d'urgence {prep_pays}.",
  "Sa mise en relation avec un notaire local à {ville} a été précieuse.",
  "A coordonné parfaitement la procédure entre la France et {pays}.",
  "Capable de plaider devant les tribunaux de {ville} et de relayer en France.",
  "Solide en droit pénal des affaires international {prep_pays}.",
  "M'a évité des poursuites pénales {prep_pays} grâce à un accord transactionnel.",
  "Discrétion totale sur un dossier très sensible {prep_pays}.",
  "Approche humaine, jamais bureaucratique, même dans le contexte local de {pays}.",
  "Un avocat à {ville} qui prend vraiment vos intérêts à cœur.",
  "Cabinet bien organisé à {ville}, suivi via plateforme digitale très pratique.",
  "Outils de partage de documents sécurisés et faciles à utiliser depuis la France.",
  "Communication parfaite en français tout au long de l'instruction {prep_pays}.",
  "Suivi régulier sans avoir à le relancer, même depuis {pays}.",
  "Anticipe les problèmes plutôt que de les subir, un vrai atout {prep_pays}.",
  "Stratégie procédurale gagnante du début à la fin {prep_pays}.",
  "Sa conduite en audience à {ville} était très impressionnante.",
  "M'a obtenu une décision conservatoire en urgence absolue à {ville}.",
  "Excellent en référé administratif et civil {prep_pays}.",
  "Très bon en arbitrage international, dossier réglé à l'amiable depuis {pays}.",
  "A négocié un protocole transactionnel très favorable pour mon entreprise {prep_pays}.",
  "Sa connaissance des CCI et CNUDCI appliquées {prep_pays} est solide.",
  "Recommandé pour tout dossier d'arbitrage commercial international impliquant {pays}.",
  "Il a su démontrer la nullité de la procédure adverse à {ville}.",
  "Plaidoirie maîtrisée à {ville}, juge convaincu en quelques minutes.",
  "M'a sorti d'une garde à vue {prep_pays} avec brio.",
  "Disponible H24 pendant ma période de détention provisoire {prep_pays}.",
  "A organisé mon rapatriement sanitaire depuis {pays} en urgence absolue.",
  "Coordination parfaite avec les autorités consulaires françaises {prep_pays}.",
  "Excellent contact avec le réseau diplomatique français {prep_pays}.",
  "Sa diplomatie a permis de débloquer mon dossier en mairie de {ville}.",
  "Capable de naviguer dans les administrations locales {prep_pays} très bureaucratiques.",
  "Sa patience face à l'administration {prep_pays} est admirable.",
  "M'a fait gagner un temps précieux pour ma demande de visa long séjour {prep_pays}.",
  "Connaît parfaitement les procédures consulaires françaises de {ville}.",
  "Excellente maîtrise des conventions multilatérales appliquées {prep_pays}.",
  "Sa stratégie en droit des sociétés transfrontalières France/{pays} est remarquable.",
  "M'a aidé à structurer une joint-venture France/{pays}.",
  "Compétent en private equity et financement transfrontalier {prep_pays}.",
  "Sa rédaction de pacte d'actionnaires entre associés français et {pays} est excellente.",
  "Très bon en propriété intellectuelle {prep_pays}.",
  "M'a aidé à protéger ma marque {prep_pays} et en France.",
  "Excellent en droit numérique et conformité RGPD-équivalent local {prep_pays}.",
  "A audité ma conformité RGPD/lois locales {prep_pays} avec rigueur.",
  "Son audit juridique préalable à l'investissement {prep_pays} m'a évité un piège.",
  "Rédaction contractuelle très soignée et bilingue français-langue locale.",
  "Excellent en clauses de hardship et force majeure pour ma {specialty} {prep_pays}.",
  "Compétent en droit de la concurrence et antitrust local {prep_pays}.",
  "M'a accompagné dans une investigation concurrentielle {prep_pays}.",
  "A négocié une clause d'arbitrage très protectrice pour mon contrat {prep_pays}.",
  "Excellent en clause attributive de juridiction France/{pays}.",
  "Sa rédaction des clauses d'élection de droit applicable est parfaite.",
  "Très bon en droit des assurances international, dossier réglé {prep_pays}.",
  "M'a aidé à faire jouer ma police d'assurance santé expatriés {prep_pays}.",
  "Recouvrement de créance international {prep_pays} réussi sans procédure lourde.",
  "Très bon en exequatur de jugements français {prep_pays}.",
  "A obtenu l'exequatur de mon jugement français à {ville}.",
  "Excellent en certificat de coutume juridique {prep_pays}.",
  "Précieux pour authentifier des documents juridiques {prep_pays}.",
  "Sa connaissance des apostilles et légalisations {prep_pays} est complète.",
  "M'a fait gagner plusieurs mois sur mes démarches consulaires à {ville}.",
  "Très bon en droit du sport international, dossier complexe résolu {prep_pays}.",
  "Capable de défendre des dossiers de droit du sport entre la France et {pays}.",
  "Compétent en droit pénal des affaires et anti-corruption {prep_pays}.",
  "Sa connaissance des règles FCPA/Sapin 2 appliquées {prep_pays} est précieuse.",
  "Excellent en compliance internationale et lutte anti-blanchiment {prep_pays}.",
  "Audit de conformité réalisé {prep_pays} avec une grande rigueur.",
  "Sa rédaction de procédures internes pour ma société {prep_pays} est très opérationnelle.",
  "Très bon en cybersécurité juridique et protection des données {prep_pays}.",
  "M'a aidé après une cyberattaque {prep_pays}, gestion de crise impeccable.",
  "Précieux pour mes démarches RGPD entre la France et {pays}.",
  "Excellent en droit pénal informatique entre la France et {pays}.",
  "Sa stratégie dans mon dossier de cyberharcèlement {prep_pays} a porté ses fruits.",
  "M'a aidé à faire retirer un contenu diffamatoire {prep_pays}.",
  "Procédure de référé numérique gagnée rapidement à {ville}.",
  "Très bon en droit des médias et liberté d'expression {prep_pays}.",
  "M'a défendu efficacement face à une accusation de diffamation {prep_pays}.",
  "Compétent en droit international privé, articulation parfaite France/{pays}.",
  "Sa maîtrise des règles de Rome I et II appliquées {prep_pays} est impressionnante.",
  "Excellent en droit international public, dossier rare bien traité {prep_pays}.",
  "M'a aidé dans une procédure d'investissement {prep_pays}.",
  "Sa veille internationale sur les sanctions économiques {prep_pays} est précieuse.",
  "M'a évité une sanction OFAC grâce à un audit préventif sur mes flux {prep_pays}.",
  "Excellent en gestion de crise réputationnelle juridique {prep_pays}.",
  "Sa diplomatie discrète a sauvé l'image de mon entreprise {prep_pays}.",
  "Ressource fiable pour toute famille française expatriée {prep_pays}.",
  "Cabinet à {ville} recommandé par mon réseau d'amis expatriés.",
  "Disponibilité même pendant les jours fériés locaux à {ville}.",
  "Sa flexibilité d'agenda est précieuse pour les expatriés français {prep_pays}.",
  "Capable d'expliquer le droit local {prep_pays} en termes simples et clairs.",
  "Pédagogie remarquable pour vulgariser des notions complexes du droit {prep_pays}.",
  "Excellente collaboration avec mon avocat français en parallèle pour mon dossier {prep_pays}.",
  "Travail en binôme avec mon avocat fiscaliste très efficace pour ma {specialty}.",
  "Très bon réseau de partenaires fiables {prep_pays} pour les expatriés français.",
  "M'a recommandé un excellent expert-comptable français {prep_pays}.",
  "Solide network local à {ville}, très utile pour les démarches.",
  "Sa réputation à {ville} ouvre des portes administratives.",
  "Reconnu par ses pairs comme une référence sur place à {ville}.",
  "Cabinet bien implanté à {ville} avec une longue histoire.",
  "Equipe stable à {ville}, on parle toujours aux mêmes interlocuteurs.",
  "Sa secrétaire à {ville} est elle aussi parfaitement francophone.",
  "Continuité de l'interlocuteur, jamais de transmission au stagiaire à {ville}.",
  "Toujours présent personnellement aux audiences clé à {ville}.",
  "Délégation maîtrisée à des collaborateurs compétents quand nécessaire {prep_pays}.",
  "Tarification au forfait possible pour ma {specialty} {prep_pays}, très appréciable.",
  "Possibilité de paiement échelonné pour les dossiers longs {prep_pays}.",
  "Devis détaillé en amont pour ma {specialty}, aucune mauvaise surprise budgétaire.",
  "Note d'honoraires extrêmement claire et détaillée, en français.",
  "Suivi temps passé transparent et facturation au juste prix {prep_pays}.",
  "Excellent rapport qualité-prix par rapport aux autres cabinets de {ville}.",
  "Service premium à un tarif vraiment compétitif pour {ville}.",
  "Investissement rentable, économies juridiques bien supérieures {prep_pays}.",
  "Recommandation chaleureuse de mon cabinet français pour mes affaires {prep_pays}.",
  "Présenté par mon avocat de Paris, jamais déçu de cette mise en relation {prep_pays}.",
  "Mon réseau professionnel m'avait beaucoup parlé de lui à {ville}, à raison.",
  "Choisi sur recommandation à {ville}, je le recommande à mon tour.",
  "Référence solide pour la communauté française à {ville}.",
  "Présent dans toutes les manifestations de la communauté française à {ville}.",
  "Ses conférences en français sur le droit local {prep_pays} sont précieuses.",
  "Auteur de publications de référence sur le droit {prep_pays}.",
];


// =============================================================================
// UNIVERSITÉS PAR RÉGION (Asie / Océanie)
// =============================================================================

const UNIVERSITIES_ASIA: string[] = [
  'University of Tokyo', 'Kyoto University', 'Waseda University', 'Hitotsubashi University',
  'National University of Singapore', 'Singapore Management University',
  'Seoul National University', 'Yonsei University Law School',
  'University of Hong Kong', 'Chinese University of Hong Kong',
  'National Taiwan University', 'Chulalongkorn University',
  'University of the Philippines', 'Ateneo de Manila University',
  'University of Indonesia', 'Universitas Gadjah Mada',
  'University of Malaya', 'Hanoi Law University',
  'National Law School of India University', 'Jindal Global Law School',
  'American University of Beirut', 'Tel Aviv University',
  'Hebrew University of Jerusalem', 'Bilkent University',
  'Istanbul University', 'University of Tehran',
  'Tashkent State University of Law', 'King Saud University',
  'Université Saint-Joseph de Beyrouth',
];

const UNIVERSITIES_OCEANIA: string[] = [
  'University of Sydney', 'University of Melbourne',
  'Australian National University', 'University of New South Wales',
  'Monash University', 'University of Queensland',
];

const UNIVERSITIES_EU_FALLBACK: string[] = [
  'Université Paris 1 Panthéon-Sorbonne', 'Université Paris 2 Panthéon-Assas',
  'Sciences Po Paris', 'Université Aix-Marseille', 'HEC Paris',
];

// =============================================================================
// COORDONNÉES CAPITALES
// =============================================================================

const CAPITALS: Record<string, { lat: number; lng: number }> = {
  AF: { lat: 34.5553, lng: 69.2075 }, AM: { lat: 40.1792, lng: 44.4991 },
  AZ: { lat: 40.4093, lng: 49.8671 }, BH: { lat: 26.2285, lng: 50.5860 },
  BD: { lat: 23.8103, lng: 90.4125 }, BT: { lat: 27.4728, lng: 89.6390 },
  BN: { lat: 4.9031, lng: 114.9398 }, KH: { lat: 11.5564, lng: 104.9282 },
  GE: { lat: 41.7151, lng: 44.8271 }, HK: { lat: 22.3193, lng: 114.1694 },
  IN: { lat: 28.6139, lng: 77.2090 }, ID: { lat: -6.2088, lng: 106.8456 },
  IR: { lat: 35.6892, lng: 51.3890 }, IQ: { lat: 33.3152, lng: 44.3661 },
  IL: { lat: 31.7683, lng: 35.2137 }, JP: { lat: 35.6762, lng: 139.6503 },
  JO: { lat: 31.9454, lng: 35.9284 }, KZ: { lat: 51.1605, lng: 71.4704 },
  KP: { lat: 39.0392, lng: 125.7625 }, KR: { lat: 37.5665, lng: 126.9780 },
  KW: { lat: 29.3759, lng: 47.9774 }, KG: { lat: 42.8746, lng: 74.5698 },
  LA: { lat: 17.9757, lng: 102.6331 }, LB: { lat: 33.8938, lng: 35.5018 },
  MO: { lat: 22.1987, lng: 113.5439 }, MY: { lat: 3.1390, lng: 101.6869 },
  MV: { lat: 4.1755, lng: 73.5093 }, MN: { lat: 47.8864, lng: 106.9057 },
  MM: { lat: 19.7633, lng: 96.0785 }, NP: { lat: 27.7172, lng: 85.3240 },
  OM: { lat: 23.5859, lng: 58.4059 }, PK: { lat: 33.6844, lng: 73.0479 },
  PS: { lat: 31.9038, lng: 35.2034 }, PH: { lat: 14.5995, lng: 120.9842 },
  QA: { lat: 25.2854, lng: 51.5310 }, SA: { lat: 24.7136, lng: 46.6753 },
  SG: { lat: 1.3521, lng: 103.8198 }, LK: { lat: 6.9271, lng: 79.8612 },
  SY: { lat: 33.5138, lng: 36.2765 }, TW: { lat: 25.0330, lng: 121.5654 },
  TJ: { lat: 38.5598, lng: 68.7870 }, TH: { lat: 13.7563, lng: 100.5018 },
  TL: { lat: -8.5569, lng: 125.5603 }, TR: { lat: 39.9334, lng: 32.8597 },
  TM: { lat: 37.9601, lng: 58.3261 }, AE: { lat: 24.4539, lng: 54.3773 },
  UZ: { lat: 41.2995, lng: 69.2401 }, VN: { lat: 21.0285, lng: 105.8542 },
  YE: { lat: 15.3694, lng: 44.1910 }, AU: { lat: -35.2809, lng: 149.1300 },
};

// =============================================================================
// HELPERS
// =============================================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateBetween(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomRatingHigh(): number {
  // Toujours >= 4.0 (4 ou 5 étoiles)
  const r = Math.random();
  if (r < 0.55) return parseFloat((4.7 + Math.random() * 0.3).toFixed(2)); // 4.7 - 5.0
  if (r < 0.85) return parseFloat((4.4 + Math.random() * 0.3).toFixed(2)); // 4.4 - 4.7
  return parseFloat((4.0 + Math.random() * 0.4).toFixed(2));               // 4.0 - 4.4
}

function randomReviewRating(): number {
  // Avis : >= 4 étoiles
  const r = Math.random();
  if (r < 0.7) return 5;
  if (r < 0.95) return parseFloat((4.5).toFixed(1));
  return 4;
}

function slugify(str: string): string {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

function getUniversity(code: string): string {
  if (code === 'AU') return randomChoice(UNIVERSITIES_OCEANIA);
  if (UNIVERSITIES_ASIA.length > 0) return randomChoice([...UNIVERSITIES_ASIA, ...UNIVERSITIES_EU_FALLBACK]);
  return randomChoice(UNIVERSITIES_EU_FALLBACK);
}

function getCoordinates(code: string): { lat: number; lng: number } {
  const c = CAPITALS[code];
  if (c) return { lat: c.lat + (Math.random() - 0.5) * 0.1, lng: c.lng + (Math.random() - 0.5) * 0.1 };
  return { lat: 0, lng: 0 };
}

// =============================================================================
// VÉRIFICATION DES PROFILS EXISTANTS
// =============================================================================

interface ExistingByCountry { [code: string]: number }

async function auditExistingMaleAaaLawyers(targets: TargetCountry[]): Promise<{
  totalAaaLawyers: number;
  matchingMaleFr: number;
  byCountry: ExistingByCountry;
  /** Map { code: nbProfilsManquants } pour atteindre le minimum requis par pays */
  deficitByCountry: Record<string, number>;
}> {
  const snap = await getDocs(query(
    collection(db, 'users'),
    where('isAAA', '==', true),
    where('role', '==', 'lawyer')
  ));

  const byCountry: ExistingByCountry = {};
  let matchingMaleFr = 0;

  for (const d of snap.docs) {
    const p: any = d.data();
    if (p.gender === 'female') continue;
    const isMale = p.gender === 'male' || (!p.gender && p.firstName);
    const langs: string[] = p.languages || p.languagesSpoken || [];
    const speaksFr = langs.includes('fr') || langs.includes('Français');
    const practice: string[] = p.practiceCountries || p.operatingCountries || p.interventionCountries || [];

    if (!isMale || !speaksFr) continue;

    matchingMaleFr++;
    for (const code of practice) {
      byCountry[code] = (byCountry[code] || 0) + 1;
    }
  }

  const deficitByCountry: Record<string, number> = {};
  for (const t of targets) {
    const min = MIN_PER_COUNTRY[t.code] ?? DEFAULT_MIN;
    const existing = byCountry[t.code] || 0;
    if (existing < min) deficitByCountry[t.code] = min - existing;
  }

  return { totalAaaLawyers: snap.size, matchingMaleFr, byCountry, deficitByCountry };
}

// =============================================================================
// FONCTION PRINCIPALE
// =============================================================================

export interface AaaReport {
  mode: 'dry-run' | 'execute';
  totalAaaLawyers: number;
  matchingMaleFrInBase: number;
  targets: number;
  okCountries: string[];
  partialCountries: string[];
  missingCountries: string[];
  perCountry: Array<{ code: string; nameFr: string; existing: number; min: number; status: 'ok' | 'partial' | 'missing' }>;
  totalToCreate: number;
  created?: number;
  errors?: number;
  uniqueReviewsUsed?: number;
  message: string;
}

export async function generateLawyersAsiaOceania(
  options: { dryRun?: boolean } = {}
): Promise<AaaReport> {
  const dryRun = options.dryRun !== false;
  const targets = getTargetCountries();

  // Étape 1 : Audit (pas de console.log — drop_console est actif en prod)
  const audit = await auditExistingMaleAaaLawyers(targets);

  // Calcul du détail par pays
  const perCountry = targets.map(t => {
    const existing = audit.byCountry[t.code] || 0;
    const min = MIN_PER_COUNTRY[t.code] ?? DEFAULT_MIN;
    let status: 'ok' | 'partial' | 'missing';
    if (existing >= min) status = 'ok';
    else if (existing === 0) status = 'missing';
    else status = 'partial';
    return { code: t.code, nameFr: t.nameFr, existing, min, status };
  });

  const okCountries = perCountry.filter(c => c.status === 'ok').map(c => `${c.code} (${c.existing}/${c.min})`);
  const partialCountries = perCountry.filter(c => c.status === 'partial').map(c => `${c.code} (${c.existing}/${c.min})`);
  const missingCountries = perCountry.filter(c => c.status === 'missing').map(c => `${c.code} (0/${c.min})`);
  const totalToCreate = Object.values(audit.deficitByCountry).reduce((a, b) => a + b, 0);

  if (dryRun) {
    return {
      mode: 'dry-run',
      totalAaaLawyers: audit.totalAaaLawyers,
      matchingMaleFrInBase: audit.matchingMaleFr,
      targets: targets.length,
      okCountries, partialCountries, missingCountries, perCountry,
      totalToCreate,
      message: totalToCreate === 0
        ? '✅ Tous les pays cibles atteignent déjà leur minimum requis. Rien à créer.'
        : `${totalToCreate} profil(s) à créer. Pour exécuter: generateLawyersAsiaOceania({ dryRun: false })`,
    };
  }

  const deficitEntries = Object.entries(audit.deficitByCountry);
  if (deficitEntries.length === 0) {
    return {
      mode: 'execute',
      totalAaaLawyers: audit.totalAaaLawyers,
      matchingMaleFrInBase: audit.matchingMaleFr,
      targets: targets.length,
      okCountries, partialCountries, missingCountries, perCountry,
      totalToCreate: 0,
      created: 0, errors: 0, uniqueReviewsUsed: 0,
      message: '✅ Tous les pays cibles atteignent leur minimum (TH/VN inclus). Rien à faire.',
    };
  }

  // Étape 2 : Génération
  const START_DATE = new Date('2026-02-10T00:00:00Z');
  const END_DATE = new Date('2026-03-30T23:59:59Z');
  const TODAY = new Date();
  const targetByCode: Record<string, TargetCountry> = Object.fromEntries(targets.map(t => [t.code, t]));
  const SMALL_ISLANDS = getPacificSmallIslands();

  // Construire la file des "slots" à pourvoir : un slot = un profil dont le pays principal est `code`
  const slotsQueue: string[] = [];
  for (const [code, deficit] of deficitEntries) {
    for (let k = 0; k < deficit; k++) slotsQueue.push(code);
  }
  // Mélange pour variété de l'ordre
  slotsQueue.sort(() => Math.random() - 0.5);

  // Construire les profils : chaque slot = 1 profil, qui peut couvrir 1 ou 2 pays max (sauf AU)
  const profilesToCreate: { mainCountry: TargetCountry; allCountries: TargetCountry[] }[] = [];
  while (slotsQueue.length > 0) {
    const mainCode = slotsQueue.shift()!;
    const main = targetByCode[mainCode];
    let allCountries: TargetCountry[] = [main];

    // Cas spécial Australie : couvre aussi les petites îles du Pacifique
    if (main.code === 'AU') {
      allCountries = [main, ...SMALL_ISLANDS];
    } else {
      // 1 ou 2 pays au total : 50% de chances d'ajouter un 2e pays parmi les slots restants
      if (slotsQueue.length > 0 && Math.random() < 0.5) {
        // Cherche un pays différent dans la file pour ne pas dupliquer le slot
        const extraIdx = slotsQueue.findIndex(c => c !== mainCode);
        if (extraIdx >= 0) {
          const [extraCode] = slotsQueue.splice(extraIdx, 1);
          allCountries.push(targetByCode[extraCode]);
        }
      }
    }
    profilesToCreate.push({ mainCountry: main, allCountries });
  }

  // Set global pour unicité des avis au sein de cette exécution
  const usedCommentsGlobal = new Set<string>();

  let success = 0;
  let errors = 0;
  let lastErrorMessage = '';

  for (let i = 0; i < profilesToCreate.length; i++) {
    const profile = profilesToCreate[i];
    const main = profile.mainCountry;

    try {
      // Noms ethniques selon le pays principal (avec override pour les cas non mappés)
      const namesData = getNamesByCountry(nameKeyForCountry(main));
      const firstName = randomChoice(namesData.male);
      const lastName = randomChoice(namesData.lastNames);
      const fullName = `${firstName} ${lastName}`;
      // Email avec domaine plausible (cabinet francophone à l'international)
      const email = `${slugify(firstName)}.${slugify(lastName)}.${main.code.toLowerCase()}@cabinet-fr-expat.com`;

      const uid = `aaa_lawyer_${main.code.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      const createdAt = randomDateBetween(START_DATE, END_DATE);

      const experience = randomInt(5, 30);
      const graduationYear = (new Date().getFullYear() - experience - randomInt(0, 4)).toString();

      const numSpec = randomInt(2, 5);
      const specialties = [...LAWYER_SPECIALTIES].sort(() => Math.random() - 0.5).slice(0, numSpec);
      const mainSpecialtyLabel = SPECIALTY_LABELS_FR[specialties[0]] || specialties[0].toLowerCase();

      const numCert = randomInt(1, 3);
      const certifications = [...CERTIFICATIONS].sort(() => Math.random() - 0.5).slice(0, numCert);

      const daysSinceCreation = Math.max(1, Math.floor((TODAY.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
      const totalCalls = randomInt(8, Math.max(8, daysSinceCreation));
      const reviewCount = randomInt(6, 14); // 6-14 avis par profil
      const rating = randomRatingHigh();
      const successRate = randomInt(92, 100);
      const successfulCalls = Math.round(totalCalls * successRate / 100);

      const otherCountriesText = profile.allCountries.length > 1
        ? profile.allCountries.slice(1).slice(0, 3).map(c => c.nameFr).join(', ')
          + (profile.allCountries.length > 4 ? ' et la région Pacifique' : '')
        : 'plusieurs régions voisines';

      const bioTpl = randomChoice(BIO_TEMPLATES);
      const bio = bioTpl
        .replace(/{exp}/g, experience.toString())
        .replace(/{pays}/g, main.nameFr)
        .replace(/{autres_pays}/g, otherCountriesText)
        .replace(/{specialty}/g, mainSpecialtyLabel);

      const lawSchool = getUniversity(main.code);
      const mapLocation = getCoordinates(main.code);

      // Prix
      let price = randomInt(49, 89);
      if (['JP', 'KR', 'SG', 'HK', 'AE', 'AU', 'IL', 'TW'].includes(main.code)) price = randomInt(69, 99);
      if (['AF', 'YE', 'SY', 'KP', 'TL', 'LA', 'MM'].includes(main.code)) price = randomInt(35, 55);

      const duration = randomChoice([15, 20, 30]);
      const responseTime = randomChoice(['< 5 minutes', '< 15 minutes', '< 30 minutes']);

      const practiceCountryCodes = profile.allCountries.map(c => c.code);

      const profileData: any = {
        // Identité
        uid, firstName, lastName, fullName, displayName: fullName, email,
        gender: 'male',

        // Contact — numéro standard SOS-Expat pour tous les profils AAA (convention projet)
        phone: '+33743331201', phoneCountryCode: '+33',

        // Localisation
        country: main.code, currentCountry: main.code, residenceCountry: main.code,
        practiceCountries: practiceCountryCodes,
        operatingCountries: practiceCountryCodes,
        interventionCountries: practiceCountryCodes,

        // Langues — FRANÇAIS UNIQUEMENT
        preferredLanguage: 'fr',
        languages: ['fr'],
        languagesSpoken: ['fr'],

        // Photos — VIDES (à ajouter manuellement plus tard)
        profilePhoto: '',
        avatar: '',

        // Flags AAA + visibilité
        isTestProfile: true,
        isAAA: true,
        isActive: true,
        isApproved: true,
        isVerified: true,
        isVerifiedEmail: true,
        approvalStatus: 'approved',
        validationStatus: 'approved',
        verificationStatus: 'approved',
        isOnline: Math.random() > 0.6,
        isVisible: true,
        isVisibleOnMap: true,
        isCallable: true,
        isBanned: false,
        isSuspended: false,
        forcedAIAccess: true,

        // Dates
        createdAt: Timestamp.fromDate(createdAt),
        registrationDate: createdAt.toISOString(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        approvedAt: Timestamp.fromDate(createdAt),

        // Rôle
        role: 'lawyer',
        type: 'lawyer',
        isSOS: true,

        // Affiliation
        points: randomInt(50, 600),
        affiliateCode: `LAW${main.code}${Math.random().toString(36).slice(2, 5).toUpperCase()}`,

        // Bio — masculine (gender: 'male' garanti). Le platform UI affichera la version FR
        // pour les utilisateurs francophones; l'objet bio reste structuré { fr, en }.
        bio: { fr: bio, en: bio },
        description: bio,

        // Disponibilité
        responseTime,
        availability: 'available',

        // Stats
        totalCalls,
        successfulCalls,
        successRate,
        totalEarnings: Math.round(totalCalls * price * 0.7),
        averageRating: rating,
        rating,
        reviewCount,
        totalRatings: reviewCount,

        // Géolocalisation
        mapLocation,
        latitude: mapLocation.lat,
        longitude: mapLocation.lng,

        // Tarification
        price,
        duration,

        // Métier avocat
        specialties,
        yearsOfExperience: experience,
        barNumber: `BAR-${main.code}-${randomInt(10000, 99999)}`,
        lawSchool,
        graduationYear,
        education: lawSchool,
        certifications,

        // Validation
        needsVerification: false,
      };

      // Écriture users
      await setDoc(doc(db, 'users', uid), profileData);

      // Écriture sos_profiles (avec drapeaux admin)
      await setDoc(doc(db, 'sos_profiles', uid), {
        ...profileData,
        createdByAdmin: true,
        profileCompleted: true,
      });

      // Carte UI
      await setDoc(doc(db, 'ui_profile_cards', uid), {
        id: uid, uid,
        title: fullName,
        subtitle: 'Avocat',
        country: main.nameFr,
        photo: '',
        rating,
        reviewCount,
        languages: ['fr'],
        specialties,
        href: `/profile/${uid}`,
        createdAt: serverTimestamp(),
      });

      // Avis contextualisés par pays + spécialité du profil. Unicité globale garantie.
      const cityFr = CITIES_FR[main.code] || main.nameFr;
      const prep = prepPays(main.nameFr, main.code);

      const renderReview = (template: string, specialtyCode: string): string => {
        const specLabel = SPECIALTY_LABELS_FR[specialtyCode] || specialtyCode.toLowerCase();
        return template
          .replace(/\{ville\}/g, cityFr)
          .replace(/\{pays\}/g, main.nameFr)
          .replace(/\{prep_pays\}/g, prep)
          .replace(/\{specialty\}/g, specLabel);
      };

      for (let j = 0; j < reviewCount; j++) {
        const reviewDate = new Date(
          createdAt.getTime() + (j / Math.max(1, reviewCount)) * daysSinceCreation * 24 * 60 * 60 * 1000
        );

        // Cible une spécialité du profil pour ancrer l'avis dans son métier réel
        const reviewSpecialty = randomChoice(specialties);

        // Génère un avis unique en variant template + spécialité jusqu'à trouver un rendu non utilisé
        let rendered = '';
        let attempts = 0;
        do {
          const tpl = randomChoice(REVIEW_TEMPLATES);
          rendered = renderReview(tpl, randomChoice(specialties));
          attempts++;
        } while (usedCommentsGlobal.has(rendered) && attempts < 60);

        // Filet de sécurité : suffixe discret si jamais collision résiduelle
        if (usedCommentsGlobal.has(rendered)) {
          rendered = renderReview(`${randomChoice(REVIEW_TEMPLATES)} En ${graduationYear.slice(-2)}, j'ai eu la chance de pouvoir compter sur lui.`, reviewSpecialty);
        }
        usedCommentsGlobal.add(rendered);

        // Auteur de l'avis : Français expatrié (clientèle cible de sos-expat.com)
        const clientNames = getNamesByCountry('France');
        const clientFirstName = randomChoice([...clientNames.male, ...clientNames.female]);
        const clientLastName = randomChoice(clientNames.lastNames);
        const clientFullName = `${clientFirstName} ${clientLastName}`;

        await addDoc(collection(db, 'reviews'), {
          providerId: uid,
          clientId: `client_${Date.now()}_${j}_${Math.random().toString(36).slice(2, 6)}`,
          clientName: clientFullName,
          authorName: clientFullName,
          clientCountry: 'France',
          rating: randomReviewRating(),
          comment: rendered,
          isPublic: true,
          status: 'published',
          serviceType: 'lawyer_call',
          createdAt: Timestamp.fromDate(reviewDate),
          helpfulVotes: randomInt(0, 18),
          verified: true,
        });
      }

      success++;
      await new Promise(r => setTimeout(r, 35));

    } catch (err) {
      errors++;
      // On garde l'erreur en mémoire pour le rapport
      lastErrorMessage = (err as Error).message;
    }
  }

  return {
    mode: 'execute',
    totalAaaLawyers: audit.totalAaaLawyers,
    matchingMaleFrInBase: audit.matchingMaleFr,
    targets: targets.length,
    okCountries, partialCountries, missingCountries, perCountry,
    totalToCreate,
    created: success,
    errors,
    uniqueReviewsUsed: usedCommentsGlobal.size,
    message: `Création terminée — ${success}/${profilesToCreate.length} profils créés, ${errors} erreur(s)${lastErrorMessage ? ` (dernière: ${lastErrorMessage})` : ''}`,
  };
}

// =============================================================================
// EXPOSITION CONSOLE
// =============================================================================

// =============================================================================
// RATTRAPAGE : aligne le téléphone des AAA Asie/AU sur +33743331201
// =============================================================================
//
// Cible STRICTE pour ne toucher AUCUN profil non concerné :
//   - isAAA === true
//   - role === 'lawyer'
//   - UID commence par 'aaa_lawyer_' (convention de notre générateur)
//   - practiceCountries contient au moins un code Asie-cible OU 'AU'
//   - phone !== '+33743331201' (skip ceux déjà bons → idempotent)
//
// Met à jour ${'users'} ET ${'sos_profiles'} (où existe) pour rester cohérent.
// =============================================================================

import { updateDoc, getDoc } from 'firebase/firestore';

export interface FixPhoneReport {
  mode: 'dry-run' | 'execute';
  scanned: number;
  matchingTargets: number;
  alreadyOk: number;
  toFix: number;
  fixed: number;
  errors: number;
  sampleToFix: Array<{ uid: string; currentPhone: string; mainCountry?: string }>;
  message: string;
}

export async function fixAaaPhonesAsiaOceania(
  options: { dryRun?: boolean } = {}
): Promise<FixPhoneReport> {
  const dryRun = options.dryRun !== false;
  const targets = getTargetCountries();
  const targetCodes = new Set<string>(targets.map(t => t.code));

  const STANDARD_PHONE = '+33743331201';
  const STANDARD_CODE = '+33';

  const snap = await getDocs(query(
    collection(db, 'users'),
    where('isAAA', '==', true),
    where('role', '==', 'lawyer')
  ));

  let scanned = 0;
  let matchingTargets = 0;
  let alreadyOk = 0;
  let fixed = 0;
  let errors = 0;
  const toFix: Array<{ uid: string; currentPhone: string; mainCountry?: string }> = [];

  for (const d of snap.docs) {
    scanned++;
    const p: any = d.data();

    // Doit être un profil de notre générateur
    if (!d.id.startsWith('aaa_lawyer_')) continue;

    const practice: string[] = p.practiceCountries || p.operatingCountries || p.interventionCountries || [];
    const intersects = practice.some((c: string) => targetCodes.has(c));
    if (!intersects) continue;

    matchingTargets++;

    if (p.phone === STANDARD_PHONE && p.phoneCountryCode === STANDARD_CODE) {
      alreadyOk++;
      continue;
    }

    toFix.push({ uid: d.id, currentPhone: p.phone || '(vide)', mainCountry: p.country });

    if (!dryRun) {
      try {
        await updateDoc(doc(db, 'users', d.id), {
          phone: STANDARD_PHONE,
          phoneCountryCode: STANDARD_CODE,
          phoneNumber: STANDARD_PHONE,
        });
        // Aligner sos_profiles si le doc existe
        const sosRef = doc(db, 'sos_profiles', d.id);
        const sosSnap = await getDoc(sosRef);
        if (sosSnap.exists()) {
          await updateDoc(sosRef, {
            phone: STANDARD_PHONE,
            phoneCountryCode: STANDARD_CODE,
            phoneNumber: STANDARD_PHONE,
          });
        }
        fixed++;
      } catch (err) {
        errors++;
      }
      await new Promise(r => setTimeout(r, 25));
    }
  }

  return {
    mode: dryRun ? 'dry-run' : 'execute',
    scanned,
    matchingTargets,
    alreadyOk,
    toFix: toFix.length,
    fixed,
    errors,
    sampleToFix: toFix.slice(0, 10),
    message: dryRun
      ? `${toFix.length} profil(s) à corriger. Pour exécuter: fixAaaPhonesAsiaOceania({ dryRun: false })`
      : `${fixed}/${toFix.length} profil(s) téléphone alignés sur ${STANDARD_PHONE}, ${errors} erreur(s)`,
  };
}

if (typeof window !== 'undefined') {
  (window as any).generateLawyersAsiaOceania = generateLawyersAsiaOceania;
  (window as any).fixAaaPhonesAsiaOceania = fixAaaPhonesAsiaOceania;
}

export default generateLawyersAsiaOceania;
