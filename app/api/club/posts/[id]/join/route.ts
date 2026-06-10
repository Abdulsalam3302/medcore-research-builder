import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../../../_utils";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Request to join an opportunity/project (signed-in users only, once per post). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const limited = await enforceRateLimit(req, "verify");
    if (limited) return limited;
    if (!isSupabaseConfigured()) return bad("Community features need Supabase configured", 503);
    const user = await getAppUser();
    if (!user) return bad("Sign in to join opportunities", 401);
    if (!UUID_RE.test(params.id)) return bad("Invalid post id");

    const body = await safeJson<{ message?: string; joinerName?: string }>(req, "default").catch(
      () => ({}) as { message?: string; joinerName?: string },
    );
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 500) : "";
    const joinerName =
      (typeof body.joinerName === "string" ? body.joinerName.trim().slice(0, 60) : "") ||
      user.email.split("@")[0];

    const supabase = createClient();
    const { error } = await supabase.from("club_joins").insert({
      post_id: params.id,
      user_id: user.id,
      joiner_name: joinerName,
      message: message || null,
    });
    if (error) {
      // unique(post_id, user_id) — joining twice is fine to report cleanly.
      if (String(error.code) === "23505") return ok({ joined: true, already: true });
      throw error;
    }
    return ok({ joined: true });
  } catch (e) {
    return handleError(e);
  }
}

/** Withdraw a join request. */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const limited = await enforceRateLimit(req, "default");
    if (limited) return limited;
    if (!isSupabaseConfigured()) return bad("Community features need Supabase configured", 503);
    const user = await getAppUser();
    if (!user) return bad("Sign in required", 401);
    if (!UUID_RE.test(params.id)) return bad("Invalid post id");

    const supabase = createClient();
    const { error } = await supabase
      .from("club_joins")
      .delete()
      .eq("post_id", params.id)
      .eq("user_id", user.id);
    if (error) throw error;
    return ok({ withdrawn: true });
  } catch (e) {
    return handleError(e);
  }
}
