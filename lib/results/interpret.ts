/**
 * results/interpret — pure helpers + prompt builder for AI-assisted
 * interpretation of a manuscript Results section.
 *
 * Hard rules baked into the prompt and schema:
 *  - NEVER fabricate numbers. Interpret only numbers that appear in the
 *    supplied results text / data summary. Missing → flag, don't invent.
 *  - Foreground EFFECT SIZE + CONFIDENCE INTERVAL + UNCERTAINTY, not p-values.
 *  - Distinguish STATISTICAL significance from CLINICAL significance.
 *  - Surface cautions / limitations and humanReviewRequired flags.
 *
 * No network here — this module only builds strings/specs. The route layer
 * calls the LLM.
 */

export type ResultsInterpretationArgs = {
  /** The Results section text the author wants interpreted. Required. */
  resultsText: string;
  /** Free-text data/analysis context (variables, n, design, models). */
  dataContext?: string;
  /** Study design id or label, e.g. "interv.rct.parallel" or "cohort". */
  designLabel?: string;
  /** Primary outcome label, if known. */
  primaryOutcome?: string;
  /** Outcome type, used to steer effect-measure language. */
  outcomeType?: "continuous" | "binary" | "time-to-event" | "count" | "other";
  /** Comparison groups / exposure description. */
  groups?: string;
  /** Whether the design supports causal language (true ~ randomized). */
  randomized?: boolean;
};

/** A single parsed finding emitted by the model. */
export type ResultFinding = {
  /** Short label, e.g. "28-day mortality" or "Primary endpoint". */
  label: string;
  /** Effect measure name actually present in the text (RR/OR/HR/MD/…) or null. */
  effectMeasure: string | null;
  /** Point estimate exactly as it appears in the text, or null if absent. */
  pointEstimate: string | null;
  /** 95% CI exactly as it appears, or null if absent. */
  confidenceInterval: string | null;
  /** p-value exactly as it appears, or null if absent. */
  pValue: string | null;
  /** Plain-language interpretation grounded ONLY in the numbers above. */
  plainLanguage: string;
  /** Statistically significant? "yes" | "no" | "unclear" (no fabrication). */
  statisticalSignificance: "yes" | "no" | "unclear";
  /** Clinical significance commentary (separate from statistical). */
  clinicalSignificance: string;
  /** Per-finding cautions (precision, multiplicity, missing data, etc.). */
  cautions: string[];
  /** True when a needed number (effect/CI) is missing from the source. */
  missingInputs: boolean;
};

export type ResultsInterpretation = {
  overallSummary: string;
  findings: ResultFinding[];
  effectSizeEmphasis: string[];
  cautions: string[];
  limitations: string[];
  humanReviewRequired: string[];
  /** Inputs the author must supply (numbers absent from the source text). */
  missingInformation: string[];
  causalLanguageNote: string;
};

/**
 * JSON schema (as an instructional string) the LLM must conform to.
 * Exported so the route can append it and tests can assert on it.
 */
export const RESULTS_INTERPRETATION_SCHEMA = `Return ONLY a JSON object with this exact shape:
{
  "overallSummary": "string — 2-4 sentences, plain language, grounded only in supplied numbers",
  "findings": [
    {
      "label": "string — short name of the finding",
      "effectMeasure": "string|null — e.g. 'RR','OR','HR','mean difference'; null if not stated",
      "pointEstimate": "string|null — copied verbatim from the source; null if absent",
      "confidenceInterval": "string|null — copied verbatim (e.g. '95% CI 0.66-0.94'); null if absent",
      "pValue": "string|null — copied verbatim; null if absent",
      "plainLanguage": "string — interpretation grounded ONLY in the numbers above",
      "statisticalSignificance": "yes|no|unclear",
      "clinicalSignificance": "string — is the effect magnitude clinically meaningful, and why/why not",
      "cautions": ["string"],
      "missingInputs": true
    }
  ],
  "effectSizeEmphasis": ["string — restating the key effect sizes + CIs, NOT p-values"],
  "cautions": ["string"],
  "limitations": ["string"],
  "humanReviewRequired": ["string"],
  "missingInformation": ["string — numbers the author must supply that were absent"],
  "causalLanguageNote": "string — whether causal wording is justified given the design"
}`;

/**
 * Build the user prompt for results interpretation. Deterministic, no network.
 */
export function buildResultsInterpretationPrompt(args: ResultsInterpretationArgs): string {
  const ctx: string[] = [];
  if (args.designLabel) ctx.push(`Study design: ${args.designLabel}`);
  if (typeof args.randomized === "boolean")
    ctx.push(`Randomized: ${args.randomized ? "yes" : "no"}`);
  if (args.primaryOutcome) ctx.push(`Primary outcome: ${args.primaryOutcome}`);
  if (args.outcomeType) ctx.push(`Outcome type: ${args.outcomeType}`);
  if (args.groups) ctx.push(`Comparison groups / exposure: ${args.groups}`);
  if (args.dataContext) ctx.push(`Data / analysis context: ${args.dataContext}`);
  const contextBlock = ctx.length
    ? ctx.map((l) => `- ${l}`).join("\n")
    : "(no structured context supplied)";

  const causalGuidance = args.randomized
    ? "This design may support cautious causal language IF randomization and analysis were sound; still hedge appropriately."
    : "This is NOT a randomized design — do NOT use causal wording (caused, led to, reduced). Use associational language (associated with, related to).";

  return `You are a biostatistician helping an author INTERPRET (not rewrite) their manuscript Results.

STUDY CONTEXT:
${contextBlock}

CAUSAL-LANGUAGE GUIDANCE:
${causalGuidance}

RESULTS SECTION TO INTERPRET (verbatim — treat as the ONLY source of numbers):
"""
${args.resultsText}
"""

ABSOLUTE RULES:
- NEVER fabricate or estimate any number (sample size, %, p-value, CI, effect estimate, dose, date).
- Use ONLY numbers that literally appear in the Results text above. Copy them verbatim.
- If a finding lacks an effect size or 95% CI, set the relevant field to null, set "missingInputs": true, and add the missing item to "missingInformation". Do NOT guess.
- FOREGROUND effect size + 95% CI + uncertainty. Do NOT lean on p-values; a small p with a wide CI or tiny effect is still uncertain/unimportant.
- Clearly DISTINGUISH statistical significance from clinical significance — a "significant" p-value does not mean the effect is clinically meaningful, and a non-significant result is not proof of no effect.
- Flag anything that needs human review (multiplicity, subgroup fishing, missing-data handling, model assumptions, surrogate endpoints) under "humanReviewRequired".

TASKS:
1. Identify each distinct quantitative finding in the text and populate a "findings" entry. Only include findings whose numbers are present in the text; for any whose effect/CI is missing, still list it but flag missingInputs and add to missingInformation.
2. Write a plain-language interpretation for each finding, grounded only in its own numbers.
3. Restate the key effect sizes with their CIs (not p-values) under "effectSizeEmphasis".
4. List cautions, limitations, missing information, and human-review flags.
5. State whether causal language is justified given the design in "causalLanguageNote".

${RESULTS_INTERPRETATION_SCHEMA}

Return ONLY the JSON object.`;
}

/** System preamble for the interpretation call. */
export const RESULTS_INTERPRETATION_SYSTEM =
  "You are a rigorous medical biostatistician. You interpret results, never fabricate numbers, " +
  "always foreground effect size and confidence intervals over p-values, distinguish statistical " +
  "from clinical significance, and flag uncertainty and items needing human review. Output strict JSON only.";

/**
 * Lightweight, deterministic detector: does the supplied results text appear to
 * report effect sizes and confidence intervals? Used client-side to warn the
 * author before they spend an LLM call interpreting p-value-only results.
 */
export function scanResultsForUncertainty(text: string): {
  hasEffectMeasure: boolean;
  hasConfidenceInterval: boolean;
  hasPValue: boolean;
  notes: string[];
} {
  const t = text || "";
  const hasEffectMeasure =
    /\b(RR|OR|HR|aHR|aOR|risk ratio|odds ratio|hazard ratio|mean difference|MD|SMD|coefficient|beta)\b/i.test(
      t,
    );
  const hasConfidenceInterval = /\b(\d{1,3}\s*%?\s*)?CI\b|confidence interval|\bto\b\s*[-+]?\d/i.test(t);
  const hasPValue = /\bp\s*[<=>]\s*\.?\d|\bp-?value/i.test(t);
  const notes: string[] = [];
  if (hasPValue && !hasConfidenceInterval)
    notes.push("p-values are present but no confidence intervals were detected — add CIs to convey precision.");
  if (!hasEffectMeasure)
    notes.push("No effect measure (RR/OR/HR/mean difference) detected — interpretation will be limited.");
  if (!t.trim()) notes.push("No results text supplied.");
  return { hasEffectMeasure, hasConfidenceInterval, hasPValue, notes };
}
