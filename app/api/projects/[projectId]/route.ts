import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/server/error-response";
import { parseConfirmDeletionInput, parseUpdateProjectInput } from "@/lib/project-payload";
import { requireProjectActor } from "@/lib/server/project-actor";
import { deleteProject, getProject, updateProject } from "@/lib/services/project";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { projectId } = await params;

  try {
    const actor = await requireProjectActor();
    const project = await getProject(actor, projectId);

    return NextResponse.json({ project });
  } catch (error) {
    return toErrorResponse(error, "api.projects.[projectId].get");
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { projectId } = await params;

  try {
    const actor = await requireProjectActor();
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
// Bug réel corrigé (30/09-02/10/2026) : l'ancien résolveur d'acteur,
// réservé aux clients, rejetait systématiquement un Admin qui supprime le
// projet d'un client depuis le menu "Enregistrer" de l'éditeur de schéma
// (SaveMenu.tsx -> deleteProjectApi) — même famille de bug que la route de
// partage (schema/share/route.ts), corrigée dans le même lot.
export async function DELETE(request: Request, { params }: Params) {
  const { projectId } = await params;

  try {
    const actor = await requireProjectActor();
    const json = await request.json().catch(() => null);
    const { confirm } = parseConfirmDeletionInput(json);

    const result = await deleteProject(actor, projectId, { confirm });

    return NextResponse.json({ ok: true, projectId: result.projectId });
  } catch (error) {
    return toErrorResponse(error, "api.projects.[projectId].delete");
  }
}
