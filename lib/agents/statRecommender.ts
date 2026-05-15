/**
 * statRecommender — given a study design + outcome shape, recommend
 * appropriate statistical tests with rationale, assumptions, robustness
 * checks, and reporting expectations.
 *
 * Pure data-driven rules first; LLM is only used to enrich rationale.
 * That keeps the recommendation legible and reproducible.
 */

import { callLLM, isLLMConfigured } from "@/lib/llm";

export type OutcomeShape =
  | "continuous"
  | "binary"
  | "count"
  | "time_to_event"
  | "ordinal"
  | "categorical_multi"
  | "rate"
  | "repeated_measures"
  | "paired_continuous"
  | "paired_binary";

export type GroupingShape =
  | "single_group"
  | "two_independent"
  | "k_independent"
  | "paired"
  | "matched"
  | "clustered"
  | "crossover";

export type StatRecommendation = {
  primaryTest: string;
  alternatives: string[];
  assumptions: string[];
  robustnessChecks: string[];
  effectSizeMeasures: string[];
  reportElements: string[];
  rationale: string;
  software: string[];
};

const RULES: Array<{
  match: (o: OutcomeShape, g: GroupingShape, opts: Options) => boolean;
  rec: StatRecommendation;
}> = [
  {
    match: (o, g) => o === "continuous" && g === "two_independent",
    rec: {
      primaryTest: "Independent-samples t-test (Welch's by default)",
      alternatives: ["Mann–Whitney U (non-parametric)", "Linear regression with group covariate"],
      assumptions: [
        "Independence of observations across groups",
        "Approximate normality of within-group residuals (relax via CLT if n>30/group)",
        "Welch's t-test does not assume equal variances",
      ],
      robustnessChecks: [
        "Inspect Q-Q plots or Shapiro–Wilk on each group",
        "Report results with and without outliers",
        "Sensitivity: bootstrap 95% CI of mean difference",
      ],
      effectSizeMeasures: ["Mean difference with 95% CI", "Hedges' g (small-sample corrected)"],
      reportElements: ["n per group", "mean (SD)", "mean difference (95% CI)", "t, df, p"],
      rationale:
        "Two unrelated groups with a continuous outcome → t-test family. Welch's is preferred over Student's because it is robust to unequal variances at no cost when variances are equal.",
      software: ["R: t.test()", "Python: scipy.stats.ttest_ind(..., equal_var=False)", "Stata: ttest"],
    },
  },
  {
    match: (o, g) => o === "continuous" && g === "paired",
    rec: {
      primaryTest: "Paired-samples t-test",
      alternatives: ["Wilcoxon signed-rank (non-parametric)", "Mixed-effects model with random intercept per subject"],
      assumptions: ["Pair differences are approximately normal", "Paired structure modeled correctly"],
      robustnessChecks: ["Inspect histogram of differences", "Bootstrap CI of mean difference"],
      effectSizeMeasures: ["Mean of differences (95% CI)", "Cohen's d_z"],
      reportElements: ["n pairs", "mean difference (SD)", "95% CI", "t, df, p"],
      rationale: "Pre/post or matched-pair continuous outcome → paired comparison on within-pair differences.",
      software: ["R: t.test(..., paired=TRUE)", "Python: scipy.stats.ttest_rel", "Stata: ttest pre==post"],
    },
  },
  {
    match: (o, g) => o === "binary" && g === "two_independent",
    rec: {
      primaryTest: "Chi-square test (or Fisher's exact when expected counts <5)",
      alternatives: ["Logistic regression (adjusts for covariates)", "Risk ratio / risk difference with 95% CI"],
      assumptions: ["Independence of observations", "Expected cell counts ≥5 for chi-square"],
      robustnessChecks: ["Switch to Fisher's exact if sparse", "Adjusted logistic regression as confirmatory"],
      effectSizeMeasures: ["Risk ratio (95% CI)", "Risk difference (95% CI)", "Odds ratio (95% CI)"],
      reportElements: ["Counts per cell", "RR/RD/OR with 95% CI", "p-value"],
      rationale: "Binary outcome, two groups → 2×2 contingency. Report RR or RD over OR when feasible (more interpretable).",
      software: ["R: chisq.test() / fisher.test() / epitools::riskratio", "Python: scipy.stats.chi2_contingency / fisher_exact", "Stata: cs / cc"],
    },
  },
  {
    match: (o, g) => o === "binary" && g === "paired",
    rec: {
      primaryTest: "McNemar's test",
      alternatives: ["Exact McNemar for small discordant counts", "Conditional logistic regression"],
      assumptions: ["Matched/paired binary outcomes (e.g., pre/post on same subjects)"],
      robustnessChecks: ["Exact version when discordant pairs <25"],
      effectSizeMeasures: ["Difference in proportions (95% CI)", "Odds ratio for discordant pairs"],
      reportElements: ["Concordant/discordant counts", "McNemar chi-square", "p", "OR (95% CI)"],
      rationale: "Paired binary outcomes — McNemar partitions information into the discordant pairs only.",
      software: ["R: mcnemar.test()", "Python: statsmodels.stats.contingency_tables.mcnemar", "Stata: mcc"],
    },
  },
  {
    match: (o, g) => o === "time_to_event",
    rec: {
      primaryTest: "Kaplan–Meier with log-rank test; Cox proportional hazards regression",
      alternatives: ["Restricted mean survival time (RMST)", "Flexible parametric (Royston–Parmar) when PH fails"],
      assumptions: ["Censoring is non-informative", "Proportional hazards for Cox (verify with Schoenfeld residuals)"],
      robustnessChecks: ["Test PH assumption; consider time-varying covariates if violated", "Sensitivity analysis: RMST (PH-free)"],
      effectSizeMeasures: ["Hazard ratio (95% CI)", "Restricted mean survival time difference (95% CI)", "Median survival"],
      reportElements: ["Number at risk over time", "KM curves", "Log-rank p", "HR (95% CI)", "PH-test result"],
      rationale: "Censored time-to-event outcome → survival analysis. Pair KM with Cox; check PH; consider RMST when PH likely violated.",
      software: ["R: survival::survfit / coxph; survRM2", "Python: lifelines.KaplanMeierFitter / CoxPHFitter", "Stata: stset / sts / stcox"],
    },
  },
  {
    match: (o, g) => o === "count",
    rec: {
      primaryTest: "Poisson regression (offset by exposure time when modeling rates)",
      alternatives: ["Negative binomial when overdispersed", "Zero-inflated NB for excess zeros"],
      assumptions: ["Mean = variance for Poisson (check overdispersion)", "Independence (or use cluster-robust SE)"],
      robustnessChecks: ["Compare AIC of Poisson vs NB", "Pearson dispersion >1.5 → switch to NB"],
      effectSizeMeasures: ["Incidence rate ratio (95% CI)"],
      reportElements: ["IRR (95% CI)", "Dispersion parameter", "Model fit (deviance/df, AIC)"],
      rationale: "Counts (events per unit) → Poisson family. Routinely check overdispersion and switch to NB if needed.",
      software: ["R: glm(family=poisson) / MASS::glm.nb", "Python: statsmodels.GLM(Poisson) / NegativeBinomial", "Stata: poisson / nbreg"],
    },
  },
  {
    match: (o, g) => o === "ordinal",
    rec: {
      primaryTest: "Proportional-odds logistic regression",
      alternatives: ["Mann–Whitney U (two groups, unadjusted)", "Generalized ordered logistic if PO fails"],
      assumptions: ["Proportional odds (test via Brant test)"],
      robustnessChecks: ["Brant test; if violated, partial PO model"],
      effectSizeMeasures: ["Cumulative OR (95% CI)"],
      reportElements: ["OR (95% CI) per predictor", "PO assumption test", "Pseudo R²"],
      rationale: "Ordered categorical outcome → exploit the ordering with proportional odds regression rather than collapsing to binary.",
      software: ["R: MASS::polr / ordinal::clm", "Python: statsmodels OrderedModel", "Stata: ologit"],
    },
  },
  {
    match: (o, g) => o === "repeated_measures" || g === "clustered",
    rec: {
      primaryTest: "Mixed-effects model (random intercept per cluster/subject)",
      alternatives: ["GEE with exchangeable working correlation (population-averaged)"],
      assumptions: ["Correctly specified random-effects structure", "Conditional residual normality (continuous outcome)"],
      robustnessChecks: ["Compare random-intercept vs random-slope by LRT/AIC", "Cluster-robust SE on GEE"],
      effectSizeMeasures: ["Fixed-effect coefficients (95% CI)", "ICC"],
      reportElements: ["Fixed effects (95% CI)", "Random-effects variance", "ICC", "Model comparison"],
      rationale: "Within-subject or within-cluster correlation must be modeled — ignoring it under-estimates SE.",
      software: ["R: lme4::lmer / glmer; geepack", "Python: statsmodels.MixedLM / GEE", "Stata: mixed / xtmixed / xtgee"],
    },
  },
];

type Options = {
  paired?: boolean;
  clustered?: boolean;
  sampleSize?: number;
};

export async function recommendStat(args: {
  outcome: OutcomeShape;
  grouping: GroupingShape;
  enrichWithLLM?: boolean;
  context?: string;
} & Options): Promise<StatRecommendation> {
  const rule = RULES.find((r) => r.match(args.outcome, args.grouping, args));
  const base: StatRecommendation = rule?.rec || {
    primaryTest: "Consult a statistician — outcome/grouping combination is not in the standard rule set.",
    alternatives: [],
    assumptions: [],
    robustnessChecks: [],
    effectSizeMeasures: [],
    reportElements: [],
    rationale: "No deterministic rule matched. Use the LLM enrichment or a statistician's review.",
    software: [],
  };
  if (!args.enrichWithLLM || !isLLMConfigured()) return base;
  try {
    const out = await callLLM({
      system:
        "You are a biostatistics consultant. Refine the rationale for a recommended statistical test. " +
        "Keep recommendations conservative, evidence-based, and aligned with EQUATOR/CONSORT/STROBE reporting expectations. " +
        "Return JSON only, matching the input shape.",
      prompt:
        `Outcome shape: ${args.outcome}\nGrouping: ${args.grouping}\nContext: ${args.context || "(none)"}\n` +
        `Baseline recommendation:\n${JSON.stringify(base, null, 2)}\n\n` +
        `Return the same JSON, possibly tightening rationale or adding 1-2 robustness checks specific to the context. Do not invent tests.`,
      jsonOnly: true,
      temperature: 0.1,
      maxTokens: 1200,
    });
    try {
      const parsed = JSON.parse(out) as StatRecommendation;
      return { ...base, ...parsed };
    } catch {
      return base;
    }
  } catch {
    return base;
  }
}
