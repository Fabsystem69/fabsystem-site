import { buildContactMessage, buildProspectIntakeFromContactRequest } from "@/lib/contact-message";
import { assertHumanDelay, parseContactPayload } from "@/lib/contact-request";
import { payloadTooLarge } from "@/lib/http-errors";
import { toErrorResponse } from "@/lib/server/error-response";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendMail } from "@/lib/server/nodemailer";
import { logServerEvent } from "@/lib/server-log";
import { createProspect } from "@/lib/services/prospect";

export const runtime = "nodejs"; // important pour nodemailer sur Vercel

const MAX_REQUEST_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const ip = getClientIp(req);

  try {
    await enforceRateLimit(req, {
      name: "contact",
      limit: 8,
      windowMs: 10 * 60 * 1000,
      blockDurationMs: 20 * 60 * 1000,
    });

    const contentLength = Number(req.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      throw payloadTooLarge("Request payload exceeds 5MB");
    }

    const { data, attachments } = await parseContactPayload(req);
    if (data.company) {
      logServerEvent("warn", "contact honeypot triggered", {
        ip,
        source: data.source,
      });
      return Response.json({ ok: true }, { status: 200 });
    }

    assertHumanDelay(data.startedAt);
    const email = data.email;
    const source = data.source;
    const to = process.env.CONTACT_TO || "contact@fabsystem.fr";
    const from = process.env.CONTACT_FROM || process.env.SMTP_USER || to;
    const { subject, text } = buildContactMessage(data);

    // Enregistrée AVANT l'envoi d'e-mail (jamais après) : si la notification
    // échoue, la demande reste retrouvable dans le CRM plutôt que perdue.
    // Best-effort — un incident base de données ne doit jamais empêcher un
    // visiteur de joindre FabSystem par e-mail.
    try {
      await createProspect({ ...buildProspectIntakeFromContactRequest(data), source: "SITE_WEB" });
    } catch (error) {
      logServerEvent("error", "failed to log contact request as a prospect", { ip, error });
    }

    const mailAttachments =
      attachments.length > 0
        ? await Promise.all(
            attachments.map(async (attachment) => ({
              filename: attachment.filename,
              content: Buffer.from(await attachment.file.arrayBuffer()),
              contentType: attachment.contentType,
            }))
          )
        : undefined;

    await sendMail({
      to,
      from,
      replyTo: email,
      subject,
      text,
      attachments: mailAttachments,
    });

    logServerEvent("info", "contact request sent", {
      ip,
      source,
      attachments: attachments.map((attachment) => ({
        filename: attachment.filename,
        size: attachment.size,
        contentType: attachment.contentType,
      })),
    });

    return Response.json({ ok: true }, { status: 200 });
  } catch (err: unknown) {
    logServerEvent("error", "contact request failed", {
      ip,
      error: err,
    });
    return toErrorResponse(err, "api.contact");
  }
}
