import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithPassword } from "../../api/auth";
import { ApiError } from "../../api/client";
import { AuthHeader } from "../../components/AuthHeader";
import { Icon } from "../../components/Icon";

export default function CashierLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await loginWithPassword(username.trim(), password);
      navigate("/caja/pedidos", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? "Usuario o contraseña incorrectos." : "No se pudo conectar con el servidor.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-surface flex flex-col items-center justify-center px-margin-mobile">
      <AuthHeader title="MI ENCEBOLLADO" onBack={() => navigate("/")} />
      <div className="flex items-center gap-2 text-tertiary mb-stack-lg mt-16">
        <Icon name="point_of_sale" filled className="text-2xl" />
        <h1 className="font-headline-md text-headline-md text-on-surface">Caja y administración</h1>
      </div>

      <form onSubmit={submit} className="w-full max-w-xs flex flex-col gap-stack-md">
        <div>
          <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Usuario</label>
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-12 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-md text-body-md focus:ring-2 focus:ring-tertiary focus:border-tertiary outline-none"
            autoComplete="username"
          />
        </div>
        <div>
          <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 font-body-md text-body-md focus:ring-2 focus:ring-tertiary focus:border-tertiary outline-none"
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-error font-body-md text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={busy || !username || !password}
          className="w-full h-14 rounded-full bg-tertiary text-on-tertiary font-headline-md text-headline-md disabled:opacity-50 active:scale-[0.98] transition-all mt-stack-sm"
        >
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
