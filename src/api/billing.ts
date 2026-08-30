import { API_BASE, ApiError } from "./client";
import { request } from "./client";
import { getSession } from "./session";
import type {
  CashSessionOut,
  CashSummaryOut,
  LineStatusOut,
  PaymentMethod,
  PaymentOut,
  PaymentResultOut,
  PaymentWithOrderOut,
  ZReportOut,
} from "./types";

export async function openCashSession(openingFloat: string): Promise<CashSessionOut> {
  return request<CashSessionOut>("/billing/cash-sessions", {
    method: "POST",
    body: { opening_float: openingFloat },
  });
}

export async function currentCashSession(): Promise<CashSessionOut> {
  return request<CashSessionOut>("/billing/cash-sessions/current");
}

export async function currentCashSummary(): Promise<CashSummaryOut> {
  return request<CashSummaryOut>("/billing/cash-sessions/current/summary");
}

export async function closeCashSession(
  countedCash: string,
  notes?: string,
  supervisorId?: string,
  supervisorSecret?: string,
): Promise<ZReportOut> {
  return request<ZReportOut>("/billing/cash-sessions/current/close", {
    method: "POST",
    body: {
      counted_cash: countedCash,
      notes,
      supervisor_id: supervisorId,
      supervisor_secret: supervisorSecret,
    },
  });
}

export async function registerPayment(
  orderId: string,
  input: {
    method: PaymentMethod;
    amount?: string;
    received?: string;
    reference?: string;
    receipt_id?: string;
    lines?: { order_line_id: string; quantity: number }[];
  },
  idempotencyKey: string,
): Promise<PaymentResultOut> {
  return request<PaymentResultOut>(`/billing/orders/${orderId}/payments`, {
    method: "POST",
    body: input,
    idempotencyKey,
  });
}

export async function listPaymentsForOrder(orderId: string): Promise<PaymentOut[]> {
  return request<PaymentOut[]>(`/billing/orders/${orderId}/payments`);
}

/** Para dividir la cuenta: cuánto de cada línea ya se cobró. */
export async function getLinesStatus(orderId: string): Promise<LineStatusOut[]> {
  return request<LineStatusOut[]>(`/billing/orders/${orderId}/lines-status`);
}

export async function listPaymentsByDate(
  businessDate?: string,
  method?: PaymentMethod,
): Promise<PaymentWithOrderOut[]> {
  return request<PaymentWithOrderOut[]>("/billing/payments", {
    query: { business_date: businessDate, method },
  });
}

/** Sube la foto del comprobante de transferencia. No usa `request()` porque
 * ese helper solo sabe mandar JSON; esto viaja como multipart/form-data. */
export async function uploadReceipt(file: File): Promise<{ receipt_id: string }> {
  const session = getSession();
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/billing/receipts`, {
    method: "POST",
    headers: session ? { Authorization: `Bearer ${session.accessToken}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(res.status, data?.error?.code ?? "UNKNOWN", data?.error?.message ?? "Error al subir la foto");
  }
  return data as { receipt_id: string };
}

/** Descarga la foto del comprobante y la devuelve como object URL (un
 * `<img src>` normal no puede mandar el header Authorization). Llamar
 * `URL.revokeObjectURL(url)` cuando ya no se necesite. */
export async function fetchReceiptUrl(receiptId: string): Promise<string> {
  const session = getSession();
  const res = await fetch(`${API_BASE}/billing/receipts/${receiptId}`, {
    headers: session ? { Authorization: `Bearer ${session.accessToken}` } : {},
  });
  if (!res.ok) throw new ApiError(res.status, "NOT_FOUND", "No se pudo cargar el comprobante");
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
