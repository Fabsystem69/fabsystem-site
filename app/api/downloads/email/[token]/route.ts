import { NextResponse } from "next/server";
import { isHttpError } from "@/lib/http-errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  consumeDownloadGrantViaEmailToken,
  getDownloadAccessForGrantViaEmailToken,
} from "@/lib/services/download-access";
import { verifyDownloadEmailToken } from "@/lib/server/download-email-token";
import { buildDownloadContentDisposition } from "@/lib/server/asset-download";
import { logServerEvent } from "@/lib/server-log";

// Lien de telechargement direct envoye par email (voir
// lib/server/download-email-token.ts) : aucune session client requise, le
// token signe fait foi. Meme structure de reponse que
// /api/downloads/[grantId] (redirect Supabase / stream Vercel Blob).
export const dynamic = "force-dynamic";

const EXPIRED_OR_INVALID_MESSAGE =
  "Ce lien de telechargement n'est plus valide. Connectez-vous a votre espace client pour retrouver vos achats, ou contactez FabSystem.";
const DOWNLOAD_UNAVAILABLE_MESSAGE =
  "Ce telechargement n'est plus disponible. Contactez FabSystem si besoin.";
const MAX_DOWNLOADS_REACHED_MESSAGE =
  "La limite de telechargement est atteinte. Contactez FabSystem pour reactiver l'acces.";
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

type Params = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(request: Request, { params }: Params) {
  const { token } = await params;

  try {
    await enforceRateLimit(request, {
      name: "commerce-downloads-email",
      limit: 20,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 15 * 60 * 1000,
    });

    const grantId = verifyDownloadEmailToken(token);

    if (!grantId) {
      const redirectUrl = new URL("/mon-compte", request.url);
      redirectUrl.searchParams.set("downloadError", EXPIRED_OR_INVALID_MESSAGE);
      return NextResponse.redirect(redirectUrl);
    }

    const access = await getDownloadAccessForGrantViaEmailToken(grantId);
    await consumeDownloadGrantViaEmailToken(grantId);

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
      logServerEvent("error", "api.downloads.email.get: http error", {
        status: error.status,
        code: error.code,
      });
    } else if (isHttpError(error)) {
      logServerEvent("warn", "api.downloads.email.get: http error", {
        status: error.status,
        code: error.code,
      });
    } else {
      logServerEvent("error", "api.downloads.email.get: unexpected error", { error });
    }

    const redirectUrl = new URL("/mon-compte", request.url);
    redirectUrl.searchParams.set("downloadError", getDownloadErrorMessage(error));
    return NextResponse.redirect(redirectUrl);
  }
}
