import { NextResponse } from "next/server";
import { createOrderFromCart } from "@/lib/services/order";
import { toErrorResponse } from "@/lib/server/error-response";
import { parseCreateOrderRequest } from "@/lib/order-request";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getCurrentCartFromRequest } from "@/lib/server/cart-session";
import { getCustomerSessionFromCookie } from "@/lib/server/customer-session";

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

    // Un compte est desormais obligatoire pour commander (retour
    // utilisateur : trop ambigu pour le SAV/retours en guest checkout) —
    // l'identite de la commande vient toujours de la session, jamais du
    // corps de la requete, pour ne pas dependre d'un email librement
    // saisi par le client.
    const session = await getCustomerSessionFromCookie();

    if (!session) {
      return NextResponse.json(
        { error: "Un compte est requis pour valider une commande", code: "ACCOUNT_REQUIRED" },
        { status: 401 }
      );
    }

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
      customerEmail: session.customer.email,
      customerName: session.customer.name ?? parsed.customerName,
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
