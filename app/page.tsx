import ServiceAssurance from "@/components/ServiceAssurance";
import { resolveBackgroundImage } from "@/lib/background-image";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Électricité embarquée bateau, van et camping-car",
  description:
    "Diagnostic, conseil et installation en électricité embarquée pour bateaux, vans et camping-cars. Sécurité, clarté et solutions adaptées à votre usage.",
  alternates: {
    canonical: "/",
  },
};

// Parcours unique (fusionne l'ancien double bloc "4 niveaux" + "3 chemins",
// redondants entre eux) : chaque niveau a une destination distincte.
const levels = [
  {
    n: "1",
    title: "Apprendre gratuitement",
    hook: "Modules gratuits, à votre rythme, sans engagement.",
    cta: "Découvrir",
    href: "/formations",
  },
  {
    n: "2",
    title: "Acheter le guide complet",
    hook: "L'ebook complet pour tout faire vous-même, étape par étape.",
    cta: "Voir le guide",
    href: "/boutique",
  },
  {
    n: "3",
    title: "Être accompagné à distance",
    hook: "Diagnostic, schéma, suivi de chantier à distance.",
    cta: "Voir l'offre",
    href: "/prestations#accompagnement-distance",
  },
  {
    n: "4",
    title: "Faire intervenir FabSystem",
    hook: "Sur place, ou clé en main du début à la fin.",
    cta: "Voir l'offre",
    href: "/prestations#prestations-terrain",
  },
] as const;

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
  const heroBackground = resolveBackgroundImage("/hero-fabsystem.png");

  return (
    <main>
      {/* PARCOURS */}
      <section
        className="relative bg-cover bg-center"
        style={{ backgroundImage: heroBackground }}
      >
        <div className="absolute inset-0 bg-black/65" />

        <div className="relative z-10 mx-auto max-w-3xl px-6 py-6 text-white sm:py-8">
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl lg:text-2xl">
              Bateaux, vans, camping-cars — choisissez votre point de départ.
            </h1>
            <p className="mt-1 text-xs text-white/75 sm:text-sm">
              De l&apos;apprentissage en autonomie à l&apos;installation clé en main.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {levels.map((level) => (
              <Link
                key={level.n}
                href={level.href}
                className="group flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 p-3 text-left backdrop-blur transition hover:border-yellow-400 hover:bg-white/15"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-neutral-900">
                  {level.n}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{level.title}</p>
                  <p className="text-xs text-white/70 sm:text-sm">{level.hook}</p>
                </div>
                <span className="inline-flex shrink-0 items-center justify-center rounded-lg bg-yellow-400 px-3 py-1.5 text-xs font-bold text-neutral-900 transition-colors group-hover:bg-yellow-300">
                  {level.cta}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-3 flex justify-center">
            <ServiceAssurance tone="inverse" />
          </div>
        </div>
      </section>

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

        <div className="mt-6 text-center">
          <Link
            href="/realisations"
            className="text-sm font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
          >
            Voir des exemples de réalisations
          </Link>
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
