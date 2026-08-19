export function elapsedShort(isoDate: string): string {
  const started = new Date(isoDate).getTime();
  const minutes = Math.max(0, Math.floor((Date.now() - started) / 60000));
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function formatClock(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
}

export function todayIsoDate(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

/** Sábado o domingo, hora local del dispositivo. Es solo para decidir qué
 * mesas mostrar (mesas "de fin de semana"): no afecta dinero ni pedidos,
 * así que no hace falta que lo calcule el servidor. */
export function isWeekendNow(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}
