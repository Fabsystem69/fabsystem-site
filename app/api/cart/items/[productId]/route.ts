import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/server/error-response";
import { getCartSummary, removeProductFromCart } from "@/lib/services/cart";
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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  try {
    const cart = await getCurrentCartFromRequest();

    if (!cart) {
      return NextResponse.json({ ok: true, cart: getEmptyCartSummary() });
    }

    const { productId } = await context.params;
    await removeProductFromCart(cart.id, productId);
    const summary = await getCartSummary(cart.id);

    return NextResponse.json({ ok: true, cart: summary });
  } catch (error) {
    return toErrorResponse(error, "api.cart.items.delete");
  }
}
