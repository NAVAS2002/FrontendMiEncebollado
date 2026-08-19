import { useEffect, useState } from "react";
import { getSettings, updateSettings, type SettingsOut } from "../../../api/settings";
import { ApiError } from "../../../api/client";
import { CashierShell } from "../../../components/CashierShell";
import { Icon } from "../../../components/Icon";
import { Loading } from "../../../components/Loading";
import { parseMoneyInput } from "../../../lib/money";

export default function Settings() {
  const [settings, setSettings] = useState<SettingsOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function load() {
    getSettings()
      .then(setSettings)
      .catch(() => setError("No se pudo cargar la configuración."));
  }

  useEffect(load, []);

  async function save(patch: Partial<SettingsOut>) {
    setError(null);
    setSaved(false);
    try {
      const updated = await updateSettings(patch);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el cambio.");
    }
  }

  if (!settings) return <Loading label="Cargando configuración…" />;

  return (
    <CashierShell title="Configuración">
      <div className="max-w-2xl mx-auto p-margin-mobile flex flex-col gap-stack-lg">
        {error && <p className="text-error font-body-md text-center">{error}</p>}
        {saved && (
          <p className="text-success font-body-md text-center flex items-center justify-center gap-1">
            <Icon name="check_circle" filled className="text-[18px]" /> Guardado
          </p>
        )}

        <TaxCard settings={settings} onSave={save} />
        <SurchargeCard settings={settings} onSave={save} />
        <TransferReceiptCard settings={settings} onSave={save} />
        <BusinessInfoCard settings={settings} onSave={save} />
      </div>
    </CashierShell>
  );
}

function TaxCard({
  settings,
  onSave,
}: {
  settings: SettingsOut;
  onSave: (patch: Partial<SettingsOut>) => Promise<void>;
}) {
  const [ratePct, setRatePct] = useState(String(Number(settings.tax_rate) * 100));
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await onSave({ tax_enabled: !settings.tax_enabled });
    setBusy(false);
  }

  async function saveRate() {
    const pct = Number(ratePct);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) return;
    setBusy(true);
    await onSave({ tax_rate: (pct / 100).toFixed(4) });
    setBusy(false);
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-md">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline-md text-headline-md">Impuesto (IVA)</h2>
          <p className="font-body-md text-[13px] text-on-surface-variant">
            Cóbralo o desactívalo para todos los pedidos nuevos.
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          className="flex items-center gap-1 disabled:opacity-50"
          aria-label="Activar o desactivar IVA"
        >
          <Icon
            name={settings.tax_enabled ? "toggle_on" : "toggle_off"}
            className={`text-[36px] ${settings.tax_enabled ? "text-tertiary" : "text-on-surface-variant"}`}
          />
        </button>
      </div>
      {settings.tax_enabled && (
        <div className="flex items-end gap-stack-sm">
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">
              Tasa
            </label>
            <div className="flex items-center gap-1">
              <input
                inputMode="decimal"
                value={ratePct}
                onChange={(e) => setRatePct(e.target.value)}
                className="w-20 h-10 rounded-lg border border-outline-variant bg-surface px-3 font-numeric-pin text-[16px]"
              />
              <span className="font-body-md text-body-md text-on-surface-variant">%</span>
            </div>
          </div>
          <button
            onClick={saveRate}
            disabled={busy}
            className="h-10 px-4 rounded-full bg-tertiary text-on-tertiary font-label-caps text-label-caps disabled:opacity-50"
          >
            Guardar tasa
          </button>
        </div>
      )}
      {!settings.tax_enabled && (
        <p className="font-body-md text-[13px] text-warning bg-warning-container rounded-lg px-3 py-2">
          Los pedidos nuevos se cobran sin IVA. La tasa configurada ({(Number(settings.tax_rate) * 100).toFixed(0)}%) se
          conserva para cuando lo reactives.
        </p>
      )}
    </div>
  );
}

function SurchargeCard({
  settings,
  onSave,
}: {
  settings: SettingsOut;
  onSave: (patch: Partial<SettingsOut>) => Promise<void>;
}) {
  const [amount, setAmount] = useState(settings.takeaway_surcharge);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await onSave({ takeaway_surcharge_enabled: !settings.takeaway_surcharge_enabled });
    setBusy(false);
  }

  async function saveAmount() {
    const parsed = parseMoneyInput(amount);
    if (parsed === null) return;
    setBusy(true);
    await onSave({ takeaway_surcharge: parsed });
    setBusy(false);
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-md">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline-md text-headline-md">Cargo por llevar (tarrina)</h2>
          <p className="font-body-md text-[13px] text-on-surface-variant">
            Se cobra por cada producto de comida marcado "para llevar".
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          className="flex items-center gap-1 disabled:opacity-50"
          aria-label="Activar o desactivar cargo por llevar"
        >
          <Icon
            name={settings.takeaway_surcharge_enabled ? "toggle_on" : "toggle_off"}
            className={`text-[36px] ${
              settings.takeaway_surcharge_enabled ? "text-tertiary" : "text-on-surface-variant"
            }`}
          />
        </button>
      </div>
      {settings.takeaway_surcharge_enabled && (
        <div className="flex items-end gap-stack-sm">
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">
              Monto por unidad
            </label>
            <div className="flex items-center gap-1">
              <span className="font-body-md text-body-md text-on-surface-variant">$</span>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-20 h-10 rounded-lg border border-outline-variant bg-surface px-3 font-numeric-pin text-[16px]"
              />
            </div>
          </div>
          <button
            onClick={saveAmount}
            disabled={busy}
            className="h-10 px-4 rounded-full bg-tertiary text-on-tertiary font-label-caps text-label-caps disabled:opacity-50"
          >
            Guardar monto
          </button>
        </div>
      )}
    </div>
  );
}

function TransferReceiptCard({
  settings,
  onSave,
}: {
  settings: SettingsOut;
  onSave: (patch: Partial<SettingsOut>) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await onSave({ require_transfer_receipt: !settings.require_transfer_receipt });
    setBusy(false);
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-md">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline-md text-headline-md">Comprobante de transferencia</h2>
          <p className="font-body-md text-[13px] text-on-surface-variant">
            Exige adjuntar una foto del comprobante al registrar un pago por transferencia.
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          className="flex items-center gap-1 disabled:opacity-50"
          aria-label="Activar o desactivar comprobante obligatorio"
        >
          <Icon
            name={settings.require_transfer_receipt ? "toggle_on" : "toggle_off"}
            className={`text-[36px] ${
              settings.require_transfer_receipt ? "text-tertiary" : "text-on-surface-variant"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

function BusinessInfoCard({
  settings,
  onSave,
}: {
  settings: SettingsOut;
  onSave: (patch: Partial<SettingsOut>) => Promise<void>;
}) {
  const [name, setName] = useState(settings.name);
  const [taxId, setTaxId] = useState(settings.tax_id ?? "");
  const [address, setAddress] = useState(settings.address);
  const [footer, setFooter] = useState(settings.ticket_footer);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await onSave({ name: name.trim(), tax_id: taxId.trim(), address: address.trim(), ticket_footer: footer.trim() });
    setBusy(false);
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-md">
      <div>
        <h2 className="font-headline-md text-headline-md">Datos del negocio</h2>
        <p className="font-body-md text-[13px] text-on-surface-variant">
          Salen impresos en el ticket del cliente y en el reporte de cierre.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        <div>
          <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">
            Nombre del negocio
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md"
          />
        </div>
        <div>
          <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">
            RUC / identificación tributaria
          </label>
          <input
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            className="w-full h-10 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md"
          />
        </div>
      </div>
      <div>
        <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Dirección</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full h-10 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md"
        />
      </div>
      <div>
        <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">
          Pie de página del ticket
        </label>
        <input
          value={footer}
          onChange={(e) => setFooter(e.target.value)}
          placeholder="Ej. Síguenos en @miencebollado"
          className="w-full h-10 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md"
        />
      </div>
      <button
        onClick={save}
        disabled={busy || !name.trim()}
        className="self-start h-10 px-4 rounded-full bg-tertiary text-on-tertiary font-label-caps text-label-caps disabled:opacity-50"
      >
        Guardar datos del negocio
      </button>
    </div>
  );
}
