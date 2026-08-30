import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../api/client";
import { createOrder, listOpenOrders } from "../../api/orders";
import type { OrderOut } from "../../api/types";
import { CartBar } from "../../components/CartBar";
import { Icon } from "../../components/Icon";
import { Loading } from "../../components/Loading";
import { MenuGrid } from "../../components/MenuGrid";
import { OrderStatusBadge } from "../../components/StatusBadge";
import { WaiterShell } from "../../components/WaiterShell";
import { formatMoney } from "../../lib/money";
import { newUlid } from "../../lib/ulid";
import { randomId } from "../../lib/uuid";
import { useAuth } from "../../state/AuthContext";
import { useCart } from "../../state/CartContext";
import { useMenu } from "../../state/MenuContext";
import { useRealtime } from "../../state/RealtimeContext";

export default function TakeAway() {
  const { menu } = useMenu();
  const { session } = useAuth();
  const cart = useCart();
  const [recent, setRecent] = useState<OrderOut[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmedNumber, setConfirmedNumber] = useState<number | null>(null);

  const loadRecent = useCallback(() => {
    if (!session) return;
    listOpenOrders()
      .then((orders) =>
        setRecent(
          orders
            .filter((o) => o.type === "TAKE_AWAY" && o.waiter_id === session.userId)
            .sort((a, b) => b.created_at.localeCompare(a.created_at)),
        ),
      )
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    cart.ensureContext("takeaway");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(loadRecent, [loadRecent]);
  useRealtime(
    (msg) => {
      if (msg.event.startsWith("order.") || msg.event === "payment.registered") loadRecent();
    },
    [loadRecent],
  );

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const created = await createOrder(
        { id: newUlid(), type: "TAKE_AWAY", lines: cart.toOrderLines(), confirm: true },
        randomId(),
      );
      cart.clear();
      setConfirmedNumber(created.daily_number);
      loadRecent();
      setTimeout(() => setConfirmedNumber(null), 4000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo enviar el pedido.");
    } finally {
      setBusy(false);
    }
  }

  if (!menu) return <Loading label="Cargando menú…" />;

  const hasContainerCharge = cart.lines.some(
    (l) => l.product.prints_to_kitchen && l.customPrice === undefined,
  );

  return (
    <WaiterShell title="Para llevar">
      {confirmedNumber !== null && (
        <div className="mx-margin-mobile mt-stack-md bg-success-container text-success rounded-xl p-stack-md font-body-md text-body-md flex items-center gap-2 shadow-sm animate-slide-up-fade">
          <Icon name="check_circle" filled className="text-[20px]" />
          Pedido #{confirmedNumber} enviado a cocina. Está pendiente de pago en caja.
        </div>
      )}
      {error && <p className="text-error text-center py-2 font-body-md px-margin-mobile">{error}</p>}

      {recent.length > 0 && (
        <section className="px-margin-mobile pt-stack-md">
          <h2 className="font-headline-md text-headline-md mb-stack-sm">Tus pedidos para llevar pendientes</h2>
          <div className="flex flex-col gap-stack-sm">
            {recent.map((o) => (
              <div
                key={o.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex items-center justify-between shadow-sm"
              >
                <div>
                  <p className="font-body-md text-body-md text-on-surface">
                    #{o.daily_number} · {o.item_count} productos
                  </p>
                  <span className="font-numeric-pin text-[16px] text-primary">{formatMoney(o.total)}</span>
                </div>
                <OrderStatusBadge status={o.status} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="pt-stack-lg">
        <h2 className="font-headline-md text-headline-md px-margin-mobile mb-stack-sm">Nuevo pedido para llevar</h2>
        <MenuGrid menu={menu} returnTo="/mesero/llevar" />
      </section>

      <CartBar
        actionLabel="Enviar a cocina"
        onSubmit={submit}
        busy={busy}
        note={hasContainerCharge ? "Se añade un cargo por empaque al confirmar" : undefined}
      />
    </WaiterShell>
  );
}
