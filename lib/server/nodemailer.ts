import "server-only";

function getTransportConfig() {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
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
