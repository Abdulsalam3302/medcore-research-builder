import { createHash } from "crypto";

const DEFAULT_SALT = "medcore-analytics";
const SALT =
  process.env.ANALYTICS_IP_SALT ||
  (process.env.VERCEL_ENV === "production" ? "" : DEFAULT_SALT);

if (process.env.VERCEL_ENV === "production" && !process.env.ANALYTICS_IP_SALT) {
  console.warn("[analytics] ANALYTICS_IP_SALT is not set in production — IP hashing uses a weak default");
}

const EFFECTIVE_SALT = SALT || DEFAULT_SALT;

export function hashIp(ip: string): string {
  return createHash("sha256").update(`${EFFECTIVE_SALT}:${ip}`).digest("hex").slice(0, 16);
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "local";
}

export function geoFromHeaders(req: Request): { country: string | null; region: string | null } {
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-country-code") ||
    null;
  const region =
    req.headers.get("x-vercel-ip-country-region") ||
    req.headers.get("cf-region") ||
    null;
  return { country: country?.toUpperCase() || null, region };
}

export function referrerFromHeaders(req: Request): string | null {
  const ref = req.headers.get("referer") || req.headers.get("referrer");
  if (!ref) return null;
  try {
    const u = new URL(ref);
    if (u.hostname === "localhost" || u.hostname.endsWith(".vercel.app")) {
      return "internal";
    }
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function userAgentFamily(ua: string | null): string | null {
  if (!ua) return null;
  if (/bot|crawl|spider|slurp/i.test(ua)) return "bot";
  if (/Mobile|Android|iPhone/i.test(ua)) return "mobile";
  if (/Chrome/i.test(ua)) return "chrome";
  if (/Safari/i.test(ua)) return "safari";
  if (/Firefox/i.test(ua)) return "firefox";
  if (/Edge/i.test(ua)) return "edge";
  return "other";
}

export function sessionIdFromRequest(req: Request): string {
  const ip = clientIp(req);
  const ua = req.headers.get("user-agent") || "";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${EFFECTIVE_SALT}:sess:${ip}:${ua}:${day}`).digest("hex").slice(0, 20);
}

export { isInternalAnalyticsRequest, shouldTrackPath } from "./parse-edge";
