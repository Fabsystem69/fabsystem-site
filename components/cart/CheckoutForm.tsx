"use client";

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCheckoutFromCart } from "@/lib/checkout-flow";
import {
  readStoredNeedsAnswers,
  storePendingCheckoutInputs,
} from "@/lib/client/prestations-needs-storage";
import { isPrestationsPackSlug } from "@/lib/prestations-packs";
import type { CartSummary } from "@/lib/services/cart";
import { CartAccountForm } from "@/components/cart/CartAccountForm";

type CustomerSessionSummary = { email: string; name: string | null };

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
  // Résolue côté serveur par /panier (SSR) — `undefined` quand l'appelant
  // n'a pas cette info à disposition (ex. CartDrawer, client pur) : le
  // formulaire la résout alors lui-même via /api/client-auth/me. `null`
  // signifie explicitement "résolu, pas de session".
  customerSession?: CustomerSessionSummary | null;
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

export function CheckoutForm({ cart, disabled = false, customerSession }: CheckoutFormProps) {
  const router = useRouter();
  const [resolvedSession, setResolvedSession] = useState<CustomerSessionSummary | null | undefined>(
    customerSession
  );
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

  // /panier (SSR) repasse par ici après router.refresh() (ex. juste après la
  // création de compte) avec un `customerSession` à jour — on resynchronise
  // l'état local dessus plutôt que de ne garder que la valeur initiale.
  useEffect(() => {
    if (customerSession !== undefined) {
      setResolvedSession(customerSession);
      return;
    }

    // CartDrawer (client pur, pas de rendu serveur) ne connaît pas la
    // session à l'avance : on la résout ici.
    let cancelled = false;
    fetch("/api/client-auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { customer?: CustomerSessionSummary } | null) => {
        if (!cancelled) setResolvedSession(body?.customer ?? null);
      })
      .catch(() => {
        if (!cancelled) setResolvedSession(null);
      });

    return () => {
      cancelled = true;
    };
  }, [customerSession]);

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError(null);

    if (!resolvedSession) {
      setError("Créez votre compte ci-dessus avant de valider la commande.");
      return;
    }

    const hasPack = cart.lines.some((line) => isPrestationsPackSlug(line.slug));

    if (hasPack) {
      const storedNeedsAnswers = readStoredNeedsAnswers(cart.cartId);

      if (!storedNeedsAnswers) {
        // Le panier contient au moins un pack et le formulaire de projet n'a
        // pas encore été rempli pour ce panier : on garde email/nom/code en
        // session le temps du détour, puis on redirige vers l'étape dédiée.
        storePendingCheckoutInputs(cart.cartId, {
          customerEmail: resolvedSession.email,
          customerName: resolvedSession.name ?? undefined,
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
        customerEmail: resolvedSession.email,
        customerName: resolvedSession.name ?? undefined,
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
          customerEmail: resolvedSession?.email,
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
    // Un <div>, pas un <form> : CartAccountForm rend son propre <form>
    // (création de compte) plus bas dans l'arbre — un <form> ne peut pas en
    // contenir un autre en HTML valide. handleSubmit reste appelable sans
    // événement (bouton "Payer maintenant" en type="button").
    <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
      {/* Totaux */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-neutral-950">Récapitulatif</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-neutral-500">Sous-total</dt>
            <dd className="font-medium text-neutral-900">
              {formatAmount(summary.subtotalCents, summary.currency)}
            </dd>
          </div>
          {summary.discountTotalCents > 0 ? (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-neutral-500">Remise</dt>
              <dd className="font-medium text-emerald-700">
                -{formatAmount(summary.discountTotalCents, summary.currency)}
              </dd>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-4 border-t border-neutral-200 pt-2">
            <dt className="font-medium text-neutral-900">Total</dt>
            <dd className="text-base font-semibold text-neutral-950">
              {formatAmount(summary.totalCents, summary.currency)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Code de réduction */}
      <div className="p-4">
        <label htmlFor="checkout-discount" className="block text-sm font-medium text-neutral-900">
          Code de réduction
        </label>
        <div className="mt-2 flex items-stretch gap-2">
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
            className="h-11 min-w-0 flex-1 rounded-md border border-neutral-300 px-3 text-sm text-neutral-950 shadow-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-100"
            placeholder="COACH-XXXXXX"
          />
          <button
            type="button"
            onClick={handleApplyDiscount}
            disabled={disabled || pending || applyingDiscount}
            className="h-11 shrink-0 whitespace-nowrap rounded-md border border-neutral-300 px-4 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {applyingDiscount ? "..." : "Appliquer"}
          </button>
        </div>
        {summary.appliedCode ? (
          <p className="mt-2 text-sm text-emerald-700">Code appliqué : {summary.appliedCode}</p>
        ) : null}
        {discountError ? <p className="mt-2 text-sm text-red-600">{discountError}</p> : null}
      </div>

      {/* Compte — obligatoire pour commander (retour utilisateur : trop
          ambigu pour le SAV en guest checkout). resolvedSession === undefined
          = résolution encore en cours (CartDrawer). */}
      <div className="p-4">
        {resolvedSession === undefined ? (
          <p className="text-sm text-neutral-500">Vérification de votre compte…</p>
        ) : resolvedSession ? (
          <p className="text-sm text-neutral-700">
            Connecté en tant que <strong className="text-neutral-950">{resolvedSession.email}</strong>
          </p>
        ) : (
          <CartAccountForm onAccountCreated={() => router.refresh()} />
        )}
      </div>

      {/* Validation */}
      <div className="p-4">
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={disabled || pending || !resolvedSession}
          className="inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-400 px-4 text-sm font-bold text-neutral-900 hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending
            ? summary.totalCents === 0
              ? "Création de la commande..."
              : "Redirection vers le paiement..."
            : summary.totalCents === 0
              ? "Valider ma commande offerte"
              : "Payer maintenant"}
        </button>

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
