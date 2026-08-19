import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listOpenOrders } from "../../api/orders";
import type { OrderOut } from "../../api/types";
import { CashierShell } from "../../components/CashierShell";
import { Icon } from "../../components/Icon";
import { Loading } from "../../components/Loading";
import { OrderStatusBadge } from "../../components/StatusBadge";
import { formatMoney } from "../../lib/money";
import { elapsedShort } from "../../lib/time";
import { useRealtime } from "../../state/RealtimeContext";

export default function OrdersBoard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    listOpenOrders()
      .then((data) => setOrders(data.sort((a, b) => a.created_at.localeCompare(b.created_at))))
      .catch(() => setError("No se pudieron cargar los pedidos."));
  }, []);

  useEffect(load, [load]);
  useRealtime(
    (msg) => {
      if (msg.event.startsWith("order.") || msg.event === "payment.registered") load();
    },
    [load],
  );

  if (!orders && !error) return <Loading label="Cargando pedidos…" />;

  const dineIn = orders?.filter((o) => o.type === "DINE_IN") ?? [];
  const takeAway = orders?.filter((o) => o.type === "TAKE_AWAY") ?? [];

  return (
    <CashierShell title="Pedidos pendientes de pago">
      {error && <p className="text-error text-center py-4 font-body-md">{error}</p>}
      <div className="p-margin-mobile grid md:grid-cols-2 gap-stack-lg">
        <section>
          <h2 className="font-headline-md text-headline-md mb-stack-sm flex items-center gap-2">
            <Icon name="table_restaurant" /> Mesas ({dineIn.length})
          </h2>
          <OrderList orders={dineIn} onOpen={(id) => navigate(`/caja/pedido/${id}`)} empty="Sin mesas abiertas." />
        </section>
        <section>
          <h2 className="font-headline-md text-headline-md mb-stack-sm flex items-center gap-2">
            <Icon name="local_mall" /> Para llevar ({takeAway.length})
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
          className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex items-center justify-between text-left active:bg-surface-variant transition-all"
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
