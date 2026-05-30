// Agent prompt builders for the peer-review swarm.
//
// Each agent is a PURE prompt-builder + parser. The route runs them (one
// callLLM each) and parses with extractJSON. Every agent inherits the
// no-fabrication ethos from lib/prompts.ts: never invent data, references,
// DOIs, p-values, CIs, or clinical claims.

import { GLOBAL_SYSTEM } from "@/lib/prompts";
import type {
  AgentRole,
  AgentPromptSpec,
  SwarmContext,
  RawAgentResponse,
  AgentFinding,
  Severity,
  Confidence,
} from "./types";

export const ALL_AGENTS: AgentRole[] = [
  "methodologist",
  "statistician",
  "literature-scout",
  "peer-reviewer",
  "editor",
  "integrity-officer",
  "clarity-editor",
  "reproducibility-checker",
];

/** Human-facing labels for each role. */
export const AGENT_LABELS: Record<AgentRole, string> = {
  methodologist: "Methodologist",
  statistician: "Statistician",
  "literature-scout": "Literature scout",
  "peer-reviewer": "Peer reviewer",
  editor: "Editor",
  "integrity-officer": "Research integrity officer",
  "clarity-editor": "Clarity editor",
  "reproducibility-checker": "Reproducibility checker",
};

/**
 * Which quality LAYER each agent feeds into. Layers are the
 * "layers of quality/safety/literature/peer-review" the swarm synthesizes.
 */
export const AGENT_LAYER: Record<AgentRole, string> = {
  methodologist: "quality",
  statistician: "quality",
  "literature-scout": "literature",
  "peer-reviewer": "peer-review",
  editor: "peer-review",
  "integrity-officer": "safety",
  "clarity-editor": "quality",
  "reproducibility-checker": "safety",
};

const NO_FAB = `Hard rules — never violate:
- NEVER fabricate data, references, PMIDs, DOIs, citations, outcomes, p-values, confidence intervals, sample sizes, effect estimates, or clinical claims.
- Only reason about what is actually present in the manuscript context provided. If something is missing, say it is missing — do NOT invent it.
- Keep every critique proportional to the study design. Do not assert a finding is wrong unless the text supports that judgment.
- You may suggest SEARCH QUERIES the author could run, but you may NOT name specific papers, authors, or DOIs as if they exist.`;

const LENS: Record<AgentRole, string> = {
  methodologist:
    "You are a senior research methodologist. Examine alignment between study design and the claims made, compliance with the relevant reporting guideline (EQUATOR), and bias risks (selection, measurement, confounding, attrition, reverse causality). Flag where the design cannot support the stated conclusions.",
  statistician:
    "You are a biostatistician. Examine appropriateness of statistical tests for the data/design, presence of effect sizes with confidence intervals (not just p-values), multiplicity / multiple-comparison handling, and missing-data handling. Flag p-hacking or overfitting signals. Do not invent any statistic that is not in the text.",
  "literature-scout":
    "You are a literature-positioning specialist. Identify gaps in citation and scholarly positioning: claims that need a citation, prior-work framing that seems thin, and where the contribution is under- or over-positioned relative to the field. Your recommendations MUST take the form of concrete SEARCH QUERIES (PubMed/Crossref-style) the author can run. NEVER fabricate papers, authors, or DOIs.",
  "peer-reviewer":
    "You are a critical but fair journal peer reviewer. Produce a balanced critique: genuine strengths (use severity 'praise'), substantive weaknesses, and specific questions the authors must answer. Quote or reference the relevant section. Simulate the lens of someone deciding whether to recommend acceptance.",
  editor:
    "You are a journal editor screening for desk-reject and fit. Examine scope fit, framing of novelty and significance, clarity of the take-home message, and structural/length red flags. Flag overclaimed novelty ('first', 'novel', 'unprecedented') that the evidence does not support.",
  "integrity-officer":
    "You are a research-integrity officer. Examine overclaiming relative to evidence, signs of p-hacking or selective reporting, presence/absence of a data-availability statement, ethics/consent/registration statements, and AI-use disclosure (ICMJE). Flag any conclusion stronger than the data supports. This is the safety layer — be conservative and explicit.",
  "clarity-editor":
    "You are a scientific clarity editor. Examine readability, logical structure, and unexplained jargon — WITHOUT changing scientific meaning. Recommend concrete edits (split a run-on, define a term, reorder for logical flow). Do not propose changes that alter any reported fact or claim.",
  "reproducibility-checker":
    "You are a reproducibility checker. Examine whether the Methods give enough detail to independently reproduce the study (eligibility, sampling, instruments, analysis steps, software/versions), and whether data and code availability are stated. Flag every missing detail required for replication.",
};

const SCHEMA = `Return ONLY this JSON (no prose, no markdown fences):
{
  "summary": "string — 1-2 sentence summary of this agent's overall read",
  "findings": [
    {
      "severity": "critical|major|minor|praise",
      "section": "title|abstract|introduction|methods|results|discussion|conclusion|references|overall",
      "issue": "string — what you observed (specific, grounded in the provided text)",
      "recommendation": "string — concrete, actionable next step",
      "confidence": "high|medium|low"
    }
  ],
  "humanReviewRequired": ["string — items a human expert must verify (e.g., a clinical claim, a statistic, a citation)"]
}`;

/**
 * Build a ready-to-run prompt for a single agent role over the given context.
 * Pure: no side effects, no network.
 */
export function buildAgentPrompt(role: AgentRole, ctx: SwarmContext): AgentPromptSpec {
  const system = `${GLOBAL_SYSTEM}

${NO_FAB}

ROLE: ${AGENT_LABELS[role]}.
${LENS[role]}`;

  const coherenceBlock = ctx.coherenceIssues.length
    ? ctx.coherenceIssues
        .slice(0, 12)
        .map(
          (i) =>
            `- [${i.severity}] (${i.area}) ${i.message} — suggested fix: ${i.fix}`,
        )
        .join("\n")
    : "(no deterministic coherence issues detected)";

  const prompt = `You are reviewing the manuscript below through your specific lens. Other specialist agents cover other lenses — focus on yours and avoid generic comments outside your remit.

MANUSCRIPT CONTEXT:
"""
${ctx.text}
"""

DETERMINISTIC COHERENCE SIGNALS (already computed — fold these in, do not re-derive; build on or qualify them as relevant to your lens):
${coherenceBlock}

Tasks:
1. Apply your lens to the manuscript and produce specific, grounded findings. Reference the section each finding relates to.
2. Use severity "praise" for genuine strengths; "critical" only for issues that would block submission; "major" for substantive problems; "minor" for smaller fixes.
3. Set confidence honestly — "low" when the context is too thin to be sure.
4. List under humanReviewRequired anything a human expert must verify (clinical claims, specific statistics, specific citations) — never assert these yourself.
5. Stay strictly within the no-fabrication rules above.

${SCHEMA}`;

  return { system, prompt, schema: SCHEMA };
}

/* ------------------------------------------------------------------ */
/* Parsing / normalization                                             */
/* ------------------------------------------------------------------ */

const SEVERITIES: Severity[] = ["critical", "major", "minor", "praise"];
const CONFIDENCES: Confidence[] = ["high", "medium", "low"];

function coerceSeverity(s: unknown): Severity {
  const v = String(s || "").toLowerCase();
  return (SEVERITIES as string[]).includes(v) ? (v as Severity) : "minor";
}

function coerceConfidence(c: unknown): Confidence {
  const v = String(c || "").toLowerCase();
  return (CONFIDENCES as string[]).includes(v) ? (v as Confidence) : "medium";
}

/**
 * Normalize a raw parsed agent response into typed findings + a summary +
 * any human-review flags. Defensive: tolerates missing/odd fields.
 */
export function parseAgentResponse(
  role: AgentRole,
  raw: RawAgentResponse,
): { findings: AgentFinding[]; summary: string; humanReviewRequired: string[] } {
  const findings: AgentFinding[] = (raw.findings || [])
    .filter((f) => f && (f.issue || f.recommendation))
    .map((f) => ({
      agent: role,
      severity: coerceSeverity(f.severity),
      section: f.section ? String(f.section) : undefined,
      issue: String(f.issue || "").trim() || "(no detail provided)",
      recommendation: String(f.recommendation || "").trim() || "(no recommendation provided)",
      confidence: coerceConfidence(f.confidence),
    }));

  const humanReviewRequired = Array.isArray(raw.humanReviewRequired)
    ? raw.humanReviewRequired.map((x) => String(x).trim()).filter(Boolean)
    : [];

  return {
    findings,
    summary: String(raw.summary || "").trim(),
    humanReviewRequired,
  };
}
