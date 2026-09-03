import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/public/PageIntro";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SchemaEditorRuntime } from "@/components/schema-editor/SchemaEditorRuntime";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";

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
  "Editeur de schema electrique pour bateau, van et camping-car: preparez votre architecture 12 V ou 230 V, adaptez un exemple, verifiez vos sous-ensembles et exportez votre base de travail.";

const faqItems = [
  {
    question: "A qui sert cet editeur de schema electrique ?",
    answer:
      "Il aide a preparer ou clarifier une installation electrique embarquee sur bateau, van ou camping-car. Il est utile pour visualiser l'architecture, organiser les sous-ensembles et preparer les verifications avant cablage.",
  },
  {
    question: "Puis-je partir d'un exemple plutot que d'une feuille blanche ?",
    answer:
      "Oui. La galerie des schemas electriques propose plusieurs bases a ouvrir directement dans l'editeur pour repartir d'un van, d'un bateau, d'un camping-car ou d'une station tout-en-un deja structures.",
  },
  {
    question: "L'editeur remplace-t-il une validation electrique professionnelle ?",
    answer:
      "Non. Il sert a preparer, expliquer et verifier une logique de schema, mais il ne remplace ni le controle des longueurs reelles, ni le dimensionnement final, ni la validation electrique adaptee a votre materiel et a votre usage.",
  },
  {
    question: "Quels outils completer avec l'editeur ?",
    answer:
      "Les calculateurs de section de cable, de fusible, de MPPT et de bilan de consommation servent a verifier les points critiques du schema avant impression ou realisation.",
  },
];

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Editeur de schemas electriques FabSystem",
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
      name: "Editeur de schemas electriques",
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
    title: "Editeur de schema electrique bateau, van et camping-car",
    description,
    alternates: { canonical: "/outils/schema" },
    openGraph: {
      title: "Editeur de schema electrique | FabSystem",
      description,
      url: "https://www.fabsystem.fr/outils/schema",
      images: [
        {
          url: "/outils/schema.webp",
          width: 1600,
          height: 1195,
          alt: "Editeur de schema electrique FabSystem",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Editeur de schema electrique | FabSystem",
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
        title="Editeur de schema electrique pour bateau, van et camping-car"
        description="Une base de travail claire pour preparer votre architecture electrique, partir d'un exemple, organiser vos sous-ensembles et verifier les points sensibles avant cablage."
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
              Ouvrez l&apos;editeur, ou partez d&apos;un schema deja structure.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-700">
              L&apos;editeur sert a poser une architecture lisible: chaine solaire, recharge
              alternateur, distribution 12 V, 230 V, supervision et protections. Vous pouvez
              partir d&apos;un schema vierge ou d&apos;un exemple adapte a un van lithium, un bateau
              au quai, un voilier autonome, un camping-car ou une station tout-en-un.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button href={EDITOR_PATH} variant="primary">
                Ouvrir l&apos;editeur
              </Button>
              <PwaInstallButton className="inline-flex h-10 min-h-10 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100" />
              <Button href="/schemas-electriques" variant="secondary">
                Voir les schemas d&apos;exemple
              </Button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-neutral-500">L&apos;installation ajoute l&apos;éditeur à votre bureau Windows ou Mac. Aucun fichier à télécharger ni compte supplémentaire.</p>
          </div>

          <aside className="rounded-[28px] border border-neutral-200 bg-white p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Ce que l&apos;outil aide a faire
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-700">
              <li className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                Organiser les zones techniques et les liaisons principales avant de cabler.
              </li>
              <li className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                Adapter un schema a votre materiel plutot que recopier un montage au hasard.
              </li>
              <li className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                Preparer ensuite les verifications de section, de fusible, de MPPT et de bilan de consommation.
              </li>
            </ul>
          </aside>
        </div>
      </Section>

      <Section tone="muted" className="py-8 sm:py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Bateau",
              text: "Repartir d'un schema de quai, d'un voilier autonome ou d'un refit plus dense pour clarifier le bord avant modification.",
            },
            {
              title: "Van",
              text: "Poser proprement une batterie service, un MPPT, un DC-DC, un MultiPlus ou une station tout-en-un sans perdre la lecture generale.",
            },
            {
              title: "Camping-car",
              text: "Structurer les gros sous-ensembles, la distribution et les usages plus gourmands comme un depart climatisation 12 V.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-bold tracking-tight text-neutral-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">{item.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="light" className="py-8 sm:py-10">
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <article className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="text-xl font-bold tracking-tight text-neutral-950">Benefices</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-800">
              <li>Clarifier rapidement une installation avant achat, refit ou correction.</li>
              <li>Passer d&apos;un exemple concret a votre propre configuration.</li>
              <li>Centraliser schema, variantes et impression dans un meme outil de travail.</li>
            </ul>
          </article>

          <article className="rounded-[28px] border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-xl font-bold tracking-tight text-neutral-950">Limites a garder en tete</h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-800">
              <li>Un schema lisible ne remplace jamais le releve des longueurs reelles et des intensites.</li>
              <li>Les sections, fusibles, protections AC et details constructeur doivent etre reverifies.</li>
              <li>La validation finale de l&apos;installation reste une etape technique distincte.</li>
            </ul>
          </article>
        </div>
      </Section>

      <Section tone="muted" className="py-8 sm:py-10">
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Exemples a adapter
            </p>
            <h2 className="mt-3 text-xl font-bold tracking-tight text-neutral-950">
              Repartir d&apos;un cas deja structure
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              La galerie regroupe des architectures utiles pour un van lithium 280 Ah, un bateau au
              quai, un voilier autonome, un camping-car plus dense ou une station AFERIY P280.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button href="/schemas-electriques" variant="primary">
                Explorer les schemas
              </Button>
              <Button href="/schemas-electriques/schema-vito-280ah-van" variant="secondary">
                Voir le van 280 Ah
              </Button>
            </div>
          </article>

          <article className="rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Verifications utiles
            </p>
            <h2 className="mt-3 text-xl font-bold tracking-tight text-neutral-950">
              Completer l&apos;editeur avec les calculateurs
            </h2>
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
              <Link href="/outils/section-cable" className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-700 hover:bg-neutral-100">
                Section de cable
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
            Questions frequentes sur l&apos;editeur de schemas
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
            Besoin d&apos;aller plus loin qu&apos;un schema d&apos;intention ?
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-neutral-300">
            L&apos;editeur aide a preparer et clarifier. Quand il faut verifier une architecture, un
            choix de materiel, un point de norme ou une logique de protection, l&apos;accompagnement
            a distance prend le relais.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button href={EDITOR_PATH} variant="primary">
              Utiliser l&apos;editeur
            </Button>
            <Button href="/prestations/accompagnement" variant="secondary">
              Voir l&apos;accompagnement a distance
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

  return <LandingPage />;
}
