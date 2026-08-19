import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { RealtimeConnection, type WsMessage } from "../api/ws";
import { useAuth } from "./AuthContext";

type Listener = (msg: WsMessage) => void;

const RealtimeContext = createContext<{ subscribe: (fn: Listener) => () => void } | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const connRef = useRef<RealtimeConnection | null>(null);
  const listenersRef = useRef(new Set<Listener>());

  useEffect(() => {
    if (!session) {
      connRef.current?.close();
      connRef.current = null;
      return;
    }
    const conn = new RealtimeConnection(session.accessToken);
    connRef.current = conn;
    const unsubscribe = conn.subscribe((msg) => {
      listenersRef.current.forEach((fn) => fn(msg));
    });
    return () => {
      unsubscribe();
      conn.close();
    };
    // Reconecta cuando cambia el access token (login, refresh tras expirar).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  const subscribe = (fn: Listener) => {
    listenersRef.current.add(fn);
    return () => {
      listenersRef.current.delete(fn);
    };
  };

  return <RealtimeContext.Provider value={{ subscribe }}>{children}</RealtimeContext.Provider>;
}

export function useRealtime(onMessage: Listener, deps: unknown[] = []): void {
  const ctx = useContext(RealtimeContext);
  useEffect(() => {
    if (!ctx) return;
    return ctx.subscribe(onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
