import assert from "node:assert/strict";
import test from "node:test";
import {
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifySession,
} from "@/lib/session";
import { decodeUtf8Base64Url, splitSignedToken } from "@/lib/session-token";

test("session tokens round-trip with role payload", () => {
  const now = Math.floor(Date.now() / 1000);
  const token = signSession(
    {
      sub: "fabien.lages@fabsystem.fr",
      role: "admin",
      iat: now,
      exp: now + SESSION_MAX_AGE_SECONDS,
    },
    "test-secret"
  );

  const payload = verifySession(token, "test-secret");

  assert.deepEqual(payload, {
    sub: "fabien.lages@fabsystem.fr",
    role: "admin",
    iat: now,
    exp: now + SESSION_MAX_AGE_SECONDS,
  });
});

test("session verification rejects tampered tokens", () => {
  const now = Math.floor(Date.now() / 1000);
  const token = signSession(
    {
      sub: "fabien.lages@fabsystem.fr",
      iat: now,
      exp: now + 60,
    },
    "test-secret"
  );

  const tampered = `${token}corrupted`;

  assert.equal(verifySession(tampered, "test-secret"), null);
});

test("session token body stays decodable with middleware-compatible base64url parsing", () => {
  const now = Math.floor(Date.now() / 1000);
  const expectedPayload = {
    sub: "fabien.lages@fabsystem.fr",
    role: "admin" as const,
    iat: now,
    exp: now + 60,
  };

  const token = signSession(expectedPayload, "test-secret");
  const parts = splitSignedToken(token);

  assert.ok(parts);
  assert.deepEqual(JSON.parse(decodeUtf8Base64Url(parts.body)), expectedPayload);
});
