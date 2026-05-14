import { bad, handleError, ok, safeJson } from "../../_utils";
import { GLOBAL_SYSTEM, refineTitlePrompt } from "@/lib/prompts";
import { callLLM, extractJSON, isLLMConfigured } from "@/lib/llm";

export const runtime = "nodejs";

type Body = {
  mode?: "generate" | "refine";
  inputs?: Record<string, string>;
};

export async function POST(req: Request) {
  try {
    if (!isLLMConfigured())
      return bad("LLM not configured — set ANTHROPIC_API_KEY or OPENAI_API_KEY", 503);
    const body = await safeJson<Body>(req);
    if (!body?.inputs) return bad("Missing inputs");
    const text = await callLLM({
      system: GLOBAL_SYSTEM,
      prompt: refineTitlePrompt({ mode: body.mode || "refine", inputs: body.inputs }),
      maxTokens: 1500,
      temperature: 0.4,
      jsonOnly: true,
    });
    const parsed = extractJSON<{ candidates: Array<{ text: string; rationale: string; warnings: string[] }> }>(text);
    return ok(parsed);
  } catch (e) {
    return handleError(e);
  }
}
