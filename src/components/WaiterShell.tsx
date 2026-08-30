import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "./Icon";
import { StoreLogo } from "./StoreLogo";
import { useAuth } from "../state/AuthContext";

export function WaiterShell({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, logout } = useAuth();

  return (
    <div className="min-h-dvh flex flex-col pb-24 bg-background text-on-background">
      <header className="bg-surface text-on-surface w-full top-0 sticky border-b border-outline-variant flex justify-between items-center px-margin-mobile h-touch-target-min z-40">
        <div className="flex items-center gap-2">
          <StoreLogo size="sm" />
          <h1 className="font-headline-md text-headline-md">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          {session && (
            <span className="font-label-caps text-label-caps text-on-surface-variant hidden sm:inline">
              {session.fullName}
            </span>
          )}
          <button
            aria-label="Salir"
            onClick={() => logout().then(() => navigate("/mesero/login", { replace: true }))}
            className="flex items-center justify-center h-touch-target-min w-touch-target-min hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant"
          >
            <Icon name="logout" />
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col animate-fade-in">{children}</main>

      <nav className="fixed bottom-0 w-full z-50 bg-surface-container flex justify-around items-center h-16 px-2 safe-bottom">
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
      className={`flex flex-col items-center justify-center transition-all duration-200 px-4 py-1 rounded-full font-label-caps text-label-caps ${
        active
          ? "text-primary bg-primary-container/40"
          : "text-on-surface-variant hover:bg-surface-variant"
      }`}
    >
      <Icon name={icon} filled={active} className="mb-1" />
      <span>{label}</span>
    </button>
  );
}
