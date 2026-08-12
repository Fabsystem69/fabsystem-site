// UI-12 — Primitives de squelette de chargement, factorisées pour éviter de
// répéter le même motif "bloc gris pulsant" dans chaque loading.tsx
// (app/mon-compte/**, app/boutique/[slug]). Purement visuel : aucune donnée
// affichée, jamais de faux texte pouvant passer pour du contenu réel
// (MASTER-06 §22). Reprend la palette neutral déjà utilisée par
// app/boutique/loading.tsx (seul loading.tsx existant avant UI-12).

import type { HTMLAttributes } from "react";

/**
 * Ligne de texte grise pulsante. `width` accepte n'importe quelle classe
 * Tailwind de largeur (ex. "w-24", "w-1/2", "w-full").
 */
export function SkeletonLine({
  width = "w-full",
  height = "h-4",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return <div className={`${height} ${width} rounded bg-neutral-200 ${className}`} />;
}

/**
 * Bloc rectangulaire gris pulsant générique (image, bouton, zone libre).
 */
export function SkeletonBlock({
  className = "",
  ...props
}: { className?: string } & HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-lg bg-neutral-200 ${className}`} {...props} />;
}

/**
 * Carte grise pulsante (motif "carte module"/"carte commande") : bordure +
 * fond blanc identiques aux vraies cartes (components/ui/Card.tsx), avec un
 * contenu injecté par l'appelant (lignes/blocs Skeleton).
 */
export function SkeletonCard({
  className = "",
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-card border border-neutral-200 bg-white p-5 shadow-card ${className}`}>
      {children}
    </div>
  );
}
