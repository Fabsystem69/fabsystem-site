import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { isHttpError } from "@/lib/http-errors";
import { formatEuroFromCents } from "@/lib/format";
import { findPrestationsPackIncludingEbook, getCategorieLabel } from "@/lib/prestations-packs";
import { getActivePriceForProduct, getProductBySlug } from "@/lib/services/catalog";
import { listDownloadGrantsForEmail } from "@/lib/services/download-grant";
import { getCustomerSessionFromCookie } from "@/lib/server/customer-session";

// Même raison que /boutique : le statut/prix/asset d'un produit peut changer
// à tout moment dans le dashboard, la fiche doit toujours lire la base.
export const dynamic = "force-dynamic";

type BoutiqueProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ProductForPage = Awaited<ReturnType<typeof getProductBySlug>>;
type ExistingGrant = Awaited<ReturnType<typeof listDownloadGrantsForEmail>>[number];

function getProductTypeLabel(value: "EBOOK" | "DIGITAL_DOWNLOAD" | "BUNDLE") {
  switch (value) {
    case "EBOOK":
      return "Ebook";
    case "DIGITAL_DOWNLOAD":
      return "Téléchargement numérique";
    case "BUNDLE":
      return "Bundle numérique";
  }
}

// Contenu editorial deja existant ailleurs dans le repo (page marketing
// /ebook/cabler-son-van), reutilise ici tel quel — rien n'est invente. Aucune
// entree pour l'ebook bateau : aucun contenu/visuel equivalent n'existe
// encore dans le repo pour ce produit.
const EBOOK_ENRICHMENT: Record<
  string,
  {
    coverSrc: string;
    coverAlt: string;
    sommaire: { n: string; title: string; detail: string }[];
  }
> = {
  "ebook-electricite-van": {
    coverSrc: "/ebook/couverture.jpg",
    coverAlt: "Couverture du livre « Câbler son van sans se planter »",
    sommaire: [
      { n: "01", title: "Les bases du 12V embarqué", detail: "Comprendre avant de câbler : tension, intensité, sections, ce qui compte vraiment." },
      { n: "02", title: "Dimensionner batterie et solaire", detail: "Calculer son besoin réel plutôt que de recopier le forum d'un autre projet." },
      { n: "03", title: "Choisir son architecture et son matériel", detail: "Schéma de principe, composants, ce qui est indispensable et ce qui ne l'est pas." },
      { n: "04", title: "Poser son installation dans l'ordre", detail: "La séquence qui évite de tout redémonter à la moitié du chantier." },
      { n: "05", title: "VASP et assurance", detail: "Ce qu'il faut savoir, sans y passer trois soirs à éplucher des forums." },
      { n: "06", title: "La plomberie embarquée", detail: "De la cuve à l'eau chaude : pompe, cuve, chauffe-eau, raccordements." },
      { n: "07", title: "Mise en service et diagnostic", detail: "Vérifier son installation et repérer une panne avant qu'elle ne tourne mal." },
      { n: "08", title: "Vivre avec son installation", detail: "Entretien, hivernage, et les questions qui reviennent le plus souvent." },
    ],
  },
};

async function getPublicProduct(slug: string) {
  try {
    const product = await getProductBySlug(slug);

    if (product.status !== "ACTIVE" || product.purchaseMode !== "BUY_NOW") {
      notFound();
    }

    const price = await getActivePriceForProduct(product.id);

    return {
      product,
      price,
    };
  } catch (error) {
    if (isHttpError(error) && error.status === 404) {
      notFound();
    }

    throw error;
  }
}

// Mission 3 : si le client connecte a deja un grant actif sur l'un des
// assets de ce produit (achat direct precedent OU pack qui l'inclut), on le
// signale au lieu de proposer un nouvel achat. Aucune verification par email
// en dur, aucune logique fragile : uniquement le mecanisme DownloadGrant deja
// utilise pour l'acces reel aux fichiers. Si le client n'est pas connecte ou
// qu'aucun grant n'est trouve, l'achat reste possible normalement.
async function findExistingAccess(
  product: ProductForPage,
  customerEmail: string
): Promise<ExistingGrant | null> {
  const assetIds = new Set(product.assets.map((productAsset) => productAsset.assetId));

  if (assetIds.size === 0) {
    return null;
  }

  const grants = await listDownloadGrantsForEmail(customerEmail);
  return grants.find((grant) => assetIds.has(grant.assetId)) ?? null;
}

export async function generateMetadata({
  params,
}: BoutiqueProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { product } = await getPublicProduct(slug);

    return {
      title: product.name,
      description:
        product.shortDescription ||
        "Fiche produit du catalogue numérique FabSystem.",
      alternates: {
        canonical: `/boutique/${product.slug}`,
      },
    };
  } catch {
    return {
      title: "Produit introuvable",
      description: "Le produit demandé n'est pas disponible dans la boutique FabSystem.",
    };
  }
}

export default async function BoutiqueProductPage({ params }: BoutiqueProductPageProps) {
  const { slug } = await params;
  const { product, price } = await getPublicProduct(slug);

  const enrichment = EBOOK_ENRICHMENT[product.slug];
  const includingPack = findPrestationsPackIncludingEbook(product.slug);

  const session = await getCustomerSessionFromCookie();
  const existingAccess = session
    ? await findExistingAccess(product, session.customer.email)
    : null;

  return (
    <main className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
          <Link
            href="/boutique"
            className="text-sm font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
          >
            Retour à la boutique
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
            {enrichment ? (
              <div className="mx-auto w-full max-w-[200px] overflow-hidden rounded-xl border border-neutral-200 shadow-sm lg:mx-0">
                <Image
                  src={enrichment.coverSrc}
                  alt={enrichment.coverAlt}
                  width={400}
                  height={534}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
            ) : null}

            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                {getProductTypeLabel(product.productType)}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                {product.name}
              </h1>
              <p className="mt-4 text-lg font-semibold text-neutral-900">
                {formatEuroFromCents(price.unitAmountCents)}
              </p>

              {includingPack ? (
                <p className="mt-4 max-w-xl rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Déjà inclus si vous prenez un pack Cap, Passerelle ou Grand Large{" "}
                  {getCategorieLabel(includingPack.categorie)} —{" "}
                  <Link
                    href="/prestations#accompagnement-distance"
                    className="font-semibold underline underline-offset-4"
                  >
                    voir les packs
                  </Link>
                  .
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-neutral-950">Description</h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                {product.description || product.shortDescription || "Description bientôt disponible."}
              </p>
            </article>

            {enrichment ? (
              <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-neutral-950">Sommaire</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {enrichment.sommaire.map((part) => (
                    <div
                      key={part.n}
                      className="flex gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4"
                    >
                      <span className="text-sm font-bold text-yellow-600">{part.n}</span>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{part.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                          {part.detail}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}
          </div>

          <aside className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <h2 className="text-base font-semibold text-neutral-950">Informations produit</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-neutral-500">Type</dt>
                <dd className="text-right font-medium text-neutral-900">
                  {getProductTypeLabel(product.productType)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-neutral-500">Prix</dt>
                <dd className="text-right font-medium text-neutral-900">
                  {formatEuroFromCents(price.unitAmountCents)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-4">
              {existingAccess ? (
                <>
                  <p className="text-sm font-semibold text-neutral-950">
                    {existingAccess.productId === product.id
                      ? "Vous avez déjà accès à cet ebook."
                      : `Vous avez déjà accès à cet ebook via votre pack ${existingAccess.product.name}.`}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                    Retrouvez votre lien de téléchargement dans votre espace client.
                  </p>
                  <Link
                    href="/mon-compte"
                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
                  >
                    Accéder à mon espace client
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-neutral-950">
                    Ajouter ce produit au panier
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                    Accès immédiat après paiement, depuis votre espace client.
                  </p>
                  <AddToCartButton productId={product.id} />
                </>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
