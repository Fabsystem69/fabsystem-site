import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCustomerSessionFromCookieOrAnonymous } from "@/lib/server/customer-session";
import { PageIntro } from "@/components/public/PageIntro";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SchemaEditorRuntime } from "@/components/schema-editor/SchemaEditorRuntime";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";
import { SchemaExportPreview } from "@/components/public/SchemaExportPreview";
import { PlansComparisonTable } from "@/components/public/PlansComparisonTable";

type SchemaEditorPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const EDITOR_TRIGGER_KEYS = ["template", "projectId", "editor", "coaching", "unlock"] as const;
const EDITOR_PATH = "/outils/schema/editeur";

function hasActiveEditorIntent(searchParams: Record<string, string | string[] | undefined>) {
  return EDITOR_TRIGGER_KEYS.some((key) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value.length > 0 : typeof value === "string" && value.length > 0;
  });
}

const description =
  "Éditeur de schéma électrique pour bateau, van et camping-car : préparez votre architecture 12 V ou 230 V, adaptez un exemple, vérifiez vos sous-ensembles et exportez votre base de travail.";

const faqItems = [
  {
    question: "À qui sert cet éditeur de schéma électrique ?",
    answer:
      "Il aide à préparer ou clarifier une installation électrique embarquée sur bateau, van ou camping-car. Il est utile pour visualiser l'architecture, organiser les sous-ensembles et préparer les vérifications avant câblage.",
  },
  {
    question: "Puis-je partir d'un exemple plutôt que d'une feuille blanche ?",
    answer:
      "Oui. La galerie des schémas électriques propose plusieurs bases à ouvrir directement dans l'éditeur pour repartir d'un van, d'un bateau, d'un camping-car ou d'une station tout-en-un déjà structurée.",
  },
  {
    question: "L'éditeur remplace-t-il une validation électrique professionnelle ?",
    answer:
      "Non. Il sert à préparer, expliquer et vérifier une logique de schéma, mais il ne remplace ni le contrôle des longueurs réelles, ni le dimensionnement final, ni la validation électrique adaptée à votre matériel et à votre usage.",
  },
  {
    question: "Quels outils compléter avec l'éditeur ?",
    answer:
      "Les calculateurs de section de câble, de fusible, de MPPT et de bilan de consommation servent à vérifier les points critiques du schéma avant impression ou réalisation.",
  },
];

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Éditeur de schémas électriques FabSystem",
  url: "https://www.fabsystem.fr/outils/schema",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  browserRequirements: "Navigateur web moderne avec JavaScript active",
  inLanguage: "fr-FR",
  description,
  publisher: {
    "@type": "Organization",
    name: "FabSystem",
    url: "https://www.fabsystem.fr",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.fabsystem.fr" },
    { "@type": "ListItem", position: 2, name: "Outils", item: "https://www.fabsystem.fr/outils" },
    {
      "@type": "ListItem",
      position: 3,
      name: "Éditeur de schémas électriques",
      item: "https://www.fabsystem.fr/outils/schema",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export async function generateMetadata({
  searchParams,
}: SchemaEditorPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const editorMode = hasActiveEditorIntent(resolvedSearchParams);

  return {
    title: "Éditeur de schéma électrique bateau, van et camping-car",
    description,
    alternates: { canonical: "/outils/schema" },
    openGraph: {
      title: "Éditeur de schéma électrique | FabSystem",
      description,
      url: "https://www.fabsystem.fr/outils/schema",
      images: [
        {
          url: "/outils/schema.webp",
          width: 1600,
          height: 1195,
          alt: "Éditeur de schéma électrique FabSystem",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Éditeur de schéma électrique | FabSystem",
      description,
      images: ["/outils/schema.webp"],
    },
    robots: editorMode
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}

function LandingPage() {
  return (
    <main className="bg-white text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PageIntro
        eyebrow="Outil FabSystem"
        title="Éditeur de schéma électrique pour bateau, van et camping-car"
        description="Une base de travail claire pour préparer votre architecture électrique, partir d'un exemple, organiser vos sous-ensembles et vérifier les points sensibles avant câblage."
      />

      <Section tone="light" className="pb-8 pt-6 sm:pb-10">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
            <div className="flex flex-wrap gap-2">
              <Badge tone="info">Bateau</Badge>
              <Badge tone="info">Van</Badge>
              <Badge tone="info">Camping-car</Badge>
            </div>

            <h2 className="mt-4 text-2xl font-bold tracking-tight text-neutral-950">
              Ouvrez l&apos;éditeur, ou partez d&apos;un schéma déjà structuré.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-700">
              L&apos;éditeur sert à poser une architecture lisible : chaîne solaire, recharge
              alternateur, distribution 12 V, 230 V, supervision et protections. Vous pouvez
              partir d&apos;un schéma vierge ou d&apos;un exemple adapté à un van lithium, un bateau
              au quai, un voilier autonome, un camping-car ou une station tout-en-un.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button href={EDITOR_PATH} variant="primary">
                Ouvrir l&apos;éditeur
              </Button>
              <PwaInstallButton className="inline-flex h-10 min-h-10 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100" />
              <Button href="/schemas-electriques" variant="secondary">
                Voir les schémas d&apos;exemple
              </Button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-neutral-500">L&apos;installation ajoute l&apos;éditeur à votre bureau Windows ou Mac. Aucun fichier à télécharger ni compte supplémentaire.</p>
            <p className="mt-2 text-xs leading-relaxed text-neutral-500">
              Gratuit pour démarrer.{" "}
              <Link href="/mon-compte/editeur" className="font-semibold text-amber-700 hover:underline">
                Éditeur Plus
              </Link>{" "}
              ajoute le dimensionnement automatique et les alertes détaillées quand vous en avez besoin.
            </p>
          </div>

          <aside className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white p-2">
            <SchemaExportPreview />
          </aside>
        </div>
      </Section>

      <Section tone="dark" className="py-8 sm:py-10">
        <div className="overflow-hidden rounded-[28px] bg-neutral-950 px-6 py-8 sm:px-10 sm:py-10">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
              Éditeur Plus
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Le dimensionnement automatique et les alertes détaillées, quand votre projet grandit
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-300">
              L&apos;éditeur reste gratuit pour démarrer, composants et câblage inclus. Éditeur
              Plus ajoute le calcul automatique de section de câble et de calibre de fusible, et
              lève la limite de 1 projet / 3 consommateurs.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/mon-compte/editeur"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-base hover:bg-white/10"
              >
                6,90 € / mois
              </Link>
              <Link
                href="/mon-compte/editeur"
                className="rounded-xl border border-amber-400 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-300 transition-base hover:bg-amber-500/20"
              >
                59 € / an <span className="font-normal text-neutral-400">(4,92 € / mois)</span>
              </Link>
              <Button href="/mon-compte/editeur" variant="primary">
                Voir Éditeur Plus →
              </Button>
            </div>
          </div>

          <div className="mt-8">
            <PlansComparisonTable />
          </div>
        </div>
      </Section>

      <Section tone="light" className="py-8 sm:py-10">
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="text-xl font-bold tracking-tight text-neutral-950">Bénéfices</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-800">
              <li>Clarifier rapidement une installation avant achat, refit ou correction.</li>
              <li>Passer d&apos;un exemple concret à votre propre configuration.</li>
              <li>Centraliser schéma, variantes et impression dans un même outil de travail.</li>
            </ul>
          </article>

          <article className="rounded-[28px] border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-xl font-bold tracking-tight text-neutral-950">Limites à garder en tête</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-800">
              <li>Un schéma lisible ne remplace jamais le relevé des longueurs réelles et des intensités.</li>
              <li>Les sections, fusibles, protections AC et détails constructeur doivent être revérifiés.</li>
              <li>La validation finale de l&apos;installation reste une étape technique distincte.</li>
            </ul>
          </article>
        </div>
      </Section>

      <Section tone="muted" className="py-8 sm:py-10">
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Exemples à adapter
            </p>
            <h2 className="mt-3 text-xl font-bold tracking-tight text-neutral-950">
              Repartir d&apos;un cas déjà structuré
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              La galerie regroupe des architectures utiles pour un van lithium 280 Ah, un bateau au
              quai, un voilier autonome, un camping-car plus dense ou une station AFERIY P280.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button href="/schemas-electriques" variant="primary">
                Explorer les schémas
              </Button>
              <Button href="/schemas-electriques/schema-vito-280ah-van" variant="secondary">
                Voir le van 280 Ah
              </Button>
            </div>
          </article>

          <article className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Vérifications utiles
            </p>
            <h2 className="mt-3 text-xl font-bold tracking-tight text-neutral-950">
              Compléter l&apos;éditeur avec les calculateurs
            </h2>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
              <Link href="/outils/section-cable" className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-700 hover:bg-neutral-100">
                Section de câble
              </Link>
              <Link href="/outils/fusible" className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-700 hover:bg-neutral-100">
                Calibre fusible
              </Link>
              <Link href="/outils/mppt" className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-700 hover:bg-neutral-100">
                MPPT
              </Link>
              <Link href="/outils/bilan-consommation" className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-700 hover:bg-neutral-100">
                Bilan de consommation
              </Link>
            </div>
          </article>
        </div>
      </Section>

      <Section tone="light" className="py-8 sm:py-10">
        <div className="max-w-4xl">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
            Questions fréquentes sur l&apos;éditeur de schémas
          </h2>
          <div className="mt-6 space-y-4">
            {faqItems.map((item) => (
              <article
                key={item.question}
                className="rounded-[24px] border border-neutral-200 bg-neutral-50 p-5"
              >
                <h3 className="text-base font-bold text-neutral-950">{item.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="dark" className="py-8 sm:py-10">
        <div className="rounded-[28px] border border-white/10 bg-neutral-900 px-6 py-8">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Besoin d&apos;aller plus loin qu&apos;un schéma d&apos;intention ?
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-300">
            L&apos;éditeur aide à préparer et clarifier. Quand il faut vérifier une architecture, un
            choix de matériel, un point de norme ou une logique de protection, l&apos;accompagnement
            à distance prend le relais.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button href={EDITOR_PATH} variant="primary">
              Utiliser l&apos;éditeur
            </Button>
            <Button href="/prestations/accompagnement" variant="secondary">
              Voir l&apos;accompagnement à distance
            </Button>
          </div>
        </div>
      </Section>
    </main>
  );
}

export default async function SchemaPage({ searchParams }: SchemaEditorPageProps) {
  const resolvedSearchParams = await searchParams;

  if (hasActiveEditorIntent(resolvedSearchParams)) {
    return <SchemaEditorRuntime />;
  }

  // Retour utilisateur : "si il est inscrit et logué, appuyer sur le
  // bouton envoie direct jusqu'à l'accueil de l'éditeur" — un client déjà
  // identifié n'a plus besoin de la page marketing, seul un visiteur
  // anonyme y atterrit. Variante "OrAnonymous" (jamais requireCustomerActor
  // ici) : une panne de résolution de session ne doit jamais faire planter
  // cette page publique, juste dégrader vers l'affichage anonyme.
  const session = await getCustomerSessionFromCookieOrAnonymous();
  if (session) {
    redirect(EDITOR_PATH);
  }

  return <LandingPage />;
}
