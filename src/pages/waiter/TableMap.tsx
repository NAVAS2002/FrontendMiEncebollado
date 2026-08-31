import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listTables, listZones } from "../../api/floor";
import type { TableOut, ZoneOut } from "../../api/types";
import { FloorPlanCanvas } from "../../components/FloorPlanCanvas";
import { Icon } from "../../components/Icon";
import { Loading } from "../../components/Loading";
import { WaiterShell } from "../../components/WaiterShell";
import { groupTablesByZone } from "../../lib/tables";
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

  // Una mesa o sección apagada no se muestra, salvo que tenga un pedido
  // abierto: eso nunca se esconde, para no perderle el rastro.
  const enabledZoneIds = new Set(zones.filter((z) => z.is_enabled).map((z) => z.id));
  const visibleTables = (tables ?? []).filter(
    (t) =>
      t.current_order_id !== null ||
      (t.is_enabled && (t.zone_id === null || enabledZoneIds.has(t.zone_id))),
  );
  const visibleZones = zones.filter(
    (z) => z.is_enabled || visibleTables.some((t) => t.zone_id === z.id),
  );
  const sections = groupTablesByZone(visibleTables, visibleZones);

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
              <FloorPlanCanvas
                tables={section.tables}
                onTableClick={(t) => navigate(`/mesero/mesa/${t.id}`)}
              />
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
