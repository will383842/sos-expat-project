import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {
  PARTNER_ENGINE_URL_SECRET,
  PARTNER_ENGINE_API_KEY_SECRET,
  getPartnerEngineUrl,
  getPartnerEngineApiKey,
} from "../../lib/secrets";
import { partnerConfig } from "../../lib/functionConfigs";

/**
 * Firebase callable that proxies /sos-call/check requests to Partner Engine Laravel.
 *
 * Called by the public `/sos-call` Blade page (Sprint 3) when a client enters
 * their SOS-Call code or phone+email fallback.
 *
 * Input:
 *   - { code: string }  (primary)
 *   - OR { phone: string, email: string }  (fallback)
 *
 * Response (straight-through from Partner Engine):
 *   status: 'access_granted' | 'code_invalid' | 'phone_match_email_mismatch'
 *         | 'not_found' | 'quota_reached' | 'expired' | 'rate_limited'
 *         | 'agreement_inactive' | 'subscriber_suspended' | ...
 *   session_token?: string (32 hex chars, TTL 15min in Redis)
 *   partner_name?: string
 *   call_types_allowed?: 'both' | 'expat_only' | 'lawyer_only'
 *   calls_remaining?: number | null
 *
 * Security:
 *   - Public callable (no auth required — the client may not be logged in)
 *   - Rate-limited on the Partner Engine side (10/min per IP + 5/15min per identifier)
 *   - Request body validated client-side AND server-side
 */
export const checkSosCallCode = onCall(
  {
    ...partnerConfig,
    secrets: [PARTNER_ENGINE_URL_SECRET, PARTNER_ENGINE_API_KEY_SECRET],
    timeoutSeconds: 30,
  },
  async (request) => {
    const data = request.data as {
      code?: string;
      phone?: string;
      email?: string;
    };

    // Basic validation (stricter validation happens on Partner Engine)
    const hasCode = typeof data.code === "string" && data.code.trim().length > 0;
    const hasPhoneEmail =
      typeof data.phone === "string" &&
      data.phone.trim().length > 0 &&
      typeof data.email === "string" &&
      data.email.trim().length > 0;

    if (!hasCode && !hasPhoneEmail) {
      throw new HttpsError(
        "invalid-argument",
        "Provide either a code or both phone+email"
      );
    }

    // E.164 format sanity check if phone provided
    if (data.phone && !/^\+[1-9]\d{6,14}$/.test(data.phone.trim())) {
      throw new HttpsError("invalid-argument", "Invalid phone format (E.164 expected)");
    }

    const baseUrl = getPartnerEngineUrl();
    const apiKey = getPartnerEngineApiKey();

    if (!baseUrl || !apiKey) {
      logger.error("[checkSosCallCode] Missing Partner Engine config", {
        hasUrl: !!baseUrl,
        hasKey: !!apiKey,
      });
      throw new HttpsError(
        "unavailable",
        "Partner Engine configuration missing"
      );
    }

    try {
      const response = await fetch(`${baseUrl}/api/sos-call/check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          // Note: /sos-call/check is a PUBLIC endpoint (no X-Engine-Secret)
          // We include the caller IP so Partner Engine's rate limiter works correctly.
          "X-Forwarded-For": request.rawRequest.ip || "",
        },
        body: JSON.stringify({
          code: data.code?.trim(),
          phone: data.phone?.trim(),
          email: data.email?.trim().toLowerCase(),
        }),
        signal: AbortSignal.timeout(10_000),
      });

      const body = await response.json().catch(() => ({}));

      // Partner Engine returns 200 even for "not_found" etc. — only 429 for rate-limited
      if (response.status === 429) {
        return { status: "rate_limited" };
      }

      if (!response.ok) {
        logger.warn("[checkSosCallCode] Partner Engine returned non-200", {
          status: response.status,
          body,
        });
        throw new HttpsError("internal", "Eligibility check failed");
      }

      return body;
    } catch (err: unknown) {
      if (err instanceof HttpsError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      logger.error("[checkSosCallCode] Fetch error", { message });
      throw new HttpsError("unavailable", "Could not contact Partner Engine");
    }
  }
);
