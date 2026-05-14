import { bad, handleError, ok, safeJson } from "../../_utils";
import { GLOBAL_SYSTEM, refineSectionPrompt } from "@/lib/prompts";
import { callLLM, extractJSON, isLLMConfigured } from "@/lib/llm";
import type { LLMRefineResponse } from "@/lib/types";
import { guidelineById } from "@/lib/guidelines";

export const runtime = "nodejs";

type Body = {
  section: "introduction" | "methods" | "results" | "discussion" | "conclusion";
  guidelineId: string;
  draft: string;
  contextNotes?: string;
};

export async function POST(req: Request) {
  try {
    if (!isLLMConfigured())
      return bad("LLM not configured — set ANTHROPIC_API_KEY or OPENAI_API_KEY", 503);
    const body = await safeJson<Body>(req);
    if (!body?.section || !body?.guidelineId)
      return bad("section and guidelineId are required");
    const g = guidelineById(body.guidelineId);
    if (!g) return bad(`Unknown guideline id: ${body.guidelineId}`);
    const checklist = (g.checklistPrompts[body.section] || []) as string[];
    const prompt = refineSectionPrompt({
      section: body.section,
      guidelineName: `${g.name}`,
      checklist,
      draft: body.draft || "",
      contextNotes: body.contextNotes,
    });
    // The Results section needs an extra reminder about not inventing numbers.
    const extraSystem =
      body.section === "results"
        ? "\n\nADDITIONAL RULE FOR THIS REQUEST: This is the Results section. You must NEVER invent numbers, percentages, p-values, confidence intervals, sample sizes, or effect estimates. If a number is missing from the author's draft, ask for it in missingInformation rather than inventing it."
        : "";
    const text = await callLLM({
      system: GLOBAL_SYSTEM + extraSystem,
      prompt,
      maxTokens: 4000,
      temperature: 0.2,
      jsonOnly: true,
    });
    const parsed = extractJSON<LLMRefineResponse>(text);
    return ok(parsed);
  } catch (e) {
    return handleError(e);
  }
}
