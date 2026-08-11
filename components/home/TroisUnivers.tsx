import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/layout/Section";

// Home V2 — Trois univers (docs/refonte-site-public/home/02-TROIS-UNIVERS.md).
// Exactement trois univers, chacun une vraie porte d'entrée. Les pages
// dédiées /bateau, /van, /camping-car n'existent pas encore dans ce
// dépôt (chantier hors périmètre de cette phase Home) : conformément au
// §15 du CDC, ce point est signalé dans docs/audits/UI-3-HOME.md plutôt
// que traité silencieusement. Solution temporaire retenue en attendant
// ces pages : les trois blocs mènent vers /prestations (seule page
// publique existante couvrant les trois univers).
const UNIVERS_TEMP_HREF = "/prestations";

type UniversTile = {
  name: string;
  text: string;
  photo?: { src: string; alt: string };
};

const UNIVERS: UniversTile[] = [
  {
    name: "Bateau",
    text: "Électricité et systèmes embarqués à bord.",
    photo: { src: "/fab-bateau.png", alt: "Installation électrique embarquée sur un bateau" },
  },
  {
    name: "Van",
    text: "Concevoir une installation fiable et adaptée à l'autonomie recherchée.",
  },
  {
    name: "Camping-car",
    text: "Comprendre, améliorer ou reprendre son installation électrique.",
  },
];

function UniversCard({ univers }: { univers: UniversTile }) {
  return (
    <Link
      href={UNIVERS_TEMP_HREF}
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
    <Section tone="light">
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
