import { useEffect, useState } from "react";
import {
  createTable,
  createZone,
  deleteTable,
  deleteZone,
  listTables,
  listZones,
  moveTable,
  renameZone,
  setZoneEnabled,
  updateTable,
} from "../../../api/floor";
import { ApiError } from "../../../api/client";
import type { TableOut, ZoneOut } from "../../../api/types";
import { CashierShell } from "../../../components/CashierShell";
import { FloorPlanCanvas } from "../../../components/FloorPlanCanvas";
import { Icon } from "../../../components/Icon";
import { Loading } from "../../../components/Loading";

export default function Floor() {
  const [zones, setZones] = useState<ZoneOut[] | null>(null);
  const [tables, setTables] = useState<TableOut[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newZoneName, setNewZoneName] = useState("");

  function load() {
    Promise.all([listZones(), listTables()])
      .then(([z, t]) => {
        setZones(z.sort((a, b) => a.sort_order - b.sort_order));
        setTables(t);
      })
      .catch(() => setError("No se pudieron cargar las secciones."));
  }

  useEffect(load, []);

  async function addZone() {
    if (!newZoneName.trim()) return;
    try {
      await createZone(newZoneName.trim(), zones?.length ?? 0);
      setNewZoneName("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la sección.");
    }
  }

  return (
    <CashierShell title="Secciones y mesas">
      <div className="max-w-3xl mx-auto p-margin-mobile flex flex-col gap-stack-lg">
        {error && <p className="text-error font-body-md text-center">{error}</p>}

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex gap-stack-sm items-end">
          <div className="flex-1">
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">
              Nueva sección
            </label>
            <input
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              placeholder="Ej. Segundo piso"
              className="w-full h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md outline-none focus:ring-2 focus:ring-tertiary"
            />
          </div>
          <button
            onClick={addZone}
            disabled={!newZoneName.trim()}
            className="h-11 px-4 rounded-full bg-tertiary text-on-tertiary font-label-caps text-label-caps disabled:opacity-50"
          >
            Crear
          </button>
        </div>

        {!zones && <Loading label="Cargando secciones…" />}
        {zones?.map((zone) => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            tables={tables.filter((t) => t.zone_id === zone.id)}
            allZones={zones}
            onError={setError}
            onChanged={load}
          />
        ))}

        {zones && (
          <NewTableCard zones={zones} onError={setError} onChanged={load} />
        )}
      </div>
    </CashierShell>
  );
}

function ZoneCard({
  zone,
  tables,
  allZones,
  onError,
  onChanged,
}: {
  zone: ZoneOut;
  tables: TableOut[];
  allZones: ZoneOut[];
  onError: (msg: string) => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState(zone.name);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [enabledBusy, setEnabledBusy] = useState(false);

  async function save() {
    if (!name.trim() || name === zone.name) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await renameZone(zone.id, name.trim(), zone.sort_order);
      setEditing(false);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo renombrar la sección.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleEnabled() {
    setEnabledBusy(true);
    try {
      await setZoneEnabled(zone.id, !zone.is_enabled);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo cambiar la sección.");
    } finally {
      setEnabledBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`¿Eliminar la sección "${zone.name}"?`)) return;
    try {
      await deleteZone(zone.id);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo eliminar la sección.");
    }
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-sm">
      <div className="flex items-center justify-between gap-stack-sm">
        {editing ? (
          <div className="flex-1 flex gap-stack-sm">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              className="flex-1 h-10 rounded-lg border border-outline-variant bg-surface px-3 font-headline-md text-headline-md outline-none focus:ring-2 focus:ring-tertiary"
            />
            <button
              onClick={save}
              disabled={busy}
              className="h-10 px-3 rounded-full bg-tertiary text-on-tertiary font-label-caps text-label-caps"
            >
              Guardar
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2
              className={`font-headline-md text-headline-md ${
                zone.is_enabled ? "text-on-surface" : "text-on-surface-variant"
              }`}
            >
              {zone.name}
            </h2>
            {!zone.is_enabled && (
              <span className="font-label-caps text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                Apagada
              </span>
            )}
          </div>
        )}
        {!editing && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleEnabled}
              disabled={enabledBusy}
              className={`h-9 w-9 flex items-center justify-center rounded-full disabled:opacity-50 ${
                zone.is_enabled ? "text-tertiary" : "text-on-surface-variant"
              }`}
              aria-label={zone.is_enabled ? "Apagar sección" : "Encender sección"}
              title={zone.is_enabled ? "Apagar sección" : "Encender sección"}
            >
              <Icon name={zone.is_enabled ? "toggle_on" : "toggle_off"} className="text-[22px]" />
            </button>
            <button
              onClick={() => setEditing(true)}
              className="h-9 w-9 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant rounded-full"
              aria-label="Renombrar"
            >
              <Icon name="edit" className="text-[18px]" />
            </button>
            <button
              onClick={remove}
              className="h-9 w-9 flex items-center justify-center text-error hover:bg-error-container rounded-full"
              aria-label="Eliminar sección"
            >
              <Icon name="delete" className="text-[18px]" />
            </button>
          </div>
        )}
      </div>

      {tables.length > 0 && (
        <div>
          <p className="font-label-caps text-label-caps text-on-surface-variant mb-1 flex items-center gap-1">
            <Icon name="drag_pan" className="text-[14px]" /> Arrastra cada mesa a su lugar real
          </p>
          <FloorPlanCanvas
            tables={tables}
            editable
            onMove={(tableId, posX, posY) => {
              moveTable(tableId, posX, posY)
                .then(onChanged)
                .catch((err) =>
                  onError(err instanceof ApiError ? err.message : "No se pudo mover la mesa."),
                );
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
        {tables.map((t) => (
          <TableRow key={t.id} table={t} zones={allZones} onError={onError} onChanged={onChanged} />
        ))}
        {tables.length === 0 && (
          <p className="font-body-md text-body-md text-on-surface-variant sm:col-span-2">
            Sin mesas en esta sección.
          </p>
        )}
      </div>

      <AddTableInline zoneId={zone.id} onError={onError} onChanged={onChanged} />
    </div>
  );
}

function AddTableInline({
  zoneId,
  onError,
  onChanged,
}: {
  zoneId: string;
  onError: (msg: string) => void;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [seats, setSeats] = useState("4");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!code.trim()) return;
    setBusy(true);
    try {
      await createTable({
        code: code.trim(),
        seats: Number(seats) || 4,
        zone_id: zoneId,
      });
      setCode("");
      setOpen(false);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo crear la mesa.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="self-start flex items-center gap-1 font-label-caps text-label-caps text-tertiary"
      >
        <Icon name="add" className="text-[16px]" /> Agregar mesa a esta sección
      </button>
    );
  }

  return (
    <div className="flex flex-wrap gap-stack-sm items-end">
      <div>
        <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Código</label>
        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="M11"
          className="w-24 h-10 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md outline-none focus:ring-2 focus:ring-tertiary"
        />
      </div>
      <div>
        <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Puestos</label>
        <input
          type="number"
          min={1}
          value={seats}
          onChange={(e) => setSeats(e.target.value)}
          className="w-20 h-10 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md outline-none focus:ring-2 focus:ring-tertiary"
        />
      </div>
      <button
        onClick={submit}
        disabled={busy || !code.trim()}
        className="h-10 px-4 rounded-full bg-tertiary text-on-tertiary font-label-caps text-label-caps disabled:opacity-50"
      >
        Crear
      </button>
      <button
        onClick={() => setOpen(false)}
        className="h-10 px-3 font-label-caps text-label-caps text-on-surface-variant"
      >
        Cancelar
      </button>
    </div>
  );
}

function TableRow({
  table,
  zones,
  onError,
  onChanged,
}: {
  table: TableOut;
  zones: ZoneOut[];
  onError: (msg: string) => void;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [code, setCode] = useState(table.code);
  const [seats, setSeats] = useState(String(table.seats));
  const [zoneId, setZoneId] = useState(table.zone_id ?? "");
  const [enabledBusy, setEnabledBusy] = useState(false);

  async function save() {
    try {
      await updateTable(table.id, {
        code: code.trim() || undefined,
        seats: Number(seats) || undefined,
        zone_id: zoneId || undefined,
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo actualizar la mesa.");
    }
  }

  async function toggleEnabled() {
    setEnabledBusy(true);
    try {
      await updateTable(table.id, { is_enabled: !table.is_enabled });
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo cambiar la mesa.");
    } finally {
      setEnabledBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`¿Eliminar la mesa ${table.code}?`)) return;
    try {
      await deleteTable(table.id);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo eliminar la mesa.");
    }
  }

  if (editing) {
    return (
      <div className="border border-outline-variant rounded-lg p-stack-sm flex flex-col gap-2 bg-surface">
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-20 h-9 rounded border border-outline-variant px-2 font-body-md text-body-md"
          />
          <input
            type="number"
            min={1}
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
            className="w-16 h-9 rounded border border-outline-variant px-2 font-body-md text-body-md"
          />
          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="flex-1 h-9 rounded border border-outline-variant px-2 font-body-md text-body-md"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditing(false)} className="font-label-caps text-label-caps text-on-surface-variant">
            Cancelar
          </button>
          <button onClick={save} className="font-label-caps text-label-caps text-tertiary">
            Guardar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-outline-variant rounded-lg px-stack-sm py-2 flex items-center justify-between">
      <div>
        <span
          className={`font-body-md text-body-md font-medium ${
            table.is_enabled ? "" : "text-on-surface-variant"
          }`}
        >
          {table.code}
        </span>
        <span className="font-body-md text-[13px] text-on-surface-variant ml-2">
          {table.seats} puestos · {table.status}
        </span>
        {!table.is_enabled && (
          <span className="ml-2 font-label-caps text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
            Apagada
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={toggleEnabled}
          disabled={enabledBusy}
          className={`h-8 w-8 flex items-center justify-center rounded-full disabled:opacity-50 ${
            table.is_enabled ? "text-tertiary" : "text-on-surface-variant"
          }`}
          aria-label={table.is_enabled ? "Apagar mesa" : "Encender mesa"}
          title={table.is_enabled ? "Apagar mesa" : "Encender mesa"}
        >
          <Icon name={table.is_enabled ? "toggle_on" : "toggle_off"} className="text-[20px]" />
        </button>
        <button onClick={() => setEditing(true)} className="text-on-surface-variant">
          <Icon name="edit" className="text-[16px]" />
        </button>
        <button onClick={remove} className="text-error">
          <Icon name="delete" className="text-[16px]" />
        </button>
      </div>
    </div>
  );
}

function NewTableCard({
  zones,
  onError,
  onChanged,
}: {
  zones: ZoneOut[];
  onError: (msg: string) => void;
  onChanged: () => void;
}) {
  const [code, setCode] = useState("");
  const [seats, setSeats] = useState("4");
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!code.trim()) return;
    setBusy(true);
    try {
      await createTable({
        code: code.trim(),
        seats: Number(seats) || 4,
        zone_id: zoneId || null,
      });
      setCode("");
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo crear la mesa.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-sm">
      <h2 className="font-headline-md text-headline-md">Nueva mesa</h2>
      <div className="flex flex-wrap gap-stack-sm items-end">
        <div>
          <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Código</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="M11"
            className="w-24 h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md outline-none focus:ring-2 focus:ring-tertiary"
          />
        </div>
        <div>
          <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Puestos</label>
          <input
            type="number"
            min={1}
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
            className="w-20 h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md outline-none focus:ring-2 focus:ring-tertiary"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Sección</label>
          <select
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
            className="w-full h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md outline-none focus:ring-2 focus:ring-tertiary"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={submit}
          disabled={busy || !code.trim()}
          className="h-11 px-4 rounded-full bg-tertiary text-on-tertiary font-label-caps text-label-caps disabled:opacity-50"
        >
          Crear mesa
        </button>
      </div>
    </div>
  );
}
