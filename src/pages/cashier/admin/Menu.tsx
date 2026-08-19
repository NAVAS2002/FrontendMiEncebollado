import { useEffect, useState } from "react";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  listCategories,
  listProducts,
  renameCategory,
  setProductAvailability,
  updateProduct,
} from "../../../api/catalog";
import { ApiError } from "../../../api/client";
import type { CategoryOut, ProductOut } from "../../../api/types";
import { CashierShell } from "../../../components/CashierShell";
import { Icon } from "../../../components/Icon";
import { Loading } from "../../../components/Loading";
import { formatMoney, parseMoneyInput } from "../../../lib/money";
import { ProductOptionsPanel } from "./ProductOptionsPanel";

export default function Menu() {
  const [categories, setCategories] = useState<CategoryOut[] | null>(null);
  const [products, setProducts] = useState<ProductOut[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [optionsProductId, setOptionsProductId] = useState<string | null>(null);

  function load() {
    Promise.all([listCategories(), listProducts(false)])
      .then(([c, p]) => {
        setCategories(c.sort((a, b) => a.sort_order - b.sort_order));
        setProducts(p);
      })
      .catch(() => setError("No se pudo cargar el catálogo."));
  }

  useEffect(load, []);

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    try {
      await createCategory(newCategoryName.trim(), categories?.length ?? 0);
      setNewCategoryName("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear la categoría.");
    }
  }

  return (
    <CashierShell title="Catálogo">
      <div className="max-w-3xl mx-auto p-margin-mobile flex flex-col gap-stack-lg">
        {error && <p className="text-error font-body-md text-center">{error}</p>}

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex gap-stack-sm items-end">
          <div className="flex-1">
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">
              Nueva categoría
            </label>
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Ej. Postres"
              className="w-full h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md outline-none focus:ring-2 focus:ring-tertiary"
            />
          </div>
          <button
            onClick={addCategory}
            disabled={!newCategoryName.trim()}
            className="h-11 px-4 rounded-full bg-tertiary text-on-tertiary font-label-caps text-label-caps disabled:opacity-50"
          >
            Crear
          </button>
        </div>

        {!categories && <Loading label="Cargando catálogo…" />}
        {categories?.map((cat) => (
          <CategoryCard
            key={cat.id}
            category={cat}
            products={products.filter((p) => p.category_id === cat.id)}
            allCategories={categories}
            onError={setError}
            onChanged={load}
            onOpenOptions={setOptionsProductId}
          />
        ))}

        {categories && categories.length > 0 && (
          <NewProductCard categories={categories} onError={setError} onChanged={load} />
        )}
      </div>

      {optionsProductId &&
        (() => {
          const product = products.find((p) => p.id === optionsProductId);
          if (!product) return null;
          return (
            <ProductOptionsPanel
              product={product}
              onClose={() => setOptionsProductId(null)}
              onChanged={load}
            />
          );
        })()}
    </CashierShell>
  );
}

function CategoryCard({
  category,
  products,
  allCategories,
  onError,
  onChanged,
  onOpenOptions,
}: {
  category: CategoryOut;
  products: ProductOut[];
  allCategories: CategoryOut[];
  onError: (msg: string) => void;
  onChanged: () => void;
  onOpenOptions: (productId: string) => void;
}) {
  const [name, setName] = useState(category.name);
  const [editing, setEditing] = useState(false);

  async function save() {
    if (!name.trim() || name === category.name) {
      setEditing(false);
      return;
    }
    try {
      await renameCategory(category.id, name.trim(), category.sort_order);
      setEditing(false);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo renombrar la categoría.");
    }
  }

  async function remove() {
    if (!confirm(`¿Eliminar la categoría "${category.name}"? Sus productos dejarán de aparecer en el menú.`))
      return;
    try {
      await deleteCategory(category.id);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo eliminar la categoría.");
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
            <button onClick={save} className="h-10 px-3 rounded-full bg-tertiary text-on-tertiary font-label-caps text-label-caps">
              Guardar
            </button>
          </div>
        ) : (
          <h2 className="font-headline-md text-headline-md text-on-surface">{category.name}</h2>
        )}
        {!editing && (
          <div className="flex items-center gap-1 shrink-0">
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
              aria-label="Eliminar categoría"
            >
              <Icon name="delete" className="text-[18px]" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-stack-sm">
        {products.map((p) => (
          <ProductRow
            key={p.id}
            product={p}
            categories={allCategories}
            onError={onError}
            onChanged={onChanged}
            onOpenOptions={() => onOpenOptions(p.id)}
          />
        ))}
        {products.length === 0 && (
          <p className="font-body-md text-body-md text-on-surface-variant">Sin productos en esta categoría.</p>
        )}
      </div>
    </div>
  );
}

function ProductRow({
  product,
  categories,
  onError,
  onChanged,
  onOpenOptions,
}: {
  product: ProductOut;
  categories: CategoryOut[];
  onError: (msg: string) => void;
  onChanged: () => void;
  onOpenOptions: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price);
  const [noBasePrice, setNoBasePrice] = useState(Number(product.price) === 0);
  const [customPriceAllowed, setCustomPriceAllowed] = useState(product.custom_price_allowed);
  const [description, setDescription] = useState(product.description ?? "");
  const [categoryId, setCategoryId] = useState(product.category_id);
  const [printsToKitchen, setPrintsToKitchen] = useState(product.prints_to_kitchen);
  const [busy, setBusy] = useState(false);

  async function save() {
    const parsedPrice = noBasePrice || customPriceAllowed ? "0" : parseMoneyInput(price);
    if (!name.trim() || parsedPrice === null) {
      onError("Nombre y precio válidos son obligatorios.");
      return;
    }
    setBusy(true);
    try {
      await updateProduct(product.id, {
        name: name.trim(),
        price: parsedPrice,
        description: description.trim() || null,
        category_id: categoryId,
        prints_to_kitchen: printsToKitchen,
        custom_price_allowed: customPriceAllowed,
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo actualizar el producto.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleAvailability() {
    try {
      await setProductAvailability(product.id, !product.is_available);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo cambiar la disponibilidad.");
    }
  }

  async function remove() {
    if (!confirm(`¿Eliminar "${product.name}" del catálogo?`)) return;
    try {
      await deleteProduct(product.id);
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo eliminar el producto.");
    }
  }

  if (editing) {
    return (
      <div className="border border-outline-variant rounded-lg p-stack-sm flex flex-col gap-2 bg-surface">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre"
            className="flex-1 h-9 rounded border border-outline-variant px-2 font-body-md text-body-md"
          />
          <input
            value={noBasePrice || customPriceAllowed ? "" : price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={customPriceAllowed ? "Lo escribe el mesero" : noBasePrice ? "Según opción" : "Precio"}
            disabled={noBasePrice || customPriceAllowed}
            inputMode="decimal"
            className="w-28 h-9 rounded border border-outline-variant px-2 font-body-md text-body-md disabled:opacity-50 disabled:bg-surface-variant"
          />
        </div>
        <label className="flex items-center gap-2 font-body-md text-[13px] text-on-surface-variant">
          <input
            type="checkbox"
            checked={noBasePrice}
            disabled={customPriceAllowed}
            onChange={(e) => setNoBasePrice(e.target.checked)}
          />
          Sin precio base (el precio depende de las opciones, ej. tamaño)
        </label>
        <label className="flex items-center gap-2 font-body-md text-[13px] text-on-surface-variant">
          <input
            type="checkbox"
            checked={customPriceAllowed}
            onChange={(e) => setCustomPriceAllowed(e.target.checked)}
          />
          Precio variable (recipiente propio: el mesero escribe el monto al vender)
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción (opcional)"
          className="h-9 rounded border border-outline-variant px-2 font-body-md text-body-md"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="h-9 rounded border border-outline-variant px-2 font-body-md text-body-md"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1 font-body-md text-[13px] text-on-surface-variant">
            <input
              type="checkbox"
              checked={printsToKitchen}
              onChange={(e) => setPrintsToKitchen(e.target.checked)}
            />
            Imprime comanda en cocina
          </label>
        </div>
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
    <div className="border border-outline-variant rounded-lg px-stack-sm py-2 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-body-md text-body-md font-medium truncate">{product.name}</span>
          <span className="font-numeric-pin text-[14px] text-primary shrink-0">
            {product.custom_price_allowed
              ? "Precio variable"
              : Number(product.price) === 0 && product.modifier_groups.some((g) => g.min_select > 0)
                ? "Según opción"
                : formatMoney(product.price)}
          </span>
        </div>
        <p className="font-body-md text-[12px] text-on-surface-variant flex items-center gap-2 flex-wrap">
          {product.custom_price_allowed && (
            <span className="inline-flex items-center gap-0.5">
              <Icon name="soup_kitchen" className="text-[13px]" /> recipiente propio
            </span>
          )}
          {!product.prints_to_kitchen && (
            <span className="inline-flex items-center gap-0.5">
              <Icon name="kitchen" className="text-[13px]" /> no va a cocina
            </span>
          )}
          {product.track_inventory && (
            <span className="inline-flex items-center gap-0.5">
              <Icon name="inventory_2" className="text-[13px]" /> quedan {product.stock_quantity}
            </span>
          )}
          {product.modifier_groups.length > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <Icon name="tune" className="text-[13px]" /> {product.modifier_groups.length} grupo(s) de opciones
            </span>
          )}
          {!product.is_available && <span className="text-error">agotado</span>}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onOpenOptions}
          className="h-8 w-8 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant rounded-full"
          aria-label="Opciones e inventario"
          title="Opciones e inventario"
        >
          <Icon name="tune" className="text-[18px]" />
        </button>
        <button
          onClick={toggleAvailability}
          className="h-8 w-8 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant rounded-full"
          aria-label="Disponibilidad"
          title={product.is_available ? "Marcar agotado" : "Marcar disponible"}
        >
          <Icon name={product.is_available ? "toggle_on" : "toggle_off"} className="text-[20px]" />
        </button>
        <button onClick={() => setEditing(true)} className="h-8 w-8 flex items-center justify-center text-on-surface-variant">
          <Icon name="edit" className="text-[16px]" />
        </button>
        <button onClick={remove} className="h-8 w-8 flex items-center justify-center text-error">
          <Icon name="delete" className="text-[16px]" />
        </button>
      </div>
    </div>
  );
}

function NewProductCard({
  categories,
  onError,
  onChanged,
}: {
  categories: CategoryOut[];
  onError: (msg: string) => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [noBasePrice, setNoBasePrice] = useState(false);
  const [customPriceAllowed, setCustomPriceAllowed] = useState(false);
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [printsToKitchen, setPrintsToKitchen] = useState(true);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const parsedPrice = noBasePrice || customPriceAllowed ? "0" : parseMoneyInput(price);
    if (!name.trim() || parsedPrice === null || !categoryId) {
      onError("Nombre, precio y categoría son obligatorios.");
      return;
    }
    setBusy(true);
    try {
      await createProduct({
        category_id: categoryId,
        name: name.trim(),
        price: parsedPrice,
        description: description.trim() || null,
        prints_to_kitchen: printsToKitchen,
        custom_price_allowed: customPriceAllowed,
      });
      setName("");
      setPrice("");
      setNoBasePrice(false);
      setCustomPriceAllowed(false);
      setDescription("");
      onChanged();
    } catch (err) {
      onError(err instanceof ApiError ? err.message : "No se pudo crear el producto.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-stack-sm">
      <h2 className="font-headline-md text-headline-md">Nuevo producto</h2>
      <div className="flex flex-wrap gap-stack-sm items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md outline-none focus:ring-2 focus:ring-tertiary"
          />
        </div>
        <div>
          <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Precio</label>
          <input
            inputMode="decimal"
            value={noBasePrice || customPriceAllowed ? "" : price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={customPriceAllowed ? "Lo escribe el mesero" : noBasePrice ? "Según opción" : "0.00"}
            disabled={noBasePrice || customPriceAllowed}
            className="w-28 h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md outline-none focus:ring-2 focus:ring-tertiary disabled:opacity-50 disabled:bg-surface-variant"
          />
        </div>
        <div className="min-w-[160px]">
          <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">Categoría</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md outline-none focus:ring-2 focus:ring-tertiary"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción (opcional)"
        className="h-11 rounded-lg border border-outline-variant bg-surface px-3 font-body-md text-body-md outline-none focus:ring-2 focus:ring-tertiary"
      />
      <label className="flex items-center gap-2 font-body-md text-body-md text-on-surface-variant">
        <input
          type="checkbox"
          checked={printsToKitchen}
          onChange={(e) => setPrintsToKitchen(e.target.checked)}
        />
        Imprime comanda en cocina (desmarca para bebidas u otros que el mesero entrega directo)
      </label>
      <label className="flex items-center gap-2 font-body-md text-body-md text-on-surface-variant">
        <input
          type="checkbox"
          checked={noBasePrice}
          disabled={customPriceAllowed}
          onChange={(e) => setNoBasePrice(e.target.checked)}
        />
        Sin precio base (el precio lo pone después cada opción, ej. tamaño grande/pequeño)
      </label>
      <label className="flex items-center gap-2 font-body-md text-body-md text-on-surface-variant">
        <input
          type="checkbox"
          checked={customPriceAllowed}
          onChange={(e) => setCustomPriceAllowed(e.target.checked)}
        />
        Precio variable (recipiente propio: el mesero escribe el monto al vender, ej. granel)
      </label>
      <button
        onClick={submit}
        disabled={busy || !name.trim()}
        className="self-start h-11 px-4 rounded-full bg-tertiary text-on-tertiary font-label-caps text-label-caps disabled:opacity-50"
      >
        Crear producto
      </button>
    </div>
  );
}
