import { internalServerError } from "@/lib/http-errors";

export type SendCustomerMagicLoginEmailInput = {
  to: string;
  magicLink: string;
  expiresAt: Date;
};

type SendCustomerMagicLoginEmailDeps = {
  sendMailImpl?: (options: {
    to: string;
    from: string;
    subject: string;
    text: string;
    html: string;
  }) => Promise<unknown>;
};

type CustomerMagicLoginEmailContent = {
  subject: string;
  text: string;
  html: string;
};

function hasNonEmptyEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

export function hasCustomerEmailTransportConfig() {
  return (
    hasNonEmptyEnv("SMTP_HOST") &&
    hasNonEmptyEnv("SMTP_PORT") &&
    hasNonEmptyEnv("SMTP_SECURE") &&
    hasNonEmptyEnv("SMTP_USER") &&
    hasNonEmptyEnv("SMTP_PASS")
  );
}

export function hasCustomerEmailSenderConfig() {
  return Boolean(process.env.CONTACT_FROM?.trim() || process.env.SMTP_USER?.trim());
}

export function hasCustomerEmailConfig() {
  return hasCustomerEmailTransportConfig() && hasCustomerEmailSenderConfig();
}

function resolveCustomerEmailFromAddress() {
  const from = process.env.CONTACT_FROM?.trim() || process.env.SMTP_USER?.trim();

  if (!from) {
    throw internalServerError("Customer email configuration is incomplete");
  }

  return from;
}

export function buildCustomerMagicLoginEmail(
  input: SendCustomerMagicLoginEmailInput
): CustomerMagicLoginEmailContent {
  const expiryLabel = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  }).format(input.expiresAt);

  const subject = "Votre lien de connexion FabSystem";
  const text = [
    "Bonjour,",
    "",
    "Voici votre lien de connexion FabSystem :",
    input.magicLink,
    "",
    "Ce lien est valable 15 minutes.",
    `Expiration : ${expiryLabel}.`,
    "",
    "Si vous n'avez rien demandé, vous pouvez simplement ignorer cet email.",
  ].join("\n");

  const html = [
    "<p>Bonjour,</p>",
    "<p>Voici votre lien de connexion FabSystem :</p>",
    `<p><a href="${input.magicLink}" style="display:inline-block;padding:12px 18px;background:#171717;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Se connecter</a></p>`,
    `<p>Ou copiez-collez ce lien dans votre navigateur :<br /><a href="${input.magicLink}">${input.magicLink}</a></p>`,
    `<p>Ce lien est valable <strong>15 minutes</strong>.<br />Expiration : ${expiryLabel}.</p>`,
    "<p>Si vous n'avez rien demandé, vous pouvez simplement ignorer cet email.</p>",
  ].join("");

  return { subject, text, html };
}

export async function sendCustomerMagicLoginEmail(
  input: SendCustomerMagicLoginEmailInput,
  deps?: SendCustomerMagicLoginEmailDeps
) {
  const sendMailImpl =
    deps?.sendMailImpl ??
    (async (options: {
      to: string;
      from: string;
      subject: string;
      text: string;
      html: string;
    }) => {
      const { sendMail } = await import("@/lib/server/nodemailer");
      return sendMail(options);
    });
  const { subject, text, html } = buildCustomerMagicLoginEmail(input);

  await sendMailImpl({
    to: input.to,
    from: resolveCustomerEmailFromAddress(),
    subject,
    text,
    html,
  });
}
