import { SkeletonLine, SkeletonBlock } from "@/components/ui/Skeleton";

// UI-12 (suite) — /formations est en `force-dynamic` : PasserelleBoutique
// (components/lesbases/PasserelleBoutique.tsx) lit le catalogue produit
// en base à chaque requête, comme /boutique. Squelette repris sur l'ordre
// réel de la page (app/formations/page.tsx) : intro compacte → nav des 3
// sous-sections → Modules (statique) → Bons gestes/Indispensables
// (statique) → Outils principaux (statique) → Passerelle Boutique (fetch
// réel) → Quiz (statique).
export default function FormationsLoading() {
  return (
    <main className="bg-white text-neutral-900">
      <div className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl animate-pulse px-6 py-6 sm:py-8">
          <SkeletonLine width="w-24" height="h-3" />
          <SkeletonLine width="w-64" height="h-6" className="mt-3" />
          <SkeletonLine width="w-96" height="h-4" className="mt-2 max-w-full" />
        </div>
      </div>

      <div className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-6xl animate-pulse gap-6 px-6 py-3">
          {[0, 1, 2].map((i) => (
            <SkeletonLine key={i} width="w-24" height="h-4" />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl animate-pulse px-6 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-card border border-neutral-200 p-5 shadow-card">
              <SkeletonLine width="w-16" height="h-3" />
              <SkeletonLine width="w-32" height="h-5" className="mt-2" />
              <SkeletonLine width="w-full" height="h-4" className="mt-2" />
              <SkeletonBlock className="mt-4 h-9 w-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl animate-pulse px-6 py-8">
        <SkeletonLine width="w-48" height="h-6" />
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
