import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "@/lib/http-errors";
import {
  buildCustomerAuthRequestLinkResponse,
  parseCustomerAuthRequestLink,
} from "@/lib/customer-auth-request";

test("parseCustomerAuthRequestLink accepts a valid payload", () => {
  const parsed = parseCustomerAuthRequestLink({
    email: " Client@Example.com ",
    name: " Fabien Lages ",
  });

  assert.equal(parsed.email, "Client@Example.com");
  assert.equal(parsed.name, "Fabien Lages");
});

test("parseCustomerAuthRequestLink accepts a payload without name", () => {
  const parsed = parseCustomerAuthRequestLink({
    email: "client@example.com",
  });

  assert.equal(parsed.email, "client@example.com");
  assert.equal(parsed.name, undefined);
});

test("parseCustomerAuthRequestLink rejects an invalid email", () => {
  assert.throws(
    () =>
      parseCustomerAuthRequestLink({
        email: "not-an-email",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("parseCustomerAuthRequestLink rejects an empty name when provided", () => {
  assert.throws(
    () =>
      parseCustomerAuthRequestLink({
        email: "client@example.com",
        name: "   ",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("buildCustomerAuthRequestLinkResponse exposes the magic link outside production", () => {
  const response = buildCustomerAuthRequestLinkResponse(
    { magicLink: "https://example.com/api/client-auth/verify?token=abc" },
    "development"
  );

  assert.equal(response.ok, true);
  assert.equal(
    response.magicLink,
    "https://example.com/api/client-auth/verify?token=abc"
  );
});

test("buildCustomerAuthRequestLinkResponse hides the magic link in production", () => {
  const response = buildCustomerAuthRequestLinkResponse(
    { magicLink: "https://example.com/api/client-auth/verify?token=abc" },
    "production"
  );

  assert.equal(response.ok, true);
  assert.equal("magicLink" in response, false);
});
