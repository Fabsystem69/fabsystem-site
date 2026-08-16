import Link from "next/link";
import { Section } from "@/components/layout/Section";
import { OutilCard } from "@/components/outils/OutilCard";
import { SchemaExamplesTeaser } from "@/components/schema-examples/SchemaExamplesTeaser";
import { getOutilMeta, OUTILS_CALCULATEURS } from "@/lib/outils-catalog";

// UI-10 (correctif final, direction SaaS technique premium validée) —
// grille de cartes homogènes, même poids visuel pour chacun des 8 outils
// publics actuels, schéma électrique compris. Le bandeau Accès rapide et
// la grille itèrent tous deux sur OUTILS_CALCULATEURS, source unique.
//
// Carrousel évalué puis écarté : sans navigateur réel pour comparer les
// deux rendus (voir docs/audits/UI-10-FINAL-PUBLIC-REFONTE.md, Outils),
// une grille 4×2 sur desktop large garde les 8 outils visibles d'un coup ;
// les cartes du hub sont donc légèrement compactées ici, sans toucher au
// teaser plus ample utilisé sur la Home.
export function CalculateursIndex() {
  const outils = [
    getOutilMeta("schema"),
    ...OUTILS_CALCULATEURS.filter((outil) => outil.id !== "schema"),
  ];

  return (
    <Section id="calculateurs" tone="muted" className="scroll-mt-24">
      <h2 className="sr-only">Les calculateurs</h2>

      {/* Accès rapide : navigation directe pour qui sait déjà ce qu'il
          cherche, sans attendre la découverte visuelle ci-dessous. Pas de
          second bloc de titre visible : PageIntro porte déjà eyebrow +
          titre + description en tête de page. */}
      <nav aria-label="Accès rapide aux calculateurs" className="flex flex-wrap gap-2">
        {outils.map((outil) => (
          <Link
            key={outil.id}
            href={`/outils/${outil.id}`}
            className="rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:border-neutral-900 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
          >
            {outil.title}
          </Link>
        ))}
      </nav>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {outils.map((outil) => (
          <OutilCard key={outil.id} outil={outil} variant="compact" />
        ))}
      </div>

      <SchemaExamplesTeaser className="mt-6" />
    </Section>
  );
}
