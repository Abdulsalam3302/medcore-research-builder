import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import {
  descriptive,
  welchTTest,
  pairedTTest,
  chiSquare,
  pearsonCorrelation,
} from "@/lib/agents/statsEngine";

export const runtime = "nodejs";

type Body =
  | { test: "descriptive"; values: number[] }
  | { test: "welch_t"; group1: number[]; group2: number[] }
  | { test: "paired_t"; pre: number[]; post: number[] }
  | { test: "chi_square"; observed: number[][] }
  | { test: "pearson"; x: number[]; y: number[] };

export async function POST(req: Request) {
  const rl = enforceRateLimit(req, "llm");
  if (rl) return rl;
  try {
    const body = await safeJson<Body>(req);
    if (!body?.test) return bad("test is required");
    switch (body.test) {
      case "descriptive":
        return ok(descriptive(body.values || []));
      case "welch_t":
        return ok(welchTTest(body.group1 || [], body.group2 || []));
      case "paired_t":
        return ok(pairedTTest(body.pre || [], body.post || []));
      case "chi_square":
        return ok(chiSquare(body.observed || []));
      case "pearson":
        return ok(pearsonCorrelation(body.x || [], body.y || []));
      default:
        return bad("unknown test");
    }
  } catch (e) {
    return handleError(e);
  }
}
