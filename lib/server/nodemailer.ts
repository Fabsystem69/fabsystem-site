import "server-only";

import { parseSmtpPort, parseSmtpSecure, requireServerEnv } from "@/lib/server/env";

function getTransportConfig() {
  return {
    host: requireServerEnv("SMTP_HOST", process.env.SMTP_HOST),
    port: parseSmtpPort(process.env.SMTP_PORT),
    secure: parseSmtpSecure(process.env.SMTP_SECURE),
    auth: {
      user: requireServerEnv("SMTP_USER", process.env.SMTP_USER),
      pass: requireServerEnv("SMTP_PASS", process.env.SMTP_PASS),
    },
  };
}

export async function sendMail(
  options: Parameters<Awaited<ReturnType<typeof createTransport>>["sendMail"]>[0]
) {
  const transporter = await createTransport();
  return transporter.sendMail(options);
}

export async function createTransport() {
  const nodemailer = await import("nodemailer");
  return nodemailer.createTransport(getTransportConfig());
}
