import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type DocumentPrefix = "QUO" | "INV";

type SequenceRow = {
  currentValue: number | bigint;
};

function padSequence(value: number) {
  return value.toString().padStart(4, "0");
}

function normalizeSequenceValue(value: number | bigint) {
  return typeof value === "bigint" ? Number(value) : value;
}

function buildSequenceKey(prefix: DocumentPrefix, year: number) {
  return `${prefix}-${year}`;
}

export async function reserveDocumentNumber(
  prefix: DocumentPrefix,
  options?: {
    date?: Date;
    tx?: Prisma.TransactionClient;
  }
) {
  const date = options?.date ?? new Date();
  const year = date.getFullYear();
  const key = buildSequenceKey(prefix, year);
  const client = options?.tx ?? prisma;

  const rows = await client.$queryRawUnsafe<SequenceRow[]>(
    `
      INSERT INTO "DocumentSequence" (
        "key",
        "prefix",
        "year",
        "currentValue",
        "createdAt",
        "updatedAt"
      )
      VALUES ($1, $2, $3, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("key")
      DO UPDATE SET
        "currentValue" = "DocumentSequence"."currentValue" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "currentValue"
    `,
    key,
    prefix,
    year
  );

  const nextValue = rows[0]?.currentValue;

  if (nextValue === undefined) {
    throw new Error("Failed to reserve document number");
  }

  return `${prefix}-${year}-${padSequence(normalizeSequenceValue(nextValue))}`;
}
