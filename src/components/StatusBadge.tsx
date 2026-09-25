import type { OrderStatus, TableStatus } from "../api/types";

const TABLE_LABEL: Record<TableStatus, string> = {
  LIBRE: "Libre",
  OCUPADA: "Ocupada",
  POR_COBRAR: "Por cobrar",
  RESERVADA: "Reservada",
};

const TABLE_CLASS: Record<TableStatus, string> = {
  LIBRE: "bg-secondary-container/20 text-secondary",
  OCUPADA: "bg-primary-container/20 text-primary",
  POR_COBRAR: "bg-alert-container/30 text-alert",
  RESERVADA: "bg-surface-container-highest text-on-surface-variant",
};

export function TableStatusBadge({ status }: { status: TableStatus }) {
  return (
    <div
      className={`text-label-sm uppercase px-3 py-1.5 text-center rounded-full transition-colors duration-300 ${TABLE_CLASS[status]}`}
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
  CONFIRMADO: "bg-warning-container text-warning",
  EN_PREPARACION: "bg-primary-container/20 text-primary",
  LISTO: "bg-secondary-container/20 text-secondary",
  ENTREGADO: "bg-warning-container text-warning",
  PAGADO: "bg-success-container text-success",
  CERRADO: "bg-surface-container-high text-on-surface-variant",
  ANULADO: "bg-error-container text-on-error-container",
  DEVUELTO: "bg-error-container text-on-error-container",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`text-label-sm uppercase px-3 py-1.5 rounded-full inline-block transition-colors duration-300 ${ORDER_CLASS[status]}`}
    >
      {ORDER_LABEL[status]}
    </span>
  );
}
