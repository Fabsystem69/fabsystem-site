import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";
import { PageIntro } from "@/components/public/PageIntro";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { PrintExampleButton } from "@/components/schema-examples/PrintExampleButton";
import { SchemaExamplesHelpCta } from "@/components/schema-examples/SchemaExamplesHelpCta";
import {
  SCHEMA_EXAMPLE_SLUGS,
  getSchemaEditorTemplateHref,
  getSchemaExampleAbsoluteUrl,
  getSchemaExampleBySlug,
  getSchemaExampleHref,
  getSchemaExampleTemplate,
  getSchemaExampleThumbnailAbsoluteUrl,
} from "@/lib/schema-examples";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  return SCHEMA_EXAMPLE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const example = getSchemaExampleBySlug(slug);
  if (!example) {
    return {};
  }

  return {
    title: example.metaTitle,
    description: example.metaDescription,
    alternates: {
      canonical: getSchemaExampleHref(example.slug),
    },
    openGraph: {
      title: example.metaTitle,
      description: example.metaDescription,
      url: getSchemaExampleAbsoluteUrl(example.slug),
      images: getSchemaExampleThumbnailAbsoluteUrl(example.slug)
        ? [
            {
              url: getSchemaExampleThumbnailAbsoluteUrl(example.slug) ?? "",
              width: 1200,
              height: 896,
              alt: example.thumbnailAlt,
            },
          ]
        : undefined,
    },
  };
}

export default async function SchemaExamplePage({ params }: PageProps) {
  const { slug } = await params;
  const example = getSchemaExampleBySlug(slug);
  const template = getSchemaExampleTemplate(slug);

  if (!example || !template) {
    notFound();
  }

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: example.title,
    url: getSchemaExampleAbsoluteUrl(example.slug),
    description: example.metaDescription,
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
      {
        "@type": "ListItem",
        position: 2,
        name: "Exemples de schémas électriques",
        item: "https://www.fabsystem.fr/schemas-electriques",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: example.title,
        item: getSchemaExampleAbsoluteUrl(example.slug),
      },
    ],
  };

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
        eyebrow="Schéma commenté"
        title={example.title}
        description={example.description}
      />

      <Section tone="light" className="border-b border-neutral-200 py-5 print:hidden">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-700">
              Gabarit lié : <span className="font-semibold text-neutral-950">{template.label}</span>
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              Ouvrez-le dans l&apos;éditeur pour le modifier, ou imprimez cette fiche pour
              l&apos;enregistrer en PDF.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href={getSchemaEditorTemplateHref(example.templateId)} variant="primary">
              Ouvrir dans l&apos;éditeur
            </Button>
            <PrintExampleButton />
          </div>
        </div>
      </Section>

      <Section tone="light" className="py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="space-y-6">
            <div className="rounded-[26px] border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Chaîne principale
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {example.flow.map((step, index) => (
                  <Fragment key={step}>
                    <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700">
                      {step}
                    </span>
                    {index < example.flow.length - 1 ? (
                      <span className="text-sm font-semibold text-brand-500">→</span>
                    ) : null}
                  </Fragment>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-tight text-neutral-950">
                Ce que ce schéma aide à comprendre
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {example.highlights.map((item) => (
                  <li key={item} className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-tight text-neutral-950">
                Ce que vous trouvez dans cette base
              </h2>
              <ul className="mt-4 space-y-3">
                {example.includes.map((item) => (
                  <li key={item} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-tight text-neutral-950">
                À vérifier avant de copier ce montage
              </h2>
              <ul className="mt-4 space-y-3">
                {example.watchouts.map((item) => (
                  <li key={item} className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <aside className="space-y-4">
            <div className="rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Pour qui ?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">{example.audience}</p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Niveau
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">{example.level}</p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Contexte idéal
              </p>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">{example.context}</p>
            </div>

            <div className="rounded-[26px] border border-neutral-200 bg-neutral-950 p-5 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">
                Besoin d&apos;aide ?
              </p>
              <h2 className="mt-2 text-lg font-bold tracking-tight">
                Passez de l&apos;exemple à votre vrai montage.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-300">
                Si vous avez un doute sur vos sections, vos fusibles, la logique de charge ou le
                câblage principal, mieux vaut valider le cas réel plutôt que de forcer un gabarit.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <Button href="/prestations/accompagnement" variant="primary">
                  Être accompagné
                </Button>
                <Button
                  href={`mailto:contact@fabsystem.fr?subject=${encodeURIComponent(`Besoin d'un schéma précis - ${example.title}`)}`}
                  variant="secondary"
                >
                  Demander un schéma précis
                </Button>
              </div>
            </div>

            <div className="rounded-[26px] border border-neutral-200 bg-white p-5 text-sm text-neutral-700 print:hidden">
              <p className="font-semibold text-neutral-950">Aller plus loin</p>
              <div className="mt-3 flex flex-col gap-3">
                <Link
                  href="/schemas-electriques"
                  className="font-medium text-neutral-700 underline underline-offset-4 hover:text-neutral-950"
                >
                  Voir les autres exemples de schémas
                </Link>
                <Link
                  href="/formations/lire-schema"
                  className="font-medium text-neutral-700 underline underline-offset-4 hover:text-neutral-950"
                >
                  Apprendre à lire un schéma électrique
                </Link>
                <Link
                  href="/outils"
                  className="font-medium text-neutral-700 underline underline-offset-4 hover:text-neutral-950"
                >
                  Revenir aux outils FabSystem
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </Section>

      <Section tone="light" className="pt-0">
        <SchemaExamplesHelpCta contextLabel={example.title} />
      </Section>
    </main>
  );
}
