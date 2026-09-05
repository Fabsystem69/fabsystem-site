import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { GuidesEtUnivers } from "@/components/boutique/GuidesEtUnivers";
import { UsageEtAcces } from "@/components/boutique/UsageEtAcces";
import { PasserelleAccompagnement } from "@/components/boutique/PasserelleAccompagnement";
import type { BoutiqueGuideEntry } from "@/components/boutique/types";
import { EBOOK_ENRICHMENT } from "@/lib/boutique-ebook-content";
import {
  findPrestationsPackIncludingEbook,
  getUniversForEbookSlug,
  isPrestationsPackSlug,
} from "@/lib/prestations-packs";
import {
  getActivePriceForProduct,
  listActiveBuyNowProducts,
} from "@/lib/services/catalog";
import { findExistingProductAccess } from "@/lib/services/product-access";
import { getCustomerSessionFromCookieOrAnonymous } from "@/lib/server/customer-session";

// Boutique V2 — Hub (docs/refonte-site-public/Boutique/00-BOUTIQUE-ARCHITECTURE.md
// à 05). Le catalogue change dès qu'un produit est activé/désactivé ou
// qu'un prix change dans le dashboard : jamais de rendu statique figé au
// build, toujours une lecture fraîche en base à chaque requête.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boutique",
  description:
    "Des guides pratiques FabSystem pour comprendre, concevoir et fiabiliser votre installation électrique embarquée. Bateau, van ou camping-car.",
  alternates: {
    canonical: "/boutique",
  },
};

async function buildGuideEntries(): Promise<BoutiqueGuideEntry[]> {
  // Les packs d'accompagnement à distance (Amarrage/Cap/Passerelle/Grand
  // Large) vivent dans le même catalogue Product que les ebooks pour
  // réutiliser le panier existant, mais se vendent depuis /prestations —
  // exclus ici pour ne pas dupliquer/brouiller la grille boutique
  // (MASTER-03 §29).
  // v2.1 : listActiveBuyNowProducts() exclut deja SCHEMA_UNLOCK cote requete
  // (voir lib/services/catalog.ts) — ce filtre par type re-affirme la
  // garantie au niveau TypeScript, en profondeur, plutot que de faire
  // confiance implicitement a la requete.
  const products = (await listActiveBuyNowProducts())
    .filter((product) => !isPrestationsPackSlug(product.slug))
    .filter(
      (
        product
      ): product is typeof product & {
        productType: "EBOOK" | "DIGITAL_DOWNLOAD" | "BUNDLE";
      } => product.productType !== "SCHEMA_UNLOCK"
    );

  const session = await getCustomerSessionFromCookieOrAnonymous();

  const settled = await Promise.allSettled(
    products.map(async (product) => {
      const [price, existingAccess] = await Promise.all([
        getActivePriceForProduct(product.id),
        session ? findExistingProductAccess(product, session.customer.email) : Promise.resolve(null),
      ]);

      const enrichment = EBOOK_ENRICHMENT[product.slug];

      const entry: BoutiqueGuideEntry = {
        id: product.id,
        slug: product.slug,
        name: product.name,
        shortDescription: product.shortDescription,
        productType: product.productType,
        featuredImage: enrichment?.coverSrc || product.featuredImage || null,
        priceCents: price.unitAmountCents,
        univers: getUniversForEbookSlug(product.slug),
        isDeductible: findPrestationsPackIncludingEbook(product.slug) !== undefined,
        formatsCount: enrichment?.formats?.length,
        pageCount: enrichment?.pageCount,
        owned: existingAccess !== null,
      };

      return entry;
    })
  );

  return settled
    .filter((result): result is PromiseFulfilledResult<BoutiqueGuideEntry> => result.status === "fulfilled")
    .map((result) => result.value);
}

export default async function BoutiquePage() {
  const entries = await buildGuideEntries();

  return (
    <main className="bg-white text-neutral-900">
      <PageIntro
        eyebrow="Je fais seul"
        title="Boutique"
        description="Des guides pratiques conçus à partir du terrain pour comprendre, concevoir et fiabiliser votre installation électrique. Bateau, van ou camping-car."
      />
      <GuidesEtUnivers entries={entries} />
      <UsageEtAcces />
      <PasserelleAccompagnement />
    </main>
  );
}
