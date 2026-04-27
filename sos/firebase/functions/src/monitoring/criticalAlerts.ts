/**
 * Système d'alertes critiques pour SOS-Expat
 *
 * Surveille les événements critiques et envoie des alertes :
 * - Échecs de webhooks Stripe/PayPal
 * - Backups en échec
 * - DLQ avec événements critiques
 * - Disputes Stripe
 * - Taux d'erreur élevé
 *
 * Les alertes sont envoyées par email et/ou Slack selon la gravité.
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
// fetch is available natively in Node.js 22 - no import needed
import nodemailer from 'nodemailer';
import { EMAIL_USER, EMAIL_PASS } from '../lib/secrets';
import { ADMIN_ALERT_EMAILS } from '../lib/constants';
import { ALLOWED_ORIGINS } from '../lib/functionConfigs';

// ============================================================================
// LAZY INITIALIZATION
// ============================================================================

if (!admin.apps.length) {
  admin.initializeApp();
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Seuils d'alerte
  THRESHOLDS: {
    DLQ_PENDING_CRITICAL: 10,      // Alerter si > 10 events pending
    DLQ_FAILED_CRITICAL: 5,        // Alerter si > 5 events en échec permanent
    ERROR_RATE_PERCENT: 5,         // Alerter si > 5% d'erreurs
    BACKUP_AGE_HOURS: 48,          // Alerter si backup > 48h
    DISPUTE_AMOUNT_EUR: 100        // Alerter si dispute > 100€
  },
  // Destinataires des alertes
  ALERT_EMAILS: ADMIN_ALERT_EMAILS,
  // Collection pour stocker les alertes
  ALERTS_COLLECTION: 'system_alerts'
};

// ============================================================================
// TYPES
// ============================================================================

type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';
type AlertCategory = 'webhook' | 'backup' | 'payment' | 'security' | 'system';

interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: FirebaseFirestore.Timestamp;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: FirebaseFirestore.Timestamp;
  notificationsSent: {
    email: boolean;
    slack: boolean;
  };
}

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Envoie une notification Slack
 */
async function sendSlackNotification(alert: Partial<Alert>): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    logger.warn('[Alerts] Slack webhook URL not configured');
    return false;
  }

  const severityEmoji: Record<AlertSeverity, string> = {
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🔴',
    emergency: '🚨'
  };

  const severityColor: Record<AlertSeverity, string> = {
    info: '#36a64f',
    warning: '#ff9800',
    critical: '#f44336',
    emergency: '#9c27b0'
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color: severityColor[alert.severity || 'warning'],
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: `${severityEmoji[alert.severity || 'warning']} ${alert.title}`,
                emoji: true
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: alert.message
              }
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `*Category:* ${alert.category} | *Severity:* ${alert.severity} | *Time:* ${new Date().toISOString()}`
                }
              ]
            }
          ]
        }]
      })
    });

    return response.ok;
  } catch (error) {
    logger.error('[Alerts] Failed to send Slack notification:', error);
    return false;
  }
}

/**
 * Envoie un email d'alerte via Zoho SMTP (même pattern que passwordReset.ts)
 */
async function sendEmailAlert(alert: Partial<Alert>): Promise<boolean> {
  try {
    const emailUser = EMAIL_USER.value();
    const emailPass = EMAIL_PASS.value();

    if (!emailUser || !emailPass) {
      logger.warn('[Alerts] Email credentials not configured');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.eu',
      port: 465,
      secure: true,
      auth: { user: emailUser, pass: emailPass },
    });

    const severityLabel = (alert.severity || 'warning').toUpperCase();
    const metadataStr = alert.metadata
      ? Object.entries(alert.metadata)
          .map(([k, v]) => `<li><strong>${k}:</strong> ${String(v)}</li>`)
          .join('')
      : '';

    await transporter.sendMail({
      from: `"SOS Expat Alerts" <${emailUser}>`,
      to: CONFIG.ALERT_EMAILS.join(', '),
      subject: `[${severityLabel}] ${alert.title}`,
      html: `
        <h2 style="color: ${alert.severity === 'emergency' ? '#9c27b0' : alert.severity === 'critical' ? '#f44336' : '#ff9800'};">
          ${alert.title}
        </h2>
        <p>${alert.message}</p>
        <p><strong>Severity:</strong> ${severityLabel}</p>
        <p><strong>Category:</strong> ${alert.category}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        ${metadataStr ? `<ul>${metadataStr}</ul>` : ''}
      `,
    });

    return true;
  } catch (error) {
    logger.error('[Alerts] Failed to send email alert:', error);
    return false;
  }
}

/**
 * Crée et envoie une alerte
 */
async function createAlert(
  severity: AlertSeverity,
  category: AlertCategory,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  const db = admin.firestore();
  const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const alert: Alert = {
    id: alertId,
    severity,
    category,
    title,
    message,
    metadata,
    createdAt: admin.firestore.Timestamp.now(),
    acknowledged: false,
    notificationsSent: {
      email: false,
      slack: false
    }
  };

  // Envoyer les notifications selon la gravité
  if (severity === 'critical' || severity === 'emergency') {
    alert.notificationsSent.slack = await sendSlackNotification(alert);
    alert.notificationsSent.email = await sendEmailAlert(alert);
  } else if (severity === 'warning') {
    alert.notificationsSent.slack = await sendSlackNotification(alert);
  }

  // Sauvegarder l'alerte
  await db.collection(CONFIG.ALERTS_COLLECTION).doc(alertId).set(alert);

  logger.info(`[Alerts] Created ${severity} alert: ${title}`);

  return alertId;
}

// ============================================================================
// MONITORING CHECKS
// ============================================================================

/**
 * Vérifie l'état de la Dead Letter Queue
 */
async function checkDLQHealth(): Promise<void> {
  const db = admin.firestore();

  try {
    // Compter les événements pending
    const pendingSnap = await db.collection('webhook_dlq')
      .where('status', '==', 'pending')
      .count()
      .get();

    const pendingCount = pendingSnap.data().count;

    // Compter les événements en échec permanent
    const failedSnap = await db.collection('webhook_dlq')
      .where('status', '==', 'failed_permanent')
      .count()
      .get();

    const failedCount = failedSnap.data().count;

    // Vérifier les événements critiques (paiements)
    const criticalPending = await db.collection('webhook_dlq')
      .where('status', '==', 'pending')
      .where('critical', '==', true)
      .count()
      .get();

    const criticalCount = criticalPending.data().count;

    // Créer des alertes si nécessaire
    if (criticalCount > 0) {
      await createAlert(
        'emergency',
        'webhook',
        'Événements de paiement critiques en attente',
        `${criticalCount} événements de paiement critiques sont bloqués dans la DLQ. Action immédiate requise.`,
        { pendingCount, failedCount, criticalCount }
      );
    } else if (failedCount >= CONFIG.THRESHOLDS.DLQ_FAILED_CRITICAL) {
      await createAlert(
        'critical',
        'webhook',
        'Échecs permanents dans la DLQ',
        `${failedCount} événements ont atteint le maximum de retries. Investigation requise.`,
        { pendingCount, failedCount }
      );
    } else if (pendingCount >= CONFIG.THRESHOLDS.DLQ_PENDING_CRITICAL) {
      await createAlert(
        'warning',
        'webhook',
        'Accumulation dans la DLQ',
        `${pendingCount} événements en attente de traitement dans la DLQ.`,
        { pendingCount, failedCount }
      );
    }

  } catch (error) {
    logger.error('[Monitoring] DLQ check failed:', error);
  }
}

/**
 * Vérifie l'état des backups
 */
async function checkBackupHealth(): Promise<void> {
  const db = admin.firestore();

  try {
    // Vérifier le dernier backup Firestore
    const firestoreBackups = await db.collection('system_logs')
      .where('type', '==', 'firestore_backup')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!firestoreBackups.empty) {
      const lastBackup = firestoreBackups.docs[0].data();
      const backupAge = Date.now() - lastBackup.createdAt.toDate().getTime();
      const ageHours = backupAge / (1000 * 60 * 60);

      if (ageHours > CONFIG.THRESHOLDS.BACKUP_AGE_HOURS) {
        await createAlert(
          'critical',
          'backup',
          'Backup Firestore obsolète',
          `Le dernier backup Firestore date de ${Math.round(ageHours)} heures. Limite: ${CONFIG.THRESHOLDS.BACKUP_AGE_HOURS}h.`,
          { lastBackupAt: lastBackup.createdAt.toDate().toISOString(), ageHours }
        );
      }
    } else {
      await createAlert(
        'critical',
        'backup',
        'Aucun backup Firestore trouvé',
        'Aucun backup Firestore n\'a été enregistré. Vérifiez la configuration.',
        {}
      );
    }

    // Vérifier le dernier backup Auth
    const authBackups = await db.collection('auth_backups')
      .where('status', '==', 'completed')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (!authBackups.empty) {
      const lastBackup = authBackups.docs[0].data();
      const backupAge = Date.now() - lastBackup.createdAt.toDate().getTime();
      const ageDays = backupAge / (1000 * 60 * 60 * 24);

      if (ageDays > 14) { // Auth backup est hebdomadaire
        await createAlert(
          'warning',
          'backup',
          'Backup Auth obsolète',
          `Le dernier backup Auth date de ${Math.round(ageDays)} jours.`,
          { lastBackupAt: lastBackup.createdAt.toDate().toISOString() }
        );
      }
    }

    // Vérifier les backups Twilio en échec
    const failedTwilioBackups = await db.collection('call_recordings')
      .where('backupStatus', '==', 'failed')
      .count()
      .get();

    if (failedTwilioBackups.data().count > 10) {
      await createAlert(
        'warning',
        'backup',
        'Backups Twilio en échec',
        `${failedTwilioBackups.data().count} enregistrements Twilio n'ont pas pu être sauvegardés.`,
        { failedCount: failedTwilioBackups.data().count }
      );
    }

  } catch (error) {
    logger.error('[Monitoring] Backup check failed:', error);
  }
}

/**
 * Vérifie les disputes actives
 */
async function checkDisputeHealth(): Promise<void> {
  const db = admin.firestore();

  try {
    // Disputes ouvertes
    const openDisputes = await db.collection('disputes')
      .where('status', 'in', ['needs_response', 'under_review', 'warning_needs_response'])
      .get();

    if (!openDisputes.empty) {
      const criticalDisputes = openDisputes.docs.filter(doc => {
        const data = doc.data();
        return (data.amount / 100) >= CONFIG.THRESHOLDS.DISPUTE_AMOUNT_EUR;
      });

      if (criticalDisputes.length > 0) {
        await createAlert(
          'critical',
          'payment',
          'Disputes critiques en attente',
          `${criticalDisputes.length} disputes de plus de ${CONFIG.THRESHOLDS.DISPUTE_AMOUNT_EUR}€ nécessitent une réponse.`,
          {
            totalDisputes: openDisputes.size,
            criticalDisputes: criticalDisputes.length,
            totalAmount: openDisputes.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0) / 100
          }
        );
      } else if (openDisputes.size > 5) {
        await createAlert(
          'warning',
          'payment',
          'Disputes en attente',
          `${openDisputes.size} disputes nécessitent votre attention.`,
          { totalDisputes: openDisputes.size }
        );
      }
    }

  } catch (error) {
    logger.error('[Monitoring] Dispute check failed:', error);
  }
}

/**
 * Vérifie le taux d'erreur système
 */
async function checkErrorRate(): Promise<void> {
  const db = admin.firestore();

  try {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Compter les erreurs récentes
    const errors = await db.collection('error_logs')
      .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(oneHourAgo))
      .count()
      .get();

    const errorCount = errors.data().count;

    // Si plus de 50 erreurs en 1 heure
    if (errorCount > 50) {
      await createAlert(
        'critical',
        'system',
        'Taux d\'erreur élevé',
        `${errorCount} erreurs enregistrées dans la dernière heure. Investigation urgente requise.`,
        { errorCount, period: '1h' }
      );
    } else if (errorCount > 20) {
      await createAlert(
        'warning',
        'system',
        'Augmentation des erreurs',
        `${errorCount} erreurs enregistrées dans la dernière heure.`,
        { errorCount, period: '1h' }
      );
    }

  } catch (error) {
    logger.error('[Monitoring] Error rate check failed:', error);
  }
}

// ============================================================================
// SCHEDULED MONITORING
// ============================================================================

/**
 * Job de monitoring exécuté 1×/jour à 8h
 * 2025-01-16: Réduit à quotidien pour économies maximales (low traffic)
 */
/** Exported handler for consolidation */
export async function runSystemHealthCheckHandler(): Promise<void> {
  logger.info('[Monitoring] Starting system health check...');
  try {
    await Promise.all([
      checkDLQHealth(),
      checkBackupHealth(),
      checkDisputeHealth(),
      checkErrorRate()
    ]);
    logger.info('[Monitoring] Health check completed');
  } catch (error) {
    logger.error('[Monitoring] Health check failed:', error);
  }
}

export const runSystemHealthCheck = onSchedule(
  {
    schedule: '0 8 * * *', // 8h Paris tous les jours
    region: 'europe-west3',
    timeZone: 'Europe/Paris',
    memory: '256MiB',
    cpu: 0.083,
    timeoutSeconds: 120
  },
  runSystemHealthCheckHandler
);

/**
 * Nettoyage des anciennes alertes (mensuel)
 */
/** Exported handler for consolidation */
export async function cleanupOldAlertsHandler(): Promise<void> {
  const db = admin.firestore();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const oldAlerts = await db.collection(CONFIG.ALERTS_COLLECTION)
      .where('acknowledged', '==', true)
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
      .limit(500)
      .get();

    const batch = db.batch();
    oldAlerts.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    logger.info(`[Monitoring] Cleaned up ${oldAlerts.size} old alerts`);
  } catch (error) {
    logger.error('[Monitoring] Alert cleanup failed:', error);
  }
}

export const cleanupOldAlerts = onSchedule(
  {
    schedule: '0 5 1 * *', // 1er du mois à 5h
    timeZone: 'Europe/Paris',
    region: 'europe-west3',
    memory: '256MiB',
    cpu: 0.083,
  },
  cleanupOldAlertsHandler
);

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

/**
 * Admin callable pour obtenir les alertes actives
 */
export const getActiveAlerts = onCall(
  {
    region: 'europe-west1',
    memory: '256MiB',
    cpu: 0.083,
    cors: ALLOWED_ORIGINS,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    const userData = userDoc.data();
    if (userData?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Admin access required');
    }

    try {
      const alerts = await admin.firestore()
        .collection(CONFIG.ALERTS_COLLECTION)
        .where('acknowledged', '==', false)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      return {
        alerts: alerts.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString()
        })),
        count: alerts.size
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new HttpsError('internal', err.message);
    }
  }
);

/**
 * Admin callable pour acknowledger une alerte
 */
export const acknowledgeAlert = onCall(
  {
    region: 'europe-west1',
    memory: '256MiB',
    cpu: 0.083,
    cors: ALLOWED_ORIGINS,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    const userData = userDoc.data();
    if (userData?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Admin access required');
    }

    const { alertId } = request.data as { alertId: string };

    if (!alertId) {
      throw new HttpsError('invalid-argument', 'alertId is required');
    }

    try {
      await admin.firestore()
        .collection(CONFIG.ALERTS_COLLECTION)
        .doc(alertId)
        .update({
          acknowledged: true,
          acknowledgedBy: request.auth.uid,
          acknowledgedAt: admin.firestore.Timestamp.now()
        });

      return { success: true, alertId };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new HttpsError('internal', err.message);
    }
  }
);

/**
 * Admin callable pour obtenir un résumé de santé du système
 */
export const getSystemHealthSummary = onCall(
  {
    region: 'europe-west1',
    memory: '256MiB',
    cpu: 0.083,
    timeoutSeconds: 60,
    cors: ALLOWED_ORIGINS,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    const userData = userDoc.data();
    if (userData?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Admin access required');
    }

    const db = admin.firestore();

    try {
      // DLQ stats
      const [dlqPending, dlqFailed] = await Promise.all([
        db.collection('webhook_dlq').where('status', '==', 'pending').count().get(),
        db.collection('webhook_dlq').where('status', '==', 'failed_permanent').count().get()
      ]);

      // Active alerts
      const activeAlerts = await db.collection(CONFIG.ALERTS_COLLECTION)
        .where('acknowledged', '==', false)
        .count()
        .get();

      // Recent errors (last hour)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      const recentErrors = await db.collection('error_logs')
        .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(oneHourAgo))
        .count()
        .get();

      // Open disputes
      const openDisputes = await db.collection('disputes')
        .where('status', 'in', ['needs_response', 'under_review'])
        .count()
        .get();

      // Last backups
      const lastFirestoreBackup = await db.collection('system_logs')
        .where('type', '==', 'firestore_backup')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      const lastAuthBackup = await db.collection('auth_backups')
        .where('status', '==', 'completed')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      // Determine overall health status
      let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      const issues: string[] = [];

      if (dlqFailed.data().count > 0) {
        healthStatus = 'critical';
        issues.push(`${dlqFailed.data().count} événements DLQ en échec permanent`);
      }
      if (dlqPending.data().count > 10) {
        if (healthStatus === 'healthy') healthStatus = 'warning';
        issues.push(`${dlqPending.data().count} événements DLQ en attente`);
      }
      if (activeAlerts.data().count > 0) {
        if (healthStatus === 'healthy') healthStatus = 'warning';
        issues.push(`${activeAlerts.data().count} alertes non acquittées`);
      }
      if (recentErrors.data().count > 20) {
        healthStatus = 'critical';
        issues.push(`${recentErrors.data().count} erreurs dans la dernière heure`);
      }

      return {
        status: healthStatus,
        issues,
        metrics: {
          dlq: {
            pending: dlqPending.data().count,
            failed: dlqFailed.data().count
          },
          alerts: {
            active: activeAlerts.data().count
          },
          errors: {
            lastHour: recentErrors.data().count
          },
          disputes: {
            open: openDisputes.data().count
          },
          backups: {
            firestore: lastFirestoreBackup.empty ? null : {
              lastAt: lastFirestoreBackup.docs[0].data().createdAt?.toDate?.()?.toISOString()
            },
            auth: lastAuthBackup.empty ? null : {
              lastAt: lastAuthBackup.docs[0].data().createdAt?.toDate?.()?.toISOString(),
              userCount: lastAuthBackup.docs[0].data().totalUsers
            }
          }
        },
        checkedAt: new Date().toISOString()
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      throw new HttpsError('internal', err.message);
    }
  }
);
