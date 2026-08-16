import { z } from "zod";
import { badRequest } from "@/lib/http-errors";
import { projectStarterSchema } from "@/lib/project-starter-contract";

// Valeurs alignées sur ProjectAssetType / ProjectVoltage (prisma/schema.prisma).
// Aucune valeur de tension par défaut inventée : "Je ne sais pas" = UNKNOWN
// explicite (MASTER-06 §9).
export const projectAssetTypeSchema = z.enum(["BOAT", "VAN", "MOTORHOME", "OTHER"]);
export const projectVoltageSchema = z.enum(["V12", "V24", "UNKNOWN"]);

export const createProjectInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  assetType: projectAssetTypeSchema,
  voltage: projectVoltageSchema,
  starter: projectStarterSchema.optional(),
});

// Création manuelle Admin (MASTER-04 §4) : le customerId cible est fourni
// explicitement, il n'est jamais déduit d'une session client.
export const adminCreateProjectInputSchema = createProjectInputSchema.extend({
  customerId: z.string().trim().min(1),
});

export const updateProjectInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    assetType: projectAssetTypeSchema.optional(),
    voltage: projectVoltageSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

// Confirmation explicite obligatoire pour toute suppression (MASTER-06 §15).
export const confirmDeletionInputSchema = z.object({
  confirm: z.literal(true),
});

export type CreateProjectPayload = z.infer<typeof createProjectInputSchema>;
export type AdminCreateProjectPayload = z.infer<typeof adminCreateProjectInputSchema>;
export type UpdateProjectPayload = z.infer<typeof updateProjectInputSchema>;

export function parseCreateProjectInput(input: unknown): CreateProjectPayload {
  const parsed = createProjectInputSchema.safeParse(input);

  if (!parsed.success) {
    throw badRequest("Invalid project payload", parsed.error.flatten());
  }

  return parsed.data;
}

export function parseAdminCreateProjectInput(input: unknown): AdminCreateProjectPayload {
  const parsed = adminCreateProjectInputSchema.safeParse(input);

  if (!parsed.success) {
    throw badRequest("Invalid project payload", parsed.error.flatten());
  }

  return parsed.data;
}

export function parseUpdateProjectInput(input: unknown): UpdateProjectPayload {
  const parsed = updateProjectInputSchema.safeParse(input);

  if (!parsed.success) {
    throw badRequest("Invalid project payload", parsed.error.flatten());
  }

  return parsed.data;
}

export function parseConfirmDeletionInput(input: unknown): { confirm: true } {
  const parsed = confirmDeletionInputSchema.safeParse(input);

  if (!parsed.success) {
    throw badRequest("Explicit confirmation is required", parsed.error.flatten());
  }

  return parsed.data;
}
