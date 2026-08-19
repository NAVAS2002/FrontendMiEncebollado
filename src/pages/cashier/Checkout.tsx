import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchReceiptUrl, listPaymentsForOrder, registerPayment, uploadReceipt } from "../../api/billing";
import { ApiError } from "../../api/client";
import { getOrder } from "../../api/orders";
import { getSettings } from "../../api/settings";
import type { OrderOut, PaymentMethod, PaymentOut } from "../../api/types";
import { CashierShell } from "../../components/CashierShell";
import { Icon } from "../../components/Icon";
import { Loading } from "../../components/Loading";
import { OrderStatusBadge } from "../../components/StatusBadge";
import { formatMoney, parseMoneyInput } from "../../lib/money";
import { randomId } from "../../lib/uuid";
import { useRealtime } from "../../state/RealtimeContext";

const METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: "EFECTIVO", label: "Efectivo", icon: "payments" },
  { value: "TARJETA", label: "Tarjeta", icon: "credit_card" },
  { value: "TRANSFERENCIA", label: "Transferencia", icon: "account_balance" },
];

export default function Checkout() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderOut | null>(null);
  const [payments, setPayments] = useState<PaymentOut[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ change: string } | null>(null);

  const [method, setMethod] = useState<PaymentMethod>("EFECTIVO");
  const [receivedRaw, setReceivedRaw] = useState("");
  const [requireReceipt, setRequireReceipt] = useState(false);
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => setRequireReceipt(s.require_transfer_receipt))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!orderId) return;
    try {
      const [o, p] = await Promise.all([getOrder(orderId), listPaymentsForOrder(orderId)]);
      setOrder(o);
      setPayments(p);
    } catch {
      setError("No se pudo cargar el pedido.");
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  // Si el pago se registró desde otro dispositivo (ej. el celular sube la
  // foto del comprobante y cobra), esta pantalla se refresca sola.
  useRealtime(
    (msg) => {
      if (msg.event === "payment.registered" && msg.data.order_id === orderId) load();
    },
    [load, orderId],
  );

  if (!order && !error) return <Loading label="Cargando pedido…" />;
  if (!order) {
    return (
      <CashierShell title="Pedido">
        <p className="text-error text-center py-8 font-body-md">{error}</p>
      </CashierShell>
    );
  }

  const alreadyPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const pending = Math.max(0, Number(order.total) - alreadyPaid);
  const received = parseMoneyInput(receivedRaw);
  const change = method === "EFECTIVO" && received ? Math.max(0, Number(received) - pending) : 0;
  const needsReceipt = method === "TRANSFERENCIA" && requireReceipt;
  const canPay =
    order.status !== "PAGADO" &&
    pending > 0 &&
    (method !== "EFECTIVO" || (received !== null && Number(received) >= pending)) &&
    (!needsReceipt || receiptId !== null);

  async function onPickReceiptPhoto(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploadingReceipt(true);
    try {
      const { receipt_id } = await uploadReceipt(file);
      setReceiptId(receipt_id);
      setReceiptPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo subir la foto del comprobante.");
    } finally {
      setUploadingReceipt(false);
    }
  }

  async function pay() {
    if (!orderId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await registerPayment(
        orderId,
        {
          method,
          received: method === "EFECTIVO" ? (received ?? undefined) : undefined,
          receipt_id: receiptId ?? undefined,
        },
        randomId(),
      );
      setOrder(res.order);
      setResult({ change: res.payment.change });
      setPayments((prev) => [...prev, res.payment]);
    } catch (err) {
      if (err instanceof ApiError && err.code === "CASH_SESSION_CLOSED") {
        setError("No hay caja abierta. Ábrela primero en la sección Caja.");
      } else {
        setError(err instanceof ApiError ? err.message : "No se pudo registrar el pago.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <CashierShell title={`Pedido #${order.daily_number ?? "—"}`}>
      <div className="max-w-xl mx-auto p-margin-mobile flex flex-col gap-stack-lg">
        <button
          onClick={() => navigate("/caja/pedidos")}
          className="flex items-center gap-1 text-on-surface-variant font-label-caps text-label-caps"
        >
          <Icon name="arrow_back" className="text-[18px]" /> Volver a pedidos
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile">
              {order.type === "DINE_IN" ? "Pedido de mesa" : "Para llevar"}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {order.item_count} productos · {new Date(order.created_at).toLocaleTimeString("es-EC")}
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl divide-y divide-outline-variant">
          {order.lines.map((line) => (
            <div key={line.id} className="p-stack-md flex justify-between">
              <div>
                <p className="font-body-md text-body-md">{line.quantity}× {line.name}</p>
                {line.modifiers.length > 0 && (
                  <p className="font-body-md text-[13px] text-on-surface-variant">
                    {line.modifiers.map((m) => m.name).join(", ")}
                  </p>
                )}
              </div>
              <span className="font-numeric-pin text-[16px]">{formatMoney(line.line_total)}</span>
            </div>
          ))}
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-1 font-body-md text-body-md">
          <Row label="Subtotal" value={formatMoney(order.subtotal)} />
          <Row label="Impuesto" value={formatMoney(order.tax)} />
          {Number(order.surcharge) > 0 && (
            <Row label="Cargo para llevar" value={formatMoney(order.surcharge)} />
          )}
          <Row label="Total" value={formatMoney(order.total)} strong />
          {alreadyPaid > 0 && <Row label="Ya pagado" value={formatMoney(alreadyPaid)} />}
          {pending > 0 && <Row label="Pendiente" value={formatMoney(pending)} strong />}
        </div>

        {payments.some((p) => p.receipt_id) && (
          <div className="flex flex-col gap-stack-sm">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant">
              Comprobantes adjuntos
            </h3>
            {payments
              .filter((p) => p.receipt_id)
              .map((p) => (
                <ReceiptLink key={p.id} receiptId={p.receipt_id!} amount={formatMoney(p.amount)} />
              ))}
          </div>
        )}

        {order.status === "PAGADO" ? (
          <div className="bg-success-container text-success rounded-xl p-stack-md font-body-md text-body-md flex items-center gap-2">
            <Icon name="check_circle" filled />
            Pedido pagado. La mesa se liberó automáticamente.
          </div>
        ) : result ? (
          <div className="bg-success-container text-success rounded-xl p-stack-md font-body-md text-body-md flex flex-col gap-1">
            <span className="flex items-center gap-2">
              <Icon name="check_circle" filled /> Pago registrado.
            </span>
            {Number(result.change) > 0 && <span>Cambio a entregar: {formatMoney(result.change)}</span>}
          </div>
        ) : (
          <div className="flex flex-col gap-stack-md">
            <div className="grid grid-cols-3 gap-stack-sm">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={`h-16 rounded-xl border flex flex-col items-center justify-center gap-1 font-label-caps text-label-caps transition-all ${
                    method === m.value
                      ? "bg-tertiary-container border-tertiary text-on-tertiary-container"
                      : "bg-surface-container-lowest border-outline-variant text-on-surface-variant"
                  }`}
                >
                  <Icon name={m.icon} />
                  {m.label}
                </button>
              ))}
            </div>

            {method === "TRANSFERENCIA" && (
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">
                  Foto del comprobante {requireReceipt ? "(obligatoria)" : "(opcional)"}
                </label>
                {receiptPreview ? (
                  <div className="flex items-center gap-stack-sm">
                    <img
                      src={receiptPreview}
                      alt="Comprobante"
                      className="h-20 w-20 object-cover rounded-lg border border-outline-variant"
                    />
                    <label className="h-10 px-4 rounded-full border border-outline-variant flex items-center gap-1 font-label-caps text-label-caps text-on-surface-variant cursor-pointer">
                      <Icon name="photo_camera" className="text-[16px]" /> Cambiar foto
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => onPickReceiptPhoto(e.target.files?.[0])}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="w-full h-14 rounded-lg border border-dashed border-outline-variant flex items-center justify-center gap-2 font-label-caps text-label-caps text-on-surface-variant cursor-pointer">
                    <Icon name={uploadingReceipt ? "hourglass_empty" : "photo_camera"} />
                    {uploadingReceipt ? "Subiendo…" : "Tomar foto del comprobante"}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      disabled={uploadingReceipt}
                      onChange={(e) => onPickReceiptPhoto(e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>
            )}

            {method === "EFECTIVO" && (
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">
                  Efectivo recibido
                </label>
                <input
                  inputMode="decimal"
                  value={receivedRaw}
                  onChange={(e) => setReceivedRaw(e.target.value)}
                  placeholder={pending.toFixed(2)}
                  className="w-full h-14 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-numeric-pin text-numeric-pin focus:ring-2 focus:ring-tertiary focus:border-tertiary outline-none"
                />
                {received !== null && Number(received) >= pending && (
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Cambio: {formatMoney(change)}
                  </p>
                )}
              </div>
            )}

            {error && <p className="text-error font-body-md text-sm">{error}</p>}

            <button
              onClick={pay}
              disabled={busy || !canPay}
              className="w-full h-14 rounded-full bg-tertiary text-on-tertiary font-headline-md text-headline-md disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              {busy ? "Cobrando…" : `Cobrar ${formatMoney(pending)}`}
            </button>
          </div>
        )}
      </div>
    </CashierShell>
  );
}

function ReceiptLink({ receiptId, amount }: { receiptId: string; amount: string }) {
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    try {
      const url = await fetchReceiptUrl(receiptId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // El comprobante pudo haberse borrado del disco; no bloquea la caja.
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={open}
      disabled={busy}
      className="flex items-center justify-between h-12 px-stack-md rounded-lg border border-outline-variant bg-surface-container-lowest font-body-md text-body-md text-on-surface-variant disabled:opacity-50"
    >
      <span className="flex items-center gap-2">
        <Icon name="receipt_long" className="text-[18px]" /> Transferencia {amount}
      </span>
      <span className="font-label-caps text-label-caps text-tertiary">
        {busy ? "Abriendo…" : "Ver foto"}
      </span>
    </button>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-headline-md text-headline-md" : ""}`}>
      <span className={strong ? "" : "text-on-surface-variant"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
