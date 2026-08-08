import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/internal-api";
import { databaseErrorResponse } from "@/lib/prisma-errors";
import { deletePendingOrder } from "@/lib/services/order-purge";

type Params = {
  params: Promise<{
    orderId: string;
  }>;
};

export async function DELETE(_: Request, { params }: Params) {
  const unauthorized = await requireApiSession();
  if (unauthorized) {
    return unauthorized;
  }

  const { orderId } = await params;

  try {
    const result = await deletePendingOrder(orderId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return databaseErrorResponse(error, "api.internal.orders.purge.delete");
  }
}
