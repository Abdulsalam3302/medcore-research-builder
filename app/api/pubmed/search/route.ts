import { bad, handleError, ok, enforceRateLimit } from "../../_utils";
import { pubmedSearchAndSummarize } from "@/lib/scholarly/pubmed";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "search");
    if (limited) return limited;
    const u = new URL(req.url);
    const q = u.searchParams.get("q") || "";
    const retmaxRaw = Number(u.searchParams.get("retmax") || "20");
    const retmax = Math.min(Math.max(1, Number.isFinite(retmaxRaw) ? retmaxRaw : 20), 100);
    if (!q) return bad("q is required");
    const results = await pubmedSearchAndSummarize({ query: q, retmax });
    return ok({ results });
  } catch (e) {
    return handleError(e);
  }
}
