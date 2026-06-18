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
    throw new ApiError("NETWORK_ERROR", 0, "Could not reach the SEB-Ledger backend.");
  }
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => "");
  if (!response.ok) {
    const message = (payload && payload.error) || `Request failed with status ${response.status}`;
    throw new ApiError(payload?.code || "REQUEST_FAILED", response.status, message, payload);
  }
  return payload;
}

export function fetchHealth(signal) {
  const root = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return fetch(`${root}/health`, { signal }).then((r) => r.json());
}

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

export function registerMerchant(merchantPayload) {
  return request("/merchants", { method: "POST", body: merchantPayload });
}

export function sendMobileMoneyWebhook(eventPayload) {
  return request("/webhooks/mobile-money", { method: "POST", body: eventPayload });
}

export function fetchCognitiveScore(merchantId, signal) {
  return request(`/analytics/cognitive-score/${encodeURIComponent(merchantId)}`, { signal });
}

export function fetchGovernanceDashboard(signal) {
  const adminKey = import.meta.env.VITE_ADMIN_API_KEY;
  return request("/governance/dashboard", {
    signal,
    headers: adminKey ? { "X-Admin-Key": adminKey } : undefined,
  });
}

export function pollEvery(fn, intervalMs = 8000) {
  const id = setInterval(fn, intervalMs);
  return () => clearInterval(id);
}

export default {
  fetchHealth, fetchMerchants, registerMerchant,
  sendMobileMoneyWebhook, fetchCognitiveScore,
  fetchGovernanceDashboard, pollEvery, ApiError,
};
