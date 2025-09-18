import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getApp } from 'firebase/app';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase'; // adapte ce chemin selon ton projet
import { useAuth } from '../contexts/AuthContext';

const vapidKey = 'BAu8XYFKlF2_FC9BH3zPzZRH-KfEJjcRN0J6rCOIoBy7-LFw8_nxz6lkRaMwSNKS2IcrnVpyDDO6Wm1T3qNflOw';

export function useFCM() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role === 'client') return;

    const app = getApp();
    const messaging = getMessaging(app);

    // Demande la permission au navigateur
    Notification.requestPermission().then(async (permission) => {
      if (permission === 'granted') {
        try {
          const token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js'),
          });

          if (token) {
            console.log('✅ Token FCM reçu :', token);

            // Sauvegarde le token FCM dans Firestore
            await setDoc(doc(db, 'fcm_tokens', user.id), {
              uid: user.id,
              token,
              updatedAt: new Date(),
              role: user.role,
            });

          } else {
            console.warn('⚠️ Aucun token reçu');
          }
        } catch (error) {
          console.error('❌ Erreur lors du getToken FCM :', error);
        }
      } else {
        console.warn('⚠️ Permission de notification refusée');
      }
    });

    // Gère les messages reçus quand app est ouverte
    onMessage(messaging, (payload) => {
      console.log('📨 Notification reçue pendant l’utilisation : ', payload);
    });
  }, [user]);
}
