/**
 * =============================================================================
 * MULTI DASHBOARD - Module Exports
 * =============================================================================
 *
 * Exports all Cloud Functions for the multi-provider dashboard.
 */

export { validateDashboardPassword } from "./validateDashboardPassword";
export { getMultiDashboardData } from "./getMultiDashboardData";
export { triggerAiFromBookingRequest } from "./onBookingCreatedGenerateAi";
export { generateMultiDashboardOutilToken } from "./generateMultiDashboardOutilToken";
export { getProviderConversations, sendMultiDashboardMessage } from "./getProviderConversations";
// generateMultiDashboardAiResponse: NOT exported on purpose. The callable
// in `./generateAiResponseCallable.ts` was never deployed in production
// (audit grep 2026-05-03 confirmed 0 frontend caller across the repo) and
// was missing auth + quota + moderation. Keeping the source file as a
// reference for the eventual P0-quality reimplementation, but deliberately
// not surfacing it as a callable so it cannot be deployed by accident.
// See OUT-MUL-012 in RAPPORT-AUDIT-OUTIL-IA-MULTI-DASHBOARD-2026-05-03.md.
export { migrateOldPendingBookings } from "./migrateOldBookings";
export { createBookingFromRequest } from "./createBookingFromRequest";
