import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Sin esto, un error de render deja la pantalla en blanco sin ninguna pista
 * (sobre todo en el celular, donde no hay consola a mano). Mostrar el error
 * en pantalla convierte un "no funciona" en algo diagnosticable.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center gap-4 p-6 bg-surface text-on-surface text-center">
          <p className="font-headline-md text-headline-md">Algo salió mal</p>
          <p className="font-body-md text-body-md text-on-surface-variant break-all max-w-md">
            {this.state.error.name}: {this.state.error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="h-11 px-5 rounded-full bg-primary text-on-primary font-label-caps text-label-caps"
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
