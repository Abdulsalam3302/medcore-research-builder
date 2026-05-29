import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import { GLOBAL_SYSTEM } from "@/lib/prompts";
import { callLLM, isLLMConfigured } from "@/lib/llm";
import type { ResearchTypeAnswersV2 } from "@/lib/types";
import { buildContextBundle, bundleToPromptBlock } from "@/lib/agents/contextBundle";

export const runtime = "nodejs";

/**
 * General-purpose "AI enhance" endpoint.
 * Takes a short user input + the project's context bundle and polishes it
 * without fabricating new facts. Used by TitleLab and section sub-fields.
 */

type Body = {
  field: string;             // e.g. "population", "intervention", "primaryOutcome"
  value: string;             // current user-entered text
  answers?: ResearchTypeAnswersV2;
  hint?: string;             // optional instruction (e.g., "make this PICO-formatted")
};

export async function POST(req: Request) {
  const rl = enforceRateLimit(req, "llm");
  if (rl) return rl;
  try {
    if (!isLLMConfigured())
      return bad("LLM not configured — set MINIMAX_API_KEY (default), ANTHROPIC_API_KEY, or OPENAI_API_KEY", 503);
    const body = await safeJson<Body>(req);
    if (!body?.field) return bad("field is required");

    const bundle = body.answers ? buildContextBundle(body.answers) : undefined;
    const contextBlock = bundle ? bundleToPromptBlock(bundle) : "";

    const prompt = `You are polishing a short user input for a medical-manuscript field. ${
      contextBlock ? "Use the manuscript context for consistency, but do NOT add facts that aren't in the input or context.\n\n" + contextBlock + "\n\n" : ""
    }

Field: ${body.field}
Original value (may be empty): "${body.value || ""}"
${body.hint ? `Author hint: ${body.hint}\n` : ""}

Rules:
- Do NOT invent numbers, p-values, sample sizes, drug doses, journal names, dates, or other specifics that the user did not provide.
- Keep medical terminology accurate and concise.
- If the field is empty AND the manuscript context contains enough information to fill it factually, propose a single concise value derived ONLY from that context (no fabrication). Otherwise return the field with minor wording improvements, or leave it empty and explain in 'note'.
- The result must read as if a careful clinician-researcher wrote it.

Return ONLY this JSON:
{"value": "string (cleaned/expanded value)", "note": "string (one short sentence; empty string if nothing to note)"}`;

    const text = await callLLM({
      system: GLOBAL_SYSTEM,
      prompt,
      maxTokens: 400,
      temperature: 0.2,
      jsonOnly: true,
    });

    // Try to parse the JSON; on failure, return the raw text as value.
    try {
      const parsed = JSON.parse(
        text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "")
      );
      return ok({ value: String(parsed.value || ""), note: String(parsed.note || "") });
    } catch {
      return ok({ value: text.replace(/^"|"$/g, "").trim(), note: "" });
    }
  } catch (e) {
    return handleError(e);
  }
}
