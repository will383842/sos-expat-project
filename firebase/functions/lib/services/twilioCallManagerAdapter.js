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
exports.beginOutboundCallForSession = beginOutboundCallForSession;
exports.beginOutboundCallForSessionLegacy = beginOutboundCallForSessionLegacy;
// firebase/functions/src/services/twilioCallManagerAdapter.ts - VERSION CORRIGÉE SANS RÉFÉRENCES CIRCULAIRES
const firestore_1 = require("firebase-admin/firestore");
const logError_1 = require("../utils/logs/logError");
const logCallRecord_1 = require("../utils/logs/logCallRecord");
/**
 * ✅ Fonction principale pour exécuter un appel via Cloud Tasks
 * Cette fonction utilise directement TwilioCallManager sans dépendances circulaires
 */
async function beginOutboundCallForSession(callSessionId) {
    try {
        console.log(`🚀 [Adapter] Démarrage appel pour session: ${callSessionId}`);
        const db = (0, firestore_1.getFirestore)();
        // ✅ ÉTAPE 1: Vérifier que la session existe (collection standardisée)
        const sessionDoc = await db.collection("call_sessions").doc(callSessionId).get();
        if (!sessionDoc.exists) {
            console.error(`❌ [Adapter] Session ${callSessionId} introuvable`);
            throw new Error(`Session ${callSessionId} introuvable dans call_sessions`);
        }
        console.log("✅ [Adapter] Session trouvée:", sessionDoc.exists);
        console.log("✅ [Adapter] Session trouvée:", sessionDoc);
        const sessionData = sessionDoc.data();
        console.log(`✅ [Adapter] Session trouvée: ${sessionData?.id}`);
        console.log(`✅ [Adapter] Session trouvée, status: ${sessionData?.status}`);
        console.log(`✅ [Adapter] Session , Session: ${sessionData}`);
        // 📱 LOG PHONE NUMBERS HERE:
        console.log(`📱 [Adapter] PHONE NUMBERS FOUND:`, {
            clientPhone: sessionData?.participants?.client?.phone || 'MISSING',
            providerPhone: sessionData?.participants?.provider?.phone || 'MISSING',
            hasClientPhone: !!sessionData?.participants?.client?.phone,
            hasProviderPhone: !!sessionData?.participants?.provider?.phone
        });
        // 🔧 FIX LANGUAGE ISSUE BEFORE CALLING TwilioCallManager:
        if (!sessionData?.metadata?.clientLanguages) {
            console.log(`🔧 [Adapter] Adding missing clientLanguages`);
            await db.collection("call_sessions").doc(callSessionId).update({
                'metadata.clientLanguages': ['en'],
                'metadata.providerLanguages': sessionData?.metadata?.providerLanguages || ['en'],
                'metadata.updatedAt': new Date()
            });
        }
        // ✅ ÉTAPE 2: Vérifier le paiement avant de continuer
        const paymentStatus = sessionData?.payment?.status;
        if (paymentStatus && paymentStatus !== "authorized") {
            console.error(`❌ [Adapter] Paiement non autorisé (status=${paymentStatus})`);
            throw new Error(`Paiement non autorisé pour session ${callSessionId} (status=${paymentStatus})`);
        }
        // ✅ ÉTAPE 3: Utiliser l'API CORRECTE du TwilioCallManager
        console.log(`📞 [Adapter] Importation TwilioCallManager...`);
        const { TwilioCallManager } = await Promise.resolve().then(() => __importStar(require("../TwilioCallManager")));
        console.log(`📞 [Adapter] Déclenchement de la séquence d'appel...`);
        const result = await TwilioCallManager.startOutboundCall({
            sessionId: callSessionId,
            delayMinutes: 0 // Immédiat car déjà programmé par Cloud Tasks
        });
        console.log(`📞 [Adapter] Résultat de l'appel:`, result);
        console.log(`✅ [Adapter] Appel initié avec succès:`, {
            sessionId: callSessionId,
            status: result?.status || 'unknown'
        });
        // ✅ ÉTAPE 4: Logger le succès
        await (0, logCallRecord_1.logCallRecord)({
            callId: callSessionId,
            status: 'cloud_task_executed_successfully',
            retryCount: 0,
            additionalData: {
                adaptedVia: 'beginOutboundCallForSession',
                resultStatus: result?.status || 'unknown'
            }
        });
        return result;
    }
    catch (error) {
        console.error(`❌ [Adapter] Erreur lors de l'exécution pour ${callSessionId}:`, error);
        // Logger l'erreur
        await (0, logError_1.logError)(`twilioCallManagerAdapter:beginOutboundCallForSession`, error);
        await (0, logCallRecord_1.logCallRecord)({
            callId: callSessionId,
            status: 'cloud_task_execution_failed',
            retryCount: 0,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            additionalData: {
                adaptedVia: 'beginOutboundCallForSession',
                errorType: error instanceof Error ? error.constructor.name : 'UnknownError'
            }
        });
        throw error;
    }
}
/**
 * ✅ Version de compatibilité avec l'ancienne signature
 * Accepte les paramètres twilio et fromNumber mais ne les utilise pas
 */
async function beginOutboundCallForSessionLegacy({ callSessionId }) {
    // Déléguer à la fonction principale
    return beginOutboundCallForSession(callSessionId);
}
//# sourceMappingURL=twilioCallManagerAdapter.js.map