import { onRequest } from 'firebase-functions/v2/https';
import { twilioCallManager } from '../TwilioCallManager';
import { logCallRecord } from '../utils/logs/logCallRecord';
import { logError } from '../utils/logs/logError';
import { Response } from 'express';
import * as admin from 'firebase-admin';
import { Request } from 'firebase-functions/v2/https';


interface TwilioCallWebhookBody {
  CallSid: string;
  CallStatus: string;
  CallDuration?: string;
  From: string;
  To: string;
  AnsweredBy?: string;
  Timestamp: string;
  
  // Informations supplémentaires
  Direction?: string;
  ForwardedFrom?: string;
}

/**
 * Webhook unifié pour les événements d'appels Twilio
 * Compatible avec le système TwilioCallManager moderne
 */
export const twilioCallWebhook = onRequest(
  {
    region: 'europe-west1',
    memory: '256MiB',
    cpu: 0.25,
    maxInstances: 3,
    minInstances: 0,
    concurrency: 1
  },
  async (req: Request, res: Response) => {
    try {
      const body: TwilioCallWebhookBody = req.body;
      
      console.log('🔔 Call Webhook reçu:', {
        event: body.CallStatus,
        callSid: body.CallSid,
        from: body.From,
        to: body.To,
        duration: body.CallDuration
      });

      // Trouver la session d'appel par CallSid
      const sessionResult = await twilioCallManager.findSessionByCallSid(body.CallSid);
      
      if (!sessionResult) {
        console.warn(`Session non trouvée pour CallSid: ${body.CallSid}`);
        res.status(200).send('Session not found');
        return;
      }

      const { session, participantType } = sessionResult;
      const sessionId = session.id;

      // Traiter les différents statuts d'appel
      switch (body.CallStatus) {
        case 'ringing':
          await handleCallRinging(sessionId, participantType, body);
          break;
          
        case 'answered':
        case 'in-progress':
          await handleCallAnswered(sessionId, participantType, body);
          break;
          
        case 'completed':
          await handleCallCompleted(sessionId, participantType, body);
          break;
          
        case 'failed':
        case 'busy':
        case 'no-answer':
          await handleCallFailed(sessionId, participantType, body);
          break;
          
        default:
          console.log(`Statut d'appel non géré: ${body.CallStatus}`);
      }

      res.status(200).send('OK');

    } catch (error) {
      console.error('❌ Erreur webhook appel:', error);
      await logError('twilioCallWebhook:error', error);
      res.status(500).send('Webhook error');
    }
  }
);

/**
 * Gère le statut "ringing"
 */
async function handleCallRinging(
  sessionId: string, 
  participantType: 'provider' | 'client', 
  body: TwilioCallWebhookBody
) {
  try {
    console.log(`📞 ${participantType} en cours de sonnerie: ${sessionId}`);
    
    await twilioCallManager.updateParticipantStatus(
      sessionId,
      participantType,
      'ringing'
    );

    await logCallRecord({
      callId: sessionId,
      status: `${participantType}_ringing`,
      retryCount: 0,
      additionalData: {
        callSid: body.CallSid,
        timestamp: body.Timestamp
      }
    });

  } catch (error) {
    await logError('handleCallRinging', error);
  }
}

/**
 * Gère le statut "answered"
 */
async function handleCallAnswered(
  sessionId: string, 
  participantType: 'provider' | 'client', 
  body: TwilioCallWebhookBody
) {
  try {
    console.log(`✅ ${participantType} a répondu: ${sessionId}`);
    
    await twilioCallManager.updateParticipantStatus(
      sessionId,
      participantType,
      'connected',
      admin.firestore.Timestamp.fromDate(new Date())
    );

    // Vérifier si les deux participants sont connectés
    const session = await twilioCallManager.getCallSession(sessionId);
    if (session && 
        session.participants.provider.status === 'connected' && 
        session.participants.client.status === 'connected') {
      
      await twilioCallManager.updateCallSessionStatus(sessionId, 'active');
      
      await logCallRecord({
        callId: sessionId,
        status: 'both_participants_connected',
        retryCount: 0
      });
    }

    await logCallRecord({
      callId: sessionId,
      status: `${participantType}_answered`,
      retryCount: 0,
      additionalData: {
        callSid: body.CallSid,
        answeredBy: body.AnsweredBy
      }
    });

  } catch (error) {
    await logError('handleCallAnswered', error);
  }
}

/**
 * Gère le statut "completed"
 */
async function handleCallCompleted(
  sessionId: string, 
  participantType: 'provider' | 'client', 
  body: TwilioCallWebhookBody
) {
  try {
    const duration = parseInt(body.CallDuration || '0');
    console.log(`🏁 Appel ${participantType} terminé: ${sessionId}, durée: ${duration}s`);
    
    await twilioCallManager.updateParticipantStatus(
      sessionId,
      participantType,
      'disconnected',
      admin.firestore.Timestamp.fromDate(new Date())
    );

    // Récupérer la session pour déterminer le traitement approprié
    const session = await twilioCallManager.getCallSession(sessionId);
    if (!session) {
      console.warn(`Session non trouvée lors de la completion: ${sessionId}`);
      return;
    }

    // Si c'est une déconnexion normale (durée suffisante)
    if (duration >= 120) {
      await twilioCallManager.handleCallCompletion(sessionId, duration);
    } else {
      // Déconnexion précoce - utiliser la méthode du TwilioCallManager
      await twilioCallManager.handleEarlyDisconnection(sessionId, participantType, duration);
    }

    await logCallRecord({
      callId: sessionId,
      status: `${participantType}_call_completed`,
      retryCount: 0,
      duration: duration,
      additionalData: {
        callSid: body.CallSid,
        duration: duration
      }
    });

  } catch (error) {
    await logError('handleCallCompleted', error);
  }
}

/**
 * Gère les échecs d'appel
 */
async function handleCallFailed(
  sessionId: string, 
  participantType: 'provider' | 'client', 
  body: TwilioCallWebhookBody
) {
  try {
    console.log(`❌ Appel ${participantType} échoué: ${sessionId}, raison: ${body.CallStatus}`);
    
    await twilioCallManager.updateParticipantStatus(
      sessionId,
      participantType,
      body.CallStatus === 'no-answer' ? 'no_answer' : 'disconnected'
    );

    // Déterminer la raison de l'échec pour le traitement approprié
    let failureReason = 'system_error';
    if (body.CallStatus === 'no-answer') {
      failureReason = `${participantType}_no_answer`;
    } else if (body.CallStatus === 'busy') {
      failureReason = `${participantType}_busy`;
    } else if (body.CallStatus === 'failed') {
      failureReason = `${participantType}_failed`;
    }

    // Utiliser la logique de gestion d'échec du TwilioCallManager
    await twilioCallManager.handleCallFailure(sessionId, failureReason);

    await logCallRecord({
      callId: sessionId,
      status: `${participantType}_call_failed`,
      retryCount: 0,
      errorMessage: `Call failed: ${body.CallStatus}`,
      additionalData: {
        callSid: body.CallSid,
        failureReason: body.CallStatus
      }
    });

  } catch (error) {
    await logError('handleCallFailed', error);
  }
}

/**
 * Webhook pour les événements de conférence (délégué au système moderne)
 */
export const twilioConferenceWebhook = onRequest(
  {
    region: 'europe-west1',
    memory: '256MiB',
    cpu: 0.25,
    maxInstances: 3,
    minInstances: 0,
    concurrency: 1
  },
  async (req: Request, res: Response) => {
    // Rediriger vers le webhook de conférence moderne
    const { twilioConferenceWebhook: modernWebhook } = await import('./TwilioConferenceWebhook');
    return modernWebhook(req as Request, res);
  }
);

/**
 * Webhook pour les événements d'enregistrement (délégué au système moderne)
 */
export const twilioRecordingWebhook = onRequest(
  {
    region: 'europe-west1',
    memory: '256MiB',
    cpu: 0.25,
    maxInstances: 3,
    minInstances: 0,
    concurrency: 1
  },
  async (req: Request, res: Response) => {
    // Rediriger vers le webhook d'enregistrement moderne
    const { twilioRecordingWebhook: modernWebhook } = await import('./TwilioRecordingWebhook');
    return modernWebhook(req as Request, res);
  }
);

/**
 * Fonction utilitaire pour recherche de session (compatible avec l'ancien système)
 */
export const findCallSessionByCallSid = async (callSid: string) => {
  try {
    const result = await twilioCallManager.findSessionByCallSid(callSid);
    if (result) {
      return {
        doc: {
          id: result.session.id,
          data: () => result.session
        },
        type: result.participantType
      };
    }
    return null;
  } catch (error) {
    console.error('Error finding call session:', error);
    return null;
  }
};