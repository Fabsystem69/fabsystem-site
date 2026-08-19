import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/server/error-response";
import { parseConfirmDeletionInput, parseUpdateProjectInput } from "@/lib/project-payload";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { deleteProject, getProject, updateProject } from "@/lib/services/project";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;

  try {
    const actor = await requireCustomerActor();
    const project = await getProject(actor, projectId);

    return NextResponse.json({ project });
  } catch (error) {
    return toErrorResponse(error, "api.projects.[projectId].get");
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { projectId } = await params;

  try {
    const actor = await requireCustomerActor();
    const json = await request.json().catch(() => null);
    const input = parseUpdateProjectInput(json);

    const project = await updateProject(actor, projectId, input);

    return NextResponse.json({ project });
  } catch (error) {
    return toErrorResponse(error, "api.projects.[projectId].patch");
  }
}

// Suppression immédiate et définitive (MASTER-06 §15, MASTER-10 §53).
// Pour une suppression différée de 72h, voir schedule-deletion.
export async function DELETE(request: Request, { params }: Params) {
  const { projectId } = await params;

  try {
    const actor = await requireCustomerActor();
    const json = await request.json().catch(() => null);
    const { confirm } = parseConfirmDeletionInput(json);

    const result = await deleteProject(actor, projectId, { confirm });

    return NextResponse.json({ ok: true, projectId: result.projectId });
  } catch (error) {
    return toErrorResponse(error, "api.projects.[projectId].delete");
  }
}
