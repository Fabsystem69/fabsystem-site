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

// Regression : un client qui clique sur un lien de telechargement direct ne doit
// jamais voir du JSON brut ({"error":...,"code":"CONFLICT"}). En cas d'erreur, la
// route doit rediriger vers /mon-compte avec un message clair, notamment le message
// dedie a la limite de telechargement atteinte.
test("downloads route redirects to /mon-compte with a friendly downloadError instead of returning raw JSON on error", () => {
  assert.doesNotMatch(routeSource, /toErrorResponse/);
  assert.match(routeSource, /\/mon-compte/);
  assert.match(routeSource, /downloadError/);
  assert.match(
    routeSource,
    /La limite de telechargement est atteinte\. Contactez FabSystem pour reactiver l'acces\./
  );
});

test("downloads route redirects an unauthenticated visitor to the customer login page", () => {
  assert.match(routeSource, /\/connexion-client/);
});
