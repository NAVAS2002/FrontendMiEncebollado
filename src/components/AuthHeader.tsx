import { useNavigate } from "react-router-dom";
import { Icon } from "./Icon";
import { StoreLogo } from "./StoreLogo";

export function AuthHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  const navigate = useNavigate();

  return (
    <header className="w-full top-0 fixed flex items-center h-touch-target-min px-2 border-b border-outline-variant bg-surface z-50">
      <button
        aria-label="Volver"
        onClick={() => (onBack ? onBack() : navigate("/"))}
        className="h-touch-target-min w-touch-target-min flex items-center justify-center rounded-full hover:bg-surface-container-high active:scale-95 transition-all text-on-surface-variant shrink-0"
      >
        <Icon name="arrow_back" />
      </button>
      <div className="flex-1 flex items-center justify-center gap-2 pr-touch-target-min">
        <StoreLogo size="sm" />
        <h1 className="font-headline-md text-headline-md tracking-tight text-on-surface truncate">{title}</h1>
      </div>
    </header>
  );
}
