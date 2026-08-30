import type { ReactNode } from "react";
import type { TableOut } from "../api/types";
import { Icon } from "./Icon";
import { TableStatusBadge } from "./StatusBadge";

// El tamaño de la ficha refleja cuánta gente cabe: una mesa de 2 no debería
// verse igual de grande que una de banquete para 8. Los tamaños son clases
// fijas (no calculadas en runtime) para que Tailwind las detecte al compilar.
function tileSizeClass(seats: number): string {
  if (seats <= 2) return "w-[88px] min-h-[88px] rounded-3xl";
  if (seats <= 4) return "w-[108px] min-h-[108px] rounded-2xl";
  if (seats <= 6) return "w-[148px] min-h-[108px] rounded-2xl";
  return "w-[188px] min-h-[116px] rounded-2xl";
}

export function TableTile({
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
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-surface-container-lowest border p-stack-sm flex flex-col items-center justify-between transition-all relative overflow-hidden shrink-0 disabled:opacity-60 ${tileSizeClass(
        table.seats,
      )} ${
        highlight
          ? "border-warning border-2 shadow-[0_0_0_3px_rgba(230,150,20,0.15)]"
          : "border-surface-variant"
      } ${onClick && !disabled ? "active:shadow-inner cursor-pointer" : "cursor-default"}`}
    >
      <div className="w-full flex justify-between items-start">
        <span className="font-display-table-num text-display-table-num text-on-surface">{table.code}</span>
        <span className="font-label-caps text-label-caps text-on-surface-variant flex items-center">
          <Icon name="group" className="text-[16px] mr-1" /> {table.seats}
        </span>
      </div>
      {subtitle ? (
        <span className="font-numeric-pin text-[15px] text-primary">{subtitle}</span>
      ) : (
        <span className="opacity-0 text-[15px]">--</span>
      )}
      <TableStatusBadge status={table.status} />
      {footnote && (
        <span className="w-full font-label-caps text-[10px] text-warning truncate text-center leading-tight">
          {footnote}
        </span>
      )}
    </button>
  );
}
