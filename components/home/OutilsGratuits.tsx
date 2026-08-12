import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { OutilCard } from "@/components/outils/OutilCard";
import { OUTILS_CALCULATEURS } from "@/lib/outils-catalog";

// Home V2 (UI-10, correctif final §11) — teaser compact de l'écosystème
// Outils, réutilisant OutilCard tel quel (même identité visuelle que
// /outils, mission §16 : éviter la duplication). Volontairement PAS les 6
// cartes du hub : seulement les 3 premières, pour donner envie d'aller
// sur /outils plutôt que d'en faire une réplique complète. Jamais un
// retour à l'ancienne hiérarchie (1 grosse carte + 3 secondaires).
const HOME_TEASER = OUTILS_CALCULATEURS.slice(0, 3);

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

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {HOME_TEASER.map((outil) => (
          <OutilCard key={outil.id} outil={outil} />
        ))}
      </div>

      <div className="mt-8">
        <Button href="/outils" variant="tertiary">
          Voir tous les outils →
        </Button>
      </div>
    </Section>
  );
}
