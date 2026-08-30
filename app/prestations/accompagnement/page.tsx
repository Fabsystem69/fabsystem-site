import type { Metadata } from "next";
import { OnFaitEnsemble } from "@/components/services/OnFaitEnsemble";
import { Confiance } from "@/components/home/Confiance";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { resolvePrestationsCategorie } from "@/lib/prestations-search-params";
import { site } from "@/lib/site";

// UI-10 §4 — page dédiée à l'accompagnement, extraite de /prestations
// (devenue une simple page d'orientation). Pas de PageIntro séparé :
// OnFaitEnsemble porte déjà son propre eyebrow + h1 + description en tête
// de page, un second bloc d'intro aurait dupliqué le même message.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accompagnement electrique a distance bateau, van, camping-car",
  description:
    "Accompagnement electrique a distance pour bateau, van et camping-car : conception, verification de schema, choix de materiel et aide a la mise au propre de votre installation embarquee.",
  alternates: {
    canonical: "/prestations/accompagnement",
  },
  openGraph: {
    title: "Accompagnement electrique a distance | FabSystem",
    description:
      "Un accompagnement a distance pour clarifier un schema electrique de bateau, van ou camping-car, choisir le materiel utile et preparer une installation plus fiable.",
    url: "https://www.fabsystem.fr/prestations/accompagnement",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Accompagnement electrique a distance | FabSystem",
    description:
      "FabSystem accompagne a distance les projets electriques bateau, van et camping-car, du schema aux verifications utiles avant cablage.",
  },
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Accompagnement electrique a distance FabSystem",
  serviceType: "Accompagnement electrique a distance",
  description:
    "Service d'accompagnement a distance pour clarifier, structurer et verifier une installation electrique embarquee sur bateau, van ou camping-car.",
  url: "https://www.fabsystem.fr/prestations/accompagnement",
  provider: {
    "@type": "Organization",
    name: site.name,
    url: "https://www.fabsystem.fr",
    email: site.email,
    telephone: "+33698247722",
  },
};

export default async function AccompagnementPage({
  searchParams,
}: {
  searchParams: Promise<{ univers?: string | string[] }>;
}) {
  const { univers } = await searchParams;
  const initialCategory = resolvePrestationsCategorie(univers);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <OnFaitEnsemble initialCategory={initialCategory} />
      <Section tone="light" className="pt-0">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Parcours conseille
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950">
              Contenu, editeur, puis accompagnement sur votre vrai cas.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Si vous avez deja une base de schema, l&apos;accompagnement sert a la remettre au
              propre, a verifier les points sensibles et a arbitrer le materiel utile. Si vous
              partez de plus loin, les exemples de schemas et l&apos;editeur permettent d&apos;arriver
              au rendez-vous avec une base beaucoup plus claire.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button href="/schemas-electriques" variant="primary">
                Voir les schemas d&apos;exemple
              </Button>
              <Button href="/outils/schema" variant="secondary">
                Ouvrir l&apos;editeur
              </Button>
            </div>
          </article>

          <article className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Verifications utiles
            </p>
            <h2 className="mt-3 text-xl font-bold tracking-tight text-neutral-950">
              Les outils qui preparent bien un accompagnement a distance
            </h2>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
              <Button href="/outils/section-cable" variant="secondary">
                Section de cable
              </Button>
              <Button href="/outils/fusible" variant="secondary">
                Calibre fusible
              </Button>
              <Button href="/outils/mppt" variant="secondary">
                Calcul MPPT
              </Button>
              <Button href="/outils/bilan-consommation" variant="secondary">
                Bilan de consommation
              </Button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-neutral-700">
              Ces outils ne remplacent pas l&apos;analyse du projet, mais ils aident a cadrer les
              hypotheses avant l&apos;echange a distance.
            </p>
          </article>
        </div>
      </Section>
      <Confiance />
    </main>
  );
}
