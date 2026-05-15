import { bad, handleError, ok, safeJson } from "../../_utils";
import { findEvidence } from "@/lib/agents/evidenceFinder";

export const runtime = "nodejs";

type Body = {
  query: string;
  limit?: number;
  sources?: Array<"pubmed" | "s2" | "openalex" | "europepmc">;
  yearFrom?: number;
  yearTo?: number;
};

export async function POST(req: Request) {
  try {
    const body = await safeJson<Body>(req);
    if (!body?.query) return bad("query is required");
    const result = await findEvidence(body);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
