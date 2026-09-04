import { NextResponse } from "next/server";
import { badRequest } from "@/lib/http-errors";
import { toErrorResponse } from "@/lib/server/error-response";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getRequiredBaseUrl } from "@/lib/server/env";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { createCoachingCheckoutSession } from "@/lib/services/coaching-checkout";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Compte requis via requireCustomerActor — pas de nouveau mécanisme d'auth
// inventé ici.
export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, {
      name: "coaching-checkout",
      limit: 10,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 30 * 60 * 1000,
    });

    const actor = await requireCustomerActor();
    const baseUrl = getRequiredBaseUrl(request.url);
    const session = await createCoachingCheckoutSession(actor, { baseUrl });

    if (!session.url) {
      throw badRequest("Coaching checkout session could not be created");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return toErrorResponse(error, "api.coaching.checkout.post");
  }
}
