import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "../state/CartContext";
import { formatMoney } from "../lib/money";
import { Icon } from "./Icon";

export function CartBar({
  actionLabel,
  onSubmit,
  busy,
  note,
}: {
  actionLabel: string;
  onSubmit: () => void;
  busy: boolean;
  note?: string;
}) {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const wasBusy = useRef(false);

  // El modal se queda abierto (mostrando "Enviando…") todo el tiempo que
  // dure la petición, y recién se cierra solo cuando termina. Cerrarlo de
  // inmediato al tocar el botón —como antes— hacía que con una red lenta el
  // mesero no viera nada pasar y pensara que la app se quedó pegada, aunque
  // el pedido ya se hubiera enviado bien por detrás.
  useEffect(() => {
    if (wasBusy.current && !busy) setOpen(false);
    wasBusy.current = busy;
  }, [busy]);

  if (cart.itemCount === 0) return null;

  // Portal directo a <body>: este botón flotante y el panel de pedido son
  // "fixed" y deben quedar SIEMPRE por encima de todo. Si se renderizaran
  // como hijos normales de la pantalla, cualquier ancestro con animación,
  // transform u opacidad (como el fade-in de WaiterShell) crea sin querer
  // un stacking context nuevo que los atrapa por debajo de la barra de
  // navegación inferior, aunque su z-index sea más alto.
  return createPortal(
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-margin-mobile right-margin-mobile h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-between px-6 z-40 active:scale-[0.98] transition-transform animate-pop-in"
      >
        <span className="flex items-center gap-2 font-headline-md text-headline-md">
          <Icon name="shopping_cart" filled />
          {cart.itemCount}
        </span>
        <span className="font-numeric-pin text-numeric-pin">{formatMoney(cart.total)}</span>
        <span className="font-label-caps text-label-caps">Ver pedido</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-surface flex flex-col animate-sheet-in">
          <header className="flex items-center justify-between px-margin-mobile h-touch-target-min border-b border-outline-variant">
            <button
              onClick={() => setOpen(false)}
              disabled={busy}
              className="h-touch-target-min w-touch-target-min flex items-center justify-center disabled:opacity-30"
            >
              <Icon name="close" />
            </button>
            <h2 className="font-headline-md text-headline-md">Pedido actual</h2>
            <span className="w-touch-target-min" />
          </header>

          <div className="flex-1 overflow-y-auto p-margin-mobile flex flex-col gap-stack-sm">
            {cart.lines.map((line) => (
              <div
                key={line.cartId}
                className="bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md flex flex-col gap-1 shadow-sm animate-slide-up-fade"
              >
                <div className="flex justify-between items-start">
                  <span className="font-body-md text-body-md text-on-surface font-medium">
                    {line.product.name}
                  </span>
                  <button onClick={() => cart.removeLine(line.cartId)} className="text-error">
                    <Icon name="delete" className="text-[20px]" />
                  </button>
                </div>
                {line.modifiers.length > 0 && (
                  <p className="font-body-md text-[13px] text-on-surface-variant">
                    {line.modifiers.map((m) => m.name).join(", ")}
                  </p>
                )}
                {line.note && (
                  <p className="font-body-md text-[13px] text-on-surface-variant italic">"{line.note}"</p>
                )}
                {line.toGo && (
                  <span className="inline-flex items-center gap-0.5 font-label-caps text-[11px] text-tertiary">
                    <Icon name="takeout_dining" className="text-[13px]" /> Para llevar
                  </span>
                )}
                {line.customPrice !== undefined && (
                  <span className="inline-flex items-center gap-0.5 font-label-caps text-[11px] text-tertiary">
                    <Icon name="soup_kitchen" className="text-[13px]" /> Recipiente propio · precio acordado
                  </span>
                )}
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center bg-surface-container rounded-full h-9 border border-outline-variant">
                    <button
                      onClick={() => cart.updateQuantity(line.cartId, line.quantity - 1)}
                      className="w-9 h-full flex items-center justify-center rounded-full active:scale-90 active:bg-surface-dim transition-all duration-150"
                    >
                      <Icon name="remove" className="text-[18px]" />
                    </button>
                    <span className="font-numeric-pin text-[16px] min-w-[28px] text-center">
                      {line.quantity}
                    </span>
                    <button
                      onClick={() => cart.updateQuantity(line.cartId, line.quantity + 1)}
                      className="w-9 h-full flex items-center justify-center rounded-full active:scale-90 active:bg-surface-dim transition-all duration-150"
                    >
                      <Icon name="add" className="text-[18px]" />
                    </button>
                  </div>
                  <span className="font-numeric-pin text-[16px] text-primary">
                    {formatMoney(
                      ((line.customPrice !== undefined ? Number(line.customPrice) : Number(line.product.price)) +
                        line.modifiers.reduce((s, m) => s + Number(m.price_delta), 0)) *
                        line.quantity,
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-outline-variant p-margin-mobile safe-bottom">
            <div className="flex justify-between font-headline-md text-headline-md">
              <span>Total</span>
              <span>{formatMoney(cart.total)}</span>
            </div>
            <p className="font-body-md text-[12px] text-on-surface-variant mb-stack-md min-h-[16px]">
              {busy ? "Enviando al servidor, espera un momento…" : note}
            </p>
            <button
              disabled={busy}
              onClick={onSubmit}
              className="w-full h-14 rounded-full bg-primary text-on-primary font-headline-md text-headline-md disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              {busy ? "Enviando…" : actionLabel}
            </button>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
