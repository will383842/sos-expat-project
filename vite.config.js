import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const USE_EMULATORS = String(env.VITE_USE_EMULATORS).toLowerCase() === 'true'
  const PROJECT_ID = env.VITE_FIREBASE_PROJECT_ID || 'sos-urgently-ac307'
  const REGION = env.VITE_FUNCTIONS_REGION || 'europe-west1'

  const target = USE_EMULATORS
    ? `http://127.0.0.1:5001/${PROJECT_ID}/${REGION}`
    : `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: [
        'firebase',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'firebase/functions',
        'firebase/storage',
        'firebase/analytics',
      ],
      esbuildOptions: {
        target: 'esnext'
      }
    },
    build: {
      target: 'esnext',
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('firebase') || id.includes('@firebase')) {
              return 'firebase';
            }
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
    },
    server: {
      cors: {
        origin: true,
        credentials: true,
      },
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
        }
      }
    }
  }
})