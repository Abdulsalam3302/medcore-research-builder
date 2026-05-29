/**
 * Rate limiter with a durable backend (Upstash Redis REST) and an automatic
 * in-memory fallback.
 *
 * - When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, limits are
 *   enforced in Redis with a fixed window, so they hold across all serverless
 *   instances (correct on Vercel).
 * - Otherwise (or if Redis is unreachable) it degrades to a per-process
 *   in-memory window — same behavior as before. Failing to a local limiter is
 *   safer than failing open entirely.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; retryAfterSec: number; resetAt: number };

function memoryCheck(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || now >= existing.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }
  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      resetAt: existing.resetAt,
    };
  }
  existing.count += 1;
  return { ok: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

function redisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return { url: url.replace(/\/+$/, ""), token };
  return null;
}

/** True when a shared, cross-instance rate-limit store is configured. */
export function rateLimitBackend(): "redis" | "memory" {
  return redisConfig() ? "redis" : "memory";
}

/**
 * Fixed-window check in Redis via a single pipelined round trip:
 *   INCR key ; PEXPIRE key window NX ; PTTL key
 * The NX guard sets the expiry only on the first hit of a window.
 */
async function redisCheck(
  cfg: { url: string; token: string },
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const res = await fetch(`${cfg.url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["PEXPIRE", key, String(windowMs), "NX"],
      ["PTTL", key],
    ]),
    signal: AbortSignal.timeout(2000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Upstash ${res.status}`);
  const data = (await res.json()) as Array<{ result?: number; error?: string }>;
  const count = Number(data[0]?.result ?? 0);
  let pttl = Number(data[2]?.result ?? windowMs);
  if (!Number.isFinite(pttl) || pttl < 0) pttl = windowMs;
  const now = Date.now();
  const resetAt = now + pttl;
  if (count > limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil(pttl / 1000)), resetAt };
  }
  return { ok: true, remaining: Math.max(0, limit - count), resetAt };
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const cfg = redisConfig();
  if (cfg) {
    try {
      return await redisCheck(cfg, key, limit, windowMs);
    } catch (e) {
      // Redis unreachable — degrade to the local limiter rather than failing open.
      console.warn("[rateLimit] Redis backend failed, falling back to memory:", e);
    }
  }
  return memoryCheck(key, limit, windowMs);
}

/** Derive a stable client key from proxy-aware headers. */
export function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "local";
}

/** Periodic cleanup so the in-memory map does not grow without bound. */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) {
      if (now >= v.resetAt) buckets.delete(k);
    }
  }, 60_000).unref?.();
}
