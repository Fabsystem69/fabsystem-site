import type { MetadataRoute } from "next";
import { stat } from "node:fs/promises";
import path from "node:path";
import { listActiveBuyNowProducts } from "@/lib/services/catalog";
import { isPrestationsPackSlug } from "@/lib/prestations-packs";
import { SCHEMA_EXAMPLE_SLUGS } from "@/lib/schema-examples-data";

// Sitemap dynamique (retour utilisateur : "optimise l'affichage des pages
// sur Google") — les pages hub (/outils, /formations, /boutique) étaient
// listées, mais pas leurs sous-pages individuelles (chaque calculateur,
// chaque formation, chaque produit), qui ont pourtant leur propre
// contenu/metadata indexable. Les produits viennent du catalogue réel
// (listActiveBuyNowProducts) plutôt que d'une liste figée à la main :
// un nouvel ebook publié apparaît ici sans modification de ce fichier.

const OUTILS_SLUGS = [
  "section-cable",
  "bilan-consommation",
  "mppt",
  "schema",
  "soc-batterie",
  "charge-secteur",
  "fusible",
  "onduleur",
  "dcdc-alternateur",
  "batterie",
];
const FORMATIONS_SLUGS = [
  "bases-12v",
  "lire-schema",
  "types-batteries",
  "distribution-12v",
  "recharger-batteries",
  "multimetre",
];

const ROUTE_FILE_MAP = {
  "/": ["app/(home)/page.tsx"],
  "/prestations": ["app/prestations/page.tsx"],
  "/prestations/accompagnement": [
    "app/prestations/accompagnement/page.tsx",
    "components/services/OnFaitEnsemble.tsx",
  ],
  "/prestations/intervention": [
    "app/prestations/intervention/page.tsx",
    "components/services/JeConfie.tsx",
  ],
  "/formations": ["app/formations/page.tsx"],
  "/outils": ["app/outils/page.tsx"],
  "/outils/schema": [
    "app/outils/schema/page.tsx",
    "app/outils/schema/editeur/page.tsx",
    "components/schema-editor/SchemaEditorRuntime.tsx",
  ],
  "/realisations": ["app/realisations/page.tsx"],
  "/schemas-electriques": ["app/schemas-electriques/page.tsx", "lib/schema-examples-data.ts"],
  "/boutique": ["app/boutique/(catalog)/page.tsx"],
  "/a-propos": ["app/a-propos/page.tsx"],
  "/contact": ["app/contact/page.tsx"],
  "/temoignage": ["app/temoignage/page.tsx"],
  "/probleme-charge-batterie-bateau": ["app/probleme-charge-batterie-bateau/page.tsx"],
  "/installation-12v-bateau": ["app/installation-12v-bateau/page.tsx"],
  "/installation-electrique-van": ["app/installation-electrique-van/page.tsx"],
  "/installation-electrique-van-victron-legere": [
    "app/installation-electrique-van-victron-legere/page.tsx",
  ],
  "/installation-van-batterie-tout-en-un-aferiy-p280": [
    "app/installation-van-batterie-tout-en-un-aferiy-p280/page.tsx",
  ],
  "/securisation-correction-bateau": ["app/securisation-correction-bateau/page.tsx"],
  "/vcard": ["app/vcard/page.tsx"],
  "/mentions-legales": ["app/mentions-legales/page.tsx"],
  "/confidentialite": ["app/confidentialite/page.tsx"],
} as const;

const STABLE_FALLBACK_PATH = "app/layout.tsx";

async function getStableLastModified(relativePaths: readonly string[]) {
  const stats = await Promise.all(
    relativePaths.map(async (relativePath) => {
      try {
        return await stat(path.join(process.cwd(), relativePath));
      } catch {
        return null;
      }
    })
  );

  const mtimes = stats
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .map((entry) => entry.mtime.getTime());

  if (mtimes.length === 0) {
    try {
      const fallbackStat = await stat(path.join(process.cwd(), STABLE_FALLBACK_PATH));
      return fallbackStat.mtime;
    } catch {
      return new Date("2026-08-31T00:00:00.000Z");
    }
  }

  return new Date(Math.max(...mtimes));
}

async function createEntry(
  baseUrl: string,
  pathname: keyof typeof ROUTE_FILE_MAP,
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>,
  priority: number
) {
  return {
    url: `${baseUrl}${pathname}`,
    lastModified: await getStableLastModified(ROUTE_FILE_MAP[pathname]),
    changeFrequency,
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.fabsystem.fr";

  const products = await listActiveBuyNowProducts().catch(() => []);
  const productEntries: MetadataRoute.Sitemap = await Promise.all(
    products
      .filter((product) => !isPrestationsPackSlug(product.slug))
      .map(async (product) => ({
        url: `${baseUrl}/boutique/${product.slug}`,
        lastModified:
          product.updatedAt instanceof Date
            ? product.updatedAt
            : await getStableLastModified(["app/boutique/[slug]/page.tsx"]),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      }))
  );

  const formationEntries: MetadataRoute.Sitemap = await Promise.all(
    FORMATIONS_SLUGS.map(async (slug) => ({
      url: `${baseUrl}/formations/${slug}`,
      lastModified: await getStableLastModified([`app/formations/${slug}/page.tsx`]),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }))
  );

  const outilEntries: MetadataRoute.Sitemap = await Promise.all(
    OUTILS_SLUGS.map(async (slug) => ({
      url: `${baseUrl}/outils/${slug}`,
      lastModified: await getStableLastModified([`app/outils/${slug}/page.tsx`]),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  );

  const schemaEntries: MetadataRoute.Sitemap = await Promise.all(
    SCHEMA_EXAMPLE_SLUGS.map(async (slug) => ({
      url: `${baseUrl}/schemas-electriques/${slug}`,
      lastModified: await getStableLastModified([
        "app/schemas-electriques/[slug]/page.tsx",
        "lib/schema-examples-data.ts",
      ]),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }))
  );

  return [
    await createEntry(baseUrl, "/", "monthly", 1),
    await createEntry(baseUrl, "/prestations", "monthly", 0.8),
    await createEntry(baseUrl, "/prestations/accompagnement", "monthly", 0.8),
    await createEntry(baseUrl, "/prestations/intervention", "monthly", 0.8),
    await createEntry(baseUrl, "/formations", "monthly", 0.8),
    ...formationEntries,
    await createEntry(baseUrl, "/outils", "monthly", 0.9),
    ...outilEntries,
    await createEntry(baseUrl, "/realisations", "monthly", 0.6),
    await createEntry(baseUrl, "/schemas-electriques", "monthly", 0.8),
    ...schemaEntries,
    await createEntry(baseUrl, "/boutique", "monthly", 0.8),
    ...productEntries,
    await createEntry(baseUrl, "/a-propos", "monthly", 0.6),
    await createEntry(baseUrl, "/contact", "monthly", 0.8),
    await createEntry(baseUrl, "/temoignage", "yearly", 0.3),
    await createEntry(baseUrl, "/probleme-charge-batterie-bateau", "monthly", 0.8),
    await createEntry(baseUrl, "/installation-12v-bateau", "monthly", 0.8),
    await createEntry(baseUrl, "/installation-electrique-van", "monthly", 0.8),
    await createEntry(baseUrl, "/installation-electrique-van-victron-legere", "monthly", 0.8),
    await createEntry(baseUrl, "/installation-van-batterie-tout-en-un-aferiy-p280", "monthly", 0.8),
    await createEntry(baseUrl, "/securisation-correction-bateau", "monthly", 0.8),
    await createEntry(baseUrl, "/vcard", "yearly", 0.2),
    await createEntry(baseUrl, "/mentions-legales", "yearly", 0.2),
    await createEntry(baseUrl, "/confidentialite", "yearly", 0.2),
  ];
}
