import { request } from "./client";
import type { CreateOrderIn, OrderLineIn, OrderOut } from "./types";

export async function createOrder(input: CreateOrderIn, idempotencyKey: string): Promise<OrderOut> {
  return request<OrderOut>("/orders", { method: "POST", body: input, idempotencyKey });
}

export async function listOpenOrders(): Promise<OrderOut[]> {
  return request<OrderOut[]>("/orders", { query: { open_only: true } });
}

export async function listOrdersByDate(businessDate: string, statusFilter?: string): Promise<OrderOut[]> {
  return request<OrderOut[]>("/orders", {
    query: { open_only: false, business_date: businessDate, status_filter: statusFilter },
  });
}

export async function ordersByTable(tableId: string): Promise<OrderOut[]> {
  return request<OrderOut[]>(`/orders/by-table/${tableId}`);
}

export async function getOrder(orderId: string): Promise<OrderOut> {
  return request<OrderOut>(`/orders/${orderId}`);
}

export async function addLines(orderId: string, lines: OrderLineIn[]): Promise<OrderOut> {
  return request<OrderOut>(`/orders/${orderId}/lines`, { method: "POST", body: { lines } });
}

export async function removeLine(orderId: string, lineId: string): Promise<OrderOut> {
  return request<OrderOut>(`/orders/${orderId}/lines/${lineId}`, { method: "DELETE" });
}

export async function changeLineQuantity(orderId: string, lineId: string, quantity: number): Promise<OrderOut> {
  return request<OrderOut>(`/orders/${orderId}/lines/${lineId}`, { method: "PATCH", body: { quantity } });
}
