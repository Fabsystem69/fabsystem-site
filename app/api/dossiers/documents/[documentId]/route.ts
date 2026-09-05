import { NextResponse } from "next/server";
import { forbidden } from "@/lib/http-errors";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { getDossierDocumentStream } from "@/lib/server/dossier-storage";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { getDossierDocumentById, getDossierForDetail } from "@/lib/services/dossier-client";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;

  try {
    const actor = await requireCustomerActor();
    const document = await getDossierDocumentById(documentId);
    const dossier = await getDossierForDetail(document.dossierId);

    if (actor.role !== "customer" || dossier.customerId !== actor.customerId) {
      throw forbidden("Ce document ne vous appartient pas.");
    }

    const { stream, contentType } = await getDossierDocumentStream(document.path);

    return new NextResponse(stream, {
      headers: {
        "Content-Type": contentType || document.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(document.filename)}"`,
      },
    });
  } catch (error) {
    return databaseErrorResponse(error, "api.dossiers.documents.get");
  }
}
