import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { Loading } from "../../components/Loading";
import { productImageSrc } from "../../lib/media";
import { formatMoney } from "../../lib/money";
import { displayPrice } from "../../lib/pricing";
import { useCart } from "../../state/CartContext";
import { useMenu } from "../../state/MenuContext";
import type { ModifierOut } from "../../api/types";

export default function ProductCustomize() {
  const { productId } = useParams<{ productId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { menu } = useMenu();
  const cart = useCart();

  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? "/mesero/mesas";
  const isTakeAwayOrder = returnTo === "/mesero/llevar";
  const product = useMemo(() => menu?.products.find((p) => p.id === productId), [menu, productId]);

  const [selected, setSelected] = useState<Record<string, ModifierOut[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [toGo, setToGo] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  if (!menu) return <Loading label="Cargando producto…" />;
  if (!product) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-stack-md p-margin-mobile">
        <p className="font-body-md text-body-md text-on-surface-variant">Producto no encontrado.</p>
        <button onClick={() => navigate(returnTo)} className="text-primary underline">
          Volver
        </button>
      </div>
    );
  }

  const chosenModifiers = Object.values(selected).flat();
  const customAmountValid = /^\d+(\.\d{1,2})?$/.test(customAmount.trim()) && Number(customAmount) > 0;
  const unitPrice =
    (product.custom_price_allowed ? (customAmountValid ? Number(customAmount) : 0) : Number(product.price)) +
    chosenModifiers.reduce((s, m) => s + Number(m.price_delta), 0);

  function toggleModifier(groupId: string, modifier: ModifierOut, maxSelect: number) {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      const already = current.some((m) => m.id === modifier.id);
      if (already) {
        return { ...prev, [groupId]: current.filter((m) => m.id !== modifier.id) };
      }
      if (maxSelect <= 1) {
        return { ...prev, [groupId]: [modifier] };
      }
      if (current.length >= maxSelect) return prev;
      return { ...prev, [groupId]: [...current, modifier] };
    });
  }

  function canSubmit(): boolean {
    if (product?.custom_price_allowed && !customAmountValid) return false;
    return (product?.modifier_groups ?? []).every((g) => {
      const count = selected[g.id]?.length ?? 0;
      return count >= g.min_select;
    });
  }

  function addToOrder() {
    if (!product) return;
    cart.addLine({
      product,
      quantity,
      modifiers: chosenModifiers,
      note: note.trim() || null,
      toGo: isTakeAwayOrder || toGo,
      customPrice: product.custom_price_allowed ? Number(customAmount).toFixed(2) : undefined,
    });
    navigate(returnTo);
  }

  return (
    <div className="bg-surface text-on-surface antialiased pb-32 min-h-dvh animate-fade-in">
      <header className="flex items-center justify-between px-margin-mobile h-touch-target-min bg-surface sticky top-0 z-40 border-b border-outline-variant shadow-sm">
        <button
          onClick={() => navigate(returnTo)}
          className="h-touch-target-min w-touch-target-min flex items-center justify-center rounded-full hover:bg-surface-variant active:scale-95 transition-all"
        >
          <Icon name="close" />
        </button>
        <h1 className="font-headline-md text-headline-md font-bold tracking-tight">Personalizar</h1>
        <div className="w-touch-target-min" />
      </header>

      <main className="w-full max-w-2xl mx-auto">
        {(() => {
          const imageSrc = productImageSrc(product.image_url);
          return imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              className="w-full aspect-[16/10] object-cover bg-surface-container-low"
            />
          ) : null;
        })()}

        <div className="bg-surface-container-lowest border-b border-outline-variant mb-stack-md p-margin-mobile">
          <div className="flex justify-between items-start mb-stack-sm">
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{product.name}</h2>
            <span className="font-numeric-pin text-numeric-pin text-primary text-right">
              {(() => {
                const price = displayPrice(product);
                if (price.variable) {
                  return <span className="text-[16px]">Precio variable</span>;
                }
                return (
                  <>
                    {price.fromVariant && (
                      <span className="block text-[11px] font-body-md text-on-surface-variant">Desde</span>
                    )}
                    {formatMoney(price.amount)}
                  </>
                );
              })()}
            </span>
          </div>
          {product.description && (
            <p className="font-body-md text-body-md text-on-surface-variant">{product.description}</p>
          )}
        </div>

        {product.custom_price_allowed && (
          <section className="px-margin-mobile mb-stack-lg">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-sm flex items-center gap-2">
              <Icon name="soup_kitchen" className="text-on-surface-variant" />
              ¿Cuánto va a pagar?
            </h3>
            <p className="font-body-md text-[12px] text-on-surface-variant mb-stack-sm">
              El cliente trae su propio recipiente: ingresa el monto acordado. No se cobra tarrina.
            </p>
            <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded-xl px-stack-md focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
              <span className="font-numeric-pin text-numeric-pin text-on-surface-variant">$</span>
              <input
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 bg-transparent py-stack-md font-numeric-pin text-numeric-pin text-on-surface outline-none"
              />
            </div>
          </section>
        )}

        {product.modifier_groups.map((group) => (
          <section key={group.id} className="px-margin-mobile mb-stack-lg">
            <div className="flex items-center justify-between mb-stack-md">
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">{group.name}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">
                  {group.min_select > 0 ? "Selecciona una opción" : "Opcional"}
                </p>
              </div>
              {group.min_select > 0 ? (
                <span className="bg-error-container text-on-error-container font-label-caps text-label-caps px-3 py-1.5 rounded-full flex items-center gap-1">
                  <Icon name="priority_high" className="text-[14px]" /> REQUERIDO
                </span>
              ) : (
                <span className="bg-surface-container-high text-on-surface-variant font-label-caps text-label-caps px-3 py-1.5 rounded-full">
                  MÁX {group.max_select}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-stack-sm">
              {group.modifiers.map((m) => {
                const isSelected = (selected[group.id] ?? []).some((s) => s.id === m.id);
                return (
                  <label
                    key={m.id}
                    className={`flex items-center justify-between p-stack-md bg-surface-container-lowest border rounded-xl transition-all duration-150 active:scale-[0.99] ${
                      !m.is_available
                        ? "opacity-40 cursor-not-allowed"
                        : isSelected
                          ? "border-primary shadow-sm cursor-pointer"
                          : "border-outline-variant cursor-pointer"
                    }`}
                  >
                    <div>
                      <span className="block font-body-md text-body-md text-on-surface">
                        {m.name} {!m.is_available && "· agotado"}
                      </span>
                      {Number(m.price_delta) !== 0 &&
                        (Number(product.price) === 0 && group.min_select > 0 ? (
                          <span className="font-numeric-pin text-numeric-pin text-sm text-primary">
                            {formatMoney(m.price_delta)}
                          </span>
                        ) : (
                          <span className="font-numeric-pin text-numeric-pin text-sm text-primary">
                            + {formatMoney(m.price_delta)}
                          </span>
                        ))}
                    </div>
                    <input
                      type={group.max_select <= 1 ? "radio" : "checkbox"}
                      checked={isSelected}
                      disabled={!m.is_available}
                      onChange={() => toggleModifier(group.id, m, group.max_select)}
                      className="w-6 h-6 accent-primary"
                    />
                  </label>
                );
              })}
            </div>
          </section>
        ))}

        {product.prints_to_kitchen && !isTakeAwayOrder && !product.custom_price_allowed && (
          <section className="px-margin-mobile mb-stack-lg">
            <label
              className={`flex items-center justify-between p-stack-md bg-surface-container-lowest border rounded-xl cursor-pointer transition-all duration-150 active:scale-[0.99] ${
                toGo ? "border-primary shadow-sm" : "border-outline-variant"
              }`}
            >
              <span className="flex items-center gap-2">
                <Icon name="takeout_dining" className="text-on-surface-variant" />
                <span>
                  <span className="block font-body-md text-body-md text-on-surface">
                    Para llevar (tarrina)
                  </span>
                  <span className="block font-body-md text-[12px] text-on-surface-variant">
                    Se cobra el cargo de empaque solo para esto
                  </span>
                </span>
              </span>
              <input
                type="checkbox"
                checked={toGo}
                onChange={(e) => setToGo(e.target.checked)}
                className="w-6 h-6 accent-primary"
              />
            </label>
          </section>
        )}

        {product.prints_to_kitchen && (
          <section className="px-margin-mobile mb-stack-lg">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-stack-sm flex items-center gap-2">
              <Icon name="edit_note" className="text-on-surface-variant" />
              Notas para cocina
            </h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={280}
              placeholder="Ej. Sin cebolla, aderezo aparte…"
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md font-body-md text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-all placeholder:text-outline"
            />
          </section>
        )}
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-surface-container-lowest border-t border-outline-variant p-margin-mobile z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-bottom">
        <div className="max-w-2xl mx-auto flex gap-stack-md items-center">
          <div className="flex items-center bg-surface-container rounded-full h-[48px] border border-outline-variant">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-touch-target-min h-full flex items-center justify-center rounded-l-full active:bg-surface-dim transition-colors"
            >
              <Icon name="remove" />
            </button>
            <span className="font-numeric-pin text-numeric-pin px-2 min-w-[44px] text-center">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              className="w-touch-target-min h-full flex items-center justify-center rounded-r-full active:bg-surface-dim transition-colors"
            >
              <Icon name="add" />
            </button>
          </div>
          <button
            disabled={!canSubmit()}
            onClick={addToOrder}
            className="flex-1 bg-primary text-on-primary h-[48px] rounded-full flex justify-between items-center px-6 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <span className="font-headline-md text-headline-md font-bold tracking-wide text-[16px]">
              Agregar al pedido
            </span>
            <span className="font-numeric-pin text-numeric-pin font-bold">{formatMoney(unitPrice * quantity)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
