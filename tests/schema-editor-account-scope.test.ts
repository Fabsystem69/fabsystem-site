import assert from "node:assert/strict";
import test from "node:test";
import { resolveProjectAccountScope } from "@/lib/schema-editor/project-account-scope";

// Retour utilisateur : "quand je bosse sur un schéma client c'est comme si
// j'étais sur son compte" — l'Admin ne doit jamais retomber sur ses propres
// projets (session client personnelle) depuis Ouvrir / Sauvegarder.

test("un client connecté utilise toujours ses propres projets", () => {
  assert.deepEqual(resolveProjectAccountScope({ isAdmin: false, actingCustomerId: null }), {
    kind: "self",
    listUrl: "/api/projects",
    createUrl: "/api/projects",
  });
});

test("un client ne peut pas cibler un autre compte même si un id traîne", () => {
  assert.equal(resolveProjectAccountScope({ isAdmin: false, actingCustomerId: "cus_1" }).kind, "self");
});

test("un admin sans client choisi doit d'abord choisir un client", () => {
  assert.deepEqual(resolveProjectAccountScope({ isAdmin: true, actingCustomerId: null }), { kind: "needs-customer" });
});

test("un admin avec client choisi travaille sur les projets de ce client", () => {
  assert.deepEqual(resolveProjectAccountScope({ isAdmin: true, actingCustomerId: "cus_42" }), {
    kind: "customer",
    customerId: "cus_42",
    listUrl: "/api/internal/projects?customerId=cus_42",
    createUrl: "/api/internal/projects",
  });
});

test("l'id client est encodé dans l'URL", () => {
  const scope = resolveProjectAccountScope({ isAdmin: true, actingCustomerId: "a&b" });
  assert.equal(scope.kind === "customer" && scope.listUrl, "/api/internal/projects?customerId=a%26b");
});
