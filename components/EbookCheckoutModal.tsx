"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import EbookCheckoutForm from "@/components/EbookCheckoutForm";

type OpenCheckout = () => void;

const EbookCheckoutContext = createContext<OpenCheckout | null>(null);

export function EbookCheckoutProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <EbookCheckoutContext.Provider value={() => setIsOpen(true)}>
      {children}

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Acheter l'ebook"
          className="fixed inset-0 z-50 bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div className="flex min-h-full items-center justify-center">
            <div
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-lg sm:p-8"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-4 top-4 z-10 rounded-md bg-neutral-100 p-2 hover:bg-neutral-200"
                aria-label="Fermer le formulaire"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              <h2 className="text-lg font-bold text-neutral-950">
                Acheter l&apos;ebook — 49,99 €
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                Ton nom et ton email suffisent : ton exemplaire personnalisé arrive par email
                juste après le paiement.
              </p>

              <div className="mt-6">
                <EbookCheckoutForm />
              </div>
            </div>
          </div>
        </div>
      )}
    </EbookCheckoutContext.Provider>
  );
}

export function BuyButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const open = useContext(EbookCheckoutContext);
  if (!open) {
    throw new Error("BuyButton must be used within an EbookCheckoutProvider");
  }

  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  );
}
