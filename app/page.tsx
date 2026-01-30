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
{/* PARTENAIRES */}
<section className="border-t border-neutral-200 bg-white py-14">
  <div className="mx-auto max-w-6xl px-6 text-center">
    <h2 className="text-lg font-semibold text-neutral-900">
      Marques et équipements utilisés
    </h2>

    <p className="mt-2 text-sm text-neutral-600">
      Matériel reconnu et éprouvé, sélectionné pour la fiabilité et la sécurité des installations.
    </p>

    <p className="mt-1 text-xs text-neutral-500">
      Sélection selon les contraintes techniques de chaque projet.
    </p>

    <div className="mt-10 flex flex-wrap items-center justify-center gap-10">
      <img
        src="/partners/victron-logo.svg"
        alt="Victron Energy"
        className="max-h-12 max-w-[140px] w-auto object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0"
      />

      <img
        src="/partners/sok-logo.png"
        alt="SOK Battery"
        className="max-h-12 max-w-[140px] w-auto object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0"
      />

      <img
        src="/partners/elgena-logo.png"
        alt="Elgena"
        className="max-h-12 max-w-[140px] w-auto object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0"
      />

      <img
        src="/partners/pentair-logo.svg"
        alt="Pentair / Shurflo"
        className="max-h-12 max-w-[140px] w-auto object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0"
      />

      <img
        src="/partners/pundmann-logo.svg"
        alt="Pundmann"
        className="max-h-12 max-w-[140px] w-auto object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0"
      />
    </div>
  </div>
</section>
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