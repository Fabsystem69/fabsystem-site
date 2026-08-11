import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { formatEuroFromCents } from "@/lib/format";
import { getActivePriceForProduct, getProductBySlug } from "@/lib/services/catalog";
import { isHttpError } from "@/lib/http-errors";

// Outils V2 — Guides (docs/refonte-site-public/Outils/01-HUB-PUBLIC.md
// §10). Maximum deux guides réels, prix dynamique réel — même source que
// /boutique, aucune logique tarifaire dupliquée. Ne recrée pas une
// Boutique dans la page Outils.
const OUTILS_GUIDE_SLUGS = ["ebook-electricite-van", "ebook-electricite-bateau"] as const;

async function getGuide(slug: string) {
  try {
    const product = await getProductBySlug(slug);
    if (product.status !== "ACTIVE" || product.purchaseMode !== "BUY_NOW") {
      return null;
    }
    const price = await getActivePriceForProduct(product.id);
    return { product, price };
  } catch (error) {
    if (isHttpError(error) && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function Guides() {
  const settled = await Promise.all(OUTILS_GUIDE_SLUGS.map((slug) => getGuide(slug)));
  const guides = settled.filter((g): g is NonNullable<typeof g> => g !== null);

  if (guides.length === 0) {
    return null;
  }

  return (
    <Section tone="muted">
      <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
        Envie d&apos;aller plus loin ?
      </h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600">
        Les guides FabSystem reprennent ces calculs dans l&apos;ordre du chantier, avec une méthode
        complète.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:max-w-2xl">
        {guides.map(({ product, price }) => (
          <Link
            key={product.id}
            href={`/boutique/${product.slug}`}
            className="flex gap-3 rounded-card border border-neutral-200 bg-white p-4 shadow-card transition-colors hover:border-neutral-300"
          >
            {product.featuredImage ? (
              <div className="w-14 shrink-0 overflow-hidden rounded-lg border border-neutral-200">
                <Image
                  src={product.featuredImage}
                  alt={product.name}
                  width={140}
                  height={187}
                  className="h-auto w-full object-cover"
                />
              </div>
            ) : null}
            <div>
              <p className="text-sm font-semibold text-neutral-950">{product.name}</p>
              <p className="mt-1 text-sm font-semibold text-neutral-700">
                {formatEuroFromCents(price.unitAmountCents)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <Button href="/boutique" variant="tertiary">
          Voir la Boutique →
        </Button>
      </div>
    </Section>
  );
}
