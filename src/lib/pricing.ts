import type { ProductOut } from "../api/types";

/**
 * Precio a mostrar en las tarjetas de menú y en el encabezado de personalizar.
 *
 * Un producto como "Encebollado" puede no tener precio propio cuando el
 * precio real depende de una opción obligatoria (tamaño grande/pequeño): en
 * ese caso el admin deja el precio base en $0.00 y pone el precio real como
 * el "price_delta" de cada tamaño. Mostrar "$0.00" ahí confundiría al
 * mesero, así que se muestra "Desde $X" con la opción más barata del primer
 * grupo obligatorio.
 */
export function displayPrice(
  product: ProductOut,
): { fromVariant: boolean; amount: string; variable?: boolean } {
  if (product.custom_price_allowed) return { fromVariant: false, amount: "0", variable: true };

  const base = Number(product.price);
  if (base > 0) return { fromVariant: false, amount: product.price };

  const requiredGroup = product.modifier_groups.find(
    (g) => g.min_select > 0 && g.modifiers.length > 0,
  );
  if (requiredGroup) {
    const cheapest = requiredGroup.modifiers.reduce((min, m) =>
      Number(m.price_delta) < Number(min.price_delta) ? m : min,
    );
    return { fromVariant: true, amount: cheapest.price_delta };
  }
  return { fromVariant: false, amount: product.price };
}
