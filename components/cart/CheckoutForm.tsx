"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCheckoutFromCart } from "@/lib/checkout-flow";
import {
  readStoredNeedsAnswers,
  storePendingCheckoutInputs,
} from "@/lib/client/prestations-needs-storage";
import { isPrestationsPackSlug } from "@/lib/prestations-packs";
import type { CartSummary } from "@/lib/services/cart";

type CheckoutSummaryState = {
  subtotalCents: number;
  discountTotalCents: number;
  totalCents: number;
  currency: string;
  appliedCode: string | null;
};

type CheckoutFormProps = {
  cart: CartSummary;
  disabled?: boolean;
};

function formatAmount(value: number, currency: string) {
  if (currency === "EUR") {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
    }).format(value / 100);
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(value / 100);
}

export function CheckoutForm({ cart, disabled = false }: CheckoutFormProps) {
  const router = useRouter();
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [summary, setSummary] = useState<CheckoutSummaryState>({
    subtotalCents: cart.subtotalCents,
    discountTotalCents: 0,
    totalCents: cart.subtotalCents,
    currency: cart.currency,
    appliedCode: null,
  });
  const [pending, setPending] = useState(false);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const hasPack = cart.lines.some((line) => isPrestationsPackSlug(line.slug));

    if (hasPack) {
      const storedNeedsAnswers = readStoredNeedsAnswers(cart.cartId);

      if (!storedNeedsAnswers) {
        // Le panier contient au moins un pack et le formulaire de projet n'a
        // pas encore été rempli pour ce panier : on garde email/nom/code en
        // session le temps du détour, puis on redirige vers l'étape dédiée.
        storePendingCheckoutInputs(cart.cartId, {
          customerEmail,
          customerName: customerName || undefined,
          discountCode: summary.appliedCode ?? undefined,
        });
        setPending(true);
        router.push("/panier/projet");
        return;
      }
    }

    setPending(true);

    try {
      const result = await createCheckoutFromCart(fetch, {
        customerEmail,
        customerName,
        existingOrderId: orderId ?? undefined,
        discountCode: summary.appliedCode ?? undefined,
        needsAnswers: hasPack ? readStoredNeedsAnswers(cart.cartId) ?? undefined : undefined,
      });

      setOrderId(result.orderId);

      if (result.requiresPayment && result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }

      window.location.assign(result.redirectUrl);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible de lancer le paiement."
      );
      setPending(false);
    }
  }

  async function handleApplyDiscount() {
    setDiscountError(null);

    if (!customerEmail.trim()) {
      setDiscountError("Renseignez votre email avant d'appliquer le code.");
      return;
    }

    if (!discountCode.trim()) {
      setDiscountError("Saisissez un code de réduction.");
      return;
    }

    setApplyingDiscount(true);

    try {
      const response = await fetch("/api/cart/discounts/validate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          customerEmail,
          code: discountCode,
        }),
      });

      const body = (await response.json().catch(() => null)) as
        | CheckoutSummaryState
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(body && "error" in body ? body.error || "Code invalide." : "Code invalide.");
      }

      if (!body || !("totalCents" in body)) {
        throw new Error("Réponse remise invalide.");
      }

      setSummary(body);
      setDiscountCode(body.appliedCode ?? discountCode.trim().toUpperCase());
    } catch (caughtError) {
      setSummary({
        subtotalCents: cart.subtotalCents,
        discountTotalCents: 0,
        totalCents: cart.subtotalCents,
        currency: cart.currency,
        appliedCode: null,
      });
      setDiscountError(caughtError instanceof Error ? caughtError.message : "Code invalide.");
    } finally {
      setApplyingDiscount(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-neutral-950">Récapitulatif</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-neutral-500">Sous-total</dt>
            <dd className="font-medium text-neutral-900">
              {formatAmount(summary.subtotalCents, summary.currency)}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="text-neutral-500">Remise</dt>
            <dd className="font-medium text-neutral-900">
              -{formatAmount(summary.discountTotalCents, summary.currency)}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4 border-t border-neutral-200 pt-2">
            <dt className="text-neutral-900">Total final</dt>
            <dd className="text-base font-semibold text-neutral-950">
              {formatAmount(summary.totalCents, summary.currency)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 space-y-2">
          <label htmlFor="checkout-discount" className="block text-sm font-medium text-neutral-900">
            Code de réduction
          </label>
          <div className="flex gap-2">
            <input
              id="checkout-discount"
              name="discountCode"
              type="text"
              value={discountCode}
              onChange={(event) => {
                setDiscountCode(event.target.value);
                setDiscountError(null);
                if (summary.appliedCode && event.target.value.trim().toUpperCase() !== summary.appliedCode) {
                  setSummary({
                    subtotalCents: cart.subtotalCents,
                    discountTotalCents: 0,
                    totalCents: cart.subtotalCents,
                    currency: cart.currency,
                    appliedCode: null,
                  });
                }
              }}
              disabled={disabled || pending || applyingDiscount}
              className="block min-h-11 flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-100"
              placeholder="COACH-XXXXXX"
            />
            <button
              type="button"
              onClick={handleApplyDiscount}
              disabled={disabled || pending || applyingDiscount}
              className="min-h-11 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {applyingDiscount ? "Application..." : "Appliquer"}
            </button>
          </div>
          {summary.appliedCode ? (
            <p className="text-sm text-emerald-700">Code appliqué : {summary.appliedCode}</p>
          ) : null}
          {discountError ? <p className="text-sm text-red-600">{discountError}</p> : null}
        </div>
      </div>

      <div>
        <label htmlFor="checkout-email" className="block text-sm font-medium text-neutral-900">
          Email
        </label>
        <input
          id="checkout-email"
          name="customerEmail"
          type="email"
          autoComplete="email"
          required
          value={customerEmail}
          onChange={(event) => setCustomerEmail(event.target.value)}
          disabled={disabled || pending}
          className="mt-2 block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-100"
          placeholder="client@example.com"
        />
      </div>

      <div>
        <label htmlFor="checkout-name" className="block text-sm font-medium text-neutral-900">
          Nom
          <span className="ml-2 text-neutral-500">(optionnel)</span>
        </label>
        <input
          id="checkout-name"
          name="customerName"
          type="text"
          autoComplete="name"
          value={customerName}
          onChange={(event) => setCustomerName(event.target.value)}
          disabled={disabled || pending}
          className="mt-2 block min-h-11 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-950 shadow-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-100"
          placeholder="Votre nom"
        />
      </div>

      <button
        type="submit"
        disabled={disabled || pending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending
          ? summary.totalCents === 0
            ? "Création de la commande..."
            : "Redirection vers Stripe..."
          : summary.totalCents === 0
            ? "Valider ma commande offerte"
            : "Payer maintenant"}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
