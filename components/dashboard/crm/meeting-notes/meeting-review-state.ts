import { meetingCommitSchema, type ActionDraft, type MeetingExtraction, type MeetingTarget } from "@/lib/crm/meeting-notes-contract";

// Etat editable de la proposition : chaque ligne porte un `include` (case a
// cocher) et un `id` stable pour les cles React. Toujours copie, jamais mute.

export type ReviewLine = { id: string; text: string; include: boolean };
export type ReviewAction = { id: string; include: boolean } & ActionDraft;
export type SourceInfo = { kind: "photos" | "text" | "mixed"; photoCount: number };

export type ReviewState = {
  summary: string;
  channel: string;
  durationMinutes: string;
  newInfo: ReviewLine[];
  decisions: ReviewLine[];
  nextMeetingTopics: ReviewLine[];
  uncertainties: ReviewLine[];
  actions: ReviewAction[];
  source: SourceInfo;
};

export const CHANNELS = ["Téléphone", "Visio", "WhatsApp", "En personne", "Autre"] as const;

const newId = () => crypto.randomUUID();

export const newLine = (text = ""): ReviewLine => ({ id: newId(), text, include: true });

export const newAction = (): ReviewAction => ({
  id: newId(),
  include: true,
  label: "",
  responsible: "COACH",
  dueDate: null,
  dueDateText: null,
  origin: "NOTES",
});

const toLines = (items: readonly string[]) => items.map((text) => newLine(text));

export function sourceKindOf(hasText: boolean, photoCount: number): SourceInfo {
  const kind = photoCount > 0 ? (hasText ? "mixed" : "photos") : "text";
  return { kind, photoCount };
}

// Les actions issues des notes sont cochees ; les suggestions IA ne le sont
// jamais par defaut.
export function reviewFromExtraction(extraction: MeetingExtraction, source: SourceInfo): ReviewState {
  return {
    summary: extraction.summary,
    channel: CHANNELS[0],
    durationMinutes: "5",
    newInfo: toLines(extraction.newInfo),
    decisions: toLines(extraction.decisions),
    nextMeetingTopics: toLines(extraction.nextMeetingTopics),
    uncertainties: toLines(extraction.uncertainties),
    actions: extraction.actions.map((action) => ({ ...action, id: newId(), include: action.origin === "NOTES" })),
    source,
  };
}

const kept = (lines: readonly ReviewLine[]) => lines.filter((line) => line.include && line.text.trim()).map((line) => line.text.trim());

export type CommitContext = { submissionKey: string; target: MeetingTarget; exchangeDate: string };

// Construit puis valide le compte rendu ; retourne le premier message d'erreur
// en cas d'echec (aucun appel serveur n'est fait dans ce cas).
export function buildValidatedCommit(review: ReviewState, context: CommitContext) {
  const duration = Number(review.durationMinutes);
  if (!review.summary.trim()) return { ok: false as const, error: "Le résumé ne peut pas être vide." };
  if (!Number.isInteger(duration) || duration < 1 || duration > 480) {
    return { ok: false as const, error: "La durée doit être un nombre entier de minutes (1 à 480)." };
  }

  const parsed = meetingCommitSchema.safeParse({
    ...context,
    channel: review.channel,
    durationMinutes: duration,
    summary: review.summary,
    newInfo: kept(review.newInfo),
    decisions: kept(review.decisions),
    nextMeetingTopics: kept(review.nextMeetingTopics),
    uncertainties: kept(review.uncertainties),
    actions: review.actions
      .filter((action) => action.include)
      .map((action) => ({
        label: action.label,
        responsible: action.responsible,
        dueDate: action.dueDate || null,
        dueDateText: action.dueDateText,
        origin: action.origin,
      })),
    source: review.source,
  });

  return parsed.success
    ? { ok: true as const, commit: parsed.data }
    : { ok: false as const, error: parsed.error.issues[0]?.message ?? "Compte rendu invalide." };
}
