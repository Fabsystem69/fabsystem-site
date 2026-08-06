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
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL");
  }

  return new Pool({
    connectionString,
    ssl: connectionString.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
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
