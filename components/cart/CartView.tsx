import Link from "next/link";
import { formatEuroFromCents } from "@/lib/format";
import type { CartSummary } from "@/lib/services/cart";
import { ClearCartButton } from "@/components/cart/ClearCartButton";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { RemoveCartItemButton } from "@/components/cart/RemoveCartItemButton";

type CustomerSessionSummary = { email: string; name: string | null };

type CartViewProps = {
  cart: CartSummary;
  customerSession: CustomerSessionSummary | null;
};

function formatCartAmount(value: number, currency: string) {
  if (currency === "EUR") {
    return formatEuroFromCents(value);
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(value / 100);
}

export function CartView({ cart, customerSession }: CartViewProps) {
  const isEmpty = cart.lines.length === 0;

  return (
    <main className="bg-white text-neutral-900">
      <section className="border-b border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-5xl px-6 py-12 sm:py-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Panier FabSystem
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              Votre sélection numérique
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-neutral-700 sm:text-base">
              Consultez les produits déjà ajoutés à votre panier, puis créez votre commande — vous
              serez ensuite redirigé vers une page de paiement sécurisée.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
        {isEmpty ? (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-neutral-950">Votre panier est vide</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Aucun produit n&apos;a encore été ajouté. Vous pouvez continuer à parcourir la{" "}
              <Link
                href="/boutique"
                className="font-medium text-neutral-900 underline underline-offset-4"
              >
                boutique
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
                <h2 className="text-base font-semibold text-neutral-950">
                  Produits du panier
                  <span className="ml-2 text-sm font-normal text-neutral-500">
                    ({cart.itemCount})
                  </span>
                </h2>
                <ClearCartButton className="text-sm font-medium text-neutral-500 underline underline-offset-4 hover:text-neutral-900" />
              </div>

              <div className="divide-y divide-neutral-200">
                {cart.lines.map((line) => (
                  <article
                    key={line.productId}
                    className="flex items-center gap-4 px-6 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-neutral-950">{line.name}</h3>
                      <Link
                        href={`/boutique/${line.slug}`}
                        className="mt-0.5 inline-flex text-xs text-neutral-500 underline underline-offset-4 hover:text-neutral-900"
                      >
                        Voir la fiche produit
                      </Link>
                    </div>

                    <p className="shrink-0 text-sm font-semibold text-neutral-950">
                      {formatCartAmount(line.totalCents, cart.currency)}
                    </p>

                    <RemoveCartItemButton productId={line.productId} />
                  </article>
                ))}
              </div>
            </div>

            <aside>
              <CheckoutForm cart={cart} customerSession={customerSession} />
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
