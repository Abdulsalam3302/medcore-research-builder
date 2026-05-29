import { bad, handleError, ok, safeJson, enforceRateLimit } from "../_utils";
import { webSearch, webSearchConfigured } from "@/lib/scholarly/websearch";

export const runtime = "nodejs";

type Body = { query: string; max?: number };

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req, "search");
    if (limited) return limited;
    if (!webSearchConfigured())
      return bad("Web search not configured — set TAVILY_API_KEY or SERPAPI_API_KEY", 503);
    const body = await safeJson<Body>(req);
    if (!body?.query) return bad("query is required");
    const results = await webSearch(body.query, body.max ?? 10);
    return ok({ results, provider: webSearchConfigured() });
  } catch (e) {
    return handleError(e);
  }
}
