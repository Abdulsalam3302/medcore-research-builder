import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import { GLOBAL_SYSTEM, REFINE_SECTION_SCHEMA } from "@/lib/prompts";
import { callLLM, llmTracking, extractJSON, isLLMConfigured } from "@/lib/llm";
import type { LLMRefineResponse, ResearchTypeAnswersV2 } from "@/lib/types";
import { designById } from "@/lib/registry/designs";
import { guidelineById } from "@/lib/guidelines";
import { buildContextBundle, bundleToPromptBlock } from "@/lib/agents/contextBundle";
import { bundleJournalHints, journalStyleHints } from "@/lib/agents/journalStyle";
import { allJournalSpecs, icmjeGenericFallback } from "@/lib/registry/journals";
import { summarizePipelineState } from "@/lib/alignment";

export const runtime = "nodejs";

/**
 * Generate a *first draft* of an entire section from the project's context bundle.
 * Used when the author has no text yet. Strictly no fabrication of numbers,
 * citations, or claims that aren't in the project's context.
 */
type Body = {
  section: "introduction" | "methods" | "results" | "discussion" | "conclusion";
  guidelineId: string;
  answers?: ResearchTypeAnswersV2;
  project?: unknown;       // optional full project for cross-step awareness
  contextNotes?: string;
};

export async function POST(req: Request) {
  const rl = await enforceRateLimit(req, "llm");
  if (rl) return rl;
  try {
    if (!isLLMConfigured())
      return bad("LLM not configured — set MINIMAX_API_KEY (default), ANTHROPIC_API_KEY, or OPENAI_API_KEY", 503);
    const body = await safeJson<Body>(req);
    if (!body?.section || !body?.guidelineId)
      return bad("section and guidelineId are required");

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

    const pipelineLines = body.project
      ? summarizePipelineState(body.project as Parameters<typeof summarizePipelineState>[0])
      : [];
    const pipelineBlock = pipelineLines.length
      ? "\nPIPELINE STATE (other steps the author has completed — keep consistent):\n" +
        pipelineLines.map((l) => "- " + l).join("\n") + "\n"
      : "";

    const prompt = `You are generating the FIRST DRAFT of the ${body.section} section of a medical manuscript.

${contextBlock}
${pipelineBlock}

Reporting-guideline (${guidelineName}) checklist items for this section (paraphrased):
${checklist.map((c, i) => `${i + 1}. ${c}`).join("\n") || "(none configured)"}

${journalHints.length ? "JOURNAL STYLE HINTS:\n" + journalHints.map((h) => "- " + h).join("\n") + "\n" : ""}

Author's additional notes:
${body.contextNotes || "(none)"}

STRICT RULES:
- Do NOT invent any numbers (sample sizes, p-values, CIs, effect estimates, dates, doses, prevalence, RR/HR/OR).
- Do NOT invent any citations, references, study names, or author lists.
- Where a number/citation is missing, write "[needs author input: <what is missing>]" inline.
- Do NOT promise novelty, "first ever", "unique", or "unprecedented".
- Stay strictly within the chosen study design — do not write language that contradicts the design.

Tasks:
1. Write a scientifically rigorous first draft of the ${body.section} section in clear, journal-appropriate English.
2. For each checklist item, mark whether the generated draft covers it; if missing, flag it.
3. List the [needs author input] placeholders explicitly in missingInformation.
4. Flag any claims that need a citation under claimsNeedingCitation.
5. Suggest specific PubMed / Crossref search queries the author could run to find supporting evidence.

${REFINE_SECTION_SCHEMA}

Return ONLY the JSON object.`;

    const extraSystem =
      body.section === "results"
        ? "\n\nADDITIONAL RULE: Results section. Numbers, percentages, p-values, confidence intervals, sample sizes, and effect estimates must NEVER be invented. If any is missing, write '[needs author input]' inline and list it in missingInformation."
        : "";

    const text = await callLLM({
      system: GLOBAL_SYSTEM + extraSystem,
      prompt,
      maxTokens: 4000,
      temperature: 0.25,
      jsonOnly: true,
      tracking: llmTracking(req, "/api/llm/generate-section"),
    });
    const parsed = extractJSON<LLMRefineResponse>(text);
    return ok(parsed);
  } catch (e) {
    return handleError(e);
  }
}
