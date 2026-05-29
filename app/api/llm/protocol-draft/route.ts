import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import { GLOBAL_SYSTEM } from "@/lib/prompts";
import { callLLM, extractJSON, isLLMConfigured } from "@/lib/llm";
import { buildProtocolPrompt, type ProtocolDraftResult } from "@/lib/protocol/generator";
import type { ProjectState } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Draft a full, study-design-aware protocol / proposal with the LLM.
 *
 * The offline deterministic skeleton (buildProtocolSkeleton) is handled
 * CLIENT-SIDE and always works with no API key. This route requires an LLM:
 * if none is configured we return 400 with guidance to use the offline path.
 *
 * Never fabricates numbers — the prompt forbids it and emits placeholders.
 */
type Body = {
  project: ProjectState;
  contextNotes?: string;
};

export async function POST(req: Request) {
  const rl = await enforceRateLimit(req, "llm");
  if (rl) return rl;
  try {
    if (!isLLMConfigured()) {
      return bad(
        "AI drafting requires an LLM (set MINIMAX_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY). " +
          "Use the offline 'Generate skeleton' button instead — it works with no API key.",
        400,
      );
    }

    const body = await safeJson<Body>(req, "llm");
    if (!body?.project || typeof body.project !== "object") {
      return bad("project is required");
    }

    const prompt = buildProtocolPrompt({
      project: body.project,
      contextNotes: typeof body.contextNotes === "string" ? body.contextNotes : undefined,
    });

    const text = await callLLM({
      system: GLOBAL_SYSTEM,
      prompt,
      maxTokens: 4000,
      temperature: 0.2,
      jsonOnly: true,
    });

    const parsed = extractJSON<ProtocolDraftResult>(text);
    return ok(parsed);
  } catch (e) {
    return handleError(e);
  }
}
