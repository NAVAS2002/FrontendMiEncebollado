import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiError } from "../../api/client";
import { getTable, markTableToBill } from "../../api/floor";
import { addLines, createOrder, ordersByTable } from "../../api/orders";
import type { OrderOut, TableOut } from "../../api/types";
import { CartBar } from "../../components/CartBar";
import { Icon } from "../../components/Icon";
import { Loading } from "../../components/Loading";
import { MenuGrid } from "../../components/MenuGrid";
import { OrderStatusBadge, TableStatusBadge } from "../../components/StatusBadge";
import { WaiterShell } from "../../components/WaiterShell";
import { formatMoney } from "../../lib/money";
import { newUlid } from "../../lib/ulid";
import { randomId } from "../../lib/uuid";
import { useCart } from "../../state/CartContext";
import { useMenu } from "../../state/MenuContext";
import { useRealtime } from "../../state/RealtimeContext";

const OPEN_STATUSES = new Set(["BORRADOR", "CONFIRMADO", "EN_PREPARACION", "LISTO", "ENTREGADO"]);

export default function TableOrder() {
  const { tableId } = useParams<{ tableId: string }>();
  const { menu } = useMenu();
  const cart = useCart();

  const [table, setTable] = useState<TableOut | null>(null);
  const [order, setOrder] = useState<OrderOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!tableId) return;
    try {
      const [t, orders] = await Promise.all([getTable(tableId), ordersByTable(tableId)]);
      setTable(t);
      setOrder(orders.find((o) => OPEN_STATUSES.has(o.status)) ?? null);
    } catch {
      setError("No se pudo cargar la mesa.");
    }
  }, [tableId]);

  useEffect(() => {
    if (tableId) cart.ensureContext(`table:${tableId}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtime(
    (msg) => {
      if (msg.event.startsWith("order.") || msg.event.startsWith("table.")) load();
    },
    [load],
  );

  async function submit() {
    if (!tableId) return;
    setBusy(true);
    setError(null);
    try {
      if (order) {
        const updated = await addLines(order.id, cart.toOrderLines());
        setOrder(updated);
      } else {
        const created = await createOrder(
          {
            id: newUlid(),
            type: "DINE_IN",
            table_id: tableId,
            lines: cart.toOrderLines(),
            confirm: true,
          },
          randomId(),
        );
        setOrder(created);
      }
      cart.clear();
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo enviar el pedido.");
    } finally {
      setBusy(false);
    }
  }

  async function askForBill() {
    if (!tableId) return;
    setBusy(true);
    try {
      const t = await markTableToBill(tableId);
      setTable(t);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo pedir la cuenta.");
    } finally {
      setBusy(false);
    }
  }

  if (!table || !menu) return <Loading label="Cargando mesa…" />;

  return (
    <WaiterShell title={`Mesa ${table.code}`}>
      <div className="px-margin-mobile pt-stack-md flex items-center justify-between gap-stack-sm">
        <TableStatusBadge status={table.status} />
        {table.status === "OCUPADA" && (
          <button
            onClick={askForBill}
            disabled={busy}
            className="flex items-center gap-1 h-10 px-4 rounded-full bg-surface-container-lowest border border-outline-variant font-label-caps text-label-caps text-on-surface active:scale-95 transition-all disabled:opacity-50"
          >
            <Icon name="receipt_long" className="text-[18px]" />
            Pedir la cuenta
          </button>
        )}
      </div>

      {error && <p className="text-error text-center py-2 font-body-md px-margin-mobile">{error}</p>}

      {order && (
        <section className="px-margin-mobile pt-stack-md">
          <div className="flex items-center justify-between mb-stack-sm">
            <h2 className="font-headline-md text-headline-md">
              Pedido {order.daily_number ? `#${order.daily_number}` : ""}
            </h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl divide-y divide-outline-variant shadow-sm">
            {order.lines.map((line) => (
              <div key={line.id} className="p-stack-md flex justify-between">
                <div>
                  <p className="font-body-md text-body-md text-on-surface">
                    {line.quantity}× {line.name}
                  </p>
                  {line.modifiers.length > 0 && (
                    <p className="font-body-md text-[13px] text-on-surface-variant">
                      {line.modifiers.map((m) => m.name).join(", ")}
                    </p>
                  )}
                  {line.note && (
                    <p className="font-body-md text-[13px] text-on-surface-variant italic">"{line.note}"</p>
                  )}
                  {line.to_go && (
                    <span className="inline-flex items-center gap-0.5 font-label-caps text-[11px] text-tertiary">
                      <Icon name="takeout_dining" className="text-[13px]" /> Para llevar
                    </span>
                  )}
                </div>
                <span className="font-numeric-pin text-[16px] text-on-surface">{formatMoney(line.line_total)}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1 mt-stack-sm px-1 font-body-md text-body-md">
            {Number(order.surcharge) > 0 && (
              <div className="flex justify-between text-on-surface-variant">
                <span>Cargo por llevar</span>
                <span>{formatMoney(order.surcharge)}</span>
              </div>
            )}
            <div className="flex justify-between font-headline-md text-headline-md">
              <span>Total del pedido</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
        </section>
      )}

      <section className="pt-stack-lg">
        <h2 className="font-headline-md text-headline-md px-margin-mobile mb-stack-sm">
          {order ? "Agregar más productos" : "Nuevo pedido"}
        </h2>
        <MenuGrid menu={menu} returnTo={`/mesero/mesa/${tableId}`} />
      </section>

      <CartBar actionLabel={order ? "Enviar a cocina" : "Confirmar pedido"} onSubmit={submit} busy={busy} />
    </WaiterShell>
  );
}
