import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { redeemDevicePairing } from "../../api/auth";
import { ApiError } from "../../api/client";
import { setDeviceId } from "../../lib/device";
import { AuthHeader } from "../../components/AuthHeader";
import { Icon } from "../../components/Icon";

export default function DevicePairing() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const deviceId = await redeemDevicePairing(code.trim().toUpperCase());
      setDeviceId(deviceId);
      navigate("/mesero/login", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.code === "NOT_FOUND"
            ? "Código no encontrado. Revisa que esté bien escrito."
            : err.code === "DEVICE_ALREADY_PAIRED"
              ? "Ese código ya fue usado en otro celular."
              : err.message,
        );
      } else {
        setError("No se pudo conectar con el servidor.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-surface flex flex-col items-center justify-center px-margin-mobile animate-fade-in">
      <AuthHeader title="MI ENCEBOLLADO" onBack={() => navigate("/")} />
      <Icon name="phonelink_lock" className="text-4xl text-primary mb-stack-md mt-16" />
      <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-center mb-stack-sm">
        Emparejar este celular
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-xs mb-stack-lg">
        Pídele al administrador el código de 8 caracteres generado para este dispositivo.
      </p>

      <form onSubmit={submit} className="w-full max-w-xs flex flex-col gap-stack-md">
        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={16}
          placeholder="XXXXXXXX"
          className="w-full h-14 rounded-lg border border-outline-variant bg-surface-container-lowest text-center font-numeric-pin text-numeric-pin tracking-[0.3em] uppercase focus:ring-2 focus:ring-primary focus:border-primary outline-none"
        />
        {error && <p className="text-error font-body-md text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="w-full h-14 rounded-full bg-primary text-on-primary font-headline-md text-headline-md disabled:opacity-50 active:scale-[0.98] transition-all"
        >
          {busy ? "Emparejando…" : "Emparejar dispositivo"}
        </button>
      </form>
    </div>
  );
}
