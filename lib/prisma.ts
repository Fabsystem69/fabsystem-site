import { createRequire } from "node:module";
import { PrismaClient } from "@/lib/generated/prisma/client";

const require = createRequire(import.meta.url);
const { PrismaPg } = require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
const { Pool } = require("pg") as typeof import("pg");

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

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
