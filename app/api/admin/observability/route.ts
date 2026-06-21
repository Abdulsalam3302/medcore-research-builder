import { ok, bad, handleError, enforceRateLimit } from "../../_utils";
import { getAppUser } from "@/lib/auth";
import { buildObservabilityPayload } from "@/lib/analytics/aggregate";
import { isAnalyticsConfigured } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin-only observability metrics and retrospective report. */
export async function GET(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "default");
    if (limited) return limited;

    const user = await getAppUser();
    if (!user || user.role !== "admin") return bad("Admin access required", 403);

    const days = Math.min(90, Math.max(7, Number(new URL(req.url).searchParams.get("days") || 30)));
    const payload = await buildObservabilityPayload(days);

    return ok({
      ...payload,
      admin: { email: user.email },
      schemaReady: isAnalyticsConfigured(),
    });
  } catch (e) {
    return handleError(e);
  }
}
