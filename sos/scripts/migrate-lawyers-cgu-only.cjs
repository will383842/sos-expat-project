/**
 * Push only terms_lawyers v3.2 to Firestore (legal_documents collection).
 *
 * Restricted variant of migrate-provider-cgu-to-firestore.cjs to avoid bumping
 * terms_expats (whose content is unchanged in v3.2 — bumping their version
 * would force unnecessary re-acceptance of those users).
 *
 * Usage:
 *   node sos/scripts/migrate-lawyers-cgu-only.cjs           # dry run
 *   node sos/scripts/migrate-lawyers-cgu-only.cjs --apply   # write
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const APPLY = process.argv.includes('--apply');
const NEW_VERSION = '3.2';

const SERVICE_ACCOUNT_PATH = path.join(__dirname, '..', '..', 'serviceAccount.json');
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const SEED_PATH = path.join(__dirname, '..', 'src', 'services', 'legalDocumentsData.json');
const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));

const lawyerDocs = seed.filter((d) => d.type === 'terms_lawyers');

console.log(`Mode: ${APPLY ? 'APPLY (writing to Firestore)' : 'DRY RUN (no writes)'}`);
console.log(`Project: ${serviceAccount.project_id}`);
console.log(`Target version: ${NEW_VERSION}`);
console.log(`terms_lawyers docs to migrate: ${lawyerDocs.length}\n`);

(async () => {
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const seedDoc of lawyerDocs) {
    const docRef = db.collection('legal_documents').doc(seedDoc.id);
    try {
      const snap = await docRef.get();
      const exists = snap.exists;
      const current = exists ? snap.data() : null;

      if (!exists) {
        console.log(`[CREATE] ${seedDoc.id}`);
        if (APPLY) {
          await docRef.set({
            id: seedDoc.id,
            type: seedDoc.type,
            language: seedDoc.language,
            title: seedDoc.title,
            content: seedDoc.content,
            version: NEW_VERSION,
            isActive: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            publishedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
        created++;
        continue;
      }

      const charsAdded = seedDoc.content.length - (current.content || '').length;
      console.log(
        `[UPDATE] ${seedDoc.id} v${current.version || '?'} -> v${NEW_VERSION} (+${charsAdded} chars)`
      );
      if (APPLY) {
        await docRef.update({
          content: seedDoc.content,
          version: NEW_VERSION,
          title: seedDoc.title,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          publishedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
      updated++;
    } catch (err) {
      console.error(`[ERROR] ${seedDoc.id}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nSummary: created=${created} updated=${updated} errors=${errors}`);
  if (!APPLY && (created > 0 || updated > 0)) {
    console.log(`\nRe-run with --apply to write to Firestore.`);
  } else if (APPLY) {
    console.log(`\nFirestore migration complete.`);
  }
  process.exit(errors > 0 ? 1 : 0);
})();
