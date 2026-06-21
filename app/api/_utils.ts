import { NextResponse } from "next/server";
import { BODY_LIMITS, RATE_LIMITS } from "@/lib/constants";
import { checkRateLimit, clientKey } from "@/lib/rateLimit";
import { trackFromRequest } from "@/lib/analytics/track";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function bad(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...(extra || {}) }, { status });
}

export type RateTier = keyof typeof RATE_LIMITS;
export type BodyTier = keyof typeof BODY_LIMITS;

export async function enforceRateLimit(req: Request, tier: RateTier = "default") {
  const { limit, windowMs } = RATE_LIMITS[tier];
  const key = `${tier}:${clientKey(req)}`;
  const result = await checkRateLimit(key, limit, windowMs);
  if (!result.ok) {
    trackFromRequest(req, {
      eventType: "rate_limit",
      category: "abuse",
      path: new URL(req.url).pathname,
      method: req.method,
      metadata: { tier, retryAfterSec: result.retryAfterSec },
      severity: "warn",
    });
    return bad("Rate limit exceeded — please wait and try again.", 429, {
      retryAfterSec: result.retryAfterSec,
    });
  }
  return null;
}

export function enforceBodySize(req: Request, tier: BodyTier = "default") {
  const max = BODY_LIMITS[tier];
  const raw = req.headers.get("content-length");
  if (raw) {
    const len = Number(raw);
    if (Number.isFinite(len) && len > max) {
      return bad(`Request body too large (max ${Math.round(max / 1024)} KB).`, 413);
    }
  }
  return null;
}

export async function safeJson<T = unknown>(
  req: Request,
  tier: BodyTier = "default",
): Promise<T> {
  const sizeErr = enforceBodySize(req, tier);
  if (sizeErr) {
    const payload = (await sizeErr.json()) as { error?: string };
    throw new Error(payload.error || "Request body too large");
  }
  try {
    return (await req.json()) as T;
  } catch {
    throw new BadRequestError("Invalid JSON body");
  }
}

/** Thrown for malformed/invalid client input — surfaced to the client as 400. */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

export function handleError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  // Client-input problems: echo the message with the right status. These are
  // safe to surface (they describe the caller's request, not an upstream).
  if (e instanceof BadRequestError || msg === "Invalid JSON body") {
    return bad(msg, 400);
  }
  if (msg.includes("Rate limit") || msg.includes("too large")) {
    const status = msg.includes("too large") ? 413 : 429;
    return bad(msg, status);
  }
  // Everything else may carry raw upstream text/keys — log server-side and
  // return a generic message so we never leak it to the client.
  console.error("[api]", e);
  return bad("Upstream request failed. Please try again.", 502);
}
