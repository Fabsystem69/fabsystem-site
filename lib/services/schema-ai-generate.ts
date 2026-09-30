import { z } from "zod";
import type { Node, Edge } from "@xyflow/react";
import { getAnthropicClient } from "@/lib/server/anthropic";
import { buildSchemaSummaryText } from "@/lib/ai/schema-summary";
import { COMPONENT_DEFINITIONS, getComponentDefinition, getEffectiveHandles } from "@/lib/electrical-components/definitions";
import { getBrandModelsForType } from "@/lib/electrical-components/brand-models";
import { generatedSchemaPlanSchema, type GeneratedSchemaPlan } from "@/lib/schema-editor/generated-plan";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";
import { badRequest } from "@/lib/http-errors";
import type { SchemaAiModelId } from "@/lib/ai/schema-ai-models";

export { SCHEMA_AI_MODELS, type SchemaAiModelId, schemaAiModelSchema } from "@/lib/ai/schema-ai-models";

// Pendant demandé (Fabien, 30/09/2026) : « je veux te demander fait moi un
// schéma... si besoin tu pose les questions principales pour câbler, mais
// de base câble en Victron ». Contrairement à l'évaluation
// (lib/services/schema-ai-chat.ts, jamais ne modifie le schéma), ce service
// PROPOSE un ajout au schéma — toujours sous forme d'un plan structuré
// validé contre le vrai catalogue, jamais du texte libre parsé à la main.
// L'IA garde la liberté de répondre en texte simple pour poser des
// questions de dimensionnement plutôt que d'inventer des valeurs
// (capacité batterie, nombre de panneaux, ampérage du chargeur...) — le
// même appel peut donc renvoyer soit un message, soit un plan.
const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

export type SchemaAiGenerateMessage = z.infer<typeof chatMessageSchema>;

export const schemaAiGenerateMessagesSchema = z.array(chatMessageSchema).min(1).max(40);

export type SchemaGenerationResult =
  | { kind: "message"; text: string }
  | { kind: "plan"; intro: string; plan: GeneratedSchemaPlan };

const PROPOSE_PLAN_TOOL = "propose_schema_plan";

const SYSTEM_PROMPT = `Tu es un assistant technique en électricité embarquée basse tension (12V/24V DC), pour des vans, fourgons, camping-cars et bateaux. Un électricien professionnel te décrit ce qu'il veut ajouter à son schéma (ex. "un van avec panneaux solaires et chargeur DC-DC") — ton rôle est de lui proposer un ajout câblé, jamais de certifier une installation.

Règles impératives :
- Ce que tu proposes est un AVIS de départ, jamais une certification. Ne dis jamais qu'une proposition est "sûre", "conforme" ou "prête à installer".
- Tu ajoutes toujours un bloc AUTONOME (nouvelle zone entièrement câblée en interne) — tu ne modifies JAMAIS le schéma existant et tu ne câbles JAMAIS un composant neuf vers un composant déjà présent : l'utilisateur fera ce raccordement lui-même une fois la zone posée.
- Si une information essentielle au dimensionnement manque (capacité batterie, nombre/puissance des panneaux, ampérage du chargeur DC-DC, tension système 12V/24V, etc.), réponds en TEXTE SIMPLE pour poser la ou les questions nécessaires — n'appelle JAMAIS l'outil ${PROPOSE_PLAN_TOOL} avec des valeurs inventées.
- Une fois les informations suffisantes réunies, appelle l'outil ${PROPOSE_PLAN_TOOL} avec un plan complet et cohérent.
- Quand un modèle de marque doit être choisi (régulateur MPPT, chargeur DC/DC, etc.) et qu'un modèle Victron pertinent existe dans le catalogue fourni, préfère-le par défaut (renseigne son id dans dataOverride.brandModelId ainsi que ses champs "defaults") — sauf si l'utilisateur demande explicitement une autre marque.
- N'utilise QUE les types de composants et les identifiants de bornes listés dans le catalogue fourni ci-dessous. N'invente jamais un type ou une borne qui n'y figure pas.
- Réponds en français, de façon concise et concrète, comme dans une conversation entre professionnels.`;

// Résumé dynamique du vrai catalogue (types + bornes + modèles Victron
// disponibles) — jamais une liste recopiée à la main qui pourrait dériver
// du catalogue réel (lib/electrical-components/definitions.ts).
function buildCatalogBlock(): string {
  const lines = COMPONENT_DEFINITIONS.filter((def) => def.libraryVisible !== false).map((def) => {
    const handleIds = def.handles.map((h) => h.id).join(", ");
    const victronModels = getBrandModelsForType(def.type)
      .filter((m) => m.brand === "Victron")
      .map((m) => `${m.id} (${m.model})`);
    const modelsPart = victronModels.length > 0 ? ` — modèles Victron disponibles : ${victronModels.join(", ")}` : "";
    return `- ${def.type} (${def.label}) : bornes [${handleIds}]${modelsPart}`;
  });
  return `Catalogue de composants disponibles (type -> bornes possibles) :\n${lines.join("\n")}`;
}

// Schéma zod de l'entrée brute de l'outil (le plan + une phrase d'intro à
// afficher dans le chat avant la carte de proposition).
const toolInputSchema = generatedSchemaPlanSchema.extend({
  intro: z.string().min(1).max(500),
});

// Un composant/type inventé ou une borne qui n'existe pas réellement sur le
// composant (avec son dataOverride) est rejeté ICI, avant tout retour au
// client — jamais une proposition à moitié valide appliquée au canevas.
function validatePlanAgainstCatalog(plan: GeneratedSchemaPlan): string[] {
  const errors: string[] = [];
  const keyToComponent = new Map(plan.components.map((c) => [c.key, c]));

  for (const component of plan.components) {
    const def = getComponentDefinition(component.type);
    // `libraryVisible === false` : composant retiré des bibliothèques
    // d'ajout (ex. gardé seulement pour afficher sans perte un ancien
    // schéma) — le même filtre que buildCatalogBlock() ci-dessus doit
    // s'appliquer ici, sinon "seulement ce que je t'ai montré" ne serait
    // pas vraiment respecté.
    if (!def || def.libraryVisible === false) {
      errors.push(`type de composant inconnu « ${component.type} » (clé ${component.key})`);
      continue;
    }
    const brandModelId = component.dataOverride.brandModelId;
    if (typeof brandModelId === "string" && !getBrandModelsForType(component.type).some((m) => m.id === brandModelId)) {
      errors.push(`« ${component.label} » référence un modèle de marque inconnu « ${brandModelId} » pour le type ${component.type}`);
    }
  }
  if (errors.length > 0) return errors;

  for (const edge of plan.edges) {
    const source = keyToComponent.get(edge.sourceKey);
    const target = keyToComponent.get(edge.targetKey);
    if (!source) {
      errors.push(`un câble référence un composant source inconnu « ${edge.sourceKey} »`);
      continue;
    }
    if (!target) {
      errors.push(`un câble référence un composant cible inconnu « ${edge.targetKey} »`);
      continue;
    }

    const sourceDef = getComponentDefinition(source.type);
    const targetDef = getComponentDefinition(target.type);
    if (!sourceDef || !targetDef) continue; // déjà signalé ci-dessus

    const sourceHandles = getEffectiveHandles(sourceDef, { ...sourceDef.defaultData, ...source.dataOverride });
    const targetHandles = getEffectiveHandles(targetDef, { ...targetDef.defaultData, ...target.dataOverride });
    if (!sourceHandles.some((h) => h.id === edge.sourceHandle)) {
      errors.push(`« ${source.label} » (${source.type}) n'a pas de borne « ${edge.sourceHandle} »`);
    }
    if (!targetHandles.some((h) => h.id === edge.targetHandle)) {
      errors.push(`« ${target.label} » (${target.type}) n'a pas de borne « ${edge.targetHandle} »`);
    }
  }

  return errors;
}

export async function generateSchemaPlan(
  history: SchemaAiGenerateMessage[],
  nodes: Node<ElectricalNodeData>[],
  edges: Edge<CableEdgeData>[],
  projectName: string,
  model: SchemaAiModelId = "claude-opus-5"
): Promise<SchemaGenerationResult> {
  if (history.length === 0) throw badRequest("Aucun message.");
  const lastMessage = history[history.length - 1];
  if (lastMessage.role !== "user") throw badRequest("Le dernier message doit venir de l'utilisateur.");

  const contextBlock = `${buildCatalogBlock()}\n\n[État actuel du schéma « ${projectName} », ne le recopie pas]\n${buildSchemaSummaryText(nodes, edges)}`;
  const messages = [
    ...history.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: `${contextBlock}\n\n${lastMessage.content}` },
  ];

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model,
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: PROPOSE_PLAN_TOOL,
        description:
          "Propose un ajout autonome au schéma (nouvelle zone entièrement câblée en interne) : une liste de composants et de câbles à poser, jamais connectés à l'existant.",
        input_schema: {
          type: "object",
          properties: {
            intro: { type: "string", description: "Courte phrase à afficher avant la proposition (ex. ce qui a été posé et pourquoi)." },
            zoneLabel: { type: "string", description: "Nom de la nouvelle zone (ex. \"Panneaux solaires + DC-DC\")." },
            zoneWidth: { type: "number" },
            zoneHeight: { type: "number" },
            components: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  key: { type: "string", description: "Identifiant logique unique dans ce plan (ex. \"panel-1\", \"mppt\")." },
                  type: { type: "string", description: "Type de composant du catalogue fourni." },
                  label: { type: "string" },
                  dataOverride: { type: "object", description: "Champs à préremplir (ex. powerW, amperage, brandModelId)." },
                  offsetX: { type: "number", description: "Position X relative au coin de la nouvelle zone." },
                  offsetY: { type: "number", description: "Position Y relative au coin de la nouvelle zone." },
                },
                required: ["key", "type", "label", "offsetX", "offsetY"],
              },
            },
            edges: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sourceKey: { type: "string" },
                  sourceHandle: { type: "string", description: "Identifiant de borne du composant source, tel que listé dans le catalogue." },
                  targetKey: { type: "string" },
                  targetHandle: { type: "string", description: "Identifiant de borne du composant cible, tel que listé dans le catalogue." },
                },
                required: ["sourceKey", "sourceHandle", "targetKey", "targetHandle"],
              },
            },
          },
          required: ["intro", "zoneLabel", "zoneWidth", "zoneHeight", "components", "edges"],
        },
      },
    ],
    tool_choice: { type: "auto" },
    messages,
  });

  const toolUse = response.content.find((block) => block.type === "tool_use" && block.name === PROPOSE_PLAN_TOOL);
  if (toolUse && toolUse.type === "tool_use") {
    const parsed = toolInputSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      throw badRequest(`L'IA a proposé un plan mal formé (${parsed.error.issues[0]?.message ?? "format incorrect"}).`);
    }
    const { intro, ...plan } = parsed.data;
    const catalogErrors = validatePlanAgainstCatalog(plan);
    if (catalogErrors.length > 0) {
      throw badRequest(`L'IA a proposé un plan incohérent avec le catalogue : ${catalogErrors[0]}`);
    }
    return { kind: "plan", intro, plan };
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw badRequest(`L'IA n'a renvoyé aucun texte exploitable (arrêt : ${response.stop_reason ?? "inconnu"}).`);
  }
  return { kind: "message", text: textBlock.text };
}
