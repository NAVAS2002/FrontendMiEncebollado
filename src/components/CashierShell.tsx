import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { hasPermission } from "../api/session";
import { Icon } from "./Icon";
import { StoreLogo } from "./StoreLogo";
import { useAuth } from "../state/AuthContext";

const LINKS = [
  { to: "/caja/pedidos", icon: "receipt_long", label: "Pedidos", permission: "order.read" },
  { to: "/caja/pagos", icon: "payments", label: "Pagos", permission: "payment.create" },
  { to: "/caja/sesion", icon: "point_of_sale", label: "Caja", permission: "cash_session.read" },
  { to: "/caja/reportes", icon: "monitoring", label: "Reportes", permission: "report.daily" },
];

const ADMIN_LINKS = [
  { to: "/cocina", icon: "soup_kitchen", label: "Cocina", permission: "order.status" },
  { to: "/caja/admin/secciones", icon: "table_restaurant", label: "Secciones y mesas", permission: "table.write" },
  { to: "/caja/admin/catalogo", icon: "restaurant_menu", label: "Catálogo", permission: "product.write" },
  { to: "/caja/admin/dispositivos", icon: "phonelink_lock", label: "Dispositivos", permission: "user.manage" },
  { to: "/caja/admin/usuarios", icon: "group", label: "Usuarios", permission: "user.manage" },
  { to: "/caja/admin/configuracion", icon: "settings", label: "Configuración", permission: "settings.manage" },
];

function SidebarLink({ to, icon, label }: { to: string; icon: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 h-12 rounded-full font-body-md text-body-md transition-all ${
          isActive
            ? "bg-tertiary-container text-on-tertiary-container"
            : "text-on-surface-variant hover:bg-surface-container-high"
        }`
      }
    >
      <Icon name={icon} />
      {label}
    </NavLink>
  );
}

export function CashierShell({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const links = LINKS.filter((l) => hasPermission(l.permission));
  const adminLinks = ADMIN_LINKS.filter((l) => hasPermission(l.permission));

  return (
    <div className="h-dvh flex bg-background text-on-background overflow-hidden">
      <aside className="hidden md:flex w-60 flex-col border-r border-outline-variant bg-surface p-stack-md gap-stack-sm shrink-0 h-full overflow-y-auto">
        <div className="flex items-center gap-2 px-2 mb-stack-md">
          <StoreLogo size="sm" />
          <span className="font-headline-md text-headline-md text-on-surface">MI ENCEBOLLADO</span>
        </div>
        {links.map((l) => (
          <SidebarLink key={l.to} {...l} />
        ))}
        {adminLinks.length > 0 && (
          <>
            <p className="font-label-caps text-label-caps text-on-surface-variant px-4 mt-stack-md">Administración</p>
            {adminLinks.map((l) => (
              <SidebarLink key={l.to} {...l} />
            ))}
          </>
        )}

        <div className="mt-auto flex flex-col gap-stack-sm">
          {session && (
            <p className="font-body-md text-[13px] text-on-surface-variant px-4">
              {session.fullName} · {session.role}
            </p>
          )}
          <button
            onClick={() => logout().then(() => navigate("/caja/login", { replace: true }))}
            className="flex items-center gap-3 px-4 h-12 rounded-full font-body-md text-body-md text-on-surface-variant hover:bg-surface-container-high transition-all"
          >
            <Icon name="logout" />
            Salir
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="bg-surface border-b border-outline-variant flex items-center justify-between px-margin-mobile h-touch-target-min shrink-0">
          <h1 className="font-headline-md text-headline-md">{title}</h1>
          <button
            onClick={() => navigate("/caja/login")}
            className="md:hidden flex items-center gap-1 text-on-surface-variant"
          >
            <Icon name="logout" />
          </button>
        </header>
        <main className="flex-1 min-w-0 overflow-y-auto pb-20 md:pb-0">{children}</main>

        {links.length > 0 && (
          <nav className="md:hidden fixed bottom-0 w-full z-50 bg-surface-container flex justify-around items-center h-16 px-2 safe-bottom">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center px-4 py-1 rounded-full font-label-caps text-label-caps transition-all ${
                    isActive ? "bg-tertiary-container text-on-tertiary-container" : "text-on-surface-variant"
                  }`
                }
              >
                <Icon name={l.icon} className="mb-1" />
                {l.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
