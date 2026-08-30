import { useRef, useState } from "react";
import type { TableOut } from "../api/types";
import { FloorPlanTable } from "./FloorPlanTable";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface TableMeta {
  highlight?: boolean;
  subtitle?: React.ReactNode;
  footnote?: string | null;
  disabled?: boolean;
}

/** Lienzo de un plano de mesas: cada mesa se dibuja donde su pos_x/pos_y
 * dice, en porcentaje del contenedor. En modo `editable` se puede arrastrar
 * (mouse o dedo, vía Pointer Events) y al soltar se llama `onMove` una sola
 * vez con la posición final — no hay que enviar la posición en cada pixel
 * de movimiento. */
export function FloorPlanCanvas({
  tables,
  editable = false,
  onTableClick,
  onMove,
  meta,
}: {
  tables: TableOut[];
  editable?: boolean;
  onTableClick?: (table: TableOut) => void;
  onMove?: (tableId: string, posX: number, posY: number) => void;
  meta?: (table: TableOut) => TableMeta;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ id: string; x: number; y: number } | null>(null);

  function positionFromPointer(e: React.PointerEvent): { x: number; y: number } | null {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: clamp(((e.clientX - rect.left) / rect.width) * 100, 3, 97),
      y: clamp(((e.clientY - rect.top) / rect.height) * 100, 8, 92),
    };
  }

  function handlePointerDown(e: React.PointerEvent, table: TableOut) {
    if (!editable) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging({ id: table.id, x: table.pos_x, y: table.pos_y });
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const pos = positionFromPointer(e);
    if (pos) setDragging({ id: dragging.id, ...pos });
  }

  function handlePointerUp() {
    if (dragging) onMove?.(dragging.id, dragging.x, dragging.y);
    setDragging(null);
  }

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full min-h-[320px] bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.035) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      {tables.map((t) => {
        const pos = dragging?.id === t.id ? dragging : { x: t.pos_x, y: t.pos_y };
        const m = meta?.(t) ?? {};
        return (
          <div
            key={t.id}
            onPointerDown={(e) => handlePointerDown(e, t)}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 ${
              editable ? "touch-none cursor-grab active:cursor-grabbing" : ""
            } ${dragging?.id === t.id ? "z-30 drop-shadow-lg" : "z-10"}`}
          >
            <FloorPlanTable
              table={t}
              onClick={!editable ? () => onTableClick?.(t) : undefined}
              highlight={m.highlight}
              subtitle={m.subtitle}
              footnote={m.footnote}
              disabled={m.disabled}
            />
          </div>
        );
      })}
      {tables.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center text-on-surface-variant font-body-md text-sm">
          Sin mesas en esta sección.
        </p>
      )}
    </div>
  );
}
