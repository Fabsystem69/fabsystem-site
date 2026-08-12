import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

// Les Bases V2 — Modules (docs/refonte-site-public/les-bases/01-HERO-MODULES.md
// §2-6). Les 3 modules et leurs données (titre, résumé, durée) sont ceux
// réellement publiés sous app/formations/<slug>/page.tsx — repris tels
// quels, aucune durée inventée pour cette refonte. Aucune progression
// affichée : le projet n'a aujourd'hui aucune persistance réelle de
// progression par module (vérifié : aucun localStorage/cookie/DB dans
// ModuleStepper), donc chaque carte reste à l'état standard conformément à
// 01-HERO-MODULES.md §2 ("Ne jamais simuler une progression").
//
// Desktop : les 3 cartes tiennent côte à côte (§4). Mobile : empilement
// vertical simple plutôt que le carrousel manuel décrit en §5 — ce dernier
// n'est qu'autorisé ("peuvent être présentés"), pas imposé ; avec
// seulement 3 modules, un empilement reste pleinement lisible, accessible
// sans JS et cohérent avec la contrainte de performance de cette mission
// ("pas de JS client pour de simples contenus éditoriaux") — voir
// Arbitrages du rapport.
const MODULES = [
  {
    order: 1,
    title: "Les bases du 12V embarqué",
    description:
      "Loi d'Ohm, puissance, résistance des câbles. Tout ce qu'il faut savoir pour dimensionner correctement son installation.",
    duration: "~30 min",
    href: "/formations/bases-12v",
  },
  {
    order: 2,
    title: "Lire un schéma électrique",
    description:
      "Décoder un schéma de distribution, identifier les fusibles, les barres omnibus et les points de masse.",
    duration: "~20 min",
    href: "/formations/lire-schema",
  },
  {
    order: 3,
    title: "Les batteries : AGM, GEL, Lithium",
    description:
      "Série, parallèle, différences de technologie et câblage correct d'un banc de batteries.",
    duration: "~25 min",
    href: "/formations/types-batteries",
  },
] as const;

export function Modules() {
  return (
    <Section id="modules" tone="light" className="scroll-mt-24">
      <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
        Commencez par les fondamentaux
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
        Des modules courts et clairs pour comprendre l&apos;essentiel, étape par étape.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {MODULES.map((module) => (
          <article
            key={module.href}
            className="flex flex-col rounded-card border border-t-4 border-neutral-200 border-t-brand-400 bg-white p-5 shadow-card"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white">
                {module.order}
              </span>
              <Badge tone="success">Gratuit</Badge>
            </div>

            <h3 className="mt-3 text-base font-semibold text-neutral-950">{module.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-700">
              {module.description}
            </p>

            <p className="mt-4 text-xs font-medium text-neutral-500">{module.duration}</p>

            <div className="mt-3">
              <Button href={module.href} variant="secondary" className="w-full">
                Accéder au module →
              </Button>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
