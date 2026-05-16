// Statistician copilot — assumption checks, code-snippet generation, and quick power calcs.
// Pure / deterministic: no network calls. Designed to be called from a small client widget.

export type CopilotInput = {
  // Either provide raw arrays for instant assumption checks…
  groupA?: number[];
  groupB?: number[];
  // …or describe the design + use the snippet generator.
  designKind?:
    | "twoSample"
    | "paired"
    | "anova"
    | "chiSquare"
    | "fisher"
    | "regression-linear"
    | "regression-logistic"
    | "survival-cox"
    | "correlation";
  outcomeName?: string;
  exposureName?: string;
  groupingName?: string;
  covariates?: string[];
};

export type AssumptionCheck = {
  ok: boolean;
  label: string;
  detail: string;
};

export function descriptive(arr: number[]): {
  n: number;
  mean: number;
  sd: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  missingPct: number;
} {
  const cleaned = arr.filter((v) => Number.isFinite(v));
  const missing = arr.length - cleaned.length;
  const n = cleaned.length;
  if (n === 0)
    return {
      n: 0,
      mean: NaN,
      sd: NaN,
      min: NaN,
      q1: NaN,
      median: NaN,
      q3: NaN,
      max: NaN,
      missingPct: arr.length === 0 ? 0 : 100,
    };
  const sorted = [...cleaned].sort((a, b) => a - b);
  const mean = cleaned.reduce((s, v) => s + v, 0) / n;
  const sd = Math.sqrt(
    cleaned.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(n - 1, 1),
  );
  const q = (p: number) => {
    if (n === 1) return sorted[0];
    const idx = (n - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  };
  return {
    n,
    mean,
    sd,
    min: sorted[0],
    q1: q(0.25),
    median: q(0.5),
    q3: q(0.75),
    max: sorted[n - 1],
    missingPct: arr.length === 0 ? 0 : (missing / arr.length) * 100,
  };
}

// Sample skewness and kurtosis for an approximate normality screen.
// Real Shapiro-Wilk needs special weights; we use D'Agostino's K² style screen.
export function normalityScreen(arr: number[]): AssumptionCheck {
  const x = arr.filter(Number.isFinite);
  const n = x.length;
  if (n < 8)
    return {
      ok: false,
      label: "Normality (D'Agostino K² screen)",
      detail: `Only ${n} observations — too few for a meaningful screen. Use a non-parametric test.`,
    };
  const mean = x.reduce((s, v) => s + v, 0) / n;
  const m2 = x.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const m3 = x.reduce((s, v) => s + (v - mean) ** 3, 0) / n;
  const m4 = x.reduce((s, v) => s + (v - mean) ** 4, 0) / n;
  const skew = m3 / Math.pow(m2, 1.5);
  const kurt = m4 / (m2 * m2) - 3; // excess
  const ok = Math.abs(skew) < 1 && Math.abs(kurt) < 2;
  return {
    ok,
    label: "Normality (D'Agostino-style screen)",
    detail: `skew=${skew.toFixed(2)}, excess kurtosis=${kurt.toFixed(2)}. ${
      ok
        ? "Plausibly normal at α≈0.05 — a t-test is reasonable."
        : "Distribution looks non-normal — prefer Mann–Whitney / Wilcoxon, or report median (IQR)."
    }`,
  };
}

// Levene's test (mean form) — unequal variance check.
export function leveneEqualVariance(a: number[], b: number[]): AssumptionCheck {
  const ax = a.filter(Number.isFinite);
  const bx = b.filter(Number.isFinite);
  if (ax.length < 2 || bx.length < 2)
    return {
      ok: false,
      label: "Equal variance (Levene)",
      detail: "Not enough observations in each group.",
    };
  const meanA = ax.reduce((s, v) => s + v, 0) / ax.length;
  const meanB = bx.reduce((s, v) => s + v, 0) / bx.length;
  const zA = ax.map((v) => Math.abs(v - meanA));
  const zB = bx.map((v) => Math.abs(v - meanB));
  const all = [...zA, ...zB];
  const meanZ = all.reduce((s, v) => s + v, 0) / all.length;
  const meanZA = zA.reduce((s, v) => s + v, 0) / zA.length;
  const meanZB = zB.reduce((s, v) => s + v, 0) / zB.length;
  const numer =
    ((all.length - 2) *
      (zA.length * (meanZA - meanZ) ** 2 + zB.length * (meanZB - meanZ) ** 2)) /
    1;
  const denom =
    zA.reduce((s, v) => s + (v - meanZA) ** 2, 0) +
    zB.reduce((s, v) => s + (v - meanZB) ** 2, 0);
  const W = denom === 0 ? Infinity : numer / denom;
  // crude critical at α=0.05 for df1=1: ~3.84
  const ok = W < 3.84;
  return {
    ok,
    label: "Equal variance (Levene mean form)",
    detail: `W ≈ ${isFinite(W) ? W.toFixed(2) : "∞"}. ${
      ok
        ? "Variances are similar — Student's t-test (pooled) is reasonable."
        : "Variances look unequal — use Welch's t (default in modern stats packages)."
    }`,
  };
}

export function missingDataCheck(values: (number | string | null | undefined)[]): AssumptionCheck {
  const total = values.length;
  const missing = values.filter(
    (v) => v == null || v === "" || (typeof v === "number" && !Number.isFinite(v)),
  ).length;
  const pct = total === 0 ? 0 : (missing / total) * 100;
  const ok = pct < 5;
  return {
    ok,
    label: "Missingness",
    detail: `${missing}/${total} (${pct.toFixed(1)}%) missing. ${
      pct < 5
        ? "Below 5% — complete-case analysis is usually defensible."
        : pct < 20
        ? "5–20% — consider multiple imputation or sensitivity analysis."
        : ">20% missing — strongly consider multiple imputation; complete-case analysis may be biased."
    }`,
  };
}

// Two-sample mean comparison — required N per group for given effect size (Cohen's d), α=0.05, power 0.80.
export function powerTwoSample(d: number, alpha = 0.05, power = 0.8): { perGroup: number; total: number; method: string } {
  // Lehr's approximation: n per group ≈ 16 / d^2 for α=0.05, power=0.80.
  // For other power/alpha, scale by zα/2 + zβ.
  const zAlpha = inverseNormal(1 - alpha / 2);
  const zBeta = inverseNormal(power);
  const k = (zAlpha + zBeta) ** 2;
  const perGroup = Math.max(2, Math.ceil((2 * k) / Math.max(d * d, 1e-6)));
  return {
    perGroup,
    total: perGroup * 2,
    method: `Two-sample t-test, two-sided α=${alpha}, power=${power}, Cohen's d=${d}`,
  };
}

// Proportions — required N per group.
export function powerTwoProportions(p1: number, p2: number, alpha = 0.05, power = 0.8): { perGroup: number; total: number; method: string } {
  const zAlpha = inverseNormal(1 - alpha / 2);
  const zBeta = inverseNormal(power);
  const pBar = (p1 + p2) / 2;
  const num =
    (zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) +
      zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2;
  const denom = Math.max((p1 - p2) ** 2, 1e-9);
  const perGroup = Math.max(2, Math.ceil(num / denom));
  return {
    perGroup,
    total: perGroup * 2,
    method: `Two-proportion z-test, α=${alpha}, power=${power}, p1=${p1}, p2=${p2}`,
  };
}

// Acklam's algorithm for inverse normal CDF (good enough for sample-size sanity).
function inverseNormal(p: number): number {
  if (p <= 0 || p >= 1) return p <= 0 ? -Infinity : Infinity;
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q: number;
  let r: number;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p > pHigh) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  q = p - 0.5;
  r = q * q;
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}

export type Snippet = { language: "R" | "Python" | "Stata"; code: string };

export function generateSnippets(input: CopilotInput): Snippet[] {
  const out = input.outcomeName || "y";
  const exp = input.exposureName || input.groupingName || "x";
  const cov = (input.covariates || []).filter(Boolean).join(" + ");
  const covPy = (input.covariates || []).filter(Boolean).join(" + ");
  switch (input.designKind) {
    case "twoSample":
      return [
        {
          language: "R",
          code: `# Welch's t-test (default in R)
t.test(${out} ~ ${exp}, data = df, var.equal = FALSE)
# Non-parametric alternative:
wilcox.test(${out} ~ ${exp}, data = df)`,
        },
        {
          language: "Python",
          code: `import scipy.stats as st
g = df.groupby('${exp}')['${out}']
a, b = g.get_group(0), g.get_group(1)
print(st.ttest_ind(a, b, equal_var=False))   # Welch
print(st.mannwhitneyu(a, b))                  # non-parametric`,
        },
        {
          language: "Stata",
          code: `ttest ${out}, by(${exp}) unequal
ranksum ${out}, by(${exp})`,
        },
      ];
    case "paired":
      return [
        { language: "R", code: `t.test(df$${out}_post, df$${out}_pre, paired = TRUE)\nwilcox.test(df$${out}_post, df$${out}_pre, paired = TRUE)` },
        { language: "Python", code: `import scipy.stats as st\nst.ttest_rel(df['${out}_post'], df['${out}_pre'])\nst.wilcoxon(df['${out}_post'], df['${out}_pre'])` },
        { language: "Stata", code: `ttest ${out}_post == ${out}_pre\nsignrank ${out}_post = ${out}_pre` },
      ];
    case "anova":
      return [
        { language: "R", code: `m <- aov(${out} ~ ${exp}${cov ? " + " + cov : ""}, data = df)\nsummary(m)\nTukeyHSD(m)` },
        { language: "Python", code: `import statsmodels.formula.api as smf\nmodel = smf.ols('${out} ~ C(${exp})${covPy ? " + " + covPy : ""}', data=df).fit()\nimport statsmodels.api as sm\nprint(sm.stats.anova_lm(model, typ=2))` },
        { language: "Stata", code: `oneway ${out} ${exp}, tabulate\nanova ${out} ${exp}${cov ? " " + cov : ""}` },
      ];
    case "chiSquare":
      return [
        { language: "R", code: `tab <- table(df$${exp}, df$${out})\nchisq.test(tab)\nfisher.test(tab)  # for small expected counts` },
        { language: "Python", code: `import scipy.stats as st\nimport pandas as pd\ntab = pd.crosstab(df['${exp}'], df['${out}'])\nprint(st.chi2_contingency(tab))` },
        { language: "Stata", code: `tabulate ${exp} ${out}, chi2 exact` },
      ];
    case "fisher":
      return [
        { language: "R", code: `fisher.test(table(df$${exp}, df$${out}))` },
        { language: "Python", code: `import scipy.stats as st\nst.fisher_exact([[a,b],[c,d]])` },
        { language: "Stata", code: `tabulate ${exp} ${out}, exact` },
      ];
    case "correlation":
      return [
        { language: "R", code: `cor.test(df$${out}, df$${exp}, method = "pearson")\ncor.test(df$${out}, df$${exp}, method = "spearman")` },
        { language: "Python", code: `import scipy.stats as st\nst.pearsonr(df['${out}'], df['${exp}'])\nst.spearmanr(df['${out}'], df['${exp}'])` },
        { language: "Stata", code: `pwcorr ${out} ${exp}, sig\nspearman ${out} ${exp}` },
      ];
    case "regression-linear":
      return [
        { language: "R", code: `m <- lm(${out} ~ ${exp}${cov ? " + " + cov : ""}, data = df)\nsummary(m)\nconfint(m)\nplot(m)  # diagnostics` },
        { language: "Python", code: `import statsmodels.formula.api as smf\nmodel = smf.ols('${out} ~ ${exp}${covPy ? " + " + covPy : ""}', data=df).fit()\nprint(model.summary())\nprint(model.conf_int())` },
        { language: "Stata", code: `regress ${out} ${exp}${cov ? " " + cov : ""}\nestat hettest\nestat imtest` },
      ];
    case "regression-logistic":
      return [
        { language: "R", code: `m <- glm(${out} ~ ${exp}${cov ? " + " + cov : ""}, data = df, family = binomial)\nsummary(m)\nexp(cbind(OR = coef(m), confint(m)))` },
        { language: "Python", code: `import statsmodels.formula.api as smf\nimport numpy as np\nmodel = smf.logit('${out} ~ ${exp}${covPy ? " + " + covPy : ""}', data=df).fit()\nprint(model.summary())\nprint(np.exp(model.params))\nprint(np.exp(model.conf_int()))` },
        { language: "Stata", code: `logistic ${out} ${exp}${cov ? " " + cov : ""}\nestat gof, group(10)` },
      ];
    case "survival-cox":
      return [
        { language: "R", code: `library(survival)\nm <- coxph(Surv(time, event) ~ ${exp}${cov ? " + " + cov : ""}, data = df)\nsummary(m)\ncox.zph(m)  # PH assumption` },
        { language: "Python", code: `from lifelines import CoxPHFitter\ncph = CoxPHFitter()\ncph.fit(df[['time','event','${exp}']${covPy ? " + ['" + (input.covariates || []).join("','") + "']" : ""}], 'time', event_col='event')\ncph.print_summary()\ncph.check_assumptions(df)` },
        { language: "Stata", code: `stset time, failure(event)\nstcox ${exp}${cov ? " " + cov : ""}\nestat phtest, detail` },
      ];
    default:
      return [];
  }
}
