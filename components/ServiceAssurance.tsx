"use client";

import { useId, useState } from "react";

type ServiceAssuranceProps = {
  items?: string[];
  tone?: "default" | "inverse";
  className?: string;
};

const defaultItems = [
  "Basé à Neuville-sur-Saône. Déplacements Rhône / Auvergne-Rhône-Alpes sur rendez-vous. Visio partout en France.",
  "Réponse sous 24–48h ouvrées.",
];

export default function ServiceAssurance({
  items = defaultItems,
  tone = "default",
  className = "",
}: ServiceAssuranceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const detailsId = useId();

  const pillClass =
    tone === "inverse"
      ? "border-white/15 bg-white/10 text-white/90"
      : "border-neutral-200 bg-white text-neutral-700";

  const buttonClass =
    tone === "inverse"
      ? "text-white/90 hover:text-white"
      : "text-neutral-700 hover:text-neutral-950";

  const detailsClass =
    tone === "inverse" ? "text-white/80" : "text-neutral-600";

  return (
    <div className={`w-full max-w-3xl ${className}`.trim()}>
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <p
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none sm:text-xs ${pillClass}`}
        >
          Rhône / AURA
        </p>
        <p
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none sm:text-xs ${pillClass}`}
        >
          24–48h
        </p>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={detailsId}
          onClick={() => setIsOpen((open) => !open)}
          className={`px-0.5 py-1 text-[11px] font-semibold leading-none underline underline-offset-4 transition sm:text-xs ${buttonClass}`}
        >
          Détails
        </button>
      </div>

      {isOpen && (
        <div id={detailsId} className={`mt-2 ${detailsClass}`}>
          <ul className="space-y-1 text-xs leading-relaxed">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
