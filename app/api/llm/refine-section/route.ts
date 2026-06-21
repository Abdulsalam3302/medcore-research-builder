import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import { GLOBAL_SYSTEM, refineSectionPrompt } from "@/lib/prompts";
import { callLLM, llmTracking, extractJSON, isLLMConfigured } from "@/lib/llm";
import type { LLMRefineResponse, ResearchTypeAnswersV2 } from "@/lib/types";
import { guidelineById } from "@/lib/guidelines";
import { designById } from "@/lib/registry/designs";
import { buildContextBundle, bundleToPromptBlock } from "@/lib/agents/contextBundle";
import { bundleJournalHints, journalStyleHints } from "@/lib/agents/journalStyle";
import { allJournalSpecs, icmjeGenericFallback } from "@/lib/registry/journals";

export const runtime = "nodejs";

type Body = {
  section: "introduction" | "methods" | "results" | "discussion" | "conclusion";
  guidelineId: string;             // legacy: id of v1 guideline OR design id
  draft: string;
  contextNotes?: string;
  answers?: ResearchTypeAnswersV2; // v2: enables Context Bundle
};

export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "llm");
    if (limited) return limited;
    if (!isLLMConfigured())
      return bad("LLM not configured — set MINIMAX_API_KEY (default), ANTHROPIC_API_KEY, or OPENAI_API_KEY", 503);
    const body = await safeJson<Body>(req, "llm");
    if (!body?.section || !body?.guidelineId)
      return bad("section and guidelineId are required");

    /* Resolve checklist + guideline display name from either design registry or v1 guidelines. */
    let guidelineName = "";
    let checklist: string[] = [];
    const d = designById(body.guidelineId);
    if (d) {
      guidelineName = `${d.primaryGuideline.acronym} — ${d.name}`;
      checklist = (d.reportingChecklist[body.section] || []) as string[];
    } else {
      const g = guidelineById(body.guidelineId);
      if (!g) return bad(`Unknown guideline / design id: ${body.guidelineId}`);
      guidelineName = g.name;
      checklist = (g.checklistPrompts[body.section] || []) as string[];
    }

    /* Build Context Bundle if v2 answers provided. */
    const bundle = body.answers ? buildContextBundle(body.answers) : undefined;
    const contextBlock = bundle ? bundleToPromptBlock(bundle) : "";
    const jSpec =
      body.answers?.journalId &&
      (allJournalSpecs.find((j) => j.id === body.answers!.journalId) ||
        (body.answers.journalId === "icmje-generic" ? icmjeGenericFallback : undefined));
    const journalHints = [
      ...journalStyleHints(jSpec || undefined, body.section),
      ...(bundle ? bundleJournalHints(bundle) : []),
    ];

    const prompt = refineSectionPrompt({
      section: body.section,
      guidelineName,
      checklist,
      draft: body.draft || "",
      contextNotes: body.contextNotes,
      contextBlock,
      journalHints,
    });
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
      tracking: llmTracking(req, "/api/llm/refine-section"),
    });
    const parsed = extractJSON<LLMRefineResponse>(text);
    return ok(parsed);
  } catch (e) {
    return handleError(e);
  }
}
