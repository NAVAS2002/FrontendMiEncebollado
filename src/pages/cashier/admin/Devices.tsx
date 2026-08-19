import { useEffect, useState } from "react";
import { createDevicePairing, listDevices, revokeDevice } from "../../../api/auth";
import { ApiError } from "../../../api/client";
import type { DeviceOut } from "../../../api/types";
import { CashierShell } from "../../../components/CashierShell";
import { Icon } from "../../../components/Icon";
import { Loading } from "../../../components/Loading";

export default function Devices() {
  const [devices, setDevices] = useState<DeviceOut[] | null>(null);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    listDevices()
      .then(setDevices)
      .catch(() => setError("No se pudieron cargar los dispositivos."));
  }

  useEffect(load, []);

  async function create() {
    if (!label.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createDevicePairing(label.trim());
      setLabel("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el emparejamiento.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm("¿Revocar este dispositivo? El celular tendrá que emparejarse de nuevo.")) return;
    await revokeDevice(id);
    load();
  }

  return (
    <CashierShell title="Dispositivos de mesero">
      <div className="max-w-2xl mx-auto p-margin-mobile flex flex-col gap-stack-lg">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-sm">
          <h2 className="font-headline-md text-headline-md">Nuevo emparejamiento</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Genera un código de un solo uso para vincular el celular de un mesero.
          </p>
          <div className="flex gap-stack-sm">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej. Celular de María"
              className="flex-1 h-12 rounded-lg border border-outline-variant bg-surface px-4 font-body-md text-body-md outline-none focus:ring-2 focus:ring-tertiary"
            />
            <button
              onClick={create}
              disabled={busy || !label.trim()}
              className="h-12 px-6 rounded-full bg-tertiary text-on-tertiary font-headline-md text-headline-md disabled:opacity-50"
            >
              Generar
            </button>
          </div>
          {error && <p className="text-error font-body-md text-sm">{error}</p>}
        </div>

        {!devices && <Loading label="Cargando dispositivos…" />}
        {devices && (
          <div className="flex flex-col gap-stack-sm">
            {devices.length === 0 && (
              <p className="font-body-md text-on-surface-variant text-center py-8">Sin dispositivos aún.</p>
            )}
            {devices.map((d) => (
              <div
                key={d.id}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex items-center justify-between"
              >
                <div>
                  <p className="font-body-md text-body-md font-medium">{d.label}</p>
                  {d.pairing_code && !d.is_revoked && (
                    <p className="font-numeric-pin text-[18px] text-primary tracking-widest">{d.pairing_code}</p>
                  )}
                  <p className="font-label-caps text-label-caps text-on-surface-variant">
                    {d.is_revoked ? "Revocado" : d.is_paired ? "Emparejado" : "Código pendiente de usar"}
                  </p>
                </div>
                {!d.is_revoked && (
                  <button onClick={() => revoke(d.id)} className="text-error flex items-center gap-1">
                    <Icon name="link_off" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </CashierShell>
  );
}
