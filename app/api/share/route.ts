import { bad, enforceRateLimit, handleError, ok, safeJson } from "../_utils";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth";
import type { ProjectState } from "@/lib/types";

export const runtime = "nodejs";
// Auth/cookies + JSONB writes; never statically prerender or the POST handler
// is dropped (405).
export const dynamic = "force-dynamic";

const SHARE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Generate an unguessable, URL-safe token (~32 hex chars). */
function makeToken(): string {
  return (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");
}

/** Derive the public origin for building absolute share URLs. */
function originFromRequest(req: Request): string {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host");
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL || "";
}

/** Create a server-stored, tokenized share link (anonymous-friendly). */
export async function POST(req: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return bad("Server-stored sharing is unavailable — falling back to inline link.", 503);
    }
    const limited = await enforceRateLimit(req, "default");
    if (limited) return limited;

    const body = await safeJson<{ state?: ProjectState }>(req, "references");
    if (!body?.state) return bad("state is required");
    if (
      typeof body.state !== "object" ||
      body.state === null ||
      Array.isArray(body.state)
    ) {
      return bad("state must be a plain object");
    }

    // Sharing is anonymous; attribute to a user only if one is signed in.
    const user = await getAppUser();
    const token = makeToken();
    const expiresAt = new Date(Date.now() + SHARE_TTL_MS).toISOString();

    const supabase = createClient();
    const { error } = await supabase.from("shared_projects").insert({
      token,
      state: body.state,
      expires_at: expiresAt,
      ...(user ? { created_by: user.id } : {}),
    });
    if (error) throw error;

    const origin = originFromRequest(req);
    const url = `${origin}/?share=${token}`;
    return ok({ token, url, expiresAt });
  } catch (e) {
    return handleError(e);
  }
}

/** Resolve a share token back into a project state. */
export async function GET(req: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return bad("Server-stored sharing is unavailable.", 503);
    }
    const limited = await enforceRateLimit(req, "search");
    if (limited) return limited;
    const token = new URL(req.url).searchParams.get("token");
    if (!token) return bad("token is required");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("shared_projects")
      .select("state, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (error) throw error;
    if (!data || new Date(data.expires_at).getTime() < Date.now()) {
      return bad("Share link expired or not found", 404);
    }

    return ok({ state: data.state, expiresAt: data.expires_at });
  } catch (e) {
    return handleError(e);
  }
}
