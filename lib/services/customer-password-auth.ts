import bcrypt from "bcryptjs";
import { badRequest, unauthorized } from "@/lib/http-errors";
import type { OwnershipActor } from "@/lib/ownership";
import {
  generateSecureRawToken,
  getCustomerSessionExpiresAt,
  hashOpaqueToken,
  normalizeCustomerEmail,
} from "@/lib/services/customer-auth";

// v2.1 : email + mot de passe remplace le lien magique comme mode de
// connexion habituel (retour utilisateur : "pas tres conventionnel, les
// gens ne comprennent pas"). Le lien magique existant
// (lib/services/customer-auth.ts) n'est pas supprime : il est reconverti en
// flux "definir/reinitialiser mon mot de passe" (voir
// app/api/client-auth/verify), reutilise tel quel.

const BCRYPT_COST = 12;

export type LoginWithPasswordResult =
  | { status: "invalid_credentials" }
  | { status: "no_password_set" }
  | { status: "ok"; customerId: string; sessionToken: string; sessionExpiresAt: Date };

export async function loginWithPassword(
  email: string,
  password: string
): Promise<LoginWithPasswordResult> {
  const normalizedEmail = normalizeCustomerEmail(email);
  const { prisma } = await import("@/lib/prisma");

  const customer = await prisma.customer.findUnique({ where: { email: normalizedEmail } });

  if (!customer || customer.status !== "ACTIVE") {
    // Meme reponse que "mot de passe incorrect" (anti-enumeration, meme
    // principe que requestMagicLoginLink) : ne jamais reveler si un compte
    // existe pour cet email.
    return { status: "invalid_credentials" };
  }

  if (!customer.passwordHash) {
    return { status: "no_password_set" };
  }

  const passwordMatches = await bcrypt.compare(password, customer.passwordHash);

  if (!passwordMatches) {
    return { status: "invalid_credentials" };
  }

  const now = new Date();
  const rawSessionToken = generateSecureRawToken();
  const sessionExpiresAt = getCustomerSessionExpiresAt(now);

  await prisma.customerSession.create({
    data: {
      customerId: customer.id,
      sessionTokenHash: hashOpaqueToken(rawSessionToken),
      status: "ACTIVE",
      expiresAt: sessionExpiresAt,
    },
  });

  await prisma.customer.update({ where: { id: customer.id }, data: { lastLoginAt: now } });

  return {
    status: "ok",
    customerId: customer.id,
    sessionToken: rawSessionToken,
    sessionExpiresAt,
  };
}

// Appele uniquement depuis /mon-compte/definir-mot-de-passe, qui n'est
// atteignable qu'avec une session deja active (obtenue via le lien magique
// reconverti, voir app/api/client-auth/verify) — jamais de customerId pris
// depuis l'exterieur, meme principe de securite que
// lib/services/customer-profile.ts.
export async function setOwnCustomerPassword(actor: OwnershipActor, newPassword: string) {
  if (actor.role !== "customer") {
    throw unauthorized("A customer session is required");
  }

  if (newPassword.length < 8) {
    throw badRequest("Le mot de passe doit contenir au moins 8 caractères");
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
  const { prisma } = await import("@/lib/prisma");

  await prisma.customer.update({
    where: { id: actor.customerId },
    data: { passwordHash },
  });
}
