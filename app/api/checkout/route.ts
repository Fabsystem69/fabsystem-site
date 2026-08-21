import { NextResponse } from "next/server";
import { parseCreateCheckoutRequest } from "@/lib/checkout-request";
import { toErrorResponse } from "@/lib/server/error-response";
import { createRateLimitKeyPart, enforceRateLimit } from "@/lib/rate-limit";
import { getRequiredBaseUrl } from "@/lib/server/env";
import { getSessionCartId } from "@/lib/server/cart-session";
import { createCheckoutSessionForOrder } from "@/lib/services/checkout";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = parseCreateCheckoutRequest(json);
    await enforceRateLimit(request, {
      name: "commerce-checkout",
      limit: 8,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 30 * 60 * 1000,
      keyParts: [createRateLimitKeyPart(parsed.orderId)],
    });

    // Connaître un orderId ne suffit pas : la commande doit provenir du
    // panier lié au cookie de session de CE navigateur, sinon n'importe qui
    // devinant/observant un orderId pourrait obtenir l'URL Stripe (email +
    // détail de commande d'un tiers).
    const cartId = await getSessionCartId();
    if (!cartId) {
      return NextResponse.json(
        { error: "Cart not found", code: "CART_NOT_FOUND" },
        { status: 404 }
      );
    }

    const baseUrl = getRequiredBaseUrl(request.url);
    const session = await createCheckoutSessionForOrder({
      orderId: parsed.orderId,
      cartId,
      baseUrl,
      needsAnswers: parsed.needsAnswers,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    return toErrorResponse(error, "api.checkout.post");
  }
}
