import { bad, handleError, ok, enforceRateLimit } from "../../_utils";
import { openCitationsCitedBy, openCitationsReferences } from "@/lib/scholarly/opencitations";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: { doi: string } }) {
  try {
    const limited = await enforceRateLimit(req, "search");
    if (limited) return limited;
    const doi = decodeURIComponent(params.doi);
    if (!doi) return bad("doi is required");
    const direction = new URL(req.url).searchParams.get("direction") || "citations";
    const data =
      direction === "references"
        ? await openCitationsReferences(doi)
        : await openCitationsCitedBy(doi);
    return ok({ doi, direction, count: data.length, results: data });
  } catch (e) {
    return handleError(e);
  }
}
