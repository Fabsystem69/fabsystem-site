import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/http-errors";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { getProject } from "@/lib/services/project";
import { getProjectValues } from "@/lib/services/project-values";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ projectId: string }>;
};

// UI-13 — lecture seule des valeurs retenues d'un Project, utilisée par le
// pont Outils→Project pour détecter un conflit (mission §19) avant import
// : le composant d'aperçu doit pouvoir comparer la valeur déjà retenue à
// la nouvelle valeur avant que l'utilisateur ne valide. Ownership vérifiée
// exactement comme app/api/projects/[projectId]/route.ts (même
// getProject(actor, projectId)) — aucune nouvelle règle d'accès.
export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;

  try {
    const actor = await requireCustomerActor();
    const project = await getProject(actor, projectId);
    const values = await getProjectValues(project.id);

    return NextResponse.json({ values });
  } catch (error) {
    return toErrorResponse(error, "api.projects.[projectId].values.get");
  }
}
