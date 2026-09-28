import { NextResponse } from "next/server";
import { forbidden } from "@/lib/http-errors";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { getCoachingProjectDocumentStream } from "@/lib/server/coaching-project-storage";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { prisma } from "@/lib/prisma";
import { getCoachingProjectDocumentById } from "@/lib/services/coaching-project";

// Pendant du telechargement client des DossierClient
// (app/api/dossiers/documents/[documentId]/route.ts) mais pour
// CoachingProjectDocument : ce chemin n'existait pas encore, seul le
// telechargement admin (app/api/internal/coaching-projects/documents/...)
// etait cable. Meme rigueur de propriete qu'ailleurs dans ce lot : le
// document n'est jamais suppose appartenir au client sans verification
// explicite du projet.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;

  try {
    const actor = await requireCustomerActor();
    const document = await getCoachingProjectDocumentById(documentId);
    const project = await prisma.coachingProject.findUnique({
      where: { id: document.projectId },
      select: { customerId: true },
    });

    if (actor.role !== "customer" || !project || project.customerId !== actor.customerId) {
      throw forbidden("Ce document ne vous appartient pas.");
    }

    const { stream, contentType } = await getCoachingProjectDocumentStream(document.path);

    return new NextResponse(stream, {
      headers: {
        "Content-Type": contentType || document.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(document.filename)}"`,
      },
    });
  } catch (error) {
    return databaseErrorResponse(error, "api.coaching-projects.documents.get");
  }
}
