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
  createDiscountService,
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
    amountOffCents: overrides.amountOffCents ?? 2900,
    percentOff: overrides.percentOff ?? null,
    currency: overrides.currency ?? "EUR",
    maxRedemptions: overrides.maxRedemptions ?? 1,
    redeemedCount: overrides.redeemedCount ?? 0,
    startsAt: overrides.startsAt ?? now,
    expiresAt: overrides.expiresAt ?? new Date("2026-10-06T00:00:00.000Z"),
    productId: overrides.productId ?? "prod_1",
    customerEmail: overrides.customerEmail ?? "buyer@example.com",
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

function createMockDiscountsDb(seed?: {
  products?: Product[];
  prices?: ProductPrice[];
  discountCodes?: DiscountCode[];
  orders?: Order[];
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
    async findActivePricesByProductId(productId: string) {
      return state.prices.filter(
        (price) => price.productId === productId && price.status === "ACTIVE"
      );
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
    async findCoachingCodeForCustomerProduct(input: {
      customerEmail: string;
      productId: string;
    }) {
      const discountCode =
        state.discountCodes.find(
          (entry) =>
            entry.customerEmail === input.customerEmail &&
            entry.productId === input.productId &&
            entry.code.startsWith("COACH-")
        ) ?? null;

      if (!discountCode) {
        return null;
      }

      const product = state.products.find((entry) => entry.id === discountCode.productId) ?? null;

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

test("createCoachingEbookDiscountCode creates a code valid for two months with the active ebook price", async () => {
  const product = createProductRecord({ id: "prod_ebook" });
  const price = createPriceRecord({ productId: product.id, unitAmountCents: 4900 });
  const referenceDate = new Date("2026-08-06T10:00:00.000Z");
  const { db } = createMockDiscountsDb({
    products: [product],
    prices: [price],
  });
  const service = createDiscountService(db, {
    now: () => referenceDate,
    randomCode: () => "ABC123",
  });

  const discountCode = await service.createCoachingEbookDiscountCode({
    customerEmail: " Buyer@Example.com ",
    productId: product.id,
  });

  assert.equal(discountCode.code, "COACH-ABC123");
  assert.equal(discountCode.amountOffCents, 4900);
  assert.equal(discountCode.currency, "EUR");
  assert.equal(discountCode.customerEmail, "buyer@example.com");
  assert.equal(discountCode.reason, "Prestation coaching");
  assert.deepEqual(discountCode.startsAt, referenceDate);
  assert.deepEqual(discountCode.expiresAt, new Date("2026-10-06T10:00:00.000Z"));
});

test("createCoachingEbookDiscountCode keeps the amount frozen even if the product price changes later", async () => {
  const product = createProductRecord({ id: "prod_ebook" });
  const initialPrice = createPriceRecord({ id: "price_old", productId: product.id, unitAmountCents: 2900 });
  const { db, state } = createMockDiscountsDb({
    products: [product],
    prices: [initialPrice],
  });
  const service = createDiscountService(db, {
    randomCode: () => "ABC123",
  });

  const discountCode = await service.createCoachingEbookDiscountCode({
    customerEmail: "buyer@example.com",
    productId: product.id,
  });

  state.prices = [createPriceRecord({ id: "price_new", productId: product.id, unitAmountCents: 5900 })];

  assert.equal(discountCode.amountOffCents, 2900);
});

test("createCoachingEbookDiscountCode refuses a second coaching code for the same email and ebook", async () => {
  const product = createProductRecord({ id: "prod_ebook" });
  const price = createPriceRecord({ productId: product.id });
  const existingCode = createDiscountCodeRecord({
    code: "COACH-EXIST1",
    productId: product.id,
    customerEmail: "buyer@example.com",
  });
  const { db } = createMockDiscountsDb({
    products: [product],
    prices: [price],
    discountCodes: [existingCode],
  });
  const service = createDiscountService(db);

  await assert.rejects(
    () =>
      service.createCoachingEbookDiscountCode({
        customerEmail: "buyer@example.com",
        productId: product.id,
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("createCoachingEbookDiscountCode allows the same email for another ebook", async () => {
  const productA = createProductRecord({ id: "prod_a", slug: "ebook-a" });
  const productB = createProductRecord({ id: "prod_b", slug: "ebook-b" });
  const { db } = createMockDiscountsDb({
    products: [productA, productB],
    prices: [
      createPriceRecord({ id: "price_a", productId: productA.id }),
      createPriceRecord({ id: "price_b", productId: productB.id }),
    ],
    discountCodes: [
      createDiscountCodeRecord({
        code: "COACH-EXIST1",
        productId: productA.id,
        customerEmail: "buyer@example.com",
      }),
    ],
  });
  const service = createDiscountService(db, {
    randomCode: () => "ABC123",
  });

  const created = await service.createCoachingEbookDiscountCode({
    customerEmail: "buyer@example.com",
    productId: productB.id,
  });

  assert.equal(created.productId, productB.id);
});

test("createCoachingEbookDiscountCode allows another email for the same ebook", async () => {
  const product = createProductRecord({ id: "prod_ebook" });
  const { db } = createMockDiscountsDb({
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
    discountCodes: [
      createDiscountCodeRecord({
        code: "COACH-EXIST1",
        productId: product.id,
        customerEmail: "first@example.com",
      }),
    ],
  });
  const service = createDiscountService(db, {
    randomCode: () => "DEF456",
  });

  const created = await service.createCoachingEbookDiscountCode({
    customerEmail: "second@example.com",
    productId: product.id,
  });

  assert.equal(created.customerEmail, "second@example.com");
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
