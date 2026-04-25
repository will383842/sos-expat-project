/**
 * Force-migrate legal documents to Firestore (overwrites content even if version matches)
 */
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '../../serviceAccount.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const legalDocsPath = path.join(__dirname, '../src/services/legalDocumentsData.json');
const legalDocs = JSON.parse(fs.readFileSync(legalDocsPath, 'utf8'));

(async () => {
  console.log(`🚀 Force-migrating ${legalDocs.length} legal documents...\n`);
  let updated = 0;

  for (const doc of legalDocs) {
    const docRef = db.collection('legal_documents').doc(doc.id);
    await docRef.set({
      title: doc.title,
      content: doc.content,
      type: doc.type,
      language: doc.language,
      isActive: doc.isActive,
      version: doc.version,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`✅ ${doc.id} (v${doc.version})`);
    updated++;
  }

  console.log(`\n✨ Total updated: ${updated}\n`);
  process.exit(0);
})();
