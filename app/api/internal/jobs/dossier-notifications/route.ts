import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { logServerEvent } from "@/lib/server-log";
import { runDossierNotifications } from "@/lib/services/dossier-notifications";

// Relance quotidienne des dossiers d'accompagnement — meme structure que
// app/api/internal/jobs/schema-unlock-reminders/route.ts : GET pour Vercel
// Cron (voir vercel.json), POST pour un declenchement Admin manuel.
export const dynamic = "force-dynamic";

async function runAndLog(context: string) {
  logServerEvent("info", `${context}: job started`);
  const result = await runDossierNotifications();
  logServerEvent("info", `${context}: job finished`, result);
  return result;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAndLog("api.internal.jobs.dossier-notifications.get[cron]");
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.jobs.dossier-notifications.get");
  }
}

export async function POST() {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const result = await runAndLog("api.internal.jobs.dossier-notifications.post[admin]");
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.jobs.dossier-notifications.post");
  }
}
