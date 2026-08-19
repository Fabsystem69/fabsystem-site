import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/server/error-response";
import { parseConfirmDeletionInput } from "@/lib/project-payload";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { scheduleDeletion } from "@/lib/services/project";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ projectId: string }>;
};

// Programme une suppression définitive à +72h (MASTER-06 §15, MASTER-10
// §54-55). Aucune destruction n'a lieu ici : l'exécution appartient à un
// exécuteur rejouable qui n'est pas construit dans cette phase.
export async function POST(request: Request, { params }: Params) {
  const { projectId } = await params;

  try {
    const actor = await requireCustomerActor();
    const json = await request.json().catch(() => null);
    const { confirm } = parseConfirmDeletionInput(json);

    const project = await scheduleDeletion(actor, projectId, { confirm });

    return NextResponse.json({ project });
  } catch (error) {
    return toErrorResponse(error, "api.projects.[projectId].schedule-deletion.post");
  }
}
