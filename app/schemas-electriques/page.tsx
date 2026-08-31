import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { Section } from "@/components/layout/Section";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SchemaExamplesHelpCta } from "@/components/schema-examples/SchemaExamplesHelpCta";
import {
  FEATURED_SCHEMA_EXAMPLE_SLUG,
  SCHEMA_EXAMPLES,
  getSchemaEditorTemplateHref,
  getSchemaExampleAbsoluteUrl,
  getSchemaExampleHref,
  getSchemaExampleThumbnailAbsoluteUrl,
  type SchemaExample,
} from "@/lib/schema-examples-data";

const featuredExample =
  SCHEMA_EXAMPLES.find((example) => example.slug === FEATURED_SCHEMA_EXAMPLE_SLUG) ??
  SCHEMA_EXAMPLES[SCHEMA_EXAMPLES.length - 1];

const collectionDescription = `${SCHEMA_EXAMPLES.length} exemples de schemas electriques pour van, bateau, camping-car et atelier mobile, avec ouverture directe dans l'editeur FabSystem, impression PDF et explications claires avant adaptation.`;

const familyOrder = ["van", "bateau", "camping-car", "atelier"] as const;

const familyConfig: Record<
  (typeof familyOrder)[number],
  { title: string; intro: string; anchor: string; editorLabel: string }
> = {
  van: {
    title: "Vans et fourgons aménagés",
    intro:
      "Pour choisir entre une base très simple, une station tout-en-un ou une architecture lithium plus complète avec 230 V.",
    anchor: "van-fourgon",
    editorLabel: "Ouvrir un gabarit van",
  },
  bateau: {
    title: "Bateaux et voiliers",
    intro:
      "Pour distinguer un montage surtout au quai d'une vraie architecture autonome avec plusieurs sources de charge et distribution complète.",
    anchor: "bateau-voilier",
    editorLabel: "Ouvrir un gabarit bateau",
  },
  "camping-car": {
    title: "Camping-cars et gros besoins",
    intro:
      "Pour les projets avec plus d'autonomie, plusieurs charges et des départs puissants comme une climatisation 12 V.",
    anchor: "camping-car",
    editorLabel: "Ouvrir un gabarit camping-car",
  },
  atelier: {
    title: "Ateliers mobiles et implantation",
    intro:
      "Pour travailler la lecture terrain, les zones techniques et une organisation plus proche de l'implantation réelle.",
    anchor: "atelier-mobile",
    editorLabel: "Ouvrir un gabarit atelier",
  },
};

const groupedExamples = familyOrder.map((family) => ({
  family,
  ...familyConfig[family],
  examples: SCHEMA_EXAMPLES.filter((example) => example.family === family),
}));

const utilityLinks = [
  {
    href: "/outils/schema",
    title: "Éditeur de schémas électriques",
    description:
      "Ouvrez un gabarit, remplacez les composants, ajustez les protections puis exportez votre propre version.",
  },
  {
    href: "/outils/section-cable",
    title: "Calcul de section de câble",
    description:
      "Vérifiez les sections en fonction du courant, de la longueur et de la chute de tension visée.",
  },
  {
    href: "/outils/fusible",
    title: "Calcul du fusible",
    description:
      "Recoupez le calibre des protections avant de reprendre un exemple ou de finaliser un montage.",
  },
  {
    href: "/outils/mppt",
    title: "Choix panneau solaire / MPPT",
    description:
      "Validez le couple panneau-régulateur avant d'adapter un schéma solaire ou un van autonome.",
  },
  {
    href: "/outils/bilan-consommation",
    title: "Bilan de consommation",
    description:
      "Estimez autonomie, puissance utile et capacité batterie avant de choisir un exemple trop simple ou trop gros.",
  },
];

const collectionFaq = [
  {
    question: "Quel schéma choisir pour un van aménagé avec batterie lithium ?",
    answer:
      "Le plus polyvalent de la sélection est le Vito 280 Ah, car il montre ensemble le solaire, le DC-DC, la distribution 12 V, le 230 V et la supervision. Si vous cherchez plus simple, commencez par le schéma solaire 12 V simple ou par la version AFERIY P280.",
  },
  {
    question: "Puis-je ouvrir un exemple dans l'éditeur et le modifier ?",
    answer:
      "Oui. Chaque exemple propose un accès direct à l'éditeur FabSystem pour repartir du gabarit et l'adapter à votre matériel, vos consommateurs et vos longueurs de câble.",
  },
  {
    question: "Ces schémas remplacent-ils une validation électrique professionnelle ?",
    answer:
      "Non. Ils servent de base de compréhension, de comparaison et de préparation. Les sections, protections, longueurs et règles de câblage doivent toujours être revérifiées selon votre installation réelle.",
  },
  {
    question: "Quelle différence entre un schéma de principe et un schéma d'implantation ?",
    answer:
      "Un schéma de principe aide à comprendre la logique électrique entre sources, protections et consommateurs. Un schéma d'implantation sert davantage à préparer les zones réelles, les passages et les distances dans le véhicule ou le bateau.",
  },
];

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Exemples de schémas électriques van, bateau et camping-car",
  url: "https://www.fabsystem.fr/schemas-electriques",
  description: collectionDescription,
  mainEntity: {
    "@type": "ItemList",
    itemListElement: SCHEMA_EXAMPLES.map((example, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: example.title,
      url: getSchemaExampleAbsoluteUrl(example.slug),
    })),
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.fabsystem.fr" },
    {
      "@type": "ListItem",
      position: 2,
      name: "Exemples de schémas électriques",
      item: "https://www.fabsystem.fr/schemas-electriques",
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: collectionFaq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export const metadata: Metadata = {
  title:
    "Exemples de schémas électriques van, bateau et camping-car | FabSystem",
  description: collectionDescription,
  alternates: {
    canonical: "/schemas-electriques",
  },
  openGraph: {
    title: "Exemples de schémas électriques van, bateau et camping-car | FabSystem",
    description:
      "Comparez des schémas électriques concrets, ouvrez-les dans l'éditeur FabSystem et partez d'une base plus claire pour votre van, bateau ou camping-car.",
    url: "https://www.fabsystem.fr/schemas-electriques",
    images: featuredExample
      ? [
          {
            url: getSchemaExampleThumbnailAbsoluteUrl(featuredExample.slug) ?? "",
            width: 1200,
            height: 896,
            alt: featuredExample.thumbnailAlt,
          },
        ]
      : undefined,
  },
  twitter: {
    card: "summary_large_image",
    title: "Exemples de schémas électriques van, bateau et camping-car",
    description:
      "Des exemples commentés à comparer, ouvrir dans l'éditeur et adapter à votre propre installation.",
    images: featuredExample ? [featuredExample.thumbnailSrc] : undefined,
  },
};

function ExampleFlowBadges({ flow }: { flow: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {flow.slice(0, 4).map((step) => (
        <span
          key={step}
          className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-600"
        >
          {step}
        </span>
      ))}
    </div>
  );
}

function ExampleQuickTags({ tags }: { tags: string[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function ExampleCard({ example }: { example: SchemaExample }) {
  return (
    <article className="group rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-neutral-300">
      <Link href={getSchemaExampleHref(example.slug)} className="block">
        <div className="relative aspect-[75/56] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
          <Image
            src={example.thumbnailSrc}
            alt={example.thumbnailAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 30vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      </Link>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 normal-case tracking-normal text-neutral-700">
          {example.audience}
        </span>
        <span className="rounded-full bg-brand-100 px-2.5 py-1 normal-case tracking-normal text-brand-700">
          {example.level}
        </span>
      </div>

      <h2 className="mt-3 text-lg font-bold tracking-tight text-neutral-950">
        <Link href={getSchemaExampleHref(example.slug)} className="hover:text-neutral-700">
          {example.title}
        </Link>
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-700">{example.description}</p>

      <p className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-700">
        <span className="font-semibold text-neutral-950">Idéal si :</span> {example.bestFor}
      </p>

      <ExampleQuickTags tags={example.quickTags} />

      <div className="mt-3">
        <ExampleFlowBadges flow={example.flow} />
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button href={getSchemaExampleHref(example.slug)} variant="primary" className="px-3 text-xs">
          Voir le schéma expliqué
        </Button>
        <Link
          href={getSchemaEditorTemplateHref(example.templateId)}
          className="text-xs font-semibold text-neutral-700 underline underline-offset-4 hover:text-neutral-950"
        >
          Modifier dans l&apos;éditeur
        </Link>
      </div>
    </article>
  );
}

export default function SchemasElectriquesPage() {
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PageIntro
        eyebrow="Exemples concrets"
        title="Exemples de schémas électriques pour van, bateau et camping-car"
        description="Comparez plusieurs architectures 12 V et 230 V, comprenez ce qu'elles montrent, puis ouvrez l'exemple le plus proche de votre projet dans l'éditeur FabSystem."
      />

      <Section tone="light" className="pb-8 pt-6 sm:pb-10">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-3xl">
            <p className="text-sm leading-relaxed text-neutral-700">
              Cette page sert de point d&apos;entrée avant l&apos;éditeur. Vous y trouvez des
              exemples de schémas électriques pour van, bateau, voilier, camping-car et atelier
              mobile, avec assez de contexte pour éviter de partir d&apos;une base trop simple ou
              trop éloignée de votre vrai besoin.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              Le plus polyvalent aujourd&apos;hui reste le <strong>Vito Marco Polo 280 Ah</strong> :
              il montre ensemble solaire, recharge alternateur, distribution 12 V, 230 V embarqué
              et supervision. Les autres fiches servent ensuite à comparer une architecture plus
              simple, un bateau au quai, un voilier autonome, un camping-car plus chargé ou une
              implantation d&apos;atelier mobile.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button href={getSchemaExampleHref(featuredExample.slug)} variant="primary">
                Commencer par le Vito 280 Ah
              </Button>
              <Button href="/outils/schema" variant="secondary">
                Ouvrir directement l&apos;éditeur
              </Button>
            </div>
          </div>

          <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Choix rapide
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-neutral-950">
              Trouver le bon schéma en moins d&apos;une minute
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {groupedExamples.map((group) => (
                <Link
                  key={group.family}
                  href={`#${group.anchor}`}
                  className="rounded-2xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
                >
                  <p className="text-sm font-semibold text-neutral-950">{group.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-neutral-600">{group.intro}</p>
                  <p className="mt-3 text-xs font-semibold text-brand-700">
                    {group.examples.length} exemple{group.examples.length > 1 ? "s" : ""} →
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section tone="muted" className="py-8 sm:py-10">
        <article className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
          <div className="grid gap-0 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap gap-2">
                <Badge tone="warning">Sélection FabSystem</Badge>
                <Badge tone="info">Schéma vedette</Badge>
              </div>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-neutral-950">
                <Link
                  href={getSchemaExampleHref(featuredExample.slug)}
                  className="hover:text-neutral-700"
                >
                  {featuredExample.title}
                </Link>
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-700">
                {featuredExample.description}
              </p>

              <ExampleQuickTags tags={featuredExample.quickTags} />

              <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700">
                <span className="font-semibold text-neutral-950">Pourquoi commencer ici :</span>{" "}
                c&apos;est la meilleure base si vous voulez comprendre une architecture complète
                sans partir d&apos;un schéma trop abstrait. Il aide à relier les vrais blocs d&apos;un
                projet sérieux : production, recharge, batterie, distribution, supervision et 230 V.
              </div>

              <div className="mt-4">
                <ExampleFlowBadges flow={featuredExample.flow} />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {featuredExample.highlights.slice(0, 2).map((item) => (
                  <p
                    key={item}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-relaxed text-neutral-700"
                  >
                    {item}
                  </p>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button href={getSchemaExampleHref(featuredExample.slug)} variant="primary">
                  Voir la fiche détaillée
                </Button>
                <Button
                  href={getSchemaEditorTemplateHref(featuredExample.templateId)}
                  variant="secondary"
                >
                  Ouvrir dans l&apos;éditeur
                </Button>
              </div>
            </div>

            <div className="border-t border-neutral-200 bg-neutral-50 p-4 sm:p-5 xl:border-l xl:border-t-0">
              <div className="relative aspect-[75/56] overflow-hidden rounded-[24px] border border-neutral-200 bg-white">
                <Image
                  src={featuredExample.thumbnailSrc}
                  alt={featuredExample.thumbnailAlt}
                  fill
                  sizes="(max-width: 1280px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </article>
      </Section>

      <Section tone="light" className="py-8 sm:py-10">
        <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Avant de choisir
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
            Comment utiliser utilement ces schémas
          </h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="text-sm font-semibold text-neutral-950">1. Trouver le cas le plus proche</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Choisissez d&apos;abord par usage réel : van simple, bateau au quai, voilier autonome,
                camping-car avec gros besoin, ou implantation plus terrain.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="text-sm font-semibold text-neutral-950">2. Comprendre la logique avant de copier</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Regardez les sources de charge, la batterie, les protections et la distribution.
                Un bon exemple sert à lire un système, pas à recopier des valeurs sans contrôle.
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <p className="text-sm font-semibold text-neutral-950">3. Adapter ensuite dans l&apos;éditeur</p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Ouvrez l&apos;exemple, remplacez le matériel, revérifiez les sections, les fusibles et
                les longueurs, puis exportez votre version.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {groupedExamples.map((group) => (
        <Section key={group.family} tone="light" className="py-8 sm:py-10" id={group.anchor}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Sélection ciblée
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
                {group.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">{group.intro}</p>
            </div>
            <Button
              href={getSchemaEditorTemplateHref(group.examples[0].templateId)}
              variant="secondary"
              className="shrink-0"
            >
              {group.editorLabel}
            </Button>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-3">
            {group.examples.map((example) => (
              <ExampleCard key={example.slug} example={example} />
            ))}
          </div>
        </Section>
      ))}

      <Section tone="muted" className="py-8 sm:py-10">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Outils liés
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
              Aller plus loin après le choix du schéma
            </h2>
            <div className="mt-5 grid gap-3">
              {utilityLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition-colors hover:border-neutral-300 hover:bg-white"
                >
                  <p className="text-sm font-semibold text-neutral-950">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Questions fréquentes
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950">
              FAQ avant d&apos;ouvrir l&apos;éditeur
            </h2>
            <div className="mt-5 space-y-3">
              {collectionFaq.map((item) => (
                <div key={item.question} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <h3 className="text-sm font-semibold text-neutral-950">{item.question}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{item.answer}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </Section>

      <Section tone="light" className="pt-0">
        <div className="grid gap-4 pb-8 sm:grid-cols-2 sm:pb-10">
          <div className="rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Passer à l&apos;action
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-neutral-950">
              Vous avez trouvé une base proche ?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              Ouvrez ensuite l&apos;éditeur pour partir d&apos;un gabarit, ajuster les composants et
              préparer votre propre version de travail.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button href="/outils/schema" variant="primary">
                Ouvrir l&apos;éditeur
              </Button>
              <Button href={getSchemaExampleHref(featuredExample.slug)} variant="secondary">
                Revoir le schéma vedette
              </Button>
            </div>
          </div>

          <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Besoin d&apos;aide
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-neutral-950">
              Vous hésitez entre plusieurs architectures ?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              Si aucun exemple ne colle vraiment, l&apos;accompagnement à distance permet de repartir
              sur une base plus adaptée à votre bateau, van ou camping-car, sans présenter le schéma
              comme une validation finale à lui seul.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button href="/prestations/accompagnement" variant="primary">
                Voir l&apos;accompagnement
              </Button>
              <Button href="/outils/bilan-consommation" variant="secondary">
                Commencer par le bilan conso
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="light" className="pt-0">
        <SchemaExamplesHelpCta contextLabel="choix d'un schéma électrique van, bateau ou camping-car" />
      </Section>
    </main>
  );
}
