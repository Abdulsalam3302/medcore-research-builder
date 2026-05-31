import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Content-Security-Policy. 'unsafe-inline' is required for Next's inline
 * hydration runtime (a nonce pipeline would be the stricter option); the policy
 * still blocks external/injected scripts, framing, plugins, and base-tag
 * hijacking. Plotly is loaded from its CDN for charts. connect-src covers the
 * same-origin API plus Supabase (the only direct client egress).
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.plot.ly",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.plot.ly",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": CSP,
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "on",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/sign-in" || pathname === "/login") {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  let response = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", "no-store, max-age=0");
  }

  response = await updateSession(request, response);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.svg).*)"],
};
