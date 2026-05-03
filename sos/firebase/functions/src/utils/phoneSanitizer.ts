/**
 * PII sanitizer for Cloud Logging.
 *
 * Cloud Logging is readable by any IAM principal with `roles/logging.viewer`.
 * Phone numbers, emails, auth tokens, webhook signatures must NEVER be logged
 * in clear (RGPD Art.32 + general security hygiene).
 *
 * Use `maskPhone()` for individual phone strings, `sanitizePayload()` for
 * arbitrary objects (Twilio/PayPal/Stripe webhook bodies, request headers, etc.).
 */

/** Mask a phone number, keeping the first 3 and last 3 characters. */
export function maskPhone(phone: unknown): string {
  if (typeof phone !== "string" || phone.length === 0) return "<empty>";
  const trimmed = phone.trim();
  if (trimmed.length <= 6) return "****";
  return `${trimmed.slice(0, 3)}***${trimmed.slice(-3)}`;
}

/** Mask an email, keeping the first 3 chars of local-part + domain. */
export function maskEmail(email: unknown): string {
  if (typeof email !== "string" || !email.includes("@")) return "<empty>";
  const [local, domain] = email.split("@");
  const head = local.length <= 3 ? local : local.slice(0, 3);
  return `${head}***@${domain}`;
}

const PHONE_KEYS = new Set([
  "phone", "phonenumber", "telephone", "telphone",
  "whatsapp", "whatsappnumber",
  "clientphone", "providerphone",
  "to", "from", "caller", "called",
  "tonumber", "fromnumber",
  // PayPal create-order body field names used in PayPalManager
  "callerphone",
]);

const EMAIL_KEYS = new Set([
  "email", "useremail", "clientemail", "provideremail",
  "paypalemail", "stripeemail",
]);

const SECRET_HEADER_KEYS = new Set([
  "authorization", "x-task-auth", "x-api-key", "x-engine-secret",
  "cookie", "set-cookie",
  "stripe-signature",
  "paypal-cert-url", "paypal-transmission-sig", "paypal-transmission-id",
  "x-twilio-signature",
]);

/**
 * Recursively sanitize an object before logging.
 * - Phone-like fields → masked via `maskPhone()`
 * - Email-like fields → masked via `maskEmail()`
 * - Auth/signature headers → `<redacted>`
 * - Depth-limited to avoid pathological recursion.
 */
export function sanitizePayload(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[deep]";
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => sanitizePayload(v, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const lk = k.toLowerCase();
    if (SECRET_HEADER_KEYS.has(lk)) {
      out[k] = "<redacted>";
    } else if (PHONE_KEYS.has(lk) && typeof v === "string") {
      out[k] = maskPhone(v);
    } else if (EMAIL_KEYS.has(lk) && typeof v === "string") {
      out[k] = maskEmail(v);
    } else if (typeof v === "object" && v !== null) {
      out[k] = sanitizePayload(v, depth + 1);
    } else {
      out[k] = v;
    }
  }
  return out;
}
