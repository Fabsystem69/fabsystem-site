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

  const vercelIp = request.headers.get("x-vercel-forwarded-for")?.trim();
  if (vercelIp) {
    return vercelIp;
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
  let hash = 0;

  for (const char of value.trim().toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}

async function readBucket(
  redis: Redis | null,
  memoryStore: Map<string, RateLimitBucket>,
  key: string
): Promise<RateLimitBucket | null> {
  if (redis) {
    const value = await redis.get<RateLimitBucket>(key);
    return value ?? null;
  }

  return memoryStore.get(key) ?? null;
}

async function writeBucket(
  redis: Redis | null,
  memoryStore: Map<string, RateLimitBucket>,
  key: string,
  bucket: RateLimitBucket,
  ttlMs: number
) {
  if (redis) {
    await redis.set(key, bucket, { px: Math.max(ttlMs, 1000) });
    return;
  }

  memoryStore.set(key, bucket);
}

export async function enforceRateLimit(
  request: Request,
  options: RateLimitOptions
) {
  const now = Date.now();
  const redis = getRedis();
  const memoryStore = getMemoryStore();
  if (!redis) {
    pruneMemoryStore(now);
  }

  const ip = getClientIp(request);
  const extraKey = options.keyParts?.filter(Boolean).join(":");
  const key = [options.name, ip, extraKey].filter(Boolean).join(":");
  const existing = await readBucket(redis, memoryStore, key);

  if (existing?.blockedUntil && existing.blockedUntil > now) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.blockedUntil - now) / 1000)
    );
    logServerEvent("warn", "rate limit blocked request", {
      limiter: options.name,
      ip,
      retryAfterSeconds,
    });
    throw tooManyRequests("Too many requests", retryAfterSeconds, {
      limiter: options.name,
    });
  }

  if (!existing || existing.resetAt <= now) {
    await writeBucket(
      redis,
      memoryStore,
      key,
      { count: 1, resetAt: now + options.windowMs, blockedUntil: null },
      options.windowMs
    );
    return;
  }

  const bucket: RateLimitBucket = { ...existing, count: existing.count + 1 };

  if (bucket.count <= options.limit) {
    await writeBucket(redis, memoryStore, key, bucket, bucket.resetAt - now);
    return;
  }

  const blockDurationMs = options.blockDurationMs ?? options.windowMs;
  bucket.blockedUntil = now + blockDurationMs;
  await writeBucket(redis, memoryStore, key, bucket, blockDurationMs);

  const retryAfterSeconds = Math.max(1, Math.ceil(blockDurationMs / 1000));
  logServerEvent("warn", "rate limit exceeded", {
    limiter: options.name,
    ip,
    count: bucket.count,
    retryAfterSeconds,
  });

  const { sendRateLimitAlert } = await import("@/lib/services/security-alerts");
  await sendRateLimitAlert({
    limiter: options.name,
    ip,
    count: bucket.count,
    retryAfterSeconds,
  });

  throw tooManyRequests("Too many requests", retryAfterSeconds, {
    limiter: options.name,
  });
}
