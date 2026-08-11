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
  relatedTool,
}: {
  title: string;
  description: string;
  children: ReactNode;
  /** Passerelle contextuelle vers un outil complémentaire (ex. Bilan → Autonomie). */
  relatedTool?: { href: string; label: string };
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

      {relatedTool ? (
        <Section tone="muted" size="wide" className="py-6">
          <Link
            href={relatedTool.href}
            className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-900"
          >
            {relatedTool.label} →
          </Link>
        </Section>
      ) : null}
    </main>
  );
}
