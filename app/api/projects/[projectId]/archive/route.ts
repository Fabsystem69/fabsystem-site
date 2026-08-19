import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/server/error-response";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { archiveProject } from "@/lib/services/project";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ projectId: string }>;
};

export async function POST(_request: Request, { params }: Params) {
  const { projectId } = await params;

  try {
    const actor = await requireCustomerActor();
    const project = await archiveProject(actor, projectId);

    return NextResponse.json({ project });
  } catch (error) {
    return toErrorResponse(error, "api.projects.[projectId].archive.post");
  }
}
