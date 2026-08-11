import "server-only";

import type { CatalogProductSummary } from "@/lib/services/catalog";
import { listDownloadGrantsForEmail } from "@/lib/services/download-grant";

type ExistingGrant = Awaited<ReturnType<typeof listDownloadGrantsForEmail>>[number];

// Extrait de app/boutique/[slug]/page.tsx (findExistingAccess) pour être
// réutilisable aussi depuis le hub /boutique (Mission UI-5 §2 : les cartes
// doivent aussi afficher "Déjà dans votre bibliothèque"). Toujours basé sur
// le mécanisme DownloadGrant réel — aucune vérification par email en dur.
export async function findExistingProductAccess(
  product: Pick<CatalogProductSummary, "assets">,
  customerEmail: string
): Promise<ExistingGrant | null> {
  const assetIds = new Set(product.assets.map((productAsset) => productAsset.assetId));

  if (assetIds.size === 0) {
    return null;
  }

  const grants = await listDownloadGrantsForEmail(customerEmail);
  return grants.find((grant) => assetIds.has(grant.assetId)) ?? null;
}
