import { bad, handleError, ok, safeJson, enforceRateLimit } from "../../_utils";
import { GLOBAL_SYSTEM } from "@/lib/prompts";
import { callLLM, llmTracking, isLLMConfigured } from "@/lib/llm";
import { buildContextBundle, bundleToPromptBlock } from "@/lib/agents/contextBundle";
import type { ProjectState } from "@/lib/types";

export const runtime = "nodejs";

type Persona = "statistician" | "methodologist" | "editor";

const PERSONAS: Record<Persona, { label: string; mandate: string }> = {
  statistician: {
    label: "Statistical reviewer",
    mandate:
      "Focus on study design rigour, statistical methods (assumptions, model specification, multiplicity, missing data, sample size justification), reporting of effect sizes with CIs, and any p-hacking / overfitting risks. Be specific. Quote text.",
  },
  methodologist: {
    label: "Methodologist reviewer",
    mandate:
      "Focus on internal validity, threats to causal inference (selection / measurement / confounding / reverse causality), reporting-guideline adherence, transparency (registration, protocol, data sharing), and replication risk.",
  },
  editor: {
    label: "Editor",
    mandate:
      "Focus on scope fit, novelty contribution, clarity of the take-home message, structure, length vs. journal limit, presentation quality, and red-flag desk-reject risk. Decide: accept-with-revisions / major / reject.",
  },
};

type Body = {
  project: ProjectState;
  personas?: Persona[];
};

export async function POST(req: Request) {
  const rl = await enforceRateLimit(req, "llm");
  if (rl) return rl;
  try {
    if (!isLLMConfigured()) return bad("LLM not configured", 503);
    const body = await safeJson<Body>(req);
    const p = body.project;
    if (!p) return bad("project is required");
    const personas = (body.personas?.length ? body.personas : (Object.keys(PERSONAS) as Persona[])) as Persona[];

    const bundle = buildContextBundle(p.researchTypeAnswers || {});
    const ctxBlock = bundleToPromptBlock(bundle);
    const journalLens = bundle.journal?.reviewerLens?.join(" / ") || "";
    const editorLens = bundle.journal?.editorLens?.join(" / ") || "";
    const title = p.titleFinal || p.titleInputs.draftTitle || "(untitled)";

    const sectionExcerpt = (s?: string) => (s || "").slice(0, 1200);
    const sections = `
TITLE: ${title}

INTRODUCTION:
${sectionExcerpt(p.sections.introduction)}

METHODS:
${sectionExcerpt(p.sections.methods)}

RESULTS:
${sectionExcerpt(p.sections.results)}

DISCUSSION:
${sectionExcerpt(p.sections.discussion)}

CONCLUSION:
${sectionExcerpt(p.sections.conclusion)}
`.trim();

    const reviews: Array<{
      persona: Persona;
      label: string;
      verdict?: "accept" | "minor" | "major" | "reject";
      summary?: string;
      majorIssues?: string[];
      minorIssues?: string[];
      requestedRevisions?: string[];
      questionsForAuthors?: string[];
      raw?: string;
    }> = [];

    for (const persona of personas) {
      const meta = PERSONAS[persona];
      const lensHint =
        persona === "editor" && editorLens
          ? `Editor lens for this journal: ${editorLens}`
          : persona !== "editor" && journalLens
          ? `Journal reviewer lens: ${journalLens}`
          : "";
      const prompt = `You are simulating a peer-review pass as a ${meta.label}. ${meta.mandate}
Be honest, specific, and constructive. Quote phrasing where relevant. Do not invent statistics.

${ctxBlock}
${lensHint ? `\n${lensHint}\n` : ""}

MANUSCRIPT
${sections}

Return ONLY this JSON:
{
  "verdict": "accept|minor|major|reject",
  "summary": "string (2–3 sentences)",
  "majorIssues": ["string"],
  "minorIssues": ["string"],
  "requestedRevisions": ["string"],
  "questionsForAuthors": ["string"]
}`;

      const text = await callLLM({
        system: GLOBAL_SYSTEM,
        prompt,
        jsonOnly: true,
        maxTokens: 1500,
      tracking: llmTracking(req, "/api/llm/reviewer-simulator"),
    });
      let parsed: typeof reviews[number];
      try {
        parsed = JSON.parse(text);
      } catch {
        const m = text.match(/\{[\s\S]*\}/);
        parsed = m ? JSON.parse(m[0]) : { raw: text };
      }
      reviews.push({ ...parsed, persona, label: meta.label });
    }

    return ok({ reviews });
  } catch (e) {
    return handleError(e);
  }
}
