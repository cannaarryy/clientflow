const BASE = import.meta.env.VITE_API_URL ?? "";

async function getCsrfHeader(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${BASE}/api/csrf-header`);
    const json = await res.json();
    if (json.header) {
      return { [json.header]: document.cookie.split("; ").find((c) => c.startsWith("csrf_token="))?.split("=")[1] ?? "" };
    }
  } catch {}
  return {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const csrfHeaders = await getCsrfHeader();
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...csrfHeaders, ...(options.headers ?? {}) },
    ...options,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    const err = new Error(json?.message ?? `Request failed (${res.status})`) as Error & { status?: number; errors?: unknown };
    err.status = res.status;
    err.errors = json?.errors;
    throw err;
  }
  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export type { User, Client, Project, Task, Note, Activity, DashboardData } from "../types/index.js";