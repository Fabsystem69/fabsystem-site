import assert from "node:assert/strict";
import test from "node:test";
import { notFound } from "@/lib/http-errors";
import {
  CART_COOKIE_MAX_AGE_SECONDS,
  CART_COOKIE_NAME,
  createCartSessionManager,
  generateCartSessionId,
  getCartCookieOptions,
} from "@/lib/cart-session";

type CookieRecord = {
  value: string;
  options?: {
    httpOnly: boolean;
    sameSite: "lax";
    secure: boolean;
    path: "/";
    maxAge: number;
    expires?: Date;
  };
};

function createCookieStore(initialValue?: string) {
  const state = new Map<string, CookieRecord>();

  if (initialValue) {
    state.set(CART_COOKIE_NAME, { value: initialValue });
  }

  return {
    state,
    get(name: string) {
      const entry = state.get(name);
      return entry ? { value: entry.value } : undefined;
    },
    set(name: string, value: string, options: CookieRecord["options"]) {
      state.set(name, { value, options });
    },
  };
}

function createCartSessionService(seed?: {
  carts?: Array<{ id: string; status: "ACTIVE" | "CONVERTED" | "ABANDONED"; sessionId: string | null }>;
}) {
  const state = {
    carts: [...(seed?.carts ?? [])],
  };

  return {
    state,
    service: {
      async createCart(input?: { sessionId?: string }) {
        const cart = {
          id: `cart_${state.carts.length + 1}`,
          status: "ACTIVE" as const,
          sessionId: input?.sessionId ?? null,
        };
        state.carts.push(cart);
        return cart;
      },
      async getCartBySessionId(sessionId: string) {
        const cart = state.carts.find((item) => item.sessionId === sessionId);

        if (!cart) {
          throw notFound("Cart not found");
        }

        return cart;
      },
    },
  };
}

test("generateCartSessionId returns opaque unique identifiers", () => {
  const first = generateCartSessionId();
  const second = generateCartSessionId();

  assert.equal(typeof first, "string");
  assert.equal(first.length, 48);
  assert.notEqual(first, second);
});

test("getCartCookieOptions returns secure cart cookie defaults", () => {
  const options = getCartCookieOptions();

  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.path, "/");
  assert.equal(options.maxAge, CART_COOKIE_MAX_AGE_SECONDS);
  assert.equal(options.secure, false);
});

test("getCurrentCartFromRequest returns an active cart from cookie session", async () => {
  const cookieStore = createCookieStore("session_active");
  const { service } = createCartSessionService({
    carts: [{ id: "cart_1", status: "ACTIVE", sessionId: "session_active" }],
  });
  const manager = createCartSessionManager({
    cookieStore,
    cartService: service,
  });

  const cart = await manager.getCurrentCartFromRequest();

  assert.equal(cart?.id, "cart_1");
  assert.equal(cart?.status, "ACTIVE");
});

test("getOrCreateCartForRequest reuses an existing active cart", async () => {
  const cookieStore = createCookieStore("session_active");
  const { service, state } = createCartSessionService({
    carts: [{ id: "cart_1", status: "ACTIVE", sessionId: "session_active" }],
  });
  const manager = createCartSessionManager({
    cookieStore,
    cartService: service,
  });

  const cart = await manager.getOrCreateCartForRequest();

  assert.equal(cart.id, "cart_1");
  assert.equal(state.carts.length, 1);
});

test("getOrCreateCartForRequest recreates the cart when the current one is converted", async () => {
  const cookieStore = createCookieStore("session_converted");
  const { service, state } = createCartSessionService({
    carts: [{ id: "cart_1", status: "CONVERTED", sessionId: "session_converted" }],
  });
  const manager = createCartSessionManager({
    cookieStore,
    cartService: service,
  });

  const cart = await manager.getOrCreateCartForRequest();
  const nextCookie = cookieStore.state.get(CART_COOKIE_NAME);

  assert.equal(cart.status, "ACTIVE");
  assert.equal(state.carts.length, 2);
  assert.notEqual(cart.sessionId, "session_converted");
  assert.equal(nextCookie?.options?.httpOnly, true);
});

test("getOrCreateCartForRequest recreates the cart when the current one is abandoned", async () => {
  const cookieStore = createCookieStore("session_abandoned");
  const { service, state } = createCartSessionService({
    carts: [{ id: "cart_1", status: "ABANDONED", sessionId: "session_abandoned" }],
  });
  const manager = createCartSessionManager({
    cookieStore,
    cartService: service,
  });

  const cart = await manager.getOrCreateCartForRequest();

  assert.equal(cart.status, "ACTIVE");
  assert.equal(state.carts.length, 2);
  assert.notEqual(cart.sessionId, "session_abandoned");
});

test("clearCartCookie expires the cart cookie", () => {
  const cookieStore = createCookieStore("session_active");
  const { service } = createCartSessionService();
  const manager = createCartSessionManager({
    cookieStore,
    cartService: service,
  });

  manager.clearCartCookie();

  const cleared = cookieStore.state.get(CART_COOKIE_NAME);

  assert.equal(cleared?.value, "");
  assert.equal(cleared?.options?.maxAge, 0);
  assert.equal(cleared?.options?.path, "/");
  assert.ok(cleared?.options?.expires instanceof Date);
});
