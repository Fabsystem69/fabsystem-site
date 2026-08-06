import { NextResponse } from "next/server";
import { parseCreateCheckoutRequest } from "@/lib/checkout-request";
import { toErrorResponse } from "@/lib/http-errors";
import { createRateLimitKeyPart, enforceRateLimit } from "@/lib/rate-limit";
import { getRequiredBaseUrl } from "@/lib/server/env";
import { createCheckoutSessionForOrder } from "@/lib/services/checkout";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = parseCreateCheckoutRequest(json);
    enforceRateLimit(request, {
      name: "commerce-checkout",
      limit: 8,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 30 * 60 * 1000,
      keyParts: [createRateLimitKeyPart(parsed.orderId)],
    });
    const baseUrl = getRequiredBaseUrl(request.url);
    const session = await createCheckoutSessionForOrder({
      orderId: parsed.orderId,
      baseUrl,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    return toErrorResponse(error, "api.checkout.post");
  }
}
