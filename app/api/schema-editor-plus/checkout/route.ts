import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, forbidden } from "@/lib/http-errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getRequiredBaseUrl } from "@/lib/server/env";
import { toErrorResponse } from "@/lib/server/error-response";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { createSchemaEditorPlusCheckoutSession } from "@/lib/services/schema-editor-plus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({ plan: z.enum(["weekly", "monthly", "yearly"]) });

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, { name: "schema-editor-plus-checkout", limit: 8, windowMs: 15 * 60 * 1000, blockDurationMs: 30 * 60 * 1000 });
    const actor = await requireCustomerActor();
    if (actor.role !== "customer") throw forbidden("Customer account required");
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw badRequest("Invalid Éditeur Plus plan");
    const result = await createSchemaEditorPlusCheckoutSession({
      customerId: actor.customerId,
      plan: parsed.data.plan,
      baseUrl: getRequiredBaseUrl(request.url),
    });
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error, "api.schema-editor-plus.checkout.post");
  }
}
