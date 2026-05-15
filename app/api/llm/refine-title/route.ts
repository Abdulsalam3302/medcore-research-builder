import { bad, handleError, ok, safeJson } from "../../_utils";
import { GLOBAL_SYSTEM, refineTitlePrompt } from "@/lib/prompts";
import { callLLM, extractJSON, isLLMConfigured } from "@/lib/llm";
import type { ResearchTypeAnswersV2 } from "@/lib/types";
import { buildContextBundle, bundleToPromptBlock } from "@/lib/agents/contextBundle";
import { bundleJournalHints, journalStyleHints } from "@/lib/agents/journalStyle";
import { allJournalSpecs, icmjeGenericFallback } from "@/lib/registry/journals";

export const runtime = "nodejs";

type Body = {
  mode?: "generate" | "refine";
  inputs?: Record<string, string>;
  answers?: ResearchTypeAnswersV2;
};

export async function POST(req: Request) {
  try {
    if (!isLLMConfigured())
      return bad("LLM not configured — set MINIMAX_API_KEY (default), ANTHROPIC_API_KEY, or OPENAI_API_KEY", 503);
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

    const text = await callLLM({
      system: GLOBAL_SYSTEM,
      prompt: refineTitlePrompt({
        mode: body.mode || "refine",
        inputs: body.inputs,
        contextBlock,
        journalHints,
      }),
      maxTokens: 1800,
      temperature: 0.4,
      jsonOnly: true,
    });
    const parsed = extractJSON<{
      candidates: Array<{ text: string; rationale: string; warnings: string[] }>;
    }>(text);
    return ok(parsed);
  } catch (e) {
    return handleError(e);
  }
}
