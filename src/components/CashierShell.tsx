import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { hasPermission } from "../api/session";
import { Icon } from "./Icon";
import { StoreLogo } from "./StoreLogo";
import { useOnline } from "../lib/hooks";
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
        `flex items-center gap-3 px-4 h-12 rounded-xl font-body-md text-body-md transition-all ${
          isActive
            ? "bg-primary/10 text-primary font-semibold"
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
  const online = useOnline();
  const links = LINKS.filter((l) => hasPermission(l.permission));
  const adminLinks = ADMIN_LINKS.filter((l) => hasPermission(l.permission));

  return (
    <div className="h-dvh flex bg-background text-on-background overflow-hidden">
      <aside className="hidden md:flex w-60 flex-col border-r border-white/5 bg-deep p-stack-md gap-stack-sm shrink-0 h-full overflow-y-auto">
        <div className="flex items-center gap-2 px-2 mb-stack-md">
          <StoreLogo size="md" />
          <span className="text-headline-sm text-on-surface">MI ENCEBOLLADO</span>
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
            className="flex items-center gap-3 px-4 h-12 rounded-xl font-body-md text-body-md text-on-surface-variant hover:bg-surface-container-high transition-all"
          >
            <Icon name="logout" />
            Salir
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="bg-background/85 backdrop-blur-md border-b border-white/5 flex items-center justify-between gap-space-sm px-margin-mobile h-14 shrink-0">
          <div className="flex items-center gap-space-sm min-w-0">
            <span className="md:hidden">
              <StoreLogo size="md" />
            </span>
            <h1 className="text-headline-sm truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-space-sm shrink-0">
            <span
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-label-sm uppercase ${
                online ? "bg-secondary-container/20 text-secondary" : "bg-alert-container/25 text-alert"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${online ? "bg-secondary" : "bg-alert animate-pulse"}`} />
              {online ? "Online" : "Sin red"}
            </span>
            <button
              aria-label="Salir"
              onClick={() => navigate("/caja/login")}
              className="md:hidden flex items-center justify-center h-touch-target-min w-touch-target-min -mr-2 text-on-surface-variant"
            >
              <Icon name="logout" />
            </button>
          </div>
        </header>
        <main className="flex-1 min-w-0 overflow-y-auto pb-20 md:pb-0">{children}</main>

        {links.length > 0 && (
          <nav className="md:hidden fixed bottom-0 w-full z-50 bg-deep/90 backdrop-blur-lg border-t border-white/5 rounded-t-2xl flex justify-around items-center h-16 px-2 safe-bottom">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center min-w-[64px] px-3 py-1 rounded-xl text-label-sm uppercase transition-all active:scale-95 ${
                    isActive ? "bg-primary/10 text-primary" : "text-on-surface-variant"
                  }`
                }
              >
                <Icon name={l.icon} className="mb-0.5" />
                {l.label}
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}
