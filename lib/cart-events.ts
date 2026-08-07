export const CART_CHANGED_EVENT = "fabsystem:cart-changed";
export const CART_ITEM_ADDED_EVENT = "fabsystem:cart-item-added";

export function notifyCartChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}

// Evenement distinct de notifyCartChanged (badge navbar) : sert uniquement a
// declencher l'ouverture automatique du drawer panier a l'ajout d'un produit,
// pas au retrait/vidage.
export function notifyCartItemAdded() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(CART_ITEM_ADDED_EVENT));
}
