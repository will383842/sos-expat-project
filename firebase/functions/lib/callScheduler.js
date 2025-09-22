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
exports.gracefulShutdown = exports.getCallStatistics = exports.cleanupOldSessions = exports.cancelScheduledCall = exports.createCallSession = exports.executeScheduledCall = void 0;
exports.callSchedulerManager = getCallSchedulerManager;
// firebase/functions/src/callScheduler.ts
const logCallRecord_1 = require("./utils/logs/logCallRecord");
const logError_1 = require("./utils/logs/logError");
const admin = __importStar(require("firebase-admin"));
// Configuration pour la production
const SCHEDULER_CONFIG = {
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY_MS: 5000,
    HEALTH_CHECK_INTERVAL: 60000, // 1 minute
    MAX_PENDING_SESSIONS: 100
};
/**
 * 🔧 REFACTORISÉ: Classe pour gérer uniquement les sessions d'appel (plus de planification en mémoire)
 */
class CallSchedulerManager {
    constructor() {
        this.healthCheckInterval = null;
        this.stats = {
            totalScheduled: 0,
            currentlyPending: 0,
            completedToday: 0,
            failedToday: 0,
            averageWaitTime: 0
        };
        this.isInitialized = false;
        // 🔧 FIX: Ne pas initialiser immédiatement - attendre le premier appel
    }
    async initialize() {
        if (!this.isInitialized) {
            try {
                this.startHealthCheck();
                await this.loadInitialStats();
                this.isInitialized = true;
                console.log('✅ CallSchedulerManager initialisé (sans planification en mémoire)');
            }
            catch (error) {
                console.error('❌ Erreur initialisation CallSchedulerManager:', error);
                throw error;
            }
        }
    }
    /**
     * Démarre la surveillance de santé du scheduler
     */
    startHealthCheck() {
        this.healthCheckInterval = setInterval(async () => {
            try {
                await this.performHealthCheck();
            }
            catch (error) {
                await (0, logError_1.logError)('CallScheduler:healthCheck', error);
            }
        }, SCHEDULER_CONFIG.HEALTH_CHECK_INTERVAL);
    }
    /**
     * Effectue une vérification de santé du système
     */
    async performHealthCheck() {
        try {
            // Vérifier les sessions en attente
            const pendingSessions = await this.getPendingSessions();
            this.stats.currentlyPending = pendingSessions.length;
            // Nettoyer les sessions expirées
            await this.cleanupExpiredSessions();
            // Log des métriques pour monitoring
            console.log(`📊 Scheduler Health: ${this.stats.currentlyPending} pending sessions`);
        }
        catch (error) {
            await (0, logError_1.logError)('CallScheduler:performHealthCheck', error);
        }
    }
    /**
     * Charge les statistiques initiales
     */
    async loadInitialStats() {
        try {
            const database = getDB();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTimestamp = admin.firestore.Timestamp.fromDate(today);
            // Compter les appels d'aujourd'hui
            const todayQuery = await database
                .collection('call_sessions')
                .where('metadata.createdAt', '>=', todayTimestamp)
                .get();
            this.stats.completedToday = 0;
            this.stats.failedToday = 0;
            todayQuery.docs.forEach((doc) => {
                const session = doc.data();
                if (session.status === 'completed') {
                    this.stats.completedToday++;
                }
                else if (session.status === 'failed') {
                    this.stats.failedToday++;
                }
            });
        }
        catch (error) {
            await (0, logError_1.logError)('CallScheduler:loadInitialStats', error);
        }
    }
    /**
     * Nettoie les sessions expirées
     */
    async cleanupExpiredSessions() {
        const expiredThreshold = Date.now() - 30 * 60 * 1000; // 30 minutes
        try {
            const pendingSessions = await this.getPendingSessions();
            for (const session of pendingSessions) {
                if (session.metadata.createdAt.toMillis() < expiredThreshold) {
                    const twilioCallManager = await getTwilioCallManager();
                    await twilioCallManager.cancelCallSession(session.id, 'expired', 'scheduler');
                    console.log(`🧹 Session expirée nettoyée: ${session.id}`);
                }
            }
        }
        catch (error) {
            await (0, logError_1.logError)('CallScheduler:cleanupExpiredSessions', error);
        }
    }
    /**
     * Récupère les sessions en attente
     */
    async getPendingSessions() {
        try {
            const database = getDB();
            const snapshot = await database
                .collection('call_sessions')
                .where('status', 'in', ['pending', 'provider_connecting', 'client_connecting'])
                .orderBy('metadata.createdAt', 'desc')
                .limit(SCHEDULER_CONFIG.MAX_PENDING_SESSIONS)
                .get();
            return snapshot.docs.map((doc) => doc.data());
        }
        catch (error) {
            await (0, logError_1.logError)('CallScheduler:getPendingSessions', error);
            return [];
        }
    }
    /**
     * 🆕 NOUVEAU: Exécute un appel programmé (appelé par Cloud Tasks webhook)
     * Cette méthode sera appelée par la Cloud Function qui reçoit le webhook de Cloud Tasks
     */
    async executeScheduledCall(callSessionId) {
        let retryCount = 0;
        while (retryCount < SCHEDULER_CONFIG.RETRY_ATTEMPTS) {
            try {
                console.log(`🚀 Exécution appel programmé par Cloud Tasks: ${callSessionId} (tentative ${retryCount + 1}/${SCHEDULER_CONFIG.RETRY_ATTEMPTS})`);
                // Vérifier que la session est toujours valide
                const twilioCallManager = await getTwilioCallManager();
                const session = await twilioCallManager.getCallSession(callSessionId);
                if (!session) {
                    console.warn(`Session non trouvée lors de l'exécution: ${callSessionId}`);
                    return;
                }
                if (session.status !== 'pending') {
                    console.log(`Session ${callSessionId} status changed to ${session.status}, arrêt de l'exécution`);
                    return;
                }
                // Utiliser le TwilioCallManager pour la gestion robuste des appels
                await twilioCallManager.initiateCallSequence(callSessionId, 0);
                console.log(`✅ Appel initié avec succès par Cloud Tasks: ${callSessionId}`);
                return;
            }
            catch (error) {
                retryCount++;
                await (0, logError_1.logError)(`CallScheduler:executeScheduledCall:attempt_${retryCount}`, error);
                if (retryCount < SCHEDULER_CONFIG.RETRY_ATTEMPTS) {
                    console.log(`⏳ Retry ${retryCount}/${SCHEDULER_CONFIG.RETRY_ATTEMPTS} pour ${callSessionId} dans ${SCHEDULER_CONFIG.RETRY_DELAY_MS}ms`);
                    await this.delay(SCHEDULER_CONFIG.RETRY_DELAY_MS * retryCount); // Délai progressif
                }
            }
        }
        // Toutes les tentatives ont échoué
        console.error(`❌ Échec de toutes les tentatives pour ${callSessionId}`);
        try {
            const twilioCallManager = await getTwilioCallManager();
            await twilioCallManager.updateCallSessionStatus(callSessionId, 'failed');
            this.stats.failedToday++;
            await (0, logCallRecord_1.logCallRecord)({
                callId: callSessionId,
                status: 'sequence_failed_all_retries',
                retryCount: SCHEDULER_CONFIG.RETRY_ATTEMPTS
            });
        }
        catch (updateError) {
            await (0, logError_1.logError)('CallScheduler:executeScheduledCall:finalUpdate', updateError);
        }
    }
    /**
     * 🔄 MODIFIÉ: Annule une session d'appel
     */
    async cancelScheduledCall(callSessionId, reason) {
        try {
            // 🔧 FIX: Initialiser si nécessaire
            await this.initialize();
            // Utiliser TwilioCallManager pour annuler la session
            const twilioCallManager = await getTwilioCallManager();
            await twilioCallManager.cancelCallSession(callSessionId, reason, 'scheduler');
            await (0, logCallRecord_1.logCallRecord)({
                callId: callSessionId,
                status: `call_cancelled_${reason}`,
                retryCount: 0
            });
            console.log(`✅ Appel annulé: ${callSessionId}, raison: ${reason}`);
        }
        catch (error) {
            await (0, logError_1.logError)('CallScheduler:cancelScheduledCall', error);
            throw error;
        }
    }
    /**
     * Obtient les statistiques du scheduler
     */
    getStats() {
        return { ...this.stats };
    }
    /**
     * 🔄 MODIFIÉ: Ferme proprement le scheduler
     */
    shutdown() {
        console.log('🔄 Arrêt du CallScheduler...');
        // Arrêter le health check
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        console.log('✅ CallScheduler arrêté proprement');
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
// 🔧 FIX: Instance singleton avec lazy loading
let callSchedulerManagerInstance = null;
function getCallSchedulerManager() {
    if (!callSchedulerManagerInstance) {
        callSchedulerManagerInstance = new CallSchedulerManager();
    }
    return callSchedulerManagerInstance;
}
// 🔧 FIX: Import mais pas d'initialisation immédiate avec typage précis
let twilioCallManagerInstance = null;
let isInitializing = false;
async function getTwilioCallManager() {
    // Éviter les initialisations multiples
    if (isInitializing) {
        // Attendre que l'initialisation en cours se termine
        while (isInitializing) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        return twilioCallManagerInstance;
    }
    if (!twilioCallManagerInstance) {
        isInitializing = true;
        try {
            const { twilioCallManager } = await Promise.resolve().then(() => __importStar(require('./TwilioCallManager')));
            twilioCallManagerInstance = twilioCallManager;
        }
        finally {
            isInitializing = false;
        }
    }
    return twilioCallManagerInstance;
}
// 🔧 FIX: Initialisation Firebase lazy
let db = null;
function getDB() {
    if (!db) {
        // Assurer que Firebase Admin est initialisé
        if (!admin.apps.length) {
            admin.initializeApp();
        }
        db = admin.firestore();
    }
    return db;
}
/**
 * 🆕 NOUVEAU: Fonction pour exécuter un appel programmé (appelée par Cloud Tasks webhook)
 */
const executeScheduledCall = async (callSessionId) => {
    const manager = getCallSchedulerManager();
    return manager.executeScheduledCall(callSessionId);
};
exports.executeScheduledCall = executeScheduledCall;
/**
 * ✅ Fonction pour créer un nouvel appel (SANS PLANIFICATION)
 * - `amount` est **en EUROS** (unités réelles).
 * - ❌ Pas de vérification de "cohérence service/prix" ici.
 * - ✅ On garde uniquement la validation min/max.
 * - ❗️Aucune conversion centimes ici : la conversion unique vers centimes se fait
 *   au moment Stripe (dans la fonction de paiement en amont).
 * - 🔄 PLUS DE PLANIFICATION : seule la création de session
 */
const createCallSession = async (params) => {
    try {
        // Générer un ID unique si non fourni
        const sessionId = params.sessionId ||
            `call_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`🆕 Création d'une nouvelle session d'appel: ${sessionId}`);
        console.log(`💰 Montant (EUROS): ${params.amount} pour ${params.serviceType}`);
        // ✅ VALIDATION AMÉLIORÉE - Champs obligatoires avec messages spécifiques
        const requiredFields = {
            providerId: params.providerId,
            clientId: params.clientId,
            providerPhone: params.providerPhone,
            clientPhone: params.clientPhone,
            paymentIntentId: params.paymentIntentId,
            amount: params.amount
        };
        const missingFields = Object.entries(requiredFields)
            .filter(([, value]) => !value || (typeof value === 'string' && value.trim() === ''))
            .map(([key]) => key);
        if (missingFields.length > 0) {
            console.error(`❌ [createCallSession] Champs manquants:`, missingFields);
            throw new Error(`Paramètres obligatoires manquants pour créer l'appel: ${missingFields.join(', ')}`);
        }
        // ✅ Validation montant numérique
        if (typeof params.amount !== 'number' || isNaN(params.amount) || params.amount <= 0) {
            console.error(`❌ [createCallSession] Montant invalide:`, {
                amount: params.amount,
                type: typeof params.amount
            });
            throw new Error(`Montant invalide: ${params.amount} (type: ${typeof params.amount})`);
        }
        // ✅ Validation min/max (toujours en euros)
        if (params.amount < 5) {
            throw new Error('Montant minimum de 5€ requis');
        }
        if (params.amount > 500) {
            throw new Error('Montant maximum de 500€ dépassé');
        }
        // ✅ VALIDATION NUMÉROS DE TÉLÉPHONE
        const phoneRegex = /^\+[1-9]\d{8,14}$/;
        if (!phoneRegex.test(params.providerPhone)) {
            console.error(`❌ [createCallSession] Numéro prestataire invalide:`, params.providerPhone);
            throw new Error(`Numéro de téléphone prestataire invalide: ${params.providerPhone}`);
        }
        if (!phoneRegex.test(params.clientPhone)) {
            console.error(`❌ [createCallSession] Numéro client invalide:`, params.clientPhone);
            throw new Error(`Numéro de téléphone client invalide: ${params.clientPhone}`);
        }
        if (params.providerPhone === params.clientPhone) {
            console.error(`❌ [createCallSession] Numéros identiques:`, {
                providerPhone: params.providerPhone,
                clientPhone: params.clientPhone
            });
            throw new Error('Les numéros du prestataire et du client doivent être différents');
        }
        console.log(`✅ [createCallSession] Validation réussie pour ${sessionId}`);
        // ✅ Créer la session avec montants EN EUROS (aucune conversion ici)
        const twilioCallManager = await getTwilioCallManager();
        const callSession = await twilioCallManager.createCallSession({
            sessionId,
            callSessionId: sessionId,
            providerId: params.providerId,
            clientId: params.clientId,
            providerPhone: params.providerPhone,
            clientPhone: params.clientPhone,
            serviceType: params.serviceType,
            providerType: params.providerType,
            paymentIntentId: params.paymentIntentId,
            amount: params.amount, // ✅ euros
            requestId: params.requestId,
            clientLanguages: params.clientLanguages,
            providerLanguages: params.providerLanguages
        });
        await (0, logCallRecord_1.logCallRecord)({
            callId: sessionId,
            status: 'call_session_created',
            retryCount: 0,
            additionalData: {
                serviceType: params.serviceType,
                amountInEuros: params.amount, // audit humain
                schedulingMethod: 'webhook_only', // Plus de planification ici
                // ✅ AJOUT: Log des numéros pour debug
                hasProviderPhone: !!params.providerPhone,
                hasClientPhone: !!params.clientPhone,
                hasClientWhatsapp: !!params.clientWhatsapp,
                // infos additionnelles si disponibles (purement indicatives)
                currency: params.currency,
                amountCents: params.amountCents,
                platformAmountCents: params.platformAmountCents,
                platformFeePercent: params.platformFeePercent
            }
        });
        console.log(`✅ Session d'appel créée (sans planification): ${sessionId} (montant gardé en euros)`);
        return callSession;
    }
    catch (error) {
        await (0, logError_1.logError)('createCallSession:error', error);
        throw error;
    }
};
exports.createCallSession = createCallSession;
/**
 * Fonction pour annuler un appel programmé
 */
const cancelScheduledCall = async (callSessionId, reason) => {
    const manager = getCallSchedulerManager();
    return manager.cancelScheduledCall(callSessionId, reason);
};
exports.cancelScheduledCall = cancelScheduledCall;
/**
 * 🔄 SUPPRIMÉ: Plus de resumePendingCalls car plus de planification en mémoire
 * La planification se fait uniquement via webhook Stripe → Cloud Tasks
 */
/**
 * Fonction de nettoyage des anciennes sessions
 */
const cleanupOldSessions = async (olderThanDays = 30) => {
    try {
        console.log(`🧹 Nettoyage des sessions de plus de ${olderThanDays} jours...`);
        const twilioCallManager = await getTwilioCallManager();
        const result = await twilioCallManager.cleanupOldSessions({
            olderThanDays,
            keepCompletedDays: 7, // Garder les complétées 7 jours
            batchSize: 50
        });
        console.log(`✅ Nettoyage terminé: ${result.deleted} supprimées, ${result.errors} erreurs`);
    }
    catch (error) {
        await (0, logError_1.logError)('cleanupOldSessions:error', error);
    }
};
exports.cleanupOldSessions = cleanupOldSessions;
/**
 * ✅ Fonction pour obtenir des statistiques sur les appels avec montants en EUROS
 */
const getCallStatistics = async (periodDays = 7) => {
    try {
        const database = getDB();
        const startDate = admin.firestore.Timestamp.fromMillis(Date.now() - periodDays * 24 * 60 * 60 * 1000);
        const [schedulerStats, twilioCallManager] = await Promise.all([
            getCallSchedulerManager().getStats(),
            getTwilioCallManager(),
        ]);
        const callStats = await twilioCallManager.getCallStatistics({ startDate });
        // ✅ Calculs de revenus EN EUROS pour l'affichage
        let totalRevenueEuros = 0;
        let completedCallsWithRevenue = 0;
        // Récupérer les sessions complétées avec revenus
        const completedSessionsQuery = await database
            .collection('call_sessions')
            .where('metadata.createdAt', '>=', startDate)
            .where('status', '==', 'completed')
            .where('payment.status', '==', 'captured')
            .get();
        completedSessionsQuery.docs.forEach((doc) => {
            const session = doc.data();
            const amountInEuros = session.payment.amount; // stocké en euros
            totalRevenueEuros += amountInEuros;
            completedCallsWithRevenue++;
        });
        const averageAmountEuros = completedCallsWithRevenue > 0
            ? totalRevenueEuros / completedCallsWithRevenue
            : 0;
        return {
            scheduler: schedulerStats,
            calls: {
                total: callStats.total,
                completed: callStats.completed,
                failed: callStats.failed,
                cancelled: callStats.cancelled,
                averageDuration: callStats.averageDuration,
                successRate: callStats.successRate,
                totalRevenueEuros,
                averageAmountEuros
            }
        };
    }
    catch (error) {
        await (0, logError_1.logError)('getCallStatistics:error', error);
        throw error;
    }
};
exports.getCallStatistics = getCallStatistics;
/**
 * 🔄 MODIFIÉ: Gestionnaire pour l'arrêt propre du service
 */
const gracefulShutdown = () => {
    console.log('🔄 Arrêt gracieux du CallScheduler...');
    if (callSchedulerManagerInstance) {
        callSchedulerManagerInstance.shutdown();
    }
};
exports.gracefulShutdown = gracefulShutdown;
// Gestionnaire de signaux pour arrêt propre
process.on('SIGTERM', exports.gracefulShutdown);
process.on('SIGINT', exports.gracefulShutdown);
// 🔄 SUPPRIMÉ: scheduleCallSequence, createAndScheduleCall, resumePendingCalls
// Car la planification se fait uniquement via webhook Stripe → Cloud Tasks
//# sourceMappingURL=callScheduler.js.map