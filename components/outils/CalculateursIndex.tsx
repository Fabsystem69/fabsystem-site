import { Section } from "@/components/layout/Section";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OUTILS_CALCULATEURS } from "@/lib/outils-catalog";

// Outils V2 — Index des calculateurs
// (docs/refonte-site-public/Outils/01-HUB-PUBLIC.md §4-5). Quatre
// calculateurs principaux immédiatement visibles, AWG ↔ mm² traité de
// façon plus compacte (§5 : "reste plus secondaire"). Données reprises de
// lib/outils-catalog.ts, seule source utilisée aussi par les en-têtes de
// section dans components/CalcSection.tsx.
export function CalculateursIndex() {
  const [sectionCable, ...autresPrincipaux] = OUTILS_CALCULATEURS.filter((o) => o.id !== "awg");
  const awg = OUTILS_CALCULATEURS.find((o) => o.id === "awg");

  return (
    <Section id="calculateurs" tone="muted" className="scroll-mt-16">
      <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
        Les calculateurs
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
        Gratuits, sans compte, résultat immédiat.
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {sectionCable ? (
          <Card className="flex flex-col justify-between p-6 lg:col-span-2">
            <div>
              <Badge tone="info">{sectionCable.tag}</Badge>
              <h3 className="mt-3 text-xl font-bold text-neutral-950">{sectionCable.title}</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-neutral-600">
                {sectionCable.description}
              </p>
            </div>
            <div className="mt-5">
              <Button href={`#${sectionCable.id}`} variant="primary">
                Calculer une section →
              </Button>
            </div>
          </Card>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-1 lg:grid-cols-1">
          {autresPrincipaux.map((outil) => (
            <Card key={outil.id} className="p-5">
              <h3 className="text-sm font-bold text-neutral-950">{outil.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">{outil.description}</p>
              <a
                href={`#${outil.id}`}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 underline underline-offset-4 decoration-neutral-300 transition-colors duration-150 hover:decoration-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                Ouvrir →
              </a>
            </Card>
          ))}
        </div>
      </div>

      {awg ? (
        <a
          href={`#${awg.id}`}
          className="mt-4 flex items-center justify-between gap-3 rounded-card border border-neutral-200 bg-white px-5 py-3 shadow-card transition-colors hover:border-neutral-300"
        >
          <div>
            <p className="text-sm font-semibold text-neutral-950">{awg.title}</p>
            <p className="text-xs text-neutral-500">{awg.description}</p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-neutral-600">→</span>
        </a>
      ) : null}
    </Section>
  );
}
