import Link from "next/link";
import type { Metadata } from "next";
import { formatEuroFromCents } from "@/lib/format";
import { isPrestationsPackSlug } from "@/lib/prestations-packs";
import {
  getActivePriceForProduct,
  listActiveBuyNowProducts,
} from "@/lib/services/catalog";

// Le catalogue change dès qu'un produit est activé/désactivé ou qu'un prix
// change dans le dashboard : jamais de rendu statique figé au build, toujours
// une lecture fraîche en base à chaque requête.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boutique",
  description:
    "Découvrez les produits numériques FabSystem disponibles à l'achat prochainement.",
  alternates: {
    canonical: "/boutique",
  },
};

async function getCatalogProducts() {
  // Les packs d'accompagnement à distance (Amarrage/Cap/Passerelle/Grand
  // Large) vivent dans le même catalogue Product que les ebooks pour
  // réutiliser le panier existant, mais se vendent depuis /prestations —
  // exclus ici pour ne pas dupliquer/brouiller la grille boutique.
  const products = (await listActiveBuyNowProducts()).filter(
    (product) => !isPrestationsPackSlug(product.slug)
  );

  const settled = await Promise.allSettled(
    products.map(async (product) => ({
      product,
      price: await getActivePriceForProduct(product.id),
    }))
  );

  return settled
    .filter((result): result is PromiseFulfilledResult<{
      product: (typeof products)[number];
      price: Awaited<ReturnType<typeof getActivePriceForProduct>>;
    }> => result.status === "fulfilled")
    .map((result) => result.value);
}

export default async function BoutiquePage() {
  const entries = await getCatalogProducts();

  return (
    <main className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Boutique FabSystem
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              Ressources numériques pour fiabiliser votre installation embarquée
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
              Une première sélection de contenus numériques FabSystem, en lecture seule pour
              l&apos;instant. Les achats arriveront dans un prochain sprint.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-neutral-950">Aucun produit disponible</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Le catalogue numérique est en cours de préparation. Revenez bientôt pour découvrir
              les premiers ebooks et téléchargements FabSystem.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {entries.map(({ product, price }) => (
              <article
                key={product.id}
                className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      {product.productType === "EBOOK"
                        ? "Ebook"
                        : product.productType === "BUNDLE"
                          ? "Bundle"
                          : "Téléchargement"}
                    </p>
                    <h2 className="mt-2 text-lg font-semibold text-neutral-950">{product.name}</h2>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-neutral-900">
                    {formatEuroFromCents(price.unitAmountCents)}
                  </p>
                </div>

                <p className="mt-3 flex-1 text-sm leading-relaxed text-neutral-700">
                  {product.shortDescription || "Description bientôt disponible."}
                </p>

                <div className="mt-5">
                  <Link
                    href={`/boutique/${product.slug}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
                  >
                    Voir la fiche produit
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
