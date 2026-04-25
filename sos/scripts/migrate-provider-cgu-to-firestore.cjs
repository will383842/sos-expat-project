/**
 * Migrate updated provider CGU (terms_lawyers_*, terms_expats_*) from
 * legalDocumentsData.json to Firestore (collection: legal_documents).
 *
 * Updates only the content + version + updatedAt + publishedAt fields,
 * preserving any other metadata the admin may have set in Firestore
 * (e.g. isActive flag, createdAt, custom fields).
 *
 * Usage:
 *   # 1. DRY RUN (no writes — shows what would change)
 *   node sos/scripts/migrate-provider-cgu-to-firestore.cjs
 *
 *   # 2. APPLY (writes to Firestore)
 *   node sos/scripts/migrate-provider-cgu-to-firestore.cjs --apply
 *
 * Targets the 18 provider docs (9 langs × 2 types).
 * Bumps version 2.2 → 3.0 (or whatever NEW_VERSION below is set to).
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const APPLY = process.argv.includes('--apply');
const NEW_VERSION = '3.0';

// Initialize Firebase Admin with service account
const SERVICE_ACCOUNT_PATH = path.join(
  __dirname,
  '..',
  '..',
  'serviceAccount.json'
);
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Load updated CGU JSON
const SEED_PATH = path.join(
  __dirname,
  '..',
  'src',
  'services',
  'legalDocumentsData.json'
);
const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));

// Filter to provider docs only (lawyers + helpers)
const providerDocs = seed.filter(
  (d) => d.type === 'terms_lawyers' || d.type === 'terms_expats'
);

console.log(`Mode: ${APPLY ? '🚀 APPLY (writing to Firestore)' : '🧪 DRY RUN (no writes)'}`);
console.log(`Project: ${serviceAccount.project_id}`);
console.log(`Target version: ${NEW_VERSION}`);
console.log(`Provider docs to migrate: ${providerDocs.length}\n`);

(async () => {
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  let errors = 0;

  for (const seedDoc of providerDocs) {
    const docRef = db.collection('legal_documents').doc(seedDoc.id);

    try {
      const snap = await docRef.get();
      const exists = snap.exists;
      const current = exists ? snap.data() : null;

      const newContent = seedDoc.content;
      const newTitle = seedDoc.title;

      // Decide what to do
      if (!exists) {
        // Doc doesn't exist in Firestore → create it
        console.log(`[CREATE] ${seedDoc.id} (was missing in Firestore)`);
        if (APPLY) {
          await docRef.set({
            id: seedDoc.id,
            type: seedDoc.type,
            language: seedDoc.language,
            title: newTitle,
            content: newContent,
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

      // Doc exists — check if content differs
      const contentSame = current.content === newContent;
      const versionSame = current.version === NEW_VERSION;

      if (contentSame && versionSame) {
        console.log(`[skip ] ${seedDoc.id} (already up-to-date, v${current.version})`);
        unchanged++;
        continue;
      }

      // Content or version differs → update
      const contentDiffPreview = contentSame
        ? '(content identical)'
        : `(content updated: ${(newContent.length - current.content.length)} chars added)`;
      console.log(
        `[UPDATE] ${seedDoc.id} v${current.version} → v${NEW_VERSION} ${contentDiffPreview}`
      );

      if (APPLY) {
        // Preserve isActive, createdAt, and any custom fields the admin
        // may have set. Update only content, version, title, updatedAt,
        // publishedAt.
        await docRef.update({
          content: newContent,
          version: NEW_VERSION,
          title: newTitle,
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

  console.log(`\n--- Summary ---`);
  console.log(`Created:   ${created}`);
  console.log(`Updated:   ${updated}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`Errors:    ${errors}`);

  if (!APPLY && (created > 0 || updated > 0)) {
    console.log(
      `\n💡 Re-run with --apply to actually write to Firestore.`
    );
  } else if (APPLY) {
    console.log(`\n✅ Firestore migration complete.`);
  }

  process.exit(errors > 0 ? 1 : 0);
})();
