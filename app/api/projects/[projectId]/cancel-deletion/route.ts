import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/server/error-response";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { cancelDeletion } from "@/lib/services/project";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ projectId: string }>;
};

// Le client peut annuler tant que l'échéance n'est pas atteinte
// (MASTER-10 §56). L'Admin dispose de la même action via
// /api/internal/projects/[projectId]/cancel-deletion.
export async function POST(_request: Request, { params }: Params) {
  const { projectId } = await params;

  try {
    const actor = await requireCustomerActor();
    const project = await cancelDeletion(actor, projectId);

    return NextResponse.json({ project });
  } catch (error) {
    return toErrorResponse(error, "api.projects.[projectId].cancel-deletion.post");
  }
}
