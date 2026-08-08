import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type AdminButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_STYLES: Record<AdminButtonVariant, string> = {
  primary: "bg-brand-400 text-neutral-950 hover:bg-brand-300",
  secondary: "border border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800",
  danger: "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20",
  ghost: "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100",
};

const BASE_CLASS =
  "inline-flex h-9 min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50";

export function AdminButton({
  variant = "secondary",
  href,
  className = "",
  children,
  ...props
}: {
  variant?: AdminButtonVariant;
  href?: string;
  className?: string;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = `${BASE_CLASS} ${VARIANT_STYLES[variant]} ${className}`;

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
