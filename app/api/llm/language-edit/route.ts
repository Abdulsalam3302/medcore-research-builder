import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import { callLLM, extractJSON, isLLMConfigured } from "@/lib/llm";
import { GLOBAL_SYSTEM } from "@/lib/prompts";
import {
  buildLanguageEditPrompt,
  readabilityDelta,
  type LanguageEditLLMResponse,
  type LanguageEditArgs,
} from "@/lib/language/editor";

export const runtime = "nodejs";

type Body = {
  text: string;
  section?: string;
  targetAudience?: string;
  englishVariant?: "US" | "UK";
  notes?: string;
};

const LANGUAGE_EDIT_SYSTEM =
  GLOBAL_SYSTEM +
  `

ADDITIONAL RULES FOR THIS REQUEST — LANGUAGE EDITING:
- This is a copy-editing task. Improve clarity, grammar, academic tone, flow, and readability ONLY.
- PRESERVE meaning exactly. Never add, remove, or change any data, number, statistic, citation, reference marker, DOI/PMID, figure/table call-out, or claim, and never strengthen or weaken the author's conclusions.
- Aim for a human, natural academic register (varied sentence length, no robotic uniformity, no filler).
- You are an editing AID. Do NOT claim or imply the output is "AI-undetectable" or "plagiarism-free"; you cannot guarantee that. Flag anything uncertain instead of inventing.`;

export async function POST(req: Request) {
  try {
    const limited = await enforceRateLimit(req, "llm");
    if (limited) return limited;

    if (!isLLMConfigured())
      return bad(
        "LLM not configured — set MINIMAX_API_KEY (default), ANTHROPIC_API_KEY, or OPENAI_API_KEY in .env.local to enable language editing.",
        400
      );

    const body = await safeJson<Body>(req, "llm");
    const text = (body?.text || "").trim();
    if (!text) return bad("text is required");

    const args: LanguageEditArgs = {
      text,
      section: body.section,
      targetAudience: body.targetAudience,
      englishVariant: body.englishVariant === "UK" ? "UK" : "US",
      notes: body.notes,
    };

    const prompt = buildLanguageEditPrompt(args);
    const raw = await callLLM({
      system: LANGUAGE_EDIT_SYSTEM,
      prompt,
      maxTokens: 4000,
      temperature: 0.3,
      jsonOnly: true,
    });

    const parsed = extractJSON<LanguageEditLLMResponse>(raw);
    const editedText = parsed.editedText || "";

    const readability = readabilityDelta(text, editedText);

    return ok({
      editedText,
      changes: Array.isArray(parsed.changes) ? parsed.changes : [],
      preservedClaims: Array.isArray(parsed.preservedClaims)
        ? parsed.preservedClaims
        : [],
      registerNotes: Array.isArray(parsed.registerNotes)
        ? parsed.registerNotes
        : [],
      uncertainties: Array.isArray(parsed.uncertainties)
        ? parsed.uncertainties
        : [],
      readability,
    });
  } catch (e) {
    return handleError(e);
  }
}
