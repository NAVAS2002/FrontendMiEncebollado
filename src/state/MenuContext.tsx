import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getMenu } from "../api/catalog";
import type { MenuOut } from "../api/types";
import { useAuth } from "./AuthContext";
import { useRealtime } from "./RealtimeContext";

interface MenuContextValue {
  menu: MenuOut | null;
  reload: () => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

export function MenuProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [menu, setMenu] = useState<MenuOut | null>(null);

  const reload = useCallback(() => {
    if (!session) return;
    getMenu(true)
      .then(setMenu)
      .catch(() => {
        /* se reintenta en el próximo evento de catálogo o navegación */
      });
  }, [session]);

  useEffect(reload, [reload]);
  useRealtime(
    (msg) => {
      if (msg.event.startsWith("product.")) reload();
    },
    [reload],
  );

  return <MenuContext.Provider value={{ menu, reload }}>{children}</MenuContext.Provider>;
}

export function useMenu(): MenuContextValue {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenu debe usarse dentro de <MenuProvider>");
  return ctx;
}
