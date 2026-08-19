import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changeOrderStatus, listOpenOrders } from "../../api/orders";
import { ApiError } from "../../api/client";
import type { OrderOut, OrderStatus } from "../../api/types";
import { Icon } from "../../components/Icon";
import { Loading } from "../../components/Loading";
import { StoreLogo } from "../../components/StoreLogo";
import { elapsedShort } from "../../lib/time";
import { useAuth } from "../../state/AuthContext";
import { useRealtime } from "../../state/RealtimeContext";

const COLUMNS: { status: OrderStatus; title: string; nextStatus?: OrderStatus; nextLabel?: string }[] = [
  { status: "CONFIRMADO", title: "Nuevos", nextStatus: "EN_PREPARACION", nextLabel: "Empezar" },
  { status: "EN_PREPARACION", title: "En preparación", nextStatus: "LISTO", nextLabel: "Marcar listo" },
  { status: "LISTO", title: "Listos", nextStatus: undefined },
];

// A los 12 minutos sin avanzar, la tarjeta se pone roja: un pedido viejo en
// la pantalla de cocina es justo el tipo de cosa que no debería pasar
// desapercibida entre el ruido de una cocina en hora pico.
const URGENT_MINUTES = 12;

export default function KitchenBoard() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const [orders, setOrders] = useState<OrderOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const load = useCallback(() => {
    listOpenOrders()
      .then((data) => setOrders(data.sort((a, b) => a.created_at.localeCompare(b.created_at))))
      .catch(() => setError("No se pudieron cargar los pedidos."));
  }, []);

  useEffect(load, [load]);
  useEffect(() => {
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);
  useRealtime(
    (msg) => {
      if (msg.event.startsWith("order.")) load();
    },
    [load],
  );

  async function advance(order: OrderOut, next: OrderStatus) {
    setBusyOrderId(order.id);
    setError(null);
    try {
      const updated = await changeOrderStatus(order.id, next);
      setOrders((prev) => (prev ?? []).map((o) => (o.id === updated.id ? updated : o)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar el pedido.");
    } finally {
      setBusyOrderId(null);
    }
  }

  if (!orders && !error) return <Loading label="Cargando comandas…" />;

  // Un pedido de solo bebidas no tiene nada que cocinar: no le sirve de nada
  // a la cocina verlo en su pantalla.
  const kitchenOrders = (orders ?? []).filter((o) => o.lines.some((l) => l.prints_to_kitchen));

  return (
    <div className="h-dvh flex flex-col bg-background text-on-background overflow-hidden">
      <header className="bg-surface border-b border-outline-variant flex items-center justify-between px-margin-mobile h-touch-target-min shrink-0">
        <div className="flex items-center gap-stack-md">
          {session?.role === "ADMIN" && (
            <button
              onClick={() => navigate("/caja/pedidos")}
              className="flex items-center gap-1 h-10 px-3 rounded-full text-on-surface-variant hover:bg-surface-container-high font-label-caps text-label-caps"
            >
              <Icon name="arrow_back" className="text-[18px]" /> Volver a Caja
            </button>
          )}
          <div className="flex items-center gap-2">
            <StoreLogo size="sm" />
            <h1 className="font-headline-md text-headline-md">Cocina</h1>
          </div>
        </div>
        <div className="flex items-center gap-stack-md">
          {session && (
            <span className="font-body-md text-[13px] text-on-surface-variant hidden sm:inline">
              {session.fullName}
            </span>
          )}
          <button
            onClick={() => logout().then(() => navigate("/caja/login", { replace: true }))}
            className="h-10 w-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high rounded-full"
            aria-label="Salir"
          >
            <Icon name="logout" />
          </button>
        </div>
      </header>

      {error && <p className="text-error text-center py-2 font-body-md shrink-0">{error}</p>}

      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-outline-variant">
        {COLUMNS.map((col) => (
          <div key={col.status} className="flex flex-col overflow-hidden min-h-0">
            <h2 className="font-label-caps text-label-caps text-on-surface-variant px-margin-mobile py-stack-sm shrink-0 bg-surface-container-low">
              {col.title} · {kitchenOrders.filter((o) => o.status === col.status).length}
            </h2>
            <div className="flex-1 overflow-y-auto p-stack-sm flex flex-col gap-stack-sm">
              {kitchenOrders
                .filter((o) => o.status === col.status)
                .map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    busy={busyOrderId === order.id}
                    nextStatus={col.nextStatus}
                    nextLabel={col.nextLabel}
                    onAdvance={col.nextStatus ? () => advance(order, col.nextStatus!) : undefined}
                  />
                ))}
              {kitchenOrders.filter((o) => o.status === col.status).length === 0 && (
                <p className="text-center text-on-surface-variant font-body-md text-sm py-8">
                  Sin pedidos aquí.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  busy,
  nextStatus,
  nextLabel,
  onAdvance,
}: {
  order: OrderOut;
  busy: boolean;
  nextStatus?: OrderStatus;
  nextLabel?: string;
  onAdvance?: () => void;
}) {
  const minutes = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
  const urgent = minutes >= URGENT_MINUTES;
  const kitchenLines = order.lines.filter((l) => l.prints_to_kitchen);

  return (
    <div
      className={`rounded-xl border-2 p-stack-md flex flex-col gap-stack-sm bg-surface-container-lowest ${
        urgent ? "border-error" : "border-outline-variant"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-headline-md text-headline-md">
          <Icon name={order.type === "DINE_IN" ? "table_restaurant" : "local_mall"} className="text-[18px]" />
          {order.type === "DINE_IN" ? `Mesa` : "Para llevar"}
          {order.daily_number ? ` #${order.daily_number}` : ""}
        </span>
        <span
          className={`font-label-caps text-[11px] px-2 py-1 rounded-full ${
            urgent ? "bg-error text-on-error" : "bg-surface-container-high text-on-surface-variant"
          }`}
        >
          Hace {elapsedShort(order.created_at)}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {kitchenLines.map((line) => (
          <div key={line.id} className="font-body-md text-body-md">
            <span className="font-numeric-pin">{line.quantity}×</span> {line.name}
            {line.to_go && (
              <span className="ml-1 inline-flex items-center gap-0.5 font-label-caps text-[11px] text-tertiary">
                <Icon name="takeout_dining" className="text-[12px]" /> para llevar
              </span>
            )}
            {line.modifiers.length > 0 && (
              <p className="font-body-md text-[13px] text-on-surface-variant pl-4">
                {line.modifiers.map((m) => m.name).join(", ")}
              </p>
            )}
            {line.note && (
              <p className="font-body-md text-[13px] text-tertiary italic pl-4">"{line.note}"</p>
            )}
          </div>
        ))}
      </div>

      {onAdvance && nextStatus && (
        <button
          onClick={onAdvance}
          disabled={busy}
          className="mt-1 h-11 rounded-full bg-primary text-on-primary font-headline-md text-headline-md disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {busy ? "…" : nextLabel}
        </button>
      )}
    </div>
  );
}
