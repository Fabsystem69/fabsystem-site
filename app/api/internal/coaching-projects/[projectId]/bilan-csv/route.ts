import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { buildVanBilanCsv } from "@/lib/services/coaching-dossier-export";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  const { projectId } = await params;

  try {
    const csv = await buildVanBilanCsv(projectId);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bilan-consommation-${projectId}.csv"`,
      },
    });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.coaching-projects.bilan-csv.get");
  }
}
