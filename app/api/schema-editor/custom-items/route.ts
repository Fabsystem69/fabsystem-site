import { NextResponse } from "next/server";
import { badRequest } from "@/lib/http-errors";
import { toErrorResponse } from "@/lib/server/error-response";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { createCustomCatalogItem, listCustomCatalogItemsForCustomer } from "@/lib/services/custom-catalog-item";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const actor = await requireCustomerActor();
    const items = await listCustomCatalogItemsForCustomer(actor);
    return NextResponse.json({ items });
  } catch (error) {
    return toErrorResponse(error, "api.schema-editor.custom-items.get");
  }
}

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, {
      name: "custom-catalog-item-create",
      limit: 20,
      windowMs: 60 * 60 * 1000,
      blockDurationMs: 60 * 60 * 1000,
    });

    const actor = await requireCustomerActor();
    const body = await request.json();

    if (
      typeof body?.componentType !== "string" ||
      typeof body?.brand !== "string" ||
      typeof body?.model !== "string" ||
      typeof body?.imageDataUrl !== "string" ||
      typeof body?.defaults !== "object" ||
      body.defaults === null
    ) {
      throw badRequest("Invalid custom catalog item payload");
    }

    const item = await createCustomCatalogItem(actor, {
      componentType: body.componentType,
      brand: body.brand,
      model: body.model,
      defaults: body.defaults,
      imageDataUrl: body.imageDataUrl,
    });

    return NextResponse.json({ item });
  } catch (error) {
    return toErrorResponse(error, "api.schema-editor.custom-items.post");
  }
}
