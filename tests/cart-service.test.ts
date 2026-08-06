import assert from "node:assert/strict";
import test from "node:test";
import type { Cart, CartItem, Product, ProductPrice } from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import { createCartService, type CartDb } from "@/lib/services/cart";

type CartRecord = Cart & {
  items?: CartItem[];
};

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

function createMockCartDb(seed?: {
  carts?: CartRecord[];
  items?: CartItem[];
  products?: Product[];
  prices?: ProductPrice[];
}) {
  const state = {
    carts: [...(seed?.carts ?? [])],
    items: [...(seed?.items ?? [])],
    products: [...(seed?.products ?? [])],
    prices: [...(seed?.prices ?? [])],
  };

  const inflateCart = (cart: Cart) => ({
    ...cart,
    items: state.items.filter((item) => item.cartId === cart.id),
  });

  const db = {
    async createCart(data: { sessionId?: string; customerEmail?: string }) {
      const cart = createCartRecord({
        id: `cart_${state.carts.length + 1}`,
        sessionId: data.sessionId ?? null,
        customerEmail: data.customerEmail ?? null,
      });
      state.carts.push(cart);
      return cart;
    },
    async findCart(where: { id?: string; sessionId?: string }) {
      const cart = state.carts.find(
        (item) =>
          (where.id ? item.id === where.id : true) &&
          (where.sessionId ? item.sessionId === where.sessionId : true)
      );
      return cart ? inflateCart(cart) : null;
    },
    async findProductById(id: string) {
      return state.products.find((item) => item.id === id) ?? null;
    },
    async findPricesByProductId(productId: string, status?: ProductPrice["status"]) {
      return state.prices.filter(
        (price) => price.productId === productId && (status ? price.status === status : true)
      );
    },
    async createCartItem(data: { cartId: string; productId: string; quantity: number }) {
      const item = createCartItemRecord({
        id: `item_${state.items.length + 1}`,
        ...data,
      });
      state.items.push(item);
      return item;
    },
    async deleteCartItem(cartId: string, productId: string) {
      state.items = state.items.filter(
        (item) => !(item.cartId === cartId && item.productId === productId)
      );
    },
    async deleteCartItems(cartId: string) {
      state.items = state.items.filter((item) => item.cartId !== cartId);
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
    async transaction<T>(callback: (db: CartDb) => Promise<T>): Promise<T> {
      return callback(db);
    },
  };

  return { db, state };
}

test("createCart creates an active cart", async () => {
  const { db } = createMockCartDb();
  const service = createCartService(db);

  const cart = await service.createCart({ sessionId: "session_a", customerEmail: "buyer@example.com" });

  assert.equal(cart.status, "ACTIVE");
  assert.equal(cart.sessionId, "session_a");
  assert.equal(cart.customerEmail, "buyer@example.com");
});

test("addProductToCart adds an ACTIVE BUY_NOW product", async () => {
  const cart = createCartRecord();
  const product = createProductRecord();
  const price = createPriceRecord({ productId: product.id });
  const { db } = createMockCartDb({
    carts: [cart],
    products: [product],
    prices: [price],
  });
  const service = createCartService(db);

  const updatedCart = await service.addProductToCart(cart.id, product.id);

  assert.equal(updatedCart.items?.length, 1);
  assert.equal(updatedCart.items?.[0]?.productId, product.id);
  assert.equal(updatedCart.items?.[0]?.quantity, 1);
});

test("addProductToCart rejects a DRAFT product", async () => {
  const cart = createCartRecord();
  const product = createProductRecord({ status: "DRAFT" });
  const { db } = createMockCartDb({
    carts: [cart],
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
  });
  const service = createCartService(db);

  await assert.rejects(
    () => service.addProductToCart(cart.id, product.id),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("addProductToCart rejects an ARCHIVED product", async () => {
  const cart = createCartRecord();
  const product = createProductRecord({ status: "ARCHIVED" });
  const { db } = createMockCartDb({
    carts: [cart],
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
  });
  const service = createCartService(db);

  await assert.rejects(
    () => service.addProductToCart(cart.id, product.id),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("addProductToCart rejects a REQUEST_ONLY product", async () => {
  const cart = createCartRecord();
  const product = createProductRecord({ purchaseMode: "REQUEST_ONLY" });
  const { db } = createMockCartDb({
    carts: [cart],
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
  });
  const service = createCartService(db);

  await assert.rejects(
    () => service.addProductToCart(cart.id, product.id),
    (error: unknown) => error instanceof HttpError && error.status === 400
  );
});

test("addProductToCart rejects a product with zero active price", async () => {
  const cart = createCartRecord();
  const product = createProductRecord();
  const { db } = createMockCartDb({
    carts: [cart],
    products: [product],
    prices: [createPriceRecord({ productId: product.id, status: "ARCHIVED" })],
  });
  const service = createCartService(db);

  await assert.rejects(
    () => service.addProductToCart(cart.id, product.id),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("addProductToCart rejects a product with multiple active prices", async () => {
  const cart = createCartRecord();
  const product = createProductRecord();
  const { db } = createMockCartDb({
    carts: [cart],
    products: [product],
    prices: [
      createPriceRecord({ id: "price_1", productId: product.id }),
      createPriceRecord({ id: "price_2", productId: product.id }),
    ],
  });
  const service = createCartService(db);

  await assert.rejects(
    () => service.addProductToCart(cart.id, product.id),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("addProductToCart does not create duplicates and quantity stays at 1", async () => {
  const cart = createCartRecord();
  const product = createProductRecord();
  const existingItem = createCartItemRecord({ cartId: cart.id, productId: product.id, quantity: 1 });
  const { db, state } = createMockCartDb({
    carts: [cart],
    items: [existingItem],
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
  });
  const service = createCartService(db);

  const updatedCart = await service.addProductToCart(cart.id, product.id);

  assert.equal(updatedCart.items?.length, 1);
  assert.equal(state.items.length, 1);
  assert.equal(updatedCart.items?.[0]?.quantity, 1);
});

test("removeProductFromCart is idempotent", async () => {
  const cart = createCartRecord();
  const otherItem = createCartItemRecord({ cartId: cart.id, productId: "prod_other" });
  const { db } = createMockCartDb({
    carts: [cart],
    items: [otherItem],
  });
  const service = createCartService(db);

  const updatedCart = await service.removeProductFromCart(cart.id, "prod_missing");

  assert.equal(updatedCart.items?.length, 1);
  assert.equal(updatedCart.items?.[0]?.productId, "prod_other");
});

test("clearCart removes only items from the targeted cart", async () => {
  const cart = createCartRecord({ id: "cart_target" });
  const otherCart = createCartRecord({ id: "cart_other", sessionId: "session_2" });
  const { db, state } = createMockCartDb({
    carts: [cart, otherCart],
    items: [
      createCartItemRecord({ cartId: cart.id, productId: "prod_a" }),
      createCartItemRecord({ id: "item_2", cartId: otherCart.id, productId: "prod_b" }),
    ],
  });
  const service = createCartService(db);

  const updatedCart = await service.clearCart(cart.id);

  assert.equal(updatedCart.items?.length, 0);
  assert.equal(state.items.length, 1);
  assert.equal(state.items[0]?.cartId, otherCart.id);
});

test("getCartSummary calculates subtotal server-side", async () => {
  const cart = createCartRecord();
  const product = createProductRecord();
  const item = createCartItemRecord({ cartId: cart.id, productId: product.id });
  const { db } = createMockCartDb({
    carts: [cart],
    items: [item],
    products: [product],
    prices: [createPriceRecord({ productId: product.id, unitAmountCents: 2900 })],
  });
  const service = createCartService(db);

  const summary = await service.getCartSummary(cart.id);

  assert.equal(summary.subtotalCents, 2900);
  assert.equal(summary.currency, "EUR");
  assert.equal(summary.lines.length, 1);
  assert.equal(summary.lines[0]?.totalCents, 2900);
});

test("getCartSummary rejects multiple currencies", async () => {
  const cart = createCartRecord();
  const productA = createProductRecord({ id: "prod_a", slug: "a" });
  const productB = createProductRecord({ id: "prod_b", slug: "b", name: "Product B" });
  const { db } = createMockCartDb({
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
  const service = createCartService(db);

  await assert.rejects(
    () => service.getCartSummary(cart.id),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("converted cart is not modifiable", async () => {
  const cart = createCartRecord({ status: "CONVERTED" });
  const product = createProductRecord();
  const { db } = createMockCartDb({
    carts: [cart],
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
  });
  const service = createCartService(db);

  await assert.rejects(
    () => service.addProductToCart(cart.id, product.id),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("abandoned cart is not modifiable", async () => {
  const cart = createCartRecord({ status: "ABANDONED" });
  const product = createProductRecord();
  const { db } = createMockCartDb({
    carts: [cart],
    products: [product],
    prices: [createPriceRecord({ productId: product.id })],
  });
  const service = createCartService(db);

  await assert.rejects(
    () => service.addProductToCart(cart.id, product.id),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("markCartConverted transitions ACTIVE to CONVERTED", async () => {
  const cart = createCartRecord({ status: "ACTIVE" });
  const { db } = createMockCartDb({
    carts: [cart],
  });
  const service = createCartService(db);

  const converted = await service.markCartConverted(cart.id);

  assert.equal(converted.status, "CONVERTED");
});

test("abandonCart transitions ACTIVE to ABANDONED", async () => {
  const cart = createCartRecord({ status: "ACTIVE" });
  const { db } = createMockCartDb({
    carts: [cart],
  });
  const service = createCartService(db);

  const abandoned = await service.abandonCart(cart.id);

  assert.equal(abandoned.status, "ABANDONED");
});
