import "server-only";

import { del, get, put } from "@vercel/blob";
import { notFound } from "@/lib/http-errors";

// Operations Vercel Blob generiques (store prive), partagees entre
// lib/server/dossier-storage.ts (documents de dossier d'accompagnement) et
// la migration/livraison des ebooks (lib/services/download-access.ts,
// lib/services/customer-resource-access.ts) — un seul point d'integration
// avec le SDK @vercel/blob.

export async function uploadPrivateBlob(pathname: string, buffer: Buffer, contentType: string) {
  const blob = await put(pathname, buffer, {
    access: "private",
    contentType,
    addRandomSuffix: true,
  });
  return blob.url;
}

export async function getPrivateBlobStream(url: string) {
  const result = await get(url, { access: "private" });
  if (!result || result.statusCode !== 200) {
    throw notFound("Fichier introuvable dans le stockage.");
  }
  return { stream: result.stream, contentType: result.blob.contentType, size: result.blob.size };
}

export async function deletePrivateBlob(url: string) {
  await del(url);
}
