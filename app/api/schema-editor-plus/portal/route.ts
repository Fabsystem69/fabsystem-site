import { NextResponse } from "next/server";
import { forbidden } from "@/lib/http-errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getRequiredBaseUrl } from "@/lib/server/env";
import { toErrorResponse } from "@/lib/server/error-response";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { createSchemaEditorPlusPortalSession } from "@/lib/services/schema-editor-plus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, { name: "schema-editor-plus-portal", limit: 10, windowMs: 15 * 60 * 1000, blockDurationMs: 30 * 60 * 1000 });
    const actor = await requireCustomerActor();
    if (actor.role !== "customer") throw forbidden("Customer account required");
    const result = await createSchemaEditorPlusPortalSession({ customerId: actor.customerId, baseUrl: getRequiredBaseUrl(request.url) });
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error, "api.schema-editor-plus.portal.post");
  }
}
