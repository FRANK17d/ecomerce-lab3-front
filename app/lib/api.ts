export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ApiPayload<T> = {
  success: boolean;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  error?: string;
  details?: Record<string, string[] | undefined>;
};

function formatApiError(payload: ApiPayload<unknown>, fallback: string) {
  if (payload.details) {
    const fields = Object.entries(payload.details)
      .flatMap(([field, messages]) => (messages || []).map((message) => `${field}: ${message}`))
      .join(". ");
    if (fields) return fields;
  }
  return payload.error || fallback;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const payload = (await response.json().catch(() => ({}))) as ApiPayload<T>;

  if (!response.ok) {
    throw new Error(formatApiError(payload, "API request failed"));
  }

  return payload;
}
