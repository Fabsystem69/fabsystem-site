import { SkeletonLine, SkeletonBlock } from "@/components/ui/Skeleton";

// UI-12 (suite) — Home est en `force-dynamic` : LesBases et Confiance
// lisent le catalogue/les témoignages en base à chaque requête
// (components/home/LesBases.tsx, Confiance.tsx). Sans état de chargement
// dédié, comme sur /boutique avant UI-10, Next.js n'affiche rien tant que
// la page n'a pas fini de charger. `page.tsx` vit dans le groupe de
// routes `(home)` (n'affecte pas l'URL "/") uniquement pour que ce
// loading.tsx reste scopé à la Home — un loading.tsx à la racine de
// app/ deviendrait le fallback de toute route sans son propre
// loading.tsx (comportement en cascade de Next.js), ce qui afficherait
// ce squelette Home sur des pages sans rapport (À propos, Contact...).
//
// Squelette repris sur l'ordre réel des sections (page.tsx) : Hero →
// Trois univers → Parcours → Outils gratuits → Les bases (fetch réel) →
// CTA final. (Section "Boutique" retirée de la Home — voir page.tsx.)
function CardGridSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-6 py-8">
      <SkeletonLine width="w-40" height="h-3" />
      <SkeletonLine width="w-72" height="h-6" className="mt-3" />
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="rounded-card border border-neutral-200 p-5 shadow-card">
            <SkeletonBlock className="mb-4 h-36 w-full" />
            <SkeletonLine width="w-16" height="h-3" />
            <SkeletonLine width="w-32" height="h-5" className="mt-2" />
            <SkeletonLine width="w-full" height="h-4" className="mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomeLoading() {
  return (
    <main>
      {/* Hero */}
      <div className="animate-pulse bg-neutral-900 px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SkeletonBlock className="h-8 w-2/3 bg-neutral-700" />
          <SkeletonBlock className="mt-3 h-8 w-1/2 bg-neutral-700" />
          <SkeletonBlock className="mt-5 h-4 w-3/4 bg-neutral-800" />
          <div className="mt-8 flex gap-3">
            <SkeletonBlock className="h-11 w-48 bg-neutral-700" />
            <SkeletonBlock className="h-11 w-56 bg-neutral-800" />
          </div>
        </div>
      </div>

      {/* Trois univers */}
      <CardGridSkeleton cards={3} />

      {/* Parcours (3 colonnes texte, pas de fetch) */}
      <div className="mx-auto max-w-6xl animate-pulse px-6 py-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <SkeletonLine width="w-6" height="h-3" />
              <SkeletonLine width="w-32" height="h-5" className="mt-2" />
              <SkeletonLine width="w-full" height="h-4" className="mt-2" />
            </div>
          ))}
        </div>
      </div>

      {/* Outils gratuits, Les bases — même motif de grille, représentant
          les sections qui lisent réellement le catalogue. */}
      <CardGridSkeleton cards={3} />
      <CardGridSkeleton cards={2} /> {/* Les bases : ebook vedette + repères */}

      {/* CTA final */}
      <div className="animate-pulse bg-neutral-900 px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <SkeletonBlock className="h-6 w-1/2 bg-neutral-700" />
          <SkeletonBlock className="mt-3 h-4 w-2/3 bg-neutral-800" />
        </div>
      </div>
    </main>
  );
}
