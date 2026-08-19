import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest } from "@/lib/http-errors";
import { toErrorResponse } from "@/lib/server/error-response";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireCustomerActor } from "@/lib/server/project-actor";
import { setOwnCustomerPassword } from "@/lib/services/customer-password-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

// Atteignable uniquement avec une session client active — obtenue via le
// lien magique (app/api/client-auth/verify), reconverti en flux "definir/
// reinitialiser mon mot de passe" (v2.1, retour utilisateur sur le lien
// magique comme mode de connexion habituel).
export async function POST(request: Request) {
  try {
    const actor = await requireCustomerActor();

    await enforceRateLimit(request, {
      name: "client-auth-set-password",
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);

    if (!parsed.success) {
      throw badRequest(parsed.error.issues[0]?.message ?? "Invalid password");
    }

    await setOwnCustomerPassword(actor, parsed.data.password);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "api.client-auth.set-password.post");
  }
}
