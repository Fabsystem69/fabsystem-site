import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { purgeAllEligiblePendingOrders } from "@/lib/services/order-purge";

// Purge manuelle uniquement : aucun cron ne declenche cette route, elle
// n'est appelee que par l'action "Tout purger" du dashboard (avec
// confirmation obligatoire cote UI).
export async function POST() {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const result = await purgeAllEligiblePendingOrders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.orders.purge-pending.post");
  }
}
