import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/server/error-response";
import { requireApiSession } from "@/lib/internal-api";
import { parseConfirmDeletionInput } from "@/lib/project-payload";
import { adminActor } from "@/lib/server/project-actor";
import { scheduleDeletion } from "@/lib/services/project";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ projectId: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { projectId } = await params;

  try {
    const json = await request.json().catch(() => null);
    const { confirm } = parseConfirmDeletionInput(json);

    const project = await scheduleDeletion(adminActor(), projectId, { confirm });

    return NextResponse.json({ project });
  } catch (error) {
    return toErrorResponse(error, "api.internal.projects.[projectId].schedule-deletion.post");
  }
}
