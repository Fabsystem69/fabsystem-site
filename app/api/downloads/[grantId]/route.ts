import { NextResponse } from "next/server";
import { isHttpError } from "@/lib/http-errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  consumeDownloadGrant,
  getDownloadAccessForGrant,
} from "@/lib/services/download-access";
import { buildDownloadContentDisposition } from "@/lib/server/asset-download";
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
      name: "commerce-downloads",
      limit: 20,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 15 * 60 * 1000,
    });

    const session = await getCustomerSessionFromCookie();

    if (!session) {
      // Bug remonte par un client : le lien de telechargement (email ou
      // /mon-compte/achats) renvoyait vers une page de connexion generique,
      // sans contexte ni retour automatique vers le fichier une fois
      // connecte — le client comprenait "ca ne marche pas" et contactait
      // Fabien pour un envoi manuel. returnTo ramene directement ici apres
      // connexion/creation de compte.
      const loginUrl = new URL("/connexion-client", request.url);
      loginUrl.searchParams.set("returnTo", `/api/downloads/${grantId}`);
      return NextResponse.redirect(loginUrl);
    }

    const customer = {
      customerId: session.customer.id,
      customerEmail: session.customer.email,
    };
    const access = await getDownloadAccessForGrant(grantId, customer);
    await consumeDownloadGrant(grantId, customer);

    // Supabase : URL signee, le navigateur la recupere directement (redirect).
    // Vercel Blob (store prive, pas d'URL signee equivalente) : la route
    // relaie elle-meme le flux, avec le nom de fichier reel en en-tete.
    if (access.mode === "redirect") {
      return NextResponse.redirect(access.url, { status: 302 });
    }

    return new NextResponse(access.stream, {
      headers: {
        "Content-Type": access.contentType,
        "Content-Disposition": buildDownloadContentDisposition(access.contentType, access.grant.asset.filename),
      },
    });
  } catch (error) {
    if (isHttpError(error) && error.status >= 500) {
      logServerEvent("error", "api.downloads.get: http error", {
        grantId,
        status: error.status,
        code: error.code,
      });
    } else if (isHttpError(error)) {
      logServerEvent("warn", "api.downloads.get: http error", {
        grantId,
        status: error.status,
        code: error.code,
      });
    } else {
      logServerEvent("error", "api.downloads.get: unexpected error", {
        grantId,
        error,
      });
    }

    const redirectUrl = new URL("/mon-compte", request.url);
    redirectUrl.searchParams.set("downloadError", getDownloadErrorMessage(error));

    return NextResponse.redirect(redirectUrl);
  }
}
