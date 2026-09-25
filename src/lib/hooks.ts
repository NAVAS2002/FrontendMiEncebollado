import { useEffect, useState } from "react";

/** Estado de red del dispositivo. Es lo único honesto que puede decir una
 * insignia "Online": si el celular perdió la señal, el mesero debe saberlo
 * antes de tomar un pedido que no va a llegar a cocina. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

/** Fuerza un re-render cada minuto: los "hace 42 min" de las tarjetas de
 * mesa se calculan al pintar, y sin esto se quedarían congelados hasta que
 * llegue algún evento en tiempo real. */
export function useMinuteTick(): void {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);
}
