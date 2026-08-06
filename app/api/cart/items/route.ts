import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, toErrorResponse } from "@/lib/http-errors";
import { addProductToCart, getCartSummary } from "@/lib/services/cart";
import { getOrCreateCartForRequest } from "@/lib/server/cart-session";

export const dynamic = "force-dynamic";

const addCartItemSchema = z.object({
  productId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = addCartItemSchema.safeParse(json);

    if (!parsed.success) {
      throw badRequest("Invalid cart item payload");
    }

    const cart = await getOrCreateCartForRequest();
    await addProductToCart(cart.id, parsed.data.productId);
    const summary = await getCartSummary(cart.id);

    return NextResponse.json({ ok: true, cart: summary });
  } catch (error) {
    return toErrorResponse(error, "api.cart.items.post");
  }
}
