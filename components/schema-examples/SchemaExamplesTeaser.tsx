import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SCHEMA_EXAMPLE_COUNT } from "@/lib/schema-examples";

const EXAMPLE_TAGS = [
  "Solaire simple",
  "Van complet",
  "Bateau au quai",
  "Station électrique",
] as const;

export function SchemaExamplesTeaser({ className = "" }: { className?: string }) {
  return (
    <section
      className={`overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-card ${className}`}
    >
      <div className="grid gap-0 lg:grid-cols-[0.96fr_1.04fr]">
        <div className="relative min-h-[220px] overflow-hidden bg-neutral-100">
          <Image
            src="/outils/exemples-schemas.webp"
            alt="Aperçu d'un schéma électrique FabSystem"
            fill
            sizes="(max-width: 1024px) 100vw, 40vw"
            className="object-cover"
          />
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <Badge tone="info">Exemples concrets</Badge>
            <Badge tone="success">{SCHEMA_EXAMPLE_COUNT} fiches</Badge>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Nouveau repère
          </p>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-neutral-950">
            Besoin d&apos;un point de départ avant d&apos;éditer votre propre schéma ?
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600">
            Retrouvez {SCHEMA_EXAMPLE_COUNT} exemples lisibles avec explications, points de
            vigilance, ouverture directe dans l&apos;éditeur et impression PDF pour garder une
            base claire sous les yeux.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLE_TAGS.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button href="/schemas-electriques" variant="primary">
              Voir les exemples
            </Button>
            <Button href="/outils/schema?template=solaire-simple" variant="secondary">
              Ouvrir un gabarit
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
