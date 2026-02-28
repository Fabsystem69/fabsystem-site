import "server-only";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export function getPrismaPgAdapter() {
  return require("@prisma/adapter-pg") as typeof import("@prisma/adapter-pg");
}

export function getPgModule() {
  return require("pg") as typeof import("pg");
}
