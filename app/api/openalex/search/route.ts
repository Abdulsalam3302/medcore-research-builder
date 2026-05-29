import { bad, handleError, ok, enforceRateLimit } from "../../_utils";
import { openalexSearch } from "@/lib/scholarly/openalex";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const limited = enforceRateLimit(req, "search");
    if (limited) return limited;
    const u = new URL(req.url);
    const q = u.searchParams.get("query") || "";
    const perPageRaw = Number(u.searchParams.get("per_page") || "20");
    const perPage = Math.min(Math.max(1, Number.isFinite(perPageRaw) ? perPageRaw : 20), 100);
    if (!q) return bad("query is required");
    const results = await openalexSearch({ query: q, perPage });
    return ok({ results });
  } catch (e) {
    return handleError(e);
  }
}
