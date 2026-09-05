import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = join(__dirname, "..");

const removedPaths = [
  "app/api/ebook/checkout/route.ts",
  "app/api/ebook/download/route.ts",
  "app/ebook/acces/[token]/page.tsx",
  "app/ebook/annule/page.tsx",
  "app/ebook/merci/page.tsx",
  "lib/ebook-token.ts",
  "lib/ebook-blob.ts",
  "lib/ebook-html.ts",
  "components/EbookCheckoutForm.tsx",
  "components/EbookCheckoutModal.tsx",
  "scripts/resend-ebook-email.ts",
  "scripts/upload-ebook-master.mjs",
  "scripts/verify-ebook-master.mjs",
];

test("legacy ebook purchase tunnel files no longer exist on disk", () => {
  for (const relativePath of removedPaths) {
    assert.equal(
      existsSync(join(root, relativePath)),
      false,
      `${relativePath} should have been removed by the Sprint 8.9 legacy decommission`
    );
  }
});

test(".env.example no longer documents the removed legacy variables", () => {
  const envExample = readFileSync(join(root, ".env.example"), "utf8");

  assert.doesNotMatch(envExample, /^BLOB_READ_WRITE_TOKEN=/m);
  assert.doesNotMatch(envExample, /^STRIPE_PRICE_ID_EBOOK=/m);
  assert.doesNotMatch(envExample, /^EBOOK_ACCESS_TOKEN_SECRET=/m);
});

// Reintroduit deliberement pour le stockage des documents de dossier
// d'accompagnement (lib/server/dossier-storage.ts, refonte suivi client) —
// contexte different de l'ancien systeme ebook decommissionne ci-dessus.
// Choisi plutot que Supabase (deja utilise pour les ebooks) car les projets
// Supabase gratuits se mettent en pause apres 7 jours d'inactivite, un
// risque pour un stockage dont depend un client. BLOB_READ_WRITE_TOKEN dans
// .env est le meme store historique, jamais supprime malgre le retrait du
// code qui l'utilisait — reutilise ici, pas un nouveau provisioning.
test("package.json depends on @vercel/blob for dossier document storage", () => {
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
  };

  assert.equal("@vercel/blob" in (packageJson.dependencies ?? {}), true);
});
