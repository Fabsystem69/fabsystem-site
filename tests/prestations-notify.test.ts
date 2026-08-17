import assert from "node:assert/strict";
import test from "node:test";
import type { Order, OrderItem } from "@/lib/generated/prisma/client";
import { sendPrestationsPackNotification } from "@/lib/services/prestations-notify";

type OrderWithItems = Order & { items: OrderItem[]; payments: [] };

function createOrderRecord(overrides: Partial<Order> = {}): Order {
  const now = new Date("2026-08-07T00:00:00.000Z");

  return {
    id: overrides.id ?? "order_1",
    orderNumber: overrides.orderNumber ?? "FS-20260807-ABC123",
    status: overrides.status ?? "PAID",
    customerId: overrides.customerId ?? null,
    discountCodeId: overrides.discountCodeId ?? null,
    customerEmail: overrides.customerEmail ?? "buyer@example.com",
    customerName: overrides.customerName ?? "Pascal M.",
    currency: overrides.currency ?? "EUR",
    subtotalCents: overrides.subtotalCents ?? 49900,
    discountTotalCents: overrides.discountTotalCents ?? 0,
    totalCents: overrides.totalCents ?? 49900,
    cartId: overrides.cartId ?? "cart_1",
    projectId: overrides.projectId ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    paidAt: overrides.paidAt ?? now,
    cancelledAt: overrides.cancelledAt ?? null,
    refundedAt: overrides.refundedAt ?? null,
  };
}

function createOrderItemRecord(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: overrides.id ?? "item_1",
    orderId: overrides.orderId ?? "order_1",
    productId: overrides.productId ?? "prod_1",
    productSlug: overrides.productSlug ?? "pack-passerelle-van",
    productName: overrides.productName ?? "Passerelle — Van aménagé",
    productType: overrides.productType ?? "DIGITAL_DOWNLOAD",
    quantity: overrides.quantity ?? 1,
    currency: overrides.currency ?? "EUR",
    unitAmountCents: overrides.unitAmountCents ?? 49900,
    lineTotalCents: overrides.lineTotalCents ?? 49900,
    createdAt: overrides.createdAt ?? new Date("2026-08-07T00:00:00.000Z"),
  };
}

function createMockSendMail() {
  const calls: Array<{ to: string; from: string; replyTo?: string; subject: string; text: string }> =
    [];

  return {
    calls,
    async sendMailImpl(options: {
      to: string;
      from: string;
      replyTo?: string;
      subject: string;
      text: string;
    }) {
      calls.push(options);
    },
  };
}

test("sendPrestationsPackNotification sends nothing for an ebook-only order", async () => {
  const order: OrderWithItems = {
    ...createOrderRecord(),
    items: [createOrderItemRecord({ productSlug: "ebook-electricite-van" })],
    payments: [],
  };
  const mail = createMockSendMail();

  const result = await sendPrestationsPackNotification("order_1", null, {
    getOrder: async () => order,
    sendMailImpl: mail.sendMailImpl,
  });

  assert.deepEqual(result, { sent: false, reason: "no_pack_in_order" });
  assert.equal(mail.calls.length, 0);
});

test("sendPrestationsPackNotification sends an email with client, pack and form details", async () => {
  const order: OrderWithItems = {
    ...createOrderRecord({ customerEmail: "client@example.com", customerName: "Isabelle" }),
    items: [createOrderItemRecord({ productSlug: "pack-passerelle-van" })],
    payments: [],
  };
  const mail = createMockSendMail();

  const result = await sendPrestationsPackNotification(
    "order_1",
    {
      needsVehicle: "Van Ducato 2019",
      needsDescription: "Refaire tout le 12V",
      needsProgress: "in_progress",
      needsDeadline: "fin du mois",
      needsOther: "aucune",
    },
    { getOrder: async () => order, sendMailImpl: mail.sendMailImpl }
  );

  assert.deepEqual(result, { sent: true });
  assert.equal(mail.calls.length, 1);
  const email = mail.calls[0];
  assert.equal(email?.replyTo, "client@example.com");
  assert.match(email?.text ?? "", /Isabelle/);
  assert.match(email?.text ?? "", /client@example\.com/);
  assert.match(email?.text ?? "", /Passerelle/);
  assert.match(email?.text ?? "", /Van aménagé/);
  assert.match(email?.text ?? "", /Van Ducato 2019/);
  assert.match(email?.text ?? "", /Refaire tout le 12V/);
  assert.match(email?.text ?? "", /En cours/);
  assert.match(email?.text ?? "", /fin du mois/);
});

test("sendPrestationsPackNotification falls back to placeholders for missing form answers", async () => {
  const order: OrderWithItems = {
    ...createOrderRecord(),
    items: [createOrderItemRecord({ productSlug: "pack-amarrage-bateau" })],
    payments: [],
  };
  const mail = createMockSendMail();

  await sendPrestationsPackNotification("order_1", null, {
    getOrder: async () => order,
    sendMailImpl: mail.sendMailImpl,
  });

  const email = mail.calls[0];
  assert.match(email?.text ?? "", /\(non renseigné\)/);
});

test("sendPrestationsPackNotification includes every pack when multiple are purchased", async () => {
  const order: OrderWithItems = {
    ...createOrderRecord(),
    items: [
      createOrderItemRecord({ id: "item_1", productSlug: "pack-cap-van" }),
      createOrderItemRecord({ id: "item_2", productSlug: "pack-amarrage-bateau" }),
    ],
    payments: [],
  };
  const mail = createMockSendMail();

  await sendPrestationsPackNotification("order_1", null, {
    getOrder: async () => order,
    sendMailImpl: mail.sendMailImpl,
  });

  const email = mail.calls[0];
  // UI-4.1 (MASTER-08-ACCOMPAGNEMENT.md §5) : le libellé commercial dépend
  // de l'univers — "pack-cap-van" affiche "Itinéraire" (nom Van du niveau
  // Conception), jamais "Cap" (réservé au Bateau).
  assert.match(email?.text ?? "", /Itinéraire/);
  assert.match(email?.text ?? "", /Amarrage/);
});
