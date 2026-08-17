import { badRequest, notFound } from "@/lib/http-errors";
import { grantAccountWideTrial, SCHEMA_EDITOR_UNLIMITED_CAPABILITY } from "@/lib/services/schema-unlock";

// v2.1 : code promo communautaire (distribue sur les groupes/reseaux) —
// accorde une capacite CUSTOMER (tous les projets du compte) pendant
// TrialAccessCode.durationDays, sans paiement. Compte deja requis pour
// saisir un code (voir requireCustomerActor dans la route), meme raison que
// le checkout express : une CustomerCapability est toujours rattachee a un
// customerId, jamais a un email seul.
function normalizeTrialCode(code: string) {
  return code.trim().toUpperCase();
}

export type RedeemTrialAccessCodeResult =
  | { status: "redeemed"; expiresAt: Date | null }
  | { status: "already_redeemed" }
  | { status: "invalid" }
  | { status: "exhausted" };

export async function redeemTrialAccessCode(
  customerId: string,
  rawCode: string
): Promise<RedeemTrialAccessCodeResult> {
  const code = normalizeTrialCode(rawCode);

  if (!code) {
    throw badRequest("Code is required");
  }

  const { prisma } = await import("@/lib/prisma");

  const record = await prisma.trialAccessCode.findUnique({ where: { code } });
  const now = new Date();

  if (
    !record ||
    record.status !== "ACTIVE" ||
    (record.startsAt && record.startsAt > now) ||
    (record.expiresAt && record.expiresAt <= now)
  ) {
    return { status: "invalid" };
  }

  const existingRedemption = await prisma.trialAccessCodeRedemption.findUnique({
    where: { codeId_customerId: { codeId: record.id, customerId } },
  });

  if (existingRedemption) {
    return { status: "already_redeemed" };
  }

  // Meme pattern que incrementDiscountCodeRedeemedCountIfCapacity
  // (lib/services/order.ts) : WHERE redeemedCount < maxRedemptions rend
  // l'incrementation atomique face a deux redemptions concurrentes du meme
  // code, sans verrou explicite.
  const claimed = await prisma.trialAccessCode.updateMany({
    where: { id: record.id, redeemedCount: { lt: record.maxRedemptions } },
    data: { redeemedCount: { increment: 1 } },
  });

  if (claimed.count === 0) {
    return { status: "exhausted" };
  }

  try {
    await prisma.trialAccessCodeRedemption.create({
      data: { codeId: record.id, customerId },
    });
  } catch {
    // Course exactement concurrente sur la contrainte unique
    // (codeId, customerId) : compense l'incrementation, traite comme deja
    // redeemed plutot que de laisser le compteur desynchronise.
    await prisma.trialAccessCode.update({
      where: { id: record.id },
      data: { redeemedCount: { decrement: 1 } },
    });
    return { status: "already_redeemed" };
  }

  const capability = await grantAccountWideTrial({
    customerId,
    source: `trial-code:${record.id}`,
    durationDays: record.durationDays,
    now,
  });

  return { status: "redeemed", expiresAt: capability.expiresAt };
}

function generateRandomSuffix() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export type CreateTrialAccessCodeInput = {
  code?: string;
  durationDays: number;
  maxRedemptions?: number;
  expiresAt?: Date | null;
  reason?: string | null;
};

export async function createTrialAccessCode(input: CreateTrialAccessCodeInput) {
  if (input.durationDays <= 0) {
    throw badRequest("durationDays must be a positive integer");
  }

  const { prisma } = await import("@/lib/prisma");
  const code = normalizeTrialCode(input.code?.trim() || `TRIAL-${generateRandomSuffix()}`);

  return prisma.trialAccessCode.create({
    data: {
      code,
      capability: SCHEMA_EDITOR_UNLIMITED_CAPABILITY,
      durationDays: input.durationDays,
      maxRedemptions: input.maxRedemptions ?? 1,
      expiresAt: input.expiresAt ?? null,
      reason: input.reason?.trim() || null,
      status: "ACTIVE",
    },
  });
}

export async function listTrialAccessCodes() {
  const { prisma } = await import("@/lib/prisma");
  return prisma.trialAccessCode.findMany({ orderBy: { createdAt: "desc" } });
}

async function setTrialAccessCodeStatus(id: string, status: "ACTIVE" | "REVOKED") {
  const { prisma } = await import("@/lib/prisma");
  const existing = await prisma.trialAccessCode.findUnique({ where: { id } });

  if (!existing) {
    throw notFound("Trial access code not found");
  }

  return prisma.trialAccessCode.update({ where: { id }, data: { status } });
}

export async function revokeTrialAccessCode(id: string) {
  return setTrialAccessCodeStatus(id, "REVOKED");
}

export async function activateTrialAccessCode(id: string) {
  return setTrialAccessCodeStatus(id, "ACTIVE");
}
