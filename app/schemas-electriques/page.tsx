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
  SCHEMA_EXAMPLE_COUNT,
  SCHEMA_EXAMPLES,
  getSchemaEditorTemplateHref,
  getSchemaExampleAbsoluteUrl,
  getSchemaExampleHref,
  getSchemaExampleThumbnailAbsoluteUrl,
  type SchemaExample,
} from "@/lib/schema-examples";

const featuredExample =
  SCHEMA_EXAMPLES.find((example) => example.slug === FEATURED_SCHEMA_EXAMPLE_SLUG) ??
  SCHEMA_EXAMPLES[SCHEMA_EXAMPLES.length - 1];
const otherExamples = SCHEMA_EXAMPLES.filter((example) => example.slug !== featuredExample.slug);
const collectionDescription = `${SCHEMA_EXAMPLE_COUNT} exemples de schémas électriques 12V pour van, bateau et station électrique, avec explication, ouverture directe dans l'éditeur et impression PDF.`;

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Exemples de schémas électriques 12V",
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

export const metadata: Metadata = {
  title: "Exemples de schémas électriques 12V van, bateau, station",
  description: collectionDescription,
  alternates: {
    canonical: "/schemas-electriques",
  },
  openGraph: {
    title: "Exemples de schémas électriques 12V | FabSystem",
    description:
      "Des schémas commentés pour van, bateau et station électrique, à ouvrir dans l'éditeur ou à imprimer.",
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
};

function ExampleFlowBadges({ flow }: { flow: string[] }) {
  const previewSteps = flow.slice(0, 3);
  const remaining = Math.max(flow.length - previewSteps.length, 0);

  return (
    <div className="flex flex-wrap gap-2">
      {previewSteps.map((step) => (
        <span
          key={step}
          className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium text-neutral-600"
        >
          {step}
        </span>
      ))}
      {remaining > 0 ? (
        <span className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
          +{remaining} repères
        </span>
      ) : null}
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
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 22vw"
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

      <h2 className="mt-3 text-base font-bold tracking-tight text-neutral-950">
        <Link href={getSchemaExampleHref(example.slug)} className="hover:text-neutral-700">
          {example.title}
        </Link>
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-700">{example.description}</p>

      <div className="mt-3">
        <ExampleFlowBadges flow={example.flow} />
      </div>

      <p className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-xs leading-relaxed text-neutral-600">
        {example.highlights[0]}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button href={getSchemaExampleHref(example.slug)} variant="primary" className="h-9 min-h-9 px-3 text-xs">
          Voir la fiche
        </Button>
        <Link
          href={getSchemaEditorTemplateHref(example.templateId)}
          className="text-xs font-semibold text-neutral-700 underline underline-offset-4 hover:text-neutral-950"
        >
          Ouvrir dans l&apos;éditeur
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

      <PageIntro
        eyebrow="Exemples concrets"
        title="Exemples de schémas électriques 12V"
        description="Des fiches claires pour comprendre un montage, l'ouvrir directement dans l'éditeur, puis l'adapter à votre propre installation."
      />

      <Section tone="light" className="pb-8 pt-6 sm:pb-10">
        <div className="max-w-3xl">
          <p className="text-sm leading-relaxed text-neutral-700">
            Chaque page ci-dessous est pensée comme une vraie ressource : elle explique le rôle du
            schéma, ce qu&apos;il montre, ce qu&apos;il ne faut pas recopier aveuglément, puis vous
            laisse l&apos;ouvrir dans l&apos;éditeur FabSystem pour le modifier.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            Vous avez actuellement {SCHEMA_EXAMPLE_COUNT} bases différentes. Le repère AFERIY P280
            reste volontairement mis en avant, pendant que les autres architectures restent
            accessibles juste en dessous.
          </p>
        </div>
      </Section>

      <Section tone="muted" className="py-8 sm:py-10">
        <article className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
          <div className="grid gap-0 xl:grid-cols-[1.08fr_0.92fr]">
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap gap-2">
                <Badge tone="warning">Le plus récent</Badge>
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

              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 normal-case tracking-normal text-neutral-700">
                  {featuredExample.audience}
                </span>
                <span className="rounded-full bg-brand-100 px-2.5 py-1 normal-case tracking-normal text-brand-700">
                  {featuredExample.level}
                </span>
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

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {otherExamples.map((example) => (
            <ExampleCard key={example.slug} example={example} />
          ))}
        </div>
      </Section>

      <Section tone="light" className="pt-0">
        <SchemaExamplesHelpCta contextLabel="exemple de schéma électrique" />
      </Section>
    </main>
  );
}
