/**
 * =============================================================================
 * COMPARAISON : profils AAA crees aujourd'hui vs profils AAA legacy
 * =============================================================================
 *
 * Distingue les profils par UID timestamp :
 *   - NOUVEAUX : timestamp >= 2026-04-24 (commence par 17772...)
 *   - LEGACY : timestamp anterieur
 *
 * Compare :
 *   - Presence de chaque champ (qui en a, qui n'en a pas)
 *   - Distribution des valeurs (numeriques)
 *   - Coherence schema
 *   - Statistiques d'avis
 *
 * Usage:
 *   node scripts/compareNewVsLegacyAaaAsia.js
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

// Timestamp seuil : tout ce qui est cree apres 2026-04-24 = NOUVEAU
const THRESHOLD = 1777000000000;

function extractTimestamp(uid) {
  // aaa_lawyer_xx_TIMESTAMP_RANDOM ou aaa_lawyer_TIMESTAMP_RANDOM
  const m = uid.match(/aaa_lawyer_(?:[a-z]{2}_)?(\d{10,})_/);
  return m ? Number(m[1]) : 0;
}

async function main() {
  console.log('='.repeat(72));
  console.log(' COMPARAISON NOUVEAUX vs LEGACY (Asie/AU)');
  console.log('='.repeat(72));

  const usersSnap = await db.collection('users')
    .where('isAAA','==',true).where('role','==','lawyer').get();

  const newProfiles = [];
  const legacyProfiles = [];

  for (const d of usersSnap.docs) {
    if (!d.id.startsWith('aaa_lawyer_')) continue;
    const p = d.data();
    const practice = p.practiceCountries || p.operatingCountries || p.interventionCountries || [];
    if (!Array.isArray(practice) || !practice.some(c => TARGET_CODES.has(c))) continue;
    const ts = extractTimestamp(d.id);
    const item = { id: d.id, ts, p };
    if (ts >= THRESHOLD) newProfiles.push(item);
    else legacyProfiles.push(item);
  }

  console.log(`\nProfils NOUVEAUX (timestamp >= ${new Date(THRESHOLD).toISOString().split('T')[0]}) : ${newProfiles.length}`);
  console.log(`Profils LEGACY  (anterieurs) : ${legacyProfiles.length}\n`);
  console.log('UIDs nouveaux :', newProfiles.map(x => x.id).join(', '));

  // ============================================================================
  // Analyse de schema : quels champs existent dans chaque groupe ?
  // ============================================================================
  function fieldStats(profiles) {
    const fields = {};
    for (const { p } of profiles) {
      for (const [k, v] of Object.entries(p)) {
        if (!fields[k]) fields[k] = { count: 0, types: new Set(), samples: [] };
        fields[k].count++;
        fields[k].types.add(Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);
        if (fields[k].samples.length < 3 && v !== null && v !== undefined) {
          let sample = v;
          if (typeof v === 'object') {
            if (Array.isArray(v)) sample = `[${v.slice(0, 2).map(x => typeof x === 'object' ? JSON.stringify(x).slice(0, 30) : String(x)).join(', ')}${v.length > 2 ? '...' : ''}] (${v.length})`;
            else sample = JSON.stringify(v).slice(0, 80);
          } else if (typeof v === 'string' && v.length > 50) sample = v.slice(0, 50) + '...';
          fields[k].samples.push(sample);
        }
      }
    }
    return fields;
  }

  const newFields = fieldStats(newProfiles);
  const legacyFields = fieldStats(legacyProfiles);
  const allFieldNames = new Set([...Object.keys(newFields), ...Object.keys(legacyFields)]);

  // ============================================================================
  // RAPPORT : champs presents partout / dans un seul groupe
  // ============================================================================
  console.log('\n' + '='.repeat(72));
  console.log(' SCHEMA - presence des champs');
  console.log('='.repeat(72));

  const onlyNew = [], onlyLegacy = [], both = [];
  const N = newProfiles.length, L = legacyProfiles.length;
  for (const name of [...allFieldNames].sort()) {
    const inNew = newFields[name];
    const inLegacy = legacyFields[name];
    if (inNew && !inLegacy) onlyNew.push(name);
    else if (!inNew && inLegacy) onlyLegacy.push(name);
    else both.push(name);
  }

  console.log(`\nChamps presents dans LES DEUX groupes : ${both.length}`);
  console.log(`Champs presents UNIQUEMENT dans NOUVEAUX : ${onlyNew.length}`);
  if (onlyNew.length > 0) {
    onlyNew.forEach(n => console.log(`  + ${n} (samples: ${newFields[n].samples.slice(0,2).join(' | ')})`));
  }
  console.log(`\nChamps presents UNIQUEMENT dans LEGACY : ${onlyLegacy.length}`);
  if (onlyLegacy.length > 0) {
    onlyLegacy.forEach(n => console.log(`  - ${n} (chez ${legacyFields[n].count}/${L} legacy)`));
  }

  // Champs avec couverture differente (presents dans les deux mais pas a 100%)
  console.log(`\nChamps avec COUVERTURE DIFFERENTE entre les deux groupes :`);
  let anyDiff = false;
  for (const name of both) {
    const newCov = (newFields[name].count / N * 100).toFixed(0);
    const legCov = (legacyFields[name].count / L * 100).toFixed(0);
    if (newCov !== legCov) {
      anyDiff = true;
      console.log(`  ${name.padEnd(30)} new=${newCov}% legacy=${legCov}%`);
    }
  }
  if (!anyDiff) console.log('  (aucun, parfait)');

  // ============================================================================
  // VALEURS NUMERIQUES : distribution
  // ============================================================================
  console.log('\n' + '='.repeat(72));
  console.log(' DISTRIBUTION DES VALEURS NUMERIQUES');
  console.log('='.repeat(72));

  const numericFields = ['rating', 'reviewCount', 'totalCalls', 'successRate', 'price', 'duration', 'yearsOfExperience'];
  for (const f of numericFields) {
    const newVals = newProfiles.map(x => Number(x.p[f] || 0)).filter(v => !isNaN(v));
    const legVals = legacyProfiles.map(x => Number(x.p[f] || 0)).filter(v => !isNaN(v));
    if (newVals.length === 0 && legVals.length === 0) continue;
    const stat = (arr) => {
      if (arr.length === 0) return 'n/a';
      const sum = arr.reduce((a, b) => a + b, 0);
      const avg = (sum / arr.length).toFixed(2);
      const min = Math.min(...arr);
      const max = Math.max(...arr);
      return `avg=${avg} min=${min} max=${max} (n=${arr.length})`;
    };
    console.log(`  ${f.padEnd(22)} NEW: ${stat(newVals)}`);
    console.log(`  ${''.padEnd(22)} LEG: ${stat(legVals)}`);
  }

  // ============================================================================
  // STATS AVIS : par profil
  // ============================================================================
  console.log('\n' + '='.repeat(72));
  console.log(' STATS AVIS par groupe');
  console.log('='.repeat(72));

  async function reviewStats(profiles) {
    let totalReviews = 0;
    const ratings = [];
    const lengths = [];
    for (const { id } of profiles) {
      const snap = await db.collection('reviews')
        .where('providerId', '==', id)
        .where('status', '==', 'published')
        .where('isPublic', '==', true)
        .get();
      totalReviews += snap.size;
      for (const r of snap.docs) {
        const data = r.data();
        if (typeof data.rating === 'number') ratings.push(data.rating);
        if (typeof data.comment === 'string') lengths.push(data.comment.length);
      }
    }
    const avg = (arr) => arr.length === 0 ? 'n/a' : (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
    return {
      totalReviews,
      avgPerProfile: profiles.length === 0 ? 'n/a' : (totalReviews / profiles.length).toFixed(1),
      avgRating: avg(ratings),
      avgCommentLen: avg(lengths),
      minLen: lengths.length === 0 ? 'n/a' : Math.min(...lengths),
      maxLen: lengths.length === 0 ? 'n/a' : Math.max(...lengths),
    };
  }

  const newStats = await reviewStats(newProfiles);
  const legStats = await reviewStats(legacyProfiles);
  console.log(`  NEW    total=${newStats.totalReviews} avg/profil=${newStats.avgPerProfile} ratingMoy=${newStats.avgRating} commLen[${newStats.minLen}-${newStats.maxLen}, moy=${newStats.avgCommentLen}]`);
  console.log(`  LEGACY total=${legStats.totalReviews} avg/profil=${legStats.avgPerProfile} ratingMoy=${legStats.avgRating} commLen[${legStats.minLen}-${legStats.maxLen}, moy=${legStats.avgCommentLen}]`);

  // ============================================================================
  // CONCLUSION
  // ============================================================================
  console.log('\n' + '='.repeat(72));
  console.log(' CONCLUSION');
  console.log('='.repeat(72));
  if (onlyNew.length === 0 && onlyLegacy.length === 0) {
    console.log('✅ Schema strictement identique entre nouveaux et legacy.');
  } else {
    console.log(`⚠️  Differences de schema :`);
    if (onlyNew.length > 0) console.log(`   - ${onlyNew.length} champ(s) UNIQUEMENT chez les NOUVEAUX (potentielles ameliorations)`);
    if (onlyLegacy.length > 0) console.log(`   - ${onlyLegacy.length} champ(s) UNIQUEMENT chez le LEGACY (potentielles regressions)`);
  }
  console.log('='.repeat(72));
}

main().then(() => process.exit(0)).catch(err => { console.error('FATAL:', err); process.exit(1); });
