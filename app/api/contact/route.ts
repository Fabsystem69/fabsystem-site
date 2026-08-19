import { assertHumanDelay, parseContactPayload } from "@/lib/contact-request";
import { payloadTooLarge } from "@/lib/http-errors";
import { toErrorResponse } from "@/lib/server/error-response";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { sendMail } from "@/lib/server/nodemailer";
import { logServerEvent } from "@/lib/server-log";

export const runtime = "nodejs"; // important pour nodemailer sur Vercel

type PayloadValue = string | number | boolean | null | undefined;
type Payload = Record<string, PayloadValue>;
const MAX_REQUEST_BYTES = 5 * 1024 * 1024;

function pick(obj: Payload, keys: string[]) {
  const out: Payload = {};
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") {
      out[k] = obj[k];
    }
  }
  return out;
}

function safeText(v: unknown) {
  return typeof v === "string" ? v : v === undefined || v === null ? "" : String(v);
}

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
    const payload = data as unknown as Payload;
    const name = safeText(data.name);
    const email = safeText(data.email);
    const message = safeText(data.message);
    const source = safeText(data.source);

    const to = process.env.CONTACT_TO || "contact@fabsystem.fr";
    const from = process.env.CONTACT_FROM || process.env.SMTP_USER || to;

    const common = pick(payload, [
      "name",
      "email",
      "phone",
      "bookingDate",
      "supportType",
      "supportModel",
      "goal",
      "currentProblems",
      "batteryCount",
      "batteryType",
      "batteryCapacity",
      "chargingSources",
      "shorePower",
      "inverterPresent",
      "solarPresent",
      "equipmentList",
      "deadline",
      "budgetRange",
      "priorityQ1",
      "priorityQ2",
      "priorityQ3",
      "photosLink",
      "source",
    ]);

    const lines: string[] = [];
    lines.push(`Source: ${source}`);
    lines.push("");
    for (const [k, v] of Object.entries(common)) {
      lines.push(`${k}: ${safeText(v)}`);
    }
    lines.push("");
    lines.push("Message:");
    lines.push(message);

    const subject =
      source === "visio"
        ? `FabSystem — Demande VISIO (${name})`
        : `FabSystem — Contact (${name})`;

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
      text: lines.join("\n"),
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
