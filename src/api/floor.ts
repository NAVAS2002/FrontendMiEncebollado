import { request } from "./client";
import type { TableOut, ZoneOut } from "./types";

export async function listTables(): Promise<TableOut[]> {
  return request<TableOut[]>("/floor/tables");
}

export async function listZones(): Promise<ZoneOut[]> {
  return request<ZoneOut[]>("/floor/zones");
}

export async function getTable(tableId: string): Promise<TableOut> {
  return request<TableOut>(`/floor/tables/${tableId}`);
}

export async function releaseTable(tableId: string): Promise<TableOut> {
  return request<TableOut>(`/floor/tables/${tableId}/release`, { method: "POST" });
}

export async function markTableToBill(tableId: string): Promise<TableOut> {
  return request<TableOut>(`/floor/tables/${tableId}/to-bill`, { method: "POST" });
}

// --- Administración de sala (secciones y mesas) ---
export async function createZone(name: string, sortOrder = 0): Promise<ZoneOut> {
  return request<ZoneOut>("/floor/zones", { method: "POST", body: { name, sort_order: sortOrder } });
}

export async function renameZone(zoneId: string, name: string, sortOrder: number): Promise<ZoneOut> {
  return request<ZoneOut>(`/floor/zones/${zoneId}`, {
    method: "PATCH",
    body: { name, sort_order: sortOrder },
  });
}

export async function deleteZone(zoneId: string): Promise<void> {
  await request<void>(`/floor/zones/${zoneId}`, { method: "DELETE" });
}

export async function createTable(input: {
  code: string;
  seats: number;
  zone_id?: string | null;
}): Promise<TableOut> {
  return request<TableOut>("/floor/tables", { method: "POST", body: input });
}

export async function updateTable(
  tableId: string,
  input: { code?: string; seats?: number; zone_id?: string },
): Promise<TableOut> {
  return request<TableOut>(`/floor/tables/${tableId}`, { method: "PATCH", body: input });
}

export async function deleteTable(tableId: string): Promise<void> {
  await request<void>(`/floor/tables/${tableId}`, { method: "DELETE" });
}
