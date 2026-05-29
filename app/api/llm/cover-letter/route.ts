import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import { GLOBAL_SYSTEM } from "@/lib/prompts";
import { callLLM, isLLMConfigured } from "@/lib/llm";
import { buildContextBundle, bundleToPromptBlock } from "@/lib/agents/contextBundle";
import type { ProjectState } from "@/lib/types";

export const runtime = "nodejs";

type Body = {
  project: ProjectState;
  recipientEditor?: string;     // "Dear Dr. Smith,"
  journalNameOverride?: string;
  authorName?: string;
  authorAffiliation?: string;
  hint?: string;
};

export async function POST(req: Request) {
  const rl = enforceRateLimit(req, "llm");
  if (rl) return rl;
  try {
    if (!isLLMConfigured()) return bad("LLM not configured", 503);
    const body = await safeJson<Body>(req);
    const p = body.project;
    if (!p) return bad("project is required");

    const bundle = buildContextBundle(p.researchTypeAnswers || {});
    const ctxBlock = bundleToPromptBlock(bundle);
    const journalName = body.journalNameOverride || bundle.journal?.name || "the journal";
    const title = p.titleFinal || p.titleInputs.draftTitle || "(untitled)";
    const novelty = p.noveltyReport
      ? `Novelty risk reported: ${p.noveltyReport.risk}. Differentiator notes (from author): ${p.researchTypeAnswers?.notes || "none"}.`
      : "No novelty scan run.";
    const introExcerpt = (p.sections.introduction || "").slice(0, 800);
    const conclusionExcerpt = (p.sections.conclusion || "").slice(0, 600);

    const prompt = `Draft a concise (~250–350 word) cover letter from the corresponding author to the editor of ${journalName}, suitable for ICMJE-style submission.

${ctxBlock}

MANUSCRIPT
- Title: ${title}
- Introduction excerpt: ${introExcerpt || "(empty)"}
- Conclusion excerpt: ${conclusionExcerpt || "(empty)"}
- ${novelty}
- Author signature: ${body.authorName || "[Author Name]"}, ${body.authorAffiliation || "[Affiliation]"}

OPENING
${body.recipientEditor || "Dear Editor,"}

REQUIRED ELEMENTS
1. One short paragraph: what the manuscript is and why it fits the journal's scope (use the journal lens if available).
2. One paragraph: the question, design (be specific to the design from the context bundle), and the headline finding stated cautiously and proportional to the design.
3. One paragraph: novelty / contribution differentiator. If novelty risk is moderate-or-higher, explicitly state how this work differs from prior literature.
4. ICMJE statements: original work, not under consideration elsewhere, all authors approved, conflicts disclosed, ethics/IRB cleared if applicable, data-sharing intent.
${bundle.journal?.required.aiDisclosure ? "5. AI-assistance disclosure (ICMJE 2026): mention any AI tools used and that authors take full responsibility.\n" : ""}

RULES
- Do NOT invent numbers, citations, or specific outcomes. If a number isn't in the excerpts above, refer to it qualitatively (e.g., "a clinically meaningful reduction").
- Do NOT use marketing words ("groundbreaking", "novel discovery") unless novelty risk = low and the author flagged it.
- Plain professional tone, no headings, no bullet points in the final letter.
${body.hint ? `- Author hint: ${body.hint}\n` : ""}

Return ONLY this JSON:
{"letter": "string (full plain-text cover letter)", "warnings": ["string"]}`;

    const text = await callLLM({
      system: GLOBAL_SYSTEM,
      prompt,
      jsonOnly: true,
      maxTokens: 1500,
    });
    let parsed: { letter?: string; warnings?: string[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      const m = text.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { letter: text, warnings: [] };
    }
    return ok({ letter: parsed.letter || "", warnings: parsed.warnings || [] });
  } catch (e) {
    return handleError(e);
  }
}
