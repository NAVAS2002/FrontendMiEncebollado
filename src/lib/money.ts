/**
 * El backend siempre manda importes como Decimal serializado en JSON, p. ej.
 * "3.50". Nunca se convierte a number para operar (por eso todo lo que llega
 * como precio se muestra tal cual o se sigue tratando como string donde haga
 * falta), solo se formatea para presentar.
 */
export function formatMoney(amount: string | number, currency = "USD"): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  const symbol = currency === "USD" ? "$" : currency + " ";
  if (Number.isNaN(value)) return `${symbol}0.00`;
  return `${symbol}${value.toFixed(2)}`;
}

export function parseMoneyInput(raw: string): string | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return trimmed;
}
