import { Section } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// Services V2 — Trois façons d'avancer
// (docs/refonte-site-public/services/01-HERO-PARCOURS.md §11-21). Cœur de
// l'orientation UX : exactement trois parcours, même niveau conceptuel,
// aucune couleur différente par parcours. Les cartes sont légitimes ici
// (choix structurant entre trois options, §17), donc réutilisation de
// `Card` (UI-1).
const PARCOURS = [
  {
    title: "Je fais seul",
    text: "Je m'équipe, j'apprends et je réalise moi-même.",
    cta: "Explorer les outils →",
    href: "/outils",
  },
  {
    title: "On fait ensemble",
    text: "FabSystem m'aide à préparer, vérifier et débloquer mon projet.",
    cta: "Découvrir l'accompagnement →",
    href: "#on-fait-ensemble",
  },
  {
    title: "Je confie",
    text: "FabSystem intervient et réalise l'intervention pour moi.",
    cta: "Voir les services terrain →",
    href: "#je-confie",
  },
] as const;

export function TroisFacons() {
  return (
    <Section id="parcours" tone="light">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          Trois façons d&apos;avancer. À vous de choisir.
        </h2>
        <p className="mt-3 text-base leading-relaxed text-neutral-600">
          Selon votre projet, votre niveau de connaissance et votre temps, choisissez la façon qui
          vous correspond le mieux.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {PARCOURS.map((parcours) => (
          <Card key={parcours.title} className="flex flex-col p-6">
            <h3 className="text-lg font-bold text-neutral-950">{parcours.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-600">{parcours.text}</p>
            <div className="mt-5">
              <Button href={parcours.href} variant="secondary" className="w-full">
                {parcours.cta}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}
