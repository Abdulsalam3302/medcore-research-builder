import { bad, handleError, ok, enforceRateLimit } from "../../_utils";
import { europepmcSearch } from "@/lib/scholarly/europepmc";

export const runtime = "nodejs";

/**
 * Preprint-only search (bioRxiv, medRxiv, Research Square, …) via Europe PMC's
 * PPR source. Free, keyless, and clearly labelled: preprints are not peer
 * reviewed, so the UI must keep the isPreprint flag visible.
 */
export async function GET(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "search");
    if (limited) return limited;
    const u = new URL(req.url);
    const q = u.searchParams.get("query") || u.searchParams.get("q") || "";
    if (!q) return bad("query is required");
    const pageSize = Number(u.searchParams.get("page_size") || "25");
    const results = await europepmcSearch({
      query: `(${q}) AND SRC:PPR`,
      pageSize,
      includePreprints: false, // SRC:PPR already scopes the query to preprints
    });
    return ok({ results });
  } catch (e) {
    return handleError(e);
  }
}
