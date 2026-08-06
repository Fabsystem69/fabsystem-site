import crypto from "node:crypto";
import { z } from "zod";
import type {
  Customer,
  CustomerSession,
  CustomerSessionStatus,
  MagicLoginToken,
  MagicLoginTokenStatus,
  PrismaClient,
} from "@/lib/generated/prisma/client";
import { conflict, notFound } from "@/lib/http-errors";

type PrismaClientLike = PrismaClient;

const requestMagicLoginLinkInputSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).optional(),
  baseUrl: z.string().trim().url().optional(),
});

const consumeMagicLoginTokenInputSchema = z.object({
  token: z.string().trim().min(1),
});

const emailSchema = z.string().trim().email();
const tokenSchema = z.string().trim().min(1);

const MAGIC_LOGIN_TOKEN_TTL_MS = 15 * 60 * 1000;
const CUSTOMER_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RAW_TOKEN_BYTES = 32;

type CustomerSessionWithCustomer = CustomerSession & {
  customer: Customer;
};

type MagicLoginTokenWithCustomer = MagicLoginToken & {
  customer: Customer;
};

type CustomerAuthDb = {
  findCustomerByEmail(email: string): Promise<Customer | null>;
  createCustomer(data: {
    email: string;
    name?: string | null;
    status: "ACTIVE" | "DISABLED";
  }): Promise<Customer>;
  updateCustomer(
    customerId: string,
    data: {
      name?: string | null;
      lastLoginAt?: Date | null;
      status?: "ACTIVE" | "DISABLED";
    }
  ): Promise<Customer>;
  revokeActiveMagicLoginTokens(customerId: string, now: Date): Promise<number>;
  createMagicLoginToken(data: {
    customerId: string;
    email: string;
    tokenHash: string;
    status: MagicLoginTokenStatus;
    expiresAt: Date;
  }): Promise<MagicLoginToken>;
  findMagicLoginTokenByHash(tokenHash: string): Promise<MagicLoginTokenWithCustomer | null>;
  updateMagicLoginToken(
    tokenId: string,
    data: {
      status?: MagicLoginTokenStatus;
      usedAt?: Date | null;
    }
  ): Promise<MagicLoginToken>;
  createCustomerSession(data: {
    customerId: string;
    sessionTokenHash: string;
    status: CustomerSessionStatus;
    expiresAt: Date;
  }): Promise<CustomerSession>;
  findCustomerSessionByHash(
    sessionTokenHash: string
  ): Promise<CustomerSessionWithCustomer | null>;
  updateCustomerSession(
    sessionId: string,
    data: {
      status?: CustomerSessionStatus;
      lastSeenAt?: Date | null;
      revokedAt?: Date | null;
    }
  ): Promise<CustomerSession>;
  expireActiveCustomerSessions(now: Date): Promise<number>;
  transaction<T>(callback: (db: CustomerAuthDb) => Promise<T>): Promise<T>;
};

type CustomerAuthDeps = {
  now?: () => Date;
  generateRawToken?: () => string;
};

export type RequestMagicLoginLinkResult = {
  customerId: string;
  email: string;
  token: string;
  expiresAt: Date;
  magicLink?: string;
};

export type ConsumeMagicLoginTokenResult = {
  customerId: string;
  sessionToken: string;
  sessionExpiresAt: Date;
};

export type CustomerSessionLookupResult = {
  customer: {
    id: string;
    email: string;
    name: string | null;
  };
  expiresAt: Date;
};

function assertActiveCustomer(customer: Customer | null) {
  if (!customer) {
    throw notFound("Customer not found");
  }

  if (customer.status !== "ACTIVE") {
    throw conflict("Customer is not allowed to authenticate");
  }

  return customer;
}

function assertActiveMagicLoginToken(token: MagicLoginTokenWithCustomer | null, now: Date) {
  if (!token) {
    throw notFound("Magic login token not found");
  }

  if (token.status !== "ACTIVE") {
    throw conflict("Magic login token is not active");
  }

  if (token.expiresAt <= now) {
    throw conflict("Magic login token has expired");
  }

  if (token.customer.status !== "ACTIVE") {
    throw conflict("Customer is not allowed to authenticate");
  }

  return token;
}

function assertActiveCustomerSession(session: CustomerSessionWithCustomer | null, now: Date) {
  if (!session) {
    throw notFound("Customer session not found");
  }

  if (session.status !== "ACTIVE") {
    throw conflict("Customer session is not active");
  }

  if (session.expiresAt <= now) {
    throw conflict("Customer session has expired");
  }

  if (session.customer.status !== "ACTIVE") {
    throw conflict("Customer is not allowed to authenticate");
  }

  return session;
}

export function normalizeCustomerEmail(email: string) {
  return emailSchema.parse(email).trim().toLowerCase();
}

export function normalizeOptionalCustomerName(name: string | undefined) {
  const normalized = name?.trim();
  return normalized ? normalized : undefined;
}

export function generateSecureRawToken() {
  return crypto.randomBytes(RAW_TOKEN_BYTES).toString("base64url");
}

export function hashOpaqueToken(token: string) {
  const normalizedToken = tokenSchema.parse(token);
  return crypto.createHash("sha256").update(normalizedToken).digest("hex");
}

export function getMagicLoginTokenExpiresAt(now: Date) {
  return new Date(now.getTime() + MAGIC_LOGIN_TOKEN_TTL_MS);
}

export function getCustomerSessionExpiresAt(now: Date) {
  return new Date(now.getTime() + CUSTOMER_SESSION_TTL_MS);
}

function buildMagicLink(baseUrl: string | undefined, rawToken: string) {
  const normalizedBaseUrl = baseUrl?.trim();

  if (!normalizedBaseUrl) {
    return undefined;
  }

  const url = new URL("/api/client-auth/verify", normalizedBaseUrl);
  url.searchParams.set("token", rawToken);
  return url.toString();
}

function createPrismaCustomerAuthDb(client: PrismaClientLike): CustomerAuthDb {
  const buildScopedDb = (currentClient: PrismaClientLike): CustomerAuthDb => ({
    async findCustomerByEmail(email) {
      return currentClient.customer.findUnique({
        where: { email },
      });
    },
    async createCustomer(data) {
      return currentClient.customer.create({
        data,
      });
    },
    async updateCustomer(customerId, data) {
      return currentClient.customer.update({
        where: { id: customerId },
        data,
      });
    },
    async revokeActiveMagicLoginTokens(customerId, now) {
      const result = await currentClient.magicLoginToken.updateMany({
        where: {
          customerId,
          status: "ACTIVE",
        },
        data: {
          status: "REVOKED",
          usedAt: now,
        },
      });

      return result.count;
    },
    async createMagicLoginToken(data) {
      return currentClient.magicLoginToken.create({
        data,
      });
    },
    async findMagicLoginTokenByHash(tokenHash) {
      return currentClient.magicLoginToken.findUnique({
        where: { tokenHash },
        include: {
          customer: true,
        },
      }) as Promise<MagicLoginTokenWithCustomer | null>;
    },
    async updateMagicLoginToken(tokenId, data) {
      return currentClient.magicLoginToken.update({
        where: { id: tokenId },
        data,
      });
    },
    async createCustomerSession(data) {
      return currentClient.customerSession.create({
        data,
      });
    },
    async findCustomerSessionByHash(sessionTokenHash) {
      return currentClient.customerSession.findUnique({
        where: { sessionTokenHash },
        include: {
          customer: true,
        },
      }) as Promise<CustomerSessionWithCustomer | null>;
    },
    async updateCustomerSession(sessionId, data) {
      return currentClient.customerSession.update({
        where: { id: sessionId },
        data,
      });
    },
    async expireActiveCustomerSessions(now) {
      const result = await currentClient.customerSession.updateMany({
        where: {
          status: "ACTIVE",
          expiresAt: {
            lte: now,
          },
        },
        data: {
          status: "EXPIRED",
        },
      });

      return result.count;
    },
    async transaction<T>(callback: (db: CustomerAuthDb) => Promise<T>) {
      return currentClient.$transaction(async (tx) => {
        const transactionDb = createPrismaCustomerAuthDb(tx as PrismaClientLike);
        return callback(transactionDb);
      });
    },
  });

  return buildScopedDb(client);
}

async function getDefaultCustomerAuthService() {
  const { prisma } = await import("@/lib/prisma");
  return createCustomerAuthService(createPrismaCustomerAuthDb(prisma));
}

export function createCustomerAuthService(db: CustomerAuthDb, deps?: CustomerAuthDeps) {
  const now = deps?.now ?? (() => new Date());
  const generateRawToken = deps?.generateRawToken ?? generateSecureRawToken;

  return {
    async requestMagicLoginLink(
      input: z.infer<typeof requestMagicLoginLinkInputSchema>
    ): Promise<RequestMagicLoginLinkResult> {
      const parsed = requestMagicLoginLinkInputSchema.parse(input);
      const normalizedEmail = normalizeCustomerEmail(parsed.email);
      const normalizedName = normalizeOptionalCustomerName(parsed.name);
      const currentTime = now();

      return db.transaction(async (tx) => {
        let customer = await tx.findCustomerByEmail(normalizedEmail);

        if (customer) {
          assertActiveCustomer(customer);

          if (!customer.name && normalizedName) {
            customer = await tx.updateCustomer(customer.id, {
              name: normalizedName,
            });
          }
        } else {
          customer = await tx.createCustomer({
            email: normalizedEmail,
            name: normalizedName ?? null,
            status: "ACTIVE",
          });
        }

        await tx.revokeActiveMagicLoginTokens(customer.id, currentTime);

        const rawToken = generateRawToken();
        const tokenHash = hashOpaqueToken(rawToken);
        const expiresAt = getMagicLoginTokenExpiresAt(currentTime);

        await tx.createMagicLoginToken({
          customerId: customer.id,
          email: normalizedEmail,
          tokenHash,
          status: "ACTIVE",
          expiresAt,
        });

        return {
          customerId: customer.id,
          email: normalizedEmail,
          token: rawToken,
          expiresAt,
          magicLink: buildMagicLink(parsed.baseUrl, rawToken),
        };
      });
    },

    async consumeMagicLoginToken(
      input: z.infer<typeof consumeMagicLoginTokenInputSchema>
    ): Promise<ConsumeMagicLoginTokenResult> {
      const parsed = consumeMagicLoginTokenInputSchema.parse(input);
      const currentTime = now();
      const tokenHash = hashOpaqueToken(parsed.token);

      return db.transaction(async (tx) => {
        const magicLoginToken = assertActiveMagicLoginToken(
          await tx.findMagicLoginTokenByHash(tokenHash),
          currentTime
        );

        const rawSessionToken = generateRawToken();
        const sessionTokenHash = hashOpaqueToken(rawSessionToken);
        const sessionExpiresAt = getCustomerSessionExpiresAt(currentTime);

        await tx.updateMagicLoginToken(magicLoginToken.id, {
          status: "USED",
          usedAt: currentTime,
        });

        await tx.createCustomerSession({
          customerId: magicLoginToken.customerId,
          sessionTokenHash,
          status: "ACTIVE",
          expiresAt: sessionExpiresAt,
        });

        await tx.updateCustomer(magicLoginToken.customerId, {
          lastLoginAt: currentTime,
        });

        return {
          customerId: magicLoginToken.customerId,
          sessionToken: rawSessionToken,
          sessionExpiresAt,
        };
      });
    },

    async getCustomerSession(sessionToken: string): Promise<CustomerSessionLookupResult> {
      const normalizedToken = tokenSchema.parse(sessionToken);
      const currentTime = now();
      const session = assertActiveCustomerSession(
        await db.findCustomerSessionByHash(hashOpaqueToken(normalizedToken)),
        currentTime
      );

      await db.updateCustomerSession(session.id, {
        lastSeenAt: currentTime,
      });

      return {
        customer: {
          id: session.customer.id,
          email: session.customer.email,
          name: session.customer.name,
        },
        expiresAt: session.expiresAt,
      };
    },

    async revokeCustomerSession(sessionToken: string) {
      const normalizedToken = tokenSchema.parse(sessionToken);
      const session = await db.findCustomerSessionByHash(hashOpaqueToken(normalizedToken));

      if (!session || session.status === "REVOKED") {
        return { revoked: false };
      }

      await db.updateCustomerSession(session.id, {
        status: "REVOKED",
        revokedAt: now(),
      });

      return { revoked: true };
    },

    async expireOldCustomerSessions(referenceDate?: Date) {
      const effectiveNow = referenceDate ?? now();
      return db.expireActiveCustomerSessions(effectiveNow);
    },
  };
}

export async function requestMagicLoginLink(
  input: z.infer<typeof requestMagicLoginLinkInputSchema>
) {
  const service = await getDefaultCustomerAuthService();
  return service.requestMagicLoginLink(input);
}

export async function consumeMagicLoginToken(
  input: z.infer<typeof consumeMagicLoginTokenInputSchema>
) {
  const service = await getDefaultCustomerAuthService();
  return service.consumeMagicLoginToken(input);
}

export async function getCustomerSession(sessionToken: string) {
  const service = await getDefaultCustomerAuthService();
  return service.getCustomerSession(sessionToken);
}

export async function revokeCustomerSession(sessionToken: string) {
  const service = await getDefaultCustomerAuthService();
  return service.revokeCustomerSession(sessionToken);
}

export async function expireOldCustomerSessions(referenceDate?: Date) {
  const service = await getDefaultCustomerAuthService();
  return service.expireOldCustomerSessions(referenceDate);
}

export const MAGIC_LOGIN_TOKEN_TTL_SECONDS = MAGIC_LOGIN_TOKEN_TTL_MS / 1000;
export const CUSTOMER_SESSION_TTL_SECONDS = CUSTOMER_SESSION_TTL_MS / 1000;
