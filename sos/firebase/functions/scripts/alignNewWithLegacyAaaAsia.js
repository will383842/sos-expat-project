/**
 * =============================================================================
 * ALIGNEMENT : ajoute aux NOUVEAUX profils AAA Asie/AU les champs presents
 * dans 100% du LEGACY (pour parfaite coherence schema)
 * =============================================================================
 *
 * Champs critiques presents dans 24/24 legacy mais absents des nouveaux :
 *   - lockedRates       : objet (commission system)
 *   - rateLockDate      : timestamp
 *   - rateLockMigration : ISO string '2026-03-15T13:13:56.819Z'
 *   - lang              : 'fr'
 *   - language          : 'fr'
 *   - photoURL          : '' (vide tant que pas de photo)
 *
 * Cible STRICTE : profils crees aujourd'hui (timestamp >= 2026-04-24).
 * Idempotent : skip les champs deja presents.
 *
 * Usage:
 *   node scripts/alignNewWithLegacyAaaAsia.js --dry-run
 *   node scripts/alignNewWithLegacyAaaAsia.js --execute
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

const THRESHOLD = 1777000000000; // 2026-04-24

// Valeurs cibles (calees sur les valeurs legacy a 100%)
const STANDARD_LOCKED_RATES = {
  client_call_lawyer: 200,
  client_call_expat: 100,
  signup_bonus: 200,
};
const STANDARD_RATE_LOCK_MIGRATION = '2026-03-15T13:13:56.819Z';
const STANDARD_LANG = 'fr';
const STANDARD_PHOTO_URL = '';
const STANDARD_COMMISSION_PLAN_ID = 'promo_launch_2026';
const STANDARD_COMMISSION_PLAN_NAME = 'Plan Lancement (taux actuels)';
// Timestamp standard de migration AI (date legacy commune)
const STANDARD_AI_MIGRATED_TS = admin.firestore.Timestamp.fromDate(new Date('2026-01-31T06:02:03Z'));

function extractTimestamp(uid) {
  const m = uid.match(/aaa_lawyer_(?:[a-z]{2}_)?(\d{10,})_/);
  return m ? Number(m[1]) : 0;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');

  console.log('='.repeat(72));
  console.log(' ALIGNEMENT NOUVEAUX -> SCHEMA LEGACY (Asie/AU)');
  console.log(` Mode: ${dryRun ? 'DRY-RUN' : 'EXECUTE'}`);
  console.log('='.repeat(72));

  const usersSnap = await db.collection('users')
    .where('isAAA','==',true).where('role','==','lawyer').get();

  const newProfiles = [];
  for (const d of usersSnap.docs) {
    if (!d.id.startsWith('aaa_lawyer_')) continue;
    const p = d.data();
    const practice = p.practiceCountries || p.operatingCountries || p.interventionCountries || [];
    if (!Array.isArray(practice) || !practice.some(c => TARGET_CODES.has(c))) continue;
    const ts = extractTimestamp(d.id);
    if (ts < THRESHOLD) continue;
    newProfiles.push({ id: d.id, ts, p });
  }

  console.log(`\n${newProfiles.length} profils nouveaux detectes (timestamp >= ${new Date(THRESHOLD).toISOString().split('T')[0]})\n`);

  let counts = {
    lockedRates: 0, rateLockDate: 0, rateLockMigration: 0,
    lang: 0, language: 0, photoURL: 0,
    commissionPlanId: 0, commissionPlanName: 0, aaaAiAccessMigratedAt: 0,
    createdByAdmin: 0,
  };
  let fixed = 0;
  let errors = 0;

  for (const { id, p } of newProfiles) {
    const updates = {};

    if (p.lockedRates === undefined) {
      updates.lockedRates = STANDARD_LOCKED_RATES;
      counts.lockedRates++;
    }
    if (p.rateLockDate === undefined) {
      // Utiliser le createdAt du profil pour realisme
      updates.rateLockDate = p.createdAt || admin.firestore.FieldValue.serverTimestamp();
      counts.rateLockDate++;
    }
    if (p.rateLockMigration === undefined) {
      updates.rateLockMigration = STANDARD_RATE_LOCK_MIGRATION;
      counts.rateLockMigration++;
    }
    if (p.lang === undefined) {
      updates.lang = STANDARD_LANG;
      counts.lang++;
    }
    if (p.language === undefined) {
      updates.language = STANDARD_LANG;
      counts.language++;
    }
    if (p.photoURL === undefined) {
      updates.photoURL = STANDARD_PHOTO_URL;
      counts.photoURL++;
    }
    if (p.commissionPlanId === undefined) {
      updates.commissionPlanId = STANDARD_COMMISSION_PLAN_ID;
      counts.commissionPlanId++;
    }
    if (p.commissionPlanName === undefined) {
      updates.commissionPlanName = STANDARD_COMMISSION_PLAN_NAME;
      counts.commissionPlanName++;
    }
    if (p.aaaAiAccessMigratedAt === undefined) {
      updates.aaaAiAccessMigratedAt = STANDARD_AI_MIGRATED_TS;
      counts.aaaAiAccessMigratedAt++;
    }
    if (p.createdByAdmin === undefined) {
      updates.createdByAdmin = true;
      counts.createdByAdmin++;
    }

    if (Object.keys(updates).length === 0) continue;

    if (!dryRun) {
      try {
        await db.collection('users').doc(id).update(updates);
        const sosRef = db.collection('sos_profiles').doc(id);
        const sosSnap = await sosRef.get();
        if (sosSnap.exists) await sosRef.update(updates);
        fixed++;
      } catch (err) {
        errors++;
        console.log(`     X ${id}: ${err.message}`);
      }
    } else {
      fixed++;
    }
  }

  console.log('='.repeat(72));
  console.log(' RAPPORT');
  console.log('='.repeat(72));
  console.log(`Profils a aligner    : ${fixed}/${newProfiles.length}`);
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${k.padEnd(22)} : ${v} profil(s) ${dryRun ? 'a ajouter' : 'mis a jour'}`);
  }
  if (errors > 0) console.log(`Erreurs : ${errors}`);
  console.log('='.repeat(72));

  if (dryRun) {
    console.log('\nDRY-RUN. Pour executer:');
    console.log('   node scripts/alignNewWithLegacyAaaAsia.js --execute');
  }
}

main().then(() => process.exit(0)).catch(err => { console.error('FATAL:', err); process.exit(1); });
