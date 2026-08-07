import assert from "node:assert/strict";
import test from "node:test";
import type {
  DiscountCode,
  DiscountRedemption,
  Order,
  Product,
  ProductPrice,
} from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import {
  UNLIMITED_DISCOUNT_REDEMPTIONS,
  createDiscountService,
  evaluateDiscountCodeForCart,
  generateDiscountCode,
  normalizeDiscountCode,
} from "@/lib/services/discounts";

function createProductRecord(overrides: Partial<Product> = {}): Product {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "prod_1",
    slug: overrides.slug ?? "ebook-electricite-van",
    name: overrides.name ?? "Ebook Electricite Van",
    shortDescription: overrides.shortDescription ?? null,
    description: overrides.description ?? null,
    status: overrides.status ?? "ACTIVE",
    productType: overrides.productType ?? "EBOOK",
    purchaseMode: overrides.purchaseMode ?? "BUY_NOW",
    featuredImage: overrides.featuredImage ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createPriceRecord(overrides: Partial<ProductPrice> = {}): ProductPrice {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "price_1",
    productId: overrides.productId ?? "prod_1",
    currency: overrides.currency ?? "EUR",
    unitAmountCents: overrides.unitAmountCents ?? 2900,
    compareAtAmountCents: overrides.compareAtAmountCents ?? null,
    status: overrides.status ?? "ACTIVE",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createDiscountCodeRecord(overrides: Partial<DiscountCode> = {}): DiscountCode {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "discount_1",
    code: overrides.code ?? "COACH-ABC123",
    status: overrides.status ?? "ACTIVE",
    type: overrides.type ?? "FIXED_AMOUNT",
    amountOffCents: "amountOffCents" in overrides ? overrides.amountOffCents ?? null : 2900,
    percentOff: overrides.percentOff ?? null,
    currency: overrides.currency ?? "EUR",
    maxRedemptions: overrides.maxRedemptions ?? 1,
    redeemedCount: overrides.redeemedCount ?? 0,
    startsAt: overrides.startsAt ?? now,
    expiresAt: overrides.expiresAt ?? new Date("2026-10-06T00:00:00.000Z"),
    // "in" plutot que "??" : un override explicite a null (code non cible /
    // non nominatif) doit rester null, pas retomber sur le defaut.
    productId: "productId" in overrides ? overrides.productId ?? null : "prod_1",
    customerEmail: "customerEmail" in overrides ? overrides.customerEmail ?? null : "buyer@example.com",
    reason: overrides.reason ?? "Prestation coaching",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createOrderRecord(overrides: Partial<Order> = {}): Order {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "order_1",
    orderNumber: overrides.orderNumber ?? "FS-20260806-AAA111",
    status: overrides.status ?? "PAID",
    customerId: overrides.customerId ?? "customer_1",
    discountCodeId: overrides.discountCodeId ?? null,
    customerEmail: overrides.customerEmail ?? "buyer@example.com",
    customerName: overrides.customerName ?? "Buyer Example",
    currency: overrides.currency ?? "EUR",
    subtotalCents: overrides.subtotalCents ?? 2900,
    discountTotalCents: overrides.discountTotalCents ?? 0,
    totalCents: overrides.totalCents ?? 2900,
    cartId: overrides.cartId ?? "cart_1",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    paidAt: overrides.paidAt ?? now,
    cancelledAt: overrides.cancelledAt ?? null,
    refundedAt: overrides.refundedAt ?? null,
  };
}

type MockOrderItem = {
  id: string;
  orderId: string;
  productType: Product["productType"];
  unitAmountCents: number;
  currency: string;
};

function createMockDiscountsDb(seed?: {
  products?: Product[];
  prices?: ProductPrice[];
  discountCodes?: DiscountCode[];
  orders?: Order[];
  orderItems?: MockOrderItem[];
  cartLines?: Array<{
    cartId: string;
    lines: Array<{
      product: Pick<Product, "id" | "name" | "slug" | "productType" | "status" | "purchaseMode">;
      price: Pick<ProductPrice, "id" | "currency" | "unitAmountCents" | "status">;
      quantity: number;
      lineTotalCents: number;
    }>;
  }>;
}) {
  const state = {
    products: [...(seed?.products ?? [])],
    prices: [...(seed?.prices ?? [])],
    discountCodes: [...(seed?.discountCodes ?? [])],
    orders: [...(seed?.orders ?? [])],
    orderItems: [...(seed?.orderItems ?? [])],
    redemptions: [] as DiscountRedemption[],
    cartLines: new Map((seed?.cartLines ?? []).map((entry) => [entry.cartId, entry.lines])),
  };

  const db = {
    async findProductById(productId: string) {
      const product = state.products.find((entry) => entry.id === productId) ?? null;
      return product
        ? {
            id: product.id,
            name: product.name,
            slug: product.slug,
            productType: product.productType,
            status: product.status,
            purchaseMode: product.purchaseMode,
          }
        : null;
    },
    async findDiscountCodeByCode(code: string) {
      const discountCode = state.discountCodes.find((entry) => entry.code === code) ?? null;

      if (!discountCode) {
        return null;
      }

      const product = discountCode.productId
        ? state.products.find((entry) => entry.id === discountCode.productId) ?? null
        : null;

      return {
        ...discountCode,
        product: product
          ? {
              id: product.id,
              name: product.name,
              slug: product.slug,
              productType: product.productType,
              status: product.status,
              purchaseMode: product.purchaseMode,
            }
          : null,
      };
    },
    async createDiscountCode(data: Omit<DiscountCode, "id" | "createdAt" | "updatedAt">) {
      const discountCode = createDiscountCodeRecord({
        id: `discount_${state.discountCodes.length + 1}`,
        ...data,
      });
      state.discountCodes.push(discountCode);
      return discountCode;
    },
    async updateDiscountCode(
      discountCodeId: string,
      data: Partial<{
        status: DiscountCode["status"];
        redeemedCount: number;
      }>
    ) {
      const discountCode = state.discountCodes.find((entry) => entry.id === discountCodeId);

      if (!discountCode) {
        throw new Error("Discount code not found in mock");
      }

      if (typeof data.status !== "undefined") {
        discountCode.status = data.status;
      }
      if (typeof data.redeemedCount !== "undefined") {
        discountCode.redeemedCount = data.redeemedCount;
      }

      return discountCode;
    },
    async createDiscountCodeIfAbsent(data: Omit<DiscountCode, "id" | "createdAt" | "updatedAt">) {
      const existing = state.discountCodes.find((entry) => entry.code === data.code);

      if (existing) {
        return existing;
      }

      const discountCode = createDiscountCodeRecord({
        id: `discount_${state.discountCodes.length + 1}`,
        ...data,
      });
      state.discountCodes.push(discountCode);
      return discountCode;
    },
    async findOrderItemsForAutoDiscount(orderId: string) {
      const order = state.orders.find((entry) => entry.id === orderId) ?? null;

      if (!order) {
        return null;
      }

      return {
        customerEmail: order.customerEmail,
        items: state.orderItems
          .filter((item) => item.orderId === orderId)
          .map((item) => ({
            id: item.id,
            productType: item.productType,
            unitAmountCents: item.unitAmountCents,
            currency: item.currency,
          })),
      };
    },
    async createDiscountRedemption(data: {
      discountCodeId: string;
      orderId: string;
      customerEmail: string;
      productId: string | null;
      amountDiscountedCents: number;
    }) {
      const redemption = {
        id: `redemption_${state.redemptions.length + 1}`,
        redeemedAt: new Date("2026-08-06T00:00:00.000Z"),
        ...data,
      } as DiscountRedemption;
      state.redemptions.push(redemption);
      return redemption;
    },
    async listDiscountCodes() {
      return Promise.all(
        state.discountCodes.map(async (discountCode) => {
          const product = discountCode.productId
            ? state.products.find((entry) => entry.id === discountCode.productId) ?? null
            : null;

          return {
            ...discountCode,
            product: product
              ? {
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  productType: product.productType,
                  status: product.status,
                  purchaseMode: product.purchaseMode,
                }
              : null,
          };
        })
      );
    },
    async findOrderById(orderId: string) {
      const order = state.orders.find((entry) => entry.id === orderId) ?? null;
      return order ? { id: order.id, customerEmail: order.customerEmail } : null;
    },
    async findCartLines(cartId: string) {
      return state.cartLines.get(cartId) ?? [];
    },
  };

  return { db, state };
}

test("normalizeDiscountCode uppercases and trims", () => {
  assert.equal(normalizeDiscountCode(" coach-abc123 "), "COACH-ABC123");
});

test("generateDiscountCode preserves the normalized prefix", () => {
  assert.equal(generateDiscountCode("coach-", () => "ab12cd"), "COACH-AB12CD");
});

test("createDiscountCode creates a fixed-amount code targeted on an ebook, nominative, single use", async () => {
  const product = createProductRecord({ id: "prod_ebook" });
  const referenceDate = new Date("2026-08-06T10:00:00.000Z");
  const { db } = createMockDiscountsDb({ products: [product] });
  const service = createDiscountService(db, {
    now: () => referenceDate,
    randomCode: () => "ABC123",
  });

  const discountCode = await service.createDiscountCode({
    type: "FIXED_AMOUNT",
    amountOffCents: 4900,
    productId: product.id,
    customerEmail: " Buyer@Example.com ",
    codePrefix: "COACH-",
    reason: "Prestation coaching",
  });

  assert.equal(discountCode.code, "COACH-ABC123");
  assert.equal(discountCode.type, "FIXED_AMOUNT");
  assert.equal(discountCode.amountOffCents, 4900);
  assert.equal(discountCode.percentOff, null);
  assert.equal(discountCode.currency, "EUR");
  assert.equal(discountCode.maxRedemptions, 1);
  assert.equal(discountCode.customerEmail, "buyer@example.com");
  assert.equal(discountCode.productId, product.id);
  assert.equal(discountCode.reason, "Prestation coaching");
  assert.deepEqual(discountCode.startsAt, referenceDate);
});

test("createDiscountCode creates a percentage code with no product, no email and unlimited usage", async () => {
  const { db } = createMockDiscountsDb();
  const service = createDiscountService(db, { randomCode: () => "SUMMER" });

  const discountCode = await service.createDiscountCode({
    type: "PERCENTAGE",
    percentOff: 20,
    unlimitedRedemptions: true,
  });

  assert.equal(discountCode.code, "PROMOSUMMER");
  assert.equal(discountCode.type, "PERCENTAGE");
  assert.equal(discountCode.percentOff, 20);
  assert.equal(discountCode.amountOffCents, null);
  assert.equal(discountCode.productId, null);
  assert.equal(discountCode.customerEmail, null);
  assert.equal(discountCode.maxRedemptions, UNLIMITED_DISCOUNT_REDEMPTIONS);
  assert.equal(discountCode.reason, "Code de réduction");
});

test("createDiscountCode accepts a custom expiration date and usage limit", async () => {
  const { db } = createMockDiscountsDb();
  const service = createDiscountService(db, { randomCode: () => "XYZ999" });

  const discountCode = await service.createDiscountCode({
    type: "FIXED_AMOUNT",
    amountOffCents: 1000,
    maxRedemptions: 25,
    expiresAt: new Date("2027-01-01T00:00:00.000Z"),
  });

  assert.equal(discountCode.maxRedemptions, 25);
  assert.deepEqual(discountCode.expiresAt, new Date("2027-01-01T00:00:00.000Z"));
});

test("createDiscountCode can target a prestations pack product, not just an ebook", async () => {
  const pack = createProductRecord({
    id: "pack_cap_van",
    slug: "pack-cap-van",
    name: "Cap — Van aménagé",
    productType: "DIGITAL_DOWNLOAD",
  });
  const { db } = createMockDiscountsDb({ products: [pack] });
  const service = createDiscountService(db, { randomCode: () => "PACK01" });

  const discountCode = await service.createDiscountCode({
    type: "PERCENTAGE",
    percentOff: 10,
    productId: pack.id,
  });

  assert.equal(discountCode.productId, pack.id);
});

test("createDiscountCode refuses a fixed-amount code without amountOffCents", async () => {
  const { db } = createMockDiscountsDb();
  const service = createDiscountService(db);

  await assert.rejects(
    () => service.createDiscountCode({ type: "FIXED_AMOUNT" }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("createDiscountCode refuses a percentage code without percentOff", async () => {
  const { db } = createMockDiscountsDb();
  const service = createDiscountService(db);

  await assert.rejects(
    () => service.createDiscountCode({ type: "PERCENTAGE" }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("createDiscountCode refuses an unknown targeted product", async () => {
  const { db } = createMockDiscountsDb();
  const service = createDiscountService(db);

  await assert.rejects(
    () =>
      service.createDiscountCode({
        type: "FIXED_AMOUNT",
        amountOffCents: 1000,
        productId: "missing_product",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("a generic code with no email and no product can be redeemed multiple times up to its limit", async () => {
  const product = createProductRecord({ id: "prod_ebook" });
  const code = createDiscountCodeRecord({
    code: "PROMOABC123",
    type: "PERCENTAGE",
    percentOff: 10,
    amountOffCents: null,
    productId: null,
    customerEmail: null,
    maxRedemptions: 3,
    redeemedCount: 2,
  });
  const { db } = createMockDiscountsDb({
    products: [product],
    discountCodes: [code],
    cartLines: [
      {
        cartId: "cart_1",
        lines: [
          {
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              productType: product.productType,
              status: product.status,
              purchaseMode: product.purchaseMode,
            },
            price: { id: "price_1", currency: "EUR", unitAmountCents: 2900, status: "ACTIVE" },
            quantity: 1,
            lineTotalCents: 2900,
          },
        ],
      },
    ],
  });
  const service = createDiscountService(db);

  // N'importe quel email fonctionne, le code n'est pas nominatif.
  const result = await service.validateDiscountCodeForCart({
    code: "promoabc123",
    customerEmail: "anyone@example.com",
    cartId: "cart_1",
  });

  assert.equal(result.discountTotalCents, 290);
  assert.equal(result.totalCents, 2610);

  // Une fois le nombre max de redemptions atteint, le code est refuse.
  const exhaustedCode = createDiscountCodeRecord({
    ...code,
    redeemedCount: 3,
  });
  const { db: exhaustedDb } = createMockDiscountsDb({
    products: [product],
    discountCodes: [exhaustedCode],
    cartLines: [
      {
        cartId: "cart_1",
        lines: [
          {
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              productType: product.productType,
              status: product.status,
              purchaseMode: product.purchaseMode,
            },
            price: { id: "price_1", currency: "EUR", unitAmountCents: 2900, status: "ACTIVE" },
            quantity: 1,
            lineTotalCents: 2900,
          },
        ],
      },
    ],
  });
  const exhaustedService = createDiscountService(exhaustedDb);

  await assert.rejects(
    () =>
      exhaustedService.validateDiscountCodeForCart({
        code: "PROMOABC123",
        customerEmail: "anyone@example.com",
        cartId: "cart_1",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("validateDiscountCodeForCart accepts a non-nominative code without any email", async () => {
  const product = createProductRecord({ id: "prod_ebook" });
  const code = createDiscountCodeRecord({
    code: "PROMOFREE1",
    productId: null,
    customerEmail: null,
  });
  const { db } = createMockDiscountsDb({
    products: [product],
    discountCodes: [code],
    cartLines: [
      {
        cartId: "cart_1",
        lines: [
          {
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              productType: product.productType,
              status: product.status,
              purchaseMode: product.purchaseMode,
            },
            price: { id: "price_1", currency: "EUR", unitAmountCents: 2900, status: "ACTIVE" },
            quantity: 1,
            lineTotalCents: 2900,
          },
        ],
      },
    ],
  });
  const service = createDiscountService(db);

  const result = await service.validateDiscountCodeForCart({
    code: "promofree1",
    cartId: "cart_1",
  });

  assert.equal(result.totalCents, 0);
});

test("validateDiscountCodeForCart still requires an email for a nominative code", async () => {
  const product = createProductRecord({ id: "prod_ebook" });
  const code = createDiscountCodeRecord({
    code: "COACH-ABC123",
    customerEmail: "buyer@example.com",
  });
  const { db } = createMockDiscountsDb({
    products: [product],
    discountCodes: [code],
    cartLines: [
      {
        cartId: "cart_1",
        lines: [
          {
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              productType: product.productType,
              status: product.status,
              purchaseMode: product.purchaseMode,
            },
            price: { id: "price_1", currency: "EUR", unitAmountCents: 2900, status: "ACTIVE" },
            quantity: 1,
            lineTotalCents: 2900,
          },
        ],
      },
    ],
  });
  const service = createDiscountService(db);

  await assert.rejects(
    () => service.validateDiscountCodeForCart({ code: "COACH-ABC123", cartId: "cart_1" }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

// Retrocompatibilite : les codes coaching produits par l'ancienne fonction
// createCoachingEbookDiscountCode (COACH-4UYIPK, COACH-U8XALM en production)
// ont exactement cette forme — FIXED_AMOUNT, prix fige, 1 usage, nominatifs,
// cible sur un seul ebook. evaluateDiscountCodeForCart doit continuer a les
// valider et les rembourser a l'identique apres la refonte generique.
test("evaluateDiscountCodeForCart keeps validating a legacy coaching-shaped code (COACH-4UYIPK)", () => {
  const legacyCoachingCode = {
    status: "ACTIVE" as const,
    type: "FIXED_AMOUNT" as const,
    amountOffCents: 4900,
    percentOff: null,
    currency: "EUR",
    maxRedemptions: 1,
    redeemedCount: 0,
    startsAt: new Date("2026-06-01T00:00:00.000Z"),
    expiresAt: new Date("2026-08-01T00:00:00.000Z"),
    productId: "prod_ebook_bateau",
    customerEmail: "client@example.com",
  };

  const evaluated = evaluateDiscountCodeForCart({
    discountCode: legacyCoachingCode,
    customerEmail: "client@example.com",
    subtotalCents: 4900,
    currency: "EUR",
    cartProductIds: ["prod_ebook_bateau"],
    now: new Date("2026-07-01T00:00:00.000Z"),
  });

  assert.equal(evaluated.discountTotalCents, 4900);
  assert.equal(evaluated.totalCents, 0);

  assert.throws(
    () =>
      evaluateDiscountCodeForCart({
        discountCode: legacyCoachingCode,
        customerEmail: "someone-else@example.com",
        subtotalCents: 4900,
        currency: "EUR",
        cartProductIds: ["prod_ebook_bateau"],
        now: new Date("2026-07-01T00:00:00.000Z"),
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("validateDiscountCodeForCart refuses a different email", async () => {
  const product = createProductRecord({ id: "prod_ebook" });
  const code = createDiscountCodeRecord({
    code: "COACH-ABC123",
    productId: product.id,
    customerEmail: "buyer@example.com",
  });
  const { db } = createMockDiscountsDb({
    products: [product],
    discountCodes: [code],
    cartLines: [
      {
        cartId: "cart_1",
        lines: [
          {
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              productType: product.productType,
              status: product.status,
              purchaseMode: product.purchaseMode,
            },
            price: {
              id: "price_1",
              currency: "EUR",
              unitAmountCents: 2900,
              status: "ACTIVE",
            },
            quantity: 1,
            lineTotalCents: 2900,
          },
        ],
      },
    ],
  });
  const service = createDiscountService(db);

  await assert.rejects(
    () =>
      service.validateDiscountCodeForCart({
        code: "coach-abc123",
        customerEmail: "other@example.com",
        cartId: "cart_1",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("validateDiscountCodeForCart refuses a different ebook", async () => {
  const product = createProductRecord({ id: "prod_ebook" });
  const otherProduct = createProductRecord({ id: "prod_other", slug: "other-ebook" });
  const code = createDiscountCodeRecord({
    code: "COACH-ABC123",
    productId: product.id,
  });
  const { db } = createMockDiscountsDb({
    products: [product, otherProduct],
    discountCodes: [code],
    cartLines: [
      {
        cartId: "cart_1",
        lines: [
          {
            product: {
              id: otherProduct.id,
              name: otherProduct.name,
              slug: otherProduct.slug,
              productType: otherProduct.productType,
              status: otherProduct.status,
              purchaseMode: otherProduct.purchaseMode,
            },
            price: {
              id: "price_1",
              currency: "EUR",
              unitAmountCents: 2900,
              status: "ACTIVE",
            },
            quantity: 1,
            lineTotalCents: 2900,
          },
        ],
      },
    ],
  });
  const service = createDiscountService(db);

  await assert.rejects(
    () =>
      service.validateDiscountCodeForCart({
        code: "COACH-ABC123",
        customerEmail: "buyer@example.com",
        cartId: "cart_1",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("validateDiscountCodeForCart refuses an expired code", async () => {
  const product = createProductRecord({ id: "prod_ebook" });
  const code = createDiscountCodeRecord({
    expiresAt: new Date("2026-08-05T23:59:59.000Z"),
    productId: product.id,
  });
  const { db } = createMockDiscountsDb({
    products: [product],
    discountCodes: [code],
    cartLines: [
      {
        cartId: "cart_1",
        lines: [
          {
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              productType: product.productType,
              status: product.status,
              purchaseMode: product.purchaseMode,
            },
            price: {
              id: "price_1",
              currency: "EUR",
              unitAmountCents: 2900,
              status: "ACTIVE",
            },
            quantity: 1,
            lineTotalCents: 2900,
          },
        ],
      },
    ],
  });
  const service = createDiscountService(db, {
    now: () => new Date("2026-08-06T00:00:00.000Z"),
  });

  await assert.rejects(
    () =>
      service.validateDiscountCodeForCart({
        code: "COACH-ABC123",
        customerEmail: "buyer@example.com",
        cartId: "cart_1",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("validateDiscountCodeForCart refuses a disabled code", async () => {
  const product = createProductRecord({ id: "prod_ebook" });
  const code = createDiscountCodeRecord({
    status: "DISABLED",
    productId: product.id,
  });
  const { db } = createMockDiscountsDb({
    products: [product],
    discountCodes: [code],
    cartLines: [
      {
        cartId: "cart_1",
        lines: [
          {
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              productType: product.productType,
              status: product.status,
              purchaseMode: product.purchaseMode,
            },
            price: {
              id: "price_1",
              currency: "EUR",
              unitAmountCents: 2900,
              status: "ACTIVE",
            },
            quantity: 1,
            lineTotalCents: 2900,
          },
        ],
      },
    ],
  });
  const service = createDiscountService(db);

  await assert.rejects(
    () =>
      service.validateDiscountCodeForCart({
        code: "COACH-ABC123",
        customerEmail: "buyer@example.com",
        cartId: "cart_1",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("validateDiscountCodeForCart refuses a code already used", async () => {
  const product = createProductRecord({ id: "prod_ebook" });
  const code = createDiscountCodeRecord({
    productId: product.id,
    redeemedCount: 1,
    maxRedemptions: 1,
  });
  const { db } = createMockDiscountsDb({
    products: [product],
    discountCodes: [code],
    cartLines: [
      {
        cartId: "cart_1",
        lines: [
          {
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              productType: product.productType,
              status: product.status,
              purchaseMode: product.purchaseMode,
            },
            price: {
              id: "price_1",
              currency: "EUR",
              unitAmountCents: 2900,
              status: "ACTIVE",
            },
            quantity: 1,
            lineTotalCents: 2900,
          },
        ],
      },
    ],
  });
  const service = createDiscountService(db);

  await assert.rejects(
    () =>
      service.validateDiscountCodeForCart({
        code: "COACH-ABC123",
        customerEmail: "buyer@example.com",
        cartId: "cart_1",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("applyDiscountToCartSummary never lets the final total go negative", async () => {
  const product = createProductRecord({ id: "prod_ebook" });
  const code = createDiscountCodeRecord({
    amountOffCents: 9900,
    productId: product.id,
  });
  const { db } = createMockDiscountsDb({
    products: [product],
    discountCodes: [code],
    cartLines: [
      {
        cartId: "cart_1",
        lines: [
          {
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              productType: product.productType,
              status: product.status,
              purchaseMode: product.purchaseMode,
            },
            price: {
              id: "price_1",
              currency: "EUR",
              unitAmountCents: 2900,
              status: "ACTIVE",
            },
            quantity: 1,
            lineTotalCents: 2900,
          },
        ],
      },
    ],
  });
  const service = createDiscountService(db);

  const summary = await service.applyDiscountToCartSummary({
    code: " coach-abc123 ",
    customerEmail: "buyer@example.com",
    cartId: "cart_1",
  });

  assert.equal(summary.discountTotalCents, 2900);
  assert.equal(summary.totalCents, 0);
  assert.equal(summary.appliedCode, "COACH-ABC123");
});

test("validateDiscountCodeForCart keeps EUR compatibility", async () => {
  const product = createProductRecord({ id: "prod_ebook" });
  const code = createDiscountCodeRecord({
    currency: "EUR",
    productId: product.id,
  });
  const { db } = createMockDiscountsDb({
    products: [product],
    discountCodes: [code],
    cartLines: [
      {
        cartId: "cart_1",
        lines: [
          {
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              productType: product.productType,
              status: product.status,
              purchaseMode: product.purchaseMode,
            },
            price: {
              id: "price_1",
              currency: "EUR",
              unitAmountCents: 2900,
              status: "ACTIVE",
            },
            quantity: 1,
            lineTotalCents: 2900,
          },
        ],
      },
    ],
  });
  const service = createDiscountService(db);

  const result = await service.validateDiscountCodeForCart({
    code: "COACH-ABC123",
    customerEmail: "buyer@example.com",
    cartId: "cart_1",
  });

  assert.equal(result.currency, "EUR");
});

test("redeemDiscountForOrder creates a redemption for an existing order", async () => {
  const order = createOrderRecord({ id: "order_redeem" });
  const { db, state } = createMockDiscountsDb({
    orders: [order],
  });
  const service = createDiscountService(db);

  const redemption = await service.redeemDiscountForOrder({
    discountCodeId: "discount_1",
    orderId: order.id,
    customerEmail: " Buyer@Example.com ",
    productId: "prod_1",
    amountDiscountedCents: 2900,
  });

  assert.equal(redemption.orderId, order.id);
  assert.equal(state.redemptions.length, 1);
  assert.equal(state.redemptions[0]?.customerEmail, "buyer@example.com");
});

test("dashboard discount actions can list, disable and reactivate a code", async () => {
  const product = createProductRecord({ id: "prod_ebook" });
  const discountCode = createDiscountCodeRecord({ productId: product.id });
  const { db, state } = createMockDiscountsDb({
    products: [product],
    discountCodes: [discountCode],
  });
  const service = createDiscountService(db);

  const before = await service.listDashboardDiscountCodes();
  assert.equal(before.length, 1);
  assert.equal(before[0]?.product?.id, product.id);

  await service.disableDiscountCode(discountCode.id);
  assert.equal(state.discountCodes[0]?.status, "DISABLED");

  await service.activateDiscountCode(discountCode.id);
  assert.equal(state.discountCodes[0]?.status, "ACTIVE");
});

test("createAutomaticEbookDiscountCodesForOrder generates one code per ebook, matching its price", async () => {
  const order = createOrderRecord({
    id: "order_ebook_purchase",
    customerEmail: "buyer@example.com",
  });
  const { db, state } = createMockDiscountsDb({
    orders: [order],
    orderItems: [
      { id: "item_ebook", orderId: order.id, productType: "EBOOK", unitAmountCents: 4900, currency: "EUR" },
    ],
  });
  const referenceDate = new Date("2026-08-06T10:00:00.000Z");
  const service = createDiscountService(db, { now: () => referenceDate });

  const created = await service.createAutomaticEbookDiscountCodesForOrder(order.id);

  assert.equal(created.length, 1);
  assert.equal(created[0]?.type, "FIXED_AMOUNT");
  assert.equal(created[0]?.amountOffCents, 4900);
  assert.equal(created[0]?.maxRedemptions, 1);
  assert.equal(created[0]?.productId, null);
  assert.equal(created[0]?.customerEmail, "buyer@example.com");
  assert.deepEqual(created[0]?.expiresAt, new Date("2026-10-06T10:00:00.000Z"));
  assert.equal(state.discountCodes.length, 1);
});

test("createAutomaticEbookDiscountCodesForOrder ignores non-ebook items (packs)", async () => {
  const order = createOrderRecord({ id: "order_pack_only" });
  const { db, state } = createMockDiscountsDb({
    orders: [order],
    orderItems: [
      {
        id: "item_pack",
        orderId: order.id,
        productType: "DIGITAL_DOWNLOAD",
        unitAmountCents: 30000,
        currency: "EUR",
      },
    ],
  });
  const service = createDiscountService(db);

  const created = await service.createAutomaticEbookDiscountCodesForOrder(order.id);

  assert.equal(created.length, 0);
  assert.equal(state.discountCodes.length, 0);
});

test("createAutomaticEbookDiscountCodesForOrder is idempotent on a redelivery for the same order", async () => {
  const order = createOrderRecord({ id: "order_retry", customerEmail: "buyer@example.com" });
  const { db, state } = createMockDiscountsDb({
    orders: [order],
    orderItems: [
      { id: "item_ebook", orderId: order.id, productType: "EBOOK", unitAmountCents: 4900, currency: "EUR" },
    ],
  });
  const service = createDiscountService(db);

  const firstRun = await service.createAutomaticEbookDiscountCodesForOrder(order.id);
  const secondRun = await service.createAutomaticEbookDiscountCodesForOrder(order.id);

  assert.equal(state.discountCodes.length, 1);
  assert.equal(firstRun[0]?.code, secondRun[0]?.code);
});
