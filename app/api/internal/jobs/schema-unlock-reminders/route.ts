import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { logServerEvent } from "@/lib/server-log";
import { sendExpiringUnlockReminders } from "@/lib/services/schema-unlock-reminders";

// v2.1 : relance quotidienne avant expiration d'un deblocage editeur de
// schema (achat 60 jours ou code promo 7 jours) — meme structure que
// app/api/internal/jobs/purge-scheduled-deletions/route.ts : GET pour
// Vercel Cron (voir vercel.json), POST pour un declenchement Admin manuel.
export const dynamic = "force-dynamic";

async function runRemindersAndLog(context: string) {
  logServerEvent("info", `${context}: job started`);

  const result = await sendExpiringUnlockReminders();

  logServerEvent("info", `${context}: job finished`, result);

  return result;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runRemindersAndLog(
      "api.internal.jobs.schema-unlock-reminders.get[cron]"
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.jobs.schema-unlock-reminders.get");
  }
}

export async function POST() {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const result = await runRemindersAndLog(
      "api.internal.jobs.schema-unlock-reminders.post[admin]"
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.jobs.schema-unlock-reminders.post");
  }
}
