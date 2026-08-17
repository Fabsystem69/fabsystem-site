import assert from "node:assert/strict";
import test from "node:test";
import type { Order, OrderItem } from "@/lib/generated/prisma/client";
import { sendPurchaseNotification } from "@/lib/services/purchase-notify";

type OrderWithItems = Order & { items: OrderItem[]; payments: [] };

function createOrderRecord(overrides: Partial<Order> = {}): Order {
  const now = new Date("2026-08-17T00:00:00.000Z");

  return {
    id: overrides.id ?? "order_1",
    orderNumber: overrides.orderNumber ?? "FS-20260817-ABC123",
    status: overrides.status ?? "PAID",
    customerId: overrides.customerId ?? null,
    discountCodeId: overrides.discountCodeId ?? null,
    customerEmail: overrides.customerEmail ?? "buyer@example.com",
    customerName: overrides.customerName !== undefined ? overrides.customerName : "Pascal M.",
    currency: overrides.currency ?? "EUR",
    subtotalCents: overrides.subtotalCents ?? 4900,
    discountTotalCents: overrides.discountTotalCents ?? 0,
    totalCents: overrides.totalCents ?? 4900,
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
    productSlug: overrides.productSlug ?? "ebook-electricite-van",
    productName: overrides.productName ?? "Ebook — Électricité van",
    productType: overrides.productType ?? "DIGITAL_DOWNLOAD",
    quantity: overrides.quantity ?? 1,
    currency: overrides.currency ?? "EUR",
    unitAmountCents: overrides.unitAmountCents ?? 4900,
    lineTotalCents: overrides.lineTotalCents ?? 4900,
    createdAt: overrides.createdAt ?? new Date("2026-08-17T00:00:00.000Z"),
  };
}

function createMockSendMail() {
  const calls: Array<{ to: string; from: string; subject: string; text: string }> = [];

  return {
    calls,
    async sendMailImpl(options: { to: string; from: string; subject: string; text: string }) {
      calls.push(options);
    },
  };
}

test("sendPurchaseNotification sends an email with client, order and item details", async () => {
  const order: OrderWithItems = {
    ...createOrderRecord({ customerEmail: "client@example.com", customerName: "Isabelle" }),
    items: [createOrderItemRecord()],
    payments: [],
  };
  const mail = createMockSendMail();

  const result = await sendPurchaseNotification("order_1", {
    getOrder: async () => order,
    sendMailImpl: mail.sendMailImpl,
  });

  assert.deepEqual(result, { sent: true });
  assert.equal(mail.calls.length, 1);
  const email = mail.calls[0];
  assert.match(email?.subject ?? "", /Nouvelle vente/);
  assert.match(email?.text ?? "", /Isabelle/);
  assert.match(email?.text ?? "", /client@example\.com/);
  assert.match(email?.text ?? "", /FS-20260817-ABC123/);
  assert.match(email?.text ?? "", /Ebook — Électricité van/);
});

test("sendPurchaseNotification includes every item when multiple are purchased", async () => {
  const order: OrderWithItems = {
    ...createOrderRecord({ totalCents: 9800 }),
    items: [
      createOrderItemRecord({ id: "item_1", productName: "Ebook — Électricité van" }),
      createOrderItemRecord({ id: "item_2", productName: "Kit imprimable P280" }),
    ],
    payments: [],
  };
  const mail = createMockSendMail();

  await sendPurchaseNotification("order_1", {
    getOrder: async () => order,
    sendMailImpl: mail.sendMailImpl,
  });

  const email = mail.calls[0];
  assert.match(email?.text ?? "", /Ebook — Électricité van/);
  assert.match(email?.text ?? "", /Kit imprimable P280/);
});

test("sendPurchaseNotification falls back to placeholder when customer name is missing", async () => {
  const order: OrderWithItems = {
    ...createOrderRecord({ customerName: null }),
    items: [createOrderItemRecord()],
    payments: [],
  };
  const mail = createMockSendMail();

  await sendPurchaseNotification("order_1", {
    getOrder: async () => order,
    sendMailImpl: mail.sendMailImpl,
  });

  const email = mail.calls[0];
  assert.match(email?.text ?? "", /\(nom non renseigné\)/);
});

test("sendPurchaseNotification does not throw when email sending fails", async () => {
  const order: OrderWithItems = {
    ...createOrderRecord(),
    items: [createOrderItemRecord()],
    payments: [],
  };

  const result = await sendPurchaseNotification("order_1", {
    getOrder: async () => order,
    sendMailImpl: async () => {
      throw new Error("smtp unavailable");
    },
  });

  assert.deepEqual(result, { sent: false });
});
