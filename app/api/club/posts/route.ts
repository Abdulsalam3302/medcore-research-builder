import { bad, handleError, ok, safeJson, enforceRateLimit, BadRequestError } from "../../_utils";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = new Set(["opportunity", "project", "meet"]);

/** Strip control characters; the club is plain text only (no HTML/markdown). */
function cleanText(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** List club posts (public — guests can browse before signing up). */
export async function GET(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "default");
    if (limited) return limited;
    if (!isSupabaseConfigured()) return ok({ configured: false, posts: [] });

    const u = new URL(req.url);
    const kind = u.searchParams.get("kind") || "";
    const supabase = createClient();
    let query = supabase
      .from("club_posts")
      .select("id, author_name, kind, title, description, specialty, share_url, contact, status, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (kind && KINDS.has(kind)) query = query.eq("kind", kind);
    const { data, error } = await query;
    if (error) throw error;

    // Tell the signed-in caller which posts are theirs / already joined.
    const user = await getAppUser();
    let joinedIds: string[] = [];
    if (user && data?.length) {
      const { data: joins } = await supabase
        .from("club_joins")
        .select("post_id")
        .eq("user_id", user.id);
      joinedIds = (joins || []).map((j) => j.post_id as string);
    }
    return ok({
      configured: true,
      signedIn: Boolean(user),
      posts: (data || []).map((p) => ({ ...p, joined: joinedIds.includes(p.id as string) })),
    });
  } catch (e) {
    return handleError(e);
  }
}

/** Create a post (signed-in users only). */
export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "verify"); // strict: 12/min/IP
    if (limited) return limited;
    if (!isSupabaseConfigured()) return bad("Community features need Supabase configured", 503);
    const user = await getAppUser();
    if (!user) return bad("Sign in to post in the Publication Club", 401);

    const body = await safeJson<Record<string, unknown>>(req, "default");
    const kind = cleanText(body.kind, 20);
    if (!KINDS.has(kind)) throw new BadRequestError("kind must be opportunity | project | meet");
    const title = cleanText(body.title, 160);
    if (title.length < 8) throw new BadRequestError("title must be at least 8 characters");
    const description = cleanText(body.description, 2000);
    if (description.length < 20) throw new BadRequestError("description must be at least 20 characters");
    const specialty = cleanText(body.specialty, 80);
    const contact = cleanText(body.contact, 200);
    const shareUrl = cleanText(body.shareUrl, 300);
    // Only allow share links that point back to this platform — the club must
    // not become a link-drop for arbitrary external URLs.
    if (shareUrl && !/^https:\/\/[\w.-]+\/(\?share=|.*[?&]share=)/.test(shareUrl) && !shareUrl.startsWith("/?share=")) {
      throw new BadRequestError("shareUrl must be a MedCore share link (…?share=TOKEN)");
    }

    const authorName = cleanText(body.authorName, 60) || user.email.split("@")[0];

    const supabase = createClient();
    const { data, error } = await supabase
      .from("club_posts")
      .insert({
        user_id: user.id,
        author_name: authorName,
        kind,
        title,
        description,
        specialty: specialty || null,
        contact: contact || null,
        share_url: shareUrl || null,
      })
      .select("id, created_at")
      .single();
    if (error) throw error;
    return ok({ created: true, id: data.id, createdAt: data.created_at });
  } catch (e) {
    return handleError(e);
  }
}
