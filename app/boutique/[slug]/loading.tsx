// UI-12 — BoutiqueProductPage (app/boutique/[slug]/page.tsx) est en
// `force-dynamic` et attend getPublicProduct (getProductBySlug +
// getActivePriceForProduct, Prisma) puis la session client avant de rendre.
// Même raison que app/boutique/loading.tsx (référence de style) : sans état
// de chargement dédié, écran blanc silencieux le temps du fetch. Squelette
// repris sur le gabarit réel de la fiche produit : hero (image + titre +
// prix), colonne de contenu (articles), aside "Informations produit" +
// bouton d'achat.
import { SkeletonBlock, SkeletonLine } from "@/components/ui/Skeleton";

export default function BoutiqueProductLoading() {
  return (
    <main className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-5xl animate-pulse px-6 py-12 sm:py-16">
          <SkeletonLine width="w-40" height="h-4" />

          <div className="mt-6 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
            <SkeletonBlock className="mx-auto aspect-[3/4] w-full max-w-[200px] lg:mx-0" />

            <div className="max-w-3xl">
              <SkeletonLine width="w-40" height="h-3" />
              <SkeletonLine width="w-72" height="h-8" className="mt-3" />
              <SkeletonLine width="w-96" height="h-4" className="mt-3 max-w-full" />
              <SkeletonLine width="w-24" height="h-6" className="mt-4" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl animate-pulse px-6 py-10 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <SkeletonLine width="w-48" height="h-5" />
                <SkeletonLine width="w-full" height="h-4" className="mt-3" />
                <SkeletonLine width="w-2/3" height="h-4" className="mt-2" />
              </div>
            ))}
          </div>

          <aside className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <SkeletonLine width="w-40" height="h-5" />
            <div className="mt-4 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-start justify-between gap-4">
                  <SkeletonLine width="w-16" height="h-4" />
                  <SkeletonLine width="w-24" height="h-4" />
                </div>
              ))}
            </div>
            <SkeletonBlock className="mt-6 h-24 w-full rounded-xl border border-dashed border-neutral-300 bg-white" />
          </aside>
        </div>
      </section>
    </main>
  );
}
