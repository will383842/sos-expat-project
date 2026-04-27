/**
 * =============================================================================
 * FIX AAA PROFILES ASIE / AUSTRALIE - SCRIPT ADMIN NODE.JS
 * =============================================================================
 *
 * Ce script complete + corrige les profils AAA Asie/AU en utilisant
 * firebase-admin SDK (cote serveur) - bypass les Firestore Security Rules
 * qui bloquent les ecritures sur reviews/call_sessions depuis le navigateur.
 *
 * Scope STRICT (jamais de delete, jamais d'overwrite de donnees valides):
 *  - isAAA === true
 *  - role === 'lawyer'
 *  - UID commence par 'aaa_lawyer_'
 *  - practiceCountries inclut au moins un pays cible (Asie sauf CN, ou AU)
 *
 * Operations idempotentes:
 *  - Avis: ajoute juste ce qui manque pour atteindre p.reviewCount
 *  - Sessions d'appel: ajoute pour atteindre p.totalCalls
 *  - Description: copie bio.fr -> description si manquante
 *  - Carousel: cree ui_profile_carousel s'il n'existe pas
 *  - Telephone: aligne sur +33743331201 si different
 *  - Champs alignes (KYC, subscription, payout, etc.)
 *
 * Usage:
 *   cd sos/firebase/functions
 *   node scripts/fixAaaProfilesAsiaOceania.js --dry-run
 *   node scripts/fixAaaProfilesAsiaOceania.js --execute
 */

const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'sos-urgently-ac307' });
const db = admin.firestore();

// ============================================================================
// PAYS CIBLES : Asie sauf Chine + Australie
// ============================================================================

const TARGET_CODES = new Set([
  'AF','AM','AZ','BH','BD','BT','BN','KH','GE','HK','IN','ID','IR','IQ','IL',
  'JP','JO','KZ','KP','KR','KW','KG','LA','LB','MO','MY','MV','MN','MM','NP',
  'OM','PK','PS','PH','QA','SA','SG','LK','SY','TW','TJ','TH','TL','TR','TM',
  'AE','UZ','VN','YE','AU',
]);

const COUNTRY_NAMES_FR = {
  AF:'Afghanistan', AM:'Armenie', AZ:'Azerbaidjan', BH:'Bahrein', BD:'Bangladesh',
  BT:'Bhoutan', BN:'Brunei', KH:'Cambodge', GE:'Georgie', HK:'Hong Kong',
  IN:'Inde', ID:'Indonesie', IR:'Iran', IQ:'Irak', IL:'Israel',
  JP:'Japon', JO:'Jordanie', KZ:'Kazakhstan', KP:'Coree du Nord', KR:'Coree du Sud',
  KW:'Koweit', KG:'Kirghizistan', LA:'Laos', LB:'Liban', MO:'Macao',
  MY:'Malaisie', MV:'Maldives', MN:'Mongolie', MM:'Myanmar', NP:'Nepal',
  OM:'Oman', PK:'Pakistan', PS:'Palestine', PH:'Philippines', QA:'Qatar',
  SA:'Arabie saoudite', SG:'Singapour', LK:'Sri Lanka', SY:'Syrie', TW:'Taiwan',
  TJ:'Tadjikistan', TH:'Thailande', TL:'Timor oriental', TR:'Turquie', TM:'Turkmenistan',
  AE:'Emirats arabes unis', UZ:'Ouzbekistan', VN:'Vietnam', YE:'Yemen', AU:'Australie',
};

const CITIES_FR = {
  AF:'Kaboul', AM:'Erevan', AZ:'Bakou', BH:'Manama', BD:'Dacca',
  BT:'Thimphou', BN:'Bandar Seri Begawan', KH:'Phnom Penh', GE:'Tbilissi', HK:'Hong Kong',
  IN:'New Delhi', ID:'Jakarta', IR:'Teheran', IQ:'Bagdad', IL:'Tel-Aviv',
  JP:'Tokyo', JO:'Amman', KZ:'Astana', KP:'Pyongyang', KR:'Seoul',
  KW:'Koweit City', KG:'Bichkek', LA:'Vientiane', LB:'Beyrouth', MO:'Macao',
  MY:'Kuala Lumpur', MV:'Male', MN:'Oulan-Bator', MM:'Naypyidaw', NP:'Katmandou',
  OM:'Mascate', PK:'Islamabad', PS:'Ramallah', PH:'Manille', QA:'Doha',
  SA:'Riyad', SG:'Singapour', LK:'Colombo', SY:'Damas', TW:'Taipei',
  TJ:'Douchanbe', TH:'Bangkok', TL:'Dili', TR:'Istanbul', TM:'Achgabat',
  AE:'Dubai', UZ:'Tachkent', VN:'Ho Chi Minh-Ville', YE:'Sanaa', AU:'Sydney',
};

const SPECIALTY_LABELS_FR = {
  URG_ASSISTANCE_PENALE_INTERNATIONALE: 'assistance penale internationale',
  URG_ACCIDENTS_RESPONSABILITE_CIVILE: 'accidents et responsabilite civile',
  URG_RAPATRIEMENT_URGENCE: 'rapatriement d\'urgence',
  CUR_TRADUCTIONS_LEGALISATIONS: 'traductions et legalisations',
  CUR_RECLAMATIONS_LITIGES_MINEURS: 'litiges mineurs et reclamations',
  CUR_DEMARCHES_ADMINISTRATIVES: 'demarches administratives',
  IMMI_VISAS_PERMIS_SEJOUR: 'visa et permis de sejour',
  IMMI_CONTRATS_TRAVAIL_INTERNATIONAL: 'contrats de travail internationaux',
  IMMI_NATURALISATION: 'naturalisation',
  IMMO_ACHAT_VENTE: 'achat-vente immobilier',
  IMMO_LOCATION_BAUX: 'baux et locations',
  IMMO_LITIGES_IMMOBILIERS: 'litiges immobiliers',
  FISC_DECLARATIONS_INTERNATIONALES: 'declarations fiscales internationales',
  FISC_DOUBLE_IMPOSITION: 'double imposition',
  FISC_OPTIMISATION_EXPATRIES: 'optimisation fiscale expatries',
  FAM_MARIAGE_DIVORCE: 'mariage et divorce internationaux',
  FAM_GARDE_ENFANTS_TRANSFRONTALIERE: 'garde d\'enfants transfrontaliere',
  FAM_SCOLARITE_INTERNATIONALE: 'scolarite internationale',
  PATR_SUCCESSIONS_INTERNATIONALES: 'succession internationale',
  PATR_GESTION_PATRIMOINE: 'gestion de patrimoine',
  PATR_TESTAMENTS: 'testaments internationaux',
  ENTR_CREATION_ENTREPRISE_ETRANGER: 'creation d\'entreprise a l\'etranger',
  ENTR_INVESTISSEMENTS: 'investissements internationaux',
  ENTR_IMPORT_EXPORT: 'import-export',
  ASSU_ASSURANCES_INTERNATIONALES: 'assurances internationales',
  ASSU_PROTECTION_DONNEES: 'protection des donnees',
  ASSU_CONTENTIEUX_ADMINISTRATIFS: 'contentieux administratif',
  BANK_PROBLEMES_COMPTES_BANCAIRES: 'comptes bancaires internationaux',
  BANK_VIREMENTS_CREDITS: 'virements et credits internationaux',
  BANK_SERVICES_FINANCIERS: 'services financiers',
};

function prepPays(nameFr, code) {
  const masculin = ['JP','VN','TH','LA','KH','MM','PK','AF','BD','NP','BT','IR','IQ','LB','YE','OM','QA','BH','KW','TJ','KZ','KG','UZ','TM','AZ','BN','TL','TW','KP'];
  const pluriel = ['PH','AE','MV'];
  if (pluriel.includes(code)) return `aux ${nameFr}`;
  if (masculin.includes(code)) return `au ${nameFr}`;
  return `en ${nameFr}`;
}

const REVIEW_TEMPLATES = [
  "Excellent avocat francophone base a {ville}, parfaitement a l'ecoute de mes besoins en {specialty}.",
  "Conseils juridiques exceptionnels {prep_pays}, je le recommande vivement a toute la communaute francaise.",
  "Tres satisfait de ses services {prep_pays} : reponse rapide et solution efficace pour mon dossier de {specialty}.",
  "Expertise remarquable en droit {prep_pays}, dossier complexe de {specialty} resolu en quelques semaines.",
  "Un professionnel devoue base a {ville}, toujours disponible et reactif. Le francais parle est impeccable.",
  "Accompagnement precieux dans mes demarches administratives a {ville}, surtout pour la {specialty}.",
  "Service impeccable, communication claire en francais malgre la distance avec {pays}.",
  "Avocat tres competent a {ville} qui a regle mon dossier de {specialty} bien plus rapidement que prevu.",
  "Professionnalisme exemplaire {prep_pays}, je referai appel a ses services sans hesiter.",
  "Excellent suivi de dossier malgre le decalage horaire avec {pays}, toujours joignable.",
  "Ses conseils m'ont ete extremement precieux pour ma {specialty} {prep_pays}, un grand merci.",
  "Grande expertise juridique : il maitrise parfaitement le droit local {prep_pays} et le droit francais.",
  "Tres bonne experience globale, je recommande sans hesitation a tout francophone {prep_pays}.",
  "Avocat serieux et rigoureux a {ville}, resultats parfaitement conformes a mes attentes.",
  "Pedagogue et patient, il m'a explique en francais toutes les options possibles en matiere de {specialty}.",
  "Service client irreprochable, il repond toujours rapidement meme depuis {pays}.",
  "A su gerer mon dossier de {specialty} {prep_pays} avec brio malgre sa grande complexite.",
  "Je suis tres reconnaissant pour son aide precieuse dans cette affaire delicate a {ville}.",
  "Maitrise parfaite du sujet, conseils en {specialty} toujours avises et adaptes au contexte local.",
  "Excellent rapport qualite-prix pour un service haut de gamme a {ville}.",
  "Tres bon avocat francophone {prep_pays}, ce qui est rare et precieux dans cette region.",
  "Il parle parfaitement francais a {ville}, nos echanges sont toujours fluides et clairs.",
  "Competence et serieux au rendez-vous, pleinement satisfait du resultat de ma {specialty}.",
  "A pris le temps de bien comprendre ma situation d'expatrie {prep_pays} avant de proposer des solutions.",
  "Tarifs raisonnables {prep_pays} pour un service de qualite superieure en francais.",
  "Son experience avec les expatries francais {prep_pays} fait vraiment toute la difference.",
  "Je le recommande chaleureusement a tous les Francais vivant {prep_pays}.",
  "Un avocat de confiance a {ville}, j'ai pu resoudre mes problemes legaux grace a lui.",
  "Efficacite et professionnalisme {prep_pays}, exactement ce que je recherchais.",
  "Grace a son expertise en {specialty}, j'ai obtenu mon dossier sans difficulte {prep_pays}.",
  "Excellent accompagnement pour mon dossier de {specialty} {prep_pays}, merci infiniment.",
  "A su defendre mes interets avec brio face a une situation complexe a {ville}.",
  "Disponible meme le week-end depuis {pays} quand j'avais des urgences.",
  "Documents rediges avec soin en francais et conseils extremement precis pour ma {specialty}.",
  "Un vrai professionnel a {ville} qui connait son metier sur le bout des doigts.",
  "Reactivite impressionnante depuis {pays}, reponse en moins de 24h systematiquement.",
  "Tres content d'avoir trouve un avocat francophone aussi competent {prep_pays}.",
  "Son reseau local a {ville} m'a permis de resoudre des problemes administratifs complexes.",
  "Prend le temps d'expliquer en francais les procedures locales {prep_pays}.",
  "Honoraires transparents des le depart, aucune mauvaise surprise pour mon dossier de {specialty}.",
  "Avocat meticuleux a {ville} qui ne laisse rien au hasard dans le traitement du dossier.",
  "Il a parfaitement gere mon contentieux fiscal avec l'administration {prep_pays}.",
  "Precision juridique impressionnante, je me sens en securite avec lui {prep_pays}.",
  "Sa connaissance du droit local {prep_pays} m'a evite bien des ecueils administratifs.",
  "Reponses claires en francais, structurees et toujours documentees par les textes locaux.",
  "Approche pragmatique et orientee resultats pour ma {specialty} {prep_pays}.",
  "Son sens de la strategie juridique m'a permis de gagner mon proces a {ville}.",
  "Empathique et comprehensif tout en restant rigoureusement professionnel a {ville}.",
  "A obtenu un reglement a l'amiable favorable {prep_pays} quand je pensais devoir aller au proces.",
  "Confidentialite totale, aucun souci concernant la sensibilite de mon dossier {prep_pays}.",
  "Maitrise impeccable de la procedure locale {prep_pays}, dossier boucle en un temps record.",
  "Conseils anticipateurs en {specialty} qui m'ont evite plusieurs erreurs couteuses {prep_pays}.",
  "Excellent negociateur, il a obtenu des conditions tres avantageuses {prep_pays}.",
  "Prend des notes precises et envoie systematiquement un compte-rendu en francais.",
  "Disponible pour des appels en visio depuis {pays}, tres pratique depuis la France.",
  "Bonne articulation avec le notaire local pour ma {specialty} {prep_pays}.",
  "Travail collaboratif efficace avec mon expert-comptable francais pour mes affaires {prep_pays}.",
  "Solides references dans la communaute francaise expatriee a {ville}.",
  "Mes proches expatries a {ville} lui ont aussi fait confiance et tous sont satisfaits.",
  "Cabinet serieux a {ville}, accueil chaleureux et organise en francais.",
  "M'a accompagne lors d'un controle fiscal stressant {prep_pays}, parfaitement prepare.",
  "Connaissance fine de la convention fiscale bilaterale entre la France et {pays}.",
  "Sa rigueur dans la redaction des actes en {specialty} m'a impressionne.",
  "Une ressource precieuse pour tout Francais installe {prep_pays}.",
  "Excellent dans la gestion des dossiers d'immigration complexes {prep_pays}.",
  "Patient avec mes nombreuses questions sur la {specialty}, jamais presse.",
  "M'a evite un piege juridique {prep_pays} qui aurait pu me couter cher.",
  "Strategie de defense parfaitement calibree a ma situation d'expat {prep_pays}.",
  "Grande capacite d'ecoute en francais, comprend immediatement les enjeux locaux.",
  "Reactif aux mails depuis {pays}, generalement une reponse dans la journee.",
  "Son equipe au cabinet de {ville} est tout aussi professionnelle que lui.",
  "Reelle empathie face aux difficultes humaines de mon dossier {prep_pays}.",
  "M'a aide a monter ma societe {prep_pays} sans aucun accroc administratif.",
  "Excellent intermediaire avec les administrations locales {prep_pays}.",
  "Sa lettre de mise en demeure a suffi a debloquer la situation {prep_pays}.",
  "Il connait parfaitement les arcanes du droit local {prep_pays} et international.",
  "Tres bon en {specialty}, m'a bien defendu malgre la complexite du droit local.",
  "Conseils eclaires en {specialty} pour ma situation transfrontaliere France-{pays}.",
  "Sa veille juridique permanente sur le droit {prep_pays} est un vrai plus.",
  "Excellent en {specialty}, achat a {ville} sans aucune surprise.",
  "Il a structure mon patrimoine international entre la France et {pays} avec brio.",
  "Sa maitrise du droit compare entre la France et {pays} est impressionnante.",
  "Recommande par notre consul a {ville}, jamais decu.",
  "Precieux dans la gestion de la double imposition France/{pays}.",
  "Conseils pertinents pour optimiser ma situation fiscale d'expat {prep_pays}.",
  "M'a sauve d'une regularisation administrative compliquee {prep_pays}.",
  "A traite mon dossier {prep_pays} avec la plus grande discretion.",
  "Dossier de {specialty} accepte grace a ses conseils {prep_pays}.",
  "Tres bon reseau de partenaires locaux a {ville}, indispensable.",
  "Argumentation solide qui a convaincu le tribunal de {ville}.",
  "Memoires rediges en francais et en langue locale avec une clarte remarquable.",
  "A negocie de bonnes conditions de divorce international entre la France et {pays}.",
  "Excellent en droit de la famille transfrontalier France/{pays}.",
  "Sa connaissance des procedures de garde {prep_pays} m'a beaucoup aide.",
  "Solution juridique trouvee pour ma {specialty} {prep_pays}.",
  "Disponible pour des consultations le soir depuis {pays}, parfait pour les expatries.",
];

const CLIENT_NAMES_FR = [
  'Sophie Marchand', 'Thomas Lefevre', 'Nathalie Perrot', 'Marc Fontaine',
  'Elodie Tremblay', 'Jean-Pierre Lambert', 'Fatima Benali', 'Claire Dupont',
  'Aminata Diallo', 'Philippe Morel', 'Isabelle Renard', 'Thierry Garnier',
  'Valerie Rousseau', 'Stephane Gagnon', 'Caroline Duval', 'Nicolas Petit',
  'Francois Girard', 'Sandrine Lefevre', 'Laurent Moreau', 'Emilie Duval',
  'Christophe Morel', 'Aurelie Vasseur', 'Pierre Delorme', 'Fabien Gauthier',
  'Melanie Picard', 'David Fontaine', 'Julien Carpentier', 'Antoine Lambert',
  'Camille Dupont', 'Cedric Martin', 'Olivier Nsimba', 'Damien Leroy',
  'Veronique Caron', 'Alexandre Bertrand', 'Didier Lambert', 'Helene Joubert',
  'Bruno Arnaud', 'Patrice Renaud', 'Christine Bonnet', 'Christelle Martin',
  'Jean-Claude Arnaud', 'Stephanie Girard', 'Patrick Nguyen', 'Romain Girard',
  'Anne-Marie Faure', 'Yves Roussel', 'Catherine Lemoine', 'Maxime Vidal',
  'Genevieve Marchand', 'Pascal Roux', 'Beatrice Garnier', 'Olivier Charpentier',
  'Sylvie Petit', 'Eric Mercier', 'Brigitte Aubry', 'Martin Leblanc',
  'Joelle Berger', 'Christian Mathieu', 'Monique Henry', 'Bernard Robin',
];

// ============================================================================
// HELPERS
// ============================================================================

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomReviewRating() {
  const r = Math.random();
  if (r < 0.7) return 5;
  if (r < 0.95) return 4.5;
  return 4;
}

const ALIGNED_VALUES = {
  aaaPayoutMode: 'internal',
  kycDelegated: true,
  kycStatus: 'not_required',
  hasActiveSubscription: true,
  subscriptionStatus: 'active',
  forcedAIAccess: true,
  isEarlyProvider: false,
  referralBy: null,
};

const STANDARD_PHONE = '+33743331201';
const STANDARD_PHONE_CODE = '+33';

// ============================================================================
// MAIN
// ============================================================================

async function run(dryRun) {
  console.log('='.repeat(72));
  console.log(' FIX AAA PROFILES ASIE / AUSTRALIE');
  console.log(` Mode: ${dryRun ? '🔬 DRY-RUN (lecture seule)' : '⚡ EXECUTION (ecritures)'}`);
  console.log('='.repeat(72));

  const usersSnap = await db.collection('users')
    .where('isAAA', '==', true).where('role', '==', 'lawyer').get();

  console.log(`\nScan de ${usersSnap.size} avocats AAA en base...\n`);

  const stats = {
    inScope: 0, okComplete: 0,
    descFixed: 0, slugsFixed: 0, carouselFixed: 0, fieldsFixed: 0,
    phonesFixed: 0, reviewsAdded: 0, sessionsAdded: 0,
    needFix: { desc: 0, slugs: 0, carousel: 0, fields: 0, phone: 0, reviews: 0, sessions: 0 },
    errors: [],
  };

  const usedComments = new Set();

  for (const d of usersSnap.docs) {
    if (!d.id.startsWith('aaa_lawyer_')) continue;
    const p = d.data();
    const practice = p.practiceCountries || p.operatingCountries || p.interventionCountries || [];
    if (!Array.isArray(practice) || !practice.some(c => TARGET_CODES.has(c))) continue;

    stats.inScope++;
    const country = p.country || 'XX';
    const cityFr = CITIES_FR[country] || COUNTRY_NAMES_FR[country] || country;
    const nameFr = COUNTRY_NAMES_FR[country] || country;
    const prep = prepPays(nameFr, country);
    const specialties = Array.isArray(p.specialties) && p.specialties.length ? p.specialties : ['IMMI_VISAS_PERMIS_SEJOUR'];

    let issuesFound = false;

    try {
      // 1) DESCRIPTION
      const descStr = typeof p.description === 'string' ? p.description.trim() : '';
      let bioFr = '';
      if (p.bio && typeof p.bio === 'object' && typeof p.bio.fr === 'string') bioFr = p.bio.fr.trim();
      else if (typeof p.bio === 'string') bioFr = p.bio.trim();

      if (!descStr && bioFr) {
        stats.needFix.desc++; issuesFound = true;
        if (!dryRun) {
          await db.collection('users').doc(d.id).update({ description: bioFr });
          const sosRef = db.collection('sos_profiles').doc(d.id);
          const sosSnap = await sosRef.get();
          if (sosSnap.exists) await sosRef.update({ description: bioFr });
          stats.descFixed++;
        }
      }

      // 2) PHONE
      if (p.phone !== STANDARD_PHONE || p.phoneCountryCode !== STANDARD_PHONE_CODE) {
        stats.needFix.phone++; issuesFound = true;
        if (!dryRun) {
          const update = { phone: STANDARD_PHONE, phoneCountryCode: STANDARD_PHONE_CODE, phoneNumber: STANDARD_PHONE };
          await db.collection('users').doc(d.id).update(update);
          const sosRef = db.collection('sos_profiles').doc(d.id);
          const sosSnap = await sosRef.get();
          if (sosSnap.exists) await sosRef.update(update);
          stats.phonesFixed++;
        }
      }

      // 3) CHAMPS ALIGNES (KYC, subscription, payout, etc.)
      const fieldsToFix = {};
      for (const [k, v] of Object.entries(ALIGNED_VALUES)) {
        if (p[k] !== v) fieldsToFix[k] = v;
      }
      if (Object.keys(fieldsToFix).length > 0) {
        stats.needFix.fields++; issuesFound = true;
        if (!dryRun) {
          await db.collection('users').doc(d.id).update(fieldsToFix);
          const sosRef = db.collection('sos_profiles').doc(d.id);
          const sosSnap = await sosRef.get();
          if (sosSnap.exists) await sosRef.update(fieldsToFix);
          stats.fieldsFixed++;
        }
      }

      // 4) SHORTID + SLUGS (importes ici via require lazy depuis le bundle SPA serait complexe ;
      //    on genere shortId deterministe a partir de l'UID et un slug FR simple)
      if (!p.shortId || !p.slugs || !p.slugs.fr) {
        stats.needFix.slugs++; issuesFound = true;
        if (!dryRun) {
          const shortId = (p.uid || d.id).slice(-6);
          const firstSlug = ((p.firstName || 'maitre') + '').toLowerCase()
            .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
          const slugFr = `fr/avocat-${country.toLowerCase()}/${firstSlug}-${shortId}`;
          const slugs = { fr: slugFr, en: slugFr.replace(/^fr\/avocat-/, 'en/lawyer-'), es: slugFr.replace(/^fr\/avocat-/, 'es/abogado-'), de: slugFr.replace(/^fr\/avocat-/, 'de/anwalt-'), pt: slugFr.replace(/^fr\/avocat-/, 'pt/advogado-'), it: slugFr.replace(/^fr\/avocat-/, 'it/avvocato-'), nl: slugFr.replace(/^fr\/avocat-/, 'nl/advocaat-'), ru: slugFr.replace(/^fr\/avocat-/, 'ru/yurist-'), zh: slugFr.replace(/^fr\/avocat-/, 'zh/lvshi-'), ar: slugFr.replace(/^fr\/avocat-/, 'ar/muhami-'), hi: slugFr.replace(/^fr\/avocat-/, 'hi/vakil-') };
          const updates = { shortId, slugs };
          await db.collection('users').doc(d.id).update(updates);
          const sosRef = db.collection('sos_profiles').doc(d.id);
          const sosSnap = await sosRef.get();
          if (sosSnap.exists) await sosRef.update(updates);
          stats.slugsFixed++;
        }
      }

      // 5) UI_PROFILE_CAROUSEL
      const carouselSnap = await db.collection('ui_profile_carousel').doc(d.id).get();
      if (!carouselSnap.exists) {
        stats.needFix.carousel++; issuesFound = true;
        if (!dryRun) {
          const cardSnap = await db.collection('ui_profile_cards').doc(d.id).get();
          const baseCard = cardSnap.exists ? cardSnap.data() : {
            id: d.id, uid: d.id,
            title: p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
            subtitle: 'Avocat', country: nameFr,
            photo: p.profilePhoto || p.avatar || '',
            rating: p.rating || 5, reviewCount: p.reviewCount || 0,
            languages: p.languages || ['fr'], specialties: p.specialties || [],
            href: `/profile/${d.id}`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          };
          await db.collection('ui_profile_carousel').doc(d.id).set(baseCard);
          stats.carouselFixed++;
        }
      }

      // 6) AVIS — completer pour atteindre p.reviewCount
      const expected = Number(p.reviewCount || 0);
      if (expected > 0) {
        const reviewsSnap = await db.collection('reviews')
          .where('providerId', '==', d.id)
          .where('status', '==', 'published')
          .where('isPublic', '==', true)
          .get();
        const actual = reviewsSnap.size;
        if (actual < expected) {
          stats.needFix.reviews += (expected - actual); issuesFound = true;
          if (!dryRun) {
            const createdAtDate = p.createdAt && p.createdAt.toDate ? p.createdAt.toDate() : new Date('2026-02-15');
            const daysSinceCreation = Math.max(1, Math.floor((Date.now() - createdAtDate.getTime()) / 86400000));
            for (let j = 0; j < (expected - actual); j++) {
              let rendered = '';
              let attempts = 0;
              do {
                const tpl = randomChoice(REVIEW_TEMPLATES);
                const sCode = randomChoice(specialties);
                const sLabel = SPECIALTY_LABELS_FR[sCode] || sCode.toLowerCase();
                rendered = tpl
                  .replace(/\{ville\}/g, cityFr)
                  .replace(/\{pays\}/g, nameFr)
                  .replace(/\{prep_pays\}/g, prep)
                  .replace(/\{specialty\}/g, sLabel);
                attempts++;
              } while (usedComments.has(rendered) && attempts < 60);
              if (usedComments.has(rendered)) {
                rendered = `${rendered} (ref ${country}-${j}-${Date.now().toString().slice(-4)})`;
              }
              usedComments.add(rendered);

              const clientName = randomChoice(CLIENT_NAMES_FR);
              const reviewDate = new Date(createdAtDate.getTime() + ((actual + j) / Math.max(1, expected)) * daysSinceCreation * 86400000);

              await db.collection('reviews').add({
                providerId: d.id,
                clientId: `client_aaa_fix_${d.id.slice(-8)}_${j}`,
                clientName, authorName: clientName, clientCountry: 'France',
                rating: randomReviewRating(),
                comment: rendered,
                isPublic: true, status: 'published', serviceType: 'lawyer_call',
                createdAt: admin.firestore.Timestamp.fromDate(reviewDate),
                helpfulVotes: randomInt(0, 18), verified: true,
              });
              stats.reviewsAdded++;
            }
          }
        }
      }

      // 7) CALL_SESSIONS — completer pour atteindre p.totalCalls
      const totalCallsExpected = Number(p.totalCalls || 0);
      if (totalCallsExpected > 0) {
        const csSnap = await db.collection('call_sessions')
          .where('metadata.providerId', '==', d.id).get();
        const csActual = csSnap.size;
        if (csActual < totalCallsExpected) {
          stats.needFix.sessions += (totalCallsExpected - csActual); issuesFound = true;
          if (!dryRun) {
            const createdAtDate = p.createdAt && p.createdAt.toDate ? p.createdAt.toDate() : new Date('2026-02-15');
            const daysSinceCreation = Math.max(1, Math.floor((Date.now() - createdAtDate.getTime()) / 86400000));
            for (let k = 0; k < (totalCallsExpected - csActual); k++) {
              const callDate = new Date(createdAtDate.getTime() + randomInt(1, daysSinceCreation) * 86400000);
              const callDuration = randomInt(15, 45) * 60;
              const callEndDate = new Date(callDate.getTime() + callDuration * 1000);
              await db.collection('call_sessions').add({
                metadata: {
                  providerId: d.id,
                  providerName: p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
                  clientId: `client_aaa_fix_${d.id.slice(-8)}_${k + 1}`,
                  clientName: `Client ${csActual + k + 1}`,
                },
                status: 'completed',
                duration: callDuration,
                callType: 'video',
                createdAt: admin.firestore.Timestamp.fromDate(callDate),
                startedAt: admin.firestore.Timestamp.fromDate(callDate),
                endedAt: admin.firestore.Timestamp.fromDate(callEndDate),
              });
              stats.sessionsAdded++;
            }
          }
        }
      }

      if (!issuesFound) stats.okComplete++;

    } catch (err) {
      stats.errors.push({ uid: d.id, country, message: err.message });
    }
  }

  console.log('\n' + '='.repeat(72));
  console.log(' RAPPORT FINAL');
  console.log('='.repeat(72));
  console.log(`Profils en scope: ${stats.inScope}`);
  console.log(`Profils OK (rien a faire): ${stats.okComplete}`);
  console.log('');
  console.log('A corriger / corrige:');
  console.log(`  Description:     ${dryRun ? stats.needFix.desc : `${stats.descFixed} corriges`}`);
  console.log(`  Telephone:       ${dryRun ? stats.needFix.phone : `${stats.phonesFixed} corriges`}`);
  console.log(`  Champs alignes:  ${dryRun ? stats.needFix.fields : `${stats.fieldsFixed} corriges`}`);
  console.log(`  ShortId/slugs:   ${dryRun ? stats.needFix.slugs : `${stats.slugsFixed} corriges`}`);
  console.log(`  UI carousel:     ${dryRun ? stats.needFix.carousel : `${stats.carouselFixed} corriges`}`);
  console.log(`  Avis a ajouter:  ${dryRun ? stats.needFix.reviews : `${stats.reviewsAdded} ajoutes`}`);
  console.log(`  Sessions:        ${dryRun ? stats.needFix.sessions : `${stats.sessionsAdded} ajoutees`}`);
  console.log('');
  if (stats.errors.length > 0) {
    console.log(`⚠️  ${stats.errors.length} erreur(s):`);
    stats.errors.slice(0, 10).forEach(e => console.log(`  - ${e.uid} (${e.country}): ${e.message}`));
  } else {
    console.log('✅ Aucune erreur');
  }
  console.log('='.repeat(72));

  if (dryRun) {
    console.log('\n🔬 DRY-RUN termine. Pour executer:');
    console.log('   node scripts/fixAaaProfilesAsiaOceania.js --execute');
  }
}

const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');
run(dryRun)
  .then(() => process.exit(0))
  .catch(err => { console.error('FATAL:', err); process.exit(1); });
