"use client";

import Link from "next/link";
import { useState } from "react";
import { notifyCartChanged, notifyCartItemAdded } from "@/lib/cart-events";

type AddToCartButtonProps = {
  productId: string;
  label?: string;
  pendingLabel?: string;
  className?: string;
  successMessage?: string;
};

const DEFAULT_BUTTON_CLASS =
  "inline-flex min-h-10 w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50";

export function AddToCartButton({
  productId,
  label = "Ajouter au panier",
  pendingLabel = "Ajout...",
  className = DEFAULT_BUTTON_CLASS,
  successMessage = "Produit ajouté au panier.",
}: AddToCartButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleClick() {
    setPending(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/cart/items", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Impossible d'ajouter ce produit au panier.");
      }

      setSuccess(true);
      notifyCartChanged();
      notifyCartItemAdded();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible d'ajouter ce produit au panier.";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <button type="button" onClick={handleClick} disabled={pending} className={className}>
        {pending ? pendingLabel : label}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
          <p className="font-medium">{successMessage}</p>
          <Link href="/panier" className="mt-2 inline-flex underline underline-offset-4">
            Voir le panier
          </Link>
        </div>
      ) : null}
    </div>
  );
}
