// src/config/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  serverTimestamp,
  setLogLevel,
  type Firestore,
} from "firebase/firestore";
import { getStorage, connectStorageEmulator, type FirebaseStorage } from "firebase/storage";
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable,
  // ⚠️ ne pas importer 'Functions' ici (pas exporté selon les versions)
  // type HttpsCallable est exporté sur la plupart des versions, mais on n'en a pas besoin
} from "firebase/functions";

/** ----------------------------------------
 *  Configuration Firebase (variables .env)
 * ---------------------------------------- */
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// Vérifications basiques d’env
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("❌ Variables d'environnement Firebase manquantes");
  throw new Error("Configuration Firebase incomplète");
}
if (!firebaseConfig.storageBucket) {
  console.error("❌ VITE_FIREBASE_STORAGE_BUCKET manquant");
  throw new Error("Storage bucket non configuré");
}

/** ----------------------------------------------------
 *  Initialisation app (HMR-safe) + services Firebase
 * ---------------------------------------------------- */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth / Storage / Firestore
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

// Firestore avec cache offline multi-onglets
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

// 🔇 Réduire le bruit Firestore (logs seulement si erreur)
setLogLevel("error");

/** ----------------------------------------------------
 *  Cloud Functions — Région unifiée
 * ---------------------------------------------------- */
const RAW_REGION = (import.meta.env.VITE_FUNCTIONS_REGION ?? "europe-west1").toString();
const RAW_REGION_DEV = (import.meta.env.VITE_FUNCTIONS_REGION_DEV ?? "").toString();
const IS_DEV = Boolean(import.meta.env.DEV);
const REGION = IS_DEV && RAW_REGION_DEV ? RAW_REGION_DEV : RAW_REGION;

// ✅ Instance Functions (type inféré automatiquement)
export const functions = getFunctions(app, REGION);

/** ----------------------------------------
 *  Emulateurs (optionnels en local)
 * ---------------------------------------- */
const parseBool = (v: unknown): boolean => {
  if (v == null) return false;
  const s = String(v).toLowerCase().trim();
  return s === "1" || s === "true" || s === "yes" || s === "on";
};

const USE_EMULATORS = parseBool(import.meta.env.VITE_USE_EMULATORS ?? "");
const EMU_HOST = (import.meta.env.VITE_EMULATOR_HOST ?? "127.0.0.1").toString();
const PORT_AUTH = Number(import.meta.env.VITE_EMULATOR_PORT_AUTH ?? 9099);
const PORT_FS = Number(import.meta.env.VITE_EMULATOR_PORT_FIRESTORE ?? 8080);
const PORT_FUNC = Number(import.meta.env.VITE_EMULATOR_PORT_FUNCTIONS ?? 5001);
const PORT_STORAGE = Number(import.meta.env.VITE_EMULATOR_PORT_STORAGE ?? 9199);

if (USE_EMULATORS && typeof window !== "undefined") {
  try {
    connectAuthEmulator(auth, `http://${EMU_HOST}:${PORT_AUTH}`, { disableWarnings: true });
  } catch { /* noop */ }
  try {
    connectFirestoreEmulator(db, EMU_HOST, PORT_FS);
  } catch { /* noop */ }
  try {
    connectFunctionsEmulator(functions, EMU_HOST, PORT_FUNC);
  } catch { /* noop */ }
  try {
    connectStorageEmulator(storage, EMU_HOST, PORT_STORAGE);
  } catch { /* noop */ }
}

/** ----------------------------------------
 *  Log unique de diagnostic (au boot)
 * ---------------------------------------- */
console.log("✅ Firebase initialisé :", {
  projectId: app.options.projectId,
  usingEmulators: USE_EMULATORS,
  functionsRegion: REGION,
});

/** ----------------------------------------
 *  Helper httpsCallable typé (sans any explicite)
 * ---------------------------------------- */
// name: nom de la callable Firebase
// TPayload: type des données envoyées
// TReturn: type des données retournées
export function call<TPayload, TReturn = unknown>(name: string) {
  // Le type de retour est inféré comme HttpsCallable<TPayload, TReturn>
  return httpsCallable<TPayload, TReturn>(functions, name);
}

// ✅ Expose aussi httpsCallable si besoin d'import direct
export { httpsCallable } from "firebase/functions";

// Exports utiles ponctuels
export { serverTimestamp };

export default app;



