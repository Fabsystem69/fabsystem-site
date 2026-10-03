import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { detectTargetMismatch } from "@/lib/crm/meeting-notes-format";
import { sheetExtractRequestSchema } from "@/lib/crm/sheet-import-contract";
import { buildSheetProposal } from "@/lib/crm/sheet-import-proposal";
import type { SheetProjectSource } from "@/lib/crm/discovery-sheet-values";
import { badRequest, forbidden, notFound } from "@/lib/http-errors";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSessionFromCookies } from "@/lib/require-session";
import { toErrorResponse } from "@/lib/server/error-response";
import { logServerEvent } from "@/lib/server-log";
import { extractSheetFromPhotos } from "@/lib/services/sheet-import-extract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Reservee a l'admin. Ne modifie aucune donnee : renvoie une proposition que
// Fabien relit puis valide via applySheetImportAction.
export async function POST(request: Request) {
  try {
    const adminSession = await getSessionFromCookies();
    if (!adminSession) throw forbidden("Réservé à l'administrateur.");

    await enforceRateLimit(request, { name: "crm-fiche-import-extract", limit: 30, windowMs: 60 * 60 * 1000 });

    const parsed = sheetExtractRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? "Requête invalide.");

    const project = await prisma.coachingProject.findUnique({
      where: { id: parsed.data.projectId },
      include: {
        devices: { select: { name: true, quantity: true, powerSupply: true } },
        documents: { select: { filename: true } },
        customer: { select: { name: true, email: true } },
      },
    });
    if (!project) throw notFound("Projet introuvable.");
    const projectLabel = project.customer.name || project.customer.email;

    const extraction = await extractSheetFromPhotos(parsed.data);
    const proposal = buildSheetProposal(extraction, project as unknown as SheetProjectSource);
    const mismatch = detectTargetMismatch(projectLabel, extraction.mentionedPeople);

    logServerEvent("info", "crm_fiche_import.extract", {
      adminEmail: adminSession.sub,
      imageCount: parsed.data.images.length,
    });

    return NextResponse.json({
      proposal: mismatch ? { ...proposal, warnings: [mismatch, ...proposal.warnings] } : proposal,
      projectLabel,
      submissionKey: randomUUID(),
    });
  } catch (error) {
    return toErrorResponse(error, "api.dashboard.crm.fiche-import.extract");
  }
}
