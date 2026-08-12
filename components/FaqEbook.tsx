"use client";

import { useState } from "react";
import Link from "next/link";

type FaqEntry = { q: string; a: React.ReactNode };

const faqsByVariant: Record<"van" | "bateau", FaqEntry[]> = {
  van: [
    {
      q: "Comment je reçois mon ebook ?",
      a: "Immédiatement après le paiement, vous recevez un email avec votre exemplaire personnalisé — version bureau et version poche — en téléchargement direct.",
    },
    {
      q: "Quelle est la différence entre la version bureau et la version poche ?",
      a: "La version bureau est pensée pour une lecture confortable sur écran, avec les schémas en grand format. La version poche est un format compact, facile à consulter sur le chantier, sur votre téléphone ou imprimée.",
    },
    {
      q: "Le livre est adapté si je débute complètement ?",
      a: "Oui. Le manuel part des bases du 12V et suit l'ordre réel d'une installation, pour que vous compreniez chaque étape avant de la réaliser — pas de jargon qui suppose que vous savez déjà.",
    },
    {
      q: "J'ai un camping-car ou un bateau, ce livre me concerne aussi ?",
      a: "Le contenu est écrit pour le van, mais les principes de dimensionnement, de câblage et de sécurité s'appliquent largement au camping-car. Pour un bateau, l'ebook dédié « Électricité Bateau » est plus adapté : les contraintes (VASP, coque, humidité) sont différentes.",
    },
    {
      q: "Si je prends un accompagnement FabSystem après, le prix de l'ebook est perdu ?",
      a: (
        <>
          Non. Si vous passez ensuite par{" "}
          <Link href="/prestations/accompagnement" className="font-semibold underline underline-offset-2">
            l&apos;accompagnement à distance
          </Link>{" "}
          FabSystem, le prix de l&apos;ebook est déduit du montant de la prestation. Il vous suffit
          de le signaler au moment de la prise de contact.
        </>
      ),
    },
    {
      q: "Le paiement est sécurisé ?",
      a: "Oui, le paiement est sécurisé. FabSystem ne stocke aucune donnée de carte bancaire.",
    },
    {
      q: "Je peux l'imprimer ?",
      a: "Oui, la version poche est pensée pour être imprimée facilement si vous préférez travailler sur papier plutôt que sur écran.",
    },
  ],
  bateau: [
    {
      q: "Comment je reçois mon ebook ?",
      a: "Immédiatement après le paiement, vous recevez un email avec vos trois versions — HTML haute qualité, HTML mobile légère et EPUB — en téléchargement direct.",
    },
    {
      q: "Quelle est la différence entre les trois formats fournis ?",
      a: "La version HTML haute qualité est pensée pour une lecture confortable sur écran, avec les schémas et photos en grand format. La version mobile légère se charge vite sur le chantier, sur votre téléphone. La version EPUB se lit sur liseuse ou dans une appli de lecture, et s'imprime facilement.",
    },
    {
      q: "Le livre est adapté si je débute complètement ?",
      a: "Oui. Le manuel part des bases (volts, ampères, chute de tension) avant d'aborder le diagnostic et le câblage, pour que vous compreniez chaque étape avant de la réaliser — pas de jargon qui suppose que vous savez déjà.",
    },
    {
      q: "Mon bateau est ancien, avec un câblage jamais documenté, ce livre me concerne quand même ?",
      a: "C'est exactement le cas que ce livre traite en premier lieu : il part du principe qu'un bateau qui a déjà vécu a été bricolé par plusieurs propriétaires, et consacre une méthode complète au diagnostic de l'existant avant toute reprise.",
    },
    {
      q: "Si je prends un accompagnement FabSystem après, le prix de l'ebook est perdu ?",
      a: (
        <>
          Non. Si vous passez ensuite par{" "}
          <Link href="/prestations/accompagnement" className="font-semibold underline underline-offset-2">
            l&apos;accompagnement à distance
          </Link>{" "}
          FabSystem, le prix de l&apos;ebook est déduit du montant de la prestation. Il vous suffit
          de le signaler au moment de la prise de contact.
        </>
      ),
    },
    {
      q: "Le paiement est sécurisé ?",
      a: "Oui, le paiement est sécurisé. FabSystem ne stocke aucune donnée de carte bancaire.",
    },
    {
      q: "Je peux l'imprimer ?",
      a: "Oui, la version EPUB et la version HTML se prêtent bien à l'impression si vous préférez travailler sur papier plutôt que sur écran.",
    },
  ],
};

export default function FaqEbook({ variant = "van" }: { variant?: "van" | "bateau" }) {
  const [open, setOpen] = useState<number | null>(null);
  const faqs = faqsByVariant[variant];

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
