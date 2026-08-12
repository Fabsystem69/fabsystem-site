import Link from "next/link";
import { Section } from "@/components/layout/Section";

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
      { label: "Outils gratuits", href: "/outils" },
      { label: "Les bases", href: "/formations" },
    ],
  },
  {
    n: "02",
    title: "On fait ensemble",
    text: "Je réalise mon projet, avec l'aide de Fabien pour concevoir, vérifier et avancer.",
    ctas: [{ label: "Voir l'accompagnement", href: "/prestations/accompagnement" }],
  },
  {
    n: "03",
    title: "Je confie",
    text: "Je préfère que Fabien intervienne directement sur mon installation.",
    ctas: [{ label: "Voir les interventions", href: "/prestations/intervention" }],
  },
] as const;

export function Parcours() {
  return (
    <Section id="parcours" tone="muted" className="scroll-mt-24">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          Comment souhaitez-vous avancer ?
        </h2>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3 lg:gap-6">
        {STEPS.map((step, index) => (
          <div key={step.n} className="relative">
            {/* Connecteur discret desktop : ligne horizontale reliant les
                étapes (progression visuelle, MASTER-12 : pas de flèches
                énormes, pas de couleur différente par étape). */}
            {index > 0 ? (
              <div
                aria-hidden="true"
                className="absolute -left-3 top-5 hidden h-px w-6 bg-neutral-300 lg:block"
              />
            ) : null}

            <span className="text-sm font-bold text-brand-500">{step.n}</span>
            <h3 className="mt-2 text-lg font-bold text-neutral-950">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{step.text}</p>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {step.ctas.map((cta) => (
                <Link
                  key={cta.href + cta.label}
                  href={cta.href}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 underline underline-offset-4 decoration-neutral-300 transition-colors duration-150 hover:decoration-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
                >
                  {cta.label} →
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
