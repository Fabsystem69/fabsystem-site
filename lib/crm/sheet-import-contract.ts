import { z } from "zod";
import { actionDraftSchema } from "@/lib/crm/meeting-notes-contract";
import { isoDate, MAX_NOTE_IMAGE_BASE64_LENGTH, MAX_NOTE_IMAGES, NOTE_IMAGE_MEDIA_TYPES } from "@/lib/crm/notes-contract";

// Import d'une fiche de decouverte MANUSCRITE (photo) : l'IA lit, Fabien
// relit et valide (docs/17). Les cles de champs sont celles de
// lib/crm/discovery-sheet-spec.ts. Regle d'or : un champ vide ou illisible
// ne propose JAMAIS d'effacer une valeur enregistree.

export const FIELD_READ_STATES = ["READ", "ILLEGIBLE", "EMPTY"] as const;
export const DEVICE_POWER_SUPPLIES = ["DC12", "DC24", "DC_AUTRE", "USB", "AC230", "INCONNU"] as const;

const text = (max: number) => z.string().trim().max(max);
const nullableText = (max: number) =>
  text(max)
    .nullish()
    .transform((value) => (value ? value : null));

// Sortie brute de l'IA. Un etat inconnu est traite comme ILLEGIBLE : par
// prudence, ce qui n'est pas clairement lu ne modifie rien.
export const extractedFieldSchema = z.object({
  key: text(80).min(1),
  state: z.enum(FIELD_READ_STATES).catch("ILLEGIBLE"),
  value: nullableText(2000),
});

export const extractedDeviceSchema = z.object({
  name: text(120).min(1),
  quantity: z.number().int().min(1).max(99).catch(1),
  powerSupply: z.enum(DEVICE_POWER_SUPPLIES).catch("INCONNU"),
  duration: nullableText(80),
  remark: nullableText(200),
});

export const extractedCoachSchema = z.object({
  observations: nullableText(4000),
  pointsToCheck: z.array(z.unknown()).max(20).default([]).transform(keepStrings(300)),
  decisions: z.array(z.unknown()).max(20).default([]).transform(keepStrings(300)),
  actions: z
    .array(z.unknown())
    .max(30)
    .default([])
    .transform((items) =>
      items.flatMap((item) => {
        const parsed = actionDraftSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      })
    ),
});

function keepStrings(max: number) {
  return (items: unknown[]) =>
    items.flatMap((item) => {
      const parsed = text(max).min(1).safeParse(item);
      return parsed.success ? [parsed.data] : [];
    });
}

// Elements mal formes ecartes un par un, jamais toute la lecture.
function lenient<T extends z.ZodTypeAny>(schema: T, max: number) {
  return z
    .array(z.unknown())
    .max(max)
    .default([])
    .transform((items) =>
      items.flatMap((item) => {
        const parsed = schema.safeParse(item);
        return parsed.success ? [parsed.data as z.infer<T>] : [];
      })
    );
}

export const sheetExtractionSchema = z.object({
  fields: lenient(extractedFieldSchema, 200),
  devices: lenient(extractedDeviceSchema, 30),
  coach: extractedCoachSchema.default({ observations: null, pointsToCheck: [], decisions: [], actions: [] }),
  uncertainties: z.array(z.unknown()).max(30).default([]).transform(keepStrings(300)),
  mentionedPeople: z.array(z.unknown()).max(10).default([]).transform(keepStrings(120)),
});

export type SheetExtraction = z.infer<typeof sheetExtractionSchema>;
export type ExtractedField = z.infer<typeof extractedFieldSchema>;
export type ExtractedDevice = z.infer<typeof extractedDeviceSchema>;

export const sheetExtractRequestSchema = z.object({
  images: z
    .array(
      z.object({
        mediaType: z.enum(NOTE_IMAGE_MEDIA_TYPES),
        data: z.string().min(1).max(MAX_NOTE_IMAGE_BASE64_LENGTH),
      })
    )
    .min(1, "Ajoutez au moins une photo de la fiche.")
    .max(MAX_NOTE_IMAGES),
  exchangeDate: isoDate.refine((value) => value !== null, "Date de l'échange requise."),
  projectId: z.string().trim().min(1),
});

export type SheetExtractRequest = z.infer<typeof sheetExtractRequestSchema>;

// --- Proposition envoyee a l'interface (calculee cote serveur) -------------

export type ProposedChange = {
  fieldKey: string;
  sectionId: string;
  sectionTitle: string;
  label: string;
  kind: "NEW" | "CHANGE"; // NEW = champ vide aujourd'hui ; CHANGE = contredit une valeur existante
  current: string | null;
  proposed: string;
  defaultChecked: boolean; // NEW coche, CHANGE decoche (contradiction signalee, jamais resolue d'office)
};

export type UnreadField = {
  fieldKey: string;
  label: string;
  reason: "ILLEGIBLE" | "EMPTY" | "INVALID_CHOICE" | "UNKNOWN_KEY";
  current: string | null; // valeur conservee, inchangee
};

export type ProposedDevice = {
  name: string;
  quantity: number;
  powerSupply: (typeof DEVICE_POWER_SUPPLIES)[number];
  duration: string | null;
  remark: string | null;
  alreadyExists: boolean; // meme nom deja present sur le projet : decoche par defaut
};

export type SheetProposal = {
  changes: ProposedChange[];
  sameCount: number; // lus et identiques a l'existant (rien a faire)
  unread: UnreadField[];
  devices: ProposedDevice[];
  coach: SheetExtraction["coach"];
  uncertainties: string[];
  warnings: string[];
};

// --- Validation (interface -> serveur) -------------------------------------

export const sheetCommitSchema = z.object({
  submissionKey: z.string().uuid(),
  projectId: z.string().trim().min(1),
  exchangeDate: isoDate.refine((value) => value !== null, "Date de l'échange requise."),
  // Uniquement les champs COCHES, eventuellement corriges par Fabien.
  fields: z.array(z.object({ fieldKey: text(80).min(1), value: text(2000).min(1) })).max(200).default([]),
  devices: z
    .array(
      z.object({
        name: text(120).min(1),
        quantity: z.number().int().min(1).max(99),
        powerSupply: z.enum(DEVICE_POWER_SUPPLIES),
        duration: nullableText(80),
        remark: nullableText(200),
      })
    )
    .max(30)
    .default([]),
  coach: z
    .object({
      observations: nullableText(4000),
      pointsToCheck: z.array(text(300).min(1)).max(20).default([]),
      decisions: z.array(text(300).min(1)).max(20).default([]),
      actions: z.array(actionDraftSchema.extend({ dueDateText: z.string().max(80).nullish() })).max(30).default([]),
    })
    .default({ observations: null, pointsToCheck: [], decisions: [], actions: [] }),
  photoCount: z.number().int().min(0).max(MAX_NOTE_IMAGES),
});

export type SheetCommit = z.infer<typeof sheetCommitSchema>;
