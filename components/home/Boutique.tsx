import Image from "next/image";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { formatEuroFromCents } from "@/lib/format";
import { getActivePriceForProduct, listActiveBuyNowProducts } from "@/lib/services/catalog";
import { isPrestationsPackSlug } from "@/lib/prestations-packs";

// Home V2 — Boutique (docs/refonte-site-public/home/07-BOUTIQUE.md).
// Maximum 3 produits réels, un produit vedette mis en avant, aucun produit
// fictif, aucune promotion inventée (§3, §6, §15).
async function getFeaturedProducts() {
  const products = (await listActiveBuyNowProducts()).filter(
    (product) => !isPrestationsPackSlug(product.slug)
  );

  const selected = products.slice(0, 3);

  const settled = await Promise.allSettled(
    selected.map(async (product) => ({ product, price: await getActivePriceForProduct(product.id) }))
  );

  return settled
    .filter(
      (result): result is PromiseFulfilledResult<{
        product: (typeof selected)[number];
        price: Awaited<ReturnType<typeof getActivePriceForProduct>>;
      }> => result.status === "fulfilled"
    )
    .map((result) => result.value);
}

export async function Boutique() {
  const entries = await getFeaturedProducts();

  if (entries.length === 0) {
    // Aucun produit actif : conformément à MASTER-12 §128 (« ne jamais
    // inventer du contenu pour remplir une composition »), la section
    // n'affiche aucun faux produit. Elle reste discrète plutôt que masquée
    // entièrement, car le CTA vers la Boutique complète reste pertinent.
    return (
      <Section tone="muted">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          Des ressources pour aller plus loin
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600">
          Le catalogue est en cours de préparation.
        </p>
        <div className="mt-6">
          <Button href="/boutique" variant="tertiary">
            Voir toute la boutique →
          </Button>
        </div>
      </Section>
    );
  }

  const [featured, ...secondary] = entries;

  return (
    <Section tone="muted">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          Des ressources pour aller plus loin
        </h2>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Produit vedette */}
        <div className="flex flex-col gap-6 rounded-2xl border border-neutral-200 bg-white p-6 sm:flex-row sm:p-8">
          {featured.product.featuredImage ? (
            <div className="w-full shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 sm:w-40">
              <Image
                src={featured.product.featuredImage}
                alt={`Couverture de ${featured.product.name}`}
                width={320}
                height={427}
                className="h-48 w-full object-cover object-top sm:h-full"
              />
            </div>
          ) : null}
          <div className="flex flex-1 flex-col">
            <h3 className="text-lg font-bold text-neutral-950">{featured.product.name}</h3>
            {featured.product.shortDescription ? (
              <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">
                {featured.product.shortDescription}
              </p>
            ) : null}
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-base font-semibold text-neutral-900">
                {formatEuroFromCents(featured.price.unitAmountCents)}
              </p>
              <Button href={`/boutique/${featured.product.slug}`} variant="primary">
                Découvrir →
              </Button>
            </div>
          </div>
        </div>

        {/* Produits secondaires, si le catalogue le justifie (§5) */}
        {secondary.length > 0 ? (
          <div className="flex flex-col gap-4">
            {secondary.map(({ product, price }) => (
              <div key={product.id} className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
                {product.featuredImage ? (
                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
                    <Image
                      src={product.featuredImage}
                      alt={`Couverture de ${product.name}`}
                      width={96}
                      height={128}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-neutral-950">{product.name}</p>
                  <p className="text-xs text-neutral-500">{formatEuroFromCents(price.unitAmountCents)}</p>
                </div>
                <a
                  href={`/boutique/${product.slug}`}
                  className="shrink-0 text-sm font-semibold text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                >
                  Découvrir →
                </a>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-8">
        <Button href="/boutique" variant="tertiary">
          Voir toute la boutique →
        </Button>
      </div>
    </Section>
  );
}
