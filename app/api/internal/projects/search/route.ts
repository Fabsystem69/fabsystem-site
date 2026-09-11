import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/internal-api";
import { toErrorResponse } from "@/lib/server/error-response";
import { prisma } from "@/lib/prisma";
import { formatCustomerDisplayName } from "@/lib/format";

export const dynamic = "force-dynamic";

// Retour utilisateur : "menu admin dans l'éditeur pour reprendre
// directement" — recherche par nom/email client ou nom de schéma, pour
// sauter directement dans l'éditeur sans repasser par le dashboard.
export async function GET(request: Request) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") ?? "").trim();
    if (q.length < 2) {
      return NextResponse.json({ projects: [] });
    }

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { customer: { name: { contains: q, mode: "insensitive" } } },
          { customer: { email: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: { customer: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
      take: 8,
    });

    return NextResponse.json({
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        customerName: formatCustomerDisplayName(project.customer),
        updatedAt: project.updatedAt,
      })),
    });
  } catch (error) {
    return toErrorResponse(error, "api.internal.projects.search");
  }
}
