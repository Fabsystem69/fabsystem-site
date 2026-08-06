import assert from "node:assert/strict";
import test from "node:test";
import {
  CUSTOMER_SESSION_COOKIE_MAX_AGE_SECONDS,
  CUSTOMER_SESSION_COOKIE_NAME,
  getCustomerSessionCookieOptions,
} from "@/lib/customer-session-cookie";
import { SESSION_COOKIE_NAME } from "@/lib/session";

test("customer session cookie uses a dedicated cookie name", () => {
  assert.equal(CUSTOMER_SESSION_COOKIE_NAME, "fabsystem_customer_session");
  assert.notEqual(CUSTOMER_SESSION_COOKIE_NAME, SESSION_COOKIE_NAME);
});

test("customer session cookie options are secure by default in non-production", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  (process.env as Record<string, string | undefined>).NODE_ENV = "development";

  const options = getCustomerSessionCookieOptions();

  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.secure, false);
  assert.equal(options.path, "/");
  assert.equal(options.maxAge, CUSTOMER_SESSION_COOKIE_MAX_AGE_SECONDS);

  (process.env as Record<string, string | undefined>).NODE_ENV = previousNodeEnv;
});

test("customer session cookie options enable secure in production", () => {
  const previousNodeEnv = process.env.NODE_ENV;
  (process.env as Record<string, string | undefined>).NODE_ENV = "production";

  const options = getCustomerSessionCookieOptions();

  assert.equal(options.secure, true);

  (process.env as Record<string, string | undefined>).NODE_ENV = previousNodeEnv;
});
