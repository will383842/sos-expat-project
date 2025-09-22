// firebase/functions/src/services/twilioCallManagerAdapter.ts - VERSION CORRIGÉE SANS RÉFÉRENCES CIRCULAIRES
import { getFirestore } from "firebase-admin/firestore";
import { logError } from "../utils/logs/logError";
import { logCallRecord } from "../utils/logs/logCallRecord";

/**
 * ✅ Fonction principale pour exécuter un appel via Cloud Tasks
 * Cette fonction utilise directement TwilioCallManager sans dépendances circulaires
 */
export async function beginOutboundCallForSession(callSessionId: string) {
  try {
    console.log(`🚀 [Adapter] Démarrage appel pour session: ${callSessionId}`);
    
    const db = getFirestore();

    // ✅ ÉTAPE 1: Vérifier que la session existe (collection standardisée)
    const sessionDoc = await db.collection("call_sessions").doc(callSessionId).get();
    
    if (!sessionDoc.exists) {
      console.error(`❌ [Adapter] Session ${callSessionId} introuvable`);
      throw new Error(`Session ${callSessionId} introuvable dans call_sessions`);
    }
    console.log("✅ [Adapter] Session trouvée:", sessionDoc.exists);
    console.log("✅ [Adapter] Session trouvée:", sessionDoc);

    const sessionData = sessionDoc.data();
//     const sessionData = {
//       conference: {
//         name: "conf_call_session_1758524756192_9cyod31g6_1758524760381"
//       },
//       id: "call_session_1758536742049_dnpg0j88n",
//       metadata: {
//         clientId: "wEPWVfzUbDglUINwwmmcEkwzFup1",
//         clientLanguages: ["fr"],
//         createdAt: new Date("2025-09-22T07:06:00.000Z"), // Converting Firestore timestamp
//         maxDuration: 2100,
//         providerId: "jhfbGgZjh1OCXCLzqkgTOD41Hj43",
//         providerLanguages: ["en"],
//         providerType: "expat",
//         requestId: "call_1758524756185_3iy56",
//         serviceType: "expat_call",
//         updatedAt: new Date("2025-09-22T07:06:00.000Z") // Converting Firestore timestamp
//       },

    
//       participants: {
//         client: {
//           attemptCount: 0,
//           phone: "+917415440629",
//           status: "pending"
//         },
//         provider: {
//           attemptCount: 0,
//           phone: "+33743331201",
//           status: "pending"
//         }
//       },
//       payment: {
//         amount: 39,
//         intentId: "pi_3SA3opRbcjaCEWrZ0y8haSbI",

        
//         status: "authorized"
//       },
//         status: "pending"

    
  
    // }
    // console.log(`✅ [Adapter] Session trouvée: ${callSessionId}`);
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
    const { TwilioCallManager } = await import("../TwilioCallManager");
    
    console.log(`📞 [Adapter] Déclenchement de la séquence d'appel...`);
    const result = await TwilioCallManager.startOutboundCall({
      sessionId: callSessionId,
      delayMinutes: 0  // Immédiat car déjà programmé par Cloud Tasks
    });
    console.log(`📞 [Adapter] Résultat de l'appel:`, result);

    console.log(`✅ [Adapter] Appel initié avec succès:`, {
      sessionId: callSessionId,
      status: result?.status || 'unknown'
    });

    // ✅ ÉTAPE 4: Logger le succès
    await logCallRecord({
      callId: callSessionId,
      status: 'cloud_task_executed_successfully',
      retryCount: 0,
      additionalData: {
        adaptedVia: 'beginOutboundCallForSession',
        resultStatus: result?.status || 'unknown'
      }
    });

    return result;

  } catch (error) {
    console.error(`❌ [Adapter] Erreur lors de l'exécution pour ${callSessionId}:`, error);
    
    // Logger l'erreur
    await logError(`twilioCallManagerAdapter:beginOutboundCallForSession`, error);
    
    await logCallRecord({
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
export async function beginOutboundCallForSessionLegacy({
  callSessionId}: {
  callSessionId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  twilio?: any; // Paramètre optionnel pour compatibilité
  fromNumber?: string; // Paramètre optionnel pour compatibilité
}) {
  // Déléguer à la fonction principale
  return beginOutboundCallForSession(callSessionId);
}
