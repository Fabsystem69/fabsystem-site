import PageHero from "@/components/PageHero";
import Link from "next/link";

export default function PrestationsPage() {
  return (
    <main>
      <PageHero
        title="Prestations"
        subtitle="Sécurisation, diagnostic et installation électrique embarquée — bateau, van, camping-car."
        micro="Tu veux une installation fiable ? On part d’un diagnostic puis on construit proprement."
        background="/hero-fabsystem.png"
        overlay="bg-black/55"
        ctas={[
          { href: "/contact", label: "Demander un diagnostic", variant: "primary" },
          {
            href: "https://cal.com/fabien-l-typ79a",
            label: "Réserver une visio",
            variant: "secondary",
            external: true,
          },
        ]}
      />

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">Diagnostic & sécurisation</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Contrôle des protections, sections, masses, risques d’échauffement, points faibles.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">Distribution & protections</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Tableaux, fusibles, coupe-circuits, câblage propre, repérage.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">Énergie & autonomie</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Batterie(s), charge (alternateur, solaire), convertisseur, monitoring.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 p-6">
            <h2 className="text-lg font-semibold">Conseil & visio</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Analyse de ton schéma, recommandations, liste d’achats, étapes de montage.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <Link
            href="/contact"
            className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
          >
            Parler de ton projet
          </Link>
        </div>
      </section>
    </main>
  );
}