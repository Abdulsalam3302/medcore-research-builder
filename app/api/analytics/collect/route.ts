import { ok, bad, safeJson, handleError, enforceRateLimit } from "../../_utils";
import { getAppUser } from "@/lib/auth";
import { isInternalAnalyticsRequest } from "@/lib/analytics/parse-edge";
import { trackFromRequest } from "@/lib/analytics/track";
import type { AnalyticsCategory, AnalyticsEventType } from "@/lib/analytics/types";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isAnalyticsConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  eventType?: AnalyticsEventType;
  category?: AnalyticsCategory;
  path?: string;
  method?: string;
  feature?: string;
  mode?: string;
  metadata?: Record<string, unknown>;
};

const CLIENT_ALLOWED: AnalyticsEventType[] = [
  "auth_failed",
  "feature_use",
  "signup",
  "login",
];

/** Ingest analytics events from middleware (internal) or client (auth/feature). */
export async function POST(req: Request) {
  try {
    if (!isAnalyticsConfigured()) return ok({ tracked: false, reason: "not_configured" });

    const internal = isInternalAnalyticsRequest(req);
    if (!internal) {
      const limited = await enforceRateLimit(req, "default");
      if (limited) return limited;
    }

    const b = await safeJson<Body>(req, "default");
    if (!b?.eventType) return bad("eventType is required");

    if (!internal && !CLIENT_ALLOWED.includes(b.eventType)) {
      return bad("Event type not allowed from client", 403);
    }

    let userId: string | null = null;
    if (isSupabaseConfigured() && (b.eventType === "signup" || b.eventType === "login")) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    }

    const category =
      b.category ||
      (b.eventType === "page_view"
        ? "visit"
        : b.eventType === "auth_failed" || b.eventType === "signup" || b.eventType === "login"
          ? "auth"
          : b.eventType === "rate_limit"
            ? "abuse"
            : "usage");

    const metadata = { ...(b.metadata || {}) };
    if (b.feature) metadata.feature = b.feature;
    if (b.mode) metadata.mode = b.mode;

    trackFromRequest(req, {
      eventType: b.eventType,
      category,
      path: b.path ?? null,
      method: b.method ?? null,
      userId,
      metadata,
      severity:
        b.eventType === "rate_limit" || b.eventType === "auth_failed" ? "warn" : "info",
    });

    return ok({ tracked: true });
  } catch (e) {
    return handleError(e);
  }
}
