// Synchronise les trois offres d'accompagnement dans le catalogue Stripe.
// Ce script est idempotent : il retrouve les produits par metadata, met a
// jour leur fiche puis cree un prix Stripe uniquement si le bon montant
// n'existe pas encore. Le catalogue FabSystem reste la source de verite.
//
// Usage : npx tsx scripts/sync-stripe-prestations-products.ts

import { loadEnvConfig } from "@next/env";
import Stripe from "stripe";
import { PRESTATIONS_OFFERS } from "@/lib/prestations-offers";

loadEnvConfig(process.cwd());

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");

const stripe = new Stripe(secretKey);

async function findProductBySlug(slug: string) {
  for await (const product of stripe.products.list({ active: true, limit: 100 })) {
    if (product.metadata.fabsystem_offer_slug === slug) return product;
  }
  return null;
}

async function syncOffer(offer: (typeof PRESTATIONS_OFFERS)[number]) {
  const metadata = { fabsystem_offer_slug: offer.slug, fabsystem_catalog: "prestations" };
  const existing = await findProductBySlug(offer.slug);
  const product = existing
    ? await stripe.products.update(existing.id, { name: offer.name, description: offer.description, metadata, active: true })
    : await stripe.products.create({ name: offer.name, description: offer.description, metadata, active: true });

  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  const matchingPrice = prices.data.find(
    (price) => price.currency === "eur" && price.unit_amount === offer.priceCents && price.type === "one_time"
  );
  const price = matchingPrice ?? await stripe.prices.create({
    product: product.id,
    currency: "eur",
    unit_amount: offer.priceCents,
    metadata: { fabsystem_offer_slug: offer.slug },
  });

  return { slug: offer.slug, productId: product.id, priceId: price.id, amountCents: offer.priceCents, livemode: product.livemode };
}

async function main() {
  const synced = [];
  for (const offer of PRESTATIONS_OFFERS) synced.push(await syncOffer(offer));
  console.log(JSON.stringify({ synced }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
