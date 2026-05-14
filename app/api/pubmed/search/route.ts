import { bad, handleError, ok } from "../../_utils";
import { pubmedSearchAndSummarize } from "@/lib/scholarly/pubmed";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const q = u.searchParams.get("q") || "";
    const retmax = Number(u.searchParams.get("retmax") || "20");
    if (!q) return bad("q is required");
    const results = await pubmedSearchAndSummarize({ query: q, retmax });
    return ok({ results });
  } catch (e) {
    return handleError(e);
  }
}
