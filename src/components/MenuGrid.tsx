import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MenuOut } from "../api/types";
import { formatMoney } from "../lib/money";
import { displayPrice } from "../lib/pricing";
import { Icon } from "./Icon";

export function MenuGrid({ menu, returnTo }: { menu: MenuOut; returnTo: string }) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");

  const products = menu.products.filter(
    (p) => activeCategory === "all" || p.category_id === activeCategory,
  );

  return (
    <div>
      <div className="w-full bg-surface border-b border-outline-variant px-margin-mobile flex overflow-x-auto gap-stack-sm py-2 sticky top-[44px] z-20">
        <button
          onClick={() => setActiveCategory("all")}
          className={`h-touch-target-min px-4 rounded-full whitespace-nowrap font-headline-md text-headline-md transition-all ${
            activeCategory === "all"
              ? "bg-primary-container text-on-primary-container"
              : "bg-surface-container-low text-on-surface-variant"
          }`}
        >
          Todo
        </button>
        {menu.categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`h-touch-target-min px-4 rounded-full whitespace-nowrap font-headline-md text-headline-md transition-all ${
              activeCategory === c.id
                ? "bg-primary-container text-on-primary-container"
                : "bg-surface-container-low text-on-surface-variant"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="p-margin-mobile grid grid-cols-2 sm:grid-cols-3 gap-gutter">
        {products.map((p) => {
          const price = displayPrice(p);
          return (
            <button
              key={p.id}
              disabled={!p.is_available}
              onClick={() => navigate(`/mesero/producto/${p.id}`, { state: { returnTo } })}
              className="flex flex-col items-start text-left bg-surface-container-lowest border border-surface-variant rounded-lg p-stack-md gap-1 active:shadow-inner transition-all disabled:opacity-40"
            >
              <span className="font-body-md text-body-md text-on-surface font-medium">{p.name}</span>
              {p.description && (
                <span className="font-body-md text-[13px] text-on-surface-variant line-clamp-2">
                  {p.description}
                </span>
              )}
              <div className="w-full flex items-center justify-between mt-1">
                <span className="font-numeric-pin text-[16px] text-primary">
                  {price.variable ? (
                    "Precio variable"
                  ) : (
                    <>
                      {price.fromVariant && <span className="text-[12px] text-on-surface-variant">Desde </span>}
                      {formatMoney(price.amount)}
                    </>
                  )}
                </span>
                {!p.is_available ? (
                  <span className="font-label-caps text-label-caps text-error">Agotado</span>
                ) : (
                  <Icon name="add_circle" className="text-primary" />
                )}
              </div>
            </button>
          );
        })}
        {products.length === 0 && (
          <p className="col-span-full text-center text-on-surface-variant py-8 font-body-md">
            No hay productos en esta categoría.
          </p>
        )}
      </div>
    </div>
  );
}
