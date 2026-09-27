import "server-only";

import { badRequest } from "@/lib/http-errors";
import { deletePrivateBlob, getPrivateBlobStream, uploadPrivateBlob } from "@/lib/server/vercel-blob-storage";

// Meme pattern que lib/server/dossier-storage.ts (store Vercel Blob prive,
// jamais fetchable directement par le navigateur), applique aux documents
// d'un CoachingProject (photos/plans/documents du CRM coaching) — voir
// app/api/internal/coaching-projects/documents/[documentId]/route.ts.
const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024;
export const COACHING_PROJECT_STORAGE_QUOTA_BYTES = 8 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export function validateCoachingProjectUpload(file: { size: number; type: string }) {
  if (file.size <= 0) throw badRequest("Fichier vide.");
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw badRequest(`Fichier trop volumineux (max ${MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)} Mo).`);
  }
  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    throw badRequest("Format non accepté — PDF, PNG, JPEG ou WEBP uniquement.");
  }
}

function buildBlobPathname(projectId: string, filename: string) {
  const safeName = filename
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .toLowerCase();
  return `coaching-projects/${projectId}/${Date.now()}-${safeName}`;
}

export async function uploadCoachingProjectDocument(input: {
  projectId: string;
  filename: string;
  contentType: string;
  buffer: Buffer;
}) {
  validateCoachingProjectUpload({ size: input.buffer.byteLength, type: input.contentType });

  const pathname = buildBlobPathname(input.projectId, input.filename);
  const url = await uploadPrivateBlob(pathname, input.buffer, input.contentType);

  return { bucket: "vercel-blob", path: url };
}

export async function getCoachingProjectDocumentStream(path: string) {
  return getPrivateBlobStream(path);
}

export async function deleteCoachingProjectDocumentFile(path: string) {
  await deletePrivateBlob(path);
}
