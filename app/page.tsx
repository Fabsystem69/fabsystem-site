import PageHero from "@/components/PageHero";
import ProcessSteps from "@/components/ProcessSteps";
import ServiceAssurance from "@/components/ServiceAssurance";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Électricité embarquée bateau, van et camping-car",
  description:
    "Diagnostic, conseil et installation en électricité embarquée pour bateaux, vans et camping-cars. Sécurité, clarté et solutions adaptées à votre usage.",
  alternates: {
    canonical: "/",
  },
};

const brands = [
  {
    href: "https://www.victronenergy.com",
    src: "/partners/victron-logo.svg",
    alt: "Victron Energy",
  },
  {
    href: "https://www.europe.sokbattery.com/?ref=Fabsystem",
    src: "/partners/sok-logo.png",
    alt: "SOK Battery",
  },
  {
    href: "https://www.elgena.de",
    src: "/partners/elgena-logo.png",
    alt: "Elgena",
  },
  {
    href: "https://www.pundmann.de",
    src: "/partners/pundmann-logo.svg",
    alt: "Pundmann",
  },
  {
    href: "https://www.dometic.com",
    src: "/partners/dometic-logo.png",
    alt: "Dometic",
  },
  {
    href: "https://www.truma.com",
    src: "/partners/truma-logo.png",
    alt: "Truma",
  },
];

export default function HomePage() {
  return (
    <main>
      <PageHero
        title="Électricité embarquée claire, fiable et maîtrisée"
        subtitle="Bateaux, vans, camping-cars — diagnostic précis, architecture cohérente, installation sécurisée."
        micro="Vous comprenez votre installation. Vous avancez en confiance."
        background="/hero-fabsystem.png"
        overlay="bg-black/50"
        ctas={[
          { href: "/contact", label: "Demander un diagnostic", variant: "primary" },
          { href: "/visio", label: "Découvrir la visio conseil", variant: "secondary" },
        ]}
        assurance={<ServiceAssurance tone="inverse" />}
      />

{/* PREUVES */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* 1 */}
          <div className="relative overflow-hidden rounded-xl border border-neutral-200">
            <Image
              src="/preuves/cable.png"
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/55" />

            <div className="relative p-6 text-white">
              <div className="text-sm font-semibold">Diagnostic clair</div>
              <p className="mt-2 text-sm leading-relaxed text-white/90">
                On identifie précisément ce qui est fiable, ce qui est risqué, et les priorités
                à traiter.
              </p>
            </div>
          </div>

          {/* 2 */}
          <div className="relative overflow-hidden rounded-xl border border-neutral-200">
            <Image
              src="/preuves/fuse-out.jpg"
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/55" />

            <div className="relative p-6 text-white">
              <div className="text-sm font-semibold">Sécurité avant tout</div>
              <p className="mt-2 text-sm leading-relaxed text-white/90">
                Protections adaptées, sections correctes, installation pensée pour durer et éviter
                les incidents.
              </p>
            </div>
          </div>

          {/* 3 */}
          <div className="relative overflow-hidden rounded-xl border border-neutral-200">
            <Image
              src="/preuves/install-victron.jpg"
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/55" />

            <div className="relative p-6 text-white">
              <div className="text-sm font-semibold">Accompagnement personnalisé</div>
              <p className="mt-2 text-sm leading-relaxed text-white/90">
                Chaque installation est analysée selon votre usage, votre matériel et vos contraintes
                réelles.
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* PROCESS */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <ProcessSteps />

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href="/contact"
            className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
          >
            Demander un diagnostic
          </a>
        </div>
      </section>

{/* AUDIT ÉLECTRIQUE NAUTIQUE */}
<section className="mx-auto max-w-6xl px-6 py-14">
  <div className="mx-auto max-w-4xl text-center">
    <h2 className="text-2xl font-semibold text-neutral-900">
      Audit électrique nautique – conformité & sécurité
    </h2>
    <p className="mt-3 text-sm leading-relaxed text-neutral-600">
      Un diagnostic terrain (ou à distance) pour vérifier la sécurité de votre installation,
      repérer les points à risque et définir les priorités.
    </p>
  </div>

  <div className="mt-12 grid gap-6 sm:grid-cols-3">
    <div className="rounded-xl border border-neutral-200 p-6">
      <div className="text-sm font-semibold text-neutral-900">✅ Vérification</div>
      <p className="mt-3 text-sm leading-relaxed text-neutral-700">
        Contrôle de l’existant : protections, câblage, charge, batteries, masses,
        risques d’échauffement et de court-circuit.
      </p>
      <p className="mt-2 text-xs text-neutral-500">
        → On confirme ce qui est fiable
      </p>
    </div>

    <div className="rounded-xl border border-neutral-200 p-6">
      <div className="text-sm font-semibold text-neutral-900">⚠️ Risques & priorités</div>
      <p className="mt-3 text-sm leading-relaxed text-neutral-700">
        Identification des points faibles et des éléments à sécuriser en priorité
        (fusibles, sections, connexions, cheminements, ventilation).
      </p>
      <p className="mt-2 text-xs text-neutral-500">
        → On liste les actions urgentes
      </p>
    </div>

    <div className="rounded-xl border border-neutral-200 p-6">
      <div className="text-sm font-semibold text-neutral-900">🧩 Plan d’amélioration</div>
      <p className="mt-3 text-sm leading-relaxed text-neutral-700">
        Proposition d’une architecture adaptée à votre usage : distribution,
        protections, énergie, priorités et étapes claires.
      </p>
      <p className="mt-2 text-xs text-neutral-500">
        → Un plan simple à suivre
      </p>
    </div>
  </div>

  <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
    <a
      href="/contact"
      className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
    >
      Demander un audit
    </a>
    <a
      href="/visio"
      className="inline-flex w-full items-center justify-center rounded-md border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 sm:w-auto"
    >
      Voir la visio conseil
    </a>
  </div>
</section>

      {/* PARTENAIRES */}
      <section className="border-t border-neutral-200 bg-white py-14">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-lg font-semibold text-neutral-900">
            Marques et équipements utilisés
          </h2>

          <p className="mt-2 text-sm text-neutral-600">
            Matériel reconnu et éprouvé, sélectionné pour la fiabilité et la sécurité des
            installations.
          </p>

          <p className="mt-1 text-xs text-neutral-500">
            Sélection selon les contraintes techniques de chaque projet.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {brands.map((brand) => (
              <a
                key={brand.alt}
                href={brand.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center"
                aria-label={brand.alt}
                title={brand.alt}
              >
                <Image
                  src={brand.src}
                  alt={brand.alt}
                  width={120}
                  height={40}
                  className="h-10 w-auto max-w-[120px] object-contain opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
