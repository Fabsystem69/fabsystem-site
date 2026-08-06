import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/http-errors";
import { clearCart, getCartSummary } from "@/lib/services/cart";
import { getCurrentCartFromRequest } from "@/lib/server/cart-session";

export const dynamic = "force-dynamic";

function getEmptyCartSummary() {
  return {
    cartId: null,
    status: "ACTIVE" as const,
    itemCount: 0,
    currency: "EUR",
    subtotalCents: 0,
    lines: [],
  };
}

export async function GET() {
  try {
    const cart = await getCurrentCartFromRequest();

    if (!cart) {
      return NextResponse.json({ cart: getEmptyCartSummary() });
    }

    const summary = await getCartSummary(cart.id);
    return NextResponse.json({ cart: summary });
  } catch (error) {
    return toErrorResponse(error, "api.cart.get");
  }
}

export async function DELETE() {
  try {
    const cart = await getCurrentCartFromRequest();

    if (!cart) {
      return NextResponse.json({ ok: true, cart: getEmptyCartSummary() });
    }

    await clearCart(cart.id);

    return NextResponse.json({
      ok: true,
      cart: {
        cartId: cart.id,
        status: "ACTIVE" as const,
        itemCount: 0,
        currency: "EUR",
        subtotalCents: 0,
        lines: [],
      },
    });
  } catch (error) {
    return toErrorResponse(error, "api.cart.delete");
  }
}
