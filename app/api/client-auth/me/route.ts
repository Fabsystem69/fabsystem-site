import { NextResponse } from "next/server";
import { unauthorized } from "@/lib/http-errors";
import { toErrorResponse } from "@/lib/server/error-response";
import { getCustomerSessionFromCookie } from "@/lib/server/customer-session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCustomerSessionFromCookie();

    if (!session) {
      throw unauthorized("Customer session not found");
    }

    return NextResponse.json({
      customer: session.customer,
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (error) {
    return toErrorResponse(error, "api.client-auth.me.get");
  }
}
