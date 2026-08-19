import { request } from "./client";
import { clearSession, getSession, setSession } from "./session";
import type { DeviceOut, TokenOut, UserOut, WaiterOut } from "./types";

function applyToken(data: TokenOut): void {
  setSession({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    userId: data.user_id,
    fullName: data.full_name,
    role: data.role,
    permissions: data.permissions,
  });
}

export async function loginWithPassword(username: string, password: string): Promise<void> {
  const data = await request<TokenOut>("/auth/login", {
    method: "POST",
    body: { username, password },
    public: true,
  });
  applyToken(data);
}

export async function loginWithPin(userId: string, pin: string, deviceId: string): Promise<void> {
  const data = await request<TokenOut>("/auth/login/pin", {
    method: "POST",
    body: { user_id: userId, pin, device_id: deviceId },
    public: true,
  });
  applyToken(data);
}

export async function listWaitersForPinScreen(): Promise<WaiterOut[]> {
  return request<WaiterOut[]>("/auth/waiters", { public: true });
}

export async function listSupervisors(): Promise<WaiterOut[]> {
  return request<WaiterOut[]>("/auth/supervisors", { public: true });
}

export async function logout(): Promise<void> {
  const session = getSession();
  if (session) {
    try {
      await request<void>("/auth/logout", {
        method: "POST",
        body: { refresh_token: session.refreshToken },
      });
    } catch {
      // el token puede ya estar vencido; de todos modos se limpia localmente.
    }
  }
  clearSession();
}

export async function me(): Promise<UserOut> {
  return request<UserOut>("/auth/me");
}

// --- Administración (requiere permiso user.manage) ---
export async function listUsers(role?: string): Promise<UserOut[]> {
  return request<UserOut[]>("/users", { query: { role } });
}

export async function createUser(input: {
  username: string;
  full_name: string;
  role: string;
  password?: string;
  pin?: string;
}): Promise<UserOut> {
  return request<UserOut>("/users", { method: "POST", body: input });
}

export async function updateUser(
  userId: string,
  input: { username?: string; full_name?: string; role?: string; password?: string },
): Promise<UserOut> {
  return request<UserOut>(`/users/${userId}`, { method: "PATCH", body: input });
}

export async function setUserPin(userId: string, pin: string): Promise<void> {
  await request<void>(`/users/${userId}/pin`, { method: "PUT", body: { pin } });
}

export async function deactivateUser(userId: string): Promise<void> {
  await request<void>(`/users/${userId}`, { method: "DELETE" });
}

export async function listDevices(): Promise<DeviceOut[]> {
  return request<DeviceOut[]>("/devices");
}

export async function createDevicePairing(label: string): Promise<DeviceOut> {
  return request<DeviceOut>("/devices", { method: "POST", body: { label } });
}

export async function revokeDevice(deviceId: string): Promise<void> {
  await request<void>(`/devices/${deviceId}`, { method: "DELETE" });
}

export async function redeemDevicePairing(pairingCode: string): Promise<string> {
  const out = await request<{ device_id: string }>("/devices/pair", {
    method: "POST",
    body: { pairing_code: pairingCode },
    public: true,
  });
  return out.device_id;
}
