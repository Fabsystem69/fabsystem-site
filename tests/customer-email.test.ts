import assert from "node:assert/strict";
import test from "node:test";
import { buildCustomerMagicLoginEmail, sendCustomerMagicLoginEmail } from "@/lib/services/customer-email";

test("buildCustomerMagicLoginEmail uses the expected subject and mentions 15 minutes", () => {
  const result = buildCustomerMagicLoginEmail({
    to: "buyer@example.com",
    magicLink: "https://example.com/api/client-auth/verify?token=abc",
    expiresAt: new Date("2026-08-06T12:15:00.000Z"),
  });

  assert.equal(result.subject, "Votre lien de connexion FabSystem");
  assert.equal(result.text.includes("15 minutes"), true);
  assert.equal(result.text.includes("https://example.com/api/client-auth/verify?token=abc"), true);
  assert.equal(result.html.includes("Se connecter"), true);
});

test("sendCustomerMagicLoginEmail sends to the normalized recipient with the configured sender", async () => {
  const previousContactFrom = process.env.CONTACT_FROM;
  process.env.CONTACT_FROM = "no-reply@fabsystem.fr";

  let payload:
    | {
        to?: string;
        from?: string;
        subject?: string;
        text?: string;
      }
    | undefined;

  await sendCustomerMagicLoginEmail(
    {
      to: "buyer@example.com",
      magicLink: "https://example.com/api/client-auth/verify?token=abc",
      expiresAt: new Date("2026-08-06T12:15:00.000Z"),
    },
    {
      sendMailImpl: async (options) => {
        payload = {
          to: options.to,
          from: options.from,
          subject: options.subject,
          text: options.text,
        };
        return {} as never;
      },
    }
  );

  assert.equal(payload?.to, "buyer@example.com");
  assert.equal(payload?.from, "no-reply@fabsystem.fr");
  assert.equal(payload?.subject, "Votre lien de connexion FabSystem");
  assert.equal(payload?.text?.includes("15 minutes"), true);

  process.env.CONTACT_FROM = previousContactFrom;
});
