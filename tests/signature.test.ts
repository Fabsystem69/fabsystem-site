import assert from "node:assert/strict";
import test from "node:test";
import {
  SIGNATURE_TOKEN_TTL_MS,
  createSignatureExpiry,
  generateSignatureToken,
  hashSignatureToken,
  isSignatureTokenExpired,
} from "@/lib/signature-link";
import { validateSignatureDataUrl } from "@/lib/signature-image";

const VALID_SIGNATURE_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAABQCAQAAABcbTqwAAAATUlEQVR4Ae3BAQ0AAADCIPunNsN+YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC4GQJfAAEWK8C8AAAAAElFTkSuQmCC";

test("signature tokens are unique, hashed, and expire in the future", () => {
  const tokenA = generateSignatureToken();
  const tokenB = generateSignatureToken();
  const expiresAt = createSignatureExpiry();

  assert.notEqual(tokenA, tokenB);
  assert.equal(hashSignatureToken(tokenA).length, 64);
  assert.equal(isSignatureTokenExpired(expiresAt), false);
  assert.ok(expiresAt.getTime() - Date.now() <= SIGNATURE_TOKEN_TTL_MS);
});

test("signature image validation accepts bounded PNG payloads", () => {
  assert.doesNotThrow(() => validateSignatureDataUrl(VALID_SIGNATURE_PNG));
});

test("signature image validation rejects oversized payload declarations", () => {
  const oversized = `data:image/png;base64,${"A".repeat(450_000)}`;

  assert.throws(() => validateSignatureDataUrl(oversized));
});
