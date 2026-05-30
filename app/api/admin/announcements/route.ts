import { ok, bad, safeJson, handleError, enforceRateLimit } from "../../_utils";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  id?: string;
  date?: string;
  kind?: string;
  title?: string;
  body?: string;
  pinned?: boolean;
  ctaLabel?: string;
  ctaHref?: string;
};

/** Admin-only: create/update an announcement (upsert). Owner/admin only. */
export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "default");
    if (limited) return limited;
    if (!isSupabaseConfigured()) return bad("Cloud storage not configured", 503);

    const user = await getAppUser();
    if (!user || user.role !== "admin") return bad("Admin access required", 403);

    const b = await safeJson<Body>(req, "default");
    if (!b?.title || !b?.body) return bad("title and body are required");

    const id = b.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const supabase = createClient();
    const { error } = await supabase.from("announcements").upsert({
      id,
      date: b.date || new Date().toISOString().slice(0, 10),
      kind: b.kind || "update",
      title: b.title,
      body: b.body,
      pinned: Boolean(b.pinned),
      cta_label: b.ctaLabel || null,
      cta_href: b.ctaHref || null,
    });
    if (error) throw error;
    return ok({ saved: true, id });
  } catch (e) {
    return handleError(e);
  }
}

/** Admin-only: delete an announcement by id. */
export async function DELETE(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "default");
    if (limited) return limited;
    if (!isSupabaseConfigured()) return bad("Cloud storage not configured", 503);

    const user = await getAppUser();
    if (!user || user.role !== "admin") return bad("Admin access required", 403);

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return bad("id is required");

    const supabase = createClient();
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) throw error;
    return ok({ deleted: true, id });
  } catch (e) {
    return handleError(e);
  }
}
