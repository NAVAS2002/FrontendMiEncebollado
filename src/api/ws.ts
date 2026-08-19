import { WS_BASE } from "./client";

export interface WsMessage {
  event: string;
  data: Record<string, unknown>;
  ts: string;
}

type Listener = (msg: WsMessage) => void;

/**
 * El WebSocket es solo NOTIFICACIÓN ("algo cambió"), nunca la fuente de
 * verdad — así lo exige el backend. Por eso esta clase no guarda estado de
 * negocio: cada mensaje simplemente dispara un refetch por HTTP en quien
 * esté escuchando.
 */
export class RealtimeConnection {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private token: string;
  private closedByUser = false;
  private retryMs = 1000;

  constructor(token: string) {
    this.token = token;
    this.connect();
  }

  private connect(): void {
    const url = `${WS_BASE}?token=${encodeURIComponent(this.token)}`;
    this.ws = new WebSocket(url);
    this.ws.onmessage = (ev) => {
      if (ev.data === "pong") return;
      try {
        const msg = JSON.parse(ev.data) as WsMessage;
        if (msg.event === "heartbeat" || msg.event === "connection.ready") return;
        this.listeners.forEach((fn) => fn(msg));
      } catch {
        // mensaje no-JSON (pong), se ignora
      }
    };
    this.ws.onclose = () => {
      if (this.closedByUser) return;
      setTimeout(() => this.connect(), this.retryMs);
      this.retryMs = Math.min(this.retryMs * 1.5, 15000);
    };
    this.ws.onopen = () => {
      this.retryMs = 1000;
    };
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  close(): void {
    this.closedByUser = true;
    this.ws?.close();
  }
}
