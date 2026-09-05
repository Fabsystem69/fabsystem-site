import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type AdminButtonVariant = "primary" | "secondary" | "success" | "warning" | "danger" | "ghost";
export type AdminButtonSize = "sm" | "md";

const VARIANT_STYLES: Record<AdminButtonVariant, string> = {
  primary: "bg-brand-400 text-neutral-950 hover:bg-brand-300",
  secondary: "border border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800",
  success: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
  warning: "border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20",
  danger: "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20",
  ghost: "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100",
};

// "sm" couvre les actions compactes en ligne dans un tableau (ex. Activer /
// Archiver sur une ligne de commande) — plus petit texte, moins de padding
// que "md" (défaut, utilisé pour les actions de page dans AdminPageHeader).
const SIZE_STYLES: Record<AdminButtonSize, string> = {
  md: "h-9 min-h-9 px-3.5 text-sm",
  sm: "h-9 min-h-9 px-3 text-xs",
};

const BASE_CLASS =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";

export function AdminButton({
  variant = "secondary",
  size = "md",
  href,
  className = "",
  children,
  ...props
}: {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  href?: string;
  className?: string;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = `${BASE_CLASS} ${SIZE_STYLES[size]} ${VARIANT_STYLES[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" {...props} className={classes}>
      {children}
    </button>
  );
}
