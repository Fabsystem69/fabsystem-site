import { cache } from "react";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { BlogIndexCard } from "@/lib/blog/index-card";

// Pipeline MDX pour les futurs articles du blog (refonte SEO — voir
// lib/blog/relocated-articles.ts pour les 3 guides déjà publiés, qui ne
// passent PAS par ici : ce loader ne concerne que les nouveaux articles,
// écrits en Markdown/MDX plutôt qu'en JSX à la main, un fichier par
// article sous content/blog/*.mdx). Frontmatter inspiré de SchemaExample
// (lib/schema-examples-data.ts), adapté pour du texte long.
export type BlogArticleFrontmatter = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  thumbnailSrc: string;
  thumbnailAlt: string;
  relatedSlugs: string[];
};

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

function isMdxFile(fileName: string) {
  return fileName.endsWith(".mdx");
}

function slugFromFileName(fileName: string) {
  return fileName.replace(/\.mdx$/, "");
}

// cache() dédie une lecture par slug/appel pour la durée d'un seul rendu
// serveur (même pattern que getPublicProduct dans
// app/boutique/[slug]/page.tsx) — generateStaticParams, generateMetadata et
// la page elle-même appellent ce loader sans déclencher plusieurs lectures
// disque redondantes pour le même article.
const listMdxFileNames = cache(async (): Promise<string[]> => {
  try {
    const entries = await readdir(CONTENT_DIR);
    return entries.filter(isMdxFile);
  } catch {
    // Dossier absent tant qu'aucun article n'a été publié — liste vide,
    // jamais une erreur qui casserait le build ou l'index du blog.
    return [];
  }
});

export const getMdxArticleBySlug = cache(async (slug: string) => {
  const fileName = `${slug}.mdx`;
  try {
    const filePath = path.join(CONTENT_DIR, fileName);
    const raw = await readFile(filePath, "utf8");
    const parsed = matter(raw);
    return {
      frontmatter: parsed.data as BlogArticleFrontmatter,
      content: parsed.content,
    };
  } catch {
    return null;
  }
});

export async function getAllMdxArticlesMeta(): Promise<BlogArticleFrontmatter[]> {
  const fileNames = await listMdxFileNames();
  const entries = await Promise.all(
    fileNames.map(async (fileName) => {
      const article = await getMdxArticleBySlug(slugFromFileName(fileName));
      return article?.frontmatter ?? null;
    })
  );
  return entries.filter((entry): entry is BlogArticleFrontmatter => entry !== null);
}

export async function getMdxArticleSlugs(): Promise<string[]> {
  const fileNames = await listMdxFileNames();
  return fileNames.map(slugFromFileName);
}

export function mdxArticleToIndexCard(article: BlogArticleFrontmatter): BlogIndexCard {
  return {
    href: `/blog/${article.slug}`,
    title: article.title,
    excerpt: article.excerpt,
    imageSrc: article.thumbnailSrc,
    imageAlt: article.thumbnailAlt,
    badge: "Article",
    meta: article.tags?.[0] ?? "",
    publishedAt: article.publishedAt,
  };
}

export async function getMdxArticleLastModified(slug: string): Promise<Date> {
  try {
    const fileStat = await stat(path.join(CONTENT_DIR, `${slug}.mdx`));
    return fileStat.mtime;
  } catch {
    return new Date();
  }
}
