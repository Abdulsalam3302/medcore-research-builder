/**
 * Metric anticipation + trust scoring for journals.
 *
 * Many journals — especially ESCI/emerging, new, regional, or diamond-OA
 * titles — have NO published Journal Impact Factor. Leaving a blank is a real
 * pain point: authors can't compare. This module *anticipates* a defensible
 * estimated metric from the signals we do have (CiteScore, SJR, quartile,
 * indexing tier, works volume), and ALWAYS labels it as an estimate with the
 * basis — never presents an estimate as an official Clarivate JIF.
 *
 * It also computes a Think.Check.Submit-style TRUST score so researchers can
 * spot credible vs questionable venues — the single biggest journal-selection
 * pain point. Sources for the heuristics: Think.Check.Submit, DOAJ, COPE,
 * ICMJE, and standard predatory-journal red-flag guidance.
 */

import type { JournalRecord } from "./types";

export type AnticipatedMetric = {
  /** Estimated impact-factor-equivalent (0 if no basis). */
  value: number | null;
  /** Where the estimate came from. */
  basis: string;
  /** How confident the estimate is. */
  confidence: "reported" | "estimated-high" | "estimated-moderate" | "estimated-low" | "none";
  /** Human-readable label, e.g. "≈ 2.1 (est. from CiteScore)". */
  label: string;
};

/**
 * Anticipate an impact-factor-equivalent for a journal.
 * Priority: real JIF → CiteScore-derived → SJR-derived → quartile+index tier.
 * CiteScore ≈ 1.2–1.5× JIF historically for many fields; we use ~0.7× to map
 * CiteScore down to a conservative JIF-equivalent (CiteScore counts a wider
 * window). These are deliberately conservative, clearly-flagged estimates.
 */
export function anticipateImpact(j: JournalRecord): AnticipatedMetric {
  const m = j.metrics || {};

  if (typeof m.impactFactor === "number" && m.impactFactor > 0) {
    return {
      value: m.impactFactor,
      basis: `Reported JIF (JCR ${m.metricsYear ?? "recent"})`,
      confidence: "reported",
      label: `${m.impactFactor.toFixed(1)} (JIF${m.metricsYear ? " " + m.metricsYear : ""})`,
    };
  }

  if (typeof m.citeScore === "number" && m.citeScore > 0) {
    const est = Math.round(m.citeScore * 0.7 * 10) / 10;
    return {
      value: est,
      basis: "Estimated from Scopus CiteScore (~0.7×)",
      confidence: "estimated-high",
      label: `≈ ${est.toFixed(1)} (est. from CiteScore ${m.citeScore})`,
    };
  }

  if (typeof m.sjr === "number" && m.sjr > 0) {
    // SJR is prestige-weighted; a rough JIF-equivalent ≈ SJR × 2 for med fields.
    const est = Math.round(m.sjr * 2 * 10) / 10;
    return {
      value: est,
      basis: "Estimated from SCImago SJR (~2×)",
      confidence: "estimated-moderate",
      label: `≈ ${est.toFixed(1)} (est. from SJR ${m.sjr})`,
    };
  }

  // Fall back to indexing tier + quartile as a coarse band.
  if (j.indexing.wos === "SCIE") {
    const band = m.quartile === "Q1" ? 6 : m.quartile === "Q2" ? 3.5 : m.quartile === "Q3" ? 2 : 1.2;
    return {
      value: band,
      basis: `Estimated band from SCIE${m.quartile ? " " + m.quartile : ""} membership`,
      confidence: "estimated-low",
      label: `≈ ${band.toFixed(1)} (band: SCIE${m.quartile ? " " + m.quartile : ""})`,
    };
  }
  if (j.indexing.wos === "ESCI" || j.indexing.scopus === "indexed") {
    return {
      value: 1.0,
      basis: "Estimated band from ESCI/Scopus indexing (no JIF assigned yet)",
      confidence: "estimated-low",
      label: "≈ 1.0 (band: ESCI/Scopus, no JIF yet)",
    };
  }

  return { value: null, basis: "No metric basis available", confidence: "none", label: "Not indexed for metrics" };
}

export type TrustSignal = { ok: boolean; weight: number; label: string; detail: string };
export type TrustAssessment = {
  score: number; // 0..100
  level: "high" | "moderate" | "caution" | "high-risk";
  signals: TrustSignal[];
  redFlags: string[];
  summary: string;
};

/**
 * Think.Check.Submit-style trust assessment. Rewards legitimate indexing &
 * transparency; flags predatory red flags. NOT a verdict — an aid; the user
 * should still complete thinkchecksubmit.org for any unfamiliar journal.
 */
export function assessTrust(j: JournalRecord): TrustAssessment {
  const signals: TrustSignal[] = [];
  const redFlags: string[] = [];

  const add = (ok: boolean, weight: number, label: string, detail: string) =>
    signals.push({ ok, weight, label, detail });

  // Legitimate-indexing signals (the strongest credibility markers).
  add(j.indexing.medline === "indexed", 22, "MEDLINE indexed", "Selective NLM indexing — strong credibility signal.");
  add(j.indexing.doaj === "indexed", 16, "DOAJ listed", "DOAJ vets for transparent OA practices.");
  add(j.indexing.wos === "SCIE" || j.indexing.wos === "ESCI", 18, "Web of Science indexed", "Clarivate-evaluated collection.");
  add(j.indexing.scopus === "indexed", 14, "Scopus indexed", "Elsevier-curated coverage.");
  add(j.indexing.pmc === "indexed", 8, "PMC archived", "Full text preserved in PubMed Central.");
  add(Boolean(j.publisher && !/unknown/i.test(j.publisher)), 8, "Named publisher", "A clearly identified publisher/society.");
  add(Boolean(j.authorGuideUrl || j.homepage), 6, "Transparent author guidance", "Public author guidelines / homepage.");
  add(Boolean(j.endorsedGuidelines && j.endorsedGuidelines.length), 8, "Endorses reporting guidelines", "References ICMJE/EQUATOR standards.");

  // Transparency on cost (either free or clearly-stated APC is fine).
  add(j.apcModel !== undefined && j.apcModel !== "unknown", 6, "Clear publishing-cost model", "APC/access model is stated.");

  // Red-flag detection.
  if (j.notes && /predator|hijack|fake|questionable/i.test(j.notes)) {
    redFlags.push("Flagged in notes for credibility concerns — verify independently.");
  }
  if (j.indexing.wos === "none" && j.indexing.scopus !== "indexed" && j.indexing.medline !== "indexed" && j.indexing.doaj !== "indexed") {
    redFlags.push("Not found in any major index (WoS/Scopus/MEDLINE/DOAJ) — verify legitimacy via Think.Check.Submit before submitting.");
  }
  if (typeof j.decisionTimeDays === "number" && j.decisionTimeDays > 0 && j.decisionTimeDays < 7) {
    redFlags.push("Advertised review time under a week — unrealistically fast peer review is a predatory red flag.");
  }

  const earned = signals.filter((s) => s.ok).reduce((a, s) => a + s.weight, 0);
  const possible = signals.reduce((a, s) => a + s.weight, 0);
  let score = Math.round((earned / possible) * 100);
  // Red flags cap the score.
  if (redFlags.length) score = Math.min(score, 45 - (redFlags.length - 1) * 10);
  score = Math.max(0, Math.min(100, score));

  const level: TrustAssessment["level"] =
    redFlags.length >= 2 ? "high-risk" : score >= 70 ? "high" : score >= 50 ? "moderate" : "caution";

  const summary =
    level === "high"
      ? "Strong credibility signals across major indexes."
      : level === "moderate"
        ? "Reasonable signals; confirm scope fit and current indexing."
        : level === "caution"
          ? "Limited verification signals — check carefully before submitting."
          : "Multiple red flags — independently verify legitimacy (Think.Check.Submit) before any submission.";

  return { score, level, signals, redFlags, summary };
}

/** A plain-language fit/cost/speed/trust one-liner for quick scanning. */
export function quickProfile(j: JournalRecord): string {
  const parts: string[] = [];
  const imp = anticipateImpact(j);
  parts.push(imp.label);
  if (j.freeApc) parts.push("free to publish");
  else if (j.apcModel === "gold-apc" && typeof j.apcUsd === "number") parts.push(`APC ≈ $${j.apcUsd}`);
  else if (j.apcModel === "subscription") parts.push("subscription (no APC, paywalled)");
  if (typeof j.decisionTimeDays === "number") parts.push(`~${j.decisionTimeDays}d to decision`);
  return parts.join(" · ");
}
