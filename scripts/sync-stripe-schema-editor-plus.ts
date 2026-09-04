// Cree ou met a jour les deux prix recurrents Editeur Plus dans Stripe.
// Le script est idempotent et imprime les variables a copier dans Vercel.
// Usage : npx tsx scripts/sync-stripe-schema-editor-plus.ts

import { loadEnvConfig } from "@next/env";
import Stripe from "stripe";
import { SCHEMA_EDITOR_PLUS_PLANS } from "@/lib/services/schema-editor-plus";

loadEnvConfig(process.cwd());

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");

const stripe = new Stripe(secretKey);
const productMetadata = { fabsystem_product: "schema-editor-plus", fabsystem_catalog: "subscription" };

async function findProduct() {
  for await (const product of stripe.products.list({ active: true, limit: 100 })) {
    if (product.metadata.fabsystem_product === "schema-editor-plus") return product;
  }
  return null;
}

async function main() {
  const existing = await findProduct();
  const product = existing
    ? await stripe.products.update(existing.id, { name: "FabSystem Éditeur Plus", description: "Projets, consommateurs, versions et partages illimités.", metadata: productMetadata, active: true })
    : await stripe.products.create({ name: "FabSystem Éditeur Plus", description: "Projets, consommateurs, versions et partages illimités.", metadata: productMetadata });

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  const synced: Record<string, string> = {};
  for (const [plan, definition] of Object.entries(SCHEMA_EDITOR_PLUS_PLANS) as Array<[keyof typeof SCHEMA_EDITOR_PLUS_PLANS, (typeof SCHEMA_EDITOR_PLUS_PLANS)[keyof typeof SCHEMA_EDITOR_PLUS_PLANS]]>) {
    const price = prices.data.find((candidate) => candidate.type === "recurring" && candidate.currency === "eur" && candidate.unit_amount === definition.priceCents && candidate.recurring?.interval === definition.interval)
      ?? await stripe.prices.create({ product: product.id, currency: "eur", unit_amount: definition.priceCents, recurring: { interval: definition.interval }, metadata: { fabsystem_product: "schema-editor-plus", fabsystem_plan: plan } });
    synced[definition.priceEnv] = price.id;
  }

  console.log(JSON.stringify({ productId: product.id, environment: synced, livemode: product.livemode }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
