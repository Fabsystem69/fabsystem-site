import type { BlogIndexCard } from "@/lib/blog/index-card";

// Source unique des 3 guides relocalisés sous /blog (refonte SEO — voir
// docs de session : le contenu éditorial de fond vivait sans URL ni
// navigation dédiées, noyé dans la grille de /formations). Repris tel quel
// depuis l'ancien tableau GUIDES de components/lesbases/Modules.tsx, avec
// les href mis à jour vers /blog/... — évite que l'index du blog et la
// section "Trois lectures" de /formations divergent en gardant chacun sa
// propre copie de ces métadonnées.
export type RelocatedArticle = {
  href: string;
  badge: string;
  meta: string;
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  highlights: readonly string[];
  // Reprend datePublished des JSON-LD Article de chaque page (identique
  // pour les 3 aujourd'hui : publiées le même jour de cette refonte).
  publishedAt: string;
};

export const RELOCATED_ARTICLES: readonly RelocatedArticle[] = [
  {
    href: "/blog/installation-electrique-van",
    badge: "Guide pratique",
    meta: "Van & Fourgon aménagés",
    imageSrc: "/articles/installation-electrique-van-guide.webp",
    imageAlt: "Illustration de planification d'une installation electrique de van",
    title: "Bien dimensionner une installation van avant d'acheter",
    description:
      "Un article de synthèse pour remettre les priorités dans le bon ordre : besoins réels, batterie, recharge, convertisseur 230V, câbles et protections.",
    highlights: [
      "Éviter de surdimensionner ou sous-dimensionner dès le départ",
      "Relier les modules de base à un vrai projet de van",
      "Revenir ensuite aux outils et aux schémas avec une logique claire",
    ],
    publishedAt: "2026-08-16",
  },
  {
    href: "/blog/installation-van-batterie-tout-en-un-aferiy-p280",
    badge: "Cas concret",
    meta: "AFERIY P280",
    imageSrc: "/articles/aferiy-p280-architecture-van.webp",
    imageAlt: "Illustration d'un van amenage autour d'une AFERIY P280",
    title: "Monter un van simple autour d'une batterie tout-en-un",
    description:
      "Un cas d'usage concret autour de l'AFERIY P280 : double XT90, sortie XT60 12V, panneau 200W et deux prises AC à traiter avec sérieux.",
    highlights: [
      "Voir comment structurer le 12V fixe à partir d'une sortie XT60",
      "Comprendre où une station tout-en-un simplifie vraiment le projet",
      "Garder une vraie prudence sur les prises 230V fixes dans le van",
    ],
    publishedAt: "2026-08-16",
  },
  {
    href: "/blog/installation-electrique-van-victron-legere",
    badge: "Cas concret",
    meta: "Victron leger",
    imageSrc: "/articles/installation-electrique-van-victron-legere.jpg",
    imageAlt: "Illustration d'une architecture Victron legere pour van",
    title: "Construire un van propre autour d'une batterie classique",
    description:
      "Une base autour d'une LiFePO4 150Ah, d'un SmartSolar 75/15, d'un MultiPlus 12/800, d'un SmartShunt et d'un Orion 18A optionnel.",
    highlights: [
      "Garder le 12V comme base de vie a bord et le 230V pour les petits chargeurs",
      "Voir comment structurer une architecture Victron lisible sans surdimensionnement",
      "Repartir ensuite du schema et du projet cloud pour adapter le montage a votre van",
    ],
    publishedAt: "2026-08-16",
  },
] as const;

export function relocatedArticleToIndexCard(article: RelocatedArticle): BlogIndexCard {
  return {
    href: article.href,
    title: article.title,
    excerpt: article.description,
    imageSrc: article.imageSrc,
    imageAlt: article.imageAlt,
    badge: article.badge,
    meta: article.meta,
    publishedAt: article.publishedAt,
  };
}
