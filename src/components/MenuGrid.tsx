import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MenuOut, ProductOut } from "../api/types";
import { formatMoney } from "../lib/money";
import { productImageSrc } from "../lib/media";
import { displayPrice } from "../lib/pricing";
import { Icon } from "./Icon";

// Sin campo de ícono en el backend: se infiere por palabras clave del
// nombre de la categoría. Es una decoración del carrusel, no una regla de
// negocio — si no calza con ninguna, cae al ícono genérico.
function categoryIcon(name: string): string {
  const n = name.toLowerCase();
  if (/bebid|jugo|gaseosa|agua|cola|malta|refresco/.test(n)) return "local_bar";
  if (/caf[eé]|t[eé]\b/.test(n)) return "coffee";
  if (/postre|dulce|helado/.test(n)) return "icecream";
  if (/acompañ|acompan|extra|chifle|\bpan\b|porci[oó]n/.test(n)) return "tapas";
  if (/encebollado|plato|comida|principal|granel/.test(n)) return "ramen_dining";
  return "restaurant_menu";
}

export function MenuGrid({ menu, returnTo }: { menu: MenuOut; returnTo: string }) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");

  const products = menu.products.filter(
    (p) => activeCategory === "all" || p.category_id === activeCategory,
  );

  return (
    <div>
      <div className="w-full bg-surface px-margin-mobile flex overflow-x-auto gap-stack-sm py-stack-sm sticky top-[44px] z-20">
        <CategoryChip
          active={activeCategory === "all"}
          icon="local_fire_department"
          label="Más pedidos"
          onClick={() => setActiveCategory("all")}
        />
        {menu.categories.map((c) => (
          <CategoryChip
            key={c.id}
            active={activeCategory === c.id}
            icon={categoryIcon(c.name)}
            label={c.name}
            onClick={() => setActiveCategory(c.id)}
          />
        ))}
      </div>

      <div className="p-margin-mobile grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-gutter animate-fade-in">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onClick={() => navigate(`/mesero/producto/${p.id}`, { state: { returnTo } })}
          />
        ))}
        {products.length === 0 && (
          <p className="col-span-full text-center text-on-surface-variant py-8 font-body-md">
            No hay productos en esta categoría.
          </p>
        )}
      </div>
    </div>
  );
}

function CategoryChip({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex flex-col items-center justify-center gap-1 w-[72px] h-[72px] rounded-2xl transition-all duration-200 ${
        active
          ? "bg-primary text-on-primary shadow-md scale-[1.04]"
          : "bg-surface-container-low text-on-surface-variant active:scale-95"
      }`}
    >
      <Icon name={icon} filled={active} className="text-[22px]" />
      <span className="font-label-caps text-[9px] leading-tight text-center px-1 line-clamp-1 w-full">
        {label}
      </span>
    </button>
  );
}

function ProductCard({ product, onClick }: { product: ProductOut; onClick: () => void }) {
  const price = displayPrice(product);
  const imageSrc = productImageSrc(product.image_url);

  return (
    <button
      onClick={onClick}
      disabled={!product.is_available}
      className="flex flex-col text-left bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm hover:shadow-md active:scale-[0.97] transition-all duration-200 disabled:opacity-50"
    >
      <div className="relative aspect-square w-full bg-gradient-to-br from-primary-container to-primary flex items-center justify-center overflow-hidden">
        {imageSrc ? (
          <img src={imageSrc} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <Icon name="ramen_dining" className="text-[44px] text-on-primary-container/60" />
        )}
        {!product.is_available && (
          <span className="absolute inset-0 bg-surface/80 flex items-center justify-center font-label-caps text-label-caps text-error">
            Agotado
          </span>
        )}
      </div>
      <div className="p-stack-sm flex flex-col gap-0.5">
        <span className="font-body-md text-[14px] text-on-surface font-medium line-clamp-2 min-h-[2.3em] leading-tight">
          {product.name}
        </span>
        <div className="flex items-center justify-between mt-0.5">
          <span className="font-numeric-pin text-[15px] text-primary font-bold">
            {price.variable ? (
              "Variable"
            ) : (
              <>
                {price.fromVariant && <span className="text-[11px] font-normal">Desde </span>}
                {formatMoney(price.amount)}
              </>
            )}
          </span>
          {product.is_available && (
            <span className="h-7 w-7 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0">
              <Icon name="add" className="text-[16px]" />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
