import { defineConfig } from "prisma/config";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const databaseUrl = process.env["DATABASE_URL"];
// Les migrations doivent emprunter la connexion directe quand elle est
// disponible. Vercel expose cette URL sous DATABASE_URL_UNPOOLED.
const directUrl = process.env["DIRECT_URL"] ?? process.env["DATABASE_URL_UNPOOLED"] ?? databaseUrl ?? "";

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: directUrl,
  },
});
