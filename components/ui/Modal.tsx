"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";

// UI-13 — coquille de modale générique, extraite du motif déjà utilisé
// deux fois indépendamment (components/services/ContactModal.tsx,
// components/cart/CartDrawer.tsx) : focus trap, fermeture Escape/backdrop,
// blocage du scroll body. Contrairement à ContactModalTrigger, l'état
// `open` est contrôlé par l'appelant (pas de bouton déclencheur intégré)
// pour rester utilisable dans des flux à plusieurs étapes (ex. pont
// Outils→Project).
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    if (open && panelRef.current) {
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
  }, [open, close]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999]">
      <button type="button" aria-label="Fermer" className="fixed inset-0 bg-black/55" onClick={close} />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={`max-h-[85vh] w-full ${maxWidth} overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl`}
        >
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold text-neutral-950">{title}</h2>
            <button
              type="button"
              onClick={close}
              aria-label="Fermer"
              className="shrink-0 rounded-md p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              ✕
            </button>
          </div>

          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
