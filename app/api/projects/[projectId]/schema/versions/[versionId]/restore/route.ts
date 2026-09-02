import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/server/error-response";
import { requireProjectActor } from "@/lib/server/project-actor";
import { restoreProjectSchemaVersion } from "@/lib/services/project-schema-version";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ projectId: string; versionId: string }> };

export async function POST(_request: Request, { params }: Params) {
  try {
    const actor = await requireProjectActor();
    const { projectId, versionId } = await params;
    const version = await restoreProjectSchemaVersion(actor, projectId, versionId, {
      authorType: actor.role === "admin" ? "ADMIN" : "CUSTOMER",
      authorName: actor.role === "admin" ? "FabSystem" : "Client",
    });
    return NextResponse.json({ version });
  } catch (error) {
    return toErrorResponse(error, "api.projects.[projectId].schema.versions.[versionId].restore.post");
  }
}
