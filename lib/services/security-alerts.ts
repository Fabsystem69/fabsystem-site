import { logServerEvent } from "@/lib/server-log";
import { tryAcquireCooldown } from "@/lib/rate-limit";
import { sendPushNotification } from "@/lib/services/push-notify";

type SendMailImpl = (options: {
  to: string;
  from: string;
  subject: string;
  text: string;
}) => Promise<unknown>;

type SecurityAlertDeps = {
  sendMailImpl?: SendMailImpl;
};

// Import paresseux (meme raison que lib/services/prestations-notify.ts) :
// lib/server/nodemailer pose un garde "server-only".
async function getDefaultSendMail() {
  const { sendMail: defaultSendMail } = await import("@/lib/server/nodemailer");
  return defaultSendMail;
}

function resolveAlertToAddress() {
  return (
    process.env.SECURITY_ALERT_TO?.trim() ||
    process.env.CONTACT_TO?.trim() ||
    "contact@fabsystem.fr"
  );
}

function resolveAlertFromAddress(to: string) {
  return process.env.CONTACT_FROM?.trim() || process.env.SMTP_USER?.trim() || to;
}

// Un email/push par limiter au plus toutes les 15 min, meme si l'attaque
// continue (chaque requete bloquee ne redeclenche pas une alerte, seule la
// transition "je viens de passer au-dessus de la limite" le fait — voir
// enforceRateLimit).
const ALERT_COOLDOWN_MS = 15 * 60 * 1000;

export type RateLimitAlertParams = {
  limiter: string;
  ip: string;
  count: number;
  retryAfterSeconds: number;
};

async function sendEmailAlert(
  params: RateLimitAlertParams,
  sendMailImpl?: SendMailImpl
) {
  const impl = sendMailImpl ?? (await getDefaultSendMail());
  const to = resolveAlertToAddress();
  const from = resolveAlertFromAddress(to);

  await impl({
    to,
    from,
    subject: `FabSystem — Alerte abus : ${params.limiter}`,
    text: [
      `Le rate limit "${params.limiter}" vient d'etre depasse.`,
      `IP a l'origine : ${params.ip}`,
      `Nombre de requetes : ${params.count}`,
      `Duree du blocage : ${params.retryAfterSeconds}s`,
      "",
      `Prochaine alerte possible pour ce limiter dans au plus ${Math.round(
        ALERT_COOLDOWN_MS / 60000
      )} min (pour eviter de saturer cette boite mail si l'attaque continue).`,
    ].join("\n"),
  });
}

export async function sendRateLimitAlert(
  params: RateLimitAlertParams,
  deps?: SecurityAlertDeps
) {
  const canSend = await tryAcquireCooldown(
    `security-alert:rate-limit:${params.limiter}`,
    ALERT_COOLDOWN_MS
  );

  if (!canSend) {
    return { sent: false as const, reason: "cooldown" as const };
  }

  const [emailResult, pushResult] = await Promise.allSettled([
    sendEmailAlert(params, deps?.sendMailImpl),
    sendPushNotification({
      title: `Alerte abus - ${params.limiter}`,
      message: `IP ${params.ip} - ${params.count} requetes - blocage ${params.retryAfterSeconds}s`,
      priority: "high",
      tags: "warning",
    }),
  ]);

  if (emailResult.status === "rejected") {
    logServerEvent("error", "failed to send rate limit alert email", {
      error: emailResult.reason,
      limiter: params.limiter,
    });
  }

  if (pushResult.status === "rejected") {
    logServerEvent("error", "failed to send rate limit alert push", {
      error: pushResult.reason,
      limiter: params.limiter,
    });
  }

  const pushSent = pushResult.status === "fulfilled" && pushResult.value === true;

  return {
    sent: emailResult.status === "fulfilled" || pushSent,
    email: emailResult.status === "fulfilled",
    push: pushSent,
  };
}
