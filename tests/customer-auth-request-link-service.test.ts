import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "@/lib/http-errors";
import { createCustomerAuthRequestLinkService } from "@/lib/services/customer-auth-request-link";

function withEnv<T>(overrides: Record<string, string | undefined>, callback: () => Promise<T>) {
  const previous = new Map<string, string | undefined>();

  for (const [key, value] of Object.entries(overrides)) {
    previous.set(key, process.env[key]);

    if (typeof value === "undefined") {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  return callback().finally(() => {
    for (const [key, value] of previous.entries()) {
      if (typeof value === "undefined") {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });
}

test("requestLink sends an email after a valid magic-link request", async () => {
  await withEnv(
    {
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_SECURE: "false",
      SMTP_USER: "no-reply@example.com",
      SMTP_PASS: "smtp-password",
      CONTACT_FROM: "no-reply@example.com",
    },
    async () => {
      let emailPayload:
        | {
            to: string;
            magicLink: string;
            expiresAt: Date;
          }
        | undefined;

      const service = createCustomerAuthRequestLinkService({
        runtimeEnvironment: "development",
        requestMagicLoginLink: async () => ({
          customerId: "cust_1",
          email: "buyer@example.com",
          token: "raw-token",
          expiresAt: new Date("2026-08-06T12:15:00.000Z"),
          magicLink: "https://example.com/api/client-auth/verify?token=raw-token",
        }),
        sendCustomerMagicLoginEmail: async (input) => {
          emailPayload = input;
        },
      });

      const result = await service.requestLink({
        email: "Buyer@Example.com",
        name: "Fabien",
        baseUrl: "https://example.com",
      });

      assert.equal(emailPayload?.to, "buyer@example.com");
      assert.equal(
        emailPayload?.magicLink,
        "https://example.com/api/client-auth/verify?token=raw-token"
      );
      assert.equal(result.magicLink, "https://example.com/api/client-auth/verify?token=raw-token");
    }
  );
});

test("requestLink hides magicLink in production responses", async () => {
  const service = createCustomerAuthRequestLinkService({
    runtimeEnvironment: "production",
    requestMagicLoginLink: async () => ({
      customerId: "cust_1",
      email: "buyer@example.com",
      token: "raw-token",
      expiresAt: new Date("2026-08-06T12:15:00.000Z"),
      magicLink: "https://example.com/api/client-auth/verify?token=raw-token",
    }),
    sendCustomerMagicLoginEmail: async () => {},
  });

  const result = await service.requestLink({
    email: "buyer@example.com",
    baseUrl: "https://example.com",
  });

  assert.equal("magicLink" in result, false);
});

test("requestLink returns a sanitized error if email sending fails", async () => {
  const capturedErrors: string[] = [];
  const originalConsoleError = console.error;
  console.error = (line?: unknown) => {
    capturedErrors.push(String(line));
  };

  const service = createCustomerAuthRequestLinkService({
    runtimeEnvironment: "production",
    requestMagicLoginLink: async () => ({
      customerId: "cust_1",
      email: "buyer@example.com",
      token: "raw-token",
      expiresAt: new Date("2026-08-06T12:15:00.000Z"),
      magicLink: "https://example.com/api/client-auth/verify?token=raw-token",
    }),
    sendCustomerMagicLoginEmail: async () => {
      throw new Error("SMTP down");
    },
  });

  await assert.rejects(
    () =>
      service.requestLink({
        email: "buyer@example.com",
        baseUrl: "https://example.com",
      }),
    (error: unknown) =>
      error instanceof HttpError &&
      error.status === 500 &&
      error.message === "Unable to send login email"
  );

  console.error = originalConsoleError;

  const mergedLogs = capturedErrors.join("\n");
  assert.equal(mergedLogs.includes("raw-token"), false);
  assert.equal(mergedLogs.includes("https://example.com/api/client-auth/verify"), false);
});

test("requestLink returns magicLink in development without SMTP config", async () => {
  await withEnv(
    {
      SMTP_HOST: undefined,
      SMTP_PORT: undefined,
      SMTP_SECURE: undefined,
      SMTP_USER: undefined,
      SMTP_PASS: undefined,
      CONTACT_FROM: undefined,
    },
    async () => {
      let sendMailCalls = 0;

      const service = createCustomerAuthRequestLinkService({
        runtimeEnvironment: "development",
        requestMagicLoginLink: async () => ({
          customerId: "cust_1",
          email: "buyer@example.com",
          token: "raw-token",
          expiresAt: new Date("2026-08-06T12:15:00.000Z"),
          magicLink: "https://example.com/api/client-auth/verify?token=raw-token",
        }),
        sendCustomerMagicLoginEmail: async () => {
          sendMailCalls += 1;
        },
      });

      const result = await service.requestLink({
        email: "buyer@example.com",
        baseUrl: "https://example.com",
      });

      assert.equal(sendMailCalls, 0);
      assert.equal(result.magicLink, "https://example.com/api/client-auth/verify?token=raw-token");
    }
  );
});

test("requestLink keeps SMTP mandatory in production", async () => {
  await withEnv(
    {
      SMTP_HOST: undefined,
      SMTP_PORT: undefined,
      SMTP_SECURE: undefined,
      SMTP_USER: undefined,
      SMTP_PASS: undefined,
      CONTACT_FROM: undefined,
    },
    async () => {
      let sendMailCalls = 0;

      const service = createCustomerAuthRequestLinkService({
        runtimeEnvironment: "production",
        requestMagicLoginLink: async () => ({
          customerId: "cust_1",
          email: "buyer@example.com",
          token: "raw-token",
          expiresAt: new Date("2026-08-06T12:15:00.000Z"),
          magicLink: "https://example.com/api/client-auth/verify?token=raw-token",
        }),
        sendCustomerMagicLoginEmail: async () => {
          sendMailCalls += 1;
          throw new Error("Customer email configuration is incomplete");
        },
      });

      await assert.rejects(
        () =>
          service.requestLink({
            email: "buyer@example.com",
            baseUrl: "https://example.com",
          }),
        (error: unknown) =>
          error instanceof HttpError &&
          error.status === 500 &&
          error.message === "Unable to send login email"
      );

      assert.equal(sendMailCalls, 1);
    }
  );
});
