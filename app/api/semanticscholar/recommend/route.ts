import { bad, handleError, ok, safeJson } from "../../_utils";
import { s2Recommendations } from "@/lib/scholarly/semanticscholar";

export const runtime = "nodejs";

type Body = { paperId: string; limit?: number };

export async function POST(req: Request) {
  try {
    const body = await safeJson<Body>(req);
    if (!body?.paperId) return bad("paperId is required");
    const results = await s2Recommendations({
      paperId: body.paperId,
      limit: body.limit,
    });
    return ok({ results });
  } catch (e) {
    return handleError(e);
  }
}
