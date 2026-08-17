import { NextResponse } from "next/server";
import { createRateLimitKeyPart, enforceRateLimit } from "@/lib/rate-limit";
import { getRequiredBaseUrl } from "@/lib/server/env";
import {
  parseCustomerAuthRequestLink,
} from "@/lib/customer-auth-request";
import { toErrorResponse } from "@/lib/http-errors";
import { createCustomerAuthRequestLinkService } from "@/lib/services/customer-auth-request-link";
import { requestMagicLoginLink } from "@/lib/services/customer-auth";
import { sendCustomerMagicLoginEmail } from "@/lib/services/customer-email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const input = parseCustomerAuthRequestLink(json);
    await enforceRateLimit(request, {
      name: "client-auth-request-link",
      limit: 5,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 30 * 60 * 1000,
      keyParts: [createRateLimitKeyPart(input.email)],
    });
    const baseUrl = getRequiredBaseUrl(request.url);
    const service = createCustomerAuthRequestLinkService({
      requestMagicLoginLink,
      sendCustomerMagicLoginEmail,
    });

    const result = await service.requestLink({
      email: input.email,
      name: input.name,
      baseUrl,
    });

    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error, "api.client-auth.request-link.post");
  }
}
