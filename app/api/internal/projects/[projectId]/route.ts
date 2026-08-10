import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/http-errors";
import { requireApiSession } from "@/lib/internal-api";
import { parseConfirmDeletionInput, parseUpdateProjectInput } from "@/lib/project-payload";
import { adminActor } from "@/lib/server/project-actor";
import { deleteProject, getProject, updateProject } from "@/lib/services/project";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { projectId } = await params;

  try {
    const project = await getProject(adminActor(), projectId);

    return NextResponse.json({ project });
  } catch (error) {
    return toErrorResponse(error, "api.internal.projects.[projectId].get");
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { projectId } = await params;

  try {
    const json = await request.json().catch(() => null);
    const input = parseUpdateProjectInput(json);

    const project = await updateProject(adminActor(), projectId, input);

    return NextResponse.json({ project });
  } catch (error) {
    return toErrorResponse(error, "api.internal.projects.[projectId].patch");
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { projectId } = await params;

  try {
    const json = await request.json().catch(() => null);
    const { confirm } = parseConfirmDeletionInput(json);

    const result = await deleteProject(adminActor(), projectId, { confirm });

    return NextResponse.json({ ok: true, projectId: result.projectId });
  } catch (error) {
    return toErrorResponse(error, "api.internal.projects.[projectId].delete");
  }
}
