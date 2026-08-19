import "server-only";

import { NextResponse } from "next/server";
import { logServerEvent } from "@/lib/server-log";
import { isHttpError } from "@/lib/http-errors";
import { getRequestCustomerId } from "@/lib/server/request-context";
import { recordErrorReport } from "@/lib/services/error-reports";

// Séparé de lib/http-errors.ts (qui reste client-safe, voir son commentaire
// d'en-tête) : cette fonction est le point d'appel final de chaque route API
// (`return toErrorResponse(error, context)`, ~35 endroits), donc légitimement
// server-only — NextResponse, logs, et désormais la persistance en base.
//
// Retour utilisateur : "avoir les remontées d'erreur avec l'id du client
// directement dans mon dashboard" — jusqu'ici les erreurs 5xx ne partaient
// que dans les logs Vercel, sans lien vers le compte concerné (voir l'audit
// du 19/08 : IP + horodatage + requête SQL manuelle sur Neon pour identifier
// un client). Persisté en base ici (voir lib/services/error-reports.ts),
// avec l'id client s'il est connu à ce point de la requête (posé par
// `requireCustomerActor()`, voir lib/server/request-context.ts).
export async function toErrorResponse(error: unknown, context: string) {
  if (isHttpError(error)) {
    if (error.status >= 500) {
      logServerEvent("error", `${context}: http error`, {
        status: error.status,
        code: error.code,
        details: error.details,
      });
      await recordErrorReport({
        customerId: getRequestCustomerId(),
        route: context,
        message: error.message,
        statusCode: error.status,
        code: error.code,
        details: error.details,
      });
    } else {
      logServerEvent("warn", `${context}: http error`, {
        status: error.status,
        code: error.code,
        details: error.details,
      });
    }

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      {
        status: error.status,
        headers: error.headers,
      }
    );
  }

  logServerEvent("error", `${context}: unexpected error`, {
    error,
  });
  await recordErrorReport({
    customerId: getRequestCustomerId(),
    route: context,
    message: error instanceof Error ? error.message : String(error),
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
  });

  return NextResponse.json(
    {
      error: "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
    },
    { status: 500 }
  );
}
