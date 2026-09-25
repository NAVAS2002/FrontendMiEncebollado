import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listTables, listZones } from "../../api/floor";
import { listOpenOrders } from "../../api/orders";
import type { OrderOut, TableOut, ZoneOut } from "../../api/types";
import { CashierShell } from "../../components/CashierShell";
import { FloorSections } from "../../components/FloorSections";
import { Icon } from "../../components/Icon";
import { Loading } from "../../components/Loading";
import { OrderStatusBadge } from "../../components/StatusBadge";
import { formatMoney } from "../../lib/money";
import { useMinuteTick } from "../../lib/hooks";
import { buildFloorView } from "../../lib/tables";
import { elapsedShort } from "../../lib/time";
import { useRealtime } from "../../state/RealtimeContext";

export default function OrdersBoard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderOut[] | null>(null);
  const [tables, setTables] = useState<TableOut[] | null>(null);
  const [zones, setZones] = useState<ZoneOut[]>([]);
  const [error, setError] = useState<string | null>(null);
  useMinuteTick();

  const load = useCallback(() => {
    Promise.all([listOpenOrders(), listTables(), listZones()])
      .then(([o, t, z]) => {
        setOrders(o.sort((a, b) => a.created_at.localeCompare(b.created_at)));
        setTables(t);
        setZones(z);
      })
      .catch(() => setError("No se pudieron cargar los pedidos."));
  }, []);

  useEffect(load, [load]);
  useRealtime(
    (msg) => {
      if (
        msg.event.startsWith("order.") ||
        msg.event.startsWith("table.") ||
        msg.event === "payment.registered"
      )
        load();
    },
    [load],
  );

  if (!orders && !error) return <Loading label="Cargando pedidos…" />;

  const takeAway = orders?.filter((o) => o.type === "TAKE_AWAY") ?? [];
  const ordersById = new Map((orders ?? []).map((o) => [o.id, o]));
  const view = buildFloorView(tables ?? [], zones);

  return (
    <CashierShell title="Pedidos pendientes de pago">
      {error && <p className="text-error text-center py-4 font-body-md">{error}</p>}
      <div className="p-margin-mobile grid md:grid-cols-2 gap-stack-lg">
        <section className="flex flex-col gap-stack-md">
          <h2 className="font-headline-md text-headline-md flex items-center gap-2">
            <Icon name="table_restaurant" className="text-primary" /> Mesas
            {view.counts.toBill > 0 && (
              <span className="bg-alert-container/30 text-alert text-label-sm uppercase px-2.5 py-1 rounded-full animate-pulse">
                {view.counts.toBill} pidiendo la cuenta
              </span>
            )}
          </h2>

          {!tables ? (
            <Loading label="Cargando mesas…" />
          ) : view.sections.length === 0 ? (
            <p className="font-body-md text-body-md text-on-surface-variant">Sin mesas.</p>
          ) : (
            <FloorSections
              sections={view.sections}
              ordersById={ordersById}
              mode="cashier"
              onOpen={(_table, order) => {
                if (order) navigate(`/caja/pedido/${order.id}`);
              }}
            />
          )}
        </section>
        <section>
          <h2 className="font-headline-md text-headline-md mb-stack-sm flex items-center gap-2">
            <Icon name="local_mall" className="text-primary" /> Para llevar ({takeAway.length})
          </h2>
          <OrderList orders={takeAway} onOpen={(id) => navigate(`/caja/pedido/${id}`)} empty="Sin pedidos para llevar." />
        </section>
      </div>
    </CashierShell>
  );
}

function OrderList({
  orders,
  onOpen,
  empty,
}: {
  orders: OrderOut[];
  onOpen: (id: string) => void;
  empty: string;
}) {
  if (orders.length === 0) {
    return <p className="font-body-md text-body-md text-on-surface-variant">{empty}</p>;
  }
  return (
    <div className="flex flex-col gap-stack-sm">
      {orders.map((o) => (
        <button
          key={o.id}
          onClick={() => onOpen(o.id)}
          className="w-full bg-surface-container-low ring-1 ring-white/5 rounded-xl p-stack-md flex items-center justify-between text-left active:scale-[0.99] active:bg-surface-container transition-all"
        >
          <div>
            <p className="font-body-md text-body-md text-on-surface font-medium">
              #{o.daily_number ?? "—"} · {o.item_count} productos
            </p>
            <p className="font-body-md text-[13px] text-on-surface-variant">
              Hace {elapsedShort(o.created_at)}
            </p>
          </div>
          <div className="text-right flex flex-col items-end gap-1">
            <span className="font-numeric-pin text-[18px] text-primary">{formatMoney(o.total)}</span>
            <OrderStatusBadge status={o.status} />
          </div>
        </button>
      ))}
    </div>
  );
}
