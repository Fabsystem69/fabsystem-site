import { NextResponse } from "next/server";
import type { Prisma } from "@/lib/generated/prisma/client";
import { payloadTooLarge } from "@/lib/http-errors";
import { toErrorResponse } from "@/lib/server/error-response";
import { MAX_PROJECT_SCHEMA_REQUEST_BYTES } from "@/lib/project-schema-contract";
import { parseSaveProjectSchemaInput } from "@/lib/project-schema-payload";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireProjectActor } from "@/lib/server/project-actor";
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
    const actor = await requireProjectActor();
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
    // Limite remontée de 60 à 100 (retour utilisateur, suite à l'alerte
    // rate-limit du 19/08 : un client légitime en train de construire un
    // schéma complet peut légitimement dépasser 60 sauvegardes en 5 min avec
    // le debounce de 700ms — pas un bug, juste un seuil un peu juste).
    await enforceRateLimit(request, {
      name: "project-schema-save",
      limit: 100,
      windowMs: 5 * 60 * 1000,
    });

    const actor = await requireProjectActor();
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
