import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/Button";
import { SchemaExamplesHelpCta } from "@/components/schema-examples/SchemaExamplesHelpCta";
import {
  SCHEMA_EXAMPLES,
  getSchemaEditorTemplateHref,
  getSchemaExampleAbsoluteUrl,
  getSchemaExampleHref,
} from "@/lib/schema-examples";

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Exemples de schémas électriques 12V",
  url: "https://www.fabsystem.fr/schemas-electriques",
  description:
    "Exemples de schémas électriques 12V pour van, bateau et station électrique, avec explication et ouverture directe dans l'éditeur.",
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
  description:
    "Exemples de schémas électriques 12V pour van, bateau et station électrique : explications, ouverture directe dans l'éditeur et impression PDF.",
  alternates: {
    canonical: "/schemas-electriques",
  },
  openGraph: {
    title: "Exemples de schémas électriques 12V | FabSystem",
    description:
      "Des schémas commentés pour van, bateau et station électrique, à ouvrir dans l'éditeur ou à imprimer.",
    url: "https://www.fabsystem.fr/schemas-electriques",
  },
};

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
            Astuce : les fiches sont aussi imprimables, ce qui permet de les enregistrer en PDF
            pour garder une base de travail hors ligne.
          </p>
        </div>
      </Section>

      <Section tone="muted" className="py-8 sm:py-10">
        <div className="grid gap-4 lg:grid-cols-2">
          {SCHEMA_EXAMPLES.map((example) => (
            <article
              key={example.slug}
              className="rounded-[26px] border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-neutral-500">
                <span className="rounded-full bg-neutral-100 px-3 py-1">{example.audience}</span>
                <span className="rounded-full bg-brand-100 px-3 py-1 text-brand-700">
                  {example.level}
                </span>
              </div>

              <h2 className="mt-4 text-xl font-bold tracking-tight text-neutral-950">
                <Link href={getSchemaExampleHref(example.slug)} className="hover:text-neutral-700">
                  {example.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-700">{example.description}</p>

              <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Chaîne principale
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {example.flow.map((step, index) => (
                    <div key={`${example.slug}-${step}`} className="flex items-center gap-2">
                      <span className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700">
                        {step}
                      </span>
                      {index < example.flow.length - 1 ? (
                        <span className="text-sm font-semibold text-brand-500">→</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-neutral-700">
                {example.highlights.slice(0, 2).map((item) => (
                  <li key={item} className="rounded-xl border border-neutral-200 bg-white p-3">
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button href={getSchemaExampleHref(example.slug)} variant="primary">
                  Voir la fiche
                </Button>
                <Button href={getSchemaEditorTemplateHref(example.templateId)} variant="secondary">
                  Ouvrir dans l&apos;éditeur
                </Button>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="light" className="pt-0">
        <SchemaExamplesHelpCta contextLabel="exemple de schéma électrique" />
      </Section>
    </main>
  );
}
