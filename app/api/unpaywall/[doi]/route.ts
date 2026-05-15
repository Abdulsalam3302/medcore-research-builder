import { bad, handleError, ok } from "../../_utils";
import { unpaywallConfigured, unpaywallLookup } from "@/lib/scholarly/unpaywall";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { doi: string } }) {
  try {
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
