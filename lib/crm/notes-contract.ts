import { z } from "zod";

// Contrat partage entre l'extraction IA (lib/services/crm-notes-extract.ts),
// la route /api/dashboard/crm/notes-extract, le formulaire de relecture et
// l'application finale (lib/services/crm-notes-apply.ts). Les valeurs
// d'enum reflètent prisma ProspectSource / ProspectStatus sans les importer,
// pour rester utilisable côté client.
export const PROSPECT_SOURCES = [
  "MESSENGER",
  "PAGE_FACEBOOK",
  "GROUPE_FACEBOOK",
  "COMMENTAIRE",
  "PUBLICITE",
  "SITE_WEB",
  "AUTRE",
] as const;

export const PROSPECT_STATUSES = [
  "NOUVEAU",
  "EN_DISCUSSION",
  "COACHING_PROPOSE",
  "RESERVE",
  "GAGNE",
  "SANS_SUITE",
] as const;

export const MAX_NOTE_IMAGES = 5;
export const MAX_NOTE_TEXT_LENGTH = 12000;
// ~1,5 Mo de base64 par photo : le client redimensionne avant l'envoi.
export const MAX_NOTE_IMAGE_BASE64_LENGTH = 2_000_000;
export const NOTE_IMAGE_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null));

// Une adresse mal lue sur du manuscrit ne doit pas faire échouer toute
// l'extraction : elle est simplement ignorée et le champ reste vide.
const lenientEmail = z
  .string()
  .trim()
  .toLowerCase()
  .nullish()
  .transform((value) => (value && z.string().email().safeParse(value).success ? value : null));

export const isoDate = z
  .string()
  .trim()
  .nullish()
  .transform((value) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null));

export const extractedEntrySchema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: optionalText(40),
  email: lenientEmail,
  source: z.enum(PROSPECT_SOURCES).catch("AUTRE"),
  besoinElectricite: optionalText(2000),
  notes: optionalText(4000),
  status: z.enum(PROSPECT_STATUSES).catch("NOUVEAU"),
  nextAction: optionalText(300),
  nextActionDate: isoDate,
});

export type ExtractedEntry = z.infer<typeof extractedEntrySchema>;

export const extractionResultSchema = z.object({
  entries: z.array(extractedEntrySchema).max(20),
  warnings: z.array(z.string().trim().max(300)).max(20).default([]),
});

export type ExtractionResult = z.infer<typeof extractionResultSchema>;

export const extractRequestSchema = z
  .object({
    text: z.string().trim().max(MAX_NOTE_TEXT_LENGTH).default(""),
    images: z
      .array(
        z.object({
          mediaType: z.enum(NOTE_IMAGE_MEDIA_TYPES),
          data: z.string().min(1).max(MAX_NOTE_IMAGE_BASE64_LENGTH),
        })
      )
      .max(MAX_NOTE_IMAGES)
      .default([]),
  })
  .refine((value) => value.text.length > 0 || value.images.length > 0, {
    message: "Ajoutez du texte ou au moins une photo.",
  });

export type ExtractRequest = z.infer<typeof extractRequestSchema>;

export const applyEntrySchema = extractedEntrySchema.extend({
  mode: z.enum(["create", "append", "skip"]),
  prospectId: z.string().trim().min(1).optional(),
});

export type ApplyEntry = z.infer<typeof applyEntrySchema>;

export const applyRequestSchema = z.array(applyEntrySchema).min(1).max(20);
