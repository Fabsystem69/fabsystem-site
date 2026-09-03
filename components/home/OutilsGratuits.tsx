import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { OutilCard } from "@/components/outils/OutilCard";
import { Badge } from "@/components/ui/Badge";
import { getOutilMeta, type OutilMeta } from "@/lib/outils-catalog";
import { SCHEMA_EXAMPLE_COUNT } from "@/lib/schema-examples-data";

// Home V2 (UI-10, correctif final §11) — teaser compact de l'écosystème
// Outils, réutilisant OutilCard tel quel (même identité visuelle que
// /outils, mission §16 : éviter la duplication). Volontairement PAS les 6
// cartes du hub : seulement les 3 premières, pour donner envie d'aller
// sur /outils plutôt que d'en faire une réplique complète. Jamais un
// retour à l'ancienne hiérarchie (1 grosse carte + 3 secondaires).
const HOME_TEASER: OutilMeta[] = [
  { ...getOutilMeta("section-cable"), tag: "Essentiel" },
  getOutilMeta("bilan-consommation"),
];

function SchemaExamplesCard() {
  return (
    <Link
      href="/schemas-electriques"
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card transition-colors duration-150 hover:border-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
        <Image
          src="/outils/exemples-schemas.webp"
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <Badge tone="success">{SCHEMA_EXAMPLE_COUNT} exemples</Badge>
        <h3 className="mt-2 text-base font-bold text-neutral-950">Exemples de schémas</h3>
        <p className="mt-1.5 flex-1 text-xs leading-6 text-neutral-600">
          Trouvez une installation proche de la vôtre, puis ouvrez-la dans l&apos;éditeur pour l&apos;adapter.
        </p>
        <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-neutral-900">
          Voir les exemples
          <span aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}

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
        <SchemaExamplesCard />
      </div>

      <div className="mt-5">
        <Button href="/outils" variant="tertiary">
          Voir tous les outils →
        </Button>
      </div>
    </Section>
  );
}
