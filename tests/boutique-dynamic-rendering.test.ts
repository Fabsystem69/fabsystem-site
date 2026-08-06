import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = join(__dirname, "..");

// Régression : /boutique était rendue statiquement au build (x-nextjs-prerender: 1,
// x-vercel-cache: HIT en prod), donc les produits activés après le déploiement
// n'apparaissaient jamais tant qu'aucun redeploy n'avait lieu. Ces pages doivent
// toujours lire le catalogue en base à chaque requête.
const dynamicPages = ["app/boutique/page.tsx", "app/boutique/[slug]/page.tsx"];

test("boutique catalog pages opt out of static prerendering", () => {
  for (const relativePath of dynamicPages) {
    const source = readFileSync(join(root, relativePath), "utf8");

    assert.match(
      source,
      /export const dynamic = "force-dynamic";/,
      `${relativePath} should force dynamic rendering so newly activated products show up immediately`
    );
  }
});
