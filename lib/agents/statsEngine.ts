/**
 * Tiny statistics engine — descriptive stats and a few classical tests.
 * Implemented from scratch to keep the project dependency-free.
 *
 * Approximations used (clearly noted next to each):
 *  - Normal CDF: Abramowitz & Stegun 26.2.17 (≤ 7.5e-8 absolute error)
 *  - log-Gamma: Lanczos approximation (~15 sig figs)
 *  - t CDF: regularized incomplete beta via continued fractions
 *  - chi-square CDF: regularized lower incomplete gamma via series/cf
 *
 * For frontline reporting, this is enough to label a Table 1 and
 * sanity-check a primary analysis. Confirmatory analyses should be
 * run in R/Stata/Python with proper packages.
 */

export type Descriptive = {
  n: number;
  mean: number;
  sd: number;
  median: number;
  q1: number;
  q3: number;
  min: number;
  max: number;
  se: number;
  ci95: [number, number];
};

const SQRT_2 = Math.SQRT2;
const SQRT_PI = Math.sqrt(Math.PI);

function mean(arr: number[]): number {
  if (arr.length === 0) return NaN;
  let s = 0;
  for (const v of arr) s += v;
  return s / arr.length;
}

function variance(arr: number[], sample = true): number {
  if (arr.length < (sample ? 2 : 1)) return NaN;
  const m = mean(arr);
  let s = 0;
  for (const v of arr) s += (v - m) ** 2;
  return s / (arr.length - (sample ? 1 : 0));
}

function quantile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return NaN;
  const idx = (sortedAsc.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sortedAsc[lo];
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (idx - lo);
}

export function descriptive(values: number[]): Descriptive {
  const clean = values.filter((v) => Number.isFinite(v));
  const sorted = [...clean].sort((a, b) => a - b);
  const n = clean.length;
  const m = mean(clean);
  const v = variance(clean);
  const sd = Math.sqrt(v);
  const se = sd / Math.sqrt(n);
  const tcrit = n >= 2 ? tInverse(0.975, n - 1) : NaN;
  return {
    n,
    mean: m,
    sd,
    median: quantile(sorted, 0.5),
    q1: quantile(sorted, 0.25),
    q3: quantile(sorted, 0.75),
    min: sorted[0] ?? NaN,
    max: sorted[sorted.length - 1] ?? NaN,
    se,
    ci95: [m - tcrit * se, m + tcrit * se],
  };
}

// --- Special functions ---------------------------------------------------

// Lanczos log-Gamma
const LANCZOS_G = 7;
const LANCZOS_P = [
  0.99999999999980993,
  676.5203681218851,
  -1259.1392167224028,
  771.32342877765313,
  -176.61502916214059,
  12.507343278686905,
  -0.13857109526572012,
  9.9843695780195716e-6,
  1.5056327351493116e-7,
];

function lgamma(z: number): number {
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  }
  z -= 1;
  let x = LANCZOS_P[0];
  for (let i = 1; i < LANCZOS_G + 2; i++) x += LANCZOS_P[i] / (z + i);
  const t = z + LANCZOS_G + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

// Regularized lower incomplete gamma P(a, x)
function gammaP(a: number, x: number): number {
  if (x < 0 || a <= 0) return NaN;
  if (x === 0) return 0;
  if (x < a + 1) {
    // series
    let term = 1 / a;
    let sum = term;
    for (let n = 1; n < 200; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-15) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
  } else {
    // continued fraction for Q, then 1 - Q
    let b = x + 1 - a;
    let c = 1 / 1e-30;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i < 200; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = b + an / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-15) break;
    }
    const q = h * Math.exp(-x + a * Math.log(x) - lgamma(a));
    return 1 - q;
  }
}

// Regularized incomplete beta I_x(a, b)
function betaI(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(x, a, b)) / a;
  }
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

function betacf(x: number, a: number, b: number): number {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-15) break;
  }
  return h;
}

// Two-sided p from |t| and df
function tTwoSidedP(t: number, df: number): number {
  const x = df / (df + t * t);
  return betaI(x, df / 2, 0.5);
}

function tInverse(p: number, df: number): number {
  // Newton's method on tCDF
  let x = standardNormalInverse(p); // start from normal approx
  for (let i = 0; i < 50; i++) {
    const cdf = tCDF(x, df);
    const pdf = tPDF(x, df);
    if (pdf < 1e-12) break;
    const dx = (cdf - p) / pdf;
    x -= dx;
    if (Math.abs(dx) < 1e-10) break;
  }
  return x;
}

function tCDF(x: number, df: number): number {
  const a = df / (df + x * x);
  const half = 0.5 * betaI(a, df / 2, 0.5);
  return x >= 0 ? 1 - half : half;
}

function tPDF(x: number, df: number): number {
  return (
    Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2)) /
    (Math.sqrt(df * Math.PI) * Math.pow(1 + (x * x) / df, (df + 1) / 2))
  );
}

function standardNormalInverse(p: number): number {
  // Acklam's approximation; abs error < 1.15e-9
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const plow = 0.02425;
  const phigh = 1 - plow;
  let q: number, r: number;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p <= phigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

// --- Tests ---------------------------------------------------------------

export type TwoSampleTestResult = {
  test: "welch_t" | "student_t" | "paired_t";
  n1: number;
  n2?: number;
  mean1: number;
  mean2?: number;
  meanDiff: number;
  diff95CI?: [number, number];
  t?: number;
  df?: number;
  pTwoSided?: number;
  hedgesG?: number;
  warning?: string;
};

export function welchTTest(a: number[], b: number[]): TwoSampleTestResult {
  const x = a.filter(Number.isFinite);
  const y = b.filter(Number.isFinite);
  const n1 = x.length;
  const n2 = y.length;
  const m1 = mean(x);
  const m2 = mean(y);
  const v1 = variance(x);
  const v2 = variance(y);
  const se = Math.sqrt(v1 / n1 + v2 / n2);
  if (n1 < 2 || n2 < 2 || !Number.isFinite(se) || se === 0) {
    return {
      test: "welch_t",
      n1, n2,
      mean1: m1, mean2: m2,
      meanDiff: m1 - m2,
      warning: "Too few observations or zero variance — statistic not computable",
    };
  }
  const t = (m1 - m2) / se;
  const dfNum = (v1 / n1 + v2 / n2) ** 2;
  const dfDen = (v1 ** 2) / (n1 * n1 * (n1 - 1)) + (v2 ** 2) / (n2 * n2 * (n2 - 1));
  const df = dfNum / dfDen;
  const p = tTwoSidedP(t, df);
  const tcrit = tInverse(0.975, df);
  const diff = m1 - m2;
  // Hedges' g (small-sample corrected Cohen's d)
  const pooledSd = Math.sqrt(((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2));
  const d = diff / pooledSd;
  const J = 1 - 3 / (4 * (n1 + n2) - 9);
  return {
    test: "welch_t",
    n1, n2,
    mean1: m1, mean2: m2,
    meanDiff: diff,
    diff95CI: [diff - tcrit * se, diff + tcrit * se],
    t, df, pTwoSided: p,
    hedgesG: d * J,
  };
}

export function pairedTTest(pre: number[], post: number[]): TwoSampleTestResult {
  const n = Math.min(pre.length, post.length);
  const diffs: number[] = [];
  for (let i = 0; i < n; i++) {
    if (Number.isFinite(pre[i]) && Number.isFinite(post[i])) {
      diffs.push(post[i] - pre[i]);
    }
  }
  const m = mean(diffs);
  const sd = Math.sqrt(variance(diffs));
  const se = sd / Math.sqrt(diffs.length);
  if (diffs.length < 2 || !Number.isFinite(se) || se === 0) {
    return {
      test: "paired_t",
      n1: diffs.length,
      mean1: m,
      meanDiff: m,
      warning: "Too few observations or zero variance — statistic not computable",
    };
  }
  const t = m / se;
  const df = diffs.length - 1;
  const tcrit = tInverse(0.975, df);
  return {
    test: "paired_t",
    n1: diffs.length,
    mean1: m,
    meanDiff: m,
    diff95CI: [m - tcrit * se, m + tcrit * se],
    t, df, pTwoSided: tTwoSidedP(t, df),
  };
}

export type ChiSquareResult = {
  test: "chi_square" | "fisher_exact";
  observed: number[][];
  expected?: number[][];
  chi2?: number;
  df?: number;
  p: number;
  oddsRatio?: number;
  riskRatio?: number | null;
  riskDifference?: number | null;
  ci95OR?: [number, number];
  ci95RR?: [number, number];
  ci95RD?: [number, number];
  warning?: string;
};

export function chiSquare(observed: number[][]): ChiSquareResult {
  const rows = observed.length;
  const cols = observed[0]?.length || 0;
  const rowSums = observed.map((r) => r.reduce((s, v) => s + v, 0));
  const colSums = Array.from({ length: cols }, (_, j) => observed.reduce((s, r) => s + r[j], 0));
  const total = rowSums.reduce((s, v) => s + v, 0);
  const expected: number[][] = [];
  let chi2 = 0;
  let lowExpected = false;
  for (let i = 0; i < rows; i++) {
    expected[i] = [];
    for (let j = 0; j < cols; j++) {
      const e = (rowSums[i] * colSums[j]) / total;
      expected[i][j] = e;
      if (e < 5) lowExpected = true;
      chi2 += ((observed[i][j] - e) ** 2) / e;
    }
  }
  const df = (rows - 1) * (cols - 1);
  const p = 1 - gammaP(df / 2, chi2 / 2);
  let or: number | undefined;
  let rr: number | null | undefined;
  let rd: number | null | undefined;
  let ci95OR: [number, number] | undefined;
  let ci95RR: [number, number] | undefined;
  let ci95RD: [number, number] | undefined;
  let zeroCellCorrected = false;
  if (rows === 2 && cols === 2) {
    const [a, b] = observed[0];
    const [c, d] = observed[1];
    const z = 1.959964;

    // Odds ratio with Haldane–Anscombe 0.5 continuity correction.
    const aa = a + 0.5, bb = b + 0.5, cc = c + 0.5, dd = d + 0.5;
    or = (aa * dd) / (bb * cc);
    const seLogOr = Math.sqrt(1 / aa + 1 / bb + 1 / cc + 1 / dd);
    const logOr = Math.log(or);
    ci95OR = [Math.exp(logOr - z * seLogOr), Math.exp(logOr + z * seLogOr)];

    // Risk ratio / risk difference: apply the same +0.5 correction whenever any
    // cell is zero so the estimates and their CIs are never non-finite.
    zeroCellCorrected = a === 0 || b === 0 || c === 0 || d === 0;
    const ca = zeroCellCorrected ? aa : a;
    const cb = zeroCellCorrected ? bb : b;
    const cc2 = zeroCellCorrected ? cc : c;
    const cd = zeroCellCorrected ? dd : d;
    const n1 = ca + cb;
    const n2 = cc2 + cd;
    const p1 = ca / n1;
    const p2 = cc2 / n2;

    const rrVal = p1 / p2;
    if (Number.isFinite(rrVal)) {
      rr = rrVal;
      // SE(ln RR) = sqrt(1/a − 1/(a+b) + 1/c − 1/(c+d)); CI = exp(lnRR ± z·SE).
      const seLogRr = Math.sqrt(1 / ca - 1 / n1 + 1 / cc2 - 1 / n2);
      const logRr = Math.log(rrVal);
      if (Number.isFinite(seLogRr) && Number.isFinite(logRr)) {
        ci95RR = [Math.exp(logRr - z * seLogRr), Math.exp(logRr + z * seLogRr)];
      }
    } else {
      rr = null;
    }

    const rdVal = p1 - p2;
    if (Number.isFinite(rdVal)) {
      rd = rdVal;
      // Wald SE = sqrt(p1(1−p1)/n1 + p2(1−p2)/n2); CI = rd ± z·SE.
      const seRd = Math.sqrt((p1 * (1 - p1)) / n1 + (p2 * (1 - p2)) / n2);
      if (Number.isFinite(seRd)) {
        ci95RD = [rdVal - z * seRd, rdVal + z * seRd];
      }
    } else {
      rd = null;
    }
  }
  const warnings: string[] = [];
  if (lowExpected) {
    warnings.push("Expected count < 5 in at least one cell — consider Fisher's exact.");
  }
  if (zeroCellCorrected) {
    warnings.push("Zero cell detected — +0.5 continuity correction applied to risk ratio / risk difference.");
  }
  return {
    test: "chi_square",
    observed,
    expected,
    chi2,
    df,
    p,
    oddsRatio: or,
    riskRatio: rr,
    riskDifference: rd,
    ci95OR,
    ci95RR,
    ci95RD,
    warning: warnings.length ? warnings.join(" ") : undefined,
  };
}

export type CorrelationResult = {
  method: "pearson" | "spearman";
  n: number;
  r: number;
  ci95: [number, number];
  pTwoSided: number;
};

export function pearsonCorrelation(x: number[], y: number[]): CorrelationResult {
  const n = Math.min(x.length, y.length);
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; }
  const mx = sx / n;
  const my = sy / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx;
    const b = y[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const r = num / Math.sqrt(dx * dy);
  // Fisher z transform for CI
  const z = 0.5 * Math.log((1 + r) / (1 - r));
  const sez = 1 / Math.sqrt(n - 3);
  const zCrit = 1.959964;
  const lo = Math.tanh(z - zCrit * sez);
  const hi = Math.tanh(z + zCrit * sez);
  // t-statistic for p-value
  const t = r * Math.sqrt((n - 2) / (1 - r * r));
  return {
    method: "pearson",
    n,
    r,
    ci95: [lo, hi],
    pTwoSided: tTwoSidedP(t, n - 2),
  };
}
