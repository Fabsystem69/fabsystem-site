import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/server/error-response";
import { requireApiSession } from "@/lib/internal-api";
import { adminActor } from "@/lib/server/project-actor";
import { cancelDeletion } from "@/lib/services/project";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ projectId: string }>;
};

export async function POST(_request: Request, { params }: Params) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { projectId } = await params;

  try {
    const project = await cancelDeletion(adminActor(), projectId);

    return NextResponse.json({ project });
  } catch (error) {
    return toErrorResponse(error, "api.internal.projects.[projectId].cancel-deletion.post");
  }
}
