import PageHero from "@/components/PageHero";
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
              alt="Câble électrique embarqué lors d'un diagnostic d'installation"
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
              alt="Fusible sorti d'un tableau électrique lors d'un diagnostic embarqué"
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
              alt="Installation Victron Energy sur un bateau, accompagnement personnalisé"
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

      {/* EBOOK */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-14">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-2xl font-semibold text-neutral-900">
            Ebook — Câbler son van sans se planter
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            Le manuel complet pour installer l&apos;électricité et la plomberie de votre van
            comme un pro, écrit par un électricien qui pose ça tous les jours. Format
            interactif, exemplaire personnalisé à votre nom.
          </p>
          <p className="mt-2 text-xs font-medium text-neutral-500">
            49,99 € — déductibles d&apos;un accompagnement FabSystem si vous allez plus loin
            ensuite.
          </p>
          <div className="mt-8">
            <a
              href="/ebook/cabler-son-van"
              className="inline-flex items-center justify-center rounded-md bg-brand-400 px-6 py-3 text-sm font-bold text-neutral-900 hover:bg-brand-300"
            >
              Découvrir l&apos;ebook — 49,99 €
            </a>
          </div>
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
