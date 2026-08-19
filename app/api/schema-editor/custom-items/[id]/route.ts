import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/http-errors";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { deleteCustomCatalogItem } from "@/lib/services/custom-catalog-item";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireCustomerActor();
    const { id } = await context.params;
    await deleteCustomCatalogItem(actor, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "api.schema-editor.custom-items.delete");
  }
}
