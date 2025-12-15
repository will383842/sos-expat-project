"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyAfterPayment = exports.notifyAfterPaymentInternal = void 0;
// ✅ Import corrigé - utilisation de la nouvelle planification par tâches
const tasks_1 = require("../lib/tasks");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const MessageManager_1 = require("../MessageManager");
const v2_1 = require("firebase-functions/v2");
// 🔧 FIX CRITIQUE: Configuration d'optimisation CPU
const CPU_OPTIMIZED_CONFIG = {
    region: 'europe-west1',
    memory: '256MiB',
    cpu: 0.25,
    timeoutSeconds: 30,
    maxInstances: 3,
    minInstances: 0,
    concurrency: 1
};
const db = (0, firestore_1.getFirestore)();
// ✅ Fonction interne (pour usage depuis d'autres Cloud Functions comme les webhooks)
async function notifyAfterPaymentInternal(callId) {
    const startTime = Date.now();
    try {
        v2_1.logger.info(`🚀 Début notifyAfterPaymentInternal pour callId: ${callId}`);
        // ✅ CORRECT: Utiliser la collection 'call_sessions'
        const callDoc = await db.collection('call_sessions').doc(callId).get();
        if (!callDoc.exists) {
            v2_1.logger.warn(`⚠️ Document call_sessions/${callId} introuvable`);
            return;
        }
        const callData = callDoc.data();
        if (!callData) {
            v2_1.logger.warn(`⚠️ Données vides pour callId: ${callId}`);
            return;
        }
        // ✅ CORRECT: Mapping des nouveaux champs avec fallback robuste
        const providerPhone = callData.participants?.provider?.phone ?? callData.providerPhone ?? '';
        const clientPhone = callData.participants?.client?.phone ?? callData.clientPhone ?? '';
        const language = callData.metadata?.clientLanguages?.[0] ?? callData.clientLanguages?.[0] ?? 'fr';
        const title = callData.metadata?.title ?? callData.title ?? 'Consultation';
        // 🛡️ Validation stricte des données critiques
        if (!providerPhone || !clientPhone) {
            const error = `Numéros de téléphone manquants - Provider: ${providerPhone ? '✓' : '✗'}, Client: ${clientPhone ? '✓' : '✗'}`;
            v2_1.logger.error(`❌ ${error}`, {
                callId,
                hasProvider: !!providerPhone,
                hasClient: !!clientPhone,
                // 🔧 FIX: Éviter de logger les données sensibles
                structureInfo: {
                    hasParticipants: !!callData.participants,
                    hasProviderData: !!callData.participants?.provider,
                    hasClientData: !!callData.participants?.client,
                    hasMetadata: !!callData.metadata
                }
            });
            throw new Error(error);
        }
        // 📱 Validation format téléphone (renforcée)
        const phoneRegex = /^\+[1-9]\d{7,14}$/; // Au moins 8 chiffres après le +
        if (!phoneRegex.test(providerPhone)) {
            v2_1.logger.error(`❌ Format téléphone provider invalide: ${providerPhone}`, { callId });
            throw new Error(`Format téléphone provider invalide: ${providerPhone}`);
        }
        if (!phoneRegex.test(clientPhone)) {
            v2_1.logger.error(`❌ Format téléphone client invalide: ${clientPhone}`, { callId });
            throw new Error(`Format téléphone client invalide: ${clientPhone}`);
        }
        v2_1.logger.info(`📋 Données extraites`, {
            callId,
            title,
            language,
            providerPhone: `${providerPhone.substring(0, 6)}***`,
            clientPhone: `${clientPhone.substring(0, 6)}***`,
            // 📊 Indicateur de quelle structure a été utilisée
            dataSource: callData.participants?.provider?.phone ? 'NEW_STRUCTURE' : 'LEGACY_FALLBACK'
        });
        // 🔄 Envoi parallèle des notifications pour optimiser les performances
        // 📱 Configuration SMS forcée
        const notificationPromises = [
            // Notification prestataire - SMS forcé
            MessageManager_1.messageManager.sendSmartMessage({
                to: providerPhone,
                templateId: 'provider_notification',
                variables: {
                    requestTitle: title,
                    language
                },
                preferWhatsApp: false
            }).catch(error => {
                v2_1.logger.error(`❌ Erreur notification prestataire`, { callId, error: error.message });
                throw new Error(`Erreur notification prestataire: ${error.message}`);
            }),
            // Notification client - SMS forcé
            MessageManager_1.messageManager.sendSmartMessage({
                to: clientPhone,
                templateId: 'client_notification',
                variables: {
                    requestTitle: title,
                    language
                },
                preferWhatsApp: false
            }).catch(error => {
                v2_1.logger.error(`❌ Erreur notification client`, { callId, error: error.message });
                throw new Error(`Erreur notification client: ${error.message}`);
            })
        ];
        await Promise.all(notificationPromises);
        v2_1.logger.info(`✅ Notifications SMS envoyées avec succès`, {
            callId,
            duration: `${Date.now() - startTime}ms`,
            method: 'SMS_FORCED'
        });
        // 🔁 Planification de l'appel vocal avec gestion d'erreur
        try {
            // 🔧 FIX: Utiliser callId comme sessionId par défaut si non spécifié
            const callSessionId = callData.sessionId || callId;
            await (0, tasks_1.scheduleCallTask)(callSessionId, 5 * 60); // 5 minutes
            v2_1.logger.info(`⏰ Tâche d'appel planifiée`, {
                callId,
                callSessionId,
                delayMinutes: 5
            });
        }
        catch (scheduleError) {
            // ⚠️ Log mais ne fait pas échouer toute la fonction
            v2_1.logger.error(`❌ Erreur planification appel (non-bloquante)`, {
                callId,
                error: scheduleError instanceof Error ? scheduleError.message : 'Erreur inconnue'
            });
        }
        // 📊 Métriques de performance
        const totalDuration = Date.now() - startTime;
        v2_1.logger.info(`🏁 notifyAfterPaymentInternal terminée`, {
            callId,
            totalDuration: `${totalDuration}ms`,
            success: true,
            notificationMethod: 'SMS_FORCED'
        });
    }
    catch (error) {
        const totalDuration = Date.now() - startTime;
        v2_1.logger.error(`💥 Erreur dans notifyAfterPaymentInternal`, {
            callId,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            stack: error instanceof Error ? error.stack : undefined,
            duration: `${totalDuration}ms`
        });
        throw error;
    }
}
exports.notifyAfterPaymentInternal = notifyAfterPaymentInternal;
// ✅ Cloud Function (appelable depuis le frontend) - OPTIMISÉE CPU
exports.notifyAfterPayment = (0, https_1.onCall)(CPU_OPTIMIZED_CONFIG, async (request) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
        v2_1.logger.info(`🎯 Cloud Function notifyAfterPayment appelée`, {
            requestId,
            userId: request.auth?.uid,
            data: request.data
        });
        // 🛡️ Vérification d'authentification stricte
        if (!request.auth?.uid) {
            v2_1.logger.warn(`🚫 Tentative d'accès non authentifié`, { requestId });
            throw new https_1.HttpsError('unauthenticated', 'Authentification requise pour cette opération');
        }
        // 🔍 Validation des données d'entrée
        const { callId } = request.data;
        if (!callId || typeof callId !== 'string' || callId.trim().length === 0) {
            v2_1.logger.error(`❌ CallId invalide`, { requestId, callId, userId: request.auth.uid });
            throw new https_1.HttpsError('invalid-argument', 'callId est requis et doit être une chaîne non vide');
        }
        const sanitizedCallId = callId.trim();
        // 🔐 Vérification des permissions (optionnel mais recommandé)
        // TODO: Vous pouvez ajouter une vérification que l'utilisateur a le droit d'accéder à ce callId
        await notifyAfterPaymentInternal(sanitizedCallId);
        const response = {
            success: true,
            message: 'Notifications SMS envoyées avec succès',
            callId: sanitizedCallId,
            timestamp: new Date().toISOString(),
            duration: `${Date.now() - startTime}ms`,
            method: 'SMS_FORCED'
        };
        v2_1.logger.info(`✅ Cloud Function notifyAfterPayment réussie`, {
            requestId,
            userId: request.auth.uid,
            callId: sanitizedCallId,
            duration: response.duration,
            notificationMethod: 'SMS_FORCED'
        });
        return response;
    }
    catch (error) {
        const duration = Date.now() - startTime;
        // 🔄 Gestion différenciée des erreurs
        if (error instanceof https_1.HttpsError) {
            v2_1.logger.warn(`⚠️ Erreur client dans notifyAfterPayment`, {
                requestId,
                code: error.code,
                message: error.message,
                duration: `${duration}ms`
            });
            throw error; // Re-throw les HttpsError directement
        }
        // 🚨 Erreurs serveur inattendues
        v2_1.logger.error(`💥 Erreur serveur dans notifyAfterPayment`, {
            requestId,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            stack: error instanceof Error ? error.stack : undefined,
            duration: `${duration}ms`
        });
        throw new https_1.HttpsError('internal', 'Une erreur interne s\'est produite lors de l\'envoi des notifications');
    }
});
//# sourceMappingURL=notifyAfterPayment.js.map