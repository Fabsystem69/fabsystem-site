import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/server/error-response";
import {
  CUSTOMER_SESSION_COOKIE_NAME,
  getCustomerSessionTokenFromCookie,
  getCustomerSessionCookieOptions,
} from "@/lib/server/customer-session";
import { revokeCustomerSession } from "@/lib/services/customer-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const sessionToken = await getCustomerSessionTokenFromCookie();

    if (sessionToken) {
      await revokeCustomerSession(sessionToken);
    }

    // La déconnexion peut être déclenchée par un formulaire ou par un bouton
    // client. La redirection est suivie dans les deux cas et évite une page
    // technique JSON lorsque l'utilisateur quitte son compte.
    const response = NextResponse.redirect(new URL("/connexion-client", request.url), 303);
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
