import Image from "next/image";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { formatEuroFromCents } from "@/lib/format";
import { findPrestationsPackIncludingEbook } from "@/lib/prestations-packs";
import { getActivePriceForProduct, getProductBySlug } from "@/lib/services/catalog";
import { isHttpError } from "@/lib/http-errors";

// Les Bases V2 — Passerelle Boutique
// (docs/refonte-site-public/les-bases/04-PASSERELLE-BOUTIQUE.md). Une
// passerelle, pas un catalogue : au maximum les deux ebooks réels prévus
// en V1 (§3), prix dynamique venant de la même source que la Boutique
// (§5 — jamais codé en dur ici), déduction affichée uniquement si
// réellement applicable via le même mécanisme que la fiche Boutique
// (aucune nouvelle logique tarifaire). Aucun filtre, catégorie ni
// catalogue extensible (§9).
const LES_BASES_GUIDE_SLUGS = ["ebook-electricite-van", "ebook-electricite-bateau"] as const;

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

export async function PasserelleBoutique() {
  const settled = await Promise.all(LES_BASES_GUIDE_SLUGS.map((slug) => getGuide(slug)));
  const guides = settled.filter((g): g is NonNullable<typeof g> => g !== null);

  if (guides.length === 0) {
    return null;
  }

  return (
    <Section tone="muted">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
        Pour aller plus loin
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
        Vous maîtrisez les bases ?
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-700 sm:text-base">
        Les guides FabSystem vous accompagnent ensuite dans la conception et la réalisation
        complète de votre installation.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 sm:max-w-3xl">
        {guides.map(({ product, price }) => {
          const isDeductible = findPrestationsPackIncludingEbook(product.slug) !== undefined;

          return (
            <article
              key={product.id}
              className="flex gap-4 rounded-card border border-neutral-200 bg-white p-5 shadow-card"
            >
              {product.featuredImage ? (
                <div className="w-20 shrink-0 overflow-hidden rounded-lg border border-neutral-200">
                  <Image
                    src={product.featuredImage}
                    alt={product.name}
                    width={160}
                    height={213}
                    className="h-auto w-full object-cover"
                  />
                </div>
              ) : null}

              <div className="flex flex-1 flex-col">
                <h3 className="text-sm font-semibold text-neutral-950">{product.name}</h3>
                {product.shortDescription ? (
                  <p className="mt-1.5 flex-1 text-xs leading-relaxed text-neutral-600">
                    {product.shortDescription}
                  </p>
                ) : null}

                <p className="mt-3 text-sm font-semibold text-neutral-900">
                  {formatEuroFromCents(price.unitAmountCents)}
                </p>
                {isDeductible ? (
                  <p className="text-[11px] text-neutral-500">
                    Déductible de votre accompagnement FabSystem
                  </p>
                ) : null}

                <Button href={`/boutique/${product.slug}`} variant="secondary" className="mt-3">
                  Découvrir le guide
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8">
        <Button href="/boutique" variant="primary">
          Voir la Boutique →
        </Button>
      </div>
    </Section>
  );
}
