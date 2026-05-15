import { bad, handleError, ok, safeJson } from "../../_utils";
import { checkRetraction } from "@/lib/agents/retractionChecker";

export const runtime = "nodejs";

type Body = { doi: string };

export async function POST(req: Request) {
  try {
    const body = await safeJson<Body>(req);
    if (!body?.doi) return bad("doi is required");
    return ok(await checkRetraction(body.doi));
  } catch (e) {
    return handleError(e);
  }
}
