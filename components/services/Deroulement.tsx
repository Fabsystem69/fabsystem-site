import { Section } from "@/components/layout/Section";

// Services V2 — Déroulement (docs/refonte-site-public/services/05-DEROULEMENT.md).
// Section volontairement légère : ne répète ni les douze noms d'offres, ni
// le catalogue terrain, ni les prix (§7-8). Sert uniquement à montrer que
// les trois voies ne sont pas un tunnel obligatoire.
const CHEMINS = [
  { title: "Je fais seul", steps: ["Je découvre", "J'utilise les ressources FabSystem", "J'avance seul"] },
  {
    title: "On fait ensemble",
    steps: ["Je choisis mon univers", "Je fais le point", "Je choisis mon accompagnement", "Je réalise accompagné"],
  },
  {
    title: "Je confie",
    steps: ["Je décris mon besoin", "FabSystem qualifie la demande", "Devis / intervention selon le projet", "Fabien réalise"],
  },
] as const;

export function Deroulement() {
  return (
    <Section tone="muted">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          Comment avancer avec FabSystem ?
        </h2>
        <p className="mt-3 text-base leading-relaxed text-neutral-600">
          Commencez comme vous voulez. Changez de niveau d&apos;accompagnement si votre projet
          évolue.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {CHEMINS.map((chemin) => (
          <div key={chemin.title}>
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-950">{chemin.title}</h3>
            <ol className="mt-3 space-y-2">
              {chemin.steps.map((step, index) => (
                <li key={step} className="flex items-start gap-2 text-sm text-neutral-600">
                  <span aria-hidden="true" className="mt-0.5 text-brand-500">
                    {index === 0 ? "•" : "↓"}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <p className="mt-8 max-w-2xl text-sm leading-relaxed text-neutral-500">
        Lorsqu&apos;un achat est éligible, ce que vous avez déjà engagé peut être pris en compte
        pour la suite.
      </p>
    </Section>
  );
}
