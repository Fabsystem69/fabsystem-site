"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatEuroFromCents } from "@/lib/format";
import { CART_CHANGED_EVENT } from "@/lib/cart-events";
import { useCartDrawer } from "@/lib/client/cart-drawer-context";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { ClearCartButton } from "@/components/cart/ClearCartButton";
import { RemoveCartItemButton } from "@/components/cart/RemoveCartItemButton";
import type { CartSummary } from "@/lib/services/cart";

function formatCartAmount(value: number, currency: string) {
  if (currency === "EUR") {
    return formatEuroFromCents(value);
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(value / 100);
}

const EMPTY_CART: CartSummary = {
  cartId: "",
  status: "ACTIVE",
  itemCount: 0,
  currency: "EUR",
  subtotalCents: 0,
  lines: [],
};

// Panier en drawer lateral (Mission 5) : reutilise CheckoutForm/ClearCartButton/
// RemoveCartItemButton tels quels (mêmes routes API, même logique de gating
// formulaire de besoin) — aucun second système panier, juste une autre coquille
// d'affichage. La page /panier reste disponible en repli (lien en bas du drawer).
export function CartDrawer() {
  const { isOpen, close } = useCartDrawer();
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as { cart?: CartSummary } | null;
      setCart(body?.cart ?? EMPTY_CART);
    } catch {
      setCart(EMPTY_CART);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCart();
    }
  }, [isOpen, loadCart]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener(CART_CHANGED_EVENT, loadCart);
    return () => window.removeEventListener(CART_CHANGED_EVENT, loadCart);
  }, [isOpen, loadCart]);

  // Ferme le drawer sur tout changement de route (paiement, clic sur une
  // fiche produit, etc.) pour ne pas rester affiche par-dessus une page qui
  // n'a plus de rapport avec l'ouverture initiale.
  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      close();
      previousPathnameRef.current = pathname;
    }
  }, [pathname, close]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";

    if (isOpen && panelRef.current) {
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled"));
      if (focusable.length) focusable[0].focus();

      const handleKey = (event: KeyboardEvent) => {
        if (event.key === "Escape") close();
        if (event.key === "Tab" && focusable.length) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  const isEmpty = !cart || cart.lines.length === 0;

  return (
    <div className="fixed inset-0 z-[999]">
      <button
        type="button"
        aria-label="Fermer le panier"
        className="fixed inset-0 bg-black/55"
        onClick={close}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Panier"
        className="fixed right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-950">
            Votre panier
            {cart && cart.itemCount > 0 ? (
              <span className="ml-2 text-sm font-normal text-neutral-500">
                ({cart.itemCount})
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            aria-label="Fermer le panier"
            className="rounded-md p-1.5 text-neutral-900 hover:bg-neutral-100"
            onClick={close}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && !cart ? (
            <p className="text-sm text-neutral-500">Chargement...</p>
          ) : isEmpty ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-sm font-semibold text-neutral-950">Votre panier est vide</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">
                Parcourez la{" "}
                <Link
                  href="/boutique"
                  onClick={close}
                  className="font-medium text-neutral-900 underline underline-offset-4"
                >
                  boutique
                </Link>{" "}
                ou les{" "}
                <Link
                  href="/prestations/accompagnement"
                  onClick={close}
                  className="font-medium text-neutral-900 underline underline-offset-4"
                >
                  packs d&apos;accompagnement
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-end">
                <ClearCartButton
                  className="text-xs font-medium text-neutral-500 underline underline-offset-4 hover:text-neutral-900"
                  onCleared={loadCart}
                />
              </div>

              <div className="divide-y divide-neutral-200 rounded-xl border border-neutral-200">
                {cart.lines.map((line) => (
                  <div key={line.productId} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-neutral-950">
                        {line.name}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-neutral-950">
                      {formatCartAmount(line.totalCents, cart.currency)}
                    </p>
                    <RemoveCartItemButton productId={line.productId} onRemoved={loadCart} />
                  </div>
                ))}
              </div>

              <CheckoutForm cart={cart} />

              <Link
                href="/panier"
                onClick={close}
                className="block text-center text-xs font-medium text-neutral-500 underline underline-offset-4 hover:text-neutral-900"
              >
                Voir le panier en page complète
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
