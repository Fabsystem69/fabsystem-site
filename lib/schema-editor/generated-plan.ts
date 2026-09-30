import { z } from "zod";

// Format d'échange entre l'IA de génération (lib/services/schema-ai-generate.ts)
// et le store (useSchemaStore.ts, insertGeneratedPlan) : des clés logiques
// (jamais d'id réel, jamais de position absolue), au même principe que
// PlannedComponent/PlannedEdge dans lib/schema-editor/guided-install/solar.ts
// (assistant solaire guidé) — mais ce type-ci reste volontairement
// indépendant de ce fichier : deux origines différentes (IA vs wizard à
// boutons) qui ne doivent pas se recoupler si l'une évolue.
// `dataOverride` est entièrement contrôlé par l'IA (pas de liste de clés
// fermée — les champs varient par type de composant) : sans ce refine,
// `dataOverride: { componentType: "...", label: "..." }` pourrait faire
// atterrir sur le canevas un type/libellé DIFFÉRENT de celui validé contre
// le catalogue et affiché dans la carte de preview — la proposition
// approuvée par l'admin ne serait plus garantie être celle réellement
// posée. Revue de sécurité du 30/09/2026.
const RESERVED_DATA_OVERRIDE_KEYS = ["componentType", "label"] as const;

export const plannedComponentSchema = z.object({
  key: z.string().min(1).max(60),
  type: z.string().min(1).max(60),
  label: z.string().min(1).max(120),
  dataOverride: z
    .record(z.string(), z.unknown())
    .default({})
    .refine((value) => Object.keys(value).length <= 40, "dataOverride contient trop de champs")
    .refine(
      (value) => RESERVED_DATA_OVERRIDE_KEYS.every((key) => !(key in value)),
      "dataOverride ne peut pas redéfinir componentType ou label"
    ),
  offsetX: z.number(),
  offsetY: z.number(),
});

export const plannedEdgeSchema = z.object({
  sourceKey: z.string().min(1).max(60),
  sourceHandle: z.string().min(1).max(60),
  targetKey: z.string().min(1).max(60),
  targetHandle: z.string().min(1).max(60),
});

// Bornes de taille généreuses mais finies : un plan ne doit jamais pouvoir
// faire exploser le canevas (ni le coût d'un appel IA qui dérape).
// Contrôles croisés ajoutés en revue de sécurité du 30/09/2026 (repro réels
// en test) :
// - clés de composant en doublon : sans ce contrôle, le premier composant
//   reste posé sur le canevas mais orphelin (plus aucun câble ne peut s'y
//   attacher, `keyToId` et la validation ne gardent que le dernier par clé).
// - câble qui relie un composant à lui-même, ou deux câbles strictement
//   identiques : passaient tous les contrôles existants (les deux bouts
//   résolvent bien), posaient un câble absurde ou en double sur le canevas.
// - décalages (`offsetX`/`offsetY`) hors des dimensions de la zone : la
//   notion de zone de ce schéma est géométrique (voir
//   lib/schema-editor/auto-layout.ts, `findZoneForNode`) — un composant
//   posé hors du rectangle de sa propre zone n'en fait pas vraiment partie,
//   et un décalage négatif assez grand peut même le faire atterrir sur le
//   schéma déjà existant (l'ancre de la zone est calculée à `maxX + 120` à
//   droite de tout ce qui existe), cassant la garantie "toujours à côté,
//   jamais par-dessus".
export const generatedSchemaPlanSchema = z
  .object({
    zoneLabel: z.string().min(1).max(80),
    zoneWidth: z.number().min(200).max(4000),
    zoneHeight: z.number().min(150).max(4000),
    components: z.array(plannedComponentSchema).min(1).max(40),
    edges: z.array(plannedEdgeSchema).max(200),
  })
  .superRefine((plan, ctx) => {
    const keys = plan.components.map((c) => c.key);
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({ code: "custom", message: "des composants du plan partagent la même clé" });
    }

    for (const component of plan.components) {
      if (component.offsetX < 0 || component.offsetX > plan.zoneWidth || component.offsetY < 0 || component.offsetY > plan.zoneHeight) {
        ctx.addIssue({ code: "custom", message: `« ${component.label} » est positionné hors des dimensions de la zone` });
      }
    }

    const edgeSignatures = new Set<string>();
    for (const edge of plan.edges) {
      if (edge.sourceKey === edge.targetKey) {
        ctx.addIssue({ code: "custom", message: `un câble relie « ${edge.sourceKey} » à lui-même` });
        continue;
      }
      const signature = `${edge.sourceKey}:${edge.sourceHandle}->${edge.targetKey}:${edge.targetHandle}`;
      if (edgeSignatures.has(signature)) {
        ctx.addIssue({ code: "custom", message: "deux câbles identiques sont proposés en double" });
        continue;
      }
      edgeSignatures.add(signature);
    }
  });

export type PlannedComponent = z.infer<typeof plannedComponentSchema>;
export type PlannedEdge = z.infer<typeof plannedEdgeSchema>;
export type GeneratedSchemaPlan = z.infer<typeof generatedSchemaPlanSchema>;
