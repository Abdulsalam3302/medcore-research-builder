import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import { pubmedCitationMatch, pubmedSummary } from "@/lib/scholarly/pubmed";

export const runtime = "nodejs";

type Body = {
  journal?: string;
  year?: string;
  volume?: string;
  page?: string;
  author?: string;
  title?: string;
};

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req, "search");
    if (limited) return limited;
    const body = await safeJson<Body>(req);
    if (!body || Object.keys(body).length === 0) return bad("at least one field is required");
    const pmid = await pubmedCitationMatch(body);
    if (!pmid) return ok({ pmid: null, summary: null });
    const summary = (await pubmedSummary([pmid]))[0] || null;
    return ok({ pmid, summary });
  } catch (e) {
    return handleError(e);
  }
}
