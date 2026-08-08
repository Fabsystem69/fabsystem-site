import type { ReactNode } from "react";

// Pas de generalisation des colonnes (chaque page garde son propre <table>) :
// juste les classes de conteneur/en-tete/lignes partagees, pour un rendu
// SaaS sombre coherent sans imposer de structure rigide.
export function AdminTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-800/80 bg-neutral-900/60">
      <table className="min-w-full divide-y divide-neutral-800/80 text-sm">{children}</table>
    </div>
  );
}

export const adminTableHeadClass = "bg-neutral-900/80 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500";
export const adminTableHeadCellClass = "px-4 py-3";
export const adminTableBodyClass = "divide-y divide-neutral-800/80";
export const adminTableRowClass = "align-top transition-colors duration-150 hover:bg-neutral-800/30";
export const adminTableCellClass = "px-4 py-3 text-neutral-300";
export const adminTableCellStrongClass = "px-4 py-3 font-medium text-white";
