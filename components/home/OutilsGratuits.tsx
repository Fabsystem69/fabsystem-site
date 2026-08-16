import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { OutilCard } from "@/components/outils/OutilCard";
import { SchemaExamplesTeaser } from "@/components/schema-examples/SchemaExamplesTeaser";
import { getOutilMeta, type OutilMeta } from "@/lib/outils-catalog";

// Home V2 (UI-10, correctif final §11) — teaser compact de l'écosystème
// Outils, réutilisant OutilCard tel quel (même identité visuelle que
// /outils, mission §16 : éviter la duplication). Volontairement PAS les 6
// cartes du hub : seulement les 3 premières, pour donner envie d'aller
// sur /outils plutôt que d'en faire une réplique complète. Jamais un
// retour à l'ancienne hiérarchie (1 grosse carte + 3 secondaires).
const HOME_TEASER: OutilMeta[] = [
  { ...getOutilMeta("section-cable"), tag: "Essentiel" },
  getOutilMeta("bilan-consommation"),
  { ...getOutilMeta("schema"), tag: "Le plus utilisé" },
];

export function OutilsGratuits() {
  return (
    <Section
      tone="light"
      containerClassName="max-w-4xl"
      className="!py-8 sm:!py-10"
    >
      <div className="max-w-xl">
        <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-[1.7rem]">
          Des outils gratuits pour avancer tout de suite
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Calculez, dimensionnez et préparez votre installation, gratuitement et sans compte.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {HOME_TEASER.map((outil) => (
          <OutilCard key={outil.id} outil={outil} variant="compact" />
        ))}
      </div>

      <SchemaExamplesTeaser className="mt-5" />

      <div className="mt-5">
        <Button href="/outils" variant="tertiary">
          Voir tous les outils →
        </Button>
      </div>
    </Section>
  );
}
