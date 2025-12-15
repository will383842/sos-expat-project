"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestTask = exports.taskExists = exports.getQueueStats = exports.purgeQueue = exports.listPendingTasks = exports.cancelCallTask = exports.scheduleCallTask = void 0;
// firebase/functions/src/lib/tasks.ts
const tasks_1 = require("@google-cloud/tasks");
const params_1 = require("firebase-functions/params");
const logError_1 = require("../utils/logs/logError");
// ------------------------------------------------------
// Configuration via params + fallback ENV (sûr et flexible)
// ------------------------------------------------------
const CLOUD_TASKS_LOCATION = (0, params_1.defineString)("CLOUD_TASKS_LOCATION", { default: "europe-west1" });
const CLOUD_TASKS_QUEUE = (0, params_1.defineString)("CLOUD_TASKS_QUEUE", { default: "call-scheduler-queue" });
const FUNCTIONS_BASE_URL_PARAM = (0, params_1.defineString)("FUNCTIONS_BASE_URL"); // optionnel
const TASKS_AUTH_SECRET = (0, params_1.defineSecret)("TASKS_AUTH_SECRET");
// Récupère le projectId depuis l'environnement Functions (standard)
function getProjectId() {
    return (process.env.GCLOUD_PROJECT ||
        process.env.GOOGLE_CLOUD_PROJECT ||
        "unknown-project");
}
// Construit la base URL : param > env > valeur par défaut
function getFunctionsBaseUrl() {
    const fromParam = (FUNCTIONS_BASE_URL_PARAM.value() || "").trim();
    if (fromParam)
        return fromParam.replace(/\/$/, "");
    const region = CLOUD_TASKS_LOCATION.value() || "europe-west1";
    console.log("region in the getFunctionsBaseUrl function:", region);
    const projectId = getProjectId();
    console.log("projectId in the getFunctionsBaseUrl function:", projectId);
    return `https://${region}-${projectId}.cloudfunctions.net`;
}
// Objet de config résolu à l'usage (pas gelé car dépend de .value())
function getTasksConfig() {
    return {
        projectId: getProjectId(),
        location: CLOUD_TASKS_LOCATION.value() || "europe-west1",
        queueName: CLOUD_TASKS_QUEUE.value() || "call-scheduler-queue",
        callbackBaseUrl: getFunctionsBaseUrl(),
        functionName: "executeCallTask"
    };
}
// ------------------------------------------------------
// Client Cloud Tasks (lazy)
// ------------------------------------------------------
let tasksClient = null;
function getTasksClient() {
    if (!tasksClient) {
        tasksClient = new tasks_1.CloudTasksClient();
    }
    return tasksClient;
}
// ------------------------------------------------------
// API
// ------------------------------------------------------
/**
 * Programme une tâche Cloud Tasks pour exécuter un appel plus tard.
 * @param callSessionId ID de la session d'appel
 * @param delaySeconds Délai avant exécution (en secondes)
 * @returns taskId créé
 *
 * IMPORTANT :
 *   afin que TASKS_AUTH_SECRET.value() soit accessible à l'exécution.
 */
async function scheduleCallTask(callSessionId, delaySeconds) {
    try {
        const client = getTasksClient();
        const cfg = getTasksConfig();
        const queuePath = client.queuePath(cfg.projectId, cfg.location, cfg.queueName);
        // ID unique et stable
        const taskId = `call-${callSessionId}-${Date.now()}`;
        // URL complète de callback
        const callbackUrl = `${cfg.callbackBaseUrl}/${cfg.functionName}`;
        console.log(`📋 [CloudTasks] URL de callback: ${callbackUrl}`);
        // Horodatage d'exécution
        const scheduleTime = new Date();
        scheduleTime.setSeconds(scheduleTime.getSeconds() + delaySeconds);
        // Corps de requête
        const payload = {
            callSessionId,
            scheduledAt: new Date().toISOString(),
            taskId
        };
        const task = {
            name: `${queuePath}/tasks/${taskId}`,
            scheduleTime: {
                seconds: Math.floor(scheduleTime.getTime() / 1000)
            },
            httpRequest: {
                httpMethod: "POST",
                url: callbackUrl || 'https://europe-west1-sos-urgently-ac307.net/executeCallTask',
                headers: {
                    "Content-Type": "application/json",
                    // ⚠️ Utilise le secret paramétré (Firebase v2)
                    "X-Task-Auth": TASKS_AUTH_SECRET.value()
                },
                body: Buffer.from(JSON.stringify(payload))
            }
        };
        console.log("task created : ", task);
        console.log(`📋 [CloudTasks] Création tâche ${taskId} (queue=${cfg.queueName}, region=${cfg.location}) → ${delaySeconds}s`);
        const [response] = await client.createTask({ parent: queuePath, task });
        console.log(`✅ [CloudTasks] Tâche créée: ${response.name}`);
        return taskId;
    }
    catch (error) {
        await (0, logError_1.logError)("scheduleCallTask", error);
        throw new Error(`Erreur création tâche Cloud Tasks: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
exports.scheduleCallTask = scheduleCallTask;
/**
 * Annule une tâche Cloud Tasks si elle existe encore.
 */
async function cancelCallTask(taskId) {
    try {
        const client = getTasksClient();
        const cfg = getTasksConfig();
        const taskPath = client.taskPath(cfg.projectId, cfg.location, cfg.queueName, taskId);
        console.log(`🚫 [CloudTasks] Annulation tâche: ${taskId}`);
        await client.deleteTask({ name: taskPath });
        console.log(`✅ [CloudTasks] Tâche annulée: ${taskId}`);
    }
    catch (error) {
        // Ignorer si déjà exécutée/supprimée
        if (error instanceof Error &&
            (error.message.includes("NOT_FOUND") || error.message.includes("already completed"))) {
            console.log(`ℹ️ [CloudTasks] Tâche ${taskId} déjà exécutée ou inexistante`);
            return;
        }
        await (0, logError_1.logError)("cancelCallTask", error);
        throw new Error(`Erreur annulation tâche Cloud Tasks: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
exports.cancelCallTask = cancelCallTask;
/**
 * Liste les tâches en attente dans la queue.
 */
async function listPendingTasks(maxResults = 100) {
    try {
        const client = getTasksClient();
        const cfg = getTasksConfig();
        const queuePath = client.queuePath(cfg.projectId, cfg.location, cfg.queueName);
        console.log(`📋 [CloudTasks] Liste des tâches en attente (queue=${cfg.queueName})`);
        const [tasks] = await client.listTasks({
            parent: queuePath,
            pageSize: maxResults
        });
        const pending = tasks
            .filter((task) => task.scheduleTime && task.httpRequest?.body)
            .map((task) => {
            try {
                const payload = JSON.parse(task.httpRequest.body.toString());
                const scheduleTime = new Date(task.scheduleTime.seconds * 1000);
                return {
                    taskId: payload.taskId || "unknown",
                    callSessionId: payload.callSessionId || "unknown",
                    scheduleTime,
                    name: task.name || "unknown"
                };
            }
            catch (e) {
                console.warn("⚠️ [CloudTasks] Erreur parsing payload:", e);
                return null;
            }
        })
            .filter((item) => item !== null);
        console.log(`📊 [CloudTasks] ${pending.length} tâches en attente`);
        return pending;
    }
    catch (error) {
        await (0, logError_1.logError)("listPendingTasks", error);
        return [];
    }
}
exports.listPendingTasks = listPendingTasks;
/**
 * Purge toutes les tâches de la queue (⚠️ attention en prod).
 */
async function purgeQueue() {
    try {
        const client = getTasksClient();
        const cfg = getTasksConfig();
        const queuePath = client.queuePath(cfg.projectId, cfg.location, cfg.queueName);
        console.log(`🧹 [CloudTasks] Purge de la queue: ${cfg.queueName}`);
        await client.purgeQueue({ name: queuePath });
        console.log(`✅ [CloudTasks] Queue purgée: ${cfg.queueName}`);
        // Cloud Tasks ne renvoie pas le nombre d'items purgés
        return 1;
    }
    catch (error) {
        await (0, logError_1.logError)("purgeQueue", error);
        throw new Error(`Erreur purge queue: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
exports.purgeQueue = purgeQueue;
/**
 * Statistiques basiques sur la queue.
 */
async function getQueueStats() {
    try {
        const cfg = getTasksConfig();
        const pending = await listPendingTasks(1000);
        let oldestTaskAge;
        if (pending.length > 0) {
            const oldest = pending.sort((a, b) => a.scheduleTime.getTime() - b.scheduleTime.getTime())[0];
            oldestTaskAge = Math.round((Date.now() - oldest.scheduleTime.getTime()) / (1000 * 60));
        }
        return {
            pendingTasks: pending.length,
            queueName: cfg.queueName,
            location: cfg.location,
            oldestTaskAge
        };
    }
    catch (error) {
        await (0, logError_1.logError)("getQueueStats", error);
        const cfg = getTasksConfig();
        return {
            pendingTasks: 0,
            queueName: cfg.queueName,
            location: cfg.location
        };
    }
}
exports.getQueueStats = getQueueStats;
/**
 * Vérifie l'existence d'une tâche.
 */
async function taskExists(taskId) {
    try {
        const client = getTasksClient();
        const cfg = getTasksConfig();
        const taskPath = client.taskPath(cfg.projectId, cfg.location, cfg.queueName, taskId);
        await client.getTask({ name: taskPath });
        return true;
    }
    catch (error) {
        if (error instanceof Error && error.message.includes("NOT_FOUND"))
            return false;
        await (0, logError_1.logError)("taskExists", error);
        return false;
    }
}
exports.taskExists = taskExists;
/**
 * Crée une tâche de test vers /test-webhook (utilitaire).
 */
async function createTestTask(payload, delaySeconds = 5) {
    try {
        const client = getTasksClient();
        const cfg = getTasksConfig();
        const queuePath = client.queuePath(cfg.projectId, cfg.location, cfg.queueName);
        const taskId = `test-${Date.now()}`;
        const callbackUrl = `${cfg.callbackBaseUrl}/test-webhook`;
        const scheduleTime = new Date();
        scheduleTime.setSeconds(scheduleTime.getSeconds() + delaySeconds);
        const task = {
            name: `${queuePath}/tasks/${taskId}`,
            scheduleTime: {
                seconds: Math.floor(scheduleTime.getTime() / 1000)
            },
            httpRequest: {
                httpMethod: "POST",
                url: callbackUrl,
                headers: {
                    "Content-Type": "application/json",
                    "X-Task-Auth": TASKS_AUTH_SECRET.value()
                },
                body: Buffer.from(JSON.stringify({ ...payload, taskId }))
            }
        };
        const [response] = await client.createTask({ parent: queuePath, task });
        console.log(`✅ [CloudTasks] Tâche de test créée: ${response.name}`);
        return taskId;
    }
    catch (error) {
        await (0, logError_1.logError)("createTestTask", error);
        throw error;
    }
}
exports.createTestTask = createTestTask;
//# sourceMappingURL=tasks.js.map