import type { Metadata } from "next";
import { OnFaitEnsemble } from "@/components/services/OnFaitEnsemble";
import { Confiance } from "@/components/home/Confiance";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { site } from "@/lib/site";

// UI-10 §4 — page dédiée à l'accompagnement, extraite de /prestations
// (devenue une simple page d'orientation). Pas de PageIntro séparé :
// OnFaitEnsemble porte déjà son propre eyebrow + h1 + description en tête
// de page, un second bloc d'intro aurait dupliqué le même message.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accompagnement électrique à distance bateau, van, camping-car",
  description:
    "Accompagnement électrique à distance pour bateau, van et camping-car : conception, vérification de schéma, choix de matériel et aide à la mise au propre de votre installation embarquée.",
  alternates: {
    canonical: "/prestations/accompagnement",
  },
  openGraph: {
    title: "Accompagnement électrique à distance | FabSystem",
    description:
      "Un accompagnement à distance pour clarifier un schéma électrique de bateau, van ou camping-car, choisir le matériel utile et préparer une installation plus fiable.",
    url: "https://www.fabsystem.fr/prestations/accompagnement",
    images: [
      {
        url: "/hero-fabsystem.png",
        width: 1200,
        height: 630,
        alt: "FabSystem - Accompagnement électrique à distance",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Accompagnement électrique à distance | FabSystem",
    description:
      "FabSystem accompagne à distance les projets électriques bateau, van et camping-car, du schéma aux vérifications utiles avant câblage.",
    images: ["/hero-fabsystem.png"],
  },
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Accompagnement électrique à distance FabSystem",
  serviceType: "Accompagnement électrique à distance",
  description:
    "Service d'accompagnement à distance pour clarifier, structurer et vérifier une installation électrique embarquée sur bateau, van ou camping-car.",
  url: "https://www.fabsystem.fr/prestations/accompagnement",
  provider: {
    "@type": "Organization",
    name: site.name,
    url: "https://www.fabsystem.fr",
    email: site.email,
    telephone: "+33698247722",
  },
};

export default function AccompagnementPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <OnFaitEnsemble />
      <Section tone="light" className="pt-0">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Parcours conseille
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950">
              Contenu, éditeur, puis accompagnement sur votre vrai cas.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              Si vous avez déjà une base de schéma, l&apos;accompagnement sert à la remettre au
              propre, à vérifier les points sensibles et à arbitrer le matériel utile. Si vous
              partez de plus loin, les exemples de schémas et l&apos;éditeur permettent d&apos;arriver
              au rendez-vous avec une base beaucoup plus claire.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button href="/schemas-electriques" variant="primary">
                Voir les schémas d&apos;exemple
              </Button>
              <Button href="/outils/schema" variant="secondary">
                Ouvrir l&apos;éditeur
              </Button>
            </div>
          </article>

          <article className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Vérifications utiles
            </p>
            <h2 className="mt-3 text-xl font-bold tracking-tight text-neutral-950">
              Les outils qui préparent bien un accompagnement à distance
            </h2>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
              <Button href="/outils/section-cable" variant="secondary">
                Section de câble
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
              Ces outils ne remplacent pas l&apos;analyse du projet, mais ils aident à cadrer les
              hypothèses avant l&apos;échange à distance.
            </p>
          </article>
        </div>
      </Section>
      <Confiance />
    </main>
  );
}
