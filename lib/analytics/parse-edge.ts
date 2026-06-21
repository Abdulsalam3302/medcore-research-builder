export function shouldTrackPath(pathname: string): boolean {
  if (pathname.startsWith("/_next") || pathname.startsWith("/api/analytics")) return false;
  if (pathname.match(/\.(ico|svg|png|jpg|jpeg|webp|woff2?)$/)) return false;
  if (pathname.startsWith("/admin/observability")) return false;
  return true;
}

export function isInternalAnalyticsRequest(req: Request): boolean {
  const secret = process.env.ANALYTICS_INTERNAL_SECRET;
  if (!secret) return false;
  return req.headers.get("x-analytics-internal") === secret;
}
