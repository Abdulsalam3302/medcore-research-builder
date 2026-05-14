import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function bad(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...(extra || {}) }, { status });
}

export async function safeJson<T = unknown>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

export function handleError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  // Surface upstream API errors transparently for debugging, but don't leak keys.
  return bad(msg, 500);
}
