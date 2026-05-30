/**
 * Heuristic manuscript metric functions.
 *
 * HONESTY CONSTRAINT (ethics): every function here is a deterministic, offline
 * heuristic AID — never a "detector". Nothing in this file can guarantee that
 * text is AI-written, AI-undetectable, plagiarised, or original. The AI-pattern
 * and originality metrics surface *patterns a human may want to review or
 * soften*; they make no claim of detection. Proper citation, human review, and
 * journal AI-use disclosure remain the author's responsibility.
 *
 * Each metric is a pure function over ProjectState (+ its section text) and
 * returns { score: 0..100, detail, signals[] }. Higher score = better /
 * lower-risk. These compose into the scorecard in ./scorecard.ts.
 */

import type { ProjectState } from "@/lib/types";
import { analyzeCoherence } from "@/lib/coherence";
import {
  aiPatternHeuristics,
  originalityHeuristics,
  estimateReadability,
  type AdvisorySignal,
} from "@/lib/language/editor";

export type MetricResult = {
  score: number; // 0..100 (higher = better / lower risk)
  detail: string;
  signals: string[];
};

const SECTION_KEYS = ["introduction", "methods", "results", "discussion", "conclusion"] as const;

/* ------------------------------------------------------------------ */
/* Shared text helpers                                                */
/* ------------------------------------------------------------------ */

export function allSectionsText(project: ProjectState): string {
  return SECTION_KEYS.map((k) => project.sections?.[k] || "").join("\n\n");
}

function wordCount(s?: string): number {
  const t = (s || "").trim();
  return t ? t.split(/\s+/).length : 0;
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

/** Map an AdvisorySignal level (ok/watch/high) into a 0..100 contribution. */
function levelToScore(level: AdvisorySignal["level"]): number {
  return level === "ok" ? 100 : level === "watch" ? 60 : 25;
}

/* ------------------------------------------------------------------ */
/* 1) AI-writing-pattern risk (reuses aiPatternHeuristics)            */
/*    Higher human-likeness => higher score. NOT an AI detector.      */
/* ------------------------------------------------------------------ */

export function aiPatternMetric(project: ProjectState): MetricResult {
  const text = allSectionsText(project);
  if (wordCount(text) < 40) {
    return {
      score: 50,
      detail: "Too little prose to assess writing patterns (heuristic aid only — not an AI detector).",
      signals: ["Add more text for a meaningful reading."],
    };
  }
  const report = aiPatternHeuristics(text);
  // Average each signal's level into a human-likeness score.
  const scored = report.signals.filter((s) => s.id !== "insufficient");
  const avg = scored.length
    ? scored.reduce((a, s) => a + levelToScore(s.level), 0) / scored.length
    : 50;
  const flagged = scored.filter((s) => s.level !== "ok");
  const signals = flagged.length
    ? flagged.map((s) => `${s.label}: ${s.detail}`)
    : ["Writing patterns read as natural/human across all heuristics."];
  signals.push("Heuristic aid only — cannot detect AI authorship; disclose AI use per journal policy.");
  return {
    score: clamp(avg),
    detail: `${flagged.length} of ${scored.length} writing-pattern heuristic(s) flagged (higher score = more human-like).`,
    signals: signals.slice(0, 6),
  };
}

/* ------------------------------------------------------------------ */
/* 2) Plagiarism / originality risk (reuses originalityHeuristics)    */
/*    NOT a plagiarism checker. Flags patterns for human/tool review. */
/* ------------------------------------------------------------------ */

export function originalityMetric(project: ProjectState): MetricResult {
  const text = allSectionsText(project);
  if (wordCount(text) < 40) {
    return {
      score: 50,
      detail: "Too little prose for originality signals (advisory only — not a plagiarism checker).",
      signals: ["Add more text for a meaningful reading."],
    };
  }
  const report = originalityHeuristics(text);
  const scored = report.signals.filter((s) => s.id !== "insufficient");
  const avg = scored.length
    ? scored.reduce((a, s) => a + levelToScore(s.level), 0) / scored.length
    : 50;
  const flagged = scored.filter((s) => s.level !== "ok");
  const signals = flagged.length
    ? flagged.map((s) => `${s.label}: ${s.detail}`)
    : ["No long verbatim runs or unattributed claims detected by the heuristic."];
  signals.push("Advisory only — run a dedicated similarity tool (iThenticate/Turnitin) and cite all sources.");
  return {
    score: clamp(avg),
    detail: `${flagged.length} originality risk pattern(s) flagged (verbatim runs, claims without nearby citation).`,
    signals: signals.slice(0, 6),
  };
}

/* ------------------------------------------------------------------ */
/* 3) Significance / impact framing                                   */
/*    Does the intro state importance AND discussion state            */
/*    implications?                                                    */
/* ------------------------------------------------------------------ */

export function significanceMetric(project: ProjectState): MetricResult {
  const intro = (project.sections?.introduction || "").toLowerCase();
  const disc = (project.sections?.discussion || "").toLowerCase();
  const concl = (project.sections?.conclusion || "").toLowerCase();
  const signals: string[] = [];
  let score = 30;

  const introImportance =
    /important|burden|prevalen|incidence|mortality|morbidity|public health|costly|significant (clinical|public|health)|unmet need|affect(s|ed)? (millions|thousands|patients)/.test(
      intro,
    );
  if (introImportance) {
    score += 30;
    signals.push("✓ Introduction frames the clinical/public-health importance of the problem.");
  } else {
    signals.push("✗ Introduction does not clearly state why the problem matters (burden, prevalence, impact).");
  }

  const implications =
    /implication|clinical practice|policy|inform|guideline|future (research|studies|work)|recommend|should be|practice change|translat/.test(
      disc + " " + concl,
    );
  if (implications) {
    score += 30;
    signals.push("✓ Discussion/Conclusion states implications (practice, policy, or future research).");
  } else {
    signals.push("✗ Discussion/Conclusion does not articulate implications or so-what for the field.");
  }

  if (/clinical relevance|real-world|actionable|bedside|decision-making/.test(disc)) {
    score += 10;
    signals.push("Connects findings to real-world/clinical relevance.");
  }

  return {
    score: clamp(score),
    detail: "Whether the manuscript frames why it matters (importance) and what follows (implications).",
    signals,
  };
}

/* ------------------------------------------------------------------ */
/* 4) Novelty positioning                                             */
/* ------------------------------------------------------------------ */

export function noveltyMetric(project: ProjectState): MetricResult {
  const intro = (project.sections?.introduction || "").toLowerCase();
  const signals: string[] = [];
  let score = 45;

  const gap =
    /gap|unknown|remains unclear|has not been|few studies|no (prior|previous) stud|little is known|poorly understood|under-?studied|lack of evidence|conflicting/.test(
      intro,
    );
  if (gap) {
    score += 25;
    signals.push("✓ Articulates a knowledge gap the study addresses.");
  } else {
    signals.push("✗ Knowledge gap not clearly stated in the Introduction.");
  }

  const noveltyClaim = /novel|first|to our knowledge|unprecedented|for the first time/.test(intro);
  if (noveltyClaim) {
    if (project.noveltyReport) {
      score += 10;
      signals.push("Makes a novelty claim and a novelty scan was run to support it.");
    } else {
      score -= 5;
      signals.push(
        "Makes a novelty claim ('first'/'novel') without a logged novelty scan — verify with the Title Lab novelty scan.",
      );
    }
  }

  if (project.noveltyReport) {
    score += 15;
    const risk = project.noveltyReport.risk;
    signals.push(`Novelty scan present (risk: ${risk.replace(/_/g, " ")}).`);
    if (risk === "high_duplicate_risk" || risk === "exact_or_near_exact_match") {
      score -= 25;
      signals.push("⚠ Novelty scan reports high duplicate/overlap risk — re-position against prior work.");
    }
  } else {
    signals.push("No novelty scan logged — run one to substantiate the contribution.");
  }

  return {
    score: clamp(score),
    detail: "Gap framing and how clearly the contribution is positioned against prior work.",
    signals,
  };
}

/* ------------------------------------------------------------------ */
/* 5) Statistical rigor (effect size + CI vs bare p-values)           */
/* ------------------------------------------------------------------ */

export function statisticalRigorMetric(project: ProjectState): MetricResult {
  const results = project.sections?.results || "";
  const methods = project.sections?.methods || "";
  const both = results + "\n" + methods;
  const signals: string[] = [];
  let score = 45;

  const hasCI = /95%\s*ci|confidence interval/i.test(results);
  const hasP = /\bp\s*[<>=≤≥]/i.test(results);
  const hasEffect =
    /effect size|cohen'?s\s*d|odds ratio|hazard ratio|risk ratio|mean difference|\b(or|hr|rr|aor|ahr)\s*[=:]/i.test(
      results,
    );

  if (hasCI) {
    score += 18;
    signals.push("✓ Reports confidence intervals.");
  } else {
    signals.push("✗ No confidence intervals detected in Results.");
  }
  if (hasEffect) {
    score += 15;
    signals.push("✓ Reports effect measures (OR/HR/RR/effect size/mean difference).");
  } else {
    signals.push("✗ No explicit effect size / effect measure reported.");
  }
  if (hasP && !hasCI && !hasEffect) {
    score -= 12;
    signals.push("⚠ p-values reported without CIs or effect sizes (over-reliance on significance).");
  }
  if (/sample size|power|a priori|sample-size|powered to/i.test(methods)) {
    score += 12;
    signals.push("✓ Sample size / statistical power addressed in Methods.");
  } else {
    signals.push("✗ No sample-size or power justification in Methods.");
  }
  if (/adjusted for|confounder|multivariable|covariate|sensitivity analysis|robustness/i.test(both)) {
    score += 8;
    signals.push("✓ Adjustment / confounding / robustness analysis present.");
  }
  if (/missing data|imputation|complete[ -]case|intention[ -]to[ -]treat/i.test(both)) {
    score += 6;
    signals.push("✓ Missing-data / analysis-population handling mentioned.");
  }

  return {
    score: clamp(score),
    detail: "Statistical reporting quality — effect sizes and CIs preferred over bare p-values.",
    signals,
  };
}

/* ------------------------------------------------------------------ */
/* 6) Reporting-guideline completeness                                */
/*    ethics / funding / COI / registration / data-availability /     */
/*    AI-disclosure statements                                        */
/* ------------------------------------------------------------------ */

export function reportingCompletenessMetric(project: ProjectState): MetricResult {
  const all = allSectionsText(project).toLowerCase();
  const checks: Array<[RegExp, string]> = [
    [/ethic|irb|institutional review|ethics committee|consent/, "Ethics / consent statement"],
    [/funding|grant|supported by|financial support|no funding/, "Funding statement"],
    [/conflict|competing interest|disclosure|declare no/, "Conflict-of-interest statement"],
    [/registration|registered|prospero|clinicaltrials|trial registr/, "Registration statement"],
    [/data (availability|are available|sharing)|available (on|upon) request|repository|deposited/, "Data-availability statement"],
    [/\bai\b|artificial intelligence|chatgpt|large language model|generative ai|llm|ai (was|were) used|no ai/, "AI-use disclosure"],
    [/limitation/, "Limitations acknowledged"],
  ];
  const signals: string[] = [];
  let hits = 0;
  for (const [re, label] of checks) {
    if (re.test(all)) {
      hits++;
      signals.push(`✓ ${label}`);
    } else {
      signals.push(`✗ ${label} missing`);
    }
  }
  return {
    score: clamp((hits / checks.length) * 100),
    detail: `${hits}/${checks.length} reporting-guideline / disclosure elements detected.`,
    signals,
  };
}

/* ------------------------------------------------------------------ */
/* 7) Structure / IMRaD adherence                                     */
/* ------------------------------------------------------------------ */

export function structureMetric(project: ProjectState): MetricResult {
  const signals: string[] = [];
  const present = SECTION_KEYS.filter((k) => wordCount(project.sections?.[k]) >= 40);
  const missing = SECTION_KEYS.filter((k) => !present.includes(k));
  let score = Math.round((present.length / SECTION_KEYS.length) * 85);

  if (missing.length) signals.push(`✗ Thin/empty IMRaD section(s): ${missing.join(", ")}.`);
  else signals.push("✓ All core IMRaD sections (Intro, Methods, Results, Discussion, Conclusion) are substantive.");

  // Balance: Results should not be empty while Discussion is long (interpretation without data).
  const resW = wordCount(project.sections?.results);
  const discW = wordCount(project.sections?.discussion);
  if (discW > 80 && resW < 40) {
    score -= 12;
    signals.push("⚠ Discussion is developed but Results is thin — interpretation may outrun the data.");
  }
  const methW = wordCount(project.sections?.methods);
  if (resW > 80 && methW < 40) {
    score -= 8;
    signals.push("⚠ Results present but Methods is thin — reported outcomes may not be pre-specified.");
  }
  if (missing.length === 0 && discW >= 80 && resW >= 80 && methW >= 80) {
    score += 15;
    signals.push("✓ Sections are reasonably balanced.");
  }
  return {
    score: clamp(score),
    detail: `${present.length}/${SECTION_KEYS.length} IMRaD sections substantive.`,
    signals,
  };
}

/* ------------------------------------------------------------------ */
/* 8) Abstract quality                                                */
/*    (no dedicated abstract field — assess the Introduction's        */
/*    opening + structure cues as a proxy abstract surrogate)         */
/* ------------------------------------------------------------------ */

export function abstractQualityMetric(project: ProjectState): MetricResult {
  // The schema has no separate abstract; the Introduction's first paragraph and
  // the Conclusion together stand in as the "summary" surface. We assess whether
  // the manuscript contains the building blocks an abstract needs.
  const intro = project.sections?.introduction || "";
  const results = project.sections?.results || "";
  const concl = project.sections?.conclusion || "";
  const signals: string[] = [];
  let score = 30;

  if (wordCount(intro) >= 40) {
    score += 15;
    signals.push("✓ Background/objective material present (Introduction).");
  } else {
    signals.push("✗ Introduction too thin to summarise a background/objective.");
  }
  if (/\baim|objective|we sought|this study|purpose|we (investigated|evaluated|assessed|examined)/i.test(intro)) {
    score += 15;
    signals.push("✓ A clear objective/aim is stated.");
  } else {
    signals.push("✗ No explicit objective/aim detected for the abstract to summarise.");
  }
  if (/\d/.test(results) && /p\s*[<>=≤≥]|%|95%\s*ci|\bn\s*=/.test(results.toLowerCase())) {
    score += 20;
    signals.push("✓ Quantitative findings available to populate an abstract Results line.");
  } else {
    signals.push("✗ No quantitative findings detected to summarise in an abstract.");
  }
  if (wordCount(concl) >= 20) {
    score += 20;
    signals.push("✓ A conclusion is available for the abstract's closing statement.");
  } else {
    signals.push("✗ Conclusion too thin for an abstract closing statement.");
  }
  return {
    score: clamp(score),
    detail: "Whether the manuscript has the building blocks for a complete structured abstract.",
    signals,
  };
}

/* ------------------------------------------------------------------ */
/* 9) Title quality (length, design disclosure)                       */
/* ------------------------------------------------------------------ */

export function titleQualityMetric(project: ProjectState): MetricResult {
  const title = project.titleFinal || project.titleInputs?.draftTitle || "";
  const signals: string[] = [];
  if (!title.trim()) {
    return {
      score: 10,
      detail: "No title set.",
      signals: ["✗ No finalized or draft title — set one in the Title Lab."],
    };
  }
  let score = 50;
  const wc = wordCount(title);
  if (wc >= 8 && wc <= 20) {
    score += 20;
    signals.push(`✓ Title length is in range (${wc} words; sweet spot 8–20).`);
  } else if (wc < 8) {
    score += 5;
    signals.push(`⚠ Title is short (${wc} words) — may be under-specified.`);
  } else {
    score -= 5;
    signals.push(`⚠ Title is long (${wc} words) — consider tightening.`);
  }

  const designDisclosed =
    /randomi[sz]ed|cohort|case-control|cross-sectional|systematic review|meta-analysis|trial|observational|case report|case series|prospective|retrospective|pilot|feasibility|protocol/i.test(
      title,
    );
  if (designDisclosed) {
    score += 20;
    signals.push("✓ Study design is disclosed in the title (recommended by reporting guidelines).");
  } else {
    signals.push("✗ Study design not disclosed in the title — many guidelines recommend stating it.");
  }

  if (/[?:]/.test(title) || /\b(effect|association|impact|efficacy|safety|prevalence|accuracy)\b/i.test(title)) {
    score += 8;
    signals.push("✓ Title signals the question / outcome focus.");
  }
  if (/^\W*(a|an|the)\s+(study|investigation|analysis)\b/i.test(title.trim())) {
    score -= 6;
    signals.push("⚠ Generic opening ('A study of…') — lead with the specific finding/topic.");
  }
  return {
    score: clamp(score),
    detail: `Title length and design disclosure (${wc} words).`,
    signals,
  };
}

/* ------------------------------------------------------------------ */
/* 10) Reference quality (count, recency hints, verified)             */
/* ------------------------------------------------------------------ */

export function referenceQualityMetric(project: ProjectState): MetricResult {
  const verifs = project.references?.verifications || [];
  const signals: string[] = [];
  if (verifs.length === 0) {
    return {
      score: 15,
      detail: "No verified references.",
      signals: ["✗ No references verified — run the Reference Verifier."],
    };
  }
  let score = 40;
  const n = verifs.length;
  if (n >= 20) {
    score += 20;
    signals.push(`✓ ${n} references — a substantial evidence base.`);
  } else if (n >= 8) {
    score += 12;
    signals.push(`✓ ${n} references.`);
  } else {
    score += 4;
    signals.push(`⚠ Only ${n} reference(s) — likely sparse for an original article.`);
  }

  // Verified-in-an-index ratio.
  const inIndex = verifs.filter(
    (v) =>
      v.pubmed?.found ||
      v.crossref?.found ||
      v.openalex?.found ||
      v.europepmc?.found ||
      v.semanticscholar?.found,
  ).length;
  const indexedPct = Math.round((inIndex / n) * 100);
  if (indexedPct >= 90) {
    score += 18;
    signals.push(`✓ ${indexedPct}% of references located in a trusted index.`);
  } else if (indexedPct >= 60) {
    score += 8;
    signals.push(`⚠ ${indexedPct}% of references located in a trusted index — verify the rest.`);
  } else {
    signals.push(`✗ Only ${indexedPct}% of references located in a trusted index — high verification burden.`);
  }

  // Recency hint: how many cite a year in the last ~5 years.
  const currentYear = new Date().getFullYear();
  let recent = 0;
  let withYear = 0;
  for (const v of verifs) {
    const yStr = v.parsed?.year || v.pubmed?.year || v.crossref?.year || v.openalex?.year || "";
    const y = parseInt(String(yStr), 10);
    if (Number.isFinite(y) && y > 1900) {
      withYear++;
      if (currentYear - y <= 5) recent++;
    }
  }
  if (withYear > 0) {
    const recentPct = Math.round((recent / withYear) * 100);
    if (recentPct >= 40) {
      score += 12;
      signals.push(`✓ ${recentPct}% of dated references are from the last 5 years (current literature).`);
    } else {
      signals.push(`⚠ Only ${recentPct}% of dated references are recent (≤5 yrs) — may rely on older literature.`);
    }
  }

  // Retraction / mismatch flags lower trust.
  const flagged = verifs.filter(
    (v) => v.checks?.possibleRetractionOrConcern === true || v.checks?.metadataMatch === "mismatch",
  ).length;
  if (flagged > 0) {
    score -= flagged * 10;
    signals.push(`⚠ ${flagged} reference(s) flagged for possible retraction or metadata mismatch — review before submission.`);
  }
  return {
    score: clamp(score),
    detail: `${n} references; ${indexedPct}% indexed.`,
    signals,
  };
}

/* ------------------------------------------------------------------ */
/* 11) Readability (reuses estimateReadability / lib/readability)     */
/* ------------------------------------------------------------------ */

export function readabilityMetric(project: ProjectState): MetricResult {
  const text = allSectionsText(project);
  if (wordCount(text) < 40) {
    return { score: 40, detail: "Too little prose to assess readability.", signals: ["Add more text."] };
  }
  const r = estimateReadability(text);
  // Map Flesch reading-ease toward an academic sweet spot (~30–50 is typical for
  // medical prose). We reward clarity without over-penalising technical density.
  let score = 60;
  if (r.flesch >= 50) score = 90;
  else if (r.flesch >= 35) score = 78;
  else if (r.flesch >= 20) score = 62;
  else score = 45;

  const signals: string[] = [
    `Flesch reading ease ${r.flesch.toFixed(0)} (${r.verdict}); FK grade ${r.fleschKincaidGrade.toFixed(1)}.`,
    `Avg sentence length ${r.avgSentenceLength.toFixed(1)} words; passive voice ~${r.passiveVoicePct.toFixed(0)}%.`,
  ];
  if (r.avgSentenceLength > 30) {
    score -= 12;
    signals.push("⚠ Long average sentence length — split some sentences for clarity.");
  }
  if (r.passiveVoicePct > 40) {
    score -= 6;
    signals.push("⚠ Heavy passive voice — prefer active voice where it does not distort meaning.");
  }
  if (r.recommendation) signals.push(r.recommendation);
  return { score: clamp(score), detail: `Readability: ${r.verdict}.`, signals: signals.slice(0, 5) };
}

/* ------------------------------------------------------------------ */
/* 12) Coherence (reuses analyzeCoherence)                            */
/* ------------------------------------------------------------------ */

export function coherenceMetric(project: ProjectState): MetricResult {
  const coh = analyzeCoherence(project);
  const high = coh.issues.filter((i) => i.severity === "high").length;
  const med = coh.issues.filter((i) => i.severity === "medium").length;
  const signals = coh.issues.slice(0, 5).map((i) => `[${i.severity}] ${i.area}: ${i.message}`);
  signals.push(coh.citationOrder.detail);
  return {
    score: clamp(coh.score),
    detail: `${coh.issues.length} coherence issue(s) (${high} high, ${med} medium); citation order ${
      coh.citationOrder.ok ? "ok" : "needs fixing"
    }.`,
    signals: signals.slice(0, 6),
  };
}
