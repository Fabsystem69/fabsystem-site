import PageHero from "@/components/PageHero";
import ServiceAssurance from "@/components/ServiceAssurance";
import TrackedLink from "@/components/TrackedLink";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prestations électricité embarquée bateau, van, camping-car | FabSystem",
  description:
    "Diagnostic, sécurisation, distribution, autonomie (batteries/solaire/230V) et accompagnement. Prestations en électricité embarquée pour bateau, van et camping-car.",
};

const offers = [
  {
    title: "Visio conseil",
    audience: "Cadrer, décider, éviter les erreurs",
    deliverable: "Synthèse + plan d’action",
    pricing: "50 €",
    ctaLabel: "Réserver",
    href: "/visio",
    trackEvent: "click_rdv",
  },
  {
    title: "Diagnostic sur site",
    audience: "Clarifier une installation existante",
    deliverable: "Priorités sécurité + recommandations",
    pricing: "À partir de 89 €",
    ctaLabel: "Demander un diagnostic",
    href: "/contact",
  },
  {
    title: "Installation / refonte électrique",
    audience: "Neuf ou remise à niveau complète",
    deliverable: "Installation cohérente + câblage propre",
    pricing: "Sur devis",
    ctaLabel: "Demander un devis",
    href: "/contact",
  },
  {
    title: "Sécurisation 12V / 230V",
    audience: "Fiabiliser et sécuriser (AC/DC)",
    deliverable: "Protections + distribution + contrôle",
    pricing: "Sur devis (après diagnostic)",
    ctaLabel: "Sécuriser mon installation",
    href: "/contact",
  },
  {
    title: "Schéma & documentation",
    audience: "Comprendre, maintenir, faire évoluer",
    deliverable: "Schéma propre + repérage",
    pricing: "Sur devis",
    ctaLabel: "Mettre au propre",
    href: "/contact",
  },
  {
    title: "Audit nautique — Division 240/245",
    audience: "Préparer/fiabiliser une installation à bord",
    deliverable: "Audit + recommandations (selon réglementation en vigueur)",
    pricing: "Sur devis",
    ctaLabel: "Voir l’audit nautique",
    href: "/audit-nautique",
    secondaryCtaLabel: "Demander un audit",
    secondaryHref: "/contact",
  },
] as const;

const recommendations = [
  {
    need: "Premier tri avant achat, démontage ou recâblage",
    offer: "Visio conseil",
  },
  {
    need: "Installation existante, panne ou incohérence à clarifier",
    offer: "Diagnostic sur site",
  },
  {
    need: "Refonte complète, installation neuve ou remise à niveau",
    offer: "Installation / refonte",
  },
  {
    need: "Sécurité, protections, distribution ou 230 V à reprendre",
    offer: "Sécurisation 12V / 230V",
  },
] as const;

export default function PrestationsPage() {
  return (
    <main>
      <PageHero
        title="Prestations"
        subtitle="Sécurisation, diagnostic et installation électrique embarquée — bateau, van, camping-car."
        micro="Choisissez le bon niveau d’intervention selon votre besoin, puis avancez avec une suite claire."
        background="/hero-fabsystem.png"
        overlay="bg-black/55"
        ctas={[{ href: "/contact", label: "Demander un diagnostic", variant: "primary" }]}
        assurance={<ServiceAssurance tone="inverse" />}
      />

      <section id="offres" className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <div className="max-w-3xl">
          <h2 className="text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
            Choisir une prestation
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-700">
            Chaque pack correspond à un niveau d’intervention concret, avec un livrable clair.
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <article
              key={offer.title}
              className="flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <h3 className="text-sm font-semibold text-neutral-950">
                {offer.title}
              </h3>

              <div className="mt-3 space-y-2 text-sm text-neutral-700">
                <p>
                  <span className="font-medium text-neutral-900">Pour qui :</span>{" "}
                  {offer.audience}
                </p>
                <p>
                  <span className="font-medium text-neutral-900">Livrable :</span>{" "}
                  {offer.deliverable}
                </p>
                <p>
                  <span className="font-medium text-neutral-900">Prix :</span>{" "}
                  {offer.pricing}
                </p>
              </div>

              <div className="mt-auto space-y-2 pt-4">
                {"trackEvent" in offer ? (
                  <TrackedLink
                    href={offer.href}
                    event={offer.trackEvent}
                    className="inline-flex min-h-9 w-full items-center justify-center rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
                  >
                    {offer.ctaLabel}
                  </TrackedLink>
                ) : (
                  <Link
                    href={offer.href}
                    className="inline-flex min-h-9 w-full items-center justify-center rounded-md bg-neutral-900 px-3 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
                  >
                    {offer.ctaLabel}
                  </Link>
                )}

                {"secondaryCtaLabel" in offer ? (
                  <Link
                    href={offer.secondaryHref}
                    className="inline-flex min-h-9 w-full items-center justify-center rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
                  >
                    {offer.secondaryCtaLabel}
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-neutral-950">
            Votre besoin → Offre recommandée
          </h3>

          <div className="mt-3 space-y-2 text-sm text-neutral-700">
            {recommendations.map((item) => (
              <div
                key={item.need}
                className="flex flex-col gap-1 border-b border-neutral-200 pb-2 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
              >
                <p>{item.need}</p>
                <p className="font-medium text-neutral-900">{item.offer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
          <div className="max-w-3xl">
            <h2 className="text-base font-semibold tracking-tight text-neutral-900 sm:text-lg">
              Si vous hésitez
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-700">
              Décrivez votre installation et votre usage. Vous obtenez une réponse claire sur la meilleure suite : visio, diagnostic ou intervention.
            </p>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
            >
              Parler de votre projet
            </Link>

            <TrackedLink
              href="/visio"
              event="click_rdv"
              className="inline-flex w-full items-center justify-center rounded-md border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-100 sm:w-auto"
            >
              Visio conseil
            </TrackedLink>
          </div>

          <p className="mt-3 text-xs text-neutral-500">
            Bateau / van / camping-car • Réponse sous 24–48h ouvrées • Intervention sur rendez-vous.
          </p>
        </div>
      </section>
    </main>
  );
}
