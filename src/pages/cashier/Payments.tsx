import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchReceiptUrl, listPaymentsByDate } from "../../api/billing";
import { ApiError } from "../../api/client";
import type { PaymentMethod, PaymentWithOrderOut } from "../../api/types";
import { CashierShell } from "../../components/CashierShell";
import { Icon } from "../../components/Icon";
import { Loading } from "../../components/Loading";
import { OrderStatusBadge } from "../../components/StatusBadge";
import { formatMoney } from "../../lib/money";
import { useRealtime } from "../../state/RealtimeContext";

const METHOD_FILTERS: { value: PaymentMethod | "TODOS"; label: string; icon: string }[] = [
  { value: "TODOS", label: "Todos", icon: "list" },
  { value: "EFECTIVO", label: "Efectivo", icon: "payments" },
  { value: "TARJETA", label: "Tarjeta", icon: "credit_card" },
  { value: "TRANSFERENCIA", label: "Transferencia", icon: "account_balance" },
];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Payments() {
  const navigate = useNavigate();
  const [date, setDate] = useState(todayIso());
  const [method, setMethod] = useState<PaymentMethod | "TODOS">("TODOS");
  const [payments, setPayments] = useState<PaymentWithOrderOut[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    listPaymentsByDate(date, method === "TODOS" ? undefined : method)
      .then(setPayments)
      .catch((err) => setError(err instanceof ApiError ? err.message : "No se pudieron cargar los pagos."));
  }, [date, method]);

  useEffect(load, [load]);

  // Cuando el mesero registra un pago (ej. transferencia con foto desde el
  // celular), esta pantalla se actualiza sola: no hace falta refrescar.
  useRealtime(
    (msg) => {
      if (msg.event === "payment.registered") load();
    },
    [load],
  );

  const total = payments?.reduce((s, p) => s + Number(p.amount), 0) ?? 0;

  return (
    <CashierShell title="Pagos">
      <div className="max-w-3xl mx-auto p-margin-mobile flex flex-col gap-stack-lg">
        <div className="flex flex-wrap items-end gap-stack-md">
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md"
            />
          </div>
          <div className="flex gap-stack-sm overflow-x-auto">
            {METHOD_FILTERS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMethod(m.value)}
                className={`h-11 px-4 rounded-full flex items-center gap-1 font-label-caps text-label-caps whitespace-nowrap transition-all ${
                  method === m.value
                    ? "bg-tertiary-container text-on-tertiary-container"
                    : "bg-surface-container-lowest border border-outline-variant text-on-surface-variant"
                }`}
              >
                <Icon name={m.icon} className="text-[16px]" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {payments && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex justify-between items-center">
            <span className="font-body-md text-body-md text-on-surface-variant">
              {payments.length} pago{payments.length === 1 ? "" : "s"}
            </span>
            <span className="font-headline-md text-headline-md">{formatMoney(total)}</span>
          </div>
        )}

        {error && <p className="text-error font-body-md text-center">{error}</p>}
        {!payments && !error && <Loading label="Cargando pagos…" />}

        {payments && payments.length === 0 && (
          <p className="text-center text-on-surface-variant font-body-md py-8">
            No hay pagos para este filtro.
          </p>
        )}

        <div className="flex flex-col gap-stack-sm">
          {payments?.map((p) => (
            <PaymentRow key={p.id} payment={p} onOpenOrder={() => navigate(`/caja/pedido/${p.order_id}`)} />
          ))}
        </div>
      </div>
    </CashierShell>
  );
}

const METHOD_ICON: Record<PaymentMethod, string> = {
  EFECTIVO: "payments",
  TARJETA: "credit_card",
  TRANSFERENCIA: "account_balance",
};

function PaymentRow({ payment, onOpenOrder }: { payment: PaymentWithOrderOut; onOpenOrder: () => void }) {
  const [busy, setBusy] = useState(false);
  const wasReturned = payment.order_status === "DEVUELTO" || payment.order_status === "ANULADO";

  async function viewReceipt() {
    if (!payment.receipt_id) return;
    setBusy(true);
    try {
      const url = await fetchReceiptUrl(payment.receipt_id);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // el archivo pudo haberse borrado; no bloquea la vista
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`bg-surface-container-lowest border rounded-xl p-stack-md flex items-center justify-between gap-stack-sm ${
        wasReturned ? "border-error opacity-70" : "border-outline-variant"
      }`}
    >
      <button onClick={onOpenOrder} className="flex items-center gap-stack-sm text-left min-w-0">
        <Icon name={METHOD_ICON[payment.method]} className="text-on-surface-variant shrink-0" />
        <div className="min-w-0">
          <p className="font-body-md text-body-md font-medium">
            Pedido #{payment.order_daily_number ?? "—"} · {payment.method}
          </p>
          <p className="font-body-md text-[12px] text-on-surface-variant">
            {new Date(payment.paid_at).toLocaleTimeString("es-EC")}
          </p>
        </div>
      </button>
      <div className="flex items-center gap-stack-sm shrink-0">
        {wasReturned && <OrderStatusBadge status={payment.order_status} />}
        <span className="font-numeric-pin text-[16px]">{formatMoney(payment.amount)}</span>
        {payment.receipt_id && (
          <button
            onClick={viewReceipt}
            disabled={busy}
            className="h-9 px-3 rounded-full border border-outline-variant flex items-center gap-1 font-label-caps text-label-caps text-tertiary disabled:opacity-50"
          >
            <Icon name="receipt_long" className="text-[16px]" />
            {busy ? "…" : "Ver foto"}
          </button>
        )}
      </div>
    </div>
  );
}
