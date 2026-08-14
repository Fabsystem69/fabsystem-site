import { z } from "zod";
import { badRequest } from "@/lib/http-errors";

// Validation volontairement légère (retour utilisateur : sauvegarde d'un
// schéma électrique lié à un Project) — nodes/edges viennent de React Flow
// (@xyflow/react), leur forme complète dépend du type de composant et
// évolue avec l'outil (lib/electrical-components/definitions.ts). On
// vérifie juste la structure minimale exploitable (id + position pour un
// nœud, id + source/target pour un câble) et des bornes de taille
// raisonnables, sans figer un schéma de données qui casserait à la
// prochaine évolution de l'éditeur.
const MAX_NODES = 500;
const MAX_EDGES = 2000;

const schemaNodeSchema = z
  .object({
    id: z.string().min(1),
    position: z.object({ x: z.number(), y: z.number() }),
  })
  .passthrough();

const schemaEdgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
  })
  .passthrough();

export const saveProjectSchemaInputSchema = z.object({
  projectName: z.string().trim().min(1).max(120),
  nodes: z.array(schemaNodeSchema).max(MAX_NODES),
  edges: z.array(schemaEdgeSchema).max(MAX_EDGES),
});

export type SaveProjectSchemaPayload = z.infer<typeof saveProjectSchemaInputSchema>;

export function parseSaveProjectSchemaInput(input: unknown): SaveProjectSchemaPayload {
  const parsed = saveProjectSchemaInputSchema.safeParse(input);
  if (!parsed.success) {
    throw badRequest("Invalid schema payload", parsed.error.flatten());
  }
  return parsed.data;
}
