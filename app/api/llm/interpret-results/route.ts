import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import { callLLM, extractJSON, isLLMConfigured } from "@/lib/llm";
import {
  buildResultsInterpretationPrompt,
  RESULTS_INTERPRETATION_SYSTEM,
  type ResultsInterpretation,
  type ResultsInterpretationArgs,
} from "@/lib/results/interpret";

export const runtime = "nodejs";

/**
 * Interpret a manuscript Results section. AI-assisted interpretation only —
 * never fabricates numbers, always foregrounds effect size + CI + uncertainty,
 * and flags items needing human review. Mirrors the other /api/llm routes.
 */
type Body = Partial<ResultsInterpretationArgs>;

export async function POST(req: Request) {
  const rl = await enforceRateLimit(req, "llm");
  if (rl) return rl;
  try {
    if (!isLLMConfigured())
      return bad(
        "LLM not configured — set MINIMAX_API_KEY (default), ANTHROPIC_API_KEY, or OPENAI_API_KEY in .env.local",
      );
    const body = await safeJson<Body>(req, "llm");
    if (!body?.resultsText || !body.resultsText.trim())
      return bad("resultsText is required");

    const prompt = buildResultsInterpretationPrompt({
      resultsText: body.resultsText,
      dataContext: body.dataContext,
      designLabel: body.designLabel,
      primaryOutcome: body.primaryOutcome,
      outcomeType: body.outcomeType,
      groups: body.groups,
      randomized: body.randomized,
    });

    const text = await callLLM({
      system: RESULTS_INTERPRETATION_SYSTEM,
      prompt,
      maxTokens: 4000,
      temperature: 0.2,
      jsonOnly: true,
    });
    const parsed = extractJSON<ResultsInterpretation>(text);
    return ok(parsed);
  } catch (e) {
    return handleError(e);
  }
}
