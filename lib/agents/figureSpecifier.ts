/**
 * figureSpecifier — given the shape of a result, recommend a figure type
 * and emit a Plotly chart spec the front-end can render or export as JSON.
 *
 * The spec is intentionally minimal: type, traces, layout. The user can
 * paste it into any Plotly renderer (Plotly Studio, plotly.js, Python
 * plotly.io.from_json) without modification.
 */

export type FigureKind =
  | "forest"
  | "kaplan_meier"
  | "bar_grouped"
  | "box_violin"
  | "scatter_fit"
  | "histogram"
  | "heatmap_corr"
  | "roc"
  | "calibration"
  | "flow_consort";

export type FigureSpec = {
  kind: FigureKind;
  title: string;
  rationale: string;
  reportingNotes: string[];
  plotly: {
    data: Array<Record<string, unknown>>;
    layout: Record<string, unknown>;
  };
};

export function specifyForest(args: {
  rows: Array<{ label: string; effect: number; lower: number; upper: number; weight?: number }>;
  effectLabel?: string;
  refLine?: number;
  logScale?: boolean;
}): FigureSpec {
  const labels = args.rows.map((r) => r.label);
  const eff = args.rows.map((r) => r.effect);
  const errMinus = args.rows.map((r) => r.effect - r.lower);
  const errPlus = args.rows.map((r) => r.upper - r.effect);
  const weights = args.rows.map((r) => r.weight ?? 8);
  return {
    kind: "forest",
    title: "Forest plot",
    rationale: "Visualizes point estimates with 95% CIs across studies/subgroups; reference line marks the null effect.",
    reportingNotes: [
      "Report effect measure clearly (RR, OR, HR, mean difference).",
      "Show heterogeneity statistic (I², τ²) below the plot.",
      "Indicate fixed vs random-effects model in the caption.",
    ],
    plotly: {
      data: [
        {
          type: "scatter",
          mode: "markers",
          x: eff,
          y: labels,
          error_x: {
            type: "data",
            symmetric: false,
            array: errPlus,
            arrayminus: errMinus,
            thickness: 1.5,
          },
          marker: { size: weights, color: "#1f6feb" },
          name: args.effectLabel || "Effect (95% CI)",
        },
      ],
      layout: {
        title: "Forest plot",
        xaxis: {
          title: args.effectLabel || "Effect estimate (95% CI)",
          type: args.logScale ? "log" : "linear",
          zeroline: false,
        },
        yaxis: { autorange: "reversed" },
        shapes: [
          {
            type: "line",
            x0: args.refLine ?? 1,
            x1: args.refLine ?? 1,
            yref: "paper",
            y0: 0,
            y1: 1,
            line: { dash: "dot", color: "#888" },
          },
        ],
        margin: { l: 160, r: 30, t: 50, b: 50 },
      },
    },
  };
}

export function specifyBarGrouped(args: {
  groups: string[]; // x-axis categories
  series: Array<{ name: string; values: number[]; errors?: number[] }>;
  yLabel?: string;
}): FigureSpec {
  return {
    kind: "bar_grouped",
    title: "Grouped bar chart",
    rationale: "Compares a metric across groups for two or more series side-by-side.",
    reportingNotes: [
      "Use SD/SEM/CI bars consistently and state which in the caption.",
      "Order categories meaningfully (e.g., by sample size or by effect).",
    ],
    plotly: {
      data: args.series.map((s) => ({
        type: "bar",
        name: s.name,
        x: args.groups,
        y: s.values,
        error_y: s.errors ? { type: "data", array: s.errors } : undefined,
      })),
      layout: {
        barmode: "group",
        yaxis: { title: args.yLabel || "Value" },
        margin: { l: 60, r: 30, t: 50, b: 60 },
      },
    },
  };
}

export function specifyBoxViolin(args: {
  groups: Array<{ name: string; values: number[] }>;
  yLabel?: string;
  asViolin?: boolean;
}): FigureSpec {
  return {
    kind: "box_violin",
    title: args.asViolin ? "Violin plot" : "Box plot",
    rationale: "Shows distribution shape, median, IQR, and outliers across groups.",
    reportingNotes: [
      "Overlay individual points when n is small (<50/group).",
      "Box plots can hide bimodality — prefer violin if shape matters.",
    ],
    plotly: {
      data: args.groups.map((g) => ({
        type: args.asViolin ? "violin" : "box",
        y: g.values,
        name: g.name,
        boxpoints: "outliers",
        meanline: { visible: true },
      })),
      layout: {
        yaxis: { title: args.yLabel || "Value" },
        margin: { l: 60, r: 30, t: 50, b: 50 },
      },
    },
  };
}

export function specifyKaplanMeier(args: {
  groups: Array<{ name: string; time: number[]; survival: number[] }>;
  xLabel?: string;
}): FigureSpec {
  return {
    kind: "kaplan_meier",
    title: "Kaplan–Meier curves",
    rationale: "Cumulative survival probability over time, by group, with censoring respected.",
    reportingNotes: [
      "Always include a number-at-risk table beneath the curves.",
      "Report log-rank p, hazard ratio (95% CI), and median survival per group.",
      "Truncate the x-axis where at-risk drops below ~10% of starting cohort.",
    ],
    plotly: {
      data: args.groups.map((g) => ({
        type: "scatter",
        mode: "lines",
        x: g.time,
        y: g.survival,
        name: g.name,
        line: { shape: "hv" },
      })),
      layout: {
        xaxis: { title: args.xLabel || "Time" },
        yaxis: { title: "Survival probability", range: [0, 1] },
        margin: { l: 60, r: 30, t: 50, b: 50 },
      },
    },
  };
}

export function specifyROC(args: {
  curves: Array<{ name: string; fpr: number[]; tpr: number[]; auc?: number }>;
}): FigureSpec {
  return {
    kind: "roc",
    title: "ROC curves",
    rationale: "True positive vs false positive rate across thresholds; AUC summarizes overall discrimination.",
    reportingNotes: [
      "Report AUC with 95% CI (bootstrap).",
      "Show diagonal reference line for chance.",
      "Pair with a calibration plot — discrimination without calibration is incomplete.",
    ],
    plotly: {
      data: [
        ...args.curves.map((c) => ({
          type: "scatter",
          mode: "lines",
          x: c.fpr,
          y: c.tpr,
          name: c.auc != null ? `${c.name} (AUC=${c.auc.toFixed(3)})` : c.name,
        })),
        {
          type: "scatter",
          mode: "lines",
          x: [0, 1],
          y: [0, 1],
          line: { dash: "dot", color: "#888" },
          showlegend: false,
        },
      ],
      layout: {
        xaxis: { title: "False positive rate", range: [0, 1] },
        yaxis: { title: "True positive rate", range: [0, 1] },
        margin: { l: 60, r: 30, t: 50, b: 50 },
      },
    },
  };
}

/**
 * Recommend a figure kind from a free-text description of the result.
 * No LLM needed for the recommendation; uses keyword heuristics.
 */
export function recommendFigureKind(resultText: string): FigureKind {
  const t = resultText.toLowerCase();
  if (/survival|kaplan|hazard ratio|time-to-event/.test(t)) return "kaplan_meier";
  if (/meta-?analysis|pooled|effect size|forest/.test(t)) return "forest";
  if (/auc|roc|discrimination/.test(t)) return "roc";
  if (/calibration|brier/.test(t)) return "calibration";
  if (/consort|flow diagram|enrollment/.test(t)) return "flow_consort";
  if (/correlation matrix|heatmap/.test(t)) return "heatmap_corr";
  if (/distribution|spread|variance|iqr|median/.test(t)) return "box_violin";
  if (/scatter|regression line|correlation between/.test(t)) return "scatter_fit";
  if (/frequency|histogram/.test(t)) return "histogram";
  return "bar_grouped";
}
