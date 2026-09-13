import Link from "next/link";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";

const METHOD_LINKS = [
  { href: "/formations", label: "Apprendre les bases" },
  { href: "/outils", label: "Calculer" },
  { href: "/schemas-electriques", label: "Comparer un schéma" },
  { href: "/outils/schema", label: "Dessiner" },
] as const;

export function MethodeFabSystem() {
  return (
    <Section
      id="methode"
      tone="light"
      containerClassName="max-w-5xl"
      className="scroll-mt-24 !py-8 sm:!py-10"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Méthode FabSystem
          </p>
          <h2 className="mt-2 text-xl font-bold tracking-tight text-neutral-950 sm:text-[1.7rem]">
            Avant les offres, une façon de raisonner.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-700">
            FabSystem organise l&apos;électricité embarquée dans un ordre simple : comprendre les bases,
            dimensionner, dessiner le schéma, puis vérifier avant d&apos;acheter ou de câbler.
          </p>
          <div className="mt-5">
            <Button href="/commencer-ici" variant="primary">
              Commencer ici
            </Button>
          </div>
        </div>

        <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
          <p className="text-sm font-semibold text-neutral-950">
            Un parcours utile même si vous ne commandez rien.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {METHOD_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition-colors hover:border-neutral-300 hover:text-neutral-950"
              >
                {item.label} →
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
