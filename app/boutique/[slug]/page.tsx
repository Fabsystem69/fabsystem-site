import { cache } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import FaqEbook from "@/components/FaqEbook";
import { isHttpError } from "@/lib/http-errors";
import { formatEuroFromCents } from "@/lib/format";
import { EBOOK_ENRICHMENT } from "@/lib/boutique-ebook-content";
import {
  findPrestationsPackIncludingEbook,
  getCategorieLabel,
  getUniversForEbookSlug,
} from "@/lib/prestations-packs";
import { getActivePriceForProduct, getProductBySlug } from "@/lib/services/catalog";
import { findExistingProductAccess } from "@/lib/services/product-access";
import { getCustomerSessionFromCookieOrAnonymous } from "@/lib/server/customer-session";

// Même raison que /boutique : le statut/prix/asset d'un produit peut changer
// à tout moment dans le dashboard, la fiche doit toujours lire la base.
export const dynamic = "force-dynamic";

type BoutiqueProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function getProductTypeLabel(value: "EBOOK" | "DIGITAL_DOWNLOAD" | "BUNDLE" | "SCHEMA_UNLOCK" | "COACHING_30MIN") {
  switch (value) {
    case "EBOOK":
      return "Guide pratique";
    case "DIGITAL_DOWNLOAD":
      return "Téléchargement numérique";
    case "BUNDLE":
      return "Bundle numérique";
    case "SCHEMA_UNLOCK":
    case "COACHING_30MIN":
      // Ne devrait jamais s'afficher : getPublicProduct() renvoie notFound()
      // pour ces types avant d'atteindre le rendu (voir plus haut).
      return "Déblocage éditeur";
  }
}

// Dédupliqué avec React.cache() : generateMetadata() et la page elle-même
// appellent tous deux getPublicProduct(slug) — sans cache, cela déclenchait
// deux lectures produit/prix distinctes pour le même rendu (UI-9A). cache()
// mémoïse par argument pour la durée d'un seul rendu serveur, jamais entre
// deux requêtes différentes : le catalogue reste lu en base à chaque
// requête (force-dynamic inchangé).
const getPublicProduct = cache(async (slug: string) => {
  try {
    const product = await getProductBySlug(slug);

    // v2.1 : SCHEMA_UNLOCK et COACHING_30MIN ne se vendent jamais via la
    // boutique generique (voir listActiveBuyNowProducts et
    // assertProductIsOrderable/Purchasable) — traite comme un produit
    // introuvable ici plutot que d'exposer une fiche achetable hors contexte.
    if (
      product.status !== "ACTIVE" ||
      product.purchaseMode !== "BUY_NOW" ||
      product.productType === "SCHEMA_UNLOCK" ||
      product.productType === "COACHING_30MIN"
    ) {
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
});

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
  const coverSrc = product.featuredImage || enrichment?.coverSrc || null;
  const coverAlt = enrichment?.coverAlt || product.name;
  const univers = getUniversForEbookSlug(product.slug);
  const isDeductible = findPrestationsPackIncludingEbook(product.slug) !== undefined;

  const session = await getCustomerSessionFromCookieOrAnonymous();
  const existingAccess = session
    ? await findExistingProductAccess(product, session.customer.email)
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
            {coverSrc ? (
              <div className="mx-auto w-full max-w-[200px] overflow-hidden rounded-xl border border-neutral-200 shadow-sm lg:mx-0">
                <Image
                  src={coverSrc}
                  alt={coverAlt}
                  width={400}
                  height={534}
                  className="h-auto w-full object-cover"
                  priority
                />
              </div>
            ) : null}

            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                {univers ? `${getCategorieLabel(univers)} · ` : ""}
                {getProductTypeLabel(product.productType)}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                {product.name}
              </h1>

              {enrichment?.promesseCourte ? (
                <p className="mt-3 max-w-xl text-base leading-relaxed text-neutral-700">
                  {enrichment.promesseCourte}
                </p>
              ) : null}

              {enrichment?.pageCount ? (
                <p className="mt-3 text-sm font-medium text-neutral-600">
                  ~{enrichment.pageCount} pages de contenu
                </p>
              ) : null}

              <p className="mt-4 text-lg font-semibold text-neutral-900">
                {formatEuroFromCents(price.unitAmountCents)}
              </p>

              {isDeductible ? (
                <p className="mt-1 text-sm text-neutral-600">
                  Déductible de votre accompagnement FabSystem
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            {enrichment?.forYouIf ? (
              <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-neutral-950">
                  Ce guide est fait pour vous si...
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {enrichment.forYouIf.map((item) => (
                    <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-neutral-800">
                      <span className="mt-0.5 text-brand-600" aria-hidden="true">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ) : !product.description && !product.shortDescription ? (
              <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-neutral-950">Description</h2>
                <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                  Description bientôt disponible.
                </p>
              </article>
            ) : null}

            {product.description ? (
              <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-neutral-950">Description</h2>
                <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                  {product.description}
                </p>
              </article>
            ) : null}

            {enrichment?.preview ? (
              <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-neutral-950">Aperçu du contenu</h2>
                <p className="mt-1 text-sm text-neutral-600">
                  De vraies pages du guide, pas des maquettes.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {enrichment.preview.map((page) => (
                    <div
                      key={page.src}
                      className="overflow-hidden rounded-xl border border-neutral-200"
                    >
                      <Image
                        src={page.src}
                        alt={page.alt}
                        width={1400}
                        height={933}
                        className="h-auto w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </article>
            ) : null}

            {enrichment?.benefits ? (
              <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-neutral-950">
                  Ce que vous allez apprendre
                </h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {enrichment.benefits.map((item) => (
                    <div key={item} className="flex gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                      <span className="mt-0.5 text-green-600" aria-hidden="true">✓</span>
                      <p className="text-sm leading-relaxed text-neutral-800">{item}</p>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}

            {enrichment?.sommaire ? (
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

            {enrichment?.formats ? (
              <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-neutral-950">
                  Un guide, plusieurs façons de l&apos;utiliser
                </h2>
                <p className="mt-1 text-sm text-neutral-600">Un seul achat, tout est fourni.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {enrichment.formats.map((f) => (
                    <div key={f.title} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                      <span className="text-xl" aria-hidden="true">{f.icon}</span>
                      <p className="mt-2 text-sm font-semibold text-neutral-900">{f.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-neutral-600">{f.detail}</p>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}

            {isDeductible ? (
              <Card className="border-brand-300 bg-brand-50/40 p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                  Vous avez besoin d&apos;aide ensuite ?
                </p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-800">
                  Le prix de votre ebook est déduit de votre accompagnement FabSystem. Vous pouvez
                  commencer seul et décider plus tard si vous souhaitez être accompagné.
                </p>
              </Card>
            ) : null}

            {enrichment?.showFaq ? (
              <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold text-neutral-950">
                  Questions fréquentes
                </h2>
                <div className="mt-4">
                  <FaqEbook variant={enrichment.faqVariant ?? "van"} />
                </div>
              </article>
            ) : null}
          </div>

          <aside className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-6 lg:sticky lg:top-24">
            <h2 className="text-base font-semibold text-neutral-950">Informations produit</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-neutral-500">Type</dt>
                <dd className="text-right font-medium text-neutral-900">
                  {getProductTypeLabel(product.productType)}
                </dd>
              </div>
              {univers ? (
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-neutral-500">Univers</dt>
                  <dd className="text-right font-medium text-neutral-900">
                    {getCategorieLabel(univers)}
                  </dd>
                </div>
              ) : null}
              {enrichment?.formats ? (
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-neutral-500">Formats</dt>
                  <dd className="text-right font-medium text-neutral-900">
                    {enrichment.formats.length} inclus
                  </dd>
                </div>
              ) : null}
              {enrichment?.pageCount ? (
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-neutral-500">Volume</dt>
                  <dd className="text-right font-medium text-neutral-900">
                    ~{enrichment.pageCount} pages
                  </dd>
                </div>
              ) : null}
              <div className="flex items-start justify-between gap-4">
                <dt className="text-neutral-500">Accès</dt>
                <dd className="text-right font-medium text-neutral-900">Espace client</dd>
              </div>
              <div className="flex items-start justify-between gap-4">
                <dt className="text-neutral-500">Prix</dt>
                <dd className="text-right font-medium text-neutral-900">
                  {formatEuroFromCents(price.unitAmountCents)}
                </dd>
              </div>
              {isDeductible ? (
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-neutral-500">Déduction</dt>
                  <dd className="text-right font-medium text-neutral-900">
                    Accompagnement FabSystem
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-4">
              {existingAccess ? (
                <>
                  <p className="text-sm font-semibold text-neutral-950">
                    Déjà dans votre bibliothèque
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                    Retrouvez votre lien de téléchargement dans votre espace client.
                  </p>
                  <Button
                    href={`/mon-compte/achats#produit-${product.slug}`}
                    variant="primary"
                    className="mt-4 w-full"
                  >
                    Accéder à mon guide
                  </Button>
                </>
              ) : (
                <>
                  <AddToCartButton productId={product.id} label="Acheter le guide" />
                  <p className="mt-3 text-xs leading-relaxed text-neutral-600">
                    Accès disponible après paiement depuis votre espace client. Votre premier achat
                    active automatiquement votre espace client FabSystem.
                  </p>
                </>
              )}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
