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
exports.enqueueMessageEvent = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.enqueueMessageEvent = (0, https_1.onCall)({ region: "europe-west1" }, async (req) => {
    try {
        console.log("enqueueMessageEvent called", req);
        const authUid = req.auth?.uid || null;
        const data = req.data || {};
        const { eventId, locale = "fr-FR", to = {}, context = {} } = data;
        if (!eventId || typeof eventId !== "string") {
            throw new https_1.HttpsError("invalid-argument", "eventId manquant ou invalide");
        }
        const doc = {
            eventId,
            locale,
            to: {
                email: to.email || null,
                phone: to.phone || null,
                pushToken: to.pushToken || null,
                uid: to.uid || null
            },
            context,
            requestedBy: authUid,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await db.collection("message_events").add(doc);
        console.log("enqueueMessageEvent done - Event added to queue");
        return { ok: true };
        console.log("enqueueMessageEvent done");
    }
    catch (error) {
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError("internal", "Failed to enqueue message event");
    }
});
//# sourceMappingURL=enqueueMessageEvent.js.map