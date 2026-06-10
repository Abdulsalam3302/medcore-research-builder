import { bad, handleError, ok, enforceRateLimit } from "../../_utils";
import { doajSearchArticles, doajSearchJournals } from "@/lib/scholarly/doaj";

export const runtime = "nodejs";

/**
 * DOAJ search — `type=journals` verifies open-access journal legitimacy
 * (supports the predatory self-check); `type=articles` (default) finds
 * open-access papers with license metadata.
 */
export async function GET(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "search");
    if (limited) return limited;
    const u = new URL(req.url);
    const q = u.searchParams.get("query") || u.searchParams.get("q") || "";
    if (!q) return bad("query is required");
    const pageSize = Number(u.searchParams.get("page_size") || "10");
    const type = u.searchParams.get("type") === "journals" ? "journals" : "articles";
    const results =
      type === "journals"
        ? await doajSearchJournals(q, pageSize)
        : await doajSearchArticles(q, pageSize);
    return ok({ type, results });
  } catch (e) {
    return handleError(e);
  }
}
