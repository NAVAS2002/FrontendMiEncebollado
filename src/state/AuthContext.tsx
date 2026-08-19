import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { logout as apiLogout } from "../api/auth";
import { getSession, hasPermission, onSessionChange, type Session } from "../api/session";

interface AuthContextValue {
  session: Session | null;
  can: (permission: string) => boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(() => getSession());

  useEffect(() => onSessionChange(setSessionState), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      can: hasPermission,
      logout: async () => {
        await apiLogout();
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
