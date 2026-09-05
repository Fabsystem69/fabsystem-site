import { z } from "zod";
import { isPrestationsOfferSlug } from "@/lib/prestations-offers";
import { isPrestationsPackSlug } from "@/lib/prestations-packs";

// Module pur (pas de "server-only") : partagé entre le formulaire client
// (/panier/projet), la validation serveur (checkout) et la construction de
// l'email de notification à Fabien.

// Avant Phase 3 (refonte suivi accompagnement), seul "pack-" declenchait le
// formulaire de besoin — les 3 offres "accompagnement-" (conseil/guide/
// conception) passaient en caisse sans aucune prise de besoin ni numero
// WhatsApp. Ce predicat est desormais le SEUL point de decision "faut-il le
// formulaire ?", partage par PrestationsNeedsForm, CheckoutForm et
// lib/services/checkout.ts — ne jamais retester isPrestationsPackSlug seul
// pour cette question.
export function requiresNeedsIntake(slug: string) {
  return isPrestationsPackSlug(slug) || isPrestationsOfferSlug(slug);
}

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

// Format international large (E.164 assoupli) : "+" puis 8 à 15 chiffres,
// espaces/points/tirets tolérés à la saisie et retirés avant validation —
// le lien wa.me (Phase 5/6) exige des chiffres purs, jamais de séparateurs.
const WHATSAPP_PATTERN = /^\+[1-9]\d{7,14}$/;

export function normalizeWhatsappNumber(value: string) {
  return value.replace(/[\s.\-()]/g, "");
}

const whatsappSchema = z
  .string()
  .trim()
  .transform(normalizeWhatsappNumber)
  .refine((value) => WHATSAPP_PATTERN.test(value), {
    message: "Numéro WhatsApp invalide — format international requis, ex. +33612345678.",
  });

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
  whatsapp: whatsappSchema,
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
    whatsapp: z.string().trim().max(MAX_FIELD_LENGTH).optional(),
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
