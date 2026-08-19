import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

// Contexte implicite par requête (retour utilisateur : "avoir les remontées
// d'erreur avec l'id du client") — évite de faire passer `customerId` en
// paramètre à travers les ~35 routes qui appellent `toErrorResponse`
// (lib/http-errors.ts). `requireCustomerActor()` (project-actor.ts) pose
// l'id ici dès qu'une session valide est résolue ; `toErrorResponse` le lit
// à la volée si une erreur survient plus loin dans la même requête. Chaque
// invocation de route handler démarre sa propre chaîne asynchrone (aucun
// état partagé entre requêtes concurrentes) — `enterWith` suffit, pas besoin
// d'englober tout le handler dans un `run()`.
type RequestContext = { customerId?: string };

const storage = new AsyncLocalStorage<RequestContext>();

export function setRequestCustomerId(customerId: string) {
  const store = storage.getStore();
  if (store) {
    store.customerId = customerId;
    return;
  }
  storage.enterWith({ customerId });
}

export function getRequestCustomerId(): string | undefined {
  return storage.getStore()?.customerId;
}
