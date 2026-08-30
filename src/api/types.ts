// Tipos espejo de los esquemas Pydantic del backend (ver src/app/modules/*/interfaces/schemas.py).
// Los importes viajan como string decimal ("3.50"), nunca como number.

export type Role = "ADMIN" | "SUBADMIN" | "CASHIER" | "WAITER" | "KITCHEN";

export interface TokenOut {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_id: string;
  full_name: string;
  role: Role;
  permissions: string[];
}

export interface WaiterOut {
  id: string;
  full_name: string;
}

export interface UserOut {
  id: string;
  username: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}

export interface DeviceOut {
  id: string;
  label: string;
  pairing_code: string | null;
  is_paired: boolean;
  is_revoked: boolean;
}

// --- Catálogo ---
export interface ModifierOut {
  id: string;
  name: string;
  price_delta: string;
  is_default: boolean;
  track_inventory: boolean;
  stock_quantity: number;
  is_available: boolean;
}

export interface ModifierGroupOut {
  id: string;
  name: string;
  min_select: number;
  max_select: number;
  modifiers: ModifierOut[];
}

export interface ProductOut {
  id: string;
  category_id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price: string;
  is_available: boolean;
  sort_order: number;
  prints_to_kitchen: boolean;
  track_inventory: boolean;
  stock_quantity: number;
  custom_price_allowed: boolean;
  modifier_groups: ModifierGroupOut[];
}

export interface CategoryOut {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface MenuOut {
  version: string;
  categories: CategoryOut[];
  products: ProductOut[];
}

// --- Sala ---
export type TableStatus = "LIBRE" | "OCUPADA" | "POR_COBRAR" | "RESERVADA";

export interface TableOut {
  id: string;
  zone_id: string | null;
  code: string;
  seats: number;
  status: TableStatus;
  current_order_id: string | null;
  weekend_only: boolean;
  bill_requested_by_name: string | null;
}

export interface ZoneOut {
  id: string;
  name: string;
  sort_order: number;
}

// --- Pedidos ---
export type OrderType = "DINE_IN" | "TAKE_AWAY";

export type OrderStatus =
  | "BORRADOR"
  | "CONFIRMADO"
  | "EN_PREPARACION"
  | "LISTO"
  | "ENTREGADO"
  | "PAGADO"
  | "CERRADO"
  | "ANULADO"
  | "DEVUELTO";

export interface LineModifierOut {
  modifier_id: string;
  name: string;
  price_delta: string;
}

export interface OrderLineOut {
  id: string;
  product_id: string;
  name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  note: string | null;
  prints_to_kitchen: boolean;
  to_go: boolean;
  own_container: boolean;
  prepared: boolean;
  modifiers: LineModifierOut[];
}

export interface OrderOut {
  id: string;
  daily_number: number | null;
  type: OrderType;
  status: OrderStatus;
  table_id: string | null;
  waiter_id: string;
  note: string | null;
  currency: string;
  subtotal: string;
  tax: string;
  surcharge: string;
  total: string;
  item_count: number;
  version: number;
  created_at: string;
  confirmed_at: string | null;
  paid_at: string | null;
  lines: OrderLineOut[];
}

export interface OrderLineIn {
  product_id: string;
  quantity: number;
  modifier_ids: string[];
  note?: string | null;
  to_go?: boolean;
  custom_price?: string | null;
}

export interface CreateOrderIn {
  id: string;
  type: OrderType;
  table_id?: string | null;
  lines: OrderLineIn[];
  note?: string | null;
  confirm?: boolean;
}

// --- Caja y pagos ---
export type PaymentMethod = "EFECTIVO" | "TARJETA" | "TRANSFERENCIA";

export type CashSessionStatus = "ABIERTA" | "CERRADA";

export interface CashSessionOut {
  id: string;
  status: CashSessionStatus;
  opening_float: string;
  opened_at: string;
  closed_at: string | null;
  expected_cash: string | null;
  counted_cash: string | null;
  discrepancy: string | null;
  notes: string | null;
}

export interface CashSummaryOut {
  cash_session_id: string;
  opening_float: string;
  totals_by_method: Record<string, string>;
  change_given: string;
  expected_cash: string;
  gross_sales: string;
  order_count: number;
}

export interface ZReportOut {
  session: CashSessionOut;
  summary: CashSummaryOut;
}

export interface PaymentOut {
  id: string;
  order_id: string;
  method: PaymentMethod;
  amount: string;
  received: string;
  change: string;
  paid_at: string;
  receipt_id: string | null;
}

export interface PaymentWithOrderOut extends PaymentOut {
  order_daily_number: number | null;
  order_type: OrderType;
  order_status: OrderStatus;
}

export interface PaymentResultOut {
  order: OrderOut;
  payment: PaymentOut;
}

// --- Reportes ---
export interface DailyTotalsOut {
  business_date: string;
  order_count: number;
  gross_sales: string;
  net_sales: string;
  tax_total: string;
  avg_ticket: string;
  dine_in_count: number;
  dine_in_sales: string;
  take_away_count: number;
  take_away_sales: string;
  cancelled_count: number;
}

export interface ProductSalesOut {
  product_id: string;
  name: string;
  quantity: number;
  total: string;
}

export interface HourlySalesOut {
  hour: number;
  order_count: number;
  total: string;
}

export interface WaiterSalesOut {
  waiter_id: string;
  full_name: string;
  order_count: number;
  total: string;
}

export interface DashboardOut {
  totals: DailyTotalsOut;
  top_products: ProductSalesOut[];
  by_hour: HourlySalesOut[];
  by_waiter: WaiterSalesOut[];
}

// --- Errores ---
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
