import type { OrderStatus, TableStatus } from "../api/types";

const TABLE_LABEL: Record<TableStatus, string> = {
  LIBRE: "Libre",
  OCUPADA: "Ocupada",
  POR_COBRAR: "Por cobrar",
  RESERVADA: "Reservada",
};

const TABLE_CLASS: Record<TableStatus, string> = {
  LIBRE: "bg-tertiary text-on-tertiary",
  OCUPADA: "bg-error text-on-error",
  POR_COBRAR: "bg-warning text-on-surface",
  RESERVADA: "bg-surface-variant text-on-surface-variant",
};

export function TableStatusBadge({ status }: { status: TableStatus }) {
  return (
    <div
      className={`font-label-caps text-label-caps w-full py-1 text-center rounded-full mt-auto ${TABLE_CLASS[status]}`}
    >
      {TABLE_LABEL[status]}
    </div>
  );
}

const ORDER_LABEL: Record<OrderStatus, string> = {
  BORRADOR: "Borrador",
  CONFIRMADO: "Pendiente de pago",
  EN_PREPARACION: "En preparación",
  LISTO: "Listo",
  ENTREGADO: "Entregado · pendiente de pago",
  PAGADO: "Pagado",
  CERRADO: "Cerrado",
  ANULADO: "Anulado",
  DEVUELTO: "Devuelto",
};

const ORDER_CLASS: Record<OrderStatus, string> = {
  BORRADOR: "bg-surface-variant text-on-surface-variant",
  CONFIRMADO: "bg-warning-container text-on-surface",
  EN_PREPARACION: "bg-primary-container text-on-primary-container",
  LISTO: "bg-tertiary-container text-on-tertiary-container",
  ENTREGADO: "bg-warning-container text-on-surface",
  PAGADO: "bg-success-container text-success",
  CERRADO: "bg-surface-container-high text-on-surface-variant",
  ANULADO: "bg-error-container text-on-error-container",
  DEVUELTO: "bg-error-container text-on-error-container",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`font-label-caps text-label-caps px-3 py-1.5 rounded-full inline-block ${ORDER_CLASS[status]}`}
    >
      {ORDER_LABEL[status]}
    </span>
  );
}
