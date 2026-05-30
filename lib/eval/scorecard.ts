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
import type { SwarmReport } from "@/lib/swarm/types";
import {
  aiPatternMetric,
  originalityMetric,
  significanceMetric,
  noveltyMetric,
  statisticalRigorMetric,
  reportingCompletenessMetric,
  structureMetric,
  abstractQualityMetric,
  titleQualityMetric,
  referenceQualityMetric,
  readabilityMetric,
  coherenceMetric,
  type MetricResult,
} from "./metrics";

export type EvalDimension =
  // legacy dimension names (kept for backward compatibility)
  | "completeness"
  | "coherence"
  | "rigor"
  | "reporting-compliance"
  | "readability"
  | "citation-integrity"
  | "originality-signal"
  // expanded multi-metric dimensions
  | "structure"
  | "statistical-rigor"
  | "reporting-completeness"
  | "reference-quality"
  | "title-quality"
  | "abstract-quality"
  | "significance"
  | "novelty"
  | "ai-writing-patterns"
  | "originality-risk";

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

/* ------------------------------------------------------------------ */
/* Dimension registry                                                 */
/* ------------------------------------------------------------------ */

type DimensionSpec = {
  dimension: EvalDimension;
  weight: number;
  fn: (project: ProjectState) => MetricResult;
};

/**
 * The expanded multi-metric registry (15 dimensions). Weights are relative;
 * the overall score is the weighted mean so the absolute sum need not be 1.
 */
const DIMENSIONS: DimensionSpec[] = [
  { dimension: "structure", weight: 0.1, fn: structureMetric },
  { dimension: "coherence", weight: 0.12, fn: coherenceMetric },
  { dimension: "statistical-rigor", weight: 0.12, fn: statisticalRigorMetric },
  { dimension: "reporting-completeness", weight: 0.1, fn: reportingCompletenessMetric },
  { dimension: "reference-quality", weight: 0.09, fn: referenceQualityMetric },
  { dimension: "significance", weight: 0.07, fn: significanceMetric },
  { dimension: "novelty", weight: 0.06, fn: noveltyMetric },
  { dimension: "title-quality", weight: 0.05, fn: titleQualityMetric },
  { dimension: "abstract-quality", weight: 0.06, fn: abstractQualityMetric },
  { dimension: "readability", weight: 0.06, fn: readabilityMetric },
  { dimension: "ai-writing-patterns", weight: 0.05, fn: aiPatternMetric },
  { dimension: "originality-risk", weight: 0.05, fn: originalityMetric },
];

function buildDimensions(project: ProjectState): DimensionScore[] {
  return DIMENSIONS.map((spec) => {
    const r = spec.fn(project);
    return {
      dimension: spec.dimension,
      score: r.score,
      weight: spec.weight,
      detail: r.detail,
      signals: r.signals,
    };
  });
}

function gradeFor(overall: number): ManuscriptEvaluation["grade"] {
  return overall >= 85 ? "A" : overall >= 70 ? "B" : overall >= 55 ? "C" : overall >= 40 ? "D" : "F";
}

function assemble(dims: DimensionScore[]): ManuscriptEvaluation {
  const totalWeight = dims.reduce((a, d) => a + d.weight, 0) || 1;
  const overall = Math.round(dims.reduce((a, d) => a + d.score * d.weight, 0) / totalWeight);
  const strengths = dims.filter((d) => d.score >= 75).map((d) => `${d.dimension.replace(/-/g, " ")}: ${d.detail}`);
  const gaps = dims
    .filter((d) => d.score < 60)
    .flatMap((d) => d.signals.filter((s) => /missing|no |not |✗|⚠|thin|empty/i.test(s)).slice(0, 2))
    .slice(0, 10);
  return { overall, grade: gradeFor(overall), dimensions: dims, strengths, gaps, evaluatedAt: new Date().toISOString() };
}

/**
 * Deterministic, offline, multi-dimension evaluation (15 dimensions).
 * Backward-compatible signature — returns the same ManuscriptEvaluation shape.
 */
export function evaluateManuscript(project: ProjectState): ManuscriptEvaluation {
  return assemble(buildDimensions(project));
}

/* ------------------------------------------------------------------ */
/* Swarm-aware evaluation                                              */
/* ------------------------------------------------------------------ */

/** Map which dimensions a given swarm layer's problems should affect. */
const LAYER_TO_DIMENSIONS: Record<string, EvalDimension[]> = {
  quality: ["coherence", "structure", "readability", "abstract-quality"],
  safety: ["statistical-rigor", "reporting-completeness", "originality-risk"],
  literature: ["reference-quality", "novelty", "significance"],
  "peer-review": ["statistical-rigor", "significance", "coherence"],
};

/**
 * Fold an optional SwarmReport's findings into the deterministic scoring.
 *
 * Swarm-found CRITICAL issues lower the dimensions their layer maps to (and
 * major issues lower them a little), so a clean deterministic score cannot mask
 * a serious problem the swarm surfaced. With no report, this equals
 * evaluateManuscript(project). Pure & offline — the swarm route already
 * tolerates no-LLM (coherence-only) reports.
 */
export function evaluateWithReport(project: ProjectState, report?: SwarmReport): ManuscriptEvaluation {
  const dims = buildDimensions(project);
  if (!report) return assemble(dims);

  // Derive per-layer penalties directly from the report's per-layer scorecard.
  const layerPenalty: Record<string, number> = {};

  // The report's own per-layer scorecard (0..100) — lower layer score
  // means more/worse findings there. Convert the shortfall into a penalty.
  const scorecard = report.scorecard || {};
  for (const layer of Object.keys(LAYER_TO_DIMENSIONS)) {
    const layerScore = typeof scorecard[layer] === "number" ? scorecard[layer] : 100;
    layerPenalty[layer] = Math.max(0, 100 - layerScore);
  }

  // Count critical findings overall to add an extra clamp on the worst layers.
  const criticalCount = (report.findings || []).filter((f) => f.severity === "critical").length;

  const adjusted = dims.map((d) => {
    // Sum the (scaled) penalties from every layer that maps to this dimension.
    let penalty = 0;
    for (const [layer, targets] of Object.entries(LAYER_TO_DIMENSIONS)) {
      if (targets.includes(d.dimension)) {
        // Scale the layer shortfall modestly so a 60/100 layer doesn't zero a dim.
        penalty += (layerPenalty[layer] || 0) * 0.35;
      }
    }
    if (penalty <= 0) return d;
    const newScore = Math.max(0, Math.round(d.score - penalty));
    const note =
      criticalCount > 0
        ? `Adjusted down by ${Math.round(penalty)} pt(s) from AI swarm findings (${criticalCount} critical across the review).`
        : `Adjusted down by ${Math.round(penalty)} pt(s) from AI swarm findings.`;
    return { ...d, score: newScore, signals: [...d.signals, note].slice(0, 7) };
  });

  return assemble(adjusted);
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
