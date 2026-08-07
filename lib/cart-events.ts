export const CART_CHANGED_EVENT = "fabsystem:cart-changed";

export function notifyCartChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}
