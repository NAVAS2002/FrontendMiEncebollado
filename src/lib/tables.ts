import type { TableOut, ZoneOut } from "../api/types";

// "M2" antes que "M10": comparar el código como texto los ordena al revés
// de lo que espera cualquiera que lea números de mesa.
export function compareTableCode(a: string, b: string): number {
  const numA = parseInt(a.replace(/\D/g, ""), 10);
  const numB = parseInt(b.replace(/\D/g, ""), 10);
  if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) return numA - numB;
  return a.localeCompare(b);
}

export interface TableSection {
  zone: ZoneOut | null;
  tables: TableOut[];
}

// Agrupa por sección (en el orden que ya viene el backend, por sort_order) y
// ordena las mesas de cada sección numéricamente. Las mesas sin sección van
// al final, en un grupo aparte.
export function groupTablesByZone(tables: TableOut[], zones: ZoneOut[]): TableSection[] {
  const byZone = new Map<string, TableOut[]>();
  const unassigned: TableOut[] = [];
  for (const t of tables) {
    if (t.zone_id) {
      const arr = byZone.get(t.zone_id) ?? [];
      arr.push(t);
      byZone.set(t.zone_id, arr);
    } else {
      unassigned.push(t);
    }
  }
  const sections: TableSection[] = zones.map((z) => ({
    zone: z,
    tables: (byZone.get(z.id) ?? []).sort((a, b) => compareTableCode(a.code, b.code)),
  }));
  if (unassigned.length > 0) {
    sections.push({ zone: null, tables: unassigned.sort((a, b) => compareTableCode(a.code, b.code)) });
  }
  return sections;
}

export interface FloorView {
  sections: TableSection[];
  counts: { free: number; occupied: number; toBill: number };
}

// Lo que el mesero y caja realmente ven de la sala. Una mesa o sección
// apagada por el administrador no se muestra, salvo que la mesa tenga un
// pedido abierto: eso nunca se esconde, para no perderle el rastro a una
// cuenta activa. Una sección sin mesas visibles tampoco se dibuja.
export function buildFloorView(tables: TableOut[], zones: ZoneOut[]): FloorView {
  const enabledZoneIds = new Set(zones.filter((z) => z.is_enabled).map((z) => z.id));
  const visibleTables = tables.filter(
    (t) =>
      t.current_order_id !== null ||
      (t.is_enabled && (t.zone_id === null || enabledZoneIds.has(t.zone_id))),
  );
  const sections = groupTablesByZone(visibleTables, zones).filter((s) => s.tables.length > 0);
  return {
    sections,
    counts: {
      free: visibleTables.filter((t) => t.status === "LIBRE").length,
      occupied: visibleTables.filter((t) => t.status === "OCUPADA").length,
      toBill: visibleTables.filter((t) => t.status === "POR_COBRAR").length,
    },
  };
}

// La sección no tiene un campo de ícono en el backend: se infiere por
// palabras del nombre. Es solo decoración del encabezado, no una regla.
export function zoneIcon(name: string | undefined): string {
  const n = (name ?? "").toLowerCase();
  if (/terraza|jard[ií]n|patio|afuera|exterior/.test(n)) return "yard";
  if (/barra|bar\b|lounge/.test(n)) return "local_bar";
  return "restaurant";
}
