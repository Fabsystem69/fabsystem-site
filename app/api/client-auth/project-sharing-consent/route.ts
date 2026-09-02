import { NextResponse } from "next/server";
import { badRequest } from "@/lib/http-errors";
import { toErrorResponse } from "@/lib/server/error-response";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { getOwnCustomerProfile, updateOwnProjectSharingConsent } from "@/lib/services/customer-profile";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const actor = await requireCustomerActor();
    const customer = await getOwnCustomerProfile(actor);
    return NextResponse.json({ enabled: customer.dataShareConsent });
  } catch (error) {
    return toErrorResponse(error, "api.client-auth.project-sharing-consent.get");
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { enabled?: unknown } | null;
    if (typeof body?.enabled !== "boolean") throw badRequest("enabled must be a boolean");
    const actor = await requireCustomerActor();
    await updateOwnProjectSharingConsent(actor, body.enabled);
    return NextResponse.json({ enabled: body.enabled });
  } catch (error) {
    return toErrorResponse(error, "api.client-auth.project-sharing-consent.put");
  }
}
