/**
 * Partner Callables - Export Index
 */

// Admin callables
export { createPartner } from "./createPartner";

// Partner self-access callables
export { getPartnerDashboard } from "./getPartnerDashboard";
export { updatePartnerProfile } from "./updatePartnerProfile";
export { getPartnerCommissions } from "./getPartnerCommissions";
export { getPartnerClicks } from "./getPartnerClicks";
export { getPartnerWidgets } from "./getPartnerWidgets";
export { getPartnerNotifications } from "./getPartnerNotifications";
export { markPartnerNotificationRead } from "./markPartnerNotificationRead";
export { partnerRequestWithdrawal } from "./partnerRequestWithdrawal";

// Public callables (no auth required)
export { trackPartnerClick } from "./trackPartnerClick";
export { submitPartnerApplication } from "./submitPartnerApplication";
export { checkSosCallCode } from "./checkSosCallCode";
export { triggerSosCallFromWeb } from "./triggerSosCallFromWeb";
// P1-1 FIX 2026-04-25: removed releaseProviderPayments (was dead code).
// Business model is "immediate-credit + 30-day reserve, SOS-Expat absorbs partner-default risk",
// so the invoice-gated release flow is intentionally not used.
