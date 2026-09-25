import { clearSession, getSession, setSession } from "./session";
import type { ApiErrorBody, TokenOut } from "./types";

// Tres formas de decirle a la app dónde está el backend, de más a menos
// automática:
//  1. VITE_API_URL="/api/v1" (relativa): usa el MISMO origen desde el que se
//     abrió la página. Es la del despliegue con Docker, donde nginx sirve la
//     app y reenvía /api y /ws al backend: cambiar de red o de IP no exige
//     tocar ni recompilar nada.
//  2. VITE_API_URL="https://api.midominio.com/api/v1" (absoluta): backend en
//     otro host (Render, etc.).
//  3. Sin VITE_API_URL: mismo host con el que se abrió la app pero puerto
//     3000, para desarrollo (el teléfono que entra por http://192.168.x.x:5173
//     llama a http://192.168.x.x:3000 y no a su propio "localhost").
function resolveApiBase(configured: string | undefined): string {
  if (!configured) return `http://${window.location.hostname}:3000/api/v1`;
  if (configured.startsWith("/")) return `${window.location.origin}${configured}`;
  return configured;
}

export const API_BASE = resolveApiBase(import.meta.env.VITE_API_URL as string | undefined);
// El WebSocket cuelga del mismo origen que la API: http→ws y https→wss.
export const WS_BASE =
  (import.meta.env.VITE_WS_URL as string) || API_BASE.replace(/^http/, "ws").replace(/\/api\/v1$/, "/ws");

export class ApiError extends Error {
  code: string;
  status: number;
  details: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  idempotencyKey?: string;
  public?: boolean;
  query?: Record<string, string | number | boolean | undefined>;
}

let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const session = getSession();
  if (!session) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as TokenOut;
    setSession({
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + data.expires_in * 1000,
      userId: data.user_id,
      fullName: data.full_name,
      role: data.role,
      permissions: data.permissions,
    });
    return true;
  } catch {
    return false;
  }
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${API_BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function raw<T>(path: string, opts: RequestOptions, accessToken: string | null): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

  const res = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const body = data as ApiErrorBody | undefined;
    throw new ApiError(
      res.status,
      body?.error?.code ?? "UNKNOWN",
      body?.error?.message ?? `Error ${res.status}`,
      body?.error?.details ?? {},
    );
  }
  return data as T;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const session = getSession();
  const token = opts.public ? null : (session?.accessToken ?? null);

  try {
    return await raw<T>(path, opts, token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && !opts.public && session) {
      refreshPromise ??= doRefresh().finally(() => {
        refreshPromise = null;
      });
      const ok = await refreshPromise;
      if (ok) {
        const fresh = getSession();
        return await raw<T>(path, opts, fresh?.accessToken ?? null);
      }
      clearSession();
    }
    throw err;
  }
}
