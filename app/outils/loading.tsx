import { SkeletonLine, SkeletonBlock } from "@/components/ui/Skeleton";

// UI-12 (suite) — /outils est en `force-dynamic` : la section Guides
// (components/outils/Guides.tsx) lit le catalogue produit en base à
// chaque requête, comme /boutique. Squelette repris sur l'ordre réel de
// la page (app/outils/page.tsx) : intro compacte → grille de 6
// calculateurs (CalculateursIndex, statique) → Les basiques de l'atelier
// (statique) → Guides (fetch réel) → Accompagnement (statique).
export default function OutilsLoading() {
  return (
    <main className="bg-white text-neutral-900">
      <div className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl animate-pulse px-6 py-6 sm:py-8">
          <SkeletonLine width="w-32" height="h-3" />
          <SkeletonLine width="w-72" height="h-6" className="mt-3" />
          <SkeletonLine width="w-96" height="h-4" className="mt-2 max-w-full" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl animate-pulse px-6 py-8">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-8 w-28 rounded-full" />
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-neutral-200 p-0 shadow-card">
              <SkeletonBlock className="h-36 w-full rounded-b-none rounded-t-2xl" />
              <div className="p-5">
                <SkeletonLine width="w-16" height="h-3" />
                <SkeletonLine width="w-28" height="h-5" className="mt-2" />
                <SkeletonLine width="w-full" height="h-4" className="mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl animate-pulse px-6 py-8">
        <SkeletonLine width="w-56" height="h-6" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-card border border-neutral-200 p-5 shadow-card">
              <SkeletonBlock className="mb-3 h-16 w-16 rounded" />
              <SkeletonLine width="w-32" height="h-5" />
              <SkeletonLine width="w-16" height="h-4" className="mt-2" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
