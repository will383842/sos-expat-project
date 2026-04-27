/**
 * =============================================================================
 * VERIFICATION PROFONDE + ENHANCEMENT - AAA ASIE/AUSTRALIE
 * =============================================================================
 *
 * Verifie pour chaque profil AAA Asie/AU :
 *  1) Telephone == +33743331201
 *  2) Description non vide + ecrite en francais (heuristique)
 *  3) reviewCount profil == nombre reel d'avis en base
 *  4) Tous les avis en francais
 *  5) Aucun doublon de commentaire (global)
 *  6) Etoiles : rating profil dans la fourchette [moy - 0.5, moy + 0.5]
 *
 * Avec --enhance : ajoute aussi a ~75% des profils une phrase varie
 * indiquant qu'il traite tous types de demandes (jamais la meme phrase).
 *
 * Usage:
 *   node scripts/verifyAaaProfilesAsiaOceaniaDeep.js                    # verifie
 *   node scripts/verifyAaaProfilesAsiaOceaniaDeep.js --enhance --dry-run # enhance preview
 *   node scripts/verifyAaaProfilesAsiaOceaniaDeep.js --enhance --execute # enhance ecrit
 */

const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'sos-urgently-ac307' });
const db = admin.firestore();

const TARGET_CODES = new Set([
  'AF','AM','AZ','BH','BD','BT','BN','KH','GE','HK','IN','ID','IR','IQ','IL',
  'JP','JO','KZ','KP','KR','KW','KG','LA','LB','MO','MY','MV','MN','MM','NP',
  'OM','PK','PS','PH','QA','SA','SG','LK','SY','TW','TJ','TH','TL','TR','TM',
  'AE','UZ','VN','YE','AU',
]);

// Phrases « tous types de demandes » - 30 variantes uniques
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

// Mots francais frequents pour detecter une review en francais (heuristique)
const FR_MARKERS = [
  // articles + determinants
  ' le ', ' la ', ' les ', ' un ', ' une ', ' des ', ' de ', ' du ', ' au ', ' aux ',
  ' ce ', ' cet ', ' cette ', ' ces ', ' mon ', ' ma ', ' mes ', ' son ', ' sa ', ' ses ',
  ' notre ', ' votre ', ' leur ', ' leurs ',
  // pronoms
  ' je ', ' il ', ' elle ', ' nous ', ' vous ', ' ils ', ' elles ',
  // adverbes / connecteurs
  ' tres ', ' avec ', ' pour ', ' sur ', ' dans ', ' chez ', ' par ', ' depuis ',
  ' aussi ', ' meme ', ' bien ', ' deja ', ' encore ', ' jamais ', ' toujours ',
  ' sans ', ' contre ', ' selon ', ' pendant ', ' apres ', ' avant ', ' hors ',
  ' mais ', ' donc ', ' car ', ' parce ', ' alors ',
  ' en ', ' et ', ' tout ', ' tous ', ' toute ', ' toutes ', ' rien ', ' quelques ',
  ' bon ', ' bonne ', ' bons ', ' bonnes ', ' grand ', ' grande ', ' petit ', ' petite ',
  ' beaucoup ', ' assez ', ' plus ', ' moins ', ' trop ', ' peu ',
  // verbes courants
  ' est ', ' sont ', ' ete ', ' etre ', ' avoir ', ' fait ', ' faire ',
  ' suis ', ' avons ', ' avez ', ' ont ', ' va ', ' vais ',
  ' aide ', ' aider ', ' aidant ',
  // mots metier / domaine
  ' avocat', ' juridique', ' juridiques', ' droit ', ' francais', ' francophone',
  ' merci', ' recommande', ' professionnel', ' professionnelle',
  ' service', ' conseil', ' expert', ' client', ' dossier', ' procedure',
  ' tribunal', ' cabinet', ' affaire', ' demande',
  // adjectifs frequents
  ' parfait', ' parfaite', ' impeccable', ' irreprochable', ' competent',
  ' satisfait', ' efficace', ' rapide', ' precis',
];

function looksFrench(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = ' ' + text.toLowerCase() + ' ';
  // Au moins 2 marqueurs francais distincts
  let hits = 0;
  for (const m of FR_MARKERS) {
    if (lower.includes(m)) {
      hits++;
      if (hits >= 2) return true;
    }
  }
  // Ou bien des accents francais
  if (/[éèêëàâäîïôöùûüç]/i.test(text)) return true;
  return false;
}

function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function main() {
  const args = process.argv.slice(2);
  const enhance = args.includes('--enhance');
  const execute = args.includes('--execute');
  const enhanceDryRun = enhance && !execute;

  console.log('='.repeat(72));
  console.log(' VERIFICATION PROFONDE - AAA ASIE/AUSTRALIE');
  if (enhance) console.log(` ENHANCE: ${enhanceDryRun ? 'DRY-RUN' : 'EXECUTE'}`);
  console.log('='.repeat(72));

  const usersSnap = await db.collection('users')
    .where('isAAA', '==', true).where('role', '==', 'lawyer').get();

  const inScope = [];
  for (const d of usersSnap.docs) {
    if (!d.id.startsWith('aaa_lawyer_')) continue;
    const p = d.data();
    const practice = p.practiceCountries || p.operatingCountries || p.interventionCountries || [];
    if (!Array.isArray(practice) || !practice.some(c => TARGET_CODES.has(c))) continue;
    inScope.push({ id: d.id, data: p });
  }

  console.log(`\nProfils en scope : ${inScope.length}\n`);

  // Doublons globaux
  const allComments = new Map(); // commentaire -> [providerId,...]
  const issues = {
    badPhone: [],
    emptyDescription: [],
    nonFrenchDescription: [],
    countMismatch: [],   // {uid, expected, actual}
    nonFrenchReviews: [], // {uid, count}
    duplicateReviews: [], // {comment, providers}
    starMismatch: [],    // {uid, profileRating, avgReviews}
    ratingsTooLow: [],   // avg < 4
  };

  // Pour enhancement : detecter ceux qui n'ont pas deja la phrase catch-all
  // Liste etendue : couvre toutes les variantes possibles de phrases generiques
  const catchAllMarkers = [
    'tous les types', 'tous types', 'toute problemati', 'quelle que soit',
    "n'hesitez pas", 'n’hesitez pas',
    'tous les francophones', 'meme hors de mes', 'hors de ma specialisation',
    'tous types de besoins', 'tous types de dossiers', 'tout type',
    'grande variete de dossiers', 'mon reseau de confreres', 'collabore avec des confreres',
    'eventail large', 'large spectre', 'large spectre',
    'aucun dossier', 'toutes les questions', 'toutes les sollicitations',
    'matiere concernee', 'examine chaque demande',
    "parcours d'expatrie", "reseau d'experts", 'sujets pointus',
    'toute autre', 'matiere juridique',
    'approche generaliste', 'ouvert a toutes', 'approche 360',
    'consultation gratuite', 'experience large', 'specialites listees',
    'me solliciter sur', 'questions juridiques', 'demande est etudiee',
    'votre besoin', 'binome avec des experts', 'vous oriente',
  ];
  const candidatesForEnhance = [];

  for (const { id, data: p } of inScope) {
    // 1) Phone
    if (p.phone !== '+33743331201') {
      issues.badPhone.push({ uid: id, found: p.phone || '(vide)' });
    }

    // 2) Description
    const descStr = typeof p.description === 'string' ? p.description.trim() : '';
    if (!descStr) {
      issues.emptyDescription.push({ uid: id });
    } else if (!looksFrench(descStr)) {
      issues.nonFrenchDescription.push({ uid: id, sample: descStr.slice(0, 80) });
    }

    // Detection candidat enhancement (description sans phrase catch-all)
    const descLower = descStr.toLowerCase();
    const hasCatchAll = catchAllMarkers.some(m => descLower.includes(m));
    if (descStr && !hasCatchAll) candidatesForEnhance.push({ id, data: p, descStr });

    // 3-6) Avis
    const reviewsSnap = await db.collection('reviews')
      .where('providerId', '==', id)
      .where('status', '==', 'published')
      .where('isPublic', '==', true)
      .get();

    const expected = Number(p.reviewCount || 0);
    const actual = reviewsSnap.size;
    if (expected !== actual) {
      issues.countMismatch.push({ uid: id, expected, actual, country: p.country });
    }

    let nonFrCount = 0;
    let ratingsSum = 0;
    let ratingsN = 0;
    for (const rd of reviewsSnap.docs) {
      const r = rd.data();
      const c = r.comment;
      if (!looksFrench(c)) nonFrCount++;
      // doublons
      if (c) {
        if (!allComments.has(c)) allComments.set(c, []);
        allComments.get(c).push(id);
      }
      if (typeof r.rating === 'number') {
        ratingsSum += r.rating;
        ratingsN++;
      }
    }
    if (nonFrCount > 0) issues.nonFrenchReviews.push({ uid: id, count: nonFrCount });

    if (ratingsN > 0) {
      const avg = ratingsSum / ratingsN;
      const profileRating = Number(p.rating || 0);
      if (Math.abs(profileRating - avg) > 0.5) {
        issues.starMismatch.push({ uid: id, profileRating: profileRating.toFixed(2), avgReviews: avg.toFixed(2), n: ratingsN });
      }
      if (avg < 4) {
        issues.ratingsTooLow.push({ uid: id, avgReviews: avg.toFixed(2) });
      }
    }
  }

  // Recherche doublons globaux
  for (const [c, providers] of allComments) {
    if (providers.length > 1) issues.duplicateReviews.push({ comment: c.slice(0, 80), occurrences: providers.length });
  }

  // ============================================================================
  // RAPPORT
  // ============================================================================
  console.log('-- TELEPHONE --');
  console.log(`  Profils sans le telephone standard : ${issues.badPhone.length}`);
  if (issues.badPhone.length > 0) issues.badPhone.slice(0, 5).forEach(x => console.log(`     ${x.uid} -> ${x.found}`));

  console.log('\n-- DESCRIPTION --');
  console.log(`  Sans description : ${issues.emptyDescription.length}`);
  console.log(`  Description non-francais : ${issues.nonFrenchDescription.length}`);
  if (issues.nonFrenchDescription.length > 0) issues.nonFrenchDescription.slice(0, 3).forEach(x => console.log(`     ${x.uid} : ${x.sample}...`));

  console.log('\n-- COHERENCE NOMBRE D\'AVIS --');
  console.log(`  Discordance reviewCount/reel : ${issues.countMismatch.length}`);
  if (issues.countMismatch.length > 0) issues.countMismatch.slice(0, 5).forEach(x => console.log(`     ${x.uid} (${x.country}) : profile.reviewCount=${x.expected}, reel=${x.actual}`));

  console.log('\n-- AVIS NON FRANCAIS --');
  console.log(`  Profils avec >=1 avis non-FR : ${issues.nonFrenchReviews.length}`);
  if (issues.nonFrenchReviews.length > 0) issues.nonFrenchReviews.slice(0, 5).forEach(x => console.log(`     ${x.uid} : ${x.count} avis non-FR`));

  console.log('\n-- DOUBLONS D\'AVIS --');
  console.log(`  Commentaires en doublon (global) : ${issues.duplicateReviews.length}`);
  if (issues.duplicateReviews.length > 0) issues.duplicateReviews.slice(0, 5).forEach(x => console.log(`     "${x.comment}..." (${x.occurrences} fois)`));

  console.log('\n-- ETOILES vs MOYENNE AVIS --');
  console.log(`  Discordance > 0.5 etoile : ${issues.starMismatch.length}`);
  if (issues.starMismatch.length > 0) issues.starMismatch.slice(0, 5).forEach(x => console.log(`     ${x.uid} : profil=${x.profileRating}, moy=${x.avgReviews} (sur ${x.n})`));
  console.log(`  Profils avec moyenne < 4* : ${issues.ratingsTooLow.length}`);

  console.log('\n-- ENHANCEMENT (phrases catch-all) --');
  console.log(`  Candidats sans phrase catch-all : ${candidatesForEnhance.length}/${inScope.length}`);

  // ============================================================================
  // ENHANCEMENT
  // ============================================================================
  if (enhance) {
    // ~75% des candidats - selection aleatoire reproductible
    const targetCount = Math.round(candidatesForEnhance.length * 0.75);
    const shuffled = [...candidatesForEnhance].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, targetCount);

    // Phrases uniques par profil - shuffler les phrases pour usage unique
    const phrases = [...CATCHALL_PHRASES].sort(() => Math.random() - 0.5);
    if (selected.length > phrases.length) {
      console.log(`\n⚠️  ${selected.length} candidats mais ${phrases.length} phrases uniques disponibles.`);
      // On en prendra juste autant qu'il y a de phrases
      selected.length = phrases.length;
    }

    console.log(`\n-- ENHANCEMENT : ${selected.length} profils a enrichir --`);

    if (enhanceDryRun) {
      console.log('  (DRY-RUN, aucune ecriture)');
      selected.slice(0, 5).forEach((c, i) => {
        console.log(`     ${c.id} (${c.data.country}) <- "${phrases[i]}"`);
      });
      if (selected.length > 5) console.log(`     ... et ${selected.length - 5} autres`);
    } else {
      let enhanced = 0;
      let errors = 0;
      for (let i = 0; i < selected.length; i++) {
        const { id, descStr } = selected[i];
        const phrase = phrases[i];
        const newDesc = descStr.endsWith('.') ? descStr + phrase : descStr + '.' + phrase;
        try {
          await db.collection('users').doc(id).update({ description: newDesc });
          const sosRef = db.collection('sos_profiles').doc(id);
          const sosSnap = await sosRef.get();
          if (sosSnap.exists) await sosRef.update({ description: newDesc });
          enhanced++;
        } catch (err) {
          errors++;
          console.log(`     ✗ ${id}: ${err.message}`);
        }
      }
      console.log(`  ${enhanced}/${selected.length} description(s) enrichie(s), ${errors} erreur(s)`);
    }
  }

  console.log('\n' + '='.repeat(72));
  const total = issues.badPhone.length + issues.emptyDescription.length + issues.nonFrenchDescription.length
    + issues.countMismatch.length + issues.nonFrenchReviews.length + issues.duplicateReviews.length
    + issues.starMismatch.length;
  if (total === 0) console.log('✅ AUCUN PROBLEME DETECTE - profils parfaitement coherents');
  else console.log(`⚠️  ${total} probleme(s) detecte(s) - voir details ci-dessus`);
  console.log('='.repeat(72));
}

main().then(() => process.exit(0)).catch(err => { console.error('FATAL:', err); process.exit(1); });
