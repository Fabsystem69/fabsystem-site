import type { ReactNode } from "react";
import Link from "next/link";
import { Section } from "@/components/layout/Section";

// Coquille commune d'une page calculateur
// (docs/refonte-site-public/Outils/00-ARCHITECTURE-OUTILS.md §7) : retour
// vers Tous les outils, titre, courte explication, calculateur, puis
// passerelles légères. Server Component pur — le calculateur passé en
// `children` est le seul morceau client de la page.
export function CalculatorPageShell({
  title,
  description,
  children,
  relatedTools,
}: {
  title: string;
  description: string;
  children: ReactNode;
  /** Passerelles contextuelles vers 1-2 outils complémentaires (ex. Bilan →
   * Autonomie). Volontairement limité — jamais un mur de cartes "autres
   * outils" (mission UI-9 FINAL §13). */
  relatedTools?: { href: string; label: string }[];
}) {
  return (
    <main className="bg-white text-neutral-900">
      <Section tone="light" size="wide" className="pb-6 pt-8 sm:pt-10">
        <Link
          href="/outils"
          className="text-sm font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
        >
          ← Tous les outils
        </Link>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
          {description}
        </p>
      </Section>

      <Section tone="light" size="wide" className="pt-0">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-7">
          {children}
        </div>
      </Section>

      {relatedTools && relatedTools.length > 0 ? (
        <Section tone="muted" size="wide" className="py-6">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {relatedTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-900"
              >
                {tool.label} →
              </Link>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Passerelle commune, un seul bloc sobre (mission §13) : Les Bases
          pour comprendre le "pourquoi", Services si le calcul dépasse ce
          qu'un outil seul peut couvrir. */}
      <Section tone="light" size="wide" className="border-t border-neutral-100 py-6">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link
            href="/formations"
            className="font-medium text-neutral-600 underline underline-offset-4 decoration-neutral-300 hover:text-neutral-900 hover:decoration-neutral-900"
          >
            Comprendre les bases →
          </Link>
          <Link
            href="/prestations#on-fait-ensemble"
            className="font-medium text-neutral-600 underline underline-offset-4 decoration-neutral-300 hover:text-neutral-900 hover:decoration-neutral-900"
          >
            Être accompagné sur ce calcul →
          </Link>
        </div>
      </Section>
    </main>
  );
}
