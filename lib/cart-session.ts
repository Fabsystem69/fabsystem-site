import crypto from "crypto";
import type { Cart, CartStatus } from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";

export const CART_COOKIE_NAME = "fabsystem_cart";
export const CART_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type CartCookieValue = {
  value: string;
};

type CartCookieOptions = {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
  expires?: Date;
};

type CartCookieStore = {
  get(name: string): CartCookieValue | undefined;
  set(name: string, value: string, options: CartCookieOptions): void;
};

type CartSessionRecord = Pick<Cart, "id" | "status" | "sessionId">;

type CartSessionService = {
  createCart(input?: { sessionId?: string }): Promise<CartSessionRecord>;
  getCartBySessionId(sessionId: string): Promise<CartSessionRecord>;
};

function isCartNotFoundError(error: unknown) {
  return error instanceof HttpError && error.status === 404;
}

export function generateCartSessionId() {
  return crypto.randomBytes(24).toString("hex");
}

export function getCartCookieOptions(): CartCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE_SECONDS,
  };
}

export function shouldRecycleCartStatus(status: CartStatus) {
  return status === "CONVERTED" || status === "ABANDONED";
}

export function createCartSessionManager(deps: {
  cookieStore: CartCookieStore;
  cartService: CartSessionService;
}) {
  const { cookieStore, cartService } = deps;

  return {
    async getCurrentCartFromRequest() {
      const sessionId = cookieStore.get(CART_COOKIE_NAME)?.value?.trim();

      if (!sessionId) {
        return null;
      }

      try {
        const cart = await cartService.getCartBySessionId(sessionId);
        return cart.status === "ACTIVE" ? cart : null;
      } catch (error) {
        if (isCartNotFoundError(error)) {
          return null;
        }

        throw error;
      }
    },

    async getOrCreateCartForRequest() {
      const sessionId = cookieStore.get(CART_COOKIE_NAME)?.value?.trim();

      if (sessionId) {
        try {
          const cart = await cartService.getCartBySessionId(sessionId);

          if (!shouldRecycleCartStatus(cart.status)) {
            return cart;
          }
        } catch (error) {
          if (!isCartNotFoundError(error)) {
            throw error;
          }
        }
      }

      const nextSessionId = generateCartSessionId();
      const cart = await cartService.createCart({ sessionId: nextSessionId });

      cookieStore.set(CART_COOKIE_NAME, nextSessionId, getCartCookieOptions());

      return cart;
    },

    clearCartCookie() {
      cookieStore.set(CART_COOKIE_NAME, "", {
        ...getCartCookieOptions(),
        maxAge: 0,
        expires: new Date(0),
      });
    },
  };
}
