import { bad, handleError, ok, safeJson } from "../../_utils";
import type { ResearchTypeAnswersV2, TitleInputs } from "@/lib/types";
import { runNoveltyCheck } from "@/lib/novelty";
import { callLLM, extractJSON, isLLMConfigured } from "@/lib/llm";
import { GLOBAL_SYSTEM } from "@/lib/prompts";
import { buildContextBundle, bundleToPromptBlock } from "@/lib/agents/contextBundle";
import { detectTitleConflicts } from "@/lib/alignment";

export const runtime = "nodejs";

/**
 * Title "full check" — runs the existing novelty/similarity scan then scores
 * the title across 7 additional dimensions:
 *  - validation (does the title imply a validated approach for the design?)
 *  - reliability (does the title imply replicability / pre-specification?)
 *  - similarity (already covered by novelty report — surfaced as score)
 *  - novelty (originality)
 *  - importance (clinical / scientific importance)
 *  - applicability (translation to practice / policy)
 *  - contribution (clear advance over prior work)
 *
 * Returns the augmented report.
 */

type Body = { inputs: TitleInputs; answers?: ResearchTypeAnswersV2 };

export async function POST(req: Request) {
  try {
    const body = await safeJson<Body>(req);
    if (!body?.inputs) return bad("inputs is required");
    if (!body.inputs.draftTitle?.trim()) return bad("inputs.draftTitle is required");

    /* 1. Run the novelty/similarity scan first. */
    const novelty = await runNoveltyCheck({ inputs: body.inputs });

    /* 2. Local design-conflict check. */
    const designConflicts = detectTitleConflicts(
      body.answers?.designId,
      body.inputs.draftTitle
    );

    /* 3. LLM rubric scoring across the additional dimensions. */
    let assessment: Record<string, unknown> | null = null;
    if (isLLMConfigured()) {
      const bundle = body.answers ? buildContextBundle(body.answers) : undefined;
      const contextBlock = bundle ? bundleToPromptBlock(bundle) : "";
      const matchesBrief = [
        ...novelty.exactMatches.slice(0, 5),
        ...novelty.similar.slice(0, 5),
      ].map((m) => ({
        title: m.title,
        year: m.year,
        whySimilar: m.whySimilar,
      }));
      const prompt = `Evaluate this manuscript title across 7 dimensions, using ONLY the inputs and the similarity hits I provide. Do not invent citations.

${contextBlock}

Title under review: "${body.inputs.draftTitle}"
PICO/design inputs (JSON):
${JSON.stringify(body.inputs, null, 2)}

Similarity hits already located (top 10, may be empty):
${JSON.stringify(matchesBrief, null, 2)}

Novelty-scan risk verdict: ${novelty.risk}
Design conflicts (deterministic check): ${
        designConflicts.length
          ? designConflicts.map((c) => c.keyword).join(", ")
          : "none"
      }

Rate the title 0–100 on each dimension, with a one-sentence rationale.

Dimensions:
- validation: does the title imply a validated/established approach for the design? Penalise if it claims a method the design cannot support.
- reliability: does the title imply replicability / pre-specification / clear protocol?
- similarity: relative similarity to prior work, derived from the novelty scan (lower = more original; report as 0–100 where 100 = highly novel).
- novelty: originality of contribution.
- importance: clinical / scientific importance of the question.
- applicability: translation to practice / policy / further research.
- contribution: clarity of contribution over prior work.

Hard rules:
- Do not fabricate findings.
- If any dimension cannot be judged, score it null with reason in 'rationale'.
- Surface concrete refinement suggestions.

Return ONLY this JSON:
{
  "scores": [{"dimension":"validation|reliability|similarity|novelty|importance|applicability|contribution","score":0,"rationale":"string"}],
  "overall": 0,
  "verdict": "weak|moderate|strong|excellent",
  "topRefinements": ["string"],
  "designConflictNotes": ["string"]
}`;
      const text = await callLLM({
        system: GLOBAL_SYSTEM,
        prompt,
        maxTokens: 1800,
        temperature: 0.15,
        jsonOnly: true,
      });
      assessment = extractJSON<Record<string, unknown>>(text);
    }

    return ok({
      novelty,
      designConflicts,
      assessment,
      _source: assessment ? "llm-multi-check" : "novelty-only",
    });
  } catch (e) {
    return handleError(e);
  }
}
