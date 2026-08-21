import crypto from "node:crypto";
import { Redis } from "@upstash/redis";
import { tooManyRequests } from "@/lib/http-errors";
import { logServerEvent } from "@/lib/server-log";

type RateLimitBucket = {
  count: number;
  resetAt: number;
  blockedUntil: number | null;
};

type RateLimitOptions = {
  name: string;
  limit: number;
  windowMs: number;
  blockDurationMs?: number;
  keyParts?: string[];
};

const RATE_LIMIT_STORE_KEY = "__fabsystem_rate_limit_store__";

// In-memory fallback: only reliable on a single long-lived process (local
// dev, tests). On Vercel serverless each instance has its own memory, so
// this alone doesn't stop distributed abuse — Upstash Redis below is the
// real store in production once UPSTASH_REDIS_REST_URL/TOKEN are set.
function getMemoryStore() {
  const globalState = globalThis as typeof globalThis & {
    [RATE_LIMIT_STORE_KEY]?: Map<string, RateLimitBucket>;
  };

  if (!globalState[RATE_LIMIT_STORE_KEY]) {
    globalState[RATE_LIMIT_STORE_KEY] = new Map<string, RateLimitBucket>();
  }

  return globalState[RATE_LIMIT_STORE_KEY];
}

function pruneMemoryStore(now: number) {
  const store = getMemoryStore();
  if (store.size < 500) {
    return;
  }

  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now && (!bucket.blockedUntil || bucket.blockedUntil <= now)) {
      store.delete(key);
    }
  }
}

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  redisClient = url && token ? new Redis({ url, token }) : null;
  return redisClient;
}

export function getClientIp(request: Request) {
  // x-vercel-forwarded-for est posé par l'edge Vercel lui-même et ne peut
  // pas être falsifié par le client (contrairement à x-forwarded-for, que
  // n'importe quel appelant peut définir librement s'il n'y a pas de proxy
  // de confiance devant l'app) — priorité absolue quand présent.
  const vercelIp = request.headers.get("x-vercel-forwarded-for")?.trim();
  if (vercelIp) {
    const first = vercelIp.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  // Hors Vercel (dev local, tests, autre hébergeur derrière un proxy de
  // confiance connu), on retombe sur x-forwarded-for / x-real-ip.
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

const COOLDOWN_STORE_KEY = "__fabsystem_cooldown_store__";

function getCooldownMemoryStore() {
  const globalState = globalThis as typeof globalThis & {
    [COOLDOWN_STORE_KEY]?: Map<string, number>;
  };

  if (!globalState[COOLDOWN_STORE_KEY]) {
    globalState[COOLDOWN_STORE_KEY] = new Map<string, number>();
  }

  return globalState[COOLDOWN_STORE_KEY];
}

// Atomically claims a cooldown slot: returns true only for the caller that
// acquires it first, false for every other caller until it expires. Used to
// debounce alerts (one email/push per limiter per window, not one per hit).
export async function tryAcquireCooldown(key: string, cooldownMs: number) {
  const redis = getRedis();

  if (redis) {
    const result = await redis.set(key, Date.now(), {
      nx: true,
      px: Math.max(cooldownMs, 1000),
    });
    return result === "OK";
  }

  const now = Date.now();
  const store = getCooldownMemoryStore();
  const expiresAt = store.get(key);
  if (expiresAt && expiresAt > now) {
    return false;
  }

  store.set(key, now + cooldownMs);
  return true;
}

export function createRateLimitKeyPart(value: string) {
  // SHA-256 tronqué plutôt qu'un hash maison 32 bits : l'ancien hash rendait
  // triviale la génération d'une valeur (ex. email) qui entre en collision
  // avec la clé d'un tiers, permettant de le bloquer (DoS) depuis la même IP.
  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex")
    .slice(0, 16);
}

type RateLimitCheck =
  | { state: "ok" }
  | { state: "already-blocked"; retryAfterSeconds: number }
  | { state: "newly-blocked"; retryAfterSeconds: number; count: number };

// Redis path: INCR est atomique côté serveur Redis, donc N requêtes
// parallèles ne peuvent plus toutes lire count=1 avant d'écrire — chacune
// obtient un compteur distinct et une seule franchit le seuil. L'ancien
// GET-puis-SET laissait une fenêtre de course exploitable en envoyant des
// requêtes en rafale (ex. brute force login au-delà de la limite affichée).
async function checkRedisRateLimit(
  redis: Redis,
  key: string,
  options: RateLimitOptions,
  now: number
): Promise<RateLimitCheck> {
  const blockedKey = `${key}:blocked`;

  const blockedTtlMs = await redis.pttl(blockedKey);
  if (typeof blockedTtlMs === "number" && blockedTtlMs > 0) {
    return {
      state: "already-blocked",
      retryAfterSeconds: Math.max(1, Math.ceil(blockedTtlMs / 1000)),
    };
  }

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.pexpire(key, Math.max(options.windowMs, 1000));
  }

  if (count <= options.limit) {
    return { state: "ok" };
  }

  const blockDurationMs = options.blockDurationMs ?? options.windowMs;
  await redis.set(blockedKey, now, { px: Math.max(blockDurationMs, 1000) });

  return {
    state: "newly-blocked",
    retryAfterSeconds: Math.max(1, Math.ceil(blockDurationMs / 1000)),
    count,
  };
}

// Memory path (dev/tests, single process): no network round-trip happens
// between the read and the write below, so nothing else can interleave on
// the same event-loop tick — this bucket-swap is effectively atomic without
// needing INCR semantics.
function checkMemoryRateLimit(
  memoryStore: Map<string, RateLimitBucket>,
  key: string,
  options: RateLimitOptions,
  now: number
): RateLimitCheck {
  const existing = memoryStore.get(key) ?? null;

  if (existing?.blockedUntil && existing.blockedUntil > now) {
    return {
      state: "already-blocked",
      retryAfterSeconds: Math.max(1, Math.ceil((existing.blockedUntil - now) / 1000)),
    };
  }

  if (!existing || existing.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + options.windowMs, blockedUntil: null });
    return { state: "ok" };
  }

  const bucket: RateLimitBucket = { ...existing, count: existing.count + 1 };

  if (bucket.count <= options.limit) {
    memoryStore.set(key, bucket);
    return { state: "ok" };
  }

  const blockDurationMs = options.blockDurationMs ?? options.windowMs;
  bucket.blockedUntil = now + blockDurationMs;
  memoryStore.set(key, bucket);

  return {
    state: "newly-blocked",
    retryAfterSeconds: Math.max(1, Math.ceil(blockDurationMs / 1000)),
    count: bucket.count,
  };
}

export async function enforceRateLimit(
  request: Request,
  options: RateLimitOptions
) {
  const now = Date.now();
  const redis = getRedis();

  const ip = getClientIp(request);
  const extraKey = options.keyParts?.filter(Boolean).join(":");
  const key = [options.name, ip, extraKey].filter(Boolean).join(":");

  const result = redis
    ? await checkRedisRateLimit(redis, key, options, now)
    : (() => {
        const memoryStore = getMemoryStore();
        pruneMemoryStore(now);
        return checkMemoryRateLimit(memoryStore, key, options, now);
      })();

  if (result.state === "ok") {
    return;
  }

  if (result.state === "already-blocked") {
    logServerEvent("warn", "rate limit blocked request", {
      limiter: options.name,
      ip,
      retryAfterSeconds: result.retryAfterSeconds,
    });
    throw tooManyRequests("Too many requests", result.retryAfterSeconds, {
      limiter: options.name,
    });
  }

  logServerEvent("warn", "rate limit exceeded", {
    limiter: options.name,
    ip,
    count: result.count,
    retryAfterSeconds: result.retryAfterSeconds,
  });

  const { sendRateLimitAlert } = await import("@/lib/services/security-alerts");
  await sendRateLimitAlert({
    limiter: options.name,
    ip,
    count: result.count,
    retryAfterSeconds: result.retryAfterSeconds,
  });

  throw tooManyRequests("Too many requests", result.retryAfterSeconds, {
    limiter: options.name,
  });
}
