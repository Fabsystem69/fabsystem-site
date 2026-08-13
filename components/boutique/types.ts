import type { PrestationsCategorie } from "@/lib/prestations-packs";

// Donnée de carte/fiche construite côté serveur à partir du catalogue réel
// (lib/services/catalog.ts) — jamais de champ inventé. `univers` reste
// optionnel : seuls les deux ebooks connus de EBOOK_SLUG_BY_CATEGORIE en ont
// un aujourd'hui (voir getUniversForEbookSlug dans lib/prestations-packs.ts).
export type BoutiqueGuideEntry = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  productType: "EBOOK" | "DIGITAL_DOWNLOAD" | "BUNDLE";
  featuredImage: string | null;
  priceCents: number;
  univers?: PrestationsCategorie;
  isDeductible: boolean;
  formatsCount?: number;
  pageCount?: number;
  owned: boolean;
};
