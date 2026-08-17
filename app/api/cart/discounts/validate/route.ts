import { NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/http-errors";
import { applyDiscountToCartSummary } from "@/lib/services/discounts";
import { getCurrentCartFromRequest } from "@/lib/server/cart-session";
import { enforceRateLimit } from "@/lib/rate-limit";

const validateDiscountPayloadSchema = z.object({
  customerEmail: z.string().trim().email().optional(),
  code: z.string().trim().min(1),
});

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, {
      name: "cart-discount-validate",
      limit: 5,
      windowMs: 10 * 60 * 1000,
      blockDurationMs: 30 * 60 * 1000,
    });
    const json = await request.json().catch(() => null);
    const parsed = validateDiscountPayloadSchema.parse(json);
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

    const summary = await applyDiscountToCartSummary({
      code: parsed.code,
      customerEmail: parsed.customerEmail,
      cartId: cart.id,
    });

    return NextResponse.json(summary);
  } catch (error) {
    return toErrorResponse(error, "api.cart.discounts.validate.post");
  }
}
