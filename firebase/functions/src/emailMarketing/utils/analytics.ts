import * as admin from "firebase-admin";

interface GA4EventParams {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Log an event to GA4 and Firestore
 */
export async function logGA4Event(
  eventName: string,
  params: GA4EventParams = {}
): Promise<void> {
  try {
    // Store in Firestore for backup and analysis
    await admin.firestore().collection("analytics_events").add({
      eventName,
      params: cleanParams(params),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`📊 GA4 Event logged: ${eventName}`, params);
  } catch (error: any) {
    console.error(`❌ Error logging GA4 event:`, error.message);
    // Don't throw - analytics failures shouldn't break the main flow
  }
}

/**
 * Log a user-specific event
 */
export async function logUserEvent(
  userId: string,
  eventName: string,
  params: GA4EventParams = {}
): Promise<void> {
  const enrichedParams = {
    ...params,
    user_id: userId,
    timestamp: Date.now(),
  };

  await logGA4Event(eventName, enrichedParams);
}

/**
 * Log an email-related event
 */
export async function logEmailEvent(
  eventType: "sent" | "delivered" | "opened" | "clicked" | "bounced" | "unsubscribed" | "complained",
  userId: string,
  templateName: string,
  additionalParams: GA4EventParams = {}
): Promise<void> {
  await logGA4Event(`email_${eventType}`, {
    user_id: userId,
    template_name: templateName,
    ...additionalParams,
  });
}

/**
 * Log a Trustpilot-related event
 */
export async function logTrustpilotEvent(
  eventType: "invite_sent" | "clicked" | "review_submitted",
  userId: string,
  ratingStars?: number
): Promise<void> {
  await logGA4Event(`trustpilot_${eventType}`, {
    user_id: userId,
    ...(ratingStars && { rating_stars: ratingStars }),
  });
}

/**
 * Log an autoresponder-related event
 */
export async function logAutoresponderEvent(
  eventType: "triggered" | "stopped",
  autoresponderId: string,
  userId: string,
  stopReason?: string
): Promise<void> {
  await logGA4Event(`autoresponder_${eventType}`, {
    autoresponder_id: autoresponderId,
    user_id: userId,
    ...(stopReason && { stop_reason: stopReason }),
  });
}

/**
 * Clean parameters by removing undefined values
 */
function cleanParams(params: GA4EventParams): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

