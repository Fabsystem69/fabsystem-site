import "server-only";

import { badRequest } from "@/lib/http-errors";
import { deletePrivateBlob, getPrivateBlobStream, uploadPrivateBlob } from "@/lib/server/vercel-blob-storage";

// Vercel Blob plutot que Supabase (retour utilisateur : pause automatique
// des projets Supabase gratuits apres 7 jours d'inactivite — gênant pour un
// stockage dont depend le client). Le store Vercel Blob de ce projet est
// configure en acces PRIVATE (pas 'public') : aucune URL fetchable
// directement par le navigateur. L'acces passe donc par des routes serveur
// qui verifient la session (admin ou client proprietaire) puis relaient le
// contenu via getPrivateBlobStream() — meme garantie de securite que les
// URLs signees Supabase, appliquee au niveau application plutot que
// stockage. Voir app/api/dossiers/documents/[documentId]/route.ts et
// app/api/internal/dossiers/documents/[documentId]/route.ts.
//
// Operations Vercel Blob generiques dans lib/server/vercel-blob-storage.ts,
// partagees avec la migration des ebooks (lib/services/download-access.ts).

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
  const url = await uploadPrivateBlob(pathname, input.buffer, input.contentType);

  // "bucket" reste "vercel-blob" (marqueur, coherent avec le champ existant
  // DossierDocument.bucket) ; "path" stocke l'URL complete Vercel Blob —
  // necessaire pour get()/del() ensuite, jamais fetchable telle quelle par
  // un navigateur (store prive).
  return { bucket: "vercel-blob", path: url };
}

export async function getDossierDocumentStream(path: string) {
  return getPrivateBlobStream(path);
}

export async function deleteDossierDocumentFile(path: string) {
  await deletePrivateBlob(path);
}
