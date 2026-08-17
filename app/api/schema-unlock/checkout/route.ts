import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, toErrorResponse } from "@/lib/http-errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getRequiredBaseUrl } from "@/lib/server/env";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { createSchemaUnlockCheckoutSession } from "@/lib/services/schema-unlock-checkout";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  projectId: z.string().trim().min(1),
});

// Compte requis (v2.1, decision produit) : un Project cloud exige deja un
// compte aujourd'hui, ce checkout n'invente aucun nouveau mecanisme d'auth —
// voir requireCustomerActor, meme garde que /api/projects/[projectId]/schema.
export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, {
      name: "schema-unlock-checkout",
      limit: 10,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 30 * 60 * 1000,
    });

    const actor = await requireCustomerActor();
    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      throw badRequest("Invalid schema unlock checkout request");
    }

    const baseUrl = getRequiredBaseUrl(request.url);
    const session = await createSchemaUnlockCheckoutSession(actor, {
      projectId: parsed.data.projectId,
      baseUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return toErrorResponse(error, "api.schema-unlock.checkout.post");
  }
}
