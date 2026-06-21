import { ok, handleError, enforceRateLimit } from "../../../_utils";
import { parseDaysParam, requireAdmin } from "@/lib/analytics/admin-api";
import { buildAuditInsight } from "@/lib/analytics/drilldown";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin drill-down: per-user or global audit trail (no raw PII). */
export async function GET(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "default");
    if (limited) return limited;

    const { user, error } = await requireAdmin();
    if (error) return error;

    const url = new URL(req.url);
    const days = parseDaysParam(req.url);
    const userId = url.searchParams.get("userId") || undefined;
    const payload = await buildAuditInsight(days, userId);
    return ok({ ...payload, admin: { email: user!.email } });
  } catch (e) {
    return handleError(e);
  }
}
