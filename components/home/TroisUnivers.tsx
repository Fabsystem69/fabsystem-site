import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/layout/Section";

// Home V2 — Trois univers (docs/refonte-site-public/home/02-TROIS-UNIVERS.md).
// Exactement trois univers, chacun une vraie porte d'entrée. Les pages
// dédiées /bateau, /van, /camping-car ne sont pas suffisamment spécifiées
// dans les CDC pour être créées (aucun fichier univers/*.md n'existe —
// voir docs/audits/UI-4-SERVICES-UNIVERS.md, Univers) : conformément à
// l'option B validée par cette même phase, chaque univers mène vers une
// destination distincte et fonctionnelle de Services (/prestations),
// pré-sélectionnant le bon onglet dans "On fait ensemble" et "Je confie"
// via ?univers=. Les trois cartes ne pointent plus toutes vers la même
// destination générique (état temporaire de la Phase UI-3, résolu ici).
const UNIVERS: {
  name: string;
  text: string;
  href: string;
  photo?: { src: string; alt: string };
}[] = [
  {
    // Photo réelle fournie pour UI-9 FINAL (fab-bateau.png reste réservé au
    // portrait de Fabien, voir app/a-propos/page.tsx — jamais réutilisé ici).
    name: "Bateau",
    text: "Électricité et systèmes embarqués à bord.",
    href: "/prestations?univers=bateau",
    photo: { src: "/univers/bateau.png", alt: "Installation électrique embarquée sur un voilier" },
  },
  {
    name: "Van",
    text: "Concevoir une installation fiable et adaptée à l'autonomie recherchée.",
    href: "/prestations?univers=van",
    photo: { src: "/univers/van.png", alt: "Installation solaire organisée dans un van aménagé" },
  },
  {
    name: "Camping-car",
    text: "Comprendre, améliorer ou reprendre son installation électrique.",
    href: "/prestations?univers=camping-car",
    photo: { src: "/univers/camping-car.png", alt: "Compartiment électrique aménagé dans un camping-car" },
  },
];

type UniversTile = (typeof UNIVERS)[number];

function UniversCard({ univers }: { univers: UniversTile }) {
  return (
    <Link
      href={univers.href}
      aria-label={`${univers.name} — ${univers.text} Découvrir`}
      className="transition-base group relative flex min-h-[260px] flex-col justify-end overflow-hidden rounded-2xl border border-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 sm:min-h-[320px]"
    >
      {univers.photo ? (
        <>
          <Image
            src={univers.photo.src}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        </>
      ) : (
        // Aucune photographie réelle disponible pour cet univers dans ce
        // dépôt (voir docs/audits/UI-3-HOME.md, Visuels nécessaires) :
        // traitement typographique sobre plutôt qu'une photo de stock ou
        // générique, en attendant une vraie photographie.
        <div className="absolute inset-0 bg-neutral-950" />
      )}

      <div className="relative z-10 p-6">
        <p className="text-xl font-bold text-white">{univers.name}</p>
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-white/80">{univers.text}</p>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-400">
          Découvrir
          <span aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}

export function TroisUnivers() {
  return (
    <Section id="apres-hero" tone="light">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          Bateau, van ou camping-car
        </h2>
        <p className="mt-3 text-base leading-relaxed text-neutral-600">
          Des installations électriques pensées pour les contraintes réelles de chaque usage.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {UNIVERS.map((univers) => (
          <UniversCard key={univers.name} univers={univers} />
        ))}
      </div>
    </Section>
  );
}
