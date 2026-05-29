import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import { GLOBAL_SYSTEM } from "@/lib/prompts";
import { callLLM, extractJSON, isLLMConfigured } from "@/lib/llm";
import type { ResearchTypeAnswersV2 } from "@/lib/types";
import { buildContextBundle, bundleToPromptBlock } from "@/lib/agents/contextBundle";

export const runtime = "nodejs";

/**
 * Help the author satisfy a single checklist item that's currently missing
 * or partially covered. Either drafts a sentence using *only* facts already
 * in the project, or returns a list of specific questions for the author.
 * Never fabricates.
 */
type Body = {
  item: string;                      // checklist item text
  section: "introduction" | "methods" | "results" | "discussion" | "conclusion";
  currentDraft: string;
  answers?: ResearchTypeAnswersV2;
};

export async function POST(req: Request) {
  const rl = enforceRateLimit(req, "llm");
  if (rl) return rl;
  try {
    if (!isLLMConfigured())
      return bad("LLM not configured — set MINIMAX_API_KEY (default), ANTHROPIC_API_KEY, or OPENAI_API_KEY", 503);
    const body = await safeJson<Body>(req);
    if (!body?.item || !body?.section) return bad("item and section are required");

    const bundle = body.answers ? buildContextBundle(body.answers) : undefined;
    const contextBlock = bundle ? bundleToPromptBlock(bundle) : "";

    const prompt = `Help the author satisfy a single reporting-guideline checklist item.

${contextBlock}

Section: ${body.section}
Checklist item: "${body.item}"
Author's current draft of this section:
"""
${body.currentDraft || "(empty)"}
"""

Decide between TWO options:
(A) If the project context (above) already contains enough factual material to satisfy this item, draft a short paragraph (1-3 sentences) that satisfies it using ONLY those facts — no fabrication.
(B) If the context does NOT contain enough information, return a list of specific questions the author must answer to satisfy the item.

Hard rules:
- NEVER invent numbers, p-values, CIs, sample sizes, doses, dates, PMIDs, DOIs, or citations.
- NEVER claim novelty, causality, or generalisability not supported by the design.
- Prefer asking the author over guessing.

Return ONLY this JSON:
{
  "canDraft": true|false,
  "draftAddition": "string (text to append/insert into the section if canDraft, else empty)",
  "questionsForAuthor": ["string"],
  "rationale": "string (one sentence)"
}`;

    const text = await callLLM({
      system: GLOBAL_SYSTEM,
      prompt,
      maxTokens: 900,
      temperature: 0.15,
      jsonOnly: true,
    });
    const parsed = extractJSON<{
      canDraft: boolean;
      draftAddition: string;
      questionsForAuthor: string[];
      rationale: string;
    }>(text);
    return ok(parsed);
  } catch (e) {
    return handleError(e);
  }
}
