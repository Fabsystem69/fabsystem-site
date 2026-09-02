import { NextResponse } from "next/server";
import { badRequest } from "@/lib/http-errors";
import { toErrorResponse } from "@/lib/server/error-response";
import { requireProjectActor } from "@/lib/server/project-actor";
import { createProjectSchemaVersion, listProjectSchemaVersions } from "@/lib/services/project-schema-version";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ projectId: string }> };

function authorFor(actor: { role: "admin" } | { role: "customer"; customerId: string }) {
  return actor.role === "admin"
    ? { authorType: "ADMIN" as const, authorName: "FabSystem" }
    : { authorType: "CUSTOMER" as const, authorName: "Client" };
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const actor = await requireProjectActor();
    const { projectId } = await params;
    const versions = await listProjectSchemaVersions(actor, projectId);
    return NextResponse.json({ versions });
  } catch (error) {
    return toErrorResponse(error, "api.projects.[projectId].schema.versions.get");
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const body = (await request.json().catch(() => null)) as { label?: unknown } | null;
    if (body?.label !== undefined && typeof body.label !== "string") throw badRequest("Version label must be a string");
    const actor = await requireProjectActor();
    const { projectId } = await params;
    const version = await createProjectSchemaVersion(actor, projectId, {
      ...authorFor(actor),
      label: body?.label,
    });
    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "api.projects.[projectId].schema.versions.post");
  }
}
