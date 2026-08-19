import { NextResponse } from "next/server";
import { createOrderFromCart } from "@/lib/services/order";
import { toErrorResponse } from "@/lib/server/error-response";
import { parseCreateOrderRequest } from "@/lib/order-request";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getCurrentCartFromRequest } from "@/lib/server/cart-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = parseCreateOrderRequest(json);
    await enforceRateLimit(request, {
      name: "commerce-orders",
      limit: 8,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 30 * 60 * 1000,
    });
    const cart = await getCurrentCartFromRequest();

    if (!cart) {
      return NextResponse.json(
        {
          error: "Cart not found",
          code: "CART_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const order = await createOrderFromCart({
      cartId: cart.id,
      customerEmail: parsed.customerEmail,
      customerName: parsed.customerName,
      discountCode: parsed.discountCode,
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalCents: order.totalCents,
      currency: order.currency,
      requiresPayment: order.totalCents > 0,
    });
  } catch (error) {
    return toErrorResponse(error, "api.orders.post");
  }
}
