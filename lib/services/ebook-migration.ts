import { prisma } from "@/lib/prisma";
import { createPrivateAssetSignedUrl } from "@/lib/server/supabase-storage";
import { getPrivateBlobStream, uploadPrivateBlob } from "@/lib/server/vercel-blob-storage";
import { logServerEvent } from "@/lib/server-log";

// Migration ponctuelle Supabase -> Vercel Blob pour les DigitalAsset restants
// (retour utilisateur : projets Supabase gratuits mis en pause apres 7 jours
// d'inactivite, cause probable de plaintes clients sur des telechargements
// d'ebooks). Idempotente : ne traite que provider=SUPABASE, donc sans effet
// sur les assets deja migres — peut etre relancee sans risque (ex. apres
// l'ajout d'un nouvel ebook resté sur Supabase par erreur).
//
// Ne supprime jamais le fichier Supabase d'origine : uniquement le pointeur
// DB qui change de provider. Le fichier Supabase reste en place comme filet
// de securite, a nettoyer manuellement plus tard une fois confirme que tout
// fonctionne en production depuis un moment.
export type EbookMigrationResult = {
  id: string;
  filename: string;
  status: "migrated" | "empty_file" | "fetch_failed" | "verification_mismatch" | "error";
  sizeBytes?: number;
  oldPath?: string;
  newPath?: string;
  detail?: string;
};

export async function migrateEbookAssetsToVercelBlob(): Promise<EbookMigrationResult[]> {
  const assets = await prisma.digitalAsset.findMany({ where: { provider: "SUPABASE" } });
  const results: EbookMigrationResult[] = [];

  for (const asset of assets) {
    try {
      const signedUrl = await createPrivateAssetSignedUrl(asset.path, 300, asset.filename);
      const response = await fetch(signedUrl);

      if (!response.ok) {
        results.push({ id: asset.id, filename: asset.filename, status: "fetch_failed", detail: `HTTP ${response.status}` });
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      if (buffer.byteLength === 0) {
        results.push({ id: asset.id, filename: asset.filename, status: "empty_file" });
        continue;
      }

      const contentType = response.headers.get("content-type") || asset.contentType || "application/octet-stream";
      const pathname = `ebooks-migrated/${asset.id}-${asset.filename.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const blobUrl = await uploadPrivateBlob(pathname, buffer, contentType);

      // Verification de relecture avant de toucher a la base — jamais de
      // pointeur mis a jour vers un fichier dont on n'a pas confirme
      // l'integrite.
      const verify = await getPrivateBlobStream(blobUrl);
      const reader = verify.stream.getReader();
      let verifiedBytes = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) verifiedBytes += value.byteLength;
      }

      if (verifiedBytes !== buffer.byteLength) {
        results.push({
          id: asset.id,
          filename: asset.filename,
          status: "verification_mismatch",
          detail: `expected ${buffer.byteLength}, got ${verifiedBytes}`,
        });
        continue;
      }

      await prisma.digitalAsset.update({
        where: { id: asset.id },
        data: {
          provider: "VERCEL_BLOB",
          bucket: "vercel-blob",
          path: blobUrl,
          sizeBytes: buffer.byteLength,
          contentType,
        },
      });

      results.push({
        id: asset.id,
        filename: asset.filename,
        status: "migrated",
        sizeBytes: buffer.byteLength,
        oldPath: asset.path,
        newPath: blobUrl,
      });
    } catch (error) {
      logServerEvent("error", "ebook migration: failed for asset", { error, assetId: asset.id });
      results.push({
        id: asset.id,
        filename: asset.filename,
        status: "error",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}
