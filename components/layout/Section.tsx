import type { HTMLAttributes, ReactNode } from "react";
import { Container, type ContainerSize } from "@/components/layout/Container";

// Shell public (UI-2) : rythme vertical unique pour les futures sections de
// page publique (Home, Services, Boutique, Les bases, Outils...). Utilise le
// token `spacing.section` ajouté en UI-1 plutôt qu'une valeur ad-hoc.
// MASTER-12 §212 : une section sombre doit avoir une fonction (CTA, Footer,
// transition), pas une alternance mécanique — ce composant expose donc un
// `tone` explicite plutôt qu'un choix aléatoire par page.

export type SectionTone = "light" | "muted" | "dark";

const TONE_CLASS: Record<SectionTone, string> = {
  light: "bg-white text-neutral-900",
  muted: "bg-neutral-50 text-neutral-900",
  dark: "bg-neutral-950 text-white",
};

export function Section({
  tone = "light",
  size = "default",
  className = "",
  containerClassName = "",
  children,
  ...props
}: {
  tone?: SectionTone;
  size?: ContainerSize;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
} & HTMLAttributes<HTMLElement>) {
  return (
    <section className={`py-section ${TONE_CLASS[tone]} ${className}`} {...props}>
      <Container size={size} className={containerClassName}>
        {children}
      </Container>
    </section>
  );
}
