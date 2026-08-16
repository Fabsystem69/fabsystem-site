import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const routeSource = readFileSync(
  join(__dirname, "..", "app/api/projects/[projectId]/schema/route.ts"),
  "utf8"
);

test("la route schema vérifie l'ownership via requireCustomerActor avant lecture et écriture", () => {
  assert.match(routeSource, /requireCustomerActor/);
  assert.match(routeSource, /getProjectSchema\(actor, projectId\)/);
  assert.match(routeSource, /saveProjectSchema\(actor, projectId,/);
});

test("la route schema protège la sauvegarde avec un rate limit et une limite de taille", () => {
  assert.match(routeSource, /enforceRateLimit/);
  assert.match(routeSource, /project-schema-save/);
  assert.match(routeSource, /payloadTooLarge/);
  assert.match(routeSource, /MAX_PROJECT_SCHEMA_REQUEST_BYTES/);
  assert.match(routeSource, /request\.text\(\)/);
});
