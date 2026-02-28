import { existsSync } from "node:fs";
import path from "node:path";
import LightboxImage from "@/components/LightboxImage";
import PageHero from "@/components/PageHero";
import ServiceAssurance from "@/components/ServiceAssurance";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sécurisation / correction électrique bateau",
  description:
    "Corrections ciblées et sécurisation 12V / 230V : protections, distribution, câblage, repérage. Diagnostic puis intervention selon périmètre.",
  alternates: {
    canonical: "/securisation-correction-bateau",
  },
};

const audienceItems = [
  "Coupures 12V, faux contacts, échauffements.",
  "Protections absentes/mal placées, distribution confuse.",
  "Ajouts successifs (solaire, DC-DC, convertisseur) sans logique globale.",
] as const;

const correctionItems = [
  "Protections adaptées (fusibles/disjoncteurs) au bon endroit.",
  "Sections et connexions fiabilisées.",
  "Distribution lisible + repérage.",
  "Contrôle final + points de vigilance.",
] as const;

const proofAssets = {
  avant: "/preuves/bateau-avant.jpg",
  apres: "/preuves/bateau-apres.jpg",
  fuseOut: "/preuves/fuse-out.jpg",
  cableBruler: "/preuves/cable-bruler.jpg",
} as const;

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Sécurisation / correction électrique bateau",
  url: "https://www.fabsystem.fr/securisation-correction-bateau",
  isPartOf: {
    "@type": "WebSite",
    name: "FabSystem",
    url: "https://www.fabsystem.fr",
  },
};

function hasPublicAsset(assetPath: string) {
  return existsSync(path.join(process.cwd(), "public", assetPath.replace(/^\//, "")));
}

export default function SecurisationCorrectionBateauPage() {
  const hasAvant = hasPublicAsset(proofAssets.avant);
  const hasApres = hasPublicAsset(proofAssets.apres);
  const hasFuseOut = hasPublicAsset(proofAssets.fuseOut);
  const hasCableBruler = hasPublicAsset(proofAssets.cableBruler);
  const hasProofSection = (hasAvant && hasApres) || hasFuseOut || hasCableBruler;

  return (
    <main className="bg-white text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />

      <PageHero
        title="Sécurisation / correction électrique bateau"
        subtitle="Corrections ciblées pour fiabiliser : protections, distribution, câblage, repérage."
        micro="On part d’un diagnostic, puis on corrige ce qui est critique — sans tout refaire inutilement."
        background="/hero-fabsystem.png"
        overlay="bg-black/55"
        ctas={[
          { href: "/contact", label: "Demander un devis", variant: "primary" },
          { href: "/visio", label: "Visio conseil", variant: "secondary" },
        ]}
        assurance={<ServiceAssurance tone="inverse" />}
      />

      <section className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
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
              Ce que je corrige
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              {correctionItems.map((item) => (
                <li key={item} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
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
                {hasAvant && hasApres ? (
                  <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
                    <h3 className="text-sm font-semibold text-neutral-950">
                      Avant / Après
                    </h3>
                    <p className="mt-2 text-sm text-neutral-700">
                      Sécurisation + repérage : installation plus lisible, risques réduits.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <LightboxImage
                        src={proofAssets.avant}
                        alt="Installation avant sécurisation"
                        width={500}
                        height={350}
                        quality={75}
                        sizes="(max-width: 640px) 50vw, 240px"
                        className="h-28 w-full rounded-xl border border-neutral-200 object-cover sm:h-32"
                      />
                      <LightboxImage
                        src={proofAssets.apres}
                        alt="Installation après sécurisation"
                        width={500}
                        height={350}
                        quality={75}
                        sizes="(max-width: 640px) 50vw, 240px"
                        className="h-28 w-full rounded-xl border border-neutral-200 object-cover sm:h-32"
                      />
                    </div>
                  </div>
                ) : null}

                {hasFuseOut ? (
                  <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
                    <h3 className="text-sm font-semibold text-neutral-950">
                      Exemple : fusible sorti
                    </h3>
                    <p className="mt-2 text-sm text-neutral-700">
                      Symptôme typique : protection qui saute / mauvais contact / distribution incohérente.
                    </p>
                    <div className="mt-3">
                      <LightboxImage
                        src={proofAssets.fuseOut}
                        alt="Fusible sorti lors d'une intervention de correction"
                        width={500}
                        height={350}
                        quality={75}
                        sizes="(max-width: 640px) 100vw, 480px"
                        className="h-28 w-full rounded-xl border border-neutral-200 object-cover sm:h-32"
                      />
                    </div>
                  </div>
                ) : null}

                {hasCableBruler ? (
                  <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4">
                    <h3 className="text-sm font-semibold text-neutral-950">
                      Exemple : câble brûlé
                    </h3>
                    <p className="mt-2 text-sm text-neutral-700">
                      Symptôme critique : échauffement, section/connexion/sertissage à reprendre.
                    </p>
                    <div className="mt-3">
                      <LightboxImage
                        src={proofAssets.cableBruler}
                        alt="Câble brûlé avant correction"
                        width={500}
                        height={350}
                        quality={75}
                        sizes="(max-width: 640px) 100vw, 480px"
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
              Décrivez votre installation et vos symptômes. Je vous réponds avec une suite claire.
            </p>

            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex min-h-9 w-full items-center justify-center rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
              >
                Demander un devis
              </Link>
              <Link
                href="/visio"
                className="inline-flex min-h-9 w-full items-center justify-center rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-900 hover:bg-white sm:w-auto"
              >
                Visio conseil
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
