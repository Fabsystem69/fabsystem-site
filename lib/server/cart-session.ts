import "server-only";

import { cookies } from "next/headers";
import { createCartSessionManager } from "@/lib/cart-session";
import { createCart, getCartBySessionId } from "@/lib/services/cart";

async function getManager() {
  const cookieStore = await cookies();

  return createCartSessionManager({
    cookieStore,
    cartService: {
      createCart,
      getCartBySessionId,
    },
  });
}

export { CART_COOKIE_NAME } from "@/lib/cart-session";

export async function getCurrentCartFromRequest() {
  const manager = await getManager();
  return manager.getCurrentCartFromRequest();
}

export async function getOrCreateCartForRequest() {
  const manager = await getManager();
  return manager.getOrCreateCartForRequest();
}

export async function clearCartCookie() {
  const manager = await getManager();
  manager.clearCartCookie();
}
