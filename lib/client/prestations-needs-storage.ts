import type { PrestationsNeedsAnswers } from "@/lib/prestations-needs";

// Stockage cote client uniquement (sessionStorage), le temps du tunnel
// panier -> formulaire de projet -> Stripe. Rien n'est persiste en base
// (voir contrainte mission : solution temporaire acceptable). sessionStorage
// survit a un aller-retour vers Stripe Checkout dans le meme onglet, ce qui
// permet de ne pas redemander le formulaire si le client annule et retente
// le paiement.

const NEEDS_ANSWERS_KEY_PREFIX = "fabsystem:prestations-needs:";
const PENDING_CHECKOUT_KEY_PREFIX = "fabsystem:pending-checkout:";

export type PendingCheckoutInputs = {
  customerEmail: string;
  customerName?: string;
  discountCode?: string;
  // Les consentements sont collectes dans le panier avant le formulaire
  // projet. Ils restent en session le temps de cette seule etape intermediaire.
  acceptsCgv?: true;
  acknowledgesImmediateDigitalDelivery?: true;
};

function isBrowser() {
  return typeof window !== "undefined";
}

export function readStoredNeedsAnswers(cartId: string): PrestationsNeedsAnswers | null {
  if (!isBrowser()) return null;

  try {
    const raw = window.sessionStorage.getItem(NEEDS_ANSWERS_KEY_PREFIX + cartId);
    if (!raw) return null;
    return JSON.parse(raw) as PrestationsNeedsAnswers;
  } catch {
    return null;
  }
}

export function storeNeedsAnswers(cartId: string, answers: PrestationsNeedsAnswers) {
  if (!isBrowser()) return;

  try {
    window.sessionStorage.setItem(NEEDS_ANSWERS_KEY_PREFIX + cartId, JSON.stringify(answers));
  } catch {
    // Le stockage est une commodite UX (eviter de redemander le formulaire) :
    // une erreur ici (quota, navigation privee restrictive) ne doit jamais
    // bloquer le tunnel d'achat.
  }
}

export function clearNeedsAnswers(cartId: string) {
  if (!isBrowser()) return;

  try {
    window.sessionStorage.removeItem(NEEDS_ANSWERS_KEY_PREFIX + cartId);
  } catch {
    // Voir storeNeedsAnswers.
  }
}

export function readPendingCheckoutInputs(cartId: string): PendingCheckoutInputs | null {
  if (!isBrowser()) return null;

  try {
    const raw = window.sessionStorage.getItem(PENDING_CHECKOUT_KEY_PREFIX + cartId);
    if (!raw) return null;
    return JSON.parse(raw) as PendingCheckoutInputs;
  } catch {
    return null;
  }
}

export function storePendingCheckoutInputs(cartId: string, inputs: PendingCheckoutInputs) {
  if (!isBrowser()) return;

  try {
    window.sessionStorage.setItem(PENDING_CHECKOUT_KEY_PREFIX + cartId, JSON.stringify(inputs));
  } catch {
    // Voir storeNeedsAnswers.
  }
}
