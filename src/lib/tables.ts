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
