import { bad, handleError, ok } from "../../_utils";
import { pubmedSummary } from "@/lib/scholarly/pubmed";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const pmids = (u.searchParams.get("pmids") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (pmids.length === 0) return bad("pmids is required (comma-separated)");
    const results = await pubmedSummary(pmids);
    return ok({ results });
  } catch (e) {
    return handleError(e);
  }
}
