import type { ElementType, HTMLAttributes, ReactNode } from "react";

// Shell public (UI-2) : largeur de contenu unique pour tout le site public.
// `mx-auto max-w-6xl px-6` est déjà la convention dominante du code existant
// (36 occurrences relevées par l'audit UI-1) — ce composant la nomme plutôt
// que d'introduire une nouvelle valeur, conformément à MASTER-12 §15
// (largeur de contenu contrôlée) et §140-141 (tokens/rôles plutôt que
// valeurs dispersées).

export type ContainerSize = "narrow" | "default" | "wide";

const SIZE_CLASS: Record<ContainerSize, string> = {
  // Lecture longue (texte éditorial) — MASTER-12 §15 : "largeur maximale
  // pour la lecture".
  narrow: "max-w-3xl",
  // Défaut du site : Header, Footer, la majorité des sections de contenu.
  default: "max-w-6xl",
  // Compositions plus larges (grilles, photographies) — MASTER-12 §15 :
  // "container plus large pour compositions".
  wide: "max-w-7xl",
};

export function Container<T extends ElementType = "div">({
  as,
  size = "default",
  className = "",
  children,
  ...props
}: {
  as?: T;
  size?: ContainerSize;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "as">) {
  const Tag = (as ?? "div") as ElementType;

  return (
    <Tag className={`mx-auto w-full px-6 ${SIZE_CLASS[size]} ${className}`} {...props}>
      {children}
    </Tag>
  );
}
