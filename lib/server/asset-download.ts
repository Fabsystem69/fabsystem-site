import "server-only";

import {
  SUPABASE_STORAGE_SIGNED_URL_DEFAULT_TTL_SECONDS,
  createPrivateAssetSignedUrl,
} from "@/lib/server/supabase-storage";
import { getPrivateBlobStream } from "@/lib/server/vercel-blob-storage";

// Point d'integration unique pour livrer un DigitalAsset quel que soit son
// provider — utilise par lib/services/download-access.ts (achats) et
// lib/services/customer-resource-access.ts (ressources offertes). Supabase
// retourne une URL signee (le navigateur la fetch directement, redirection
// 302) ; Vercel Blob (store prive, sans URL signee equivalente) retourne un
// flux que la route serveur doit relayer elle-meme dans sa reponse.
export type AssetDownloadResolution =
  | { mode: "redirect"; url: string }
  | { mode: "stream"; stream: ReadableStream<Uint8Array>; contentType: string };

// Retour utilisateur : sur mobile, un PDF "telecharge" atterrit dans un
// dossier que le client ne sait pas retrouver, plutot que de s'afficher
// directement. Un PDF s'ouvre desormais dans le lecteur du navigateur
// (inline) ; les autres formats (epub, zip, html empaquete) restent en
// telechargement force, un navigateur ne sachant pas les afficher nativement
// (et forcer inline sur du HTML l'exposerait comme une page web, jamais
// souhaitable pour un fichier livre au client).
export function buildDownloadContentDisposition(contentType: string, filename: string) {
  const disposition = contentType === "application/pdf" ? "inline" : "attachment";
  return `${disposition}; filename="${encodeURIComponent(filename)}"`;
}

export async function resolveAssetDownload(asset: {
  provider: string;
  path: string;
  filename: string;
}): Promise<AssetDownloadResolution> {
  if (asset.provider === "VERCEL_BLOB") {
    const { stream, contentType } = await getPrivateBlobStream(asset.path);
    return { mode: "stream", stream, contentType: contentType || "application/octet-stream" };
  }

  const url = await createPrivateAssetSignedUrl(
    asset.path,
    SUPABASE_STORAGE_SIGNED_URL_DEFAULT_TTL_SECONDS,
    asset.filename
  );
  return { mode: "redirect", url };
}
