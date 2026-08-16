import type { MetadataRoute } from "next";
import { listActiveBuyNowProducts } from "@/lib/services/catalog";
import { isPrestationsPackSlug } from "@/lib/prestations-packs";
import { SCHEMA_EXAMPLE_SLUGS } from "@/lib/schema-examples";

// Sitemap dynamique (retour utilisateur : "optimise l'affichage des pages
// sur Google") — les pages hub (/outils, /formations, /boutique) étaient
// listées, mais pas leurs sous-pages individuelles (chaque calculateur,
// chaque formation, chaque produit), qui ont pourtant leur propre
// contenu/metadata indexable. Les produits viennent du catalogue réel
// (listActiveBuyNowProducts) plutôt que d'une liste figée à la main :
// un nouvel ebook publié apparaît ici sans modification de ce fichier.
export const dynamic = "force-dynamic";

const OUTILS_SLUGS = [
  "section-cable",
  "bilan-consommation",
  "autonomie-batterie",
  "mppt",
  "awg",
  "schema",
  "soc-batterie",
  "charge-secteur",
];
const FORMATIONS_SLUGS = [
  "bases-12v",
  "lire-schema",
  "types-batteries",
  "distribution-12v",
  "recharger-batteries",
  "multimetre",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.fabsystem.fr";
  const lastModified = new Date();

  const products = await listActiveBuyNowProducts().catch(() => []);
  const productEntries: MetadataRoute.Sitemap = products
    .filter((product) => !isPrestationsPackSlug(product.slug))
    .map((product) => ({
      url: `${baseUrl}/boutique/${product.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/prestations`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/formations`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...FORMATIONS_SLUGS.map((slug) => ({
      url: `${baseUrl}/formations/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${baseUrl}/outils`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...OUTILS_SLUGS.map((slug) => ({
      url: `${baseUrl}/outils/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${baseUrl}/realisations`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/schemas-electriques`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...SCHEMA_EXAMPLE_SLUGS.map((slug) => ({
      url: `${baseUrl}/schemas-electriques/${slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${baseUrl}/boutique`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...productEntries,
    {
      url: `${baseUrl}/a-propos`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/temoignage`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/probleme-charge-batterie-bateau`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/installation-12v-bateau`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/installation-electrique-van`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/installation-van-batterie-tout-en-un-aferiy-p280`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/securisation-correction-bateau`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/vcard`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/mentions-legales`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/confidentialite`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
