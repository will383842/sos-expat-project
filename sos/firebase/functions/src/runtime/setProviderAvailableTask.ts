// firebase/functions/src/runtime/setProviderAvailableTask.ts
// Cloud Task handler for delayed provider availability (5 min cooldown after call)

import { Request, Response } from "express";
import { setProviderAvailable } from "../callables/providerStatusManager";
import { logError } from "../utils/logs/logError";
import { logger as prodLogger } from "../utils/productionLogger";
// P0 FIX: Import secrets from centralized secrets.ts - NEVER call defineSecret() here!
import { TASKS_AUTH_SECRET, isValidTaskAuth } from "../lib/secrets";

interface SetProviderAvailablePayload {
  providerId: string;
  reason: string;
  scheduledAt: string;
  taskId: string;
}

/**
 * HTTP Handler for Cloud Tasks - Sets provider to "available" status
 * Called 5 minutes after a call ends to give providers a break
 */
export async function runSetProviderAvailableTask(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  let providerId = '';
  const debugId = `spat_${Date.now().toString(36)}`;

  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📋 [SetProviderAvailableTask][${debugId}] === START ===`);
    console.log(`${'='.repeat(70)}`);
    console.log(`📋 [${debugId}] Method: ${req.method}`);
    console.log(`📋 [${debugId}] Raw Body:`, req.body);

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
    const payload = req.body as SetProviderAvailablePayload;
    providerId = payload.providerId || "";
    const reason = payload.reason || "cooldown_completed";
    const taskId = payload.taskId || "unknown";
    const scheduledAt = payload.scheduledAt || "unknown";

    console.log(`📋 [${debugId}] Payload:`, {
      providerId,
      reason,
      taskId,
      scheduledAt
    });

    if (!providerId) {
      console.error(`❌ [${debugId}] Missing providerId in payload`);
      // Return 200 to prevent Cloud Tasks retry
      res.status(200).json({
        success: false,
        error: "Missing providerId",
        handled: true
      });
      return;
    }

    prodLogger.info('SET_PROVIDER_AVAILABLE_TASK_START', `Processing task for provider ${providerId}`, {
      providerId,
      reason,
      taskId,
      scheduledAt,
      debugId
    });

    // STEP 3: Set provider available
    console.log(`📋 [${debugId}] Calling setProviderAvailable()...`);
    const result = await setProviderAvailable(providerId, reason);

    console.log(`✅ [${debugId}] setProviderAvailable result:`, {
      success: result.success,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      message: result.message
    });

    const duration = Date.now() - startTime;

    console.log(`\n${'='.repeat(70)}`);
    console.log(`✅ [SetProviderAvailableTask][${debugId}] === SUCCESS ===`);
    console.log(`${'='.repeat(70)}`);
    console.log(`✅ [${debugId}] Provider ${providerId} set to available`);
    console.log(`✅ [${debugId}] Duration: ${duration}ms`);
    console.log(`${'='.repeat(70)}\n`);

    prodLogger.info('SET_PROVIDER_AVAILABLE_TASK_SUCCESS', `Provider ${providerId} set to available`, {
      providerId,
      reason,
      taskId,
      duration,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      debugId
    });

    res.status(200).json({
      success: true,
      providerId,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      duration
    });

  } catch (error) {
    const duration = Date.now() - startTime;

    console.error(`\n${'='.repeat(70)}`);
    console.error(`❌ [SetProviderAvailableTask][${debugId}] === ERROR ===`);
    console.error(`${'='.repeat(70)}`);
    console.error(`❌ [${debugId}] ProviderId: ${providerId}`);
    console.error(`❌ [${debugId}] Duration: ${duration}ms`);
    console.error(`❌ [${debugId}] Error:`, error);
    console.error(`${'='.repeat(70)}\n`);

    prodLogger.error('SET_PROVIDER_AVAILABLE_TASK_ERROR', `Failed to set provider available`, {
      providerId,
      duration,
      error: error instanceof Error ? error.message : String(error),
      debugId
    });

    await logError("setProviderAvailableTask", error);

    // Distinguer erreurs permanentes (provider not found, payload invalide) des erreurs
    // transientes (Firestore timeout, network) : retourner 500 sur transient → Cloud Tasks
    // réessaie avec backoff. Sinon le provider reste busy jusqu'au filet 10min.
    const errMsg = error instanceof Error ? error.message : String(error);
    const isPermanent = /not.?found|invalid|missing|unauthorized/i.test(errMsg);

    res.status(isPermanent ? 200 : 500).json({
      success: false,
      providerId,
      error: errMsg,
      handled: isPermanent,
      duration
    });
  }
}
