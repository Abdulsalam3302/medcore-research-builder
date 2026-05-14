import { bad, handleError, ok } from "../../_utils";
import { crossrefByDOI } from "@/lib/scholarly/crossref";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const doi = u.searchParams.get("doi") || "";
    if (!doi) return bad("doi is required");
    const result = await crossrefByDOI(doi);
    return ok({ result });
  } catch (e) {
    return handleError(e);
  }
}
