import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listTables, listZones } from "../../api/floor";
import type { TableOut, ZoneOut } from "../../api/types";
import { Icon } from "../../components/Icon";
import { Loading } from "../../components/Loading";
import { TableStatusBadge } from "../../components/StatusBadge";
import { WaiterShell } from "../../components/WaiterShell";
import { useRealtime } from "../../state/RealtimeContext";

export default function TableMap() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableOut[] | null>(null);
  const [zones, setZones] = useState<ZoneOut[]>([]);
  const [activeZone, setActiveZone] = useState<string | "all">("all");
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

  const visible = tables?.filter((t) => activeZone === "all" || t.zone_id === activeZone) ?? [];

  return (
    <WaiterShell title="Mesas">
      {zones.length > 1 && (
        <div className="w-full bg-surface border-b border-outline-variant px-margin-mobile flex overflow-x-auto gap-stack-sm py-2 sticky top-[44px] z-30">
          <button
            onClick={() => setActiveZone("all")}
            className={`h-touch-target-min px-4 rounded-full whitespace-nowrap font-headline-md text-headline-md transition-all ${
              activeZone === "all"
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-low text-on-surface-variant"
            }`}
          >
            Todas
          </button>
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => setActiveZone(z.id)}
              className={`h-touch-target-min px-4 rounded-full whitespace-nowrap font-headline-md text-headline-md transition-all ${
                activeZone === z.id
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-container-low text-on-surface-variant"
              }`}
            >
              {z.name}
            </button>
          ))}
        </div>
      )}

      {!tables && !error && <Loading label="Cargando mesas…" />}
      {error && <p className="text-error text-center py-8 font-body-md">{error}</p>}

      {tables && (
        <div className="p-margin-mobile grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-gutter">
          {visible.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(`/mesero/mesa/${t.id}`)}
              className="bg-surface-container-lowest border border-surface-variant rounded-lg p-stack-sm flex flex-col items-center justify-between aspect-square active:shadow-inner transition-all relative overflow-hidden"
            >
              <div className="w-full flex justify-between items-start mb-2">
                <span className="font-display-table-num text-display-table-num text-on-surface">
                  {t.code}
                </span>
                <span className="font-label-caps text-label-caps text-on-surface-variant flex items-center">
                  <Icon name="group" className="text-[16px] mr-1" /> {t.seats}
                </span>
              </div>
              <div className="font-body-md text-body-md text-on-surface-variant mb-2 opacity-0">--</div>
              <TableStatusBadge status={t.status} />
            </button>
          ))}
          {visible.length === 0 && (
            <p className="col-span-full text-center text-on-surface-variant py-8 font-body-md">
              No hay mesas en esta zona.
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => navigate("/mesero/llevar")}
        className="fixed bottom-[88px] right-margin-mobile h-14 px-6 bg-primary text-on-primary rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center gap-2 active:scale-95 transition-all z-40"
      >
        <Icon name="add_shopping_cart" filled />
        <span className="font-headline-md text-headline-md">Llevar</span>
      </button>
    </WaiterShell>
  );
}
