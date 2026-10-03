import { NextResponse } from "next/server";
import { extractRequestSchema } from "@/lib/crm/notes-contract";
import { badRequest, forbidden } from "@/lib/http-errors";
import { getSessionFromCookies } from "@/lib/require-session";
import { toErrorResponse } from "@/lib/server/error-response";
import { logServerEvent } from "@/lib/server-log";
import { extractCrmNotes } from "@/lib/services/crm-notes-extract";
import { findProspectMatches } from "@/lib/services/crm-notes-match";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Reserve a l'admin (meme garde que /api/schema-editor/ai-generate). Ne
// modifie rien : renvoie une proposition que Fabien relit puis valide via
// applyCrmNotesAction.
export async function POST(request: Request) {
  try {
    const adminSession = await getSessionFromCookies();
    if (!adminSession) throw forbidden("Réservé à l'administrateur.");

    const json = await request.json().catch(() => null);
    const parsed = extractRequestSchema.safeParse(json);
    if (!parsed.success) throw badRequest(parsed.error.issues[0]?.message ?? "Requête invalide.");

    const extraction = await extractCrmNotes(parsed.data);
    const matches = await findProspectMatches(extraction.entries);

    logServerEvent("info", "crm_notes.extract", {
      adminEmail: adminSession.sub,
      entryCount: extraction.entries.length,
      imageCount: parsed.data.images.length,
    });

    return NextResponse.json({
      entries: extraction.entries.map((entry, index) => ({ entry, matches: matches[index] })),
      warnings: extraction.warnings,
    });
  } catch (error) {
    return toErrorResponse(error, "api.dashboard.crm.notes-extract");
  }
}
