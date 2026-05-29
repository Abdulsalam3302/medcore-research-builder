import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import { elicitConfigured, elicitSearch } from "@/lib/scholarly/elicit";

export const runtime = "nodejs";

type Body = { query: string; limit?: number; yearFrom?: number; yearTo?: number };

export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "search");
    if (limited) return limited;
    if (!elicitConfigured()) return bad("ELICIT_API_KEY not configured", 503);
    const body = await safeJson<Body>(req);
    if (!body?.query) return bad("query is required");
    const results = await elicitSearch(body);
    return ok({ results });
  } catch (e) {
    return handleError(e);
  }
}
