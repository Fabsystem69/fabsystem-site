import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { toErrorResponse } from "@/lib/server/error-response";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { disableProjectSchemaShare, enableProjectSchemaShare } from "@/lib/services/project-schema";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    await enforceRateLimit(request, { name: "project-schema-share", limit: 20, windowMs: 5 * 60 * 1000 });
    const actor = await requireCustomerActor();
    const { projectId } = await params;
    const token = await enableProjectSchemaShare(actor, projectId);
    return NextResponse.json({ token, url: new URL(`/schema/partage/${token}`, request.url).toString() });
  } catch (error) {
    return toErrorResponse(error, "api.projects.[projectId].schema.share.post");
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const actor = await requireCustomerActor();
    const { projectId } = await params;
    await disableProjectSchemaShare(actor, projectId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "api.projects.[projectId].schema.share.delete");
  }
}
