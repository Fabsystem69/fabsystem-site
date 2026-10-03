import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { meetingExtractRequestSchema } from "@/lib/crm/meeting-notes-contract";
import { detectTargetMismatch } from "@/lib/crm/meeting-notes-format";
import { badRequest, forbidden } from "@/lib/http-errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getSessionFromCookies } from "@/lib/require-session";
import { toErrorResponse } from "@/lib/server/error-response";
import { logServerEvent } from "@/lib/server-log";
import { extractMeetingNotes } from "@/lib/services/meeting-notes-extract";
import { resolveMeetingTarget } from "@/lib/services/meeting-notes-targets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Reservee a l'admin. Ne modifie aucune donnee : renvoie une proposition
// que Fabien relit, corrige puis valide via applyMeetingNotesAction.
export async function POST(request: Request) {
  try {
    const adminSession = await getSessionFromCookies();
    if (!adminSession) throw forbidden("Réservé à l'administrateur.");

    await enforceRateLimit(request, { name: "crm-meeting-notes-extract", limit: 30, windowMs: 60 * 60 * 1000 });

    const parsed = meetingExtractRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? "Requête invalide.");

    const target = await resolveMeetingTarget({ kind: parsed.data.targetKind, id: parsed.data.targetId });
    const extraction = await extractMeetingNotes(parsed.data, { targetName: target.label });
    const mismatch = detectTargetMismatch(target.label, extraction.mentionedPeople);

    logServerEvent("info", "crm_meeting_notes.extract", {
      adminEmail: adminSession.sub,
      targetKind: parsed.data.targetKind,
      imageCount: parsed.data.images.length,
    });

    return NextResponse.json({
      extraction,
      targetLabel: target.label,
      warnings: mismatch ? [mismatch] : [],
      submissionKey: randomUUID(),
    });
  } catch (error) {
    return toErrorResponse(error, "api.dashboard.crm.meeting-notes.extract");
  }
}
