// Forme commune minimale utilisée UNIQUEMENT au point de rendu de l'index
// /blog, pour fusionner les guides relocalisés (JSX, lib/blog/relocated-articles.ts)
// et les articles MDX (lib/blog/articles.ts) sans forcer les deux sources à
// se conformer en interne à un type "Article" partagé — chacune garde sa
// forme native, et n'expose que ceci à la liste.
export type BlogIndexCard = {
  href: string;
  title: string;
  excerpt: string;
  imageSrc: string;
  imageAlt: string;
  badge: string;
  meta: string;
  publishedAt: string;
};
