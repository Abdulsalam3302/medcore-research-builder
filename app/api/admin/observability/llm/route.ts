import { ok, handleError, enforceRateLimit } from "../../../_utils";
import { parseDaysParam, requireAdmin } from "@/lib/analytics/admin-api";
import { buildLLMInsight } from "@/lib/analytics/drilldown";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin drill-down: LLM call and token usage statistics. */
export async function GET(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "default");
    if (limited) return limited;

    const { user, error } = await requireAdmin();
    if (error) return error;

    const days = parseDaysParam(req.url);
    const payload = await buildLLMInsight(days);
    return ok({ ...payload, admin: { email: user!.email } });
  } catch (e) {
    return handleError(e);
  }
}
