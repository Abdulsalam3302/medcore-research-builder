/**
 * Manuscript evaluation harness.
 *
 * Provides a deterministic, multi-dimension scorecard for a manuscript so the
 * platform can answer "is this draft improving?" objectively and repeatably.
 * Pure + offline — composes the existing coherence + reference-safety signals
 * with new readability/completeness/compliance/rigor dimensions, and supports
 * BEFORE/AFTER comparison (multi-trial evaluation) to prove an edit was a net
 * positive.
 */

import type { ProjectState } from "@/lib/types";
import { analyzeCoherence } from "@/lib/coherence";

export type EvalDimension =
  | "completeness"
  | "coherence"
  | "rigor"
  | "reporting-compliance"
  | "readability"
  | "citation-integrity"
  | "originality-signal";

export type DimensionScore = {
  dimension: EvalDimension;
  score: number; // 0..100
  weight: number; // contribution to overall
  detail: string;
  signals: string[];
};

export type ManuscriptEvaluation = {
  overall: number; // 0..100 weighted
  grade: "A" | "B" | "C" | "D" | "F";
  dimensions: DimensionScore[];
  strengths: string[];
  gaps: string[];
  evaluatedAt: string;
};

export type EvalDelta = {
  before: ManuscriptEvaluation;
  after: ManuscriptEvaluation;
  overallDelta: number;
  perDimension: Array<{ dimension: EvalDimension; delta: number }>;
  verdict: "clear-improvement" | "minor-improvement" | "no-change" | "regression";
  summary: string;
};

const SECTION_KEYS = ["introduction", "methods", "results", "discussion", "conclusion"] as const;

function words(s?: string): number {
  return (s || "").trim() ? (s || "").trim().split(/\s+/).length : 0;
}

function sentences(s: string): string[] {
  return (s || "").split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean);
}

/** Lightweight Flesch-style readability proxy → 0..100 (higher = clearer). */
function readabilityScore(text: string): { score: number; detail: string } {
  const sents = sentences(text);
  const wds = (text || "").trim().split(/\s+/).filter(Boolean);
  if (sents.length === 0 || wds.length === 0) return { score: 0, detail: "No prose to assess." };
  const avgSentLen = wds.length / sents.length;
  // Penalize very long sentences; academic sweet spot ≈ 18-25 words.
  let score = 100;
  if (avgSentLen > 30) score -= (avgSentLen - 30) * 2.5;
  else if (avgSentLen > 25) score -= (avgSentLen - 25) * 1.5;
  else if (avgSentLen < 10) score -= (10 - avgSentLen) * 2;
  // Penalize uniformity (robotic) — low stdev of sentence length.
  const lens = sents.map((s) => s.split(/\s+/).length);
  const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
  const variance = lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length;
  const stdev = Math.sqrt(variance);
  if (lens.length > 4 && stdev < 3) score -= 8;
  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, detail: `avg sentence ${avgSentLen.toFixed(1)} words, variation ${stdev.toFixed(1)}` };
}

function completeness(project: ProjectState): DimensionScore {
  const present = SECTION_KEYS.filter((k) => words(project.sections?.[k]) >= 40);
  const hasTitle = Boolean(project.titleFinal || project.titleInputs?.draftTitle);
  const hasRefs = (project.references?.verifications?.length ?? 0) > 0;
  const total = SECTION_KEYS.length + 2;
  const got = present.length + (hasTitle ? 1 : 0) + (hasRefs ? 1 : 0);
  const score = Math.round((got / total) * 100);
  const signals: string[] = [];
  const missing = SECTION_KEYS.filter((k) => !present.includes(k));
  if (missing.length) signals.push(`Thin/empty: ${missing.join(", ")}`);
  if (!hasTitle) signals.push("No finalized title");
  if (!hasRefs) signals.push("No verified references");
  return { dimension: "completeness", score, weight: 0.18, detail: `${got}/${total} core components present`, signals };
}

function rigor(project: ProjectState): DimensionScore {
  const results = project.sections?.results || "";
  const methods = project.sections?.methods || "";
  const signals: string[] = [];
  let score = 50;
  if (/95%\s*ci|confidence interval/i.test(results)) { score += 15; signals.push("Reports confidence intervals"); }
  else signals.push("No confidence intervals detected in Results");
  if (/effect size|cohen|odds ratio|hazard ratio|\bor\b|\bhr\b|\brr\b/i.test(results)) { score += 10; signals.push("Reports effect measures"); }
  if (/\bp\s*[<>=]/i.test(results) && !/95%\s*ci/i.test(results)) { score -= 8; signals.push("p-values without CIs (over-reliance)"); }
  if (/sample size|power|a priori|sample-size/i.test(methods)) { score += 12; signals.push("Sample size / power addressed"); }
  else signals.push("No sample-size/power justification in Methods");
  if (/sensitivity analysis|robustness|adjusted for|confounder/i.test(methods + results)) { score += 8; signals.push("Adjustment / robustness present"); }
  if (/randomi[sz]ed|allocation|blinded|double-blind/i.test(methods)) { score += 5; }
  score = Math.max(0, Math.min(100, score));
  return { dimension: "rigor", score, weight: 0.2, detail: "Statistical & methodological rigor signals", signals };
}

function reportingCompliance(project: ProjectState): DimensionScore {
  const all = SECTION_KEYS.map((k) => project.sections?.[k] || "").join("\n").toLowerCase();
  const signals: string[] = [];
  let hits = 0;
  const checks: Array<[RegExp, string]> = [
    [/ethic|irb|institutional review|consent/, "Ethics/consent statement"],
    [/limitation/, "Limitations acknowledged"],
    [/funding|grant|supported by/, "Funding statement"],
    [/conflict|competing interest|disclosure/, "Conflict-of-interest statement"],
    [/registration|registered|prospero|clinicaltrials/, "Registration mentioned"],
    [/data (availability|are available)|available (on|upon) request|repository/, "Data availability"],
  ];
  for (const [re, label] of checks) {
    if (re.test(all)) { hits++; signals.push(`✓ ${label}`); }
    else signals.push(`✗ ${label} missing`);
  }
  const score = Math.round((hits / checks.length) * 100);
  return { dimension: "reporting-compliance", score, weight: 0.16, detail: `${hits}/${checks.length} reporting elements`, signals };
}

function originalitySignal(project: ProjectState): DimensionScore {
  const intro = (project.sections?.introduction || "").toLowerCase();
  const signals: string[] = [];
  let score = 55;
  if (/gap|unknown|remains unclear|has not been|few studies|no (prior|previous) stud/i.test(intro)) {
    score += 20; signals.push("Articulates a knowledge gap");
  } else signals.push("Knowledge gap not clearly stated in Introduction");
  if (/novel|first|to our knowledge/i.test(intro)) {
    signals.push("Makes a novelty claim — ensure it is evidence-backed (Title Lab novelty scan)");
  }
  if (project.noveltyReport) { score += 15; signals.push("Novelty scan was run"); }
  score = Math.max(0, Math.min(100, score));
  return { dimension: "originality-signal", score, weight: 0.1, detail: "Gap framing & novelty positioning", signals };
}

export function evaluateManuscript(project: ProjectState): ManuscriptEvaluation {
  const coh = analyzeCoherence(project);
  const cohDim: DimensionScore = {
    dimension: "coherence",
    score: coh.score,
    weight: 0.18,
    detail: `${coh.issues.length} coherence issue(s); citation order ${coh.citationOrder.ok ? "ok" : "needs fixing"}`,
    signals: coh.issues.slice(0, 5).map((i) => `[${i.severity}] ${i.area}`),
  };

  // Citation integrity from coherence + reference presence.
  const refCount = project.references?.verifications?.length ?? 0;
  const citDim: DimensionScore = {
    dimension: "citation-integrity",
    score: refCount === 0 ? 20 : coh.citationOrder.ok ? 85 : 60,
    weight: 0.1,
    detail: refCount === 0 ? "No references verified" : `${refCount} references; order ${coh.citationOrder.ok ? "consistent" : "inconsistent"}`,
    signals: [coh.citationOrder.detail],
  };

  const prose = SECTION_KEYS.map((k) => project.sections?.[k] || "").join("\n\n");
  const read = readabilityScore(prose);
  const readDim: DimensionScore = {
    dimension: "readability",
    score: read.score,
    weight: 0.08,
    detail: read.detail,
    signals: [],
  };

  const dims = [
    completeness(project),
    cohDim,
    rigor(project),
    reportingCompliance(project),
    readDim,
    citDim,
    originalitySignal(project),
  ];

  const overall = Math.round(dims.reduce((a, d) => a + d.score * d.weight, 0) / dims.reduce((a, d) => a + d.weight, 0));
  const grade: ManuscriptEvaluation["grade"] =
    overall >= 85 ? "A" : overall >= 70 ? "B" : overall >= 55 ? "C" : overall >= 40 ? "D" : "F";

  const strengths = dims.filter((d) => d.score >= 75).map((d) => `${d.dimension}: ${d.detail}`);
  const gaps = dims
    .filter((d) => d.score < 60)
    .flatMap((d) => d.signals.filter((s) => /missing|no |not |✗|thin|empty/i.test(s)).slice(0, 2));

  return { overall, grade, dimensions: dims, strengths, gaps, evaluatedAt: new Date().toISOString() };
}

/** Multi-trial comparison: did an edit improve the manuscript? */
export function compareEvaluations(before: ProjectState, after: ProjectState): EvalDelta {
  const b = evaluateManuscript(before);
  const a = evaluateManuscript(after);
  const overallDelta = a.overall - b.overall;
  const perDimension = a.dimensions.map((d) => {
    const prev = b.dimensions.find((x) => x.dimension === d.dimension);
    return { dimension: d.dimension, delta: d.score - (prev?.score ?? 0) };
  });
  const verdict: EvalDelta["verdict"] =
    overallDelta >= 8 ? "clear-improvement" : overallDelta >= 2 ? "minor-improvement" : overallDelta <= -2 ? "regression" : "no-change";
  const improved = perDimension.filter((p) => p.delta > 0).map((p) => p.dimension);
  const worsened = perDimension.filter((p) => p.delta < 0).map((p) => p.dimension);
  const summary =
    `Overall ${overallDelta >= 0 ? "+" : ""}${overallDelta} (${b.overall}→${a.overall}, grade ${b.grade}→${a.grade}). ` +
    (improved.length ? `Improved: ${improved.join(", ")}. ` : "") +
    (worsened.length ? `Regressed: ${worsened.join(", ")}.` : "");
  return { before: b, after: a, overallDelta, perDimension, verdict, summary };
}
