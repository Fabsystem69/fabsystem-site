"use client";

import { useEffect, useId, useRef, useState } from "react";

type TooltipProps = {
  label: string;
  className?: string;
  children: React.ReactNode;
};

// Info-bulle simple : clic/tap pour ouvrir (fonctionne sur mobile), survol
// pour l'ouvrir aussi au passage de la souris (desktop) ; Echap ou clic
// en dehors pour fermer. Pas de librairie externe.
export function Tooltip({ label, className, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <span ref={wrapperRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        className={`cursor-help ${className ?? ""}`.trim()}
      >
        {children}
      </button>
      {open ? (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute left-1/2 top-full z-30 mt-2 w-56 -translate-x-1/2 rounded-lg border border-neutral-200 bg-white p-2.5 text-left text-xs font-normal normal-case leading-relaxed text-neutral-700 shadow-lg"
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
