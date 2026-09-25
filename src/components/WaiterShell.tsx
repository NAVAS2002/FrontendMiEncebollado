import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "./Icon";
import { StoreLogo } from "./StoreLogo";
import { useOnline } from "../lib/hooks";
import { useAuth } from "../state/AuthContext";

export function WaiterShell({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, logout } = useAuth();
  const online = useOnline();

  return (
    <div className="min-h-dvh flex flex-col pb-24 bg-background text-on-background">
      <header className="bg-background/85 backdrop-blur-md text-on-surface w-full top-0 sticky border-b border-white/5 flex justify-between items-center gap-space-sm px-margin-mobile h-14 z-40">
        <div className="flex items-center gap-space-sm min-w-0">
          <StoreLogo size="md" />
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
          {session && (
            <span className="text-label-md text-on-surface-variant truncate max-w-[88px] hidden min-[400px]:inline">
              {session.fullName}
            </span>
          )}
          <button
            aria-label="Salir"
            onClick={() => logout().then(() => navigate("/mesero/login", { replace: true }))}
            className="flex items-center justify-center h-touch-target-min w-touch-target-min -mr-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant active:scale-95"
          >
            <Icon name="logout" />
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col animate-fade-in">{children}</main>

      <nav className="fixed bottom-0 w-full z-50 bg-deep/90 backdrop-blur-lg border-t border-white/5 rounded-t-2xl flex justify-around items-center h-16 px-2 safe-bottom">
        <NavButton
          icon="grid_view"
          label="Mesas"
          active={location.pathname.startsWith("/mesero/mesa")}
          onClick={() => navigate("/mesero/mesas")}
        />
        <NavButton
          icon="local_mall"
          label="Llevar"
          active={location.pathname === "/mesero/llevar"}
          onClick={() => navigate("/mesero/llevar")}
        />
      </nav>
    </div>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center justify-center min-w-[88px] transition-all duration-200 px-4 py-1 rounded-xl active:scale-95 ${
        active ? "text-primary bg-primary/10" : "text-on-surface-variant hover:bg-surface-container-high"
      }`}
    >
      <Icon name={icon} filled={active} className="mb-0.5" />
      <span className="text-label-sm uppercase">{label}</span>
    </button>
  );
}
