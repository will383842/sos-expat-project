import * as scheduler from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

export const checkProviderInactivity = scheduler.onSchedule(
  {
    schedule: 'every 10 minutes',
    timeZone: 'Europe/Paris',
  },
  async () => {
    console.log('🔍 Vérification inactivité prestataires...');

    const db = admin.firestore();
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    const onlineProvidersSnapshot = await db
      .collection('sos_profiles')
      .where('isOnline', '==', true)
      .get();

    const batch = db.batch();
    let count = 0;

    for (const doc of onlineProvidersSnapshot.docs) {
      const data = doc.data();
      const lastActivity = data.lastActivity?.toMillis?.() || 0;

      if (lastActivity < tenMinutesAgo) {
        console.log(`⏰ Mise hors ligne : ${doc.id}`);
        batch.update(doc.ref, {
          isOnline: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const userRef = db.collection('users').doc(doc.id);
        batch.update(userRef, {
          isOnline: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
      console.log(`✅ ${count} prestataires mis hors ligne`);
    } else {
      console.log('✅ Aucun prestataire inactif');
    }
  }
);