import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listTables, listZones } from "../../api/floor";
import { listOpenOrders } from "../../api/orders";
import type { OrderOut, TableOut, ZoneOut } from "../../api/types";
import { FloorSections } from "../../components/FloorSections";
import { Icon } from "../../components/Icon";
import { Loading } from "../../components/Loading";
import { TableStatusStrip } from "../../components/TableStatusStrip";
import { WaiterShell } from "../../components/WaiterShell";
import { useMinuteTick } from "../../lib/hooks";
import { buildFloorView } from "../../lib/tables";
import { useRealtime } from "../../state/RealtimeContext";

export default function TableMap() {
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableOut[] | null>(null);
  const [zones, setZones] = useState<ZoneOut[]>([]);
  const [orders, setOrders] = useState<OrderOut[]>([]);
  const [error, setError] = useState<string | null>(null);
  useMinuteTick();

  const load = useCallback(() => {
    Promise.all([listTables(), listZones(), listOpenOrders()])
      .then(([t, z, o]) => {
        setTables(t);
        setZones(z);
        setOrders(o);
        setError(null);
      })
      .catch(() => setError("No se pudieron cargar las mesas."));
  }, []);

  useEffect(load, [load]);
  useRealtime(
    (msg) => {
      if (msg.event.startsWith("table.") || msg.event.startsWith("order.") || msg.event === "payment.registered")
        load();
    },
    [load],
  );

  const view = useMemo(() => buildFloorView(tables ?? [], zones), [tables, zones]);
  const ordersById = useMemo(() => new Map(orders.map((o) => [o.id, o])), [orders]);

  return (
    <WaiterShell title="Mi Encebollado">
      {!tables && !error && <Loading label="Cargando mesas…" />}
      {error && <p className="text-error text-center py-8 text-body-md">{error}</p>}

      {tables && (
        <div className="p-margin-mobile flex flex-col gap-stack-lg">
          <TableStatusStrip counts={view.counts} />

          {view.sections.length === 0 ? (
            <p className="text-center text-on-surface-variant py-8 text-body-md">No hay mesas.</p>
          ) : (
            <FloorSections
              sections={view.sections}
              ordersById={ordersById}
              mode="waiter"
              onOpen={(table) => navigate(`/mesero/mesa/${table.id}`)}
            />
          )}

          <button
            onClick={() => navigate("/mesero/llevar")}
            className="w-full text-left rounded-xl p-space-lg flex items-center justify-between gap-space-md bg-gradient-to-r from-primary-container to-primary text-on-primary shadow-lg active:scale-[0.98] transition-transform duration-200"
          >
            <span className="flex flex-col">
              <span className="text-headline-sm font-bold">Nueva orden rápida</span>
              <span className="text-body-sm opacity-80">Para llevar</span>
            </span>
            <span className="w-11 h-11 rounded-full bg-on-primary/15 flex items-center justify-center shrink-0">
              <Icon name="add_shopping_cart" filled />
            </span>
          </button>
        </div>
      )}
    </WaiterShell>
  );
}
