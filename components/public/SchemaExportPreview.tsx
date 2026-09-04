"use client";

import { useState } from "react";
import Image from "next/image";

// Aperçu réel de l'éditeur dans le hero (retour utilisateur : "ça donne
// vraiment pas envie... prend un export png de l'exemple marco polo") —
// un vrai export produit par l'outil, pas une illustration marketing.
// Réduit par défaut, s'agrandit au clic (lightbox) sans quitter la page.
export function SchemaExportPreview() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block w-full overflow-hidden rounded-[20px] border border-neutral-200 bg-neutral-50 text-left"
      >
        <span className="relative block">
          <Image
            src="/schema-examples/vito-marco-polo-280ah-export.png"
            alt="Export PNG réel d'un schéma FabSystem : van Vito Marco Polo 280 Ah"
            width={8370}
            height={4182}
            className="w-full transition-transform duration-200 group-hover:scale-[1.02]"
            sizes="(min-width: 1024px) 40vw, 90vw"
          />
          <span className="absolute right-3 top-3 rounded-full bg-neutral-950/70 px-2.5 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
            Agrandir ⤢
          </span>
        </span>
        <span className="block border-t border-neutral-200 px-4 py-3 text-xs text-neutral-500">
          Export PNG réel, généré depuis l&apos;éditeur — schéma van &laquo;&nbsp;Vito Marco Polo 280 Ah&nbsp;&raquo;.
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/85 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <img
            src="/schema-examples/vito-marco-polo-280ah-export.png"
            alt="Export PNG réel d'un schéma FabSystem : van Vito Marco Polo 280 Ah, agrandi"
            className="max-h-[92vh] max-w-[95vw] rounded-lg shadow-2xl"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-2xl leading-none text-white hover:bg-white/20"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      ) : null}
    </>
  );
}
