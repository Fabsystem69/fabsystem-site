"use client";

import Image from "next/image";
import { Section } from "@/components/layout/Section";
import type { PrestationsCategorie } from "@/lib/prestations-packs";
import { useHomeUniverse } from "@/components/home/HomeUniverseProvider";

const UNIVERS: {
  id: PrestationsCategorie;
  name: string;
  text: string;
  photo: { src: string; alt: string };
}[] = [
  {
    id: "bateau",
    name: "Bateau",
    text: "Diagnostic, charge, servitudes et contraintes marines.",
    photo: { src: "/univers/bateau.png", alt: "Installation electrique embarquee sur un voilier" },
  },
  {
    id: "van",
    name: "Van & Fourgon",
    text: "Autonomie, 12V, solaire et implantation compacte.",
    photo: { src: "/univers/van.png", alt: "Installation solaire organisee dans un van amenage" },
  },
  {
    id: "camping-car",
    name: "Camping-car",
    text: "Reprise de l'existant, lithium, recharge et fiabilisation.",
    photo: { src: "/univers/camping-car.png", alt: "Compartiment electrique amenage dans un camping-car" },
  },
];

function UniversCard({
  univers,
  isActive,
  onSelect,
}: {
  univers: (typeof UNIVERS)[number];
  isActive: boolean;
  onSelect: (univers: PrestationsCategorie) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={() => onSelect(univers.id)}
      className={`transition-base group relative flex min-h-[176px] flex-col justify-end overflow-hidden rounded-2xl border text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 sm:min-h-[208px] ${
        isActive
          ? "border-brand-400 shadow-[0_18px_40px_rgba(255,200,0,0.2)]"
          : "border-neutral-200 hover:border-neutral-300"
      }`}
    >
      <Image
        src={univers.photo.src}
        alt=""
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className={`object-cover transition-transform duration-300 ${isActive ? "scale-[1.02]" : "group-hover:scale-[1.03]"}`}
      />
      <div
        className={`absolute inset-0 ${
          isActive
            ? "bg-gradient-to-t from-black/96 via-black/72 to-black/20"
            : "bg-gradient-to-t from-black/92 via-black/62 to-black/18"
        }`}
      />

      <div className="relative z-10 p-2.5 sm:p-3">
        <div className="rounded-[18px] border border-white/12 bg-neutral-950/82 p-4 shadow-[0_16px_34px_rgba(0,0,0,0.34)] backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-bold tracking-tight text-white">
              {univers.name}
            </p>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                isActive ? "bg-brand-400 text-neutral-950 shadow-sm" : "bg-white/20 text-white"
              }`}
            >
              {isActive ? "Actif" : "Choisir"}
            </span>
          </div>
          <p className="mt-2 max-w-none text-sm leading-relaxed text-white">
            {univers.text}
          </p>
        </div>
      </div>
    </button>
  );
}

export function TroisUnivers() {
  const { selectedUniverse, selectedUniverseLabel, selectUniverse } = useHomeUniverse();

  return (
    <Section
      id="apres-hero"
      tone="muted"
      containerClassName="max-w-4xl"
      className="scroll-mt-24 !pt-0 !pb-7 sm:!pb-9"
    >
      <div className="max-w-2xl">
        <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-[1.55rem]">
          Bateau, van ou camping-car
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Selectionnez votre univers pour garder des liens et un parcours plus coherents sur cette
          page.
        </p>
        <p className="mt-3 text-sm font-semibold text-neutral-900">
          {selectedUniverseLabel
            ? `${selectedUniverseLabel} actuellement selectionne.`
            : "Aucun univers retenu pour l'instant."}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {UNIVERS.map((univers) => (
          <UniversCard
            key={univers.id}
            univers={univers}
            isActive={selectedUniverse === univers.id}
            onSelect={selectUniverse}
          />
        ))}
      </div>
    </Section>
  );
}
