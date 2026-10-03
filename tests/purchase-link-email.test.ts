import assert from "node:assert/strict";
import test from "node:test";
import { buildAccountStep, buildPurchaseLink, purchaseLinkInputSchema } from "@/lib/services/purchase-link-email";
import { getEmailTemplateDefault } from "@/lib/email-templates-defaults";

test("buildPurchaseLink builds the direct /acheter link without double slashes", () => {
  assert.equal(
    buildPurchaseLink("https://fabsystem.fr/", "pack-amarrage-van"),
    "https://fabsystem.fr/acheter/pack-amarrage-van"
  );
});

test("purchaseLinkInputSchema normalizes the email and rejects invalid ones", () => {
  const ok = purchaseLinkInputSchema.parse({ productSlug: "pack-x", customerEmail: "  Client@Example.COM " });
  assert.equal(ok.customerEmail, "client@example.com");
  assert.equal(purchaseLinkInputSchema.safeParse({ productSlug: "pack-x", customerEmail: "nope" }).success, false);
  assert.equal(purchaseLinkInputSchema.safeParse({ productSlug: "", customerEmail: "a@b.fr" }).success, false);
});

test("purchase-link email template declares every variable used in its text", () => {
  const template = getEmailTemplateDefault("purchase-link");
  assert.ok(template);
  const declared = new Set(template.variables.map((variable) => variable.name));
  const used = [...`${template.subject}\n${template.bodyText}`.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
  assert.ok(used.length > 0);
  for (const name of used) {
    assert.ok(declared.has(name), `variable ${name} not declared`);
  }
});

test("buildAccountStep sends existing customers to the login page and others to signup", () => {
  const existing = buildAccountStep({ customerEmail: "a@b.fr", baseUrl: "https://fabsystem.fr/", hasAccount: true });
  assert.match(existing, /https:\/\/fabsystem\.fr\/connexion-client/);
  const fresh = buildAccountStep({ customerEmail: "a@b.fr", baseUrl: "https://fabsystem.fr", hasAccount: false });
  assert.match(fresh, /créez votre compte/);
});
