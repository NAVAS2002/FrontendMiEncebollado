import { useCallback, useEffect, useState } from "react";
import { getDashboard } from "../../api/reports";
import type { DashboardOut } from "../../api/types";
import { CashierShell } from "../../components/CashierShell";
import { Loading } from "../../components/Loading";
import { formatMoney } from "../../lib/money";
import { todayIsoDate } from "../../lib/time";
import { useRealtime } from "../../state/RealtimeContext";

export default function Dashboard() {
  const [date, setDate] = useState(todayIsoDate());
  const [data, setData] = useState<DashboardOut | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    getDashboard(date)
      .then(setData)
      .catch(() => setError("No se pudo cargar el reporte."));
  }, [date]);

  useEffect(load, [load]);
  useRealtime(
    (msg) => {
      if (msg.event.startsWith("order.") || msg.event.startsWith("payment.")) load();
    },
    [load],
  );

  return (
    <CashierShell title="Reportes del día">
      <div className="p-margin-mobile max-w-5xl mx-auto flex flex-col gap-stack-lg">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-fit h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-md text-body-md"
        />

        {error && <p className="text-error font-body-md text-center">{error}</p>}
        {!data && !error && <Loading label="Cargando reporte…" />}

        {data && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-stack-sm">
              <Stat label="Ventas netas" value={formatMoney(data.totals.net_sales)} />
              <Stat label="Pedidos" value={String(data.totals.order_count)} />
              <Stat label="Ticket promedio" value={formatMoney(data.totals.avg_ticket)} />
              <Stat label="Anulados" value={String(data.totals.cancelled_count)} />
              <Stat label="Mesa" value={`${data.totals.dine_in_count} · ${formatMoney(data.totals.dine_in_sales)}`} />
              <Stat label="Para llevar" value={`${data.totals.take_away_count} · ${formatMoney(data.totals.take_away_sales)}`} />
              <Stat label="Impuesto" value={formatMoney(data.totals.tax_total)} />
              <Stat label="Ventas brutas" value={formatMoney(data.totals.gross_sales)} />
            </div>

            <div className="grid md:grid-cols-2 gap-stack-lg">
              <section>
                <h2 className="font-headline-md text-headline-md mb-stack-sm">Productos más vendidos</h2>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl divide-y divide-outline-variant">
                  {data.top_products.length === 0 && (
                    <p className="p-stack-md font-body-md text-on-surface-variant">Sin ventas todavía.</p>
                  )}
                  {data.top_products.map((p) => (
                    <div key={p.product_id} className="p-stack-md flex justify-between font-body-md text-body-md">
                      <span>{p.name} × {p.quantity}</span>
                      <span className="font-numeric-pin text-[16px]">{formatMoney(p.total)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h2 className="font-headline-md text-headline-md mb-stack-sm">Ventas por mesero</h2>
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl divide-y divide-outline-variant">
                  {data.by_waiter.length === 0 && (
                    <p className="p-stack-md font-body-md text-on-surface-variant">Sin ventas todavía.</p>
                  )}
                  {data.by_waiter.map((w) => (
                    <div key={w.waiter_id} className="p-stack-md flex justify-between font-body-md text-body-md">
                      <span>{w.full_name} · {w.order_count} pedidos</span>
                      <span className="font-numeric-pin text-[16px]">{formatMoney(w.total)}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section>
              <h2 className="font-headline-md text-headline-md mb-stack-sm">Ventas por hora</h2>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex items-end gap-1 h-32 overflow-x-auto">
                {data.by_hour.length === 0 && (
                  <p className="font-body-md text-on-surface-variant">Sin ventas todavía.</p>
                )}
                {data.by_hour.map((h) => {
                  const max = Math.max(...data.by_hour.map((x) => Number(x.total)), 1);
                  const height = Math.max(4, (Number(h.total) / max) * 100);
                  return (
                    <div key={h.hour} className="flex flex-col items-center gap-1 w-10 shrink-0">
                      <div
                        className="w-full bg-tertiary rounded-t"
                        style={{ height: `${height}%` }}
                        title={formatMoney(h.total)}
                      />
                      <span className="font-label-caps text-[10px] text-on-surface-variant">{h.hour}h</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </CashierShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md">
      <p className="font-label-caps text-label-caps text-on-surface-variant mb-1">{label}</p>
      <p className="font-headline-md text-headline-md">{value}</p>
    </div>
  );
}
