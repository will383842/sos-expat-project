import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { MessageTemplate } from './MessageManager';

// 🔧 FIX CRITIQUE: Configuration d'optimisation CPU SEULEMENT
const CPU_OPTIMIZED_CONFIG = {
  region: 'europe-west1' as const,
  memory: '256MiB' as const,
  cpu: 0.25 as const,
  timeoutSeconds: 120,
  maxInstances: 3,
  minInstances: 0,
  concurrency: 1};

// ⚠️ TOUS LES TEMPLATES ORIGINAUX GARDÉS (pas de suppression fonctionnelle)
const defaultTemplates: Omit<MessageTemplate, 'createdAt' | 'updatedAt'>[] = [
  // ====== TEMPLATES WHATSAPP ======
  {
    id: 'whatsapp_provider_notification',
    name: 'Notification WhatsApp Prestataire',
    type: 'whatsapp',
    language: 'fr',
    content: '🔔 SOS Expat : Un client va vous appeler dans 5 minutes.\n📋 Titre : {requestTitle}\n🗣️ Langue : {language}\n📞 Soyez prêt à répondre !',
    variables: ['requestTitle', 'language'],
    isActive: true
  },
  {
    id: 'whatsapp_client_notification',
    name: 'Notification WhatsApp Client',
    type: 'whatsapp',
    language: 'fr',
    content: '✅ Votre appel avec un expert SOS Expat est prévu dans quelques minutes.\n📋 Sujet : {requestTitle}\n🗣️ Langue : {language}\n📞 Restez proche de votre téléphone !',
    variables: ['requestTitle', 'language'],
    isActive: true
  },

  // ====== TEMPLATES SMS - MISE À JOUR SELON VOS RECOMMANDATIONS ======
  {
    id: 'sms_provider_notification',
    name: 'Notification SMS Prestataire',
    type: 'sms',
    language: 'fr',
    content: '🔔 SOS Expat : Un client va vous appeler dans 5 min. Sujet: {requestTitle}. Langue: {language}.',
    variables: ['requestTitle', 'language'],
    isActive: true
  },
  {
    id: 'sms_client_notification',
    name: 'Notification SMS Client',
    type: 'sms',
    language: 'fr',
    content: '✅ Votre appel SOS Expat est prévu dans 5 min. Sujet: {requestTitle}. Langue: {language}.',
    variables: ['requestTitle', 'language'],
    isActive: true
  },

  // ====== TEMPLATES VOCAUX ======
  {
    id: 'voice_provider_welcome',
    name: 'Message vocal accueil prestataire',
    type: 'voice',
    language: 'fr',
    content: 'Bonjour, vous allez être mis en relation avec votre client SOS Expat. Veuillez patienter quelques instants.',
    variables: [],
    isActive: true
  },
  {
    id: 'voice_client_welcome',
    name: 'Message vocal accueil client',
    type: 'voice',
    language: 'fr',
    content: 'Bonjour, vous allez être mis en relation avec votre expert SOS Expat. Veuillez patienter quelques instants.',
    variables: [],
    isActive: true
  },

  // ====== TEMPLATES ÉCHECS D'APPEL ======
  {
    id: 'whatsapp_call_failure_provider_no_answer_client',
    name: 'WhatsApp échec - prestataire non réponse (client)',
    type: 'whatsapp',
    language: 'fr',
    content: '❌ Appel non établi\n\nLe prestataire n\'a pas répondu à nos appels répétés.\n\n💰 Vous ne serez pas débité\n✅ Remboursement automatique en cours\n\n🔄 Vous pouvez sélectionner un autre expert sur notre plateforme.',
    variables: [],
    isActive: true
  },
  {
    id: 'sms_call_failure_provider_no_answer_client',
    name: 'SMS échec - prestataire non réponse (client)',
    type: 'sms',
    language: 'fr',
    content: 'SOS Expat: Le prestataire n\'a pas répondu. Vous ne serez pas débité. Remboursement automatique. Vous pouvez choisir un autre expert.',
    variables: [],
    isActive: true
  },
  {
    id: 'whatsapp_call_failure_client_no_answer_provider',
    name: 'WhatsApp échec - client non réponse (prestataire)',
    type: 'whatsapp',
    language: 'fr',
    content: '📞 Appel client annulé\n\nLe client n\'a pas répondu à nos appels.\n\n💰 Vous serez indemnisé pour votre disponibilité selon nos conditions.\n\n📧 Notre équipe vous contactera sous 24h.',
    variables: [],
    isActive: true
  },
  {
    id: 'sms_call_failure_client_no_answer_provider',
    name: 'SMS échec - client non réponse (prestataire)',
    type: 'sms',
    language: 'fr',
    content: 'SOS Expat: Le client n\'a pas répondu. Vous serez indemnisé selon nos conditions. Notre équipe vous contactera.',
    variables: [],
    isActive: true
  },
  {
    id: 'whatsapp_call_failure_system_error_client',
    name: 'WhatsApp échec - erreur système (client)',
    type: 'whatsapp',
    language: 'fr',
    content: '⚠️ Problème technique\n\nUn problème technique a empêché l\'établissement de l\'appel.\n\n💰 Vous ne serez pas débité\n🔧 Notre équipe technique a été notifiée\n\n📞 Vous pouvez réessayer dans quelques minutes.',
    variables: [],
    isActive: true
  },
  {
    id: 'sms_call_failure_system_error_client',
    name: 'SMS échec - erreur système (client)',
    type: 'sms',
    language: 'fr',
    content: 'SOS Expat: Problème technique, appel impossible. Vous ne serez pas débité. Équipe technique notifiée. Réessayez plus tard.',
    variables: [],
    isActive: true
  },
  {
    id: 'whatsapp_call_failure_system_error_provider',
    name: 'WhatsApp échec - erreur système (prestataire)',
    type: 'whatsapp',
    language: 'fr',
    content: '⚠️ Problème technique\n\nUn problème technique a empêché l\'établissement de l\'appel avec le client.\n\n🔧 Notre équipe technique a été notifiée\n💰 Compensation selon nos conditions\n\nMerci pour votre compréhension.',
    variables: [],
    isActive: true
  },
  {
    id: 'sms_call_failure_system_error_provider',
    name: 'SMS échec - erreur système (prestataire)',
    type: 'sms',
    language: 'fr',
    content: 'SOS Expat: Problème technique, appel impossible. Équipe notifiée. Compensation selon conditions. Merci compréhension.',
    variables: [],
    isActive: true
  },

  // ====== TEMPLATES SUCCÈS ======
  {
    id: 'whatsapp_call_success_client',
    name: 'WhatsApp succès (client)',
    type: 'whatsapp',
    language: 'fr',
    content: '✅ Appel terminé avec succès !\n\n⏱️ Durée : {duration}min {seconds}s\n\nMerci d\'avoir utilisé SOS Expat !\n\n⭐ Laissez un avis sur votre expérience\n📧 Vous recevrez votre facture par email',
    variables: ['duration', 'seconds'],
    isActive: true
  },
  {
    id: 'sms_call_success_client',
    name: 'SMS succès (client)',
    type: 'sms',
    language: 'fr',
    content: 'SOS Expat: Appel terminé ({duration}min {seconds}s). Merci ! Laissez un avis sur votre expérience. Facture par email.',
    variables: ['duration', 'seconds'],
    isActive: true
  },
  {
    id: 'whatsapp_call_success_provider',
    name: 'WhatsApp succès (prestataire)',
    type: 'whatsapp',
    language: 'fr',
    content: '✅ Consultation terminée avec succès !\n\n⏱️ Durée : {duration}min {seconds}s\n💰 Paiement traité sous 24h\n\nMerci pour votre excellent service !\n\n📊 Vos statistiques ont été mises à jour',
    variables: ['duration', 'seconds'],
    isActive: true
  },
  {
    id: 'sms_call_success_provider',
    name: 'SMS succès (prestataire)',
    type: 'sms',
    language: 'fr',
    content: 'SOS Expat: Consultation terminée ({duration}min {seconds}s). Paiement sous 24h. Merci pour votre service !',
    variables: ['duration', 'seconds'],
    isActive: true
  },

  // ====== TEMPLATES DEMANDES DE CONSULTATION ======
  {
    id: 'whatsapp_provider_booking_request',
    name: 'WhatsApp nouvelle demande (prestataire)',
    type: 'whatsapp',
    language: 'fr',
    content: '🔔 Nouvelle demande de consultation !\n\n👤 Client : {clientName}\n🌍 Pays : {clientCountry}\n🗣️ Langues : {clientLanguages}\n📋 Sujet : {requestTitle}\n\n💰 Montant : {amount}€\n\n📱 Consultez votre espace prestataire pour accepter ou refuser cette demande.',
    variables: ['clientName', 'clientCountry', 'clientLanguages', 'requestTitle', 'amount'],
    isActive: true
  },
  {
    id: 'sms_provider_booking_request',
    name: 'SMS nouvelle demande (prestataire)',
    type: 'sms',
    language: 'fr',
    content: 'SOS Expat: Nouvelle demande de {clientName} ({clientCountry}). Sujet: {requestTitle}. {amount}€. Consultez votre espace prestataire.',
    variables: ['clientName', 'clientCountry', 'requestTitle', 'amount'],
    isActive: true
  },

  // ====== TEMPLATES PAIEMENT ======
  {
    id: 'whatsapp_payment_issue_client',
    name: 'WhatsApp problème paiement (client)',
    type: 'whatsapp',
    language: 'fr',
    content: '⚠️ Problème de paiement détecté\n\n{issueDescription}\n\n💳 Actions requises :\n• Vérifiez votre mode de paiement\n• Contactez votre banque si nécessaire\n• Notre équipe vous contactera sous 24h\n\n🔒 Vos données sont sécurisées',
    variables: ['issueDescription'],
    isActive: true
  },
  {
    id: 'sms_payment_issue_client',
    name: 'SMS problème paiement (client)',
    type: 'sms',
    language: 'fr',
    content: 'SOS Expat: Problème paiement détecté. {issueDescription}. Vérifiez votre mode de paiement. Support: 24h.',
    variables: ['issueDescription'],
    isActive: true
  },
  {
    id: 'whatsapp_payment_issue_provider',
    name: 'WhatsApp problème paiement (prestataire)',
    type: 'whatsapp',
    language: 'fr',
    content: '💳 Information paiement\n\nUn problème de paiement est survenu avec le client.\n\n✅ Votre rémunération sera traitée manuellement par notre équipe finance\n⏱️ Délai de traitement : 24-48h\n\nMerci pour votre patience.',
    variables: [],
    isActive: true
  },
  {
    id: 'sms_payment_issue_provider',
    name: 'SMS problème paiement (prestataire)',
    type: 'sms',
    language: 'fr',
    content: 'SOS Expat: Problème paiement client. Votre rémunération sera traitée manuellement par équipe finance (24-48h).',
    variables: [],
    isActive: true
  },

  // ====== TEMPLATES CONFIRMATION APPEL ======
  {
    id: 'whatsapp_call_scheduled_client',
    name: 'WhatsApp appel programmé (client)',
    type: 'whatsapp',
    language: 'fr',
    content: '📅 Votre appel est programmé !\n\n🕐 Dans 5 minutes\n👨‍💼 Expert : {providerName}\n📞 Restez proche de votre téléphone\n\n✅ Paiement confirmé : {amount}€\n⏱️ Durée prévue : {duration} minutes',
    variables: ['providerName', 'amount', 'duration'],
    isActive: true
  },
  {
    id: 'sms_call_scheduled_client',
    name: 'SMS appel programmé (client)',
    type: 'sms',
    language: 'fr',
    content: 'SOS Expat: Appel avec {providerName} dans 5min. Restez disponible. Paiement confirmé: {amount}€.',
    variables: ['providerName', 'amount'],
    isActive: true
  },
  {
    id: 'whatsapp_call_scheduled_provider',
    name: 'WhatsApp appel programmé (prestataire)',
    type: 'whatsapp',
    language: 'fr',
    content: '📅 Appel client programmé !\n\n🕐 Dans 5 minutes\n👤 Client confirmé et payé\n📞 Préparez-vous à recevoir l\'appel\n\n💰 Rémunération : {providerAmount}€\n⏱️ Durée prévue : {duration} minutes',
    variables: ['providerAmount', 'duration'],
    isActive: true
  },
  {
    id: 'sms_call_scheduled_provider',
    name: 'SMS appel programmé (prestataire)',
    type: 'sms',
    language: 'fr',
    content: 'SOS Expat: Appel client dans 5min. Client payé. Préparez-vous. Rémunération: {providerAmount}€.',
    variables: ['providerAmount'],
    isActive: true
  },

  // ====== TEMPLATES DÉCONNEXION PRÉCOCE ======
  {
    id: 'whatsapp_early_disconnection_client',
    name: 'WhatsApp déconnexion précoce (client)',
    type: 'whatsapp',
    language: 'fr',
    content: '⚠️ Appel terminé prématurément\n\n⏱️ Durée : {duration} secondes\n\n💰 Remboursement automatique en cours\n🔄 Vous pouvez relancer une consultation\n\n❓ Si c\'était involontaire, contactez notre support.',
    variables: ['duration'],
    isActive: true
  },
  {
    id: 'sms_early_disconnection_client',
    name: 'SMS déconnexion précoce (client)',
    type: 'sms',
    language: 'fr',
    content: 'SOS Expat: Appel terminé prématurément ({duration}s). Remboursement automatique. Contactez support si involontaire.',
    variables: ['duration'],
    isActive: true
  },
  {
    id: 'whatsapp_early_disconnection_provider',
    name: 'WhatsApp déconnexion précoce (prestataire)',
    type: 'whatsapp',
    language: 'fr',
    content: '⚠️ Appel client terminé prématurément\n\n⏱️ Durée : {duration} secondes\n\n💰 Compensation minimale selon nos conditions\n📧 Notre équipe vous contactera si nécessaire\n\nMerci pour votre disponibilité.',
    variables: ['duration'],
    isActive: true
  },
  {
    id: 'sms_early_disconnection_provider',
    name: 'SMS déconnexion précoce (prestataire)',
    type: 'sms',
    language: 'fr',
    content: 'SOS Expat: Appel terminé prématurément ({duration}s). Compensation minimale selon conditions. Merci disponibilité.',
    variables: ['duration'],
    isActive: true
  },

  // ====== TEMPLATES RAPPELS ======
  {
    id: 'whatsapp_call_reminder_client',
    name: 'WhatsApp rappel appel (client)',
    type: 'whatsapp',
    language: 'fr',
    content: '⏰ Rappel : Votre appel dans 2 minutes !\n\n👨‍💼 Expert : {providerName}\n📞 Assurez-vous d\'être disponible\n🔊 Vérifiez que votre téléphone n\'est pas en mode silencieux',
    variables: ['providerName'],
    isActive: true
  },
  {
    id: 'sms_call_reminder_client',
    name: 'SMS rappel appel (client)',
    type: 'sms',
    language: 'fr',
    content: 'SOS Expat: RAPPEL - Votre appel avec {providerName} dans 2min. Soyez disponible !',
    variables: ['providerName'],
    isActive: true
  },

  // ====== TEMPLATES ANNULATION ======
  {
    id: 'whatsapp_call_cancelled_client',
    name: 'WhatsApp appel annulé (client)',
    type: 'whatsapp',
    language: 'fr',
    content: '❌ Appel annulé\n\nRaison : {cancelReason}\n\n💰 Remboursement intégral automatique\n⏱️ Délai : 3-5 jours ouvrés\n\n🔄 Vous pouvez programmer un nouvel appel quand vous le souhaitez.',
    variables: ['cancelReason'],
    isActive: true
  },
  {
    id: 'sms_call_cancelled_client',
    name: 'SMS appel annulé (client)',
    type: 'sms',
    language: 'fr',
    content: 'SOS Expat: Appel annulé. Raison: {cancelReason}. Remboursement intégral automatique (3-5j).',
    variables: ['cancelReason'],
    isActive: true
  },
  {
    id: 'whatsapp_call_cancelled_provider',
    name: 'WhatsApp appel annulé (prestataire)',
    type: 'whatsapp',
    language: 'fr',
    content: '❌ Appel client annulé\n\nRaison : {cancelReason}\n\n📊 Cela n\'affecte pas vos statistiques\n💰 Compensation selon nos conditions si applicable\n\nMerci pour votre compréhension.',
    variables: ['cancelReason'],
    isActive: true
  },
  {
    id: 'sms_call_cancelled_provider',
    name: 'SMS appel annulé (prestataire)',
    type: 'sms',
    language: 'fr',
    content: 'SOS Expat: Appel annulé. Raison: {cancelReason}. Pas d\'impact statistiques. Compensation si applicable.',
    variables: ['cancelReason'],
    isActive: true
  }
];

export const initializeMessageTemplates = onCall(
  CPU_OPTIMIZED_CONFIG, // 🔧 FIX CRITIQUE: SEULEMENT la configuration d'optimisation CPU
  async (request) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (!request.auth) {
      throw new Error('Utilisateur non authentifié');
    }

    // TODO: Ajouter vérification du rôle admin
    // const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    // if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    //   throw new Error('Accès refusé - Admin requis');
    // }

    console.log('🚀 Initialisation des templates de messages (SMS mis à jour)...');
    
    const db = admin.firestore();
    
    let created = 0;
    let updated = 0;
    let errors = 0;

    // 🔧 OPTIMISATION CPU: Traitement par petits lots SEULEMENT
    const batchSize = 8; // Légèrement plus gros que la version réduite
    const batches: typeof defaultTemplates[] = [];
    
    for (let i = 0; i < defaultTemplates.length; i += batchSize) {
      batches.push(defaultTemplates.slice(i, i + batchSize));
    }

    console.log(`📊 Traitement de ${defaultTemplates.length} templates en ${batches.length} lots`);

    for (const [batchIndex, batchTemplates] of batches.entries()) {
      const batch = db.batch();
      let batchOperations = 0;

      console.log(`📦 Traitement du lot ${batchIndex + 1}/${batches.length} (${batchTemplates.length} templates)`);

      for (const template of batchTemplates) {
        try {
          const templateRef = db.collection('message_templates').doc(template.id);
          const existingDoc = await templateRef.get();
          
          const templateData = {
            ...template,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };

          if (existingDoc.exists) {
            // Mise à jour du template existant (garde le contenu personnalisé si modifié)
            const existingData = existingDoc.data();
            
            // Ne mettre à jour que si le contenu n'a pas été personnalisé
            const shouldUpdate = !existingData?.isCustomized;
            
            if (shouldUpdate) {
              batch.update(templateRef, {
                name: template.name,
                type: template.type,
                language: template.language,
                content: template.content, // Mettre à jour le contenu
                variables: template.variables,
                isActive: template.isActive,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              updated++;
              batchOperations++;
              console.log(`📝 Template mis à jour: ${template.id}`);
            } else {
              console.log(`⏭️ Template personnalisé ignoré: ${template.id}`);
            }
          } else {
            // Création d'un nouveau template
            batch.set(templateRef, {
              ...templateData,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              isCustomized: false // Marquer comme non personnalisé
            });
            created++;
            batchOperations++;
            console.log(`✅ Nouveau template créé: ${template.id}`);
          }
        } catch (templateError) {
          console.error(`❌ Erreur avec template ${template.id}:`, templateError);
          errors++;
        }
      }

      // Valider le batch
      if (batchOperations > 0) {
        await batch.commit();
        console.log(`🎉 Lot ${batchIndex + 1} validé: ${batchOperations} opérations`);
      }

      // 🔧 OPTIMISATION CPU: Pause entre les batches pour réduire la charge CPU
      if (batchIndex < batches.length - 1) {
        console.log('⏳ Pause entre lots pour optimiser CPU...');
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms de pause
      }
    }

    // Créer les templates par défaut pour les langues supplémentaires (COMPLET)
    await createMultiLanguageTemplates(db);

    const summary = {
      success: true,
      message: `Templates initialisés avec succès (SMS notifications mis à jour) !`,
      details: {
        created,
        updated,
        errors,
        total: defaultTemplates.length
      }
    };

    console.log('✅ Initialisation terminée (SMS notifications optimisés):', summary);
    return summary;

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des templates:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      details: {
        created: 0,
        updated: 0,
        errors: 1,
        total: defaultTemplates.length
      }
    };
  }
});

/**
 * Créer des templates pour les langues supplémentaires (FONCTION COMPLÈTE GARDÉE)
 */
async function createMultiLanguageTemplates(db: admin.firestore.Firestore) {
  try {
    console.log('🌍 Création des templates multi-langues (version complète)...');
    
    // Templates critiques à traduire - AJOUT DES NOUVEAUX TEMPLATES SMS
    const criticalTemplates = [
      'voice_provider_welcome',
      'voice_client_welcome',
      'sms_call_success_client',
      'sms_call_success_provider',
      'sms_call_failure_provider_no_answer_client',
      'sms_call_failure_client_no_answer_provider',
      'sms_provider_notification', // ✅ AJOUTÉ
      'sms_client_notification'    // ✅ AJOUTÉ
    ];

    const translations = {
      en: {
        'voice_provider_welcome': 'Hello, you will be connected with your SOS Expat client. Please wait a moment.',
        'voice_client_welcome': 'Hello, you will be connected with your SOS Expat expert. Please wait a moment.',
        'sms_call_success_client': 'SOS Expat: Call completed ({duration}min {seconds}s). Thank you! Leave a review. Invoice by email.',
        'sms_call_success_provider': 'SOS Expat: Consultation completed ({duration}min {seconds}s). Payment within 24h. Thank you!',
        'sms_call_failure_provider_no_answer_client': 'SOS Expat: Provider did not answer. No charge. Automatic refund. Choose another expert.',
        'sms_call_failure_client_no_answer_provider': 'SOS Expat: Client did not answer. You will be compensated. Our team will contact you.',
        'sms_provider_notification': '🔔 SOS Expat: A client will call you in 5 min. Subject: {requestTitle}. Language: {language}.',
        'sms_client_notification': '✅ Your SOS Expat call is scheduled in 5 min. Subject: {requestTitle}. Language: {language}.'
      },
      es: {
        'voice_provider_welcome': 'Hola, será conectado con su cliente SOS Expat. Por favor espere un momento.',
        'voice_client_welcome': 'Hola, será conectado con su experto SOS Expat. Por favor espere un momento.',
        'sms_call_success_client': 'SOS Expat: Llamada completada ({duration}min {seconds}s). ¡Gracias! Deje su opinión. Factura por email.',
        'sms_call_success_provider': 'SOS Expat: Consulta completada ({duration}min {seconds}s). Pago en 24h. ¡Gracias!',
        'sms_call_failure_provider_no_answer_client': 'SOS Expat: Proveedor no respondió. Sin cargo. Reembolso automático. Elija otro experto.',
        'sms_call_failure_client_no_answer_provider': 'SOS Expat: Cliente no respondió. Será compensado. Nuestro equipo lo contactará.',
        'sms_provider_notification': '🔔 SOS Expat: Un cliente le llamará en 5 min. Tema: {requestTitle}. Idioma: {language}.',
        'sms_client_notification': '✅ Su llamada SOS Expat está programada en 5 min. Tema: {requestTitle}. Idioma: {language}.'
      }
    };

    // 🔧 OPTIMISATION CPU: Traitement par lots aussi pour les multi-langues
    const multiLangBatchSize = 6;
    let multiLangCreated = 0;
    
    for (const [lang, langTranslations] of Object.entries(translations)) {
      console.log(`🌍 Traitement langue: ${lang.toUpperCase()}`);
      
      // Traiter par petits lots
      const templatesArray = criticalTemplates.slice(); // Copie
      const langBatches: string[][] = [];
      
      for (let i = 0; i < templatesArray.length; i += multiLangBatchSize) {
        langBatches.push(templatesArray.slice(i, i + multiLangBatchSize));
      }
      
      for (const [batchIndex, batchTemplateIds] of langBatches.entries()) {
        const batch = db.batch();
        let batchOps = 0;

        for (const templateId of batchTemplateIds) {
          const translation = (langTranslations as Record<string, string>)[templateId];
          if (translation) {
            const newId = `${templateId}_${lang}`;
            const templateRef = db.collection('message_templates').doc(newId);
            
            // Vérifier si existe déjà
            const exists = await templateRef.get();
            if (!exists.exists) {
              // Trouver le template original pour récupérer les métadonnées
              const originalTemplate = defaultTemplates.find(t => t.id === templateId);
              if (originalTemplate) {
                batch.set(templateRef, {
                  id: newId,
                  name: `${originalTemplate.name} (${lang.toUpperCase()})`,
                  type: originalTemplate.type,
                  language: lang as 'fr' | 'en' | 'es',
                  content: translation,
                  variables: originalTemplate.variables,
                  isActive: true,
                  isCustomized: false,
                  createdAt: admin.firestore.FieldValue.serverTimestamp(),
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                multiLangCreated++;
                batchOps++;
              }
            }
          }
        }

        if (batchOps > 0) {
          await batch.commit();
          console.log(`  📦 Lot ${lang}-${batchIndex + 1} validé: ${batchOps} templates`);
        }

        // Pause entre les lots multi-langues
        if (batchIndex < langBatches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms
        }
      }
    }

    if (multiLangCreated > 0) {
      console.log(`🌍 ${multiLangCreated} templates multi-langues créés au total`);
    }

  } catch (error) {
    console.error('❌ Erreur création templates multi-langues:', error);
  }
}