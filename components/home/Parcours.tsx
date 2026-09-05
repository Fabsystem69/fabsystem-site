"use client";

import Link from "next/link";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { useHomeUniverse } from "@/components/home/HomeUniverseProvider";
import type { PrestationsCategorie } from "@/lib/prestations-packs";

// Home V2 — Parcours (docs/refonte-site-public/home/03-PARCOURS.md).
// Exactement trois niveaux, aucun nom commercial de pack. Progression
// horizontale desktop / verticale mobile (§5-6).
//
// CTA "Voir l'accompagnement" et "Voir les interventions" : pointent
// vers les pages dédiées créées par UI-10 (§4-5) — /prestations/accompagnement
// et /prestations/intervention — plutôt que des ancres sur /prestations,
// devenue une simple page d'orientation.
const STEPS = [
  {
    n: "01",
    title: "Je fais seul",
    text: "Je veux comprendre, préparer et réaliser moi-même.",
    ctas: [
      { label: "Outils gratuits", href: "/outils", variant: "tertiary" },
      { label: "Les bases", href: "/formations", variant: "tertiary" },
    ],
  },
  {
    n: "02",
    title: "On fait ensemble",
    text: "Je réalise mon projet, avec l'aide de Fabien pour concevoir, vérifier et avancer.",
    ctas: [{ label: "Découvrir les accompagnements", href: "/prestations/accompagnement", variant: "primary" }],
  },
  {
    n: "03",
    title: "Je confie",
    text: "Je préfère que Fabien intervienne directement sur mon installation.",
    ctas: [{ label: "Découvrir les interventions", href: "/prestations/intervention", variant: "primary" }],
  },
] as const;

const UNIVERS: { id: PrestationsCategorie; label: string }[] = [
  { id: "bateau", label: "Bateau" },
  { id: "van", label: "Van & fourgon" },
  { id: "camping-car", label: "Camping-car" },
];

export function Parcours() {
  const { selectedUniverse, selectedUniverseLabel, selectionQuery, selectUniverse } = useHomeUniverse();

  return (
    <Section
      id="parcours"
      tone="muted"
      containerClassName="max-w-5xl"
      className="scroll-mt-24 !py-8 sm:!py-10"
    >
      <div className="max-w-xl">
        <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-[1.7rem]">
          Comment souhaitez-vous avancer ?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {selectedUniverseLabel
            ? `Univers actif : ${selectedUniverseLabel}. Les liens de cette page se calent sur cet univers.`
            : "Choisissez votre univers pour adapter les accompagnements et les services à votre projet."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2" aria-label="Choisir votre univers">
          {UNIVERS.map((univers) => {
            const isActive = selectedUniverse === univers.id;

            return (
              <button
                key={univers.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => selectUniverse(univers.id)}
                className={`rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 ${
                  isActive
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-950"
                }`}
              >
                {univers.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-3 lg:gap-5">
        {STEPS.map((step, index) => (
          <div key={step.n} className="relative rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm">
            {/* Connecteur discret desktop : ligne horizontale reliant les
                étapes (progression visuelle, MASTER-12 : pas de flèches
                énormes, pas de couleur différente par étape). */}
            {index > 0 ? (
              <div
                aria-hidden="true"
                className="absolute -left-3 top-8 hidden h-px w-6 bg-neutral-300 lg:block"
              />
            ) : null}

            <span className="text-sm font-bold text-brand-500">{step.n}</span>
            <h3 className="mt-2 text-base font-bold text-neutral-950 sm:text-lg">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{step.text}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              {step.ctas.map((cta) => {
                const href = cta.href.startsWith("/prestations")
                  ? `${cta.href}${selectionQuery}`
                  : cta.href;

                return cta.variant === "primary" ? (
                  <Button key={href + cta.label} href={href} variant="primary" className="h-9 min-h-9 px-3.5">
                    {cta.label} →
                  </Button>
                ) : (
                  <Link
                    key={href + cta.label}
                    href={href}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 underline underline-offset-4 decoration-neutral-300 transition-colors duration-150 hover:decoration-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                  >
                    {cta.label} →
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
