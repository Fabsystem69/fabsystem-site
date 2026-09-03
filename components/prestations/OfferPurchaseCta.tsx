"use client";

import { AddToCartButton } from "@/components/cart/AddToCartButton";

export function OfferPurchaseCta({ productSlug, label }: { productSlug: string; label: string }) {
  return (
    <AddToCartButton
      productSlug={productSlug}
      label={label}
      pendingLabel="Ajout au panier..."
      successMessage="Forfait ajouté au panier. Vous pouvez finaliser votre règlement en toute sécurité."
      containerClassName="flex flex-col gap-3"
      className="inline-flex h-10 min-h-10 items-center justify-center rounded-lg bg-brand-400 px-4 text-sm font-semibold text-neutral-900 transition-colors hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
}
