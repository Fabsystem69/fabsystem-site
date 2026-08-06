import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "@/lib/http-errors";
import {
  createRateLimitKeyPart,
  enforceRateLimit,
  getClientIp,
} from "@/lib/rate-limit";

function createRequest(ip: string) {
  return new Request("https://example.com/api/test", {
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

test("getClientIp reads the first forwarded IP", () => {
  const request = new Request("https://example.com", {
    headers: {
      "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    },
  });

  assert.equal(getClientIp(request), "203.0.113.10");
});

test("createRateLimitKeyPart normalizes values without exposing the raw input", () => {
  const first = createRateLimitKeyPart(" Buyer@Example.com ");
  const second = createRateLimitKeyPart("buyer@example.com");

  assert.equal(first, second);
  assert.notEqual(first, "buyer@example.com");
});

test("enforceRateLimit allows requests under the limit", () => {
  const request = createRequest("198.51.100.1");

  enforceRateLimit(request, {
    name: "test-rate-limit-allow",
    limit: 2,
    windowMs: 10_000,
  });

  enforceRateLimit(request, {
    name: "test-rate-limit-allow",
    limit: 2,
    windowMs: 10_000,
  });
});

test("enforceRateLimit rejects requests above the limit", () => {
  const request = createRequest("198.51.100.2");

  enforceRateLimit(request, {
    name: "test-rate-limit-reject",
    limit: 1,
    windowMs: 10_000,
    blockDurationMs: 10_000,
  });

  assert.throws(
    () =>
      enforceRateLimit(request, {
        name: "test-rate-limit-reject",
        limit: 1,
        windowMs: 10_000,
        blockDurationMs: 10_000,
      }),
    (error: unknown) =>
      error instanceof HttpError &&
      error.status === 429 &&
      error.code === "RATE_LIMITED"
  );
});

test("enforceRateLimit keeps separate buckets for distinct key parts", () => {
  const request = createRequest("198.51.100.3");

  enforceRateLimit(request, {
    name: "test-rate-limit-key-part",
    limit: 1,
    windowMs: 10_000,
    keyParts: [createRateLimitKeyPart("first@example.com")],
  });

  enforceRateLimit(request, {
    name: "test-rate-limit-key-part",
    limit: 1,
    windowMs: 10_000,
    keyParts: [createRateLimitKeyPart("second@example.com")],
  });
});
