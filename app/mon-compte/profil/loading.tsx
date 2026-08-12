// UI-12 — MonProfilPage (app/mon-compte/profil/page.tsx) attend
// getCustomerAccountOverview (Prisma) avant de rendre. Squelette limité à la
// zone `children` du layout (sidebar/header ne re-rendent pas) : titre, puis
// les deux cartes réelles (identité + accès sécurisé).
import { SkeletonCard, SkeletonLine } from "@/components/ui/Skeleton";

export default function MonProfilLoading() {
  return (
    <div className="max-w-lg animate-pulse space-y-6">
      <div>
        <SkeletonLine width="w-32" height="h-7" />
        <SkeletonLine width="w-64" height="h-4" className="mt-2" />
      </div>

      <SkeletonCard>
        <SkeletonLine width="w-16" height="h-3" />
        <SkeletonLine width="w-48" height="h-4" className="mt-2" />
        <SkeletonLine width="w-12" height="h-3" className="mt-4" />
        <SkeletonLine width="w-32" height="h-4" className="mt-2" />
      </SkeletonCard>

      <SkeletonCard>
        <SkeletonLine width="w-28" height="h-4" />
        <SkeletonLine width="w-full" height="h-4" className="mt-2" />
        <SkeletonLine width="w-2/3" height="h-4" className="mt-1" />
        <SkeletonLine width="w-24" height="h-9" className="mt-4 rounded-md" />
      </SkeletonCard>
    </div>
  );
}
