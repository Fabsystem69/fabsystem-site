import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/public/PageIntro";
import { Modules } from "@/components/lesbases/Modules";
import { QuizSection } from "@/components/lesbases/QuizSection";
import { BonsGestes } from "@/components/lesbases/BonsGestes";
import { Indispensables } from "@/components/lesbases/Indispensables";
import { PasserelleBoutique } from "@/components/lesbases/PasserelleBoutique";
import { PasserelleServices } from "@/components/lesbases/PasserelleServices";
import { Section } from "@/components/layout/Section";
import { OUTILS_CALCULATEURS } from "@/lib/outils-catalog";

// Les Bases V2 (UI-10 §9) — page mère structurée en 3 sous-sections
// visibles et navigables : Formations → Les bons gestes → Les outils
// principaux. Le Quiz reste utile mais devient secondaire : déplacé en
// bas de page (mission §9.3 — il coupait auparavant la page en deux au
// milieu, donnant l'impression que le contenu s'arrêtait là). En-tête
// compact (PageIntro) : le contenu réel doit arriver immédiatement.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Les bases",
  description:
    "Les fondamentaux de l'électricité embarquée, expliqués simplement et gratuitement : modules, bons gestes, outils et quiz.",
  alternates: {
    canonical: "/formations",
  },
};

const SOUS_SECTIONS = [
  { id: "modules", label: "Formations" },
  { id: "bons-gestes", label: "Les bons gestes" },
  { id: "outils-principaux", label: "Les outils" },
] as const;

export default function FormationsPage() {
  return (
    <main className="bg-white text-neutral-900">
      <PageIntro
        eyebrow="Les bases"
        title="Comprendre avant de se lancer."
        description="Les fondamentaux de l'électricité embarquée, expliqués simplement et gratuitement."
      />

      <nav
        aria-label="Sections de la page"
        className="border-b border-neutral-200 bg-white"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-6 py-3">
          {SOUS_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="text-sm font-semibold text-neutral-600 underline underline-offset-4 decoration-neutral-300 hover:text-neutral-950 hover:decoration-neutral-900"
            >
              {section.label}
            </a>
          ))}
        </div>
      </nav>

      <Modules />

      <Section id="bons-gestes" tone="muted" className="scroll-mt-24">
        <div className="grid gap-10 lg:grid-cols-[3fr_2fr]">
          <BonsGestes />
          <Indispensables />
        </div>
      </Section>

      <Section id="outils-principaux" tone="light" className="scroll-mt-24">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
          Les outils principaux
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
          Une fois les bases comprises, mettez-les en pratique : 5 calculateurs gratuits, sans
          compte.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {OUTILS_CALCULATEURS.map((outil) => (
            <Link
              key={outil.id}
              href={`/outils/${outil.id}`}
              className="rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-700 transition-colors duration-150 hover:border-neutral-500 hover:text-neutral-950"
            >
              {outil.title}
            </Link>
          ))}
        </div>
        <div className="mt-5">
          <Link
            href="/outils"
            className="inline-flex items-center gap-1 text-sm font-semibold text-neutral-900 underline underline-offset-4 decoration-neutral-300 hover:decoration-neutral-900"
          >
            Voir tous les outils →
          </Link>
        </div>
      </Section>

      <PasserelleBoutique />
      <PasserelleServices />

      <QuizSection />
    </main>
  );
}
