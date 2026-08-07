"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CART_ITEM_ADDED_EVENT } from "@/lib/cart-events";

type CartDrawerContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

export function CartDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Ouverture automatique a l'ajout d'un produit au panier (packs et
  // ebooks), en plus de l'ouverture manuelle via l'icone navbar.
  useEffect(() => {
    window.addEventListener(CART_ITEM_ADDED_EVENT, open);
    return () => window.removeEventListener(CART_ITEM_ADDED_EVENT, open);
  }, [open]);

  return (
    <CartDrawerContext.Provider value={{ isOpen, open, close }}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer() {
  const context = useContext(CartDrawerContext);

  if (!context) {
    throw new Error("useCartDrawer must be used within a CartDrawerProvider");
  }

  return context;
}
