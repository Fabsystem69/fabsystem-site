import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { buildPrintableVanDossierHtml } from "@/lib/services/coaching-dossier-print";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  const { projectId } = await params;
  const includePrivateNotes = new URL(req.url).searchParams.get("private") === "1";

  try {
    const html = await buildPrintableVanDossierHtml(projectId, includePrivateNotes);
    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.coaching-projects.dossier-print.get");
  }
}
