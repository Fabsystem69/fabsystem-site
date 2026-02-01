import PageHero from "@/components/PageHero";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Électricité embarquée bateau, van et camping-car | FabSystem",
  description:
    "Diagnostic, conseil et installation en électricité embarquée pour bateaux, vans et camping-cars. Sécurité, clarté et solutions adaptées à votre usage.",
};

const brands = [
  {
    href: "https://www.victronenergy.com",
    src: "/partners/victron-logo.svg",
    alt: "Victron Energy",
  },
  {
    href: "https://www.sokbattery.com",
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
        title="Électricité embarquée fiable et sécurisée"
        subtitle="Pour bateaux, vans et camping-cars. Diagnostic clair, conseils concrets, installation propre et protégée."
        micro="Objectif : une installation simple, sûre, et adaptée à ton usage."
        background="/hero-fabsystem.png"
        overlay="bg-black/50"
        ctas={[
          { href: "/contact", label: "Demander un diagnostic", variant: "primary" },
          { href: "/visio", label: "Découvrir la visio conseil", variant: "secondary" },
        ]}
      />

{/* PREUVES */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* 1 */}
          <div className="relative overflow-hidden rounded-xl border border-neutral-200">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/preuves/cable.png')" }}
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
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/preuves/fuse-out.jpg')" }}
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
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('/preuves/install-victron.jpg')" }}
            />
            <div className="absolute inset-0 bg-black/55" />

            <div className="relative p-6 text-white">
              <div className="text-sm font-semibold">Accompagnement personnalisé</div>
              <p className="mt-2 text-sm leading-relaxed text-white/90">
                Chaque installation est analysée selon ton usage, ton matériel et tes contraintes
                réelles.
              </p>
            </div>
          </div>
        </div>

      </section>

{/* COMMENT ÇA SE PASSE */}
<section className="mx-auto max-w-6xl px-6 py-14">
  <div className="mx-auto max-w-4xl text-center">
    <h2 className="text-2xl font-semibold text-neutral-900">
      Comment ça se passe
    </h2>
    <p className="mt-3 text-sm leading-relaxed text-neutral-600">
      Un accompagnement clair, étape par étape, pour comprendre votre installation
      et avancer sans prise de risque.
    </p>
  </div>

  <div className="mt-12 grid gap-6 sm:grid-cols-3">
    {/* Étape 1 */}
    <div className="rounded-xl border border-neutral-200 p-6">
      <div className="text-sm font-semibold text-neutral-900">
        1️⃣ Diagnostic
      </div>
      <p className="mt-3 text-sm leading-relaxed text-neutral-700">
        Analyse de l’existant, identification des risques, points faibles
        et éléments à sécuriser en priorité.
      </p>
      <p className="mt-2 text-xs text-neutral-500">
        → Ce qui est OK / ce qui est risqué / ce qu’il faut corriger
      </p>
    </div>

    {/* Étape 2 */}
    <div className="rounded-xl border border-neutral-200 p-6">
      <div className="text-sm font-semibold text-neutral-900">
        2️⃣ Plan d’action
      </div>
      <p className="mt-3 text-sm leading-relaxed text-neutral-700">
        Proposition d’une architecture adaptée à votre usage :
        protections, distribution, énergie, priorités.
      </p>
      <p className="mt-2 text-xs text-neutral-500">
        → Schéma simple, matériel adapté, étapes claires
      </p>
    </div>

    {/* Étape 3 */}
    <div className="rounded-xl border border-neutral-200 p-6">
      <div className="text-sm font-semibold text-neutral-900">
        3️⃣ Accompagnement
      </div>
      <p className="mt-3 text-sm leading-relaxed text-neutral-700">
        Intervention sur place ou visio conseil si vous réalisez vous-même
        l’installation.
      </p>
      <p className="mt-2 text-xs text-neutral-500">
        → Vous avancez sans bricolage dangereux
      </p>
    </div>
  </div>

  {/* CTA */}
  <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
    <a
      href="/contact"
      className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
    >
      Demander un diagnostic
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
                <img
                  src={brand.src}
                  alt={brand.alt}
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