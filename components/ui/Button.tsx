import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

// Primitive Button du site public/client (thème clair). Hiérarchie conforme
// à MASTER-12-DESIGN-SYSTEM.md §25-29 : principal / secondaire / tertiaire /
// destructif. Volontairement distincte de components/dashboard/ui/AdminButton
// (thème sombre Admin) — MASTER-12 §142 autorise des surfaces différentes
// par contexte tant que le token de marque reste partagé.

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive";

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-brand-400 text-neutral-900 hover:bg-brand-300",
  secondary: "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100",
  tertiary: "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
  destructive: "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
};

// h-10 (40px) respecte la taille tactile confortable exigée par MASTER-12 §30.
const BASE_CLASS =
  "inline-flex h-10 min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:cursor-not-allowed disabled:opacity-50";

type CommonProps = {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
};

type ButtonAsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonAsLink = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({ variant = "primary", href, className = "", children, ...props }: ButtonProps) {
  const classes = `${BASE_CLASS} ${VARIANT_STYLES[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
