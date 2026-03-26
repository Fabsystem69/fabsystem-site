import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ServiceAssurance from "@/components/ServiceAssurance";
import CalcSection from "@/components/CalcSection";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Outils & Calculateurs électricité embarquée — bateau, van, camping-car",
  description:
    "Calculateurs gratuits : section de câble 12V, bilan de consommation, autonomie batterie, table AWG/mm² avec usages typiques bateau. Dimensionnez votre installation électrique embarquée.",
  alternates: { canonical: "/outils" },
  openGraph: {
    title: "Calculateurs électricité embarquée | FabSystem",
    description:
      "Calculez la section de câble, le bilan de consommation et l'autonomie batterie pour votre bateau, van ou camping-car.",
    url: "https://www.fabsystem.fr/outils",
  },
};

const outils = [
  {
    id: "section-cable",
    emoji: "⚡",
    title: "Section de câble",
    description: "Trouvez la section idéale selon l'intensité, la longueur et la chute de tension admissible.",
    tag: "Le plus utilisé",
  },
  {
    id: "bilan-conso",
    emoji: "🔋",
    title: "Bilan de consommation",
    description: "Calculez votre consommation journalière et la capacité batterie recommandée.",
    tag: "Essentiel",
  },
  {
    id: "autonomie",
    emoji: "⏱️",
    title: "Autonomie batterie",
    description: "Estimez combien de temps votre batterie tient selon votre consommation et sa capacité.",
    tag: "Avec solaire ☀️",
  },
  {
    id: "awg",
    emoji: "📐",
    title: "AWG ↔ mm²",
    description: "Convertisseur AWG/mm² + sections recommandées par équipement bateau (guindeau, frigo, pilote…).",
    tag: "Référence",
  },
];

export default function OutilsPage() {
  return (
    <main>
      <PageHero
        title="Outils & Calculateurs"
        subtitle="Des calculateurs gratuits pour dimensionner votre installation électrique embarquée — sans inscription, sans prise de tête."
        micro="Section de câble · Bilan de consommation · Autonomie batterie · AWG ↔ mm²"
        background="/hero-fabsystem.png"
        overlay="bg-black/55"
        ctas={[
          { href: "#section-cable", label: "Calculer une section de câble", variant: "primary" },
          { href: "#bilan-conso", label: "Bilan de consommation", variant: "secondary" },
        ]}
        assurance={<ServiceAssurance tone="inverse" />}
      />

      {/* Index des outils */}
      <section className="border-b border-neutral-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {outils.map((o) => (
              <a
                key={o.id}
                href={`#${o.id}`}
                className="group flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm transition-all duration-150 hover:border-brand-400 hover:shadow-md"
              >
                <span className="text-2xl">{o.emoji}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-neutral-900">{o.title}</p>
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                      {o.tag}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{o.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Les 3 calculateurs */}
      <CalcSection />

      {/* CTA bas de page */}
      <section className="border-t border-neutral-200 bg-neutral-950 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Les calculs pointent vers une installation complexe ?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            Ces outils couvrent les cas courants. Pour un dimensionnement précis adapté à votre
            installation réelle — batteries lithium, solaire, 230V — une visio conseil permet
            d'aller bien plus loin.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/visio"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-400 px-6 py-3 text-sm font-bold text-neutral-900 transition-colors hover:bg-brand-300"
            >
              Réserver une visio conseil — 50 €
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-neutral-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-neutral-400"
            >
              Poser une question
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
