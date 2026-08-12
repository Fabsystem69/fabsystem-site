// UI-12 — ProjectPage (app/mon-compte/projets/[projectId]/page.tsx) attend
// getProject puis Promise.all([getProjectValues, listDependencies]) — au
// moins trois lectures Prisma séquentielles avant de rendre les familles
// Énergie/Distribution. Squelette limité à la zone `children` du layout
// (sidebar/header ne re-rendent pas), repris sur le gabarit réel post
// refonte visuelle UI-12 : lien retour, carte identité (titre + badge +
// bandeau "prochaine action"), bloc "Informations retenues" en grille,
// puis un en-tête de famille (icône ronde + compteur) suivi d'une carte
// pulsante par moteur pour les familles Énergie (6) et Distribution (4) —
// le nombre réel de ENGINE_FAMILIES (lib/engine-payload.ts).
import { SkeletonLine } from "@/components/ui/Skeleton";

function ModuleCardRow() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
      <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-200" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <SkeletonLine width="w-40" height="h-4" />
        <SkeletonLine width="w-56" height="h-3" />
      </div>
    </div>
  );
}

function FamilySection({ count }: { count: number }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 shrink-0 rounded-full bg-neutral-300" />
        <div className="space-y-1.5">
          <SkeletonLine width="w-24" height="h-4" />
          <SkeletonLine width="w-32" height="h-3" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <ModuleCardRow key={i} />
        ))}
      </div>
    </section>
  );
}

export default function ProjectLoading() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Identité Projet */}
      <div>
        <SkeletonLine width="w-24" height="h-4" />
        <div className="mt-4 rounded-card border border-neutral-200 bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <SkeletonLine width="w-56" height="h-7" />
            <SkeletonLine width="w-20" height="h-5" className="rounded-full" />
          </div>
          <SkeletonLine width="w-40" height="h-4" className="mt-2" />
          <div className="mt-4 h-11 rounded-lg bg-neutral-100" />
        </div>
      </div>

      {/* Informations retenues */}
      <section>
        <SkeletonLine width="w-48" height="h-5" />
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-neutral-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <SkeletonLine width="w-32" height="h-4" />
                <SkeletonLine width="w-16" height="h-5" className="rounded-full" />
              </div>
              <SkeletonLine width="w-20" height="h-6" className="mt-2" />
            </div>
          ))}
        </div>
      </section>

      {/* Famille Énergie (6 moteurs) puis Distribution (4 moteurs) */}
      <FamilySection count={6} />
      <FamilySection count={4} />
    </div>
  );
}
