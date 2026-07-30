"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { track } from "@/lib/client/track";

// TODO: remplacer par le slug dédié à l'accompagnement Instal' dès qu'il
// existe côté Cal.com (durées et sens de la réservation différents de /visio).
const CAL_LINK = "fabien-l-typ79a";

type OpenBooking = (offer?: string) => void;

const CalBookingContext = createContext<OpenBooking | null>(null);

export function CalBookingProvider({ children }: { children: ReactNode }) {
  const [offer, setOffer] = useState<string | undefined>(undefined);
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const open: OpenBooking = (offerParam) => {
    setOffer(offerParam);
    setIsOpen(true);
  };

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

  const src = `https://cal.com/${CAL_LINK}?embed=true${
    offer ? `&offre=${encodeURIComponent(offer)}` : ""
  }`;

  return (
    <CalBookingContext.Provider value={open}>
      {children}

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Réservation FabSystem"
          className="fixed inset-0 z-50 bg-black/50 p-4"
          onClick={() => setIsOpen(false)}
        >
          <div className="flex min-h-full items-center justify-center">
            <div
              className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-lg max-h-[85vh] sm:max-h-none"
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

              <iframe
                src={src}
                title="Réservation Cal.com"
                style={{
                  width: "100%",
                  height: "100%",
                  minHeight: "500px",
                  border: "none",
                  borderRadius: "12px",
                }}
                frameBorder="0"
              />
            </div>
          </div>
        </div>
      )}
    </CalBookingContext.Provider>
  );
}

export function BookButton({
  offer,
  event,
  className,
  children,
}: {
  offer?: string;
  event?: string;
  className?: string;
  children: ReactNode;
}) {
  const open = useContext(CalBookingContext);
  if (!open) {
    throw new Error("BookButton must be used within a CalBookingProvider");
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (event) track(event);
        open(offer);
      }}
      className={className}
    >
      {children}
    </button>
  );
}
