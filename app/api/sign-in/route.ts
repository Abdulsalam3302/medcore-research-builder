import { NextResponse } from "next/server";

/** Legacy entry — redirect to SPA auth page (never 404). */
export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/auth", request.url));
}
