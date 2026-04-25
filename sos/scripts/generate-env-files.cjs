// scripts/generate-env-files.cjs
// ⚠️ ATTENTION: Ce script est DÉPRÉCIÉ - Ne pas exécuter en production !
// Les fichiers .env sont maintenant gérés manuellement avec des configurations complètes.
// Ce script ne doit être utilisé QUE pour initialiser un nouveau projet.

const fs = require("fs");
const path = require("path");

// =============================================================================
// CLÉS STRIPE UNIFIÉES (2026-01-13)
// Compte Stripe: 51RFHjp (SOS Expat)
// =============================================================================

// P2-1 FIX 2026-04-25: Stripe publishable keys are no longer hardcoded.
// They MUST be provided via env vars when this script runs (CI/CD or local).
//   - STRIPE_PUBLIC_KEY_LIVE  : pk_live_… (production)
//   - STRIPE_PUBLIC_KEY_TEST  : pk_test_… (development)
// Backward compat: STRIPE_PUBLIC_KEY_FOR_FRONTEND or VITE_STRIPE_PUBLIC_KEY take precedence.
const isProduction = process.env.NODE_ENV === 'production';
const STRIPE_PUBLIC_KEY = process.env.STRIPE_PUBLIC_KEY_FOR_FRONTEND
  || process.env.VITE_STRIPE_PUBLIC_KEY
  || (isProduction ? process.env.STRIPE_PUBLIC_KEY_LIVE : process.env.STRIPE_PUBLIC_KEY_TEST);

if (!STRIPE_PUBLIC_KEY) {
  console.error('❌ ERREUR: aucune clé Stripe publique fournie.');
  console.error('   Définir STRIPE_PUBLIC_KEY_LIVE (prod) ou STRIPE_PUBLIC_KEY_TEST (dev) dans l\'environnement.');
  process.exit(1);
}

// Validation: s'assurer que c'est bien une clé publique (pk_*)
if (!STRIPE_PUBLIC_KEY.startsWith('pk_')) {
  console.error('❌ ERREUR: STRIPE_PUBLIC_KEY doit commencer par "pk_" (clé publique)');
  console.error('   Fourni:', STRIPE_PUBLIC_KEY.substring(0, 10) + '...');
  process.exit(1);
}

// =============================================================================
// SÉCURITÉ: Vérifier si les fichiers .env existent déjà
// =============================================================================

const rootDir = process.cwd();
const envFiles = ['.env', '.env.production', '.env.development', '.env.local'];
const existingFiles = envFiles.filter(f => fs.existsSync(path.join(rootDir, f)));

if (existingFiles.length > 0) {
  console.log('');
  console.log('⚠️  ATTENTION: Des fichiers .env existent déjà:');
  existingFiles.forEach(f => console.log(`   - ${f}`));
  console.log('');
  console.log('Ce script va les ÉCRASER avec une configuration MINIMALE.');
  console.log('Les fichiers actuels contiennent probablement plus de variables.');
  console.log('');
  console.log('Pour continuer, supprimez manuellement les fichiers ou utilisez:');
  console.log('   FORCE=true node scripts/generate-env-files.cjs');
  console.log('');

  if (process.env.FORCE !== 'true') {
    console.log('❌ Annulé pour éviter la perte de configuration.');
    process.exit(1);
  }

  console.log('⚠️  Mode FORCE activé - Écrasement des fichiers...');
}

// =============================================================================
// TEMPLATES DE CONFIGURATION
// =============================================================================

const envDevelopment = `# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION DEVELOPMENT - SOS EXPAT PLATFORM
# Généré par generate-env-files.cjs le ${new Date().toISOString()}
# ═══════════════════════════════════════════════════════════════════════════════

# FIREBASE (pour le frontend Vite)
VITE_FIREBASE_API_KEY=AIzaSyCLp02v_ywBw67d4VD7rQ2tCQUdKp83CT8
VITE_FIREBASE_AUTH_DOMAIN=sos-urgently-ac307.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sos-urgently-ac307
VITE_FIREBASE_STORAGE_BUCKET=sos-urgently-ac307.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=268195823113
VITE_FIREBASE_APP_ID=1:268195823113:web:10bf2e5bacdc1816f182d8

# EMULATEURS
VITE_USE_EMULATORS=false

# STRIPE (clé publique TEST - compte 51RFHjp)
VITE_STRIPE_PUBLIC_KEY=${STRIPE_KEYS.TEST}

# FUNCTIONS
VITE_FUNCTIONS_REGION=europe-west1

# GOOGLE ANALYTICS 4 & TAG MANAGER
VITE_GA4_MEASUREMENT_ID=G-XZTJK0L3RK
VITE_GTM_ID=GTM-P53H3RLF
`;

const envProduction = `# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURATION PRODUCTION - SOS EXPAT PLATFORM
# Généré par generate-env-files.cjs le ${new Date().toISOString()}
# ═══════════════════════════════════════════════════════════════════════════════

# FIREBASE (pour le frontend Vite)
VITE_FIREBASE_API_KEY=AIzaSyCLp02v_ywBw67d4VD7rQ2tCQUdKp83CT8
VITE_FIREBASE_AUTH_DOMAIN=sos-urgently-ac307.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sos-urgently-ac307
VITE_FIREBASE_STORAGE_BUCKET=sos-urgently-ac307.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=268195823113
VITE_FIREBASE_APP_ID=1:268195823113:web:10bf2e5bacdc1816f182d8

# EMULATEURS
VITE_USE_EMULATORS=false

# STRIPE (clé publique LIVE - compte 51RFHjp)
VITE_STRIPE_PUBLIC_KEY=${STRIPE_KEYS.LIVE}

# FUNCTIONS
VITE_FUNCTIONS_REGION=europe-west1

# GOOGLE ANALYTICS 4 & TAG MANAGER
VITE_GA4_MEASUREMENT_ID=G-XZTJK0L3RK
VITE_GTM_ID=GTM-P53H3RLF
`;

// =============================================================================
// GÉNÉRATION DES FICHIERS
// =============================================================================

// Création .env.development
fs.writeFileSync(path.join(rootDir, ".env.development"), envDevelopment);
console.log("✅ Fichier .env.development créé (clé TEST)");

// Création .env.production
fs.writeFileSync(path.join(rootDir, ".env.production"), envProduction);
console.log("✅ Fichier .env.production créé (clé LIVE)");

console.log("");
console.log("🚀 Configuration générée !");
console.log("");
console.log("📋 Clés Stripe utilisées:");
console.log(`   TEST: pk_test_51RFHjp...${STRIPE_KEYS.TEST.slice(-8)}`);
console.log(`   LIVE: pk_live_51RFHjp...${STRIPE_KEYS.LIVE.slice(-8)}`);
console.log("");
console.log("⚠️  N'oubliez pas de configurer Cloudflare Pages avec:");
console.log(`   VITE_STRIPE_PUBLIC_KEY = ${STRIPE_KEYS.LIVE}`);
