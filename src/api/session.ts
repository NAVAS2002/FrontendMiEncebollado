import type { Role } from "./types";

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
  userId: string;
  fullName: string;
  role: Role;
  permissions: string[];
}

const KEY = "restoflow.session";

let current: Session | null = load();
const listeners = new Set<(s: Session | null) => void>();

function load(): Session | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  return current;
}

export function setSession(session: Session): void {
  current = session;
  localStorage.setItem(KEY, JSON.stringify(session));
  listeners.forEach((fn) => fn(current));
}

export function clearSession(): void {
  current = null;
  localStorage.removeItem(KEY);
  listeners.forEach((fn) => fn(current));
}

export function onSessionChange(fn: (s: Session | null) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function hasPermission(permission: string): boolean {
  const s = current;
  if (!s) return false;
  if (s.permissions.includes("*")) return true;
  if (s.permissions.includes(permission)) return true;
  const [resource] = permission.split(".");
  return s.permissions.includes(`${resource}.*`);
}
