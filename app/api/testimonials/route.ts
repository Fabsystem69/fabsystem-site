import { revalidatePath } from "next/cache";
import { payloadTooLarge } from "@/lib/http-errors";
import { toErrorResponse } from "@/lib/server/error-response";
import {
  assertPublicTestimonialHumanDelay,
  parsePublicTestimonialPayload,
} from "@/lib/public-testimonial-request";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { createTestimonial } from "@/lib/services/testimonials";
import { logServerEvent } from "@/lib/server-log";

export const runtime = "nodejs";

const MAX_REQUEST_BYTES = 64 * 1024;

export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    await enforceRateLimit(request, {
      name: "public-testimonial",
      limit: 4,
      windowMs: 30 * 60 * 1000,
      blockDurationMs: 60 * 60 * 1000,
    });

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      throw payloadTooLarge("Request payload exceeds 64KB");
    }

    const payload = parsePublicTestimonialPayload(await request.json().catch(() => null));

    if (payload.company) {
      logServerEvent("warn", "public testimonial honeypot triggered", {
        ip,
      });
      return Response.json({ ok: true }, { status: 200 });
    }

    assertPublicTestimonialHumanDelay(payload.startedAt);

    await createTestimonial({
      displayName: payload.displayName,
      customerType: payload.customerType,
      vehicleModel: payload.vehicleModel ?? undefined,
      region: payload.region ?? undefined,
      rating: payload.rating,
      quote: payload.quote,
      relatedOffer: payload.relatedOffer ?? undefined,
      // Un avis public n'est jamais marque "verifie" par l'auteur lui-meme.
      isVerifiedPurchase: false,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/content/testimonials");

    logServerEvent("info", "public testimonial submitted", {
      ip,
      displayName: payload.displayName,
      customerType: payload.customerType,
      rating: payload.rating,
    });

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error, "api.testimonials.post");
  }
}
