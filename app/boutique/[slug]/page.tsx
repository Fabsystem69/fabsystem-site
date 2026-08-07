import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import FaqEbook from "@/components/FaqEbook";
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

// Contenu editorial fusionne depuis l'ancienne page marketing dediee
// /ebook/cabler-son-van (supprimee : cette fiche boutique couvre desormais
// a la fois la vente et l'argumentaire). Rien n'est invente, tout est repris
// tel quel. La couverture vient en priorite de product.featuredImage (edite
// depuis le dashboard, donc pret pour les prochains ebooks comme
// camping-car sans toucher au code) ; coverSrc ici sert de repli pour les
// deux ebooks deja en catalogue tant que leur featuredImage n'est pas
// renseigne en base. Les champs optionnels ci-dessous ne s'affichent que
// s'ils sont fournis.
const EBOOK_ENRICHMENT: Record<
  string,
  {
    coverSrc: string;
    coverAlt: string;
    faqVariant?: "van" | "bateau";
    sommaire?: { n: string; title: string; detail: string }[];
    benefits?: string[];
    formats?: { icon: string; title: string; detail: string }[];
    reassuranceSuffix?: string;
    showFaq?: boolean;
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
    benefits: [
      "Dimensionner sa batterie et son solaire sans se tromper",
      "Poser son installation dans l'ordre qui évite de tout redémonter",
      "Comprendre la VASP et l'assurance sans y passer trois soirs",
      "La plomberie embarquée, de la cuve à l'eau chaude",
      "Mettre en service et repérer une panne avant qu'elle ne tourne mal",
      "Vivre avec son installation : entretien, hivernage, questions fréquentes",
    ],
    formats: [
      { icon: "🖥️", title: "Version bureau", detail: "Format confortable pour l'écran, schémas en grand format, pour une lecture posée avant de commencer." },
      { icon: "📖", title: "Version poche", detail: "Format compact, facile à garder sous la main sur le chantier — téléphone ou version imprimée." },
      { icon: "✍️", title: "Personnalisé & interactif", detail: "Votre nom en couverture, quiz à la fin de chaque partie pour vérifier que vous avez bien tout compris." },
    ],
    reassuranceSuffix:
      " sont déduits de la prestation. Ce livre n'est jamais un coût perdu — au pire, c'est votre meilleure préparation avant qu'on travaille ensemble.",
    showFaq: true,
    faqVariant: "van",
  },
  "ebook-electricite-bateau": {
    coverSrc: "/ebook/couverture-bateau.jpg",
    coverAlt: "Couverture du livre « De la lampe à pétrole au lithium »",
    benefits: [
      "Diagnostiquer l'existant avant de reprendre quoi que ce soit",
      "Distinguer ce qui relève de la loi (CE, Division 240) et des normes, et ce que l'assurance exige vraiment",
      "Dimensionner sa batterie, son solaire et coordonner ses sources de charge",
      "Choisir du matériel adapté au marin (sertissage, fusibles, coupe-batteries) et l'installer dans le bon ordre",
      "Mettre en place un réseau NMEA 0183/2000 et refaire sa plomberie embarquée en toute sécurité",
      "Vivre avec son installation : entretien, hivernage, diagnostic de panne",
    ],
    sommaire: [
      { n: "01", title: "Les bases que personne ne t'explique", detail: "Unités, loi d'Ohm, dangers du 12V, masse, corrosion galvanique : le socle avant de toucher un câble." },
      { n: "02", title: "Normes, réglementation & assurance", detail: "CE, Division 240, ISO 13297, dossier technique : ce qui est obligatoire et ce qui est opposable par l'assurance." },
      { n: "03", title: "Concevoir l'installation", detail: "État des lieux, bilan de consommation, sources, dimensionnement de la batterie." },
      { n: "04", title: "Choisir le matériel", detail: "Batterie, chargeurs, solaire, câbles, protections, monitoring : sur quels critères choisir." },
      { n: "05", title: "Installation pas à pas", detail: "L'ordre du chantier qui évite de tout redémonter, du gros câble à la mise sous tension." },
      { n: "06", title: "Réseau embarqué et NMEA", detail: "0183 vs 2000, topologie du bus, capteurs, redondance : mettre en réseau son bateau." },
      { n: "07", title: "Plomberie", detail: "Passe-coques, vannes, eau douce et eaux noires : le point de sécurité n°1 à bord." },
      { n: "08", title: "Mise en service et tests", detail: "Réglages de charge, tests en charge réelle, mesures de performance, carnet de bord." },
      { n: "09", title: "Vivre avec : guide du propriétaire", detail: "Contrôles mensuel et annuel, hivernage, diagnostic de panne, transmission du bateau." },
    ],
    formats: [
      { icon: "🖥️", title: "Version HTML haute qualité", detail: "Format confortable pour l'écran, schémas et photos de chantier en grand format." },
      { icon: "📱", title: "Version mobile légère", detail: "Se charge vite sur le chantier, pensée pour être consultée sur téléphone." },
      { icon: "📚", title: "Version EPUB", detail: "Pour liseuse ou appli de lecture, et facile à imprimer si vous préférez le papier." },
    ],
    reassuranceSuffix:
      " sont déduits de la prestation. Ce livre n'est jamais un coût perdu — au pire, c'est votre meilleure préparation avant qu'on travaille ensemble.",
    showFaq: true,
    faqVariant: "bateau",
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
  const coverSrc = product.featuredImage || enrichment?.coverSrc || null;
  const coverAlt = enrichment?.coverAlt || product.name;
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
              <>
                {enrichment.benefits ? (
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

                {enrichment.sommaire ? (
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

                {enrichment.formats ? (
                  <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-neutral-950">Formats inclus</h2>
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

                {enrichment.reassuranceSuffix ? (
                  <article className="rounded-2xl border-2 border-brand-400 bg-brand-50/40 p-6">
                    <p className="text-sm leading-relaxed text-neutral-800">
                      Et si vous passez ensuite par{" "}
                      <Link
                        href="/prestations#accompagnement-distance"
                        className="font-semibold underline underline-offset-4"
                      >
                        l&apos;accompagnement à distance FabSystem
                      </Link>
                      , les {formatEuroFromCents(price.unitAmountCents)}
                      {enrichment.reassuranceSuffix}
                    </p>
                  </article>
                ) : null}

                {enrichment.showFaq ? (
                  <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                    <h2 className="text-base font-semibold text-neutral-950">
                      Questions fréquentes
                    </h2>
                    <div className="mt-4">
                      <FaqEbook variant={enrichment.faqVariant ?? "van"} />
                    </div>
                  </article>
                ) : null}
              </>
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
