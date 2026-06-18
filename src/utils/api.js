/**
 * SEB-Ledger API client
 * -----------------------------------------------------------------------
 * Thin wrapper around the running seb-ledger-core Express/Supabase
 * backend. Every dashboard component imports from here rather than
 * calling fetch() directly, so the base URL and error shape stay
 * consistent across the app.
 *
 * This matches the ACTUAL backend contract exposed by seb-ledger-core's
 * server.js — not a hypothetical richer API. The real backend exposes:
 *
 *   GET  /health
 *   GET  /api/v1/merchants?search=&region=&page=&page_size=
 *   POST /api/v1/merchants
 *   POST /api/v1/webhooks/mobile-money
 *   GET  /api/v1/analytics/cognitive-score/:merchant_id
 *   GET  /api/v1/governance/dashboard
 *
 * Configure the backend origin with VITE_API_BASE_URL in a .env file.
 * Falls back to a relative "/api/v1" path, which works out of the box
 * with the Vite dev proxy defined in vite.config.js.
 * -----------------------------------------------------------------------
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export class ApiError extends Error {
  constructor(code, status, message, payload) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Core request helper. Throws an ApiError with a normalized shape on
 * any non-2xx response (or network failure) so calling code can branch
 * on err.status / err.code.
 */
async function request(path, { method = "GET", body, headers, signal } = {}) {
  const finalHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (networkErr) {
    if (networkErr.name === "AbortError") throw networkErr;
    throw new ApiError(
      "NETWORK_ERROR",
      0,
      "Could not reach the SEB-Ledger backend core. Confirm the Express/Supabase server is running and reachable."
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => "");

  if (!response.ok) {
    const message =
      (payload && payload.error) ||
      (typeof payload === "string" && payload) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(payload?.code || "REQUEST_FAILED", response.status, message, payload);
  }

  return payload;
}

/* ------------------------------------------------------------------ */
/* Health                                                              */
/* ------------------------------------------------------------------ */

/** GET /health (note: NOT under /api/v1 — this hits the bare backend root) */
export function fetchHealth(signal) {
  const root = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return fetch(`${root}/health`, { signal }).then((r) => r.json());
}

/* ------------------------------------------------------------------ */
/* Merchant ledger                                                    */
/* ------------------------------------------------------------------ */

/**
 * GET /api/v1/merchants?search=&region=&page=&page_size=
 * Response shape: { success, count, total, page, page_size, total_pages, merchants: [...] }
 * Each merchant row matches the `merchants` table: id, full_name,
 * nida_number, phone_number, business_type, region, district, is_active,
 * created_at, updated_at.
 */
export function fetchMerchants(params = {}, signal) {
  const { search, region, page, pageSize } = params;
  const query = new URLSearchParams(
    Object.entries({ search, region, page, page_size: pageSize }).reduce((acc, [k, v]) => {
      if (v !== undefined && v !== null && v !== "") acc[k] = v;
      return acc;
    }, {})
  ).toString();
  return request(`/merchants${query ? `?${query}` : ""}`, { signal });
}

/**
 * POST /api/v1/merchants
 * body: { full_name, phone_number, business_type, region, district?, nida_number? }
 * Response shape: { success, message, merchant }
 */
export function registerMerchant(merchantPayload) {
  return request("/merchants", { method: "POST", body: merchantPayload });
}

/* ------------------------------------------------------------------ */
/* Webhooks (mobile money)                                            */
/* ------------------------------------------------------------------ */

/**
 * POST /api/v1/webhooks/mobile-money
 * body: { phone_number, reference_id, gross_amount, currency?, channel? }
 * Response shape: { success, message, ledger_entry: {...} }
 *
 * This is a REAL webhook receiver, not a simulator endpoint — there is
 * no /api/webhooks/simulate route on the backend. The WebhookSimulator
 * component calls this directly to exercise the live ingestion path
 * with synthetic events.
 */
export function sendMobileMoneyWebhook(eventPayload) {
  return request("/webhooks/mobile-money", { method: "POST", body: eventPayload });
}

/* ------------------------------------------------------------------ */
/* Cognitive credit score                                             */
/* ------------------------------------------------------------------ */

/**
 * GET /api/v1/analytics/cognitive-score/:merchant_id
 * Response shape: { success, message, report: { merchant, score_card, engine_details } }
 */
export function fetchCognitiveScore(merchantId, signal) {
  return request(`/analytics/cognitive-score/${encodeURIComponent(merchantId)}`, { signal });
}

/* ------------------------------------------------------------------ */
/* Governance dashboard (aggregate ledger-wide statistics)             */
/* ------------------------------------------------------------------ */

/**
 * GET /api/v1/governance/dashboard
 * Response shape: { success, generated_at, dashboard: { ledger_summary,
 *   merchant_stats, credit_intelligence, channel_analytics, system_info } }
 *
 * If the backend has ADMIN_API_KEY configured, this requires the
 * VITE_ADMIN_API_KEY env var to be set so it can be forwarded as the
 * X-Admin-Key header. Without it, calls to a key-protected backend will
 * fail with a 401 — components handle that gracefully and fall back to
 * demonstration data.
 */
export function fetchGovernanceDashboard(signal) {
  const adminKey = import.meta.env.VITE_ADMIN_API_KEY;
  return request("/governance/dashboard", {
    signal,
    headers: adminKey ? { "X-Admin-Key": adminKey } : undefined,
  });
}

/* ------------------------------------------------------------------ */
/* Polling helper                                                      */
/* ------------------------------------------------------------------ */

/**
 * Lightweight polling helper for "real-time" updates, since the backend
 * does not expose a websocket/Supabase Realtime channel to the browser.
 * Components call this on an interval and clean up via the returned
 * unsubscribe function.
 */
export function pollEvery(fn, intervalMs = 8000) {
  const id = setInterval(fn, intervalMs);
  return () => clearInterval(id);
}

export default {
  fetchHealth,
  fetchMerchants,
  registerMerchant,
  sendMobileMoneyWebhook,
  fetchCognitiveScore,
  fetchGovernanceDashboard,
  pollEvery,
  ApiError,
};
