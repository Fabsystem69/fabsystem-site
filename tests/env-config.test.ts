import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "@/lib/http-errors";
import {
  getRequiredBaseUrl,
  parseSmtpPort,
  parseSmtpSecure,
  requireServerEnv,
} from "@/lib/server/env";

test("requireServerEnv returns the trimmed value", () => {
  assert.equal(requireServerEnv("TEST_ENV", "  value  "), "value");
});

test("requireServerEnv throws a sanitized error when missing", () => {
  assert.throws(
    () => requireServerEnv("TEST_ENV", "   "),
    (error: unknown) =>
      error instanceof HttpError &&
      error.status === 500 &&
      error.message === "Missing TEST_ENV"
  );
});

test("parseSmtpSecure accepts true and false", () => {
  assert.equal(parseSmtpSecure("true"), true);
  assert.equal(parseSmtpSecure("false"), false);
});

test("parseSmtpPort requires a positive integer", () => {
  assert.equal(parseSmtpPort("587"), 587);

  assert.throws(
    () => parseSmtpPort("invalid"),
    (error: unknown) =>
      error instanceof HttpError &&
      error.status === 500 &&
      error.message === "SMTP_PORT must be a positive integer"
  );
});

test("getRequiredBaseUrl uses the configured public base URL when present", () => {
  const previousBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  process.env.NEXT_PUBLIC_BASE_URL = "https://www.fabsystem.fr/";

  assert.equal(getRequiredBaseUrl("https://preview.example.com/path"), "https://www.fabsystem.fr");

  process.env.NEXT_PUBLIC_BASE_URL = previousBaseUrl;
});

test("getRequiredBaseUrl falls back to request origin outside production", () => {
  const previousBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NEXT_PUBLIC_BASE_URL = "";
  (process.env as Record<string, string | undefined>).NODE_ENV = "development";

  assert.equal(
    getRequiredBaseUrl("https://preview.example.com/api/client-auth/request-link"),
    "https://preview.example.com"
  );

  process.env.NEXT_PUBLIC_BASE_URL = previousBaseUrl;
  (process.env as Record<string, string | undefined>).NODE_ENV = previousNodeEnv;
});

test("getRequiredBaseUrl requires NEXT_PUBLIC_BASE_URL in production", () => {
  const previousBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NEXT_PUBLIC_BASE_URL = "";
  (process.env as Record<string, string | undefined>).NODE_ENV = "production";

  assert.throws(
    () => getRequiredBaseUrl("https://preview.example.com/api/client-auth/request-link"),
    (error: unknown) =>
      error instanceof HttpError &&
      error.status === 500 &&
      error.message === "Missing NEXT_PUBLIC_BASE_URL"
  );

  process.env.NEXT_PUBLIC_BASE_URL = previousBaseUrl;
  (process.env as Record<string, string | undefined>).NODE_ENV = previousNodeEnv;
});
