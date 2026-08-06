import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const routeSource = readFileSync(
  join(__dirname, "..", "app/api/downloads/[grantId]/route.ts"),
  "utf8"
);

// Régression : le fix "forcer le téléchargement" vit entièrement dans la génération
// de la signed URL Supabase (Content-Disposition via l'option `download`). La route
// ne doit jamais se mettre à proxyfier/streamer le fichier elle-même — elle doit
// continuer à rediriger vers l'URL signée.
test("downloads route redirects to the signed URL instead of proxying the file", () => {
  assert.match(routeSource, /NextResponse\.redirect\(access\.url/);
});

test("downloads route does not fetch or stream the asset body itself", () => {
  assert.doesNotMatch(routeSource, /\bfetch\(/);
  assert.doesNotMatch(routeSource, /ReadableStream/);
});
