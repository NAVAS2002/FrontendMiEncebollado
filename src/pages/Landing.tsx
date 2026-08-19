import { useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon";
import { StoreLogo } from "../components/StoreLogo";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-surface flex flex-col items-center justify-center px-margin-mobile antialiased">
      <div className="flex items-center gap-3 mb-stack-lg">
        <StoreLogo size="lg" />
        <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface">MI ENCEBOLLADO</h1>
      </div>
      <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg text-center max-w-xs">
        Elige cómo quieres entrar
      </p>

      <div className="w-full max-w-sm flex flex-col gap-stack-md">
        <button
          onClick={() => navigate("/mesero/login")}
          className="w-full h-16 rounded-xl bg-primary text-on-primary flex items-center gap-4 px-6 shadow-sm active:scale-[0.98] transition-all"
        >
          <Icon name="badge" className="text-3xl" />
          <div className="text-left">
            <p className="font-headline-md text-headline-md">Acceso Mesero</p>
            <p className="font-body-md text-[13px] opacity-90">Tomar pedidos con PIN</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/caja/login")}
          className="w-full h-16 rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface flex items-center gap-4 px-6 shadow-sm active:scale-[0.98] transition-all"
        >
          <Icon name="point_of_sale" className="text-3xl text-tertiary" />
          <div className="text-left">
            <p className="font-headline-md text-headline-md">Caja y administración</p>
            <p className="font-body-md text-[13px] text-on-surface-variant">Cobros, caja y reportes</p>
          </div>
        </button>
      </div>
    </div>
  );
}
