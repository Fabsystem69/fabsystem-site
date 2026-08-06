import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "@/lib/http-errors";
import { parseCreateCheckoutRequest } from "@/lib/checkout-request";

test("parseCreateCheckoutRequest accepts a valid payload", () => {
  const parsed = parseCreateCheckoutRequest({
    orderId: " order_123 ",
  });

  assert.equal(parsed.orderId, "order_123");
});

test("parseCreateCheckoutRequest rejects an empty payload", () => {
  assert.throws(
    () => parseCreateCheckoutRequest({}),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("parseCreateCheckoutRequest rejects an empty orderId", () => {
  assert.throws(
    () =>
      parseCreateCheckoutRequest({
        orderId: "   ",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});
