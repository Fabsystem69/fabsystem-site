import { NextResponse } from "next/server";
import { unauthorized, toErrorResponse } from "@/lib/http-errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  consumeDownloadGrant,
  getDownloadAccessForGrant,
} from "@/lib/services/download-access";
import { getCustomerSessionFromCookie } from "@/lib/server/customer-session";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{
    grantId: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  try {
    enforceRateLimit(_request, {
      name: "commerce-downloads",
      limit: 20,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 15 * 60 * 1000,
    });

    const session = await getCustomerSessionFromCookie();

    if (!session) {
      throw unauthorized("Customer session not found");
    }

    const { grantId } = await params;
    const customer = {
      customerId: session.customer.id,
      customerEmail: session.customer.email,
    };
    const access = await getDownloadAccessForGrant(grantId, customer);
    await consumeDownloadGrant(grantId, customer);

    return NextResponse.redirect(access.url, { status: 302 });
  } catch (error) {
    return toErrorResponse(error, "api.downloads.get");
  }
}
