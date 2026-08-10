import { buildCustomerAuthRequestLinkResponse } from "@/lib/customer-auth-request";
import { internalServerError } from "@/lib/http-errors";
import { logServerEvent } from "@/lib/server-log";
import { hasCustomerEmailConfig } from "@/lib/services/customer-email";
import type { RequestMagicLoginLinkResult } from "@/lib/services/customer-auth";

type RequestCustomerMagicLinkInput = {
  email: string;
  name?: string;
  baseUrl: string;
};

type RuntimeEnvironment = NodeJS.ProcessEnv["NODE_ENV"];

type RequestCustomerMagicLinkDeps = {
  requestMagicLoginLink: (
    input: RequestCustomerMagicLinkInput
  ) => Promise<RequestMagicLoginLinkResult>;
  sendCustomerMagicLoginEmail: (input: {
    to: string;
    magicLink: string;
    expiresAt: Date;
  }) => Promise<void>;
  runtimeEnvironment?: RuntimeEnvironment;
};

function createEmailFailureError(runtimeEnvironment: RuntimeEnvironment, error: unknown) {
  if (runtimeEnvironment === "production") {
    return internalServerError("Unable to send login email");
  }

  return internalServerError(
    error instanceof Error ? error.message : "Unable to send login email"
  );
}

export function createCustomerAuthRequestLinkService(deps: RequestCustomerMagicLinkDeps) {
  const runtimeEnvironment = deps.runtimeEnvironment ?? process.env.NODE_ENV ?? "development";
  const isProduction = runtimeEnvironment === "production";

  return {
    async requestLink(input: RequestCustomerMagicLinkInput) {
      const result = await deps.requestMagicLoginLink(input);

      if (result.status === "customer_not_found") {
        // Réponse publique anti-énumération identique au cas "trouvé" :
        // aucune information sur l'existence du compte n'est révélée.
        logServerEvent("info", "customer magic link requested for unknown email", {
          reason: "customer-not-found",
        });

        return buildCustomerAuthRequestLinkResponse({}, runtimeEnvironment);
      }

      if (!result.magicLink) {
        throw internalServerError("Customer auth base URL is not configured");
      }

      if (!isProduction && !hasCustomerEmailConfig()) {
        logServerEvent("info", "customer magic link email skipped in development", {
          email: result.email,
          reason: "missing-smtp-config",
        });

        return buildCustomerAuthRequestLinkResponse(result, runtimeEnvironment);
      }

      try {
        await deps.sendCustomerMagicLoginEmail({
          to: result.email,
          magicLink: result.magicLink,
          expiresAt: result.expiresAt,
        });
      } catch (error) {
        logServerEvent("error", "customer magic link email failed", {
          email: result.email,
          expiresAt: result.expiresAt.toISOString(),
          error,
        });
        throw createEmailFailureError(runtimeEnvironment, error);
      }

      return buildCustomerAuthRequestLinkResponse(result, runtimeEnvironment);
    },
  };
}
