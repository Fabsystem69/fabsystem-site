// UI-12 — MesAchatsPage (app/mon-compte/achats/page.tsx) attend
// getCustomerAccountOverview (Prisma) avant de rendre. Squelette limité à la
// zone `children` du layout (sidebar/header ne re-rendent pas) : titre, puis
// des "cartes commande" reprenant le gabarit réel (en-tête commande/total,
// grille Produits / Téléchargements).
import { SkeletonLine } from "@/components/ui/Skeleton";

export default function MesAchatsLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div>
        <SkeletonLine width="w-32" height="h-7" />
        <SkeletonLine width="w-72" height="h-4" className="mt-2" />
      </div>

      <div className="space-y-4">
        {[0, 1].map((order) => (
          <div key={order} className="rounded-card border border-neutral-200 bg-white p-6 shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <SkeletonLine width="w-40" height="h-5" />
                <SkeletonLine width="w-48" height="h-4" className="mt-2" />
              </div>
              <div className="sm:text-right">
                <SkeletonLine width="w-16" height="h-3" className="ml-auto" />
                <SkeletonLine width="w-20" height="h-4" className="ml-auto mt-2" />
              </div>
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div>
                <SkeletonLine width="w-20" height="h-4" />
                <div className="mt-3 space-y-3">
                  {[0, 1].map((i) => (
                    <div key={i} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                      <SkeletonLine width="w-32" height="h-4" />
                      <SkeletonLine width="w-24" height="h-3" className="mt-2" />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <SkeletonLine width="w-44" height="h-4" />
                <div className="mt-3 space-y-3">
                  {[0, 1].map((i) => (
                    <div key={i} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                      <SkeletonLine width="w-32" height="h-4" />
                      <SkeletonLine width="w-40" height="h-3" className="mt-2" />
                      <SkeletonLine width="w-28" height="h-10" className="mt-4 rounded-md" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
