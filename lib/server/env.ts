import { internalServerError } from "@/lib/http-errors";

export function requireServerEnv(name: string, value: string | undefined) {
  const normalized = value?.trim();

  if (!normalized) {
    throw internalServerError(`Missing ${name}`);
  }

  return normalized;
}

export function parseSmtpSecure(value: string | undefined) {
  const normalized = requireServerEnv("SMTP_SECURE", value).toLowerCase();

  if (normalized !== "true" && normalized !== "false") {
    throw internalServerError("SMTP_SECURE must be 'true' or 'false'");
  }

  return normalized === "true";
}

export function parseSmtpPort(value: string | undefined) {
  const normalized = requireServerEnv("SMTP_PORT", value);
  const parsed = Number(normalized);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw internalServerError("SMTP_PORT must be a positive integer");
  }

  return parsed;
}

export function getRequiredBaseUrl(requestUrl?: string) {
  const configured = process.env.NEXT_PUBLIC_BASE_URL?.trim();

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV !== "production" && requestUrl) {
    return new URL(requestUrl).origin;
  }

  throw internalServerError("Missing NEXT_PUBLIC_BASE_URL");
}
