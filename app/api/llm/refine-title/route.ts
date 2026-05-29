import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import { GLOBAL_SYSTEM, refineTitlePrompt } from "@/lib/prompts";
import { callLLM, extractJSON, isLLMConfigured } from "@/lib/llm";
import type { ResearchTypeAnswersV2 } from "@/lib/types";
import { buildContextBundle, bundleToPromptBlock } from "@/lib/agents/contextBundle";
import { bundleJournalHints, journalStyleHints } from "@/lib/agents/journalStyle";
import { allJournalSpecs, icmjeGenericFallback } from "@/lib/registry/journals";
import { detectTitleConflicts } from "@/lib/alignment";

export const runtime = "nodejs";

type Body = {
  mode?: "generate" | "refine";
  inputs?: Record<string, string>;
  answers?: ResearchTypeAnswersV2;
};

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
    if (!body?.inputs) return bad("Missing inputs");

    const bundle = body.answers ? buildContextBundle(body.answers) : undefined;
    const contextBlock = bundle ? bundleToPromptBlock(bundle) : "";
    const jSpec =
      body.answers?.journalId &&
      (allJournalSpecs.find((j) => j.id === body.answers!.journalId) ||
        (body.answers.journalId === "icmje-generic" ? icmjeGenericFallback : undefined));
    const journalHints = [
      ...journalStyleHints(jSpec || undefined, "title"),
      ...(bundle ? bundleJournalHints(bundle) : []),
    ];

    /* Deterministic cross-step conflict detection *before* the LLM call. */
    const designId = body.answers?.designId;
    const draftConflicts = detectTitleConflicts(
      designId,
      (body.inputs as Record<string, string>).draftTitle || ""
    );

    const conflictNote = draftConflicts.length
      ? `\n\nIMPORTANT — DESIGN-vs-TITLE CONFLICTS DETECTED:\n${draftConflicts
          .map(
            (c) => `- The title contains "${c.keyword}" which conflicts with the chosen design. ${c.reason}`
          )
          .join("\n")}\nYou MUST: (a) explicitly flag this in the rationale and warnings of each candidate; (b) propose corrected titles that REMOVE or RECONCILE the conflicting term while preserving the author's intent; (c) ask the author to confirm whether they meant to change the design OR the title.\n`
      : "";

    const basePrompt = refineTitlePrompt({
      mode: body.mode || "refine",
      inputs: body.inputs,
      contextBlock,
      journalHints,
    });

    const validationRules = `
SCIENTIFIC ALIGNMENT — multi-check the entire pipeline:
- The title's study-design phrase MUST match the selected design.
- The title's population/intervention/outcome MUST be consistent with the project context above.
- If anything in the inputs contradicts the chosen design (e.g. "retrospective" in a cross-sectional study), emit a warning AND propose a corrected title.
- Do not use "novel", "first", "unique", "unprecedented", "groundbreaking" without supplied evidence.
- Stay within the journal's title length and style hints.
`;

    const text = await callLLM({
      system: GLOBAL_SYSTEM,
      prompt: basePrompt + validationRules + conflictNote,
      maxTokens: 1800,
      temperature: 0.4,
      jsonOnly: true,
    });
    const parsed = extractJSON<{
      candidates: Array<{ text: string; rationale: string; warnings: string[] }>;
    }>(text);

    /* Post-flight: enrich each candidate's warnings with deterministic checks. */
    const enriched = (parsed.candidates || []).map((c) => {
      const issues = detectTitleConflicts(designId, c.text);
      if (issues.length === 0) return c;
      return {
        ...c,
        warnings: [
          ...(c.warnings || []),
          ...issues.map((i) => `Design conflict: "${i.keyword}" — ${i.reason}`),
        ],
      };
    });

    return ok({
      candidates: enriched,
      designConflicts: draftConflicts,
    });
  } catch (e) {
    return handleError(e);
  }
}
