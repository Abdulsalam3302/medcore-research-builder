import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import {
  recommendFigureKind,
  specifyForest,
  specifyBarGrouped,
  specifyBoxViolin,
  specifyKaplanMeier,
  specifyROC,
  type FigureKind,
} from "@/lib/agents/figureSpecifier";

export const runtime = "nodejs";

type Body =
  | { kind: "recommend"; resultText: string }
  | { kind: "forest"; rows: Array<{ label: string; effect: number; lower: number; upper: number; weight?: number }>; effectLabel?: string; refLine?: number; logScale?: boolean }
  | { kind: "bar_grouped"; groups: string[]; series: Array<{ name: string; values: number[]; errors?: number[] }>; yLabel?: string }
  | { kind: "box_violin"; groups: Array<{ name: string; values: number[] }>; yLabel?: string; asViolin?: boolean }
  | { kind: "kaplan_meier"; groups: Array<{ name: string; time: number[]; survival: number[] }>; xLabel?: string }
  | { kind: "roc"; curves: Array<{ name: string; fpr: number[]; tpr: number[]; auc?: number }> };

export async function POST(req: Request) {
  const rl = enforceRateLimit(req, "llm");
  if (rl) return rl;
  try {
    const body = await safeJson<Body>(req);
    if (!body?.kind) return bad("kind is required");
    if (body.kind === "recommend") {
      const k: FigureKind = recommendFigureKind(body.resultText || "");
      return ok({ recommended: k });
    }
    if (body.kind === "forest") return ok(specifyForest(body));
    if (body.kind === "bar_grouped") return ok(specifyBarGrouped(body));
    if (body.kind === "box_violin") return ok(specifyBoxViolin(body));
    if (body.kind === "kaplan_meier") return ok(specifyKaplanMeier(body));
    if (body.kind === "roc") return ok(specifyROC(body));
    return bad("unknown kind");
  } catch (e) {
    return handleError(e);
  }
}
