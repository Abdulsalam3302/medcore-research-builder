// Type definitions for the AI peer-review agent swarm.
//
// The swarm is a set of specialized agents, each viewing the manuscript
// through a distinct lens (methodology, statistics, literature, peer-review,
// editorial, integrity, clarity, reproducibility). The orchestrator runs the
// selected agents, then synthesizes their findings into one layered report
// covering quality / safety / literature / peer-review.

export type AgentRole =
  | "methodologist"
  | "statistician"
  | "literature-scout"
  | "peer-reviewer"
  | "editor"
  | "integrity-officer"
  | "clarity-editor"
  | "reproducibility-checker";

export type Severity = "critical" | "major" | "minor" | "praise";
export type Confidence = "high" | "medium" | "low";

export type AgentFinding = {
  agent: AgentRole;
  severity: Severity;
  section?: string;
  issue: string;
  recommendation: string;
  confidence: Confidence;
};

export type OverallVerdict =
  | "ready"
  | "minor-revisions"
  | "major-revisions"
  | "not-ready";

/**
 * The synthesized layered report returned to the client.
 * `scorecard` maps each quality layer (quality/safety/literature/peer-review)
 * to a 0–100 score. `layerSummaries` is a short prose summary per layer.
 */
export type SwarmReport = {
  findings: AgentFinding[];
  layerSummaries: Record<string, string>;
  overallVerdict: OverallVerdict;
  scorecard: Record<string, number>;
  humanReviewRequired: string[];
};

/** What an agent builder returns: a ready-to-call prompt + a parse schema hint. */
export type AgentPromptSpec = {
  system: string;
  prompt: string;
  /** JSON shape the agent should return (embedded into the prompt). */
  schema: string;
};

/** Compact, deterministic context the orchestrator hands to every agent. */
export type SwarmContext = {
  /** Human-readable text block describing the manuscript. */
  text: string;
  /** Deterministic coherence signals folded in as a head-start. */
  coherenceIssues: Array<{
    severity: "high" | "medium" | "low";
    area: string;
    message: string;
    relatedSections: string[];
    fix: string;
  }>;
  coherenceScore: number;
  title: string;
  design: string;
  referenceCount: number;
};

/** Raw JSON shape each agent is asked to emit (before normalization). */
export type RawAgentResponse = {
  findings?: Array<{
    severity?: string;
    section?: string;
    issue?: string;
    recommendation?: string;
    confidence?: string;
  }>;
  summary?: string;
  humanReviewRequired?: string[];
};
