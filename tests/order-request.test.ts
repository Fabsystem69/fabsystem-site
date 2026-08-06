import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "@/lib/http-errors";
import { parseCreateOrderRequest } from "@/lib/order-request";

test("parseCreateOrderRequest accepts a valid payload", () => {
  const parsed = parseCreateOrderRequest({
    customerEmail: " Client@Example.com ",
    customerName: " Fabien Lages ",
  });

  assert.equal(parsed.customerEmail, "Client@Example.com");
  assert.equal(parsed.customerName, "Fabien Lages");
});

test("parseCreateOrderRequest rejects an invalid email", () => {
  assert.throws(
    () =>
      parseCreateOrderRequest({
        customerEmail: "not-an-email",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("parseCreateOrderRequest rejects an empty customerName when provided", () => {
  assert.throws(
    () =>
      parseCreateOrderRequest({
        customerEmail: "client@example.com",
        customerName: "   ",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("parseCreateOrderRequest rejects a customerName longer than 120 characters", () => {
  assert.throws(
    () =>
      parseCreateOrderRequest({
        customerEmail: "client@example.com",
        customerName: "a".repeat(121),
      }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});
