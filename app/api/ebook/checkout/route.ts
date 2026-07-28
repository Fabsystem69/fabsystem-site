import { z } from "zod";
import { badRequest, toErrorResponse } from "@/lib/http-errors";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { logServerEvent } from "@/lib/server-log";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);

  try {
    enforceRateLimit(req, {
      name: "ebook-checkout",
      limit: 10,
      windowMs: 15 * 60 * 1000,
      blockDurationMs: 30 * 60 * 1000,
    });

    const priceId = process.env.STRIPE_PRICE_ID_EBOOK;
    if (!priceId) {
      logServerEvent("error", "ebook checkout: missing STRIPE_PRICE_ID_EBOOK", {});
      return Response.json({ error: "Configuration manquante" }, { status: 500 });
    }

    const json = await req.json().catch(() => null);
    const parsed = checkoutSchema.safeParse(json);
    if (!parsed.success) {
      throw badRequest("Invalid checkout payload", parsed.error.flatten());
    }
    const body = parsed.data;
    const origin = new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: body.email,
      metadata: {
        name: body.name,
        email: body.email,
      },
      success_url: `${origin}/ebook/merci`,
      cancel_url: `${origin}/ebook/annule`,
    });

    logServerEvent("info", "ebook checkout session created", {
      ip,
      sessionId: session.id,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    logServerEvent("error", "ebook checkout failed", { ip, error: err });
    return toErrorResponse(err, "api.ebook.checkout");
  }
}
