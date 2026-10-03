import { z } from "zod";
import { isoDate, NOTE_IMAGE_MEDIA_TYPES, MAX_NOTE_IMAGE_BASE64_LENGTH, MAX_NOTE_IMAGES, MAX_NOTE_TEXT_LENGTH, optionalText } from "@/lib/crm/notes-contract";

// Compte rendu d'un echange avec un dossier DEJA identifie (client coaching
// ou prospect) — distinct du flux "nouveaux contacts" (notes-contract.ts).
// Partage entre l'extraction IA, la relecture et l'enregistrement.

export const ACTION_RESPONSIBLES = ["COACH", "CLIENT"] as const;
export const ACTION_ORIGINS = ["NOTES", "SUGGESTION"] as const;
export const SOURCE_KINDS = ["photos", "text", "mixed"] as const;

const shortText = (max: number) => z.string().trim().min(1).max(max);

// Une origine inconnue ou absente est traitee comme une SUGGESTION : on ne
// presente jamais comme un engagement pris ce que les notes ne disent pas.
export const actionDraftSchema = z.object({
  label: shortText(300),
  responsible: z.enum(ACTION_RESPONSIBLES).catch("COACH"),
  dueDate: isoDate,
  dueDateText: optionalText(80),
  origin: z.enum(ACTION_ORIGINS).catch("SUGGESTION"),
});

export type ActionDraft = z.infer<typeof actionDraftSchema>;

// Les elements d'une liste mal formes sont ecartes plutot que de faire
// echouer tout le compte rendu.
const lenientList = (max: number, itemMax: number) =>
  z
    .array(z.unknown())
    .max(max)
    .default([])
    .transform((items) =>
      items.flatMap((item) => {
        const parsed = shortText(itemMax).safeParse(item);
        return parsed.success ? [parsed.data] : [];
      })
    );

export const meetingExtractionSchema = z.object({
  summary: shortText(4000),
  newInfo: lenientList(20, 400),
  decisions: lenientList(20, 400),
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
  nextMeetingTopics: lenientList(20, 300),
  uncertainties: lenientList(20, 300),
  mentionedPeople: lenientList(10, 120),
});

export type MeetingExtraction = z.infer<typeof meetingExtractionSchema>;

export const meetingExtractRequestSchema = z
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
    exchangeDate: isoDate.refine((value) => value !== null, "Date de l'échange requise."),
    targetKind: z.enum(["coaching_project", "prospect"]),
    targetId: z.string().trim().min(1),
  })
  .refine((value) => value.text.length > 0 || value.images.length > 0, {
    message: "Ajoutez du texte ou au moins une photo.",
  });

export type MeetingExtractRequest = z.infer<typeof meetingExtractRequestSchema>;

export const meetingTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("coaching_project"), projectId: z.string().trim().min(1) }),
  z.object({ kind: z.literal("prospect"), prospectId: z.string().trim().min(1) }),
]);

export type MeetingTarget = z.infer<typeof meetingTargetSchema>;

// Ce que Fabien a relu, corrige et coche : seuls les elements conserves
// sont envoyes. `submissionKey` est genere une fois par proposition et
// rejoue tel quel a chaque nouvelle tentative (idempotence).
export const meetingCommitSchema = z.object({
  submissionKey: z.string().uuid(),
  target: meetingTargetSchema,
  exchangeDate: isoDate.refine((value) => value !== null, "Date de l'échange requise."),
  channel: z.string().trim().min(1).max(40).default("Échange"),
  durationMinutes: z.number().int().min(1).max(480).default(5),
  summary: shortText(4000),
  newInfo: z.array(shortText(400)).max(20).default([]),
  decisions: z.array(shortText(400)).max(20).default([]),
  actions: z.array(actionDraftSchema.extend({ dueDateText: z.string().max(80).nullish() })).max(30).default([]),
  nextMeetingTopics: z.array(shortText(300)).max(20).default([]),
  uncertainties: z.array(shortText(300)).max(20).default([]),
  source: z.object({
    kind: z.enum(SOURCE_KINDS),
    photoCount: z.number().int().min(0).max(MAX_NOTE_IMAGES),
  }),
});

export type MeetingCommit = z.infer<typeof meetingCommitSchema>;
