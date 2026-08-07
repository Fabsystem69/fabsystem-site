"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notifyCartChanged } from "@/lib/cart-events";

type ClearCartButtonProps = {
  className?: string;
  // Le drawer panier n'a pas de page a rafraichir : il fournit ce callback
  // pour recharger son propre etat au lieu de router.refresh().
  onCleared?: () => void;
};

const DEFAULT_CLEAR_BUTTON_CLASS =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50";

export function ClearCartButton({ className = DEFAULT_CLEAR_BUTTON_CLASS, onCleared }: ClearCartButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error || "Impossible de vider le panier.");
      }

      notifyCartChanged();
      if (onCleared) {
        onCleared();
      } else {
        router.refresh();
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Impossible de vider le panier.";
      setError(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button type="button" onClick={handleClick} disabled={pending} className={className}>
        {pending ? "Vidage..." : "Vider le panier"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
