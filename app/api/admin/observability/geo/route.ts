import { ok, handleError, enforceRateLimit } from "../../../_utils";
import { parseDaysParam, requireAdmin } from "@/lib/analytics/admin-api";
import { buildGeoInsight } from "@/lib/analytics/drilldown";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin drill-down: geographic traffic with full country names and SA highlight. */
export async function GET(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "default");
    if (limited) return limited;

    const { user, error } = await requireAdmin();
    if (error) return error;

    const days = parseDaysParam(req.url);
    const payload = await buildGeoInsight(days);
    return ok({ ...payload, admin: { email: user!.email } });
  } catch (e) {
    return handleError(e);
  }
}
