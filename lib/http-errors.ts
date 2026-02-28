import { NextResponse } from "next/server";
import { logServerEvent } from "@/lib/server-log";

export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly headers?: HeadersInit;

  constructor(
    status: number,
    message: string,
    options?: {
      code?: string;
      details?: unknown;
      headers?: HeadersInit;
    }
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = options?.code ?? "HTTP_ERROR";
    this.details = options?.details;
    this.headers = options?.headers;
  }
}

export function badRequest(message: string, details?: unknown) {
  return new HttpError(400, message, { code: "BAD_REQUEST", details });
}

export function unauthorized(message = "Unauthorized") {
  return new HttpError(401, message, { code: "UNAUTHORIZED" });
}

export function forbidden(message = "Forbidden") {
  return new HttpError(403, message, { code: "FORBIDDEN" });
}

export function notFound(message: string) {
  return new HttpError(404, message, { code: "NOT_FOUND" });
}

export function conflict(message: string, details?: unknown) {
  return new HttpError(409, message, { code: "CONFLICT", details });
}

export function payloadTooLarge(message: string) {
  return new HttpError(413, message, { code: "PAYLOAD_TOO_LARGE" });
}

export function unsupportedMediaType(message: string) {
  return new HttpError(415, message, { code: "UNSUPPORTED_MEDIA_TYPE" });
}

export function tooManyRequests(
  message: string,
  retryAfterSeconds: number,
  details?: unknown
) {
  return new HttpError(429, message, {
    code: "RATE_LIMITED",
    details,
    headers: {
      "Retry-After": String(retryAfterSeconds),
    },
  });
}

export function internalServerError(message = "Internal server error") {
  return new HttpError(500, message, { code: "INTERNAL_SERVER_ERROR" });
}

export function serviceUnavailable(message = "Service unavailable") {
  return new HttpError(503, message, { code: "SERVICE_UNAVAILABLE" });
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

export function toErrorResponse(error: unknown, context: string) {
  if (isHttpError(error)) {
    if (error.status >= 500) {
      logServerEvent("error", `${context}: http error`, {
        status: error.status,
        code: error.code,
        details: error.details,
      });
    } else {
      logServerEvent("warn", `${context}: http error`, {
        status: error.status,
        code: error.code,
        details: error.details,
      });
    }

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      {
        status: error.status,
        headers: error.headers,
      }
    );
  }

  logServerEvent("error", `${context}: unexpected error`, {
    error,
  });

  return NextResponse.json(
    {
      error: "Internal server error",
      code: "INTERNAL_SERVER_ERROR",
    },
    { status: 500 }
  );
}
