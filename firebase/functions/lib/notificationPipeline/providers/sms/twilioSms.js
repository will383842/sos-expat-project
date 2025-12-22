"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSms = void 0;
const twilio_1 = require("../../../lib/twilio");
async function sendSms(to, text) {
    const client = (0, twilio_1.getTwilioClient)();
    const from = (0, twilio_1.getTwilioPhoneNumber)();
    const res = await client.messages.create({ to, from, body: text });
    return res.sid; // messageId
}
exports.sendSms = sendSms;
//# sourceMappingURL=twilioSms.js.map