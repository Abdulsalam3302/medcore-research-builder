import { bad, handleError, ok, safeJson } from "../../_utils";
import {
  recommendStat,
  type OutcomeShape,
  type GroupingShape,
} from "@/lib/agents/statRecommender";

export const runtime = "nodejs";

type Body = {
  outcome: OutcomeShape;
  grouping: GroupingShape;
  paired?: boolean;
  clustered?: boolean;
  sampleSize?: number;
  enrichWithLLM?: boolean;
  context?: string;
};

export async function POST(req: Request) {
  try {
    const body = await safeJson<Body>(req);
    if (!body?.outcome || !body?.grouping)
      return bad("outcome and grouping are required");
    return ok(await recommendStat(body));
  } catch (e) {
    return handleError(e);
  }
}
