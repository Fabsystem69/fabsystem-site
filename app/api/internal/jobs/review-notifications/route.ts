import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { logServerEvent } from "@/lib/server-log";
import { retryPendingReviewNotifications } from "@/lib/services/coaching-review-submission";

// Relance des notifications « projet transmis » restees sans marqueur
// REVIEW_NOTIFIED — meme structure que jobs/dossier-notifications : GET pour
// Vercel Cron (voir vercel.json), POST pour un declenchement Admin manuel.
export const dynamic = "force-dynamic";

async function runAndLog(context: string) {
  logServerEvent("info", `${context}: job started`);
  const result = await retryPendingReviewNotifications();
  logServerEvent("info", `${context}: job finished`, result);
  return result;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAndLog("api.internal.jobs.review-notifications.get[cron]");
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.jobs.review-notifications.get");
  }
}

export async function POST() {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const result = await runAndLog("api.internal.jobs.review-notifications.post[admin]");
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.jobs.review-notifications.post");
  }
}
