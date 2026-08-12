"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ContactForm from "@/components/ContactForm";

// UI-10 §5 — les deux cartes "J'ai une intervention précise" / "J'ai un
// projet" ressemblaient à des CTA sans rien déclencher au clic (constat
// utilisateur : "trompeur"). Elles ouvrent désormais une vraie prise de
// contact, avec un message prérempli selon le contexte cliqué — reste sur
// le site (pas de redirection externe), réutilise ContactForm et
// /api/contact tels quels (aucune nouvelle route). Un mailto reste
// disponible en repli visible si l'envoi échoue (déjà géré par
// ContactForm lui-même).
export function ContactModalTrigger({
  title,
  description,
  defaultMessage,
  triggerLabel,
}: {
  title: string;
  description: string;
  defaultMessage: string;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-full w-full flex-col rounded-2xl border border-neutral-200 bg-white p-6 text-left transition-colors duration-150 hover:border-neutral-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
      >
        <h3 className="text-base font-bold text-neutral-950">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">{description}</p>
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-neutral-900">
          {triggerLabel}
          <span aria-hidden="true">→</span>
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[999]">
          <button
            type="button"
            aria-label="Fermer"
            className="fixed inset-0 bg-black/55"
            onClick={close}
          />

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
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

              <div className="mt-4">
                {/* ContactForm gère déjà son propre message de succès/erreur
                    en interne (statut ok/error) — jamais dupliqué ici. */}
                <ContactForm defaultMessage={defaultMessage} compact />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
