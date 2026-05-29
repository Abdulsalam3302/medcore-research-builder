import { bad, handleError, ok, enforceRateLimit } from "../../_utils";
import { unpaywallConfigured, unpaywallLookup } from "@/lib/scholarly/unpaywall";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { doi: string } }) {
  try {
    const limited = enforceRateLimit(req, "search");
    if (limited) return limited;
    if (!unpaywallConfigured()) return bad("UNPAYWALL_EMAIL not configured", 503);
    const doi = decodeURIComponent(params.doi);
    if (!doi) return bad("doi is required");
    const result = await unpaywallLookup(doi);
    if (!result) return bad("not found", 404);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
