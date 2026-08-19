const KEY = "restoflow.device_id";

/** El celular queda vinculado una vez que canjea el código de emparejamiento. */
export function getDeviceId(): string | null {
  return localStorage.getItem(KEY);
}

export function setDeviceId(deviceId: string): void {
  localStorage.setItem(KEY, deviceId);
}

export function clearDeviceId(): void {
  localStorage.removeItem(KEY);
}
