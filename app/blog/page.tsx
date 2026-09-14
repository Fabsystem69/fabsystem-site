import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageIntro } from "@/components/public/PageIntro";
import { Button } from "@/components/ui/Button";
import { RELOCATED_ARTICLES, relocatedArticleToIndexCard } from "@/lib/blog/relocated-articles";
import { getAllMdxArticlesMeta, mdxArticleToIndexCard } from "@/lib/blog/articles";

// Hub éditorial (refonte SEO) : le contenu de fond n'avait jusqu'ici ni URL
// ni navigation dédiées, noyé dans la grille de /formations — invisible en
// tant que catégorie de contenu propre, pour un visiteur comme pour Google.
// Fusionne les 3 guides relocalisés (JSX, lib/blog/relocated-articles.ts) et
// les futurs articles MDX (lib/blog/articles.ts) au point de rendu
// seulement, via une fonction toIndexCard par source — voir
// lib/blog/index-card.ts pour la forme commune minimale.
export const metadata: Metadata = {
  title: "Blog — Guides électricité embarquée",
  description:
    "Guides et cas concrets pour concevoir une installation électrique de van, bateau ou camping-car : dimensionnement, architecture, matériel.",
  alternates: {
    canonical: "/blog",
  },
};

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Blog — Guides électricité embarquée",
  url: "https://www.fabsystem.fr/blog",
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
    { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.fabsystem.fr/blog" },
  ],
};

export default async function BlogPage() {
  const mdxArticles = await getAllMdxArticlesMeta();
  const cards = [
    ...RELOCATED_ARTICLES.map(relocatedArticleToIndexCard),
    ...mdxArticles.map(mdxArticleToIndexCard),
  ].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <main className="bg-white text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <PageIntro
        title="Blog"
        description="Guides et cas concrets pour concevoir une installation électrique de van, bateau ou camping-car : dimensionnement, architecture, matériel."
      />

      <section className="mx-auto max-w-6xl px-6 py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.href}
              className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-sm"
            >
              <Link href={card.href} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                  <Image
                    src={card.imageSrc}
                    alt={card.imageAlt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-brand-400 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-950">
                        {card.badge}
                      </span>
                      {card.meta ? (
                        <span className="rounded-full bg-white/14 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                          {card.meta}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Link>

              <div className="p-5">
                <h2 className="text-lg font-bold tracking-tight text-neutral-950">{card.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-700">{card.excerpt}</p>

                <div className="mt-5">
                  <Button href={card.href} variant="secondary" className="w-full">
                    Lire l&apos;article →
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
