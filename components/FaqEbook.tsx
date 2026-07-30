"use client";

import { useState } from "react";
import Link from "next/link";

const faqs = [
  {
    q: "Comment je reçois mon ebook ?",
    a: "Immédiatement après le paiement, tu reçois un email avec ton exemplaire personnalisé — version bureau et version poche — en téléchargement direct.",
  },
  {
    q: "Quelle est la différence entre la version bureau et la version poche ?",
    a: "La version bureau est pensée pour une lecture confortable sur écran, avec les schémas en grand format. La version poche est un format compact, facile à consulter sur le chantier, sur ton téléphone ou imprimée.",
  },
  {
    q: "Le livre est adapté si je débute complètement ?",
    a: "Oui. Le manuel part des bases du 12V et suit l'ordre réel d'une installation, pour que tu comprennes chaque étape avant de la réaliser — pas de jargon qui suppose que tu sais déjà.",
  },
  {
    q: "J'ai un camping-car ou un bateau, ce livre me concerne aussi ?",
    a: "Le contenu est écrit pour le van, mais les principes de dimensionnement, de câblage et de sécurité s'appliquent largement au camping-car. Pour un bateau, la visio conseil est plus adaptée : les contraintes (VASP, coque, humidité) sont différentes.",
  },
  {
    q: "Si je prends un accompagnement FabSystem après, les 49,99 € sont perdus ?",
    a: (
      <>
        Non. Si tu réserves ensuite{" "}
        <Link href="/prestations#instal" className="font-semibold underline underline-offset-2">
          l&apos;accompagnement à distance
        </Link>{" "}
        ou une{" "}
        <Link href="/visio" className="font-semibold underline underline-offset-2">
          visio conseil
        </Link>
        , les 49,99 € de l&apos;ebook sont déduits du montant de la prestation. Il te suffit de le
        signaler au moment de la réservation.
      </>
    ),
  },
  {
    q: "Le paiement est sécurisé ?",
    a: "Oui, le paiement passe par Stripe. FabSystem ne stocke aucune donnée de carte bancaire.",
  },
  {
    q: "Je peux l'imprimer ?",
    a: "Oui, la version poche est pensée pour être imprimée facilement si tu préfères travailler sur papier plutôt que sur écran.",
  },
];

export default function FaqEbook() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
      {faqs.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
          >
            <span className="text-sm font-semibold text-neutral-900">{item.q}</span>
            <span className="mt-0.5 shrink-0 text-neutral-400">
              {open === i ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4.5 9h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 4.5v9M4.5 9h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </span>
          </button>
          {open === i && (
            <p className="px-5 pb-4 text-sm leading-relaxed text-neutral-600">{item.a}</p>
          )}
        </div>
      ))}
    </div>
  );
}
