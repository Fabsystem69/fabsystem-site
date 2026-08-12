// UI-12 — MesProjetsPage (app/mon-compte/projets/page.tsx) attend
// listProjectsForCustomer (Prisma) avant de rendre. Squelette limité à la
// zone `children` du layout (sidebar/header ne re-rendent pas) : en-tête
// titre + compteur, bouton "Nouveau projet", puis une liste de "cartes
// projet" (mêmes proportions que les vraies lignes de projet).
import { SkeletonLine } from "@/components/ui/Skeleton";

export default function MesProjetsLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <SkeletonLine width="w-32" height="h-7" />
          <SkeletonLine width="w-72" height="h-4" className="mt-2" />
        </div>
        <SkeletonLine width="w-16" height="h-4" />
      </div>

      <SkeletonLine width="w-40" height="h-10" className="rounded-lg" />

      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-card border border-neutral-200 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <SkeletonLine width="w-40" height="h-5" />
                  <SkeletonLine width="w-16" height="h-5" className="rounded-full" />
                </div>
                <SkeletonLine width="w-56" height="h-4" className="mt-2" />
                <SkeletonLine width="w-32" height="h-3" className="mt-2" />
              </div>
              <SkeletonLine width="w-16" height="h-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
