import "server-only";

import { cookies } from "next/headers";
import { HttpError } from "@/lib/http-errors";
import { CART_COOKIE_NAME as COOKIE_NAME, createCartSessionManager } from "@/lib/cart-session";
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

// À la différence de getCurrentCartFromRequest (qui ne renvoie un panier que
// s'il est encore ACTIVE), createOrderFromCart bascule le panier en
// CONVERTED dès la création de la commande — donc au moment où le client
// appelle /api/checkout juste après, un lookup filtré sur ACTIVE renverrait
// toujours null. Ce helper ignore le statut : il sert uniquement à prouver
// que la requête vient bien du navigateur qui a créé le panier/la commande,
// pas à décider si le panier est encore utilisable pour ajouter des articles.
export async function getSessionCartId() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value?.trim();

  if (!sessionId) {
    return null;
  }

  try {
    const cart = await getCartBySessionId(sessionId);
    return cart.id;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      return null;
    }

    throw error;
  }
}
