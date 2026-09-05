import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { logServerEvent } from "@/lib/server-log";
import { sendEditorCrmAutoReminders } from "@/lib/services/editor-crm";

// Relance quotidienne des comptes qui utilisent l'editeur de schema sans
// abonnement Editeur Plus — meme structure que
// app/api/internal/jobs/schema-unlock-reminders/route.ts : GET pour Vercel
// Cron (voir vercel.json), POST pour un declenchement Admin manuel depuis
// la page CRM.
export const dynamic = "force-dynamic";

async function runRemindersAndLog(context: string) {
  logServerEvent("info", `${context}: job started`);

  const result = await sendEditorCrmAutoReminders();

  logServerEvent("info", `${context}: job finished`, result);

  return result;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runRemindersAndLog("api.internal.jobs.editor-crm-reminders.get[cron]");
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.jobs.editor-crm-reminders.get");
  }
}

export async function POST() {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const result = await runRemindersAndLog("api.internal.jobs.editor-crm-reminders.post[admin]");
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.jobs.editor-crm-reminders.post");
  }
}
