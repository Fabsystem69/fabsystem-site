import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";

// Outils V2 — Les basiques de l'atelier
// (docs/refonte-site-public/Outils/01-HUB-PUBLIC.md §9). Le CDC prévoit
// deux axes (outils indispensables, bons gestes) mais impose aussi que la
// section "reste volontairement courte" et ne republie pas de contenu.
// Or ces deux mêmes contenus existent déjà, réels et complets, sur
// /formations (Les Bases, UI-6) — "Le minimum pour travailler proprement"
// et "Les bons gestes". Plutôt que dupliquer une seconde version (plus
// courte donc nécessairement moins complète) sur cette page, cette
// section reste une simple passerelle vers le contenu réel déjà publié —
// voir docs/audits/UI-7-OUTILS.md, Arbitrages.
export function BasiquesAtelier() {
  return (
    <Section tone="light" size="narrow" className="text-center">
      <h2 className="text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
        Les basiques de l&apos;atelier
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-neutral-600">
        Le matériel indispensable pour travailler proprement et les bons gestes de terrain sont
        détaillés sur Les bases.
      </p>
      <div className="mt-5">
        <Button href="/formations" variant="secondary">
          Voir les basiques de l&apos;atelier →
        </Button>
      </div>
    </Section>
  );
}
