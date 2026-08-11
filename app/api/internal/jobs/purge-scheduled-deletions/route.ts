import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { logServerEvent } from "@/lib/server-log";
import { purgeDueScheduledDeletions } from "@/lib/services/project";

// Exécuteur de la suppression différée +72h (MASTER-10 §54-60, §84-85).
// Rejouable et idempotent : la logique de suppression vit entièrement dans
// purgeDueScheduledDeletions() (lib/services/project.ts) — cette route ne
// fait que déclencher ce service existant et journaliser le résultat,
// jamais une seconde logique de suppression.
//
// Deux déclencheurs, une seule logique :
// - GET, avec l'en-tête Authorization envoyé automatiquement par Vercel
//   Cron Jobs (voir vercel.json) quand la variable d'environnement
//   CRON_SECRET est définie sur le projet Vercel : c'est le déclenchement
//   de production réel, sans action Admin (mission UI-8.1 §2-3).
// - POST, avec une session Admin existante (requireApiSession) : conservé
//   pour un déclenchement manuel ponctuel, même principe que le bouton
//   "Tout purger" des commandes (app/api/internal/orders/purge-pending) —
//   mais le fonctionnement de production ne dépend plus de cette action.
export const dynamic = "force-dynamic";

async function runPurgeAndLog(context: string) {
  logServerEvent("info", `${context}: job started`);

  const result = await purgeDueScheduledDeletions();

  logServerEvent(result.failed.length > 0 ? "warn" : "info", `${context}: job finished`, {
    deletedCount: result.deletedCount,
    failedCount: result.failed.length,
    failedProjectIds: result.failed.map((f) => f.projectId),
  });

  return result;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runPurgeAndLog("api.internal.jobs.purge-scheduled-deletions.get[cron]");
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.jobs.purge-scheduled-deletions.get");
  }
}

export async function POST() {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const result = await runPurgeAndLog("api.internal.jobs.purge-scheduled-deletions.post[admin]");
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.jobs.purge-scheduled-deletions.post");
  }
}
