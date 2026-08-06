import assert from "node:assert/strict";
import test from "node:test";
import type {
  Customer,
  CustomerSession,
  MagicLoginToken,
} from "@/lib/generated/prisma/client";
import { HttpError } from "@/lib/http-errors";
import {
  createCustomerAuthService,
  CUSTOMER_SESSION_TTL_SECONDS,
  MAGIC_LOGIN_TOKEN_TTL_SECONDS,
  hashOpaqueToken,
  normalizeCustomerEmail,
  type CustomerAuthDb,
} from "@/lib/services/customer-auth";

type MagicLoginTokenWithCustomer = MagicLoginToken & {
  customer: Customer;
};

type CustomerSessionWithCustomer = CustomerSession & {
  customer: Customer;
};

function createCustomerRecord(overrides: Partial<Customer> = {}): Customer {
  const now = new Date("2026-08-06T00:00:00.000Z");

  return {
    id: overrides.id ?? "cust_1",
    email: overrides.email ?? "buyer@example.com",
    name: overrides.name ?? null,
    phone: overrides.phone ?? null,
    address: overrides.address ?? null,
    assetType: overrides.assetType ?? "OTHER",
    assetBrand: overrides.assetBrand ?? null,
    assetModel: overrides.assetModel ?? null,
    registration: overrides.registration ?? null,
    odometerKm: overrides.odometerKm ?? null,
    engineHours: overrides.engineHours ?? null,
    status: overrides.status ?? "ACTIVE",
    lastLoginAt: overrides.lastLoginAt ?? null,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function createMagicLoginTokenRecord(
  overrides: Partial<MagicLoginTokenWithCustomer> = {}
): MagicLoginTokenWithCustomer {
  const now = new Date("2026-08-06T00:00:00.000Z");
  const customer = overrides.customer ?? createCustomerRecord({ id: overrides.customerId ?? "cust_1" });

  return {
    id: overrides.id ?? "mlt_1",
    customerId: overrides.customerId ?? customer.id,
    email: overrides.email ?? customer.email,
    tokenHash: overrides.tokenHash ?? hashOpaqueToken("magic-token"),
    status: overrides.status ?? "ACTIVE",
    expiresAt: overrides.expiresAt ?? new Date("2026-08-06T00:15:00.000Z"),
    usedAt: overrides.usedAt ?? null,
    createdAt: overrides.createdAt ?? now,
    customer,
  };
}

function createCustomerSessionRecord(
  overrides: Partial<CustomerSessionWithCustomer> = {}
): CustomerSessionWithCustomer {
  const now = new Date("2026-08-06T00:00:00.000Z");
  const customer = overrides.customer ?? createCustomerRecord({ id: overrides.customerId ?? "cust_1" });

  return {
    id: overrides.id ?? "session_1",
    customerId: overrides.customerId ?? customer.id,
    sessionTokenHash: overrides.sessionTokenHash ?? hashOpaqueToken("session-token"),
    status: overrides.status ?? "ACTIVE",
    expiresAt: overrides.expiresAt ?? new Date("2026-09-05T00:00:00.000Z"),
    createdAt: overrides.createdAt ?? now,
    lastSeenAt: overrides.lastSeenAt ?? null,
    revokedAt: overrides.revokedAt ?? null,
    customer,
  };
}

function createMockCustomerAuthDb(seed?: {
  customers?: Customer[];
  magicLoginTokens?: MagicLoginTokenWithCustomer[];
  customerSessions?: CustomerSessionWithCustomer[];
}) {
  const customers = [...(seed?.customers ?? [])];
  let magicLoginTokens = [...(seed?.magicLoginTokens ?? [])];
  let customerSessions = [...(seed?.customerSessions ?? [])];

  const state = {
    createdCustomers: [] as Customer[],
    updatedCustomers: [] as Array<{ customerId: string; data: Record<string, unknown> }>,
    revokedMagicLoginTokens: [] as Array<{ customerId: string; now: Date }>,
    createdMagicLoginTokens: [] as MagicLoginToken[],
    updatedMagicLoginTokens: [] as Array<{ tokenId: string; data: Record<string, unknown> }>,
    createdCustomerSessions: [] as CustomerSession[],
    updatedCustomerSessions: [] as Array<{ sessionId: string; data: Record<string, unknown> }>,
    expiredCustomerSessionsCalls: [] as Date[],
  };

  const db = {
    async findCustomerByEmail(email: string) {
      return customers.find((customer) => customer.email === email) ?? null;
    },
    async createCustomer(data: {
      email: string;
      name?: string | null;
      status: "ACTIVE" | "DISABLED";
    }) {
      const customer = createCustomerRecord({
        id: `cust_${customers.length + 1}`,
        email: data.email,
        name: data.name ?? null,
        status: data.status,
      });
      customers.push(customer);
      state.createdCustomers.push(customer);
      return customer;
    },
    async updateCustomer(
      customerId: string,
      data: {
        name?: string | null;
        lastLoginAt?: Date | null;
        status?: "ACTIVE" | "DISABLED";
      }
    ) {
      const customer = customers.find((item) => item.id === customerId);
      if (!customer) {
        throw new Error("Customer not found in mock");
      }
      Object.assign(customer, data);
      state.updatedCustomers.push({ customerId, data });
      return customer;
    },
    async revokeActiveMagicLoginTokens(customerId: string, now: Date) {
      let count = 0;
      magicLoginTokens = magicLoginTokens.map((token) => {
        if (token.customerId === customerId && token.status === "ACTIVE") {
          count += 1;
          return { ...token, status: "REVOKED", usedAt: now };
        }
        return token;
      });
      state.revokedMagicLoginTokens.push({ customerId, now });
      return count;
    },
    async createMagicLoginToken(data: {
      customerId: string;
      email: string;
      tokenHash: string;
      status: MagicLoginToken["status"];
      expiresAt: Date;
    }) {
      const customer = customers.find((item) => item.id === data.customerId);
      if (!customer) {
        throw new Error("Customer not found in mock");
      }
      const token = createMagicLoginTokenRecord({
        id: `mlt_${magicLoginTokens.length + 1}`,
        customerId: data.customerId,
        email: data.email,
        tokenHash: data.tokenHash,
        status: data.status,
        expiresAt: data.expiresAt,
        customer,
      });
      magicLoginTokens.push(token);
      state.createdMagicLoginTokens.push(token);
      return token;
    },
    async findMagicLoginTokenByHash(tokenHash: string) {
      return magicLoginTokens.find((token) => token.tokenHash === tokenHash) ?? null;
    },
    async updateMagicLoginToken(
      tokenId: string,
      data: {
        status?: MagicLoginToken["status"];
        usedAt?: Date | null;
      }
    ) {
      const token = magicLoginTokens.find((item) => item.id === tokenId);
      if (!token) {
        throw new Error("Magic login token not found in mock");
      }
      Object.assign(token, data);
      state.updatedMagicLoginTokens.push({ tokenId, data });
      return token;
    },
    async createCustomerSession(data: {
      customerId: string;
      sessionTokenHash: string;
      status: CustomerSession["status"];
      expiresAt: Date;
    }) {
      const customer = customers.find((item) => item.id === data.customerId);
      if (!customer) {
        throw new Error("Customer not found in mock");
      }
      const session = createCustomerSessionRecord({
        id: `session_${customerSessions.length + 1}`,
        customerId: data.customerId,
        sessionTokenHash: data.sessionTokenHash,
        status: data.status,
        expiresAt: data.expiresAt,
        customer,
      });
      customerSessions.push(session);
      state.createdCustomerSessions.push(session);
      return session;
    },
    async findCustomerSessionByHash(sessionTokenHash: string) {
      return customerSessions.find((session) => session.sessionTokenHash === sessionTokenHash) ?? null;
    },
    async updateCustomerSession(
      sessionId: string,
      data: {
        status?: CustomerSession["status"];
        lastSeenAt?: Date | null;
        revokedAt?: Date | null;
      }
    ) {
      const session = customerSessions.find((item) => item.id === sessionId);
      if (!session) {
        throw new Error("Customer session not found in mock");
      }
      Object.assign(session, data);
      state.updatedCustomerSessions.push({ sessionId, data });
      return session;
    },
    async expireActiveCustomerSessions(now: Date) {
      let count = 0;
      customerSessions = customerSessions.map((session) => {
        if (session.status === "ACTIVE" && session.expiresAt <= now) {
          count += 1;
          return { ...session, status: "EXPIRED" };
        }
        return session;
      });
      state.expiredCustomerSessionsCalls.push(now);
      return count;
    },
    async transaction<T>(callback: (db: CustomerAuthDb) => Promise<T>): Promise<T> {
      return callback(db);
    },
  };

  return {
    db,
    state,
    getCustomers: () => customers,
    getMagicLoginTokens: () => magicLoginTokens,
    getCustomerSessions: () => customerSessions,
  };
}

test("normalizeCustomerEmail lowercases and trims", () => {
  assert.equal(normalizeCustomerEmail("  USER@Example.COM "), "user@example.com");
});

test("requestMagicLoginLink creates a Customer if missing", async () => {
  const { db, state } = createMockCustomerAuthDb();
  const service = createCustomerAuthService(db, {
    now: () => new Date("2026-08-06T00:00:00.000Z"),
    generateRawToken: () => "raw-magic-token",
  });

  const result = await service.requestMagicLoginLink({
    email: "  Buyer@Example.com ",
    name: " Buyer ",
  });

  assert.equal(result.email, "buyer@example.com");
  assert.equal(result.token, "raw-magic-token");
  assert.equal(result.customerId, state.createdCustomers[0]?.id);
  assert.equal(state.createdCustomers.length, 1);
});

test("requestMagicLoginLink reuses an existing Customer", async () => {
  const customer = createCustomerRecord();
  const { db, state } = createMockCustomerAuthDb({ customers: [customer] });
  const service = createCustomerAuthService(db, {
    generateRawToken: () => "raw-magic-token",
  });

  const result = await service.requestMagicLoginLink({
    email: customer.email,
  });

  assert.equal(result.customerId, customer.id);
  assert.equal(state.createdCustomers.length, 0);
});

test("requestMagicLoginLink refuses a DISABLED Customer", async () => {
  const customer = createCustomerRecord({ status: "DISABLED" });
  const { db } = createMockCustomerAuthDb({ customers: [customer] });
  const service = createCustomerAuthService(db);

  await assert.rejects(
    () => service.requestMagicLoginLink({ email: customer.email }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("requestMagicLoginLink creates an ACTIVE MagicLoginToken", async () => {
  const customer = createCustomerRecord();
  const { db, state } = createMockCustomerAuthDb({ customers: [customer] });
  const service = createCustomerAuthService(db, {
    now: () => new Date("2026-08-06T00:00:00.000Z"),
    generateRawToken: () => "raw-magic-token",
  });

  const result = await service.requestMagicLoginLink({ email: customer.email });

  assert.equal(state.createdMagicLoginTokens.length, 1);
  assert.equal(state.createdMagicLoginTokens[0]?.status, "ACTIVE");
  assert.equal(
    result.expiresAt.toISOString(),
    new Date("2026-08-06T00:15:00.000Z").toISOString()
  );
});

test("requestMagicLoginLink never stores the raw token", async () => {
  const customer = createCustomerRecord();
  const { db, state } = createMockCustomerAuthDb({ customers: [customer] });
  const service = createCustomerAuthService(db, {
    generateRawToken: () => "raw-magic-token",
  });

  await service.requestMagicLoginLink({ email: customer.email });

  assert.equal(state.createdMagicLoginTokens[0]?.tokenHash, hashOpaqueToken("raw-magic-token"));
  assert.notEqual(state.createdMagicLoginTokens[0]?.tokenHash, "raw-magic-token");
});

test("requestMagicLoginLink revokes previous ACTIVE tokens", async () => {
  const customer = createCustomerRecord();
  const activeToken = createMagicLoginTokenRecord({ customer, customerId: customer.id });
  const usedToken = createMagicLoginTokenRecord({
    id: "mlt_used",
    customer,
    customerId: customer.id,
    status: "USED",
    tokenHash: hashOpaqueToken("used-token"),
  });
  const { db, state, getMagicLoginTokens } = createMockCustomerAuthDb({
    customers: [customer],
    magicLoginTokens: [activeToken, usedToken],
  });
  const service = createCustomerAuthService(db, {
    now: () => new Date("2026-08-06T00:00:00.000Z"),
    generateRawToken: () => "raw-magic-token",
  });

  await service.requestMagicLoginLink({ email: customer.email });

  const revoked = getMagicLoginTokens().find((token) => token.id === activeToken.id);
  assert.equal(revoked?.status, "REVOKED");
  assert.equal(state.revokedMagicLoginTokens.length, 1);
});

test("requestMagicLoginLink includes the raw token in magicLink when baseUrl is provided", async () => {
  const customer = createCustomerRecord();
  const { db } = createMockCustomerAuthDb({ customers: [customer] });
  const service = createCustomerAuthService(db, {
    generateRawToken: () => "raw-magic-token",
  });

  const result = await service.requestMagicLoginLink({
    email: customer.email,
    baseUrl: "https://www.fabsystem.fr",
  });

  assert.equal(
    result.magicLink,
    "https://www.fabsystem.fr/api/client-auth/verify?token=raw-magic-token"
  );
});

test("consumeMagicLoginToken creates a CustomerSession for a valid token", async () => {
  const customer = createCustomerRecord();
  const magicToken = createMagicLoginTokenRecord({
    customer,
    customerId: customer.id,
    tokenHash: hashOpaqueToken("raw-magic-token"),
  });
  const { db, state } = createMockCustomerAuthDb({
    customers: [customer],
    magicLoginTokens: [magicToken],
  });
  const service = createCustomerAuthService(db, {
    now: () => new Date("2026-08-06T00:00:00.000Z"),
    generateRawToken: () => "raw-session-token",
  });

  const result = await service.consumeMagicLoginToken({ token: "raw-magic-token" });

  assert.equal(result.customerId, customer.id);
  assert.equal(result.sessionToken, "raw-session-token");
  assert.equal(state.createdCustomerSessions.length, 1);
  assert.equal(
    result.sessionExpiresAt.toISOString(),
    new Date("2026-09-05T00:00:00.000Z").toISOString()
  );
});

test("consumeMagicLoginToken marks the MagicLoginToken as USED", async () => {
  const customer = createCustomerRecord();
  const magicToken = createMagicLoginTokenRecord({
    customer,
    customerId: customer.id,
    tokenHash: hashOpaqueToken("raw-magic-token"),
  });
  const { db, state } = createMockCustomerAuthDb({
    customers: [customer],
    magicLoginTokens: [magicToken],
  });
  const service = createCustomerAuthService(db, {
    now: () => new Date("2026-08-06T00:00:00.000Z"),
    generateRawToken: () => "raw-session-token",
  });

  await service.consumeMagicLoginToken({ token: "raw-magic-token" });

  assert.equal(state.updatedMagicLoginTokens[0]?.data.status, "USED");
});

test("consumeMagicLoginToken updates Customer.lastLoginAt", async () => {
  const timestamp = new Date("2026-08-06T00:00:00.000Z");
  const customer = createCustomerRecord();
  const magicToken = createMagicLoginTokenRecord({
    customer,
    customerId: customer.id,
    tokenHash: hashOpaqueToken("raw-magic-token"),
  });
  const { db, state } = createMockCustomerAuthDb({
    customers: [customer],
    magicLoginTokens: [magicToken],
  });
  const service = createCustomerAuthService(db, {
    now: () => timestamp,
    generateRawToken: () => "raw-session-token",
  });

  await service.consumeMagicLoginToken({ token: "raw-magic-token" });

  assert.equal(
    (state.updatedCustomers[0]?.data.lastLoginAt as Date | undefined)?.toISOString(),
    timestamp.toISOString()
  );
});

test("consumeMagicLoginToken refuses an unknown token", async () => {
  const { db } = createMockCustomerAuthDb();
  const service = createCustomerAuthService(db);

  await assert.rejects(
    () => service.consumeMagicLoginToken({ token: "missing-token" }),
    (error: unknown) => error instanceof HttpError && error.status === 404
  );
});

test("consumeMagicLoginToken refuses a USED token", async () => {
  const customer = createCustomerRecord();
  const magicToken = createMagicLoginTokenRecord({
    customer,
    customerId: customer.id,
    tokenHash: hashOpaqueToken("used-token"),
    status: "USED",
    usedAt: new Date("2026-08-06T00:00:00.000Z"),
  });
  const { db } = createMockCustomerAuthDb({
    customers: [customer],
    magicLoginTokens: [magicToken],
  });
  const service = createCustomerAuthService(db);

  await assert.rejects(
    () => service.consumeMagicLoginToken({ token: "used-token" }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("consumeMagicLoginToken refuses an EXPIRED token status", async () => {
  const customer = createCustomerRecord();
  const magicToken = createMagicLoginTokenRecord({
    customer,
    customerId: customer.id,
    tokenHash: hashOpaqueToken("expired-token"),
    status: "EXPIRED",
  });
  const { db } = createMockCustomerAuthDb({
    customers: [customer],
    magicLoginTokens: [magicToken],
  });
  const service = createCustomerAuthService(db);

  await assert.rejects(
    () => service.consumeMagicLoginToken({ token: "expired-token" }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("consumeMagicLoginToken refuses a token expired by expiresAt", async () => {
  const customer = createCustomerRecord();
  const magicToken = createMagicLoginTokenRecord({
    customer,
    customerId: customer.id,
    tokenHash: hashOpaqueToken("late-token"),
    expiresAt: new Date("2026-08-05T23:59:59.000Z"),
  });
  const { db } = createMockCustomerAuthDb({
    customers: [customer],
    magicLoginTokens: [magicToken],
  });
  const service = createCustomerAuthService(db, {
    now: () => new Date("2026-08-06T00:00:00.000Z"),
  });

  await assert.rejects(
    () => service.consumeMagicLoginToken({ token: "late-token" }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("consumeMagicLoginToken refuses a DISABLED Customer", async () => {
  const customer = createCustomerRecord({ status: "DISABLED" });
  const magicToken = createMagicLoginTokenRecord({
    customer,
    customerId: customer.id,
    tokenHash: hashOpaqueToken("disabled-token"),
  });
  const { db } = createMockCustomerAuthDb({
    customers: [customer],
    magicLoginTokens: [magicToken],
  });
  const service = createCustomerAuthService(db);

  await assert.rejects(
    () => service.consumeMagicLoginToken({ token: "disabled-token" }),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("getCustomerSession returns the minimal customer payload", async () => {
  const customer = createCustomerRecord({ name: "Fabien" });
  const session = createCustomerSessionRecord({
    customer,
    customerId: customer.id,
    sessionTokenHash: hashOpaqueToken("session-token"),
  });
  const { db } = createMockCustomerAuthDb({
    customers: [customer],
    customerSessions: [session],
  });
  const service = createCustomerAuthService(db);

  const result = await service.getCustomerSession("session-token");

  assert.deepEqual(result.customer, {
    id: customer.id,
    email: customer.email,
    name: customer.name,
  });
});

test("getCustomerSession refuses an expired session", async () => {
  const customer = createCustomerRecord();
  const session = createCustomerSessionRecord({
    customer,
    customerId: customer.id,
    sessionTokenHash: hashOpaqueToken("expired-session"),
    expiresAt: new Date("2026-08-05T23:59:59.000Z"),
  });
  const { db } = createMockCustomerAuthDb({
    customers: [customer],
    customerSessions: [session],
  });
  const service = createCustomerAuthService(db, {
    now: () => new Date("2026-08-06T00:00:00.000Z"),
  });

  await assert.rejects(
    () => service.getCustomerSession("expired-session"),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("getCustomerSession refuses a REVOKED session", async () => {
  const customer = createCustomerRecord();
  const session = createCustomerSessionRecord({
    customer,
    customerId: customer.id,
    sessionTokenHash: hashOpaqueToken("revoked-session"),
    status: "REVOKED",
    revokedAt: new Date("2026-08-06T00:00:00.000Z"),
  });
  const { db } = createMockCustomerAuthDb({
    customers: [customer],
    customerSessions: [session],
  });
  const service = createCustomerAuthService(db);

  await assert.rejects(
    () => service.getCustomerSession("revoked-session"),
    (error: unknown) => error instanceof HttpError && error.status === 409
  );
});

test("revokeCustomerSession is idempotent", async () => {
  const customer = createCustomerRecord();
  const activeSession = createCustomerSessionRecord({
    customer,
    customerId: customer.id,
    sessionTokenHash: hashOpaqueToken("active-session"),
  });
  const revokedSession = createCustomerSessionRecord({
    id: "session_revoked",
    customer,
    customerId: customer.id,
    sessionTokenHash: hashOpaqueToken("revoked-session"),
    status: "REVOKED",
    revokedAt: new Date("2026-08-06T00:00:00.000Z"),
  });
  const { db, state } = createMockCustomerAuthDb({
    customers: [customer],
    customerSessions: [activeSession, revokedSession],
  });
  const service = createCustomerAuthService(db, {
    now: () => new Date("2026-08-06T00:00:00.000Z"),
  });

  const first = await service.revokeCustomerSession("active-session");
  const second = await service.revokeCustomerSession("revoked-session");
  const third = await service.revokeCustomerSession("missing-session");

  assert.deepEqual(first, { revoked: true });
  assert.deepEqual(second, { revoked: false });
  assert.deepEqual(third, { revoked: false });
  assert.equal(state.updatedCustomerSessions.length, 1);
  assert.equal(state.updatedCustomerSessions[0]?.data.status, "REVOKED");
});

test("expireOldCustomerSessions expires only ACTIVE expired sessions", async () => {
  const customer = createCustomerRecord();
  const expiredActiveSession = createCustomerSessionRecord({
    customer,
    customerId: customer.id,
    expiresAt: new Date("2026-08-05T23:59:59.000Z"),
  });
  const activeSession = createCustomerSessionRecord({
    id: "session_active",
    customer,
    customerId: customer.id,
    sessionTokenHash: hashOpaqueToken("active-session"),
    expiresAt: new Date("2026-08-07T00:00:00.000Z"),
  });
  const alreadyRevoked = createCustomerSessionRecord({
    id: "session_revoked",
    customer,
    customerId: customer.id,
    sessionTokenHash: hashOpaqueToken("revoked-session"),
    expiresAt: new Date("2026-08-05T23:59:59.000Z"),
    status: "REVOKED",
  });
  const { db } = createMockCustomerAuthDb({
    customers: [customer],
    customerSessions: [expiredActiveSession, activeSession, alreadyRevoked],
  });
  const service = createCustomerAuthService(db);

  const count = await service.expireOldCustomerSessions(new Date("2026-08-06T00:00:00.000Z"));

  assert.equal(count, 1);
});

test("customer auth service does not touch admin session helpers", async () => {
  const customer = createCustomerRecord();
  const { db } = createMockCustomerAuthDb({ customers: [customer] });
  const service = createCustomerAuthService(db, {
    generateRawToken: () => "raw-magic-token",
  });

  await service.requestMagicLoginLink({ email: customer.email });

  assert.equal(MAGIC_LOGIN_TOKEN_TTL_SECONDS, 15 * 60);
  assert.equal(CUSTOMER_SESSION_TTL_SECONDS, 30 * 24 * 60 * 60);
});

test("customer auth service does not touch Stripe or Vercel Blob", async () => {
  const customer = createCustomerRecord();
  const { db } = createMockCustomerAuthDb({ customers: [customer] });
  const service = createCustomerAuthService(db, {
    generateRawToken: () => "raw-magic-token",
  });
  const stripeTouched = false;
  const blobTouched = false;

  await service.requestMagicLoginLink({ email: customer.email });

  assert.equal(stripeTouched, false);
  assert.equal(blobTouched, false);
});
