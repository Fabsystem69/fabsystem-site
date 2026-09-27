import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { getCoachingProjectDocumentStream } from "@/lib/server/coaching-project-storage";
import { getCoachingProjectDocumentById } from "@/lib/services/coaching-project";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  const { documentId } = await params;

  try {
    const document = await getCoachingProjectDocumentById(documentId);
    const { stream, contentType } = await getCoachingProjectDocumentStream(document.path);

    return new NextResponse(stream, {
      headers: {
        "Content-Type": contentType || document.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(document.filename)}"`,
      },
    });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.coaching-projects.documents.get");
  }
}
