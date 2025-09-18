// firebase/functions/src/utils/ultraDebugLogger.ts
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";
import * as admin from 'firebase-admin';

const DISABLE_FIRESTORE_LOG_LOCAL =
  process.env.DISABLE_FIRESTORE_LOG_LOCAL === '1' ||
  process.env.NODE_ENV === 'development';
// Désactiver l'écriture Firestore en local
const IS_LOCAL =
  process.env.FUNCTIONS_EMULATOR === "true" ||
  process.env.FIREBASE_EMULATOR_HUB ||
  (!process.env.GOOGLE_CLOUD_PROJECT && !process.env.GCP_PROJECT);

interface DebugLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'TRACE';
  source: string;
  message: string;
  data?: any;
  stack?: string;
  context?: {
    functionName?: string;
    requestId?: string;
    userId?: string;
    environment?: string;
    nodeVersion?: string;
    memoryUsage?: any;
    processId?: number;
  };
}

// Fonction utilitaire pour nettoyer les valeurs undefined
function clean<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

class UltraDebugLogger {
  private static instance: UltraDebugLogger | null = null;
  private logs: DebugLogEntry[] = [];
  private isFirebaseInitialized = false;
  private db: FirebaseFirestore.Firestore | null = null;
  private sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  private constructor() {
    console.log(`🚀 [ULTRA DEBUG] Logger initialisé avec session: ${this.sessionId}`);
    if (IS_LOCAL) {
      console.log(`🔧 [ULTRA DEBUG] Mode local détecté - Firestore logs désactivés`);
    }
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): UltraDebugLogger {
    if (!UltraDebugLogger.instance) {
      UltraDebugLogger.instance = new UltraDebugLogger();
    }
    return UltraDebugLogger.instance;
  }

  private setupGlobalErrorHandlers() {
    // Capturer TOUTES les erreurs non gérées
    process.on('uncaughtException', (error) => {
      this.error('UNCAUGHT_EXCEPTION', 'Erreur non capturée détectée', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      console.error('💥 [ULTRA DEBUG] UNCAUGHT EXCEPTION:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.error('UNHANDLED_REJECTION', 'Promise rejection non gérée', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: String(promise)
      });
      console.error('💥 [ULTRA DEBUG] UNHANDLED REJECTION:', reason);
    });

    // Capturer les warnings
    process.on('warning', (warning) => {
      this.warn('PROCESS_WARNING', warning.message, {
        name: warning.name,
        stack: warning.stack
      });
    });
  }

  private getContext(): DebugLogEntry['context'] {
    const memUsage = process.memoryUsage();
    return {
      environment: process.env.NODE_ENV || 'unknown',
      nodeVersion: process.version,
      processId: process.pid,
      memoryUsage: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
      }
    };
  }

  private async initFirebaseIfNeeded() {
    if (!this.isFirebaseInitialized && !IS_LOCAL) {
      try {
        console.log('🔥 [ULTRA DEBUG] Tentative d\'initialisation Firebase...');
        
        if (!getApps().length) {
          console.log('🔥 [ULTRA DEBUG] Aucune app Firebase détectée, initialisation...');
          initializeApp();
          console.log('✅ [ULTRA DEBUG] Firebase initialisé avec succès');
        } else {
          console.log('✅ [ULTRA DEBUG] Firebase déjà initialisé');
        }

        this.db = getFirestore();
        // Ignorer les propriétés undefined - DOIT être appelé AVANT la première écriture
        this.db.settings({ ignoreUndefinedProperties: true });
        console.log('🔥 [ULTRA DEBUG] Firestore récupéré avec ignoreUndefinedProperties');

        // Test de connexion Firestore
        try {
          console.log('🔥 [ULTRA DEBUG] Test de connexion Firestore...');
          const _testDoc = await this.db.collection('_test').limit(1).get();
          void _testDoc; // Neutralise la variable non utilisée
          console.log('✅ [ULTRA DEBUG] Connexion Firestore OK');
        } catch (firestoreError) {
          console.error('❌ [ULTRA DEBUG] Erreur connexion Firestore:', firestoreError);
          this.error('FIRESTORE_CONNECTION_ERROR', 'Impossible de se connecter à Firestore', {
            error: firestoreError instanceof Error ? firestoreError.message : String(firestoreError),
            stack: firestoreError instanceof Error ? firestoreError.stack : undefined
          });
        }

        this.isFirebaseInitialized = true;
      } catch (error) {
        console.error('💥 [ULTRA DEBUG] Erreur initialisation Firebase:', error);
        this.error('FIREBASE_INIT_ERROR', 'Erreur lors de l\'initialisation Firebase', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }
  }

  private createLogEntry(level: DebugLogEntry['level'], source: string, message: string, data?: any, stack?: string): DebugLogEntry {
    return clean({
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
      data: data ? JSON.parse(JSON.stringify(data, null, 2)) : undefined,
      stack,
      context: this.getContext()
    });
  }

  private logToConsole(entry: DebugLogEntry) {
    const emoji = {
      INFO: '📝',
      WARN: '⚠️',
      ERROR: '💥',
      DEBUG: '🔍',
      TRACE: '🔎'
    }[entry.level];

    const prefix = `${emoji} [ULTRA DEBUG] [${entry.level}] [${entry.source}]`;
    
    console.log(`${prefix} ${entry.message}`);
    
    if (entry.data) {
      console.log(`${prefix} DATA:`, JSON.stringify(entry.data, null, 2));
    }
    
    if (entry.stack) {
      console.log(`${prefix} STACK:`, entry.stack);
    }
    
    if (entry.context) {
      console.log(`${prefix} CONTEXT:`, JSON.stringify(entry.context, null, 2));
    }
  }

  info(source: string, message: string, data?: any) {
    const entry = this.createLogEntry('INFO', source, message, data);
    this.logs.push(entry);
    this.logToConsole(entry);
    this.saveToFirestore(entry);
  }

  warn(source: string, message: string, data?: any) {
    const entry = this.createLogEntry('WARN', source, message, data);
    this.logs.push(entry);
    this.logToConsole(entry);
    this.saveToFirestore(entry);
  }

  error(source: string, message: string, data?: any, error?: Error) {
    const stack = error?.stack || new Error().stack;
    const entry = this.createLogEntry('ERROR', source, message, data, stack);
    this.logs.push(entry);
    this.logToConsole(entry);
    this.saveToFirestore(entry);
  }

  debug(source: string, message: string, data?: any) {
    const entry = this.createLogEntry('DEBUG', source, message, data);
    this.logs.push(entry);
    this.logToConsole(entry);
    // Ne pas sauvegarder les logs DEBUG en Firestore pour éviter le spam
  }

  trace(source: string, message: string, data?: any) {
    const stack = new Error().stack;
    const entry = this.createLogEntry('TRACE', source, message, data, stack);
    this.logs.push(entry);
    this.logToConsole(entry);
    // Ne pas sauvegarder les logs TRACE en Firestore pour éviter le spam
  }

  private async saveToFirestore(entry: DebugLogEntry) {
    // Skip Firestore en local
    if (IS_LOCAL) {
      console.log("[ULTRA DEBUG] (local) skip Firestore log");
      return;
    }

    try {
      await this.initFirebaseIfNeeded();
      
      if (this.db) {
        // Nettoyer l'entrée avant sauvegarde
        const payload = clean({
          ...entry,
          sessionId: this.sessionId,
          savedAt: new Date() // Utiliser Date au lieu de FieldValue pour plus de simplicité
        });

        // Sauvegarder dans une collection spéciale pour le debug
        await this.db.collection('ultra_debug_logs').add(payload);
      }
    } catch (saveError) {
      // Ne pas faire planter le système si on ne peut pas sauvegarder les logs
      console.error('❌ [ULTRA DEBUG] Impossible de sauvegarder en Firestore:', saveError);
    }
  }

  // Méthode pour exporter tous les logs de la session
  exportLogs(): DebugLogEntry[] {
    return [...this.logs];
  }

  // Méthode pour vider les logs (utile pour les tests)
  clearLogs() {
    this.logs = [];
    console.log('🧹 [ULTRA DEBUG] Logs vidés');
  }

  // Méthode pour tracer les imports de modules
  traceImport(moduleName: string, fromFile: string) {
    this.trace('MODULE_IMPORT', `Import de ${moduleName}`, {
      module: moduleName,
      from: fromFile,
      timestamp: Date.now()
    });
  }

  // Méthode pour tracer les initialisations
  traceInit(componentName: string, data?: any) {
    this.info('COMPONENT_INIT', `Initialisation de ${componentName}`, {
      component: componentName,
      data,
      timestamp: Date.now()
    });
  }

  // Méthode pour tracer les appels Firebase
  traceFirebaseCall(operation: string, collection?: string, data?: any) {
    this.debug('FIREBASE_CALL', `Opération Firebase: ${operation}`, {
      operation,
      collection,
      data,
      timestamp: Date.now()
    });
  }

  // Méthode pour générer un rapport complet de debugging
  async generateDebugReport(): Promise<string> {
    const report = {
      sessionId: this.sessionId,
      generatedAt: new Date().toISOString(),
      localMode: DISABLE_FIRESTORE_LOG_LOCAL,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        env: {
          NODE_ENV: process.env.NODE_ENV,
          FUNCTIONS_EMULATOR: process.env.FUNCTIONS_EMULATOR,
          FUNCTION_NAME: process.env.FUNCTION_NAME,
          FUNCTION_REGION: process.env.FUNCTION_REGION,
          GCLOUD_PROJECT: process.env.GCLOUD_PROJECT
        }
        
      },
      firebase: {
        isInitialized: this.isFirebaseInitialized,
        apps: (admin.apps ?? []).filter(Boolean).map((app: any) => ({
          name: app.name,
          options: {
            projectId: app?.options?.projectId,
            storageBucket: app?.options?.storageBucket
          }
        }))
      },
      logs: this.logs,
      summary: {
        totalLogs: this.logs.length,
        errorCount: this.logs.filter(l => l.level === 'ERROR').length,
        warnCount: this.logs.filter(l => l.level === 'WARN').length,
        infoCount: this.logs.filter(l => l.level === 'INFO').length,
        debugCount: this.logs.filter(l => l.level === 'DEBUG').length,
        traceCount: this.logs.filter(l => l.level === 'TRACE').length
      }
    };

    return JSON.stringify(report, null, 2);
  }
}

// Export de l'instance singleton
export const ultraLogger = UltraDebugLogger.getInstance();

// Fonction utilitaire pour wrapper les fonctions et tracer leurs appels
export function traceFunction<T extends (...args: any[]) => any>(
  fn: T,
  functionName: string,
  source: string
): T {
  return ((...args: any[]) => {
    ultraLogger.trace(`${source}:${functionName}`, 'Début d\'exécution', {
      arguments: args.map((arg, index) => ({
        index,
        type: typeof arg,
        value: typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      }))
    });

    try {
      const result = fn(...args);
      
      if (result instanceof Promise) {
        return result
          .then((resolvedResult) => {
            ultraLogger.trace(`${source}:${functionName}`, 'Promesse résolue', {
              result: typeof resolvedResult === 'object' ? JSON.stringify(resolvedResult) : String(resolvedResult)
            });
            return resolvedResult;
          })
          .catch((error) => {
            ultraLogger.error(`${source}:${functionName}`, 'Promesse rejetée', {
              error: error.message,
              stack: error.stack
            }, error);
            throw error;
          });
      } else {
        ultraLogger.trace(`${source}:${functionName}`, 'Fonction terminée', {
          result: typeof result === 'object' ? JSON.stringify(result) : String(result)
        });
        return result;
      }
    } catch (error) {
      ultraLogger.error(`${source}:${functionName}`, 'Erreur dans la fonction', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, error instanceof Error ? error : undefined);
      throw error;
    }
  }) as T;
}

// Fonction pour tracer les imports au niveau global
export function traceGlobalImport(moduleName: string, fileName: string) {
  ultraLogger.traceImport(moduleName, fileName);
}
