import type { NextRequest } from "next/server";
import { shouldTrackPath } from "./parse-edge";

/** Edge-safe fire-and-forget beacon to the Node collect route. */
export function beaconAnalytics(
  request: NextRequest,
  body: Record<string, unknown>,
): void {
  const secret = process.env.ANALYTICS_INTERNAL_SECRET;
  if (!secret) return;

  const url = new URL("/api/analytics/collect", request.url);
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-analytics-internal": secret,
    "x-forwarded-for": request.headers.get("x-forwarded-for") || "",
    "x-real-ip": request.headers.get("x-real-ip") || "",
    "user-agent": request.headers.get("user-agent") || "",
  };
  const country = request.headers.get("x-vercel-ip-country");
  if (country) headers["x-vercel-ip-country"] = country;
  const region = request.headers.get("x-vercel-ip-country-region");
  if (region) headers["x-vercel-ip-country-region"] = region;
  const referer = request.headers.get("referer");
  if (referer) headers["referer"] = referer;

  fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }).catch(() => {
    /* non-blocking */
  });
}

export function trackRequestInMiddleware(request: NextRequest): void {
  const { pathname } = request.nextUrl;
  if (!shouldTrackPath(pathname)) return;

  if (pathname.startsWith("/api/")) {
    beaconAnalytics(request, {
      eventType: "api_call",
      category: "usage",
      path: pathname,
      method: request.method,
    });
    return;
  }

  beaconAnalytics(request, {
    eventType: "page_view",
    category: "visit",
    path: pathname,
    method: request.method,
  });
}
