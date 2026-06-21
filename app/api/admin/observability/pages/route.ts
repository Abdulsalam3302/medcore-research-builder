import { ok, handleError, enforceRateLimit } from "../../../_utils";
import { parseDaysParam, requireAdmin } from "@/lib/analytics/admin-api";
import { buildPageInsight } from "@/lib/analytics/drilldown";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin drill-down: page view breakdown (all pages or single path). */
export async function GET(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "default");
    if (limited) return limited;

    const { user, error } = await requireAdmin();
    if (error) return error;

    const url = new URL(req.url);
    const days = parseDaysParam(req.url);
    const path = url.searchParams.get("path") || undefined;
    const payload = await buildPageInsight(days, path);
    return ok({ ...payload, admin: { email: user!.email } });
  } catch (e) {
    return handleError(e);
  }
}
