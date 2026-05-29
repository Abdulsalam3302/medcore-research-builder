import { bad, handleError, ok, enforceRateLimit } from "../../_utils";
import { europepmcSearch } from "@/lib/scholarly/europepmc";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const limited = enforceRateLimit(req, "search");
    if (limited) return limited;
    const u = new URL(req.url);
    const q = u.searchParams.get("query") || u.searchParams.get("q") || "";
    if (!q) return bad("query is required");
    const pageSize = Number(u.searchParams.get("page_size") || "25");
    const includePreprints = u.searchParams.get("preprints") !== "false";
    const resultType = (u.searchParams.get("result_type") as "lite" | "core") || "lite";
    const results = await europepmcSearch({ query: q, pageSize, resultType, includePreprints });
    return ok({ results });
  } catch (e) {
    return handleError(e);
  }
}
