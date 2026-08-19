import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest } from "@/lib/http-errors";
import { toErrorResponse } from "@/lib/server/error-response";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { redeemTrialAccessCode } from "@/lib/services/trial-access-code";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  code: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    // Limite volontairement stricte : un code promo communautaire est un
    // secret partage, protege comme un mot de passe (bruteforce possible
    // sinon vu que le format n'est pas garanti aleatoire).
    await enforceRateLimit(request, {
      name: "schema-unlock-trial-code-redeem",
      limit: 5,
      windowMs: 10 * 60 * 1000,
      blockDurationMs: 30 * 60 * 1000,
    });

    const actor = await requireCustomerActor();

    if (actor.role !== "customer") {
      throw new Error("Unexpected actor role");
    }

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      throw badRequest("Invalid trial code redemption request");
    }

    const result = await redeemTrialAccessCode(actor.customerId, parsed.data.code);

    if (result.status === "redeemed") {
      return NextResponse.json({ status: result.status, expiresAt: result.expiresAt });
    }

    const messageByStatus: Record<typeof result.status, string> = {
      invalid: "Code invalide ou expiré.",
      already_redeemed: "Vous avez déjà utilisé ce code.",
      exhausted: "Ce code a atteint sa limite d'utilisation.",
    };

    return NextResponse.json(
      { error: messageByStatus[result.status], status: result.status },
      { status: 400 }
    );
  } catch (error) {
    return toErrorResponse(error, "api.schema-unlock.trial-code.redeem.post");
  }
}
