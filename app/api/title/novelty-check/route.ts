import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import type { TitleInputs } from "@/lib/types";
import { runNoveltyCheck } from "@/lib/novelty";

export const runtime = "nodejs";

type Body = { inputs: TitleInputs };

export async function POST(req: Request) {
  const rl = enforceRateLimit(req, "llm");
  if (rl) return rl;
  try {
    const body = await safeJson<Body>(req);
    if (!body?.inputs) return bad("inputs is required");
    if (!body.inputs.draftTitle?.trim()) return bad("inputs.draftTitle is required");
    const report = await runNoveltyCheck({ inputs: body.inputs });
    return ok(report);
  } catch (e) {
    return handleError(e);
  }
}
