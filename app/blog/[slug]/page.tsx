import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { PageIntro } from "@/components/public/PageIntro";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { VoltaGuide } from "@/components/volta/VoltaGuide";
import { LightProjectKit } from "@/components/project-follow-up/LightProjectKit";
import { getAllMdxArticlesMeta, getMdxArticleBySlug, getMdxArticleSlugs, type BlogArticleFrontmatter } from "@/lib/blog/articles";

// Route dynamique pour les futurs articles MDX (refonte SEO — voir
// lib/blog/relocated-articles.ts pour les 3 guides déjà publiés, qui restent
// des pages JSX à part, non concernées par cette route). Même pattern que
// app/schemas-electriques/[slug]/page.tsx : dynamicParams = false + params
// générés depuis la liste réelle de fichiers, jamais une plage devinée.
type PageProps = {
  params: Promise<{ slug: string }>;
};

// Composants disponibles dans le corps Markdown d'un article, exactement
// comme les guides JSX existants les utilisent aujourd'hui — étendre cette
// liste au moment d'écrire un article qui en a besoin, pas avant.
const MDX_COMPONENTS = { Badge, Button, VoltaGuide, LightProjectKit };

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getMdxArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getMdxArticleBySlug(slug);
  if (!article) {
    return {};
  }
  const { frontmatter } = article;

  return {
    title: frontmatter.metaTitle,
    description: frontmatter.metaDescription,
    alternates: {
      canonical: `/blog/${slug}`,
    },
    openGraph: {
      title: frontmatter.metaTitle,
      description: frontmatter.metaDescription,
      url: `https://www.fabsystem.fr/blog/${slug}`,
      type: "article",
      images: frontmatter.thumbnailSrc
        ? [{ url: frontmatter.thumbnailSrc, width: 1200, height: 630, alt: frontmatter.thumbnailAlt }]
        : undefined,
    },
  };
}

const breadcrumbJsonLd = (title: string, slug: string) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.fabsystem.fr" },
    { "@type": "ListItem", position: 2, name: "Blog", item: "https://www.fabsystem.fr/blog" },
    { "@type": "ListItem", position: 3, name: title, item: `https://www.fabsystem.fr/blog/${slug}` },
  ],
});

const articleJsonLd = (frontmatter: BlogArticleFrontmatter, slug: string) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: frontmatter.title,
  description: frontmatter.metaDescription,
  mainEntityOfPage: `https://www.fabsystem.fr/blog/${slug}`,
  datePublished: frontmatter.publishedAt,
  dateModified: frontmatter.updatedAt,
  author: { "@type": "Organization", name: "FabSystem" },
  publisher: {
    "@type": "Organization",
    name: "FabSystem",
    logo: { "@type": "ImageObject", url: "https://www.fabsystem.fr/favicon.png" },
  },
  image: frontmatter.thumbnailSrc ? [`https://www.fabsystem.fr${frontmatter.thumbnailSrc}`] : undefined,
});

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getMdxArticleBySlug(slug);
  if (!article) {
    notFound();
  }
  const { frontmatter, content } = article;

  const relatedArticles = frontmatter.relatedSlugs?.length
    ? (await getAllMdxArticlesMeta()).filter((meta) => frontmatter.relatedSlugs.includes(meta.slug))
    : [];

  return (
    <main className="bg-white text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(frontmatter, slug)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(frontmatter.title, slug)) }}
      />

      <PageIntro title={frontmatter.title} description={frontmatter.excerpt} />

      <article className="mx-auto max-w-3xl px-6 py-8 sm:py-10">
        <div className="prose prose-neutral max-w-none">
          <MDXRemote source={content} components={MDX_COMPONENTS} />
        </div>

        {relatedArticles.length > 0 ? (
          <div className="mt-10 border-t border-neutral-200 pt-6">
            <h2 className="text-base font-semibold text-neutral-950">À lire aussi</h2>
            <ul className="mt-3 space-y-2">
              {relatedArticles.map((related) => (
                <li key={related.slug}>
                  <Button href={`/blog/${related.slug}`} variant="secondary">
                    {related.title} →
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>
    </main>
  );
}
