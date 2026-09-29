import { z } from "zod";
import type { Node, Edge } from "@xyflow/react";
import { getAnthropicClient } from "@/lib/server/anthropic";
import { buildSchemaSummaryText } from "@/lib/ai/schema-summary";
import { computeSchemaIssues } from "@/lib/electrical-components/checks";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";
import { badRequest } from "@/lib/http-errors";

// Retour utilisateur : "je le veux vraiment mode chat box quand je suis sur
// mon éditeur en mode admin" — assistant conversationnel réservé à l'admin
// (vérifié côté route, pas ici), pour évaluer ou discuter d'un schéma en
// cours d'édition. Le contexte du schéma est reconstruit à CHAQUE message
// (jamais mis en cache d'un tour à l'autre) : le schéma change pendant la
// conversation, un contexte figé au premier message deviendrait faux dès la
// moindre modification du canevas.
const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

export type SchemaAiChatMessage = z.infer<typeof chatMessageSchema>;

export const schemaAiChatMessagesSchema = z.array(chatMessageSchema).min(1).max(40);

// Retour utilisateur : "laisse-moi le choix directement dans le chatbox" —
// liste fermée plutôt qu'une chaîne libre envoyée par le client (jamais
// confiance dans un nom de modèle arbitraire venant du navigateur, autant
// pour la sécurité/le coût que pour éviter un nom de modèle mal orthographié
// qui échouerait silencieusement). Opus par défaut (comportement inchangé
// pour un appel sans `model`).
export const SCHEMA_AI_MODELS = {
  "claude-opus-5": "Opus 5 (plus précis)",
  "claude-sonnet-5": "Sonnet 5 (plus rapide, moins cher)",
} as const;
export type SchemaAiModelId = keyof typeof SCHEMA_AI_MODELS;
export const schemaAiModelSchema = z.enum(
  Object.keys(SCHEMA_AI_MODELS) as [SchemaAiModelId, ...SchemaAiModelId[]]
);

const SYSTEM_PROMPT = `Tu es un assistant technique en électricité embarquée basse tension (12V/24V DC), pour des vans, fourgons, camping-cars et bateaux. Tu discutes avec un électricien professionnel qui conçoit un schéma dans son éditeur — il peut te demander un avis global, une question précise sur un composant ou un câble, ou juste réfléchir à voix haute avec toi.

Règles impératives :
- Tu donnes des AVIS et des pistes, jamais une certification. Ne dis jamais qu'un schéma est "sûr", "conforme" ou "prêt à installer" — dis plutôt "à vérifier", "attire l'attention sur", "pourrait mériter".
- Le message ci-dessous te donne l'état ACTUEL du schéma (composants, câbles, contrôles automatiques déjà signalés) à chaque tour — ne répète jamais les contrôles automatiques déjà listés, concentre-toi sur ce qu'une relecture humaine ajouterait.
- Réponds de façon concise et concrète, en français, comme dans une conversation entre professionnels — pas de longue liste si la question est simple.
- Si le schéma est vide ou que la question ne s'y rapporte pas, réponds normalement sans forcer une référence au schéma.`;

function buildSchemaContextBlock(
  nodes: Node<ElectricalNodeData>[],
  edges: Edge<CableEdgeData>[],
  projectName: string
) {
  const existingIssues = computeSchemaIssues(nodes, edges).map((issue) => `- [${issue.severity ?? "warning"}] ${issue.message}`);
  return `[État actuel du schéma « ${projectName} », à prendre en compte pour ta réponse — ne le recopie pas]
${buildSchemaSummaryText(nodes, edges)}

Contrôles automatiques déjà signalés (ne les répète pas) :
${existingIssues.length > 0 ? existingIssues.join("\n") : "(aucun)"}`;
}

export async function chatAboutSchema(
  history: SchemaAiChatMessage[],
  nodes: Node<ElectricalNodeData>[],
  edges: Edge<CableEdgeData>[],
  projectName: string,
  model: SchemaAiModelId = "claude-opus-5"
): Promise<string> {
  if (history.length === 0) throw badRequest("Aucun message.");
  const lastMessage = history[history.length - 1];
  if (lastMessage.role !== "user") throw badRequest("Le dernier message doit venir de l'utilisateur.");

  // Contexte injecté juste avant le dernier message plutôt que dans `system`
  // (qui, lui, resterait figé sur l'état du schéma au tout premier tour si
  // on voulait profiter du cache de prompt) — ici on préfère la fraîcheur du
  // contexte à l'économie de cache, un schéma d'édition change vite.
  const messages = [
    ...history.slice(0, -1).map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: `${buildSchemaContextBlock(nodes, edges, projectName)}\n\n${lastMessage.content}` },
  ];

  const client = getAnthropicClient();
  const response = await client.messages.create({
    model,
    // Bug réel corrigé (retour utilisateur : "L'IA n'a renvoyé aucun texte
    // exploitable.") : à 2048, la réflexion adaptative pouvait à elle seule
    // épuiser le budget avant qu'un bloc de texte ne soit produit —
    // `max_tokens` couvre la réflexion ET la réponse, pas seulement la
    // réponse visible. Relevé largement, encore loin du seuil qui
    // imposerait le streaming (~16000+ en non-streaming).
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    system: SYSTEM_PROMPT,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw badRequest(`L'IA n'a renvoyé aucun texte exploitable (arrêt : ${response.stop_reason ?? "inconnu"}).`);
  }
  return textBlock.text;
}
