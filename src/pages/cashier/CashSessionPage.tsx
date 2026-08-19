import { useCallback, useEffect, useState } from "react";
import { closeCashSession, currentCashSession, currentCashSummary, openCashSession } from "../../api/billing";
import { listSupervisors } from "../../api/auth";
import { ApiError } from "../../api/client";
import type { CashSessionOut, CashSummaryOut, WaiterOut, ZReportOut } from "../../api/types";
import { CashierShell } from "../../components/CashierShell";
import { Icon } from "../../components/Icon";
import { Loading } from "../../components/Loading";
import { formatMoney, parseMoneyInput } from "../../lib/money";
import { useAuth } from "../../state/AuthContext";
import { useRealtime } from "../../state/RealtimeContext";

const METHOD_LABEL: Record<string, string> = { EFECTIVO: "Efectivo", TARJETA: "Tarjeta", TRANSFERENCIA: "Transferencia" };

export default function CashSessionPage() {
  const { session: auth } = useAuth();
  const [session, setSession] = useState<CashSessionOut | null | "none">(null);
  const [summary, setSummary] = useState<CashSummaryOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, sum] = await Promise.all([currentCashSession(), currentCashSummary()]);
      setSession(s);
      setSummary(sum);
    } catch (err) {
      if (err instanceof ApiError && err.code === "CASH_SESSION_CLOSED") {
        setSession("none");
        setSummary(null);
      } else {
        setError("No se pudo cargar el estado de caja.");
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useRealtime(
    (msg) => {
      if (msg.event.startsWith("payment.") || msg.event.startsWith("cash_session.") || msg.event.startsWith("order.")) load();
    },
    [load],
  );

  if (session === null) return <Loading label="Cargando caja…" />;

  return (
    <CashierShell title="Caja">
      <div className="max-w-xl mx-auto p-margin-mobile">
        {error && <p className="text-error font-body-md text-center mb-stack-md">{error}</p>}
        {session === "none" ? (
          <OpenSessionForm onOpened={load} />
        ) : (
          <OpenSessionView
            session={session}
            summary={summary}
            isAdmin={auth?.role === "ADMIN"}
            onClosed={load}
          />
        )}
      </div>
    </CashierShell>
  );
}

function OpenSessionForm({ onOpened }: { onOpened: () => void }) {
  const [raw, setRaw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const amount = parseMoneyInput(raw);
    if (amount === null) {
      setError("Ingresa un monto válido.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await openCashSession(amount);
      onOpened();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo abrir la caja.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center text-center gap-stack-md pt-stack-lg">
      <Icon name="point_of_sale" className="text-4xl text-tertiary" />
      <h2 className="font-headline-lg-mobile text-headline-lg-mobile">Abrir caja</h2>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
        Ingresa el fondo inicial en efectivo para empezar a registrar cobros.
      </p>
      <input
        inputMode="decimal"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="0.00"
        className="w-full max-w-xs h-14 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 text-center font-numeric-pin text-numeric-pin focus:ring-2 focus:ring-tertiary focus:border-tertiary outline-none"
      />
      {error && <p className="text-error font-body-md text-sm">{error}</p>}
      <button
        onClick={submit}
        disabled={busy}
        className="w-full max-w-xs h-14 rounded-full bg-tertiary text-on-tertiary font-headline-md text-headline-md disabled:opacity-50 active:scale-[0.98] transition-all"
      >
        {busy ? "Abriendo…" : "Abrir caja"}
      </button>
    </div>
  );
}

function OpenSessionView({
  session,
  summary,
  isAdmin,
  onClosed,
}: {
  session: CashSessionOut;
  summary: CashSummaryOut | null;
  isAdmin: boolean;
  onClosed: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const [countedRaw, setCountedRaw] = useState("");
  const [notes, setNotes] = useState("");
  const [supervisors, setSupervisors] = useState<WaiterOut[]>([]);
  const [supervisorId, setSupervisorId] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ZReportOut | null>(null);

  useEffect(() => {
    if (closing && !isAdmin) listSupervisors().then(setSupervisors).catch(() => {});
  }, [closing, isAdmin]);

  async function submitClose() {
    const counted = parseMoneyInput(countedRaw);
    if (counted === null) {
      setError("Ingresa el conteo físico de efectivo.");
      return;
    }
    if (!isAdmin && (!supervisorId || !secret)) {
      setError("Se necesita autorización de un supervisor para cerrar la caja.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await closeCashSession(counted, notes || undefined, isAdmin ? undefined : supervisorId, isAdmin ? undefined : secret);
      setReport(res);
      onClosed();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cerrar la caja.");
    } finally {
      setBusy(false);
    }
  }

  if (report) {
    return (
      <div className="flex flex-col gap-stack-md">
        <div className="flex items-center gap-2 text-success">
          <Icon name="check_circle" filled />
          <h2 className="font-headline-md text-headline-md">Caja cerrada — Reporte Z</h2>
        </div>
        <SummaryCard summary={report.summary} extra={{ "Contado": formatMoney(report.session.counted_cash ?? "0"), "Descuadre": formatMoney(report.session.discrepancy ?? "0") }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-stack-lg">
      <div className="flex items-center gap-2 text-tertiary">
        <Icon name="check_circle" filled />
        <span className="font-headline-md text-headline-md">Caja abierta</span>
        <span className="font-body-md text-body-md text-on-surface-variant">
          desde {new Date(session.opened_at).toLocaleTimeString("es-EC")}
        </span>
      </div>

      {summary && <SummaryCard summary={summary} />}

      {!closing ? (
        <button
          onClick={() => setClosing(true)}
          className="w-full h-14 rounded-full bg-surface-container-lowest border border-outline-variant text-on-surface font-headline-md text-headline-md active:scale-[0.98] transition-all"
        >
          Cerrar caja
        </button>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-md">
          <h3 className="font-headline-md text-headline-md">Cierre de caja</h3>
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">
              Conteo físico de efectivo
            </label>
            <input
              inputMode="decimal"
              value={countedRaw}
              onChange={(e) => setCountedRaw(e.target.value)}
              className="w-full h-12 rounded-lg border border-outline-variant bg-surface px-4 font-numeric-pin text-numeric-pin outline-none focus:ring-2 focus:ring-tertiary"
            />
          </div>
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Notas (opcional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-12 rounded-lg border border-outline-variant bg-surface px-4 font-body-md text-body-md outline-none focus:ring-2 focus:ring-tertiary"
            />
          </div>
          {!isAdmin && (
            <>
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">
                  Supervisor que autoriza
                </label>
                <select
                  value={supervisorId}
                  onChange={(e) => setSupervisorId(e.target.value)}
                  className="w-full h-12 rounded-lg border border-outline-variant bg-surface px-4 font-body-md text-body-md outline-none focus:ring-2 focus:ring-tertiary"
                >
                  <option value="">Selecciona…</option>
                  {supervisors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">
                  PIN / contraseña del supervisor
                </label>
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  className="w-full h-12 rounded-lg border border-outline-variant bg-surface px-4 font-body-md text-body-md outline-none focus:ring-2 focus:ring-tertiary"
                />
              </div>
            </>
          )}
          {error && <p className="text-error font-body-md text-sm">{error}</p>}
          <div className="flex gap-stack-sm">
            <button
              onClick={() => setClosing(false)}
              className="flex-1 h-12 rounded-full border border-outline-variant font-headline-md text-headline-md"
            >
              Cancelar
            </button>
            <button
              onClick={submitClose}
              disabled={busy}
              className="flex-1 h-12 rounded-full bg-error text-on-error font-headline-md text-headline-md disabled:opacity-50"
            >
              {busy ? "Cerrando…" : "Confirmar cierre"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ summary, extra }: { summary: CashSummaryOut; extra?: Record<string, string> }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-2 font-body-md text-body-md">
      <div className="flex justify-between">
        <span className="text-on-surface-variant">Fondo inicial</span>
        <span>{formatMoney(summary.opening_float)}</span>
      </div>
      {Object.entries(summary.totals_by_method).map(([method, amount]) => (
        <div key={method} className="flex justify-between">
          <span className="text-on-surface-variant">{METHOD_LABEL[method] ?? method}</span>
          <span>{formatMoney(amount)}</span>
        </div>
      ))}
      <div className="flex justify-between font-headline-md text-headline-md pt-2 border-t border-outline-variant">
        <span>Ventas totales</span>
        <span>{formatMoney(summary.gross_sales)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-on-surface-variant">Efectivo esperado en caja</span>
        <span>{formatMoney(summary.expected_cash)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-on-surface-variant">Pedidos cobrados</span>
        <span>{summary.order_count}</span>
      </div>
      {extra &&
        Object.entries(extra).map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className="text-on-surface-variant">{label}</span>
            <span>{value}</span>
          </div>
        ))}
    </div>
  );
}
