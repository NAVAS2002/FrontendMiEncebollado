import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listWaitersForPinScreen, loginWithPin } from "../../api/auth";
import { ApiError } from "../../api/client";
import { getDeviceId } from "../../lib/device";
import type { WaiterOut } from "../../api/types";
import { AuthHeader } from "../../components/AuthHeader";
import { Icon } from "../../components/Icon";
import { Loading } from "../../components/Loading";

const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLR", "0", "DEL"];

export default function WaiterLogin() {
  const navigate = useNavigate();
  const [deviceId] = useState(() => getDeviceId());
  const [waiters, setWaiters] = useState<WaiterOut[] | null>(null);
  const [selected, setSelected] = useState<WaiterOut | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!deviceId) {
      navigate("/mesero/emparejar", { replace: true });
      return;
    }
    listWaitersForPinScreen()
      .then(setWaiters)
      .catch(() => setWaiters([]));
  }, [deviceId, navigate]);

  useEffect(() => {
    if (pin.length !== PIN_LENGTH || !selected || !deviceId) return;
    let cancelled = false;
    setBusy(true);
    setError(null);
    loginWithPin(selected.id, pin, deviceId)
      .then(() => {
        if (!cancelled) navigate("/mesero/mesas", { replace: true });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor.");
        setPin("");
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  function press(key: string) {
    if (busy) return;
    if (key === "CLR") return setPin("");
    if (key === "DEL") return setPin((p) => p.slice(0, -1));
    setError(null);
    setPin((p) => (p.length < PIN_LENGTH ? p + key : p));
  }

  if (!deviceId) return null;

  if (!waiters) return <Loading label="Cargando meseros…" />;

  if (!selected) {
    return (
      <div className="min-h-dvh bg-surface flex flex-col items-center px-margin-mobile pt-16 pb-24 animate-fade-in">
        <AuthHeader title="MI ENCEBOLLADO" onBack={() => navigate("/")} />
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile mb-stack-lg mt-stack-lg">¿Quién eres?</h2>
        <div className="w-full max-w-md grid grid-cols-2 gap-gutter">
          {waiters.length === 0 && (
            <p className="col-span-2 text-center text-on-surface-variant font-body-md">
              No hay meseros con PIN configurado.
            </p>
          )}
          {waiters.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelected(w)}
              className="flex flex-col items-center justify-center gap-2 h-28 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm hover:shadow-md active:scale-[0.97] active:bg-surface-variant transition-all duration-200"
            >
              <span className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline-md text-headline-md">
                {w.full_name.charAt(0)}
              </span>
              <span className="font-body-md text-body-md text-on-surface text-center px-2">
                {w.full_name}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface text-on-surface h-dvh w-screen flex flex-col items-center justify-center overflow-hidden antialiased select-none animate-fade-in">
      <AuthHeader
        title="MI ENCEBOLLADO"
        onBack={() => {
          setSelected(null);
          setPin("");
          setError(null);
        }}
      />

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-md px-margin-mobile mt-touch-target-min pb-24">
        <div className="text-center mb-stack-lg">
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-stack-sm">
            Hola, {selected.full_name.split(" ")[0]}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {error ?? "Ingresa tu PIN para comenzar tu turno"}
          </p>
        </div>

        <div className="flex gap-4 mb-stack-lg h-12 items-center justify-center w-full">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border transition-all ${
                i < pin.length
                  ? "bg-primary border-primary scale-125"
                  : "bg-surface-container-high border-outline-variant"
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-gutter w-full max-w-[320px]">
          {KEYS.map((key) =>
            key === "CLR" ? (
              <button
                key={key}
                onClick={() => press(key)}
                className="aspect-square rounded-lg bg-surface-container border border-surface-variant text-on-surface font-label-caps text-label-caps flex items-center justify-center active:scale-90 active:bg-surface-variant transition-all duration-150"
              >
                CLR
              </button>
            ) : key === "DEL" ? (
              <button
                key={key}
                onClick={() => press(key)}
                className="aspect-square rounded-lg bg-primary text-on-primary flex items-center justify-center active:scale-90 active:bg-on-primary-fixed-variant transition-all duration-150 shadow-md"
              >
                <Icon name="backspace" />
              </button>
            ) : (
              <button
                key={key}
                onClick={() => press(key)}
                className="aspect-square rounded-lg bg-surface-container-lowest border border-surface-variant text-on-surface font-numeric-pin text-numeric-pin flex items-center justify-center active:scale-90 active:bg-surface-variant transition-all duration-150 shadow-sm"
              >
                {key}
              </button>
            ),
          )}
        </div>
      </main>
    </div>
  );
}
