import Link from "next/link";
import PageHero from "@/components/PageHero";

export default function HomePage() {
  return (
    <main>
      <PageHero
        title="Électricité embarquée fiable et sécurisée"
        subtitle="Pour bateaux, vans et camping-cars. Diagnostic clair, conseils concrets, installation propre et protégée."
        micro="Objectif : une installation simple, sûre, et adaptée à ton usage (sans bidouilles dangereuses)."
        background="/hero-fabsystem.png"
        overlay="bg-black/50"
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

      {/* Preuves rapides / réassurance */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 p-5">
            <div className="text-sm font-semibold">✅ Sécurité</div>
            <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
              Protections adaptées, câbles dimensionnés, montage propre et durable.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 p-5">
            <div className="text-sm font-semibold">✅ Diagnostic clair</div>
            <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
              On identifie ce qui est risqué, ce qui est OK, et le plan d’action.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 p-5">
            <div className="text-sm font-semibold">✅ Conseils utiles</div>
            <p className="mt-2 text-sm text-neutral-700 leading-relaxed">
              Tu comprends ce que tu payes et pourquoi. Pas de jargon inutile.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/prestations"
            className="inline-flex w-full items-center justify-center rounded-md border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 sm:w-auto"
          >
            Voir les prestations
          </Link>
          <Link
            href="/realisations"
            className="inline-flex w-full items-center justify-center rounded-md border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 sm:w-auto"
          >
            Voir les réalisations
          </Link>
        </div>
      </section>
    </main>
  );
}