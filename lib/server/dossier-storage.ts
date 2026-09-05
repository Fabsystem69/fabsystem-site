import "server-only";

import { del, get, put } from "@vercel/blob";
import { badRequest, notFound } from "@/lib/http-errors";

// Vercel Blob plutot que Supabase (retour utilisateur : pause automatique
// des projets Supabase gratuits apres 7 jours d'inactivite — gênant pour un
// stockage dont depend le client). Le store Vercel Blob de ce projet est
// configure en acces PRIVATE (pas 'public') : aucune URL fetchable
// directement par le navigateur. L'acces passe donc par des routes serveur
// qui verifient la session (admin ou client proprietaire) puis relaient le
// contenu via `get(url, { access: "private" })` — meme garantie de securite
// que les URLs signees Supabase, appliquee au niveau application plutot que
// stockage. Voir app/api/dossiers/documents/[documentId]/route.ts et
// app/api/internal/dossiers/documents/[documentId]/route.ts.
//
// Ebooks (lib/supabase-storage.ts) restent sur Supabase pour l'instant —
// migration separee si besoin, hors perimetre ici.

// Plan Supabase gratuit ecarte, mais les plafonds bas restent valables
// (Vercel Blob gratuit = 1 Go egalement) : 2 Mo/fichier, 8 Mo cumules/dossier.
const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024;
export const DOSSIER_STORAGE_QUOTA_BYTES = 8 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export function validateDossierUpload(file: { size: number; type: string }) {
  if (file.size <= 0) throw badRequest("Fichier vide.");
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw badRequest(`Fichier trop volumineux (max ${MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)} Mo).`);
  }
  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    throw badRequest("Format non accepté — PDF, PNG, JPEG ou WEBP uniquement.");
  }
}

function buildBlobPathname(dossierId: string, filename: string) {
  const safeName = filename
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .toLowerCase();
  return `dossiers/${dossierId}/${Date.now()}-${safeName}`;
}

export async function uploadDossierDocument(input: {
  dossierId: string;
  filename: string;
  contentType: string;
  buffer: Buffer;
}) {
  validateDossierUpload({ size: input.buffer.byteLength, type: input.contentType });

  const pathname = buildBlobPathname(input.dossierId, input.filename);
  const blob = await put(pathname, input.buffer, {
    access: "private",
    contentType: input.contentType,
    addRandomSuffix: true,
  });

  // "bucket" reste "vercel-blob" (marqueur, coherent avec le champ existant
  // DossierDocument.bucket) ; "path" stocke l'URL complete Vercel Blob —
  // necessaire pour get()/del() ensuite, jamais fetchable telle quelle par
  // un navigateur (store prive).
  return { bucket: "vercel-blob", path: blob.url };
}

export async function getDossierDocumentStream(path: string) {
  const result = await get(path, { access: "private" });
  if (!result || result.statusCode !== 200) {
    throw notFound("Document introuvable dans le stockage.");
  }
  return { stream: result.stream, contentType: result.blob.contentType, size: result.blob.size };
}

export async function deleteDossierDocumentFile(path: string) {
  await del(path);
}
