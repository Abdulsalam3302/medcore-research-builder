import { bad, handleError, ok, safeJson } from "../_utils";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth";
import type { ProjectState } from "@/lib/types";

export const runtime = "nodejs";

/** Cloud sync: load/save manuscript project for authenticated users. */
export async function GET() {
  try {
    if (!isSupabaseConfigured()) return ok({ configured: false, project: null });
    const user = await getAppUser();
    if (!user) return bad("Sign in required for cloud sync", 401);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("manuscript_projects")
      .select("state, updated_at, title")
      .eq("user_id", user.id)
      .eq("slug", "default")
      .maybeSingle();

    if (error) throw error;
    return ok({
      configured: true,
      user: { email: user.email, role: user.role },
      project: data?.state ?? null,
      updatedAt: data?.updated_at ?? null,
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: Request) {
  try {
    if (!isSupabaseConfigured()) return bad("Supabase not configured", 503);
    const user = await getAppUser();
    if (!user) return bad("Sign in required for cloud sync", 401);

    const body = await safeJson<{ state?: ProjectState; title?: string }>(req, "references");
    if (!body?.state) return bad("state is required");
    if (
      typeof body.state !== "object" ||
      body.state === null ||
      Array.isArray(body.state)
    ) {
      return bad("state must be a plain object");
    }

    const supabase = createClient();
    const title =
      body.title ||
      body.state.titleFinal ||
      body.state.titleInputs?.draftTitle ||
      "Untitled manuscript";

    const { data, error } = await supabase
      .from("manuscript_projects")
      .upsert(
        {
          user_id: user.id,
          slug: "default",
          title,
          state: body.state,
        },
        { onConflict: "user_id,slug" },
      )
      .select("updated_at")
      .single();

    if (error) throw error;
    return ok({ saved: true, updatedAt: data.updated_at });
  } catch (e) {
    return handleError(e);
  }
}
