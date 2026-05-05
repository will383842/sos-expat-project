// firebase/functions/src/runtime/busySafetyTimeoutTask.ts
// Cloud Task handler for busy safety timeout - releases provider if stuck in busy state

import { Request, Response } from "express";
import * as admin from "firebase-admin";
import { setProviderAvailable } from "../callables/providerStatusManager";
import { logError } from "../utils/logs/logError";
import { logger as prodLogger } from "../utils/productionLogger";
// P0 FIX: Import secrets from centralized secrets.ts - NEVER call defineSecret() here!
import { TASKS_AUTH_SECRET, isValidTaskAuth } from "../lib/secrets";

interface BusySafetyTimeoutPayload {
  providerId: string;
  callSessionId: string;
  scheduledAt: string;
  taskId: string;
  timeoutSeconds: number;
}

/**
 * HTTP Handler for Cloud Tasks - Releases provider from "busy" state if stuck
 *
 * This is a safety net that runs 10 minutes after a provider is marked as busy.
 * It checks if the call session has completed/failed/been cancelled, and if so,
 * releases the provider from the busy state.
 *
 * This prevents providers from being stuck "busy" indefinitely due to:
 * - Network errors preventing webhook delivery
 * - Twilio API failures
 * - System crashes during call flow
 * - Any other unexpected failure scenario
 */
export async function runBusySafetyTimeoutTask(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  let providerId = '';
  let callSessionId = '';
  const debugId = `bst_${Date.now().toString(36)}`;

  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🛡️ [BusySafetyTimeoutTask][${debugId}] === START ===`);
    console.log(`${'='.repeat(70)}`);
    console.log(`🛡️ [${debugId}] Method: ${req.method}`);
    console.log(`🛡️ [${debugId}] Raw Body:`, req.body);

    // STEP 1: Validate auth header
    const authHeader = (req.get("X-Task-Auth") || "").trim();
    const expectedAuth = (TASKS_AUTH_SECRET.value() || "").trim();

    console.log(`🔐 [${debugId}] Auth check:`, {
      hasAuthHeader: !!authHeader,
      hasExpectedAuth: !!expectedAuth,
    });

    if (!isValidTaskAuth(authHeader, expectedAuth)) {
      console.error(`❌ [${debugId}] Invalid or missing X-Task-Auth header`);
      res.status(401).send("Unauthorized");
      return;
    }

    // STEP 2: Parse payload
    const payload = req.body as BusySafetyTimeoutPayload;
    providerId = payload.providerId || "";
    callSessionId = payload.callSessionId || "";
    const taskId = payload.taskId || "unknown";
    const scheduledAt = payload.scheduledAt || "unknown";

    console.log(`🛡️ [${debugId}] Payload:`, {
      providerId,
      callSessionId,
      taskId,
      scheduledAt
    });

    if (!providerId || !callSessionId) {
      console.error(`❌ [${debugId}] Missing providerId or callSessionId in payload`);
      // Return 200 to prevent Cloud Tasks retry
      res.status(200).json({
        success: false,
        error: "Missing providerId or callSessionId",
        handled: true
      });
      return;
    }

    prodLogger.info('BUSY_SAFETY_TIMEOUT_TASK_START', `Processing busy safety timeout for provider ${providerId}`, {
      providerId,
      callSessionId,
      taskId,
      scheduledAt,
      debugId
    });

    // STEP 3: Check current provider status
    const db = admin.firestore();
    const providerDoc = await db.collection('users').doc(providerId).get();

    if (!providerDoc.exists) {
      console.warn(`⚠️ [${debugId}] Provider ${providerId} not found - skipping`);
      res.status(200).json({
        success: true,
        action: 'skipped',
        reason: 'provider_not_found',
        providerId
      });
      return;
    }

    const providerData = providerDoc.data();
    const currentAvailability = providerData?.availability;
    const currentCallSessionId = providerData?.currentCallSessionId;
    const busySince = providerData?.busySince;

    console.log(`🛡️ [${debugId}] Provider current state:`, {
      availability: currentAvailability,
      currentCallSessionId,
      busySince: busySince?.toDate?.()?.toISOString() || busySince,
      wasOfflineBeforeCall: providerData?.wasOfflineBeforeCall
    });

    // STEP 4: Check if provider is still busy for THIS specific call session
    if (currentAvailability !== 'busy') {
      console.log(`✅ [${debugId}] Provider is not busy anymore (status: ${currentAvailability}) - no action needed`);
      res.status(200).json({
        success: true,
        action: 'skipped',
        reason: 'provider_not_busy',
        providerId,
        currentAvailability
      });
      return;
    }

    if (currentCallSessionId !== callSessionId) {
      console.log(`✅ [${debugId}] Provider is busy for a DIFFERENT call session - no action needed`);
      console.log(`✅ [${debugId}]   Expected session: ${callSessionId}`);
      console.log(`✅ [${debugId}]   Current session: ${currentCallSessionId}`);
      res.status(200).json({
        success: true,
        action: 'skipped',
        reason: 'different_call_session',
        providerId,
        expectedSession: callSessionId,
        currentSession: currentCallSessionId
      });
      return;
    }

    // STEP 5: Check call session status
    const sessionDoc = await db.collection('call_sessions').doc(callSessionId).get();

    if (!sessionDoc.exists) {
      console.log(`⚠️ [${debugId}] Call session ${callSessionId} not found - will release provider`);
      // Session doesn't exist, release the provider
    } else {
      const sessionData = sessionDoc.data();
      const sessionStatus = sessionData?.status;

      console.log(`🛡️ [${debugId}] Call session status: ${sessionStatus}`);

      // If session is still active, don't release the provider.
      // 'pending' / 'scheduled' retirés : à 10min, ces statuts indiquent un backend crashed,
      // pas une session vraiment active. Sinon le provider reste busy jusqu'au cleanup horaire.
      const activeStatuses = ['provider_connecting', 'client_connecting', 'both_connecting', 'active'];
      if (activeStatuses.includes(sessionStatus)) {
        console.log(`✅ [${debugId}] Call session is still active (${sessionStatus}) - no action needed`);
        res.status(200).json({
          success: true,
          action: 'skipped',
          reason: 'session_still_active',
          providerId,
          callSessionId,
          sessionStatus
        });
        return;
      }

      console.log(`⚠️ [${debugId}] Call session is NOT active (${sessionStatus}) but provider is still busy - will release provider`);
    }

    // STEP 6: Release the provider
    console.log(`🛡️ [${debugId}] RELEASING provider ${providerId} from busy state...`);

    const result = await setProviderAvailable(providerId, 'busy_safety_timeout');

    const duration = Date.now() - startTime;

    console.log(`\n${'='.repeat(70)}`);
    console.log(`✅ [BusySafetyTimeoutTask][${debugId}] === PROVIDER RELEASED ===`);
    console.log(`${'='.repeat(70)}`);
    console.log(`✅ [${debugId}] Provider ${providerId} released from busy state`);
    console.log(`✅ [${debugId}] Previous status: ${result.previousStatus}`);
    console.log(`✅ [${debugId}] New status: ${result.newStatus}`);
    console.log(`✅ [${debugId}] Duration: ${duration}ms`);
    console.log(`${'='.repeat(70)}\n`);

    prodLogger.info('BUSY_SAFETY_TIMEOUT_TASK_RELEASED', `Provider ${providerId} released from stuck busy state`, {
      providerId,
      callSessionId,
      taskId,
      duration,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      debugId
    });

    res.status(200).json({
      success: true,
      action: 'released',
      providerId,
      callSessionId,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    console.error(`\n${'='.repeat(70)}`);
    console.error(`❌ [BusySafetyTimeoutTask][${debugId}] === ERROR ===`);
    console.error(`${'='.repeat(70)}`);
    console.error(`❌ [${debugId}] ProviderId: ${providerId}`);
    console.error(`❌ [${debugId}] CallSessionId: ${callSessionId}`);
    console.error(`❌ [${debugId}] Duration: ${duration}ms`);
    console.error(`❌ [${debugId}] Error:`, error);
    console.error(`${'='.repeat(70)}\n`);

    prodLogger.error('BUSY_SAFETY_TIMEOUT_TASK_ERROR', `Failed to process busy safety timeout`, {
      providerId,
      callSessionId,
      duration,
      error: error instanceof Error ? error.message : String(error),
      debugId
    });

    await logError("busySafetyTimeoutTask", error);

    // Return 200 to prevent Cloud Tasks retry (we've logged the error)
    res.status(200).json({
      success: false,
      providerId,
      callSessionId,
      error: error instanceof Error ? error.message : "Unknown error",
      handled: true,
      duration
    });
  }
}
