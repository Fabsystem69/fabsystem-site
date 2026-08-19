import "server-only";

import { prisma } from "@/lib/prisma";

const DEFAULT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;

// Retour utilisateur : "avoir les remontées d'erreur avec l'id du client
// directement dans mon dashboard" — persiste les vraies erreurs serveur
// (5xx) liées à une session identifiée, voir `toErrorResponse` dans
// lib/http-errors.ts. Volontairement pas les 4xx (validation, rate-limit…) :
// déjà visibles/attendus côté client, pas des bugs à investiguer.
export async function recordErrorReport(input: {
  customerId?: string;
  route: string;
  message: string;
  statusCode: number;
  code?: string;
  details?: unknown;
}) {
  try {
    await prisma.errorReport.create({
      data: {
        customerId: input.customerId ?? null,
        route: input.route,
        message: input.message,
        statusCode: input.statusCode,
        code: input.code ?? null,
        // Prisma Json attend `Prisma.JsonNull` pour un null explicite, pas
        // `undefined` — un `details` absent doit rester une vraie absence
        // de colonne écrite, pas planter l'insertion.
        details: input.details === undefined ? undefined : (input.details as object),
      },
    });
  } catch {
    // Ne jamais faire échouer la vraie réponse d'erreur à cause d'un souci
    // d'écriture du journal lui-même (ex. base indisponible) — la ligne
    // part déjà dans les logs Vercel via logServerEvent, ce journal est un
    // complément, pas la seule source de vérité.
  }
}

export function parseErrorReportPageParam(value: string | null | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export async function getErrorReportsPage(options?: { page?: number; limit?: number }) {
  const requestedPage = Math.max(options?.page ?? 1, 1);
  const pageSize = Math.min(Math.max(options?.limit ?? DEFAULT_PAGE_SIZE, 1), MAX_PAGE_SIZE);

  const totalCount = await prisma.errorReport.count();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(requestedPage, totalPages);
  const skip = (currentPage - 1) * pageSize;

  const reports = await prisma.errorReport.findMany({
    orderBy: { createdAt: "desc" },
    skip,
    take: pageSize,
    include: {
      customer: { select: { id: true, name: true, firstName: true, lastName: true, email: true } },
    },
  });

  return { reports, totalCount, totalPages, currentPage, pageSize };
}
