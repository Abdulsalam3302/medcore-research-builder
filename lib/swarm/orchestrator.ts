// Swarm orchestration: build the shared context, and synthesize per-agent
// findings into one layered SwarmReport.
//
// Both functions are PURE (no network, no LLM). synthesizeReport degrades
// gracefully: with zero LLM findings it still produces a valid report driven
// entirely by the deterministic coherence analysis, so the feature works
// offline.

import type { ProjectState } from "@/lib/types";
import { analyzeCoherence, type CoherenceReport } from "@/lib/coherence";
import { AGENT_LAYER } from "./agents";
import type {
  AgentFinding,
  SwarmContext,
  SwarmReport,
  OverallVerdict,
  Severity,
} from "./types";

/** The fixed set of quality layers the swarm scores. */
export const LAYERS = ["quality", "safety", "literature", "peer-review"] as const;
export type Layer = (typeof LAYERS)[number];

function inferDesignLabel(project: ProjectState): string {
  const a = project.researchTypeAnswers || {};
  return (
    a.designId ||
    a.manuscriptType ||
    a.designFamily ||
    project.researchTypeResult?.primaryGuidelineName ||
    "(design not specified)"
  );
}

function excerpt(s: string | undefined, max = 1400): string {
  const t = (s || "").trim();
  if (!t) return "(empty)";
  return t.length > max ? t.slice(0, max) + " …[truncated]" : t;
}

/**
 * Build a compact text context for the agents + fold in deterministic
 * coherence signals so the LLM agents start from real signal.
 */
export function buildSwarmContext(project: ProjectState): SwarmContext {
  const coherence = analyzeCoherence(project);
  const title = project.titleFinal || project.titleInputs?.draftTitle || "(untitled)";
  const design = inferDesignLabel(project);
  const referenceCount = (project.references?.verifications || []).length;
  const s = project.sections || {
    introduction: "",
    methods: "",
    results: "",
    discussion: "",
    conclusion: "",
  };

  const text = [
    `TITLE: ${title}`,
    `DESIGN / MANUSCRIPT TYPE: ${design}`,
    `REFERENCE COUNT (verified entries): ${referenceCount}`,
    "",
    `INTRODUCTION:\n${excerpt(s.introduction)}`,
    `METHODS:\n${excerpt(s.methods)}`,
    `RESULTS:\n${excerpt(s.results)}`,
    `DISCUSSION:\n${excerpt(s.discussion)}`,
    `CONCLUSION:\n${excerpt(s.conclusion)}`,
  ].join("\n\n");

  return {
    text,
    coherenceIssues: coherence.issues.map((i) => ({
      severity: i.severity,
      area: i.area,
      message: i.message,
      relatedSections: i.relatedSections,
      fix: i.fix,
    })),
    coherenceScore: coherence.score,
    title,
    design,
    referenceCount,
  };
}

/* ------------------------------------------------------------------ */
/* Synthesis                                                           */
/* ------------------------------------------------------------------ */

const SEVERITY_PENALTY: Record<Severity, number> = {
  critical: 30,
  major: 15,
  minor: 5,
  praise: -4, // praise nudges the score up (capped at 100)
};

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  major: 1,
  minor: 2,
  praise: 3,
};

/** Dedupe findings that are effectively identical (same agent+severity+issue). */
function dedupeFindings(findings: AgentFinding[]): AgentFinding[] {
  const seen = new Set<string>();
  const out: AgentFinding[] = [];
  for (const f of findings) {
    const key = `${f.agent}|${f.severity}|${f.issue.toLowerCase().replace(/\s+/g, " ").trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  return out;
}

/**
 * Convert deterministic coherence issues into swarm findings so the report is
 * meaningful even when no LLM ran. Coherence is part of the QUALITY layer.
 */
function coherenceToFindings(coherence: CoherenceReport): AgentFinding[] {
  const sevMap: Record<"high" | "medium" | "low", Severity> = {
    high: "critical",
    medium: "major",
    low: "minor",
  };
  return coherence.issues
    .filter((i) => i.id !== "no-content")
    .map((i) => ({
      agent: "methodologist" as const,
      severity: sevMap[i.severity],
      section: i.relatedSections[0],
      issue: `[coherence: ${i.area}] ${i.message}`,
      recommendation: i.fix,
      confidence: "high" as const,
    }));
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Merge per-agent findings into a layered SwarmReport.
 *
 * - Folds deterministic coherence issues into the QUALITY layer.
 * - Dedupes near-identical findings.
 * - Computes a 0–100 scorecard per layer from finding severities.
 * - Derives an overall verdict.
 * - Collects human-review items.
 *
 * Pure & degrade-safe: pass `llmFindings = []` for a coherence-only report.
 */
export function synthesizeReport(
  llmFindings: AgentFinding[],
  coherence: CoherenceReport,
  opts?: { layerSummaries?: Record<string, string>; humanReviewRequired?: string[] },
): SwarmReport {
  const coherenceFindings = coherenceToFindings(coherence);
  const findings = dedupeFindings([...coherenceFindings, ...llmFindings]);

  // Score each layer independently, starting from 100.
  const scorecard: Record<string, number> = {};
  for (const layer of LAYERS) scorecard[layer] = 100;

  for (const f of findings) {
    const layer = (AGENT_LAYER[f.agent] || "quality") as Layer;
    scorecard[layer] = scorecard[layer] - SEVERITY_PENALTY[f.severity];
  }
  for (const layer of LAYERS) scorecard[layer] = clamp(Math.round(scorecard[layer]));

  // Overall verdict from worst severity present + average score.
  const criticalCount = findings.filter((f) => f.severity === "critical").length;
  const majorCount = findings.filter((f) => f.severity === "major").length;
  const avg =
    LAYERS.reduce((sum, l) => sum + scorecard[l], 0) / LAYERS.length;

  let overallVerdict: OverallVerdict;
  if (criticalCount > 0 || avg < 45) overallVerdict = "not-ready";
  else if (majorCount > 2 || avg < 65) overallVerdict = "major-revisions";
  else if (majorCount > 0 || avg < 85) overallVerdict = "minor-revisions";
  else overallVerdict = "ready";

  // Layer summaries: prefer LLM-supplied, else derive a deterministic line.
  const layerSummaries: Record<string, string> = {};
  for (const layer of LAYERS) {
    const supplied = opts?.layerSummaries?.[layer];
    if (supplied && supplied.trim()) {
      layerSummaries[layer] = supplied.trim();
      continue;
    }
    const layerFindings = findings.filter((f) => (AGENT_LAYER[f.agent] || "quality") === layer);
    const crit = layerFindings.filter((f) => f.severity === "critical").length;
    const maj = layerFindings.filter((f) => f.severity === "major").length;
    const min = layerFindings.filter((f) => f.severity === "minor").length;
    const praise = layerFindings.filter((f) => f.severity === "praise").length;
    layerSummaries[layer] =
      layerFindings.length === 0
        ? `No issues flagged for the ${layer} layer.`
        : `Score ${scorecard[layer]}/100 — ${crit} critical, ${maj} major, ${min} minor, ${praise} strengths.`;
  }

  // Human-review items: explicit LLM-collected + always-on safety reminders.
  const humanReviewSet = new Set<string>();
  for (const item of opts?.humanReviewRequired || []) {
    const t = item.trim();
    if (t) humanReviewSet.add(t);
  }
  // Surface critical findings as human-review items too.
  for (const f of findings.filter((f) => f.severity === "critical")) {
    humanReviewSet.add(`Verify (critical, ${f.agent}): ${f.issue}`);
  }
  if (humanReviewSet.size === 0) {
    humanReviewSet.add(
      "Confirm all statistics, clinical claims, and citations against source data before submission.",
    );
  }

  // Stable ordering for findings: critical → praise, then by agent.
  const sorted = [...findings].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      a.agent.localeCompare(b.agent),
  );

  return {
    findings: sorted,
    layerSummaries,
    overallVerdict,
    scorecard,
    humanReviewRequired: Array.from(humanReviewSet),
  };
}
