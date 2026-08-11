import { Section } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

// Home V2 — Outils gratuits (docs/refonte-site-public/home/04-OUTILS-GRATUITS.md).
// Seuls des outils réellement actifs aujourd'hui sur /outils sont listés
// (mêmes routes/ancres que app/outils/page.tsx). Aucun outil vedette
// "schéma électrique" : il n'est pas encore disponible (§5, §15) — l'outil
// le plus utilisé (section de câble) tient donc la place la plus visible,
// sans être présenté comme l'outil vedette futur.
const FEATURED_TOOL = {
  title: "Section de câble",
  text: "Trouvez la section idéale selon l'intensité, la longueur et la chute de tension admissible.",
  href: "/outils#section-cable",
};

const SECONDARY_TOOLS = [
  {
    title: "Bilan de consommation",
    text: "Calculez votre consommation journalière et la capacité batterie recommandée.",
    href: "/outils#bilan-conso",
  },
  {
    title: "Autonomie batterie",
    text: "Estimez combien de temps votre batterie tient selon votre consommation et sa capacité.",
    href: "/outils#autonomie",
  },
  {
    title: "Régulateur MPPT",
    text: "Calculez la puissance MPPT nécessaire selon vos panneaux solaires et votre batterie.",
    href: "/outils#mppt",
  },
];

export function OutilsGratuits() {
  return (
    <Section tone="light">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          Des outils gratuits pour avancer tout de suite
        </h2>
        <p className="mt-3 text-base leading-relaxed text-neutral-600">
          Calculez, dimensionnez et préparez votre installation, gratuitement et sans compte.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {/* Outil le plus utilisé — occupe une place plus importante */}
        <Card className="flex flex-col justify-between p-6 lg:col-span-2">
          <div>
            <Badge tone="info">Le plus utilisé</Badge>
            <h3 className="mt-3 text-xl font-bold text-neutral-950">{FEATURED_TOOL.title}</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-600">{FEATURED_TOOL.text}</p>
          </div>
          <div className="mt-5">
            <Button href={FEATURED_TOOL.href} variant="primary">
              Ouvrir l&apos;outil →
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-1 lg:grid-cols-1">
          {SECONDARY_TOOLS.map((tool) => (
            <Card key={tool.href} className="p-5">
              <h3 className="text-sm font-bold text-neutral-950">{tool.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">{tool.text}</p>
              <a
                href={tool.href}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 underline underline-offset-4 decoration-neutral-300 transition-colors duration-150 hover:decoration-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                Ouvrir →
              </a>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <Button href="/outils" variant="tertiary">
          Voir tous les outils →
        </Button>
      </div>
    </Section>
  );
}
