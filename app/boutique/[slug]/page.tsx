import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { isHttpError } from "@/lib/http-errors";
import { formatEuroFromCents } from "@/lib/format";
import { getActivePriceForProduct, getProductBySlug } from "@/lib/services/catalog";

type BoutiqueProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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

          <div className="mt-6 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              {getProductTypeLabel(product.productType)}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              {product.name}
            </h1>
            <p className="mt-4 text-lg font-semibold text-neutral-900">
              {formatEuroFromCents(price.unitAmountCents)}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-neutral-950">Description</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
              {product.description || product.shortDescription || "Description bientôt disponible."}
            </p>
          </article>

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
              <p className="text-sm font-semibold text-neutral-950">Ajouter ce produit au panier</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                Le panier numérique est prêt pour enregistrer votre sélection. Le paiement sera
                branché dans un prochain sprint, sans modifier ce produit.
              </p>
              <AddToCartButton productId={product.id} />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
