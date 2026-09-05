import type { ReactNode } from "react";

// Wrapper de page répété à la main sur chaque écran du dashboard (fond
// sombre, largeur max, padding) — centralisé ici pour que la refonte du
// thème (ou un futur ajustement d'espacement) se fasse à un seul endroit
// plutôt que sur 20+ fichiers. `maxWidth` reste un prop plutôt qu'une valeur
// fixe : les formulaires (création/édition) sont volontairement plus
// étroits que les listes/tableaux.
const MAX_WIDTH_CLASS = {
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "5xl": "max-w-5xl",
  "7xl": "max-w-7xl",
} as const;

export function DashboardPageShell({
  children,
  maxWidth = "7xl",
}: {
  children: ReactNode;
  maxWidth?: keyof typeof MAX_WIDTH_CLASS;
}) {
  return (
    <div className="min-h-full bg-[#0a0a0b] text-neutral-100">
      <main className={`mx-auto ${MAX_WIDTH_CLASS[maxWidth]} space-y-6 px-4 py-6 sm:px-6 sm:py-7 lg:px-8`}>
        {children}
      </main>
    </div>
  );
}
