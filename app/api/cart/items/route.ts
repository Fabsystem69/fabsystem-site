import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest } from "@/lib/http-errors";
import { toErrorResponse } from "@/lib/server/error-response";
import { addProductToCart, getCartSummary } from "@/lib/services/cart";
import { getProductBySlug } from "@/lib/services/catalog";
import { getOrCreateCartForRequest } from "@/lib/server/cart-session";

export const dynamic = "force-dynamic";

const addCartItemSchema = z.object({
  productId: z.string().trim().min(1).optional(),
  productSlug: z.string().trim().min(1).optional(),
}).refine((data) => Boolean(data.productId || data.productSlug), {
  message: "A product id or slug is required",
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = addCartItemSchema.safeParse(json);

    if (!parsed.success) {
      throw badRequest("Invalid cart item payload");
    }

    const productId = parsed.data.productId ?? (await getProductBySlug(parsed.data.productSlug as string)).id;
    const cart = await getOrCreateCartForRequest();
    await addProductToCart(cart.id, productId);
    const summary = await getCartSummary(cart.id);

    return NextResponse.json({ ok: true, cart: summary });
  } catch (error) {
    return toErrorResponse(error, "api.cart.items.post");
  }
}
