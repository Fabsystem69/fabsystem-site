import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/http-errors";
import {
  CUSTOMER_SESSION_COOKIE_NAME,
  getCustomerSessionTokenFromCookie,
  getCustomerSessionCookieOptions,
} from "@/lib/server/customer-session";
import { revokeCustomerSession } from "@/lib/services/customer-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const sessionToken = await getCustomerSessionTokenFromCookie();

    if (sessionToken) {
      await revokeCustomerSession(sessionToken);
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, "", {
      ...getCustomerSessionCookieOptions(),
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    return toErrorResponse(error, "api.client-auth.logout.post");
  }
}
