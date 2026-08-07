import "server-only";
import { getProductBySlug } from "@/lib/services/catalog";
import { listPrestationsPackDefinitions } from "@/lib/prestations-packs";

// Resout, pour chaque pack defini dans lib/prestations-packs.ts, le productId
// reel en base s'il existe (le script scripts/seed-prestations-packs.ts doit
// avoir ete execute). Tolerant aux packs absents : la page /prestations reste
// fonctionnelle (bouton de repli vers /boutique) meme avant que le seed soit
// joue dans un environnement donne.
export async function getPrestationsPackProductIdBySlug(): Promise<Record<string, string>> {
  const definitions = listPrestationsPackDefinitions();

  const settled = await Promise.allSettled(
    definitions.map(async (definition) => ({
      slug: definition.slug,
      product: await getProductBySlug(definition.slug),
    }))
  );

  const result: Record<string, string> = {};

  for (const outcome of settled) {
    if (outcome.status !== "fulfilled") {
      continue;
    }

    const { slug, product } = outcome.value;

    if (product && product.status === "ACTIVE") {
      result[slug] = product.id;
    }
  }

  return result;
}
