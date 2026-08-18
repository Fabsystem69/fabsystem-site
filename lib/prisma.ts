import { PrismaClient } from "@/lib/generated/prisma/client";
import { hasRequiredCommerceDelegates } from "@/lib/prisma-client-guards";
import { getPgModule, getPrismaPgAdapter } from "@/lib/server/prisma-adapter";

const { PrismaPg } = getPrismaPgAdapter();
const { Pool } = getPgModule();

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
  prismaPool?: InstanceType<typeof Pool>;
};

function createPool() {
  const rawConnectionString = process.env.DATABASE_URL;

  if (!rawConnectionString) {
    throw new Error("Missing DATABASE_URL");
  }

  // On passe `ssl` explicitement ci-dessous, donc `sslmode` dans l'URL est
  // redondant — et `pg-connection-string` émet un warning de dépréciation
  // dès qu'il voit `sslmode=require`/`prefer`/`verify-ca` (traités comme
  // alias de `verify-full` jusqu'à sa v3, moins strict qu'aujourd'hui). On
  // le retire de l'URL pour garder le comportement actuel sans le warning,
  // plutôt que d'ajouter `uselibpqcompat=true` qui durcirait la vérification.
  const url = new URL(rawConnectionString);
  const useSsl = url.searchParams.get("sslmode") === "require";
  url.searchParams.delete("sslmode");

  return new Pool({
    connectionString: url.toString(),
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });
}

function createPrismaClient() {
  const pool = globalForPrisma.prismaPool ?? createPool();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prismaPool = pool;
  }

  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const cachedPrisma = hasRequiredCommerceDelegates(globalForPrisma.prisma)
  ? globalForPrisma.prisma
  : undefined;

export const prisma = cachedPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
