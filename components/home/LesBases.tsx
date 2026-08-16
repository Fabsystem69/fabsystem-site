import Image from "next/image";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { formatEuroFromCents } from "@/lib/format";
import { getActivePriceForProduct, listActiveBuyNowProducts } from "@/lib/services/catalog";
import { isPrestationsPackSlug } from "@/lib/prestations-packs";

// Home V2 — Les bases (docs/refonte-site-public/home/05-LES-BASES-HOME.md,
// v1.1 — remplace la v1.0 05-LES-BASES.md pour la terminologie). Composition
// éditoriale asymétrique : Les bases en élément principal, un ebook en
// complément (§8). Pas de brique "Ressources" : aucun contenu réel de ce
// type n'existe encore (§6 : "si ces contenus n'existent pas encore, ne pas
// afficher cette brique").
async function getFeaturedEbook() {
  const products = (await listActiveBuyNowProducts()).filter(
    (product) => !isPrestationsPackSlug(product.slug) && product.productType === "EBOOK"
  );

  const withCover = products.find((product) => product.featuredImage) ?? products[0];
  if (!withCover) return null;

  const price = await getActivePriceForProduct(withCover.id).catch(() => null);
  return { product: withCover, price };
}

export async function LesBases() {
  const ebook = await getFeaturedEbook();

  return (
    <Section
      tone="muted"
      containerClassName="max-w-4xl"
      className="!py-8 sm:!py-10"
    >
      <div className="max-w-xl">
        <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-[1.7rem]">
          Comprendre les bases pour mieux faire
        </h2>
      </div>

      <div className={`mt-5 grid gap-4 ${ebook ? "lg:grid-cols-[1.5fr_0.92fr]" : ""}`}>
        {/* Les bases — élément principal */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Les bases</p>
              <h3 className="mt-2 text-lg font-bold text-neutral-950">
                Les fondamentaux de l&apos;électricité embarquée, gratuitement
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
                Modules, quiz et bons gestes pour comprendre avant de se lancer — sans reproduire tout
                un guide complet.
              </p>
              <div className="mt-4">
                <Button href="/formations" variant="secondary">
                  Voir les bases →
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-brand-200 bg-brand-50/70 p-3">
              <div className="flex items-center gap-2.5">
                <Image
                  src="/volta/volta-actif-tournevis.png"
                  alt=""
                  width={336}
                  height={163}
                  className="h-10 w-auto shrink-0 object-contain"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                    Coaching Volta
                  </p>
                  <p className="mt-1 text-xs font-semibold text-neutral-950">
                    Volta vous aide à repérer l&apos;essentiel
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-neutral-700">
                Repères simples, erreurs fréquentes et logique de progression pour avancer sans se
                perdre dans le jargon.
              </p>
            </div>
          </div>
        </div>

        {/* Ebooks — élément complémentaire, uniquement si un produit réel
            existe (aucun ebook fictif). */}
        {ebook ? (
          <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5">
            {ebook.product.featuredImage ? (
              <div className="mb-3 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
                <Image
                  src={ebook.product.featuredImage}
                  alt={`Couverture de l'ebook ${ebook.product.name}`}
                  width={300}
                  height={400}
                  className="h-28 w-full object-cover object-top"
                />
              </div>
            ) : null}
            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Pour aller plus loin</p>
            <h3 className="mt-2 text-base font-bold text-neutral-950">{ebook.product.name}</h3>
            {ebook.product.shortDescription ? (
              <p className="mt-2 flex-1 text-xs leading-relaxed text-neutral-600">
                {ebook.product.shortDescription}
              </p>
            ) : null}
            {ebook.price ? (
              <p className="mt-3 text-sm font-semibold text-neutral-900">
                {formatEuroFromCents(ebook.price.unitAmountCents)}
              </p>
            ) : null}
            <div className="mt-3">
              <Button href="/boutique" variant="tertiary">
                Voir les ebooks →
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Section>
  );
}
