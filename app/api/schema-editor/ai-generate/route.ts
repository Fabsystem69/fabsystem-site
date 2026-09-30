import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/require-session";
import { toErrorResponse } from "@/lib/server/error-response";
import { badRequest, forbidden } from "@/lib/http-errors";
import { generateSchemaPlan, schemaAiGenerateMessagesSchema, schemaAiModelSchema } from "@/lib/services/schema-ai-generate";
import { logServerEvent } from "@/lib/server-log";
import type { Node, Edge } from "@xyflow/react";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";

export const runtime = "nodejs";

// Route dédiée, séparée de /api/schema-editor/ai-chat (évaluation) : la
// forme de réponse diffère entièrement (message ou plan structuré à
// appliquer) et ce chantier ne doit rien risquer sur l'évaluation déjà en
// prod. Même garde admin que le reste de l'éditeur IA : getSessionFromCookies(),
// jamais requireCustomerActor — un client ne doit jamais atteindre cette route.
export async function POST(request: Request) {
  try {
    const adminSession = await getSessionFromCookies();
    if (!adminSession) throw forbidden("Réservé à l'administrateur.");

    const body = (await request.json().catch(() => null)) as {
      messages?: unknown;
      nodes?: Node<ElectricalNodeData>[];
      edges?: Edge<CableEdgeData>[];
      projectName?: string;
      model?: unknown;
    } | null;
    if (!body || !Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
      throw badRequest("Schéma manquant ou invalide.");
    }
    const parsedMessages = schemaAiGenerateMessagesSchema.safeParse(body.messages);
    if (!parsedMessages.success) throw badRequest("Messages invalides.");
    const parsedModel = body.model === undefined ? { success: true as const, data: undefined } : schemaAiModelSchema.safeParse(body.model);
    if (!parsedModel.success) throw badRequest("Modèle invalide.");

    const result = await generateSchemaPlan(
      parsedMessages.data,
      body.nodes,
      body.edges,
      body.projectName?.trim() || "Sans titre",
      parsedModel.data
    );

    logServerEvent("info", "AI schema generation message", { adminEmail: adminSession.sub, nodeCount: body.nodes.length, kind: result.kind });

    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error, "api.schema-editor.ai-generate");
  }
}
