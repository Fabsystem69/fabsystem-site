import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

// Bug réel (même famille que tests/project-schema-share-route.test.ts) :
// GET/PATCH/DELETE résolvaient l'acteur via requireCustomerActor() (exige
// une vraie session client, rejette toujours l'admin) au lieu de
// requireProjectActor() (admin OU client). DELETE est atteignable depuis
// l'éditeur de schéma lui-même (SaveMenu.tsx -> deleteProjectApi), qu'un
// admin utilise aussi pour le projet d'un client — "Supprimer" échouait
// systématiquement pour lui.

const routeSource = readFileSync(
  join(__dirname, "..", "app/api/projects/[projectId]/route.ts"),
  "utf8"
);

test("GET/PATCH/DELETE résolvent un acteur client OU admin (pas seulement client)", () => {
  assert.match(routeSource, /requireProjectActor/);
  // doesNotMatch sur l'appel réel, pas sur le mot (qui apparaît dans le
  // commentaire expliquant le bug corrigé, juste au-dessus de DELETE).
  assert.doesNotMatch(routeSource, /requireCustomerActor\(/);
});

test("GET, PATCH et DELETE utilisent tous requireProjectActor", () => {
  const getMatch = routeSource.match(/export async function GET[\s\S]*?^}/m);
  const patchMatch = routeSource.match(/export async function PATCH[\s\S]*?^}/m);
  const deleteMatch = routeSource.match(/export async function DELETE[\s\S]*?^}/m);
  assert.ok(getMatch, "GET handler not found");
  assert.ok(patchMatch, "PATCH handler not found");
  assert.ok(deleteMatch, "DELETE handler not found");
  assert.match(getMatch![0], /requireProjectActor\(\)/);
  assert.match(patchMatch![0], /requireProjectActor\(\)/);
  assert.match(deleteMatch![0], /requireProjectActor\(\)/);
});
