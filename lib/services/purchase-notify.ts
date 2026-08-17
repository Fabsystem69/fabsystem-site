import { formatEuroFromCents } from "@/lib/format";
import { getOrderById } from "@/lib/services/order";
import { sendPushNotification } from "@/lib/services/push-notify";
import { logServerEvent } from "@/lib/server-log";

type OrderForNotification = Awaited<ReturnType<typeof getOrderById>>;

type SendMailImpl = (options: {
  to: string;
  from: string;
  subject: string;
  text: string;
}) => Promise<unknown>;

type PurchaseNotifyDeps = {
  getOrder?: (orderId: string) => Promise<OrderForNotification>;
  sendMailImpl?: SendMailImpl;
};

// Import paresseux (meme raison que lib/services/prestations-notify.ts) :
// lib/server/nodemailer pose un garde "server-only".
async function getDefaultSendMail() {
  const { sendMail: defaultSendMail } = await import("@/lib/server/nodemailer");
  return defaultSendMail;
}

function resolveToAddress() {
  return (
    process.env.SALE_ALERT_TO?.trim() ||
    process.env.CONTACT_TO?.trim() ||
    "contact@fabsystem.fr"
  );
}

function resolveFromAddress(to: string) {
  return process.env.CONTACT_FROM?.trim() || process.env.SMTP_USER?.trim() || to;
}

// Appelee pour toute commande payee (digital ou prestation), en plus de
// sendPrestationsPackNotification qui gere le suivi specifique aux packs
// d'accompagnement. Appelee aussi sur une redelivery Stripe deja traitee
// (voir stripe-webhook-commerce.ts) : au pire un mail/push en double, jamais
// une vente silencieuse.
export async function sendPurchaseNotification(
  orderId: string,
  deps?: PurchaseNotifyDeps
) {
  try {
    const getOrder = deps?.getOrder ?? getOrderById;
    const order = await getOrder(orderId);

    const itemsLines = order.items.map(
      (item) => `- ${item.productName} — ${formatEuroFromCents(item.unitAmountCents)}`
    );

    const subject = `FabSystem — Nouvelle vente : ${formatEuroFromCents(order.totalCents)} (${order.orderNumber})`;
    const text = [
      `Client : ${order.customerName || "(nom non renseigné)"} <${order.customerEmail}>`,
      `Commande : ${order.orderNumber}`,
      `Montant : ${formatEuroFromCents(order.totalCents)} (${order.currency})`,
      "",
      "Articles :",
      ...itemsLines,
    ].join("\n");

    const sendMailImpl = deps?.sendMailImpl ?? (await getDefaultSendMail());
    const to = resolveToAddress();
    const from = resolveFromAddress(to);

    const [emailResult, pushResult] = await Promise.allSettled([
      sendMailImpl({ to, from, subject, text }),
      sendPushNotification({
        title: `Nouvelle vente — ${formatEuroFromCents(order.totalCents)}`,
        message: order.items.map((item) => item.productName).join(", "),
        priority: "high",
        tags: "moneybag",
      }),
    ]);

    if (emailResult.status === "rejected") {
      logServerEvent("error", "failed to send purchase notification email", {
        error: emailResult.reason,
        orderId,
      });
    }

    if (pushResult.status === "rejected") {
      logServerEvent("error", "failed to send purchase notification push", {
        error: pushResult.reason,
        orderId,
      });
    }

    return {
      sent:
        emailResult.status === "fulfilled" ||
        (pushResult.status === "fulfilled" && pushResult.value === true),
    };
  } catch (error) {
    logServerEvent("error", "failed to send purchase notification", {
      error,
      orderId,
    });
    return { sent: false as const };
  }
}
