import type { FloorView } from "../lib/tables";

// Resumen de la sala de un vistazo: cuántas mesas hay libres, ocupadas y
// pidiendo la cuenta. Los números salen de las mesas realmente visibles (las
// apagadas por el administrador no cuentan).
export function TableStatusStrip({ counts }: { counts: FloorView["counts"] }) {
  return (
    <div className="grid grid-cols-3 gap-space-sm">
      <Stat label="Libres" value={counts.free} valueClass="text-secondary" />
      <Stat label="Ocupadas" value={counts.occupied} valueClass="text-primary" />
      <Stat
        label="Cuentas"
        value={counts.toBill}
        valueClass="text-alert"
        pulse={counts.toBill > 0}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass,
  pulse,
}: {
  label: string;
  value: number;
  valueClass: string;
  pulse?: boolean;
}) {
  return (
    <div className="bg-surface-container-low rounded-xl px-space-md py-space-md flex flex-col items-center gap-space-xs ring-1 ring-white/5">
      <span className={`text-headline-lg font-bold leading-none ${valueClass} ${pulse ? "animate-pulse" : ""}`}>
        {value}
      </span>
      <span className="text-label-sm uppercase text-on-surface-variant">{label}</span>
    </div>
  );
}
