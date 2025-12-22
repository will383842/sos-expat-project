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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.twilioConferenceWebhook = void 0;
const https_1 = require("firebase-functions/v2/https");
const TwilioCallManager_1 = require("../TwilioCallManager");
const logCallRecord_1 = require("../utils/logs/logCallRecord");
const logError_1 = require("../utils/logs/logError");
const admin = __importStar(require("firebase-admin"));
/**
 * Webhook pour les événements de conférence Twilio
 * Gère: start, end, join, leave, mute, hold
 */
exports.twilioConferenceWebhook = (0, https_1.onRequest)({
    region: 'europe-west1',
    memory: '256MiB',
    cpu: 0.25,
    maxInstances: 3,
    minInstances: 0,
    concurrency: 1
}, async (req, res) => {
    try {
        const body = req.body;
        console.log('🔔 Conference Webhook reçu:', {
            event: body.StatusCallbackEvent,
            conferenceSid: body.ConferenceSid,
            conferenceStatus: body.ConferenceStatus,
            participantLabel: body.ParticipantLabel,
            callSid: body.CallSid
        });
        // Trouver la session d'appel par le nom de la conférence
        const session = await TwilioCallManager_1.twilioCallManager.findSessionByConferenceSid(body.ConferenceSid);
        if (!session) {
            console.warn(`Session non trouvée pour conférence: ${body.ConferenceSid}`);
            res.status(200).send('Session not found');
            return;
        }
        const sessionId = session.id;
        switch (body.StatusCallbackEvent) {
            case 'conference-start':
                await handleConferenceStart(sessionId, body);
                break;
            case 'conference-end':
                await handleConferenceEnd(sessionId, body);
                break;
            case 'participant-join':
                await handleParticipantJoin(sessionId, body);
                break;
            case 'participant-leave':
                await handleParticipantLeave(sessionId, body);
                break;
            case 'participant-mute':
            case 'participant-unmute':
                await handleParticipantMute(sessionId, body);
                break;
            case 'participant-hold':
            case 'participant-unhold':
                await handleParticipantHold(sessionId, body);
                break;
            default:
                console.log(`Événement conférence non géré: ${body.StatusCallbackEvent}`);
        }
        res.status(200).send('OK');
    }
    catch (error) {
        console.error('❌ Erreur webhook conférence:', error);
        await (0, logError_1.logError)('twilioConferenceWebhook:error', error);
        res.status(500).send('Webhook error');
    }
});
/**
 * Gère le début de la conférence
 */
async function handleConferenceStart(sessionId, body) {
    try {
        console.log(`🎤 Conférence démarrée: ${sessionId}`);
        await TwilioCallManager_1.twilioCallManager.updateConferenceInfo(sessionId, {
            sid: body.ConferenceSid,
            startedAt: admin.firestore.Timestamp.fromDate(new Date())
        });
        await TwilioCallManager_1.twilioCallManager.updateCallSessionStatus(sessionId, 'active');
        await (0, logCallRecord_1.logCallRecord)({
            callId: sessionId,
            status: 'conference_started',
            retryCount: 0,
            additionalData: {
                conferenceSid: body.ConferenceSid,
                timestamp: body.Timestamp
            }
        });
    }
    catch (error) {
        await (0, logError_1.logError)('handleConferenceStart', error);
    }
}
/**
 * Gère la fin de la conférence
 */
async function handleConferenceEnd(sessionId, body) {
    try {
        const duration = parseInt(body.Duration || '0');
        console.log(`🏁 Conférence terminée: ${sessionId}, durée: ${duration}s`);
        await TwilioCallManager_1.twilioCallManager.updateConferenceInfo(sessionId, {
            endedAt: admin.firestore.Timestamp.fromDate(new Date()),
            duration: duration
        });
        // Déterminer si l'appel est réussi ou échoué selon la durée
        if (duration >= 120) { // Au moins 2 minutes
            await TwilioCallManager_1.twilioCallManager.handleCallCompletion(sessionId, duration);
        }
        else {
            // Appel trop court, considéré comme échoué
            await TwilioCallManager_1.twilioCallManager.updateCallSessionStatus(sessionId, 'failed');
            await (0, logCallRecord_1.logCallRecord)({
                callId: sessionId,
                status: 'call_too_short',
                retryCount: 0,
                additionalData: {
                    duration,
                    reason: 'Duration less than 2 minutes'
                }
            });
        }
        await (0, logCallRecord_1.logCallRecord)({
            callId: sessionId,
            status: 'conference_ended',
            retryCount: 0,
            additionalData: {
                duration,
                conferenceSid: body.ConferenceSid
            }
        });
    }
    catch (error) {
        await (0, logError_1.logError)('handleConferenceEnd', error);
    }
}
/**
 * Gère l'arrivée d'un participant
 */
async function handleParticipantJoin(sessionId, body) {
    try {
        const participantType = body.ParticipantLabel;
        const callSid = body.CallSid;
        console.log(`👋 Participant rejoint: ${participantType} (${callSid})`);
        // Mettre à jour le statut du participant
        await TwilioCallManager_1.twilioCallManager.updateParticipantStatus(sessionId, participantType, 'connected', admin.firestore.Timestamp.fromDate(new Date()));
        // Vérifier si les deux participants sont connectés
        const session = await TwilioCallManager_1.twilioCallManager.getCallSession(sessionId);
        if (session &&
            session.participants.provider.status === 'connected' &&
            session.participants.client.status === 'connected') {
            await TwilioCallManager_1.twilioCallManager.updateCallSessionStatus(sessionId, 'active');
            await (0, logCallRecord_1.logCallRecord)({
                callId: sessionId,
                status: 'both_participants_connected',
                retryCount: 0
            });
        }
        await (0, logCallRecord_1.logCallRecord)({
            callId: sessionId,
            status: `${participantType}_joined_conference`,
            retryCount: 0,
            additionalData: {
                callSid,
                conferenceSid: body.ConferenceSid
            }
        });
    }
    catch (error) {
        await (0, logError_1.logError)('handleParticipantJoin', error);
    }
}
/**
 * Gère le départ d'un participant
 */
async function handleParticipantLeave(sessionId, body) {
    try {
        const participantType = body.ParticipantLabel;
        const callSid = body.CallSid;
        console.log(`👋 Participant parti: ${participantType} (${callSid})`);
        // Mettre à jour le statut du participant
        await TwilioCallManager_1.twilioCallManager.updateParticipantStatus(sessionId, participantType, 'disconnected', admin.firestore.Timestamp.fromDate(new Date()));
        // Récupérer la durée de la conférence si disponible
        const session = await TwilioCallManager_1.twilioCallManager.getCallSession(sessionId);
        const duration = session?.conference.duration || 0;
        // Gérer la déconnexion selon le participant et la durée
        await TwilioCallManager_1.twilioCallManager.handleEarlyDisconnection(sessionId, participantType, duration);
        // (Maintenant que la méthode existe dans TwilioCallManager)
        await (0, logCallRecord_1.logCallRecord)({
            callId: sessionId,
            status: `${participantType}_left_conference`,
            retryCount: 0,
            additionalData: {
                callSid,
                conferenceSid: body.ConferenceSid,
                duration
            }
        });
    }
    catch (error) {
        await (0, logError_1.logError)('handleParticipantLeave', error);
    }
}
/**
 * Gère les événements mute/unmute
 */
async function handleParticipantMute(sessionId, body) {
    try {
        const participantType = body.ParticipantLabel;
        const isMuted = body.StatusCallbackEvent === 'participant-mute';
        console.log(`🔇 Participant ${isMuted ? 'muted' : 'unmuted'}: ${participantType}`);
        await (0, logCallRecord_1.logCallRecord)({
            callId: sessionId,
            status: `${participantType}_${isMuted ? 'muted' : 'unmuted'}`,
            retryCount: 0,
            additionalData: {
                callSid: body.CallSid,
                conferenceSid: body.ConferenceSid
            }
        });
    }
    catch (error) {
        await (0, logError_1.logError)('handleParticipantMute', error);
    }
}
/**
 * Gère les événements hold/unhold
 */
async function handleParticipantHold(sessionId, body) {
    try {
        const participantType = body.ParticipantLabel;
        const isOnHold = body.StatusCallbackEvent === 'participant-hold';
        console.log(`⏸️ Participant ${isOnHold ? 'on hold' : 'off hold'}: ${participantType}`);
        await (0, logCallRecord_1.logCallRecord)({
            callId: sessionId,
            status: `${participantType}_${isOnHold ? 'hold' : 'unhold'}`,
            retryCount: 0,
            additionalData: {
                callSid: body.CallSid,
                conferenceSid: body.ConferenceSid
            }
        });
    }
    catch (error) {
        await (0, logError_1.logError)('handleParticipantHold', error);
    }
}
//# sourceMappingURL=TwilioConferenceWebhook.js.map