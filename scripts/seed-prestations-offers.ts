// Met à jour le catalogue vendu par Stripe pour les accompagnements actuels.
// Les paiements Stripe utilisent les ProductPrice locaux pour construire
// price_data : aucun Price ID Stripe pré-créé n'est nécessaire.
//
// Usage local : npx tsx scripts/seed-prestations-offers.ts
// Production : exécuter manuellement une fois le déploiement en ligne.

import { loadEnvConfig } from "@next/env";
import { createRequire } from "node:module";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { seedPrestationsOffers } from "@/lib/services/prestations-offers-seed";

loadEnvConfig(process.cwd());

const require = createRequire(import.meta.url);
const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
const { Pool } = require("pg") as typeof import("pg");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Missing DATABASE_URL");

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool), log: ["error"] });

async function main() {
  const result = await seedPrestationsOffers(prisma);
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
