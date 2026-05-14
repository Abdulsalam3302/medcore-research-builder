import { bad, handleError, ok, safeJson } from "../../_utils";
import { callLLM, extractJSON, isLLMConfigured } from "@/lib/llm";
import { GLOBAL_SYSTEM, parseReferencesPrompt } from "@/lib/prompts";
import { parseReferenceBlock } from "@/lib/references/parser";

export const runtime = "nodejs";

type Body = { raw: string };

export async function POST(req: Request) {
  try {
    const body = await safeJson<Body>(req);
    if (!body?.raw || !body.raw.trim()) return bad("raw text is required");

    if (!isLLMConfigured()) {
      const refs = parseReferenceBlock(body.raw);
      return ok({ references: refs, _source: "heuristic" });
    }

    const text = await callLLM({
      system: GLOBAL_SYSTEM,
      prompt: parseReferencesPrompt(body.raw),
      maxTokens: 4000,
      temperature: 0.0,
      jsonOnly: true,
    });
    try {
      const data = extractJSON<{ references: Array<{ originalText: string; parsed: Record<string, unknown> }> }>(text);
      return ok({ references: data.references, _source: "llm" });
    } catch {
      // Fallback to heuristic
      const refs = parseReferenceBlock(body.raw);
      return ok({ references: refs, _source: "heuristic-fallback" });
    }
  } catch (e) {
    return handleError(e);
  }
}
