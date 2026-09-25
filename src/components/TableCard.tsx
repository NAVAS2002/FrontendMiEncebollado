import type { OrderOut, OrderStatus, TableOut } from "../api/types";
import { formatMoney } from "../lib/money";
import { elapsedShort } from "../lib/time";
import { Icon } from "./Icon";

// Mismo componente para mesero y caja: cambia solo la acción de la tarjeta.
// El mesero abre la comanda; caja abre el cobro (y solo si la mesa tiene un
// pedido — una mesa libre no tiene nada que cobrar).
export type TableCardMode = "waiter" | "cashier";

const KITCHEN: Partial<Record<OrderStatus, { icon: string; label: string; className: string }>> = {
  CONFIRMADO: { icon: "hourglass_top", label: "Enviado a cocina", className: "text-on-surface-variant" },
  EN_PREPARACION: { icon: "skillet", label: "En cocina", className: "text-secondary" },
  LISTO: { icon: "room_service", label: "Listo para servir", className: "text-primary" },
  ENTREGADO: { icon: "check_circle", label: "Servido", className: "text-on-surface-variant" },
};

// Los códigos son texto libre ("M01", "B2", "Barra 3"): el tamaño del número
// se ajusta a su largo para que nunca desborde la tarjeta.
function codeSize(code: string, big: string, mid: string, small: string): string {
  if (code.length <= 2) return big;
  if (code.length === 3) return mid;
  return small;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function TableCard({
  table,
  order,
  zoneName,
  mode,
  onOpen,
}: {
  table: TableOut;
  order?: OrderOut;
  zoneName?: string;
  mode: TableCardMode;
  onOpen: () => void;
}) {
  const interactive = mode === "waiter" || order !== undefined;

  if (table.status === "POR_COBRAR") {
    return <PriorityCard table={table} order={order} zoneName={zoneName} mode={mode} onOpen={onOpen} interactive={interactive} />;
  }

  const isFree = table.status === "LIBRE";
  const isReserved = table.status === "RESERVADA";
  const kitchen = order ? KITCHEN[order.status] : undefined;

  const numberColor = isFree ? "text-secondary" : isReserved ? "text-on-surface-variant" : "text-primary";

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!interactive}
      className="col-span-1 text-left bg-surface-container-low rounded-xl p-space-sm flex flex-col justify-between min-h-[160px] shadow-sm relative transition-all duration-200 active:scale-[0.97] disabled:active:scale-100 disabled:opacity-60 enabled:hover:bg-surface-container"
    >
      <div>
        <div className="flex items-center justify-between gap-1">
          <span
            className={`font-bold truncate ${numberColor} ${codeSize(table.code, "text-headline-lg-mobile", "text-[22px]", "text-[16px]")}`}
          >
            {table.code}
          </span>
          {isFree ? (
            <span className="px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary text-[10px] uppercase font-bold flex items-center gap-1 shrink-0">
              <span className="w-1 h-1 rounded-full bg-secondary" />
              Libre
            </span>
          ) : isReserved ? (
            <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[10px] uppercase font-bold shrink-0">
              Reservada
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-primary-container/20 text-primary text-[10px] uppercase font-bold shrink-0">
              Ocupada
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1 mt-2 text-body-sm text-on-surface-variant">
          <span className="flex items-center gap-1">
            <Icon name="group" className="text-[14px]" />
            {isFree ? `Máx ${table.seats} pers` : plural(table.seats, "puesto", "puestos")}
          </span>
          {order && (
            <span className="flex items-center gap-1">
              <Icon name="schedule" className="text-[14px]" />
              {elapsedShort(order.created_at)}
            </span>
          )}
          {kitchen && (
            <span className={`flex items-center gap-1 text-label-sm ${kitchen.className}`}>
              <Icon name={kitchen.icon} className="text-[13px]" />
              {kitchen.label}
            </span>
          )}
        </div>
      </div>

      {isFree && mode === "waiter" ? (
        <span className="mt-2 w-full h-10 rounded-lg bg-surface-container-high text-secondary text-label-sm flex items-center justify-center gap-1 shadow-inner">
          <Icon name="add_circle" className="text-[16px]" />
          Abrir comanda
        </span>
      ) : order ? (
        <div className="flex items-end justify-between pt-2 gap-1">
          <span className="text-[11px] text-on-surface-variant truncate">
            {plural(order.item_count, "producto", "productos")}
          </span>
          <span className="text-mono-metric text-on-surface font-bold shrink-0">{formatMoney(order.total)}</span>
        </div>
      ) : null}
    </button>
  );
}

// "Cuenta pedida": ocupa el ancho completo y va con más presencia, porque es
// lo único de toda la sala que alguien tiene que atender YA.
function PriorityCard({
  table,
  order,
  zoneName,
  mode,
  onOpen,
  interactive,
}: {
  table: TableOut;
  order?: OrderOut;
  zoneName?: string;
  mode: TableCardMode;
  onOpen: () => void;
  interactive: boolean;
}) {
  const subtitle = table.bill_requested_by_name ? `Pidió: ${table.bill_requested_by_name}` : zoneName;

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!interactive}
      className="col-span-2 text-left w-full bg-surface-container-high rounded-xl p-space-md flex flex-col gap-space-sm shadow-xl relative overflow-hidden ring-1 ring-alert/25 transition-transform duration-200 active:scale-[0.99] disabled:opacity-70"
    >
      <span
        aria-hidden
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-primary/10 blur-xl pointer-events-none"
      />
      <div className="flex items-start justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm min-w-0">
          <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-md shrink-0">
            <span className={`font-bold ${codeSize(table.code, "text-headline-lg-mobile", "text-[19px]", "text-[13px]")}`}>
              {table.code}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-label-lg text-on-surface font-bold truncate">Mesa {table.code}</span>
            {subtitle && <span className="text-body-sm text-on-surface-variant truncate">{subtitle}</span>}
          </div>
        </div>
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-alert-container/30 text-alert text-label-sm animate-pulse shrink-0">
          <Icon name="price_check" className="text-[14px]" />
          Cuenta pedida
        </span>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-space-sm text-on-surface-variant text-body-sm">
          <span className="flex items-center gap-1">
            <Icon name="group" className="text-[16px]" />
            {plural(table.seats, "puesto", "puestos")}
          </span>
          {order && (
            <span className="flex items-center gap-1">
              <Icon name="timelapse" className="text-[16px]" />
              {elapsedShort(order.created_at)}
            </span>
          )}
        </div>
        {order && <span className="text-headline-sm text-primary font-bold">{formatMoney(order.total)}</span>}
      </div>

      {interactive && (
        <span className="mt-1 h-11 rounded-lg bg-primary text-on-primary text-label-md flex items-center justify-center gap-1 shadow-md">
          <Icon name={mode === "cashier" ? "payments" : "receipt_long"} className="text-[18px]" />
          {mode === "cashier" ? "Cobrar mesa" : "Ver pedido"}
        </span>
      )}
    </button>
  );
}
