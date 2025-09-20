"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ultraLogger = void 0;
exports.traceFunction = traceFunction;
exports.traceGlobalImport = traceGlobalImport;
// firebase/functions/src/utils/ultraDebugLogger.ts
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const admin = __importStar(require("firebase-admin"));
const DISABLE_FIRESTORE_LOG_LOCAL = process.env.DISABLE_FIRESTORE_LOG_LOCAL === '1' ||
    process.env.NODE_ENV === 'development';
// Désactiver l'écriture Firestore en local
const IS_LOCAL = process.env.FUNCTIONS_EMULATOR === "true" ||
    process.env.FIREBASE_EMULATOR_HUB ||
    (!process.env.GOOGLE_CLOUD_PROJECT && !process.env.GCP_PROJECT);
// Fonction utilitaire pour nettoyer les valeurs undefined
function clean(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}
class UltraDebugLogger {
    constructor() {
        this.logs = [];
        this.isFirebaseInitialized = false;
        this.db = null;
        // ✅ FIXED: Replace deprecated substr() with substring()
        this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        console.log(`🚀 [ULTRA DEBUG] Logger initialisé avec session: ${this.sessionId}`);
        if (IS_LOCAL) {
            console.log(`🔧 [ULTRA DEBUG] Mode local détecté - Firestore logs désactivés`);
        }
        this.setupGlobalErrorHandlers();
    }
    static getInstance() {
        if (!UltraDebugLogger.instance) {
            UltraDebugLogger.instance = new UltraDebugLogger();
        }
        return UltraDebugLogger.instance;
    }
    setupGlobalErrorHandlers() {
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
    getContext() {
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
    async initFirebaseIfNeeded() {
        if (!this.isFirebaseInitialized && !IS_LOCAL) {
            try {
                console.log('🔥 [ULTRA DEBUG] Tentative d\'initialisation Firebase...');
                if (!(0, app_1.getApps)().length) {
                    console.log('🔥 [ULTRA DEBUG] Aucune app Firebase détectée, initialisation...');
                    (0, app_1.initializeApp)();
                    console.log('✅ [ULTRA DEBUG] Firebase initialisé avec succès');
                }
                else {
                    console.log('✅ [ULTRA DEBUG] Firebase déjà initialisé');
                }
                this.db = (0, firestore_1.getFirestore)();
                // Ignorer les propriétés undefined - DOIT être appelé AVANT la première écriture
                this.db.settings({ ignoreUndefinedProperties: true });
                console.log('🔥 [ULTRA DEBUG] Firestore récupéré avec ignoreUndefinedProperties');
                // Test de connexion Firestore
                try {
                    console.log('🔥 [ULTRA DEBUG] Test de connexion Firestore...');
                    const _testDoc = await this.db.collection('_test').limit(1).get();
                    void _testDoc; // Neutralise la variable non utilisée
                    console.log('✅ [ULTRA DEBUG] Connexion Firestore OK');
                }
                catch (firestoreError) {
                    console.error('❌ [ULTRA DEBUG] Erreur connexion Firestore:', firestoreError);
                    this.error('FIRESTORE_CONNECTION_ERROR', 'Impossible de se connecter à Firestore', {
                        error: firestoreError instanceof Error ? firestoreError.message : String(firestoreError),
                        stack: firestoreError instanceof Error ? firestoreError.stack : undefined
                    });
                }
                this.isFirebaseInitialized = true;
            }
            catch (error) {
                console.error('💥 [ULTRA DEBUG] Erreur initialisation Firebase:', error);
                this.error('FIREBASE_INIT_ERROR', 'Erreur lors de l\'initialisation Firebase', {
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined
                });
            }
        }
    }
    // ✅ CRITICAL FIX: Add circular reference handling
    sanitizeCircularReferences(obj) {
        const seen = new WeakSet();
        try {
            return JSON.parse(JSON.stringify(obj, (_, value) => {
                if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) {
                        return '[Circular Reference]';
                    }
                    seen.add(value);
                }
                return value;
            }));
        }
        catch (error) {
            // If JSON.stringify fails completely, return safe representation
            return {
                error: 'Failed to serialize object',
                type: typeof obj,
                constructor: obj?.constructor?.name || 'unknown',
                keys: obj && typeof obj === 'object' ? Object.keys(obj).slice(0, 10) : []
            };
        }
    }
    // ✅ CRITICAL FIX: Updated createLogEntry method
    createLogEntry(level, source, message, data, stack) {
        return clean({
            timestamp: new Date().toISOString(),
            level,
            source,
            message,
            // ✅ FIXED: Use sanitizeCircularReferences instead of direct JSON.parse/stringify
            data: data ? this.sanitizeCircularReferences(data) : undefined,
            stack,
            context: this.getContext()
        });
    }
    logToConsole(entry) {
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
            try {
                console.log(`${prefix} DATA:`, JSON.stringify(entry.data, null, 2));
            }
            catch (e) {
                console.log(`${prefix} DATA: [Unable to stringify data]`);
            }
        }
        if (entry.stack) {
            console.log(`${prefix} STACK:`, entry.stack);
        }
        if (entry.context) {
            try {
                console.log(`${prefix} CONTEXT:`, JSON.stringify(entry.context, null, 2));
            }
            catch (e) {
                console.log(`${prefix} CONTEXT: [Unable to stringify context]`);
            }
        }
    }
    info(source, message, data) {
        const entry = this.createLogEntry('INFO', source, message, data);
        this.logs.push(entry);
        this.logToConsole(entry);
        this.saveToFirestore(entry);
    }
    warn(source, message, data) {
        const entry = this.createLogEntry('WARN', source, message, data);
        this.logs.push(entry);
        this.logToConsole(entry);
        this.saveToFirestore(entry);
    }
    error(source, message, data, error) {
        const stack = error?.stack || new Error().stack;
        const entry = this.createLogEntry('ERROR', source, message, data, stack);
        this.logs.push(entry);
        this.logToConsole(entry);
        this.saveToFirestore(entry);
    }
    debug(source, message, data) {
        const entry = this.createLogEntry('DEBUG', source, message, data);
        this.logs.push(entry);
        this.logToConsole(entry);
        // Ne pas sauvegarder les logs DEBUG en Firestore pour éviter le spam
    }
    trace(source, message, data) {
        const stack = new Error().stack;
        const entry = this.createLogEntry('TRACE', source, message, data, stack);
        this.logs.push(entry);
        this.logToConsole(entry);
        // Ne pas sauvegarder les logs TRACE en Firestore pour éviter le spam
    }
    async saveToFirestore(entry) {
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
        }
        catch (saveError) {
            // Ne pas faire planter le système si on ne peut pas sauvegarder les logs
            console.error('❌ [ULTRA DEBUG] Impossible de sauvegarder en Firestore:', saveError);
        }
    }
    // Méthode pour exporter tous les logs de la session
    exportLogs() {
        return [...this.logs];
    }
    // Méthode pour vider les logs (utile pour les tests)
    clearLogs() {
        this.logs = [];
        console.log('🧹 [ULTRA DEBUG] Logs vidés');
    }
    // Méthode pour tracer les imports de modules
    traceImport(moduleName, fromFile) {
        this.trace('MODULE_IMPORT', `Import de ${moduleName}`, {
            module: moduleName,
            from: fromFile,
            timestamp: Date.now()
        });
    }
    // Méthode pour tracer les initialisations
    traceInit(componentName, data) {
        this.info('COMPONENT_INIT', `Initialisation de ${componentName}`, {
            component: componentName,
            data,
            timestamp: Date.now()
        });
    }
    // Méthode pour tracer les appels Firebase
    traceFirebaseCall(operation, collection, data) {
        this.debug('FIREBASE_CALL', `Opération Firebase: ${operation}`, {
            operation,
            collection,
            data,
            timestamp: Date.now()
        });
    }
    // Méthode pour générer un rapport complet de debugging
    async generateDebugReport() {
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
                apps: (admin.apps ?? []).filter(Boolean).map((app) => ({
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
UltraDebugLogger.instance = null;
// Export de l'instance singleton
exports.ultraLogger = UltraDebugLogger.getInstance();
// Fonction utilitaire pour wrapper les fonctions et tracer leurs appels
function traceFunction(fn, functionName, source) {
    return ((...args) => {
        exports.ultraLogger.trace(`${source}:${functionName}`, 'Début d\'exécution', {
            arguments: args.map((arg, index) => ({
                index,
                type: typeof arg,
                value: typeof arg === 'object' ? '[Object]' : String(arg) // ✅ FIXED: Don't stringify objects in traceFunction
            }))
        });
        try {
            const result = fn(...args);
            if (result instanceof Promise) {
                return result
                    .then((resolvedResult) => {
                    exports.ultraLogger.trace(`${source}:${functionName}`, 'Promesse résolue', {
                        result: typeof resolvedResult === 'object' ? '[Object/Promise Result]' : String(resolvedResult) // ✅ FIXED
                    });
                    return resolvedResult;
                })
                    .catch((error) => {
                    exports.ultraLogger.error(`${source}:${functionName}`, 'Promesse rejetée', {
                        error: error.message,
                        stack: error.stack
                    }, error);
                    throw error;
                });
            }
            else {
                exports.ultraLogger.trace(`${source}:${functionName}`, 'Fonction terminée', {
                    result: typeof result === 'object' ? '[Object Result]' : String(result) // ✅ FIXED
                });
                return result;
            }
        }
        catch (error) {
            exports.ultraLogger.error(`${source}:${functionName}`, 'Erreur dans la fonction', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            }, error instanceof Error ? error : undefined);
            throw error;
        }
    });
}
// Fonction pour tracer les imports au niveau global
function traceGlobalImport(moduleName, fileName) {
    exports.ultraLogger.traceImport(moduleName, fileName);
}
//# sourceMappingURL=ultraDebugLogger.js.map