import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { logServerEvent } from "@/lib/server-log";
import { purgeAllEligiblePendingOrders } from "@/lib/services/order-purge";

// Purge quotidienne des commandes PENDING_PAYMENT jamais abouties (audit :
// aucune purge automatique n'existait, seulement un bouton manuel sur
// /dashboard/orders). Meme structure que
// app/api/internal/jobs/dossier-notifications/route.ts : GET pour Vercel
// Cron (voir vercel.json), POST pour un declenchement Admin manuel.
export const dynamic = "force-dynamic";

async function runAndLog(context: string) {
  logServerEvent("info", `${context}: job started`);
  const result = await purgeAllEligiblePendingOrders();
  logServerEvent("info", `${context}: job finished`, result);
  return result;
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAndLog("api.internal.jobs.purge-pending-orders.get[cron]");
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.jobs.purge-pending-orders.get");
  }
}

export async function POST() {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const result = await runAndLog("api.internal.jobs.purge-pending-orders.post[admin]");
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.jobs.purge-pending-orders.post");
  }
}
