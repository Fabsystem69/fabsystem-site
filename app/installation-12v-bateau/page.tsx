import { existsSync } from "node:fs";
import path from "node:path";
import LightboxImage from "@/components/LightboxImage";
import { PublicHero } from "@/components/public/PublicHero";
import ServiceAssurance from "@/components/ServiceAssurance";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Installation 12V bateau",
  description:
    "Installation et refonte 12V bateau : batteries, charge, distribution, protections et schéma. Intervention Rhône / Auvergne-Rhône-Alpes, visio partout.",
  alternates: {
    canonical: "/installation-12v-bateau",
  },
};

const audienceItems = [
  "Refonte complète ou installation neuve.",
  "Problèmes récurrents : coupures, tension instable, charge incohérente.",
  "Ajout d’équipements : frigo, pilote, électronique, convertisseur, charge solaire.",
] as const;

const includedItems = [
  "Architecture 12V : batteries, sources de charge, distribution.",
  "Protections (fusibles/disjoncteurs) et sections adaptées.",
  "Câblage propre, repérage, connexions fiables.",
  "Schéma simple et recommandations d’évolution.",
  "Contrôle final et points de vigilance.",
] as const;

const commonErrors = [
  "Sous-dimensionnement des câbles et chutes de tension.",
  "Protections mal placées ou absentes.",
  "Masses incohérentes et retours aléatoires.",
  "Ajouts successifs sans logique globale.",
] as const;

const proofAssets = {
  before: "/projets/12v-bateau-avant.jpg",
  tableau: "/projets/12v-bateau-tableau.jpg",
  fusiblesAvant: "/projets/12v-bateau-fusibles-avant.jpg",
  fusiblesApres: "/projets/12v-bateau-fusibles-apres.jpg",
} as const;

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Installation 12V bateau",
  url: "https://www.fabsystem.fr/installation-12v-bateau",
  isPartOf: {
    "@type": "WebSite",
    name: "FabSystem",
    url: "https://www.fabsystem.fr",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.fabsystem.fr" },
    { "@type": "ListItem", position: 2, name: "Installation 12V bateau", item: "https://www.fabsystem.fr/installation-12v-bateau" },
  ],
};

function hasPublicAsset(assetPath: string) {
  return existsSync(path.join(process.cwd(), "public", assetPath.replace(/^\//, "")));
}

export default function Installation12VBateauPage() {
  const hasBeforePhoto = hasPublicAsset(proofAssets.before);
  const hasTableauPhoto = hasPublicAsset(proofAssets.tableau);
  const hasFusiblesBeforePhoto = hasPublicAsset(proofAssets.fusiblesAvant);
  const hasFusiblesAfterPhoto = hasPublicAsset(proofAssets.fusiblesApres);
  const hasProofSection =
    hasBeforePhoto || hasTableauPhoto || (hasFusiblesBeforePhoto && hasFusiblesAfterPhoto);

  return (
    <main className="bg-white text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <PublicHero
        title="Installation 12V bateau"
        description="Conception, refonte ou sécurisation d’un réseau 12V lisible, protégé et fiable (batteries, charge, distribution)."
        micro="Objectif : une installation cohérente, documentée, et prête à évoluer (solaire, DC-DC, lithium)."
        primaryAction={{ href: "/contact", label: "Demander un devis" }}
        secondaryAction={{
          href: "/prestations#accompagnement-distance",
          label: "Accompagnement à distance",
          variant: "secondary",
        }}
        assurance={<ServiceAssurance tone="inverse" />}
        scrollTargetId="apres-hero"
      />

      <section id="apres-hero" className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
            Pour qui ?
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-700">
            {audienceItems.map((item) => (
              <li key={item} className="rounded-xl border border-neutral-200 bg-white p-3">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
              Ce qui est inclus
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              {includedItems.map((item) => (
                <li key={item} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
              Erreurs fréquentes à éviter
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              {commonErrors.map((item) => (
                <li key={item} className="rounded-xl border border-neutral-200 bg-white p-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {hasProofSection ? (
        <section className="border-t border-neutral-200 bg-white py-8 sm:py-10">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
                Avant / Après — exemple réel
              </h2>
              <div className="mt-3 space-y-3">
                {hasBeforePhoto ? (
                  <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
                    <h3 className="text-sm font-semibold text-neutral-950">
                      Installation existante (avant intervention)
                    </h3>
                    <p className="mt-2 text-sm text-neutral-700">
                      Ajouts successifs, protections hétérogènes, sections incohérentes.
                    </p>
                    <div className="mt-3">
                      <LightboxImage
                        src={proofAssets.before}
                        alt="Installation avant sécurisation"
                        width={500}
                        height={350}
                        quality={75}
                        sizes="(max-width: 640px) 100vw, 480px"
                        className="h-28 w-full rounded-xl border border-neutral-200 object-cover sm:h-32"
                      />
                    </div>
                  </div>
                ) : null}

                {hasTableauPhoto ? (
                  <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
                    <h3 className="text-sm font-semibold text-neutral-950">
                      Architecture 12V refondue
                    </h3>
                    <p className="mt-2 text-sm text-neutral-700">
                      Distribution centralisée, protections adaptées, sources de charge structurées.
                    </p>
                    <div className="mt-3">
                      <LightboxImage
                        src={proofAssets.tableau}
                        alt="Architecture 12V refondue"
                        width={500}
                        height={350}
                        quality={75}
                        sizes="(max-width: 640px) 100vw, 480px"
                        className="h-28 w-full rounded-xl border border-neutral-200 object-cover sm:h-32"
                      />
                    </div>
                  </div>
                ) : null}

                {hasFusiblesBeforePhoto && hasFusiblesAfterPhoto ? (
                  <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
                    <h3 className="text-sm font-semibold text-neutral-950">
                      Sécurisation et repérage
                    </h3>
                    <p className="mt-2 text-sm text-neutral-700">
                      Circuits identifiés, maintenance simplifiée, risque réduit.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <LightboxImage
                        src={proofAssets.fusiblesAvant}
                        alt="Porte-fusibles et câblage avant sécurisation"
                        width={500}
                        height={350}
                        quality={75}
                        sizes="(max-width: 640px) 50vw, 240px"
                        className="h-28 w-full rounded-xl border border-neutral-200 object-cover sm:h-32"
                      />
                      <LightboxImage
                        src={proofAssets.fusiblesApres}
                        alt="Bloc fusibles repéré après sécurisation"
                        width={500}
                        height={350}
                        quality={75}
                        sizes="(max-width: 640px) 50vw, 240px"
                        className="h-28 w-full rounded-xl border border-neutral-200 object-cover sm:h-32"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-t border-neutral-200 bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-4xl rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
            <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
              Parler de votre installation
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Décrivez votre bateau, vos batteries, vos sources de charge et vos équipements. Je vous réponds avec une suite claire.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
              >
                Demander un devis
              </Link>
              <Link
                href="/prestations#accompagnement-distance"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-white sm:w-auto"
              >
                Accompagnement à distance
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
