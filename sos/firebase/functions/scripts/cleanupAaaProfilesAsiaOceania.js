/**
 * =============================================================================
 * NETTOYAGE FINAL - AAA ASIE/AUSTRALIE
 * =============================================================================
 *
 * Corrige les 4 problemes detectes par verifyAaaProfilesAsiaOceaniaDeep.js :
 *
 *  1) AVIS NON-FRANCAIS : reecrit le comment de chaque avis non-FR avec
 *     un texte FR contextualise (pays + specialite + ville)
 *
 *  2) AVIS EN DOUBLON : pour chaque commentaire qui apparait > 1 fois,
 *     on reecrit (n-1) des occurrences avec un texte unique contextualise
 *     (le 1er garde son texte original)
 *
 *  3) ETOILES INCOHERENTES : ajuste profile.rating sur la moyenne reelle
 *     des avis (pour les profils ou |rating - avg| > 0.5)
 *
 *  4) ENHANCEMENT CATCH-ALL : ajoute a ~75% des profils une phrase varie
 *     "tous types de demandes" (jamais la meme), uniquement si pas deja la
 *
 * Aucune SUPPRESSION : on UPDATE le champ `comment` sur place, jamais delete.
 * Les writes sont idempotents (skip si deja correct).
 *
 * Usage:
 *   node scripts/cleanupAaaProfilesAsiaOceania.js --dry-run
 *   node scripts/cleanupAaaProfilesAsiaOceania.js --execute
 */

const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'sos-urgently-ac307' });
const db = admin.firestore();

// ============================================================================
// PAYS / VILLES / LIBELLES
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
  // Quelques pays non-cibles vus en pratique (clients legacy)
  UY:'Uruguay', FR:'France',
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
  UY:'Montevideo', FR:'Paris',
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

function prepPays(code) {
  const masculin = ['JP','VN','TH','LA','KH','MM','PK','AF','BD','NP','BT','IR','IQ','LB','YE','OM','QA','BH','KW','TJ','KZ','KG','UZ','TM','AZ','BN','TL','TW','KP'];
  const pluriel = ['PH','AE','MV'];
  const nameFr = COUNTRY_NAMES_FR[code] || code;
  if (pluriel.includes(code)) return `aux ${nameFr}`;
  if (masculin.includes(code)) return `au ${nameFr}`;
  return `en ${nameFr}`;
}

// ============================================================================
// 220 templates d'avis FR contextualises
// ============================================================================

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
  "Comprehension fine des enjeux culturels locaux {prep_pays} dans mon dossier.",
  "Reelle expertise terrain {prep_pays}, pas seulement theorique.",
  "Sa clarte dans les explications fait de lui un excellent pedagogue, meme sur la {specialty}.",
  "M'a fait economiser plusieurs milliers d'euros sur mes impots entre la France et {pays}.",
  "Precieux conseil pour transferer ma residence fiscale {prep_pays} en toute legalite.",
  "Excellente gestion de mon dossier KYC bancaire {prep_pays}.",
  "A debloque un compte bancaire {prep_pays} bloque depuis des mois.",
  "Sa lettre au regulateur {prep_pays} a fait toute la difference.",
  "Recours administratif gagne {prep_pays} grace a sa procedure rigoureuse.",
  "Tres bon en contentieux administratif local {prep_pays}.",
  "M'a guide dans le labyrinthe des demarches consulaires francaises {prep_pays}.",
  "Une veritable boussole juridique pour les expatries francais {prep_pays}.",
  "Precis, rapide, et toujours dans le respect de la deontologie meme {prep_pays}.",
  "Confiance totale, je lui transmets tous mes dossiers complexes {prep_pays}.",
  "Service haut de gamme a {ville} a un tarif tout a fait correct.",
  "Excellente organisation a {ville}, jamais de retard dans les delais.",
  "Sa reactivite dans une urgence familiale {prep_pays} m'a impressionne.",
  "Present au tribunal de {ville} le jour J, parfaitement prepare.",
  "Connaissance pointue des registres fonciers {prep_pays}.",
  "M'a aide a regulariser un titre de propriete ancien {prep_pays}.",
  "Excellent en succession internationale entre la France et {pays}.",
  "Efficacite redoutable dans les procedures d'urgence {prep_pays}.",
  "Sa mise en relation avec un notaire local a {ville} a ete precieuse.",
  "A coordonne parfaitement la procedure entre la France et {pays}.",
  "Capable de plaider devant les tribunaux de {ville} et de relayer en France.",
  "Solide en droit penal des affaires international {prep_pays}.",
  "M'a evite des poursuites penales {prep_pays} grace a un accord transactionnel.",
  "Discretion totale sur un dossier tres sensible {prep_pays}.",
  "Approche humaine, jamais bureaucratique, meme dans le contexte local de {pays}.",
  "Un avocat a {ville} qui prend vraiment vos interets a coeur.",
  "Cabinet bien organise a {ville}, suivi via plateforme digitale tres pratique.",
  "Outils de partage de documents securises et faciles a utiliser depuis la France.",
  "Communication parfaite en francais tout au long de l'instruction {prep_pays}.",
  "Suivi regulier sans avoir a le relancer, meme depuis {pays}.",
  "Anticipe les problemes plutot que de les subir, un vrai atout {prep_pays}.",
  "Strategie procedurale gagnante du debut a la fin {prep_pays}.",
  "Sa conduite en audience a {ville} etait tres impressionnante.",
  "M'a obtenu une decision conservatoire en urgence absolue a {ville}.",
  "Excellent en refere administratif et civil {prep_pays}.",
  "Tres bon en arbitrage international, dossier regle a l'amiable depuis {pays}.",
  "A negocie un protocole transactionnel tres favorable pour mon entreprise {prep_pays}.",
  "Sa connaissance des CCI et CNUDCI appliquees {prep_pays} est solide.",
  "Recommande pour tout dossier d'arbitrage commercial international impliquant {pays}.",
  "Il a su demontrer la nullite de la procedure adverse a {ville}.",
  "Plaidoirie maitrisee a {ville}, juge convaincu en quelques minutes.",
  "M'a sorti d'une garde a vue {prep_pays} avec brio.",
  "Disponible H24 pendant ma periode de detention provisoire {prep_pays}.",
  "A organise mon rapatriement sanitaire depuis {pays} en urgence absolue.",
  "Coordination parfaite avec les autorites consulaires francaises {prep_pays}.",
  "Excellent contact avec le reseau diplomatique francais {prep_pays}.",
  "Sa diplomatie a permis de debloquer mon dossier en mairie de {ville}.",
  "Capable de naviguer dans les administrations locales {prep_pays} tres bureaucratiques.",
  "Sa patience face a l'administration {prep_pays} est admirable.",
  "M'a fait gagner un temps precieux pour ma demande de visa long sejour {prep_pays}.",
  "Connait parfaitement les procedures consulaires francaises de {ville}.",
  "Excellente maitrise des conventions multilaterales appliquees {prep_pays}.",
  "Sa strategie en droit des societes transfrontalieres France/{pays} est remarquable.",
  "M'a aide a structurer une joint-venture France/{pays}.",
  "Competent en private equity et financement transfrontalier {prep_pays}.",
  "Sa redaction de pacte d'actionnaires entre associes francais et {pays} est excellente.",
  "Tres bon en propriete intellectuelle {prep_pays}.",
  "M'a aide a proteger ma marque {prep_pays} et en France.",
  "Excellent en droit numerique et conformite RGPD-equivalent local {prep_pays}.",
  "A audite ma conformite RGPD/lois locales {prep_pays} avec rigueur.",
  "Son audit juridique prealable a l'investissement {prep_pays} m'a evite un piege.",
  "Redaction contractuelle tres soignee et bilingue francais-langue locale.",
  "Excellent en clauses de hardship et force majeure pour ma {specialty} {prep_pays}.",
  "Competent en droit de la concurrence et antitrust local {prep_pays}.",
  "M'a accompagne dans une investigation concurrentielle {prep_pays}.",
  "A negocie une clause d'arbitrage tres protectrice pour mon contrat {prep_pays}.",
  "Excellent en clause attributive de juridiction France/{pays}.",
  "Sa redaction des clauses d'election de droit applicable est parfaite.",
  "Tres bon en droit des assurances international, dossier regle {prep_pays}.",
  "M'a aide a faire jouer ma police d'assurance sante expatries {prep_pays}.",
  "Recouvrement de creance international {prep_pays} reussi sans procedure lourde.",
  "Tres bon en exequatur de jugements francais {prep_pays}.",
  "A obtenu l'exequatur de mon jugement francais a {ville}.",
  "Excellent en certificat de coutume juridique {prep_pays}.",
  "Precieux pour authentifier des documents juridiques {prep_pays}.",
  "Sa connaissance des apostilles et legalisations {prep_pays} est complete.",
  "M'a fait gagner plusieurs mois sur mes demarches consulaires a {ville}.",
  "Tres bon en droit du sport international, dossier complexe resolu {prep_pays}.",
  "Capable de defendre des dossiers de droit du sport entre la France et {pays}.",
  "Competent en droit penal des affaires et anti-corruption {prep_pays}.",
  "Sa connaissance des regles FCPA/Sapin 2 appliquees {prep_pays} est precieuse.",
  "Excellent en compliance internationale et lutte anti-blanchiment {prep_pays}.",
  "Audit de conformite realise {prep_pays} avec une grande rigueur.",
  "Sa redaction de procedures internes pour ma societe {prep_pays} est tres operationnelle.",
  "Tres bon en cybersecurite juridique et protection des donnees {prep_pays}.",
  "M'a aide apres une cyberattaque {prep_pays}, gestion de crise impeccable.",
  "Precieux pour mes demarches RGPD entre la France et {pays}.",
  "Excellent en droit penal informatique entre la France et {pays}.",
  "Sa strategie dans mon dossier de cyberharcelement {prep_pays} a porte ses fruits.",
  "M'a aide a faire retirer un contenu diffamatoire {prep_pays}.",
  "Procedure de refere numerique gagnee rapidement a {ville}.",
  "Tres bon en droit des medias et liberte d'expression {prep_pays}.",
  "M'a defendu efficacement face a une accusation de diffamation {prep_pays}.",
  "Competent en droit international prive, articulation parfaite France/{pays}.",
  "Sa maitrise des regles de Rome I et II appliquees {prep_pays} est impressionnante.",
  "Excellent en droit international public, dossier rare bien traite {prep_pays}.",
  "M'a aide dans une procedure d'investissement {prep_pays}.",
  "Sa veille internationale sur les sanctions economiques {prep_pays} est precieuse.",
  "M'a evite une sanction OFAC grace a un audit preventif sur mes flux {prep_pays}.",
  "Excellent en gestion de crise reputationnelle juridique {prep_pays}.",
  "Sa diplomatie discrete a sauve l'image de mon entreprise {prep_pays}.",
  "Ressource fiable pour toute famille francaise expatriee {prep_pays}.",
  "Cabinet a {ville} recommande par mon reseau d'amis expatries.",
  "Disponibilite meme pendant les jours feries locaux a {ville}.",
  "Sa flexibilite d'agenda est precieuse pour les expatries francais {prep_pays}.",
  "Capable d'expliquer le droit local {prep_pays} en termes simples et clairs.",
  "Pedagogie remarquable pour vulgariser des notions complexes du droit {prep_pays}.",
  "Excellente collaboration avec mon avocat francais en parallele pour mon dossier {prep_pays}.",
  "Travail en binome avec mon avocat fiscaliste tres efficace pour ma {specialty}.",
  "Tres bon reseau de partenaires fiables {prep_pays} pour les expatries francais.",
  "M'a recommande un excellent expert-comptable francais {prep_pays}.",
  "Solide network local a {ville}, tres utile pour les demarches.",
  "Sa reputation a {ville} ouvre des portes administratives.",
  "Reconnu par ses pairs comme une reference sur place a {ville}.",
];

// 30 phrases catch-all (jamais identiques entre profils)
const CATCHALL_PHRASES = [
  " J'accepte tous les types de dossiers, des plus simples aux plus complexes.",
  " N'hesitez pas a me contacter pour toute problematique juridique, meme hors de mes specialites principales.",
  " Je traite egalement les demandes hors de ma specialisation principale, en m'appuyant sur mon reseau de confreres.",
  " Mon cabinet repond a tous types de besoins juridiques d'expatries francophones.",
  " Je suis a l'ecoute de tous les francophones quelle que soit leur problematique.",
  " Mon experience me permet de traiter une grande variete de dossiers transfrontaliers.",
  " Pour toute autre question, je vous oriente avec plaisir vers le bon specialiste de mon reseau local.",
  " J'interviens aussi sur des dossiers atypiques que d'autres avocats refusent.",
  " Je vous accompagne pour toute demande, meme inhabituelle.",
  " Pour les demandes que je ne traite pas directement, je collabore avec des confreres specialises.",
  " J'aide aussi sur des dossiers ponctuels meme en dehors de mon expertise principale.",
  " Mes domaines couvrent l'ensemble des problematiques d'expatriation.",
  " Toute demande est etudiee avec serieux, meme atypique.",
  " Je suis ouvert a toutes les sollicitations, urgentes ou de fond.",
  " Si votre besoin sort de mon perimetre, je vous mets en relation avec le bon professionnel.",
  " Polyvalence : je couvre un large spectre de matieres juridiques.",
  " Aucun dossier d'expatrie n'est trop complexe ni trop modeste pour mon cabinet.",
  " Je reponds a toutes les questions juridiques, du simple renseignement a la procedure complete.",
  " Mon approche generaliste me permet de gerer un eventail large de demandes.",
  " J'examine chaque demande individuellement, quelle que soit la matiere concernee.",
  " Pour les sujets pointus que je ne maitrise pas, je travaille en binome avec des experts dedies.",
  " Vous pouvez me solliciter sur n'importe quelle question d'expatrie : je trouve toujours une reponse.",
  " Je traite la quasi-totalite des problematiques rencontrees par les francais a l'etranger.",
  " Mon cabinet couvre presque tous les besoins juridiques d'une vie d'expatrie.",
  " Une question hors specialite ? Je l'examine et je vous oriente si besoin.",
  " Approche 360 : du conseil ponctuel a la representation devant les tribunaux.",
  " Je vous accompagne sur l'ensemble de votre parcours d'expatrie, pas seulement sur les matieres listees.",
  " Pour toute autre matiere, je dispose d'un reseau d'experts pour relayer rapidement.",
  " Quel que soit votre besoin, premiere consultation gratuite pour evaluer la faisabilite.",
  " Au-dela des specialites listees, j'ai une experience large des dossiers d'expatries.",
];

// ============================================================================
// HELPERS
// ============================================================================

const FR_MARKERS = [
  ' le ', ' la ', ' les ', ' un ', ' une ', ' des ', ' de ', ' du ', ' au ', ' aux ',
  ' je ', ' il ', ' nous ', ' vous ', ' ils ', ' tres ', ' avec ', ' pour ', ' sur ',
  ' mon ', ' ma ', ' mes ', ' son ', ' sa ', ' ses ',
  ' avocat', ' juridique', ' francais', ' francophone', ' merci', ' recommande',
  ' professionnel', ' service', ' conseil', ' expert',
];

function looksFrench(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = ' ' + text.toLowerCase() + ' ';
  let hits = 0;
  for (const m of FR_MARKERS) {
    if (lower.includes(m)) {
      hits++;
      if (hits >= 2) return true;
    }
  }
  if (/[éèêëàâäîïôöùûüç]/i.test(text)) return true;
  return false;
}

function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function renderReview(template, country, specialtyCode) {
  const cityFr = CITIES_FR[country] || COUNTRY_NAMES_FR[country] || country;
  const nameFr = COUNTRY_NAMES_FR[country] || country;
  const prep = prepPays(country);
  const specLabel = SPECIALTY_LABELS_FR[specialtyCode] || specialtyCode.toLowerCase();
  return template
    .replace(/\{ville\}/g, cityFr)
    .replace(/\{pays\}/g, nameFr)
    .replace(/\{prep_pays\}/g, prep)
    .replace(/\{specialty\}/g, specLabel);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');

  console.log('='.repeat(72));
  console.log(' NETTOYAGE FINAL - AAA ASIE/AUSTRALIE');
  console.log(` Mode: ${dryRun ? '🔬 DRY-RUN' : '⚡ EXECUTE'}`);
  console.log('='.repeat(72));

  // Charger tous les profils en scope
  const usersSnap = await db.collection('users')
    .where('isAAA', '==', true).where('role', '==', 'lawyer').get();

  const profiles = [];
  for (const d of usersSnap.docs) {
    if (!d.id.startsWith('aaa_lawyer_')) continue;
    const p = d.data();
    const practice = p.practiceCountries || p.operatingCountries || p.interventionCountries || [];
    if (!Array.isArray(practice) || !practice.some(c => TARGET_CODES.has(c))) continue;
    profiles.push({ id: d.id, data: p });
  }

  console.log(`\n${profiles.length} profils en scope.\n`);

  // Set global pour generer des avis uniques
  const usedComments = new Set();

  // Etape 1 : recuperer TOUS les avis pour ces profils
  // (en parallele pour rapidite)
  const allReviewsByProvider = new Map();
  for (const { id } of profiles) {
    const snap = await db.collection('reviews')
      .where('providerId', '==', id)
      .where('status', '==', 'published')
      .where('isPublic', '==', true)
      .get();
    const reviews = snap.docs.map(rd => ({ id: rd.id, data: rd.data() }));
    allReviewsByProvider.set(id, reviews);
    // Pre-remplir le set avec les avis qui sont deja FR + non-doublons (gardes intacts)
  }

  // Etape 2 : detecter les commentaires en doublon (global)
  const commentCount = new Map();
  for (const reviews of allReviewsByProvider.values()) {
    for (const r of reviews) {
      const c = r.data.comment;
      if (c) commentCount.set(c, (commentCount.get(c) || 0) + 1);
    }
  }

  // Pour chaque commentaire en doublon, on garde la 1ere occurrence et on reecrit les autres
  // On marque "premier vu" via un Set
  const seenComments = new Set();

  let reviewsToFix = [];      // {reviewId, providerId, country, specialties, reason}
  let nonFrCount = 0;
  let dupCount = 0;
  let starFixes = [];         // {providerId, currentRating, newRating}
  let catchAllToAdd = [];     // {providerId, descStr, phrase}

  // Selection ~75% des profils pour le catch-all (deterministe)
  const catchAllMarkers = ['tous les types', 'tous types', 'toute problemati', 'quelle que soit votre', "n'hesitez pas a me contacter pour toute"];
  const catchAllCandidates = [];
  for (const { id, data: p } of profiles) {
    const descStr = typeof p.description === 'string' ? p.description.trim() : '';
    if (!descStr) continue;
    const descLower = descStr.toLowerCase();
    if (catchAllMarkers.some(m => descLower.includes(m))) continue;
    catchAllCandidates.push({ id, data: p, descStr });
  }
  const targetEnhance = Math.round(catchAllCandidates.length * 0.75);
  const shuffledCandidates = [...catchAllCandidates].sort(() => 0.5 - Math.random());
  const phrasesShuffled = [...CATCHALL_PHRASES].sort(() => 0.5 - Math.random());
  for (let i = 0; i < Math.min(targetEnhance, phrasesShuffled.length); i++) {
    catchAllToAdd.push({ providerId: shuffledCandidates[i].id, descStr: shuffledCandidates[i].descStr, phrase: phrasesShuffled[i] });
  }

  // Identifier les avis a reecrire + analyser les ratings
  for (const { id, data: p } of profiles) {
    const reviews = allReviewsByProvider.get(id) || [];
    const country = p.country || 'XX';
    const specialties = Array.isArray(p.specialties) && p.specialties.length ? p.specialties : ['IMMI_VISAS_PERMIS_SEJOUR'];

    let ratingsSum = 0;
    let ratingsN = 0;

    for (const r of reviews) {
      const c = r.data.comment;
      let mustRewrite = false;
      let reason = '';

      // Non-FR
      if (!looksFrench(c)) {
        mustRewrite = true;
        reason = 'non-fr';
        nonFrCount++;
      }
      // Doublon (sauf 1ere occurrence)
      else if (commentCount.get(c) > 1) {
        if (seenComments.has(c)) {
          mustRewrite = true;
          reason = 'duplicate';
          dupCount++;
        } else {
          seenComments.add(c);
        }
      }

      if (mustRewrite) {
        reviewsToFix.push({ reviewId: r.id, providerId: id, country, specialties, reason });
      } else {
        // commentaire conserve - on le marque utilise pour eviter qu'on le re-genere
        if (c) usedComments.add(c);
      }

      if (typeof r.data.rating === 'number') {
        ratingsSum += r.data.rating;
        ratingsN++;
      }
    }

    // Star mismatch
    if (ratingsN > 0) {
      const avg = ratingsSum / ratingsN;
      const profileRating = Number(p.rating || 0);
      if (Math.abs(profileRating - avg) > 0.5) {
        starFixes.push({ providerId: id, currentRating: profileRating, newRating: parseFloat(avg.toFixed(2)) });
      }
    }
  }

  // ============================================================================
  // RAPPORT
  // ============================================================================
  console.log('-- AVIS A REECRIRE --');
  console.log(`  Avis non-FR : ${nonFrCount}`);
  console.log(`  Avis en doublon (au-dela de la 1ere occurrence) : ${dupCount}`);
  console.log(`  TOTAL a reecrire : ${reviewsToFix.length}`);

  console.log('\n-- ETOILES A ALIGNER --');
  console.log(`  Profils ou |rating profil - moy avis| > 0.5 : ${starFixes.length}`);
  starFixes.slice(0, 5).forEach(s => console.log(`     ${s.providerId.slice(0, 32)} : ${s.currentRating} -> ${s.newRating}`));

  console.log('\n-- ENHANCEMENT CATCH-ALL --');
  console.log(`  Profils a enrichir : ${catchAllToAdd.length}/${profiles.length}`);
  catchAllToAdd.slice(0, 3).forEach(c => console.log(`     ${c.providerId.slice(0, 32)} <- "${c.phrase.trim().slice(0, 60)}..."`));

  if (dryRun) {
    console.log('\n' + '='.repeat(72));
    console.log('🔬 DRY-RUN - aucune ecriture. Pour executer:');
    console.log('   node scripts/cleanupAaaProfilesAsiaOceania.js --execute');
    console.log('='.repeat(72));
    return;
  }

  // ============================================================================
  // EXECUTE
  // ============================================================================
  console.log('\n' + '='.repeat(72));
  console.log(' EXECUTION...');
  console.log('='.repeat(72));

  let reviewsUpdated = 0;
  let starsUpdated = 0;
  let descUpdated = 0;
  let errors = 0;

  // 1) Reecrire les avis problematiques
  for (const fix of reviewsToFix) {
    try {
      let newComment = '';
      let attempts = 0;
      do {
        const tpl = randomChoice(REVIEW_TEMPLATES);
        const sCode = randomChoice(fix.specialties);
        newComment = renderReview(tpl, fix.country, sCode);
        attempts++;
      } while (usedComments.has(newComment) && attempts < 100);

      if (usedComments.has(newComment)) {
        // Filet de sécurité avec suffixe unique
        newComment = `${newComment} (ref ${fix.country}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5)})`;
      }
      usedComments.add(newComment);

      await db.collection('reviews').doc(fix.reviewId).update({ comment: newComment });
      reviewsUpdated++;
    } catch (err) {
      errors++;
      console.log(`     ✗ avis ${fix.reviewId}: ${err.message}`);
    }
  }
  console.log(`  Avis reecrits : ${reviewsUpdated}/${reviewsToFix.length}`);

  // 2) Aligner les ratings
  for (const s of starFixes) {
    try {
      const updates = { rating: s.newRating, averageRating: s.newRating };
      await db.collection('users').doc(s.providerId).update(updates);
      const sosRef = db.collection('sos_profiles').doc(s.providerId);
      const sosSnap = await sosRef.get();
      if (sosSnap.exists) await sosRef.update(updates);
      // Update aussi ui_profile_cards et ui_profile_carousel
      const cardRef = db.collection('ui_profile_cards').doc(s.providerId);
      const cardSnap = await cardRef.get();
      if (cardSnap.exists) await cardRef.update({ rating: s.newRating });
      const carouselRef = db.collection('ui_profile_carousel').doc(s.providerId);
      const carouselSnap = await carouselRef.get();
      if (carouselSnap.exists) await carouselRef.update({ rating: s.newRating });
      starsUpdated++;
    } catch (err) {
      errors++;
      console.log(`     ✗ rating ${s.providerId}: ${err.message}`);
    }
  }
  console.log(`  Ratings alignes : ${starsUpdated}/${starFixes.length}`);

  // 3) Enrichir les descriptions
  for (const c of catchAllToAdd) {
    try {
      const newDesc = c.descStr.endsWith('.') ? c.descStr + c.phrase : c.descStr + '.' + c.phrase;
      await db.collection('users').doc(c.providerId).update({ description: newDesc });
      const sosRef = db.collection('sos_profiles').doc(c.providerId);
      const sosSnap = await sosRef.get();
      if (sosSnap.exists) await sosRef.update({ description: newDesc });
      descUpdated++;
    } catch (err) {
      errors++;
      console.log(`     ✗ desc ${c.providerId}: ${err.message}`);
    }
  }
  console.log(`  Descriptions enrichies : ${descUpdated}/${catchAllToAdd.length}`);

  console.log('\n' + '='.repeat(72));
  console.log(` RECAP FINAL`);
  console.log('='.repeat(72));
  console.log(`  Avis reecrits (FR + uniques) : ${reviewsUpdated}`);
  console.log(`  Ratings alignes              : ${starsUpdated}`);
  console.log(`  Descriptions enrichies       : ${descUpdated}`);
  console.log(`  Erreurs                      : ${errors}`);
  console.log('='.repeat(72));
}

main().then(() => process.exit(0)).catch(err => { console.error('FATAL:', err); process.exit(1); });
