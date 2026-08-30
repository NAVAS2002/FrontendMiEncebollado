import type { ReactNode } from "react";
import type { TableOut, TableStatus } from "../api/types";

// Color de la mesa (no de las sillas) según su estado — vista desde arriba,
// como en un plano real, no una ficha con badge de texto.
const STATUS_FILL: Record<TableStatus, string> = {
  LIBRE: "bg-tertiary border-tertiary",
  OCUPADA: "bg-error border-error",
  POR_COBRAR: "bg-warning border-warning",
  RESERVADA: "bg-surface-variant border-outline",
};

const CHAIR_FILL: Record<TableStatus, string> = {
  LIBRE: "bg-tertiary",
  OCUPADA: "bg-error",
  POR_COBRAR: "bg-warning",
  RESERVADA: "bg-outline",
};

// Texto del código de mesa: mismo criterio de contraste que ya usa
// TableStatusBadge para cada color de fondo.
const STATUS_TEXT: Record<TableStatus, string> = {
  LIBRE: "text-on-tertiary",
  OCUPADA: "text-on-error",
  POR_COBRAR: "text-on-surface",
  RESERVADA: "text-on-surface-variant",
};

// Tamaño de la mesa (no de la ficha completa) según capacidad. Fijo en
// píxeles: el lienzo se desplaza horizontalmente en pantallas chicas en vez
// de encoger las mesas hasta hacerlas ilegibles.
function bodySize(seats: number): { w: number; h: number } {
  if (seats <= 2) return { w: 46, h: 46 };
  if (seats <= 4) return { w: 64, h: 46 };
  if (seats <= 6) return { w: 80, h: 46 };
  return { w: 96, h: 46 };
}

// Sillas repartidas en dos filas (arriba/abajo), como se ve una mesa real
// desde el techo. No es geometría exacta de perímetro — es una
// aproximación que se lee bien de un vistazo, que es lo que importa aquí.
function seatOffsets(seats: number): { x: number; side: "top" | "bottom" }[] {
  const top = Math.ceil(seats / 2);
  const bottom = seats - top;
  const offsets: { x: number; side: "top" | "bottom" }[] = [];
  for (let i = 0; i < top; i++) offsets.push({ x: ((i + 1) / (top + 1)) * 100, side: "top" });
  for (let i = 0; i < bottom; i++) offsets.push({ x: ((i + 1) / (bottom + 1)) * 100, side: "bottom" });
  return offsets;
}

export function FloorPlanTable({
  table,
  onClick,
  disabled,
  highlight,
  subtitle,
  footnote,
}: {
  table: TableOut;
  onClick?: () => void;
  disabled?: boolean;
  highlight?: boolean;
  subtitle?: ReactNode;
  footnote?: string | null;
}) {
  const { w, h } = bodySize(table.seats);
  const seats = seatOffsets(table.seats);
  const interactive = Boolean(onClick) && !disabled;

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <button
        onClick={onClick}
        disabled={disabled}
        style={{ width: w, height: h }}
        className={`relative rounded-lg border-2 shadow-sm transition-all duration-200 shrink-0 disabled:opacity-50 ${
          STATUS_FILL[table.status]
        } ${
          highlight ? "ring-4 ring-warning/40" : ""
        } ${
          interactive
            ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96]"
            : "cursor-default"
        }`}
      >
        {seats.map((s, i) => (
          <span
            key={i}
            style={{
              left: `${s.x}%`,
              [s.side]: -7,
              transform: "translateX(-50%)",
            }}
            className={`absolute w-2.5 h-2.5 rounded-full ${CHAIR_FILL[table.status]} opacity-70`}
          />
        ))}
        <span
          className={`absolute inset-0 flex items-center justify-center font-headline-md text-[15px] leading-none ${STATUS_TEXT[table.status]}`}
        >
          {table.code}
        </span>
      </button>
      <div className="flex flex-col items-center gap-0.5 max-w-[110px]">
        {subtitle && (
          <span className="font-numeric-pin text-[12px] text-primary leading-none">{subtitle}</span>
        )}
        {footnote && (
          <span className="font-label-caps text-[9px] text-warning truncate leading-tight text-center">
            {footnote}
          </span>
        )}
      </div>
    </div>
  );
}
