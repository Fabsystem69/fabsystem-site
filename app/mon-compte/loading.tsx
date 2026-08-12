// UI-12 — MonComptePage (app/mon-compte/page.tsx) attend Promise.all([
// listProjectsForCustomer, getCustomerAccountOverview ]) avant de rendre :
// deux lectures Prisma réelles. Le layout (app/mon-compte/layout.tsx) reste
// affiché pendant ce chargement (header + sidebar DashboardNav ne
// re-rendent pas), donc ce squelette ne couvre que la zone `children` :
// titre, section "Mes projets" (une carte "reprendre le projet"), section
// "Mes achats" (une carte résumé), au même gabarit que la page réelle.
import { SkeletonCard, SkeletonLine } from "@/components/ui/Skeleton";

export default function MonCompteLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div>
        <SkeletonLine width="w-40" height="h-7" />
        <SkeletonLine width="w-64" height="h-4" className="mt-2" />
      </div>

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <SkeletonLine width="w-28" height="h-5" />
          <SkeletonLine width="w-48" height="h-4" />
        </div>
        <SkeletonCard className="mt-4">
          <SkeletonLine width="w-32" height="h-3" />
          <SkeletonLine width="w-56" height="h-5" className="mt-3" />
          <SkeletonLine width="w-72" height="h-4" className="mt-2" />
          <SkeletonLine width="w-32" height="h-10" className="mt-4 rounded-lg" />
        </SkeletonCard>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-3">
          <SkeletonLine width="w-24" height="h-5" />
          <SkeletonLine width="w-40" height="h-4" />
        </div>
        <SkeletonCard className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <SkeletonLine width="w-32" height="h-4" />
            <SkeletonLine width="w-24" height="h-6" className="rounded-full" />
          </div>
        </SkeletonCard>
      </section>
    </div>
  );
}
