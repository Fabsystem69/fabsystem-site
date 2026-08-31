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
  getSchemaExampleComponents,
  getSchemaExampleHref,
  getSchemaExampleTemplate,
  getSchemaExampleThumbnailAbsoluteUrl,
  getSchemaExampleWiring,
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
    twitter: {
      card: "summary_large_image",
      title: example.metaTitle,
      description: example.metaDescription,
      images: getSchemaExampleThumbnailAbsoluteUrl(example.slug)
        ? [getSchemaExampleThumbnailAbsoluteUrl(example.slug) ?? ""]
        : undefined,
    },
  };
}

const faqItems = (exampleTitle: string) => [
  {
    question: "Puis-je adapter ce schéma à une tension différente (24V, 48V) ?",
    answer:
      "Oui dans l'esprit, mais pas en changeant juste un chiffre. La logique d'ensemble (sources, protections, distribution) reste valable, mais les sections de câble, les calibres de fusible et souvent les modèles de composants doivent être recalculés pour la tension réelle visée.",
  },
  {
    question: "Les sections de câble et calibres affichés sont-ils garantis pour mon installation ?",
    answer:
      "Non. Ils correspondent au dimensionnement retenu pour ce gabarit précis (puissance, longueurs de câble et matériel choisis pour cet exemple), pas à une règle universelle. Vos distances réelles, votre puissance installée et votre matériel doivent toujours être vérifiés avant de câbler quoi que ce soit.",
  },
  {
    question: "Comment imprimer ce schéma ou l'enregistrer en PDF ?",
    answer:
      "Utilisez le bouton « Imprimer » en haut de cette page : il ouvre la boîte de dialogue d'impression de votre navigateur, dans laquelle vous pouvez choisir « Enregistrer en PDF » comme destination.",
  },
  {
    question: `Puis-je modifier « ${exampleTitle} » avant de l'imprimer ?`,
    answer:
      "Oui : ouvrez-le dans l'éditeur avec le bouton « Ouvrir dans l'éditeur », modifiez les composants, valeurs ou branchements selon votre projet, puis revenez imprimer votre propre version depuis l'éditeur.",
  },
];

export default async function SchemaExamplePage({ params }: PageProps) {
  const { slug } = await params;
  const example = getSchemaExampleBySlug(slug);
  const template = getSchemaExampleTemplate(slug);

  if (!example || !template) {
    notFound();
  }

  const components = getSchemaExampleComponents(slug);
  const wiring = getSchemaExampleWiring(slug);
  const faq = faqItems(example.title);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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

            {components.length > 0 ? (
              <div>
                <h2 className="text-lg font-bold tracking-tight text-neutral-950">
                  Composants utilisés
                </h2>
                <div className="mt-4 overflow-x-auto rounded-[26px] border border-neutral-200 bg-neutral-50 p-5">
                  <table className="w-full min-w-[420px] border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                        <th className="pb-3 pr-4">Composant</th>
                        <th className="pb-3 pr-4">Type</th>
                        <th className="pb-3">Quantité</th>
                      </tr>
                    </thead>
                    <tbody>
                      {components.map((component) => (
                        <tr key={component.key} className="border-t border-neutral-200">
                          <td className="py-2.5 pr-4 font-medium text-neutral-900">{component.label}</td>
                          <td className="py-2.5 pr-4 text-neutral-600">{component.typeLabel}</td>
                          <td className="py-2.5 text-neutral-600">
                            {component.count > 1 ? `${component.count}×` : "1"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-4 text-xs text-neutral-500">
                    Liste générée directement depuis le vrai schéma (pas une fiche saisie à la
                    main) : toujours à jour avec le gabarit ouvert dans l&apos;éditeur.
                  </p>
                </div>
              </div>
            ) : null}

            {wiring.length > 0 ? (
              <div>
                <h2 className="text-lg font-bold tracking-tight text-neutral-950">
                  Câbles et protections
                </h2>
                <p className="mt-2 text-sm text-neutral-600">
                  Les câbles de puissance les plus significatifs de ce schéma (batterie, sources,
                  protections principales), avec leur section et leur longueur réelle telles que
                  définies dans le gabarit.
                </p>
                <div className="mt-4 overflow-x-auto rounded-[26px] border border-neutral-200 bg-neutral-50 p-5">
                  <table className="w-full min-w-[520px] border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                        <th className="pb-3 pr-4">De</th>
                        <th className="pb-3 pr-4">Vers</th>
                        <th className="pb-3 pr-4">Section</th>
                        <th className="pb-3 pr-4">Longueur</th>
                        <th className="pb-3">Polarité</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wiring.map((row) => (
                        <tr key={row.id} className="border-t border-neutral-200">
                          <td className="py-2.5 pr-4 font-medium text-neutral-900">{row.fromLabel}</td>
                          <td className="py-2.5 pr-4 font-medium text-neutral-900">{row.toLabel}</td>
                          <td className="py-2.5 pr-4 text-neutral-600">{row.section}</td>
                          <td className="py-2.5 pr-4 text-neutral-600">
                            {row.length !== null ? `${row.length} m` : "—"}
                          </td>
                          <td className="py-2.5 text-neutral-600">{row.polarity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-4 text-xs text-neutral-500">
                    Tableau généré directement depuis le vrai schéma, toujours à jour — ce n&apos;est
                    pas une fiche de dimensionnement figée.
                  </p>
                </div>
              </div>
            ) : null}
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

      <Section tone="light" className="border-t border-neutral-200 py-8 sm:py-10">
        <h2 className="text-lg font-bold tracking-tight text-neutral-950">Questions fréquentes</h2>
        <div className="mt-4 space-y-3">
          {faq.map((item) => (
            <div key={item.question} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <h3 className="text-sm font-semibold text-neutral-950">{item.question}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">{item.answer}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="light" className="pt-0">
        <SchemaExamplesHelpCta contextLabel={example.title} />
      </Section>
    </main>
  );
}
