import { useState } from "react";
import {
  addModifier,
  addModifierGroup,
  deleteModifier,
  deleteModifierGroup,
  setModifierStock,
  setProductStock,
  updateModifier,
} from "../../../api/catalog";
import { ApiError } from "../../../api/client";
import type { ModifierGroupOut, ModifierOut, ProductOut } from "../../../api/types";
import { Icon } from "../../../components/Icon";
import { formatMoney, parseMoneyInput } from "../../../lib/money";

export function ProductOptionsPanel({
  product,
  onClose,
  onChanged,
}: {
  product: ProductOut;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[60] bg-surface flex flex-col">
      <header className="flex items-center justify-between px-margin-mobile h-touch-target-min border-b border-outline-variant shrink-0">
        <button onClick={onClose} className="h-touch-target-min w-touch-target-min flex items-center justify-center">
          <Icon name="close" />
        </button>
        <h2 className="font-headline-md text-headline-md truncate px-2">{product.name}</h2>
        <span className="w-touch-target-min" />
      </header>

      <div className="flex-1 overflow-y-auto p-margin-mobile max-w-2xl w-full mx-auto flex flex-col gap-stack-lg">
        {error && <p className="text-error font-body-md text-sm text-center">{error}</p>}

        <ProductStockCard product={product} onError={setError} onChanged={onChanged} />

        <div>
          <h3 className="font-headline-md text-headline-md mb-stack-sm">Opciones (tamaño, sabor, etc.)</h3>
          <div className="flex flex-col gap-stack-sm">
            {product.modifier_groups.map((group) => (
              <ModifierGroupCard
                key={group.id}
                group={group}
                onError={setError}
                onChanged={onChanged}
              />
            ))}
            {product.modifier_groups.length === 0 && (
              <p className="font-body-md text-body-md text-on-surface-variant">
                Este producto no tiene opciones todavía.
              </p>
            )}
          </div>
        </div>

        <NewGroupCard productId={product.id} onError={setError} onChanged={onChanged} />
      </div>
    </div>
  );
}

function ProductStockCard({
  product,
  onError,
  onChanged,
}: {
  product: ProductOut;
  onError: (msg: string) => void;
  onChanged: () => void;
}) {
  const [track, setTrack] = useState(product.track_inventory);
  const [quantity, setQuantity] = useState(String(product.stock_quantity));
  const [busy, setBusy] = useState(false);

  async function save() {
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 0) {
      onError("Ingresa una cantidad válida.");
      return;
    }
    setBusy(true);
    try {
      await setProductStock(product.id, qty, track);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo actualizar el inventario.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-sm">
      <h3 className="font-headline-md text-headline-md">Inventario del producto</h3>
      <label className="flex items-center gap-2 font-body-md text-body-md text-on-surface-variant">
        <input type="checkbox" checked={track} onChange={(e) => setTrack(e.target.checked)} />
        Rastrear cuánto queda de "{product.name}"
      </label>
      {track && (
        <div className="flex items-center gap-stack-sm">
          <input
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-28 h-10 rounded-lg border border-outline-variant bg-surface px-3 font-numeric-pin text-[16px]"
          />
          <span className="font-body-md text-[13px] text-on-surface-variant">unidades en existencia</span>
        </div>
      )}
      <button
        onClick={save}
        disabled={busy}
        className="self-start h-10 px-4 rounded-full bg-tertiary text-on-tertiary font-label-caps text-label-caps disabled:opacity-50"
      >
        Guardar inventario
      </button>
    </div>
  );
}

function ModifierGroupCard({
  group,
  onError,
  onChanged,
}: {
  group: ModifierGroupOut;
  onError: (msg: string) => void;
  onChanged: () => void;
}) {
  async function removeGroup() {
    if (!confirm(`¿Eliminar el grupo de opciones "${group.name}" y todas sus opciones?`)) return;
    try {
      await deleteModifierGroup(group.id);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo eliminar el grupo.");
    }
  }

  return (
    <div className="border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-sm bg-surface-container-lowest">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-body-md text-body-md font-medium">{group.name}</p>
          <p className="font-label-caps text-label-caps text-on-surface-variant">
            {group.min_select > 0 ? `Obligatorio · máx ${group.max_select}` : `Opcional · máx ${group.max_select}`}
          </p>
        </div>
        <button onClick={removeGroup} className="text-error">
          <Icon name="delete" className="text-[18px]" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {group.modifiers.map((m) => (
          <ModifierRow key={m.id} modifier={m} onError={onError} onChanged={onChanged} />
        ))}
      </div>

      <AddModifierForm groupId={group.id} onError={onError} onChanged={onChanged} />
    </div>
  );
}

function ModifierRow({
  modifier,
  onError,
  onChanged,
}: {
  modifier: ModifierOut;
  onError: (msg: string) => void;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(modifier.name);
  const [price, setPrice] = useState(modifier.price_delta);
  const [track, setTrack] = useState(modifier.track_inventory);
  const [quantity, setQuantity] = useState(String(modifier.stock_quantity));
  const [busy, setBusy] = useState(false);

  async function save() {
    const parsedPrice = parseMoneyInput(price) ?? "0";
    const qty = Number(quantity);
    setBusy(true);
    try {
      await updateModifier(modifier.id, { name: name.trim(), price_delta: parsedPrice });
      await setModifierStock(modifier.id, Number.isInteger(qty) && qty >= 0 ? qty : 0, track);
      setEditing(false);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo actualizar la opción.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`¿Eliminar la opción "${modifier.name}"?`)) return;
    try {
      await deleteModifier(modifier.id);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo eliminar la opción.");
    }
  }

  if (editing) {
    return (
      <div className="border border-outline-variant rounded-lg p-stack-sm flex flex-col gap-2 bg-surface">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 h-9 rounded border border-outline-variant px-2 font-body-md text-body-md"
          />
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="+0.00"
            inputMode="decimal"
            className="w-24 h-9 rounded border border-outline-variant px-2 font-body-md text-body-md"
          />
        </div>
        <label className="flex items-center gap-2 font-body-md text-[13px] text-on-surface-variant">
          <input type="checkbox" checked={track} onChange={(e) => setTrack(e.target.checked)} />
          Rastrear inventario
        </label>
        {track && (
          <input
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-28 h-9 rounded border border-outline-variant px-2 font-numeric-pin text-[14px]"
          />
        )}
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditing(false)} className="font-label-caps text-label-caps text-on-surface-variant">
            Cancelar
          </button>
          <button onClick={save} disabled={busy} className="font-label-caps text-label-caps text-tertiary">
            Guardar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border border-outline-variant rounded-lg px-stack-sm py-2">
      <div>
        <span className="font-body-md text-body-md">{modifier.name}</span>
        {Number(modifier.price_delta) !== 0 && (
          <span className="font-numeric-pin text-[13px] text-primary ml-2">
            +{formatMoney(modifier.price_delta)}
          </span>
        )}
        {modifier.track_inventory && (
          <p className="font-label-caps text-[11px] text-on-surface-variant">
            Quedan {modifier.stock_quantity} {!modifier.is_available && "· agotado"}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => setEditing(true)} className="text-on-surface-variant">
          <Icon name="edit" className="text-[15px]" />
        </button>
        <button onClick={remove} className="text-error">
          <Icon name="delete" className="text-[15px]" />
        </button>
      </div>
    </div>
  );
}

function AddModifierForm({
  groupId,
  onError,
  onChanged,
}: {
  groupId: string;
  onError: (msg: string) => void;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("0.00");
  const [track, setTrack] = useState(false);
  const [quantity, setQuantity] = useState("0");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await addModifier(groupId, {
        name: name.trim(),
        price_delta: parseMoneyInput(price) ?? "0",
        track_inventory: track,
        stock_quantity: track ? Number(quantity) || 0 : 0,
      });
      setName("");
      setPrice("0.00");
      setTrack(false);
      setQuantity("0");
      setOpen(false);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo agregar la opción.");
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
        <Icon name="add" className="text-[16px]" /> Agregar opción
      </button>
    );
  }

  return (
    <div className="border border-outline-variant rounded-lg p-stack-sm flex flex-col gap-2 bg-surface">
      <div className="flex gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Mora, Grande…"
          className="flex-1 h-9 rounded border border-outline-variant px-2 font-body-md text-body-md"
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="+0.00"
          inputMode="decimal"
          className="w-24 h-9 rounded border border-outline-variant px-2 font-body-md text-body-md"
        />
      </div>
      <label className="flex items-center gap-2 font-body-md text-[13px] text-on-surface-variant">
        <input type="checkbox" checked={track} onChange={(e) => setTrack(e.target.checked)} />
        Rastrear inventario de esta opción
      </label>
      {track && (
        <input
          type="number"
          min={0}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-28 h-9 rounded border border-outline-variant px-2 font-numeric-pin text-[14px]"
        />
      )}
      <div className="flex gap-2 justify-end">
        <button onClick={() => setOpen(false)} className="font-label-caps text-label-caps text-on-surface-variant">
          Cancelar
        </button>
        <button onClick={submit} disabled={busy || !name.trim()} className="font-label-caps text-label-caps text-tertiary">
          Agregar
        </button>
      </div>
    </div>
  );
}

function NewGroupCard({
  productId,
  onError,
  onChanged,
}: {
  productId: string;
  onError: (msg: string) => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [required, setRequired] = useState(true);
  const [maxSelect, setMaxSelect] = useState("1");
  const [options, setOptions] = useState([{ name: "", price: "0.00" }]);
  const [busy, setBusy] = useState(false);

  function updateOption(index: number, field: "name" | "price", value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, [field]: value } : o)));
  }

  async function submit() {
    const validOptions = options.filter((o) => o.name.trim());
    if (!name.trim() || validOptions.length === 0) {
      onError("El grupo necesita un nombre y al menos una opción.");
      return;
    }
    setBusy(true);
    try {
      await addModifierGroup(productId, {
        name: name.trim(),
        min_select: required ? 1 : 0,
        max_select: Number(maxSelect) || 1,
        modifiers: validOptions.map((o) => ({
          name: o.name.trim(),
          price_delta: parseMoneyInput(o.price) ?? "0",
        })),
      });
      setName("");
      setOptions([{ name: "", price: "0.00" }]);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo crear el grupo de opciones.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-sm">
      <h3 className="font-headline-md text-headline-md">Nuevo grupo de opciones</h3>
      <p className="font-body-md text-[13px] text-on-surface-variant">
        Ej. "Tamaño" con Grande/Pequeño, o "Sabor" con Mora/Naranja/Mango.
      </p>
      <div className="flex flex-wrap gap-stack-sm items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Nombre del grupo</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Sabor"
            className="w-full h-10 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md"
          />
        </div>
        <label className="flex items-center gap-2 font-body-md text-[13px] text-on-surface-variant h-10">
          <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
          Obligatorio
        </label>
        <div>
          <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Máx. opciones</label>
          <input
            type="number"
            min={1}
            value={maxSelect}
            onChange={(e) => setMaxSelect(e.target.value)}
            className="w-20 h-10 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={opt.name}
              onChange={(e) => updateOption(i, "name", e.target.value)}
              placeholder={`Opción ${i + 1}`}
              className="flex-1 h-9 rounded border border-outline-variant px-2 font-body-md text-body-md"
            />
            <input
              value={opt.price}
              onChange={(e) => updateOption(i, "price", e.target.value)}
              placeholder="+0.00"
              inputMode="decimal"
              className="w-24 h-9 rounded border border-outline-variant px-2 font-body-md text-body-md"
            />
          </div>
        ))}
        <button
          onClick={() => setOptions((prev) => [...prev, { name: "", price: "0.00" }])}
          className="self-start font-label-caps text-label-caps text-tertiary flex items-center gap-1"
        >
          <Icon name="add" className="text-[16px]" /> Otra opción
        </button>
      </div>

      <button
        onClick={submit}
        disabled={busy || !name.trim()}
        className="self-start h-10 px-4 rounded-full bg-tertiary text-on-tertiary font-label-caps text-label-caps disabled:opacity-50"
      >
        Crear grupo
      </button>
    </div>
  );
}
