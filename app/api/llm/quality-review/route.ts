import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import { GLOBAL_SYSTEM } from "@/lib/prompts";
import { callLLM, extractJSON, isLLMConfigured } from "@/lib/llm";
import type { ProjectState } from "@/lib/types";
import { buildContextBundle, bundleToPromptBlock } from "@/lib/agents/contextBundle";

export const runtime = "nodejs";

/**
 * Multi-dimensional quality review:
 *  - peer-review-style comments and resolution suggestions
 *  - rubric scoring across novelty, integrity, ethics, significance, gap,
 *    aim/hypothesis, conclusion, visualization, coherence, readability,
 *    scientific rigor, academic tone, applicability, contribution, validation,
 *    reliability, similarity.
 */

type Body = { project: ProjectState };

export async function POST(req: Request) {
  const rl = enforceRateLimit(req, "llm");
  if (rl) return rl;
  try {
    if (!isLLMConfigured())
      return bad(
        "LLM not configured — set MINIMAX_API_KEY (default), ANTHROPIC_API_KEY, or OPENAI_API_KEY",
        503
      );
    const body = await safeJson<Body>(req);
    if (!body?.project) return bad("project is required");

    const bundle = buildContextBundle(body.project.researchTypeAnswers || {});
    const contextBlock = bundleToPromptBlock(bundle);

    const trimmed = {
      titleFinal: body.project.titleFinal,
      titleInputs: body.project.titleInputs,
      researchTypeResult: body.project.researchTypeResult,
      sections: body.project.sections,
      appendices: body.project.appendices,
      referencesCount: body.project.references.verifications.length,
    };

    const prompt = `You are a senior peer reviewer evaluating a medical manuscript across many dimensions.

${contextBlock}

Project (trimmed):
${JSON.stringify(trimmed, null, 2)}

Your job:
1. Produce a peer-review-style review with positive remarks, major concerns, and minor concerns, each tied to a specific section.
2. For every concern, propose a concrete "resolution" the author can apply.
3. Score the manuscript across the following dimensions on a 0–100 scale, with a one-line rationale each. Do NOT fabricate findings; use the project text only.

Dimensions:
- novelty (originality, contribution to the field)
- contribution (clear contribution to the discipline)
- significance (importance of the question / impact)
- gapIdentified (clarity of the knowledge gap addressed)
- aimAndHypothesis (clarity of aim / hypothesis / objective)
- methodologicalRigor (design–question alignment, validity, reliability)
- ethics (consent, IRB, vulnerable populations, data protection)
- integrity (no overstatement, no causal language unsupported by design)
- coherence (logical flow across sections)
- readability (accessibility for the target reader)
- scientificQuality (precision, terminology, statistical reporting)
- academicTone (objective, balanced, neutral voice)
- applicability (translation to practice / policy)
- conclusionKeyMessage (a strong, evidence-aligned take-home message)
- visualization (figure/table appropriateness vs. study design)
- validation (internal + external validation steps, sensitivity analyses)
- reliability (reproducibility, code/data availability, transparency)
- similarityRisk (overlap with existing literature — use noveltyReport if present)

Hard rules:
- NO fabrication of numbers, citations, or facts.
- If a dimension cannot be judged from the project text, set score to null and put the reason in 'rationale'.
- Tie every concern to a specific section name.

Return ONLY this JSON:
{
  "summary": "string (3–5 sentence overview)",
  "scores": [{"dimension": "string", "score": 0, "rationale": "string"}],
  "overall": 0,
  "verdict": "needs-major-revision|needs-minor-revision|near-ready|ready",
  "positiveRemarks": [{"section": "string", "remark": "string"}],
  "majorConcerns": [{"section": "string", "issue": "string", "resolution": "string"}],
  "minorConcerns": [{"section": "string", "issue": "string", "resolution": "string"}],
  "homeKeyMessageSuggestion": "string (one-sentence take-home message proposal)",
  "visualizationSuggestions": ["string"],
  "additionalChecks": ["string"]
}`;

    const text = await callLLM({
      system: GLOBAL_SYSTEM,
      prompt,
      maxTokens: 4000,
      temperature: 0.15,
      jsonOnly: true,
    });
    const parsed = extractJSON<Record<string, unknown>>(text);
    return ok(parsed);
  } catch (e) {
    return handleError(e);
  }
}
