import { z } from "zod";
import {
  badRequest,
  payloadTooLarge,
  unsupportedMediaType,
} from "@/lib/http-errors";

const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 4 * 1024 * 1024;
const MIN_FORM_FILL_MS = 1500;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
]);

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .nullable()
  .transform((value) => (value && value.length > 0 ? value : null));

const emailField = z.string().trim().email().max(320);

const baseContactSchema = z.object({
  source: z.enum(["contact", "visio"]).default("contact"),
  name: z.string().trim().min(1).max(120),
  email: emailField,
  phone: optionalText,
  message: z.string().trim().min(10).max(8000),
  company: z
    .string()
    .optional()
    .transform((value) => (value ? value.trim() : "")),
  startedAt: z.coerce.number().int().positive(),
});

const contactSchema = baseContactSchema.extend({
  supportType: optionalText,
  requestType: optionalText,
  urgency: optionalText,
  context: optionalText,
});

const visioSchema = baseContactSchema.extend({
  bookingDate: optionalText,
  supportType: optionalText,
  supportModel: optionalText,
  goal: optionalText,
  currentProblems: optionalText,
  batteryCount: optionalText,
  batteryType: optionalText,
  batteryCapacity: optionalText,
  chargingSources: optionalText,
  shorePower: optionalText,
  inverterPresent: optionalText,
  solarPresent: optionalText,
  equipmentList: optionalText,
  deadline: optionalText,
  budgetRange: optionalText,
  priorityQ1: optionalText,
  priorityQ2: optionalText,
  priorityQ3: optionalText,
  photosLink: optionalText,
});

export type ContactRequestData = z.infer<typeof contactSchema>;
export type VisioRequestData = z.infer<typeof visioSchema>;
export type PublicContactRequest = ContactRequestData | VisioRequestData;

export type ValidatedAttachment = {
  filename: string;
  contentType: string;
  size: number;
  file: File;
};

export function assertHumanDelay(startedAt: number) {
  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs < MIN_FORM_FILL_MS) {
    throw badRequest("Form submitted too quickly", {
      elapsedMs,
      minMs: MIN_FORM_FILL_MS,
    });
  }
}

export async function parseContactPayload(request: Request): Promise<{
  data: PublicContactRequest;
  attachments: ValidatedAttachment[];
}> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const json = await request.json().catch(() => null);
    const parsed = contactSchema.safeParse(json);

    if (!parsed.success) {
      throw badRequest("Invalid contact payload", parsed.error.flatten());
    }

    return {
      data: parsed.data,
      attachments: [],
    };
  }

  if (!contentType.includes("multipart/form-data")) {
    throw unsupportedMediaType("Unsupported content type");
  }

  const formData = await request.formData();
  const rawData = Object.fromEntries(
    Array.from(formData.entries()).filter(([, value]) => !(value instanceof File))
  );
  const source = typeof rawData.source === "string" ? rawData.source : "contact";
  const schema = source === "visio" ? visioSchema : contactSchema;
  const parsed = schema.safeParse(rawData);

  if (!parsed.success) {
    throw badRequest("Invalid contact payload", parsed.error.flatten());
  }

  const files = formData.getAll("photos").filter((value) => value instanceof File) as File[];
  const attachments = validateAttachments(files);

  return {
    data: parsed.data,
    attachments,
  };
}

function validateAttachments(files: File[]) {
  if (files.length > MAX_ATTACHMENTS) {
    throw payloadTooLarge(`Maximum ${MAX_ATTACHMENTS} files allowed`);
  }

  const attachments: ValidatedAttachment[] = [];
  let totalBytes = 0;

  for (const file of files) {
    if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
      throw unsupportedMediaType(
        `Unsupported attachment type: ${file.type || "unknown"}`
      );
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      throw payloadTooLarge(`File ${file.name} exceeds 2MB`);
    }

    totalBytes += file.size;
    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      throw payloadTooLarge("Total attachment size exceeds 4MB");
    }

    attachments.push({
      filename: file.name || "attachment",
      contentType: file.type,
      size: file.size,
      file,
    });
  }

  return attachments;
}
