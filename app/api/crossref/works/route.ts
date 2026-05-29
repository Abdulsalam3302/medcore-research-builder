import { bad, handleError, ok, enforceRateLimit } from "../../_utils";
import { crossrefByDOI } from "@/lib/scholarly/crossref";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const limited = enforceRateLimit(req, "search");
    if (limited) return limited;
    const u = new URL(req.url);
    const doi = u.searchParams.get("doi") || "";
    if (!doi) return bad("doi is required");
    const result = await crossrefByDOI(doi);
    return ok({ result });
  } catch (e) {
    return handleError(e);
  }
}
