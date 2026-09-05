import { NextResponse } from "next/server";
import { isHttpError } from "@/lib/http-errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  consumeResourceGrant,
  getResourceAccessForGrant,
} from "@/lib/services/customer-resource-access";
import { getCustomerSessionFromCookie } from "@/lib/server/customer-session";
import { logServerEvent } from "@/lib/server-log";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{
    grantId: string;
  }>;
};

const MAX_DOWNLOADS_REACHED_MESSAGE =
  "La limite de telechargement est atteinte. Contactez FabSystem pour reactiver l'acces.";
const DOWNLOAD_UNAVAILABLE_MESSAGE =
  "Ce telechargement n'est plus disponible. Contactez FabSystem si besoin.";
const DOWNLOAD_GENERIC_ERROR_MESSAGE =
  "Le telechargement a echoue. Reessayez dans un instant ou contactez FabSystem.";

function getDownloadErrorMessage(error: unknown) {
  if (isHttpError(error)) {
    if (/maximum download count reached/i.test(error.message)) {
      return MAX_DOWNLOADS_REACHED_MESSAGE;
    }

    if (error.status === 409 || error.status === 403 || error.status === 404) {
      return DOWNLOAD_UNAVAILABLE_MESSAGE;
    }
  }

  return DOWNLOAD_GENERIC_ERROR_MESSAGE;
}

export async function GET(request: Request, { params }: Params) {
  const { grantId } = await params;

  try {
    await enforceRateLimit(request, {
      name: "commerce-customer-resources",
      limit: 20,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 15 * 60 * 1000,
    });

    const session = await getCustomerSessionFromCookie();

    if (!session) {
      const loginUrl = new URL("/connexion-client", request.url);
      loginUrl.searchParams.set("returnTo", `/api/customer-resources/${grantId}`);
      return NextResponse.redirect(loginUrl);
    }

    const customer = {
      customerId: session.customer.id,
      customerEmail: session.customer.email,
    };
    const access = await getResourceAccessForGrant(grantId, customer);
    await consumeResourceGrant(grantId, customer);

    return NextResponse.redirect(access.url, { status: 302 });
  } catch (error) {
    if (isHttpError(error) && error.status >= 500) {
      logServerEvent("error", "api.customer-resources.get: http error", {
        grantId,
        status: error.status,
        code: error.code,
      });
    } else if (isHttpError(error)) {
      logServerEvent("warn", "api.customer-resources.get: http error", {
        grantId,
        status: error.status,
        code: error.code,
      });
    } else {
      logServerEvent("error", "api.customer-resources.get: unexpected error", {
        grantId,
        error,
      });
    }

    const redirectUrl = new URL("/mon-compte", request.url);
    redirectUrl.searchParams.set("downloadError", getDownloadErrorMessage(error));

    return NextResponse.redirect(redirectUrl);
  }
}
