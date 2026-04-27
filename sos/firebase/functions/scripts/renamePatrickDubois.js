/**
 * =============================================================================
 * RENOMMAGE : Patrick Dubois -> Aurelien Vasseur
 * =============================================================================
 *
 * Cible : aaa_lawyer_1764092736260_53nh2d (couvre 9 pays SE-Asie)
 * Met a jour de maniere coherente :
 *   - firstName, lastName, fullName, displayName
 *   - email (slug du nouveau nom)
 *   - slugs multilingues (regeneres autour du nouveau prenom)
 *   - bio.fr / bio.en / description (remplace "Patrick" -> "Aurelien")
 *   - users + sos_profiles + ui_profile_cards + ui_profile_carousel
 *
 * Idempotent : skip si deja renomme.
 *
 * Usage:
 *   node scripts/renamePatrickDubois.js --dry-run
 *   node scripts/renamePatrickDubois.js --execute
 */

const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ projectId: 'sos-urgently-ac307' });
const db = admin.firestore();

const TARGET_UID = 'aaa_lawyer_1764092736260_53nh2d';
const NEW_FIRST = 'Aurelien';
const NEW_LAST = 'Vasseur';
const NEW_FULL = `${NEW_FIRST} ${NEW_LAST}`;
const NEW_EMAIL_LOCAL = `aurelien.vasseur.${Math.floor(Math.random() * 900) + 100}`; // unique
const NEW_EMAIL = `${NEW_EMAIL_LOCAL}@cabinet-fr-expat.com`;

function slugify(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
}

function rebuildSlugs(oldSlugs, oldFirst, newFirst) {
  if (!oldSlugs || typeof oldSlugs !== 'object') return oldSlugs;
  const newSlugs = {};
  const oldSlug = slugify(oldFirst);
  const newSlug = slugify(newFirst);
  for (const [lang, slug] of Object.entries(oldSlugs)) {
    if (typeof slug === 'string') {
      // Remplace le prenom dans le slug : /xxx-pays/{prenom}-spec-shortid
      newSlugs[lang] = slug.replace(new RegExp(`/${oldSlug}-`, 'i'), `/${newSlug}-`);
    } else {
      newSlugs[lang] = slug;
    }
  }
  return newSlugs;
}

function rewriteText(text, oldFirst, oldLast, newFirst, newLast) {
  if (typeof text !== 'string') return text;
  // Remplace les variantes : "Patrick Dubois", "Patrick", "Dubois"
  let out = text;
  out = out.replace(new RegExp(`\\b${oldFirst}\\s+${oldLast}\\b`, 'g'), `${newFirst} ${newLast}`);
  out = out.replace(new RegExp(`\\b${oldFirst}\\b`, 'g'), newFirst);
  out = out.replace(new RegExp(`\\bMaitre\\s+${oldLast}\\b`, 'g'), `Maitre ${newLast}`);
  out = out.replace(new RegExp(`\\b${oldLast}\\b`, 'g'), newLast);
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');

  console.log('='.repeat(72));
  console.log(' RENOMMAGE Patrick Dubois -> ' + NEW_FULL);
  console.log(` Mode: ${dryRun ? 'DRY-RUN' : 'EXECUTE'}`);
  console.log('='.repeat(72));

  // 1) Charger le profil
  const userRef = db.collection('users').doc(TARGET_UID);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    console.log('Profil introuvable :', TARGET_UID);
    process.exit(1);
  }
  const p = userSnap.data();

  console.log('Avant :');
  console.log('  firstName:', p.firstName);
  console.log('  lastName:', p.lastName);
  console.log('  fullName:', p.fullName);
  console.log('  email:', p.email);
  console.log('  slug FR:', p.slugs?.fr);

  if (p.firstName === NEW_FIRST && p.lastName === NEW_LAST) {
    console.log('\nDeja renomme, rien a faire.');
    process.exit(0);
  }

  if (p.firstName !== 'Patrick' || p.lastName !== 'Dubois') {
    console.log('\nProfil cible n a pas firstName=Patrick lastName=Dubois ; on annule par securite.');
    console.log('  found:', p.firstName, p.lastName);
    process.exit(1);
  }

  // 2) Construire les nouveaux champs
  const newSlugs = rebuildSlugs(p.slugs, 'Patrick', NEW_FIRST);
  const newBio = {
    fr: rewriteText(p.bio?.fr || '', 'Patrick', 'Dubois', NEW_FIRST, NEW_LAST),
    en: rewriteText(p.bio?.en || '', 'Patrick', 'Dubois', NEW_FIRST, NEW_LAST),
  };
  const newDesc = rewriteText(p.description || '', 'Patrick', 'Dubois', NEW_FIRST, NEW_LAST);

  console.log('\nApres :');
  console.log('  firstName:', NEW_FIRST);
  console.log('  lastName:', NEW_LAST);
  console.log('  fullName:', NEW_FULL);
  console.log('  email:', NEW_EMAIL);
  console.log('  slug FR:', newSlugs?.fr);

  if (dryRun) {
    console.log('\nDRY-RUN, aucune ecriture.');
    process.exit(0);
  }

  // 3) Update users
  const updates = {
    firstName: NEW_FIRST,
    lastName: NEW_LAST,
    fullName: NEW_FULL,
    displayName: NEW_FULL,
    email: NEW_EMAIL,
    slugs: newSlugs,
    bio: newBio,
    description: newDesc,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await userRef.update(updates);
  console.log('users : ' + Object.keys(updates).length + ' champs mis a jour');

  // 4) Update sos_profiles
  const sosRef = db.collection('sos_profiles').doc(TARGET_UID);
  if ((await sosRef.get()).exists) {
    await sosRef.update(updates);
    console.log('sos_profiles : mis a jour');
  }

  // 5) Update ui_profile_cards
  const cardRef = db.collection('ui_profile_cards').doc(TARGET_UID);
  const cardSnap = await cardRef.get();
  if (cardSnap.exists) {
    const cardUpdate = {
      title: NEW_FULL,
      slugs: newSlugs,
      href: newSlugs?.fr ? `/${newSlugs.fr}` : `/profile/${TARGET_UID}`,
    };
    await cardRef.update(cardUpdate);
    console.log('ui_profile_cards : mis a jour');
  }

  // 6) Update ui_profile_carousel
  const carouselRef = db.collection('ui_profile_carousel').doc(TARGET_UID);
  const carouselSnap = await carouselRef.get();
  if (carouselSnap.exists) {
    const carUpdate = {
      title: NEW_FULL,
      slugs: newSlugs,
      href: newSlugs?.fr ? `/${newSlugs.fr}` : `/profile/${TARGET_UID}`,
    };
    await carouselRef.update(carUpdate);
    console.log('ui_profile_carousel : mis a jour');
  }

  // 7) Update reviews qui pourraient mentionner le nom
  const reviewsSnap = await db.collection('reviews').where('providerId', '==', TARGET_UID).get();
  let reviewsUpdated = 0;
  for (const rd of reviewsSnap.docs) {
    const r = rd.data();
    const oldComment = r.comment || '';
    if (oldComment.includes('Patrick') || oldComment.includes('Dubois')) {
      const newComment = rewriteText(oldComment, 'Patrick', 'Dubois', NEW_FIRST, NEW_LAST);
      if (newComment !== oldComment) {
        await rd.ref.update({ comment: newComment });
        reviewsUpdated++;
      }
    }
  }
  console.log('reviews : ' + reviewsUpdated + ' commentaire(s) avec mention du nom mis a jour');

  console.log('\n' + '='.repeat(72));
  console.log(' RENOMMAGE TERMINE');
  console.log('='.repeat(72));
}

main().then(() => process.exit(0)).catch(err => { console.error('FATAL:', err); process.exit(1); });
