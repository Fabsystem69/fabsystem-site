import assert from "node:assert/strict";
import test from "node:test";
import { redactSensitive, redactSensitiveString } from "@/lib/redact-sensitive";

test("redactSensitiveString redacts token query parameters", () => {
  const result = redactSensitiveString(
    "https://example.com/api/client-auth/verify?token=raw-token-123"
  );

  assert.equal(
    result,
    "https://example.com/api/client-auth/verify?token=[REDACTED]"
  );
});

test("redactSensitiveString redacts bearer tokens and cookie-like headers", () => {
  assert.equal(
    redactSensitiveString("Authorization: Bearer super-secret-token"),
    "Authorization: Bearer [REDACTED]"
  );
  assert.equal(
    redactSensitiveString("cookie: fabsystem_customer_session=abc123"),
    "cookie: [REDACTED]"
  );
});

test("redactSensitive redacts sensitive object keys recursively", () => {
  const result = redactSensitive({
    token: "raw-token",
    nested: {
      sessionToken: "session-123",
      url: "https://example.com/download?token=abc",
    },
    list: [
      {
        authorization: "Bearer value",
      },
    ],
  });

  assert.deepEqual(result, {
    token: "[REDACTED]",
    nested: {
      sessionToken: "[REDACTED]",
      url: "https://example.com/download?token=[REDACTED]",
    },
    list: [
      {
        authorization: "[REDACTED]",
      },
    ],
  });
});
