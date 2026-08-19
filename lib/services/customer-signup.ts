import bcrypt from "bcryptjs";
import { badRequest } from "@/lib/http-errors";
import {
  generateSecureRawToken,
  getCustomerSessionExpiresAt,
  hashOpaqueToken,
  normalizeCustomerEmail,
} from "@/lib/services/customer-auth";

// v2.1 : inscription libre depuis l'éditeur de schéma (retour utilisateur :
// "le plus simple serait une invite à créer un compte tout de suite" — et
// "ça évite les retours de gens qui ont un code promo mais ça ne marche
// pas car ils n'ont pas de compte", une dizaine de signalements en ce
// sens). Choix produit assumé, différent de la décision anti-énumération
// du formulaire de connexion (MASTER-00 §6, voir customer-auth.ts) : ici
// l'utilisateur affirme explicitement vouloir créer un compte, donc révéler
// "cet email a déjà un compte" est le comportement standard attendu d'un
// formulaire d'inscription, pas une fuite d'information.

const BCRYPT_COST = 12;

export type SignUpCustomerResult =
  | { status: "email_taken" }
  | { status: "ok"; customerId: string; sessionToken: string; sessionExpiresAt: Date };

export async function signUpCustomer(input: {
  email: string;
  password: string;
  // Retour utilisateur : "on va obliger à mettre nom et prénom à
  // l'inscription pour m'aider dans les recherches" — jusqu'ici `name`
  // (optionnel, jamais rempli en pratique) laissait des comptes sans
  // identité exploitable pour retrouver un client (cf. recherche
  // jcbp@orange.fr sans nom lors de l'audit rate-limit du 19/08).
  // Obligatoires désormais, mêmes règles que la fiche profil
  // (customer-profile-payload.ts) pour rester cohérent partout.
  firstName: string;
  lastName: string;
  // RGPD : choix produit assumé — la case newsletter/offres est
  // obligatoire pour créer un compte depuis ce formulaire (retour
  // utilisateur explicite : "si pas coché pas de validation possible").
  // Contrôlé aussi côté serveur (pas seulement `required` côté client),
  // jamais présumé `true` par défaut.
  marketingConsent: boolean;
}): Promise<SignUpCustomerResult> {
  const normalizedEmail = normalizeCustomerEmail(input.email);
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();

  if (input.password.length < 8) {
    throw badRequest("Le mot de passe doit contenir au moins 8 caractères");
  }

  if (!firstName || !lastName) {
    throw badRequest("Le prénom et le nom sont requis pour créer un compte");
  }

  if (!input.marketingConsent) {
    throw badRequest("L'acceptation de recevoir des informations par email est requise pour créer un compte");
  }

  const { prisma } = await import("@/lib/prisma");

  const existing = await prisma.customer.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return { status: "email_taken" };
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const now = new Date();

  const customer = await prisma.customer.create({
    data: {
      email: normalizedEmail,
      firstName,
      lastName,
      // Synchronisé pour le reste du code existant qui lit encore `name`
      // (commandes, emails, dashboard admin) — même convention que
      // normalizeCustomerProfileData.
      name: `${firstName} ${lastName}`.trim(),
      status: "ACTIVE",
      origin: "SIGNUP",
      passwordHash,
      marketingConsent: true,
      marketingConsentAt: now,
    },
  });

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
