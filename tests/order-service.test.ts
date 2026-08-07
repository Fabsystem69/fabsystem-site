import assert from "node:assert/strict";
import test from "node:test";
import type {
  Cart,
  CartItem,
  Customer,
  DiscountCode,
  Order,
  OrderItem,
  Payment,
  Product,
  ProductPrice,
} from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import { DEFAULT_DOWNLOAD_GRANT_MAX_DOWNLOADS } from "@/lib/services/download-grant";
import { createOrderService, type OrderDb } from "@/lib/services/order";

type CartRecord = Cart & {
  items?: CartItem[];
};

type OrderRecord = Order & {
  items?: OrderItem[];
  payments?: Payment[];
};

type ProductWithMockAssets = Product & {
  assets?: Array<{
    assetId: string;
    asset: {
      id: string;
      status: "ACTIVE" | "DRAFT" | "ARCHIVED";
    };
  }>;
};

function createCustomerRecord(overrides: Partial<Customer> = {}): Customer {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "customer_1",
    email: overrides.email ?? "buyer@example.com",
    name: overrides.name ?? null,
    phone: overrides.phone ?? null,
    address: overrides.address ?? null,
    assetType: overrides.assetType ?? "OTHER",
    assetBrand: overrides.assetBrand ?? null,
    assetModel: overrides.assetModel ?? null,
    registration: overrides.registration ?? null,
    odometerKm: overrides.odometerKm ?? null,
    engineHours: overrides.engineHours ?? null,
    status: overrides.status ?? "ACTIVE",
    lastLoginAt: overrides.lastLoginAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createProductRecord(overrides: Partial<Product> = {}): Product {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "prod_1",
    slug: overrides.slug ?? "ebook-foundation",
    name: overrides.name ?? "Ebook Foundation",
    shortDescription: overrides.shortDescription ?? "Short description",
    description: overrides.description ?? "Full description",
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

function createCartRecord(overrides: Partial<Cart> = {}): Cart {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "cart_1",
    status: overrides.status ?? "ACTIVE",
    sessionId: overrides.sessionId ?? "session_1",
    customerEmail: overrides.customerEmail ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createCartItemRecord(overrides: Partial<CartItem> = {}): CartItem {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "item_1",
    cartId: overrides.cartId ?? "cart_1",
    productId: overrides.productId ?? "prod_1",
    quantity: overrides.quantity ?? 1,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createOrderRecord(overrides: Partial<Order> = {}): Order {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "order_1",
    orderNumber: overrides.orderNumber ?? "FS-20260806-ABC123",
    status: overrides.status ?? "PENDING_PAYMENT",
    customerId: overrides.customerId ?? null,
    discountCodeId: overrides.discountCodeId ?? null,
    customerEmail: overrides.customerEmail ?? "buyer@example.com",
    customerName: overrides.customerName ?? null,
    currency: overrides.currency ?? "EUR",
    subtotalCents: overrides.subtotalCents ?? 2900,
    discountTotalCents: overrides.discountTotalCents ?? 0,
    totalCents: overrides.totalCents ?? 2900,
    cartId: overrides.cartId ?? "cart_1",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    paidAt: overrides.paidAt ?? null,
    cancelledAt: overrides.cancelledAt ?? null,
    refundedAt: overrides.refundedAt ?? null,
  };
}

function createOrderItemRecord(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: overrides.id ?? "order_item_1",
    orderId: overrides.orderId ?? "order_1",
    productId: overrides.productId ?? "prod_1",
    productSlug: overrides.productSlug ?? "ebook-foundation",
    productName: overrides.productName ?? "Ebook Foundation",
    productType: overrides.productType ?? "EBOOK",
    quantity: overrides.quantity ?? 1,
    currency: overrides.currency ?? "EUR",
    unitAmountCents: overrides.unitAmountCents ?? 2900,
    lineTotalCents: overrides.lineTotalCents ?? 2900,
    createdAt: overrides.createdAt ?? new Date("2026-08-06T00:00:00.000Z"),
  };
}

function createPaymentRecord(overrides: Partial<Payment> = {}): Payment {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "payment_1",
    orderId: overrides.orderId ?? "order_1",
    provider: overrides.provider ?? "STRIPE",
    status: overrides.status ?? "PENDING",
    amountCents: overrides.amountCents ?? 2900,
    currency: overrides.currency ?? "EUR",
    stripeCheckoutSessionId: overrides.stripeCheckoutSessionId ?? null,
    stripePaymentIntentId: overrides.stripePaymentIntentId ?? null,
    stripeCustomerId: overrides.stripeCustomerId ?? null,
    rawProviderStatus: overrides.rawProviderStatus ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    succeededAt: overrides.succeededAt ?? null,
    failedAt: overrides.failedAt ?? null,
    refundedAt: overrides.refundedAt ?? null,
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

function createMockOrderDb(seed?: {
  carts?: CartRecord[];
  items?: CartItem[];
  products?: ProductWithMockAssets[];
  prices?: ProductPrice[];
  discountCodes?: DiscountCode[];
  customers?: Customer[];
  orders?: OrderRecord[];
  orderItems?: OrderItem[];
  payments?: Payment[];
}) {
  const state = {
    carts: [...(seed?.carts ?? [])],
    items: [...(seed?.items ?? [])],
    products: [...(seed?.products ?? [])],
    prices: [...(seed?.prices ?? [])],
    discountCodes: [...(seed?.discountCodes ?? [])],
    customers: [...(seed?.customers ?? [])],
    orders: [...(seed?.orders ?? [])],
    orderItems: [...(seed?.orderItems ?? [])],
    payments: [...(seed?.payments ?? [])],
    downloadGrants: [] as Array<Record<string, unknown>>,
    discountRedemptions: [] as Array<Record<string, unknown>>,
  };

  const inflateCart = (cart: Cart) => ({
    ...cart,
    items: state.items.filter((item) => item.cartId === cart.id),
  });

  const inflateOrder = (order: Order) => ({
    ...order,
    items: state.orderItems.filter((item) => item.orderId === order.id),
    payments: state.payments.filter((payment) => payment.orderId === order.id),
  });

  const db = {
    async findCart(where: { id: string }) {
      const cart = state.carts.find((item) => item.id === where.id);
      return cart ? inflateCart(cart) : null;
    },
    async findProductWithAssetsById(id: string) {
      const product = state.products.find((item) => item.id === id);

      if (!product) {
        return null;
      }

      return {
        ...product,
        assets: product.assets ?? [],
      };
    },
    async findCustomerByEmail(email: string) {
      return state.customers.find((item) => item.email === email) ?? null;
    },
    async findPricesByProductId(productId: string, status?: ProductPrice["status"]) {
      return state.prices.filter(
        (price) => price.productId === productId && (status ? price.status === status : true)
      );
    },
    async findDiscountCodeByCode(code: string) {
      const discountCode = state.discountCodes.find((item) => item.code === code);

      if (!discountCode) {
        return null;
      }

      const product = discountCode.productId
        ? state.products.find((item) => item.id === discountCode.productId) ?? null
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
    async findOrder(where: { id?: string; orderNumber?: string }) {
      const order = state.orders.find(
        (item) =>
          (where.id ? item.id === where.id : true) &&
          (where.orderNumber ? item.orderNumber === where.orderNumber : true)
      );
      return order ? inflateOrder(order) : null;
    },
    async listOrdersByEmail(email: string) {
      return state.orders
        .filter((order) => order.customerEmail === email)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map(inflateOrder);
    },
    async createCustomer(data: {
      email: string;
      name?: string | null;
      status: Customer["status"];
    }) {
      const customer = createCustomerRecord({
        id: `customer_${state.customers.length + 1}`,
        email: data.email,
        name: data.name ?? null,
        status: data.status,
        createdAt: new Date("2026-08-06T01:00:00.000Z"),
        updatedAt: new Date("2026-08-06T01:00:00.000Z"),
      });
      state.customers.push(customer);
      return customer;
    },
    async updateCustomer(
      customerId: string,
      data: {
        name?: string | null;
        status?: Customer["status"];
      }
    ) {
      const customer = state.customers.find((item) => item.id === customerId);

      if (!customer) {
        throw new Error("Customer not found in mock");
      }

      if (typeof data.name !== "undefined") {
        customer.name = data.name;
      }
      if (typeof data.status !== "undefined") {
        customer.status = data.status;
      }
      customer.updatedAt = new Date("2026-08-06T01:00:00.000Z");
      return customer;
    },
    async createOrder(data: Omit<Order, "id" | "createdAt" | "updatedAt" | "paidAt" | "cancelledAt" | "refundedAt">) {
      const order = createOrderRecord({
        id: `order_${state.orders.length + 1}`,
        createdAt: new Date("2026-08-06T01:00:00.000Z"),
        updatedAt: new Date("2026-08-06T01:00:00.000Z"),
        paidAt: null,
        cancelledAt: null,
        refundedAt: null,
        ...data,
      });
      state.orders.push(order);
      return order;
    },
    async createOrderItem(data: Omit<OrderItem, "id" | "createdAt">) {
      const item = createOrderItemRecord({
        id: `order_item_${state.orderItems.length + 1}`,
        createdAt: new Date("2026-08-06T01:00:00.000Z"),
        ...data,
      });
      state.orderItems.push(item);
      return item;
    },
    async createPayment(
      data: Omit<
        Payment,
        | "id"
        | "createdAt"
        | "updatedAt"
        | "succeededAt"
        | "failedAt"
        | "refundedAt"
        | "stripeCheckoutSessionId"
        | "stripePaymentIntentId"
        | "stripeCustomerId"
        | "rawProviderStatus"
      >
    ) {
      const payment = createPaymentRecord({
        id: `payment_${state.payments.length + 1}`,
        createdAt: new Date("2026-08-06T01:00:00.000Z"),
        updatedAt: new Date("2026-08-06T01:00:00.000Z"),
        ...data,
      });
      state.payments.push(payment);
      return payment;
    },
    async createDownloadGrant(data: Record<string, unknown>) {
      state.downloadGrants.push(data);
      return data as never;
    },
    async createDiscountRedemption(data: Record<string, unknown>) {
      state.discountRedemptions.push(data);
      return data as never;
    },
    async updateDiscountCode(discountCodeId: string, data: { redeemedCount: number }) {
      const discountCode = state.discountCodes.find((item) => item.id === discountCodeId);

      if (!discountCode) {
        throw new Error("Discount code not found in mock");
      }

      discountCode.redeemedCount = data.redeemedCount;
      return discountCode;
    },
    async updateCartStatus(cartId: string, status: Cart["status"]) {
      const cart = state.carts.find((item) => item.id === cartId);

      if (!cart) {
        throw new Error("Cart not found in mock");
      }

      cart.status = status;
      cart.updatedAt = new Date("2026-08-06T01:00:00.000Z");
      return cart;
    },
    async updateOrder(orderId: string, data: { status: Order["status"]; cancelledAt?: Date | null; paidAt?: Date | null }) {
      const order = state.orders.find((item) => item.id === orderId);

      if (!order) {
        throw new Error("Order not found in mock");
      }

      order.status = data.status;
      order.cancelledAt = data.cancelledAt ?? null;
      order.paidAt = data.paidAt ?? order.paidAt;
      order.updatedAt = new Date("2026-08-06T02:00:00.000Z");
      return order;
    },
    async transaction<T>(callback: (db: OrderDb) => Promise<T>): Promise<T> {
      return callback(db);
    },
  };

  return { db, state };
}

test("createOrderFromCart converts an active cart into a pending payment order with snapshots and payment", async () => {
  const cart = createCartRecord({ id: "cart_checkout" });
  const product = createProductRecord({
    id: "prod_checkout",
    slug: "ebook-electricite-van",
    name: "Ebook Electricite Van",
  });
  const price = createPriceRecord({
    productId: product.id,
    unitAmountCents: 2900,
  });
  const item = createCartItemRecord({
    cartId: cart.id,
    productId: product.id,
  });
  const { db, state } = createMockOrderDb({
    carts: [cart],
    items: [item],
    products: [product],
    prices: [price],
  });
  const service = createOrderService(db, {
    now: () => new Date("2026-08-06T10:15:00.000Z"),
    randomCode: () => "abc123",
  });

  const order = await service.createOrderFromCart({
    cartId: cart.id,
    customerEmail: " Buyer@Example.com ",
    customerName: " Fabien ",
  });

  assert.equal(order.status, "PENDING_PAYMENT");
  assert.equal(order.orderNumber, "FS-20260806-ABC123");
  assert.equal(order.customerId, "customer_1");
  assert.equal(order.customerEmail, "buyer@example.com");
  assert.equal(order.customerName, "Fabien");
  assert.equal(order.currency, "EUR");
  assert.equal(order.subtotalCents, 2900);
  assert.equal(order.totalCents, 2900);
  assert.equal(order.cartId, cart.id);
  assert.equal(order.items.length, 1);
  assert.equal(order.items[0]?.productId, product.id);
  assert.equal(order.items[0]?.productSlug, product.slug);
  assert.equal(order.items[0]?.productName, product.name);
  assert.equal(order.items[0]?.quantity, 1);
  assert.equal(order.payments.length, 1);
  assert.equal(order.payments[0]?.provider, "STRIPE");
  assert.equal(order.payments[0]?.status, "PENDING");
  assert.equal(order.payments[0]?.amountCents, 2900);
  assert.equal(state.carts[0]?.status, "CONVERTED");
  assert.equal(state.customers.length, 1);
  assert.equal(state.customers[0]?.email, "buyer@example.com");
  assert.equal(state.customers[0]?.name, "Fabien");
});

test("createOrderFromCart reuses an existing customer without creating duplicates", async () => {
  const cart = createCartRecord({ id: "cart_existing_customer" });
  const product = createProductRecord({ id: "prod_existing_customer" });
  const existingCustomer = createCustomerRecord({
    id: "customer_existing",
    email: "buyer@example.com",
    name: "Existing Name",
  });
  const { db, state } = createMockOrderDb({
    carts: [cart],
    items: [createCartItemRecord({ cartId: cart.id, productId: product.id })],
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
    customers: [existingCustomer],
  });
  const service = createOrderService(db, {
    now: () => new Date("2026-08-06T10:15:00.000Z"),
    randomCode: () => "abc123",
  });

  const order = await service.createOrderFromCart({
    cartId: cart.id,
    customerEmail: " Buyer@Example.com ",
    customerName: " Snapshot Name ",
  });

  assert.equal(order.customerId, existingCustomer.id);
  assert.equal(order.customerEmail, "buyer@example.com");
  assert.equal(order.customerName, "Snapshot Name");
  assert.equal(state.customers.length, 1);
  assert.equal(state.customers[0]?.name, "Existing Name");
});

test("createOrderFromCart fills an existing customer name only when currently missing", async () => {
  const cart = createCartRecord({ id: "cart_fill_name" });
  const product = createProductRecord({ id: "prod_fill_name" });
  const existingCustomer = createCustomerRecord({
    id: "customer_no_name",
    email: "buyer@example.com",
    name: null,
  });
  const { db, state } = createMockOrderDb({
    carts: [cart],
    items: [createCartItemRecord({ cartId: cart.id, productId: product.id })],
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
    customers: [existingCustomer],
  });
  const service = createOrderService(db, {
    now: () => new Date("2026-08-06T10:15:00.000Z"),
    randomCode: () => "abc123",
  });

  const order = await service.createOrderFromCart({
    cartId: cart.id,
    customerEmail: "buyer@example.com",
    customerName: " Fabien ",
  });

  assert.equal(order.customerId, existingCustomer.id);
  assert.equal(order.customerName, "Fabien");
  assert.equal(state.customers[0]?.name, "Fabien");
});

test("createOrderFromCart rejects a disabled customer", async () => {
  const cart = createCartRecord({ id: "cart_disabled_customer" });
  const product = createProductRecord({ id: "prod_disabled_customer" });
  const disabledCustomer = createCustomerRecord({
    id: "customer_disabled",
    email: "buyer@example.com",
    status: "DISABLED",
  });
  const { db, state } = createMockOrderDb({
    carts: [cart],
    items: [createCartItemRecord({ cartId: cart.id, productId: product.id })],
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
    customers: [disabledCustomer],
  });
  const service = createOrderService(db);

  await assert.rejects(
    () =>
      service.createOrderFromCart({
        cartId: cart.id,
        customerEmail: "buyer@example.com",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );

  assert.equal(state.orders.length, 0);
});

test("createOrderFromCart creates a discounted pending payment order with the reduced Stripe amount", async () => {
  const cart = createCartRecord({ id: "cart_discounted" });
  const product = createProductRecord({ id: "prod_discounted" });
  const discountCode = createDiscountCodeRecord({
    id: "discount_discounted",
    code: "COACH-ABC123",
    productId: product.id,
    customerEmail: "buyer@example.com",
    amountOffCents: 1000,
    redeemedCount: 0,
    maxRedemptions: 1,
  });
  const { db, state } = createMockOrderDb({
    carts: [cart],
    items: [createCartItemRecord({ cartId: cart.id, productId: product.id })],
    products: [product],
    prices: [createPriceRecord({ productId: product.id, unitAmountCents: 2900 })],
    discountCodes: [discountCode],
  });
  const service = createOrderService(db, {
    now: () => new Date("2026-08-06T10:15:00.000Z"),
    randomCode: () => "abc123",
  });

  const order = await service.createOrderFromCart({
    cartId: cart.id,
    customerEmail: "buyer@example.com",
    discountCode: " coach-abc123 ",
  });

  assert.equal(order.status, "PENDING_PAYMENT");
  assert.equal(order.discountCodeId, discountCode.id);
  assert.equal(order.subtotalCents, 2900);
  assert.equal(order.discountTotalCents, 1000);
  assert.equal(order.totalCents, 1900);
  assert.equal(order.payments.length, 1);
  assert.equal(order.payments[0]?.amountCents, 1900);
  assert.equal(state.downloadGrants.length, 0);
  assert.equal(state.discountRedemptions.length, 1);
  assert.equal(state.discountCodes[0]?.redeemedCount, 1);
});

test("createOrderFromCart creates a free paid order without Stripe payment and issues download grants", async () => {
  const cart = createCartRecord({ id: "cart_free" });
  const product = createProductRecord({ id: "prod_free" });
  const discountCode = createDiscountCodeRecord({
    id: "discount_free",
    code: "COACH-FREE01",
    productId: product.id,
    customerEmail: "buyer@example.com",
    amountOffCents: 2900,
  });
  const { db, state } = createMockOrderDb({
    carts: [cart],
    items: [createCartItemRecord({ cartId: cart.id, productId: product.id })],
    products: [
      {
        ...product,
        assets: [
          {
            assetId: "asset_active_1",
            asset: {
              id: "asset_active_1",
              status: "ACTIVE",
            },
          },
          {
            assetId: "asset_draft_1",
            asset: {
              id: "asset_draft_1",
              status: "DRAFT",
            },
          },
        ],
      },
    ],
    prices: [createPriceRecord({ productId: product.id, unitAmountCents: 2900 })],
    discountCodes: [discountCode],
  });
  const service = createOrderService(db, {
    now: () => new Date("2026-08-06T12:00:00.000Z"),
    randomCode: () => "free01",
  });

  const order = await service.createOrderFromCart({
    cartId: cart.id,
    customerEmail: "buyer@example.com",
    discountCode: "COACH-FREE01",
  });

  assert.equal(order.status, "PAID");
  assert.equal(order.discountCodeId, discountCode.id);
  assert.equal(order.discountTotalCents, 2900);
  assert.equal(order.totalCents, 0);
  assert.equal(order.paidAt?.toISOString(), "2026-08-06T12:00:00.000Z");
  assert.equal(order.payments.length, 0);
  assert.equal(state.downloadGrants.length, 1);
  assert.equal(state.downloadGrants[0]?.maxDownloads, DEFAULT_DOWNLOAD_GRANT_MAX_DOWNLOADS);
  assert.equal(state.discountRedemptions.length, 1);
  assert.equal(state.discountCodes[0]?.redeemedCount, 1);
  assert.equal(state.carts[0]?.status, "CONVERTED");
});

test("createOrderFromCart rejects an empty cart", async () => {
  const cart = createCartRecord();
  const { db } = createMockOrderDb({
    carts: [cart],
  });
  const service = createOrderService(db);

  await assert.rejects(
    () =>
      service.createOrderFromCart({
        cartId: cart.id,
        customerEmail: "buyer@example.com",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("createOrderFromCart rejects a converted cart", async () => {
  const cart = createCartRecord({ status: "CONVERTED" });
  const product = createProductRecord();
  const { db } = createMockOrderDb({
    carts: [cart],
    items: [createCartItemRecord({ cartId: cart.id, productId: product.id })],
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
  });
  const service = createOrderService(db);

  await assert.rejects(
    () =>
      service.createOrderFromCart({
        cartId: cart.id,
        customerEmail: "buyer@example.com",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("createOrderFromCart rejects a draft product", async () => {
  const cart = createCartRecord();
  const product = createProductRecord({ status: "DRAFT" });
  const { db } = createMockOrderDb({
    carts: [cart],
    items: [createCartItemRecord({ cartId: cart.id, productId: product.id })],
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
  });
  const service = createOrderService(db);

  await assert.rejects(
    () =>
      service.createOrderFromCart({
        cartId: cart.id,
        customerEmail: "buyer@example.com",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("createOrderFromCart rejects an archived product", async () => {
  const cart = createCartRecord();
  const product = createProductRecord({ status: "ARCHIVED" });
  const { db } = createMockOrderDb({
    carts: [cart],
    items: [createCartItemRecord({ cartId: cart.id, productId: product.id })],
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
  });
  const service = createOrderService(db);

  await assert.rejects(
    () =>
      service.createOrderFromCart({
        cartId: cart.id,
        customerEmail: "buyer@example.com",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("createOrderFromCart rejects a request-only product", async () => {
  const cart = createCartRecord();
  const product = createProductRecord({ purchaseMode: "REQUEST_ONLY" });
  const { db } = createMockOrderDb({
    carts: [cart],
    items: [createCartItemRecord({ cartId: cart.id, productId: product.id })],
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
  });
  const service = createOrderService(db);

  await assert.rejects(
    () =>
      service.createOrderFromCart({
        cartId: cart.id,
        customerEmail: "buyer@example.com",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("createOrderFromCart rejects if a product has zero active price", async () => {
  const cart = createCartRecord();
  const product = createProductRecord();
  const { db } = createMockOrderDb({
    carts: [cart],
    items: [createCartItemRecord({ cartId: cart.id, productId: product.id })],
    products: [product],
    prices: [createPriceRecord({ productId: product.id, status: "ARCHIVED" })],
  });
  const service = createOrderService(db);

  await assert.rejects(
    () =>
      service.createOrderFromCart({
        cartId: cart.id,
        customerEmail: "buyer@example.com",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("createOrderFromCart rejects if a product has multiple active prices", async () => {
  const cart = createCartRecord();
  const product = createProductRecord();
  const { db } = createMockOrderDb({
    carts: [cart],
    items: [createCartItemRecord({ cartId: cart.id, productId: product.id })],
    products: [product],
    prices: [
      createPriceRecord({ id: "price_1", productId: product.id }),
      createPriceRecord({ id: "price_2", productId: product.id }),
    ],
  });
  const service = createOrderService(db);

  await assert.rejects(
    () =>
      service.createOrderFromCart({
        cartId: cart.id,
        customerEmail: "buyer@example.com",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("createOrderFromCart rejects if multiple currencies exist in the cart", async () => {
  const cart = createCartRecord();
  const productA = createProductRecord({ id: "prod_a", slug: "a" });
  const productB = createProductRecord({ id: "prod_b", slug: "b" });
  const { db } = createMockOrderDb({
    carts: [cart],
    items: [
      createCartItemRecord({ cartId: cart.id, productId: productA.id }),
      createCartItemRecord({ id: "item_2", cartId: cart.id, productId: productB.id }),
    ],
    products: [productA, productB],
    prices: [
      createPriceRecord({ id: "price_a", productId: productA.id, currency: "EUR" }),
      createPriceRecord({ id: "price_b", productId: productB.id, currency: "USD" }),
    ],
  });
  const service = createOrderService(db);

  await assert.rejects(
    () =>
      service.createOrderFromCart({
        cartId: cart.id,
        customerEmail: "buyer@example.com",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("createOrderFromCart retries order number generation on collision", async () => {
  const cart = createCartRecord();
  const product = createProductRecord();
  const existingOrder = createOrderRecord({ orderNumber: "FS-20260806-ABC123" });
  const { db } = createMockOrderDb({
    carts: [cart],
    items: [createCartItemRecord({ cartId: cart.id, productId: product.id })],
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
    orders: [existingOrder],
  });
  const codes = ["abc123", "def456"];
  const service = createOrderService(db, {
    now: () => new Date("2026-08-06T10:15:00.000Z"),
    randomCode: () => codes.shift() ?? "zzz999",
  });

  const order = await service.createOrderFromCart({
    cartId: cart.id,
    customerEmail: "buyer@example.com",
  });

  assert.equal(order.orderNumber, "FS-20260806-DEF456");
});

test("createOrderFromCart fails after repeated order number collisions", async () => {
  const cart = createCartRecord();
  const product = createProductRecord();
  const collidingOrders = Array.from({ length: 5 }, (_, index) =>
    createOrderRecord({
      id: `order_existing_${index + 1}`,
      orderNumber: `FS-20260806-COLLID`,
    })
  );
  const { db } = createMockOrderDb({
    carts: [cart],
    items: [createCartItemRecord({ cartId: cart.id, productId: product.id })],
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
    orders: collidingOrders,
  });
  const service = createOrderService(db, {
    now: () => new Date("2026-08-06T10:15:00.000Z"),
    randomCode: () => "collid",
  });

  await assert.rejects(
    () =>
      service.createOrderFromCart({
        cartId: cart.id,
        customerEmail: "buyer@example.com",
      }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("getOrderById returns an order with items and payments", async () => {
  const order = createOrderRecord({ id: "order_lookup" });
  const orderItem = createOrderItemRecord({ orderId: order.id });
  const payment = createPaymentRecord({ orderId: order.id });
  const { db } = createMockOrderDb({
    orders: [order],
    orderItems: [orderItem],
    payments: [payment],
  });
  const service = createOrderService(db);

  const result = await service.getOrderById(order.id);

  assert.equal(result.id, order.id);
  assert.equal(result.items.length, 1);
  assert.equal(result.payments.length, 1);
});

test("getOrderByNumber returns an order by order number", async () => {
  const order = createOrderRecord({ orderNumber: "FS-20260806-LOOKUP1" });
  const { db } = createMockOrderDb({
    orders: [order],
  });
  const service = createOrderService(db);

  const result = await service.getOrderByNumber(order.orderNumber);

  assert.equal(result.orderNumber, order.orderNumber);
});

test("listOrdersForEmail returns newest orders first", async () => {
  const newer = createOrderRecord({
    id: "order_new",
    customerEmail: "buyer@example.com",
    createdAt: new Date("2026-08-06T02:00:00.000Z"),
  });
  const older = createOrderRecord({
    id: "order_old",
    orderNumber: "FS-20260805-OLDER1",
    customerEmail: "buyer@example.com",
    createdAt: new Date("2026-08-05T02:00:00.000Z"),
  });
  const other = createOrderRecord({
    id: "order_other",
    orderNumber: "FS-20260804-OTHER1",
    customerEmail: "other@example.com",
  });
  const { db } = createMockOrderDb({
    orders: [older, newer, other],
  });
  const service = createOrderService(db);

  const orders = await service.listOrdersForEmail(" Buyer@Example.com ");

  assert.equal(orders.length, 2);
  assert.equal(orders[0]?.id, "order_new");
  assert.equal(orders[1]?.id, "order_old");
});

test("cancelPendingOrder transitions a pending payment order to cancelled", async () => {
  const order = createOrderRecord({ id: "order_cancel" });
  const { db } = createMockOrderDb({
    orders: [order],
  });
  const service = createOrderService(db, {
    now: () => new Date("2026-08-06T12:00:00.000Z"),
  });

  const cancelledOrder = await service.cancelPendingOrder(order.id);

  assert.equal(cancelledOrder.status, "CANCELLED");
  assert.equal(cancelledOrder.cancelledAt?.toISOString(), "2026-08-06T12:00:00.000Z");
});

test("cancelPendingOrder rejects a paid order", async () => {
  const order = createOrderRecord({ status: "PAID" });
  const { db } = createMockOrderDb({
    orders: [order],
  });
  const service = createOrderService(db);

  await assert.rejects(
    () => service.cancelPendingOrder(order.id),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});
