import { isHttpError, conflict, notFound, serviceUnavailable, toErrorResponse } from "@/lib/http-errors";

type ErrorWithCode = {
  code?: string;
  message?: string;
};

const DATABASE_ERROR_CODES = new Set(["P1000", "P1001", "P1002", "P1017"]);
const CONFLICT_ERROR_CODES = new Set(["P2002"]);
const NOT_FOUND_ERROR_CODES = new Set(["P2025"]);

export function isDatabaseConnectionError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = (error as ErrorWithCode).code;
  return typeof code === "string" && DATABASE_ERROR_CODES.has(code);
}

export function getDatabaseErrorMessage(error: unknown) {
  if (isDatabaseConnectionError(error)) {
    return "Database unavailable. Check DATABASE_URL / Neon connectivity.";
  }

  return "Database request failed.";
}

export function mapPrismaError(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const code = (error as ErrorWithCode).code;
  const message = (error as ErrorWithCode).message ?? "Database request failed.";

  if (typeof code !== "string") {
    return null;
  }

  if (DATABASE_ERROR_CODES.has(code)) {
    return serviceUnavailable(getDatabaseErrorMessage(error));
  }

  if (CONFLICT_ERROR_CODES.has(code)) {
    return conflict(message);
  }

  if (NOT_FOUND_ERROR_CODES.has(code)) {
    return notFound("Resource not found");
  }

  return null;
}

export function databaseErrorResponse(error: unknown, context = "database") {
  if (isHttpError(error)) {
    return toErrorResponse(error, context);
  }

  const mapped = mapPrismaError(error);
  if (mapped) {
    return toErrorResponse(mapped, context);
  }

  return toErrorResponse(error, context);
}
