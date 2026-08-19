import { Icon } from "./Icon";

export function Loading({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2 text-on-surface-variant py-16">
      <Icon name="progress_activity" className="animate-spin text-3xl" />
      <p className="font-body-md text-body-md">{label}</p>
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-margin-mobile my-stack-md bg-error-container text-on-error-container rounded-xl p-stack-md flex items-start gap-2">
      <Icon name="error" className="text-[20px] mt-0.5" />
      <div className="flex-1">
        <p className="font-body-md text-body-md">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="font-label-caps text-label-caps underline mt-1">
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}
