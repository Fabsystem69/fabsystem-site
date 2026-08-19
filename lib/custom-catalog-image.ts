import { badRequest, payloadTooLarge } from "@/lib/http-errors";

// Photo d'un item de catalogue personnalisé (retour utilisateur : "250 Ko
// max") — stockée en base64 directement en base (voir CustomCatalogItem
// dans prisma/schema.prisma), même approche que `Quote.signatureDataUrl`
// (lib/signature-image.ts), juste avec des formats photo classiques plutôt
// que du PNG uniquement. La compression/redimensionnement pour tenir sous
// la limite se fait côté client avant l'envoi (lib/schema-editor/
// image-compress.ts) — ce module ne fait que revalider, jamais confiance
// dans ce que le client prétend avoir déjà fait.
const ACCEPTED_PREFIXES = ["data:image/jpeg;base64,", "data:image/png;base64,", "data:image/webp;base64,"];
export const MAX_CUSTOM_ITEM_IMAGE_BYTES = 250 * 1024;

export function validateCustomItemImageDataUrl(dataUrl: string): void {
  const prefix = ACCEPTED_PREFIXES.find((p) => dataUrl.startsWith(p));
  if (!prefix) {
    throw badRequest("Format d'image non supporté (JPEG, PNG ou WebP uniquement).");
  }

  const base64 = dataUrl.slice(prefix.length);
  const buffer = Buffer.from(base64, "base64");

  if (buffer.length === 0) {
    throw badRequest("Image vide.");
  }

  if (buffer.length > MAX_CUSTOM_ITEM_IMAGE_BYTES) {
    throw payloadTooLarge("L'image dépasse 250 Ko.");
  }
}
