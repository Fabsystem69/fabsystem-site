import { z } from "zod";

// Module pur (pas de "server-only") : partagé entre le formulaire client
// (/panier/projet), la validation serveur (checkout) et la construction de
// l'email de notification à Fabien.

export const PRESTATIONS_NEEDS_PROGRESS_VALUES = [
  "not_started",
  "in_progress",
  "advanced",
] as const;

export type PrestationsNeedsProgress = (typeof PRESTATIONS_NEEDS_PROGRESS_VALUES)[number];

export const PRESTATIONS_NEEDS_PROGRESS_LABELS: Record<PrestationsNeedsProgress, string> = {
  not_started: "Pas commencé",
  in_progress: "En cours",
  advanced: "Déjà avancé",
};

// Marge sous la limite Stripe (500 caractères par valeur de metadata) pour
// laisser de la place à un eventuel prefixe/suffixe ajoute plus tard.
const MAX_FIELD_LENGTH = 480;

export const prestationsNeedsAnswersSchema = z.object({
  vehicle: z.string().trim().min(1, "Le type de véhicule est requis").max(MAX_FIELD_LENGTH),
  description: z
    .string()
    .trim()
    .min(1, "La description du projet est requise")
    .max(MAX_FIELD_LENGTH),
  progress: z.enum(PRESTATIONS_NEEDS_PROGRESS_VALUES),
  deadline: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
  other: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
});

export type PrestationsNeedsAnswers = z.infer<typeof prestationsNeedsAnswersSchema>;

// Version tolérante utilisée à la frontière HTTP (/api/checkout) : le champ
// peut être totalement absent (panier sans pack) ou invalide (on renvoie
// alors une erreur métier explicite plutôt qu'une 400 générique de parsing).
export const prestationsNeedsAnswersInputSchema = z
  .object({
    vehicle: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
    description: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
    progress: z.string().trim().max(50).optional(),
    deadline: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
    other: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
  })
  .optional();

export type PrestationsNeedsAnswersInput = z.infer<typeof prestationsNeedsAnswersInputSchema>;

export function parsePrestationsNeedsAnswers(
  input: PrestationsNeedsAnswersInput
): PrestationsNeedsAnswers | null {
  if (!input) {
    return null;
  }

  const parsed = prestationsNeedsAnswersSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}
