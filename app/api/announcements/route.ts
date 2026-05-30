import { ok, handleError, enforceRateLimit } from "../_utils";
import { mergeAnnouncements, type Announcement } from "@/lib/announcements";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * GET — published announcements. Always returns the version-controlled static
 * set; if Supabase is configured, merges in any rows from the `announcements`
 * table (so the founder can post live without a deploy). Never fails the
 * response on a DB hiccup — static content always shows.
 */
export async function GET(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "default");
    if (limited) return limited;

    let remote: Announcement[] = [];
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("announcements")
          .select("id, date, kind, title, body, pinned, cta_label, cta_href")
          .order("date", { ascending: false })
          .limit(50);
        if (Array.isArray(data)) {
          remote = data.map((r) => ({
            id: String(r.id),
            date: String(r.date),
            kind: (r.kind as Announcement["kind"]) || "notice",
            title: String(r.title),
            body: String(r.body),
            pinned: Boolean(r.pinned),
            ctaLabel: r.cta_label ? String(r.cta_label) : undefined,
            ctaHref: r.cta_href ? String(r.cta_href) : undefined,
          }));
        }
      } catch {
        /* DB unreachable — fall back to static only */
      }
    }

    return ok({ announcements: mergeAnnouncements(remote) });
  } catch (e) {
    return handleError(e);
  }
}
