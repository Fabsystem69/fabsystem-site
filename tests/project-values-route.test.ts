import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

// UI-13 — nouvelle route de lecture seule utilisée par le pont
// Outils→Project pour détecter un conflit avant import (mission §19).
// Régression : l'ownership doit être vérifiée exactement comme les autres
// routes /api/projects/[projectId]/* (même getProject(actor, projectId)),
// jamais un raccourci qui lirait les valeurs sans vérifier le
// propriétaire.
const routeSource = readFileSync(
  join(__dirname, "..", "app/api/projects/[projectId]/values/route.ts"),
  "utf8"
);

test("la route values vérifie l'ownership via requireCustomerActor + getProject avant toute lecture", () => {
  assert.match(routeSource, /requireCustomerActor/);
  assert.match(routeSource, /getProject\(actor, projectId\)/);
});

test("la route values est en lecture seule (GET uniquement, aucune mutation)", () => {
  assert.match(routeSource, /export async function GET/);
  assert.doesNotMatch(routeSource, /export async function (POST|PATCH|DELETE|PUT)/);
  assert.doesNotMatch(routeSource, /retainValue|createProject|updateProject|deleteProject/);
});
