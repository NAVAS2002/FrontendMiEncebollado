import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { ModifierOut, OrderLineIn, ProductOut } from "../api/types";
import { randomId } from "../lib/uuid";

export interface CartLine {
  cartId: string;
  product: ProductOut;
  quantity: number;
  modifiers: ModifierOut[];
  note: string | null;
  toGo: boolean;
  /** Monto que el mesero escribió a mano — solo si el producto lo admite
   * (ej. "cliente trae su olla, $5"). Reemplaza el precio de catálogo. */
  customPrice?: string;
}

interface CartContextValue {
  lines: CartLine[];
  addLine: (line: Omit<CartLine, "cartId">) => void;
  removeLine: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clear: () => void;
  itemCount: number;
  total: number;
  toOrderLines: () => OrderLineIn[];
  /** Vacía el carrito si se entra a una sesión distinta (otra mesa / para llevar). */
  ensureContext: (ctx: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function lineUnitPrice(product: ProductOut, modifiers: ModifierOut[], customPrice?: string): number {
  const base = customPrice !== undefined ? Number(customPrice) : Number(product.price);
  return base + modifiers.reduce((sum, m) => sum + Number(m.price_delta), 0);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const activeContext = useRef<string | null>(null);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);
    const total = lines.reduce(
      (sum, l) => sum + lineUnitPrice(l.product, l.modifiers, l.customPrice) * l.quantity,
      0,
    );
    return {
      lines,
      addLine: (line) => setLines((prev) => [...prev, { ...line, cartId: randomId() }]),
      removeLine: (cartId) => setLines((prev) => prev.filter((l) => l.cartId !== cartId)),
      updateQuantity: (cartId, quantity) =>
        setLines((prev) =>
          quantity <= 0
            ? prev.filter((l) => l.cartId !== cartId)
            : prev.map((l) => (l.cartId === cartId ? { ...l, quantity } : l)),
        ),
      clear: () => setLines([]),
      itemCount,
      total,
      toOrderLines: () =>
        lines.map((l) => ({
          product_id: l.product.id,
          quantity: l.quantity,
          modifier_ids: l.modifiers.map((m) => m.id),
          note: l.note,
          to_go: l.toGo,
          custom_price: l.customPrice,
        })),
      ensureContext: (ctx) => {
        if (activeContext.current !== ctx) {
          activeContext.current = ctx;
          setLines([]);
        }
      },
    };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
