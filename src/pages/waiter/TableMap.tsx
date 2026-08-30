import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listTables, listZones } from "../../api/floor";
import type { TableOut, ZoneOut } from "../../api/types";
import { Icon } from "../../components/Icon";
import { Loading } from "../../components/Loading";
import { TableTile } from "../../components/TableTile";
import { WaiterShell } from "../../components/WaiterShell";
import { groupTablesByZone } from "../../lib/tables";
import { isWeekendNow } from "../../lib/time";
import { useRealtime } from "../../state/RealtimeContext";

export default function TableMap() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableOut[] | null>(null);
  const [zones, setZones] = useState<ZoneOut[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([listTables(), listZones()])
      .then(([t, z]) => {
        setTables(t);
        setZones(z);
      })
      .catch(() => setError("No se pudieron cargar las mesas."));
  }, []);

  useEffect(load, [load]);
  useRealtime(
    (msg) => {
      if (msg.event.startsWith("table.")) load();
    },
    [load],
  );

  const showWeekendTables = isWeekendNow();
  const visibleTables =
    tables?.filter((t) => !t.weekend_only || showWeekendTables) ?? [];
  const sections = groupTablesByZone(visibleTables, zones);

  return (
    <WaiterShell title="Mesas">
      {!tables && !error && <Loading label="Cargando mesas…" />}
      {error && <p className="text-error text-center py-8 font-body-md">{error}</p>}

      {tables && (
        <div className="p-margin-mobile flex flex-col gap-stack-lg">
          {sections.map((section) => (
            <section key={section.zone?.id ?? "sin-seccion"}>
              <h2 className="font-label-caps text-label-caps text-on-surface-variant mb-stack-sm">
                {section.zone?.name ?? "Sin sección"}
              </h2>
              <div className="flex flex-wrap gap-gutter">
                {section.tables.map((t) => (
                  <TableTile key={t.id} table={t} onClick={() => navigate(`/mesero/mesa/${t.id}`)} />
                ))}
              </div>
            </section>
          ))}
          {sections.length === 0 && (
            <p className="text-center text-on-surface-variant py-8 font-body-md">No hay mesas.</p>
          )}
        </div>
      )}

      <button
        onClick={() => navigate("/mesero/llevar")}
        className="fixed bottom-[88px] right-margin-mobile h-14 px-6 bg-primary text-on-primary rounded-full shadow-lg hover:shadow-xl flex items-center gap-2 active:scale-95 transition-all duration-200 z-40"
      >
        <Icon name="add_shopping_cart" filled />
        <span className="font-headline-md text-headline-md">Llevar</span>
      </button>
    </WaiterShell>
  );
}
