import { NextResponse } from "next/server";

type ErrorWithCode = {
  code?: string;
  message?: string;
};

const DATABASE_ERROR_CODES = new Set(["P1000", "P1001", "P1002", "P1017"]);

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

export function databaseErrorResponse(error: unknown) {
  return NextResponse.json(
    { error: getDatabaseErrorMessage(error) },
    { status: 503 }
  );
}
