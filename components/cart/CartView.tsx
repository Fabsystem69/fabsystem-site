import Link from "next/link";
import { formatEuroFromCents } from "@/lib/format";
import type { CartSummary } from "@/lib/services/cart";
import { ClearCartButton } from "@/components/cart/ClearCartButton";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { RemoveCartItemButton } from "@/components/cart/RemoveCartItemButton";

type CartViewProps = {
  cart: CartSummary;
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

export function CartView({ cart }: CartViewProps) {
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
              Consultez les produits déjà ajoutés à votre panier, puis créez votre commande avant
              la redirection sécurisée vers Stripe Checkout.
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
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="border-b border-neutral-200 px-6 py-4">
                <h2 className="text-base font-semibold text-neutral-950">Produits du panier</h2>
              </div>

              <div className="divide-y divide-neutral-200">
                {cart.lines.map((line) => (
                  <article
                    key={line.productId}
                    className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-neutral-950">{line.name}</h3>
                      <Link
                        href={`/boutique/${line.slug}`}
                        className="mt-1 inline-flex text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-950"
                      >
                        /boutique/{line.slug}
                      </Link>
                      <dl className="mt-3 grid gap-2 text-sm text-neutral-700 sm:grid-cols-3">
                        <div>
                          <dt className="text-neutral-500">Quantité</dt>
                          <dd className="font-medium text-neutral-900">{line.quantity}</dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Prix unitaire</dt>
                          <dd className="font-medium text-neutral-900">
                            {formatCartAmount(line.unitAmountCents, cart.currency)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-neutral-500">Total ligne</dt>
                          <dd className="font-medium text-neutral-900">
                            {formatCartAmount(line.totalCents, cart.currency)}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <RemoveCartItemButton productId={line.productId} />
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
              <h2 className="text-base font-semibold text-neutral-950">Récapitulatif</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-neutral-500">Articles</dt>
                  <dd className="text-right font-medium text-neutral-900">{cart.itemCount}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-neutral-500">Devise</dt>
                  <dd className="text-right font-medium text-neutral-900">{cart.currency}</dd>
                </div>
              </dl>

              <div className="mt-6 rounded-xl border border-dashed border-neutral-300 bg-white p-4">
                <p className="text-sm font-semibold text-neutral-950">Paiement sécurisé</p>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                  Saisissez votre email, appliquez un éventuel code de réduction, puis laissez le
                  serveur recalculer le total avant tout paiement Stripe.
                </p>
                <CheckoutForm cart={cart} />
              </div>

              <div className="mt-6">
                <ClearCartButton />
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
