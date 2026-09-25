import type { OrderOut, TableOut } from "../api/types";
import { zoneIcon, type TableSection } from "../lib/tables";
import { Icon } from "./Icon";
import { TableCard, type TableCardMode } from "./TableCard";

// La sala como lista de secciones apiladas, cada una con su cuadrícula de
// tarjetas. La usan el mesero (abre la comanda) y caja (abre el cobro).
export function FloorSections({
  sections,
  ordersById,
  mode,
  onOpen,
}: {
  sections: TableSection[];
  ordersById: Map<string, OrderOut>;
  mode: TableCardMode;
  onOpen: (table: TableOut, order: OrderOut | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-stack-lg">
      {sections.map((section) => {
        const name = section.zone?.name ?? "Sin sección";
        return (
          <section key={section.zone?.id ?? "sin-seccion"} aria-label={name}>
            <h2 className="flex items-center gap-space-sm mb-space-md text-headline-sm text-on-surface">
              <Icon name={zoneIcon(section.zone?.name)} className="text-primary text-[20px]" />
              {name}
              <span className="ml-auto text-label-sm text-on-surface-variant font-normal">
                {section.tables.length} {section.tables.length === 1 ? "mesa" : "mesas"}
              </span>
            </h2>
            {/* dense: una tarjeta de "cuenta pedida" ocupa el ancho completo y
                no debe dejar un hueco vacío en la fila anterior. */}
            <div className="grid grid-cols-2 gap-space-md grid-flow-dense">
              {section.tables.map((table) => {
                const order = table.current_order_id ? ordersById.get(table.current_order_id) : undefined;
                return (
                  <TableCard
                    key={table.id}
                    table={table}
                    order={order}
                    zoneName={name}
                    mode={mode}
                    onOpen={() => onOpen(table, order)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
