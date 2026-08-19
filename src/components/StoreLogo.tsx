import { Icon } from "./Icon";

const SIZE_CLASSES = {
  sm: { badge: "w-7 h-7", icon: "text-[16px]" },
  md: { badge: "w-9 h-9", icon: "text-[20px]" },
  lg: { badge: "w-12 h-12", icon: "text-[28px]" },
} as const;

export function StoreLogo({ size = "md" }: { size?: keyof typeof SIZE_CLASSES }) {
  const s = SIZE_CLASSES[size];
  return (
    <span className={`shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center ${s.badge}`}>
      <Icon name="storefront" filled className={s.icon} />
    </span>
  );
}

export function BrandTitle({ className = "" }: { className?: string }) {
  return <span className={`tracking-tight ${className}`}>MI ENCEBOLLADO</span>;
}
