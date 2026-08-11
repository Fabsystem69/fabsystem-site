import { PublicHero } from "@/components/public/PublicHero";
import ServiceAssurance from "@/components/ServiceAssurance";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Problème charge batterie bateau",
  description:
    "Diagnostic et sécurisation des problèmes de charge batterie bateau (alternateur, DC-DC, chargeur, solaire). Intervention Rhône / AURA.",
  alternates: {
    canonical: "/probleme-charge-batterie-bateau",
  },
};

const symptoms = [
  "Batterie qui ne remonte pas correctement en navigation ou au quai.",
  "Tension instable, chutes anormales, ou recharge très lente.",
  "Chargeur, alternateur ou solaire qui semblent fonctionner sans résultat cohérent.",
  "Batteries qui chauffent, vieillissent vite ou restent incomplètement chargées.",
] as const;

const causes = [
  "Sections de câbles inadaptées ou connexions fatiguées.",
  "Protection mal placée ou distribution incohérente.",
  "Chargeur, alternateur, régulateur solaire ou DC-DC mal dimensionnés.",
  "Logique de charge non adaptée au parc batteries ou au lithium.",
] as const;

const actions = [
  "Mesure de la charge réelle et recherche des pertes ou incohérences.",
  "Vérification de la logique alternateur / chargeur / solaire / DC-DC.",
  "Priorisation des corrections pour fiabiliser sans refaire inutilement.",
] as const;

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Problème charge batterie bateau",
  url: "https://www.fabsystem.fr/probleme-charge-batterie-bateau",
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
    { "@type": "ListItem", position: 2, name: "Problème de charge batterie bateau", item: "https://www.fabsystem.fr/probleme-charge-batterie-bateau" },
  ],
};

export default function ProblemeChargeBatterieBateauPage() {
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
        title="Problème de charge batterie bateau ?"
        description="Charge lente, tension incohérente, alternateur ou chargeur qui ne donnent pas le résultat attendu : on clarifie la cause et la suite à donner."
        micro="Diagnostic clair, priorités sécurité, recommandations adaptées à votre installation."
        primaryAction={{ href: "/contact", label: "Demander un diagnostic" }}
        secondaryAction={{ href: "/contact", label: "Me contacter", variant: "secondary" }}
        assurance={<ServiceAssurance tone="inverse" />}
        scrollTargetId="apres-hero"
      />

      <section id="apres-hero" className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
            Symptômes fréquents
          </h2>
          <ul className="mt-3 grid gap-3 text-sm text-neutral-700 sm:grid-cols-2">
            {symptoms.map((item) => (
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
              Causes fréquentes
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              {causes.map((item) => (
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
              Ce que je fais concrètement
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              {actions.map((item) => (
                <li key={item} className="rounded-xl border border-neutral-200 bg-white p-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-4xl rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
            <h2 className="text-base font-semibold text-neutral-950 sm:text-lg">
              Besoin d’un avis clair ?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Décrivez votre installation et vos symptômes. Vous obtenez une réponse claire sur la meilleure suite : diagnostic sur site ou visio.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
              >
                Demander un diagnostic
              </Link>
              <Link
                href="/contact"
                className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-white sm:w-auto"
              >
                Me contacter
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
