"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notifyCartChanged } from "@/lib/cart-events";

type RemoveCartItemButtonProps = {
  productId: string;
  // Le drawer panier n'a pas de page a rafraichir : il fournit ce callback
  // pour recharger son propre etat au lieu de router.refresh().
  onRemoved?: () => void;
};

export function RemoveCartItemButton({ productId, onRemoved }: RemoveCartItemButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/cart/items/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Impossible de retirer ce produit du panier.");
      }

      notifyCartChanged();
      if (onRemoved) {
        onRemoved();
      } else {
        router.refresh();
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Impossible de retirer ce produit du panier.";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-sm font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Retrait..." : "Retirer"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
