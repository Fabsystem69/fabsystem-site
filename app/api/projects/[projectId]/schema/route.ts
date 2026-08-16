import { NextResponse } from "next/server";
import type { Prisma } from "@/lib/generated/prisma/client";
import { payloadTooLarge, toErrorResponse } from "@/lib/http-errors";
import { MAX_PROJECT_SCHEMA_REQUEST_BYTES } from "@/lib/project-schema-contract";
import { parseSaveProjectSchemaInput } from "@/lib/project-schema-payload";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { getProjectSchema, saveProjectSchema } from "@/lib/services/project-schema";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ projectId: string }>;
};

async function readSchemaRequestJson(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_PROJECT_SCHEMA_REQUEST_BYTES) {
    throw payloadTooLarge("Schema payload exceeds 1.5MB");
  }

  const raw = await request.text().catch(() => "");
  const rawBytes = new TextEncoder().encode(raw).length;
  if (rawBytes > MAX_PROJECT_SCHEMA_REQUEST_BYTES) {
    throw payloadTooLarge("Schema payload exceeds 1.5MB");
  }

  if (!raw.trim()) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

// Schéma électrique de /outils/schema, lié à un Project (retour
// utilisateur : "il manque enregistrer lié au compte client") — mêmes
// conventions que app/api/projects/[projectId]/values/route.ts (ownership
// via getProject(actor, projectId) dans le service, jamais l'id seul).
export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;

  try {
    const actor = await requireCustomerActor();
    const schema = await getProjectSchema(actor, projectId);

    return NextResponse.json({ schema });
  } catch (error) {
    return toErrorResponse(error, "api.projects.[projectId].schema.get");
  }
}

export async function PUT(request: Request, { params }: Params) {
  const { projectId } = await params;

  try {
    // Autosave potentiellement fréquent depuis l'éditeur — même principe
    // que projects-create, fenêtre plus large adaptée à un débounce court.
    enforceRateLimit(request, {
      name: "project-schema-save",
      limit: 60,
      windowMs: 5 * 60 * 1000,
    });

    const actor = await requireCustomerActor();
    const json = await readSchemaRequestJson(request);
    const input = parseSaveProjectSchemaInput(json);

    const schema = await saveProjectSchema(actor, projectId, {
      projectName: input.projectName,
      nodes: input.nodes as Prisma.InputJsonValue,
      edges: input.edges as Prisma.InputJsonValue,
      thumbnail: input.thumbnail ?? null,
    });

    return NextResponse.json({ schema });
  } catch (error) {
    return toErrorResponse(error, "api.projects.[projectId].schema.put");
  }
}
