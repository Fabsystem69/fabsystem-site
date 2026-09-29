import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/require-session";
import { toErrorResponse } from "@/lib/server/error-response";
import { badRequest, forbidden } from "@/lib/http-errors";
import { chatAboutSchema, schemaAiChatMessagesSchema } from "@/lib/services/schema-ai-chat";
import { logServerEvent } from "@/lib/server-log";
import type { Node, Edge } from "@xyflow/react";
import type { ElectricalNodeData, CableEdgeData } from "@/types/schema";

export const runtime = "nodejs";

// Retour utilisateur : "je le veux vraiment mode chat box quand je suis sur
// mon éditeur en mode admin" — même garde admin que
// app/api/schema-editor/ai-review/route.ts (getSessionFromCookies(), jamais
// requireCustomerActor : un client ne doit jamais atteindre cette route).
export async function POST(request: Request) {
  try {
    const adminSession = await getSessionFromCookies();
    if (!adminSession) throw forbidden("Réservé à l'administrateur.");

    const body = (await request.json().catch(() => null)) as {
      messages?: unknown;
      nodes?: Node<ElectricalNodeData>[];
      edges?: Edge<CableEdgeData>[];
      projectName?: string;
    } | null;
    if (!body || !Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
      throw badRequest("Schéma manquant ou invalide.");
    }
    const parsedMessages = schemaAiChatMessagesSchema.safeParse(body.messages);
    if (!parsedMessages.success) throw badRequest("Messages invalides.");

    const reply = await chatAboutSchema(parsedMessages.data, body.nodes, body.edges, body.projectName?.trim() || "Sans titre");

    logServerEvent("info", "AI schema chat message", { adminEmail: adminSession.sub, nodeCount: body.nodes.length });

    return NextResponse.json({ reply });
  } catch (error) {
    return toErrorResponse(error, "api.schema-editor.ai-chat");
  }
}
