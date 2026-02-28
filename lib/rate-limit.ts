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
};

const RATE_LIMIT_STORE_KEY = "__fabsystem_rate_limit_store__";

function getStore() {
  const globalState = globalThis as typeof globalThis & {
    [RATE_LIMIT_STORE_KEY]?: Map<string, RateLimitBucket>;
  };

  if (!globalState[RATE_LIMIT_STORE_KEY]) {
    globalState[RATE_LIMIT_STORE_KEY] = new Map<string, RateLimitBucket>();
  }

  return globalState[RATE_LIMIT_STORE_KEY];
}

function pruneStore(now: number) {
  const store = getStore();
  if (store.size < 500) {
    return;
  }

  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now && (!bucket.blockedUntil || bucket.blockedUntil <= now)) {
      store.delete(key);
    }
  }
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

export function enforceRateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  pruneStore(now);

  const ip = getClientIp(request);
  const key = `${options.name}:${ip}`;
  const store = getStore();
  const existing = store.get(key);

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
    store.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
      blockedUntil: null,
    });
    return;
  }

  existing.count += 1;

  if (existing.count <= options.limit) {
    store.set(key, existing);
    return;
  }

  const blockDurationMs = options.blockDurationMs ?? options.windowMs;
  existing.blockedUntil = now + blockDurationMs;
  store.set(key, existing);

  const retryAfterSeconds = Math.max(1, Math.ceil(blockDurationMs / 1000));
  logServerEvent("warn", "rate limit exceeded", {
    limiter: options.name,
    ip,
    count: existing.count,
    retryAfterSeconds,
  });

  throw tooManyRequests("Too many requests", retryAfterSeconds, {
    limiter: options.name,
  });
}
