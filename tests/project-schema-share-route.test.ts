import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

// Bug réel (retour utilisateur : "je n'arrive pas à créer un lien de
// partage quand je travaille sur le projet d'un client") : contrairement à
// toutes les autres routes du schéma (lecture/écriture, versions,
// restauration — voir tests/project-schema-route.test.ts), celle-ci
// résolvait l'acteur via requireCustomerActor() (exige une vraie session
// client, rejette toujours l'admin) au lieu de requireProjectActor()
// (admin OU client, même contrat que ses routes sœurs). Un admin qui
// travaille sur le schéma d'un client depuis le dashboard n'a pas de
// session client active : POST/DELETE échouaient systématiquement pour lui.

const routeSource = readFileSync(
  join(__dirname, "..", "app/api/projects/[projectId]/schema/share/route.ts"),
  "utf8"
);

test("la route de partage résout un acteur client OU admin (pas seulement client)", () => {
  assert.match(routeSource, /requireProjectActor/);
  assert.doesNotMatch(routeSource, /requireCustomerActor/);
});

test("POST et DELETE utilisent tous les deux requireProjectActor", () => {
  const postMatch = routeSource.match(/export async function POST[\s\S]*?^}/m);
  const deleteMatch = routeSource.match(/export async function DELETE[\s\S]*?^}/m);
  assert.ok(postMatch, "POST handler not found");
  assert.ok(deleteMatch, "DELETE handler not found");
  assert.match(postMatch![0], /requireProjectActor\(\)/);
  assert.match(deleteMatch![0], /requireProjectActor\(\)/);
});
